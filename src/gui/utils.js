// Core Utility System
const Utils = (() => {
    let options = {};

    const log = (message, type = 'log', module = 'Core') => {
        if (options.debug && console && console[type]) {
            console[type](`[${FRAMEWORK_NAME}:${module}] ${message}`);
        }
    };

    const isFunction = fn => typeof fn === 'function';
    const isString = str => typeof str === 'string';
    const isObject = obj => obj !== null && typeof obj === 'object';
    const isArray = arr => Array.isArray(arr);
    const isEmpty = val => val == null || val === '' || (isArray(val) && val.length === 0);

    const debounce = (func, wait, immediate) => {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    };

    const extend = (...args) => $.extend(true, {}, ...args);

    const ready = callback => {
        if (document.readyState === 'loading') {
            $(document).ready(callback);
        } else {
            callback();
        }
    };

    const createPromises = (url, routeName) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading route: ${routeName}`));
          }, this.options.loading.timeout);

          $.ajax({
            url,
            method: 'GET',
            cache: this.options.enableCache,
            timeout: this.options.loading.timeout
          })
            .done((data) => {
              clearTimeout(timeout);

              // Sanitize HTML if enabled
              if (this.options.security.sanitizeHTML && typeof data === 'string') {
                data = Utils.sanitizeHTML(data);
              }

              resolve(data);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
              clearTimeout(timeout);
              const error = new Error(`${textStatus}: ${errorThrown}`);
              error.status = jqXHR.status;
              error.statusText = jqXHR.statusText;
              reject(error);
            });
        });
      }

    const setOptions = opts => options = opts;

    const generateId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const parseHTML = html => $($.parseHTML(html));



    return {
        log,

        isFunction,
        isString,
        isObject,
        isArray,
        isEmpty,

        debounce,
        throttle,
        extend,
        ready,
        setOptions,
        generateId,
        parseHTML,

        motionless: () => {
            return window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        sanitize: (html) => {
            // Basic HTML sanitization - in production, use a proper sanitizer like DOMPurify
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        },
        isValidURL: function (string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        },
    };
})();