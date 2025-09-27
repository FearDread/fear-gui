
export const Cellar = ((FEAR) => {

    /* Private utility functions */
    
    /**
     * Check for browser compatibility of passed storage object
     * @param {string} storageType - the storage type to check ('localStorage' or 'sessionStorage')
     * @return {boolean} true if storage is supported
     */
    function checkStorage(storageType) {
        const testKey = 'gui_storage_test';

        try {
            if (typeof window === 'undefined' || !window[storageType]) {
                return false;
            }

            const storage = window[storageType];
            storage.setItem(testKey, testKey);
            storage.removeItem(testKey);

            return true;

        } catch(error) {
            return false;
        }
    }

    /**
     * Safe JSON parse with fallback
     * @param {string} value - JSON string to parse
     * @return {*} parsed value or original string if parsing fails
     */
    function safeParse(value) {
        if (value === null || value === undefined) {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch(error) {
            return value;
        }
    }

    /**
     * Safe JSON stringify
     * @param {*} value - value to stringify
     * @return {string} stringified value
     */
    function safeStringify(value) {
        if (typeof value === 'string') {
            return value;
        }

        try {
            return JSON.stringify(value);
        } catch(error) {
            return String(value);
        }
    }

    /**
     * Get all keys from storage
     * @param {Storage} storage - storage object
     * @return {Array<string>} array of keys
     */
    function getStorageKeys(storage) {
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
            keys.push(storage.key(i));
        }
        return keys;
    }

    /**
     * Check if a value is considered empty
     * @param {*} value - value to check
     * @return {boolean} true if empty
     */
    function isValueEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Create storage interface for a specific storage type
     * @param {string} storageType - 'localStorage' or 'sessionStorage'
     * @param {object} utils - utility functions
     * @return {object} storage interface
     */
    function createStorageInterface(storageType, utils) {
        const storage = window[storageType];
        const cached = new Map();

        return {
            /**
             * Get value from storage with support for nested keys
             * @param {...string|Array} keyPath - key path to retrieve
             * @return {Promise<*>} resolves with the value(s)
             */
            get: function(...keyPath) {
                return new Promise((resolve, reject) => {
                    try {
                        if (keyPath.length === 0) {
                            reject(new Error('At least one key must be provided'));
                            return;
                        }

                        const firstKey = keyPath[0];
                        const restKeys = keyPath.slice(1);

                        // Handle array of keys
                        if (Array.isArray(firstKey)) {
                            const result = {};
                            firstKey.forEach(key => {
                                const value = storage.getItem(key);
                                result[key] = safeParse(value);
                            });
                            resolve(result);
                            return;
                        }

                        // Get base value
                        const baseValue = storage.getItem(firstKey);
                        if (baseValue === null) {
                            resolve(null);
                            return;
                        }

                        let parsedValue = safeParse(baseValue);

                        // Navigate nested path
                        if (restKeys.length > 0) {
                            for (let i = 0; i < restKeys.length - 1; i++) {
                                const key = restKeys[i];
                                if (!parsedValue || typeof parsedValue !== 'object') {
                                    resolve(undefined);
                                    return;
                                }
                                parsedValue = parsedValue[key];
                            }

                            const lastKey = restKeys[restKeys.length - 1];
                            
                            // Handle array of final keys
                            if (Array.isArray(lastKey)) {
                                const result = {};
                                lastKey.forEach(key => {
                                    result[key] = parsedValue && parsedValue[key];
                                });
                                resolve(result);
                            } else {
                                resolve(parsedValue && parsedValue[lastKey]);
                            }
                        } else {
                            resolve(parsedValue);
                        }

                    } catch(error) {
                        reject(error);
                    }
                });
            },

            /**
             * Set value in storage with support for nested keys
             * @param {string|object} key - key name or object of key-value pairs
             * @param {*} value - value to set
             * @param {...string} nestedKeys - additional keys for nested setting
             * @return {Promise<*>} resolves with the set value
             */
            set: function(key, value, ...nestedKeys) {
                return new Promise((resolve, reject) => {
                    try {
                        // Handle object of key-value pairs
                        if (typeof key === 'object' && key !== null) {
                            Object.entries(key).forEach(([k, v]) => {
                                storage.setItem(k, safeStringify(v));
                            });
                            resolve(key);
                            return;
                        }

                        if (typeof key !== 'string') {
                            reject(new Error('Key must be a string or object'));
                            return;
                        }

                        // Simple key-value set
                        if (nestedKeys.length === 0) {
                            storage.setItem(key, safeStringify(value));
                            resolve(value);
                            return;
                        }

                        // Nested key setting
                        let baseValue;
                        try {
                            baseValue = safeParse(storage.getItem(key)) || {};
                        } catch(error) {
                            baseValue = {};
                        }

                        let currentLevel = baseValue;

                        // Navigate/create nested structure
                        for (let i = 0; i < nestedKeys.length - 1; i++) {
                            const nestedKey = nestedKeys[i];
                            if (!currentLevel[nestedKey] || typeof currentLevel[nestedKey] !== 'object') {
                                currentLevel[nestedKey] = {};
                            }
                            currentLevel = currentLevel[nestedKey];
                        }

                        // Set the final value
                        const finalKey = nestedKeys[nestedKeys.length - 1];
                        currentLevel[finalKey] = value;

                        // Save back to storage
                        storage.setItem(key, safeStringify(baseValue));
                        resolve(baseValue);

                    } catch(error) {
                        reject(error);
                    }
                });
            },

            /**
             * Check if key exists and has a non-null/undefined value
             * @param {...string|Array} keyPath - key path to check
             * @return {Promise<boolean>} resolves with existence status
             */
            isSet: function(...keyPath) {
                return this.get(...keyPath)
                    .then(value => {
                        if (Array.isArray(keyPath[0]) || (keyPath.length > 1 && Array.isArray(keyPath[keyPath.length - 1]))) {
                            // Handle multiple keys - all must exist
                            if (typeof value === 'object' && value !== null) {
                                return Object.values(value).every(v => v !== null && v !== undefined);
                            }
                            return false;
                        }
                        return value !== null && value !== undefined;
                    })
                    .catch(() => false);
            },

            /**
             * Check if storage or specific key is empty
             * @param {...string} keyPath - optional key path to check
             * @return {Promise<boolean>} resolves with empty status
             */
            isEmpty: function(...keyPath) {
                // Check if entire storage is empty
                if (keyPath.length === 0) {
                    return Promise.resolve(storage.length === 0);
                }

                return this.get(...keyPath)
                    .then(value => {
                        if (Array.isArray(keyPath[0]) || (keyPath.length > 1 && Array.isArray(keyPath[keyPath.length - 1]))) {
                            // Handle multiple keys - all must be empty
                            if (typeof value === 'object' && value !== null) {
                                return Object.values(value).every(v => isValueEmpty(v));
                            }
                            return isValueEmpty(value);
                        }
                        return isValueEmpty(value);
                    })
                    .catch(() => true);
            },

            /**
             * Remove key(s) from storage
             * @param {string|Array} key - key or array of keys to remove
             * @param {...string} nestedKeys - additional keys for nested removal
             * @return {Promise<boolean>} resolves when complete
             */
            remove: function(key, ...nestedKeys) {
                return new Promise((resolve, reject) => {
                    try {
                        // Handle array of keys
                        if (Array.isArray(key)) {
                            key.forEach(k => storage.removeItem(k));
                            resolve(true);
                            return;
                        }

                        if (typeof key !== 'string') {
                            reject(new Error('Key must be a string or array'));
                            return;
                        }

                        // Simple key removal
                        if (nestedKeys.length === 0) {
                            storage.removeItem(key);
                            resolve(true);
                            return;
                        }

                        // Nested key removal
                        const baseValue = safeParse(storage.getItem(key));
                        if (!baseValue || typeof baseValue !== 'object') {
                            reject(new Error(`Key '${key}' does not exist or is not an object`));
                            return;
                        }

                        let currentLevel = baseValue;

                        // Navigate to the parent of the key to remove
                        for (let i = 0; i < nestedKeys.length - 1; i++) {
                            const nestedKey = nestedKeys[i];
                            if (!currentLevel[nestedKey]) {
                                reject(new Error(`Nested key path does not exist`));
                                return;
                            }
                            currentLevel = currentLevel[nestedKey];
                        }

                        const finalKey = nestedKeys[nestedKeys.length - 1];
                        
                        // Handle array of final keys
                        if (Array.isArray(finalKey)) {
                            finalKey.forEach(k => delete currentLevel[k]);
                        } else {
                            delete currentLevel[finalKey];
                        }

                        // Save back to storage
                        storage.setItem(key, safeStringify(baseValue));
                        resolve(true);

                    } catch(error) {
                        reject(error);
                    }
                });
            },

            /**
             * Remove all items from storage
             * @return {Promise<boolean>} resolves when complete
             */
            removeAll: function() {
                return new Promise((resolve) => {
                    try {
                        storage.clear();
                        resolve(true);
                    } catch(error) {
                        resolve(false);
                    }
                });
            },

            /**
             * Get all keys from storage
             * @param {string} baseKey - optional base key to get nested keys from
             * @return {Promise<Array>} resolves with array of keys
             */
            keys: function(baseKey) {
                if (!baseKey) {
                    return Promise.resolve(getStorageKeys(storage));
                }

                return this.get(baseKey)
                    .then(value => {
                        if (value && typeof value === 'object') {
                            return Object.keys(value);
                        }
                        return [];
                    })
                    .catch(() => []);
            },

            /**
             * Get storage size information
             * @return {Promise<object>} resolves with size information
             */
            size: function() {
                return new Promise((resolve) => {
                    try {
                        const keys = getStorageKeys(storage);
                        let totalSize = 0;
                        
                        keys.forEach(key => {
                            const value = storage.getItem(key);
                            if (value) {
                                totalSize += key.length + value.length;
                            }
                        });

                        resolve({
                            keys: keys.length,
                            bytes: totalSize,
                            kb: Math.round(totalSize / 1024 * 100) / 100
                        });
                    } catch(error) {
                        resolve({ keys: 0, bytes: 0, kb: 0 });
                    }
                });
            },

            /**
             * Clear cached values
             * @return {Promise<boolean>} resolves when complete
             */
            clearCache: function() {
                return new Promise((resolve) => {
                    cached.clear();
                    resolve(true);
                });
            }
        };
    }

    /**
     * Create unified cellar interface
     * @param {object} utils - utility functions
     * @return {object} cellar interface
     */
    function createCellarInterface(utils) {
        const localStorage = createStorageInterface('localStorage', utils);
        const sessionStorage = createStorageInterface('sessionStorage', utils);
        let currentType = 'localStorage';

        const getCurrentStorage = () => {
            return currentType === 'localStorage' ? localStorage : sessionStorage;
        };

        return {
            /**
             * Switch storage type
             * @param {string} type - 'localStorage' or 'sessionStorage'
             * @return {object} this interface for chaining
             */
            type: function(type) {
                if (type === 'localStorage' || type === 'sessionStorage') {
                    currentType = type;
                }
                return this;
            },

            // Proxy methods to current storage
            get: function(...args) { 
                return getCurrentStorage().get(...args); 
            },
            
            set: function(...args) { 
                return getCurrentStorage().set(...args); 
            },
            
            isSet: function(...args) { 
                return getCurrentStorage().isSet(...args); 
            },
            
            isEmpty: function(...args) { 
                return getCurrentStorage().isEmpty(...args); 
            },
            
            remove: function(...args) { 
                return getCurrentStorage().remove(...args); 
            },
            
            removeAll: function() { 
                return getCurrentStorage().removeAll(); 
            },
            
            keys: function(...args) { 
                return getCurrentStorage().keys(...args); 
            },
            
            size: function() { 
                return getCurrentStorage().size(); 
            },
            
            clearCache: function() { 
                return getCurrentStorage().clearCache(); 
            },

            /**
             * Convenience method for localStorage operations
             * @return {object} localStorage interface
             */
            local: function() {
                return localStorage;
            },

            /**
             * Convenience method for sessionStorage operations
             * @return {object} sessionStorage interface
             */
            session: function() {
                return sessionStorage;
            },

            // Direct access properties
            localStorage: localStorage,
            sessionStorage: sessionStorage,
            ls: localStorage,
            ss: sessionStorage
        };
    }

    // Plugin interface
    return {
        load: function(GUI) {
            // Check storage support
            const localStorageSupported = checkStorage('localStorage');
            const sessionStorageSupported = checkStorage('sessionStorage');

            if (!localStorageSupported && !sessionStorageSupported) {
                const error = new Error('This browser does not support web storage');
                GUI.warn('Storage plugin: Browser storage not supported');
                return Promise.reject(error);
            }

            return Promise.resolve()
                .then(() => {
                    if (!localStorageSupported) {
                        GUI.warn('Storage plugin: localStorage not supported');
                    }

                    if (!sessionStorageSupported) {
                        GUI.warn('Storage plugin: sessionStorage not supported');
                    }

                    // Create cellar interface
                    GUI.cellar = createCellarInterface(GUI.Utils);

                    return GUI.cellar;
                })
                .catch(error => {
                    GUI.warn('Storage plugin: Failed to initialize -', error.message);
                    throw error;
                });
        },

        unload: function(GUI) {
            if (!GUI.cellar) {
                return Promise.resolve();
            }

            // Clear any cached data
            return Promise.all([
                GUI.cellar.localStorage.clearCache().catch(() => {}),
                GUI.cellar.sessionStorage.clearCache().catch(() => {})
            ])
            .then(() => {
                delete GUI.cellar;
            })
            .catch(() => {
                // Ensure cleanup even if cache clearing fails
                delete GUI.cellar;
            });
        }
    };
})();