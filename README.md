#### `.start(moduleId, options)`
Start one or more modules.

```javascript
// Start single module
await $.FEAR.gui.start('myModule');

// Start with options
await $.FEAR.gui.start('myModule', { theme: 'dark' });

// Start multiple modules
await $.FEAR.gui.start(['module1', 'module2']);

// Start all registered modules
await $.FEAR.gui.start();
```

#### `.stop(moduleId)`
Stop one or more modules.

```javascript
// Stop single module
await $.FEAR.gui.stop('myModule');

// Stop all modules
await $.FEAR.gui.stop();
```

#### `.use(plugin, options)`
Register a plugin.

```javascript
const myPlugin = (gui, options) => {
  return {
    load: (sandbox) => { /* ... */ },
    unload: (sandbox) => { /* ... */ }
  };
};

$.FEAR.gui.use(myPlugin, { debug: true });
```

#### `.boot()`
Initialize all registered plugins.

```javascript
await $.FEAR.gui.boot();
```

### Broker API

#### `.add(channel, callback, context)`
Subscribe to an event.

```javascript
$.FEAR.gui.broker.add('user:login', (data) => {
  console.log('User:', data.username);
});
```

#### `.emit(channel, data, origin)`
Emit event to all subscribers.

```javascript
$.FEAR.gui.broker.emit('user:login', { username: 'john' });
```

#### `.fire(channel, data)`
Fire event to first subscriber only.

```javascript
$.FEAR.gui.broker.fire('data:request', { id: 123 });
```

#### `.once(channel, callback, context)`
Subscribe for one-time execution.

```javascript
$.FEAR.gui.broker.once('app:ready', () => {
  console.log('App initialized!');
});
```

#### `.waitFor(channel, timeout)`
Wait for an event with optional timeout.

```javascript
const result = await $.FEAR.gui.broker.waitFor('data:loaded', 5000);
console.log(result.data);
```

#### `.namespace(name)`
Create namespaced broker interface.

```javascript
const userEvents = $.FEAR.gui.broker.namespace('user');
userEvents.emit('login', userData);
// Emits on 'user/login' channel
```

### Sandbox API

Each module receives a sandbox with these methods:

#### Event Methods
```javascript
sandbox.add(channel, callback)
sandbox.emit(channel, data)
sandbox.fire(channel, data)
sandbox.once(channel, callback)
sandbox.waitFor(channel, timeout)
```

#### jQuery Methods
```javascript
sandbox.$(selector)              // Enhanced jQuery query
sandbox.fetch(url, options)      // Promise-based AJAX
sandbox.ready()                  // DOM ready promise
sandbox.loaded()                 // Window load promise
```

#### Utility Methods
```javascript
sandbox.timeout(ms, fn)          // Promise-based timeout
sandbox.interval(fn, ms, max)    // Cancellable interval
sandbox.memoize(fn, cache)       // Function memoization
sandbox.hitch(fn, ...args)       // Partial application
```

#### Resource Loading
```javascript
sandbox.loadCSS(url)
sandbox.loadScript(url)
sandbox.loadResources([...])
```

#### Registry Access
```javascript
sandbox.registry.get(name)
sandbox.registry.has(name)
sandbox.registry.list()
```

## 🎨 Advanced Usage

### Cascading Events

```javascript
const broker = $.FEAR.createBroker({ cascade: true });

broker.add('app/user/login', () => console.log('Specific'));
broker.add('app/user', () => console.log('User events'));
broker.add('app', () => console.log('All app events'));

broker.emit('app/user/login', data);
// Logs all three in order
```

### Creating Multiple Instances

```javascript
// Admin panel
const admin = $.FEAR({ name: 'AdminPanel' });
admin.create('dashboard', ...);

// Public site
const site = $.FEAR({ name: 'PublicSite' });
site.create('homepage', ...);

// Each has isolated modules and events
```

### Dynamic Module Loading

```javascript
// Load module conditionally
if (userIsAdmin) {
  await $.FEAR.gui.start('adminModule');
} else {
  await $.FEAR.gui.start('guestModule');
}
```

### Error Handling

```javascript
$.FEAR.gui.start('myModule')
  .catch(err => {
    console.error('Module failed:', err.message);
    // Fallback or retry logic
  });
```

### Module Communication

```javascript
// Module A - Publisher
$.FEAR.gui.create('moduleA', (sandbox) => {
  return {
    load() {
      sandbox.add('data:ready', (data) => {
        console.log('Received:', data.value);
      });
    }
  };
});
```

### Plugin Example

