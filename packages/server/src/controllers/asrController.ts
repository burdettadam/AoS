import { FastifyRequest, FastifyReply } from 'fastify';
import { ASRService } from '../services/asrService';
import { PTTSession, GameEvent } from '@botc/shared';
import { logger } from '../utils/logger';

const asrService = new ASRService();

interface StreamAudioBody {
  audioData: string; // base64 encoded audio
  sessionId: string;
  seatId: string;
}

interface SummarizePhaseBody {
  turns: PTTSession[];
  events: GameEvent[];
  viewerRole: string;
  phase: string;
}

export class ASRController {
  /**
   * Stream audio for ASR processing
   */
  static async streamAudio(request: FastifyRequest<{ Body: StreamAudioBody }>, reply: FastifyReply) {
    try {
      const { audioData, sessionId, seatId } = request.body;

      if (!audioData || !sessionId || !seatId) {
        reply.code(400);
        return { error: 'audioData, sessionId, and seatId are required' };
      }

      // Process the audio stream
      const result = await asrService.processAudioStream(audioData, sessionId, seatId);

      // Extract game events from transcript
      if (result.transcript) {
        const events = asrService.extractGameEvents(result.transcript, seatId);
        if (events.length > 0) {
          // TODO: Get gameId from session or request
          const gameId = 'mock-game-id'; // Placeholder
          asrService.storeEvents(gameId, events);
        }
      }

      reply.code(200);
      return {
        transcript: result.transcript,
        wordLevelTranscript: result.wordLevelTranscript,
        confidence: result.confidence,
        eventsExtracted: result.transcript ? asrService.extractGameEvents(result.transcript, seatId).length : 0
      };
    } catch (error) {
      logger.error('Error in streamAudio:', error);
      reply.code(500);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Generate summary for phase transition
   */
  static async summarizePhase(request: FastifyRequest<{ Body: SummarizePhaseBody }>, reply: FastifyReply) {
    try {
      const { turns, events, viewerRole, phase } = request.body;

      if (!turns || !events || !viewerRole || !phase) {
        reply.code(400);
        return { error: 'turns, events, viewerRole, and phase are required' };
      }

      // Generate summary
      const summaryRequest = { turns, events, viewerRole, phase };
      const summary = await asrService.generateSummary(summaryRequest);

      // Redact for non-storyteller players
      const redactedSummary = asrService.redactForPlayer(summary, viewerRole);

      reply.code(200);
      return redactedSummary;
    } catch (error) {
      logger.error('Error in summarizePhase:', error);
      reply.code(500);
      return { error: 'Internal server error' };
    }
  }
}
