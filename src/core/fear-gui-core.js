/*!
 * FEAR Framework - Lightweight Portfolio & Landing Page Framework
 * Version: 4.0.0
 * Author: FearDread
 * Description: A comprehensive, modular framework built on jQuery
 * Build Date: September 2025
 */

(function($, window, document, undefined) {
  'use strict';

  // Framework constants
  const FRAMEWORK_NAME = 'FEAR';
  const VERSION = '4.0.0';
  const DATA_KEY = 'fear-framework';

  // Default configuration
  const DEFAULTS = {
    debug: false,
    autoInit: true,
    namespace: 'fear',
    
    modules: {
      loader: true,
      typed: true,
      swiper: true,
      magnificPopup: true,
      countdown: true,
      vegas: true,
      skillbars: true,
      mailchimp: true,
      contactForm: true,
      particles: true,
      animations: true,
      router: false
    },

    // Animation system
    animations: {
      duration: 600,
      easing: 'ease-in-out',
      offset: 100,
      useIntersectionObserver: true,
      classes: {
        animate: 'fear-animate',
        animated: 'fear-animated',
        fadeIn: 'fear-fade-in',
        slideUp: 'fear-slide-up',
        slideDown: 'fear-slide-down',
        slideLeft: 'fear-slide-left',
        slideRight: 'fear-slide-right',
        zoomIn: 'fear-zoom-in',
        zoomOut: 'fear-zoom-out'
      }
    },

    // Router system
    router: {
      hashNavigation: true,
      smoothScroll: true,
      scrollOffset: 80,
      activeClass: 'active',
      routes: {}
    },

    // Component configurations
    loader: {
      logoScaleDelay: 0,
      loaderHideDelay: 300,
      bodyLoadDelay: 1400,
      selectors: {
        logo: '.loader__logo',
        loader: '.loader',
        main: '#main',
        body: 'body',
        homeTriger: '#home-trigger'
      }
    },
    
    typed: {
      selector: '#typed',
      stringsElement: '#typed-strings',
      loop: true,
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 2500,
      headlineSelector: '.animated-headline'
    },
    
    swiper: {
      selector: '.swiper',
      options: {
        grabCursor: true,
        effect: 'creative',
        creativeEffect: {
          prev: { translate: ['-20%', 0, -1] },
          next: { translate: ['100%', 0, 0] }
        },
        parallax: true,
        speed: 1300,
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        }
      }
    },
    
    magnificPopup: {
      selector: '#showreel-trigger',
      options: {
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false
      }
    },
    
    countdown: {
      selector: '#countdown',
      targetDate: new Date(2025, 9, 20),
      format: 'D',
      timezone: +10
    },
    
    vegas: {
      timer: false,
      delay: 8000,
      transition: 'fade2',
      transitionDuration: 2000,
      animation: ['kenburnsUp', 'kenburnsDown', 'kenburnsLeft', 'kenburnsRight'],
      backgrounds: {
        standard: {
          selector: '#bgndKenburns',
          images: [
            'img/backgrounds/960x1080-kenburns-1.webp',
            'img/backgrounds/960x1080-kenburns-2.webp',
            'img/backgrounds/960x1080-kenburns-3.webp'
          ]
        },
        fullscreen: {
          selector: '#bgndKenburnsFull',
          images: [
            'img/backgrounds/1920x1080-kenburns-1.webp',
            'img/backgrounds/1920x1080-kenburns-2.webp',
            'img/backgrounds/1920x1080-kenburns-3.webp'
          ]
        }
      }
    },
    
    skillbars: {
      selector: '.skillbar',
      from: 0,
      speed: 4000,
      interval: 100,
      useIntersectionObserver: true
    },
    
    mailchimp: {
      selector: '.notify-form',
      url: '',
      successDelay: 5000,
      selectors: {
        notify: '.notify',
        form: '.form',
        successMessage: '.subscription-ok',
        errorMessage: '.subscription-error'
      }
    },
    
    contactForm: {
      selector: '#sayhello-form',
      url: 'mail.php',
      successDelay: 5000,
      selectors: {
        container: '.sayhello',
        form: '.form',
        replyGroup: '.reply-group'
      }
    },
    
    particles: {
      selector: '#triangles-js',
      config: {
        particles: {
          number: { value: 33, density: { enable: true, value_area: 1420 } },
          color: { value: '#ffffff' },
          shape: { type: 'triangle', stroke: { width: 0, color: '#000000' } },
          opacity: {
            value: 0.06,
            random: false,
            anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
          },
          size: {
            value: 12,
            random: true,
            anim: { enable: false, speed: 40, size_min: 0.1, sync: false }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1
          },
          move: {
            enable: true,
            speed: 4,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true
          },
          modes: {
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 }
          }
        },
        retina_detect: true
      }
    },
    
    // Event callbacks
    callbacks: {
      onInit: null,
      onReady: null,
      onLoadComplete: null,
      onDestroy: null,
      onModuleInit: null,
      onModuleDestroy: null,
      onRouteChange: null,
      onAnimationComplete: null
    }
  };

  // Core Utility System
  const CoreUtils = (() => {
    let options = {};

    const log = (message, type = 'log', module = 'Core') => {
      if (options.debug && console && console[type]) {
        console[type](`[${FRAMEWORK_NAME}:${module}] ${message}`);
      }
    };

    const isFunction = fn => typeof fn === 'function';
    const isString = str => typeof str === 'string';
    const isObject = obj => obj !== null && typeof obj === 'object';
    const isArray = arr => Array.isArray(arr);
    const isEmpty = val => val == null || val === '' || (isArray(val) && val.length === 0);

    const debounce = (func, wait, immediate) => {
      let timeout;
      return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = () => {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    };

    const throttle = (func, limit) => {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
    };

    const extend = (...args) => $.extend(true, {}, ...args);

    const ready = callback => {
      if (document.readyState === 'loading') {
        $(document).ready(callback);
      } else {
        callback();
      }
    };

    const setOptions = opts => options = opts;

    const generateId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const parseHTML = html => $($.parseHTML(html));

    return {
      log, isFunction, isString, isObject, isArray, isEmpty,
      debounce, throttle, extend, ready, setOptions, generateId, parseHTML
    };
  })();

  // Event System
  const EventSystem = (() => {
    const events = new Map();

    const on = (event, callback, context = null) => {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event).push({ callback, context });
    };

    const off = (event, callback = null) => {
      if (!events.has(event)) return;
      
      if (callback) {
        const handlers = events.get(event);
        events.set(event, handlers.filter(h => h.callback !== callback));
      } else {
        events.delete(event);
      }
    };

    const emit = (event, data = null) => {
      if (!events.has(event)) return;
      
      events.get(event).forEach(({ callback, context }) => {
        try {
          callback.call(context, data);
        } catch (error) {
          CoreUtils.log(`Error in event handler for ${event}: ${error.message}`, 'error', 'Events');
        }
      });
    };

    const once = (event, callback, context = null) => {
      const wrapper = (data) => {
        callback.call(context, data);
        off(event, wrapper);
      };
      on(event, wrapper, context);
    };

    return { on, off, emit, once };
  })();

  // Module Registry
  const ModuleRegistry = (() => {
    const modules = new Map();
    let globalOptions = {};

    const register = (name, instance) => {
      modules.set(name, instance);
      CoreUtils.log(`Module registered: ${name}`, 'log', 'Registry');
      EventSystem.emit('module:registered', { name, instance });
    };

    const unregister = name => {
      if (modules.has(name)) {
        const module = modules.get(name);
        if (module.destroy) module.destroy();
        modules.delete(name);
        CoreUtils.log(`Module unregistered: ${name}`, 'log', 'Registry');
        EventSystem.emit('module:unregistered', { name });
      }
    };

    const get = name => modules.get(name);
    const has = name => modules.has(name);
    const list = () => Array.from(modules.keys());
    const clear = () => {
      modules.forEach((_, name) => unregister(name));
    };

    const setGlobalOptions = options => globalOptions = options;
    const getGlobalOptions = () => globalOptions;

    return {
      register, unregister, get, has, list, clear,
      setGlobalOptions, getGlobalOptions
    };
  })();

  // Animation System
  const AnimationModule = (() => {
    let isInitialized = false;
    let config = {};
    let observers = [];

    const init = options => {
      if (isInitialized) return;
      
      config = options;
      isInitialized = true;
      CoreUtils.log('Initializing Animation System', 'log', 'Animations');

      injectCSS();
      setupObservers();
      bindEvents();
    };

    const injectCSS = () => {
      const css = `
        .${config.classes.animate} { opacity: 0; transform: translateY(30px); transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.animated} { opacity: 1; transform: translateY(0); }
        .${config.classes.fadeIn} { opacity: 0; transition: opacity ${config.duration}ms ${config.easing}; }
        .${config.classes.fadeIn}.${config.classes.animated} { opacity: 1; }
        .${config.classes.slideUp} { transform: translateY(50px); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.slideUp}.${config.classes.animated} { transform: translateY(0); opacity: 1; }
        .${config.classes.slideDown} { transform: translateY(-50px); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.slideDown}.${config.classes.animated} { transform: translateY(0); opacity: 1; }
        .${config.classes.slideLeft} { transform: translateX(50px); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.slideLeft}.${config.classes.animated} { transform: translateX(0); opacity: 1; }
        .${config.classes.slideRight} { transform: translateX(-50px); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.slideRight}.${config.classes.animated} { transform: translateX(0); opacity: 1; }
        .${config.classes.zoomIn} { transform: scale(0.8); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.zoomIn}.${config.classes.animated} { transform: scale(1); opacity: 1; }
        .${config.classes.zoomOut} { transform: scale(1.2); opacity: 0; transition: all ${config.duration}ms ${config.easing}; }
        .${config.classes.zoomOut}.${config.classes.animated} { transform: scale(1); opacity: 1; }
      `;
      
      if (!$('#fear-animations-css').length) {
        $('<style id="fear-animations-css">').text(css).appendTo('head');
      }
    };

    const setupObservers = () => {
      if (!config.useIntersectionObserver || !window.IntersectionObserver) {
        animateOnScroll();
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateElement($(entry.target));
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: `${config.offset}px` });

      const animateSelector = Object.values(config.classes).map(cls => `.${cls}`).join(',');
      $(animateSelector).each((i, el) => {
        if (!$(el).hasClass(config.classes.animated)) {
          observer.observe(el);
        }
      });

      observers.push(observer);
    };

    const animateOnScroll = () => {
      const $window = $(window);
      const checkElements = CoreUtils.throttle(() => {
        const windowTop = $window.scrollTop();
        const windowBottom = windowTop + $window.height();

        const animateSelector = Object.values(config.classes).map(cls => `.${cls}`).join(',');
        $(animateSelector).each((i, el) => {
          const $el = $(el);
          if ($el.hasClass(config.classes.animated)) return;

          const elementTop = $el.offset().top;
          if (elementTop < windowBottom - config.offset) {
            animateElement($el);
          }
        });
      }, 100);

      $window.on('scroll.fear-animations', checkElements);
      checkElements();
    };

    const animateElement = $element => {
      $element.addClass(config.classes.animated);
      
      setTimeout(() => {
        EventSystem.emit('animation:complete', { element: $element[0] });
      }, config.duration);
    };

    const bindEvents = () => {
      EventSystem.on('module:registered', ({ name }) => {
        if (name !== 'animations') {
          CoreUtils.ready(() => {
            setTimeout(() => setupObservers(), 100);
          });
        }
      });
    };

    const destroy = () => {
      if (!isInitialized) return;
      
      observers.forEach(observer => observer.disconnect());
      observers = [];
      $(window).off('.fear-animations');
      $('#fear-animations-css').remove();
      
      isInitialized = false;
      config = {};
    };

    return { init, destroy, animateElement };
  })();

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

  /*
    function FearRouter(element, options) {

    this.element = element;
    this.$element = $(element);
    this.options = $.extend(true, {}, DEFAULTS, options);

    // Initialize components
    this.cache = new CacheManager(this.options);
    this.performance = new PerformanceMonitor(this.options.performance.trackMetrics);
    this.loadingPromises = new Map();
    this.retryAttempts = new Map();

    this.utils = {
      log: function (message, level = 'info', context = '') {
        if (this.debug && console && console[level]) {
          const prefix = context ? `[${PLUGIN_NAME}:${context}] ` : `[${PLUGIN_NAME}] `;
          console[level](prefix + message);
        }
      },

      sanitize: function (html) {
        // Basic HTML sanitization - in production, use a proper sanitizer like DOMPurify
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
      },

      debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },

      throttle: function (func, limit) {
        let inThrottle;
        return function (...args) {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },

      reduced: function () {
        return window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      },

      isValidURL: function (string) {
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;
        }
      },

      generateId: function () {
        return Math.random().toString(36).substr(2, 9);
      }
    };

    this.network = {
      createPromises: (url, routeName) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading route: ${routeName}`));
          }, this.options.loading.timeout);

          $.ajax({
            url,
            method: 'GET',
            cache: this.options.enableCache,
            timeout: this.options.loading.timeout
          })
            .done((data) => {
              clearTimeout(timeout);

              // Sanitize HTML if enabled
              if (this.options.security.sanitizeHTML && typeof data === 'string') {
                data = Utils.sanitizeHTML(data);
              }

              resolve(data);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
              clearTimeout(timeout);
              const error = new Error(`${textStatus}: ${errorThrown}`);
              error.status = jqXHR.status;
              error.statusText = jqXHR.statusText;
              reject(error);
            });
        });
      }

    };

    this.handler = {
      hashChange: () => {
        if (!FearRouter.isNavigating) {
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
      route: (routeName) => {
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

    // Public API //
    return {
      navigate: (routeName, pushState = true) => {
        if (this.isNavigating) {
          this.log('Navigation already in progress', 'warn');
          return this;
        }

        const route = this.options.routes[routeName];
        if (!route) {
          this.log(`Route "${routeName}" not found`, 'error');
          return this;
        }

        if (pushState && this.options.pushState) {
          const state = { route: routeName };
          history.pushState(state, route.title || '', `#${routeName}`);
        } else {
          window.location.hash = routeName;
        }

        return this;
      }

  addRoute(name, config) {
        this.options.routes[name] = {
          name,
          path: name + '.html',
          html: null,
          callback: null,
          title: name.charAt(0).toUpperCase() + name.slice(1),
          ...config
        };

        this.log(`Route "${name}" added`);
        this.trigger('fear:router:route-added', { name, config });
        return this;
      }

  removeRoute(name) {
        if (this.options.routes[name]) {
          delete this.options.routes[name];
          this.cache.cache.delete(name);
          this.log(`Route "${name}" removed`);
          this.trigger('fear:router:route-removed', { name });
        }
        return this;
      }

  reload: () => {
        if (this.currentRoute) {
          const route = this.options.routes[this.currentRoute];
          if (route) {
            // Clear cache for this route
            this.cache.cache.delete(this.currentRoute);
            route.html = null;
            this.loadRoute(route);
          }
        }
        return this;
      }

  clearCache: () => {
        this.cache.clear();
        this.log('Cache cleared');
        return this;
      },

      getMetrics: () => {
        return this.performance.getMetrics();
      }

  getCurrentRoute() {
        return this.currentRoute;
      }

  getPreviousRoute() {
        return this.previousRoute;
      }

  isReady() {
        return this.initialized && !this.isNavigating;
      }

  // Event system
  trigger(eventName, data = {}) {
        this.$element.trigger(eventName, [data, this]);
      }

  on(eventName, handler) {
        this.$element.on(eventName, handler);
        return this;
      }

  off(eventName, handler) {
        this.$element.off(eventName, handler);
        return this;
      }

  // Cleanup
  destroy: () => {
        this.log('Destroying router instance');

        // Remove event listeners
        $(window).off(`.${PLUGIN_NAME}`);
        this.$element.off(`.${PLUGIN_NAME}`);

        // Clear caches and promises
        this.cache.clear();
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

        this.trigger('fear:router:destroy');

        // Clean up
        this.$element.removeData(DATA_KEY);
        this.initialized = false;

        return this;
      }
    }
  };

  /* TODO: Convert these classes to singleton 
  // Cache Manager
  
  class CacheModule {
    constructor(options) {
      this.cache = new Map();
      this.timestamps = new Map();
      this.maxSize = options.maxCacheSize;
      this.timeout = options.cacheTimeout;
      this.enabled = options.enableCache;
    }

    set(key, value) {
      if (!this.enabled) return;

      // Remove oldest entries if at max capacity
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
        this.timestamps.delete(oldestKey);
      }

      this.cache.set(key, value);
      this.timestamps.set(key, Date.now());
    }

    get(key) {
      if (!this.enabled || !this.cache.has(key)) return null;

      const timestamp = this.timestamps.get(key);
      if (Date.now() - timestamp > this.timeout) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        return null;
      }

      return this.cache.get(key);
    }

    has(key) {
      return this.enabled && this.cache.has(key);
    }

    clear() {
      this.cache.clear();
      this.timestamps.clear();
    }

    size() {
      return this.cache.size;
    }
  }

  // Performance Monitor
  class PerformanceModule {
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
 */
  // Component Modules (Simplified versions of previous modules)
  const ComponentModules = {
    loader: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return Promise.resolve();
        config = options;
        isInitialized = true;
        
        const { selectors, logoScaleDelay, loaderHideDelay, bodyLoadDelay } = config;
        
        return new Promise(resolve => {
          $(selectors.logo).addClass('scaleOut');
          
          setTimeout(() => {
            $(selectors.loader).addClass('loaded');
            $(selectors.main).addClass('active animate-in');
            $(selectors.homeTriger).addClass('active-link');
          }, loaderHideDelay);
          
          setTimeout(() => {
            $(selectors.body).addClass('loaded');
            resolve();
          }, bodyLoadDelay);
        });
      };

      const destroy = () => {
        if (!isInitialized) return;
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    typed: (() => {
      let isInitialized = false;
      let instance = null;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { selector, stringsElement, headlineSelector, ...opts } = config;
        const $headline = $(headlineSelector);
        
        if ($headline.length && window.Typed) {
          instance = new Typed(selector, { stringsElement, ...opts });
        }
      };

      const destroy = () => {
        if (!isInitialized) return;
        if (instance) {
          instance.destroy();
          instance = null;
        }
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    swiper: (() => {
      let isInitialized = false;
      let instance = null;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { selector, options: swiperOptions } = config;
        const $swiper = $(selector);
        
        if ($swiper.length && window.Swiper) {
          instance = new Swiper(selector, swiperOptions);
        }
      };

      const destroy = () => {
        if (!isInitialized) return;
        if (instance) {
          instance.destroy();
          instance = null;
        }
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    magnificPopup: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { selector, options: popupOptions } = config;
        const $trigger = $(selector);
        
        if ($trigger.length && $.magnificPopup) {
          $trigger.magnificPopup({
            ...popupOptions,
            callbacks: {
              beforeOpen: () => $('body').addClass('overflow-hidden'),
              close: () => $('body').removeClass('overflow-hidden'),
              ...popupOptions.callbacks
            }
          });
        }
      };

      const destroy = () => {
        if (!isInitialized) return;
        const $trigger = $(config.selector);
        if ($trigger.length) $trigger.magnificPopup('destroy');
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    countdown: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { selector, targetDate, format, timezone } = config;
        const $countdown = $(selector);
        
        if ($countdown.length && $.countdown) {
          $countdown.countdown({
            until: $.countdown.UTCDate(timezone, targetDate.getFullYear(), 
                   targetDate.getMonth(), targetDate.getDate()),
            format
          });
        }
      };

      const destroy = () => {
        if (!isInitialized) return;
        const $countdown = $(config.selector);
        if ($countdown.length && $countdown.countdown) {
          $countdown.countdown('destroy');
        }
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    vegas: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { backgrounds, ...commonOptions } = config;
        
        Object.entries(backgrounds).forEach(([key, bgConfig]) => {
          const $element = $(bgConfig.selector);
          if ($element.length && $.fn.vegas) {
            const slides = bgConfig.images.map(src => ({ src }));
            $element.vegas({ ...commonOptions, slides });
          }
        });
      };

      const destroy = () => {
        if (!isInitialized) return;
        const { backgrounds } = config;
        Object.values(backgrounds).forEach(bgConfig => {
          const $element = $(bgConfig.selector);
          if ($element.length && $element.vegas) {
            $element.vegas('destroy');
          }
        });
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    skillbars: (() => {
      let isInitialized = false;
      let config = {};
      let observers = [];

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const $skillbars = $(config.selector);
        if (!$skillbars.length) return;

        if ($.fn.skillBars) {
          $skillbars.skillBars(config);
        } else {
          initCustomSkillbars($skillbars);
        }
      };

      const initCustomSkillbars = $skillbars => {
        $skillbars.each((index, element) => {
          const $skillbar = $(element);
          const $bar = $skillbar.find('.skillbar-bar');
          const $percent = $skillbar.find('.skillbar-percent');
          const percent = parseInt($bar.attr('data-percent') || '0');
          
          if (config.useIntersectionObserver && window.IntersectionObserver) {
            const observer = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  animateSkillbar($bar, $percent, percent);
                  observer.unobserve(entry.target);
                }
              });
            });
            observer.observe(element);
            observers.push(observer);
          } else {
            animateSkillbar($bar, $percent, percent);
          }
        });
      };

      const animateSkillbar = ($bar, $percent, targetPercent) => {
        const { speed, interval } = config;
        let currentPercent = 0;
        const increment = targetPercent / (speed / interval);
        
        const timer = setInterval(() => {
          currentPercent += increment;
          if (currentPercent >= targetPercent) {
            currentPercent = targetPercent;
            clearInterval(timer);
          }
          
          $bar.css('width', `${currentPercent}%`);
          $percent.text(`${Math.round(currentPercent)}%`);
        }, interval);
      };

      const destroy = () => {
        if (!isInitialized) return;
        observers.forEach(observer => observer.disconnect());
        observers = [];
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    mailchimp: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const $form = $(config.selector);
        if (!$form.length) return;

        if ($.fn.ajaxChimp) {
          $form.ajaxChimp({
            callback: handleCallback,
            url: config.url
          });
        } else {
          $form.on('submit.fear', handleSubmit);
        }
      };

      const handleCallback = resp => {
        const { selectors, successDelay } = config;
        const $notify = $(selectors.notify);
        const $form = $notify.find(selectors.form);
        const isSuccess = resp.result === 'success';
        const messageSelector = isSuccess ? selectors.successMessage : selectors.errorMessage;
        
        $form.addClass('is-hidden');
        $notify.find(messageSelector).addClass('is-visible');
        
        setTimeout(() => {
          $notify.find(messageSelector).removeClass('is-visible');
          $form.delay(300).removeClass('is-hidden');
          $(config.selector).trigger('reset');
        }, successDelay);
      };

      const handleSubmit = e => {
        e.preventDefault();
        handleCallback({ result: 'success' });
      };

      const destroy = () => {
        if (!isInitialized) return;
        $(config.selector).off('.fear');
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    contactForm: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const $form = $(config.selector);
        if ($form.length) {
          $form.on('submit.fear', handleSubmit);
        }
      };

      const handleSubmit = e => {
        e.preventDefault();
        
        $.ajax({
          type: 'POST',
          url: config.url,
          data: $(e.target).serialize()
        })
        .done(() => showSuccess())
        .fail(() => CoreUtils.log('Contact form submission failed', 'error', 'ContactForm'));
      };

      const showSuccess = () => {
        const { selectors, successDelay } = config;
        const $container = $(selectors.container);
        const $form = $container.find(selectors.form);
        const $replyGroup = $container.find(selectors.replyGroup);
        
        $form.addClass('is-hidden');
        $replyGroup.addClass('is-visible');
        
        setTimeout(() => {
          $replyGroup.removeClass('is-visible');
          $form.delay(300).removeClass('is-hidden');
          $(config.selector).trigger('reset');
        }, successDelay);
      };

      const destroy = () => {
        if (!isInitialized) return;
        $(config.selector).off('.fear');
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })(),

    particles: (() => {
      let isInitialized = false;
      let config = {};

      const init = options => {
        if (isInitialized) return;
        config = options;
        isInitialized = true;

        const { selector, config: particleConfig } = config;
        const $container = $(selector);
        
        if ($container.length && window.particlesJS) {
          particlesJS(selector.replace('#', ''), particleConfig);
        }
      };

      const destroy = () => {
        if (!isInitialized) return;
        
        if (window.pJSDom && window.pJSDom.length) {
          window.pJSDom.forEach(pjs => {
            if (pjs.pJS.fn.vendors.destroypJS) {
              pjs.pJS.fn.vendors.destroypJS();
            }
          });
        }
        
        isInitialized = false;
        config = {};
      };

      return { init, destroy };
    })()
  };

  // Main FEAR Framework
  const FEAR = (() => {
    let isInitialized = false;
    let options = {};
    let $element = null;

    // Public API
    const init = (element, opts = {}) => {
      if (isInitialized) {
        CoreUtils.log('Framework already initialized', 'warn');
        return FEAR;
      }

      $element = $(element || document);
      options = CoreUtils.extend(DEFAULTS, opts);
      
      CoreUtils.setOptions(options);
      ModuleRegistry.setGlobalOptions(options);
      
      CoreUtils.log(`Initializing ${FRAMEWORK_NAME} Framework v${VERSION}`);
      isInitialized = true;

      // Setup event system
      setupEventSystem();

      if (options.autoInit) {
        CoreUtils.ready(() => onDOMReady());
        $(window).on('load.fear', () => onWindowLoad());
      }
      
      // Trigger init callback
      if (CoreUtils.isFunction(options.callbacks.onInit)) {
        options.callbacks.onInit.call(FEAR);
      }

      EventSystem.emit('fear:init', { options });
      return FEAR;
    };

    const setupEventSystem = () => {
      // Bind framework events to user callbacks
      if (CoreUtils.isFunction(options.callbacks.onModuleInit)) {
        EventSystem.on('module:registered', ({ name }) => {
          options.callbacks.onModuleInit.call(FEAR, name);
        });
      }

      if (CoreUtils.isFunction(options.callbacks.onModuleDestroy)) {
        EventSystem.on('module:unregistered', ({ name }) => {
          options.callbacks.onModuleDestroy.call(FEAR, name);
        });
      }

      if (CoreUtils.isFunction(options.callbacks.onRouteChange)) {
        EventSystem.on('route:change', (data) => {
          options.callbacks.onRouteChange.call(FEAR, data);
        });
      }

      if (CoreUtils.isFunction(options.callbacks.onAnimationComplete)) {
        EventSystem.on('animation:complete', (data) => {
          options.callbacks.onAnimationComplete.call(FEAR, data);
        });
      }
    };

    const onDOMReady = () => {
      CoreUtils.log('DOM Ready - Initializing modules', 'log');

      // Initialize core modules first
      if (options.modules.animations) {
        initModule('animations', AnimationModule);
      }

      if (options.modules.router) {
        initModule('router', RouterModule);
      }

      // Initialize component modules
      const domModules = ['swiper', 'magnificPopup', 'countdown', 'vegas', 
                         'skillbars', 'mailchimp', 'contactForm', 'particles'];

      domModules.forEach(name => {
        if (options.modules[name] && ComponentModules[name]) {
          initModule(name, ComponentModules[name]);
        }
      });

      // Trigger ready callback
      if (CoreUtils.isFunction(options.callbacks.onReady)) {
        options.callbacks.onReady.call(FEAR);
      }

      EventSystem.emit('fear:ready');
    };

    const onWindowLoad = () => {
      CoreUtils.log('Window Load - Finalizing initialization', 'log');

      // Initialize loader (if enabled)
      const loaderPromise = options.modules.loader && ComponentModules.loader
        ? initModule('loader', ComponentModules.loader)
        : Promise.resolve();

      loaderPromise.then(() => {
        // Initialize typed after loader
        if (options.modules.typed && ComponentModules.typed) {
          initModule('typed', ComponentModules.typed);
        }
        
        // Trigger load complete callback
        if (CoreUtils.isFunction(options.callbacks.onLoadComplete)) {
          options.callbacks.onLoadComplete.call(FEAR);
        }

        EventSystem.emit('fear:loadComplete');
      });
    };

    const initModule = (name, module) => {
      try {
        const config = options[name];
        const result = module.init(config);
        ModuleRegistry.register(name, module);
        return result || Promise.resolve();
      } catch (error) {
        CoreUtils.log(`Error initializing module ${name}: ${error.message}`, 'error');
        return Promise.reject(error);
      }
    };

    // Public API Methods
    const use = (name, moduleDefinition) => {
      if (CoreUtils.isObject(moduleDefinition) && moduleDefinition.init) {
        ComponentModules[name] = moduleDefinition;
        CoreUtils.log(`Custom module registered: ${name}`, 'log');
        
        if (isInitialized && options.modules[name]) {
          initModule(name, moduleDefinition);
        }
      }
      return FEAR;
    };

    const enable = name => {
      options.modules[name] = true;
      
      if (isInitialized && !ModuleRegistry.has(name)) {
        const module = ComponentModules[name] || 
                      (name === 'animations' ? AnimationModule : null) ||
                      (name === 'router' ? RouterModule : null);
        
        if (module) {
          initModule(name, module);
        }
      }
      
      return FEAR;
    };

    const disable = name => {
      options.modules[name] = false;
      ModuleRegistry.unregister(name);
      return FEAR;
    };

    const module = name => ModuleRegistry.get(name);

    const config = (key, value) => {
      if (arguments.length === 0) {
        return options;
      }
      
      if (arguments.length === 1) {
        return CoreUtils.isString(key) ? options[key] : null;
      }

      if (CoreUtils.isString(key)) {
        options[key] = value;
        CoreUtils.setOptions(options);
        ModuleRegistry.setGlobalOptions(options);
      }

      return FEAR;
    };

    const extend = (newOptions) => {
      options = CoreUtils.extend(options, newOptions);
      CoreUtils.setOptions(options);
      ModuleRegistry.setGlobalOptions(options);
      return FEAR;
    };

    const on = (event, callback, context = null) => {
      EventSystem.on(event, callback, context);
      return FEAR;
    };

    const off = (event, callback = null) => {
      EventSystem.off(event, callback);
      return FEAR;
    };

    const emit = (event, data = null) => {
      EventSystem.emit(event, data);
      return FEAR;
    };

    const once = (event, callback, context = null) => {
      EventSystem.once(event, callback, context);
      return FEAR;
    };

    const destroy = () => {
      if (!isInitialized) return FEAR;

      CoreUtils.log('Destroying framework instance');
      
      // Destroy all modules
      ModuleRegistry.clear();
      
      // Remove event listeners
      $(window).off('.fear');
      $(document).off('.fear');
      
      // Clear event system
      EventSystem.off();
      
      // Trigger destroy callback
      if (CoreUtils.isFunction(options.callbacks.onDestroy)) {
        options.callbacks.onDestroy.call(FEAR);
      }
      
      // Clean up
      if ($element && $element.removeData) {
        $element.removeData(DATA_KEY);
      }
      
      isInitialized = false;
      options = {};
      $element = null;
      
      EventSystem.emit('fear:destroy');
      return FEAR;
    };

    // Utility methods
    const utils = CoreUtils;

    // Information methods
    const version = () => VERSION;
    const isInit = () => isInitialized;
    const modules = () => ModuleRegistry.list();

    // Animation helpers
    const animate = selector => {
      if (ModuleRegistry.has('animations')) {
        const $elements = $(selector);
        $elements.each((i, el) => {
          AnimationModule.animateElement($(el));
        });
      }
      return FEAR;
    };

    // Router helpers
    const navigate = route => {
      if (ModuleRegistry.has('router')) {
        RouterModule.navigateTo(route);
      }
      return FEAR;
    };

    const route = () => {
      if (ModuleRegistry.has('router')) {
        return RouterModule.getCurrentRoute();
      }
      return '';
    };

    return {
      // Core methods
      init, use, enable, disable, module, config, extend, destroy,
      
      // Event methods
      on, off, emit, once,
      
      // Utility methods
      utils, version, isInit, modules,
      
      // Helper methods
      animate, navigate, route
    };
  })();

  // jQuery Plugin Integration
  $.fn.fear = function(options, ...args) {
    return this.each(function() {
      const $element = $(this);
      let instance = $element.data(DATA_KEY);
      
      if (!instance) {
        instance = Object.create(FEAR);
        instance.init(this, options);
        $element.data(DATA_KEY, instance);
        return;
      }
      
      if (CoreUtils.isString(options)) {
        const method = options;
        if (CoreUtils.isFunction(instance[method])) {
          const result = instance[method].apply(instance, args);
          return result !== undefined ? result : this;
        } else {
          throw new Error(`Method ${method} does not exist on FEAR framework`);
        }
      }
      
      if (CoreUtils.isObject(options)) {
        instance.extend(options);
      }
    });
  };

  // Static properties
  $.fn.fear.Constructor = FEAR;
  $.fn.fear.defaults = DEFAULTS;
  $.fn.fear.version = VERSION;

  // Auto-initialize
  CoreUtils.ready(() => {
    // Auto-init with data attributes
    $('[data-fear]').each(function() {
      const $element = $(this);
      const options = $element.data('fear-options') || {};
      $element.fear(options);
    });

    // Global auto-init if no specific elements found
    if (!$('[data-fear]').length) {
      FEAR.init();
    }
  });

  // Global exposure
  window.FEAR = FEAR;
  
  // AMD/CommonJS support
  if (typeof define === 'function' && define.amd) {
    define('fear', [], () => FEAR);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = FEAR;
  }

  // Version info
  CoreUtils.log(`${FRAMEWORK_NAME} Framework v${VERSION} loaded`);

})(jQuery, window, document);