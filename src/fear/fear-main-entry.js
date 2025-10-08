// src/main.js - Main entry point for FEAR GUI
import $ from 'jquery';
import { utils } from './utils';
import { createBroker } from './broker';
import { createRegistry } from './registry';
import { createSandbox } from './sandbox';

// ============================================
// Main GUI Factory
// ============================================
const createGUI = () => {
  const state = {
    config: { logLevel: 0, name: 'FEAR_GUI', version: '2.0.0' },
    modules: {},
    plugins: [],
    instances: {},
    sandboxes: {},
    running: {}
  };
  
  const broker = createBroker();
  const registry = createRegistry(state.config);
  
  const debug = {
    level: 0,
    history: [],
    warn(...args) {
      if (debug.level < 2) {
        console.warn('WARN:', ...args);
        debug.history.push({ type: 'warn', args });
      }
    },
    log(...args) {
      if (debug.level < 1) {
        console.log('Debug:', ...args);
        debug.history.push({ type: 'log', args });
      }
    }
  };
  
  const runSandboxPlugins = (ev, sb) => {
    const tasks = state.plugins
      .filter(p => typeof p.plugin?.[ev] === 'function')
      .map(p => () => Promise.resolve(p.plugin[ev](sb, p.options)));
    return utils.run.series(tasks);
  };
  
  const createInstance = (moduleId, opts) => {
    const id = opts.instanceId || moduleId;
    const module = state.modules[moduleId];
    
    if (state.instances[id]) {
      return Promise.resolve({ instance: state.instances[id], options: opts.options });
    }
    
    const iOpts = { ...module.options, ...opts.options };
    const sb = createSandbox(gui, id, iOpts, moduleId);
    
    return runSandboxPlugins('load', sb).then(() => {
      const instance = module.creator(sb);
      
      if (typeof instance.load !== 'function') {
        if (instance.fn && typeof instance.fn === 'function') {
          gui.plugin(instance, id);
          return { instance, options: iOpts };
        }
        throw new Error("module has no 'load' or 'fn' method");
      }
      
      state.instances[id] = instance;
      state.sandboxes[id] = sb;
      registry.register(id, instance);
      
      return { instance, options: iOpts };
    });
  };
  
  const startAll = (mods) => {
    if (!mods) mods = Object.keys(state.modules);
    const tasks = mods.map(mid => () => gui.start(mid, state.modules[mid].options));
    return utils.run.parallel(tasks);
  };
  
  const gui = {
    config: state.config,
    debug,
    broker,
    registry,
    utils,
    
    configure(options) {
      if (options && utils.isObj(options)) {
        state.config = utils.merge(state.config, options);
        debug.level = state.config.logLevel || 0;
        registry.setGlobal(state.config);
      }
      return gui;
    },
    
    create(id, creator, options = {}) {
      const error = utils.isType('string', id, 'module ID') ||
        utils.isType('function', creator, 'creator') ||
        utils.isType('object', options, 'options');
      
      if (error) {
        debug.warn(`could not register module '${id}': ${error}`);
        return gui;
      }
      
      if (state.modules[id]) {
        debug.log(`module ${id} was already registered`);
        return gui;
      }
      
      state.modules[id] = { id, creator, options };
      return gui;
    },
    
    start(moduleId, opt = {}) {
      if (arguments.length === 0 || typeof moduleId === 'function') {
        return startAll();
      }
      if (moduleId instanceof Array) {
        return startAll(moduleId);
      }
      
      const id = opt.instanceId || moduleId;
      const error = utils.isType('string', moduleId, 'module ID') ||
        utils.isType('object', opt, 'options') ||
        (!state.modules[moduleId] ? "module doesn't exist" : undefined);
      
      if (error) return Promise.reject(new Error(error));
      if (state.running[id]) return Promise.reject(new Error('module already started'));
      
      return gui.boot()
        .then(() => createInstance(moduleId, { options: opt, instanceId: opt.instanceId }))
        .then(({ instance, options }) => {
          if (instance.load && typeof instance.load === 'function') {
            const loadResult = instance.load(options);
            if (loadResult && typeof loadResult.then === 'function') {
              return loadResult.then(() => { state.running[id] = true; });
            }
            state.running[id] = true;
            return Promise.resolve();
          }
          state.running[id] = true;
          return Promise.resolve();
        })
        .catch(err => {
          debug.warn(err);
          throw new Error('could not start module: ' + err.message);
        });
    },
    
    stop(id) {
      if (arguments.length === 0 || typeof id === 'function') {
        const moduleIds = Object.keys(state.instances);
        return utils.run.parallel(moduleIds.map(mid => () => gui.stop(mid)));
      }
      
      const instance = state.instances[id];
      if (!instance) return Promise.resolve();
      
      delete state.instances[id];
      broker.remove(instance);
      registry.unregister(id);
      
      return runSandboxPlugins('unload', state.sandboxes[id])
        .then(() => {
          if (instance.unload && typeof instance.unload === 'function') {
            const unloadResult = instance.unload();
            if (unloadResult && typeof unloadResult.then === 'function') {
              return unloadResult;
            }
          }
          return Promise.resolve();
        })
        .then(() => { delete state.running[id]; });
    },
    
    use(plugin, opt) {
      if (utils.isArr(plugin)) {
        plugin.forEach(p => {
          if (typeof p === 'function') gui.use(p);
          else if (typeof p === 'object') gui.use(p.plugin, p.options);
        });
      } else if (utils.isFunc(plugin)) {
        state.plugins.push({ creator: plugin, options: opt });
      }
      return gui;
    },
    
    plugin(plugin, module) {
      if (plugin.fn && utils.isFunc(plugin.fn)) {
        $.fn[module.toLowerCase()] = function(options) {
          return new plugin.fn(this, options);
        };
      } else {
        debug.log('Error :: Missing fn() method for plugin ' + module);
      }
      return gui;
    },
    
    boot() {
      const tasks = state.plugins
        .filter(p => p.booted !== true)
        .map(p => () => new Promise((resolve, reject) => {
          try {
            if (utils.hasArgs(p.creator, 3)) {
              p.creator(gui, p.options, (err) => {
                if (err) reject(err);
                else { p.booted = true; resolve(); }
              });
            } else {
              p.plugin = p.creator(gui, p.options);
              p.booted = true;
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        }));
      return utils.run.series(tasks);
    }
  };
  
  return gui;
};

// ============================================
// jQuery Plugin Integration - $.FEAR
// ============================================

// Main constructor
const FEAR = function(options) {
  const instance = createGUI();
  if (options) instance.configure(options);
  return instance;
};

// Expose utilities and factories
FEAR.utils = utils;
FEAR.createBroker = createBroker;
FEAR.createRegistry = createRegistry;
FEAR.createSandbox = createSandbox;
FEAR.createGUI = createGUI;
FEAR.version = '2.0.0';

// Create singleton instance
FEAR.gui = createGUI();

// Attach to jQuery if available
if (typeof $ !== 'undefined' && $) {
  $.FEAR = FEAR;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.FEAR = FEAR;
}

export { FEAR, createGUI, createBroker, createRegistry, createSandbox, utils };
export default FEAR;