import { Utils } from './utils';

/**
 * Event Broker - Pub/Sub messaging system with channel support
 * Provides event-driven communication between modules
 */
class EventBroker {
  constructor(target, cascade = false) {
    this.cascade = cascade;
    this.channels = {};
    this.fireOrigin = false;

    if (Utils.isObj(target)) {
      this.install(target);
    } else if (target === true) {
      this.cascade = true;
    }
  }

  // ==================== Subscription Management ====================

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Handler function
   * @param {Object} [context] - Execution context
   * @returns {Object} Subscription object with listen/ignore methods
   */
  add(channel, callback, context = this) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    const subscription = {
      event: channel,
      context,
      callback: callback || (() => {})
    };

    return {
      listen: () => {
        this.channels[channel].push(subscription);
        return this;
      },
      ignore: () => {
        this.remove(channel, callback, context);
        return this;
      }
    }.listen();
  }

  /**
   * Unsubscribe from channels
   * @param {string|Function|Object} channel - Channel name, callback, or context
   * @param {Function} [callback] - Optional callback to remove
   * @param {Object} [context] - Optional context to remove
   * @returns {EventBroker} This instance
   */
  remove(channel, callback, context) {
    const type = typeof channel;

    if (type === 'string') {
      if (typeof callback === 'function') {
        this._deleteSubscriptions(channel, callback, context);
      } else if (callback === undefined) {
        this._deleteSubscriptions(channel);
      }
    } else if (type === 'function') {
      // Remove all subscriptions with this callback
      Object.keys(this.channels).forEach(id => {
        this._deleteSubscriptions(id, channel);
      });
    } else if (type === 'undefined') {
      // Remove all subscriptions
      Object.keys(this.channels).forEach(id => {
        this._deleteSubscriptions(id);
      });
    } else if (type === 'object') {
      // Remove all subscriptions with this context
      Object.keys(this.channels).forEach(id => {
        this._deleteSubscriptions(id, null, channel);
      });
    }

    return this;
  }

  /**
   * Subscribe to a channel for one-time execution
   * @param {string} channel - Channel name
   * @param {Function} callback - Handler function
   * @param {Object} [context] - Execution context
   * @returns {Object} Subscription object
   */
  once(channel, callback, context) {
    let fired = false;

    const onceWrapper = (...args) => {
      if (!fired) {
        fired = true;
        this.remove(channel, onceWrapper);
        return callback.apply(context || this, args);
      }
    };

    return this.add(channel, onceWrapper, context);
  }

  /**
   * Remove all subscriptions
   * @returns {EventBroker} This instance
   */
  clear() {
    this.channels = {};
    return this;
  }

  // ==================== Event Emission ====================

  /**
   * Fire event on channel (first successful handler wins)
   * @param {string} channel - Channel name
   * @param {*} data - Data to pass to handlers
   * @returns {Promise} Resolves with first successful result
   */
  async fire(channel, data) {
    if (typeof channel !== 'string') {
      throw new Error('Channel must be a string');
    }

    if (typeof data === 'function') {
      data = undefined;
    }

    const tasks = this._setupTasks(data, channel, channel);

    if (tasks.length === 0) {
      return null;
    }

    try {
      return await Utils.run.first(tasks);
    } catch (errors) {
      throw this._formatErrors(errors);
    }
  }

  /**
   * Emit event on channel (all handlers execute in series)
   * @param {string} channel - Channel name
   * @param {*} data - Data to pass to handlers
   * @param {string} [origin] - Origin channel for cascade
   * @returns {Promise} Resolves when all handlers complete
   */
  async emit(channel, data, origin = channel) {
    if (typeof channel !== 'string') {
      throw new Error('Channel must be a string');
    }

    if (data && Utils.isFunc(data)) {
      data = undefined;
    }

    const tasks = this._setupTasks(data, channel, origin);

    try {
      const result = await Utils.run.series(tasks);

      // Handle cascading to parent channels
      if (this.cascade) {
        const segments = channel.split('/');
        if (segments.length > 1) {
          const parentChannel = segments.slice(0, -1).join('/');
          const cascadeOrigin = this.fireOrigin ? origin : parentChannel;
          await this.emit(parentChannel, data, cascadeOrigin);
        }
      }

      return result;
    } catch (errors) {
      throw this._formatErrors(errors);
    }
  }

  // ==================== Advanced Features ====================

  /**
   * Wait for an event to be fired
   * @param {string} channel - Channel name
   * @param {number} [timeout] - Optional timeout in milliseconds
   * @returns {Promise} Resolves with event data or rejects on timeout
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
  }

  /**
   * Pipe events from one channel to another
   * @param {string} source - Source channel
   * @param {string} target - Target channel
   * @param {EventBroker} [broker] - Target broker (defaults to this)
   * @returns {EventBroker} This instance
   */
  pipe(source, target, broker) {
    // Handle parameter variations
    if (target instanceof EventBroker) {
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
  }

  /**
   * Create a namespaced broker interface
   * @param {string} namespace - Namespace prefix
   * @returns {Object} Namespaced broker interface
   */
  namespace(namespace) {
    const separator = '/';
    const prefix = `${namespace}${separator}`;

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
        this.getSubscriberCount(prefix + channel)
    };
  }

  /**
   * Install broker methods on target object
   * @param {Object} target - Target object
   * @param {boolean} [forced] - Override existing properties
   * @returns {EventBroker} This instance
   */
  install(target, forced = false) {
    if (!Utils.isObj(target)) {
      return this;
    }

    Object.keys(this).forEach(key => {
      const value = this[key];
      if (typeof value === 'function' && (forced || !target[key])) {
        target[key] = value.bind(this);
      }
    });

    return this;
  }

  // ==================== Inspection Methods ====================

  /**
   * Get all active channels
   * @returns {string[]} Array of channel names
   */
  getChannels() {
    return Object.keys(this.channels).filter(
      channel => this.channels[channel]?.length > 0
    );
  }

  /**
   * Get subscriber count for a channel
   * @param {string} channel - Channel name
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(channel) {
    return this.channels[channel]?.length || 0;
  }

  // ==================== Private Methods ====================

  /**
   * Delete subscriptions matching criteria
   * @private
   */
  _deleteSubscriptions(channel, callback, context) {
    if (!this.channels[channel]) {
      return [];
    }

    this.channels[channel] = this.channels[channel].filter(sub => {
      if (callback && sub.callback === callback) return false;
      if (context && sub.context === context) return false;
      if (!callback && !context && sub.context === this) return false;
      return true;
    });

    return this.channels[channel];
  }

  /**
   * Setup task functions for event execution
   * @private
   */
  _setupTasks(data, channel, origin) {
    const subscribers = this.channels[channel] || [];

    return subscribers.map(sub => () => {
      return new Promise((resolve, reject) => {
        try {
          // Check if callback expects a callback parameter (async style)
          if (Utils.hasArgs(sub.callback, 3)) {
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
  }

  /**
   * Format errors for consistent error reporting
   * @private
   */
  _formatErrors(errors) {
    if (Utils.isArr(errors)) {
      const messages = errors
        .filter(x => x != null)
        .map(x => x.message || String(x));

      const error = new Error(messages.join('; '));
      error.originalErrors = errors;
      return error;
    }
    return errors;
  }
}

// ==================== Static Convenience Methods ====================

EventBroker.on = (channel, callback, context) => 
  new EventBroker().add(channel, callback, context);

EventBroker.off = (channel, callback, context) => 
  new EventBroker().remove(channel, callback, context);

EventBroker.once = (channel, callback, context) => 
  new EventBroker().once(channel, callback, context);

EventBroker.fire = (channel, data) => 
  new EventBroker().fire(channel, data);

EventBroker.emit = (channel, data, origin) => 
  new EventBroker().emit(channel, data, origin);

export { EventBroker as Broker };
export default EventBroker;