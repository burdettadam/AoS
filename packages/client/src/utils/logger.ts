type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  gameId?: string;
}

class Logger {
  private sessionId: string;
  private userId?: string;
  private gameId?: string;
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPeriodicFlush();
    this.setupUnloadHandler();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  setGame(gameId: string) {
    this.gameId = gameId;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      context,
      stack: error?.stack,
      userId: this.userId,
      sessionId: this.sessionId,
      gameId: this.gameId,
    };
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    const entry = this.createLogEntry('error', message, context, error);
    this.addToBuffer(entry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${new Date().toISOString()}] ERROR: ${message}`, context, error);
    }
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, context);
    this.addToBuffer(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${new Date().toISOString()}] WARN: ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, context);
    this.addToBuffer(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${new Date().toISOString()}] INFO: ${message}`, context);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('debug', message, context);
      this.addToBuffer(entry);
      console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, context);
    }
  }

  // Game-specific logging methods
  gameAction(action: string, context?: Record<string, any>) {
    this.info(`Game Action: ${action}`, { ...context, type: 'game_action' });
  }

  performance(metric: string, value: number, context?: Record<string, any>) {
    this.info(`Performance: ${metric}`, { ...context, type: 'performance', value });
  }

  userInteraction(interaction: string, context?: Record<string, any>) {
    this.info(`User Interaction: ${interaction}`, { ...context, type: 'user_interaction' });
  }

  private addToBuffer(entry: LogEntry) {
    this.buffer.push(entry);
    
    // Flush immediately for errors
    if (entry.level === 'error') {
      this.flush();
    }
    
    // Keep buffer size manageable
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // Remove oldest entry
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true,
      });

      if (!response.ok) {
        // Put failed logs back in buffer
        this.buffer.unshift(...logsToSend);
      }
    } catch (error) {
      // Put failed logs back in buffer
      this.buffer.unshift(...logsToSend);
      
      // Only log to console to avoid infinite loop
      console.error('Failed to send logs to server:', error);
    }
  }

  private setupPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private setupUnloadHandler() {
    const handleUnload = () => {
      // Use sendBeacon for more reliable delivery on page unload
      if (this.buffer.length > 0 && 'sendBeacon' in navigator) {
        const payload = JSON.stringify({ logs: this.buffer });
        navigator.sendBeacon('/api/logs', payload);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);
    
    // Also flush when page becomes hidden (mobile optimization)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for TypeScript users
export type { LogLevel, LogEntry };