import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAnthropicKey() {
  console.log('🔑 Testing Anthropic API Key...\n');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No ANTHROPIC_API_KEY found in .env file');
    console.log('\n💡 Add it to your .env file:');
    console.log('ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }
  
  // Mask the key for display
  const maskedKey = apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`📋 API Key found: ${maskedKey}`);
  
  try {
    console.log('📡 Making test API call to Claude...\n');
    
    const anthropic = new Anthropic({ apiKey });
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Say "Hello! Your API key works!" in a fun way.'
      }]
    });
    
    console.log('✅ SUCCESS! Your API key works!\n');
    console.log('🤖 Claude says:', message.content[0].text);
    console.log('\n📊 API Response Details:');
    console.log(`   Model: ${message.model}`);
    console.log(`   Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);
    console.log(`   Cost: ~$${(message.usage.input_tokens * 0.003 / 1000 + message.usage.output_tokens * 0.015 / 1000).toFixed(4)}`);
    console.log('\n🎉 Your AI agent is ready to use!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.status === 401) {
      console.log('\n🔑 Your API key is invalid or expired.');
      console.log('   Get a new one at: https://console.anthropic.com/');
    } else if (error.status === 429) {
      console.log('\n⏳ Rate limit reached. Wait a moment and try again.');
    } else {
      console.log('\n💡 Check your internet connection and try again.');
    }
    
    process.exit(1);
  }
}

testAnthropicKey();

