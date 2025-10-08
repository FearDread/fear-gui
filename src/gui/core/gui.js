// gui.js - Main entry point with functional design
import { $ } from "jQuery";
import { utils } from './utils';
import { createRegistry } from './registry';
import { createBroker } from './broker';
import { createSandbox } from './sandbox';

export function GUI() {

    const self = this;

    if (typeof $ === 'undefined' || $ === null) {
      throw new Error('FEAR GUI requires jQuery library.');
    }

    this.config = {
        logLevel: 0,
        name: 'FEAR_GUI',
        mode: 'single',
        version: '1.0.1',
        jquery: true,
        animations: false
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
    // Create module registry
    this.registry = createRegistry(this.this.state.config);
    // Create broker and event system
    this.broker = createBroker();
<<<<<<< HEAD
    // this.debug logger
=======

    // self.debug logger
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
    this.debug = {
      level: 0,
      history: [],
      timeout: 5000,

      warn: (...args) => {
<<<<<<< HEAD
        if (this.debug.level < 2) {
          const logArgs = ['WARN:', ...args];
          this.debug._logger('warn', logArgs);
=======
        if (self.debug.level < 2) {
          const logArgs = ['WARN:', ...args];
          self.debug._logger('warn', logArgs);
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
        }
      },

      log: (...args) => {
<<<<<<< HEAD
        if (this.debug.level < 1) {
          const logArgs = ['this.debug:', ...args];
          this.debug._logger('log', logArgs);
=======
        if (self.debug.level < 1) {
          const logArgs = ['self.debug:', ...args];
          self.debug._logger('log', logArgs);
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
        }
      },

      _logger: (type, arr) => {
<<<<<<< HEAD
        this.debug.history.push({ type, args: arr });
=======
        self.debug.history.push({ type, args: arr });
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931

        if (console[type]?.apply) {
          console[type].apply(console, arr);
        } else {
          console[type](arr);
        }
      }
    };
    // Private helpers
    this._runSandboxPlugins = (ev, sb) => {
      const tasks = this.this.state.plugins
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

    this._createInstance = (moduleId, o) => {
      const { options: opt } = o;
      const id = o.instanceId || moduleId;
      const module = this.this.state.modules[moduleId];

      if (this.state.instances[id]) {
        return Promise.resolve({ instance: this.state.instances[id], options: opt });
      }

      const iOpts = {
        ...module.options,
        ...opt
      };

      const sb = createSandbox(gui, id, iOpts, moduleId);

      return this._runSandboxPlugins('load', sb)
        .then(() => {
          const instance = new module.creator(sb);

          if (typeof instance.load !== 'function') {
            if (instance.fn && typeof instance.fn === 'function') {
              gui.plugin(instance, id);
              return { instance, options: iOpts };
            }
            throw new Error("module has no 'load' or 'fn' method");
          }

          self.state.instances[id] = instance;
          self.state.sandboxes[id] = sb;
          // Register instance in registry
          self.registry.register(id, instance);
          return { instance, options: iOpts };
        });
    };

    this._startAll = (mods) => {
      if (!mods || mods === null) {
        mods = Object.keys(this.state.modules);
      }

      const startTasks = mods.map(moduleId => () =>
        gui.start(moduleId, this.state.modules[moduleId].options)
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
<<<<<<< HEAD
    return {
      configure: (options) => {
        if (options && utils.isObj(options)) {
          this.config = utils.merge(this.config, options);
          this.debug.level = this.config.logLevel || 0;
=======
    const gui = {
      config: self.state.config,
      debug: self.debug,
      registry: self.registry,
      broker: self.broker,
      utils,

      configure: (options) => {
        if (options && utils.isObj(options)) {
          this.state.config = utils.merge(this.state.config, options);
          self.debug.level = this.state.config.logLevel || 0;
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
        }
        return this;
      },

      create: (id, creator, options = {}) => {
        const error = utils.isType('string', id, 'module ID') ||
          utils.isType('function', creator, 'creator') ||
          utils.isType('object', options, 'option parameter');

        if (error) {
<<<<<<< HEAD
          this.debug.warn(`could not register module '${id}': ${error}`);
          return this;
        }

        if (state.modules[id]) {
          this.debug.log(`module ${id} was already registered`);
          return this;
        }

        state.modules[id] = { id, creator, options };
        return this;
=======
          self.debug.warn(`could not register module '${id}': ${error}`);
          return gui;
        }

        if (this.state.modules[id]) {
          self.debug.log(`module ${id} was already registered`);
          return gui;
        }

        this.state.modules[id] = { id, creator, options };
        return gui;
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
      },

      start: (moduleId, opt = {}) => {
        if (arguments.length === 0) {
          return this._startAll();
        }

        if (moduleId instanceof Array) {
          return this._startAll(moduleId);
        }

        if (typeof moduleId === 'function') {
          return this._startAll();
        }

        const id = opt.instanceId || moduleId;

        const error = utils.isType('string', moduleId, 'module ID') ||
          utils.isType('object', opt, 'second parameter') ||
          (!this.state.modules[moduleId] ? "module doesn't exist" : undefined);

        if (error) {
          return Promise.reject(new Error(error));
        }

        if (this.state.running[id] === true) {
          return Promise.reject(new Error('module was already started'));
        }

        return this.boot()
          .then(() => createInstance(moduleId, opt))
          .then(({ instance, options }) => {
            if (instance.load && typeof instance.load === 'function') {
              const loadResult = instance.load(options);

              if (loadResult && typeof loadResult.then === 'function') {
                return loadResult.then(() => {
<<<<<<< HEAD
                  self.state.running[id] = true;
                });
              } else {
                self.state.running[id] = true;
                return Promise.resolve();
              }
            } else {
              self.state.running[id] = true;
=======
                  this.state.running[id] = true;
                });
              } else {
                this.state.running[id] = true;
                return Promise.resolve();
              }
            } else {
              this.state.running[id] = true;
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
              return Promise.resolve();
            }
          })
          .catch(err => {
<<<<<<< HEAD
            this.debug.warn(err);
=======
            self.debug.warn(err);
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
            throw new Error('could not start module: ' + err.message);
          });
      },

      stop: (id) => {
        if (arguments.length === 0 || typeof id === 'function') {
          const moduleIds = Object.keys(this.state.instances);
          return utils.run.parallel(moduleIds.map(moduleId => () => gui.stop(moduleId)));
        }

        const instance = this.state.instances[id];

        if (!instance) {
          return Promise.resolve();
        }

        delete this.state.instances[id];
        broker.remove(instance);

        return runSandboxPlugins('unload', this.state.sandboxes[id])
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
            delete this.state.running[id];
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

          this.state.plugins.push({
            creator: plugin,
            options: opt
          });
        }

        return gui;
      },

      plugin: (plugin, module) => {
        if (plugin.fn && utils.isFunc(plugin.fn)) {
          $.fn[module.toLowerCase()] = function (options) {
            return new plugin.fn(this, options);
          };
        } else {
<<<<<<< HEAD
          this.debug.log('Error :: Missing ' + plugin + ' fn() method.');
=======
          self.debug.log('Error :: Missing ' + plugin + ' fn() method.');
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
        }
        return gui;
      },

      boot: () => {
        const tasks = this.state.plugins
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
<<<<<<< HEAD
        this.debug.log('Dynamic async module loading.');
        this.debug.log('Imports:', imports);
=======
        self.debug.log('Dynamic async module loading.');
        self.debug.log('Imports:', imports);
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
      }
    };
};

<<<<<<< HEAD
export const createGUI = () => new GUI();
export { GUI as FEAR } 
export default { FEAR, createGUI };
=======
    self.debug.warn('GUI initialized', gui);

    return gui;
  };
})(jQuery);

export const createGUI = () => new GUI();


export const FEAR = ($) => new GUI($);
export default FEAR;


  // ============================================
  // jQuery Integration
  // ============================================




  
>>>>>>> d922491674410af657e8c64cadfbcd70e5c0e931
