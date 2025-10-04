import Anthropic from '@anthropic-ai/sdk';
import logger from '../lib/logger.js';
import supabase from '../lib/supabase.js';
import { uploadScreenshot } from '../utils/storage.js';

/**
 * AI-Powered Agent Worker
 * Uses Claude's vision capabilities to intelligently perform QA testing
 * by analyzing screenshots and deciding what actions to take
 */

export class AIAgent {
  constructor(apiKey, testCaseId) {
    this.apiKey = apiKey;
    this.testCaseId = testCaseId;
    this.anthropic = new Anthropic({ apiKey });
    this.conversationHistory = [];
    this.testResultId = null;
    this.stepCount = 0;
    this.maxSteps = 50; // Prevent infinite loops
    this.isRunning = false;
  }

  /**
   * Start the AI agent test
   */
  async start() {
    this.isRunning = true;
    logger.info(`🤖 Starting AI agent for test case: ${this.testCaseId}`);

    try {
      // Fetch test case
      const { data: testCase, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', this.testCaseId)
        .single();

      if (fetchError) throw fetchError;

      // Create test result
      const { data: testResult, error: resultError } = await supabase
        .from('test_results')
        .insert({
          test_case_id: this.testCaseId,
          agent_id: 'ai-agent', // Special AI agent identifier
          status: 'running',
          started_at: new Date().toISOString(),
          metadata: { mode: 'ai_autonomous' }
        })
        .select()
        .single();

      if (resultError) throw resultError;
      this.testResultId = testResult.id;

      // Initialize conversation with test goal
      const systemPrompt = this.buildSystemPrompt(testCase);
      this.conversationHistory.push({
        role: 'assistant',
        content: systemPrompt
      });

      logger.info(`🎯 Test goal: ${testCase.name}`);
      logger.info(`🌐 Starting URL: ${testCase.url}`);

      return {
        success: true,
        testResultId: this.testResultId,
        message: 'AI agent started successfully'
      };

    } catch (error) {
      logger.error('Failed to start AI agent', { error });
      throw error;
    }
  }

  /**
   * Build the system prompt for the AI agent
   */
  buildSystemPrompt(testCase) {
    return `You are an autonomous QA testing agent. Your goal is to test: "${testCase.name}"

Website: ${testCase.url}
Test Description: ${testCase.actions?.[0]?.description || 'No description provided'}

Your task is to:
1. Analyze screenshots of the web page
2. Decide what action to take next to accomplish the test goal
3. Return ONE action at a time in JSON format

Available actions:
- navigate: {"type": "navigate", "url": "https://example.com"}
- click: {"type": "click", "selector": "button.submit", "description": "Click submit button"}
- fill: {"type": "fill", "selector": "input#email", "value": "test@example.com", "description": "Fill email"}
- keyboard: {"type": "keyboard", "text": "HELLO", "description": "Type text"}
- keypress: {"type": "keypress", "key": "Enter", "description": "Press Enter"}
- wait: {"type": "wait", "timeout": 2000, "description": "Wait for page load"}
- scroll: {"type": "scroll", "direction": "down", "description": "Scroll down"}
- assert: {"type": "assert", "selector": "div.success", "expected": "Success", "description": "Verify success message"}
- complete: {"type": "complete", "reason": "Test goal achieved", "success": true}

Rules:
1. Always respond with a SINGLE JSON action
2. Be specific with selectors (use IDs, classes, or unique attributes)
3. Add clear descriptions for each action
4. If you're stuck or can't proceed, use {"type": "complete", "reason": "Unable to continue", "success": false}
5. When the test goal is achieved, use {"type": "complete", "reason": "Goal achieved", "success": true}
6. Be patient - wait after actions that trigger page changes
7. Try different approaches if something doesn't work

Start by navigating to the URL, then analyze and proceed step by step.`;
  }

  /**
   * Process a screenshot and get next action from AI
   */
  async getNextAction(screenshotBase64, pageInfo = {}) {
    this.stepCount++;

    if (this.stepCount > this.maxSteps) {
      logger.warn(`⚠️ Max steps (${this.maxSteps}) reached`);
      return {
        type: 'complete',
        reason: 'Max steps reached',
        success: false
      };
    }

    try {
      logger.info(`🧠 Step ${this.stepCount}: Asking AI for next action...`);

      // Build the user message with screenshot
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
            text: `Current page info:
URL: ${pageInfo.url || 'Unknown'}
Title: ${pageInfo.title || 'Unknown'}
Step: ${this.stepCount}/${this.maxSteps}

What should I do next? Respond with ONE JSON action only.`
          }
        ]
      };

      this.conversationHistory.push(userMessage);

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: this.conversationHistory,
      });

      const aiResponse = response.content[0].text;
      logger.info(`🤖 AI Response: ${aiResponse}`);

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      // Parse JSON action
      const action = this.parseAction(aiResponse);
      logger.info(`✅ Parsed action:`, action);

      return action;

    } catch (error) {
      logger.error('Error getting next action from AI', { error });
      
      // Fallback to completion
      return {
        type: 'complete',
        reason: `AI error: ${error.message}`,
        success: false
      };
    }
  }

  /**
   * Parse JSON action from AI response
   */
  parseAction(text) {
    try {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       text.match(/```\s*([\s\S]*?)\s*```/) ||
                       text.match(/(\{[\s\S]*\})/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const action = JSON.parse(jsonStr);
        return action;
      }

      // If no JSON found, try parsing the whole text
      return JSON.parse(text);

    } catch (error) {
      logger.error('Failed to parse action JSON', { text, error });
      throw new Error(`Invalid JSON response from AI: ${text}`);
    }
  }

  /**
   * Record a step in the database
   */
  async recordStep(action, screenshot, result = null, error = null) {
    try {
      // Upload screenshot
      const screenshotPath = `${this.testResultId}/ai-step-${this.stepCount}.jpg`;
      await uploadScreenshot(screenshotPath, screenshot);

      // Create step record
      await supabase
        .from('test_steps')
        .insert({
          test_result_id: this.testResultId,
          step_number: this.stepCount,
          action_type: action.type,
          action_data: action,
          status: error ? 'failed' : 'passed',
          screenshot_after: screenshotPath,
          error_message: error?.message,
          metadata: result,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

      logger.info(`📝 Recorded step ${this.stepCount}`);

    } catch (err) {
      logger.error('Failed to record step', { err });
    }
  }

  /**
   * Complete the test
   */
  async complete(success, reason) {
    try {
      await supabase
        .from('test_results')
        .update({
          status: success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          metadata: {
            mode: 'ai_autonomous',
            totalSteps: this.stepCount,
            completionReason: reason
          }
        })
        .eq('id', this.testResultId);

      // Update test case status
      await supabase
        .from('test_cases')
        .update({
          status: success ? 'completed' : 'failed'
        })
        .eq('id', this.testCaseId);

      logger.info(`${success ? '✅' : '❌'} Test completed: ${reason}`);

    } catch (error) {
      logger.error('Failed to complete test', { error });
    }
  }

  /**
   * Stop the agent
   */
  stop() {
    this.isRunning = false;
    logger.info('🛑 AI agent stopped');
  }
}

export default AIAgent;

