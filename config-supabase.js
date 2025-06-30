// config-supabase.js - Configuration Supabase sécurisée avec fallback
class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.fallbackUsed = false;
        console.log('[SupabaseConfig] Initializing with enhanced error handling...');
    }

    async initialize() {
        try {
            console.log('[SupabaseConfig] Attempting to load from Netlify Functions...');
            
            // Essayer de charger depuis Netlify Functions
            const response = await fetch('/.netlify/functions/get-supabase-config', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseConfig] Netlify function error:', response.status, errorText);
                throw new Error(`Netlify function failed: ${response.status}`);
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
            
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Netlify Functions failed:', error.message);
            
            // Essayer le fallback local
            await this.tryFallbackConfig();
        }
    }

    async tryFallbackConfig() {
        console.warn('[SupabaseConfig] Tentative de configuration fallback...');
        
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isNetlify = hostname.includes('netlify.app');
        
        try {
            // Pour le développement local
            if (isLocalhost) {
                console.log('[SupabaseConfig] Mode développement local détecté');
                
                // Configuration locale pour tests
                this.config = {
                    url: 'https://xyzcompany.supabase.co',
                    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzEyMzQ1NiwiZXhwIjoxOTU4Njk5NDU2fQ.abcdefghijklmnopqrstuvwxyz123456',
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage
                    }
                };
                
                this.initialized = true;
                this.fallbackUsed = true;
                console.log('[SupabaseConfig] ✅ Configuration fallback locale activée');
                return;
            }
            
            throw new Error('Aucune configuration fallback disponible');
            
        } catch (fallbackError) {
            console.error('[SupabaseConfig] ❌ Fallback failed:', fallbackError);
            throw new Error(`Configuration failed: ${error.message} | Fallback: ${fallbackError.message}`);
        }
    }

    getConfig() {
        if (!this.initialized) {
            throw new Error('Configuration not initialized');
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
        
        try {
            console.log('[SupabaseConfig] Test de connexion Supabase...');
            
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

    debug() {
        console.group('[SupabaseConfig] Debug Information');
        console.log('Initialized:', this.initialized);
        console.log('Fallback used:', this.fallbackUsed);
        console.log('Current hostname:', window.location.hostname);
        console.log('Current protocol:', window.location.protocol);
        
        if (this.config) {
            console.log('Config URL:', this.config.url ? this.config.url.substring(0, 50) + '...' : 'N/A');
            console.log('Config key length:', this.config.anonKey ? this.config.anonKey.length : 0);
        }
        
        const validation = this.validate();
        console.log('Validation:', validation);
        
        console.groupEnd();
        
        return {
            initialized: this.initialized,
            fallbackUsed: this.fallbackUsed,
            hostname: window.location.hostname,
            validation: validation,
            hasConfig: !!this.config
        };
    }
}

// Créer une instance unique
window.supabaseConfig = new SupabaseConfig();

// Fonction d'initialisation globale
window.initializeSupabaseConfig = async () => {
    try {
        await window.supabaseConfig.initialize();
        return window.supabaseConfig;
    } catch (error) {
        console.error('[SupabaseConfig] Failed to initialize:', error);
        return null;
    }
};

// Fonction pour déboguer
window.debugSupabaseConfig = () => {
    return window.supabaseConfig.debug();
};

console.log('[SupabaseConfig] ✅ Configuration system loaded');
