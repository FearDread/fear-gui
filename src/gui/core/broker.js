import { utils } from './utils';

const Broker = (() => {

  return function create(options = {}) {
 const self = this;
  
  // Internal state
  this.cascade = options.cascade || false;
  this.fireOrigin = options.fireOrigin || false;
  this.channels = {};
  this._debug = options.debug || false;

  // ==================== Subscription Management ====================

  /**
   * Subscribe to a channel
   */
  this.add = (channel, callback, context) => {
    if (typeof channel !== 'string') {
      throw new Error('Channel must be a string');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!self.channels[channel]) {
      self.channels[channel] = [];
    }

    const subscription = {
      event: channel,
      context: context || self,
      callback: callback
    };

    const api = {
      listen: () => {
        self.channels[channel].push(subscription);
        self._log(`Subscribed to '${channel}'`);
        return self;
      },
      ignore: () => {
        self.remove(channel, callback, context);
        return self;
      }
    };

    return api.listen();
  };

  /**
   * Unsubscribe from channels
   */
  this.remove = (channel, callback, context) => {
    const type = typeof channel;

    if (type === 'string') {
      if (typeof callback === 'function') {
        self._deleteSubscriptions(channel, callback, context);
      } else if (callback === undefined) {
        self._deleteSubscriptions(channel);
      }
    } else if (type === 'function') {
      Object.keys(self.channels).forEach(id => {
        self._deleteSubscriptions(id, channel);
      });
    } else if (type === 'undefined') {
      self.clear();
    } else if (type === 'object' && channel !== null) {
      Object.keys(self.channels).forEach(id => {
        self._deleteSubscriptions(id, null, channel);
      });
    }

    return self;
  };

  /**
   * Subscribe to a channel for one-time execution
   */
  this.once = (channel, callback, context) => {
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
        self.remove(channel, onceWrapper);
        return callback.apply(context || self, args);
      }
    };

    return self.add(channel, onceWrapper, context);
  };

  /**
   * Remove all subscriptions
   */
  this.clear = () => {
    self.channels = {};
    self._log('All channels cleared');
    return self;
  };

  // ==================== Event Emission ====================

  /**
   * Fire event on channel (first successful handler wins)
   */
  this.fire = (channel, data) => {
    if (typeof channel !== 'string') {
      return Promise.reject(new Error('Channel must be a string'));
    }

    if (typeof data === 'function') {
      data = undefined;
    }

    const tasks = self._setupTasks(data, channel, channel);

    if (tasks.length === 0) {
      return Promise.resolve(null);
    }

    return utils.run.first(tasks)
      .catch(errors => {
        throw self._formatErrors(errors);
      });
  };

  /**
   * Emit event on channel (all handlers execute in series)
   */
  this.emit = (channel, data, origin) => {
    if (typeof channel !== 'string') {
      return Promise.reject(new Error('Channel must be a string'));
    }

    if (data && utils.isFunc(data)) {
      data = undefined;
    }

    origin = origin || channel;
    const tasks = self._setupTasks(data, channel, origin);

    return utils.run.series(tasks)
      .then(result => {
        // Handle cascading to parent channels
        if (self.cascade) {
          const segments = channel.split('/');
          if (segments.length > 1) {
            const parentChannel = segments.slice(0, -1).join('/');
            const cascadeOrigin = self.fireOrigin ? origin : parentChannel;
            return self.emit(parentChannel, data, cascadeOrigin)
              .then(() => result);
          }
        }
        return result;
      })
      .catch(errors => {
        throw self._formatErrors(errors);
      });
  };

  // ==================== Advanced Features ====================

  /**
   * Wait for an event to be fired
   */
  this.waitFor = (channel, timeout) => {
    return new Promise((resolve, reject) => {
      let timeoutId;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          self.remove(channel, handler);
          reject(new Error(`Timeout waiting for event '${channel}' after ${timeout}ms`));
        }, timeout);
      }

      const handler = (data, origin) => {
        cleanup();
        self.remove(channel, handler);
        resolve({ data, origin, channel });
      };

      self.add(channel, handler);
    });
  };

  /**
   * Pipe events from one channel to another
   */
  this.pipe = (source, target, broker) => {
    // Handle parameter variations
    if (target instanceof EventBroker || (target && target.fire)) {
      broker = target;
      target = source;
    }

    if (!broker) {
      broker = self;
    }

    // Prevent circular pipes
    if (broker === self && source === target) {
      return self;
    }

    self.add(source, (...args) => broker.fire(target, ...args));

    return self;
  };

  /**
   * Create a namespaced broker interface
   */
  this.namespace = (namespace) => {
    const separator = '/';
    const prefix = namespace + separator;

    return {
      add: (channel, fn, context) => 
        self.add(prefix + channel, fn, context),
      remove: (channel, cb, context) => 
        self.remove(prefix + channel, cb, context),
      fire: (channel, data) => 
        self.fire(prefix + channel, data),
      emit: (channel, data, origin) => 
        self.emit(prefix + channel, data, origin),
      once: (channel, fn, context) => 
        self.once(prefix + channel, fn, context),
      waitFor: (channel, timeout) => 
        self.waitFor(prefix + channel, timeout),
      pipe: (src, target, broker) => 
        self.pipe(prefix + src, prefix + target, broker),
      getSubscriberCount: (channel) => 
        self.getSubscriberCount(prefix + channel),
      clear: () => {
        const channels = Object.keys(self.channels);
        channels.forEach(ch => {
          if (ch.startsWith(prefix)) {
            delete self.channels[ch];
          }
        });
        return self;
      }
    };
  };

  /**
   * Install broker methods on target object
   */
  this.install = (target, forced = false) => {
    if (!utils.isObj(target)) {
      return self;
    }

    Object.keys(self).forEach(key => {
      const value = self[key];
      if (typeof value === 'function' && (forced || !target[key])) {
        target[key] = value.bind(self);
      }
    });

    return self;
  };

  // ==================== Inspection Methods ====================

  /**
   * Get all active channels
   */
  this.getChannels = () => {
    return Object.keys(self.channels).filter(channel => 
      self.channels[channel] && self.channels[channel].length > 0
    );
  };

  /**
   * Get subscriber count for a channel
   */
  this.getSubscriberCount = (channel) => {
    return (self.channels[channel] && self.channels[channel].length) || 0;
  };

  // ==================== Private Methods ====================

  /**
   * Delete subscriptions matching criteria
   */
  this._deleteSubscriptions = (channel, callback, context) => {
    if (!self.channels[channel]) {
      return [];
    }

    const originalLength = self.channels[channel].length;

    self.channels[channel] = self.channels[channel].filter(sub => {
      if (callback && sub.callback === callback) return false;
      if (context && sub.context === context) return false;
      if (!callback && !context && sub.context === self) return false;
      return true;
    });

    const removed = originalLength - self.channels[channel].length;
    if (removed > 0) {
      self._log(`Removed ${removed} subscription(s) from '${channel}'`);
    }

    return self.channels[channel];
  };

  /**
   * Setup task functions for event execution
   */
  this._setupTasks = (data, channel, origin) => {
    const subscribers = self.channels[channel] || [];

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

  /**
   * Format errors for consistent error reporting
   */
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

  /**
   * Debug logging
   */
  this._log = (message) => {
    if (self._debug && console && console.log) {
      console.log('[EventBroker]', message);
    }
  };

  // Auto-install if target provided
  if (options.target && utils.isObj(options.target)) {
    this.install(options.target);
  }
  }

})();

/**
 * Event Broker - Pub/Sub messaging system with channel support
 * Provides event-driven communication between modules
 */

// ==================== Factory Function ====================

/**
 * Create a new EventBroker instance
 * @param {Object} options - Configuration options
 * @returns {EventBroker} New broker instance
 */
const createBroker = (options = {}) => {
  return new Broker.create(options);
};

// ==================== Static Convenience Methods ====================

Broker.on = (channel, callback, context) => 
  new Broker().create().add(channel, callback, context);

Broker.off = (channel, callback, context) => 
  new Broker().create().remove(channel, callback, context);

Broker.once = (channel, callback, context) => 
  new Broker().create().once(channel, callback, context);

Broker.fire = (channel, data) => 
  new Broker().create().fire(channel, data);

Broker.emit = (channel, data, origin) => 
  new Broker().create().emit(channel, data, origin);

Broker.waitFor = (channel, timeout) => 
  new Broker().create().waitFor(channel, timeout);

// ==================== Exports ====================

export { Broker, createBroker };
export default createBroker;