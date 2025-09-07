const { ScriptLoader } = require('./dist/game/script-loader');

async function test() {
  try {
    const loader = new ScriptLoader();
    
    console.log('=== Script Validation Test ===');
    const result = await loader.validateScript('trouble-brewing');
    
    console.log('Validation result:');
    console.log('- Is valid:', result.isValid);
    console.log('- Total warnings:', result.warnings.length);
    console.log('- Total errors:', result.errors.length);
    
    // Show first few warnings
    console.log('\n=== First 5 Warnings ===');
    result.warnings.slice(0, 5).forEach((warning, i) => {
      console.log(`${i + 1}. ${warning}`);
    });
    
    // Check for slayer-specific issues
    const slayerWarnings = result.warnings.filter(w => w.includes('slayer'));
    console.log('\n=== Slayer Warnings ===');
    console.log('Slayer warnings count:', slayerWarnings.length);
    slayerWarnings.forEach(warning => {
      console.log('- ' + warning);
    });
    
    // Generate full report
    console.log('\n=== Full Report Summary ===');
    const report = await loader.generateValidationReport('trouble-brewing');
    console.log(report.split('\n').slice(0, 10).join('\n')); // First 10 lines
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();
