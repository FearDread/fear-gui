// jquery.fear.gui.js - Refactored Modular jQuery Plugin
;(function($, window, document, undefined) {
  'use strict';
  
  // ============================================
  // Import Utilities
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
      },
      first: (tasks = []) => {
        if (!tasks.length) return Promise.resolve(null);
        return tasks[0]().catch(() => {
          if (tasks.length > 1) {
            return utils.run.first(tasks.slice(1));
          }
          throw new Error('All tasks failed');
        });
      }
    }
  };

  // ============================================
  // Broker Module
  // ============================================
  const createBroker = (options = {}) => {
    const channels = {};
    const cascade = options.cascade || false;
    const fireOrigin = options.fireOrigin || false;
    
    const setupTasks = (data, channel, origin) => {
      const subscribers = channels[channel] || [];
      return subscribers.map(sub => () => {
        return new Promise((resolve, reject) => {
          try {
            if (utils.hasArgs(sub.callback, 3)) {
              sub.callback.call(sub.context, data, origin, (err, result) => {
                err ? reject(err) : resolve(result);
              });
            } else {
              const result = sub.callback.call(sub.context, data, origin);
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

    const api = {
      add(channel, callback, context) {
        if (!channels[channel]) channels[channel] = [];
        channels[channel].push({ channel, callback, context: context || api });
        return api;
      },
      
      remove(channel, callback, context) {
        if (!channels[channel]) return api;
        if (callback) {
          channels[channel] = channels[channel].filter(sub => 
            !(sub.callback === callback && (!context || sub.context === context))
          );
        } else {
          delete channels[channel];
        }
        return api;
      },
      
      emit(channel, data, origin) {
        origin = origin || channel;
        const tasks = setupTasks(data, channel, origin);
        
        return utils.run.series(tasks).then(result => {
          if (cascade) {
            const segments = channel.split('/');
            if (segments.length > 1) {
              const parentChannel = segments.slice(0, -1).join('/');
              const cascadeOrigin = fireOrigin ? origin : parentChannel;
              return api.emit(parentChannel, data, cascadeOrigin).then(() => result);
            }
          }
          return result;
        });
      },
      
      fire(channel, data) {
        const subs = channels[channel] || [];
        if (!subs.length) return Promise.resolve(null);
        return Promise.resolve(subs[0].callback.call(subs[0].context, data));
      },
      
      once(channel, callback, context) {
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
      
      waitFor(channel, timeout) {
        return new Promise((resolve, reject) => {
          let timeoutId;
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
          };
          
          if (timeout && timeout > 0) {
            timeoutId = setTimeout(() => {
              api.remove(channel, handler);
              reject(new Error(`Timeout waiting for '${channel}' after ${timeout}ms`));
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
      
      namespace(ns) {
        const prefix = ns + '/';
        return {
          add: (ch, fn, ctx) => api.add(prefix + ch, fn, ctx),
          remove: (ch, cb, ctx) => api.remove(prefix + ch, cb, ctx),
          fire: (ch, data) => api.fire(prefix + ch, data),
          emit: (ch, data, origin) => api.emit(prefix + ch, data, origin),
          once: (ch, fn, ctx) => api.once(prefix + ch, fn, ctx),
          waitFor: (ch, timeout) => api.waitFor(prefix + ch, timeout)
        };
      },
      
      clear() {
        Object.keys(channels).forEach(k => delete channels[k]);
        return api;
      },
      
      getChannels() {
        return Object.keys(channels).filter(ch => 
          channels[ch] && channels[ch].length > 0
        );
      },
      
      getSubscriberCount(channel) {
        return (channels[channel] && channels[channel].length) || 0;
      }
    };
    
    return api;
  };

  // ============================================
  // Registry Module
  // ============================================
  const createRegistry = (options = {}) => {
    const modules = new Map();
    const broker = createBroker();
    let globalOptions = options;

    return {
      register(name, instance) {
        if (!name || typeof name !== 'string') {
          throw new Error('Module name must be a non-empty string');
        }
        modules.set(name, instance);
        broker.emit('module:registered', { name, instance });
        return instance;
      },

      unregister(name) {
        if (!modules.has(name)) return false;
        const module = modules.get(name);
        
        if (module && typeof module.destroy === 'function') {
          try {
            module.destroy();
          } catch (err) {
            console.error(`Error destroying module ${name}:`, err);
          }
        }
        
        modules.delete(name);
        broker.emit('module:unregistered', { name });
        return true;
      },

      get: (name) => modules.get(name),
      has: (name) => modules.has(name),
      list: () => Array.from(modules.keys()),
      
      clear() {
        const names = Array.from(modules.keys());
        names.forEach(name => this.unregister(name));
        modules.clear();
      },

      setGlobal(opts) {
        globalOptions = utils.isObj(opts) 
          ? utils.merge({}, globalOptions, opts)
          : globalOptions;
        return globalOptions;
      },

      getGlobal: () => globalOptions,
      on: (event, callback, context) => broker.add(event, callback, context),
      off: (event, callback) => broker.remove(event, callback),
      emit: (event, data) => broker.emit(event, data),
      fire: (event, data) => broker.fire(event, data)
    };
  };

  // ============================================
  // Sandbox Module
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
    sandbox.once = gui.broker.once.bind(gui.broker);
    sandbox.waitFor = gui.broker.waitFor.bind(gui.broker);
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
      
      $el.animateAsync = (properties, duration, easing) => {
        return new Promise((resolve, reject) => {
          try {
            $el.animate(properties, {
              duration: duration,
              easing: easing,
              complete: () => resolve($el),
              fail: (error) => reject(error)
            });
          } catch (error) {
            reject(error);
          }
        });
      };
      
      $el.onAsync = (event, selector) => {
        return new Promise((resolve) => {
          const handler = (e) => {
            $el.off(event, selector, handler);
            resolve(e);
          };
          if (selector) {
            $el.on(event, selector, handler);
          } else {
            $el.on(event, handler);
          }
        });
      };
      
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
    
    sandbox.interval = (fn, ms, maxRuns) => {
      let intervalId;
      let runCount = 0;
      let stopped = false;
      
      const promise = new Promise((resolve, reject) => {
        intervalId = setInterval(() => {
          if (stopped) {
            clearInterval(intervalId);
            resolve(runCount);
            return;
          }
          try {
            fn();
            runCount++;
            if (maxRuns && runCount >= maxRuns) {
              clearInterval(intervalId);
              resolve(runCount);
            }
          } catch (error) {
            clearInterval(intervalId);
            reject(error);
          }
        }, ms);
      });
      
      return {
        stop: () => {
          stopped = true;
          if (intervalId) clearInterval(intervalId);
        },
        promise: promise
      };
    };
    
    sandbox.ready = () => new Promise((resolve) => $(document).ready(resolve));
    sandbox.loaded = () => new Promise((resolve) => $(window).on('load', resolve));
    
    // Resource loading
    sandbox.loadCSS = (url) => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.onload = () => resolve(link);
        link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
        document.head.appendChild(link);
      });
    };
    
    sandbox.loadScript = (url) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
      });
    };
    
    return sandbox;
  };

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
  
  $.FEAR = function(options) {
    const instance = createGUI();
    if (options) instance.configure(options);
    return instance;
  };
  
  // Expose utilities and factories on $.FEAR
  $.FEAR.utils = utils;
  $.FEAR.createBroker = createBroker;
  $.FEAR.createRegistry = createRegistry;
  $.FEAR.createSandbox = createSandbox;
  $.FEAR.version = '2.0.0';
  
  // Create singleton instance
  $.FEAR.gui = createGUI();
  
  // Also expose as window.FEAR
  window.FEAR = $.FEAR;
  
})(jQuery, window, document);