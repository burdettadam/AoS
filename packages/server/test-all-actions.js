const { ScriptLoader } = require('./dist/game/script-loader');

async function test() {
  try {
    const loader = new ScriptLoader();
    const script = await loader.getLoadedScript('trouble-brewing');
    
    console.log('=== Enhanced Character Actions Analysis ===');
    console.log('Total characters:', script.characters.length);
    
    let charactersWithActions = 0;
    let charactersWithoutActions = 0;
    let totalActions = 0;
    let parametrizedActions = 0;
    let legacyActions = 0;
    
    const actionBreakdown = {
      firstNight: 0,
      otherNights: 0,
      day: 0,
      nominations: 0,
      voting: 0,
      execution: 0
    };

    const actionTypeStats = {};
    const selectionStats = { withSelections: 0, withoutSelections: 0 };
    const effectStats = { withEffects: 0, withoutEffects: 0 };
    
    script.characters.forEach(char => {
      if (char.actions) {
        charactersWithActions++;
        Object.keys(actionBreakdown).forEach(phase => {
          const phaseActions = char.actions[phase]?.length || 0;
          actionBreakdown[phase] += phaseActions;
          totalActions += phaseActions;

          // Analyze action structure for new system compliance
          if (char.actions[phase]) {
            char.actions[phase].forEach(action => {
              // Count action types
              actionTypeStats[action.action] = (actionTypeStats[action.action] || 0) + 1;
              
              // Check if using new parameterized structure
              if (action.selection || action.effects) {
                parametrizedActions++;
              } else {
                legacyActions++;
              }

              // Selection analysis
              if (action.selection) {
                selectionStats.withSelections++;
              } else {
                selectionStats.withoutSelections++;
              }

              // Effect analysis  
              if (action.effects && action.effects.length > 0) {
                effectStats.withEffects++;
              } else {
                effectStats.withoutEffects++;
              }
            });
          }
        });
      } else {
        charactersWithoutActions++;
      }
    });
    
    console.log('Characters WITH actions:', charactersWithActions);
    console.log('Characters WITHOUT actions:', charactersWithoutActions);
    console.log('Total actions loaded:', totalActions);
    console.log('\n=== Action System Migration Status ===');
    console.log('Parameterized actions (new system):', parametrizedActions);
    console.log('Legacy actions (old system):', legacyActions);
    console.log('Migration progress:', `${Math.round((parametrizedActions / totalActions) * 100)  }%`);
    
    console.log('\n=== Selection System Analysis ===');
    console.log('Actions with structured selections:', selectionStats.withSelections);
    console.log('Actions without selections:', selectionStats.withoutSelections);
    
    console.log('\n=== Effect System Analysis ===');
    console.log('Actions with standardized effects:', effectStats.withEffects);
    console.log('Actions without effects:', effectStats.withoutEffects);
    
    console.log('\nAction breakdown by phase:');
    Object.entries(actionBreakdown).forEach(([phase, count]) => {
      console.log(`- ${phase}: ${count} actions`);
    });

    console.log('\n=== Action Type Distribution ===');
    const sortedActionTypes = Object.entries(actionTypeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedActionTypes.forEach(([actionType, count]) => {
      console.log(`- ${actionType}: ${count} uses`);
    });
    
    // Show characters with day actions
    const dayActionCharacters = script.characters.filter(c => 
      c.actions?.day?.length > 0
    );
    console.log('\nCharacters with day actions:');
    dayActionCharacters.forEach(char => {
      console.log(`- ${char.id}: ${char.actions.day.length} actions`);
    });
    
    // Show characters with first night actions
    const firstNightCharacters = script.characters.filter(c => 
      c.actions?.firstNight?.length > 0
    );
    console.log('\nCharacters with first night actions:');
    firstNightCharacters.forEach(char => {
      console.log(`- ${char.id}: ${char.actions.firstNight.length} actions`);
    });

    // Analyze specific enhanced features
    console.log('\n=== Enhanced Action System Features ===');
    
    const charactersWithStructuredActions = script.characters.filter(c => 
      c.actions && Object.values(c.actions).some(phaseActions => 
        phaseActions && phaseActions.some(action => 
          action.selection || action.effects
        )
      )
    );
    
    console.log(`Characters using new action structure: ${charactersWithStructuredActions.length}`);
    
    // Show examples of enhanced actions
    const enhancedExamples = [];
    script.characters.forEach(char => {
      if (char.actions) {
        Object.entries(char.actions).forEach(([phase, actions]) => {
          if (actions) {
            actions.forEach(action => {
              if (action.selection && action.effects) {
                enhancedExamples.push({
                  character: char.id,
                  phase,
                  action: action.action,
                  hasSelection: !!action.selection,
                  hasEffects: !!action.effects,
                  effectCount: action.effects?.length || 0
                });
              }
            });
          }
        });
      }
    });

    if (enhancedExamples.length > 0) {
      console.log('\nExamples of fully enhanced actions:');
      enhancedExamples.slice(0, 5).forEach(example => {
        console.log(`- ${example.character} (${example.phase}): ${example.action}`);
        console.log(`  Selection criteria: ✅, Effects: ${example.effectCount}`);
      });
    }

    // Migration recommendations
    console.log('\n=== Migration Recommendations ===');
    const migrationScore = Math.round((parametrizedActions / totalActions) * 100);
    
    if (migrationScore < 25) {
      console.log('🔴 Low migration progress - Consider prioritizing action system updates');
    } else if (migrationScore < 75) {
      console.log('🟡 Partial migration - Good progress, continue updating actions');
    } else {
      console.log('🟢 High migration progress - Action system is well modernized');
    }
    
    console.log(`Next steps: Update ${legacyActions} remaining legacy actions`);
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();
