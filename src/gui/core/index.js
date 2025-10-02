import { FEAR } from "./gui.js";
import { Utils } from "./utils.js";
import { SandBox } from "./sandbox.js";
import { Broker } from "./broker.js";

window.FEAR = FEAR;
window.Broker = Broker;
window.Utils = Utils;
window.SandBox = SandBox;

(function($) {
  'use strict';
  
  var $GUI = new FEAR();

  // Main FEAR function
  $.FEAR = function() {
    var argc = Array.prototype.slice.call(arguments);
    var options = argc[0] || null;
    
    if (options && options !== null) {
      if (Utils.isArr(options)) {
        $GUI.attach(options);
      } else if (Utils.isObj(options)) {
        $GUI.configure(options);
      }
    }
    
    return $GUI;
  };

  // jQuery plugin method
  $.fn.FEAR = function(options) {
    return this.each(function() {
      var $element = $(this);
      
      if (!$.data(this, 'fear')) {
        $.data(this, 'fear', new $.FEAR().create(this, options));
      } else {
        return new $.FEAR().create(this, options);
      }
    });
  };

})(
  // Dependency injection - works with different module systems
  typeof jQuery !== 'undefined' ? jQuery : 
  typeof $ !== 'undefined' ? $ : 
  (function() { throw new Error('jQuery is required'); })(),
);

