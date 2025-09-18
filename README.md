# FEAR Framework

> **F**ramework for **E**nhanced **A**sset **R**endering  
> A comprehensive, lightweight jQuery framework for building modern portfolio websites and landing pages.

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/feardread/fear-framework)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![jQuery](https://img.shields.io/badge/jQuery-3.0%2B-yellow.svg)](https://jquery.com)
[![Size](https://img.shields.io/badge/minified-~15kb-orange.svg)](#)

## ✨ Features

- **🎯 Modular Architecture** - Enable only the components you need
- **🎨 Built-in Animations** - Smooth scroll-triggered animations with Intersection Observer
- **🧭 Simple Router** - Hash-based navigation with smooth scrolling
- **⚡ Lightweight** - ~15kb minified, built on jQuery
- **📱 Responsive** - Mobile-first approach with modern CSS
- **🔧 Extensible** - Easy custom module integration
- **🎭 Event-Driven** - Comprehensive event system for module communication

## 🚀 Quick Start

### Installation

**CDN (Recommended)**
```html
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.0/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/fear-framework@4.0.0/dist/fear.min.js"></script>
```

**NPM**
```bash
npm install fear-framework
```

**Download**
```html
<script src="path/to/jquery.min.js"></script>
<script src="path/to/fear.min.js"></script>
```

### Basic Usage

**Auto-initialization (Recommended)**
```html
<body data-fear>
  <!-- Your content here -->
  <div class="fear-fade-in">This will animate on scroll</div>
</body>
```

**Manual initialization**
```javascript
// Initialize with defaults
FEAR.init();

// Initialize with options
FEAR.init(document, {
  debug: true,
  modules: {
    animations: true,
    router: true,
    loader: false
  }
});

// jQuery plugin style
$('body').fear({
  debug: true,
  autoInit: true
});
```

## 📚 Documentation

### Core Modules

| Module | Description | Dependencies |
|--------|-------------|--------------|
| `animations` | Scroll-triggered animations | None |
| `router` | Hash-based navigation | None |
| `loader` | Page loading animations | None |
| `typed` | Typewriter text effects | [Typed.js](https://github.com/mattboldt/typed.js) |
| `swiper` | Touch sliders | [Swiper](https://swiperjs.com) |
| `magnificPopup` | Lightbox modals | [Magnific Popup](https://dimsemenov.com/plugins/magnific-popup/) |
| `countdown` | Countdown timers | [jQuery Countdown](http://keith-wood.name/countdown.html) |
| `vegas` | Background slideshows | [Vegas](http://vegas.jaysalvat.com) |
| `skillbars` | Animated progress bars | None |
| `mailchimp` | Newsletter integration | [jQuery AjaxChimp](https://github.com/scdoshi/jquery-ajaxchimp) |
| `contactForm` | Contact form handling | None |
| `particles` | Particle backgrounds | [Particles.js](https://vincentgarreau.com/particles.js/) |

### Configuration

```javascript
FEAR.init(document, {
  // Core settings
  debug: false,
  autoInit: true,
  namespace: 'fear',
  
  // Module enablement
  modules: {
    loader: true,
    typed: true,
    swiper: true,
    magnificPopup: true,
    countdown: true,
    vegas: true,
    skillbars: true,
    mailchimp: true,
    contactForm: true,
    particles: true,
    animations: true,
    router: false
  },

  // Animation settings
  animations: {
    duration: 600,
    easing: 'ease-in-out',
    offset: 100,
    useIntersectionObserver: true,
    classes: {
      animate: 'fear-animate',
      animated: 'fear-animated',
      fadeIn: 'fear-fade-in',
      slideUp: 'fear-slide-up',
      slideDown: 'fear-slide-down',
      slideLeft: 'fear-slide-left',
      slideRight: 'fear-slide-right',
      zoomIn: 'fear-zoom-in',
      zoomOut: 'fear-zoom-out'
    }
  },

  // Router settings
  router: {
    hashNavigation: true,
    smoothScroll: true,
    scrollOffset: 80,
    activeClass: 'active',
    routes: {}
  },

  // Event callbacks
  callbacks: {
    onInit: null,
    onReady: null,
    onLoadComplete: null,
    onDestroy: null,
    onModuleInit: null,
    onModuleDestroy: null,
    onRouteChange: null,
    onAnimationComplete: null
  }
});
```

### API Methods

#### Core Methods
```javascript
// Framework control
FEAR.init(element, options)    // Initialize framework
FEAR.destroy()                 // Destroy framework instance
FEAR.extend(options)          // Extend configuration
FEAR.config(key, value)       // Get/set configuration

// Module management
FEAR.use(name, module)        // Register custom module
FEAR.enable(moduleName)       // Enable module
FEAR.disable(moduleName)      // Disable module
FEAR.module(moduleName)       // Get module instance

// Information
FEAR.version()                // Get framework version
FEAR.isInit()                // Check if initialized
FEAR.modules()               // List active modules
```

#### Event Methods
```javascript
FEAR.on(event, callback)      // Listen to event
FEAR.off(event, callback)     // Remove event listener
FEAR.emit(event, data)        // Emit event
FEAR.once(event, callback)    // Listen once
```

#### Helper Methods
```javascript
FEAR.animate(selector)        // Trigger animations
FEAR.navigate(route)          // Navigate to route
FEAR.route()                 // Get current route
```

### Events

The framework emits various events you can listen to:

```javascript
// Framework events
FEAR.on('fear:init', (data) => {
  console.log('Framework initialized', data);
});

FEAR.on('fear:ready', () => {
  console.log('DOM ready, modules initialized');
});

FEAR.on('fear:loadComplete', () => {
  console.log('Window loaded, all modules ready');
});

// Module events
FEAR.on('module:registered', ({ name, instance }) => {
  console.log(`Module ${name} registered`);
});

FEAR.on('module:unregistered', ({ name }) => {
  console.log(`Module ${name} unregistered`);
});

// Animation events
FEAR.on('animation:complete', ({ element }) => {
  console.log('Element animated', element);
});

// Router events
FEAR.on('route:change', ({ route, previousRoute }) => {
  console.log(`Route changed: ${previousRoute} -> ${route}`);
});
```

## 🎨 Animations

FEAR includes a built-in animation system with CSS classes:

### Available Animation Classes

```html
<div class="fear-fade-in">Fade in on scroll</div>
<div class="fear-slide-up">Slide up on scroll</div>
<div class="fear-slide-down">Slide down on scroll</div>
<div class="fear-slide-left">Slide left on scroll</div>
<div class="fear-slide-right">Slide right on scroll</div>
<div class="fear-zoom-in">Zoom in on scroll</div>
<div class="fear-zoom-out">Zoom out on scroll</div>
```

### Manual Animation Trigger

```javascript
// Animate specific elements
FEAR.animate('.my-elements');

// Listen for animation completion
FEAR.on('animation:complete', ({ element }) => {
  console.log('Animation completed for:', element);
});
```

## 🧭 Router

Simple hash-based routing with smooth scrolling:

### Setup

```javascript
FEAR.init(document, {
  modules: { router: true },
  router: {
    hashNavigation: true,
    smoothScroll: true,
    scrollOffset: 80,
    routes: {
      'home': (route) => {
        console.log('Navigated to home');
      },
      'about': (route) => {
        console.log('Navigated to about');
      }
    }
  }
});
```

### Usage

```html
<!-- Navigation links -->
<nav>
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#contact">Contact</a>
</nav>

<!-- Target sections -->
<section id="home">Home content</section>
<section id="about">About content</section>
<section id="contact">Contact content</section>
```

```javascript
// Programmatic navigation
FEAR.navigate('about');

// Get current route
const currentRoute = FEAR.route();

// Listen to route changes
FEAR.on('route:change', ({ route, previousRoute }) => {
  console.log(`Navigated from ${previousRoute} to ${route}`);
});
```

## 🔧 Custom Modules

Create and register custom modules:

```javascript
// Define custom module
const CustomModule = {
  init: function(config) {
    console.log('Custom module initialized with config:', config);
    // Module initialization logic
    return Promise.resolve();
  },
  
  destroy: function() {
    console.log('Custom module destroyed');
    // Cleanup logic
  }
};

// Register module
FEAR.use('customModule', CustomModule);

// Enable in configuration
FEAR.extend({
  modules: {
    customModule: true
  },
  customModule: {
    // Custom module configuration
    setting1: 'value1',
    setting2: 'value2'
  }
});
```

## 📱 Component Examples

### Loader Screen

```html
<div class="loader">
  <div class="loader__logo">
    <img src="logo.png" alt="Logo">
  </div>
</div>

<main id="main">
  <!-- Your main content -->
</main>
```

### Typed Text Effect

```html
<div class="animated-headline">
  <span id="typed"></span>
</div>

<div id="typed-strings" style="display: none;">
  <p>Welcome to FEAR Framework</p>
  <p>Build Amazing Portfolios</p>
  <p>With Ease and Style</p>
</div>
```

### Swiper Slider

```html
<div class="swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">Slide 1</div>
    <div class="swiper-slide">Slide 2</div>
    <div class="swiper-slide">Slide 3</div>
  </div>
  <div class="swiper-pagination"></div>
  <div class="swiper-button-next"></div>
  <div class="swiper-button-prev"></div>
</div>
```

### Skill Bars

```html
<div class="skillbar" data-percent="90">
  <div class="skillbar-title">JavaScript</div>
  <div class="skillbar-bar">
    <div class="skillbar-percent">90%</div>
  </div>
</div>
```

### Contact Form

```html
<form id="sayhello-form" class="sayhello">
  <div class="form">
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Your Email" required>
    <textarea name="message" placeholder="Your Message" required></textarea>
    <button type="submit">Send Message</button>
  </div>
  
  <div class="reply-group">
    <p>Thank you! Your message has been sent.</p>
  </div>
</form>
```

## 🎯 Advanced Usage

### Multiple Instances

```javascript
// Different configurations for different sections
$('#header').fear({
  modules: { animations: true, router: true }
});

$('#portfolio').fear({
  modules: { swiper: true, magnificPopup: true }
});
```

### Dynamic Module Loading

```javascript
// Conditionally enable modules
if (window.innerWidth > 768) {
  FEAR.enable('particles');
} else {
  FEAR.disable('particles');
}

// Load modules based on user interaction
$('#enable-animations').click(() => {
  FEAR.enable('animations');
});
```

### Custom Event Handling

```javascript
// Create custom workflow
FEAR.on('fear:ready', () => {
  // Start custom initialization
  initCustomFeatures();
});

FEAR.on('route:change', ({ route }) => {
  // Update analytics
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_path: `/#${route}`
  });
});

FEAR.on('animation:complete', ({ element }) => {
  // Trigger next animation sequence
  if (element.classList.contains('trigger-next')) {
    FEAR.animate('.next-elements');
  }
});
```

## 🎨 CSS Framework Integration

FEAR works great with popular CSS frameworks:

### With Bootstrap

```html
<div class="container">
  <div class="row">
    <div class="col-md-6 fear-slide-left">
      <h2>Left Content</h2>
    </div>
    <div class="col-md-6 fear-slide-right">
      <h2>Right Content</h2>
    </div>
  </div>
</div>
```

### With Tailwind CSS

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div class="fear-fade-in bg-white p-6 rounded-lg shadow">
    <h3 class="text-xl font-bold">Card 1</h3>
  </div>
  <div class="fear-fade-in bg-white p-6 rounded-lg shadow">
    <h3 class="text-xl font-bold">Card 2</h3>
  </div>
</div>
```

## 🔍 Debugging

Enable debug mode to see detailed console logs:

```javascript
FEAR.init(document, {
  debug: true
});

// Or enable after initialization
FEAR.config('debug', true);
```

Debug output includes:
- Module initialization/destruction
- Event emissions
- Route changes
- Animation triggers
- Error messages

## 📦 Building from Source

```bash
# Clone repository
git clone https://github.com/feardread/fear-framework.git
cd fear-framework

# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm run dev

# Run tests
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Test across different browsers
- Keep bundle size minimal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **jQuery** - The foundation that makes it all possible
- **Typed.js** - Beautiful typewriter effects
- **Swiper** - Modern touch slider
- **Magnific Popup** - Responsive lightbox plugin
- **Vegas** - Background slideshow plugin
- **Particles.js** - Lightweight particle animations

## 📞 Support

- 📧 Email: support@fear-framework.com
- 💬 Discord: [FEAR Framework Community](https://discord.gg/fear-framework)
- 📝 Issues: [GitHub Issues](https://github.com/feardread/fear-framework/issues)
- 📖 Documentation: [Official Docs](https://fear-framework.com/docs)

## 🗺️ Roadmap

- [ ] Vue.js version
- [ ] React version
- [ ] TypeScript definitions
- [ ] CLI tool for project scaffolding
- [ ] More built-in animations
- [ ] Theme system
- [ ] Plugin marketplace

---

Made with ❤️ by [FearDread](https://github.com/feardread)