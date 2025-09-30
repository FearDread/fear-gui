export const StargazeModule = $.FEAR.create('Stargaze', (FEAR) => {

    /**
     * Create a star object with random properties
     * @param {HTMLCanvasElement} canvas - canvas element
     * @param {object} config - configuration object
     * @return {object} star object with methods
     */
    function createStar(canvas, config) {
        const star = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (config.velocity - (Math.random() * 0.5)),
            vy: (config.velocity - (Math.random() * 0.5)),
            radius: Math.random() * config.star.width
        };

        return {
            ...star,

            /**
             * Draw the star on canvas
             * @param {CanvasRenderingContext2D} context - canvas context
             * @return {Promise<object>} resolves with star object
             */
            create: function(context) {
                return new Promise((resolve) => {
                    try {
                        context.beginPath();
                        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                        context.fill();
                        resolve(this);
                    } catch (error) {
                        resolve(this);
                    }
                });
            },

            /**
             * Update star position and handle boundary collisions
             * @param {HTMLCanvasElement} canvas - canvas element
             * @return {Promise<object>} resolves with updated star
             */
            update: function(canvas) {
                return new Promise((resolve) => {
                    // Handle boundary collisions
                    if (this.y < 0 || this.y > canvas.height) {
                        this.vy = -this.vy;
                    }
                    if (this.x < 0 || this.x > canvas.width) {
                        this.vx = -this.vx;
                    }

                    // Update position
                    this.x += this.vx;
                    this.y += this.vy;

                    resolve(this);
                });
            }
        };
    }

    /**
     * Create line drawing functionality
     * @param {CanvasRenderingContext2D} context - canvas context
     * @param {object} config - configuration object
     * @return {object} line drawing interface
     */
    function createLineDrawer(context, config) {
        return {
            /**
             * Draw lines between nearby stars within radius of mouse position
             * @param {Array} stars - array of star objects
             * @return {Promise<boolean>} resolves when lines are drawn
             */
            drawConnections: function(stars) {
                return new Promise((resolve) => {
                    try {
                        const length = stars.length;

                        for (let i = 0; i < length; i++) {
                            for (let j = i + 1; j < length; j++) {
                                const iStar = stars[i];
                                const jStar = stars[j];

                                // Check if stars are close enough to each other
                                const dx = iStar.x - jStar.x;
                                const dy = iStar.y - jStar.y;
                                
                                if (Math.abs(dx) < config.distance && Math.abs(dy) < config.distance) {
                                    // Check if at least one star is within mouse radius
                                    const iInRadius = this.isStarInRadius(iStar, config);
                                    const jInRadius = this.isStarInRadius(jStar, config);

                                    if (iInRadius || jInRadius) {
                                        context.beginPath();
                                        context.moveTo(iStar.x, iStar.y);
                                        context.lineTo(jStar.x, jStar.y);
                                        context.stroke();
                                        context.closePath();
                                    }
                                }
                            }
                        }

                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                });
            },

            /**
             * Check if star is within mouse interaction radius
             * @param {object} star - star object
             * @param {object} config - configuration object
             * @return {boolean} true if star is in radius
             */
            isStarInRadius: function(star, config) {
                const dx = star.x - config.position.x;
                const dy = star.y - config.position.y;
                return Math.abs(dx) < config.radius && Math.abs(dy) < config.radius;
            }
        };
    }

    /**
     * Create animation loop manager
     * @return {object} animation interface
     */
    function createAnimationLoop() {
        let animationId = null;
        let isRunning = false;

        return {
            /**
             * Start animation loop
             * @param {function} callback - function to call each frame
             * @return {Promise<boolean>} resolves when loop starts
             */
            start: function(callback) {
                return new Promise((resolve) => {
                    if (isRunning) {
                        resolve(false);
                        return;
                    }

                    isRunning = true;

                    const loop = () => {
                        if (!isRunning) {
                            resolve(true);
                            return;
                        }

                        Promise.resolve(callback())
                            .then(() => {
                                animationId = window.requestAnimationFrame(loop);
                            })
                            .catch(() => {
                                // Continue loop even if callback fails
                                animationId = window.requestAnimationFrame(loop);
                            });
                    };

                    loop();
                    resolve(true);
                });
            },

            /**
             * Stop animation loop
             * @return {Promise<boolean>} resolves when loop stops
             */
            stop: function() {
                return new Promise((resolve) => {
                    isRunning = false;
                    if (animationId) {
                        window.cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                    resolve(true);
                });
            },

            /**
             * Check if animation is running
             * @return {boolean} true if running
             */
            isRunning: function() {
                return isRunning;
            }
        };
    }

    /**
     * Create event handler for mouse interaction
     * @param {jQuery} $canvas - jQuery wrapped canvas element
     * @param {object} config - configuration object
     * @return {object} event handler interface
     */
    function createEventHandler($canvas, config) {
        let mouseHandler = null;

        return {
            /**
             * Bind mouse events
             * @return {Promise<boolean>} resolves when events are bound
             */
            bindEvents: function() {
                return new Promise((resolve) => {
                    try {
                        mouseHandler = (e) => {
                            const offset = $canvas.offset();
                            config.position.x = e.pageX - offset.left;
                            config.position.y = e.pageY - offset.top;
                        };

                        FEAR.$(document).on('mousemove', mouseHandler);
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                });
            },

            /**
             * Unbind mouse events
             * @return {Promise<boolean>} resolves when events are unbound
             */
            unbindEvents: function() {
                return new Promise((resolve) => {
                    try {
                        if (mouseHandler) {
                            FEAR.$(document).off('mousemove', mouseHandler);
                            mouseHandler = null;
                        }
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                });
            }
        };
    }

    /**
     * Create the main Stargaze interface
     * @param {HTMLCanvasElement} canvas - canvas element
     * @param {object} options - user options
     * @return {object} Stargaze interface
     */
    function createStargaze(canvas, options) {
        const $canvas = FEAR.$(canvas);
        const context = canvas ? canvas.getContext('2d') : null;
        
        const defaults = {
            star: {
                color: 'rgba(255, 255, 255, .7)',
                width: 1
            },
            line: {
                color: 'rgba(255, 255, 255, .7)',
                width: 0.2
            },
            position: {
                x: 0, 
                y: 0 
            },
            width: window.innerWidth,
            height: window.innerHeight,
            velocity: 0.1,
            length: 100,
            distance: 100,
            radius: 150,
            stars: []
        };

        const config = FEAR.Utils.merge(defaults, options || {});
        const lineDrawer = createLineDrawer(context, config);
        const animationLoop = createAnimationLoop();
        const eventHandler = createEventHandler($canvas, config);

        return {
            /**
             * Set canvas dimensions
             * @return {Promise<boolean>} resolves when canvas is configured
             */
            setCanvas: function() {
                return new Promise((resolve) => {
                    try {
                        if (canvas) {
                            canvas.width = config.width;
                            canvas.height = config.height;
                        }
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                });
            },

            /**
             * Set canvas context properties
             * @return {Promise<boolean>} resolves when context is configured
             */
            setContext: function() {
                return new Promise((resolve) => {
                    try {
                        if (context) {
                            context.fillStyle = config.star.color;
                            context.strokeStyle = config.line.color;
                            context.lineWidth = config.line.width;
                        }
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                });
            },

            /**
             * Set initial mouse position
             * @return {Promise<boolean>} resolves when position is set
             */
            setInitialPosition: function() {
                return new Promise((resolve) => {
                    if (!options || !options.hasOwnProperty('position')) {
                        config.position = {
                            x: canvas.width * 0.5,
                            y: canvas.height * 0.5
                        };
                    }
                    resolve(true);
                });
            },

            /**
             * Create all stars
             * @return {Promise<Array>} resolves with array of stars
             */
            createStars: function() {
                return new Promise((resolve) => {
                    const stars = [];
                    
                    for (let i = 0; i < config.length; i++) {
                        stars.push(createStar(canvas, config));
                    }
                    
                    config.stars = stars;
                    resolve(stars);
                });
            },

            /**
             * Render one frame of the animation
             * @return {Promise<boolean>} resolves when frame is rendered
             */
            renderFrame: function() {
                return new Promise((resolve) => {
                    if (!context || !canvas) {
                        resolve(false);
                        return;
                    }

                    // Clear canvas
                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Create and animate stars
                    const starPromises = config.stars.map(star => {
                        return star.update(canvas)
                            .then(updatedStar => updatedStar.create(context));
                    });

                    Promise.all(starPromises)
                        .then(() => lineDrawer.drawConnections(config.stars))
                        .then(() => resolve(true))
                        .catch(() => resolve(false));
                });
            },

            /**
             * Start the animation
             * @return {Promise<boolean>} resolves when animation starts
             */
            start: function() {
                return animationLoop.start(() => this.renderFrame());
            },

            /**
             * Stop the animation
             * @return {Promise<boolean>} resolves when animation stops
             */
            stop: function() {
                return animationLoop.stop();
            },

            /**
             * Initialize the stargaze effect
             * @return {Promise<object>} resolves with stargaze instance
             */
            init: function() {
                return this.setCanvas()
                    .then(() => this.setContext())
                    .then(() => this.setInitialPosition())
                    .then(() => this.createStars())
                    .then(() => eventHandler.bindEvents())
                    .then(() => this.start())
                    .then(() => this)
                    .catch((error) => {
                        FEAR.warn('Stargaze initialization failed:', error);
                        return this;
                    });
            },

            /**
             * Destroy the stargaze effect and cleanup
             * @return {Promise<boolean>} resolves when cleanup is complete
             */
            destroy: function() {
                return this.stop()
                    .then(() => eventHandler.unbindEvents())
                    .then(() => {
                        config.stars = [];
                        if (context) {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                        }
                        return true;
                    })
                    .catch(() => true);
            },

            /**
             * Update configuration
             * @param {object} newOptions - new options to merge
             * @return {Promise<object>} resolves with updated config
             */
            updateConfig: function(newOptions) {
                return new Promise((resolve) => {
                    if (newOptions && typeof newOptions === 'object') {
                        Object.assign(config, newOptions);
                        
                        // Update context if colors changed
                        if (context && (newOptions.star || newOptions.line)) {
                            this.setContext();
                        }
                    }
                    resolve(config);
                });
            },

            // Expose configuration for external access
            getConfig: function() {
                return { ...config };
            },

            // Expose animation state
            isRunning: function() {
                return animationLoop.isRunning();
            }
        };
    }

    return {
        load: function(api) {
            return Promise.resolve()
                .then(() => {
                    // Add stargaze factory to api
                    api.stargaze = {
                        create: createStargaze
                    };

                    return api;
                })
                .catch((error) => {
                    api.warn('Stargaze module load failed:', error);
                    throw error;
                });
        },

        unload: function(api) {
            return Promise.resolve()
                .then(() => {
                    if (api.stargaze) {
                        delete api.stargaze;
                    }
                })
                .catch(() => {
                    // Ensure cleanup even if error occurs
                    if (api.stargaze) {
                        delete api.stargaze;
                    }
                });
        },

        // jQuery plugin interface
        fn: function($el, options) {
            if (!$el || !$el[0]) {
                return Promise.reject(new Error('Canvas element is required'));
            }

            const stargaze = createStargaze($el[0], options);
            
            return stargaze.init()
                .then(() => stargaze)
                .catch((error) => {
                    FEAR.warn('Stargaze plugin initialization failed:', error);
                    throw error;
                });
        }
    };
}).start('Stargaze');