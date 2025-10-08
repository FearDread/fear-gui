  // Cache Manager
  class CacheManager {
    constructor(options) {
      this.cache = new Map();
      this.timestamps = new Map();
      this.maxSize = options.maxCacheSize;
      this.timeout = options.cacheTimeout;
      this.enabled = options.enableCache;
    }

    set(key, value) {
      if (!this.enabled) return;

      // Remove oldest entries if at max capacity
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
        this.timestamps.delete(oldestKey);
      }

      this.cache.set(key, value);
      this.timestamps.set(key, Date.now());
    }

    get(key) {
      if (!this.enabled || !this.cache.has(key)) return null;

      const timestamp = this.timestamps.get(key);
      if (Date.now() - timestamp > this.timeout) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        return null;
      }

      return this.cache.get(key);
    }

    has(key) {
      return this.enabled && this.cache.has(key);
    }

    clear() {
      this.cache.clear();
      this.timestamps.clear();
    }

    size() {
      return this.cache.size;
    }
  }
  

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