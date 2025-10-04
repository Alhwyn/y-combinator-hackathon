import supabase from './src/lib/supabase.js';

/**
 * Create an AI-powered test case
 * Run this to add a test to your database
 */

async function createTest() {
  console.log('🤖 Creating AI Test Case...\n');
  
  // Test configuration
  const testConfig = {
    name: 'AI Test - Wordle Game',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    
    // AI autonomous mode - just describe what you want!
    actions: [
      {
        type: 'ai_autonomous',
        description: `
          Play a game of Wordle:
          1. Close any welcome modals or popups
          2. Type strategic words like ABOUT, CRANE, LIGHT
          3. Press Enter after each word
          4. Analyze the feedback (green, yellow, gray tiles)
          5. Continue guessing until solved or 6 attempts used
          6. Take a final screenshot of the result
        `.trim(),
        max_steps: 30,
        screenshot_interval: 2000
      }
    ],
    
    status: 'pending',
    priority: 1,
    
    metadata: {
      agent_type: 'ai',
      model: 'claude-3-5-sonnet-20241022',
      created_by: 'user'
    }
  };
  
  // Insert into database
  const { data, error } = await supabase
    .from('test_cases')
    .insert(testConfig)
    .select();
  
  if (error) {
    console.error('❌ Error creating test:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Test created successfully!\n');
  console.log('📋 Test Details:');
  console.log(`   ID: ${data[0].id}`);
  console.log(`   Name: ${data[0].name}`);
  console.log(`   URL: ${data[0].url}`);
  console.log(`   Status: ${data[0].status}`);
  
  console.log('\n🎮 How to run this test:');
  console.log('   Option 1: Use the browser extension (recommended)');
  console.log('   Option 2: Use the web UI at http://localhost:3001/ai-agent.html');
  console.log('   Option 3: Run programmatically with the AI agent worker');
  
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure server is running: npm start');
  console.log('   2. Open browser extension');
  console.log('   3. Navigate to the test URL');
  console.log('   4. Click "Start Testing"');
}

// Run
createTest().catch(console.error);

