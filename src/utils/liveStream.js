import WebSocket from 'ws';
import logger from '../lib/logger.js';
import config from '../config/index.js';

export class LiveStreamManager {
  constructor(agentId, agentName) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connected = false;
  }

  async connect() {
    const wsUrl = process.env.LIVE_STREAM_WS_URL || 
                  `ws://localhost:${config.liveStream?.port || 3001}/agent`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        logger.info(`📡 Live stream connected: ${this.agentName}`);
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Register agent
        this.ws.send(JSON.stringify({
          type: 'register',
          agentId: this.agentId,
          agentName: this.agentName,
        }));
      });
      
      this.ws.on('error', (error) => {
        // Only log if we haven't tried to connect yet
        if (this.reconnectAttempts === 0) {
          logger.warn('Live stream connection error (will continue without streaming)', { 
            error: error.message 
          });
        }
      });
      
      this.ws.on('close', () => {
        this.connected = false;
        logger.debug('Live stream disconnected');
        this.attemptReconnect();
      });
      
    } catch (error) {
      logger.debug('Failed to connect live stream (optional feature)', { 
        error: error.message 
      });
    }
  }

  async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      logger.debug(`Reconnecting live stream in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => this.connect(), delay);
    }
  }

  async sendFrame(frameData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'frame',
          ...frameData,
        }));
      } catch (error) {
        logger.debug('Failed to send frame', { error: error.message });
      }
    }
  }

  async sendEvent(eventData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(eventData));
      } catch (error) {
        logger.debug('Failed to send event', { error: error.message });
      }
    }
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

