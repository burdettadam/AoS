import { FastifyReply, FastifyRequest } from "fastify";
import { scriptCache } from "../services/scriptCache";
import { logger } from "../utils/logger";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: { status: "up" | "down"; responseTime?: number };
    cache: {
      status: "up" | "down";
      scriptCount?: number;
      totalCharacters?: number;
    };
    websocket: { status: "up" | "down"; activeConnections?: number };
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    process: {
      pid: number;
      uptime: number;
    };
  };
}

// Simple in-memory metrics store
const metricsStore = {
  requestCount: 0,
  errorCount: 0,
  websocketConnections: 0,
  lastRequestTime: Date.now(),
  startTime: Date.now(),
};

export class HealthController {
  static incrementRequestCount() {
    metricsStore.requestCount++;
    metricsStore.lastRequestTime = Date.now();
  }

  static incrementErrorCount() {
    metricsStore.errorCount++;
  }

  static setWebSocketConnections(count: number) {
    metricsStore.websocketConnections = count;
  }

  static async getHealth(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      // Check service health
      const cacheHealth = await HealthController.checkCacheHealth();
      const wsHealth = HealthController.checkWebSocketHealth();

      // Calculate memory metrics
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal + memUsage.external;
      const usedMemory = memUsage.heapUsed;

      const health: HealthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - metricsStore.startTime) / 1000),
        version: process.env.npm_package_version || "1.0.0",
        services: {
          database: { status: "up" }, // In-memory for now
          cache: cacheHealth,
          websocket: wsHealth,
        },
        metrics: {
          memory: {
            used: Math.round(usedMemory / 1024 / 1024), // MB
            total: Math.round(totalMemory / 1024 / 1024), // MB
            percentage: Math.round((usedMemory / totalMemory) * 100),
          },
          process: {
            pid: process.pid,
            uptime: Math.floor(process.uptime()),
          },
        },
      };

      // Determine overall health status
      const serviceStatuses = Object.values(health.services).map(
        (s) => s.status,
      );
      if (serviceStatuses.includes("down")) {
        health.status = "unhealthy";
        reply.code(503);
      } else if (health.metrics.memory.percentage > 90) {
        health.status = "degraded";
        reply.code(200);
      }

      const responseTime = Date.now() - startTime;
      logger.info(
        `Health check completed in ${responseTime}ms - Status: ${health.status}`,
      );

      return reply.send(health);
    } catch (error) {
      logger.error("Health check failed:", error);
      return reply.code(503).send({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      });
    }
  }

  static async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        http: {
          requests_total: metricsStore.requestCount,
          errors_total: metricsStore.errorCount,
          last_request_time: new Date(
            metricsStore.lastRequestTime,
          ).toISOString(),
        },
        websocket: {
          active_connections: metricsStore.websocketConnections,
        },
        system: {
          uptime_seconds: Math.floor(process.uptime()),
          memory_usage_bytes: process.memoryUsage(),
          cpu_usage: process.cpuUsage(),
        },
        application: {
          start_time: new Date(metricsStore.startTime).toISOString(),
          version: process.env.npm_package_version || "1.0.0",
        },
      };

      return reply.header("Content-Type", "application/json").send(metrics);
    } catch (error) {
      logger.error("Metrics collection failed:", error);
      return reply.code(500).send({
        error: "Metrics collection failed",
      });
    }
  }

  static async getReadiness(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if all critical services are ready
      const cacheReady = scriptCache.isInitialized();

      if (cacheReady) {
        return reply.send({
          status: "ready",
          timestamp: new Date().toISOString(),
          checks: {
            scriptCache: "ready",
          },
        });
      } else {
        return reply.code(503).send({
          status: "not-ready",
          timestamp: new Date().toISOString(),
          checks: {
            scriptCache: "not-ready",
          },
        });
      }
    } catch (error) {
      logger.error("Readiness check failed:", error);
      return reply.code(503).send({
        status: "not-ready",
        timestamp: new Date().toISOString(),
        error: "Readiness check failed",
      });
    }
  }

  private static async checkCacheHealth() {
    try {
      const stats = scriptCache.getStats();
      return {
        status: "up" as const,
        scriptCount: stats.scriptCount,
        totalCharacters: stats.totalCharacters,
      };
    } catch (error) {
      return { status: "down" as const };
    }
  }

  private static checkWebSocketHealth() {
    return {
      status: "up" as const,
      activeConnections: metricsStore.websocketConnections,
    };
  }
}