```javascript
const validationPlugin = (gui, options) => {
  console.log('Validation plugin initialized');
  
  return {
    // Called before each module loads
    load(sandbox, pluginOptions) {
      // Add validation method to sandbox
      sandbox.validate = (data, rules) => {
        // Validation logic
        return { valid: true, errors: [] };
      };
      
      console.log(`Plugin loaded for module: ${sandbox.module}`);
    },
    
    // Called after each module unloads
    unload(sandbox) {
      delete sandbox.validate;
      console.log(`Plugin unloaded for module: ${sandbox.module}`);
    }
  };
};

// Register plugin
$.FEAR.gui.use(validationPlugin, { strict: true });

// Now all modules get sandbox.validate() method
$.FEAR.gui.create('myModule', (sandbox) => {
  return {
    load() {
      const result = sandbox.validate({ name: 'John' }, { name: 'required' });
      console.log('Valid:', result.valid);
    }
  };
});
```

### jQuery Plugin Creation

```javascript
$.FEAR.gui.create('tabs', (sandbox) => {
  return {
    // Use 'fn' instead of 'load' for jQuery plugins
    fn: function($element, options) {
      this.$el = $element;
      this.opts = $.extend({}, {
        activeClass: 'active',
        event: 'click'
      }, options);
      
      this.init = function() {
        this.$el.find('.tab').on(this.opts.event, (e) => {
          this.activate($(e.currentTarget));
          sandbox.emit('tab:changed', { 
            tab: $(e.currentTarget).data('tab') 
          });
        });
      };
      
      this.activate = function($tab) {
        this.$el.find('.tab').removeClass(this.opts.activeClass);
        $tab.addClass(this.opts.activeClass);
      };
      
      this.destroy = function() {
        this.$el.find('.tab').off(this.opts.event);
      };
      
      this.init();
      return this;
    }
  };
});

// Start to register as jQuery plugin
$.FEAR.gui.start('tabs');

// Use as standard jQuery plugin
$('.tabs-container').tabs({ activeClass: 'selected' });
```

## 🔧 Configuration Options

```javascript
$.FEAR.gui.configure({
  logLevel: 0,        // 0: all, 1: warnings, 2: errors only
  name: 'MyApp',      // Application name
  mode: 'single',     // 'single' or 'multiple'
  animations: true,   // Enable animations
  jquery: true        // jQuery integration
});
```

## 📦 Installation

### Via NPM

```bash
npm install fear-gui
```

### Via CDN

```html
<!-- jQuery (required) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- FEAR GUI -->
<script src="https://unpkg.com/fear-gui@2.0.0/dist/jquery.fear.gui.min.js"></script>

<!-- or jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/fear-gui@2.0.0/dist/jquery.fear.gui.min.js"></script>
```

### ES Module (Modern Bundlers)

```javascript
import { FEAR, utils, createBroker } from 'fear-gui';
import $ from 'jquery';

// Make jQuery global for FEAR
window.jQuery = window.$ = $;

const app = FEAR({ name: 'ModernApp' });
```

## 🏗️ Building from Source

### Prerequisites

- Node.js 14+
- npm or yarn

### Build Steps

```bash
# Clone repository
git clone https://github.com/yourorg/fear-gui.git
cd fear-gui

# Install dependencies
npm install

# Build all formats
npm run build

# Development mode (watch for changes)
npm run dev

# Clean build artifacts
npm run clean
```

### Build Outputs

```
dist/
├── jquery.fear.gui.js       # UMD development build
├── jquery.fear.gui.min.js   # UMD production build (minified)
├── fear.esm.js              # ES Module build
└── fear.cjs.js              # CommonJS build
```

## 📝 Examples

### Complete Todo App

```javascript
$.FEAR.gui.configure({ name: 'TodoApp' });

// Todo storage module
$.FEAR.gui.create('todoStorage', (sandbox) => {
  let todos = [];
  
  return {
    load() {
      sandbox.add('todo:add', (data) => {
        todos.push({ 
          id: sandbox.utils.unique(8), 
          text: data.text, 
          done: false 
        });
        sandbox.emit('todos:updated', { todos });
      });
      
      sandbox.add('todo:toggle', (data) => {
        const todo = todos.find(t => t.id === data.id);
        if (todo) todo.done = !todo.done;
        sandbox.emit('todos:updated', { todos });
      });
      
      sandbox.add('todo:remove', (data) => {
        todos = todos.filter(t => t.id !== data.id);
        sandbox.emit('todos:updated', { todos });
      });
    }
  };
});

// Todo UI module
$.FEAR.gui.create('todoUI', (sandbox) => {
  return {
    load() {
      const $input = sandbox.$('#todo-input');
      const $list = sandbox.$('#todo-list');
      const $add = sandbox.$('#add-todo');
      
      // Add todo
      $add.on('click', () => {
        const text = $input.val().trim();
        if (text) {
          sandbox.emit('todo:add', { text });
          $input.val('');
        }
      });
      
      // Update UI when todos change
      sandbox.add('todos:updated', (data) => {
        $list.empty();
        data.todos.forEach(todo => {
          const $item = $(`
            <li class="${todo.done ? 'done' : ''}">
              <input type="checkbox" ${todo.done ? 'checked' : ''}>
              <span>${todo.text}</span>
              <button class="remove">×</button>
            </li>
          `);
          
          $item.find('input').on('change', () => {
            sandbox.emit('todo:toggle', { id: todo.id });
          });
          
          $item.find('.remove').on('click', () => {
            sandbox.emit('todo:remove', { id: todo.id });
          });
          
          $list.append($item);
        });
      });
      
      // Initial render
      sandbox.emit('todo:add', { text: 'Welcome to FEAR GUI!' });
    }
  };
});

// Start all modules
$.FEAR.gui.start(['todoStorage', 'todoUI']);
```

