// config-supabase.js - Configuration Supabase sécurisée pour EmailSortPro
// Version corrigée sans clés exposées

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
            // ⚠️ IMPORTANT: Les clés doivent être définies dans les variables d'environnement
            // Ne jamais mettre de clés par défaut dans le code !
            
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

            // Vérifier que les variables d'environnement sont définies
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Variables d\'environnement Supabase manquantes. Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
            }

            this.config = {
                url: supabaseUrl,
                anonKey: supabaseAnonKey,
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
            
            // En cas d'erreur, afficher des instructions claires
            this.showConfigurationError(error.message);
            throw error;
        }
    }

    showConfigurationError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            font-family: monospace;
            color: #dc2626;
        `;
        
        errorDiv.innerHTML = `
            <h3>⚠️ Configuration Supabase manquante</h3>
            <p><strong>Erreur:</strong> ${message}</p>
            <p><strong>Solution:</strong> Définissez les variables d'environnement suivantes :</p>
            <ul>
                <li><code>VITE_SUPABASE_URL</code> - URL de votre projet Supabase</li>
                <li><code>VITE_SUPABASE_ANON_KEY</code> - Clé anonyme de votre projet Supabase</li>
            </ul>
            <p>Pour Netlify : ajoutez ces variables dans Settings > Environment Variables</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px;">Fermer</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    getEnvVar(name) {
        // Variables d'environnement Vite (build-time)
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
        
        if (config.url && !config.url.includes('supabase.co')) {
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
    
    try {
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
    } catch (error) {
        console.error('Erreur lors du diagnostic:', error);
        console.groupEnd();
        return { error: error.message };
    }
};

console.log('✅ SupabaseConfig loaded - Use diagnoseSupabase() for diagnostic');
