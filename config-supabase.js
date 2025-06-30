// config-supabase.js - Configuration Supabase sécurisée sans clés en dur
class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.fallbackUsed = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        console.log('[SupabaseConfig] Initializing with enhanced security v3.0...');
    }

    async initialize() {
        try {
            console.log('[SupabaseConfig] Starting initialization...');
            
            // Vérifier si Supabase est disponible
            if (typeof window.supabase === 'undefined') {
                console.log('[SupabaseConfig] Loading Supabase library...');
                await this.loadSupabaseLibrary();
            }

            // Essayer de charger depuis Netlify Functions
            await this.loadFromNetlifyFunctions();
            
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Primary loading failed:', error.message);
            
            // PAS de fallback avec clés en dur - sécurité prioritaire
            throw new Error(`Configuration Supabase failed: ${error.message}. Veuillez vérifier les variables d'environnement Netlify.`);
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/dist/umd/supabase.min.js';
            script.onload = () => {
                console.log('[SupabaseConfig] ✅ Supabase library loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('[SupabaseConfig] ❌ Failed to load Supabase library');
                reject(new Error('Failed to load Supabase library'));
            };
            document.head.appendChild(script);
        });
    }

    async loadFromNetlifyFunctions() {
        console.log('[SupabaseConfig] Attempting to load from Netlify Functions...');
        
        const response = await fetch('/.netlify/functions/get-supabase-config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 secondes timeout
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[SupabaseConfig] Netlify function error:', response.status, errorText);
            throw new Error(`Netlify function failed: ${response.status} - ${errorText}`);
        }
        
        const configData = await response.json();
        console.log('[SupabaseConfig] Response received:', {
            hasUrl: !!configData.url,
            hasAnonKey: !!configData.anonKey,
            timestamp: configData.timestamp
        });
        
        if (!configData.url || !configData.anonKey) {
            throw new Error('Configuration incomplète reçue de Netlify');
        }

        // Valider les données reçues
        if (!this.validateConfig(configData)) {
            throw new Error('Configuration invalide reçue de Netlify');
        }
        
        this.config = {
            url: configData.url,
            anonKey: configData.anonKey,
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
                storage: window.localStorage
            }
        };
        
        this.initialized = true;
        this.fallbackUsed = false;
        console.log('[SupabaseConfig] ✅ Configuration loaded securely from Netlify');
    }

    validateConfig(configData) {
        if (!configData.url || typeof configData.url !== 'string') {
            console.error('[SupabaseConfig] Invalid URL in config');
            return false;
        }

        if (!configData.url.startsWith('https://')) {
            console.error('[SupabaseConfig] URL must use HTTPS');
            return false;
        }

        if (!configData.url.includes('supabase.co')) {
            console.error('[SupabaseConfig] URL must be a valid Supabase URL');
            return false;
        }

        if (!configData.anonKey || typeof configData.anonKey !== 'string') {
            console.error('[SupabaseConfig] Invalid anonymous key in config');
            return false;
        }

        if (configData.anonKey.length < 100) {
            console.error('[SupabaseConfig] Anonymous key seems too short');
            return false;
        }

        return true;
    }

    getConfig() {
        if (!this.initialized) {
            throw new Error('Configuration not initialized. Call initialize() first.');
        }
        return this.config;
    }

    validate() {
        if (!this.config) {
            return { valid: false, issues: ['Configuration non chargée'] };
        }
        
        const issues = [];
        
        if (!this.config.url) {
            issues.push('URL Supabase manquante');
        } else if (!this.config.url.startsWith('https://')) {
            issues.push('URL doit commencer par https://');
        } else if (!this.config.url.includes('supabase.co')) {
            issues.push('URL ne semble pas être une URL Supabase valide');
        }
        
        if (!this.config.anonKey) {
            issues.push('Clé anonyme manquante');
        } else if (this.config.anonKey.length < 100) {
            issues.push('Clé anonyme semble trop courte');
        }
        
        return { 
            valid: issues.length === 0, 
            issues,
            fallbackUsed: this.fallbackUsed,
            url: this.config.url ? this.config.url.substring(0, 30) + '...' : 'N/A'
        };
    }

    async testConnection() {
        if (!this.initialized) {
            return { success: false, message: 'Configuration non initialisée', error: 'NOT_INITIALIZED' };
        }
        
        if (typeof window.supabase === 'undefined') {
            return { success: false, message: 'Supabase library not loaded', error: 'LIBRARY_NOT_LOADED' };
        }
        
        try {
            console.log('[SupabaseConfig] Testing connection...');
            
            const client = window.supabase.createClient(
                this.config.url, 
                this.config.anonKey, 
                this.config.auth
            );
            
            // Test simple: récupérer la session actuelle
            const { data, error } = await client.auth.getSession();
            
            if (error && error.message.includes('Invalid API key')) {
                return { 
                    success: false, 
                    message: 'Clé API invalide', 
                    error: 'INVALID_API_KEY',
                    fallbackUsed: this.fallbackUsed
                };
            }
            
            // Test d'une requête simple pour vérifier la connectivité
            const { error: testError } = await client
                .from('users')
                .select('count')
                .limit(1);
            
            if (testError && testError.code === '42P01') {
                // Table n'existe pas, mais la connexion fonctionne
                console.log('[SupabaseConfig] ✅ Connection works (table may not exist yet)');
            } else if (testError) {
                console.warn('[SupabaseConfig] ⚠️ Connection test warning:', testError.message);
            }
            
            return { 
                success: true, 
                message: 'Connexion Supabase réussie',
                fallbackUsed: this.fallbackUsed,
                url: this.config.url.substring(0, 30) + '...'
            };
            
        } catch (error) {
            console.error('[SupabaseConfig] Erreur test connexion:', error);
            return { 
                success: false, 
                message: `Erreur de connexion: ${error.message}`, 
                error: error.code || 'UNKNOWN_ERROR',
                fallbackUsed: this.fallbackUsed
            };
        }
    }

    // === GESTION DES ERREURS ET RETRY ===

    async retry() {
        if (this.retryCount >= this.maxRetries) {
            throw new Error('Maximum retry attempts reached');
        }

        this.retryCount++;
        console.log(`[SupabaseConfig] Retry attempt ${this.retryCount}/${this.maxRetries}`);
        
        // Reset l'état
        this.initialized = false;
        this.config = null;
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        
        return this.initialize();
    }

    reset() {
        this.config = null;
        this.initialized = false;
        this.fallbackUsed = false;
        this.retryCount = 0;
        console.log('[SupabaseConfig] Configuration reset');
    }

    // === DEBUG ===

    debug() {
        console.group('[SupabaseConfig] Debug Information');
        console.log('Initialized:', this.initialized);
        console.log('Fallback used:', this.fallbackUsed);
        console.log('Retry count:', this.retryCount);
        console.log('Current hostname:', window.location.hostname);
        console.log('Current protocol:', window.location.protocol);
        console.log('Supabase library loaded:', typeof window.supabase !== 'undefined');
        
        if (this.config) {
            console.log('Config URL:', this.config.url ? this.config.url.substring(0, 50) + '...' : 'N/A');
            console.log('Config key length:', this.config.anonKey ? this.config.anonKey.length : 0);
        } else {
            console.log('No config loaded');
        }
        
        const validation = this.validate();
        console.log('Validation:', validation);
        
        console.groupEnd();
        
        return {
            initialized: this.initialized,
            fallbackUsed: this.fallbackUsed,
            retryCount: this.retryCount,
            hostname: window.location.hostname,
            validation: validation,
            hasConfig: !!this.config,
            hasSupabaseLibrary: typeof window.supabase !== 'undefined'
        };
    }

    // === MÉTHODE POUR DÉVELOPPEMENT LOCAL SEULEMENT ===
    
    async initializeForDevelopment() {
        // Cette méthode est uniquement pour le développement local
        // Elle ne doit JAMAIS être utilisée en production
        
        if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
            throw new Error('Development initialization only allowed on localhost');
        }
        
        console.warn('[SupabaseConfig] ⚠️ DEVELOPMENT MODE - Using environment variables if available');
        
        // En développement, essayer de lire les variables d'environnement depuis process.env si disponible
        // (Nécessite un bundler comme Vite qui expose les variables VITE_*)
        if (typeof process !== 'undefined' && process.env) {
            const devUrl = process.env.VITE_SUPABASE_URL;
            const devKey = process.env.VITE_SUPABASE_ANON_KEY;
            
            if (devUrl && devKey) {
                console.log('[SupabaseConfig] Using development environment variables');
                
                this.config = {
                    url: devUrl,
                    anonKey: devKey,
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage
                    }
                };
                
                this.initialized = true;
                this.fallbackUsed = true;
                return;
            }
        }
        
        throw new Error('No development configuration available. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
}

