import { GUI } from '../core/gui';
import { Cellar } from '../modules';
import { Events } from './event';

const FEAR = new GUI();
// Fear Portfolio Plugin using GUI Framework
export const FearPortfolioPlugin = (gui) => {

    // Plugin constants
    const PLUGIN_NAME = 'fearPortfolio';
    const VERSION = '2.0.0';

    // Default configuration
    const createDefaults = () => ({
        // Core settings
        debug: false,
        autoInit: true,
        
        // Module enablement
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
            particles: true
        },

        // Loader settings
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
        
        // Typed.js settings
        typed: {
            selector: '#typed',
            stringsElement: '#typed-strings',
            loop: true,
            typeSpeed: 60,
            backSpeed: 30,
            backDelay: 2500,
            headlineSelector: '.animated-headline'
        },
        
        // Swiper settings
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
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            }
        },
        
        // Magnific Popup settings
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
        
        // Countdown settings
        countdown: {
            selector: '#countdown',
            targetDate: new Date(2025, 9, 20),
            format: 'D',
            timezone: +10
        },
        
        // Vegas settings
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
        
        // Skillbars settings
        skillbars: {
            selector: '.skillbar',
            from: 0,
            speed: 4000,
            interval: 100,
            useIntersectionObserver: true
        },
        
        // Mailchimp settings
        mailchimp: {
            selector: '.notify-form',
            url: 'https://club.us10.list-manage.com/subscribe/post?u=e8d650c0df90e716c22ae4778&amp;id=54a7906900&amp;f_id=00b64ae4f0',
            successDelay: 5000,
            selectors: {
                notify: '.notify',
                form: '.form',
                successMessage: '.subscription-ok',
                errorMessage: '.subscription-error'
            }
        },
        
        // Contact form settings
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
        
        // Particles settings
        particles: {
            selector: '#triangles-js',
            config: {
                particles: {
                    number: {
                        value: 33,
                        density: { enable: true, value_area: 1420.4657549380909 }
                    },
                    color: { value: '#ffffff' },
                    shape: {
                        type: 'triangle',
                        stroke: { width: 0, color: '#000000' }
                    },
                    opacity: {
                        value: 0.06313181133058181,
                        random: false,
                        anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
                    },
                    size: {
                        value: 11.83721462448409,
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
        }
    });

    // Utility functions
    const createUtils = (options) => ({
        log: function(message, type = 'log') {
            if (options.debug && console && console[type]) {
                console[type](`[${PLUGIN_NAME}] ${message}`);
            }
        },

        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },

        throttle: function(func, limit) {
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
        }
    });

    // Loader Module
    const createLoaderModule = (api, config, utils) => ({
        name: 'loader',
        isInitialized: false,

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const { selectors, logoScaleDelay, loaderHideDelay, bodyLoadDelay } = config;
            
            return Promise.resolve()
                .then(() => {
                    api.$(selectors.logo).addClass('scaleOut');
                    return api.timeout(loaderHideDelay);
                })
                .then(() => {
                    api.$(selectors.loader).addClass('loaded');
                    api.$(selectors.main).addClass('active animate-in');
                    api.$(selectors.homeTriger).addClass('active-link');
                    return api.timeout(bodyLoadDelay - loaderHideDelay);
                })
                .then(() => {
                    api.$(selectors.body).addClass('loaded');
                })
                .catch(error => {
                    utils.log(`Loader module error: ${error.message}`, 'error');
                    throw error;
                });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            utils.log(`Destroying module: ${this.name}`);
            this.isInitialized = false;
            return Promise.resolve();
        }
    });

    // Typed Module
    const createTypedModule = (api, config, utils) => ({
        name: 'typed',
        isInitialized: false,
        instance: null,

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const { selector, stringsElement, headlineSelector, ...options } = config;
            const $headline = api.$(headlineSelector);
            
            return new Promise((resolve, reject) => {
                if ($headline.length && window.Typed) {
                    try {
                        this.instance = new Typed(selector, {
                            stringsElement,
                            ...options
                        });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve();
                }
            })
            .catch(error => {
                utils.log(`Typed module error: ${error.message}`, 'error');
                throw error;
            });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            return Promise.resolve()
                .then(() => {
                    if (this.instance) {
                        this.instance.destroy();
                        this.instance = null;
                    }
                    
                    utils.log(`Destroying module: ${this.name}`);
                    this.isInitialized = false;
                });
        }
    });

    // Swiper Module
    const createSwiperModule = (api, config, utils) => ({
        name: 'swiper',
        isInitialized: false,
        instance: null,

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const { selector, options } = config;
            const $swiper = api.$(selector);
            
            return new Promise((resolve, reject) => {
                if ($swiper.length && window.Swiper) {
                    try {
                        this.instance = new Swiper(selector, options);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve();
                }
            })
            .catch(error => {
                utils.log(`Swiper module error: ${error.message}`, 'error');
                throw error;
            });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            return Promise.resolve()
                .then(() => {
                    if (this.instance) {
                        this.instance.destroy();
                        this.instance = null;
                    }
                    
                    utils.log(`Destroying module: ${this.name}`);
                    this.isInitialized = false;
                });
        }
    });

    // Magnific Popup Module
    const createMagnificPopupModule = (api, config, utils) => ({
        name: 'magnificPopup',
        isInitialized: false,

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const { selector, options } = config;
            const $trigger = api.$(selector);
            
            return new Promise((resolve) => {
                if ($trigger.length && api.$.magnificPopup) {
                    $trigger.magnificPopup({
                        ...options,
                        callbacks: {
                            beforeOpen: () => api.$('body').addClass('overflow-hidden'),
                            close: () => api.$('body').removeClass('overflow-hidden'),
                            ...options.callbacks
                        }
                    });
                }
                resolve();
            })
            .catch(error => {
                utils.log(`Magnific Popup module error: ${error.message}`, 'error');
                throw error;
            });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            utils.log(`Destroying module: ${this.name}`);
            this.isInitialized = false;
            return Promise.resolve();
        }
    });

    // Skillbars Module
    const createSkillbarsModule = (api, config, utils) => ({
        name: 'skillbars',
        isInitialized: false,
        observers: [],

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const $skillbars = api.$(config.selector);
            
            if (!$skillbars.length) {
                return Promise.resolve();
            }

            return this.initCustomSkillbars($skillbars)
                .catch(error => {
                    utils.log(`Skillbars module error: ${error.message}`, 'error');
                    throw error;
                });
        },

        initCustomSkillbars: function($skillbars) {
            const promises = [];

            $skillbars.each((index, element) => {
                const promise = new Promise((resolve) => {
                    const $skillbar = api.$(element);
                    const $bar = $skillbar.find('.skillbar-bar');
                    const $percent = $skillbar.find('.skillbar-percent');
                    const percent = parseInt($bar.attr('data-percent') || '0', 10);
                    
                    if (config.useIntersectionObserver && window.IntersectionObserver) {
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach((entry) => {
                                if (entry.isIntersecting) {
                                    this.animateSkillbar($bar, $percent, percent)
                                        .then(resolve);
                                    observer.unobserve(entry.target);
                                }
                            });
                        });
                        observer.observe(element);
                        this.observers.push(observer);
                    } else {
                        this.animateSkillbar($bar, $percent, percent)
                            .then(resolve);
                    }
                });
                promises.push(promise);
            });

            return Promise.all(promises);
        },

        animateSkillbar: function($bar, $percent, targetPercent) {
            return new Promise((resolve) => {
                const { speed, interval } = config;
                let currentPercent = 0;
                const increment = targetPercent / (speed / interval);
                
                const timer = setInterval(() => {
                    currentPercent += increment;
                    if (currentPercent >= targetPercent) {
                        currentPercent = targetPercent;
                        clearInterval(timer);
                        resolve();
                    }
                    
                    $bar.css('width', `${currentPercent}%`);
                    $percent.text(`${Math.round(currentPercent)}%`);
                }, interval);
            });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            return Promise.resolve()
                .then(() => {
                    this.observers.forEach(observer => observer.disconnect());
                    this.observers = [];
                    
                    utils.log(`Destroying module: ${this.name}`);
                    this.isInitialized = false;
                });
        }
    });

    // Contact Form Module
    const createContactFormModule = (api, config, utils) => ({
        name: 'contactForm',
        isInitialized: false,

        init: function() {
            if (this.isInitialized) {
                utils.log(`Module ${this.name} already initialized`, 'warn');
                return Promise.resolve();
            }

            utils.log(`Initializing module: ${this.name}`);
            this.isInitialized = true;
            
            const $form = api.$(config.selector);
            
            if (!$form.length) {
                return Promise.resolve();
            }

            return api.on($form[0], 'submit', (e) => this.handleSubmit(e))
                .catch(error => {
                    utils.log(`Contact Form module error: ${error.message}`, 'error');
                    throw error;
                });
        },

        handleSubmit: function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            return api.fetch(config.url, {
                method: 'POST',
                body: formData
            })
            .then(() => this.showSuccess())
            .catch(() => {
                utils.log('Contact form submission failed', 'error');
            });
        },

        showSuccess: function() {
            const { selectors, successDelay } = config;
            const $container = api.$(selectors.container);
            const $form = $container.find(selectors.form);
            const $replyGroup = $container.find(selectors.replyGroup);
            
            return Promise.resolve()
                .then(() => {
                    $form.addClass('is-hidden');
                    $replyGroup.addClass('is-visible');
                    return api.timeout(successDelay);
                })
                .then(() => {
                    $replyGroup.removeClass('is-visible');
                    return api.timeout(300);
                })
                .then(() => {
                    $form.removeClass('is-hidden');
                    api.$(config.selector)[0].reset();
                });
        },

        destroy: function() {
            if (!this.isInitialized) return Promise.resolve();
            
            utils.log(`Destroying module: ${this.name}`);
            this.isInitialized = false;
            return Promise.resolve();
        }
    });

    // Main Portfolio Interface
    const createPortfolioInterface = (element, userOptions) => {
        const options = gui.Utils.merge(createDefaults(), userOptions || {});
        const utils = createUtils(options);
        const modules = new Map();
        let isInitialized = false;

        // Module factory functions
        const moduleFactories = {
            loader: (api, config) => createLoaderModule(api, config, utils),
            typed: (api, config) => createTypedModule(api, config, utils),
            swiper: (api, config) => createSwiperModule(api, config, utils),
            magnificPopup: (api, config) => createMagnificPopupModule(api, config, utils),
            skillbars: (api, config) => createSkillbarsModule(api, config, utils),
            contactForm: (api, config) => createContactFormModule(api, config, utils)
        };

        return {
            /**
             * Initialize the portfolio plugin
             * @return {Promise<object>} resolves with portfolio interface
             */
            init: function() {
                if (isInitialized) {
                    utils.log('Portfolio already initialized', 'warn');
                    return Promise.resolve(this);
                }

                utils.log(`Initializing ${PLUGIN_NAME} v${VERSION}`);
                isInitialized = true;

                return gui.ready()
                    .then(() => this.onDOMReady())
                    .then(() => gui.loaded())
                    .then(() => this.onWindowLoad())
                    .then(() => {
                        utils.log('Portfolio initialization complete');
                        return this;
                    })
                    .catch(error => {
                        utils.log(`Initialization failed: ${error.message}`, 'error');
                        throw error;
                    });
            },

            /**
             * Handle DOM ready initialization
             * @return {Promise<boolean>} resolves when DOM modules are loaded
             */
            onDOMReady: function() {
                const domModules = ['swiper', 'magnificPopup', 'skillbars', 'contactForm'];
                const promises = [];

                domModules.forEach(name => {
                    if (options.modules[name] && moduleFactories[name]) {
                        promises.push(this.initModule(name));
                    }
                });

                return Promise.all(promises);
            },

            /**
             * Handle window load initialization
             * @return {Promise<boolean>} resolves when load modules are ready
             */
            onWindowLoad: function() {
                const loadModules = ['loader', 'typed'];
                const promises = [];

                loadModules.forEach(name => {
                    if (options.modules[name] && moduleFactories[name]) {
                        promises.push(this.initModule(name));
                    }
                });

                return Promise.all(promises);
            },

            /**
             * Initialize a specific module
             * @param {string} name - module name
             * @return {Promise<object>} resolves with module instance
             */
            initModule: function(name) {
                return Promise.resolve()
                    .then(() => {
                        if (modules.has(name)) {
                            utils.log(`Module ${name} already exists`, 'warn');
                            return modules.get(name);
                        }

                        const factory = moduleFactories[name];
                        if (!factory) {
                            throw new Error(`Module factory for ${name} not found`);
                        }

                        const config = options[name];
                        const module = factory(gui, config);
                        modules.set(name, module);
                        
                        return module.init()
                            .then(() => module);
                    })
                    .catch(error => {
                        utils.log(`Error initializing module ${name}: ${error.message}`, 'error');
                        throw error;
                    });
            },

            /**
             * Enable a module
             * @param {string} name - module name
             * @return {Promise<object>} resolves with this interface
             */
            enableModule: function(name) {
                return Promise.resolve()
                    .then(() => {
                        options.modules[name] = true;
                        return this.initModule(name);
                    })
                    .then(() => this);
            },

            /**
             * Disable a module
             * @param {string} name - module name
             * @return {Promise<object>} resolves with this interface
             */
            disableModule: function(name) {
                return Promise.resolve()
                    .then(() => {
                        options.modules[name] = false;
                        if (modules.has(name)) {
                            const module = modules.get(name);
                            return module.destroy()
                                .then(() => modules.delete(name));
                        }
                    })
                    .then(() => this);
            },

            /**
             * Get a specific module
             * @param {string} name - module name
             * @return {object|null} module instance or null
             */
            getModule: function(name) {
                return modules.get(name) || null;
            },

            /**
             * Update plugin options
             * @param {object} newOptions - new options to merge
             * @return {Promise<object>} resolves with this interface
             */
            updateOptions: function(newOptions) {
                return Promise.resolve()
                    .then(() => {
                        gui.Utils.merge(options, newOptions);
                        return this;
                    });
            },

            /**
             * Destroy the portfolio plugin
             * @return {Promise<boolean>} resolves when destroyed
             */
            destroy: function() {
                utils.log('Destroying portfolio instance');
                
                const destroyPromises = [];
                modules.forEach((module) => {
                    destroyPromises.push(module.destroy());
                });
                
                return Promise.all(destroyPromises)
                    .then(() => {
                        modules.clear();
                        isInitialized = false;
                        return true;
                    })
                    .catch(error => {
                        utils.log(`Destroy error: ${error.message}`, 'error');
                        return false;
                    });
            },

            // Getters
            getOptions: function() { return { ...options }; },
            getVersion: function() { return VERSION; },
            isInitialized: function() { return isInitialized; }
        };
    };

    // Plugin interface
    return {
        load: function(api) {
            return Promise.resolve()
                .then(() => {
                    // Add portfolio factory to API
                    api.portfolio = {
                        create: createPortfolioInterface,
                        version: VERSION
                    };

                    // jQuery-like plugin method
                    api.fearPortfolio = function(selector, options) {
                        const elements = api.$(selector);
                        const promises = [];

                        elements.each((index, element) => {
                            const portfolio = createPortfolioInterface(element, options);
                            const promise = portfolio.init()
                                .then(() => portfolio)
                                .catch(error => {
                                    api.warn('Portfolio initialization failed:', error);
                                    throw error;
                                });
                            promises.push(promise);
                        });

                        if (promises.length === 1) {
                            return promises[0];
                        }
                        return Promise.all(promises);
                    };

                    return api;
                })
                .catch(error => {
                    api.warn('FearPortfolio plugin load failed:', error);
                    throw error;
                });
        },

        unload: function(api) {
            return Promise.resolve()
                .then(() => {
                    if (api.portfolio) {
                        delete api.portfolio;
                    }
                    if (api.fearPortfolio) {
                        delete api.fearPortfolio;
                    }
                })
                .catch(() => {
                    // Ensure cleanup even if error occurs
                    if (api.portfolio) delete api.portfolio;
                    if (api.fearPortfolio) delete api.fearPortfolio;
                });
        }
    };
};

// Usage example with GUI framework
export const initFearIgnite = () => {

FEAR.use(FearPortfolioPlugin);

FEAR.start().then(() => {
    return FEAR.fearPortfolio('[data-fear-portfolio]', {
        debug: true,
        modules: {
            loader: true,
            typed: true,
            skillbars: true
        }
    });
}).then(portfolio => {
    console.log('Portfolio initialized:', portfolio);
}).catch(error => {
    console.error('Portfolio initialization failed:', error);
});
}



export { FEAR as FearGUI, initFearIgnite };

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.FEAR = initFearApp()
                .then(() => console.log('FEAR SPA LOADED'))
                .catch(() => console.log('Error Loading FEAR'))
                .finally(() => console.log('FEAR SPA INITIALIZATION COMPLETE'));
        });
    } else {
        window.FEAR = initFearApp()
            .then(() => console.log('FEAR SPA LOADED'))
            .catch(() => console.log('Error Loading FEAR'))
            .finally(() => console.log('FEAR SPA INITIALIZATION COMPLETE'));
    }
}