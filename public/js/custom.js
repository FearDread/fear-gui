if (!window.FEAR || !jQuery) {
    console.log('Unable to load FEAR jQuery Framework');
    return;
}


(($, window, document, FEAR) => {
    
    $.FEAR = window.FEAR;

    $.FEAR.init(document, {
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
})(jQuery, window, document, FEAR);

