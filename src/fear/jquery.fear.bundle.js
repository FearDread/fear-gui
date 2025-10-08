import { FEAR } from './gui/core/gui.js';
import { Broker } from './gui/core/broker.js';
import { Utils } from './gui/core/utils.js';
import { SandBox } from './gui/core/sandbox.js';

// Plugins
import { Cellar } from './gui/modules/cellar.js';
import { Events } from './gui/core/events.js';
import { Router } from './gui/modules/router.js';

// Make FEAR available globally
window.FEAR = FEAR;
window.Broker = Broker;
window.Utils = Utils;
window.SandBox = SandBox;

// Export plugins
window.FEARPlugins = {
  Cellar,
  Events,
  Router
};

// jQuery Plugin Wrapper
(function($) {
  $.FEAR = function(options) {
    var gui = new FEAR();
    
    if (!options) {
      return gui;
    }
    
    if (Array.isArray(options)) {
      gui.use(options);
    } else if (typeof options === 'object') {
      gui.configure(options);
    }
    
    return gui;
  };

  $.fn.fear = function(options) {
    return this.each(function() {
      var $element = $(this);
      var instance = $.data(this, 'fear');
      
      if (!instance) {
        var gui = $.FEAR(options);
        gui.config.element = this;
        gui.config.$element = $element;
        $.data(this, 'fear', gui);
        return gui;
      }
      
      return instance;
    });
  };


  // Expose core classes
  $.FEAR.GUI = FEAR;
  $.FEAR.Broker = Broker;
  $.FEAR.Utils = Utils;
  $.FEAR.Plugins = window.FEARPlugins;
  $.FEAR.GUI.use(window.FEARPlugins);
  // Auto-init elements
  $(function() {
    $('[data-fear]').each(function() {
      var $this = $(this);
      var moduleName = $this.data('fear');
      var options = $this.data('fear-options') || {};
      
      if (moduleName) {
        $this.fear(options);
      }
    });
  });

})(jQuery);
