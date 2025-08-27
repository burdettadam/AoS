// Simple test script to verify role assignment works
async function testRoleAssignment() {
  try {
    console.log('Testing role assignment...');
    
    // Create a game
    const createResponse = await fetch('http://localhost:3001/api/games', {
      method: 'POST'
    });
    const createData = await createResponse.json();
    console.log('Created game:', createData.gameId);
    
    // Add some players (5 minimum for testing)
    const gameId = createData.gameId;
    const playerIds = ['player1', 'player2', 'player3', 'player4', 'player5'];
    
    for (const playerId of playerIds) {
      const joinResponse = await fetch(`http://localhost:3001/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      console.log(`Player ${playerId} joined:`, await joinResponse.json());
    }
    
    // Start the game (this should trigger role assignment)
    const startResponse = await fetch(`http://localhost:3001/api/games/${gameId}/start`, {
      method: 'POST'
    });
    console.log('Game started:', await startResponse.json());
    
    // Get game state to see roles
    const gameResponse = await fetch(`http://localhost:3001/api/games/${gameId}`);
    const gameData = await gameResponse.json();
    
    console.log('\nGame state after starting:');
    console.log('Phase:', gameData.phase);
    console.log('Day:', gameData.day);
    console.log('\nRole assignments:');
    gameData.seats.forEach((seat, index) => {
      console.log(`Seat ${index + 1}: ${seat.playerId || 'NPC'} - ${seat.role} (${seat.alignment})`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Check if we're in a Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - use node-fetch if available, otherwise use global fetch
  if (typeof fetch === 'undefined') {
    try {
      const fetch = require('node-fetch');
      global.fetch = fetch;
    } catch (e) {
      console.error('node-fetch not available. Please install: npm install node-fetch');
      process.exit(1);
    }
  }
}

testRoleAssignment();
