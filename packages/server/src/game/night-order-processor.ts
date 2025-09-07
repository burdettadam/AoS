import { 
  GameState, 
  SeatId, 
  Character, 
  NightOrderEntry, 
  MetaAction, 
  CharacterAction,
  ActionContext,
  ActionResult
} from '@botc/shared';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { ScriptLoader } from './script-loader';
import { ActionSystem } from './action-system';

/**
 * Processes night order using structured action metadata
 * Handles both meta actions and character actions in proper sequence
 */
export class NightOrderProcessor {
  private scriptLoader: ScriptLoader;
  private actionSystem: ActionSystem;

  constructor(scriptLoader: ScriptLoader) {
    this.scriptLoader = scriptLoader;
    this.actionSystem = new ActionSystem();
  }

  /**
   * Execute the full night order for a game
   */
  async executeNightOrder(
    game: GameState, 
    isFirstNight: boolean = false
  ): Promise<{ results: ActionResult[], events: any[] }> {
    logger.info(`Executing ${isFirstNight ? 'first' : 'other'} night order for game ${game.id}`);

    const nightOrder = await this.scriptLoader.getNightOrder(game.scriptId, isFirstNight);
    const results: ActionResult[] = [];
    const events: any[] = [];

    const context: ActionContext = {
      gameId: game.id,
      phase: game.phase,
      day: game.day
    };

    for (let i = 0; i < nightOrder.length; i++) {
      const entry = nightOrder[i];
      logger.debug(`Processing night order entry ${i}: ${typeof entry === 'string' ? entry : entry.id}`);

      try {
        if (typeof entry === 'string') {
          // Character action
          const result = await this.executeCharacterNightAction(entry, game, context, isFirstNight);
          if (result) {
            results.push(result);
            events.push(...this.createEventsFromResult(result, game.id));
          }
        } else {
          // Meta action
          const result = await this.executeMetaAction(entry, game, context);
          results.push(result);
          events.push(...this.createEventsFromResult(result, game.id));
        }
      } catch (error) {
        logger.error(`Error processing night order entry ${i}:`, error);
        results.push({
          actionId: typeof entry === 'string' ? entry : entry.id,
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return { results, events };
  }

  /**
   * Execute a specific character's night action
   */
  private async executeCharacterNightAction(
    characterId: string,
    game: GameState,
    context: ActionContext,
    isFirstNight: boolean
  ): Promise<ActionResult | null> {
    // Find the seat with this character
    const seat = game.seats.find(s => s.role === characterId);
    if (!seat) {
      logger.debug(`Character ${characterId} not in play, skipping`);
      return null;
    }

    if (!seat.isAlive) {
      logger.debug(`Character ${characterId} is dead, skipping`);
      return null;
    }

    // Get character data and actions
    const loadedScript = await this.scriptLoader.getLoadedScript(game.scriptId);
    if (!loadedScript) {
      throw new Error(`Script ${game.scriptId} not found`);
    }

    const character = loadedScript.characters.find(c => c.id === characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found in script`);
    }

    // Get the appropriate actions for this phase
    const phase = isFirstNight ? 'firstNight' : 'otherNights';
  const phaseKey = phase === 'otherNights' ? 'night' : phase;
  const actions = character.actions?.[phaseKey] || [];

    if (actions.length === 0) {
      logger.debug(`Character ${characterId} has no ${phase} actions`);
      return null;
    }

    // For now, execute the first action. In a full implementation,
    // you might need to handle multiple actions or let the storyteller choose
    const action = actions[0];
    
    const actionContext: ActionContext = {
      ...context,
      acting: seat.id,
      metadata: {
        characterId,
        phase,
        isFirstNight
      }
    };

    return this.actionSystem.executeCharacterAction(action, actionContext, game, character, seat);
  }

  /**
   * Execute a meta action
   */
  private async executeMetaAction(
    metaAction: MetaAction,
    game: GameState,
    context: ActionContext
  ): Promise<ActionResult> {
    const actionContext: ActionContext = {
      ...context,
      metadata: {
        metaAction: true,
        actionType: metaAction.action
      }
    };

    return this.actionSystem.executeMetaAction(metaAction, actionContext, game);
  }

  /**
   * Get the processed night order for display/debugging
   */
  async getProcessedNightOrder(
    game: GameState,
    isFirstNight: boolean = false
  ): Promise<Array<{ type: 'character' | 'meta', id: string, description: string, inPlay: boolean }>> {
    const nightOrder = await this.scriptLoader.getNightOrder(game.scriptId, isFirstNight);
    const processed = [];

    for (const entry of nightOrder) {
      if (typeof entry === 'string') {
        // Character entry
        const seat = game.seats.find(s => s.role === entry);
        const isInPlay = seat !== undefined;
        
        processed.push({
          type: 'character' as const,
          id: entry,
          description: `${entry}${seat ? ` (${seat.playerId || 'NPC'})` : ' (not in play)'}`,
          inPlay: isInPlay
        });
      } else {
        // Meta action entry
        processed.push({
          type: 'meta' as const,
          id: entry.id,
          description: entry.description,
          inPlay: true // Meta actions always apply
        });
      }
    }

    return processed;
  }

  /**
   * Check which characters would act during a night phase
   */
  async getActiveCharacters(
    game: GameState,
    isFirstNight: boolean = false
  ): Promise<Array<{ characterId: string, seatId: SeatId, playerId?: string, actions: CharacterAction[] }>> {
    const nightOrder = await this.scriptLoader.getNightOrder(game.scriptId, isFirstNight);
    const activeCharacters = [];
    const phase = isFirstNight ? 'firstNight' : 'otherNights';

    for (const entry of nightOrder) {
      if (typeof entry === 'string') {
        const characterId = entry;
        const seat = game.seats.find(s => s.role === characterId && s.isAlive);
        
        if (seat) {
          const actions = await this.scriptLoader.getCharacterActions(game.scriptId, characterId, phase);
          if (actions.length > 0) {
            activeCharacters.push({
              characterId,
              seatId: seat.id,
              playerId: seat.playerId,
              actions
            });
          }
        }
      }
    }

    return activeCharacters;
  }

  /**
   * Preview what would happen during night execution
   */
  async previewNightOrder(
    game: GameState,
    isFirstNight: boolean = false
  ): Promise<Array<{ step: number, type: 'character' | 'meta', id: string, description: string, willExecute: boolean, reason?: string }>> {
    const nightOrder = await this.scriptLoader.getNightOrder(game.scriptId, isFirstNight);
    const preview = [];

    for (let i = 0; i < nightOrder.length; i++) {
      const entry = nightOrder[i];
      
      if (typeof entry === 'string') {
        const characterId = entry;
        const seat = game.seats.find(s => s.role === characterId);
        const willExecute = seat !== undefined && seat.isAlive;
        
        let reason;
        if (!seat) {
          reason = 'Character not in play';
        } else if (!seat.isAlive) {
          reason = 'Character is dead';
        }

        preview.push({
          step: i + 1,
          type: 'character' as const,
          id: characterId,
          description: `${characterId} wakes up`,
          willExecute,
          reason
        });
      } else {
        preview.push({
          step: i + 1,
          type: 'meta' as const,
          id: entry.id,
          description: entry.description,
          willExecute: true
        });
      }
    }

    return preview;
  }

  /**
   * Create events from action results
   */
  private createEventsFromResult(result: ActionResult, gameId: string): any[] {
    const events = [];

    if (result.success) {
      events.push({
        id: randomUUID(),
        gameId,
        type: 'ability_used',
        timestamp: new Date(),
        payload: {
          actionId: result.actionId,
          information: result.information
        }
      });
    } else {
      events.push({
        id: randomUUID(),
        gameId,
        type: 'action_failed',
        timestamp: new Date(),
        payload: {
          actionId: result.actionId,
          errors: result.errors
        }
      });
    }

    return events;
  }

  /**
   * Execute a single action for testing/manual execution
   */
  async executeAction(
    game: GameState,
    actionId: string,
    actingSeatId?: SeatId,
    targets?: SeatId[]
  ): Promise<ActionResult> {
    const context: ActionContext = {
      gameId: game.id,
      phase: game.phase,
      day: game.day,
      acting: actingSeatId,
      targets
    };

    // This would need to find the action by ID and execute it
    // Implementation depends on how actions are indexed/stored
    throw new Error('Single action execution not yet implemented');
  }
}
