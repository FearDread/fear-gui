
export const utils = {
    /* jQuery $.extend pointer */
    merge: $.extend,

    each: Object.prototype.forEach,

    has: Object.prototype.hasOwnProperty,

    slice: Array.prototype.slice,

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

    /**
     * Attach child object prototype to parent object prototype 
     *
     * @param child {object} - object to merge prototype 
     * @param parent {object} - parent object prototype 
     * @return child {object} - combined child & parent prototypes 
    **/
    inject: (child, parent) => {
        var key;

        for (key in parent) {

            if (utils.hasProp.call(parent, key)) {
                child[key] = parent[key];
            }
        }

        function ctor() {
            this.constructor = child;
        }

        ctor.prototype = parent.prototype;

        child.prototype = new ctor();
        child.__super__ = parent.prototype;

        return child;
    },
    /**
    * Check for retina display on device 
    *
    * @return boolean
    **/
    isRetina: () => {
        return (window.retina || window.devicePixelRatio > 1);
    },

    /**
    * Check if user agent is mobile device 
    *
    * @param agent {string} - user agent
    * @return {boolean} 
    **/
    isMobile: (agent) => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
    },

    /**
    * Return number of keys in first level of object
    *
    * @param object - object to size
    * @return int
    **/
    getObjectSize: (obj) => {
        var total = 0, key;

        for (key in obj) {

            if (obj.hasOwnProperty(key)) {
                total += 1;
            }
        }

        return total;
    },

    /**
    * Convert passed unit to its equiv value in pixles 
    *
    * @param width {number} - size of the element to convert 
    * @param unit {string} - the unit to convert to pixels
    * @return {number} 
    **/
    getPxValue: (width, unit) => {
        var value;

        switch (unit) {
            case "em":
                value = this.convertToEm(width);
                break;

            case "pt":
                value = this.convertToPt(width);
                break;

            default:
                value = width;
        }

        return value;
    },

    /**
    * Returns a random number between min (inclusive) and max (exclusive)
    *
    * @param min - int min number of range
    * @param max - int max number of range
    * @return int
    **/
    rand: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
    * Returns list of argument names from   
    *
    * @param fn { } - the   to get arguments from 
    * @return {array}  
    **/
    args: (fn) => {
        var ref;

        return ((fn !== null ? (ref = fn.toString().match(utils.fnRgx)) !== null ? ref[1] : void 0 : void 0) || '').match(utils.argRgx) || [];
    },

    /**
    * Use to resize elemen to match window size 
    *
    * @param $el {object} - jQuery wrapped element to resize 
    * @return void
    **/
    resize: ($el) => {
        if (!$el.height) {
            $el = $($el);
        }
        $(() => {

            $(window).resize(() => {

                $el.height($(window).height());

            });

            $(window).resize();
        });
    },

    /**
    * Called in controllers to add to turn strings into slugs for image upload
    *
    * @param event title - of title to turn to string for insertion into URI
    * @return void
    **/
    slugify: (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    },

    /**
    * Copy an Array or Object and return new instance 
    *
    * @param data {various} - the array / object to clone (copy) 
    * @return copy {various} - the new array / object 
    **/
    clone: (data) => {
        var copy, k, v;

        if (data instanceof Array) {

            copy = (() => {
                var i, len, results;

                results = [];
                for (i = 0, len = data.length; i < len; i++) {

                    v = data[i];
                    results.push(v);
                }

                return results;

            })();

        } else {
            copy = {};

            for (k in data) {
                v = data[k];
                copy[k] = v;
            }
        }

        return copy;
    },

    /**
    * Compute passed value to em 
    *
    * @return {number} - computed em value 
    **/
    convertToEm: (value) => {
        return value * this.getFontsize();
    },

    /**
    * Compute passed value to point 
    *
    * @return {number} - computed point value 
    **/
    convertToPt: (value) => {

    },

    /**
    * Get computed fontsize from created element in pixels
    *
    * @return base {number} - computed fontsize
    **/
    convertBase: () => {
        var pixels,
            elem = document.createElement(),
            style = elem.getAttribute('style');

        elem.setAttribute('style', style + ';font-size:1em !important');
        elem.setAttribute('style', style);

        base = this.getFontsize();

        return base;
    },

    /**
    * Mix properties of two objects, optional to override property names 
    *
    * @param giv {object} - object to give properties
    * @param rec {object} - object to recieve givers properties
    * @param override {boolean} - optional arg to replace existing property keys
    * @return results {array} - new array of mixed object properties and values 
    **/
    mix: (giv, rec, override) => {
        var k, results, mixins, v;

        if (override === true) {
            results = [];

            for (k in giv) {
                v = giv[k];
                results.push(rec[k] = v);
            }

            return results;

        } else {
            mixins = [];

            for (k in giv) {
                v = giv[k];

                if (!rec.hasOwnProperty(k)) {
                    results.push(rec[k] = v);
                }
            }

            return results;
        }
    },

    /**
    * Mix various object /   combinations 
    *
    * @param input {various} - input class to give properties 
    * @param output {various} - receiving class to retain mixed properties 
    * @param override {boolean} - override property names with new values
    * @return { } - mix 
    **/
    mixin: function (input, output, override) {
        if (!override || override === null) {
            override = false;
        }

        switch ((typeof output) + "-" + (typeof input)) {
            case " - ":
                return this.mix(output.prototype, input.prototype, override);

            case " -object":
                return this.mix(output.prototype, input, override);

            case "object-object":
                return this.mix(output, input, override);

            case "object- ":
                return this.mix(output, input.prototype, override);
        }
    },

    /**
    * Generate random unique identifier string
    *
    * @param length {number} - how long the random string should be
    * @return id {string} - unique identifier 
    **/
    unique: (length) => {
        var id = '';
        if (!length || length === null) length = 8;
        while (id.length < length) {
            id += Math.random().toString(36).substr(2);
        }
        return id.substr(0, length);
    },

    /**
     * Task Runner Object 
     * @return Promise
     */
    run: {
        series: (tasks = []) => {
            if (!tasks.length) return Promise.resolve([]);

            return tasks.reduce((p, task, idx) =>
                p.then(results =>
                    Promise.resolve(task())
                        .then(r => [...results, r])
                        .catch(err => {
                            console.log('task error = ', err);
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
    },

    /**
    * Debounce function execution - delays invoking func until after wait milliseconds
    *
    * @param func {function} - function to debounce
    * @param wait {number} - milliseconds to wait
    * @param immediate {boolean} - trigger on leading edge instead of trailing
    * @return {function} - debounced function
    **/
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },

    /**
    * Throttle function execution - ensures func is called at most once per specified time period
    *
    * @param func {function} - function to throttle
    * @param limit {number} - milliseconds between allowed calls
    * @return {function} - throttled function
    **/
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
    * Deep clone an object or array (handles nested objects)
    *
    * @param obj {various} - the object/array to deep clone
    * @return {various} - deeply cloned copy
    **/
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
    * Check if two values are deeply equal
    *
    * @param a {various} - first value
    * @param b {various} - second value
    * @return {boolean} - true if deeply equal
    **/
    deepEqual: (a, b) => {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!utils.deepEqual(a[key], b[key])) return false;
        }
        
        return true;
    },

    /**
    * Get a nested property from an object using dot notation
    *
    * @param obj {object} - object to traverse
    * @param path {string} - dot notation path (e.g., 'user.profile.name')
    * @param defaultValue {various} - default value if path not found
    * @return {various} - value at path or default
    **/
    get: (obj, path, defaultValue = undefined) => {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result == null) return defaultValue;
            result = result[key];
        }
        
        return result !== undefined ? result : defaultValue;
    },

    /**
    * Set a nested property in an object using dot notation
    *
    * @param obj {object} - object to modify
    * @param path {string} - dot notation path
    * @param value {various} - value to set
    * @return {object} - modified object
    **/
    set: (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        return obj;
    },

    /**
    * Flatten a nested array
    *
    * @param arr {array} - array to flatten
    * @param depth {number} - depth to flatten (default: Infinity)
    * @return {array} - flattened array
    **/
    flatten: (arr, depth = Infinity) => {
        if (depth < 1) return arr.slice();
        return arr.reduce((acc, val) => 
            acc.concat(Array.isArray(val) ? utils.flatten(val, depth - 1) : val), 
        []);
    },

    /**
    * Remove duplicate values from an array
    *
    * @param arr {array} - array to deduplicate
    * @return {array} - array with unique values
    **/
    unique: (arr) => {
        return [...new Set(arr)];
    },

    /**
    * Group array items by a key or function
    *
    * @param arr {array} - array to group
    * @param key {string|function} - property name or function to group by
    * @return {object} - grouped object
    **/
    groupBy: (arr, key) => {
        return arr.reduce((result, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            (result[group] = result[group] || []).push(item);
            return result;
        }, {});
    },

    /**
    * Pick specified properties from an object
    *
    * @param obj {object} - source object
    * @param keys {array} - array of keys to pick
    * @return {object} - new object with picked properties
    **/
    pick: (obj, keys) => {
        return keys.reduce((result, key) => {
            if (key in obj) result[key] = obj[key];
            return result;
        }, {});
    },

    /**
    * Omit specified properties from an object
    *
    * @param obj {object} - source object
    * @param keys {array} - array of keys to omit
    * @return {object} - new object without omitted properties
    **/
    omit: (obj, keys) => {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    },

    /**
    * Capitalize first letter of a string
    *
    * @param str {string} - string to capitalize
    * @return {string} - capitalized string
    **/
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
    * Convert string to camelCase
    *
    * @param str {string} - string to convert
    * @return {string} - camelCase string
    **/
    camelCase: (str) => {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    },

    /**
    * Truncate string to specified length
    *
    * @param str {string} - string to truncate
    * @param length {number} - max length
    * @param ending {string} - ending to append (default: '...')
    * @return {string} - truncated string
    **/
    truncate: (str, length, ending = '...') => {
        if (str.length <= length) return str;
        return str.substring(0, length - ending.length) + ending;
    },

    /**
    * Wait for specified milliseconds (async/await friendly)
    *
    * @param ms {number} - milliseconds to wait
    * @return {Promise} - promise that resolves after delay
    **/
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
    * Retry a function multiple times with delay
    *
    * @param fn {function} - async function to retry
    * @param retries {number} - number of retry attempts
    * @param delay {number} - delay between retries in ms
    * @return {Promise} - resolves with result or rejects after all retries
    **/
    retry: async (fn, retries = 3, delay = 1000) => {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) throw error;
            await utils.sleep(delay);
            return utils.retry(fn, retries - 1, delay);
        }
    }
};

export default utils;