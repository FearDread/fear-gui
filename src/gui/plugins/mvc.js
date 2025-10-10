// mvc.js - Model-View-Controller framework
import { utils } from '../core/utils';
/**
 * Model factory - Observable state management
 */
export const Model = function(data = {}) {
  const model = this;
  
  this._data = { ...data };
  this._listeners = new Map();
  this._computed = new Map();
  this._validators = new Map();

  /**
   * Get a property value
   */
  this.get = function(key) {
    if (model._computed.has(key)) {
      return model._computed.get(key).call(model);
    }
    return model._data[key];
  };

  /**
   * Set a property value with validation and change notification
   */
  this.set = function(key, value) {
    // Validate if validator exists
    if (model._validators.has(key)) {
      const validator = model._validators.get(key);
      const result = validator(value, model._data[key]);
      if (result !== true) {
        return Promise.reject(new Error(`Validation failed for ${key}: ${result}`));
      }
    }

    const oldValue = model._data[key];
    if (oldValue === value) return Promise.resolve(model);

    model._data[key] = value;
    model._notify(key, value, oldValue);
    model._notify('*', { key, value, oldValue });
    
    return Promise.resolve(model);
  };

  /**
   * Batch update multiple properties
   */
  this.update = function(data) {
    const keys = Object.keys(data);
    const tasks = keys.map(key => () => model.set(key, data[key]));
    return utils.run.series(tasks).then(() => model);
  };

  /**
   * Get all model data
   */
  this.toJSON = function() {
    return { ...model._data };
  };

  /**
   * Subscribe to property changes
   */
  this.on = function(key, callback) {
    if (!model._listeners.has(key)) {
      model._listeners.set(key, []);
    }
    model._listeners.get(key).push(callback);
    return () => model.off(key, callback);
  };

  /**
   * Unsubscribe from property changes
   */
  this.off = function(key, callback) {
    if (!model._listeners.has(key)) return;
    const listeners = model._listeners.get(key);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };

  /**
   * Define a computed property
   */
  this.computed = function(key, fn) {
    model._computed.set(key, fn);
    return model;
  };

  /**
   * Add a validator for a property
   */
  this.validate = function(key, validator) {
    model._validators.set(key, validator);
    return model;
  };

  /**
   * Notify listeners of changes
   */
  this._notify = function(key, value, oldValue) {
    if (!model._listeners.has(key)) return;
    model._listeners.get(key).forEach(callback => {
      callback(value, oldValue);
    });
  };

  /**
   * Reset model to initial state
   */
  this.reset = function(data = {}) {
    model._data = { ...data };
    model._notify('*', { reset: true });
    return model;
  };

  /**
   * Fetch data from remote source
   */
  this.fetch = function(url, options = {}) {
    if (!model.gui) {
      return Promise.reject(new Error('gui not available for fetch'));
    }

    return model.gui.fetch(url, options)
      .then(response => {
        if (options.parse && typeof model.parse === 'function') {
          return model.parse(response.data);
        }
        return response.data;
      })
      .then(data => {
        return model.update(data);
      });
  };

  /**
   * Save model data to remote source
   */
  this.save = function(url, options = {}) {
    if (!model.gui) {
      return Promise.reject(new Error('gui not available for save'));
    }

    const data = model.toJSON();
    const settings = {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      ...options
    };

    return model.gui.fetch(url, settings)
      .then(response => response.data);
  };

  return this;
};

/**
 * View factory - Template rendering and DOM manipulation
 */
export const View = function(gui, options = {}) {
  const view = this;
  
  this.gui = gui;
  this.options = options;
  this.el = options.el ? gui.$(options.el) : null;
  this.template = options.template || null;
  this.events = options.events || {};
  this._boundEvents = [];

  /**
   * Render the view
   */
  this.render = function(data = {}) {
    if (!view.el) {
      return Promise.reject(new Error('View element not defined'));
    }

    return Promise.resolve()
      .then(() => {
        if (typeof view.template === 'function') {
          return view.template(data);
        } else if (typeof view.template === 'string') {
          return view._interpolate(view.template, data);
        }
        return '';
      })
      .then(html => {
        view.el.html(html);
        view.delegateEvents();
        return view.afterRender(data);
      })
      .then(() => view);
  };

  /**
   * Hook called after rendering
   */
  this.afterRender = function(data) {
    return Promise.resolve();
  };

  /**
   * Simple template interpolation
   */
  this._interpolate = function(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : '';
    });
  };

  /**
   * Delegate DOM events
   */
  this.delegateEvents = function() {
    view.undelegateEvents();

    Object.keys(view.events).forEach(key => {
      const [event, selector] = key.split(/\s+/);
      const handler = view.events[key];
      const method = typeof handler === 'string' ? view[handler] : handler;

      if (!method) {
        view.gui.warn(`Event handler ${handler} not found`);
        return;
      }

      const boundHandler = method.bind(view);
      view._boundEvents.push({ event, selector, handler: boundHandler });

      if (selector) {
        view.el.on(event, selector, boundHandler);
      } else {
        view.el.on(event, boundHandler);
      }
    });

    return view;
  };

  /**
   * Remove delegated events
   */
  this.undelegateEvents = function() {
    view._boundEvents.forEach(({ event, selector, handler }) => {
      if (selector) {
        view.el.off(event, selector, handler);
      } else {
        view.el.off(event, handler);
      }
    });
    view._boundEvents = [];
    return view;
  };

  /**
   * Update a specific part of the view
   */
  this.update = function(selector, content) {
    if (!view.el) {
      return Promise.reject(new Error('View element not defined'));
    }

    const target = selector ? view.el.find(selector) : view.el;
    target.html(content);
    
    return Promise.resolve(view);
  };

  /**
   * Show the view
   */
  this.show = function(animate = false) {
    if (!view.el) return Promise.resolve(view);

    if (animate) {
      return view.el.animateAsync({ opacity: 1 }, 300)
        .then(() => {
          view.el.show();
          return view;
        });
    }

    view.el.show();
    return Promise.resolve(view);
  };

  /**
   * Hide the view
   */
  this.hide = function(animate = false) {
    if (!view.el) return Promise.resolve(view);

    if (animate) {
      return view.el.animateAsync({ opacity: 0 }, 300)
        .then(() => {
          view.el.hide();
          return view;
        });
    }

    view.el.hide();
    return Promise.resolve(view);
  };

  /**
   * Destroy the view
   */
  this.destroy = function() {
    view.undelegateEvents();
    if (view.el) {
      view.el.empty();
    }
    return Promise.resolve();
  };

  // Auto-delegate events if element exists
  if (this.el && Object.keys(this.events).length > 0) {
    this.delegateEvents();
  }

  return this;
};

