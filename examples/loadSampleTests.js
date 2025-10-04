import { createTestCase } from '../src/utils/testHelpers.js';
import { sampleTests } from './sampleTests.js';
import logger from '../src/lib/logger.js';

/**
 * Load sample tests into the database
 */

async function loadSampleTests() {
  logger.info('Loading sample tests...');
  
  try {
    for (const test of sampleTests) {
      await createTestCase(test);
      logger.info(`✅ Loaded: ${test.name}`);
    }
    
    logger.info(`Successfully loaded ${sampleTests.length} sample tests`);
  } catch (error) {
    logger.error('Failed to load sample tests', { error });
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadSampleTests()
    .then(() => {
      logger.info('Sample tests loaded successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error loading sample tests', { error });
      process.exit(1);
    });
}

export default loadSampleTests;

