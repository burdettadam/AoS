import { Script, RoleDefinition, RoleType, Alignment, LoadedScript, Character, NightOrderEntry, MetaAction, CharacterAction } from '@botc/shared';
import { ScriptLoader as SharedScriptLoader } from '@botc/shared';
import { NodeScriptDataSource } from '../data/nodeScriptDataSource';
import { logger } from '../utils/logger';
import { ValidationSystem } from './validation-system';

export class ScriptLoader {
  private scripts: Map<string, Script> = new Map();
  private sharedLoader: SharedScriptLoader;
  private validationSystem: ValidationSystem;
  private loadedScripts: Map<string, LoadedScript> = new Map();

  constructor() {
    this.sharedLoader = new SharedScriptLoader(new NodeScriptDataSource());
    this.validationSystem = new ValidationSystem();
    this.loadDefaultScripts();
  }

  async loadScript(scriptId: string): Promise<Script | null> {
    // Check cache first
    if (this.scripts.has(scriptId)) {
      return this.scripts.get(scriptId)!;
    }

    try {
      // Load from JSON files with new metadata
      const loadedScript = await this.sharedLoader.loadScript(scriptId);
      this.loadedScripts.set(scriptId, loadedScript);
      
      // Validate the loaded script
      const validationResult = this.validationSystem.validateScript(loadedScript);
      
      if (!validationResult.isValid) {
        logger.warn(`Script ${scriptId} has validation errors:`);
        logger.warn(this.validationSystem.generateReport(validationResult));
      } else {
        logger.info(`Script ${scriptId} validated successfully`);
      }

      // Convert to engine script format
      const script = this.convertLoadedScriptToScript(loadedScript);
      this.scripts.set(scriptId, script);
      return script;
    } catch (error) {
      logger.warn(`Failed to load script from JSON: ${scriptId}, falling back to hardcoded`, error);
      
      // Fallback to hardcoded scripts
      return this.scripts.get(scriptId) || null;
    }
  }

  /**
   * Get the loaded script with full metadata
   */
  async getLoadedScript(scriptId: string): Promise<LoadedScript | null> {
    if (this.loadedScripts.has(scriptId)) {
      return this.loadedScripts.get(scriptId)!;
    }

    try {
      const loadedScript = await this.sharedLoader.loadScript(scriptId);
      this.loadedScripts.set(scriptId, loadedScript);
      return loadedScript;
    } catch (error) {
      logger.error(`Failed to load script metadata for ${scriptId}:`, error);
      return null;
    }
  }

  /**
   * Validate a script and return detailed results
   */
  async validateScript(scriptId: string): Promise<any> {
    const loadedScript = await this.getLoadedScript(scriptId);
    if (!loadedScript) {
      return { isValid: false, errors: ['Script not found'] };
    }

    return this.validationSystem.validateScript(loadedScript);
  }

  /**
   * Get character action metadata for a specific character
   */
  async getCharacterActions(scriptId: string, characterId: string, phase: 'firstNight' | 'otherNights' | 'day'): Promise<CharacterAction[]> {
    const loadedScript = await this.getLoadedScript(scriptId);
    if (!loadedScript) return [];

    const character = loadedScript.characters.find(c => c.id === characterId);
    if (!character?.actions) return [];

  const phaseKey = phase === 'otherNights' ? 'night' : phase;
  return character.actions[phaseKey] || [];
  }

  /**
   * Get night order with resolved actions
   */
  async getNightOrder(scriptId: string, isFirstNight: boolean = false): Promise<NightOrderEntry[]> {
    const loadedScript = await this.getLoadedScript(scriptId);
    if (!loadedScript) return [];

    const orderField = isFirstNight ? 'firstNight' : 'nightOrder';
    return loadedScript[orderField] || [];
  }

  /**
   * Get all meta actions for a script
   */
  async getMetaActions(scriptId: string): Promise<MetaAction[]> {
    const loadedScript = await this.getLoadedScript(scriptId);
    if (!loadedScript) return [];

    const metaActions: MetaAction[] = [];
    
    // Extract meta actions from first night
    if (loadedScript.firstNight) {
      for (const entry of loadedScript.firstNight) {
        if (typeof entry === 'object' && entry.type === 'meta') {
          metaActions.push(entry);
        }
      }
    }

    // Extract meta actions from night order
    if (loadedScript.nightOrder) {
      for (const entry of loadedScript.nightOrder) {
        if (typeof entry === 'object' && entry.type === 'meta') {
          metaActions.push(entry);
        }
      }
    }

    return metaActions;
  }

