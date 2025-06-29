// config-supabase.js - Configuration Supabase pour EmailSortPro
// Version corrigée avec support des variables d'environnement Netlify

// Charger Supabase depuis CDN si pas déjà disponible
if (typeof window.supabase === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    document.head.appendChild(script);
}

class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        
        console.log('[SupabaseConfig] Initializing...');
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // Configuration par défaut avec vos valeurs
            const defaultConfig = {
                url: 'https://kbhxbisexpbmclqhadmq.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHhiaXNleHBibWNscWhhZG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzcyODEsImV4cCI6MjA2NjUxMzI4MX0.9mwrKDT2HpegDFdufqmVU2e9fFtgM-46ecbYTjRrMXo'
            };

            // Essayer de charger depuis les variables d'environnement
            let supabaseUrl = this.getEnvVar('VITE_SUPABASE_URL');
            let supabaseAnonKey = this.getEnvVar('VITE_SUPABASE_ANON_KEY');

            // Si on est sur Netlify et qu'on n'a pas les variables, essayer la fonction
            if (!supabaseAnonKey && this.isNetlifyEnvironment()) {
                const netlifyVars = await this.loadNetlifyEnvVars();
                if (netlifyVars) {
                    supabaseUrl = netlifyVars.url || supabaseUrl;
                    supabaseAnonKey = netlifyVars.anonKey || supabaseAnonKey;
                }
            }

            // Utiliser les valeurs par défaut si nécessaire
            this.config = {
                url: supabaseUrl || defaultConfig.url,
                anonKey: supabaseAnonKey || defaultConfig.anonKey,
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false,
                    storage: window.localStorage
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            };

            this.initialized = true;
            console.log('[SupabaseConfig] Configuration loaded:', {
                url: this.config.url,
                hasAnonKey: !!this.config.anonKey,
                keyLength: this.config.anonKey?.length,
                environment: this.getEnvironment()
            });
        } catch (error) {
            console.error('[SupabaseConfig] Error loading config:', error);
            // Utiliser la configuration par défaut en cas d'erreur
            this.config = {
                url: 'https://kbhxbisexpbmclqhadmq.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHhiaXNleHBibWNscWhhZG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzcyODEsImV4cCI6MjA2NjUxMzI4MX0.9mwrKDT2HpegDFdufqmVU2e9fFtgM-46ecbYTjRrMXo',
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false,
                    storage: window.localStorage
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            };
            this.initialized = true;
        }
    }

    getEnvVar(name) {
        // Variables d'environnement Netlify (build-time)
        if (typeof import !== 'undefined' && import.meta && import.meta.env) {
            return import.meta.env[name];
        }
        
        // Variables d'environnement Node.js
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name];
        }
        
        // Variables globales Netlify (runtime)
        if (typeof window !== 'undefined' && window.NETLIFY_ENV) {
            return window.NETLIFY_ENV[name];
        }
        
        // Variables injectées via window
        if (typeof window !== 'undefined' && window[name]) {
            return window[name];
        }
        
        return null;
    }

    isNetlifyEnvironment() {
        const hostname = window.location.hostname;
        return hostname.includes('netlify.app') || hostname.includes('netlify.com');
    }

    async loadNetlifyEnvVars() {
        try {
            const response = await fetch('/.netlify/functions/env-vars');
            if (!response.ok) {
                console.warn('[SupabaseConfig] Netlify function not available');
                return null;
            }
            
            const jsCode = await response.text();
            if (jsCode.trim().startsWith('<')) {
                console.warn('[SupabaseConfig] HTML response received instead of JS');
                return null;
            }
            
            eval(jsCode);
            
            if (window.NETLIFY_ENV) {
                return {
                    url: window.NETLIFY_ENV.VITE_SUPABASE_URL,
                    anonKey: window.NETLIFY_ENV.VITE_SUPABASE_ANON_KEY
                };
            }
            
            return null;
        } catch (error) {
            console.warn('[SupabaseConfig] Error loading Netlify vars:', error.message);
            return null;
        }
    }

    getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('netlify.app')) {
            return 'production';
        } else {
            return 'unknown';
        }
    }

    getConfig() {
        if (!this.initialized) {
            this.loadConfig();
        }
        return this.config;
    }

    validate() {
        const config = this.getConfig();
        const issues = [];
        
        if (!config.url) {
            issues.push('URL Supabase manquante');
        }
        
        if (!config.anonKey) {
            issues.push('Clé anonyme Supabase manquante');
        }
        
        if (!config.url.includes('supabase.co')) {
            issues.push('URL Supabase invalide');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            environment: this.getEnvironment()
        };
    }

    async testConnection() {
        try {
            if (!window.supabase) {
                // Attendre que Supabase soit chargé
                await new Promise((resolve) => {
                    const checkSupabase = setInterval(() => {
                        if (window.supabase) {
                            clearInterval(checkSupabase);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            const config = this.getConfig();
            const client = window.supabase.createClient(config.url, config.anonKey, config.auth);
            
            // Test simple de connexion
            const { data, error } = await client.auth.getSession();
            
            if (error && error.message.includes('Invalid API key')) {
                throw new Error('Clé API invalide');
            }
            
            return {
                success: true,
                message: 'Connexion Supabase réussie',
                environment: this.getEnvironment(),
                hasSession: !!data?.session
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }
}

// Créer l'instance globale
window.supabaseConfig = new SupabaseConfig();

// Fonction de diagnostic
window.diagnoseSupabase = async function() {
    console.group('🔍 DIAGNOSTIC SUPABASE');
    
    const config = window.supabaseConfig.getConfig();
    const validation = window.supabaseConfig.validate();
    
    console.log('Configuration:', {
        url: config.url,
        hasAnonKey: !!config.anonKey,
        keyLength: config.anonKey?.length,
        environment: window.supabaseConfig.getEnvironment()
    });
    
    console.log('Validation:', validation);
    
    console.log('Variables d\'environnement détectées:', {
        VITE_SUPABASE_URL: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_URL'),
        VITE_SUPABASE_ANON_KEY: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_ANON_KEY')
    });
    
    // Test de connexion
    console.log('Test de connexion en cours...');
    const connectionTest = await window.supabaseConfig.testConnection();
    console.log('Résultat test connexion:', connectionTest);
    
    if (!validation.valid) {
        console.log('🚨 PROBLÈMES DÉTECTÉS:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
        console.log('✅ Configuration valide');
    }
    
    console.groupEnd();
    
    return { validation, connectionTest };
};

console.log('✅ SupabaseConfig loaded - Use diagnoseSupabase() for diagnostic');
