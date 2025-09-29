export const Events = ((FEAR) => {

    function Event() {
        this._observers = new Map();
        this._onceHandlers = new WeakSet();
    }

    /**
     * Determine if current device is mobile based on user agent
     * @param {string} agent - the user agent string (defaults to navigator.userAgent)
     * @return {boolean} true if mobile device detected
     */
    Event.prototype.isMobile = function(agent) {
        if (!agent) {
            agent = navigator.userAgent || '';
        }
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
    };

    /**
     * Create new custom event with modern GUI support
     * @param {string} eventName - name of the event
     * @param {object} options - event configuration
     * @param {boolean} options.bubbles - whether event should bubble (default: false)
     * @param {boolean} options.cancelable - whether event is cancelable (default: false)
     * @param {*} options.detail - optional data payload (default: null)
     * @return {Event} new custom event
     */
    Event.prototype.create = function(eventName, options = {}) {
        const {
            bubbles = false,
            cancelable = false,
            detail = null
        } = options;

        // Modern browsers with CustomEvent constructor
        if (typeof CustomEvent === 'function') {
            return new CustomEvent(eventName, {
                bubbles,
                cancelable,
                detail
            });
        }
        // Fallback for older browsers
        else if (document.createEvent) {
            const customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent(eventName, bubbles, cancelable, detail);
            return customEvent;
        }
        // IE 8 and below
        else if (document.createEventObject) {
            const customEvent = document.createEventObject();
            customEvent.eventType = eventName;
            customEvent.bubbles = bubbles;
            customEvent.cancelable = cancelable;
            customEvent.detail = detail;
            return customEvent;
        }
        // Ultimate fallback
        else {
            return {
                type: eventName,
                eventName: eventName,
                bubbles: bubbles,
                cancelable: cancelable,
                detail: detail,
                timeStamp: Date.now()
            };
        }
    };

    /**
     * Fire event on element with Promise support
     * @param {Element} elem - the DOM element
     * @param {Event|string} event - the event object or event name
     * @param {object} detail - optional event detail data
     * @return {Promise<boolean>} resolves with dispatch result
     */
    Event.prototype.fire = function(elem, event, detail) {
        return new Promise((resolve, reject) => {
            try {
                if (!elem) {
                    reject(new Error('Element is required'));
                    return;
                }

                let eventObj;

                // If event is a string, create the event
                if (typeof event === 'string') {
                    eventObj = this.create(event, { detail });
                } else {
                    eventObj = event;
                }

                if (!eventObj) {
                    reject(new Error('Invalid event'));
                    return;
                }

                // Modern browsers
                if (elem.dispatchEvent) {
                    const result = elem.dispatchEvent(eventObj);
                    resolve(result);
                }
                // IE 8 and below
                else if (elem.fireEvent && eventObj.eventType) {
                    const result = elem.fireEvent('on' + eventObj.eventType, eventObj);
                    resolve(result);
                }
                // Direct property access fallback
                else if (eventObj.type || eventObj.eventName) {
                    const eventName = eventObj.type || eventObj.eventName;
                    if (elem[eventName]) {
                        elem[eventName]();
                        resolve(true);
                    } else if (elem['on' + eventName]) {
                        elem['on' + eventName]();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
                else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Add event listener with Promise-based handling
     * @param {Element} elem - the DOM element
     * @param {string} eventName - event name (without 'on' prefix)
     * @param {function} handler - event handler function
     * @param {object} options - event listener options
     * @return {Promise<object>} resolves with removal function
     */
    Event.prototype.add = function(elem, eventName, handler, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!elem || !eventName || !handler) {
                    reject(new Error('Element, event name, and handler are required'));
                    return;
                }

                const { passive = false, once = false, capture = false } = options;

                let wrappedHandler = handler;

                // Handle once option manually for older browsers
                if (once && !elem.addEventListener) {
                    wrappedHandler = function(...args) {
                        const result = handler.apply(this, args);
                        Event.prototype.remove.call(this, elem, eventName, wrappedHandler);
                        return result;
                    };
                    this._onceHandlers.add(wrappedHandler);
                }

                // Modern browsers
                if (elem.addEventListener) {
                    const listenerOptions = typeof options === 'boolean' ? capture : {
                        passive,
                        once,
                        capture
                    };
                    
                    elem.addEventListener(eventName, wrappedHandler, listenerOptions);
                }
                // IE 8 and below
                else if (elem.attachEvent) {
                    elem.attachEvent('on' + eventName, wrappedHandler);
                }
                // Direct property assignment fallback
                else {
                    elem['on' + eventName] = wrappedHandler;
                }

                // Store observer for tracking
                const observerKey = `${eventName}_${handler.toString()}`;
                if (!this._observers.has(elem)) {
                    this._observers.set(elem, new Map());
                }
                this._observers.get(elem).set(observerKey, { handler: wrappedHandler, eventName });

                // Return removal function
                resolve({
                    remove: () => this.remove(elem, eventName, wrappedHandler),
                    element: elem,
                    eventName: eventName,
                    handler: wrappedHandler
                });

            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Remove event listener
     * @param {Element} elem - the DOM element
     * @param {string} eventName - event name (without 'on' prefix)
     * @param {function} handler - event handler function to remove
     * @return {Promise<boolean>} resolves with success status
     */
    Event.prototype.remove = function(elem, eventName, handler) {
        return new Promise((resolve) => {
            try {
                if (!elem || !eventName) {
                    resolve(false);
                    return;
                }

                // Modern browsers
                if (elem.removeEventListener) {
                    elem.removeEventListener(eventName, handler, false);
                }
                // IE 8 and below
                else if (elem.detachEvent) {
                    elem.detachEvent('on' + eventName, handler);
                }
                // Direct property removal fallback
                else {
                    delete elem['on' + eventName];
                }

                // Clean up tracking
                if (this._observers.has(elem)) {
                    const elemObservers = this._observers.get(elem);
                    const observerKey = `${eventName}_${handler.toString()}`;
                    elemObservers.delete(observerKey);
                    
                    if (elemObservers.size === 0) {
                        this._observers.delete(elem);
                    }
                }

                resolve(true);

            } catch (error) {
                resolve(false);
            }
        });
    };

    /**
     * Add event listener that only fires once
     * @param {Element} elem - the DOM element
     * @param {string} eventName - event name
     * @param {function} handler - event handler function
     * @return {Promise<object>} resolves with event data when fired
     */
    Event.prototype.once = function(elem, eventName, handler) {
        return new Promise((resolve, reject) => {
            const onceHandler = (event) => {
                this.remove(elem, eventName, onceHandler)
                    .then(() => {
                        try {
                            const result = handler ? handler(event) : event;
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
            };

            this.add(elem, eventName, onceHandler)
                .catch(reject);
        });
    };

    /**
     * Wait for an event to occur
     * @param {Element} elem - the DOM element
     * @param {string} eventName - event name to wait for
     * @param {number} timeout - optional timeout in milliseconds
     * @return {Promise<Event>} resolves with event when fired
     */
    Event.prototype.waitFor = function(elem, eventName, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;

            if (timeout && timeout > 0) {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timeout waiting for '${eventName}' event after ${timeout}ms`));
                }, timeout);
            }

            this.once(elem, eventName, (event) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve(event);
            }).catch(reject);
        });
    };

    /**
     * Get viewport inner height cross-browser
     * @return {number} viewport height in pixels
     */
    Event.prototype.innerHeight = function() {
        // Modern browsers
        if (typeof window.innerHeight === 'number') {
            return window.innerHeight;
        }
        // IE 6-8 in standards mode
        else if (document.documentElement && typeof document.documentElement.clientHeight === 'number') {
            return document.documentElement.clientHeight;
        }
        // IE 6 in quirks mode
        else if (document.body && typeof document.body.clientHeight === 'number') {
            return document.body.clientHeight;
        }
        
        return 0;
    };

    /**
     * Get viewport inner width cross-browser
     * @return {number} viewport width in pixels
     */
    Event.prototype.innerWidth = function() {
        // Modern browsers
        if (typeof window.innerWidth === 'number') {
            return window.innerWidth;
        }
        // IE 6-8 in standards mode
        else if (document.documentElement && typeof document.documentElement.clientWidth === 'number') {
            return document.documentElement.clientWidth;
        }
        // IE 6 in quirks mode
        else if (document.body && typeof document.body.clientWidth === 'number') {
            return document.body.clientWidth;
        }
        
        return 0;
    };

    /**
     * Get element's computed style property
     * @param {Element} elem - the DOM element
     * @param {string} property - CSS property name
     * @return {Promise<string>} resolves with computed style value
     */
    Event.prototype.getComputedStyle = function(elem, property) {
        return new Promise((resolve, reject) => {
            try {
                if (!elem) {
                    reject(new Error('Element is required'));
                    return;
                }

                // Modern browsers
                if (window.getComputedStyle) {
                    const computed = window.getComputedStyle(elem);
                    resolve(computed.getPropertyValue(property) || computed[property]);
                }
                // IE 8 and below
                else if (elem.currentStyle) {
                    resolve(elem.currentStyle[property]);
                }
                else {
                    resolve(elem.style[property] || '');
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Animate element property changes
     * @param {Element} elem - the DOM element
     * @param {object} properties - CSS properties to animate
     * @param {number} duration - animation duration in milliseconds
     * @param {string} easing - easing function (default: 'ease')
     * @return {Promise} resolves when animation completes
     */
    Event.prototype.animate = function(elem, properties, duration = 300, easing = 'ease') {
        return new Promise((resolve, reject) => {
            try {
                if (!elem) {
                    reject(new Error('Element is required'));
                    return;
                }

                // Check for CSS Transitions support
                const supportsTransitions = 'transition' in elem.style ||
                    'webkitTransition' in elem.style ||
                    'mozTransition' in elem.style ||
                    'oTransition' in elem.style;

                if (supportsTransitions) {
                    // Set up transition
                    const transitionProperty = Object.keys(properties).join(', ');
                    elem.style.transition = `${transitionProperty} ${duration}ms ${easing}`;

                    // Apply properties
                    Object.keys(properties).forEach(prop => {
                        elem.style[prop] = properties[prop];
                    });

                    // Wait for transition to complete
                    const cleanup = () => {
                        elem.style.transition = '';
                        elem.removeEventListener('transitionend', onTransitionEnd);
                        elem.removeEventListener('transitioncancel', onTransitionCancel);
                    };

                    const onTransitionEnd = () => {
                        cleanup();
                        resolve(elem);
                    };

                    const onTransitionCancel = () => {
                        cleanup();
                        reject(new Error('Animation was cancelled'));
                    };

                    elem.addEventListener('transitionend', onTransitionEnd, { once: true });
                    elem.addEventListener('transitioncancel', onTransitionCancel, { once: true });

                    // Fallback timeout
                    setTimeout(() => {
                        cleanup();
                        resolve(elem);
                    }, duration + 50);

                } else {
                    // Fallback for browsers without transition support
                    Object.keys(properties).forEach(prop => {
                        elem.style[prop] = properties[prop];
                    });
                    
                    setTimeout(() => resolve(elem), duration);
                }

            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Remove all event listeners from an element
     * @param {Element} elem - the DOM element
     * @return {Promise<boolean>} resolves when all listeners are removed
     */
    Event.prototype.removeAll = function(elem) {
        return new Promise((resolve) => {
            try {
                if (this._observers.has(elem)) {
                    const elemObservers = this._observers.get(elem);
                    const removePromises = [];

                    elemObservers.forEach((observer) => {
                        removePromises.push(
                            this.remove(elem, observer.eventName, observer.handler)
                        );
                    });

                    Promise.all(removePromises)
                        .then(() => resolve(true))
                        .catch(() => resolve(false));
                } else {
                    resolve(true);
                }
            } catch (error) {
                resolve(false);
            }
        });
    };

    return {
        load: function(GUI) {
            // Ensure dom namespace exists
            if (!GUI.dom) {
                GUI.dom = {};
            }
            GUI.dom.Event = new Event();
            
            // Add shorthand methods to sandbox
            GUI.on = (elem, event, handler, options) => GUI.dom.Event.add(elem, event, handler, options);
            GUI.off = (elem, event, handler) => GUI.dom.Event.remove(elem, event, handler);
            GUI.once = (elem, event, handler) => GUI.dom.Event.once(elem, event, handler);
            GUI.fire = (elem, event, detail) => GUI.dom.Event.fire(elem, event, detail);
            GUI.waitFor = (elem, event, timeout) => GUI.dom.Event.waitFor(elem, event, timeout);
            GUI.animate = (elem, props, duration, easing) => GUI.dom.Event.animate(elem, props, duration, easing);
            
            return Promise.resolve();
        },
        
        unload: function(GUI) {
            // Clean up all event listeners
            if (GUI.dom && GUI.dom.Event && GUI.dom.Event.removeAll) {
                const promises = [];
                
                // Remove all tracked listeners
                if (GUI.dom.Event._observers) {
                    GUI.dom.Event._observers.forEach((observers, elem) => {
                        promises.push(GUI.dom.Event.removeAll(elem));
                    });
                }
                
                return Promise.all(promises).then(() => {
                    delete GUI.dom.Event;
                    delete GUI.on;
                    delete GUI.off;
                    delete GUI.once;
                    delete GUI.fire;
                    delete GUI.waitFor;
                    delete GUI.animate;
                });
            }
            
            return Promise.resolve();
        }
    }
})();

export default Events;