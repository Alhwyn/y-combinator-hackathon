import supabase from './src/lib/supabase.js';

/**
 * Create an AI-powered test case
 * The AI agent will autonomously decide what actions to take based on screenshots
 */
async function createAITest() {
  console.log('🤖 Creating AI-powered test...');
  
  const { data, error } = await supabase
    .from('test_cases')
    .insert({
      name: 'AI Autonomous Test - Wordle',
      url: 'https://www.nytimes.com/games/wordle/index.html',
      actions: [
        {
          type: 'ai_autonomous',
          description: 'Play Wordle game - Close any modals, type word guesses, submit them, and try to solve the puzzle. Use strategic words like ABOUT, CRANE, LIGHT.',
          max_steps: 30,
          screenshot_interval: 2000 // milliseconds
        }
      ],
      status: 'pending',
      priority: 1,
      metadata: {
        agent_type: 'ai',
        model: 'claude-3-5-sonnet-20241022'
      }
    })
    .select();
  
  if (error) {
    console.error('❌ Error creating AI test:', error);
    process.exit(1);
  }
  
  console.log('✅ AI test created successfully!');
  console.log('🎯 Test ID:', data[0].id);
  console.log('\n🤖 How to run:');
  console.log('   1. Set ANTHROPIC_API_KEY in your .env file');
  console.log('   2. Open: http://localhost:3001/ai-agent.html');
  console.log('   3. Enter your API key and test parameters');
  console.log('   4. Click "Start AI Agent"');
  console.log('\n💡 The AI will analyze screenshots and autonomously decide what to do!');
}

createAITest();

