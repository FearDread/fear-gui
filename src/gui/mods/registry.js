
  // Module Registry
  const ModuleRegistry = (() => {
    const modules = new Map();
    let globalOptions = {};

    const register = (name, instance) => {
      modules.set(name, instance);
      CoreUtils.log(`Module registered: ${name}`, 'log', 'Registry');
      EventSystem.emit('module:registered', { name, instance });
    };

    const unregister = name => {
      if (modules.has(name)) {
        const module = modules.get(name);
        if (module.destroy) module.destroy();
        modules.delete(name);
        CoreUtils.log(`Module unregistered: ${name}`, 'log', 'Registry');
        EventSystem.emit('module:unregistered', { name });
      }
    };

    const get = name => modules.get(name);
    const has = name => modules.has(name);
    const list = () => Array.from(modules.keys());
    const clear = () => {
      modules.forEach((_, name) => unregister(name));
    };

    const setGlobalOptions = options => globalOptions = options;
    const getGlobalOptions = () => globalOptions;

    return {
      register, unregister, get, has, list, clear,
      setGlobalOptions, getGlobalOptions
    };
  })();