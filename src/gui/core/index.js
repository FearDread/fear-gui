// example-usage.js - How to use the refactored FEAR GUI framework

import { utils } from './utils';
import { createRegistry } from './registry';
import { createBroker } from './broker';
import { createGUI } from './gui';
import { Metrics } from "../modules/metrics";

  // $.GUI - Constructor function (creates new instances)
  $.FEAR = function(options) {
    const instance = createGUI();
    if (options) instance.configure(options);
    return instance;
  };

  // Expose utilities on constructor
  $.FEAR.utils = utils;
  $.FEAR.createBroker = createBroker;
  $.FEAR.createRegistry = createRegistry;
  $.FEAR.Metrics = Metrics;
  $.FEAR.version = '1.0.2';
  
  // $.gui - Singleton instance (auto-initialized)
  $.fear = createGUI();
  
  // Also expose as window.GUI for non-jQuery access
  window.FEAR = $.FEAR;
  window.fear = $.fear;

  /*
// ============================================
// 1. Initialize the GUI
// ============================================
const gui = createGUI(jQuery);

// Configure the GUI
gui.configure({
  logLevel: 1,
  name: 'MyApp',
  animations: true
});

// ============================================
// 2. Create a simple module
// ============================================
gui.create('myModule', (sandbox) => {
  return {
    load: (options) => {
      sandbox.log('Module loading with options:', options);
      
      // Use sandbox utilities
      const $button = sandbox.$('#myButton');
      
      // Add event listeners via broker
      sandbox.add('button:click', (data) => {
        sandbox.log('Button clicked with data:', data);
      });
      
      // Set up DOM interaction
      $button.on('click', () => {
        sandbox.emit('button:click', { timestamp: Date.now() });
      });
      
      return Promise.resolve();
    },
    
    unload: () => {
      sandbox.log('Module unloading');
      return Promise.resolve();
    }
  };
}, { defaultColor: 'blue' });

// ============================================
// 3. Create a module with async loading
// ============================================
gui.create('asyncModule', (sandbox) => {
  return {
    load: async (options) => {
      // Load external resources
      await sandbox.loadResources([
        'https://example.com/styles.css',
        { type: 'script', url: 'https://example.com/lib.js' }
      ]);
      
      // Fetch data
      const response = await sandbox.fetch('/api/data');
      sandbox.log('Data loaded:', response.data);
      
      // Use memoized function
      const expensiveOperation = sandbox.memoize((x) => {
        return x * x * x;
      });
      
      const result1 = expensiveOperation(5); // Calculated
      const result2 = expensiveOperation(5); // Cached
      
      return Promise.resolve();
    },
    
    unload: () => {
      sandbox.log('Async module unloading');
    }
  };
});

// ============================================
// 4. Create a plugin
// ============================================
const myPlugin = (gui, options) => {
  gui.debug.log('Plugin initialized with options:', options);
  
  return {
    load: (sandbox, pluginOptions) => {
      // Add custom methods to sandbox
      sandbox.customMethod = () => {
        sandbox.log('Custom plugin method called');
      };
    },
    
    unload: (sandbox) => {
      delete sandbox.customMethod;
    }
  };
};

gui.use(myPlugin, { setting: 'value' });

// ============================================
// 5. Use the event broker
// ============================================

// Subscribe to events
gui.broker.add('app:ready', (data) => {
  console.log('App is ready!', data);
});

// Create namespaced broker
const userEvents = gui.broker.namespace('user');

userEvents.add('login', (userData) => {
  console.log('User logged in:', userData);
});

userEvents.add('logout', () => {
  console.log('User logged out');
});

// Emit events
gui.broker.emit('app:ready', { version: '1.0.0' });
userEvents.emit('login', { id: 123, name: 'John' });

// Wait for an event with timeout
gui.broker.waitFor('data:loaded', 5000)
  .then(({ data, channel }) => {
    console.log('Data loaded:', data);
  })
  .catch((err) => {
    console.error('Timeout:', err.message);
  });

// ============================================
// 6. Use the registry for module management
// ============================================
const registry = createRegistry({ appName: 'MyApp' });

// Register modules
registry.register('userService', {
  getUser: (id) => fetch(`/api/users/${id}`),
  createUser: (data) => fetch('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  destroy: () => console.log('User service destroyed')
});

// Listen to registry events
registry.on('module:registered', ({ name, instance }) => {
  console.log(`Module registered: ${name}`);
});

// Get a registered module
const userService = registry.get('userService');
await userService.getUser(123);

// List all modules
const allModules = registry.list();
console.log('Registered modules:', allModules);

// ============================================
// 7. Start modules
// ============================================

// Start a single module
await gui.start('myModule', { color: 'red' });

// Start multiple modules
await gui.start(['myModule', 'asyncModule']);

// Start all registered modules
await gui.start();

// ============================================
// 8. Stop modules
// ============================================

// Stop a specific module
await gui.stop('myModule');

// Stop all modules
await gui.stop();

// ============================================
// 9. Advanced: Piping events between brokers
// ============================================
const broker1 = gui.Broker();
const broker2 = gui.Broker();

// Pipe events from broker1 to broker2
broker1.pipe('source:event', 'target:event', broker2);

broker2.add('target:event', (data) => {
  console.log('Received piped event:', data);
});

broker1.emit('source:event', { message: 'Hello' });

// ============================================
// 10. Utility functions
// ============================================

// Use Utils for common operations
const uniqueId = Utils.unique(12);
const slug = Utils.slugify('Hello World 123');
const randomNum = Utils.rand(1, 100);
const clonedObj = Utils.clone({ a: 1, b: 2 });

// Run async tasks
const tasks = [
  () => Promise.resolve(1),
  () => Promise.resolve(2),
  () => Promise.resolve(3)
];

// Run in series
const seriesResults = await Utils.run.series(tasks);
console.log('Series:', seriesResults); // [1, 2, 3]

// Run in parallel
const parallelResults = await Utils.run.parallel(tasks);
console.log('Parallel:', parallelResults); // [1, 2, 3]

// Run first successful
const firstResult = await Utils.run.first(tasks);
console.log('First:', firstResult); // 1

// ============================================
// 11. Complete example with all features
// ============================================
gui.create('completeExample', (sandbox) => {
  let intervalController;
  
  return {
    load: async (options) => {
      // Wait for DOM ready
      await sandbox.ready();
      
      // Query DOM elements
      const $container = sandbox.$('#app-container');
      const $button = $container.query('.action-button');
      
      // Add event broker listeners
      sandbox.add('data:update', (newData) => {
        sandbox.log('Data updated:', newData);
        $container.html(`<p>Data: ${newData.value}</p>`);
      });
      
      // Set up interval with promise
      intervalController = sandbox.interval(() => {
        sandbox.emit('tick', { time: Date.now() });
      }, 1000, 10); // Run 10 times
      
      // Wait for animation complete
      await $button.animateAsync({ opacity: 1 }, 300);
      
      // Set up one-time event listener
      await $button.onAsync('click');
      sandbox.log('Button was clicked!');
      
      // Fetch data with timeout
      await sandbox.timeout(1000);
      const response = await sandbox.fetch('/api/init');
      
      return Promise.resolve();
    },
    
    unload: () => {
      // Clean up
      if (intervalController) {
        intervalController.stop();
      }
      return Promise.resolve();
    }
  };
});

// Start the complete example
await gui.start('completeExample');
*/