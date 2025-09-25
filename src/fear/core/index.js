;(function($, Utils, GUI) {
  'use strict';
  
  var $GUI = new GUI();

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
  
  typeof Utils !== 'undefined' ? Utils :
  typeof require !== 'undefined' ? require('./utils') :
  (function() { throw new Error('Utils module is required'); })(),
  
  typeof GUI !== 'undefined' ? GUI :
  typeof require !== 'undefined' ? require('./gui') :
  (function() { throw new Error('GUI module is required'); })()
);