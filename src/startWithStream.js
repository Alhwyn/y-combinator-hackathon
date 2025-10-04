import VideoStreamServer from './server/videoStream.js';
import main from './index.js';
import logger from './lib/logger.js';

/**
 * Start both the video stream server and the agents
 * This is useful for Railway deployment where everything runs in one service
 */

async function startAll() {
  logger.info('🚀 Starting Multi-Agent System with Video Streaming...');
  
  // Start video stream server first
  const streamServer = new VideoStreamServer();
  streamServer.start();
  
  // Give the stream server a moment to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start the agent system
  logger.info('Starting agent orchestration...');
  await main();
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

// Start everything
startAll().catch((error) => {
  logger.error('Failed to start system', { error });
  process.exit(1);
});

export default startAll;

