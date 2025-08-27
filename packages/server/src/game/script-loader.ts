import { Script, RoleDefinition, RoleType, Alignment } from '@botc/shared';
import { logger } from '../utils/logger';

export class ScriptLoader {
  private scripts: Map<string, Script> = new Map();

  constructor() {
    this.loadDefaultScripts();
  }

  async loadScript(scriptId: string): Promise<Script | null> {
    const script = this.scripts.get(scriptId);
    if (!script) {
      logger.error(`Script not found: ${scriptId}`);
      return null;
    }
    return script;
  }

  listScripts(): Array<{ id: string; name: string; version: string }> {
    return Array.from(this.scripts.values()).map(s => ({ id: s.id, name: s.name, version: s.version }));
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
      {
        id: 'recluse',
        name: 'Recluse',
        alignment: Alignment.GOOD,
        type: RoleType.OUTSIDER,
        visibility: {
          reveals: {
            public: 'none',
            privateTo: []
          }
        },
        precedence: 100
      },
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
        alignment: Alignment.EVIL,
        type: RoleType.MINION,
        ability: {
          id: 'butler-vote',
          when: 'day',
          target: 'any',
          effect: [{ type: 'must_vote_with_master' }]
        },
        visibility: {
          reveals: {
            public: 'none',
            privateTo: ['evil']
          }
        },
        precedence: 43
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
