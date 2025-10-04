import { chromium, firefox, webkit } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';
import config from '../config/index.js';
import ActionHandler from './actions.js';
import { uploadScreenshot } from '../utils/storage.js';
import { LiveStreamManager } from '../utils/liveStream.js';
import { AIAgent } from './aiWorker.js';

/**
 * Playwright Agent Worker
 * Polls for pending tests, executes them, and reports results
 */

class Agent {
  constructor(id = null) {
    this.id = id || uuidv4();
    this.name = `agent-${this.id.substring(0, 8)}`;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentTestId = null;
    this.heartbeatInterval = null;
    this.liveCaptureInterval = null;
    this.liveStream = null;
    this.isRunning = false;
    this.aiMode = config.agent.aiMode; // AI autonomous testing mode
  }

  async initialize() {
    const mode = this.aiMode ? '🤖 AI AGENT MODE' : 'standard mode';
    logger.info(`Initializing agent: ${this.name} (${mode})`);
    
    // Register agent in database
    const { error } = await supabase
      .from('agents')
      .insert({
        id: this.id,
        name: this.name,
        status: 'idle',
        browser_type: config.browser.type,
        metadata: {
          pid: process.pid,
          nodeVersion: process.version,
          liveStreamEnabled: config.liveStream?.enabled || false,
          aiMode: this.aiMode, // Mark agent as AI-powered
        },
      });
    
    if (error && error.code !== '23505') { // Ignore duplicate key error
      logger.error('Failed to register agent', { error });
      throw error;
    }
    
    // Initialize live stream BEFORE launching browser
    if (config.liveStream?.enabled) {
      this.liveStream = new LiveStreamManager(this.id, this.name);
      await this.liveStream.connect();
      
      if (this.liveStream.connected) {
        logger.info(`📡 Live streaming enabled for ${this.name}`);
      }
    }
    
    // Launch browser (this will start live capture if liveStream is ready)
    await this.launchBrowser();
    
    // Start heartbeat
    this.startHeartbeat();
    
    if (this.aiMode) {
      logger.info(`🤖 Agent ${this.name} initialized successfully in AI AUTONOMOUS MODE - will take screenshots and use Claude vision for testing`);
    } else {
      logger.info(`Agent ${this.name} initialized successfully`);
    }
  }

  async launchBrowser() {
    const browserType = config.browser.type;
    const browsers = { chromium, firefox, webkit };
    
    this.browser = await browsers[browserType].launch({
      headless: config.agent.headless,
    });
    
    this.context = await this.browser.newContext({
      viewport: config.browser.viewport,
      ignoreHTTPSErrors: true,
    });
    
    this.page = await this.context.newPage();
    
    // Navigate to a blank page so screenshots work
    await this.page.goto('about:blank');
    
    // Start live screenshot capture if enabled
    if (config.liveStream?.enabled && this.liveStream) {
      this.startLiveCapture();
    }
    
    logger.info(`Browser launched: ${browserType}`);
  }

