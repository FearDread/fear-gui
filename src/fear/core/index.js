import utils from "./utils";
import GUI from "./gui";

;(function($) {
    const $gui = app = new GUI();

    $.FEAR = () => {
        const argc = [].slice.call(arguments);
        const options = argc[0] || null;

        if (options && options !== null) {

            if (utils.isArr(options)) {
                $gui.attach(options);
            
            } else if (utils.isObj(options)) {   
                $gui.configure(options);
            }
        }

        return $gui;
    };

    $.fn.FEAR = function(options) {
        return this.each(() => {
            if (!$.data(this, 'fear')) {

                $.data(this, 'fear', new $.FEAR().create(this, options));
            } else {
                return new $.FEAR().create(this, options);
            }
        });
    };

})(jQuery);