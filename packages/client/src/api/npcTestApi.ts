/**
 * NPC Agent Test API
 * API functions for testing NPC agents with enhanced behavioral systems
 */

export interface NPCTestRequest {
  profileId: string;
  message: string;
  context?: {
    gamePhase?: "day" | "night" | "voting" | "discussion";
    previousMessages?: Array<{
      sender: "user" | "npc";
      content: string;
      timestamp: Date;
    }>;
  };
}

export interface NPCTestResponse {
  response: string;
  reasoning?: string;
  confidence?: number;
  usedFallacies?: string[];
  fourthWallBreaking?: boolean;
  metadata?: {
    profileName: string;
    characterName: string;
    gameDay: number;
    processingTime: number;
    actionType: string;
  };
}

export interface NPCSessionContext {
  sessionId: string;
  profileId: string;
  character?: string;
  characterTeam?: string;
  seatName?: string;
  gameDay?: number;
  aliveCount?: number;
  messageHistory: Array<{
    id: string;
    sender: "user" | "npc";
    content: string;
    timestamp: Date;
  }>;
}

/**
 * Start a new NPC test session
 */
export async function startNPCTestSession(
  profileId: string,
): Promise<NPCSessionContext> {
  const response = await fetch("/api/ai/npc-test/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start NPC session: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    sessionId: data.sessionId,
    profileId,
    messageHistory: [],
  };
}

/**
 * Send a message to the NPC agent
 */
export async function sendMessageToNPC(
  sessionId: string,
  request: NPCTestRequest,
): Promise<NPCTestResponse> {
  const response = await fetch("/api/ai/npc-test/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      ...request,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message to NPC: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get NPC session history
 */
export async function getNPCSessionHistory(
  sessionId: string,
): Promise<NPCSessionContext> {
  const response = await fetch(`/api/ai/npc-test/session/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get session history: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * End NPC test session
 */
export async function endNPCTestSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/ai/npc-test/session/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to end session: ${response.statusText}`);
  }
}
