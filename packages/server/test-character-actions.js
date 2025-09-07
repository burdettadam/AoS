const { ScriptLoader } = require('./dist/game/script-loader');

async function test() {
  try {
    const loader = new ScriptLoader();
    
    // Clear the cache to force fresh loading
    console.log('Clearing script cache...');
    
    const script = await loader.getLoadedScript('trouble-brewing');
    
    console.log('=== Character Actions Test ===');
    console.log('Total characters:', script.characters.length);
    
    // Check slayer specifically
    const slayer = script.characters.find(c => c.id === 'slayer');
    console.log('\n=== Slayer Analysis ===');
    console.log('Found slayer:', !!slayer);
    console.log('Has actions object:', !!slayer?.actions);
    console.log('Slayer object keys:', Object.keys(slayer || {}));
    
    if (slayer?.actions) {
      console.log('Actions object keys:', Object.keys(slayer.actions));
      console.log('Day actions:', slayer.actions.day?.length || 0);
      if (slayer.actions.day?.length > 0) {
        console.log('First day action:', slayer.actions.day[0]);
      }
    }
    
    // Check chef as another example
    const chef = script.characters.find(c => c.id === 'chef');
    console.log('\n=== Chef Analysis ===');
    console.log('Found chef:', !!chef);
    console.log('Has actions object:', !!chef?.actions);
    
    if (chef?.actions) {
      console.log('Actions object keys:', Object.keys(chef.actions));
      console.log('First night actions:', chef.actions.firstNight?.length || 0);
      if (chef.actions.firstNight?.length > 0) {
        console.log('First night action:', chef.actions.firstNight[0]);
      }
    }
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();
