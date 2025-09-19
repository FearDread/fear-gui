
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