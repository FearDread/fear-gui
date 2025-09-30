# FEAR Framework - Complete Documentation

A lightweight, modular JavaScript framework for building scalable web applications with event-driven architecture and promise-based asynchronous operations.

## Overview

FEAR (Frontend Event Application Runtime) is a jQuery-based framework that provides a robust module system, event broker pattern, and sandboxed execution environment for building maintainable web applications. It emphasizes separation of concerns, async/await patterns, and clean API design.

## Core Components

### 1. GUI (Main Framework)

The central orchestrator that manages modules, plugins, and application lifecycle.

**Key Features:**
- Module registration and lifecycle management
- Plugin system for extending functionality
- Promise-based async operations
- Debug logging with configurable verbosity
- Configuration management

**Usage:**

```javascript
import { FEAR } from './gui.js';

const app = new FEAR();

// Configure the application
app.configure({
  logLevel: 1,
  name: 'MyApp',
  mode: 'single'
});

// Create a module
app.create('myModule', (sandbox) => {
  return {
    load(options) {
      sandbox.log('Module loaded');
      // Module initialization logic
    },
    
    unload() {
      sandbox.log('Module unloaded');
      // Cleanup logic
    }
  };
});

// Start the module
app.start('myModule').then(() => {
  console.log('Module started successfully');
});
```

### 2. Broker (Event System)

A powerful pub/sub event broker supporting cascading events, promises, and flexible subscription management.

**Key Features:**
- Channel-based event system
- `fire()` - first successful handler wins
- `emit()` - all handlers execute in series
- Cascading events (hierarchical channels)
- Promise-based event handling
- `once()` - single-execution subscriptions
- `waitFor()` - promise-based event waiting
- Event piping between channels
- Namespaced brokers

**Usage:**

```javascript
const broker = new Broker();

// Subscribe to an event
broker.add('user/login', (data, origin) => {
  console.log('User logged in:', data);
  return processLogin(data); // Can return a promise
});

// Emit event (all handlers execute)
broker.emit('user/login', { username: 'john' })
  .then(results => console.log('All handlers completed'));

// Fire event (first successful handler)
broker.fire('user/authenticate', credentials)
  .then(result => console.log('Authentication result:', result));

// Wait for an event with timeout
broker.waitFor('data/loaded', 5000)
  .then(({ data, origin }) => console.log('Data loaded'))
  .catch(err => console.error('Timeout waiting for data'));

// Cascading events
broker.cascade = true;
broker.emit('app/user/profile/update', data);
// Also triggers: app/user/profile, app/user, app
```

### 3. SandBox (Module API)

Provides an isolated execution environment for modules with utilities, DOM manipulation, and async helpers.

**Available Methods:**

```javascript
sandbox.query(selector)        // Enhanced jQuery selection
sandbox.$(selector)            // Shorthand for query
sandbox.fetch(url, settings)   // Promise-based AJAX
sandbox.timeout(ms, fn)        // Promise-based setTimeout
sandbox.interval(fn, ms, max)  // Cancellable interval
sandbox.memoize(fn, cache)     // Cache function results
sandbox.loadResources([urls])  // Load CSS/JS/JSON files
sandbox.ready()                // Wait for DOM ready
sandbox.loaded()               // Wait for window load
sandbox.hitch(fn, ...args)     // Partial application
sandbox.log()                  // Logging
sandbox.warn()                 // Warnings
```

### 4. Utils (Utilities)

A collection of helper functions for type checking, array/object manipulation, and common operations.

**Key Methods:**

```javascript
Utils.isObj(obj)              // Check if plain object
Utils.isArr(arr)              // Check if array
Utils.isFunc(fn)              // Check if function
Utils.isStr(str)              // Check if string
Utils.merge(obj1, obj2)       // Deep merge objects
Utils.clone(data)             // Clone array/object
Utils.unique(length)          // Generate unique ID
Utils.slugify(text)           // Convert to URL slug
Utils.rand(min, max)          // Random number
Utils.hasArgs(fn, count)      // Check function arity
Utils.isMobile(agent)         // Detect mobile device
Utils.isRetina()              // Detect retina display
```

---

## Packaged Plugins

### Cellar (Storage Plugin)

