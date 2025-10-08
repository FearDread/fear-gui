// src/broker.js - Event Broker Module
import { utils } from './utils';

/**
 * Create a new EventBroker instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.cascade - Enable cascading events to parent channels
 * @param {boolean} options.fireOrigin - Use original origin in cascaded events
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Object} Broker API
 */
export const createBroker = (options = {}) => {
  const channels = {};
  const cascade = options.cascade || false;
  const fireOrigin = options.fireOrigin || false;
  const debug = options.debug || false;

  // ==================== Private Methods ====================
  
  const log = (message) => {
    if (debug && console && console.log) {
      console.log('[EventBroker]', message);
    }
  };

  const deleteSubscriptions = (channel, callback, context) => {
    if (!channels[channel]) {
      return [];
    }

    const originalLength = channels[channel].length;

    channels[channel] = channels[channel].filter(sub => {
      if (callback && sub.callback === callback) return false;
      if (context && sub.context === context) return false;
      if (!callback && !context && sub.context === api) return false;
      return true;
    });

    const removed = originalLength - channels[channel].length;
    if (removed > 0) {
      log(`Removed ${removed} subscription(s) from '${channel}'`);
    }

    return channels[channel];
  };

  const setupTasks = (data, channel, origin) => {
    const subscribers = channels[channel] || [];

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

  const formatErrors = (errors) => {
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

  // ==================== Public API ====================

  const api = {
    /**
     * Subscribe to a channel
     */
    add(channel, callback, context) {
      if (typeof channel !== 'string') {
        throw new Error('Channel must be a string');
      }

      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      if (!channels[channel]) {
        channels[channel] = [];
      }

      const subscription = {
        event: channel,
        context: context || api,
        callback: callback
      };

      channels[channel].push(subscription);
      log(`Subscribed to '${channel}'`);

      return api;
    },

    /**
     * Unsubscribe from channels
     */
    remove(channel, callback, context) {
      const type = typeof channel;

      if (type === 'string') {
        if (typeof callback === 'function') {
          deleteSubscriptions(channel, callback, context);
        } else if (callback === undefined) {
          deleteSubscriptions(channel);
        }
      } else if (type === 'function') {
        Object.keys(channels).forEach(id => {
          deleteSubscriptions(id, channel);
        });
      } else if (type === 'undefined') {
        api.clear();
      } else if (type === 'object' && channel !== null) {
        Object.keys(channels).forEach(id => {
          deleteSubscriptions(id, null, channel);
        });
      }

      return api;
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
          api.remove(channel, onceWrapper);
          return callback.apply(context || api, args);
        }
      };

      return api.add(channel, onceWrapper, context);
    },

    /**
     * Remove all subscriptions
     */
    clear() {
      Object.keys(channels).forEach(k => delete channels[k]);
      log('All channels cleared');
      return api;
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
          // Handle cascading to parent channels
          if (cascade) {
            const segments = channel.split('/');
            if (segments.length > 1) {
              const parentChannel = segments.slice(0, -1).join('/');
              const cascadeOrigin = fireOrigin ? origin : parentChannel;
              return api.emit(parentChannel, data, cascadeOrigin)
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
            api.remove(channel, handler);
            reject(new Error(`Timeout waiting for event '${channel}' after ${timeout}ms`));
          }, timeout);
        }

        const handler = (data, origin) => {
          cleanup();
          api.remove(channel, handler);
          resolve({ data, origin, channel });
        };

        api.add(channel, handler);
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
        broker = api;
      }

      // Prevent circular pipes
      if (broker === api && source === target) {
        return api;
      }

      api.add(source, (...args) => broker.fire(target, ...args));

      return api;
    },

    /**
     * Create a namespaced broker interface
     */
    namespace(namespace) {
      const separator = '/';
      const prefix = namespace + separator;

      return {
        add: (channel, fn, context) =>
          api.add(prefix + channel, fn, context),
        remove: (channel, cb, context) =>
          api.remove(prefix + channel, cb, context),
        fire: (channel, data) =>
          api.fire(prefix + channel, data),
        emit: (channel, data, origin) =>
          api.emit(prefix + channel, data, origin),
        once: (channel, fn, context) =>
          api.once(prefix + channel, fn, context),
        waitFor: (channel, timeout) =>
          api.waitFor(prefix + channel, timeout),
        pipe: (src, target, broker) =>
          api.pipe(prefix + src, prefix + target, broker),
        getSubscriberCount: (channel) =>
          api.getSubscriberCount(prefix + channel),
        clear: () => {
          const channelKeys = Object.keys(channels);
          channelKeys.forEach(ch => {
            if (ch.startsWith(prefix)) {
              delete channels[ch];
            }
          });
          return api;
        }
      };
    },

    /**
     * Install broker methods on target object
     */
    install(target, forced = false) {
      if (!utils.isObj(target)) {
        return api;
      }

      Object.keys(api).forEach(key => {
        const value = api[key];
        if (typeof value === 'function' && (forced || !target[key])) {
          target[key] = value.bind(api);
        }
      });

      return api;
    },

    /**
     * Get all active channels
     */
    getChannels() {
      return Object.keys(channels).filter(channel =>
        channels[channel] && channels[channel].length > 0
      );
    },

    /**
     * Get subscriber count for a channel
     */
    getSubscriberCount(channel) {
      return (channels[channel] && channels[channel].length) || 0;
    }
  };

  // Auto-install if target provided in options
  if (options.target && utils.isObj(options.target)) {
    api.install(options.target);
  }

  return api;
};

export default createBroker;