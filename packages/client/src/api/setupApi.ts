import { GameId, SeatId } from '@botc/shared';

export interface SetupApiResponse {
  success: boolean;
  error?: string;
  details?: string[];
  valid?: boolean;
}

export interface SetupStateResponse {
  setupState: any;
  grimoireState: any;
  phase: string;
}

export class SetupApi {
  private static baseUrl = '/api/games';

  static async enterSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<SetupApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${gameId}/setup/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storytellerSeatId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to enter setup' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error entering setup' };
    }
  }

  static async selectCharacters(
    gameId: GameId, 
    storytellerSeatId: SeatId, 
    characterIds: string[]
  ): Promise<SetupApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${gameId}/setup/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storytellerSeatId, characterIds })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to select characters' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error selecting characters' };
    }
  }

  static async validateSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<SetupApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${gameId}/setup/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storytellerSeatId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || 'Setup validation failed',
          details: data.details
        };
      }

      return { success: true, valid: data.valid === true, details: data.details };
    } catch (error) {
      return { success: false, error: 'Network error validating setup' };
    }
  }

  static async completeSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<SetupApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${gameId}/setup/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storytellerSeatId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to complete setup' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error completing setup' };
    }
  }

  static async getSetupState(gameId: GameId): Promise<SetupStateResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${gameId}/setup`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }
}