### Real-time Chat Module

```javascript
$.FEAR.gui.create('chat', (sandbox) => {
  return {
    async load() {
      await sandbox.ready();
      
      const $messages = sandbox.$('#messages');
      const $input = sandbox.$('#message-input');
      const $send = sandbox.$('#send-message');
      
      // Connect to WebSocket or polling
      const addMessage = (msg) => {
        const $msg = $(`
          <div class="message">
            <span class="user">${msg.user}:</span>
            <span class="text">${msg.text}</span>
            <span class="time">${msg.time}</span>
          </div>
        `);
        
        $messages.append($msg);
        $messages.scrollTop($messages[0].scrollHeight);
      };
      
      // Send message
      $send.on('click', async () => {
        const text = $input.val().trim();
        if (!text) return;
        
        try {
          const response = await sandbox.fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          
          addMessage(response.data);
          $input.val('');
        } catch (err) {
          sandbox.warn('Failed to send message:', err);
        }
      });
      
      // Listen for new messages
      sandbox.add('chat:message', addMessage);
      
      // Poll for new messages
      const poller = sandbox.interval(async () => {
        const response = await sandbox.fetch('/api/messages/recent');
        response.data.forEach(msg => {
          sandbox.emit('chat:message', msg);
        });
      }, 5000);
      
      return poller;
    },
    
    unload() {
      // Cleanup handled by sandbox
    }
  };
});
```

## 🧪 Testing

```javascript
// Example test with module
describe('FEAR GUI Module', () => {
  let gui;
  
  beforeEach(() => {
    gui = $.FEAR({ name: 'TestApp' });
  });
  
  it('should create and start module', async () => {
    let loaded = false;
    
    gui.create('testModule', (sandbox) => {
      return {
        load() {
          loaded = true;
          return Promise.resolve();
        }
      };
    });
    
    await gui.start('testModule');
    expect(loaded).toBe(true);
  });
  
  it('should communicate via events', (done) => {
    gui.broker.add('test:event', (data) => {
      expect(data.value).toBe(123);
      done();
    });
    
    gui.broker.emit('test:event', { value: 123 });
  });
});
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive
- Test in multiple browsers

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Inspired by modern JavaScript frameworks
- Built with Rollup and Babel
- Powered by jQuery

## 📚 Resources

- [Documentation](https://github.com/yourorg/fear-gui/wiki)
- [Examples](https://github.com/yourorg/fear-gui/tree/main/examples)
- [API Reference](https://github.com/yourorg/fear-gui/blob/main/docs/API.md)
- [Quick Start Guide](https://github.com/yourorg/fear-gui/blob/main/QUICK_START.md)
- [Build Guide](https://github.com/yourorg/fear-gui/blob/main/BUILD_GUIDE.md)

## 🐛 Known Issues

- None currently reported

## 🗺️ Roadmap

- [ ] TypeScript definitions
- [ ] React adapter
- [ ] Vue adapter
- [ ] CLI tool for scaffolding
- [ ] DevTools extension
- [ ] Module marketplace

## 💬 Support

- [GitHub Issues](https://github.com/yourorg/fear-gui/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fear-gui)
- [Discord Community](https://discord.gg/fear-gui)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

Made with ❤️ by the FEAR GUI team {
      sandbox.emit('data:ready', { value: 123 });
    }
  };
});

// Module B - Subscriber
$.FEAR.gui.create('moduleB', (sandbox) => {
  return {
    load()# ⚡ FEAR GUI

> A powerful, modular JavaScript framework with jQuery integration for building scalable web applications

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourorg/fear-gui)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

- 📦 **Modular Architecture** - Create independent, reusable modules with clear lifecycle hooks
- 🔌 **Plugin System** - Extend functionality with custom plugins
- 📡 **Event Broker** - Powerful pub/sub system for inter-module communication
- 📋 **Module Registry** - Track and manage all modules with lifecycle events
- 🎯 **Sandbox Environment** - Isolated API for each module with jQuery integration
- ⚡ **Promise-Based** - Modern async/await patterns throughout
- 🛠️ **Rich Utilities** - Helper functions for common operations
- 🎨 **jQuery Plugin Support** - Create standard jQuery plugins easily
- 📦 **Multiple Builds** - UMD, ESM, and CommonJS formats
- 🔍 **TypeScript Ready** - Full type definitions included
- ⚙️ **Zero Dependencies** - Only requires jQuery as peer dependency

## 🚀 Quick Start

### Installation

```bash
npm install fear-gui
```

Or use via CDN:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://unpkg.com/fear-gui@2.0.0/dist/jquery.fear.gui.min.js"></script>
```

