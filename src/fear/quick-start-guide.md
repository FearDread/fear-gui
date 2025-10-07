# FEAR GUI - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build the Project

```bash
npm run build
```

This creates:
- `dist/jquery.fear.gui.js` - Development build
- `dist/jquery.fear.gui.min.js` - Production build
- `dist/fear.esm.js` - ES Module build
- `dist/fear.cjs.js` - CommonJS build

### Step 3: Include in Your HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="dist/jquery.fear.gui.min.js"></script>
</head>
<body>
  <button id="myButton">Click Me</button>
  
  <script>
    // Your code here
  </script>
</body>
</html>
```

## 📦 Basic Module Example

```javascript
// Configure the framework
$.FEAR.gui.configure({
  name: 'MyApp',
  logLevel: 1  // 0 = all, 1 = warnings, 2 = errors only
});

// Create a module
$.FEAR.gui.create('myModule', (sandbox) => {
  return {
    // Called when module starts
    load(options) {
      sandbox.log('Module loaded with options:', options);
      
      // Use jQuery with sandbox
      sandbox.$('#myButton').on('click', () => {
        sandbox.emit('button:clicked', { time: Date.now() });
      });
      
      // Subscribe to events
      sandbox.add('button:clicked', (data) => {
        console.log('Button was clicked!', data);
      });
      
      // Return promise for async operations
      return Promise.resolve();
    },
    
    // Called when module stops
    unload() {
      sandbox.log('Module cleaning up...');
      sandbox.$('#myButton').off('click');
    }
  };
});

// Start the module
$.FEAR.gui.start('myModule', { theme: 'dark' })
  .then(() => console.log('✓ Module started'))
  .catch(err => console.error('✗ Error:', err));
```

## 🎯 Common Patterns

### 1. Event Communication

```javascript
// Module A - Publisher
$.FEAR.gui.create('moduleA', (sandbox) => {
  return {
    load() {
      setInterval(() => {
        sandbox.emit('data:updated', { value: Math.random() });
      }, 1000);
    }
  };
});

// Module B - Subscriber
$.FEAR.gui.create('moduleB', (sandbox) => {
  return {
    load() {
      sandbox.add('data:updated', (data) => {
        console.log('New data:', data.value);
      });
    }
  };
});

// Start both
$.FEAR.gui.start(['moduleA', 'moduleB']);
```

### 2. Async Operations

```javascript
$.FEAR.gui.create('asyncModule', (sandbox) => {
  return {
    async load() {
      // Wait for DOM ready
      await sandbox.ready();
      
      // Timeout
      await sandbox.timeout(2000);
      console.log('2 seconds passed');
      
      // Fetch data
      const result = await sandbox.fetch('/api/data');
      console.log('Data:', result.data);
      
      // Animate
      await sandbox.$('#box').animateAsync(
        { left: '100px' },
        500
      );
    }
  };
});
```

### 3. Registry Usage

```javascript
// Listen for module registration
$.FEAR.gui.registry.on('module:registered', (data) => {
  console.log('Module registered:', data.name);
});

// Check if module exists
if ($.FEAR.gui.registry.has('myModule')) {
  const instance = $.FEAR.gui.registry.get('myModule');
  console.log('Found module:', instance);
}

// List all modules
console.log('All modules:', $.FEAR.gui.registry.list());

// Set global config
$.FEAR.gui.registry.setGlobal({
  apiUrl: 'https://api.example.com',
  theme: 'dark'
});
```

### 4. Resource Loading

```javascript
$.FEAR.gui.create('resourceModule', (sandbox) => {
  return {
    async load() {
      // Load CSS
      await sandbox.loadCSS('/styles/theme.css');
      
      // Load JavaScript
      await sandbox.loadScript('/lib/plugin.js');
      
      // Load multiple resources
      await sandbox.loadResources([
        '/styles/main.css',
        '/scripts/helpers.js',
        '/data/config.json'
      ]);
    }
  };
});
```

### 5. Utilities

```javascript
const utils = $.FEAR.utils;

// Generate unique ID
const id = utils.unique(16);

// Slugify text
const slug = utils.slugify('Hello World 2024!');
// Result: "hello-world-2024"

// Random number
const random = utils.rand(1, 100);

// Clone object
const original = { a: 1, b: 2 };
const copy = utils.clone(original);

// Run tasks in series
await utils.run.series([
  () => fetchData(),
  () => processData(),
  () => saveData()
]);

