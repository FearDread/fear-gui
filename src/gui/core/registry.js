import { utils } from './utils';
import { Broker } from './broker';

/**
 * Create a module registry with event support
 * @param {Object} options - Global configuration options
 * @returns {Object} Registry API
 */
export const Registry = (() => {
  return function create(options = {}) {
    const modules = new Map();
    const broker = new Broker();
    let globalOptions = options;

    const register = (name, instance) => {
      if (!name || typeof name !== 'string') {
        throw new Error('Module name must be a non-empty string');
      }

      modules.set(name, instance);
      broker.add(`module:${name}`, () => ({ name, instance }));

      broker.emit('module:registered', { name, instance })
        .then(() => {
          console.log(`Module registered: ${name}`);
        })
        .catch(err => {
          console.error('Error registering module:', err);
        });

      return instance;
    };

    const unregister = (name) => {
      if (!modules.has(name)) {
        return false;
      }

      const module = modules.get(name);

      // Call destroy if available
      if (module && typeof module.destroy === 'function') {
        try {
          module.destroy();
        } catch (err) {
          console.error(`Error destroying module ${name}:`, err);
        }
      }

      modules.delete(name);
      broker.remove(`module:${name}`);

      broker.emit('module:unregistered', { name })
        .catch(err => {
          console.error('Error emitting unregister event:', err);
        });

      console.log(`Module unregistered: ${name}`);
      return true;
    };

    const get = (name) => modules.get(name);

    const has = (name) => modules.has(name);

    const list = () => Array.from(modules.keys());

    const clear = () => {
      const names = list();
      names.forEach(name => unregister(name));
      modules.clear();
    };

    const setGlobal = (opts) => {
      globalOptions = utils.isObj(opts)
        ? utils.merge({}, globalOptions, opts)
        : globalOptions;
      return globalOptions;
    };

    const getGlobal = () => globalOptions;

    const on = (event, callback, context) =>
      broker.add(event, callback, context);

    const off = (event, callback, context) =>
      broker.remove(event, callback, context);

    const emit = (event, data) =>
      broker.emit(event, data);

    const fire = (event, data) =>
      broker.fire(event, data);

    return {
      register,
      unregister,
      get,
      has,
      list,
      clear,
      setGlobal,
      getGlobal,
      on,
      off,
      emit,
      fire,
      broker
    };
  }
})()
export const createRegistry = () => new Registry().create();
export default createRegistry;