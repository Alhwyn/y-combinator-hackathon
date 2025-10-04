import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../lib/logger.js';
import config from '../config/index.js';

/**
 * Agent Spawner
 * Spawns multiple agent processes in parallel
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AgentSpawner {
  constructor(count = config.agent.concurrentAgents) {
    this.count = count;
    this.agents = [];
  }

  spawn() {
    logger.info(`Spawning ${this.count} agents...`);
    
    for (let i = 0; i < this.count; i++) {
      const agentProcess = spawn('node', [
        join(__dirname, '../agent/worker.js')
      ], {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      agentProcess.on('exit', (code, signal) => {
        logger.warn(`Agent ${i + 1} exited`, { code, signal });
        
        // Remove from agents array
        this.agents = this.agents.filter(a => a !== agentProcess);
        
        // Optionally respawn if exit was unexpected
        if (code !== 0 && this.shouldRespawn) {
          logger.info(`Respawning agent ${i + 1}...`);
          setTimeout(() => this.spawnSingleAgent(i), 5000);
        }
      });
      
      agentProcess.on('error', (error) => {
        logger.error(`Agent ${i + 1} error`, { error });
      });
      
      this.agents.push(agentProcess);
      logger.info(`Agent ${i + 1} spawned (PID: ${agentProcess.pid})`);
    }
    
    logger.info(`All ${this.count} agents spawned successfully`);
  }

  spawnSingleAgent(index) {
    const agentProcess = spawn('node', [
      join(__dirname, '../agent/worker.js')
    ], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    agentProcess.on('exit', (code, signal) => {
      logger.warn(`Agent ${index + 1} exited`, { code, signal });
      this.agents = this.agents.filter(a => a !== agentProcess);
    });
    
    agentProcess.on('error', (error) => {
      logger.error(`Agent ${index + 1} error`, { error });
    });
    
    this.agents.push(agentProcess);
    logger.info(`Agent ${index + 1} respawned (PID: ${agentProcess.pid})`);
  }

  async stop() {
    logger.info('Stopping all agents...');
    
    for (const agent of this.agents) {
      agent.kill('SIGTERM');
    }
    
    // Wait for all agents to exit
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.agents.length === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    
    logger.info('All agents stopped');
  }

  enableRespawn() {
    this.shouldRespawn = true;
  }

  disableRespawn() {
    this.shouldRespawn = false;
  }
}

// Run spawner if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const spawner = new AgentSpawner();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down spawner...');
    spawner.disableRespawn();
    await spawner.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down spawner...');
    spawner.disableRespawn();
    await spawner.stop();
    process.exit(0);
  });
  
  // Enable auto-respawn
  spawner.enableRespawn();
  
  // Spawn agents
  spawner.spawn();
}

export default AgentSpawner;

