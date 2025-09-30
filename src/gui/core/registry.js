
// Module Registry
const Registry = (() => {
  const _this = this;
  
  function Registry(options = {}) {
    this.modules = new Map();
    this.globalOptions = {} || options;

    return this;
  }

  Registry.prototyp = {
    register: (name, instance) => {
      this.modules.set(name, instance);
      
      Utils.log(`Module registered: ${name}`, 'log', 'Registry');
      Events.emit('module:registered', { name, instance });
    },
    unregister: (name) => {
      if (this.modules.has(name)) {
        
        const module = this.modules.get(name);
        if (module.destroy) module.destroy();
        
        this.modules.delete(name);
        
        Utils.log(`Module unregistered: ${name}`, 'log', 'Registry');
        Events.emit('module:unregistered', { name });
      }
    },
    get: name => this.modules.get(name),
    has: name => this.modules.has(name),
    list: () => Array.from(this.modules.keys()),
    clear: () => modules.forEach((_, name) => _this.unregister(name)),
    setGlobal: options => this.globalOptions = options,
    getGlobal: () => this.globalOptions
  }


  return Registry;
})();