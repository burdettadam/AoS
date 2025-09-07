#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to extract goal from ability text
function extractGoal(ability, team) {
  const goals = {
    townsfolk: {
      'Learns that one of two players is a particular Townsfolk': {
        action: 'confirmTownsfolk',
        description: 'Confirms a specific Townsfolk character is in play and identifies one good player',
        targets: ['townsfolk'],
        effect: 'Provides definitive proof of character presence and player alignment',
        frequency: 'once'
      },
      'Learns that one of two players is a particular Outsider': {
        action: 'identifyOutsider',
        description: 'Identifies a specific Outsider character in play',
        targets: ['outsiders'],
        effect: 'Helps determine game balance and identify non-voting players',
        frequency: 'once'
      },
      'Learns that one of two players is a particular Minion': {
        action: 'identifyMinion',
        description: 'Identifies a specific Minion character in play and narrows down evil players',
        targets: ['minions'],
        effect: 'Provides definitive proof of Minion presence and creates execution targets',
        frequency: 'once'
      }
    },
    outsider: {
      default: {
        action: 'surviveAndWin',
        description: 'Must survive to win with the good team',
        targets: ['self'],
        effect: 'Requires special win conditions beyond standard good team victory',
        frequency: 'game'
      }
    },
    minion: {
      default: {
        action: 'supportDemon',
        description: 'Supports the Demon and helps eliminate good players',
        targets: ['demons'],
        effect: 'Provides various abilities to assist the Demon in achieving victory',
        frequency: 'game'
      }
    },
    demon: {
      default: {
        action: 'killPlayers',
        description: 'Kills players to eliminate threats and create chaos',
        targets: ['townsfolk', 'outsiders'],
        effect: 'Removes players from the game through various killing mechanisms',
        frequency: 'nightly'
      }
    }
  };

  return goals[team]?.[ability] || goals[team]?.default || {
    action: 'unknown',
    description: 'Character ability effect',
    targets: ['all'],
    effect: 'Various effects based on character ability',
    frequency: 'game'
  };
}

// Function to convert firstNightDescription to actions
function convertFirstNightActions(description, characterId) {
  if (!description || description.trim() === '') return [];

  const actions = [];

  // Basic first night info action for information characters
  if (description.includes('wake') || description.includes('show') || description.includes('point')) {
    actions.push({
      id: `${characterId}-info`,
      type: 'character',
      action: 'receiveInformation',
      description: `Storyteller provides ${characterId} with their first night information`,
      targets: ['storyteller'],
      information: {
        customMessage: description.substring(0, 100) + '...'
      },
      order: 1
    });
  }

  return actions;
}

// Function to convert tipsAndTricks to actions
function convertTipsActions(tips, characterId) {
  if (!tips || tips.trim() === '') return { day: [], nominations: [], voting: [], execution: [] };

  const actions = {
    day: [],
    nominations: [],
    voting: [],
    execution: []
  };

  let order = 1;

  // Extract key strategies from tips
  if (tips.includes('share') || tips.includes('tell') || tips.includes('reveal')) {
    actions.day.push({
      id: `${characterId}-share-info`,
      type: 'character',
      action: 'shareLearnedInfo',
      description: `${characterId} can share learned information strategically`,
      targets: ['all'],
      information: {
        customMessage: 'Strategic information sharing based on character ability'
      },
      order: order++
    });
  }

  if (tips.includes('nominate') || tips.includes('execute')) {
    actions.nominations.push({
      id: `${characterId}-strategic-nomination`,
      type: 'character',
      action: 'nominateStrategically',
      description: `${characterId} uses information for strategic nominations`,
      targets: ['all'],
      information: {
        customMessage: 'Uses character knowledge to make informed nomination decisions'
      },
      order: 1
    });
  }

  if (tips.includes('vote')) {
    actions.voting.push({
      id: `${characterId}-strategic-voting`,
      type: 'character',
      action: 'voteStrategically',
      description: `${characterId} uses information for strategic voting`,
      targets: ['all'],
      information: {
        customMessage: 'Uses character knowledge to make informed voting decisions'
      },
      order: 1
    });
  }

  if (tips.includes('survive') || tips.includes('avoid') || tips.includes('defend')) {
    actions.execution.push({
      id: `${characterId}-survival-strategy`,
      type: 'character',
      action: 'implementSurvivalStrategy',
      description: `${characterId} implements strategies to survive execution`,
      targets: ['self'],
      information: {
        customMessage: 'Various survival strategies based on character ability'
      },
      order: 1
    });
  }

  return actions;
}

// Main conversion function
function convertCharacter(characterPath) {
  try {
    const character = JSON.parse(fs.readFileSync(characterPath, 'utf8'));

    // Add goal field
    character.goal = extractGoal(character.ability, character.team);

    // Add actions field
    character.actions = {
      firstNight: convertFirstNightActions(character.firstNightDescription, character.id),
      otherNights: [],
      ...convertTipsActions(character.tipsAndTricks, character.id)
    };

    // Write back to file
    fs.writeFileSync(characterPath, JSON.stringify(character, null, 2));
    console.log(`✓ Converted ${character.id}`);

  } catch (error) {
    console.log(`✗ Error converting ${characterPath}: ${error.message}`);
  }
}

// Process all character files
const charactersDir = './data/characters';
const files = fs.readdirSync(charactersDir)
  .filter(file => file.endsWith('.json'))
  .filter(file => !['washerwoman.json', 'investigator.json', 'imp.json'].includes(file)); // Skip already converted

console.log(`Converting ${files.length} characters...`);

files.forEach(file => {
  convertCharacter(path.join(charactersDir, file));
});

console.log('Conversion complete!');
