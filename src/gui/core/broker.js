// src/broker.js - Event Broker Module
import { utils } from './utils';

/**
 * Create a new EventBroker instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.cascade - Enable cascading events to parent this.channels
 * @param {boolean} options.fireOrigin - Use original origin in cascaded events
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Object} Broker this
 */
export const Broker = function(options = {}) {
  const self = this;
  this.channels = {};
  this.cascade = options.cascade || false;
  this.fireOrigin = options.fireOrigin || false;
  this.debug = options.debug || false;

  // ==================== Private Methods ====================
  this._delete = (channel, callback, context) => {
    if (!this.channels[channel]) return [];

    const originalLength = this.channels[channel].length;

    this.channels[channel] = this.channels[channel].filter(sub => {
      if (callback && sub.callback === callback) return false;
      if (context && sub.context === context) return false;
      if (!callback && !context && sub.context === this) return false;
      return true;
    });

    const removed = originalLength - this.channels[channel].length;
    if (removed > 0) {
      utils.log(`Removed ${removed} subscription(s) from '${channel}'`);
    }

    return this.channels[channel];
  };

  this._setupTasks = (data, channel, origin) => {
    const subscribers = this.channels[channel] || [];

    return subscribers.map(sub => () => {
      return new Promise((resolve, reject) => {
        try {
          // Check if callback expects a callback parameter (async style)
          if (utils.hasArgs(sub.callback, 3)) {
            sub.callback.call(sub.context, data, origin, (err, result) => {
              err ? reject(err) : resolve(result);
            });
          } else {
            const result = sub.callback.call(sub.context, data, origin);

            // Handle promise-returning callbacks
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
    });
  };

  this._formatErrors = (errors) => {
    if (utils.isArr(errors)) {
      const messages = errors
        .filter(x => x != null)
        .map(x => x.message || String(x));

      const error = new Error(messages.join('; '));
      error.originalErrors = errors;
      return error;
    }
    return errors;
  };

  // ==================== Public this ====================

  return {
    create: () => { return this },
    /**
     * Subscribe to a channel
     */
    add: (channel, callback, context) => {
      if (typeof channel !== 'string') {
        throw new Error('Channel must be a string');
      }

      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      if (!this.channels[channel]) {
        this.channels[channel] = [];
      }

      const subscription = {
        event: channel,
        context: context || this,
        callback: callback
      };

      this.channels[channel].push(subscription);

      return this;
    },

    /**
     * Unsubscribe from this.channels
     */
    remove: (channel, callback, context) => {
      const type = typeof channel;

      switch (type) {

        case 'string':
          if (typeof callback === 'function') {
            this._delete(channel, callback, context);
          } else if (callback === undefined) {
            this._delete(channel);
          }

        case 'function':
          Object.keys(this.channels).forEach(id => {
            _this._delete(id, channel);
          });

        case 'undefined':
          this.clear();

        case 'object' && channel !== null:
          Object.keys(this.channels).forEach(id => {
            this._delete(id, null, channel);
          });
      } 

      return this;
    },

    /**
     * Subscribe to a channel for one-time execution
     */
    once(channel, callback, context) {
      if (typeof channel !== 'string') {
        throw new Error('Channel must be a string');
      }

      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      let fired = false;

      const onceWrapper = (...args) => {
        if (!fired) {
          fired = true;
          this.remove(channel, onceWrapper);
          return callback.apply(context || this, args);
        }
      };

      return this.add(channel, onceWrapper, context);
    },

    /**
     * Remove all subscriptions
     */
    clear() {
      Object.keys(this.channels).forEach(k => delete this.channels[k]);
      log('All this.channels cleared');
      return this;
    },

    /**
     * Fire event on channel (first successful handler wins)
     */
    fire(channel, data) {
      if (typeof channel !== 'string') {
        return Promise.reject(new Error('Channel must be a string'));
      }

      if (typeof data === 'function') {
        data = undefined;
      }

      const tasks = setupTasks(data, channel, channel);

      if (tasks.length === 0) {
        return Promise.resolve(null);
      }

      return utils.run.first(tasks)
        .catch(errors => {
          throw formatErrors(errors);
        });
    },

    /**
     * Emit event on channel (all handlers execute in series)
     */
    emit(channel, data, origin) {
      if (typeof channel !== 'string') {
        return Promise.reject(new Error('Channel must be a string'));
      }

      if (data && utils.isFunc(data)) {
        data = undefined;
      }

      origin = origin || channel;
      const tasks = setupTasks(data, channel, origin);

      return utils.run.series(tasks)
        .then(result => {
          // Handle cascading to parent this.channels
          if (cascade) {
            
            const segments = channel.split('/');
            
            if (segments.length > 1) {
              const parentChannel = segments.slice(0, -1).join('/');
              const cascadeOrigin = fireOrigin ? origin : parentChannel;
              
              return this
                .emit(parentChannel, data, cascadeOrigin)
                .then(() => result);
            }
          }
          return result;
        })
        .catch(errors => {
          throw formatErrors(errors);
        });
    },

    /**
     * Wait for an event to be fired
     */
    waitFor(channel, timeout) {
      return new Promise((resolve, reject) => {
        let timeoutId;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
        };

        if (timeout && timeout > 0) {
          timeoutId = setTimeout(() => {
            this.remove(channel, handler);
            reject(new Error(`Timeout waiting for event '${channel}' after ${timeout}ms`));
          }, timeout);
        }

        const handler = (data, origin) => {
          cleanup();
          this.remove(channel, handler);
          resolve({ data, origin, channel });
        };

        this.add(channel, handler);
      });
    },

    /**
     * Pipe events from one channel to another
     */
    pipe(source, target, broker) {
      // Handle parameter variations
      if (target && (target.fire || target.emit)) {
        broker = target;
        target = source;
      }

      if (!broker) {
        broker = this;
      }

      // Prevent circular pipes
      if (broker === this && source === target) {
        return this;
      }

      this.add(source, (...args) => broker.fire(target, ...args));

      return this;
    },

    /**
     * Create a namespaced broker interface
     */
    namespace(namespace) {
      const separator = '/';
      const prefix = namespace + separator;

      return {
        add: (channel, fn, context) =>
          this.add(prefix + channel, fn, context),
        remove: (channel, cb, context) =>
          this.remove(prefix + channel, cb, context),
        fire: (channel, data) =>
          this.fire(prefix + channel, data),
        emit: (channel, data, origin) =>
          this.emit(prefix + channel, data, origin),
        once: (channel, fn, context) =>
          this.once(prefix + channel, fn, context),
        waitFor: (channel, timeout) =>
          this.waitFor(prefix + channel, timeout),
        pipe: (src, target, broker) =>
          this.pipe(prefix + src, prefix + target, broker),
        getSubscriberCount: (channel) =>
          this.getSubscriberCount(prefix + channel),
        clear: () => {
          const channelKeys = Object.keys(this.channels);
          channelKeys.forEach(ch => {
            if (ch.startsWith(prefix)) {
              delete this.channels[ch];
            }
          });
          return this;
        }
      };
    },

    /**
     * Install broker methods on target object
     */
    install: (target, forced = false) => {
      if (!utils.isObj(target)) {
        return this;
      }

      Object.keys(this).forEach(key => {
        const value = this[key];
        if (typeof value === 'function' && (forced || !target[key])) {
          target[key] = value.bind(this);
        }
      });

      return this;
    },

    /**
     * Get all active this.channels
     */
    getchannels: () => {
      return Object.keys(this.channels).filter(channel =>
        this.channels[channel] && this.channels[channel].length > 0
      );
    },

    /**
     * Get subscriber count for a channel
     */
    getSubscriberCount: (channel) => {
      return (this.channels[channel] && this.channels[channel].length) || 0;
    }
  };
};

export const createBroker = new Broker().create();
export default { Broker, createBroker };