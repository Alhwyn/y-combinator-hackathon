import supabase from './src/lib/supabase.js';

async function createWordleTest() {
  console.log('🎮 Creating AI-Powered Wordle test...');
  console.log('🤖 Claude will intelligently play Wordle by analyzing the colored tiles!');
  
  const { data, error } = await supabase
    .from('test_cases')
    .insert({
      name: 'AI Agent: Play Wordle Intelligently',
      url: 'https://www.nytimes.com/games/wordle/index.html',
      actions: [
        {
          type: 'ai_mode',
          description: `You are playing Wordle! Your goal is to guess the 5-letter word in as few tries as possible.

RULES:
- You get 6 attempts to guess the word
- After each guess, tiles change color:
  * GREEN = letter is correct and in the right position
  * YELLOW = letter is in the word but wrong position  
  * GRAY = letter is not in the word at all

STRATEGY:
1. Start with a good opening word like CRANE, SLATE, or ADIEU (has common vowels)
2. Look carefully at the colored tiles after each guess
3. Use green letters in the same positions
4. Try yellow letters in different positions
5. Avoid gray letters entirely
6. Think logically about what 5-letter words fit the clues

ACTIONS:
- First, close any welcome modal by clicking the X or Close button
- Then type your guess (5 letters) and press Enter
- Wait a moment for the tiles to flip and show colors
- Analyze the colors and make your next guess
- Continue until you win or run out of guesses

Be smart and strategic! Use word knowledge and logic to solve it quickly.`
        }
      ],
      status: 'pending',
      priority: 1,
      metadata: {
        mode: 'ai_autonomous',
        requires_intelligence: true
      }
    })
    .select();
  
  if (error) {
    console.error('❌ Error creating test:', error);
    process.exit(1);
  }
  
  console.log('✅ Wordle test created successfully!');
  console.log('🎯 Test ID:', data[0].id);
  console.log('\n📺 Watch it play at: http://localhost:3001/dashboard');
  console.log('\n🎮 The agent will start playing Wordle in a few seconds...');
  console.log('   You\'ll see it type words and get feedback!');
}

createWordleTest();