Promise-based interface for localStorage and sessionStorage with nested key support, automatic JSON serialization, and fallback handling.

**Features:**
- Unified API for localStorage and sessionStorage
- Promise-based operations
- Nested key paths (e.g., `'user', 'profile', 'name'`)
- Automatic JSON serialization/deserialization
- Multiple key operations
- Storage size tracking
- Browser compatibility checks

**Usage:**

```javascript
// Load the plugin
app.use(Cellar);

await app.boot();

// Store data
await app.cellar.set('username', 'john');
await app.cellar.set('user', { name: 'John', age: 30 });

// Nested keys
await app.cellar.set('user', 'profile', 'email', 'john@example.com');

// Retrieve data
const username = await app.cellar.get('username');
const user = await app.cellar.get('user');
const email = await app.cellar.get('user', 'profile', 'email');

// Multiple keys
const data = await app.cellar.get(['username', 'email']);

// Check existence
const exists = await app.cellar.isSet('username');
const isEmpty = await app.cellar.isEmpty('cart');

// Remove data
await app.cellar.remove('username');
await app.cellar.remove(['user', 'cart']);
await app.cellar.removeAll(); // Clear all storage

// Storage info
const size = await app.cellar.size();
// { keys: 10, bytes: 5432, kb: 5.3 }

const keys = await app.cellar.keys();
// ['username', 'user', 'cart']

// Switch storage type
app.cellar.type('sessionStorage');
await app.cellar.set('temp', 'value');

// Direct access
await app.cellar.local().set('key', 'value');    // localStorage
await app.cellar.session().set('key', 'value');  // sessionStorage

// Alternative shortcuts
await app.cellar.ls.set('key', 'value');
await app.cellar.ss.set('key', 'value');
```

**API Reference:**

```javascript
cellar.get(...keyPath)           // Get value(s)
cellar.set(key, value, ...nested) // Set value(s)
cellar.isSet(...keyPath)         // Check if key exists
cellar.isEmpty(...keyPath)       // Check if empty
cellar.remove(key, ...nested)    // Remove key(s)
cellar.removeAll()               // Clear all storage
cellar.keys(baseKey)             // Get all keys
cellar.size()                    // Get storage size info
cellar.type(storageType)         // Switch storage type
cellar.local()                   // Access localStorage
cellar.session()                 // Access sessionStorage
```

### Events (DOM Events Plugin)

Cross-browser DOM event management with Promise-based handlers, animation support, and viewport utilities.

**Features:**
- Cross-browser event handling
- Promise-based event operations
- `once()` - single-fire event listeners
- `waitFor()` - wait for events with timeout
- CSS transition/animation support
- Viewport dimension helpers
- Mobile device detection
- Automatic cleanup tracking

**Usage:**

```javascript
// Load the plugin
app.use(Events);

const element = document.getElementById('button');

// Add event listener
const listener = await app.on(element, 'click', (e) => {
  console.log('Button clicked', e);
});

// Remove listener
await listener.remove();
// or
await app.off(element, 'click', handler);

// One-time event
await app.once(element, 'click', (e) => {
  console.log('Fires once');
});

// Wait for event with timeout
try {
  const event = await app.waitFor(element, 'load', 5000);
  console.log('Element loaded', event);
} catch (error) {
  console.log('Timeout waiting for load event');
}

// Fire custom event
const customEvent = app.dom.Event.create('myEvent', {
  bubbles: true,
  detail: { data: 'value' }
});
await app.fire(element, customEvent);

// Animate with CSS transitions
await app.animate(element, {
  opacity: '0',
  transform: 'translateX(100px)'
}, 300, 'ease-out');

// Viewport dimensions
const width = app.dom.Event.innerWidth();
const height = app.dom.Event.innerHeight();

// Get computed styles
const color = await app.dom.Event.getComputedStyle(element, 'color');

// Mobile detection
const isMobile = app.dom.Event.isMobile();

// Remove all listeners from element
await app.dom.Event.removeAll(element);
```

**API Reference:**

