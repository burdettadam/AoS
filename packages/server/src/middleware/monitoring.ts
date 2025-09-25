import { FastifyReply, FastifyRequest } from "fastify";
import { HealthController } from "../controllers/health";
import { logger } from "../utils/logger";

export interface MonitoringMiddleware {
  requestTracking: (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ) => void;
  errorTracking: (
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void;
}

export const createMonitoringMiddleware = (): MonitoringMiddleware => {
  return {
    requestTracking: (
      request: FastifyRequest,
      reply: FastifyReply,
      done: () => void,
    ) => {
      const startTime = Date.now();

      // Track request start
      HealthController.incrementRequestCount();

      // Log request details
      logger.info(`${request.method} ${request.url}`, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
        method: request.method,
        url: request.url,
      });

      // Simple response time logging (without hooks)
      const originalSend = reply.send.bind(reply);
      reply.send = function (payload: any) {
        const responseTime = Date.now() - startTime;
        logger.info(
          `Response: ${reply.statusCode || 200} in ${responseTime}ms`,
        );
        return originalSend(payload);
      };

      done();
    },

    errorTracking: (
      error: Error,
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      // Track error
      HealthController.incrementErrorCount();

      // Log error with context
      logger.error("Request error occurred:", {
        error: error.message,
        stack: error.stack,
        method: request.method,
        url: request.url,
        ip: request.ip,
        statusCode: reply.statusCode,
      });
    },
  };
};

// WebSocket connection tracking
export const trackWebSocketConnection = (increment: boolean) => {
  // This would be called from the WebSocket handler
  logger.info(`WebSocket connection ${increment ? "opened" : "closed"}`);
};
