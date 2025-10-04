import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../lib/logger.js';

/**
 * AI Agent API Server
 * Provides endpoints for browser-based AI agents to communicate with Claude
 */

const router = express.Router();

// In-memory storage for agent sessions
const agentSessions = new Map();

/**
 * POST /api/ai-agent/start
 * Initialize a new AI agent session
 */
router.post('/start', async (req, res) => {
  try {
    const { apiKey, testGoal, testUrl } = req.body;

    if (!apiKey || !testGoal || !testUrl) {
      return res.status(400).json({
        error: 'Missing required fields: apiKey, testGoal, testUrl'
      });
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const session = {
      id: sessionId,
      apiKey,
      testGoal,
      testUrl,
      conversationHistory: [],
      stepCount: 0,
      startedAt: new Date().toISOString()
    };

    // Build system prompt
    const systemPrompt = `You are an autonomous QA testing agent. Your goal is to test: "${testGoal}"

Website: ${testUrl}

Your task is to:
1. Analyze screenshots of the web page
2. Decide what action to take next to accomplish the test goal
3. Return ONE action at a time in JSON format

Available actions:
- click: {"type": "click", "selector": "button.submit", "description": "Click submit button"}
- type: {"type": "type", "selector": "input#email", "value": "test@example.com", "description": "Type email"}
- keyboard: {"type": "keyboard", "key": "Enter", "description": "Press Enter key"}
- wait: {"type": "wait", "ms": 2000, "description": "Wait 2 seconds"}
- scroll: {"type": "scroll", "direction": "down", "description": "Scroll down"}
- complete: {"type": "complete", "reason": "Test goal achieved", "success": true}

Rules:
1. Always respond with ONLY valid JSON - no markdown, no explanations
2. Be specific with CSS selectors (use IDs, classes, or unique attributes)
3. Add clear descriptions for each action
4. When goal is achieved, use complete action with success: true
5. If stuck or unable to continue, use complete action with success: false
6. Be patient - wait after actions that trigger page changes
7. Consider the context from previous steps

Respond with JSON only, no other text or formatting.`;

    session.conversationHistory.push({
      role: 'user',
      content: systemPrompt
    });

    agentSessions.set(sessionId, session);

    logger.info(`🤖 AI agent session started: ${sessionId}`);

    res.json({
      success: true,
      sessionId,
      message: 'AI agent session initialized'
    });

  } catch (error) {
    logger.error('Failed to start AI agent session', { error });
    res.status(500).json({
      error: 'Failed to start session',
      message: error.message
    });
  }
});

/**
 * POST /api/ai-agent/next-action
 * Get next action from AI based on screenshot
 */
router.post('/next-action', async (req, res) => {
  try {
    const { sessionId, screenshot, pageInfo } = req.body;

    if (!sessionId || !screenshot) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, screenshot'
      });
    }

    const session = agentSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    session.stepCount++;

    // Check max steps
    if (session.stepCount > 50) {
      return res.json({
        type: 'complete',
        reason: 'Max steps (50) reached',
        success: false
      });
    }

    logger.info(`🧠 Step ${session.stepCount}: Getting next action for session ${sessionId}`);

    // Build user message with screenshot
    const userMessage = {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: screenshot.replace(/^data:image\/jpeg;base64,/, '')
          }
        },
        {
          type: 'text',
          text: `Current page info:
URL: ${pageInfo?.url || 'Unknown'}
Title: ${pageInfo?.title || 'Unknown'}
Step: ${session.stepCount}/50

What should I do next? Respond with ONE JSON action only. No markdown, no code blocks, just pure JSON.`
        }
      ]
    };

    session.conversationHistory.push(userMessage);

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: session.apiKey });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: session.conversationHistory,
    });

    const aiResponse = response.content[0].text;
    logger.info(`🤖 AI Response (raw): ${aiResponse.substring(0, 200)}...`);

    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });

    // Parse JSON action
    const action = parseAction(aiResponse);
    logger.info(`✅ Parsed action:`, action);

    res.json(action);

  } catch (error) {
    logger.error('Failed to get next action', { error });
    res.status(500).json({
      type: 'complete',
      reason: `AI error: ${error.message}`,
      success: false
    });
  }
});

/**
 * POST /api/ai-agent/stop
 * Stop an AI agent session
 */
router.post('/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required field: sessionId'
      });
    }

    const session = agentSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    agentSessions.delete(sessionId);

    logger.info(`🛑 AI agent session stopped: ${sessionId}`);

    res.json({
      success: true,
      message: 'Session stopped',
      totalSteps: session.stepCount
    });

  } catch (error) {
    logger.error('Failed to stop AI agent session', { error });
    res.status(500).json({
      error: 'Failed to stop session',
      message: error.message
    });
  }
});

/**
 * Parse JSON action from AI response
 */
function parseAction(text) {
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
    logger.error('Failed to parse action JSON', { text, error });
    throw new Error(`Invalid JSON response from AI: ${text.substring(0, 100)}`);
  }
}

// Cleanup old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  for (const [sessionId, session] of agentSessions.entries()) {
    if (session.startedAt < oneHourAgo) {
      agentSessions.delete(sessionId);
      logger.info(`🧹 Cleaned up old session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

export default router;

