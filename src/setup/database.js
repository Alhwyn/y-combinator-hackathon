import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';

/**
 * Database setup utility
 * Runs SQL migrations to create tables, functions, and policies
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  try {
    logger.info('Setting up database...');
    
    // Read schema file
    const schemaPath = join(__dirname, '../../supabase/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    logger.info('Executing schema.sql...');
    
    // Note: Supabase JS client doesn't support executing raw DDL directly
    // This would typically be done via Supabase CLI or dashboard SQL editor
    // For production, use: supabase db push or supabase migration new
    
    logger.warn('⚠️  Please execute the following SQL files manually in your Supabase SQL editor:');
    logger.warn('   1. supabase/schema.sql');
    logger.warn('   2. supabase/storage.sql');
    logger.info('   Or use: supabase db push');
    
    // Verify tables exist
    const { data: tables, error } = await supabase
      .from('agents')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Database verification failed. Please run the SQL migrations manually.', { error });
      logger.info('Instructions:');
      logger.info('1. Go to your Supabase dashboard');
      logger.info('2. Navigate to SQL Editor');
      logger.info('3. Execute supabase/schema.sql');
      logger.info('4. Execute supabase/storage.sql');
      return false;
    }
    
    logger.info('✅ Database setup verified!');
    return true;
    
  } catch (error) {
    logger.error('Database setup failed', { error });
    return false;
  }
}

// Run setup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then((success) => {
      if (success) {
        logger.info('Database setup completed successfully');
        process.exit(0);
      } else {
        logger.error('Database setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Database setup error', { error });
      process.exit(1);
    });
}

export default setupDatabase;

