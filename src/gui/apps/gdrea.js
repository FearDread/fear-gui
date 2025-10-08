(($, window, undefined) => {
// ==============================
// ============================================
// Initialize GUI
// ============================================
const GUI = new $.FEAR();
console.log('gui? ', GUI)

// ============================================
// jQuery Sandbox Plugin
// ============================================
GUI.use((gui, options) => {
    return {
        load: (sandbox) => {
            // Extend sandbox with jQuery helpers
            sandbox.$ = (selector) => $(selector);
            sandbox.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            sandbox.fetch = async (url, opts = {}) => {
                const { method = 'GET', data = null, dataType = 'html', cache = false } = opts;
                
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url,
                        method,
                        data,
                        dataType,
                        cache,
                        success: (response) => resolve({ data: response }),
                        error: (xhr, status, error) => reject({ xhr, status, error })
                    });
                });
            };
        }
    };
});

// ============================================
// Core App Module
// ============================================
GUI.create('FearCore', (sandbox) => {
    
    const createPreloader = () => ({
        init: async () => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const $preloader = sandbox.$('#preloader');
            
            if (!isMobile) {
                await sandbox.timeout(800);
                $preloader.addClass('preloaded');
                await sandbox.timeout(1200);
                $preloader.remove();
            } else {
                $preloader.remove();
            }
            return true;
        }
    });

    const createModalManager = () => {
        let $modalBox = null;

        return {
            init: async () => {
                const modalHtml = `
                    <div class="fear_modalbox">
                        <div class="box_inner">
                            <div class="close">
                                <a href="#"><i class="icon-cancel"></i></a>
                            </div>
                            <div class="description_wrap"></div>
                        </div>
                    </div>`;
                
                sandbox.$('.fear_all_wrap').prepend(modalHtml);
                $modalBox = sandbox.$('.fear_modalbox');
                
                // Bind close event
                $modalBox.find('.close a').on('click', (e) => {
                    e.preventDefault();
                    this.close();
                });
                
                return true;
            },

            open: async (content) => {
                $modalBox.find('.description_wrap').html(content);
                $modalBox.addClass('opened');
                return true;
            },

            close: async () => {
                $modalBox.removeClass('opened');
                $modalBox.find('.description_wrap').html('');
                return true;
            }
        };
    };

    const createMobileMenu = () => ({
        init: async () => {
            const $hamburger = sandbox.$('.fear_topbar .trigger .hamburger');
            const $mobileMenu = sandbox.$('.fear_mobile_menu');
            const $menuItems = sandbox.$('.fear_mobile_menu ul li a');

            const toggleMenu = (e) => {
                e.preventDefault();
                if ($hamburger.hasClass('is-active')) {
                    $hamburger.removeClass('is-active');
                    $mobileMenu.removeClass('opened');
                } else {
                    $hamburger.addClass('is-active');
                    $mobileMenu.addClass('opened');
                }
            };

            const closeMenu = () => {
                $hamburger.removeClass('is-active');
                $mobileMenu.removeClass('opened');
            };

            $hamburger.on('click', toggleMenu);
            $menuItems.on('click', closeMenu);
            
            return true;
        }
    });

    return {
        load: async (options) => {
            sandbox.log('FearCore: Loading...');
            
            const preloader = createPreloader();
            const modalManager = createModalManager();
            const mobileMenu = createMobileMenu();

            try {
                await preloader.init();
                await modalManager.init();
                await mobileMenu.init();
                
                // Store components via registry
                sandbox.set('preloader', preloader);
                sandbox.set('modal', modalManager);
                sandbox.set('mobileMenu', mobileMenu);
                
                sandbox.log('FearCore: Loaded successfully');
            } catch (err) {
                sandbox.warn('FearCore load failed:', err);
                throw err;
            }
        },
        
        unload: () => {
            sandbox.log('FearCore: Unloading...');
        }
    };
});

