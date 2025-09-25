import { FastifyInstance } from "fastify";
import { HealthController } from "../controllers/health";

export default async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint - comprehensive health status
  fastify.get("/health", HealthController.getHealth);

  // Readiness probe - minimal check for container orchestration
  fastify.get("/health/ready", HealthController.getReadiness);

  // Liveness probe - minimal check for container orchestration
  fastify.get("/health/live", async (request, reply) => {
    return reply.send({
      status: "alive",
      timestamp: new Date().toISOString(),
      pid: process.pid,
    });
  });

  // Metrics endpoint
  fastify.get("/metrics", HealthController.getMetrics);
}
