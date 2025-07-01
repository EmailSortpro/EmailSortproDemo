// config-supabase.js - Configuration Supabase sécurisée v4.0
// Version production optimisée pour Netlify

class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.initPromise = null;
        console.log('[SupabaseConfig] Constructor v4.0');
    }

    async initialize() {
        // Si déjà initialisé, retourner immédiatement
        if (this.initialized) {
            console.log('[SupabaseConfig] Already initialized');
            return this.config;
        }

        // Si initialisation en cours, attendre
        if (this.initPromise) {
            console.log('[SupabaseConfig] Initialization in progress, waiting...');
            return this.initPromise;
        }

        // Démarrer l'initialisation
        this.initPromise = this._performInitialization();
        return this.initPromise;
    }

    async _performInitialization() {
        try {
            console.log('[SupabaseConfig] Starting initialization...');
            
            // Charger la configuration depuis Netlify Functions
            const config = await this.loadFromNetlifyFunctions();
            
            if (!config || !config.url || !config.anonKey) {
                throw new Error('Invalid configuration received');
            }
            
            // Valider la configuration
            this.validateConfig(config);
            
            // Stocker la configuration
            this.config = {
                url: config.url,
                anonKey: config.anonKey,
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false,
                    storage: window.localStorage
                }
            };
            
            this.initialized = true;
            console.log('[SupabaseConfig] ✅ Initialization complete');
            
            return this.config;
            
        } catch (error) {
            console.error('[SupabaseConfig] Initialization error:', error);
            this.initialized = false;
            this.initPromise = null;
            throw error;
        }
    }

    async loadFromNetlifyFunctions() {
        console.log('[SupabaseConfig] Loading from Netlify Functions...');
        
        try {
            const response = await fetch('/.netlify/functions/get-supabase-config', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            console.log('[SupabaseConfig] Response received:', {
                hasUrl: !!data.url,
                hasAnonKey: !!data.anonKey,
                timestamp: data.timestamp
            });
            
            return data;
            
        } catch (error) {
            console.error('[SupabaseConfig] Failed to load from Netlify:', error);
            
            // En développement local, essayer les variables d'environnement
            if (window.location.hostname === 'localhost') {
                return this.loadFromEnvironment();
            }
            
            throw error;
        }
    }

    loadFromEnvironment() {
        console.log('[SupabaseConfig] Attempting to load from environment...');
        
        // Cette méthode ne fonctionnera que si les variables sont exposées par le bundler
        if (typeof process !== 'undefined' && process.env) {
            const url = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
            const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
            
            if (url && anonKey) {
                console.log('[SupabaseConfig] Found environment variables');
                return { url, anonKey };
            }
        }
        
        throw new Error('No environment variables found');
    }

    validateConfig(config) {
        // Validation de l'URL
        if (!config.url || typeof config.url !== 'string') {
            throw new Error('Invalid URL in configuration');
        }
        
        if (!config.url.startsWith('https://')) {
            throw new Error('URL must use HTTPS');
        }
        
        if (!config.url.includes('supabase.co')) {
            throw new Error('URL must be a valid Supabase URL');
        }
        
        // Validation de la clé
        if (!config.anonKey || typeof config.anonKey !== 'string') {
            throw new Error('Invalid anonymous key in configuration');
        }
        
        if (config.anonKey.length < 100) {
            throw new Error('Anonymous key appears to be invalid');
        }
        
        console.log('[SupabaseConfig] ✅ Configuration validated');
    }

    getConfig() {
        if (!this.initialized || !this.config) {
            throw new Error('Configuration not initialized. Call initialize() first.');
        }
        return this.config;
    }

    async testConnection() {
        if (!this.initialized) {
            return {
                success: false,
                message: 'Configuration not initialized',
                error: 'NOT_INITIALIZED'
            };
        }
        
        if (!window.supabase) {
            return {
                success: false,
                message: 'Supabase library not loaded',
                error: 'LIBRARY_NOT_LOADED'
            };
        }
        
        try {
            console.log('[SupabaseConfig] Testing connection...');
            
            const client = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                this.config.auth
            );
            
            // Test simple de connexion
            const { data, error } = await client.auth.getSession();
            
            if (error && error.message.includes('Invalid API key')) {
                return {
                    success: false,
                    message: 'Invalid API key',
                    error: 'INVALID_API_KEY'
                };
            }
            
            // Test d'une requête simple
            const { error: testError } = await client
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (testError && testError.code === '42P01') {
                // Table n'existe pas, mais connexion OK
                console.log('[SupabaseConfig] Connection works (table may not exist)');
            }
            
            return {
                success: true,
                message: 'Connection successful',
                url: this.config.url.substring(0, 30) + '...'
            };
            
        } catch (error) {
            console.error('[SupabaseConfig] Connection test error:', error);
            return {
                success: false,
                message: `Connection error: ${error.message}`,
                error: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    reset() {
        this.config = null;
        this.initialized = false;
        this.initPromise = null;
        console.log('[SupabaseConfig] Configuration reset');
    }

    debug() {
        return {
            initialized: this.initialized,
            hasConfig: !!this.config,
            configUrl: this.config?.url ? this.config.url.substring(0, 50) + '...' : 'N/A',
            hasSupabaseLibrary: typeof window.supabase !== 'undefined',
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            timestamp: new Date().toISOString()
        };
    }
}

// Créer l'instance globale
window.supabaseConfig = new SupabaseConfig();

// Fonction d'initialisation globale
window.initializeSupabaseConfig = async function() {
    try {
        return await window.supabaseConfig.initialize();
    } catch (error) {
        console.error('[SupabaseConfig] Failed to initialize:', error);
        throw error;
    }
};

// Fonctions de debug
window.debugSupabaseConfig = function() {
    return window.supabaseConfig.debug();
};

window.testSupabaseConnection = async function() {
    return await window.supabaseConfig.testConnection();
};

console.log('[SupabaseConfig] ✅ Module loaded v4.0');