// ============================================
// Router Module
// ============================================
GUI.create('FearRouter', (sandbox) => {
    
    const FearRouter = function() {
        this.routes = {
            home: { name: 'home', html: null, data: null },
            about: { name: 'about', html: null, data: null },
            works: { name: 'works', html: null, data: null },
            github: { name: 'github', html: null, data: null },
            contact: { name: 'contact', html: null, data: null }
        };

        return {
            init: async () => {
                sandbox.log('Router: Initializing...');
                
                // Bind hash change events
                $(window).on('hashchange', () => this.route());
                $(window).on('popstate', () => this.route());
                
                // Trigger initial route
                await this.route();
                return true;
            },

            route: async () => {
                let loc = window.location.hash.replace("#", "");
                if (loc === '') loc = 'home';

                const route = this.routes[loc] || this.routes['home'];
                
                if (route.html !== null) {
                    await this.render(route);
                } else {
                    await this.fetch(route);
                }
            },

            fetch: async (route) => {
                try {
                    const response = await sandbox.fetch(`js/fragments/${route.name}.html`, { 
                        cache: true 
                    });
                    route.html = response.data;
                    await this.render(route);
                } catch (error) {
                    sandbox.warn(`Error loading template for ${route.name}:`, error);
                    throw error;
                }
            },

            fetchGitProfile: async () => {
                try {
                    const response = await sandbox.fetch('https://api.github.com/users/FearDread');
                    sandbox.log('GitHub data loaded:', response.data);
                    return response.data;
                } catch (error) {
                    sandbox.warn('Error loading GitHub profile:', error);
                    throw error;
                }
            },

            render: async (source) => {
                const $container = sandbox.$('.fear_container');
                
                try {
                    // Fade out
                    await $container.animate({ opacity: 0 }, 200).promise();
                    
                    // Update content
                    $container.html(source.html);
                    
                    // Fade in
                    await $container.animate({ opacity: 1 }, 200).promise();
                    
                    // Emit route rendered event
                    sandbox.emit('route:rendered', source);
                } catch (err) {
                    // Fallback without animation
                    $container.html(source.html);
                    sandbox.emit('route:rendered', source);
                }
            }
        };
    };

    return {
        load: async (options) => {
            sandbox.log('FearRouter: Loading...');
            
            const router = new FearRouter();
            await router.init()
                .then(() => {
                    sandbox.set('router', router);
                    sandbox.log('FearRouter: Loaded successfully');
                })
                .catch((err) => {
                    sandbox.warn('FearRouter load failed:', err);
                    throw err;
                });
        },
        
        unload: () => {
            sandbox.log('FearRouter: Unloading...');
            $(window).off('hashchange popstate');
        }
    };
});

