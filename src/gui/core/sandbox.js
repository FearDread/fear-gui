import { utils } from "./utils";

export const SandBox = (function () {
    const DELIM = '__';

    return {
        /**
         * Factory method to create a new sandbox instance
         * 
         * @param $gui {object} - GUI instance
         * @param instance {string} - Unique instance identifier
         * @param options {object} - Configuration options
         * @param module {string} - Module name
         * @return {object} - Configured sandbox instance
         */
        create: ($gui, instance, options = {}, module) => {
            const sandbox = {
                id: instance,
                module: module,
                options: options,
                utils
            };

            // Attach Broker methods to sandbox API
            $gui._broker.install(sandbox);
            sandbox.broker = $gui._broker;

            sandbox.add = $gui.broker.add.bind($gui.broker);
            sandbox.remove = $gui.broker.remove.bind($gui.broker);
            sandbox.emit = $gui.broker.emit.bind($gui.broker);
            sandbox.fire = $gui.broker.fire.bind($gui.broker);

            // jQuery utilities
            sandbox.data = $.data;
            sandbox.deferred = () => $.Deferred();
            sandbox.animation = $.Animation;

            /**
             * Promise-based fetch wrapper for jQuery.ajax
             */

            // jQuery fetch wrapper
            sandbox.fetch = (url, settings = {}) => {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: typeof url === 'string' ? url : url.url,
                        ...settings,
                        success: (data, textStatus, jqXHR) => resolve({ data, textStatus, jqXHR }),
                        error: (jqXHR, textStatus) => reject(new Error(textStatus || 'Ajax failed'))
                    });
                });
            };

            /**
             * Enhanced DOM query with native and jQuery helper methods
             */
            sandbox.query = (selector, context) => {
                const $el = context && context.find ? context.find(selector) : $(selector);

                $el.query = (sel) => sandbox.query(sel, $el);
                $el.create = (el) => document.createElement(el);
                $el.size = () => parseFloat(window.getComputedStyle($el[0] || $el).fontSize);

                $el.animateAsync = (properties, duration, easing) => {
                    return new Promise((resolve, reject) => {
                        try {
                            $el.animate(properties, {
                                duration: duration,
                                easing: easing,
                                complete: () => resolve($el),
                                fail: (error) => reject(error)
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                };

                $el.onAsync = (event, selector) => {
                    return new Promise((resolve) => {
                        const handler = (e) => {
                            $el.off(event, selector, handler);
                            resolve(e);
                        };
                        if (selector) {
                            $el.on(event, selector, handler);
                        } else {
                            $el.on(event, handler);
                        }
                    });
                };

                return $el;
            };

            // Shorthand for query
            sandbox.$ = sandbox.query;

            /**
             * Promise-based timeout
             */
            sandbox.timeout = (ms, fn) => new Promise((resolve) => {
                setTimeout(() => resolve(fn && typeof fn === 'function' ? fn() : undefined), ms);
            });

            /**
             * Promise-based interval with cancellation support
             */
            sandbox.interval = (fn, ms, maxRuns) => {
                let intervalId;
                let runCount = 0;
                let stopped = false;

                const promise = new Promise((resolve, reject) => {
                    intervalId = setInterval(() => {
                        if (stopped) {
                            clearInterval(intervalId);
                            resolve(runCount);
                            return;
                        }

                        try {
                            fn();
                            runCount++;

                            if (maxRuns && runCount >= maxRuns) {
                                clearInterval(intervalId);
                                resolve(runCount);
                            }
                        } catch (error) {
                            clearInterval(intervalId);
                            reject(error);
                        }
                    }, ms);
                });

                return {
                    stop: () => {
                        stopped = true;
                        if (intervalId) {
                            clearInterval(intervalId);
                        }
                    },
                    promise: promise
                };
            };

            /**
             * Function context binding with partial application
             */
            sandbox.hitch = (fn, ...initialArgs) => {
                return function (...args) {
                    const allArgs = initialArgs.concat(args);
                    return fn.apply(this, allArgs);
                };
            };

            /**
             * Memoization with Promise support
             */
            sandbox.memoize = (source, cache, refetch) => {
                cache = cache || {};

                return (...args) => {
                    const key = args.length > 1 ? args.join(DELIM) : String(args[0] || '');

                    if (!(key in cache) || (refetch && cache[key] === refetch)) {
                        const result = source.apply(source, args);

                        if (result && typeof result.then === 'function') {
                            cache[key] = result.catch(error => {
                                delete cache[key];
                                throw error;
                            });
                        } else {
                            cache[key] = result;
                        }
                    }

                    return cache[key];
                };
            };

            /**
             * Load multiple resources (CSS, JS, JSON)
             */
            sandbox.loadResources = (resources, options = {}) => {
                const resourceArray = Array.isArray(resources) ? resources : [resources];

                const loadPromises = resourceArray.map(resource => {
                    if (typeof resource === 'string') {
                        const url = resource;
                        const extension = url.split('.').pop().toLowerCase();

                        switch (extension) {
                            case 'css':
                                return sandbox.loadCSS(url);
                            case 'js':
                                return sandbox.loadScript(url);
                            case 'json':
                                return sandbox.fetch(url).then(response => response.data);
                            default:
                                return sandbox.fetch(url);
                        }
                    } else if (resource && resource.type && resource.url) {
                        switch (resource.type) {
                            case 'css':
                                return sandbox.loadCSS(resource.url);
                            case 'script':
                                return sandbox.loadScript(resource.url);
                            case 'json':
                                return sandbox.fetch(resource.url).then(response => response.data);
                            default:
                                return sandbox.fetch(resource.url);
                        }
                    }

                    return Promise.reject(new Error('Invalid resource format'));
                });

                return Promise.all(loadPromises);
            };

            /**
             * Load CSS file dynamically
             */
            sandbox.loadCSS = (url) => {
                return new Promise((resolve, reject) => {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = url;

                    link.onload = () => resolve(link);
                    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));

                    document.head.appendChild(link);
                });
            };

            /**
             * Load JavaScript file dynamically
             */
            sandbox.loadScript = (url) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = url;

                    script.onload = () => resolve(script);
                    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));

                    document.head.appendChild(script);
                });
            };

            sandbox.getLocation = () => $gui.config.win && win.location;
            sandbox.log = (...args) => $gui.debug.log(...args);
            sandbox.warn = (...args) => $gui.debug.warn(...args);

            // Document/Window ready promises
            sandbox.ready = () => new Promise((resolve) => $(document).ready(resolve));
            sandbox.loaded = () => new Promise((resolve) => $(window).on('load', resolve));

            return sandbox;
        }
    };
})();

export const createSandbox = () => new SandBox().create();
export default { SandBox, createSandbox };