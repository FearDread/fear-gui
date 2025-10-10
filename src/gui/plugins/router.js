
/**
 * Router Plugin
 * Handles client-side routing with hash navigation, route loading, and transitions
 */
export const Router = function(options = {}) {
  const router = this;

  // Default configuration
  const DEFAULTS = {
    container: '#router-container',
    fragmentPath: '/fragments/',
    defaultRoute: 'home',
    pushState: true,
    hashNavigation: true,
    smoothScroll: true,
    scrollOffset: 0,
    activeClass: 'active',
    loading: {
      enabled: true,
      template: '<div class="router-loading">Loading...</div>',
      minDisplay: 300
    },
    animations: {
      enabled: true,
      fadeSpeed: 300
    },
    cache: {
      enabled: true,
      maxSize: 50,
      ttl: 3600000
    },
    performance: {
      trackMetrics: true
    },
    accessibility: {
      announceRoutes: true,
      focusContent: true
    },
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000
    },
    callbacks: {
      beforeRouteChange: null,
      afterRouteChange: null,
      onRouteChange: null,
      onError: null,
      onDestroy: null
    },
    routes: {}
  };

  // Merge options with defaults
  this.options = FEAR.utils.merge({}, DEFAULTS, options);

  // Private state
  this.routes = this.options.routes;
  this.currentRoute = null;
  this.previousRoute = null;
  this.isNavigating = false;
  this.initialized = false;
  this.loadingPromises = new Map();
  this.retryAttempts = new Map();
  this.$container = null;
  this.$announcer = null;
  this.cache = new Map();
  this.cacheTimestamps = new Map();

  // Private methods
  this._handleHashChange = () => {
    if (!this.isNavigating) {
      const hash = window.location.hash.slice(1);
      const routeName = hash || this.options.defaultRoute;
      this._loadRoute(routeName);
    }
  };

  this._handlePopState = (e) => {
    const state = e.originalEvent?.state;
    if (state && state.route) {
      this._loadRoute(state.route);
    } else {
      this._handleHashChange();
    }
  };

  this._handleLinkClick = (e) => {
    const $link = $(e.currentTarget);
    const href = $link.attr('href');

    if (href && href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const target = href.slice(1);

      if (router.options.smoothScroll) {
        router._scrollToSection(target);
      }

      router.navigate(target, true);
    }
  };

  this._loadRoute = function(routeName) {
    if (this.isNavigating) {
      console.warn('Navigation already in progress');
      return Promise.resolve();
    }

    const route = this.routes[routeName];
    if (!route) {
      console.warn(`Route "${routeName}" not found`);
      return Promise.reject(new Error(`Route not found: ${routeName}`));
    }

    this.isNavigating = true;

    return FEAR.broker.emit('route:start', { path: routeName })
      .then(() => {
        if (this.options.callbacks.beforeRouteChange) {
          return Promise.resolve(
            this.options.callbacks.beforeRouteChange.call(this, routeName, this.currentRoute)
          );
        }
      })
      .then(shouldContinue => {
        if (shouldContinue === false) {
          this.isNavigating = false;
          return Promise.reject(new Error('Route change cancelled'));
        }

        this.previousRoute = this.currentRoute;
        this.currentRoute = routeName;

        // Show loading if needed
        if (this.options.loading.enabled && !route.html) {
          this._showLoading();
        }

        // Load route content
        if (route.html) {
          return this._renderRoute(route);
        } else {
          return this._fetchRoute(route);
        }
      })
      .then(() => {
        console.log(`Route "${routeName}" loaded successfully`);
        return FEAR.broker.emit('route:complete', { path: routeName });
      })
      .catch(error => {
        this._handleError(`Failed to load route "${routeName}": ${error.message}`, error);
        return Promise.reject(error);
      })
      .then(() => {
        this.isNavigating = false;
        this._hideLoading();
      });
  };

  this._fetchRoute = function(route) {
    const cached = this._getCachedRoute(route.name);
    if (cached) {
      FEAR.broker.emit('cache:hit');
      route.html = cached;
      return this._renderRoute(route);
    }

    FEAR.broker.emit('cache:miss');

    // Check if already loading
    if (this.loadingPromises.has(route.name)) {
      return this.loadingPromises.get(route.name)
        .then(html => {
          route.html = html;
          return this._renderRoute(route);
        });
    }

    // Create loading promise
    const url = this.options.fragmentPath + (route.path || route.name + '.html');
    const loadingPromise = this._createLoadingPromise(url, route.name);

    this.loadingPromises.set(route.name, loadingPromise);

    return loadingPromise
      .then(html => {
        route.html = html;
        this._setCachedRoute(route.name, html);
        return this._renderRoute(route);
      })
      .then(() => {
        this.loadingPromises.delete(route.name);
      })
      .catch(error => {
        this.loadingPromises.delete(route.name);
        return Promise.reject(error);
      });
  };

  this._renderRoute = function(route) {
    const fadeSpeed = this.options.animations.enabled && !this._prefersReducedMotion()
      ? this.options.animations.fadeSpeed
      : 0;

    return new Promise((resolve, reject) => {
      this.$container.fadeOut(fadeSpeed, () => {
        Promise.resolve()
          .then(() => {
            // Update content
            this.$container.empty().html(route.html);

            // Update document metadata
            this._updateMetadata(route);

            return new Promise((res) => {
              // Fade in content
              this.$container.fadeIn(fadeSpeed, () => res());
            });
          })
          .then(() => {
            // Execute route callback
            if (route.callback && typeof route.callback === 'function') {
              return Promise.resolve(route.callback.call(this, route));
            }
          })
          .then(() => {
            this._initComponents();
            this._handleAccessibility(route);

            if (this.options.callbacks.afterRouteChange) {
              return Promise.resolve(
                this.options.callbacks.afterRouteChange.call(this, route.name, this.previousRoute)
              );
            }
          })
          .then(() => {
            if (this.options.callbacks.onRouteChange) {
              return Promise.resolve(
                this.options.callbacks.onRouteChange.call(this, route.name)
              );
            }
          })
          .then(() => {
            return FEAR.broker.emit('router:rendered', { route: route.name });
          })
          .then(() => resolve())
          .catch(error => {
            this._handleError(`Route callback error: ${error.message}`, error);
            resolve();
          });
      });
    });
  };

  this._createLoadingPromise = function(url, routeName) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        dataType: 'html',
        success: (data) => resolve(data),
        error: (jqXHR, textStatus, errorThrown) => {
          reject(new Error(textStatus || 'Failed to load route'));
        }
      });
    }).catch(error => {
      const attempts = this.retryAttempts.get(routeName) || 0;

      if (this.options.retry.enabled && attempts < this.options.retry.maxAttempts) {
        this.retryAttempts.set(routeName, attempts + 1);
        console.log(`Retrying route load (${attempts + 1}/${this.options.retry.maxAttempts})`);

        return new Promise((resolve) => {
          setTimeout(() => resolve(), this.options.retry.delay);
        }).then(() => this._createLoadingPromise(url, routeName));
      }

      this.retryAttempts.delete(routeName);
      return Promise.reject(error);
    });
  };

  this._getCachedRoute = function(routeName) {
    if (!this.options.cache.enabled) return null;

    const timestamp = this.cacheTimestamps.get(routeName);
    if (!timestamp) return null;

    const now = Date.now();
    if (now - timestamp > this.options.cache.ttl) {
      this.cache.delete(routeName);
      this.cacheTimestamps.delete(routeName);
      return null;
    }

    return this.cache.get(routeName);
  };

  this._setCachedRoute = function(routeName, html) {
    if (!this.options.cache.enabled) return;

    // Implement LRU cache
    if (this.cache.size >= this.options.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.cacheTimestamps.delete(firstKey);
    }

    this.cache.set(routeName, html);
    this.cacheTimestamps.set(routeName, Date.now());
  };

  this._showLoading = function() {
    if (this.$container && this.options.loading.template) {
      this.$container.html(this.options.loading.template);
    }
  };

  this._hideLoading = function() {
    // Loading is automatically hidden during render
  };

  this._updateMetadata = function(route) {
    if (route.title) {
      document.title = route.title;
    }

    if (route.meta) {
      Object.keys(route.meta).forEach(name => {
        let $meta = $(`meta[name="${name}"]`);
        if ($meta.length === 0) {
          $meta = $('<meta>').attr('name', name);
          $('head').append($meta);
        }
        $meta.attr('content', route.meta[name]);
      });
    }
  };

  this._initComponents = function() {
    // Re-initialize components in the new content
    FEAR.broker.emit('components:init', { container: this.$container });
  };

  this._handleAccessibility = function(route) {
    if (!this.options.accessibility.announceRoutes) return;

    if (this.$announcer) {
      this.$announcer.text(`Navigated to ${route.title || route.name}`);
    }

    if (this.options.accessibility.focusContent) {
      this.$container.attr('tabindex', '-1').focus();
    }
  };

  this._scrollToSection = function(target) {
    const $target = $(`#${target}, [name="${target}"]`).first();

    if ($target.length) {
      const targetTop = $target.offset().top - this.options.scrollOffset;

      $('html, body').animate({
        scrollTop: targetTop
      }, 800);
    }
  };

  this._prefersReducedMotion = function() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  this._handleError = function(message, error) {
    console.error(message, error);
    FEAR.broker.emit('error', { message, error });

    if (this.options.callbacks.onError) {
      this.options.callbacks.onError.call(this, error);
    }
  };

  this._updateActiveStates = function(routeName) {
    $(`a[href="#${routeName}"]`)
      .addClass(this.options.activeClass)
      .parent()
      .siblings()
      .find('a')
      .removeClass(this.options.activeClass);
  };

  // Public API
  this.init = function() {
    if (this.initialized) {
      console.warn('Router already initialized');
      return this;
    }

    this.$container = $(this.options.container);

    if (this.$container.length === 0) {
      console.error(`Container "${this.options.container}" not found`);
      return this;
    }

    // Create accessibility announcer
    if (this.options.accessibility.announceRoutes) {
      this.$announcer = $('<div>')
        .attr({
          'role': 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true'
        })
        .addClass('sr-only')
        .appendTo('body');
    }

    // Bind event listeners
    if (this.options.hashNavigation) {
      $(window).on('hashchange.fear-router', this._handleHashChange);
    }

    if (this.options.pushState) {
      $(window).on('popstate.fear-router', this._handlePopState);
    }

    $(document).on('click.fear-router', 'a[href^="#"]', this._handleLinkClick);

    this.initialized = true;

    // Handle initial route
    const hash = window.location.hash.slice(1);
    const initialRoute = hash || this.options.defaultRoute;
    
    if (initialRoute) {
      this._loadRoute(initialRoute);
    }

    console.log('Router initialized');
    FEAR.broker.emit('router:ready');

    return this;
  };

  this.navigate = function(routeName, pushState = true) {
    if (this.isNavigating) {
      console.warn('Navigation already in progress');
      return this;
    }

    const route = this.routes[routeName];
    if (!route) {
      console.error(`Route "${routeName}" not found`);
      return this;
    }

    if (pushState && this.options.pushState) {
      const state = { route: routeName };
      history.pushState(state, route.title || '', `#${routeName}`);
    } else {
      window.location.hash = routeName;
    }

    this._updateActiveStates(routeName);

    return this;
  };

  this.addRoute = function(name, config) {
    this.routes[name] = {
      name,
      path: name + '.html',
      html: null,
      callback: null,
      title: name.charAt(0).toUpperCase() + name.slice(1),
      ...config
    };

    console.log(`Route "${name}" added`);
    FEAR.broker.emit('router:route-added', { name, config });
    return this;
  };

  this.removeRoute = function(name) {
    if (this.routes[name]) {
      delete this.routes[name];
      this.cache.delete(name);
      this.cacheTimestamps.delete(name);
      console.log(`Route "${name}" removed`);
      FEAR.broker.emit('router:route-removed', { name });
    }
    return this;
  };

  this.reload = function() {
    if (this.currentRoute) {
      const route = this.routes[this.currentRoute];
      if (route) {
        // Clear cache for this route
        this.cache.delete(this.currentRoute);
        this.cacheTimestamps.delete(this.currentRoute);
        route.html = null;
        this._loadRoute(this.currentRoute);
      }
    }
    return this;
  };

  this.clearCache = function() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('Cache cleared');
    return this;
  };

  this.getCurrentRoute = function() {
    return this.currentRoute;
  };

  this.getPreviousRoute = function() {
    return this.previousRoute;
  };

  this.isReady = function() {
    return this.initialized && !this.isNavigating;
  };

  this.destroy = function() {
    console.log('Destroying router instance');

    // Remove event listeners
    $(window).off('.fear-router');
    $(document).off('.fear-router');

    // Clear caches and promises
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.loadingPromises.clear();
    this.retryAttempts.clear();

    // Remove accessibility elements
    if (this.$announcer) {
      this.$announcer.remove();
    }

    // Trigger destroy callback
    if (this.options.callbacks.onDestroy) {
      this.options.callbacks.onDestroy.call(this);
    }

    FEAR.broker.emit('router:destroy');

    this.initialized = false;

    return this;
  };

  // jQuery plugin interface
  this.fn = function($element, options) {
    return $element.each(function() {
      const $this = $(this);
      let instance = $this.data('fear-router');

      if (!instance) {
        instance = new Router({ ...options, container: this });
        $this.data('fear-router', instance);
        instance.init();
      }

      return instance;
    });
  };

  return this;
};

export default Router;