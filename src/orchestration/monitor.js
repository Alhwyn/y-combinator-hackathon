import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';

/**
 * Monitor and manage agent health
 */

class AgentMonitor {
  constructor(intervalMs = 10000) {
    this.intervalMs = intervalMs;
    this.monitorInterval = null;
  }

  start() {
    logger.info('Starting agent monitor...');
    
    this.monitorInterval = setInterval(async () => {
      await this.checkStaleAgents();
      await this.logAgentStats();
    }, this.intervalMs);
  }

  async checkStaleAgents() {
    try {
      const { data, error } = await supabase.rpc('mark_stale_agents');
      
      if (error) {
        logger.error('Failed to mark stale agents', { error });
        return;
      }
      
      if (data > 0) {
        logger.warn(`Marked ${data} stale agents as offline`);
      }
    } catch (error) {
      logger.error('Error checking stale agents', { error });
    }
  }

  async logAgentStats() {
    try {
      // Get agent statistics
      const { data: agents, error } = await supabase
        .from('agents')
        .select('status, total_tests_run, successful_tests, failed_tests');
      
      if (error) {
        logger.error('Failed to fetch agent stats', { error });
        return;
      }
      
      const stats = {
        total: agents.length,
        idle: agents.filter(a => a.status === 'idle').length,
        busy: agents.filter(a => a.status === 'busy').length,
        unhealthy: agents.filter(a => a.status === 'unhealthy').length,
        offline: agents.filter(a => a.status === 'offline').length,
        totalTestsRun: agents.reduce((sum, a) => sum + a.total_tests_run, 0),
        successfulTests: agents.reduce((sum, a) => sum + a.successful_tests, 0),
        failedTests: agents.reduce((sum, a) => sum + a.failed_tests, 0),
      };
      
      logger.info('Agent Statistics', stats);
      
      // Get test queue stats
      const { data: testCases, error: testError } = await supabase
        .from('test_cases')
        .select('status');
      
      if (!testError && testCases) {
        const testStats = {
          pending: testCases.filter(t => t.status === 'pending').length,
          running: testCases.filter(t => t.status === 'running').length,
          completed: testCases.filter(t => t.status === 'completed').length,
          failed: testCases.filter(t => t.status === 'failed').length,
        };
        
        logger.info('Test Queue Statistics', testStats);
      }
    } catch (error) {
      logger.error('Error logging agent stats', { error });
    }
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      logger.info('Agent monitor stopped');
    }
  }
}

// Run monitor if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new AgentMonitor();
  
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, stopping monitor...');
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, stopping monitor...');
    monitor.stop();
    process.exit(0);
  });
  
  monitor.start();
}

export default AgentMonitor;

