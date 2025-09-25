import Utils from "./utils";
import Broker from "./broker";
import SandBox from "./sandbox";

export const GUI = (($) => {

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
     * @param cb {function} - callback function 
     * @return boot {function} - call boot method and create new sandbox instance 
    **/
    GUI.prototype.start = (moduleId, opt = {}, cb = () => { }) => {
        // Handle different parameter combinations
        if (arguments.length === 0) {
            return this._startAll();
        }

        if (moduleId instanceof Array) {
            return this._startAll(moduleId, opt);
        }

        if (typeof moduleId === "function") {
            return this._startAll(null, moduleId);
        }

        if (typeof opt === "function") {
            cb = opt;
            opt = {};
        }

        const id = opt.instanceId || moduleId;

        // Validate parameters
        const error = Utils.isType("string", moduleId, "module ID") ||
            Utils.isType("object", opt, "second parameter") ||
            (!this._modules[moduleId] ? "module doesn't exist" : undefined);

        if (error) {
            return this._fail(error, cb);
        }

        if (this._running[id] === true) {
            return this._fail(new Error("module was already started"), cb);
        }

        // Initialize instance handler
        const initInstance = async (err, instance, options) => {
            if (err) {
                return this._fail(err, cb);
            }

            try {
                // Check if load method expects a callback
                if (Utils.hasArgs(instance.load, 2)) {
                    return instance.load(options, (loadErr) => {
                        if (!loadErr) {
                            this._running[id] = true;
                        }
                        return cb(loadErr);
                    });
                } else {
                    // Synchronous load
                    instance.load(options);
                    this._running[id] = true;
                    return cb();
                }
            } catch (e) {
                return this._fail(e, cb);
            }
        };

        // Boot and create instance
        return this.boot((err) => {
            if (err) {
                return this._fail(err, cb);
            }
            return this._createInstance(moduleId, opt, initInstance);
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
     * @param callback {function} - optional callback to run when module stopped
     * @return this {object}
    **/
    GUI.prototype.stop = function (id, callback) {
        var instance;

        if (cb === null) {
            cb = function () { };
        }

        if (arguments.length === 0 || typeof id === "function") {
            this._run.all((function () {
                var results = [], x;

                for (x in this._instances) {
                    results.push(x);
                }

                return results;

            }).call(this), ((function (_this) {
                return function () {
                    return _this.stop.apply(_this, arguments);
                };
            })(this)), id, true);

        } else if (instance === this._instances[id]) {

            // remove instance from instances cache
            delete this._instances[id];

            // disable any events registered by module
            this._broker.off(instance);

            // run unload method in stopped modules
            this._runSandboxPlugins('unload', this._sandboxes[id], (function (_this) {
                return function (err) {
                    if (Utils.hasArgs(instance.unload)) {

                        return instance.unload(function (err2) {
                            delete _this._running[id];

                            return cb(err || err2);
                        });
                    } else {

                        if (typeof instance.unload === "function") {
                            instance.unload();
                        }

                        delete _this._running[id];

                        return cb(err);
                    }
                };
            })(this));
        }

        return this;
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
            GUI.log('Error :: Missing ' + plugin + ' fn() method.');
        }
    };

    /** 
     * Load single or all available core plugins 
     *
     * @param cb {function} - callback to execute after plugins loaded 
     * @return this {object} - return GUI object with tasks array
    **/
    GUI.prototype.boot = (cb) => {
        let plugin;
        const core = this;

        const tasks = (() => {
            var leng;
            const ref = this._plugins;
            const results = [];

            for (var j = 0, leng = ref.length; j < leng; j++) {
                plugin = ref[j];

                if (plugin.booted !== true) {
                    results.push(((p) => {

                        if (Utils.hasArgs(p.creator, 3)) {
                            return (next) => {
                                var plugin;

                                return p.creator(core, p.options, function (err) {
                                    if (!err) {
                                        p.booted = true;
                                        p.plugin = plugin;
                                    }

                                    return next();
                                });
                            };
                        } else {
                            return (next) => {
                                p.plugin = p.creator(core, p.options);
                                p.booted = true;

                                return next();
                            };
                        }
                    })(p));
                }
            }

            return results;

        }).call(this);

        this._run.series(tasks, cb, true);

        return this;
    };

    /* Private Methods */
    /*******************/
    /* Run methods for async loading of modules and plugins */
    GUI.prototype._run = {

        /**
        * Run all modules one after another 
        *
        * @param args {array} - arguments list 
        * @return void
        **/
        all: (args, fn, cb, force) => {
            var a, tasks;

            if (!args || args === null) {
                args = [];
            }

            tasks = (() {
                var j, len, results1;

                results1 = [];

                for (j = 0, len = args.length; j < len; j++) {
                    a = args[j];

                    results1.push(((a) {
                        return (next) {
                            return fn(a, next);
                        };
                    })(a));
                }

                return results1;

            })();

            return this.parallel(tasks, cb, force);
        },

        /**
        * Run asynchronous tasks in parallel 
        *
        * @param args {array} - arguments list 
        * @return void
        **/
        parallel: (tasks, cb, force) => {
            var count, errors, hasErr, i, j, len, results, paralleled, task;

            if (!tasks || tasks === null) {

                tasks = [];

            } else if (!cb || cb === null) {

                cb = (() { });
            }

            count = tasks.length;
            results = [];

            if (count === 0) {
                return cb(null, results);
            }

            errors = [];

            hasErr = false;
            paralleled = [];

            for (i = j = 0, len = tasks.length; j < len; i = ++j) {
                task = tasks[i];

                paralleled.push(((t, idx) {
                    var e, next;

                    next = () {
                        var err, res;

                        err = arguments[0];
                        res = (2 <= arguments.length) ? Utils.slice.call(arguments, 1) : [];

                        if (err) {
                            errors[idx] = err;
                            hasErr = true;

                            if (!force) {
                                return cb(errors, results);
                            }
                        } else {
                            results[idx] = res.length < 2 ? res[0] : res;
                        }

                        if (--count <= 0) {
                            if (hasErr) {
                                return cb(errors, results);
                            } else {
                                return cb(null, results);
                            }
                        }
                    };

                    try {

                        return t(next);

                    } catch (_error) {
                        e = _error;
                        return next(e);
                    }
                })(task, i));
            }

            return paralleled;
        },

        /**
        * Run asynchronous tasks one after another 
        *
        * @param args {array} - arguments list 
        * @return void
        **/
        series: (tasks, cb, force) => {
            var count, errors, hasErr, i, next, results;

            if (!tasks || tasks === null) {
                tasks = [];
            }
            if (!cb || cb === null) {
                cb = (() { });
            }

            i = -1;

            count = tasks.length;
            results = [];

            if (count === 0) {
                return cb(null, results);
            }

            errors = [];
            hasErr = false;

            next = () {
                var e, err, res;

                err = arguments[0];
                res = (2 <= arguments.length) ? Utils.slice.call(arguments, 1) : [];

                if (err) {
                    errors[i] = err;
                    hasErr = true;

                    if (!force) {
                        return cb(errors, results);
                    }
                } else {
                    if (i > -1) {
                        results[i] = res.length < 2 ? res[0] : res;
                    }
                }

                if (++i >= count) {

                    if (hasErr) {
                        return cb(errors, results);
                    } else {
                        return cb(null, results);
                    }
                } else {

                    try {
                        return tasks[i](next);
                    } catch (_error) {
                        e = _error;
                        return next(e);
                    }
                }
            };

            return next();
        },

        /**
        * Run first task, which does not return an error 
        *
        * @param tasks {array} - tasks list 
        * @param cb { } - callback method
        * @param force {boolean} - optional force errors
        * @return { } execute 
        **/
        first: (tasks, cb, force) => {
            var count, errors, i, next, result;

            if (!tasks || tasks === null) {
                tasks = [];
            }
            if (!cb || cb === null) {
                cb = (() { });
            }

            i = -1;

            count = tasks.length;
            result = null;

            if (!count || count === 0) {
                return cb(null);
            }

            errors = [];

            next = () {
                var e, err, res;

                err = arguments[0];
                res = (2 <= arguments.length) ? Utils.slice.call(arguments, 1) : [];

                if (err) {
                    errors[i] = err;

                    if (!force) {
                        return cb(errors);
                    }
                } else {

                    if (i > -1) {

                        return cb(null, res.length < 2 ? res[0] : res);
                    }
                }

                if (++i >= count) {

                    return cb(errors);

                } else {

                    try {

                        return tasks[i](next);

                    } catch (_error) {

                        e = _error;
                        return next(e);
                    }
                }
            };

            return next();
        },

        /**
        * Run asynchronous tasks one after another
        * and pass the argument
        *
        * @param args {array} - arguments list 
        * @return void
        **/
        waterfall: (tasks, cb) => {
            let i = -1;

            if (tasks.length === 0) return cb();

            const next = () => {
                const err = arguments[0];
                const res = (2 <= arguments.length) ? Utils.slice.call(arguments, 1) : [];

                if (err !== null) return cb(err);

                if (++i >= tasks.length) {

                    return cb.apply(null, [null].concat(Utils.slice.call(res)));
                } else {

                    return tasks[i].apply(tasks, Utils.slice.call(res).concat([next]));
                }
            };

            return next();
        }
    };
    /** 
      * Called when starting module fails 
      *
      * @param ev {object} - message or error object 
      * @param cb {function} - callback method to run with error string / object
      * @return this {object}
    **/
    GUI.prototype._fail = (ev, cb) => {
        this.debug.warn(ev);

        cb(new Error("could not start module: " + ev.message));

        return this;
    };

    /** 
      * Called when starting module fails 
      *
      * @param mods {function} - method with array of all modules to start 
      * @param cb {function} - callback method to run once modules started 
      * @return this {object}
    **/
    GUI.prototype._startAll = (mods, cb) => {
        // start all stored modules
        if (!mods || mods === null) {
            mods = (function () {
                var results = [], m;

                for (m in this._modules) {
                    results.push(m);
                }

                return results;
            }).call(this);
        }

        // self executing action
        const startAction = (function (_this) {
            return function (m, next) {
                return _this.start(m, _this._modules[m].options, next);
            };
        })(this);

        // optional done callback for async loading 
        const done = function (err) {
            var e, i, j, k, len, mdls, modErrors, x;

            if ((err !== null ? err.length : void 0) > 0) {
                modErrors = {};

                for (i = j = 0, len = err.length; j < len; i = ++j) {
                    x = err[i];

                    if (x !== null) {
                        modErrors[mods[i]] = x;
                    }
                }

                // store all available modules errors
                mdls = (function () {
                    var results = [], k;

                    for (k in modErrors) {
                        results.push("'" + k + "'");
                    }

                    return results;
                })();

                e = new Error("errors occurred in the following modules: " + mdls);
                e.moduleErrors = modErrors;
            }

            return typeof cb === "function" ? cb(e) : void 0;
        };

        // run all modules in parallel formation
        this._run.all(mods, startAction, done, true);

        return this;
    };

    /** 
      * Create new sandbox instance and attach to module 
      *
      * @param moduleId {string} - the module to create sandbox instance for 
      * @param o {object} - options object 
      * @param cb {function} - callback method to run once instance created
      * @return {function} - run sandboxed instances
    **/
    GUI.prototype._createInstance = (moduleId, o, cb) => {
        const { options: opt } = o;
        const id = o.instanceId || moduleId;
        const module = this._modules[moduleId];

        // Return existing instance if it exists
        if (this._instances[id]) {
            return cb(this._instances[id]);
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
        return this._runSandboxPlugins('load', sb, (err) => {
            if (err) {
                return cb(err);
            }

            const instance = new module.creator(sb);

            // Check if module has required methods
            if (typeof instance.load !== "function") {
                // Check if it's a jQuery plugin
                if (instance.fn && typeof instance.fn === 'function') {
                    return this.plugin(instance, id);
                }
                return cb(new Error("module has no 'load' or 'fn' method"));
            }

            // Store instance and sandbox
            this._instances[id] = instance;
            this._sandboxes[id] = sb;

            return cb(null, instance, iOpts);
        });
    };

    /** 
      * Sets up needed tasks for module initializations 
      *
      * @param ev {string} - check module for load / unload methods 
      * @param sb {object} - the sandbox instance 
      * @param cb {function} - callback method to run once instances initialized
      * @return {function} - GUI._run.seris
    **/
    GUI.prototype._runSandboxPlugins = (ev, sb, cb) => {
        // Filter plugins that have the specified event handler
        const tasks = this._plugins
            .filter(plugin => typeof plugin.plugin?.[ev] === "function")
            .map(plugin => {
                const eventHandler = plugin.plugin[ev];

                return (next) => {
                    // Check if the handler expects a callback (3 parameters: sb, options, next)
                    if (Utils.hasArgs(eventHandler, 3)) {
                        return eventHandler(sb, plugin.options, next);
                    } else {
                        // Handler doesn't use callback, call it synchronously
                        eventHandler(sb, plugin.options);
                        return next();
                    }
                };
            });

        return this._run.series(tasks, cb, true);
    };

    return GUI;

})(jQuery);