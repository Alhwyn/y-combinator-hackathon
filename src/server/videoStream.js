import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../lib/logger.js';
import config from '../config/index.js';
import aiAgentRouter from './aiAgentServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VideoStreamServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.agents = new Map(); // agentId -> { name, ws }
    this.viewers = new Set(); // Viewer connections
  }

  start() {
    try {
      // Parse JSON bodies
      this.app.use(express.json({ limit: '50mb' }));
      
      // Serve static dashboard
      this.app.use(express.static(join(__dirname, '../../frontend/public')));
      
      // AI Agent API routes
      this.app.use('/api/ai-agent', aiAgentRouter);
      
      // Health check endpoint with detailed info
      this.app.get('/health', (req, res) => {
        const healthData = {
          status: 'ok',
          agents: this.agents.size,
          viewers: this.viewers.size,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };
        logger.info('Health check', healthData);
        res.json(healthData);
      });
      
      // /agent endpoint info (it's a WebSocket endpoint, not HTTP)
      this.app.get('/agent', (req, res) => {
        res.json({
          status: 'ok',
          message: '/agent is a WebSocket endpoint. Please connect via WebSocket protocol.',
          endpoint: 'ws://' + req.headers.host + '/agent',
          usage: 'Use WebSocket connection to stream video from agents',
          connectedAgents: this.agents.size
        });
      });
      
      // API endpoints
      this.app.get('/api/agents', (req, res) => {
        try {
          const agentList = Array.from(this.agents.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            connected: true,
          }));
          logger.info(`API: Returning ${agentList.length} agents`);
          res.json(agentList);
        } catch (error) {
          logger.error('Error in /api/agents', { error: error.message, stack: error.stack });
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
      // WebSocket connections
      this.wss.on('connection', (ws, req) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const clientType = url.pathname === '/agent' ? 'agent' : 'viewer';
          
          logger.info(`New ${clientType} connection`, {
            pathname: url.pathname,
            host: req.headers.host,
            origin: req.headers.origin,
            userAgent: req.headers['user-agent']
          });
          
          if (clientType === 'agent') {
            this.handleAgentConnection(ws);
          } else {
            this.handleViewerConnection(ws);
          }
        } catch (error) {
          logger.error('Error handling WebSocket connection', {
            error: error.message,
            stack: error.stack,
            url: req.url
          });
          ws.close(1011, 'Internal server error');
        }
      });
      
      this.wss.on('error', (error) => {
        logger.error('WebSocket server error', {
          error: error.message,
          stack: error.stack
        });
      });
      
      // Start server
      // Railway provides PORT env var - use it first
      // For local development, use LIVE_STREAM_PORT or default to 3001
      const port = process.env.PORT || config.liveStream?.port || 3001;
      const host = process.env.PORT ? '0.0.0.0' : 'localhost';
      
      this.server.listen(port, host, () => {
        logger.info(`✅ Video stream server started`, {
          port: port,
          host: host,
          environment: process.env.NODE_ENV || 'development',
          railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || 'N/A'
        });
        
        if (process.env.RAILWAY_PUBLIC_DOMAIN) {
          logger.info(`📊 Dashboard: https://${process.env.RAILWAY_PUBLIC_DOMAIN}/dashboard`);
        } else {
          logger.info(`📊 Dashboard: http://localhost:${port}/dashboard`);
        }
      });
      
      this.server.on('error', (error) => {
        logger.error('Server error', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
      });
    } catch (error) {
      logger.error('Failed to start video stream server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  handleAgentConnection(ws) {
    let agentId = null;
    let agentName = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (!message.type) {
          logger.error('Agent message missing type', { message });
          return;
        }
        
        if (message.type === 'register') {
          if (!message.agentId || !message.agentName) {
            logger.error('Invalid register message', { message });
            return;
          }
          
          agentId = message.agentId;
          agentName = message.agentName;
          this.agents.set(agentId, { name: agentName, ws });
          
          logger.info(`🤖 Agent registered for streaming`, {
            agentId,
            agentName,
            totalAgents: this.agents.size
          });
          
          // Notify all viewers
          this.broadcastToViewers({
            type: 'agent_connected',
            agentId,
            agentName,
          });
        } else if (message.type === 'frame') {
          if (!message.agentId || !message.frame) {
            logger.error('Invalid frame message', {
              agentId: message.agentId,
              hasFrame: !!message.frame
            });
            return;
          }
          
          // Forward frame to all viewers
          this.broadcastToViewers(message);
        } else {
          // Forward other events (test_started, test_completed, etc.)
          logger.info(`Agent event: ${message.type}`, {
            agentId: message.agentId,
            type: message.type
          });
          this.broadcastToViewers(message);
        }
      } catch (error) {
        logger.error('Error handling agent message', {
          error: error.message,
          stack: error.stack,
          agentId,
          agentName
        });
      }
    });
    
    ws.on('close', (code, reason) => {
      if (agentId) {
        this.agents.delete(agentId);
        logger.info(`Agent disconnected from streaming`, {
          agentId,
          agentName,
          code,
          reason: reason.toString() || 'No reason',
          remainingAgents: this.agents.size
        });
        
        this.broadcastToViewers({
          type: 'agent_disconnected',
          agentId,
          agentName,
        });
      } else {
        logger.info('Unregistered agent disconnected');
      }
    });
    
    ws.on('error', (error) => {
      logger.error('Agent WebSocket error', {
        error: error.message,
        stack: error.stack,
        agentId,
        agentName
      });
    });
  }

  handleViewerConnection(ws) {
    try {
      this.viewers.add(ws);
      logger.info(`👀 Viewer connected`, {
        totalViewers: this.viewers.size,
        currentAgents: this.agents.size
      });
      
      // Send current agent list
      const agentList = Array.from(this.agents.entries()).map(([id, data]) => ({
        agentId: id,
        agentName: data.name,
      }));
      
      const initialMessage = {
        type: 'agent_list',
        agents: agentList,
      };
      
      logger.info(`Sending initial agent list to viewer`, {
        agentCount: agentList.length
      });
      
      ws.send(JSON.stringify(initialMessage));
      
      ws.on('close', (code, reason) => {
        this.viewers.delete(ws);
        logger.info(`Viewer disconnected`, {
          code,
          reason: reason.toString() || 'No reason',
          remainingViewers: this.viewers.size
        });
      });
      
      ws.on('error', (error) => {
        logger.error('Viewer WebSocket error', {
          error: error.message,
          stack: error.stack,
          viewerCount: this.viewers.size
        });
      });
    } catch (error) {
      logger.error('Error handling viewer connection', {
        error: error.message,
        stack: error.stack
      });
      try {
        ws.close(1011, 'Internal server error');
      } catch (closeError) {
        logger.error('Failed to close viewer connection', {
          error: closeError.message
        });
      }
    }
  }

  broadcastToViewers(message) {
    if (!message || !message.type) {
      logger.error('Invalid broadcast message', { message });
      return;
    }
    
    try {
      const data = JSON.stringify(message);
      let successCount = 0;
      let failCount = 0;
      
      this.viewers.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(data);
            successCount++;
          } catch (error) {
            failCount++;
            logger.error('Failed to send to viewer', {
              error: error.message,
              messageType: message.type
            });
          }
        }
      });
      
      // Log broadcast stats for frames every 50 frames to avoid spam
      if (message.type === 'frame') {
        if (!this.frameLogCounter) this.frameLogCounter = 0;
        this.frameLogCounter++;
        
        if (this.frameLogCounter % 50 === 0) {
          logger.info(`Broadcast stats`, {
            type: message.type,
            viewers: this.viewers.size,
            successCount,
            failCount
          });
        }
      } else {
        logger.info(`Broadcast to viewers`, {
          type: message.type,
          viewers: this.viewers.size,
          successCount,
          failCount
        });
      }
    } catch (error) {
      logger.error('Error broadcasting to viewers', {
        error: error.message,
        stack: error.stack,
        messageType: message.type
      });
    }
  }

  stop() {
    logger.info('Stopping video stream server...');
    this.wss.close();
    this.server.close();
    logger.info('Video stream server stopped');
  }
}

// Start server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new VideoStreamServer();
  server.start();
  
  process.on('SIGINT', () => {
    logger.info('Received SIGINT');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM');
    server.stop();
    process.exit(0);
  });
}

export default VideoStreamServer;