```javascript
// Core methods (available on app)
app.on(elem, event, handler, options)      // Add listener
app.off(elem, event, handler)              // Remove listener
app.once(elem, event, handler)             // One-time listener
app.fire(elem, event, detail)              // Dispatch event
app.waitFor(elem, event, timeout)          // Wait for event
app.animate(elem, props, duration, easing) // Animate element

// Event object methods (app.dom.Event)
Event.create(name, options)                // Create custom event
Event.add(elem, event, handler, options)   // Add listener
Event.remove(elem, event, handler)         // Remove listener
Event.once(elem, event, handler)           // One-time listener
Event.fire(elem, event, detail)            // Dispatch event
Event.waitFor(elem, event, timeout)        // Wait for event
Event.animate(elem, props, duration, easing) // Animate
Event.removeAll(elem)                      // Remove all listeners
Event.getComputedStyle(elem, prop)         // Get computed style
Event.innerWidth()                         // Viewport width
Event.innerHeight()                        // Viewport height
Event.isMobile(agent)                      // Mobile detection
```

### Router (Client-side Router Plugin)

Single-page application router with history and hash mode support, parameterized routes, and browser navigation.

**Features:**
- History API and hash-based routing
- Parameterized routes with regex support
- Browser back/forward button support
- Programmatic navigation
- Route guards and handlers
- Fallback for older browsers

**Usage:**

```javascript
// Load the plugin
app.use(Router);

// Configure router
app.Router.config({
  mode: 'history',  // or 'hash'
  root: '/'
});

// Define routes
app.Router
  .add('/', () => {
    console.log('Home page');
  })
  .add('/users/:id', (id) => {
    console.log('User profile:', id);
  })
  .add('/posts/:postId/comments/:commentId', (postId, commentId) => {
    console.log('Post:', postId, 'Comment:', commentId);
  })
  .add(/^products\/(.*)$/, (productSlug) => {
    console.log('Product:', productSlug);
  });

// Start listening for route changes
app.Router.listen();

// Navigate programmatically
app.Router.navigate('/users/123');
app.Router.navigate('/posts/456/comments/789');

// Navigate without triggering route check
app.Router.navigate('/about', false);

// Remove route
app.Router.remove(handler);

// Stop router
app.Router.stop();

// Clear all routes
app.Router.flush();

// Get current route fragment
const currentRoute = app.Router.getFragment();
```

**API Reference:**

```javascript
Router.config(options)                // Configure router
Router.add(pattern, handler)          // Add route
Router.remove(pattern)                // Remove route
Router.navigate(path, trigger)        // Navigate to path
Router.listen(interval)               // Start listening
Router.stop()                         // Stop listening
Router.check(fragment)                // Check routes
Router.getFragment()                  // Get current route
Router.flush()                        // Clear all routes
Router.clearSlashes(path)             // Utility: clean path
```

**Configuration Options:**

```javascript
{
  mode: 'history',  // 'history' or 'hash'
  root: '/'         // Root path for history mode
}
```

---

## Example Modules

### Stargaze (Canvas Animation Module)

Interactive starfield canvas animation with mouse interaction, configurable appearance, and promise-based lifecycle.

**Features:**
- Animated starfield with particle physics
- Mouse interaction (stars connect near cursor)
- Configurable colors, density, and behavior
- Promise-based initialization and cleanup
- Responsive canvas sizing
- jQuery plugin interface

**Usage as Module:**

```javascript
app.create('stargaze', (sandbox) => {
  let stargazeInstance;
  
  return {
    async load(options) {
      const canvas = sandbox.$('#starfield')[0];
      
      stargazeInstance = sandbox.stargaze.create(canvas, {
        star: {
          color: 'rgba(255, 255, 255, 0.8)',
          width: 1
        },
        line: {
          color: 'rgba(100, 200, 255, 0.5)',
          width: 0.3
        },
        length: 150,        // Number of stars
        distance: 120,      // Connection distance
        radius: 200,        // Mouse interaction radius
        velocity: 0.15      // Star movement speed
      });
      
      await stargazeInstance.init();
    },
    
    async unload() {
      if (stargazeInstance) {
        await stargazeInstance.destroy();
      }
    }
  };
});

app.start('stargaze');
```

**Usage as jQuery Plugin:**

