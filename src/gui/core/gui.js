// gui.js - Main entry point with functional design
import { utils } from './utils';
import { createBroker } from './broker';
import { createSandbox } from './sandbox';

export function FUI($) {
  if (typeof $ === 'undefined' || $ === null) {
    throw new Error('FEAR GUI requires jQuery library.');
  }

  // GUI state
  this.state = {
    config: {
      logLevel: 0,
      name: 'FEAR_GUI',
      mode: 'single',
      version: '1.0.1',
      jquery: true,
      animations: false
    },
    modules: {},
    plugins: [],
    instances: {},
    sandboxes: {},
    running: {},
    imports: []
  };
  
  // Create broker and event system
  this.broker = createBroker();
  
  // Debug logger
  this.debug = {
    level: 0,
    history: [],
    timeout: 5000,
    
    warn: (...args) => {
      if (debug.level < 2) {
        const logArgs = ['WARN:', ...args];
        debug._logger('warn', logArgs);
      }
    },
    
    log: (...args) => {
      if (debug.level < 1) {
        const logArgs = ['Debug:', ...args];
        debug._logger('log', logArgs);
      }
    },
    
    _logger: (type, arr) => {
      debug.history.push({ type, args: arr });
      
      if (console[type]?.apply) {
        console[type].apply(console, arr);
      } else {
        console[type](arr);
      }
    }
  };
  
  // Private helpers
  this._runSandboxPlugins = (ev, sb) => {
    const tasks = this.state.plugins
      .filter(plugin => typeof plugin.plugin?.[ev] === 'function')
      .map(plugin => () => {
        const eventHandler = plugin.plugin[ev];
        
        return new Promise((resolve, reject) => {
          try {
            if (utils.hasArgs(eventHandler, 3)) {
              eventHandler(sb, plugin.options, (err) => {
                err ? reject(err) : resolve();
              });
            } else {
              const result = eventHandler(sb, plugin.options);
              
              if (result && typeof result.then === 'function') {
                result.then(resolve, reject);
              } else {
                resolve();
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    
    return utils.run.series(tasks);
  };
  
  const createInstance = (moduleId, o) => {
    const { options: opt } = o;
    const id = o.instanceId || moduleId;
    const module = state.modules[moduleId];
    
    if (state.instances[id]) {
      return Promise.resolve({ instance: state.instances[id], options: opt });
    }
    
    const iOpts = {
      ...module.options,
      ...opt
    };
    
    const sb = createSandbox(gui, id, iOpts, moduleId);
    
    return runSandboxPlugins('load', sb)
      .then(() => {
        const instance = new module.creator(sb);
        
        if (typeof instance.load !== 'function') {
          if (instance.fn && typeof instance.fn === 'function') {
            gui.plugin(instance, id);
            return { instance, options: iOpts };
          }
          throw new Error("module has no 'load' or 'fn' method");
        }
        
        state.instances[id] = instance;
        state.sandboxes[id] = sb;
        
        return { instance, options: iOpts };
      });
  };
  
  const startAll = (mods) => {
    if (!mods || mods === null) {
      mods = Object.keys(state.modules);
    }
    
    const startTasks = mods.map(moduleId => () =>
      gui.start(moduleId, state.modules[moduleId].options)
        .catch(err => {
          const moduleError = new Error(`Failed to start module '${moduleId}': ${err.message}`);
          moduleError.moduleId = moduleId;
          moduleError.originalError = err;
          throw moduleError;
        })
    );
    
    return utils.run.parallel(startTasks)
      .catch(error => {
        if (error.errors) {
          const moduleErrors = {};
          const failedModules = [];
          
          error.errors.forEach((err, index) => {
            if (err) {
              const moduleId = mods[index];
              moduleErrors[moduleId] = err;
              failedModules.push(`'${moduleId}'`);
            }
          });
          
          const aggregatedError = new Error(`errors occurred in the following modules: ${failedModules.join(', ')}`);
          aggregatedError.moduleErrors = moduleErrors;
          throw aggregatedError;
        }
        throw error;
      });
  };
  
  // Public API
  const gui = {
    config: state.config,
    debug,
    broker,
    Broker: createBroker,
    utils,
    
    configure: (options) => {
      if (options && utils.isObj(options)) {
        state.config = utils.merge(state.config, options);
        debug.level = state.config.logLevel || 0;
      }
      return gui;
    },
    
    create: (id, creator, options = {}) => {
      const error = utils.isType('string', id, 'module ID') ||
        utils.isType('function', creator, 'creator') ||
        utils.isType('object', options, 'option parameter');
      
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
    
    start: (moduleId, opt = {}) => {
      if (arguments.length === 0) {
        return startAll();
      }
      
      if (moduleId instanceof Array) {
        return startAll(moduleId);
      }
      
      if (typeof moduleId === 'function') {
        return startAll();
      }
      
      const id = opt.instanceId || moduleId;
      
      const error = utils.isType('string', moduleId, 'module ID') ||
        utils.isType('object', opt, 'second parameter') ||
        (!state.modules[moduleId] ? "module doesn't exist" : undefined);
      
      if (error) {
        return Promise.reject(new Error(error));
      }
      
      if (state.running[id] === true) {
        return Promise.reject(new Error('module was already started'));
      }
      
      return gui.boot()
        .then(() => createInstance(moduleId, opt))
        .then(({ instance, options }) => {
          if (instance.load && typeof instance.load === 'function') {
            const loadResult = instance.load(options);
            
            if (loadResult && typeof loadResult.then === 'function') {
              return loadResult.then(() => {
                state.running[id] = true;
              });
            } else {
              state.running[id] = true;
              return Promise.resolve();
            }
          } else {
            state.running[id] = true;
            return Promise.resolve();
          }
        })
        .catch(err => {
          debug.warn(err);
          throw new Error('could not start module: ' + err.message);
        });
    },
    
    stop: (id) => {
      if (arguments.length === 0 || typeof id === 'function') {
        const moduleIds = Object.keys(state.instances);
        return utils.run.parallel(moduleIds.map(moduleId => () => gui.stop(moduleId)));
      }
      
      const instance = state.instances[id];
      
      if (!instance) {
        return Promise.resolve();
      }
      
      delete state.instances[id];
      broker.remove(instance);
      
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
        .then(() => {
          delete state.running[id];
        });
    },
    
    use: (plugin, opt) => {
      if (utils.isArr(plugin)) {
        plugin.forEach(p => {
          if (typeof p === 'function') {
            gui.use(p);
          } else if (typeof p === 'object') {
            gui.use(p.plugin, p.options);
          }
        });
      } else {
        if (!utils.isFunc(plugin)) {
          return gui;
        }
        
        state.plugins.push({
          creator: plugin,
          options: opt
        });
      }
      
      return gui;
    },
    
    plugin: (plugin, module) => {
      if (plugin.fn && utils.isFunc(plugin.fn)) {
        $.fn[module.toLowerCase()] = function(options) {
          return new plugin.fn(this, options);
        };
      } else {
        debug.log('Error :: Missing ' + plugin + ' fn() method.');
      }
      return gui;
    },
    
    boot: () => {
      const tasks = state.plugins
        .filter(plugin => plugin.booted !== true)
        .map(plugin => () => {
          return new Promise((resolve, reject) => {
            try {
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
                plugin.plugin = plugin.creator(gui, plugin.options);
                plugin.booted = true;
                resolve();
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      
      return utils.run.series(tasks);
    },
    
    attach: async (imports) => {
      debug.log('Dynamic async module loading.');
      debug.log('Imports:', imports);
    }
  };

  debug.warn('GUI initialized', gui);
  
  return gui;
};

export const FEAR = ($) => new FUI($);

// Auto-initialize if jQuery is available
let instance = null;
if (typeof jQuery !== 'undefined') {
  instance = new FUI(jQuery);
}

export default instance;