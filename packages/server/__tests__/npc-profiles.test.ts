import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { GameEngine } from "../src/game/engine";
import { MatchmakingService } from "../src/services/matchmaking";
import { scriptCache } from "../src/services/scriptCache";

// Spin up an ephemeral fastify instance mirroring minimal server setup for route tests
describe("NPC Profiles API", () => {
  const fastify = Fastify({ logger: false });
  let gameId: string;

  beforeAll(async () => {
    await fastify.register(cors, { origin: false } as any);
    await fastify.register(websocket);

    // Initialize script cache for any script dependent logic (safe if already initialized)
    try {
      await scriptCache.initialize();
    } catch (e) {
      // ignore initialization errors in test context
    }

    const gameEngine = new GameEngine();
    const matchmaking = new MatchmakingService(gameEngine);

    // Register only the routes under test copied from server index (simplified)
    fastify.post("/api/games", async () => {
      const id = await matchmaking.createGame(undefined, { isPublic: true });
      return { gameId: id };
    });

    fastify.post("/api/games/:gameId/npc", async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { profileId } = (request.body as any) || {};
      if (profileId && typeof profileId !== "string") {
        reply.code(400);
        return { error: "Invalid profileId" };
      }
      if (profileId) {
        const { PREDEFINED_NPC_PROFILES, STARTER_NPC_PROFILE } = await import(
          "@botc/shared"
        );
        const exists = [STARTER_NPC_PROFILE, ...PREDEFINED_NPC_PROFILES].some(
          (p) => p.id === profileId,
        );
        if (!exists) {
          reply.code(400);
          return { error: "profileId not found" };
        }
      }
      const ok = await matchmaking.addNPC(gameId as any, profileId);
      if (!ok) {
        reply.code(400);
        return { error: "Failed to add NPC" };
      }
      return { ok: true };
    });

    fastify.get("/api/ai/npc-profiles", async (_request, _reply) => {
      try {
        const { PREDEFINED_NPC_PROFILES, STARTER_NPC_PROFILE } = await import(
          "@botc/shared"
        );
        const profiles = [STARTER_NPC_PROFILE, ...PREDEFINED_NPC_PROFILES];
        const previews = profiles.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          avatar: p.avatar,
          difficulty: p.difficulty,
          tags: p.tags,
        }));
        return { ok: true, profiles: previews };
      } catch (err) {
        _reply.code(500);
        return { ok: false, error: "Failed to load profiles" };
      }
    });

    await fastify.ready();
    // Create a game for NPC addition tests
    const res = await fastify.inject({ method: "POST", url: "/api/games" });
    gameId = (JSON.parse(res.payload) as any).gameId;
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("lists NPC profiles including starter profile", async () => {
    const res = await fastify.inject({
      method: "GET",
      url: "/api/ai/npc-profiles",
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.profiles)).toBe(true);
    const ids = body.profiles.map((p: any) => p.id);
    expect(ids).toContain("starter-generic");
  });

  it("rejects invalid profileId when adding NPC", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: `/api/games/${gameId}/npc`,
      payload: { profileId: "does-not-exist" },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error).toMatch(/profileId not found/);
  });

  it("accepts valid starter profileId when adding NPC", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: `/api/games/${gameId}/npc`,
      payload: { profileId: "starter-generic" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.ok).toBe(true);
  });
});
