export interface AuthenticatedUser {
  username: string;
  displayName: string;
  email: string;
  token?: string;
}

export interface TestFixtures {
  // Auth fixtures
  loginAsUser: (username: string) => Promise<AuthenticatedUser>;
  loginAsStoryteller: () => Promise<AuthenticatedUser>;
  loginAsPlayer: (playerNumber?: number) => Promise<AuthenticatedUser>;
  loginMultipleUsers: (count: number) => Promise<{ users: AuthenticatedUser[]; cleanup: () => Promise<void> }>;
  logout: () => Promise<void>;
  
  // Navigation fixtures
  goToHome: () => Promise<void>;
  goToLobby: (gameId?: string) => Promise<void>;
  goToGame: (gameId: string) => Promise<void>;
  waitForPageLoad: () => Promise<void>;
  
  // Game fixtures
  createGame: (options?: { name?: string; isPublic?: boolean }) => Promise<string>;
  joinGame: (gameId: string) => Promise<void>;
  waitForLobby: () => Promise<void>;
  selectScript: (scriptName: string) => Promise<void>;
}