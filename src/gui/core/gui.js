// gui.js - Main entry point with functional design
import { utils } from './utils';
import { Registry } from './registry';
import { Broker } from './broker';
import { SandBox } from './sandbox';

export const GUI = function() {
  const gui = this;

  this.config = { logLevel: 0, name: 'FEAR_GUI', version: '2.0.0' };

  this.debug = {
    history: [],
    level: this.config.logLevel,
    timeout: 5000,
    warn(...args) {
      if (gui.debug.level < 2) {
        console.warn('WARN:', ...args);
        gui.debug.history.push({ type: 'warn', args });
      }
    },
    log(...args) {
      if (gui.debug.level < 1) {
        console.log('Debug:', ...args);
        gui.debug.history.push({ type: 'log', args });
      }
    }
  };

  // GUI state
  this.state = {
    modules: {},
    plugins: [],
    instances: {},
    sandboxes: {},
    running: {},
    imports: []
  };

  // Create broker and event system
  this.broker = new Broker().create();
  this.registry = new Registry().create(this.config);
  this.utils = utils;

  // Private helpers
  const _runInstPlugins = (handler, $gui) => {
    const tasks = gui.state.plugins
      .filter(p => typeof p.plugin?.[handler] === 'function')
      .map(p => () => Promise.resolve(p.plugin[handler]($gui, p.options)));

    return utils.run.series(tasks);
  };

  const _createInst = (moduleId, opts) => {
    const id = opts.instanceId || moduleId;
    if (gui.state.instances[id]) {
      return Promise.resolve({ instance: gui.state.instances[id], options: opts.options });
    }

    const module = gui.state.modules[moduleId];
    const iOpts = { ...module.options, ...opts.options };

    const sb = new SandBox().create(gui, id, iOpts, moduleId);

    return _runInstPlugins('load', sb)
      .then(() => {
        const instance = module.creator(sb);

        if (typeof instance.load !== 'function') {
          if (instance.fn && typeof instance.fn === 'function') {
            gui.plugin(instance, id);
            return { instance, options: iOpts };
          }
          throw new Error("module has no 'load' or 'fn' method");
        }

        gui.state.instances[id] = instance;
        gui.state.sandboxes[id] = sb;

        // Register instance in registry
        gui.registry.register(id, instance);
        return { instance, options: iOpts };
      });
  };

  const _startInst = (mods) => {
    if (!mods) mods = Object.keys(gui.state.modules);

    const tasks = mods.map(mid => () => gui.start(mid, gui.state.modules[mid].options));

    return utils.run.parallel(tasks);
  };

  // Public API
  this.configure = function(options) {
    if (options && utils.isObj(options)) {
      gui.config = utils.merge(gui.config, options);
      gui.registry.setGlobal(gui.config);
      gui.debug.level = gui.config.logLevel || 0;
    }

    return gui;
  };

  this.create = function(id, creator, options = {}) {
    const error = utils.isType('string', id, 'module ID') ||
      utils.isType('function', creator, 'creator') ||
      utils.isType('object', options, 'option parameter');

    if (error) {
      gui.debug.warn(`could not register module '${id}': ${error}`);
      return gui;
    }

    gui.state.modules[id] = { id, creator, options };
    return gui;
  };

  this.start = function(moduleId, opt = {}) {
    const id = opt.instanceId || moduleId;
    const error = utils.isType('string', moduleId, 'module ID') ||
      utils.isType('object', opt, 'second parameter') ||
      (!gui.state.modules[moduleId] ? "module doesn't exist" : undefined);

    if (!moduleId) return _startInst();

    if (utils.isArr(moduleId)) return _startInst(moduleId);

    if (utils.isFunc(moduleId)) return _startInst();

    if (error) return Promise.reject(new Error(error));

    if (gui.state.running[id] === true) {
      return Promise.reject(new Error('module was already started'));
    }

    return gui.boot()
      .then(() => _createInst(moduleId, opt))
      .then(({ instance, options }) => {
        if (instance.load && typeof instance.load === 'function') {
          const loadResult = instance.load(options);

          if (loadResult && typeof loadResult.then === 'function') {
            return loadResult.then(() => {
              gui.state.running[id] = true;
            });
          } else {
            gui.state.running[id] = true;
            return Promise.resolve();
          }
        } else {
          gui.state.running[id] = true;
          return Promise.resolve();
        }
      })
      .catch(err => {
        gui.debug.warn(err);
        throw new Error('could not start module: ' + err.message);
      });
  };

  this.stop = function(id) {
    if (arguments.length === 0 || typeof id === 'function') {
      const moduleIds = Object.keys(gui.state.instances);
      return utils.run.parallel(moduleIds.map(mid => () => gui.stop(mid)));
    }

    const instance = gui.state.instances[id];
    if (!instance) return Promise.resolve();

    delete gui.state.instances[id];
    gui.broker.remove(instance);
    gui.registry.unregister(id);

    return _runInstPlugins('unload', gui.state.sandboxes[id])
      .then(() => {
        if (instance.unload && typeof instance.unload === 'function') {
          const unloadResult = instance.unload();
          if (unloadResult && typeof unloadResult.then === 'function') {
            return unloadResult;
          }
        }
        return Promise.resolve();
      })
      .then(() => {
        delete gui.state.running[id];
      });
  };

  this.use = function(plugin, opt) {
    if (utils.isArr(plugin)) {
      plugin.forEach(p => {
        if (utils.isFunc(p)) {
          gui.use(p);
        } else if (utils.isObj(p)) {
          gui.use(p.plugin, p.options);
        }
      });
    } else {
      if (!utils.isFunc(plugin)) {
        return gui;
      }

      gui.state.plugins.push({
        creator: plugin,
        options: opt
      });
    }

    return gui;
  };

  this.plugin = function(plugin, module) {
    if (plugin.fn && utils.isFunc(plugin.fn)) {
      $.fn[module.toLowerCase()] = function(options) {
        return new plugin.fn(this, options);
      };
    } else {
      gui.debug.log('Error :: Missing ' + plugin + ' fn() method.');
    }

    return gui;
  };

  this.boot = function() {
    const tasks = gui.state.plugins
      .filter(plugin => plugin.booted !== true)
      .map(plugin => () => {
        return new Promise((resolve, reject) => {
          if (utils.hasArgs(plugin.creator, 3)) {
            plugin.creator(gui, plugin.options, (err) => {
              if (err) {
                reject(err);
              } else {
                plugin.booted = true;
                resolve();
              }
            });
          } else {
            Promise.resolve()
              .then(() => {
                plugin.plugin = plugin.creator(gui, plugin.options);
                plugin.booted = true;
                resolve();
              })
              .catch(err => reject(err));
          }
        });
      });

    return utils.run.series(tasks);
  };

  this.attach = function(imports) {
    return Promise.resolve()
      .then(() => {
        gui.debug.log('Dynamic async module loading.');
        gui.debug.log('Imports:', imports);
      });
  };

  return this;
};

export const createGUI = () => new GUI();
export const FEAR = new GUI();

export default FEAR;