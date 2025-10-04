import { GameEvent, PTTSession } from "@ashes-of-salem/shared";
import { ASRService } from "../src/services/asrService";

describe("ASRService", () => {
  let asrService: ASRService;

  beforeEach(() => {
    asrService = new ASRService();
  });

  describe("processAudioStream", () => {
    it("should process audio data and return transcript", async () => {
      const audioData = "mock-base64-audio-data";
      const sessionId = "test-session-id";
      const seatId = "test-seat-id";

      const result = await asrService.processAudioStream(
        audioData,
        sessionId,
        seatId,
      );

      expect(result).toHaveProperty("transcript");
      expect(result).toHaveProperty("wordLevelTranscript");
      expect(result).toHaveProperty("confidence");
      expect(typeof result.transcript).toBe("string");
      expect(Array.isArray(result.wordLevelTranscript)).toBe(true);
      expect(typeof result.confidence).toBe("number");
    });
  });

  describe("extractGameEvents", () => {
    it("should extract nomination events", () => {
      const transcript = "I nominate player 3 for execution";
      const seatId = "test-seat-id";

      const events = asrService.extractGameEvents(transcript, seatId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("nomination");
      expect(events[0].seatId).toBe(seatId);
      expect(events[0].content).toBe(transcript);
    });

    it("should extract vote events", () => {
      const transcript = "I vote guilty";
      const seatId = "test-seat-id";

      const events = asrService.extractGameEvents(transcript, seatId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("vote");
      expect(events[0].seatId).toBe(seatId);
    });

    it("should extract claim events", () => {
      const transcript = "I claim to be the fortune teller";
      const seatId = "test-seat-id";

      const events = asrService.extractGameEvents(transcript, seatId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("claim");
      expect(events[0].seatId).toBe(seatId);
    });

    it("should extract contradiction events", () => {
      const transcript = "Actually, I think I was wrong about that";
      const seatId = "test-seat-id";

      const events = asrService.extractGameEvents(transcript, seatId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("contradiction");
      expect(events[0].seatId).toBe(seatId);
    });

    it("should return empty array for irrelevant transcript", () => {
      const transcript = "Hello everyone, how are you doing?";
      const seatId = "test-seat-id";

      const events = asrService.extractGameEvents(transcript, seatId);

      expect(events).toHaveLength(0);
    });
  });

  describe("generateSummary", () => {
    it("should generate summary with highlights and watchlist", async () => {
      const mockRequest = {
        turns: [
          {
            id: "turn-1",
            seatId: "seat-1",
            startTime: new Date(),
            transcript: "I nominate player 2",
          } as PTTSession,
        ],
        events: [
          {
            id: "event-1",
            type: "nomination" as const,
            seatId: "seat-1",
            timestamp: new Date(),
            content: "I nominate player 2",
            confidence: 0.9,
          },
        ],
        viewerRole: "player",
        phase: "day",
      };

      const summary = await asrService.generateSummary(mockRequest);

      expect(summary).toHaveProperty("highlights");
      expect(summary).toHaveProperty("watchlist");
      expect(summary).toHaveProperty("summary");
      expect(Array.isArray(summary.highlights)).toBe(true);
      expect(Array.isArray(summary.watchlist)).toBe(true);
      expect(typeof summary.summary).toBe("string");
    });
  });

  describe("redactForPlayer", () => {
    it("should redact night information for players", () => {
      const summary = {
        highlights: ["Night action detected", "Demon was active"],
        watchlist: [
          {
            seatId: "seat-1",
            reason: "Suspicious night activity",
            priority: "high" as const,
          },
        ],
        summary: "During night phase, the demon killed someone",
      };

      const redacted = asrService.redactForPlayer(summary, "player");

      expect(redacted.highlights).not.toContain("Night action detected");
      expect(redacted.highlights).not.toContain("Demon was active");
      expect(redacted.watchlist).toHaveLength(0);
      expect(redacted.summary).toContain("[REDACTED]");
    });

    it("should not redact for storyteller", () => {
      const summary = {
        highlights: ["Night action detected"],
        watchlist: [
          {
            seatId: "seat-1",
            reason: "Suspicious night activity",
            priority: "high" as const,
          },
        ],
        summary: "During night phase, the demon killed someone",
      };

      const redacted = asrService.redactForPlayer(summary, "storyteller");

      expect(redacted.highlights).toContain("Night action detected");
      expect(redacted.watchlist).toHaveLength(1);
      expect(redacted.summary).toContain("demon");
    });
  });

  describe("storeSession and getRecentData", () => {
    it("should store and retrieve session data", () => {
      const session: PTTSession = {
        id: "session-1",
        seatId: "game-1-seat-1", // Include game ID in seat ID for matching
        startTime: new Date(),
        transcript: "Test transcript",
      };

      asrService.storeSession(session);
      const data = asrService.getRecentData("game-1");

      expect(data.turns).toHaveLength(1);
      expect(data.turns[0].id).toBe(session.id);
    });
  });

  describe("storeEvents and getRecentData", () => {
    it("should store and retrieve game events", () => {
      const events: GameEvent[] = [
        {
          id: "event-1",
          type: "nomination",
          seatId: "seat-1",
          timestamp: new Date(),
          content: "I nominate player 2",
          confidence: 0.9,
        },
      ];

      asrService.storeEvents("game-1", events);
      const data = asrService.getRecentData("game-1");

      expect(data.events).toHaveLength(1);
      expect(data.events[0].id).toBe(events[0].id);
    });
  });
});
