#!/bin/bash

# Script to stop all running AI agents

echo "🛑 Stopping all AI agents..."

# Load environment
export $(cat .env | grep -v '^#' | xargs)

# Call Node script to cancel tests
node -e "
import('@supabase/supabase-js').then(m => {
  const { createClient } = m;
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
  );
  
  supabase
    .from('test_cases')
    .update({ status: 'cancelled' })
    .in('status', ['pending', 'running'])
    .select()
    .then(result => {
      const count = result.data?.length || 0;
      console.log('✅ Cancelled', count, 'running test(s)');
      console.log('Agents will become idle shortly.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
});
"