/**
 * Controller factory - Coordinates Model and View
 */
export const Controller = function(gui, options = {}) {
  const controller = this;
  
  this.gui = gui;
  this.options = options;
  this.model = options.model || null;
  this.view = options.view || null;
  this.routes = options.routes || {};
  this._bindings = [];

  /**
   * Initialize the controller
   */
  this.initialize = function() {
    return Promise.resolve()
      .then(() => {
        if (controller.model && controller.view) {
          return controller.bindModelToView();
        }
      })
      .then(() => {
        if (typeof controller.onInit === 'function') {
          return controller.onInit();
        }
      })
      .then(() => controller);
  };

  /**
   * Bind model changes to view updates
   */
  this.bindModelToView = function() {
    if (!controller.model || !controller.view) {
      return Promise.reject(new Error('Model and View required for binding'));
    }

    // Listen to all model changes
    const unsubscribe = controller.model.on('*', (change) => {
      if (change.reset) {
        return controller.view.render(controller.model.toJSON());
      }
      
      if (typeof controller.onModelChange === 'function') {
        controller.onModelChange(change);
      } else {
        // Default: re-render view
        controller.view.render(controller.model.toJSON());
      }
    });

    controller._bindings.push(unsubscribe);
    return Promise.resolve(controller);
  };

  /**
   * Handle route navigation
   */
  this.route = function(path, ...args) {
    const handler = controller.routes[path];
    
    if (!handler) {
      return Promise.reject(new Error(`No route handler for: ${path}`));
    }

    const method = typeof handler === 'string' ? controller[handler] : handler;
    
    if (!method) {
      return Promise.reject(new Error(`Route handler ${handler} not found`));
    }

    return Promise.resolve(method.call(controller, ...args));
  };

  /**
   * Update model with form data
   */
  this.updateFromForm = function(formSelector) {
    if (!controller.model) {
      return Promise.reject(new Error('Model not available'));
    }

    const form = controller.gui.$(formSelector);
    if (!form.length) {
      return Promise.reject(new Error(`Form not found: ${formSelector}`));
    }

    const formData = {};
    form.serializeArray().forEach(({ name, value }) => {
      formData[name] = value;
    });

    return controller.model.update(formData);
  };

  /**
   * Render view with current model data
   */
  this.render = function() {
    if (!controller.view) {
      return Promise.reject(new Error('View not available'));
    }

    const data = controller.model ? controller.model.toJSON() : {};
    return controller.view.render(data);
  };

  /**
   * Clean up controller
   */
  this.destroy = function() {
    // Unsubscribe from all bindings
    controller._bindings.forEach(unsubscribe => unsubscribe());
    controller._bindings = [];

    // Destroy view
    if (controller.view && typeof controller.view.destroy === 'function') {
      return controller.view.destroy().then(() => controller);
    }

    return Promise.resolve(controller);
  };

  return this;
};

export const createModel = (data) => new Model(data);
export const createView = (gui, options) => new View(gui, options);
export const createController = (gui, options) => new Controller(gui, options);

/**
 * MVC Plugin for GUI
 */
export const MVCPlugin = function(fear, options) {
  const plugin = {};

  /**
   * Load hook - extend gui with MVC factories
   */
  plugin.load = function(gui) {
    // Add MVC factories to gui
    gui.Model = (data) => {
      const model = new Model(data);
      model.gui = gui;
      return model;
    };

    gui.View = (opts) => new View(gui, opts);

    gui.Controller = (opts) => new Controller(gui, opts);

    // Convenience method to create complete MVC setup
    gui.createMVC = (config = {}) => {
      const model = config.modelData ? gui.Model(config.modelData) : null;
      const view = config.viewOptions ? gui.View(config.viewOptions) : null;
      
      const controller = gui.Controller({
        model,
        view,
        routes: config.routes || {},
        ...config.controllerOptions
      });

      return controller.initialize().then(() => ({
        model,
        view,
        controller
      }));
    };

    return Promise.resolve();
  };

  return plugin;
};

FEAR.use(MVCPlugin);

export default { 
    Model, 
    View, 
    Controller, 
    createModel, 
    createView, 
    createController, 
    MVCPlugin 
};