// Run tasks in parallel
await utils.run.parallel([
  () => fetchUsers(),
  () => fetchPosts(),
  () => fetchComments()
]);
```

## 🔧 Development Workflow

### Watch Mode (Auto-rebuild)

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### Testing Your Build

1. Build the project: `npm run build`
2. Open `example.html` in your browser
3. Open DevTools console to see logs

### File Structure

```
src/
├── main.js          # Entry point
├── utils.js         # Utilities
├── broker.js        # Event system
├── registry.js      # Module registry
└── sandbox.js       # Module sandbox

dist/                # Build output
└── ...

example.html         # Demo page
```

## 📝 Module Lifecycle

```javascript
$.FEAR.gui.create('lifecycle', (sandbox) => {
  return {
    // 1. Called when module is started
    load(options) {
      console.log('1. Loading...');
      // Initialize, bind events, fetch data
      return Promise.resolve();
    },
    
    // 2. Called when module is stopped
    unload() {
      console.log('2. Unloading...');
      // Cleanup, unbind events
    },
    
    // 3. Called when module is unregistered
    destroy() {
      console.log('3. Destroying...');
      // Final cleanup
    }
  };
});

// Start module
await $.FEAR.gui.start('lifecycle');

// Stop module (calls unload)
await $.FEAR.gui.stop('lifecycle');

// Unregister (calls destroy)
$.FEAR.gui.registry.unregister('lifecycle');
```

## 🎨 Creating jQuery Plugins

```javascript
$.FEAR.gui.create('tabs', (sandbox) => {
  return {
    // Use 'fn' instead of 'load' for jQuery plugins
    fn: function($element, options) {
      this.$el = $element;
      this.opts = $.extend({}, {
        activeClass: 'active'
      }, options);
      
      this.init = function() {
        this.$el.find('.tab').on('click', (e) => {
          this.activate($(e.currentTarget));
        });
      };
      
      this.activate = function($tab) {
        this.$el.find('.tab').removeClass(this.opts.activeClass);
        $tab.addClass(this.opts.activeClass);
      };
      
      this.init();
      return this;
    }
  };
});

// Start to register as jQuery plugin
$.FEAR.gui.start('tabs');

// Use as jQuery plugin
$('.tabs-container').tabs({ activeClass: 'selected' });
```

## 🔌 Plugin System

```javascript
// Create a plugin
const loggingPlugin = (gui, options) => {
  console.log('Plugin initializing with options:', options);
  
  return {
    // Called before module load
    load(sandbox) {
      console.log(`[${sandbox.module}] Loading...`);
    },
    
    // Called after module unload
    unload(sandbox) {
      console.log(`[${sandbox.module}] Unloaded`);
    }
  };
};

// Register plugin
$.FEAR.gui.use(loggingPlugin, { verbose: true });

// Register multiple plugins
$.FEAR.gui.use([
  loggingPlugin,
  { plugin: analyticsPlugin, options: { key: 'abc123' } }
]);
```

## 🌐 ES Modules Usage

```javascript
// In your bundled app
import { FEAR, utils, createBroker } from 'fear-gui';

const app = FEAR({ name: 'ModernApp' });

app.create('main', (sandbox) => {
  return {
    async load() {
      console.log('App loaded!');
    }
  };
});

app.start('main');
```

## 💡 Tips & Best Practices

1. **Always return Promises from async operations in `load()`**
   ```javascript
   load() {
     return sandbox.fetch('/api/data');  // ✓ Good
   }
   ```

2. **Clean up in `unload()`**
   ```javascript
   unload() {
     this.interval.stop();
     sandbox.$('#el').off('click');
   }
   ```

3. **Use namespaced events to avoid conflicts**
   ```javascript
   sandbox.emit('mymodule:ready', data);
   ```

4. **Access registry from modules**
   ```javascript
   load() {
     const otherModule = sandbox.registry.get('otherModule');
   }
   ```

5. **Use sandbox utilities, not globals**
   ```javascript
   // ✗ Bad
   $('#element').on('click', ...);
   
   // ✓ Good
   sandbox.$('#element').on('click', ...);
   ```

## 🐛 Debugging

Enable logging:
```javascript
$.FEAR.gui.configure({ logLevel: 0 });
```

View debug history:
```javascript
console.log($.FEAR.gui.debug.history);
```

Check registered modules:
```javascript
console.log($.FEAR.gui.registry.list());
```

Check active channels:
```javascript
console.log($.FEAR.gui.broker.getChannels());
```

## 📚 Next Steps

- Check `example.html` for interactive demos
- Read the full documentation
- Explore the source code in `src/`
- Build something awesome! 🚀