### Basic Usage

```javascript
// Configure the framework
$.FEAR.gui.configure({
  name: 'MyApp',
  logLevel: 1
});

// Create a module
$.FEAR.gui.create('greeting', (sandbox) => {
  return {
    load(options) {
      sandbox.$('#button').on('click', () => {
        sandbox.emit('greeting:clicked', { 
          message: options.message 
        });
      });
    }
  };
});

// Start the module
$.FEAR.gui.start('greeting', { message: 'Hello World!' });
```

## 📖 Documentation

### Table of Contents

- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Build Configuration](#build-configuration)
- [Examples](#examples)

## 🎯 Core Concepts

### Modules

Modules are independent units of functionality with defined lifecycle hooks:

```javascript
$.FEAR.gui.create('myModule', (sandbox) => {
  return {
    // Required: Called when module starts
    load(options) {
      // Initialize module
      return Promise.resolve();
    },
    
    // Optional: Called when module stops
    unload() {
      // Cleanup
    },
    
    // Optional: Called when module is destroyed
    destroy() {
      // Final cleanup
    }
  };
});
```

### Sandbox

Each module receives a sandbox with isolated APIs:

```javascript
sandbox.$(selector)           // Enhanced jQuery selector
sandbox.emit(event, data)     // Emit event to all subscribers
sandbox.fire(event, data)     // Fire event to first subscriber
sandbox.add(event, callback)  // Subscribe to event
sandbox.fetch(url, options)   // Promise-based AJAX
sandbox.timeout(ms, fn)       // Promise-based timeout
sandbox.registry              // Access module registry
sandbox.utils                 // Utility functions
```

### Event Broker

Pub/sub messaging system for module communication:

```javascript
// Subscribe to events
$.FEAR.gui.broker.add('user:login', (data) => {
  console.log('User logged in:', data.username);
});

// Emit to all subscribers
$.FEAR.gui.broker.emit('user:login', { username: 'john' });

// Fire to first subscriber only
$.FEAR.gui.broker.fire('user:login', { username: 'john' });

// One-time subscription
$.FEAR.gui.broker.once('app:ready', () => {
  console.log('App is ready!');
});

// Wait for event with timeout
await $.FEAR.gui.broker.waitFor('data:loaded', 5000);

// Create namespaced broker
const ns = $.FEAR.gui.broker.namespace('myapp');
ns.emit('user:login', data); // Emits on 'myapp/user:login'
```

### Registry

Track and manage all registered modules:

```javascript
// Listen for registry events
$.FEAR.gui.registry.on('module:registered', (data) => {
  console.log('Registered:', data.name);
});

// Check if module exists
if ($.FEAR.gui.registry.has('myModule')) {
  const instance = $.FEAR.gui.registry.get('myModule');
}

// List all modules
const modules = $.FEAR.gui.registry.list();

// Set/get global config
$.FEAR.gui.registry.setGlobal({ apiUrl: 'https://api.example.com' });
const config = $.FEAR.gui.registry.getGlobal();

// Clear all modules
$.FEAR.gui.registry.clear();
```

## 🔧 API Reference

### GUI API

#### `$.FEAR(options)`
Create a new FEAR instance.

```javascript
const app = $.FEAR({ name: 'MyApp', logLevel: 0 });
```

#### `$.FEAR.gui`
Singleton instance, pre-initialized.

```javascript
$.FEAR.gui.start('myModule');
```

#### `.configure(options)`
Configure the framework.

```javascript
$.FEAR.gui.configure({
  logLevel: 0,      // 0: all, 1: warnings, 2: errors
  name: 'MyApp'
});
```

#### `.create(id, creator, options)`
Register a new module.

```javascript
$.FEAR.gui.create('myModule', (sandbox) => {
  return {
    load(opts) { /* ... */ }
  };
}, { defaultOption: 'value' });
```

#### `.start(moduleId, options)`
Start one or more modules.

```javascript
// Start single module
await $.FEAR.gui.start('myModule');

// Start with options
await $.FEAR.gui