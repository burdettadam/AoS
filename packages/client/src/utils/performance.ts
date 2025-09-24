import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetrics {
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private sessionId: string;
  private endpoint: string;

  constructor(endpoint = '/api/analytics/vitals') {
    this.sessionId = this.generateSessionId();
    this.endpoint = endpoint;
    this.initializeMetrics();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): void {
    // Web Vitals
    getCLS(this.recordMetric.bind(this, 'cls'));
    getFID(this.recordMetric.bind(this, 'fid'));
    getFCP(this.recordMetric.bind(this, 'fcp'));
    getLCP(this.recordMetric.bind(this, 'lcp'));
    getTTFB(this.recordMetric.bind(this, 'ttfb'));

    // Custom game-specific metrics
    this.trackGameMetrics();
    
    // Navigation metrics
    this.trackNavigationTiming();
    
    // Resource metrics
    this.trackResourceTiming();
  }

  private recordMetric(name: keyof PerformanceMetrics, metric: any): void {
    this.metrics[name] = metric.value;
    
    // Send immediately for critical metrics
    if (name === 'cls' || name === 'lcp') {
      this.sendMetrics();
    }
  }

  private trackGameMetrics(): void {
    // Game-specific performance tracking
    this.trackWebSocketLatency();
    this.trackGameStateUpdates();
    this.trackCharacterLoadTimes();
  }

  private trackWebSocketLatency(): void {
    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      const originalWebSocket = window.WebSocket;
      const self = this;
      
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols);
          
          const startTime = performance.now();
          
          this.addEventListener('open', () => {
            const latency = performance.now() - startTime;
            self.recordCustomMetric('wsConnectionTime', latency);
          });
          
          this.addEventListener('message', (event) => {
            const messageTime = performance.now();
            try {
              const data = JSON.parse(event.data);
              if (data.timestamp) {
                const latency = messageTime - data.timestamp;
                self.recordCustomMetric('wsMessageLatency', latency);
              }
            } catch (e) {
              // Not JSON or no timestamp
            }
          });
        }
      };
    }
  }

  private trackGameStateUpdates(): void {
    // Track how long game state updates take to render
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLElement && 
            mutation.target.dataset?.testid?.includes('game-')) {
          const updateTime = performance.now();
          this.recordCustomMetric('gameStateUpdate', updateTime);
        }
      });
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  private trackCharacterLoadTimes(): void {
    // Track character image loading performance
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
          const startTime = performance.now();
          entry.target.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            this.recordCustomMetric('characterImageLoad', loadTime);
          });
        }
      });
    });

    // Observe character images
    document.querySelectorAll('img[data-character]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.recordCustomMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      this.recordCustomMetric('loadComplete', navigation.loadEventEnd - navigation.loadEventStart);
      this.recordCustomMetric('dnsLookup', navigation.domainLookupEnd - navigation.domainLookupStart);
    });
  }

  private trackResourceTiming(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('/api/')) {
          this.recordCustomMetric('apiResponseTime', entry.duration);
        }
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.recordCustomMetric('assetLoadTime', entry.duration);
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private recordCustomMetric(name: string, value: number): void {
    // Store custom metrics
    this.metrics = { ...this.metrics, [`custom_${name}`]: value };
  }

  private sendMetrics(): void {
    const payload: PerformanceMetrics = {
      ...this.metrics,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      cls: this.metrics.cls || null,
      fid: this.metrics.fid || null,
      fcp: this.metrics.fcp || null,
      lcp: this.metrics.lcp || null,
      ttfb: this.metrics.ttfb || null,
    };

    // Send via beacon API (doesn't block page unload)
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
    } else {
      // Fallback for older browsers
      fetch(this.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      }).catch(() => {
        // Ignore errors to avoid affecting user experience
      });
    }
  }

  // Public API for custom tracking
  public trackCustomEvent(name: string, value: number): void {
    this.recordCustomMetric(name, value);
  }

  public trackUserAction(action: string): void {
    this.recordCustomMetric(`userAction_${action}`, performance.now());
  }

  // Initialize on page visibility change
  public initialize(): void {
    // Send metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics();
      }
    });

    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });

    // Send metrics periodically
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Every 30 seconds
  }
}

export default PerformanceMonitor;