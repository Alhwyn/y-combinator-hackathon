import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../lib/logger.js';
import config from '../config/index.js';

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
    // Serve static dashboard
    this.app.use(express.static(join(__dirname, '../../frontend/public')));
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', agents: this.agents.size, viewers: this.viewers.size });
    });
    
    // API endpoints
    this.app.get('/api/agents', (req, res) => {
      const agentList = Array.from(this.agents.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        connected: true,
      }));
      res.json(agentList);
    });
    
    // WebSocket connections
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const clientType = url.pathname === '/agent' ? 'agent' : 'viewer';
      
      logger.info(`New ${clientType} connection`);
      
      if (clientType === 'agent') {
        this.handleAgentConnection(ws);
      } else {
        this.handleViewerConnection(ws);
      }
    });
    
    // Start server
    const port = config.liveStream?.port || 3001;
    this.server.listen(port, () => {
      logger.info(`✅ Video stream server started on port ${port}`);
      logger.info(`📊 Dashboard: http://localhost:${port}/dashboard`);
    });
  }

  handleAgentConnection(ws) {
    let agentId = null;
    let agentName = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'register') {
          agentId = message.agentId;
          agentName = message.agentName;
          this.agents.set(agentId, { name: agentName, ws });
          logger.info(`🤖 Agent registered for streaming: ${agentName}`);
          
          // Notify all viewers
          this.broadcastToViewers({
            type: 'agent_connected',
            agentId,
            agentName,
          });
        } else if (message.type === 'frame') {
          // Forward frame to all viewers
          this.broadcastToViewers(message);
        } else {
          // Forward other events (test_started, test_completed, etc.)
          this.broadcastToViewers(message);
        }
      } catch (error) {
        logger.error('Error handling agent message', { error: error.message });
      }
    });
    
    ws.on('close', () => {
      if (agentId) {
        this.agents.delete(agentId);
        logger.info(`Agent disconnected from streaming: ${agentName}`);
        
        this.broadcastToViewers({
          type: 'agent_disconnected',
          agentId,
          agentName,
        });
      }
    });
    
    ws.on('error', (error) => {
      logger.error('Agent WebSocket error', { error: error.message });
    });
  }

  handleViewerConnection(ws) {
    this.viewers.add(ws);
    logger.info(`👀 Viewer connected (${this.viewers.size} total)`);
    
    // Send current agent list
    const agentList = Array.from(this.agents.entries()).map(([id, data]) => ({
      type: 'agent_connected',
      agentId: id,
      agentName: data.name,
    }));
    
    ws.send(JSON.stringify({
      type: 'agent_list',
      agents: agentList,
    }));
    
    ws.on('close', () => {
      this.viewers.delete(ws);
      logger.info(`Viewer disconnected (${this.viewers.size} remaining)`);
    });
    
    ws.on('error', (error) => {
      logger.error('Viewer WebSocket error', { error: error.message });
    });
  }

  broadcastToViewers(message) {
    const data = JSON.stringify(message);
    this.viewers.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(data);
        } catch (error) {
          logger.error('Failed to send to viewer', { error: error.message });
        }
      }
    });
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

