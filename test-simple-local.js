import supabase from './src/lib/supabase.js';

async function createSimpleTest() {
  console.log('Creating a simple test...');
  
  const { data, error } = await supabase
    .from('test_cases')
    .insert({
      name: 'Simple Google Test',
      url: 'https://www.google.com',
      actions: [
        {
          type: 'navigate',
          url: 'https://www.google.com'
        },
        {
          type: 'wait',
          duration: 2000
        },
        {
          type: 'screenshot',
          name: 'google-homepage'
        }
      ],
      status: 'pending',
      priority: 1
    })
    .select();
  
  if (error) {
    console.error('Error creating test:', error);
    process.exit(1);
  }
  
  console.log('✅ Test created successfully!');
  console.log('Test ID:', data[0].id);
  console.log('\n📺 Watch it run at: http://localhost:3001/dashboard');
  console.log('\nThe agent will pick it up in a few seconds...');
}

createSimpleTest();

