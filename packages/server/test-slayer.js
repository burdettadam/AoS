const { ScriptLoader } = require('./dist/game/script-loader');

async function test() {
  try {
    const loader = new ScriptLoader();
    const script = await loader.getLoadedScript('trouble-brewing');
    
    console.log('=== All Characters Analysis ===');
    console.log('Total characters:', script.characters.length);
    
    // Check which characters have actions
    const charactersWithActions = script.characters.filter(c => c.actions);
    const charactersWithoutActions = script.characters.filter(c => !c.actions);
    
    console.log('Characters WITH actions:', charactersWithActions.length);
    console.log('Characters WITHOUT actions:', charactersWithoutActions.length);
    
    console.log('\nCharacters without actions:');
    charactersWithoutActions.slice(0, 5).forEach(c => {
      console.log(`- ${c.id}: ${c.name}`);
    });
    
    console.log('\nCharacters with actions:');
    charactersWithActions.slice(0, 5).forEach(c => {
      console.log(`- ${c.id}: ${c.name} (${Object.keys(c.actions).join(', ')})`);
    });
    
    // Check chef specifically
    const chef = script.characters.find(c => c.id === 'chef');
    console.log('\n=== Chef Analysis ===');
    console.log('Chef has actions:', !!chef?.actions);
    if (chef?.actions) {
      console.log('Chef firstNight actions:', chef.actions.firstNight?.length || 0);
    }
    
    // Check slayer specifically
    const slayer = script.characters.find(c => c.id === 'slayer');
    console.log('\n=== Slayer Analysis ===');
    console.log('Slayer has actions:', !!slayer?.actions);
    console.log('Slayer object keys:', Object.keys(slayer || {}));
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();
