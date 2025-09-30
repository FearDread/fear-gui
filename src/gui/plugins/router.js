import Utils from "./utils";
import Cache from "./cache";
import Metrics from "./metrics";

export const Router = (() => {
  // Private instance variable
  let instance = null;

  // Private constructor function
  function Router(element, options) {
    // Prevent multiple instantiation
    if (instance) {
      console.warn('[FearRouter] Instance already exists. Returning existing instance.');
      return instance;
    }

    this.element = element;
    this.$element = $(element);
    this.options = $.extend(true, {}, DEFAULTS, options);

    // Initialize components
    this.cache = new Cache(this.options);
    this.performance = new Metrics(this.options.performance.trackMetrics);
    
    this.loadingPromises = new Map();
    this.retryAttempts = new Map();

    this.handler = {
      hashChange: () => {
        if (!this.isNavigating) {
          this.handler.route();
        }
      },
      
      popState: (e) => {
        const state = e.originalEvent.state;
        if (state && state.route) {
          this.handler.route(state.route);
        } else {
          this.handler.route();
        }
      },
      
      route: async (routeName) => {
        if (this.isNavigating) {
          this.log('Navigation already in progress', 'warn');
          return;
        }

        this.isNavigating = true;
        const startTime = this.performance.startTiming(route.name);

        try {
          // Execute beforeRouteChange callback
          if (this.options.callbacks.beforeRouteChange) {
            const shouldContinue = await this.options.callbacks.beforeRouteChange.call(
              this, route.name, this.currentRoute
            );
            if (shouldContinue === false) {
              this.isNavigating = false;
              return;
            }
          }

          this.previousRoute = this.currentRoute;
          this.currentRoute = route.name;

          // Show loading if needed
          if (this.options.loading.enabled && !route.html) {
            this.showLoading();
          }

          // Load route content
          if (route.html) {
            await this.handler.render(route);
          } else {
            await this.handler.fetch(route);
          }

          // Record performance metrics
          const loadTime = this.performance.endTiming(route.name, startTime);
          this.performance.metrics.totalRoutes++;

          this.log(`Route "${route.name}" loaded in ${loadTime.toFixed(2)}ms`);
          this.trigger('fear:router:loaded', { route: route.name, loadTime });

        } catch (error) {
          this.handleError(`Failed to load route "${route.name}": ${error.message}`, error);
        } finally {
          this.isNavigating = false;
          this.hideLoading();
        }
      },
      
      load: async (route) => {
        if (this.isNavigating) {
          this.log('Navigation already in progress', 'warn');
          return;
        }

        this.isNavigating = true;
        const startTime = this.performance.startTiming(route.name);

        try {
          // Execute beforeRouteChange callback
          if (this.options.callbacks.beforeRouteChange) {
            const shouldContinue = await this.options.callbacks.beforeRouteChange.call(
              this, route.name, this.currentRoute
            );
            if (shouldContinue === false) {
              this.isNavigating = false;
              return;
            }
          }

          this.previousRoute = this.currentRoute;
          this.currentRoute = route.name;

          // Show loading if needed
          if (this.options.loading.enabled && !route.html) {
            this.showLoading();
          }

          // Load route content
          if (route.html) {
            await this.renderRoute(route);
          } else {
            await this.fetchRoute(route);
          }

          // Record performance metrics
          const loadTime = this.performance.endTiming(route.name, startTime);
          this.performance.metrics.totalRoutes++;

          this.log(`Route "${route.name}" loaded in ${loadTime.toFixed(2)}ms`);
          this.trigger('fear:router:loaded', { route: route.name, loadTime });

        } catch (error) {
          this.handleError(`Failed to load route "${route.name}": ${error.message}`, error);
        } finally {
          this.isNavigating = false;
          this.hideLoading();
        }
      },
      
      fetch: async (route) => {
        const cached = this.cache.get(route.name);
        if (cached) {
          this.performance.recordCacheHit();
          route.html = cached;
          await this.handler.render(route);
          return;
        }

        this.performance.recordCacheMiss();

        // Check if already loading
        if (this.loadingPromises.has(route.name)) {
          const html = await this.loadingPromises.get(route.name);
          route.html = html;
          await this.handler.render(route);
          return;
        }

        // Create loading promise
        const url = this.options.fragmentPath + (route.path || route.name + '.html');
        const loadingPromise = this.createLoadingPromise(url, route.name);

        this.loadingPromises.set(route.name, loadingPromise);

        try {
          const html = await loadingPromise;
          route.html = html;
          this.cache.set(route.name, html);
          await this.renderRoute(route);
        } finally {
          this.loadingPromises.delete(route.name);
        }
      },
      
      render: async (route) => {
        const fadeSpeed = this.options.animations.enabled && !Utils.prefersReducedMotion()
          ? this.options.animations.fadeSpeed : 0;

        return new Promise((resolve) => {
          this.$container.fadeOut(fadeSpeed, async () => {
            // Update content
            this.$container.empty().html(route.html);

            // Update document metadata
            this.updateMetadata(route);

            // Fade in content
            this.$container.fadeIn(fadeSpeed, async () => {
              try {
                // Execute route callback
                if (route.callback && typeof route.callback === 'function') {
                  await route.callback.call(this, route);
                }

                // Reinitialize components
                this.initComponents();

                // Handle accessibility
                this.handleAccessibility(route);

                // Execute afterRouteChange callback
                if (this.options.callbacks.afterRouteChange) {
                  await this.options.callbacks.afterRouteChange.call(this, route.name, this.previousRoute);
                }

                if (this.options.callbacks.onRouteChange) {
                  await this.options.callbacks.onRouteChange.call(this, route.name);
                }

                this.trigger('fear:router:rendered', { route: route.name });
                resolve();

              } catch (error) {
                this.handleError(`Route callback error: ${error.message}`, error);
                resolve();
              }
            });
          });
        });
      }
    };

    // State management
    this.currentRoute = null;
    this.previousRoute = null;
    this.isNavigating = false;
    this.initialized = false;

    // Bind context
    this.log = Utils.log.bind(this.options);
    this.handleHashChange = this.handler.hashChange.bind(this);
    this.handlePopState = this.handler.popState.bind(this);
    
    // Initialize
    this.init();

    // Store instance reference
    instance = this;
  }

  // Public singleton interface
  return {
    // Initialize or get existing instance
    getInstance: function(element, options) {
      if (!instance) {
        new Router(element, options);
      }
      return instance;
    },

    // Check if instance exists
    hasInstance: function() {
      return instance !== null;
    },

    // Public API methods (proxy to instance)
    navigate: function(routeName, pushState = true) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      if (instance.isNavigating) {
        instance.log('Navigation already in progress', 'warn');
        return instance;
      }

      const route = instance.options.routes[routeName];
      if (!route) {
        instance.log(`Route "${routeName}" not found`, 'error');
        return instance;
      }

      if (pushState && instance.options.pushState) {
        const state = { route: routeName };
        history.pushState(state, route.title || '', `#${routeName}`);
      } else {
        window.location.hash = routeName;
      }

      return instance;
    },

    addRoute: function(name, config) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      instance.options.routes[name] = {
        name,
        path: name + '.html',
        html: null,
        callback: null,
        title: name.charAt(0).toUpperCase() + name.slice(1),
        ...config
      };

      instance.log(`Route "${name}" added`);
      instance.trigger('fear:router:route-added', { name, config });
      return instance;
    },

    removeRoute: function(name) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      if (instance.options.routes[name]) {
        delete instance.options.routes[name];
        instance.cache.cache.delete(name);
        instance.log(`Route "${name}" removed`);
        instance.trigger('fear:router:route-removed', { name });
      }
      return instance;
    },

    reload: function() {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      if (instance.currentRoute) {
        const route = instance.options.routes[instance.currentRoute];
        if (route) {
          // Clear cache for this route
          instance.cache.cache.delete(instance.currentRoute);
          route.html = null;
          instance.loadRoute(route);
        }
      }
      return instance;
    },

    clearCache: function() {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      instance.cache.clear();
      instance.log('Cache cleared');
      return instance;
    },

    getMetrics: function() {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      return instance.performance.getMetrics();
    },

    getCurrentRoute: function() {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      return instance.currentRoute;
    },

    getPreviousRoute: function() {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      return instance.previousRoute;
    },

    isReady: function() {
      if (!instance) {
        return false;
      }

      return instance.initialized && !instance.isNavigating;
    },

    // Event system
    trigger: function(eventName, data = {}) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      instance.$element.trigger(eventName, [data, instance]);
      return instance;
    },

    on: function(eventName, handler) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      instance.$element.on(eventName, handler);
      return instance;
    },

    off: function(eventName, handler) {
      if (!instance) {
        console.error('[FearRouter] Router not initialized. Call getInstance() first.');
        return null;
      }

      instance.$element.off(eventName, handler);
      return instance;
    },

    // Cleanup and reset
    destroy: function() {
      if (!instance) {
        console.warn('[FearRouter] No instance to destroy.');
        return null;
      }

      instance.log('Destroying router instance');

      // Remove event listeners
      $(window).off(`.${PLUGIN_NAME}`);
      instance.$element.off(`.${PLUGIN_NAME}`);

      // Clear caches and promises
      instance.cache.clear();
      instance.loadingPromises.clear();
      instance.retryAttempts.clear();

      // Remove accessibility elements
      if (instance.$announcer) {
        instance.$announcer.remove();
      }

      // Trigger destroy callback
      if (instance.options.callbacks.onDestroy) {
        instance.options.callbacks.onDestroy.call(instance);
      }

      instance.trigger('fear:router:destroy');

      // Clean up
      instance.$element.removeData(DATA_KEY);
      instance.initialized = false;

      // Reset singleton instance
      instance = null;

      return null;
    },

    // Get direct access to instance (use sparingly)
    _getInstance: function() {
      return instance;
    }
  };
})();

