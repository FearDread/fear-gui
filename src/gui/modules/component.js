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
