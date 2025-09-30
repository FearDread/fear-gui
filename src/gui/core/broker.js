import { Utils } from "./utils";

export const Broker = (() => {

    function Broker(obj, cascade) {
        this.cascade = (cascade) ? true : false;
        this.channels = {};

        if (Utils.isObj(obj)) {
            this.install(obj);
        } else if (obj === true) {
            this.cascade = true;
        }
    }

    /**
     * Bind function to specific context
     * @param {Function} fn - function to bind
     * @param {Object} me - context to bind to
     * @return {Function} - bound function
     */
    Broker.prototype.bind = (fn, me) => {
        return (...args) => {
            return fn.apply(me, args);
        };
    };

    /**
     * Add subscription to a channel
     * @param {String} channel - channel name
     * @param {Function} fn - callback function
     * @param {Object} context - execution context
     * @return {Object} - subscription object with listen/ignore methods
     */
    Broker.prototype.add = function(channel, fn, context) {
        const _this = this;

        if (!context || context === null) context = this;
        if (!this.channels[channel]) this.channels[channel] = [];
        
        const subscription = {
            event: channel,
            context: context,
            callback: fn || function(){}
        };
      
        return {
            listen() {
                _this.channels[channel].push(subscription);
                return this;
            },
            ignore() {
                _this.remove(channel, fn, context);
                return this;
            }
        }.listen();
    };

    /**
     * Remove subscriptions from channels
     * @param {String|Function|Object} channel - channel name, callback function, or context object
     * @param {Function} cb - optional callback to remove
     * @param {Object} context - optional context to remove
     * @return {Broker} - this broker instance
     */
    Broker.prototype.remove = function(channel, cb, context) {
        switch (typeof channel) {
            case "string":
                if (typeof cb === "function") {
                    Broker._delete(this, channel, cb, context);
                } else if (typeof cb === "undefined") {
                    Broker._delete(this, channel);
                }
                break;

            case "function":
                for (const id in this.channels) {
                    Broker._delete(this, id, channel);
                }
                break;

            case "undefined":
                for (const id in this.channels) {
                    Broker._delete(this, id);
                }
                break;

            case "object":
                for (const id in this.channels) {
                    Broker._delete(this, id, null, channel);
                }
        }

        return this;
    };

    /**
     * Fire event on channel (first successful handler wins)
     * @param {String} channel - channel name
     * @param {*} data - data to pass to handlers
     * @return {Promise} - resolves with first successful result
     */
    Broker.prototype.fire = function(channel, data) {
        if (typeof channel !== "string") {
            return Promise.reject(new Error("Channel must be a string"));
        }

        if (typeof data === "function") {
            data = undefined;
        }

        const tasks = this._setup(data, channel, channel, this);

        if (tasks.length === 0) {
            return Promise.resolve(null);
        }

        return Utils.run.first(tasks)
            .catch(errors => {
                if (Array.isArray(errors)) {
                    const errorMessages = errors
                        .filter(x => x !== null && x !== undefined)
                        .map(x => x.message || String(x));
                    
                    const error = new Error(errorMessages.join('; '));
                    error.originalErrors = errors;
                    throw error;
                }
                throw errors;
            });
    };
        
    /**
     * Emit event on channel (all handlers execute in series)
     * @param {String} channel - channel name
     * @param {*} data - data to pass to handlers
     * @param {String} origin - optional origin channel for cascade
     * @return {Promise} - resolves when all handlers complete
     */
    Broker.prototype.emit = function(channel, data, origin) {
        if (!origin || origin === null) {
            origin = channel;
        }

        if (data && Utils.isFunc(data)) {
            data = undefined;
        }

        if (typeof channel !== "string") {
            return Promise.reject(new Error("Channel must be a string"));
        }

        const tasks = this._setup(data, channel, origin, this);

        const emitPromise = Utils.run.series(tasks)
            .catch(errors => {
                if (Array.isArray(errors)) {
                    const errorMessages = errors
                        .filter(x => x !== null && x !== undefined)
                        .map(x => x.message || String(x));
                    
                    const error = new Error(errorMessages.join('; '));
                    error.originalErrors = errors;
                    throw error;
                }
                throw errors;
            });

        // Handle cascading
        if (this.cascade) {
            const channels = channel.split('/');
            if (channels.length > 1) {
                const parentChannel = channels.slice(0, -1).join('/');
                const originToUse = this.fireOrigin ? origin : parentChannel;
                
                return emitPromise.then(result => {
                    return this.emit(parentChannel, data, originToUse)
                        .then(() => result);
                });
            }
        }

        return emitPromise;
    };

    /**
     * Install broker methods on target object
     * @param {Object} obj - target object
     * @param {Boolean} forced - whether to override existing properties
     * @return {Broker} - this broker instance
     */
    Broker.prototype.install = function(obj, forced) {
        if (Utils.isObj(obj)) {
            for (const key in this) {
                const value = this[key];
                
                if (typeof value === 'function') {
                    if (forced || !obj[key]) {
                        obj[key] = value.bind(this);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Remove specific subscriptions from a channel
     * @param {Object} obj - broker instance
     * @param {String} channel - channel name
     * @param {Function} cb - callback to remove
     * @param {Object} context - context to remove
     * @return {Array} - remaining subscriptions
     */
    Broker._delete = function(obj, channel, cb, context) {
        if (!obj.channels[channel]) {
            return [];
        }

        obj.channels[channel] = obj.channels[channel].filter(subscription => {
            // Keep subscription if none of the removal criteria match
            if (cb && subscription.callback === cb) return false;
            if (context && subscription.context === context) return false;
            if (!cb && !context && subscription.context === obj) return false;
            return true;
        });

        return obj.channels[channel];
    };

    /**
     * Setup tasks for event execution
     * @param {*} data - data to pass to handlers
     * @param {String} channel - channel name
     * @param {String} origin - origin channel
     * @param {Object} context - broker context
     * @return {Array} - array of task functions
     */
    Broker.prototype._setup = function(data, channel, origin, context) {
        const subscribers = context.channels[channel] || [];
        
        return subscribers.map(sub => {
            return () => {
                return new Promise((resolve, reject) => {
                    try {
                        // Check if callback expects a callback parameter (async style)
                        if (Utils.hasArgs(sub.callback, 3)) {
                            sub.callback.call(sub.context, data, origin, (err, result) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(result);
                                }
                            });
                        } else {
                            // Synchronous callback or returns a promise
                            const result = sub.callback.call(sub.context, data, origin);
                            
                            // If result is a promise, use it directly
                            if (result && typeof result.then === 'function') {
                                result.then(resolve, reject);
                            } else {
                                resolve(result);
                            }
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            };
        });
    };

    /**
     * Pipe events from one channel to another
     * @param {String} src - source channel
     * @param {String} target - target channel
     * @param {Broker} broker - broker to pipe to (defaults to this)
     * @return {Broker} - this broker instance
     */
    Broker.prototype.pipe = function(src, target, broker) {
        // Handle parameter variations
        if (target instanceof Broker) {
            broker = target;
            target = src;
        }

        if (!broker) {
            return this.pipe(src, target, this);
        }

        if (broker === this && src === target) {
            return this;
        }

        this.add(src, (...args) => {
            return broker.fire(target, ...args);
        });

        return this;
    };

    /**
     * Create a channel that only fires once
     * @param {String} channel - channel name
     * @param {Function} fn - callback function
     * @param {Object} context - execution context
     * @return {Object} - subscription object
     */
    Broker.prototype.once = function(channel, fn, context) {
        const _this = this;
        let fired = false;

        const onceWrapper = function(...args) {
            if (!fired) {
                fired = true;
                _this.remove(channel, onceWrapper);
                return fn.apply(this, args);
            }
        };

        return this.add(channel, onceWrapper, context);
    };

    /**
     * Wait for an event to be fired
     * @param {String} channel - channel name
     * @param {Number} timeout - optional timeout in milliseconds
     * @return {Promise} - resolves when event fires or rejects on timeout
     */
    Broker.prototype.waitFor = function(channel, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;

            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };

            // Set up timeout if specified
            if (timeout && timeout > 0) {
                timeoutId = setTimeout(() => {
                    this.remove(channel, handler);
                    reject(new Error(`Timeout waiting for event '${channel}' after ${timeout}ms`));
                }, timeout);
            }

            // Set up event handler
            const handler = (data, origin) => {
                cleanup();
                this.remove(channel, handler);
                resolve({ data, origin, channel });
            };

            this.add(channel, handler);
        });
    };

    /**
     * Get all active channels
     * @return {Array} - array of channel names
     */
    Broker.prototype.getChannels = function() {
        return Object.keys(this.channels).filter(channel => 
            this.channels[channel] && this.channels[channel].length > 0
        );
    };

    /**
     * Get subscriber count for a channel
     * @param {String} channel - channel name
     * @return {Number} - number of subscribers
     */
    Broker.prototype.getSubscriberCount = function(channel) {
        return this.channels[channel] ? this.channels[channel].length : 0;
    };

    /**
     * Clear all subscriptions from all channels
     * @return {Broker} - this broker instance
     */
    Broker.prototype.clear = function() {
        this.channels = {};
        return this;
    };

    /**
     * Create a namespaced broker that prefixes all channel names
     * @param {String} namespace - namespace prefix
     * @return {Object} - namespaced broker interface
     */
    Broker.prototype.namespace = function(namespace) {
        const _this = this;
        const separator = '/';

        return {
            add: (channel, fn, context) => _this.add(namespace + separator + channel, fn, context),
            remove: (channel, cb, context) => _this.remove(namespace + separator + channel, cb, context),
            fire: (channel, data) => _this.fire(namespace + separator + channel, data),
            emit: (channel, data, origin) => _this.emit(namespace + separator + channel, data, origin),
            once: (channel, fn, context) => _this.once(namespace + separator + channel, fn, context),
            waitFor: (channel, timeout) => _this.waitFor(namespace + separator + channel, timeout),
            pipe: (src, target, broker) => _this.pipe(namespace + separator + src, namespace + separator + target, broker),
            getSubscriberCount: (channel) => _this.getSubscriberCount(namespace + separator + channel)
        };
    };

    return Broker;

})();

export default Broker;