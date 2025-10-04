import { chromium, firefox, webkit } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';
import config from '../config/index.js';
import ActionHandler from './actions.js';
import { uploadScreenshot } from '../utils/storage.js';
import { LiveStreamManager } from '../utils/liveStream.js';

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
  }

  async initialize() {
    logger.info(`Initializing agent: ${this.name}`);
    
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
        },
      });
    
    if (error && error.code !== '23505') { // Ignore duplicate key error
      logger.error('Failed to register agent', { error });
      throw error;
    }
    
    // Launch browser
    await this.launchBrowser();
    
    // Start live stream if enabled
    if (config.liveStream?.enabled) {
      this.liveStream = new LiveStreamManager(this.id, this.name);
      await this.liveStream.connect();
      
      if (this.liveStream.connected) {
        logger.info(`📡 Live streaming enabled for ${this.name}`);
      }
    }
    
    // Start heartbeat
    this.startHeartbeat();
    
    logger.info(`Agent ${this.name} initialized successfully`);
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
    
    // Start live screenshot capture if enabled
    if (config.liveStream?.enabled && this.liveStream) {
      this.startLiveCapture();
    }
    
    logger.info(`Browser launched: ${browserType}`);
  }

  startLiveCapture() {
    const fps = config.liveStream.fps;
    const interval = 1000 / fps; // Convert FPS to milliseconds
    
    this.liveCaptureInterval = setInterval(async () => {
      try {
        if (this.page && this.currentTestId) {
          const screenshot = await this.page.screenshot({
            type: 'jpeg',
            quality: config.liveStream.quality,
          });
          
          await this.liveStream.sendFrame({
            agentId: this.id,
            agentName: this.name,
            testId: this.currentTestId,
            timestamp: Date.now(),
            frame: screenshot.toString('base64'),
          });
        }
      } catch (error) {
        // Silently fail on screenshot errors (page might be loading)
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
      
      logger.info(`Test completed successfully: ${testId}`, { duration });
      
      // Notify live stream that test completed
      if (this.liveStream?.connected) {
        await this.liveStream.sendEvent({
          type: 'test_completed',
          agentId: this.id,
          agentName: this.name,
          testId: testId,
          timestamp: Date.now(),
          status: 'completed',
        });
      }
      
    } catch (error) {
      logger.error(`Test failed: ${testId}`, { error });
      
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

