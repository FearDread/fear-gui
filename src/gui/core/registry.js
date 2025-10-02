import Utils from "./utils";
import Broker from "./broker";

// Module Registry
export const Registry = (() => {

  function Registry(options = {}) {
    const _this = this;
    this.modules = new Map();
    this.globalOptions = {} || options;

    Broker.install(this);

    return {
      get: name => this.modules.get(name),
      has: name => this.modules.has(name),
      list: () => Array.from(this.modules.keys()),
      clear: () => modules.forEach((_, name) => _this.unregister(name)),
      setGlobal: options => this.globalOptions = options,
      getGlobal: () => this.globalOptions
    }
  }

  Registry.prototype.register = function (name, instance) {
    this.modules.set(name, instance);
    this._broker.add(`module:${name}`, name, instance)

    this.emit('module:registered', { name, instance })
      .then((reply) => {
        Utils.log(`Module registered: ${name}`, 'log', 'Registry');
      })
      .catch((err) => {
        Utils.log('Error registering broker registry event .. ', err);
      });
  }

  Registry.prototype.unregister = function (name) {
    if (this.modules.has(name)) {

      const module = this.modules.get(name);
      if (module.destroy) module.destroy();

      this.modules.delete(name);

      Utils.log(`Module unregistered: ${name}`, 'log', 'Registry');
      this.emit('module:unregistered', { name });
    }
  }

  return Registry;

})();

export default Registry;