import supabase from './src/lib/supabase.js';

/**
 * Create multiple Wordle tests to run in parallel
 * Usage: node create-parallel-wordle-tests.js [count]
 * Example: node create-parallel-wordle-tests.js 5
 */

async function createParallelWordleTests(count = 5) {
  console.log(`\n🎮 Creating ${count} parallel Wordle tests...\n`);
  
  const tests = [];
  
  for (let i = 1; i <= count; i++) {
    tests.push({
      name: `Parallel Wordle Test ${i}/${count}`,
      url: 'https://www.nytimes.com/games/wordle/',
      description: `AI agent plays Wordle intelligently (parallel test ${i})`,
      actions: [
        {
          type: 'ai_autonomous',
          description: 'Play Wordle - Close any modals, type intelligent word guesses based on feedback, try to solve the puzzle efficiently'
        }
      ],
      status: 'pending',
      max_retries: 1,
      retry_count: 0,
      metadata: {
        mode: 'ai_autonomous',
        maxSteps: 50,
        parallelGroup: `wordle-batch-${Date.now()}`,
        testNumber: i,
        totalTests: count
      }
    });
  }
  
  console.log('📝 Inserting tests into database...');
  
  const { data, error } = await supabase
    .from('test_cases')
    .insert(tests)
    .select();
  
  if (error) {
    console.error('❌ Error creating tests:', error);
    process.exit(1);
  }
  
  console.log(`✅ Successfully created ${data.length} Wordle tests!\n`);
  console.log('Test IDs:');
  data.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.id} - ${test.name}`);
  });
  
  console.log('\n🎬 Watch tests execute live:');
  console.log('   Local:   http://localhost:3001/dashboard/');
  console.log('   Railway: https://multi-agent-testing-production.up.railway.app/dashboard/\n');
  
  console.log('💡 Tips:');
  console.log(`   - ${count} tests will run in parallel (up to CONCURRENT_AGENTS=${process.env.CONCURRENT_AGENTS || 5})`);
  console.log(`   - If you have ${count} agents, all tests run simultaneously`);
  console.log(`   - If you have fewer agents, tests queue and run as agents become available\n`);
  
  // Check how many agents are available
  console.log('🤖 Checking available agents...');
  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('id, name, status')
    .eq('status', 'idle');
  
  if (!agentError && agents) {
    console.log(`   Available agents: ${agents.length}`);
    if (agents.length >= count) {
      console.log(`   ✅ All ${count} tests will run immediately!`);
    } else if (agents.length > 0) {
      console.log(`   ⚠️  ${agents.length} tests will run immediately, ${count - agents.length} will queue`);
    } else {
      console.log(`   ⚠️  No idle agents. Tests will start when agents become available.`);
      console.log(`   💡 Start agents with: npm start`);
    }
  }
  
  console.log('\n✨ Done! Tests are ready to execute.\n');
  
  return data;
}

// Get count from command line argument
const count = parseInt(process.argv[2]) || 5;

// Validate count
if (count < 1 || count > 100) {
  console.error('❌ Error: Count must be between 1 and 100');
  process.exit(1);
}

// Run it
createParallelWordleTests(count)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

