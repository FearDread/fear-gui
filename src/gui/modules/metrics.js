import { createGUI } from "../core/gui";
const FEAR = createGUI();
/**
 * Performance Metrics Module
 * Monitors route loading times, cache performance, and module lifecycle events
 */
export const Metrics = FEAR.create('Metrics', ($GUI) => {
  // Private state
  let monitor = null;
  let metricsInterval = null;
  let $metricsDisplay = null;

  // Performance Monitor Factory Function
  const createPerformanceMonitor = (enabled = true) => {
    const state = {
      enabled,
      metrics: {
        routeLoadTimes: new Map(),
        moduleLoadTimes: new Map(),
        totalRoutes: 0,
        totalModules: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0,
        startTime: Date.now()
      },
      timings: new Map()
    };

    const startTiming = (key) => {
      if (!state.enabled) return null;
      const startTime = performance.now();
      state.timings.set(key, startTime);
      return startTime;
    };

    const endTiming = (key) => {
      if (!state.enabled || !state.timings.has(key)) return 0;
      
      const startTime = state.timings.get(key);
      const duration = performance.now() - startTime;
      
      // Store the timing based on key type
      if (key.startsWith('route:')) {
        state.metrics.routeLoadTimes.set(key, duration);
        state.metrics.totalRoutes++;
      } else if (key.startsWith('module:')) {
        state.metrics.moduleLoadTimes.set(key, duration);
        state.metrics.totalModules++;
      }
      
      state.timings.delete(key);
      return duration;
    };

    const recordCacheHit = () => {
      if (state.enabled) {
        state.metrics.cacheHits++;
      }
    };

    const recordCacheMiss = () => {
      if (state.enabled) {
        state.metrics.cacheMisses++;
      }
    };

    const recordError = (error) => {
      if (state.enabled) {
        state.metrics.errors++;
        $GUI.log('Error recorded:', error);
      }
    };

    const getCacheHitRate = () => {
      const total = state.metrics.cacheHits + state.metrics.cacheMisses;
      return total > 0 ? (state.metrics.cacheHits / total * 100).toFixed(2) : 0;
    };

    const getAverageLoadTime = (type) => {
      const times = type === 'route' 
        ? state.metrics.routeLoadTimes 
        : state.metrics.moduleLoadTimes;
      
      if (times.size === 0) return 0;
      
      const sum = Array.from(times.values()).reduce((a, b) => a + b, 0);
      return (sum / times.size).toFixed(2);
    };

    const getMetrics = () => {
      return {
        ...state.metrics,
        routeLoadTimes: Array.from(state.metrics.routeLoadTimes.entries()),
        moduleLoadTimes: Array.from(state.metrics.moduleLoadTimes.entries()),
        uptime: Date.now() - state.metrics.startTime,
        cacheHitRate: getCacheHitRate(),
        averageRouteLoadTime: getAverageLoadTime('route'),
        averageModuleLoadTime: getAverageLoadTime('module')
      };
    };

    const reset = () => {
      state.metrics = {
        routeLoadTimes: new Map(),
        moduleLoadTimes: new Map(),
        totalRoutes: 0,
        totalModules: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0,
        startTime: Date.now()
      };
      state.timings.clear();
    };

    return {
      startTiming,
      endTiming,
      recordCacheHit,
      recordCacheMiss,
      recordError,
      getMetrics,
      getCacheHitRate,
      getAverageLoadTime,
      reset
    };
  };

  // Private helper functions
  const updateMetricsDisplay = () => {
    if (!$metricsDisplay || !monitor) return;

    const metrics = monitor.getMetrics();
    
    const html = `
      <div class="metrics-panel">
        <h3>Performance Metrics</h3>
        <div class="metric-item">
          <span class="label">Uptime:</span>
          <span class="value">${formatUptime(metrics.uptime)}</span>
        </div>
        <div class="metric-item">
          <span class="label">Total Routes:</span>
          <span class="value">${metrics.totalRoutes}</span>
        </div>
        <div class="metric-item">
          <span class="label">Total Modules:</span>
          <span class="value">${metrics.totalModules}</span>
        </div>
        <div class="metric-item">
          <span class="label">Avg Route Load:</span>
          <span class="value">${metrics.averageRouteLoadTime}ms</span>
        </div>
        <div class="metric-item">
          <span class="label">Avg Module Load:</span>
          <span class="value">${metrics.averageModuleLoadTime}ms</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Hit Rate:</span>
          <span class="value">${metrics.cacheHitRate}%</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Hits:</span>
          <span class="value">${metrics.cacheHits}</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Misses:</span>
          <span class="value">${metrics.cacheMisses}</span>
        </div>
        <div class="metric-item">
          <span class="label">Errors:</span>
          <span class="value">${metrics.errors}</span>
        </div>
      </div>
    `;
    
    $metricsDisplay.html(html);
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Module public interface
  return {
    /**
     * Initialize the metrics module
     */
    load: (options = {}) => {
      $GUI.log('Metrics module loading with options:', options);

      // Create performance monitor
      monitor = createPerformanceMonitor(options.enabled !== false);

      // Set up event listeners for performance tracking
      $GUI.add('route:start', (data) => {
        const routeKey = `route:${data.path || 'unknown'}`;
        monitor.startTiming(routeKey);
        $GUI.log('Route started:', routeKey);
      });

      $GUI.add('route:complete', (data) => {
        const routeKey = `route:${data.path || 'unknown'}`;
        const duration = monitor.endTiming(routeKey);
        $GUI.log(`Route completed: ${routeKey} in ${duration}ms`);
        
        // Emit metrics update
        $GUI.emit('metrics:updated', monitor.getMetrics());
      });

      $GUI.add('module:start', (data) => {
        const moduleKey = `module:${data.name || 'unknown'}`;
        monitor.startTiming(moduleKey);
        $GUI.log('Module started:', moduleKey);
      });

      $GUI.add('module:complete', (data) => {
        const moduleKey = `module:${data.name || 'unknown'}`;
        const duration = monitor.endTiming(moduleKey);
        $GUI.log(`Module loaded: ${moduleKey} in ${duration}ms`);
        
        // Emit metrics update
        $GUI.emit('metrics:updated', monitor.getMetrics());
      });

      $GUI.add('cache:hit', () => {
        monitor.recordCacheHit();
      });

      $GUI.add('cache:miss', () => {
        monitor.recordCacheMiss();
      });

      $GUI.add('error', (error) => {
        monitor.recordError(error);
      });

      // Optional UI display
      if (options.displayMetrics) {
        $metricsDisplay = $GUI.$('#metrics-display');
        
        if ($metricsDisplay.length === 0) {
          // Create metrics display if it doesn't exist
          $metricsDisplay = $GUI.$('<div id="metrics-display"></div>');
          $GUI.$('body').append($metricsDisplay);
        }

        // Update display periodically
        const updateInterval = options.updateInterval || 5000;
        metricsInterval = setInterval(() => {
          updateMetricsDisplay();
        }, updateInterval);
      }

      // Expose public API on $GUI
      $GUI.metrics = {
        start: (key) => monitor.startTiming(key),
        end: (key) => monitor.endTiming(key),
        cacheHit: () => monitor.recordCacheHit(),
        cacheMiss: () => monitor.recordCacheMiss(),
        recordError: (error) => monitor.recordError(error),
        get: () => monitor.getMetrics(),
        reset: () => monitor.reset()
      };

      $GUI.log('Metrics module loaded successfully');
      return Promise.resolve();
    },

    /**
     * Unload the metrics module
     */
    unload: () => {
      $GUI.log('Metrics module unloading');

      // Clear interval
      if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
      }

      // Remove UI display
      if ($metricsDisplay) {
        $metricsDisplay.remove();
        $metricsDisplay = null;
      }

      // Clean up $GUI API
      delete $GUI.metrics;

      return Promise.resolve();
    },

    /**
     * Destroy the metrics module
     */
    destroy: () => {
      $GUI.log('Metrics module destroying');
      
      if (monitor) {
        monitor.reset();
        monitor = null;
      }
    },

    /**
     * Get current metrics snapshot
     */
    getSnapshot: () => {
      return monitor ? monitor.getMetrics() : null;
    },

    /**
     * Reset all metrics
     */
    reset: () => {
      if (monitor) {
        monitor.reset();
        $GUI.emit('metrics:reset');
        $GUI.log('Metrics reset');
      }
    }
  };
}, {
  // Default module options
  enabled: true,
  displayMetrics: false,
  updateInterval: 5000
});

export default Metrics;