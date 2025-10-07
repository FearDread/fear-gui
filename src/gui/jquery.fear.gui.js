// jquery.fear-gui.js - Complete jQuery Integration with Registry Pattern
;(function($, window, document, undefined) {
  'use strict';
  
  // ============================================
  // utils
  // ============================================
  const utils = {
    merge: $.extend,
    isObj: (obj) => $.isPlainObject(obj),
    isArr: (arr) => $.isArray(arr),
    isFunc: (obj) => !!(obj && obj.constructor && obj.call && obj.apply),
    isStr: (str) => typeof str === 'string',
    isType: (type, val, name) => {
      if (typeof val !== type) {
        return `Error :: ${name} must be of type ${type}`;
      }
    },
    hasArgs: (fn, idx = 1) => {
      const match = fn.toString().match(/\(([^)]*)\)/);
      const args = match ? match[1].match(/[^\s,]+/g) || [] : [];
      return args.length >= idx;
    },
    run: {
      series: (tasks = []) => {
        if (!tasks.length) return Promise.resolve([]);
        return tasks.reduce((p, task, idx) => 
          p.then(results => 
            Promise.resolve(task())
              .then(r => [...results, r])
              .catch(err => {
                const error = new Error(`Task ${idx} failed`);
                error.originalError = err;
                throw error;
              })
          ),
          Promise.resolve([])
        );
      },
      parallel: (tasks = []) => {
        if (!tasks.length) return Promise.resolve([]);
        return Promise.all(tasks.map(t => Promise.resolve(t())));
      }
    }
  };

  // ============================================
  // Broker
  // ============================================
  const createBroker = () => {
    const channels = {};
    
    const api = {
      add(channel, callback, context) {
        if (!channels[channel]) channels[channel] = [];
        channels[channel].push({ channel, callback, context });
        return api;
      },
      remove(channel, callback) {
        if (!channels[channel]) return api;
        channels[channel] = channels[channel].filter(sub => 
          !(callback && sub.callback === callback)
        );
        return api;
      },
      emit(channel, data) {
        const subs = channels[channel] || [];
        const tasks = subs.map(sub => () => 
          Promise.resolve(sub.callback.call(sub.context, data))
        );
        return utils.run.series(tasks);
      },
      fire(channel, data) {
        const subs = channels[channel] || [];
        if (!subs.length) return Promise.resolve(null);
        return Promise.resolve(subs[0].callback.call(subs[0].context, data));
      },
      clear() {
        Object.keys(channels).forEach(k => delete channels[k]);
        return api;
      }
    };
    return api;
  };

  // ============================================
  // Registry - Module Registry with Event Support
  // ============================================
  const createRegistry = (options = {}) => {
    const modules = new Map();
    const broker = createBroker();
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
  };

  // ============================================
  // Sandbox
  // ============================================
  const createSandbox = (gui, id, options, moduleId) => {
    const sandbox = {
      id,
      module: moduleId,
      options: options || {},
      config: gui.config,
      utils
    };
    
    // Broker methods
    sandbox.add = gui.broker.add.bind(gui.broker);
    sandbox.remove = gui.broker.remove.bind(gui.broker);
    sandbox.emit = gui.broker.emit.bind(gui.broker);
    sandbox.fire = gui.broker.fire.bind(gui.broker);
    sandbox.broker = gui.broker;
    
    // Registry access
    sandbox.registry = gui.registry;
    
    // jQuery fetch wrapper
    sandbox.fetch = (url, settings = {}) => {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: typeof url === 'string' ? url : url.url,
          ...settings,
          success: (data, textStatus, jqXHR) => resolve({ data, textStatus, jqXHR }),
          error: (jqXHR, textStatus) => reject(new Error(textStatus || 'Ajax failed'))
        });
      });
    };
    
    // Enhanced jQuery selector
    sandbox.query = (selector, context) => {
      const $el = context && context.find ? context.find(selector) : $(selector);
      $el.query = (sel) => sandbox.query(sel, $el);
      return $el;
    };
    sandbox.$ = sandbox.query;
    
    // Logging
    sandbox.log = (...args) => gui.debug.log(...args);
    sandbox.warn = (...args) => gui.debug.warn(...args);
    
    // Promise utilities
    sandbox.timeout = (ms, fn) => new Promise((resolve) => {
      setTimeout(() => resolve(fn && typeof fn === 'function' ? fn() : undefined), ms);
    });
    
    sandbox.ready = () => new Promise((resolve) => $(document).ready(resolve));
    sandbox.loaded = () => new Promise((resolve) => $(window).on('load', resolve));
    
    return sandbox;
  };

  // ============================================
  // Main GUI Factory
  // ============================================
  const createGUI = () => {
    const state = {
      config: { logLevel: 0, name: 'FEAR_GUI', version: '1.0.2' },
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
        
        // Register instance in registry
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
        
        // Unregister from registry
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
  // jQuery Integration
  // ============================================
  
  // $.GUI - Constructor function (creates new instances)
  $.GUI = function(options) {
    const instance = createGUI();
    if (options) instance.configure(options);
    return instance;
  };
  
  // Expose utilities on constructor
  $.GUI.utils = utils;
  $.GUI.createBroker = createBroker;
  $.GUI.createRegistry = createRegistry;
  $.GUI.version = '1.0.2';
  
  // $.gui - Singleton instance (auto-initialized)
  $.gui = createGUI();
  
  // Also expose as window.GUI for non-jQuery access
  window.GUI = $.GUI;
  window.gui = $.gui;
  
})(jQuery, window, document);

