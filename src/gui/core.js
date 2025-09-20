import Utils from "./utils";
import Router from "./router";
import metrics from "./metrics";
import cache from "./cache";


// modules 
import Events from "./modules/events";
import Registry from "./modules/registry";
import Components from "./modules/component";
import Animation from "./modules/animation";

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
    debug: true,
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
      router: true
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
        Utils.log('Framework already initialized', 'warn');
        return FEAR;
      }

      $element = $(element || document);
      options = Utils.extend(DEFAULTS, opts);
      
      Utils.setOptions(options);
      Registry.setGlobalOptions(options);
      
      Utils.log(`Initializing ${FRAMEWORK_NAME} Framework v${VERSION}`);
      isInitialized = true;

      // Setup event system
      setupEvents();

      if (options.autoInit) {
        Utils.ready(() => onDOMReady());
        $(window).on('load.fear', () => onWindowLoad());
      }
      
      // Trigger init callback
      if (Utils.isFunction(options.callbacks.onInit)) {
        options.callbacks.onInit.call(FEAR);
      }

      Events.emit('fear:init', { options });
      return FEAR;
    };

    const setupEvents = () => {
      // Bind framework events to user callbacks
      if (Utils.isFunction(options.callbacks.onModuleInit)) {
        Events.on('module:registered', ({ name }) => {
          options.callbacks.onModuleInit.call(FEAR, name);
        });
      }

      if (Utils.isFunction(options.callbacks.onModuleDestroy)) {
        Events.on('module:unregistered', ({ name }) => {
          options.callbacks.onModuleDestroy.call(FEAR, name);
        });
      }

      if (Utils.isFunction(options.callbacks.onRouteChange)) {
        Events.on('route:change', (data) => {
          options.callbacks.onRouteChange.call(FEAR, data);
        });
      }

      if (Utils.isFunction(options.callbacks.onAnimationComplete)) {
        Events.on('animation:complete', (data) => {
          options.callbacks.onAnimationComplete.call(FEAR, data);
        });
      }
    };

    const onDOMReady = () => {
      Utils.log('DOM Ready - Initializing modules', 'log');

      // Initialize core modules first
      if (options.modules.animations) {
        initModule('animations', Animation);
      }

      if (options.modules.router) {
        initModule('router', Router);
      }

      // Initialize component modules
      const domModules = ['swiper', 'magnificPopup', 'countdown', 'vegas', 
                         'skillbars', 'mailchimp', 'contactForm', 'particles'];

      domModules.forEach(name => {
        if (options.modules[name] && Components[name]) {
          initModule(name, Components[name]);
        }
      });

      // Trigger ready callback
      if (Utils.isFunction(options.callbacks.onReady)) {
        options.callbacks.onReady.call(FEAR);
      }

      Events.emit('fear:ready');
    };

    const onWindowLoad = () => {
      Utils.log('Window Load - Finalizing initialization', 'log');

      // Initialize loader (if enabled)
      const loaderPromise = options.modules.loader && Components.loader
        ? initModule('loader', Components.loader)
        : Promise.resolve();

      loaderPromise.then(() => {
        // Initialize typed after loader
        if (options.modules.typed && Components.typed) {
          initModule('typed', Components.typed);
        }
        
        // Trigger load complete callback
        if (Utils.isFunction(options.callbacks.onLoadComplete)) {
          options.callbacks.onLoadComplete.call(FEAR);
        }

        Events.emit('fear:loadComplete');
      });
    };

    const initModule = (name, module) => {
      try {
        const config = options[name];
        const result = module.init(config);
        
        Registry.register(name, module);
        
        return result || Promise.resolve();
      
      } catch (error) {
        Utils.log(`Error initializing module ${name}: ${error.message}`, 'error');
        return Promise.reject(error);
      }
    };

    // Public API Methods
    const use = (name, moduleDefinition) => {
      if (Utils.isObject(moduleDefinition) && moduleDefinition.init) {
        Components[name] = moduleDefinition;
        Utils.log(`Custom module registered: ${name}`, 'log');
        
        if (isInitialized && options.modules[name]) {
          initModule(name, moduleDefinition);
        }
      }
      return FEAR;
    };

    const enable = name => {
      options.modules[name] = true;
      
      if (isInitialized && !Registry.has(name)) {
        const module = Components[name] || 
                      (name === 'animations' ? Animation : null) ||
                      (name === 'router' ? Router : null);
        
        if (module) {
          initModule(name, module);
        }
      }
      
      return FEAR;
    };

    const disable = name => {
      options.modules[name] = false;
      Registry.unregister(name);
      return FEAR;
    };

    const module = name => Registry.get(name);

    const config = (key, value) => {
      if (arguments.length === 0) {
        return options;
      }
      
      if (arguments.length === 1) {
        return Utils.isString(key) ? options[key] : null;
      }

      if (Utils.isString(key)) {
        options[key] = value;
        Utils.setOptions(options);
        Registry.setGlobalOptions(options);
      }

      return FEAR;
    };

    const extend = (newOptions) => {
      options = Utils.extend(options, newOptions);
      Utils.setOptions(options);
      Registry.setGlobalOptions(options);
      return FEAR;
    };

    const on = (event, callback, context = null) => {
      Events.on(event, callback, context);
      return FEAR;
    };

    const off = (event, callback = null) => {
      Events.off(event, callback);
      return FEAR;
    };

    const emit = (event, data = null) => {
      Events.emit(event, data);
      return FEAR;
    };

    const once = (event, callback, context = null) => {
      Events.once(event, callback, context);
      return FEAR;
    };

    const destroy = () => {
      if (!isInitialized) return FEAR;

      Utils.log('Destroying framework instance');
      
      // Destroy all modules
      Registry.clear();
      
      // Remove event listeners
      $(window).off('.fear');
      $(document).off('.fear');
      
      // Clear event system
      Events.off();
      
      // Trigger destroy callback
      if (Utils.isFunction(options.callbacks.onDestroy)) {
        options.callbacks.onDestroy.call(FEAR);
      }
      
      // Clean up
      if ($element && $element.removeData) {
        $element.removeData(DATA_KEY);
      }
      
      isInitialized = false;
      options = {};
      $element = null;
      
      Events.emit('fear:destroy');
      return FEAR;
    };

    // Utility methods
    const utils = Utils;

    // Information methods
    const version = () => VERSION;
    const isInit = () => isInitialized;
    const modules = () => Registry.list();

    // Animation helpers
    const animate = selector => {
      if (Registry.has('animations')) {
        const $elements = $(selector);
        $elements.each((i, el) => {
          Animation.animateElement($(el));
        });
      }
      return FEAR;
    };

    // Router helpers
    const navigate = route => {
      if (Registry.has('router')) {
        Router.navigate(route);
      }
      return FEAR;
    };

    const route = () => {
      if (Registry.has('router')) {
        return Router.getCurrentRoute();
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
      
      if (Utils.isString(options)) {
        const method = options;
        if (Utils.isFunction(instance[method])) {
          const result = instance[method].apply(instance, args);
          return result !== undefined ? result : this;
        } else {
          throw new Error(`Method ${method} does not exist on FEAR framework`);
        }
      }
      
      if (Utils.isObject(options)) {
        instance.extend(options);
      }
    });
  };

  // Static properties
  $.fn.fear.Constructor = FEAR;
  $.fn.fear.defaults = DEFAULTS;
  $.fn.fear.version = VERSION;

  // Auto-initialize
  Utils.ready(() => {
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
  Utils.log(`${FRAMEWORK_NAME} Framework v${VERSION} loaded`);

})(jQuery, window, document);