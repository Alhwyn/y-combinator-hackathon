import AgentSpawner from './orchestration/spawner.js';
import AgentMonitor from './orchestration/monitor.js';
import logger from './lib/logger.js';
import config from './config/index.js';

/**
 * Main entry point for the Multi-Agent Browser Testing System
 */

async function main() {
  logger.info('Starting Multi-Agent Browser Testing System...');
  logger.info(`Configuration: ${config.agent.concurrentAgents} agents, ${config.browser.type} browser`);
  
  // Start the monitor
  const monitor = new AgentMonitor();
  monitor.start();
  
  // Create and spawn agents
  const spawner = new AgentSpawner(config.agent.concurrentAgents);
  spawner.enableRespawn();
  spawner.spawn();
  
  // Graceful shutdown handlers
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    
    spawner.disableRespawn();
    monitor.stop();
    await spawner.stop();
    
    logger.info('Shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  logger.info('System started successfully. Press Ctrl+C to stop.');
}

// Run main if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('System startup failed', { error });
    process.exit(1);
  });
}

export default main;

