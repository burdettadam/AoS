import { GameStateService } from "../services/GameStateService.js";
import { JournalService } from "../services/JournalService.js";
import { NPCProfileService } from "../services/NPCProfileService.js";

// Tool handler functions for use in main server
export async function handleGameTools(
  toolName: string,
  args: any,
  gameStateService: GameStateService,
) {
  switch (toolName) {
    case "get_game_state": {
      const gameArgs = args as { gameId: string };
      return await gameStateService.getGameState(gameArgs.gameId);
    }

    case "get_player_info": {
      const playerArgs = args as { gameId: string; playerId: string };
      return await gameStateService.getPlayerInfo(
        playerArgs.gameId,
        playerArgs.playerId,
      );
    }

    case "get_voting_history": {
      const votingArgs = args as { gameId: string; day?: number };
      return await gameStateService.getVotingHistory(
        votingArgs.gameId,
        votingArgs.day,
      );
    }

    case "get_character_info": {
      const charArgs = args as { characterId: string };
      return await gameStateService.getCharacterInfo(charArgs.characterId);
    }

    default:
      return null; // Not handled by this module
  }
}

export async function handleProfileTools(
  toolName: string,
  args: any,
  profileService: NPCProfileService,
) {
  switch (toolName) {
    case "get_npc_profile": {
      const profileArgs = args as { profileId: string };
      return await profileService.getProfile(profileArgs.profileId);
    }

    case "list_npc_profiles":
      return await profileService.listProfiles();

    case "update_npc_behavior": {
      const updateArgs = args as {
        profileId: string;
        updates: Record<string, any>;
      };
      return await profileService.updateBehavior(
        updateArgs.profileId,
        updateArgs.updates,
      );
    }

    default:
      return null; // Not handled by this module
  }
}

export async function handleJournalTools(
  toolName: string,
  args: any,
  journalService: JournalService,
) {
  switch (toolName) {
    case "get_journal_entries": {
      const entriesArgs = args as {
        gameId: string;
        playerId?: string;
        entryType?: string;
      };
      return await journalService.getEntries(
        entriesArgs.gameId,
        entriesArgs.playerId,
        entriesArgs.entryType,
      );
    }

    case "add_journal_entry": {
      const addArgs = args as {
        gameId: string;
        playerId: string;
        type: string;
        content: string;
        metadata?: Record<string, any>;
      };
      return await journalService.addEntry(addArgs.gameId, addArgs.playerId, {
        type: addArgs.type as any,
        content: addArgs.content,
        metadata: addArgs.metadata || {},
      });
    }

    case "get_decision_history": {
      const decisionArgs = args as { gameId: string; playerId: string };
      return await journalService.getPlayerDecisionHistory(
        decisionArgs.gameId,
        decisionArgs.playerId,
      );
    }

    case "get_suspicion_network": {
      const suspicionArgs = args as { gameId: string };
      return await journalService.getSuspicionNetwork(suspicionArgs.gameId);
    }

    default:
      return null; // Not handled by this module
  }
}