/* 
  // Simple Router System
  const RouterModule = (() => {
    let isInitialized = false;
    let config = {};
    let currentRoute = '';

    const init = options => {
      if (isInitialized) return;
      
      config = options;
      isInitialized = true;
      CoreUtils.log('Initializing Router System', 'log', 'Router');

      bindEvents();
      handleInitialRoute();
    };

    const bindEvents = () => {
      if (config.hashNavigation) {
        $(window).on('hashchange.fear-router', handleHashChange);
      }

      $('a[href^="#"]').on('click.fear-router', handleLinkClick);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      navigateTo(hash);
    };

    const handleLinkClick = e => {
      const $link = $(e.currentTarget);
      const href = $link.attr('href');
      
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = href.slice(1);
        
        if (config.smoothScroll) {
          scrollToSection(target);
        }
        
        navigateTo(target);
      }
    };

    const navigateTo = route => {
      if (currentRoute === route) return;

      const previousRoute = currentRoute;
      currentRoute = route;

      // Update active states
      updateActiveStates(route);

      // Execute route handler
      if (config.routes[route] && CoreUtils.isFunction(config.routes[route])) {
        config.routes[route](route, previousRoute);
      }

      EventSystem.emit('route:change', { route, previousRoute });
      CoreUtils.log(`Route changed: ${previousRoute} -> ${route}`, 'log', 'Router');
    };

    const updateActiveStates = route => {
      $(`a[href="#${route}"]`).addClass(config.activeClass)
        .siblings().removeClass(config.activeClass);
    };

    const scrollToSection = target => {
      const $target = $(`#${target}, [name="${target}"]`).first();
      
      if ($target.length) {
        const targetTop = $target.offset().top - config.scrollOffset;
        
        $('html, body').animate({
          scrollTop: targetTop
        }, 800, 'easeInOutCubic');
      }
    };

    const handleInitialRoute = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        navigateTo(hash);
      }
    };

    const destroy = () => {
      if (!isInitialized) return;
      
      $(window).off('.fear-router');
      $('a[href^="#"]').off('.fear-router');
      
      isInitialized = false;
      config = {};
      currentRoute = '';
    };

    const getCurrentRoute = () => currentRoute;

    return { init, destroy, navigateTo, getCurrentRoute };
  })();
  */