import { Utils } from "./utils";
import { Broker } from "./broker";
import { SandBox } from "./sandbox";

export const FEAR = (($) => {

    // Make sure we have jQuery
    if (typeof $ === 'undefined' || $ === null) {
        throw new Error('FEAR GUI requires jQuery library.');
    }

    // GUI Constructor
    function GUI() {
        // Default configuration
        this.config = {
            logLevel: 0,
            name: 'FEAR_GUI',
            mode: 'single',
            version: '1.0.1',
            jquery: true,
            animations: false
        };

        // Private objects & arrays for tracking
        this._modules = {};
        this._plugins = [];
        this._instances = {};
        this._sandboxes = {};
        this._running = {};
        this._imports = [];

        // Add broker and router to core object
        this._broker = new Broker(this);

        // Public access to classes
        this.Broker = Broker;

        // Dynamic async module loading
        this.attach = (imports) => {
            console.log('Dynamic async module loading.');
            console.log('Imports:', imports);
        };

        // Configuration method
        this.configure = (options) => {
            if (options && Utils.isObj(options)) {
                // Set custom config options
                this.config = Utils.merge(this.config, options);

                // Set logging verbosity
                this.debug.level = this.config.logLevel || 0;
            }
        };
    }

    // console log wrapper
    GUI.prototype.debug = {
        level: 0,
        history: [],
        timeout: 5000,

        /**
         * Adds a warning message to the console.
         * @param {String} out the message
         */
        warn(out) {
            if (this.level < 2) {
                const args = ['WARN:', ...arguments];

                if (typeof window !== 'undefined' && window.console?.warn) {
                    this._logger("warn", args);
                } else if (window.console?.log) {
                    this._logger("log", args);
                } else if (window.opera?.postError) {
                    window.opera.postError(`WARNING: ${out}`);
                }
            }
        },

        /**
         * Adds a message to the console.
         * @param {String} out the message
         */
        log(out) {
            if (this.level < 1) {
                if (window.console?.log) {
                    const args = ['Debug:', ...arguments];
                    this._logger("log", args);
                } else if (window.opera?.postError) {
                    window.opera.postError(`DEBUG: ${out}`);
                }
            }
        },

        _logger(type, arr) {
            this.history.push({ type, args: arr });

            if (console[type]?.apply) {
                console[type].apply(console, arr);
            } else {
                console[type](arr);
            }
        },

        _stackTrace() {
            this.log(this.history);
        }
    };

    /* Public Methods */
    /******************/

    /** 
     * Create new GUI module 
     *
     * @param id {string} - module identifier
     * @param creator {function}  logic to execute inside module namespace
     * @param options {object} - optional object of extra parameters that will be passed to load() 
     * @return this {object}
    **/
    GUI.prototype.create = (id, creator, options = {}) => {
        // Validate input parameters
        const error = Utils.isType("string", id, "module ID") ||
            Utils.isType("function", creator, "creator") ||
            Utils.isType("object", options, "option parameter");

        if (error) {
            this.debug.warn(`could not register module '${id}': ${error}`);
            return this;
        }

        // Check if module is already registered
        if (id in this._modules) {
            this.debug.log(`module ${id} was already registered`);
            return this;
        }

        // Register the module
        this._modules[id] = {
            id,
            creator,
            options
        };

        return this;
    };

    /** 
     * Starts module with new sandbox instance 
     *
     * @param moduleId {string} - module name or identifier
     * @param opt {object} - optional options object
     * @return Promise - resolves when module is started
    **/
    GUI.prototype.start = (moduleId, opt = {}) => {
        // Handle different parameter combinations
        if (arguments.length === 0) {
            return this._startAll();
        }

        if (moduleId instanceof Array) {
            return this._startAll(moduleId);
        }

        if (typeof moduleId === "function") {
            return this._startAll();
        }

        const id = opt.instanceId || moduleId;

        // Validate parameters
        const error = Utils.isType("string", moduleId, "module ID") ||
            Utils.isType("object", opt, "second parameter") ||
            (!this._modules[moduleId] ? "module doesn't exist" : undefined);

        if (error) {
            return Promise.reject(new Error(error));
        }

        if (this._running[id] === true) {
            return Promise.reject(new Error("module was already started"));
        }

        // Boot and create instance
        return this.boot()
            .then(() => this._createInstance(moduleId, opt))
            .then(({ instance, options }) => {
                // Check if load method expects a callback or returns a promise
                if (instance.load && typeof instance.load === 'function') {
                    const loadResult = instance.load(options);
                    
                    // If load returns a promise, use it
                    if (loadResult && typeof loadResult.then === 'function') {
                        return loadResult.then(() => {
                            this._running[id] = true;
                        });
                    } else {
                        // Synchronous load
                        this._running[id] = true;
                        return Promise.resolve();
                    }
                } else {
                    this._running[id] = true;
                    return Promise.resolve();
                }
            })
            .catch(err => {
                this.debug.warn(err);
                throw new Error("could not start module: " + err.message);
            });
    };

    /** 
     * Loads plugin to Sandbox or Core classes 
     *
     * @param plugin {function} - method with plugin logic 
     * @param opt {object} - optional options object to be accessed in plugin 
     * @return this {object}
    **/
    GUI.prototype.use = (plugin, opt) => {
        if (Utils.isArr(plugin)) {
            // Handle array of plugins
            plugin.forEach(p => {
                if (typeof p === "function") {
                    this.use(p);
                } else if (typeof p === "object") {
                    this.use(p.plugin, p.options);
                }
            });
        } else {
            // Must be a function
            if (!Utils.isFunc(plugin)) {
                return this;
            }

            // Add to _plugins array
            this._plugins.push({
                creator: plugin,
                options: opt
            });
        }

        return this;
    };

    /** 
     * Stops all running instances 
     *
     * @param id {string} - module identifier 
     * @return Promise - resolves when module is stopped
    **/
    GUI.prototype.stop = function (id) {
        if (arguments.length === 0 || typeof id === "function") {
            const moduleIds = Object.keys(this._instances);
            return this._run.all(moduleIds.map(moduleId => () => this.stop(moduleId)));
        }

        const instance = this._instances[id];
        
        if (!instance) {
            return Promise.resolve();
        }

        // remove instance from instances cache
        delete this._instances[id];

        // disable any events registered by module
        this._broker.off(instance);

        // run unload method in stopped modules
        return this._runSandboxPlugins('unload', this._sandboxes[id])
            .then(() => {
                if (instance.unload && typeof instance.unload === 'function') {
                    const unloadResult = instance.unload();
                    
                    // If unload returns a promise, use it
                    if (unloadResult && typeof unloadResult.then === 'function') {
                        return unloadResult;
                    }
                }
                return Promise.resolve();
            })
            .then(() => {
                delete this._running[id];
            });
    };

    /** 
     * Register jQuery plugins to $ nameSpace 
     *
     * @param plugin {object} - plugin object with all logic 
     * @param module {string} - identifier for jQuery plugin 
     * @return {function} - initialized jQuery plugin 
    **/
    GUI.prototype.plugin = (plugin, module) => {
        if (plugin.fn && Utils.isFunc(plugin.fn)) {
            $.fn[module.toLowerCase()] = function (options) {
                return new plugin.fn(this, options);
            };
        } else {
            this.debug.log('Error :: Missing ' + plugin + ' fn() method.');
        }
    };

    /** 
     * Load single or all available core plugins 
     *
     * @return Promise - resolves when plugins are loaded
    **/
    GUI.prototype.boot = () => {
        const core = this;

        const tasks = this._plugins
            .filter(plugin => plugin.booted !== true)
            .map(plugin => () => {
                return new Promise((resolve, reject) => {
                    try {
                        // Check if creator expects a callback (3 parameters: core, options, next)
                        if (Utils.hasArgs(plugin.creator, 3)) {
                            plugin.creator(core, plugin.options, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    plugin.booted = true;
                                    resolve();
                                }
                            });
                        } else {
                            plugin.plugin = plugin.creator(core, plugin.options);
                            plugin.booted = true;
                            resolve();
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });

        return this._run.series(tasks);
    };

    /* Private Methods */
    /*******************/
    /* Run methods for async loading of modules and plugins */
    GUI.prototype._run = {
        /**
        * Run all modules one after another 
        *
        * @param args {array} - arguments list 
        * @return Promise
        **/
        all: (args = []) => {
            const tasks = args.map(a => () => Promise.resolve(a));
            return this.parallel(tasks);
        },

        /**
        * Run asynchronous tasks in parallel 
        *
        * @param tasks {array} - array of functions that return promises
        * @return Promise
        **/
        parallel: (tasks = []) => {
            if (tasks.length === 0) {
                return Promise.resolve([]);
            }

            const promises = tasks.map((task, index) => {
                try {
                    const result = task();
                    // Ensure it's a promise
                    return Promise.resolve(result).catch(err => ({ error: err, index }));
                } catch (err) {
                    return Promise.resolve({ error: err, index });
                }
            });

            return Promise.all(promises)
                .then(results => {
                    const errors = [];
                    const validResults = [];
                    
                    results.forEach((result, index) => {
                        if (result && result.error) {
                            errors[index] = result.error;
                        } else {
                            validResults[index] = result;
                        }
                    });

                    if (errors.some(err => err !== undefined)) {
                        const error = new Error('Some tasks failed');
                        error.errors = errors;
                        error.results = validResults;
                        throw error;
                    }

                    return validResults;
                });
        },

        /**
        * Run asynchronous tasks one after another 
        *
        * @param tasks {array} - array of functions that return promises
        * @return Promise
        **/
        series: (tasks = []) => {
            if (tasks.length === 0) {
                return Promise.resolve([]);
            }

            return tasks.reduce((promise, task, index) => {
                return promise.then(results => {
                    try {
                        const result = task();
                        return Promise.resolve(result)
                            .then(taskResult => [...results, taskResult])
                            .catch(err => {
                                const error = new Error(`Task ${index} failed`);
                                error.originalError = err;
                                error.taskIndex = index;
                                throw error;
                            });
                    } catch (err) {
                        const error = new Error(`Task ${index} failed`);
                        error.originalError = err;
                        error.taskIndex = index;
                        throw error;
                    }
                });
            }, Promise.resolve([]));
        },

        /**
        * Run first task that succeeds
        *
        * @param tasks {array} - array of functions that return promises
        * @return Promise
        **/
        first: (tasks = []) => {
            if (tasks.length === 0) {
                return Promise.reject(new Error('No tasks provided'));
            }

            return tasks.reduce((promise, task, index) => {
                return promise.catch(() => {
                    try {
                        return Promise.resolve(task());
                    } catch (err) {
                        if (index === tasks.length - 1) {
                            throw err;
                        }
                        return Promise.reject(err);
                    }
                });
            }, Promise.reject());
        },

        /**
        * Run asynchronous tasks one after another
        * and pass the result to the next task
        *
        * @param tasks {array} - array of functions that accept previous result and return promises
        * @return Promise
        **/
        waterfall: (tasks = []) => {
            if (tasks.length === 0) {
                return Promise.resolve();
            }

            return tasks.reduce((promise, task) => {
                return promise.then(result => {
                    try {
                        return Promise.resolve(task(result));
                    } catch (err) {
                        return Promise.reject(err);
                    }
                });
            }, Promise.resolve());
        }
    };

    /** 
      * Called when starting all modules
      *
      * @param mods {array} - array of module IDs to start 
      * @return Promise
    **/
    GUI.prototype._startAll = (mods) => {
        // start all stored modules
        if (!mods || mods === null) {
            mods = Object.keys(this._modules);
        }

        const startTasks = mods.map(moduleId => () => 
            this.start(moduleId, this._modules[moduleId].options)
                .catch(err => {
                    // Store error with module ID for reporting
                    const moduleError = new Error(`Failed to start module '${moduleId}': ${err.message}`);
                    moduleError.moduleId = moduleId;
                    moduleError.originalError = err;
                    throw moduleError;
                })
        );

        return this._run.parallel(startTasks)
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

    /** 
      * Create new sandbox instance and attach to module 
      *
      * @param moduleId {string} - the module to create sandbox instance for 
      * @param o {object} - options object 
      * @return Promise - resolves with {instance, options}
    **/
    GUI.prototype._createInstance = (moduleId, o) => {
        const { options: opt } = o;
        const id = o.instanceId || moduleId;
        const module = this._modules[moduleId];

        // Return existing instance if it exists
        if (this._instances[id]) {
            return Promise.resolve({ instance: this._instances[id], options: opt });
        }

        // Merge options with module defaults (module options have lower priority)
        const iOpts = {
            ...module.options,
            ...opt
        };

        // Create new API Sandbox
        const sb = new SandBox().create(this, id, iOpts, moduleId);

        // Add config object if available
        if (this.config) {
            sb.config = this.config;
        }

        // Run sandboxed instance load method
        return this._runSandboxPlugins('load', sb)
            .then(() => {
                const instance = new module.creator(sb);

                // Check if module has required methods
                if (typeof instance.load !== "function") {
                    // Check if it's a jQuery plugin
                    if (instance.fn && typeof instance.fn === 'function') {
                        this.plugin(instance, id);
                        return { instance, options: iOpts };
                    }
                    throw new Error("module has no 'load' or 'fn' method");
                }

                // Store instance and sandbox
                this._instances[id] = instance;
                this._sandboxes[id] = sb;

                return { instance, options: iOpts };
            });
    };

    /** 
      * Sets up needed tasks for module initializations 
      *
      * @param ev {string} - check module for load / unload methods 
      * @param sb {object} - the sandbox instance 
      * @return Promise
    **/
    GUI.prototype._runSandboxPlugins = (ev, sb) => {
        // Filter plugins that have the specified event handler
        const tasks = this._plugins
            .filter(plugin => typeof plugin.plugin?.[ev] === "function")
            .map(plugin => () => {
                const eventHandler = plugin.plugin[ev];
                
                return new Promise((resolve, reject) => {
                    try {
                        // Check if the handler expects a callback (3 parameters: sb, options, next)
                        if (Utils.hasArgs(eventHandler, 3)) {
                            eventHandler(sb, plugin.options, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            // Handler doesn't use callback, call it synchronously
                            const result = eventHandler(sb, plugin.options);
                            
                            // If handler returns a promise, use it
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

        return this._run.series(tasks);
    };

    return GUI;

})(jQuery);

export default GUI = FEAR;