import { Utils } from "./utils";

export const SandBox = (() => {
    const DELIM = '__';

    return {
        // create new API sandbox instance
        create: ($gui, instance, options, module) => {
            const sandbox = {
                id: instance,
                module: module,
                options: options || {}
            };

            /* Attach Broker methods to sandbox api */ 
            $gui._broker.install(sandbox);
            sandbox.broker = $gui._broker;

            /* Add Utils object to sandbox api */
            sandbox.Utils = Utils;
             
            /* jQuery wrappers - converted to Promise-based */
            sandbox.fetch = (url, settings = {}) => {
                return new Promise((resolve, reject) => {
                    const ajaxSettings = {
                        ...settings,
                        success: (data, textStatus, jqXHR) => {
                            resolve({ data, textStatus, jqXHR });
                        },
                        error: (jqXHR, textStatus, errorThrown) => {
                            const error = new Error(textStatus || 'Ajax request failed');
                            error.jqXHR = jqXHR;
                            error.textStatus = textStatus;
                            error.errorThrown = errorThrown;
                            reject(error);
                        }
                    };

                    if (typeof url === 'string') {
                        ajaxSettings.url = url;
                    } else if (typeof url === 'object') {
                        Object.assign(ajaxSettings, url);
                    }

                    $.ajax(ajaxSettings);
                });
            };

            sandbox.data = $.data;
            sandbox.deferred = () => $.Deferred();
            sandbox.animation = $.Animation;

            /* Module Namespaces */ 
            SandBox.libs = {};
            sandbox.ui = {};
            sandbox.dom = {};
            sandbox.net = {};

            /**
             * Search DOM for selector and wrap with both native and jQuery helper methods 
             *
             * @param selector {string} - the element to scan DOM for
             * @param context {object} - optional context object to be applied to returned object wrapper
             * @return {object} - enhanced jQuery wrapped element DOM object 
            **/
            sandbox.query = (selector, context) => {
                let $el;
                
                // check for applied context
                if (context && context.find) {
                    // use dom find
                    $el = context.find(selector);
                } else {
                    // wrap with jQuery
                    $el = $(selector);
                }

                // Enhanced jQuery object with additional methods
                const enhancedEl = Object.create($el);
                
                // Copy jQuery properties and methods
                Object.setPrototypeOf(enhancedEl, $el);
                enhancedEl.length = $el.length;

                // Add custom methods
                enhancedEl.query = (sel) => {
                    return sandbox.query(sel, $el);
                };

                enhancedEl.create = (el) => {
                    if (!Utils.isStr(el)) {
                        sandbox.warn('Error :: Element must be type String.');
                        return false;
                    }

                    return document.createElement(el);
                };

                enhancedEl.size = () => {
                    return parseFloat(
                        window.getComputedStyle($el[0] || $el).fontSize
                    );
                };

                // Promise-based animation helper
                enhancedEl.animateAsync = (properties, duration, easing) => {
                    return new Promise((resolve, reject) => {
                        try {
                            $el.animate(properties, {
                                duration: duration,
                                easing: easing,
                                complete: () => resolve(enhancedEl),
                                fail: (error) => reject(error)
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                };

                // Promise-based event handling
                enhancedEl.onAsync = (event, selector) => {
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

                return enhancedEl;
            };

            /**
             * Assign $ as shorthand query method 
            **/
            sandbox.$ = sandbox.query;

            /**
             * Reference Utils / jQuery each method 
            **/
            sandbox.each = $.each;

            /**
             * Promise-based timeout method 
             *
             * @param ms {number} - milliseconds to wait
             * @param fn {function} - optional function to execute after timeout
             * @return {Promise} - resolves after the specified time
            **/
            sandbox.timeout = (ms, fn) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        if (fn && typeof fn === 'function') {
                            const result = fn();
                            resolve(result);
                        } else {
                            resolve();
                        }
                    }, ms);
                });
            };

            /**
             * Promise-based interval method that can be cancelled
             *
             * @param fn {function} - function to execute on each interval
             * @param ms {number} - milliseconds between executions
             * @param maxRuns {number} - optional maximum number of runs
             * @return {object} - object with stop method and promise that resolves when done
            **/
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
             * Reference $gui core log method 
             *
             * @return {function} 
            **/
            sandbox.log = (...args) => {
                return $gui.debug.log(...args);
            };

            /**
             * Reference $gui core warn method 
             *
             * @return {function}
            **/
            sandbox.warn = (...args) => {
                return $gui.debug.warn(...args);
            };

            /**
             * Get location with stored reference to window object 
             *
             * @return {object} - specific window reference location 
            **/
            sandbox.getLocation = () => {
                const win = $gui.config.win;
                return win && win.location;
            };

            /**
             * Take function and apply new context when executed 
             * 
             * @param fn {function} - the function to swap contexts 
             * @return {function} - executes fn 
            **/
            sandbox.hitch = (fn, ...initialArgs) => {
                return function(...args) {
                    const allArgs = initialArgs.concat(args);
                    return fn.apply(this, allArgs);
                };
            };

            /**
             * Cache the results of a function call with Promise support
             * 
             * @param source {function} - the function to execute and store 
             * @param cache {object} - optional store to keep cached results 
             * @param refetch {string} - optional key to update in cache
             * @return {function} - memoized function that returns cached results 
            **/
            sandbox.memoize = (source, cache, refetch) => {
                cache = cache || {};

                return (...args) => {
                    const key = args.length > 1 ? args.join(DELIM) : String(args[0] || '');

                    if (!(key in cache) || (refetch && cache[key] === refetch)) {
                        const result = source.apply(source, args);
                        
                        // If the result is a promise, cache the promise
                        if (result && typeof result.then === 'function') {
                            cache[key] = result.catch(error => {
                                // Remove failed promises from cache so they can be retried
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
             * Promise-based resource loader
             *
             * @param resources {array|string} - URLs or resource objects to load
             * @param options {object} - loading options
             * @return {Promise} - resolves when all resources are loaded
            **/
            sandbox.loadResources = (resources, options = {}) => {
                const resourceArray = Array.isArray(resources) ? resources : [resources];
                
                const loadPromises = resourceArray.map(resource => {
                    if (typeof resource === 'string') {
                        // Determine resource type by extension or explicit type
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
             *
             * @param url {string} - CSS file URL
             * @return {Promise} - resolves when CSS is loaded
            **/
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
             *
             * @param url {string} - JavaScript file URL
             * @return {Promise} - resolves when script is loaded
            **/
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

            /**
             * Wait for DOM ready state
             *
             * @return {Promise} - resolves when DOM is ready
            **/
            sandbox.ready = () => {
                return new Promise((resolve) => {
                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                        resolve();
                    } else {
                        $(document).ready(resolve);
                    }
                });
            };

            /**
             * Wait for window load event
             *
             * @return {Promise} - resolves when window is fully loaded
            **/
            sandbox.loaded = () => {
                return new Promise((resolve) => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        $(window).on('load', resolve);
                    }
                });
            };

            return sandbox;
        }
    };
})();

export default SandBox;