  startLiveCapture() {
    const fps = config.liveStream.fps;
    const interval = 1000 / fps; // Convert FPS to milliseconds
    
    logger.info(`📹 Starting live capture at ${fps} FPS (every ${interval}ms)`);
    
    this.liveCaptureInterval = setInterval(async () => {
      try {
        // Send frames even when idle (removed currentTestId check)
        if (this.page && this.liveStream?.connected) {
          const screenshot = await this.page.screenshot({
            type: 'jpeg',
            quality: config.liveStream.quality,
          });
          
          await this.liveStream.sendFrame({
            agentId: this.id,
            agentName: this.name,
            testId: this.currentTestId || 'idle',
            timestamp: Date.now(),
            frame: screenshot.toString('base64'),
          });
        }
      } catch (error) {
        // Log first error only to avoid spam
        if (!this.captureErrorLogged) {
          logger.warn('Live capture error (will retry):', { error: error.message });
          this.captureErrorLogged = true;
        }
      }
    }, interval);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await supabase
          .from('agents')
          .update({ last_heartbeat: new Date().toISOString() })
          .eq('id', this.id);
      } catch (error) {
        logger.error('Heartbeat failed', { error });
      }
    }, config.agent.heartbeatInterval);
  }

  async start() {
    this.isRunning = true;
    logger.info(`Agent ${this.name} started, polling for tests...`);
    
    while (this.isRunning) {
      try {
        // Claim a test
        const { data: testId, error } = await supabase
          .rpc('claim_test', { agent_uuid: this.id });
        
        if (error) {
          logger.error('Failed to claim test', { error });
          await this.sleep(5000);
          continue;
        }
        
        if (!testId) {
          // No tests available, wait and retry
          await this.sleep(2000);
          continue;
        }
        
        // Execute the test
        await this.executeTest(testId);
        
      } catch (error) {
        logger.error('Error in agent loop', { error });
        await this.sleep(5000);
      }
    }
  }

  async executeTest(testId) {
    this.currentTestId = testId;
    logger.info(`Executing test: ${testId}`);
    
    // Notify live stream that test started
    if (this.liveStream?.connected) {
      await this.liveStream.sendEvent({
        type: 'test_started',
        agentId: this.id,
        agentName: this.name,
        testId: testId,
        timestamp: Date.now(),
      });
    }
    
    const startTime = Date.now();
    let testResultId = null;
    
    try {
      // Fetch test case details
      const { data: testCase, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testId)
        .single();
      
      if (fetchError) throw fetchError;
      
      logger.info(`Test case: ${testCase.name}`, { url: testCase.url });
      
      // Create test result record
      const { data: testResult, error: resultError } = await supabase
        .from('test_results')
        .insert({
          test_case_id: testId,
          agent_id: this.id,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (resultError) throw resultError;
      testResultId = testResult.id;
      
      // Check if this is an AI-powered test or if agent is in AI mode
      const isAITest = this.aiMode || testCase.actions?.some(action => 
        action.type === 'ai_mode' || action.type === 'ai_autonomous'
      ) || testCase.metadata?.mode === 'ai_autonomous';
      
      if (isAITest) {
        // Use AI agent for autonomous execution
        logger.info(`🤖 Executing test in AI autonomous mode with screenshot analysis`);
        await this.executeAITest(testCase, testResultId);
        return;
      }
      
      // Execute actions
      const actionHandler = new ActionHandler(this.page);
      const screenshots = [];
      
      for (let i = 0; i < testCase.actions.length; i++) {
        const action = testCase.actions[i];
        const stepStartTime = Date.now();
        
        try {
          // Capture screenshot before action
          const screenshotBefore = await actionHandler.captureScreenshot(
            config.agent.screenshotQuality
          );
          const beforePath = `${testResultId}/step-${i}-before.jpg`;
          await uploadScreenshot(beforePath, screenshotBefore);
          
          // Create step record
          const { data: step, error: stepError } = await supabase
            .from('test_steps')
            .insert({
              test_result_id: testResultId,
              step_number: i + 1,
              action_type: action.type,
              action_data: action,
              status: 'running',
              screenshot_before: beforePath,
              started_at: new Date().toISOString(),
            })
            .select()
            .single();
          
          if (stepError) throw stepError;
          
          // Execute action
          const result = await actionHandler.execute(action);
          
          // Capture screenshot after action
          const screenshotAfter = await actionHandler.captureScreenshot(
            config.agent.screenshotQuality
          );
          const afterPath = `${testResultId}/step-${i}-after.jpg`;
          await uploadScreenshot(afterPath, screenshotAfter);
          
          screenshots.push({ before: beforePath, after: afterPath });
          
          // Update step as passed
          await supabase
            .from('test_steps')
            .update({
              status: 'passed',
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - stepStartTime,
              screenshot_after: afterPath,
              metadata: result,
            })
            .eq('id', step.id);
          
          logger.info(`Step ${i + 1} passed: ${action.type}`);
          
        } catch (stepError) {
          logger.error(`Step ${i + 1} failed`, { error: stepError });
          
          // Update step as failed
          await supabase
            .from('test_steps')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - stepStartTime,
              error_message: stepError.message,
            })
            .eq('test_result_id', testResultId)
            .eq('step_number', i + 1);
          
          throw stepError; // Propagate to fail the whole test
        }
      }
      
      // Test passed
      const duration = Date.now() - startTime;
      
      await supabase
        .from('test_results')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          screenshots: screenshots,
        })
        .eq('id', testResultId);
      
      // Release test
      await supabase.rpc('release_test', {
        agent_uuid: this.id,
        test_uuid: testId,
        new_status: 'completed',
      });
      
      logger.info(`✅ TEST COMPLETED SUCCESSFULLY: ${testId}`, { duration });
      console.log(`\n🎉 Agent ${this.name} finished test ${testId}`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`📸 Screenshots: ${screenshots.length} steps captured\n`);
      
      // Notify live stream that test completed
      if (this.liveStream?.connected) {
        await this.liveStream.sendEvent({
          type: 'test_completed',
          agentId: this.id,
          agentName: this.name,
          testId: testId,
          timestamp: Date.now(),
          status: 'completed',
          duration: duration,
          message: `✅ Test completed in ${(duration / 1000).toFixed(2)}s`,
        });
      }
      
    } catch (error) {
      logger.error(`❌ TEST FAILED: ${testId}`, { error });
      console.log(`\n❌ Agent ${this.name} test FAILED: ${testId}`);
      console.log(`💥 Error: ${error.message}\n`);
      
      const duration = Date.now() - startTime;
      
      // Update test result as failed
      if (testResultId) {
        await supabase
          .from('test_results')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            error_message: error.message,
            error_stack: error.stack,
          })
          .eq('id', testResultId);
      }
      
      // Check if we should retry
      const { data: testCase } = await supabase
        .from('test_cases')
        .select('retry_count, max_retries')
        .eq('id', testId)
        .single();
      
      if (testCase && testCase.retry_count < testCase.max_retries) {
        // Increment retry count and set back to pending
        await supabase
          .from('test_cases')
          .update({
            retry_count: testCase.retry_count + 1,
            status: 'pending',
            assigned_agent_id: null,
          })
          .eq('id', testId);
        
        logger.info(`Test will be retried: ${testId}`, {
          attempt: testCase.retry_count + 1,
          maxRetries: testCase.max_retries,
        });
      } else {
        // Max retries reached, mark as failed
        await supabase.rpc('release_test', {
          agent_uuid: this.id,
          test_uuid: testId,
          new_status: 'failed',
        });
      }
      
      // Mark agent as idle
      await supabase
        .from('agents')
        .update({
          status: 'idle',
          current_test_id: null,
        })
        .eq('id', this.id);
    } finally {
      this.currentTestId = null;
    }
  }

  async stop() {
    logger.info(`Stopping agent: ${this.name}`);
    this.isRunning = false;
    
    if (this.liveCaptureInterval) {
      clearInterval(this.liveCaptureInterval);
    }
    
    if (this.liveStream) {
      await this.liveStream.disconnect();
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    // Mark agent as offline
    await supabase
      .from('agents')
      .update({ status: 'offline' })
      .eq('id', this.id);
    
    logger.info(`Agent stopped: ${this.name}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeAITest(testCase, testResultId) {
    logger.info(`🤖 Starting AI-powered test execution for: ${testCase.name}`);
    
    const startTime = Date.now();
    
    try {
      // Get the AI instructions from the action
      const aiAction = testCase.actions.find(action => 
        action.type === 'ai_mode' || action.type === 'ai_autonomous'
      );
      const instructions = aiAction?.description || testCase.name;
      
      // Navigate to starting URL
      await this.page.goto(testCase.url);
      logger.info(`🌐 Navigated to: ${testCase.url}`);
      
      // Wait for page to load
      await this.page.waitForLoadState('domcontentloaded');
      await this.sleep(2000);
      
      // AI loop: screenshot → analyze → act → repeat
      let stepCount = 0;
      const maxSteps = testCase.metadata?.maxSteps || 50;
      let isComplete = false;
      let completionReason = '';
      let success = false;
      
      // Build AI system prompt
      const systemPrompt = `You are an autonomous QA testing agent. Your goal is to: ${instructions}

Website: ${testCase.url}

Your task is to:
1. Analyze screenshots of the web page
2. Decide what action to take next to accomplish the test goal
3. Return ONE action at a time in JSON format

Available actions:
- click: {"type": "click", "selector": "button.submit", "description": "Click submit button"}
- fill: {"type": "fill", "selector": "input#email", "value": "test@example.com", "description": "Fill email"}
- keyboard: {"type": "keyboard", "text": "HELLO", "description": "Type text"}
- keypress: {"type": "keyboard", "key": "Enter", "description": "Press Enter"}
- wait: {"type": "wait", "timeout": 2000, "description": "Wait 2 seconds"}
- scroll: {"type": "scroll", "description": "Scroll down"}
- complete: {"type": "complete", "reason": "Test goal achieved", "success": true}

Rules:
1. Always respond with ONLY valid JSON - no markdown, no explanations
2. Be specific with selectors (use IDs, classes, aria-labels, or unique attributes)
3. Add clear descriptions for each action
4. When the test goal is achieved, use {"type": "complete", "reason": "Goal achieved", "success": true}
5. If stuck or unable to continue, use {"type": "complete", "reason": "Unable to continue", "success": false}
6. Be patient - wait after actions that trigger page changes
7. Look carefully at the screenshots to understand the current state

Respond with JSON only, no other text or formatting.`;
      
      const conversationHistory = [{
        role: 'user',
        content: systemPrompt
      }];
      
      const actionHandler = new ActionHandler(this.page);
      
      while (!isComplete && stepCount < maxSteps) {
        stepCount++;
        logger.info(`🧠 AI Step ${stepCount}/${maxSteps}: Analyzing page...`);
        
        try {
          // Capture screenshot
          const screenshot = await this.page.screenshot({
            type: 'jpeg',
            quality: 80,
          });
          const screenshotBase64 = screenshot.toString('base64');
          
          // Upload screenshot
          const beforePath = `${testResultId}/ai-step-${stepCount}-before.jpg`;
          await uploadScreenshot(beforePath, screenshot);
          
          // Get page info
          const pageInfo = {
            url: this.page.url(),
            title: await this.page.title(),
          };
          
          // Ask AI for next action
          const userMessage = {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: screenshotBase64
                }
              },
              {
                type: 'text',
                text: `Current page:
URL: ${pageInfo.url}
Title: ${pageInfo.title}
Step: ${stepCount}/${maxSteps}

What should I do next? Respond with ONE JSON action only. No markdown, just pure JSON.`
              }
            ]
          };
          
          conversationHistory.push(userMessage);
          
          // Call Claude API
          const anthropic = await import('@anthropic-ai/sdk').then(m => m.default);
          const client = new anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          
          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: conversationHistory,
          });
          
          const aiResponse = response.content[0].text;
          logger.info(`🤖 AI Response: ${aiResponse.substring(0, 200)}...`);
          
          conversationHistory.push({
            role: 'assistant',
            content: aiResponse
          });
          
          // Parse action
          const action = this.parseAIAction(aiResponse);
          logger.info(`✅ Parsed action:`, action);
          
          // Create step record
          await supabase
            .from('test_steps')
            .insert({
              test_result_id: testResultId,
              step_number: stepCount,
              action_type: action.type,
              action_data: action,
              status: 'running',
              screenshot_before: beforePath,
              started_at: new Date().toISOString(),
            });
          
          // Check if complete
          if (action.type === 'complete') {
            isComplete = true;
            completionReason = action.reason || 'Test completed';
            success = action.success || false;
            logger.info(`✅ AI test ${success ? 'PASSED' : 'FAILED'}: ${completionReason}`);
            
            // Take final screenshot
            const finalScreenshot = await this.page.screenshot({
              type: 'jpeg',
              quality: 80,
            });
            const afterPath = `${testResultId}/ai-step-${stepCount}-after.jpg`;
            await uploadScreenshot(afterPath, finalScreenshot);
            
            await supabase
              .from('test_steps')
              .update({
                status: success ? 'passed' : 'failed',
                completed_at: new Date().toISOString(),
                screenshot_after: afterPath,
                metadata: action,
              })
              .eq('test_result_id', testResultId)
              .eq('step_number', stepCount);
            
            break;
          }
          
          // Execute action
          const result = await actionHandler.execute(action);
          
          // Wait a bit for page to update
          await this.sleep(1000);
          
          // Take after screenshot
          const afterScreenshot = await this.page.screenshot({
            type: 'jpeg',
            quality: 80,
          });
          const afterPath = `${testResultId}/ai-step-${stepCount}-after.jpg`;
          await uploadScreenshot(afterPath, afterScreenshot);
          
          // Update step as passed
          await supabase
            .from('test_steps')
            .update({
              status: 'passed',
              completed_at: new Date().toISOString(),
              screenshot_after: afterPath,
              metadata: result,
            })
            .eq('test_result_id', testResultId)
            .eq('step_number', stepCount);
          
          logger.info(`✅ Step ${stepCount} completed: ${action.type}`);
          
        } catch (stepError) {
          logger.error(`❌ AI Step ${stepCount} failed:`, stepError);
          
          await supabase
            .from('test_steps')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: stepError.message,
            })
            .eq('test_result_id', testResultId)
            .eq('step_number', stepCount);
          
          // Continue trying
          await this.sleep(2000);
        }
      }
      
      // Update test result
      const duration = Date.now() - startTime;
      const finalStatus = success ? 'completed' : 'failed';
      
      await supabase
        .from('test_results')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          metadata: {
            mode: 'ai_autonomous',
            totalSteps: stepCount,
            completionReason: completionReason || 'Max steps reached'
          }
        })
        .eq('id', testResultId);
      
      // Release test
      await supabase.rpc('release_test', {
        agent_uuid: this.id,
        test_uuid: testCase.id,
        new_status: finalStatus,
      });
      
      logger.info(`🎯 AI test ${finalStatus}: ${testCase.name}`, { 
        duration, 
        steps: stepCount,
        success 
      });
      
      // Console notification
      const statusEmoji = success ? '✅' : '❌';
      console.log(`\n${statusEmoji} AI AGENT ${this.name} FINISHED TEST`);
      console.log(`📋 Test: ${testCase.name}`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`🤖 AI Steps: ${stepCount}/${maxSteps}`);
      console.log(`📊 Result: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
      console.log(`💬 Reason: ${completionReason}\n`);
      
      // Notify live stream
      if (this.liveStream?.connected) {
        await this.liveStream.sendEvent({
          type: 'test_completed',
          agentId: this.id,
          agentName: this.name,
          testId: testCase.id,
          timestamp: Date.now(),
          status: finalStatus,
          duration: duration,
          steps: stepCount,
          success: success,
          message: `${statusEmoji} AI test ${finalStatus} in ${stepCount} steps`,
        });
      }
      
    } catch (error) {
      logger.error('AI test execution failed:', error);
      
      const duration = Date.now() - startTime;
      
      await supabase
        .from('test_results')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          error_message: error.message,
        })
        .eq('id', testResultId);
      
      await supabase.rpc('release_test', {
        agent_uuid: this.id,
        test_uuid: testCase.id,
        new_status: 'failed',
      });
      
      throw error;
    }
  }

  parseAIAction(text) {
    try {
      // Remove markdown code blocks if present
      let jsonStr = text.trim();
      
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }
      
      // Try to find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const action = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!action.type) {
        throw new Error('Action missing required field: type');
      }

      return action;

    } catch (error) {
      logger.error('Failed to parse AI action JSON', { text, error });
      throw new Error(`Invalid JSON response from AI: ${text.substring(0, 100)}`);
    }
  }
}

// Run agent if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new Agent();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await agent.stop();
    process.exit(0);
  });
  
  // Start agent
  agent.initialize()
    .then(() => agent.start())
    .catch((error) => {
      logger.error('Agent failed to start', { error });
      process.exit(1);
    });
}

export default Agent;

