import {
  ASRSummaryRequest,
  ASRSummaryResponse,
  GameEvent,
  PTTSession,
} from "@ashes-of-salem/shared";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

export class ASRService {
  private sessions: Map<string, PTTSession> = new Map();
  private events: Map<string, GameEvent[]> = new Map();

  /**
   * Process streaming audio data for ASR
   */
  async processAudioStream(
    audioData: string,
    sessionId: string,
    seatId: string,
  ): Promise<{
    transcript?: string;
    wordLevelTranscript?: any[];
    confidence?: number;
  }> {
    try {
      // TODO: Integrate with actual ASR service (e.g., Google Speech-to-Text, Azure Speech, etc.)
      // For now, return mock data
      logger.info(
        `Processing audio stream for session ${sessionId}, seat ${seatId}`,
      );

      // Mock ASR processing
      const mockTranscript = "This is a mock transcript of the audio data";
      const mockWordLevel = [
        { word: "This", start: 0, end: 0.5, confidence: 0.95 },
        { word: "is", start: 0.5, end: 0.8, confidence: 0.92 },
        { word: "a", start: 0.8, end: 0.9, confidence: 0.98 },
        { word: "mock", start: 0.9, end: 1.2, confidence: 0.88 },
        { word: "transcript", start: 1.2, end: 1.8, confidence: 0.91 },
      ];

      return {
        transcript: mockTranscript,
        wordLevelTranscript: mockWordLevel,
        confidence: 0.92,
      };
    } catch (error) {
      logger.error("Error processing audio stream:", error);
      throw error;
    }
  }

  /**
   * Extract game events from transcript
   */
  extractGameEvents(transcript: string, seatId: string): GameEvent[] {
    const events: GameEvent[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Mock event extraction - in real implementation, use NLP/ML
    if (
      lowerTranscript.includes("nominate") ||
      lowerTranscript.includes("i nominate")
    ) {
      events.push({
        id: randomUUID(),
        type: "nomination",
        seatId,
        timestamp: new Date(),
        content: transcript,
        confidence: 0.85,
      });
    }

    if (
      lowerTranscript.includes("vote") ||
      lowerTranscript.includes("i vote")
    ) {
      events.push({
        id: randomUUID(),
        type: "vote",
        seatId,
        timestamp: new Date(),
        content: transcript,
        confidence: 0.9,
      });
    }

    if (lowerTranscript.includes("claim") || lowerTranscript.includes("i am")) {
      events.push({
        id: randomUUID(),
        type: "claim",
        seatId,
        timestamp: new Date(),
        content: transcript,
        confidence: 0.75,
      });
    }

    // Check for contradictions or suspicious statements
    if (
      lowerTranscript.includes("but") ||
      lowerTranscript.includes("however") ||
      lowerTranscript.includes("actually")
    ) {
      events.push({
        id: randomUUID(),
        type: "contradiction",
        seatId,
        timestamp: new Date(),
        content: transcript,
        confidence: 0.6,
      });
    }

    return events;
  }

  /**
   * Generate phase summary and watchlist
   */
  async generateSummary(
    request: ASRSummaryRequest,
  ): Promise<ASRSummaryResponse> {
    try {
      logger.info(`Generating summary for phase ${request.phase}`);

      // Mock summary generation - in real implementation, use LLM
      const highlights = [
        "Key nominations were made during this phase",
        "Several votes were cast with interesting patterns",
        "Some players made claims about their roles",
      ];

      const watchlist = request.events
        .filter((event) => event.confidence && event.confidence > 0.8)
        .slice(0, 3) // Top 3 suspicious events
        .map((event) => ({
          seatId: event.seatId,
          reason: `Suspicious ${event.type} detected`,
          priority:
            event.confidence! > 0.9
              ? ("high" as const)
              : event.confidence! > 0.8
                ? ("medium" as const)
                : ("low" as const),
        }));

      const summary = `During the ${request.phase} phase, ${request.turns.length} speaking turns were recorded and ${request.events.length} game events were detected. The most notable activities included nominations, voting, and role claims.`;

      return {
        highlights,
        watchlist,
        summary,
      };
    } catch (error) {
      logger.error("Error generating summary:", error);
      throw error;
    }
  }

  /**
   * Redact night information from summary for non-storyteller players
   */
  redactForPlayer(
    summary: ASRSummaryResponse,
    viewerRole: string,
  ): ASRSummaryResponse {
    if (viewerRole === "storyteller") {
      return summary; // Storyteller sees everything
    }

    // Redact night-specific information
    return {
      ...summary,
      highlights: summary.highlights.filter(
        (h) =>
          !h.toLowerCase().includes("night") &&
          !h.toLowerCase().includes("demon") &&
          !h.toLowerCase().includes("minion"),
      ),
      watchlist: summary.watchlist.filter(
        (w) => !w.reason.toLowerCase().includes("night"),
      ),
      summary: summary.summary.replace(/night|demon|minion/gi, "[REDACTED]"),
    };
  }

  /**
   * Store session data
   */
  storeSession(session: PTTSession): void {
    this.sessions.set(session.id, session);
  }

  /**
   * Store game events
   */
  storeEvents(gameId: string, events: GameEvent[]): void {
    const existing = this.events.get(gameId) || [];
    this.events.set(gameId, [...existing, ...events]);
  }

  /**
   * Get recent sessions and events for a game
   */
  getRecentData(
    gameId: string,
    limit: number = 50,
  ): { turns: PTTSession[]; events: GameEvent[] } {
    const turns = Array.from(this.sessions.values())
      .filter((s) => s.seatId.startsWith(gameId.slice(0, 8))) // Rough game association
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);

    const events = this.events.get(gameId) || [];

    return { turns, events };
  }
}