// ============================================
// Methods Module
// ============================================
GUI.create('FearMethods', (sandbox) => {
    
    const createMethodsManager = () => ({
        imgToSvg: async () => {
            const $images = sandbox.$('img.svg');
            const promises = [];

            $images.each((index, img) => {
                const $img = $(img);
                const imgClass = $img.attr('class');
                const imgURL = $img.attr('src');

                const promise = sandbox.fetch(imgURL, { dataType: 'xml' })
                    .then(response => {
                        const $svg = $(response.data).find('svg');
                        if (imgClass) {
                            $svg.attr('class', `${imgClass} replaced-svg`);
                        }
                        $svg.removeAttr('xmlns:a');
                        $img.replaceWith($svg);
                    })
                    .catch(err => sandbox.warn('SVG conversion failed for:', imgURL, err));
                
                promises.push(promise);
            });

            await Promise.all(promises);
        },

        applyImages: async () => {
            const $elements = sandbox.$('*[data-img-url]');
            
            $elements.each((index, element) => {
                const $el = $(element);
                const url = $el.data('img-url');
                $el.css('background-image', `url(${url})`);
            });
        },

        bindLocationLinks: async () => {
            const $buttons = sandbox.$('.href_location');

            $buttons.on('click', (e) => {
                e.preventDefault();
                const address = $(e.currentTarget).text().replace(/\s/g, '+');
                window.open(`https://maps.google.com/?q=${address}`);
            });
        },

        initCursor: async () => {
            const $cursor = sandbox.$('.mouse-cursor');
            
            if ($cursor.length === 0) return false;

            const cursorInner = document.querySelector('.cursor-inner');
            const cursorOuter = document.querySelector('.cursor-outer');
            
            if (!cursorInner || !cursorOuter) return false;

            // Subscribe to cursor events via broker
            sandbox.listen('cursor:move', (e) => {
                cursorInner.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
                cursorOuter.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            });
            sandbox.listen('cursor:hover:enter', () => {
                cursorInner.classList.add('cursor-hover');
                cursorOuter.classList.add('cursor-hover');
            });
            sandbox.listen('cursor:hover:leave', () => {
                cursorInner.classList.remove('cursor-hover');
                cursorOuter.classList.remove('cursor-hover');
            });

            // Wire up DOM events to emit broker events
            $(window).on('mousemove', (e) => {
                sandbox.emit('cursor:move', { 
                    clientX: e.clientX, 
                    clientY: e.clientY 
                });
            });

            $(document.body).on('mouseenter', 'a, .fear_topbar .trigger, .cursor-pointer', () => 
                sandbox.emit('cursor:hover:enter')
            );
            $(document.body).on('mouseleave', 'a, .fear_topbar .trigger, .cursor-pointer', () => 
                sandbox.emit('cursor:hover:leave')
            );

            cursorInner.style.visibility = 'visible';
            cursorOuter.style.visibility = 'visible';
            
            return true;
        },

        initContactForm: async () => {
            const $submitBtn = sandbox.$('.contact_form #send_message');
            
            $submitBtn.on('click', async (e) => {
                e.preventDefault();
                
                const formData = {
                    name: sandbox.$('.contact_form #name').val(),
                    email: sandbox.$('.contact_form #email').val(),
                    message: sandbox.$('.contact_form #message').val(),
                    subject: sandbox.$('.contact_form #subject').val()
                };

                const $returnMessage = sandbox.$('.contact_form .returnmessage');
                const successMsg = $returnMessage.data('success');

                $returnMessage.empty();

                // Validation
                if (!formData.name || !formData.email || !formData.message) {
                    sandbox.$('div.empty_notice').slideDown(500).delay(2000).slideUp(500);
                    return;
                }

                try {
                    const response = await sandbox.fetch('http://fear.master.com/fear/api/mail/contact', {
                        method: 'POST',
                        data: {
                            ajax_name: formData.name,
                            ajax_email: formData.email,
                            ajax_message: formData.message,
                            ajax_subject: formData.subject,
                            ajax_source: 'gdrea.fear@gmail.com'
                        }
                    });
                    
                    $returnMessage.html(response.data);
                    
                    if ($returnMessage.find('.contact_error').length) {
                        $returnMessage.slideDown(500).delay(2000).slideUp(500);
                    } else {
                        $returnMessage.html(`<span class='contact_success'>${successMsg}</span>`);
                        $returnMessage.slideDown(500).delay(4000).slideUp(500);
                        sandbox.$('#contact_form')[0].reset();
                    }
                } catch (err) {
                    sandbox.warn('Contact form submission failed:', err);
                    $returnMessage.html('<span class="contact_error">Submission failed. Please try again.</span>');
                    $returnMessage.slideDown(500).delay(3000).slideUp(500);
                }
            });
        }
    });

    return {
        load: async (options) => {
            sandbox.log('FearMethods: Loading...');
            
            const methods = createMethodsManager();
            
            // Store methods reference
            sandbox.set('methods', methods);
            
            // Listen for route changes to reinitialize methods
            sandbox.listen('route:rendered', async () => {
                await methods.imgToSvg();
                await methods.applyImages();
                await methods.bindLocationLinks();
            });
            
            sandbox.log('FearMethods: Loaded successfully');
        },
        
        unload: () => {
            sandbox.log('FearMethods: Unloading...');
        }
    };
});

// ============================================
// Navigation Module
// ============================================
GUI.create('FearNavigation', (sandbox) => {
    
    return {
        load: async (options) => {
            sandbox.log('FearNavigation: Loading...');
            
            const $buttons = sandbox.$('.transition_link a');
            const $listItems = sandbox.$('.transition_link li');

            $buttons.on('click', (e) => {
                const $element = $(e.currentTarget);
                const $parent = $element.closest('li');

                if (!$parent.hasClass('active')) {
                    $listItems.removeClass('active');
                    $parent.addClass('active');
                }
            });
            
            sandbox.log('FearNavigation: Loaded successfully');
        },
        
        unload: () => {
            sandbox.log('FearNavigation: Unloading...');
            sandbox.$('.transition_link a').off('click');
        }
    };
});

// ============================================
// Bootstrap Application
// ============================================
GUI.configure({
    logLevel: 1,
    name: 'GDREA - SPA',
    mode: 'single',
    animations: true
});

GUI.start(['FearCore', 'FearRouter', 'FearMethods', 'FearNavigation'])
    .then(() => {
        console.log('%c FEAR SPA INITIALIZED ', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold;');
    })
    .catch(err => {
        console.error('Failed to start application:', err);
    });

})(jQuery, window);