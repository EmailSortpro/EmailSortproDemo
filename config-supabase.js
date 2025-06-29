// Configuration Supabase sécurisée avec fallback
class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.fallbackUsed = false;
        console.log('[SupabaseConfig] Initializing with enhanced error handling...');
        this.loadConfig();
    }

    async loadConfig() {
        try {
            console.log('[SupabaseConfig] Attempting to load from Netlify Functions...');
            
            // Essayer de charger depuis Netlify Functions
            const response = await fetch('/.netlify/functions/get-supabase-config', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                // Timeout après 10 secondes
                signal: AbortSignal.timeout(10000)
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
            // Pour le développement local, essayer les variables d'environnement
            if (isLocalhost) {
                console.log('[SupabaseConfig] Mode développement local détecté');
                
                // Variables d'environnement pour le développement local
                const localUrl = process.env.VITE_SUPABASE_URL || 
                                process.env.SUPABASE_URL || 
                                'YOUR_LOCAL_SUPABASE_URL';
                const localKey = process.env.VITE_SUPABASE_ANON_KEY || 
                                process.env.SUPABASE_ANON_KEY || 
                                'YOUR_LOCAL_SUPABASE_ANON_KEY';
                
                if (localUrl !== 'YOUR_LOCAL_SUPABASE_URL' && localKey !== 'YOUR_LOCAL_SUPABASE_ANON_KEY') {
                    this.config = {
                        url: localUrl,
                        anonKey: localKey,
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
            }
            
            // Pour la production Netlify, configuration hardcodée temporaire
            if (isNetlify) {
                console.warn('[SupabaseConfig] Mode production Netlify - Configuration hardcodée temporaire');
                
                // ATTENTION: En production, remplacez ces valeurs par les vraies
                // et supprimez cette configuration hardcodée une fois que Netlify Functions fonctionne
                this.config = {
                    url: 'https://votre-projet.supabase.co', // À remplacer
                    anonKey: 'eyJ...votre-cle-anonyme', // À remplacer
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage
                    }
                };
                
                this.initialized = true;
                this.fallbackUsed = true;
                console.warn('[SupabaseConfig] ⚠️ Configuration hardcodée utilisée - À corriger !');
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
            
            // Test plus avancé: essayer de faire une requête simple
            const { error: testError } = await client
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (testError && testError.code === '42P01') {
                return { 
                    success: false, 
                    message: 'Table users non trouvée - Vérifiez votre schéma de base', 
                    error: 'TABLE_NOT_FOUND',
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

    // Méthode pour déboguer la configuration
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

// Initialiser de manière asynchrone avec gestion d'erreur améliorée
window.supabaseConfigPromise = (async () => {
    try {
        const config = new SupabaseConfig();
        await config.loadConfig();
        
        // Validation finale
        const validation = config.validate();
        if (!validation.valid) {
            console.error('[SupabaseConfig] ❌ Validation failed:', validation.issues);
            throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
        }
        
        // Test de connexion optionnel
        const connectionTest = await config.testConnection();
        if (!connectionTest.success) {
            console.warn('[SupabaseConfig] ⚠️ Connection test failed:', connectionTest.message);
        } else {
            console.log('[SupabaseConfig] ✅ Connection test passed');
        }
        
        return config;
        
    } catch (error) {
        console.error('[SupabaseConfig] ❌ Critical initialization error:', error);
        
        // Créer un objet de configuration vide pour éviter les erreurs
        const fallbackConfig = {
            initialized: false,
            getConfig: () => { throw new Error('Configuration failed to initialize'); },
            validate: () => ({ valid: false, issues: [error.message] }),
            testConnection: () => Promise.resolve({ success: false, message: error.message }),
            debug: () => ({ error: error.message, initialized: false })
        };
        
        return fallbackConfig;
    }
})();

// Fonction d'aide pour déboguer
window.debugSupabaseConfig = async () => {
    try {
        const config = await window.supabaseConfigPromise;
        return config.debug();
    } catch (error) {
        console.error('Debug failed:', error);
        return { error: error.message };
    }
};

console.log('[SupabaseConfig] ✅ Enhanced configuration system loaded');
