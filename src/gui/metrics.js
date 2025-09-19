
  // Performance Monitor
  class PerformanceMonitor {
    constructor(enabled) {
      this.enabled = enabled;
      this.metrics = {
        routeLoadTimes: new Map(),
        totalRoutes: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }

    startTiming(key) {
      if (!this.enabled) return null;
      return performance.now();
    }

    endTiming(key, startTime) {
      if (!this.enabled || !startTime) return 0;
      const duration = performance.now() - startTime;
      this.metrics.routeLoadTimes.set(key, duration);
      return duration;
    }

    recordCacheHit() {
      if (this.enabled) this.metrics.cacheHits++;
    }

    recordCacheMiss() {
      if (this.enabled) this.metrics.cacheMisses++;
    }

    getMetrics() {
      return { ...this.metrics };
    }
  }