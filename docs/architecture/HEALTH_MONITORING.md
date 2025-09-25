# Health Monitoring & Observability

This document outlines the comprehensive health monitoring and observability system implemented for the BotC server.

## Overview

The health monitoring system provides multiple endpoints for different monitoring needs, following Kubernetes and cloud-native best practices for health checks and observability.

## Health Endpoints

### `/health` - Comprehensive Health Status

**Purpose**: Detailed health assessment for monitoring dashboards and alerting systems.

**Response Format**:

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-09-24T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": { "status": "up" },
    "cache": {
      "status": "up",
      "scriptCount": 12,
      "totalCharacters": 180
    },
    "websocket": {
      "status": "up",
      "activeConnections": 5
    }
  },
  "metrics": {
    "memory": {
      "used": 128,
      "total": 512,
      "percentage": 25
    },
    "process": {
      "pid": 12345,
      "uptime": 3600
    }
  }
}
```

**Status Codes**:

- `200` - Healthy or degraded
- `503` - Unhealthy (service failures detected)

**Health Criteria**:

- **Healthy**: All services up, memory < 90%
- **Degraded**: All services up, memory >= 90%
- **Unhealthy**: Any service down

### `/health/ready` - Readiness Probe

**Purpose**: Kubernetes-style readiness probe to determine if the service can accept traffic.

**Response Format**:

```json
{
  "status": "ready|not-ready",
  "timestamp": "2025-09-24T12:00:00.000Z",
  "checks": {
    "scriptCache": "ready"
  }
}
```

**Status Codes**:

- `200` - Ready to serve traffic
- `503` - Not ready (initialization incomplete)

### `/health/live` - Liveness Probe

**Purpose**: Kubernetes-style liveness probe to detect if the application is alive.

**Response Format**:

```json
{
  "status": "alive",
  "timestamp": "2025-09-24T12:00:00.000Z",
  "pid": 12345
}
```

**Status Codes**:

- `200` - Application is alive

### `/metrics` - Application Metrics

**Purpose**: Detailed metrics for monitoring systems and performance analysis.

**Response Format**:

```json
{
  "timestamp": "2025-09-24T12:00:00.000Z",
  "http": {
    "requests_total": 1234,
    "errors_total": 5,
    "last_request_time": "2025-09-24T11:59:55.000Z"
  },
  "websocket": {
    "active_connections": 10
  },
  "system": {
    "uptime_seconds": 3600,
    "memory_usage_bytes": {
      "rss": 134217728,
      "heapTotal": 67108864,
      "heapUsed": 33554432,
      "external": 8388608,
      "arrayBuffers": 1048576
    },
    "cpu_usage": {
      "user": 123456,
      "system": 78910
    }
  },
  "application": {
    "start_time": "2025-09-24T08:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## Monitoring Integration

### Request Tracking

All HTTP requests are automatically tracked with:

- Request count
- Response time logging
- Error rate tracking
- IP and user agent logging

### Error Handling

Comprehensive error tracking includes:

- Error count metrics
- Structured error logging
- Request context preservation
- Stack trace capture

### WebSocket Monitoring

WebSocket connections are monitored for:

- Active connection count
- Connection events (open/close)

## Production Usage

### Docker Health Checks

Add to your Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1
```

### Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: botc-server
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

### Monitoring Setup

#### Prometheus Integration (Future Enhancement)

The metrics endpoint can be extended to provide Prometheus-format metrics:

```javascript
// Example Prometheus metrics format
app_http_requests_total{method="GET",status="200"} 1234
app_websocket_connections_active 10
app_memory_usage_bytes 134217728
```

#### Alerting Rules

Set up alerts based on:

- Health endpoint returns 503 (service down)
- Memory usage > 90% (degraded performance)
- Error rate > 5% (high error rate)
- Response time > 1000ms (slow responses)

## Development Usage

### Local Testing

```bash
# Check overall health
curl http://localhost:3000/health

# Check readiness
curl http://localhost:3000/health/ready

# Check liveness
curl http://localhost:3000/health/live

# Get metrics
curl http://localhost:3000/metrics
```

### Health Status Interpretation

- Use `/health` for comprehensive monitoring dashboards
- Use `/health/ready` for load balancer health checks
- Use `/health/live` for container orchestration
- Use `/metrics` for detailed performance analysis

## Customization

### Adding New Health Checks

To add new service health checks, modify `HealthController`:

```typescript
private static async checkNewServiceHealth() {
  try {
    // Implement your service check
    return { status: 'up' as const, customMetric: 'value' };
  } catch (error) {
    return { status: 'down' as const };
  }
}
```

### Custom Metrics

Add application-specific metrics to the metrics endpoint:

```typescript
// In HealthController.getMetrics()
const metrics = {
  // ... existing metrics
  game: {
    active_games: gameEngine.getActiveGameCount(),
    total_players: gameEngine.getTotalPlayerCount(),
  },
};
```

## Performance Considerations

- Health checks are designed to be fast (<100ms typically)
- Metrics collection uses minimal resources
- Request tracking has negligible performance impact
- All endpoints are stateless and cache-friendly

## Security

- Health endpoints provide minimal sensitive information
- No authentication required for health checks (standard practice)
- Process information limited to non-sensitive data
- Error logs exclude sensitive request data
