import VideoStreamServer from './server/videoStream.js';
import logger from './lib/logger.js';

/**
 * Start ONLY the video stream server
 * This is useful for testing Railway deployment without agents
 */

async function startStreamServer() {
  logger.info('🚀 Starting Video Stream Server Only...');
  
  // Start video stream server
  const streamServer = new VideoStreamServer();
  streamServer.start();
  
  logger.info('Stream server started successfully. Agents must connect separately.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Start stream server only
startStreamServer().catch((error) => {
  logger.error('Failed to start stream server', { error });
  process.exit(1);
});

export default startStreamServer;