  listScripts(): Array<{ id: string; name: string; version: string }> {
    return Array.from(this.scripts.values()).map(s => ({ id: s.id, name: s.name, version: s.version }));
  }

  private convertLoadedScriptToScript(loadedScript: LoadedScript): Script {
    const roles: RoleDefinition[] = loadedScript.characters.map(char => this.convertCharacterToRole(char));

    return {
      id: loadedScript.id,
      name: loadedScript.name,
      version: loadedScript.meta?.version || '1.0.0',
      roles,
      setup: {
        playerCount: {
          min: loadedScript.meta?.playerCount?.min || 5,
          max: loadedScript.meta?.playerCount?.max || 15
        },
        distribution: this.calculateDistribution(roles)
      },
      firstNight: loadedScript.firstNight,
      nightOrder: loadedScript.nightOrder,
      meta: loadedScript.meta
    };
  }

  private convertCharacterToRole(char: Character): RoleDefinition {
    return {
      id: char.id,
      name: char.name,
      alignment: this.mapTeamToAlignment(char.team),
      type: this.mapTeamToRoleType(char.team),
      ability: char.ability ? {
        id: `${char.id}-ability`,
        when: 'passive' as const,
        target: 'self',
        effect: [{ type: 'custom', description: char.ability }]
      } : undefined,
      visibility: {
        reveals: {
          public: 'none' as const,
          privateTo: char.team === 'minion' || char.team === 'demon' ? ['evil'] : []
        }
      },
      precedence: char.firstNight || char.otherNights || 999,
      reminderTokens: char.reminders
    };
  }

  private mapTeamToAlignment(team: string): typeof Alignment[keyof typeof Alignment] {
    return team === 'minion' || team === 'demon' ? Alignment.EVIL : Alignment.GOOD;
  }

  private mapTeamToRoleType(team: string): typeof RoleType[keyof typeof RoleType] {
    switch (team) {
      case 'townsfolk': return RoleType.TOWNSFOLK;
      case 'outsider': return RoleType.OUTSIDER;
      case 'minion': return RoleType.MINION;
      case 'demon': return RoleType.DEMON;
      case 'traveller': return RoleType.TRAVELLER;
      case 'fabled': return RoleType.FABLED;
      default: return RoleType.TOWNSFOLK;
    }
  }

