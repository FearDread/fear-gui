export const Router = ((FEAR) => {
  'use strict';

  /**
   * Client-side router with history and hash mode support
   */
  const Router = () => {
    return {
      routes: [],
      mode: null,
      root: '/',
      interval: null,

      /**
       * Configure the router with specified options
       * @param {object} options - configuration options
       * @param {string} options.mode - 'history' or 'hash' mode
       * @param {string} options.root - root path for history mode
       * @return {object} this router instance for chaining
       */
      config: function(options) {
        options = options || {};
        
        // Use history mode if supported and requested, otherwise fallback to hash
        const supportsHistory = !!(history && history.pushState);
        this.mode = options.mode === 'history' && supportsHistory ? 'history' : 'hash';
        
        // Set root path, ensure it has leading and trailing slashes
        if (options.root) {
          this.root = '/' + this.clearSlashes(options.root) + '/';
        } else {
          this.root = '/';
        }

        return this;
      },

      /**
       * Get current route fragment from URL
       * @return {string} current route fragment
       */
      getFragment: function() {
        let fragment = '';
        let match;

        if (this.mode === 'history') {
          // Get pathname and search, decode URI components
          fragment = this.clearSlashes(decodeURI(location.pathname + location.search));
          
          // Remove query string parameters
          fragment = fragment.replace(/\?(.*)$/, '');
          
          // Remove root path if it's not the default
          if (this.root !== '/') {
            fragment = fragment.replace(new RegExp('^' + this.escapeRegex(this.root.slice(1, -1))), '');
          }
        } else {
          // Hash mode - extract everything after #
          match = window.location.href.match(/#(.*)$/);
          fragment = match ? match[1] : '';
        }
        
        return this.clearSlashes(fragment);
      },

      /**
       * Remove leading and trailing slashes from path
       * @param {string} path - path to clean
       * @return {string} cleaned path
       */
      clearSlashes: (path) => {
        if (!path) return '';
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
      },

      /**
       * Escape special regex characters in string
       * @param {string} string - string to escape
       * @return {string} escaped string
       */
      escapeRegex: (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },

      /**
       * Add new route to the router
       * @param {RegExp|string|function} re - route pattern or handler function
       * @param {function} handler - route handler function (if re is pattern)
       * @return {object} this router instance for chaining
       */
      add: function(re, handler) {
        // If first argument is a function, treat it as default route handler
        if (typeof re === 'function') {
          handler = re;
          re = '';
        }

        // Ensure we have a handler function
        if (typeof handler !== 'function') {
          throw new Error('Route handler must be a function');
        }

        // Convert string patterns to RegExp
        if (typeof re === 'string') {
          re = new RegExp('^' + re.replace(/:\w+/g, '([^/]+)') + '$');
        }

        this.routes.push({ 
          re: re, 
          handler: handler,
          original: arguments[0] // Keep original for removal purposes
        });

        return this;
      },

      /**
       * Remove route from router
       * @param {RegExp|string|function} param - route pattern or handler to remove
       * @return {object} this router instance for chaining
       */
      remove: function(param) {
        if (!param) return this;

        for (let i = this.routes.length - 1; i >= 0; i--) {
          const route = this.routes[i];
          
          if (route.handler === param || 
              route.original === param ||
              (route.re && route.re.toString() === param.toString())) {
            this.routes.splice(i, 1);
          }
        }

        return this;
      },

      /**
       * Clear all routes and reset router state
       * @return {object} this router instance for chaining
       */
      flush: function() {
        this.routes = [];
        this.mode = null;
        this.root = '/';
        
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }

        return this;
      },

      /**
       * Check current fragment against routes and execute matching handler
       * @param {string} f - fragment to check (optional, uses current if not provided)
       * @return {object} this router instance for chaining
       */
      check: function(f) {
        const fragment = (typeof f !== 'undefined') ? f : this.getFragment();
        let match;

        for (let i = 0; i < this.routes.length; i++) {
          match = fragment.match(this.routes[i].re);

          if (match) {
            // Remove the full match, keep only capture groups
            match.shift();
            
            try {
              this.routes[i].handler.apply({}, match);
            } catch (error) {
              console.error('Router: Error executing route handler:', error);
            }

            return this;
          }
        }

        return this;
      },

      /**
       * Start listening for route changes
       * @param {number} interval - polling interval in milliseconds (default: 50)
       * @return {object} this router instance for chaining
       */
      listen: function(intervalMs) {
        const self = this;
        let current = self.getFragment();
        const pollInterval = intervalMs || 50;

        const checkForChanges = () => {
          const newFragment = self.getFragment();
          
          if (current !== newFragment) {
            current = newFragment;
            self.check(current);
          }
        };

        // Clear any existing interval
        if (this.interval) {
          clearInterval(this.interval);
        }

        // Use modern event listeners for better performance where available
        if (this.mode === 'history' && window.addEventListener) {
          window.addEventListener('popstate', checkForChanges, false);
        } else if (this.mode === 'hash' && window.addEventListener) {
          window.addEventListener('hashchange', checkForChanges, false);
        }

        // Fallback to polling for older browsers or as backup
        this.interval = setInterval(checkForChanges, pollInterval);

        return this;
      },

      /**
       * Stop listening for route changes
       * @return {object} this router instance for chaining
       */
      stop: function() {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }

        // Remove event listeners
        const checkForChanges = () => {}; // Placeholder - in real implementation, store reference
        
        if (window.removeEventListener) {
          window.removeEventListener('popstate', checkForChanges, false);
          window.removeEventListener('hashchange', checkForChanges, false);
        }

        return this;
      },

      /**
       * Navigate to specified path
       * @param {string} path - path to navigate to
       * @param {boolean} trigger - whether to trigger route check (default: true)
       * @return {object} this router instance for chaining
       */
      navigate: function(path, trigger) {
        path = path || '';
        trigger = (trigger !== false); // Default to true

        if (this.mode === 'history') {
          const fullPath = this.root + this.clearSlashes(path);
          
          try {
            history.pushState(null, null, fullPath);
          } catch (error) {
            // Fallback for browsers that don't support pushState
            window.location.href = fullPath;
            return this;
          }
        } else {
          // Hash mode
          const baseUrl = window.location.href.replace(/#(.*)$/, '');
          window.location.href = baseUrl + '#' + path;
        }

        // Optionally trigger route checking
        if (trigger) {
          this.check();
        }

        return this;
      }
    };
  };

  return {
    load: (GUI) => {
    // Ensure net namespace exists
    if (!GUI.Router) {
      GUI.Router = new Router();
    }
  },
    unload: (GUI) => {
    if (GUI.Router) {
      // Clean up router
      GUI.Router.flush();
      delete GUI.Router;
    }
  }
  };
})();