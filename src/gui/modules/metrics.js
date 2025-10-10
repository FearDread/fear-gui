import FEAR from "../core/$GUI";
/**
 * Performance Metrics Module
 * Monitors route loading times, cache performance, and module lifecycle events
 */
export const Metrics = FEAR.create('Metrics', function($GUI, options) {
  const metrics = this;
  
  // Private state
  this.monitor = null;
  this.metricsInterval = null;
  this.$metricsDisplay = null;

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

    return {
      startTiming: (key) => {
        if (!state.enabled) return null;
        const startTime = performance.now();
        state.timings.set(key, startTime);
        return startTime;
      },

      endTiming: (key) => {
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
      },

      recordCacheHit: () => {
        if (state.enabled) {
          state.metrics.cacheHits++;
        }
      },

      recordCacheMiss: () => {
        if (state.enabled) {
          state.metrics.cacheMisses++;
        }
      },

      recordError: (error) => {
        if (state.enabled) {
          state.metrics.errors++;
          $GUI.log('Error recorded:', error);
        }
      },

      getCacheHitRate: () => {
        const total = state.metrics.cacheHits + state.metrics.cacheMisses;
        return total > 0 ? (state.metrics.cacheHits / total * 100).toFixed(2) : 0;
      },

      getAverageLoadTime: (type) => {
        const times = type === 'route' 
          ? state.metrics.routeLoadTimes 
          : state.metrics.moduleLoadTimes;
        
        if (times.size === 0) return 0;
        
        const sum = Array.from(times.values()).reduce((a, b) => a + b, 0);
        return (sum / times.size).toFixed(2);
      },

      getMetrics: () => {
        return {
          ...state.metrics,
          routeLoadTimes: Array.from(state.metrics.routeLoadTimes.entries()),
          moduleLoadTimes: Array.from(state.metrics.moduleLoadTimes.entries()),
          uptime: Date.now() - state.metrics.startTime,
          cacheHitRate: state.metrics.cacheHits + state.metrics.cacheMisses > 0 
            ? (state.metrics.cacheHits / (state.metrics.cacheHits + state.metrics.cacheMisses) * 100).toFixed(2) 
            : 0,
          averageRouteLoadTime: state.metrics.routeLoadTimes.size === 0 
            ? 0 
            : (Array.from(state.metrics.routeLoadTimes.values()).reduce((a, b) => a + b, 0) / state.metrics.routeLoadTimes.size).toFixed(2),
          averageModuleLoadTime: state.metrics.moduleLoadTimes.size === 0 
            ? 0 
            : (Array.from(state.metrics.moduleLoadTimes.values()).reduce((a, b) => a + b, 0) / state.metrics.moduleLoadTimes.size).toFixed(2)
        };
      },

      reset: () => {
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
      }
    };
  };

  // Private helper methods
  this._updateMetricsDisplay = () => {
    if (!this.$metricsDisplay || !this.monitor) return;

    const metricsData = this.monitor.getMetrics();
    
    const html = `
      <div class="metrics-panel">
        <h3>Performance Metrics</h3>
        <div class="metric-item">
          <span class="label">Uptime:</span>
          <span class="value">${this._formatUptime(metricsData.uptime)}</span>
        </div>
        <div class="metric-item">
          <span class="label">Total Routes:</span>
          <span class="value">${metricsData.totalRoutes}</span>
        </div>
        <div class="metric-item">
          <span class="label">Total Modules:</span>
          <span class="value">${metricsData.totalModules}</span>
        </div>
        <div class="metric-item">
          <span class="label">Avg Route Load:</span>
          <span class="value">${metricsData.averageRouteLoadTime}ms</span>
        </div>
        <div class="metric-item">
          <span class="label">Avg Module Load:</span>
          <span class="value">${metricsData.averageModuleLoadTime}ms</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Hit Rate:</span>
          <span class="value">${metricsData.cacheHitRate}%</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Hits:</span>
          <span class="value">${metricsData.cacheHits}</span>
        </div>
        <div class="metric-item">
          <span class="label">Cache Misses:</span>
          <span class="value">${metricsData.cacheMisses}</span>
        </div>
        <div class="metric-item">
          <span class="label">Errors:</span>
          <span class="value">${metricsData.errors}</span>
        </div>
      </div>
    `;
    
    this.$metricsDisplay.html(html);
  };

  this._formatUptime = (ms) => {
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
    load: function(options = {}) {
      return Promise.resolve()
        .then(() => {
          $GUI.log('Metrics module loading with options:', options);

          // Create performance monitor
          metrics.monitor = createPerformanceMonitor(options.enabled !== false);

          // Set up event listeners for performance tracking
          $GUI.add('route:start', (data) => {
            const routeKey = `route:${data.path || 'unknown'}`;
            metrics.monitor.startTiming(routeKey);
            $GUI.log('Route started:', routeKey);
          });

          $GUI.add('route:complete', (data) => {
            const routeKey = `route:${data.path || 'unknown'}`;
            const duration = metrics.monitor.endTiming(routeKey);
            $GUI.log(`Route completed: ${routeKey} in ${duration}ms`);
            
            // Emit metrics update
            return $GUI.emit('metrics:updated', metrics.monitor.getMetrics());
          });

          $GUI.add('module:start', (data) => {
            const moduleKey = `module:${data.name || 'unknown'}`;
            metrics.monitor.startTiming(moduleKey);
            $GUI.log('Module started:', moduleKey);
          });

          $GUI.add('module:complete', (data) => {
            const moduleKey = `module:${data.name || 'unknown'}`;
            const duration = metrics.monitor.endTiming(moduleKey);
            $GUI.log(`Module loaded: ${moduleKey} in ${duration}ms`);
            
            // Emit metrics update
            return $GUI.emit('metrics:updated', metrics.monitor.getMetrics());
          });

          $GUI.add('cache:hit', () => {
            metrics.monitor.recordCacheHit();
          });

          $GUI.add('cache:miss', () => {
            metrics.monitor.recordCacheMiss();
          });

          $GUI.add('error', (error) => {
            metrics.monitor.recordError(error);
          });

          // Optional UI display
          if (options.displayMetrics) {
            metrics.$metricsDisplay = $GUI.$('#metrics-display');
            
            if (metrics.$metricsDisplay.length === 0) {
              // Create metrics display if it doesn't exist
              metrics.$metricsDisplay = $GUI.$('<div id="metrics-display"></div>');
              $GUI.$('body').append(metrics.$metricsDisplay);
            }

            // Update display periodically
            const updateInterval = options.updateInterval || 5000;
            metrics.metricsInterval = setInterval(() => {
              metrics._updateMetricsDisplay();
            }, updateInterval);
          }

          // Expose public API on $GUI
          $GUI.metrics = {
            start: (key) => metrics.monitor.startTiming(key),
            end: (key) => metrics.monitor.endTiming(key),
            cacheHit: () => metrics.monitor.recordCacheHit(),
            cacheMiss: () => metrics.monitor.recordCacheMiss(),
            recordError: (error) => metrics.monitor.recordError(error),
            get: () => metrics.monitor.getMetrics(),
            reset: () => metrics.monitor.reset()
          };

          $GUI.log('Metrics module loaded successfully');
        });
    },

    /**
     * Unload the metrics module
     */
    unload: function() {
      return Promise.resolve()
        .then(() => {
          $GUI.log('Metrics module unloading');

          // Clear interval
          if (metrics.metricsInterval) {
            clearInterval(metrics.metricsInterval);
            metrics.metricsInterval = null;
          }

          // Remove UI display
          if (metrics.$metricsDisplay) {
            metrics.$metricsDisplay.remove();
            metrics.$metricsDisplay = null;
          }

          // Clean up $GUI API
          delete $GUI.metrics;
        });
    },

    /**
     * Destroy the metrics module
     */
    destroy: function() {
      return Promise.resolve()
        .then(() => {
          $GUI.log('Metrics module destroying');
          
          if (metrics.monitor) {
            metrics.monitor.reset();
            metrics.monitor = null;
          }
        });
    },

    /**
     * Get current metrics snapshot
     */
    getSnapshot: function() {
      return metrics.monitor ? metrics.monitor.getMetrics() : null;
    },

    /**
     * Reset all metrics
     */
    reset: function() {
      return Promise.resolve()
        .then(() => {
          if (metrics.monitor) {
            metrics.monitor.reset();
            return $GUI.emit('metrics:reset');
          }
        })
        .then(() => {
          $GUI.log('Metrics reset');
        });
    }
  };
}, {
  // Default module options
  enabled: true,
  displayMetrics: false,
  updateInterval: 5000
});

export default Metrics;