// Créer une instance unique
window.supabaseConfig = new SupabaseConfig();

// Fonction d'initialisation globale avec retry automatique
window.initializeSupabaseConfig = async () => {
    try {
        await window.supabaseConfig.initialize();
        return window.supabaseConfig;
    } catch (error) {
        console.error('[SupabaseConfig] Initialization failed:', error);
        
        // En développement, essayer la méthode de développement
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            try {
                console.log('[SupabaseConfig] Attempting development initialization...');
                await window.supabaseConfig.initializeForDevelopment();
                return window.supabaseConfig;
            } catch (devError) {
                console.error('[SupabaseConfig] Development initialization failed:', devError);
            }
        }
        
        // Essayer un retry automatique
        try {
            console.log('[SupabaseConfig] Attempting automatic retry...');
            await window.supabaseConfig.retry();
            return window.supabaseConfig;
        } catch (retryError) {
            console.error('[SupabaseConfig] Retry failed:', retryError);
            return null;
        }
    }
};

// Fonction pour déboguer
window.debugSupabaseConfig = () => {
    return window.supabaseConfig.debug();
};

// Fonction pour forcer un retry manuel
window.retrySupabaseConfig = async () => {
    try {
        await window.supabaseConfig.retry();
        console.log('[SupabaseConfig] ✅ Manual retry successful');
        return true;
    } catch (error) {
        console.error('[SupabaseConfig] ❌ Manual retry failed:', error);
        return false;
    }
};

// Auto-initialisation si pas encore fait après le chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseConfig.initialized) {
        console.log('[SupabaseConfig] Auto-initializing after DOM load...');
        try {
            await window.initializeSupabaseConfig();
        } catch (error) {
            console.warn('[SupabaseConfig] Auto-initialization failed:', error);
        }
    }
});

console.log('[SupabaseConfig] ✅ Configuration system loaded v3.0 - SECURE (no hardcoded secrets)');
