import { GameEngine } from '../src/game/engine';
import { GamePhase } from '@botc/shared';
import { JournalService } from '../src/services/journal.service';

// Utility to create fake UUIDs for deterministic tests
let uuidCounter = 0;
const uuid = () => `00000000-0000-4000-8000-${  String(uuidCounter++).padStart(12, '0')}`;

describe('Trouble Brewing: basic gameplay flow', () => {
  it('can setup, assign roles, and run a nomination→vote→execution cycle', async () => {
    const engine = new GameEngine();
    const gameId = await engine.createGame('trouble-brewing');

    // Add 7 seats (1 storyteller + 6 players)
    const st = await engine.addPlayer(gameId, uuid(), false); // becomes storyteller automatically
    expect(st).toBeDefined();
    const s1 = await engine.addPlayer(gameId, uuid(), false);
    const s2 = await engine.addPlayer(gameId, uuid(), false);
    const s3 = await engine.addPlayer(gameId, uuid(), false);
    const s4 = await engine.addPlayer(gameId, uuid(), false);
    const s5 = await engine.addPlayer(gameId, uuid(), false);
    const s6 = await engine.addPlayer(gameId, uuid(), false);
    const game0 = engine.getGame(gameId)!;
    expect(game0.seats.length).toBe(7);
    const storytellerSeatId = game0.storytellerSeatId!;

    // Enter setup
    const enter = await engine.enterSetup(gameId, storytellerSeatId);
    expect(enter.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.SETUP);

    // Validate setup (auto-seeded via composition mirror)
    const v = await engine.validateSetup(gameId, storytellerSeatId);
    expect(v.ok).toBe(true);

    // Complete setup -> assigns roles and moves to night day=1
    const done = await engine.completeSetup(gameId, storytellerSeatId);
    expect(done.ok).toBe(true);
    const g1 = engine.getGame(gameId)!;
    expect(g1.phase).toBe(GamePhase.NIGHT);
    expect(g1.day).toBe(1);
    // Ensure all non-storyteller seats have roles and alignment
    const assigned = g1.seats.filter(s => s.id !== g1.storytellerSeatId);
    expect(assigned.every(s => !!s.role && !!s.alignment)).toBe(true);

    // Initialize journals for all players
    for (const seat of assigned) {
      JournalService.initializeJournal(g1, seat.id);
    }

    // Test: Check that journals are initialized
    const initialJournals = JournalService.getAllJournals(g1);
    expect(Object.keys(initialJournals)).toHaveLength(6); // 6 players
    for (const seatId of Object.keys(initialJournals)) {
      expect(initialJournals[seatId].notes).toEqual([]);
      expect(initialJournals[seatId].moves.length).toBeGreaterThan(0); // Should have some available moves
    }

    // Advance to Day
    const adv1 = await engine.advancePhase(gameId, storytellerSeatId);
    expect(adv1.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.DAY);

    // Simulate storyteller disclosing information to players (e.g., Chef gets evil pairs count)
    const gameDay1 = engine.getGame(gameId)!;
    const chefSeat = gameDay1.seats.find(s => s.role === 'chef');
    if (chefSeat) {
      // Simulate storyteller giving Chef information
      JournalService.addNote(gameDay1, chefSeat.id, 'ST told me: There are 1 pairs of neighboring evil players');
      
      // Test: Verify storyteller disclosure is recorded
      const chefJournal = JournalService.getJournal(gameDay1, chefSeat.id);
      expect(chefJournal?.notes).toHaveLength(1);
      expect(chefJournal?.notes[0].text).toContain('ST told me');
    }

    // Simulate players taking notes during discussion
    const investigatorSeat = gameDay1.seats.find(s => s.role === 'investigator');
    if (investigatorSeat) {
      JournalService.addNote(gameDay1, investigatorSeat.id, 'ST told me: One of Player 2 or Player 3 is the Poisoner');
      JournalService.addNote(gameDay1, investigatorSeat.id, 'Note: Player 2 seems nervous when accused');
    }

    // Simulate other players taking notes
    const player1 = gameDay1.seats.find(s => s.id === s1);
    if (player1) {
      JournalService.addNote(gameDay1, player1.id, 'Player 3 claimed to be the Librarian');
      JournalService.addNote(gameDay1, player1.id, 'Suspicious of Player 5 - deflecting accusations');
    }

    // Move into Nomination
    const adv2 = await engine.advancePhase(gameId, storytellerSeatId);
    expect(adv2.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.NOMINATION);

    // Players add notes about nominations
    const gameNom = engine.getGame(gameId)!;
    JournalService.addNote(gameNom, s1!, 'About to nominate Player 2 - Investigator says they might be Poisoner');

    // Make a nomination (s1 nominates s2)
    const nom = engine.nominate(gameId, s1!, s2!);
    expect(nom.ok).toBe(true);

    // Move to Vote
    const adv3 = await engine.advancePhase(gameId, storytellerSeatId);
    expect(adv3.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.VOTE);

    // Start vote and have all alive players vote yes
    const start = engine.startVote(gameId, storytellerSeatId);
    expect(start.ok).toBe(true);
    const seats = engine.getGame(gameId)!.seats.filter(s => s.isAlive);
    for (const seat of seats) {
      if (seat.id === storytellerSeatId) continue; // storyteller does not vote
      const r = engine.castVote(gameId, seat.id, true);
      expect(r.ok).toBe(true);
      
      // Players add notes about their votes
      JournalService.addNote(engine.getGame(gameId)!, seat.id, `Voted YES to execute Player 2`);
    }

    // Finish vote -> execution occurs
    const fin = engine.finishVote(gameId, storytellerSeatId);
    expect(fin.ok).toBe(true);
    if ('executed' in fin && fin.ok) {
      expect(fin.executed).toBe(true);
    } else {
      throw new Error('finishVote did not return executed result');
    }

    // Move to Execution phase, then Night
    const adv4 = await engine.advancePhase(gameId, storytellerSeatId);
    expect(adv4.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.EXECUTION);
    const adv5 = await engine.advancePhase(gameId, storytellerSeatId);
    expect(adv5.ok).toBe(true);
    expect(engine.getGame(gameId)!.phase).toBe(GamePhase.NIGHT);
    expect(engine.getGame(gameId)!.day).toBe(2);

    // Test: Storyteller audit at end of game - verify all journal states
    const finalGame = engine.getGame(gameId)!;
    const allJournals = JournalService.getAllJournals(finalGame);
    
    // Verify storyteller can access all player journals
    expect(Object.keys(allJournals)).toHaveLength(6); // 6 players
    
    // Check that information disclosures from storyteller are preserved
    let foundStorytellerDisclosures = 0;
    let foundPlayerNotes = 0;
    
    for (const [seatId, journal] of Object.entries(allJournals)) {
      // Each journal should have notes
      expect(journal.notes.length).toBeGreaterThan(0);
      
      // Check for storyteller disclosures (prefixed with "ST told me:")
      const stDisclosures = journal.notes.filter(note => note.text.startsWith('ST told me:'));
      foundStorytellerDisclosures += stDisclosures.length;
      
      // Check for player notes (not prefixed with "ST told me:")
      const playerNotes = journal.notes.filter(note => !note.text.startsWith('ST told me:'));
      foundPlayerNotes += playerNotes.length;
      
      // Verify timestamps are present
      for (const note of journal.notes) {
        expect(note.timestamp).toBeInstanceOf(Date);
      }
    }
    
    // Verify we found both types of information
    expect(foundStorytellerDisclosures).toBeGreaterThan(0); // Should have some storyteller disclosures
    expect(foundPlayerNotes).toBeGreaterThan(0); // Should have some player notes
    
    console.log(`✅ Journal audit complete:`);
    console.log(`   📝 Total journals: ${Object.keys(allJournals).length}`);
    console.log(`   🗣️  Storyteller disclosures: ${foundStorytellerDisclosures}`);
    console.log(`   📓 Player notes: ${foundPlayerNotes}`);
  });

  it('can track information flow and storyteller disclosures throughout the game', async () => {
    const engine = new GameEngine();
    const gameId = await engine.createGame('trouble-brewing');

    // Add players
    const st = await engine.addPlayer(gameId, uuid(), false);
    const s1 = await engine.addPlayer(gameId, uuid(), false);
    const s2 = await engine.addPlayer(gameId, uuid(), false);
    const s3 = await engine.addPlayer(gameId, uuid(), false);
    const s4 = await engine.addPlayer(gameId, uuid(), false);
    const s5 = await engine.addPlayer(gameId, uuid(), false);
    const s6 = await engine.addPlayer(gameId, uuid(), false);
    
    const game = engine.getGame(gameId)!;
    const storytellerSeatId = game.storytellerSeatId!;

    // Setup game
    await engine.enterSetup(gameId, storytellerSeatId);
    await engine.validateSetup(gameId, storytellerSeatId);
    await engine.completeSetup(gameId, storytellerSeatId);
    
    const gameAfterSetup = engine.getGame(gameId)!;
    const playerSeats = gameAfterSetup.seats.filter(s => s.id !== storytellerSeatId);
    
    // Initialize journals
    for (const seat of playerSeats) {
      JournalService.initializeJournal(gameAfterSetup, seat.id);
    }

    // Test different types of information disclosure
    
    // 1. First Night Character Information
    const chefSeat = playerSeats.find(s => s.role === 'chef');
    const empathSeat = playerSeats.find(s => s.role === 'empath');
    const investigatorSeat = playerSeats.find(s => s.role === 'investigator');
    
    if (chefSeat) {
      JournalService.addNote(gameAfterSetup, chefSeat.id, 'ST told me: 2 pairs of evil neighbors');
    }
    
    if (empathSeat) {
      JournalService.addNote(gameAfterSetup, empathSeat.id, 'ST told me: 1 evil neighbor tonight');
    }
    
    if (investigatorSeat) {
      JournalService.addNote(gameAfterSetup, investigatorSeat.id, 'ST told me: Player 3 or Player 5 is the Baron');
    }

    // Add some storyteller disclosures even if we don't have specific characters
    const firstPlayerSeat = playerSeats[0];
    if (firstPlayerSeat) {
      JournalService.addNote(gameAfterSetup, firstPlayerSeat.id, 'ST told me: You are the Chef - you see 1 evil pair');
    }

    // 2. Public Information Sharing
    if (chefSeat) {
      JournalService.addNote(gameAfterSetup, chefSeat.id, 'Public: Revealed my Chef info - 2 evil pairs');
    } else if (firstPlayerSeat) {
      JournalService.addNote(gameAfterSetup, firstPlayerSeat.id, 'Public: Revealed my Chef info - 1 evil pair');
    }

    // 3. Private Conversations and Whispers
    JournalService.addNote(gameAfterSetup, s1!, 'Whisper with Player 2: They claim Virgin');
    JournalService.addNote(gameAfterSetup, s2!, 'Whisper with Player 1: Told them I am Virgin');

    // 4. Deductions and Analysis
    JournalService.addNote(gameAfterSetup, s3!, 'Analysis: If Chef is right about 2 evil pairs, then seats 4-5-6 or 1-2-3 have evil');
    
    // Advance to Day and continue tracking
    await engine.advancePhase(gameId, storytellerSeatId);
    const dayGame = engine.getGame(gameId)!;
    
    // 5. Day Phase Information
    JournalService.addNote(dayGame, s4!, 'Observation: Player 4 deflecting suspicion onto confirmed good players');
    
    // Test: Verify information categorization
    const journals = JournalService.getAllJournals(dayGame);
    
    let storytellerInfo = 0;
    let publicInfo = 0;
    let privateInfo = 0;
    let analysisInfo = 0;
    
    for (const [seatId, journal] of Object.entries(journals)) {
      for (const note of journal.notes) {
        if (note.text.startsWith('ST told me:')) {
          storytellerInfo++;
        } else if (note.text.startsWith('Public:')) {
          publicInfo++;
        } else if (note.text.startsWith('Whisper')) {
          privateInfo++;
        } else if (note.text.startsWith('Analysis:') || note.text.startsWith('Observation:')) {
          analysisInfo++;
        }
      }
    }
    
    expect(storytellerInfo).toBeGreaterThan(0);
    expect(publicInfo).toBeGreaterThan(0);
    expect(privateInfo).toBeGreaterThan(0);
    expect(analysisInfo).toBeGreaterThan(0);
    
    console.log(`✅ Information flow tracking complete:`);
    console.log(`   🎭 Storyteller disclosures: ${storytellerInfo}`);
    console.log(`   📢 Public statements: ${publicInfo}`);
    console.log(`   🤐 Private conversations: ${privateInfo}`);
    console.log(`   🧠 Player analysis: ${analysisInfo}`);
  });
});