  private calculateDistribution(roles: RoleDefinition[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    roles.forEach(role => {
      const key = role.type.toString();
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return distribution;
  }

  private loadDefaultScripts(): void {
    // Load Trouble Brewing script
    const troubleBrewing = this.createTroubleBrewing();
    this.scripts.set('trouble-brewing', troubleBrewing);
    
    logger.info('Loaded default scripts');
  }

  private createTroubleBrewing(): Script {
    const roles: RoleDefinition[] = [
      // Townsfolk
      {
        id: 'washerwoman',
        name: 'Washerwoman',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'washerwoman-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'show_role_between_players' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 10
      },
      {
        id: 'librarian',
        name: 'Librarian',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'librarian-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'show_outsider_between_players' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 11
      },
      {
        id: 'investigator',
        name: 'Investigator',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'investigator-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'show_minion_between_players' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 12
      },
      {
        id: 'chef',
        name: 'Chef',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'chef-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'count_evil_neighbors' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 13
      },
      {
        id: 'empath',
        name: 'Empath',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'empath-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'count_evil_neighbors' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 20
      },
      {
        id: 'fortune-teller',
        name: 'Fortune Teller',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'fortune-teller-info',
          when: 'night',
          target: 'two_players',
          effect: [{ type: 'check_if_demon' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 21
      },
      {
        id: 'undertaker',
        name: 'Undertaker',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'undertaker-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'show_executed_role' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 22
      },
      {
        id: 'monk',
        name: 'Monk',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'monk-protect',
          when: 'night',
          target: 'seat!=self & alive',
          effect: [{ type: 'add_status', status: 'protected', nights: 1 }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 23
      },
      {
        id: 'ravenkeeper',
        name: 'Ravenkeeper',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'ravenkeeper-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'show_role_if_dead' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 24
      },
      {
        id: 'virgin',
        name: 'Virgin',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'virgin-execution',
          when: 'day',
          target: 'any',
          effect: [{ type: 'execute_nominator_if_townsfolk' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 25
      },
      {
        id: 'slayer',
        name: 'Slayer',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'slayer-kill',
          when: 'day',
          target: 'seat!=self & alive',
          effect: [{ type: 'kill_if_demon' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 26
      },
      {
        id: 'soldier',
        name: 'Soldier',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'soldier-protect',
          when: 'passive',
          target: 'self',
          effect: [{ type: 'demon_kill_immunity' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 27
      },
      {
        id: 'mayor',
        name: 'Mayor',
        alignment: Alignment.GOOD,
        type: RoleType.TOWNSFOLK,
        ability: {
          id: 'mayor-bounce',
          when: 'passive',
          target: 'self',
          effect: [{ type: 'execution_bounce_if_no_other_deaths' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 28
      },
      // Outsiders
  // Recluse (single definition)
      {
        id: 'drunk',
        name: 'Drunk',
        alignment: Alignment.GOOD,
        type: RoleType.OUTSIDER,
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 101
      },
      {
        id: 'saint',
        name: 'Saint',
        alignment: Alignment.GOOD,
        type: RoleType.OUTSIDER,
        ability: {
          id: 'saint-execution',
          when: 'day',
          target: 'self',
          effect: [{ type: 'good_team_loses_if_executed' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 102
      },
      {
        id: 'recluse',
        name: 'Recluse',
        alignment: Alignment.GOOD,
        type: RoleType.OUTSIDER,
        ability: {
          id: 'recluse-registeration',
          when: 'passive',
          target: 'self',
          effect: [{ type: 'may_register_as_evil' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 103
      },
      // Minions
      {
        id: 'poisoner',
        name: 'Poisoner',
        alignment: Alignment.EVIL,
        type: RoleType.MINION,
        ability: {
          id: 'poison',
          when: 'night',
          target: 'seat!=self & alive',
          effect: [{ type: 'add_status', status: 'poisoned', nights: 1 }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 40
      },
      {
        id: 'spy',
        name: 'Spy',
        alignment: Alignment.EVIL,
        type: RoleType.MINION,
        ability: {
          id: 'spy-info',
          when: 'night',
          target: 'any',
          effect: [{ type: 'see_grimoire' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 41
      },
      {
        id: 'scarlet-woman',
        name: 'Scarlet Woman',
        alignment: Alignment.EVIL,
        type: RoleType.MINION,
        ability: {
          id: 'scarlet-woman-transform',
          when: 'passive',
          target: 'self',
          effect: [{ type: 'become_demon_if_demon_dies' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 42
      },
      {
        id: 'butler',
        name: 'Butler',
        alignment: Alignment.GOOD,
        type: RoleType.OUTSIDER,
        ability: {
          id: 'butler-vote',
          when: 'day',
          target: 'any',
          effect: [{ type: 'must_vote_with_master' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 104
      },
      {
        id: 'baron',
        name: 'Baron',
        alignment: Alignment.EVIL,
        type: RoleType.MINION,
        ability: {
          id: 'baron-setup',
          when: 'passive',
          target: 'setup',
          effect: [{ type: 'modify_setup', add_outsiders: 2, remove_townsfolk: 2 }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 44,
        reminderTokens: ['Setup modification']
      },
      // Demon
      {
        id: 'imp',
        name: 'Imp',
        alignment: Alignment.EVIL,
        type: RoleType.DEMON,
        ability: {
          id: 'imp-kill',
          when: 'night',
          target: 'seat!=self & alive',
          effect: [{ type: 'kill' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 50
      }
    ];

    return {
      id: 'trouble-brewing',
      name: 'Trouble Brewing',
      version: '1.0.0',
      roles,
      setup: {
        playerCount: {
          min: 5,
          max: 15
        },
        distribution: {
          [RoleType.TOWNSFOLK]: 0,
          [RoleType.OUTSIDER]: 0,
          [RoleType.MINION]: 0,
          [RoleType.DEMON]: 1
        }
      }
    };
  }
}