// ============================================
// USAGE EXAMPLES WITH REGISTRY
// ============================================

// Example 1: Use the singleton $.gui with registry
$.gui.configure({ logLevel: 1, name: 'MyApp' });

$.gui.create('myModule', (sandbox) => {
  return {
    load(options) {
      sandbox.log('Module loaded!', options);
      sandbox.$('#button').on('click', () => {
        sandbox.emit('button:clicked', { time: Date.now() });
      });
      return Promise.resolve();
    },
    unload() {
      sandbox.log('Module unloaded!');
    },
    destroy() {
      sandbox.log('Module destroyed!');
    }
  };
});

// Listen for registry events
$.gui.registry.on('module:registered', (data) => {
  console.log('Module registered in registry:', data.name);
});

$.gui.registry.on('module:unregistered', (data) => {
  console.log('Module unregistered from registry:', data.name);
});

$.gui.start('myModule').then(() => {
  console.log('Module started!');
  
  // Check if module is in registry
  console.log('Has myModule:', $.gui.registry.has('myModule'));
  
  // Get module from registry
  const module = $.gui.registry.get('myModule');
  console.log('Module from registry:', module);
  
  // List all registered modules
  console.log('All modules:', $.gui.registry.list());
});

// Example 2: Using registry global options
$.gui.registry.setGlobal({ theme: 'dark', apiUrl: 'https://api.example.com' });
console.log('Global options:', $.gui.registry.getGlobal());

// Example 3: Access registry from sandbox
$.gui.create('registryAwareModule', (sandbox) => {
  return {
    load() {
      // Access registry from within module
      const allModules = sandbox.registry.list();
      sandbox.log('Available modules:', allModules);
      
      // Listen to registry events from within module
      sandbox.registry.on('module:registered', (data) => {
        sandbox.log('New module registered:', data.name);
      });
    }
  };
});

// Example 4: Multiple independent instances with separate registries
const admin = $.GUI({ name: 'AdminPanel' });
const client = $.GUI({ name: 'ClientApp' });

admin.create('dashboard', (sb) => ({
  load: () => {
    sb.log('Admin dashboard loaded');
    console.log('Admin registry modules:', sb.registry.list());
  }
}));

client.create('homepage', (sb) => ({
  load: () => {
    sb.log('Client homepage loaded');
    console.log('Client registry modules:', sb.registry.list());
  }
}));

// Example 5: Clearing the registry
// $.gui.registry.clear(); // This will unregister all modules