```javascript
// Initialize on canvas element
const stargaze = await $('#starfield').FEAR({
  star: { color: 'white', width: 1 },
  line: { color: 'cyan', width: 0.2 },
  length: 100,
  velocity: 0.1
});

// Control the animation
await stargaze.stop();
await stargaze.start();

// Update configuration
await stargaze.updateConfig({
  velocity: 0.2,
  length: 200
});

// Get current config
const config = stargaze.getConfig();

// Check if running
if (stargaze.isRunning()) {
  console.log('Animation is active');
}

// Cleanup
await stargaze.destroy();
```

**Configuration Options:**

```javascript
{
  star: {
    color: 'rgba(255, 255, 255, 0.7)',  // Star color
    width: 1                             // Star size
  },
  line: {
    color: 'rgba(255, 255, 255, 0.7)',  // Connection line color
    width: 0.2                           // Line thickness
  },
  width: window.innerWidth,              // Canvas width
  height: window.innerHeight,            // Canvas height
  velocity: 0.1,                         // Star movement speed
  length: 100,                           // Number of stars
  distance: 100,                         // Max distance for connections
  radius: 150,                           // Mouse interaction radius
  position: { x: 0, y: 0 }              // Initial mouse position
}
```

**API Reference:**

```javascript
stargaze.init()                    // Initialize animation
stargaze.start()                   // Start animation
stargaze.stop()                    // Stop animation
stargaze.destroy()                 // Cleanup and remove
stargaze.updateConfig(options)     // Update configuration
stargaze.getConfig()               // Get current config
stargaze.isRunning()               // Check animation state
stargaze.setCanvas()               // Reconfigure canvas
stargaze.setContext()              // Update context properties
stargaze.renderFrame()             // Render single frame
```

---

## Complete Integration Example

```javascript
import { FEAR } from './gui.js';
import { Cellar } from './cellar.js';
import { Events } from './events.js';
import { Router } from './router.js';

// Initialize application
const app = new FEAR();

app.configure({
  logLevel: 1,
  name: 'MyApp'
});

// Load plugins
app.use([
  { plugin: Cellar },
  { plugin: Events },
  { plugin: Router }
]);

// Create application module
app.create('app', (sandbox) => {
  return {
    async load() {
      // Initialize storage
      const savedTheme = await sandbox.cellar.get('theme') || 'light';
      document.body.className = savedTheme;
      
      // Setup event handlers
      const button = sandbox.$('#theme-toggle')[0];
      await sandbox.on(button, 'click', async () => {
        const newTheme = savedTheme === 'light' ? 'dark' : 'light';
        await sandbox.cellar.set('theme', newTheme);
        document.body.className = newTheme;
      });
      
      // Setup router
      sandbox.Router.config({ mode: 'history' });
      
      sandbox.Router
        .add('/', () => this.showHome())
        .add('/about', () => this.showAbout())
        .add('/user/:id', (id) => this.showUser(id));
      
      sandbox.Router.listen();
      
      // Event bus communication
      sandbox.add('app/ready', () => {
        sandbox.log('Application initialized');
      });
      
      sandbox.emit('app/ready');
    },
    
    async unload() {
      sandbox.Router.stop();
    },
    
    showHome() {
      sandbox.$('#content').html('<h1>Home</h1>');
    },
    
    showAbout() {
      sandbox.$('#content').html('<h1>About</h1>');
    },
    
    showUser(id) {
      sandbox.$('#content').html(`<h1>User ${id}</h1>`);
    }
  };
});

// Start the application
app.start('app').then(() => {
  console.log('Application started');
});
```

## Installation

```javascript
import { FEAR } from './gui.js';
import { Broker } from './broker.js';
import { Utils } from './utils.js';

// Or use the jQuery plugin syntax
$.FEAR({ logLevel: 1 });
```

## Requirements

- jQuery (required dependency)
- ES6+ compatible browser or build tool

## Architecture Benefits

- **Modularity**: Isolated modules with sandboxed APIs
- **Testability**: Clean separation of concerns
- **Scalability**: Event-driven architecture prevents tight coupling
- **Async-First**: Promise-based APIs throughout
- **Extensibility**: Plugin system for cross-cutting concerns
- **Type Safety**: Runtime type checking utilities
- **Storage**: Unified storage API with fallbacks
- **Routing**: SPA routing with browser history support
- **Events**: Cross-browser event handling
- **Animations**: Built-in canvas and CSS animation support