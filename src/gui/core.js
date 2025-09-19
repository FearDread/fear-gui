/*!
 * FEAR Framework - Lightweight Portfolio & Landing Page Framework
 * Version: 4.0.0
 * Author: FearDread
 * Description: A comprehensive, modular framework built on jQuery
 * Build Date: September 2025
 */

(($, window, document, undefined) => {
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