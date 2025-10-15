/*-----------------------------------------------------------------
Template Name: Odor - Vape Store WooCommerce HTML Template
Refactored with FEAR GUI Framework
Version: 2.0.0
Description: Modular architecture with event-driven design
------------------------------------------------------------------*/
(($, window, undefined) => {

    if (typeof FEAR === undefined) {
        console.log('Missing Global FEAR or $.FEAR object');
        throw new Error();
    }

    FEAR.configure({
        logLevel: 1,
        name: 'CNBC E-Comm App',
        animations: true,
        mode: 'single'
    });

    FEAR.create('preloader', (GUI) => {
        return {
            load: () => {
                const paceOptions = {
                    ajax: true,
                    document: true,
                    eventLag: false
                };

                if (typeof Pace !== 'undefined') {
                    Pace.on('done', () => {
                        GUI.$('#preloader').addClass('isdone');
                        GUI.$('.loading').addClass('isdone');
                        GUI.emit('preloader:complete');
                    });
                }

                return Promise.resolve();
            }
        };
    });

    FEAR.create('header', (GUI) => {
        let $headerBar, $mainMenu, $fixedTop;

        return {
            load: () => {
                $headerBar = GUI.$('.header-bar');
                $mainMenu = GUI.$('.main-menu');
                $fixedTop = GUI.$('.header-section');

                // Mobile menu toggle
                $headerBar.on('click', (e) => {
                    $mainMenu.toggleClass('active');
                    $headerBar.toggleClass('active');
                    GUI.emit('header:menu-toggled');
                });

                // Menu item click handler
                $mainMenu.find('li a').on('click', function (e) {
                    const $element = GUI.$(this).parent('li');

                    if ($element.hasClass('open')) {
                        $element.removeClass('open');
                        $element.find('li').removeClass('open');
                        $element.find('ul').slideUp(300, 'swing');
                    } else {
                        $element.addClass('open');
                        $element.children('ul').slideDown(300, 'swing');
                        $element.siblings('li').children('ul').slideUp(300, 'swing');
                        $element.siblings('li').removeClass('open');
                        $element.siblings('li').find('li').removeClass('open');
                        $element.siblings('li').find('ul').slideUp(300, 'swing');
                    }
                });

                // Sticky header on scroll
                GUI.$(window).on('scroll', () => {
                    if (GUI.$(window).scrollTop() > 220) {
                        $fixedTop.addClass('menu-fixed animated fadeInDown');
                        $fixedTop.removeClass('slideInUp');
                        GUI.$('body').addClass('body-padding');
                        GUI.emit('header:fixed');
                    } else {
                        $fixedTop.removeClass('menu-fixed fadeInDown');
                        $fixedTop.addClass('slideInUp');
                        GUI.$('body').removeClass('body-padding');
                        GUI.emit('header:unfixed');
                    }
                });

                return Promise.resolve();
            },

            unload: () => {
                $headerBar.off('click');
                $mainMenu.find('li a').off('click');
                GUI.$(window).off('scroll');
            }
        };
    });

    FEAR.create('bannerSlider', (GUI) => {
        let sliderInstance;

        // Animated swiper helper
        const animatedSwiper = (selector, swiperInit) => {
            const animate = () => {
                GUI.$(`${selector} [data-animation]`).each(function () {
                    const $this = GUI.$(this);
                    const anim = $this.data('animation');
                    const delay = $this.data('delay');
                    const duration = $this.data('duration');

                    $this
                        .removeClass('anim' + anim)
                        .addClass(anim + ' animated')
                        .css({
                            webkitAnimationDelay: delay,
                            animationDelay: delay,
                            webkitAnimationDuration: duration,
                            animationDuration: duration
                        })
                        .one('animationend', function () {
                            GUI.$(this).removeClass(anim + ' animated');
                        });
                });
            };

            animate();
            swiperInit.on('slideChange', () => {
                GUI.$(`${selector} [data-animation]`).removeClass('animated');
            });
            swiperInit.on('slideChange', animate);
        };

        return {
            load: () => {
                const sliderActive = '.banner-two__slider';

                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper(sliderActive, {
                        loop: true,
                        slidesPerView: 1,
                        effect: 'fade',
                        speed: 3000,
                        autoplay: {
                            delay: 7000,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.banner-two__arry-next',
                            prevEl: '.banner-two__arry-prev'
                        }
                    });

                    animatedSwiper(sliderActive, sliderInstance);
                    GUI.emit('slider:banner-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('productSlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.product__slider', {
                        spaceBetween: 24,
                        speed: 300,
                        loop: true,
                        autoplay: {
                            delay: 5000,
                            disableOnInteraction: false
                        },
                        pagination: {
                            el: '.product__dot',
                            clickable: true
                        },
                        breakpoints: {
                            575: {
                                slidesPerView: 2
                            }
                        }
                    });

                    GUI.emit('slider:product-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('gallerySlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.gallery__slider', {
                        spaceBetween: 30,
                        speed: 300,
                        loop: true,
                        centeredSlides: true,
                        autoplay: {
                            delay: 5000,
                            disableOnInteraction: false
                        },
                        breakpoints: {
                            1300: { slidesPerView: 4 },
                            991: { slidesPerView: 3 },
                            768: { slidesPerView: 2 }
                        }
                    });

                    GUI.emit('slider:gallery-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('categorySlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.category__slider', {
                        spaceBetween: 30,
                        speed: 500,
                        loop: true,
                        autoplay: {
                            delay: 3000,
                            disableOnInteraction: false
                        },
                        breakpoints: {
                            1440: { slidesPerView: 6 },
                            1300: { slidesPerView: 5 },
                            991: { slidesPerView: 4 },
                            768: { slidesPerView: 3 },
                            500: { slidesPerView: 2 }
                        }
                    });

                    GUI.emit('slider:category-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('brandSlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.brand__slider', {
                        spaceBetween: 30,
                        speed: 300,
                        loop: true,
                        autoplay: {
                            delay: 3000,
                            disableOnInteraction: false
                        },
                        breakpoints: {
                            1440: { slidesPerView: 6 },
                            1300: { slidesPerView: 5 },
                            991: { slidesPerView: 4 },
                            768: { slidesPerView: 3 },
                            500: { slidesPerView: 2 }
                        }
                    });

                    GUI.emit('slider:brand-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('testimonialSlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.testimonial__slider', {
                        loop: true,
                        spaceBetween: 20,
                        speed: 500,
                        autoplay: {
                            delay: 4000,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.testimonial__arry-next',
                            prevEl: '.testimonial__arry-prev'
                        }
                    });

                    GUI.emit('slider:testimonial-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('blogSlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.blog__slider', {
                        loop: true,
                        spaceBetween: 30,
                        speed: 500,
                        autoplay: {
                            delay: 5000,
                            disableOnInteraction: false
                        },
                        pagination: {
                            el: '.blog__dot',
                            clickable: true
                        }
                    });

                    GUI.emit('slider:blog-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('getSlider', (GUI) => {
        let sliderInstance;

        return {
            load: () => {
                if (typeof Swiper !== 'undefined') {
                    sliderInstance = new Swiper('.get__slider', {
                        loop: true,
                        spaceBetween: 10,
                        speed: 300,
                        autoplay: {
                            delay: 4000,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.get-now__arry-right',
                            prevEl: '.get-now__arry-left'
                        }
                    });

                    GUI.emit('slider:get-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (sliderInstance) {
                    sliderInstance.destroy();
                }
            }
        };
    });

    FEAR.create('shop', (GUI) => {
        let shopSlider, shopThumbSlider;

        return {
            load: () => {
                // Product quantity controls
                GUI.$('.quantity').on('click', '.plus', function (e) {
                    const $input = GUI.$(this).prev('input.qty');
                    const val = parseInt($input.val(), 10);
                    $input.val(val + 1).change();
                    GUI.emit('shop:quantity-changed', { value: val + 1 });
                });

                GUI.$('.quantity').on('click', '.minus', function (e) {
                    const $input = GUI.$(this).next('input.qty');
                    const val = parseInt($input.val(), 10);
                    if (val > 0) {
                        $input.val(val - 1).change();
                        GUI.emit('shop:quantity-changed', { value: val - 1 });
                    }
                });

                // Shop single product slider
                if (typeof Swiper !== 'undefined') {
                    shopThumbSlider = new Swiper('.shop-slider-thumb', {
                        loop: true,
                        spaceBetween: 10,
                        slidesPerView: 4,
                        freeMode: true,
                        watchSlidesProgress: true,
                        navigation: {
                            nextEl: '.right-arry',
                            prevEl: '.left-arry'
                        }
                    });

                    shopSlider = new Swiper('.shop-single-slide', {
                        loop: true,
                        spaceBetween: 20,
                        speed: 300,
                        grabCursor: true,
                        navigation: {
                            nextEl: '.right-arry',
                            prevEl: '.left-arry'
                        },
                        thumbs: {
                            swiper: shopThumbSlider
                        }
                    });

                    GUI.emit('shop:slider-initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                GUI.$('.quantity').off('click');
                if (shopSlider) shopSlider.destroy();
                if (shopThumbSlider) shopThumbSlider.destroy();
            }
        };
    });

    FEAR.create('isotopeFilter', (GUI) => {
        let $grid;

        return {
            load: () => {
                if (typeof $.fn.isotope !== 'undefined') {
                    $grid = GUI.$('.filter__items').isotope({});

                    GUI.$('.filter__list').on('click', 'li', function () {
                        const filterValue = GUI.$(this).attr('data-filter');
                        $grid.isotope({ filter: filterValue });
                        GUI.emit('filter:changed', { filter: filterValue });
                    });

                    GUI.$('.filter__list').each(function (i, buttonGroup) {
                        const $buttonGroup = GUI.$(buttonGroup);
                        $buttonGroup.on('click', 'li', function () {
                            $buttonGroup.find('.active').removeClass('active');
                            GUI.$(this).addClass('active');
                        });
                    });

                    GUI.emit('isotope:initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if ($grid) {
                    $grid.isotope('destroy');
                }
                GUI.$('.filter__list').off('click');
            }
        };
    });

    FEAR.create('popups', (GUI) => {
        return {
            load: () => {
                if (typeof $.fn.magnificPopup !== 'undefined') {
                    // Video popup
                    GUI.$('.video-popup').magnificPopup({
                        type: 'iframe',
                        iframe: {
                            markup: '<div class="mfp-iframe-scaler">' +
                                '<div class="mfp-close"></div>' +
                                '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>' +
                                '</div>',
                            patterns: {
                                youtube: {
                                    index: 'youtube.com/',
                                    id: 'v=',
                                    src: 'https://www.youtube.com/embed/%id%?autoplay=1'
                                },
                                vimeo: {
                                    index: 'vimeo.com/',
                                    id: '/',
                                    src: '//player.vimeo.com/video/%id%?autoplay=1'
                                },
                                gmaps: {
                                    index: '//maps.google.',
                                    src: '%id%&output=embed'
                                }
                            },
                            srcAction: 'iframe_src'
                        }
                    });

                    // Map popup
                    GUI.$('.map-popup').magnificPopup({
                        disableOn: 700,
                        type: 'iframe',
                        mainClass: 'mfp-fade',
                        removalDelay: 160,
                        preloader: false,
                        fixedContentPos: false
                    });

                    GUI.emit('popups:initialized');
                }

                return Promise.resolve();
            },

            unload: () => {
                if (typeof $.fn.magnificPopup !== 'undefined') {
                    GUI.$('.video-popup').magnificPopup('close');
                    GUI.$('.map-popup').magnificPopup('close');
                }
            }
        };
    });

    FEAR.create('counter', (GUI) => {
        return {
            load: () => {
                if (typeof $.fn.counterUp !== 'undefined') {
                    GUI.$('.count').counterUp({
                        delay: 20,
                        time: 3000
                    });

                    GUI.emit('counter:initialized');
                }

                return Promise.resolve();
            }
        };
    });

    FEAR.create('countdown', (GUI) => {
        let countdownInterval;

        return {
            load: () => {
                const targetDate = new Date('2023-12-01 00:00:00').getTime();

                countdownInterval = setInterval(() => {
                    const currentDate = new Date().getTime();
                    const remainingTime = targetDate - currentDate;

                    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

                    GUI.$('#day').text(days.toString().padStart(2, '0'));
                    GUI.$('#hour').text(hours.toString().padStart(2, '0'));
                    GUI.$('#min').text(minutes.toString().padStart(2, '0'));
                    GUI.$('#sec').text(seconds.toString().padStart(2, '0'));

                    if (remainingTime <= 0) {
                        clearInterval(countdownInterval);
                        GUI.emit('countdown:complete');
                    }
                }, 1000);

                return Promise.resolve();
            },

            unload: () => {
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
            }
        };
    });

    FEAR.create('uiUtilities', (GUI) => {
        return {
            load: () => {
                // Background images
                GUI.$('[data-background]').each(function () {
                    const $this = GUI.$(this);
                    $this.css('background-image', 'url(' + $this.attr('data-background') + ')');
                });

                // Hide & show sidebar
                GUI.$(document).on('click', '#openButton', () => {
                    GUI.$('#targetElement').removeClass('side_bar_hidden');
                    GUI.emit('sidebar:opened');
                });

                GUI.$(document).on('click', '#closeButton', () => {
                    GUI.$('#targetElement').addClass('side_bar_hidden');
                    GUI.emit('sidebar:closed');
                });

                // Radio button toggle
                GUI.$(document).on('click', '.radio-btn span', function () {
                    GUI.$(this).toggleClass('radio-btn-active');
                });

                // Nice select
                if (typeof $.fn.niceSelect !== 'undefined') {
                    GUI.$('select').niceSelect();
                }

                return Promise.resolve();
            },

            unload: () => {
                GUI.$(document).off('click', '#openButton');
                GUI.$(document).off('click', '#closeButton');
                GUI.$(document).off('click', '.radio-btn span');
            }
        };
    });

    FEAR.create('backToTop', (GUI) => {
        let scrollPath, pathLength;

        return {
            load: () => {
                scrollPath = document.querySelector('.scroll-up path');

                if (!scrollPath) {
                    return Promise.resolve();
                }

                pathLength = scrollPath.getTotalLength();
                scrollPath.style.transition = scrollPath.style.WebkitTransition = 'none';
                scrollPath.style.strokeDasharray = pathLength + ' ' + pathLength;
                scrollPath.style.strokeDashoffset = pathLength;
                scrollPath.getBoundingClientRect();
                scrollPath.style.transition = scrollPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';

                const updateScroll = () => {
                    const scroll = GUI.$(window).scrollTop();
                    const height = GUI.$(document).height() - GUI.$(window).height();
                    const scrollProgress = pathLength - (scroll * pathLength) / height;
                    scrollPath.style.strokeDashoffset = scrollProgress;
                };

                updateScroll();
                GUI.$(window).on('scroll', updateScroll);

                const offset = 50;
                GUI.$(window).on('scroll', function () {
                    if (GUI.$(this).scrollTop() > offset) {
                        GUI.$('.scroll-up').addClass('active-scroll');
                    } else {
                        GUI.$('.scroll-up').removeClass('active-scroll');
                    }
                });

                GUI.$('.scroll-up').on('click', (event) => {
                    event.preventDefault();
                    GUI.$('html, body').animate({ scrollTop: 0 }, 950);
                    GUI.emit('backToTop:clicked');
                    return false;
                });

                return Promise.resolve();
            },

            unload: () => {
                GUI.$(window).off('scroll');
                GUI.$('.scroll-up').off('click');
            }
        };
    });

    FEAR.create('cursor', (GUI) => {
        return {
            load: () => {
                const $cursorInner = GUI.$('.cursor-inner');
                const $cursorOuter = GUI.$('.cursor-outer');

                if (!$cursorInner.length || !$cursorOuter.length) {
                    return Promise.resolve();
                }

                const cursorInner = $cursorInner[0];
                const cursorOuter = $cursorOuter[0];

                window.onmousemove = (e) => {
                    cursorOuter.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
                    cursorInner.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
                };

                GUI.$('body').on('mouseenter', 'a, .cursor-pointer', function () {
                    $cursorInner.addClass('cursor-hover');
                    $cursorOuter.addClass('cursor-hover');
                });

                GUI.$('body').on('mouseleave', 'a, .cursor-pointer', function () {
                    if (!(GUI.$(this).is('a') && GUI.$(this).closest('.cursor-pointer').length)) {
                        $cursorInner.removeClass('cursor-hover');
                        $cursorOuter.removeClass('cursor-hover');
                    }
                });

                cursorInner.style.visibility = 'visible';
                cursorOuter.style.visibility = 'visible';

                return Promise.resolve();
            },

            unload: () => {
                window.onmousemove = null;
                GUI.$('body').off('mouseenter', 'a, .cursor-pointer');
                GUI.$('body').off('mouseleave', 'a, .cursor-pointer');
            }
        };
    });

    FEAR.create('wowAnimation', (GUI) => {
        let wowInstance;

        return {
            load: () => {
                if (typeof WOW !== 'undefined') {
                    wowInstance = new WOW();
                    wowInstance.init();
                    GUI.emit('wow:initialized');
                }

                return Promise.resolve();
            }
        };
    });

    FEAR.create('themeManager', (GUI) => {
        return {
            load: () => {
                // Theme color setter
                GUI.setThemeColor = (color) => {
                    const root = document.documentElement;
                    root.setAttribute('data-theme', color);
                    GUI.emit('theme:changed', { color });
                };

                // Listen for theme change requests
                GUI.add('theme:change', (data) => {
                    if (data && data.color) {
                        GUI.setThemeColor(data.color);
                    }
                });

                return Promise.resolve();
            }
        };
    });

    $(document).ready(() => {
        FEAR.start()
            .then(() => {
                console.log('✓ Odor Vape Store initialized with FEAR GUI Framework');
                FEAR.broker.emit('app:ready', {
                    version: '2.0.0',
                    timestamp: new Date().toISOString()
                });
            })
            .catch((err) => {
                console.log('Failed to start CBNC App', err);
            })
    });

})(jQuery, window);