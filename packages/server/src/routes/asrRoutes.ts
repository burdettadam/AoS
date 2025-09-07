import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ASRController } from '../controllers/asrController';

interface StreamAudioBody {
  audioData: string; // base64 encoded audio
  sessionId: string;
  seatId: string;
}

interface SummarizePhaseBody {
  turns: any[];
  events: any[];
  viewerRole: string;
  phase: string;
  gameId: string;
}

export default async function asrRoutes(fastify: FastifyInstance) {
  // Stream audio for ASR processing
  fastify.post('/asr/stream', async (request: FastifyRequest<{ Body: StreamAudioBody }>, reply: FastifyReply) => {
    return ASRController.streamAudio(request, reply);
  });

  // Get ASR summary for phase transition
  fastify.post('/asr/summarize', async (request: FastifyRequest<{ Body: SummarizePhaseBody }>, reply: FastifyReply) => {
    return ASRController.summarizePhase(request, reply);
  });
}
