// config-supabase.js - Configuration Supabase sécurisée pour EmailSortPro
// ⚠️ Ce fichier ne contient AUCUNE clé secrète !

// Charger Supabase depuis CDN
if (typeof window.supabase === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    document.head.appendChild(script);
}

class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        console.log('[SupabaseConfig] 🚀 Initialisation...');
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // Chercher les clés dans les variables d'environnement
            let supabaseUrl = this.getEnvVar('VITE_SUPABASE_URL');
            let supabaseAnonKey = this.getEnvVar('VITE_SUPABASE_ANON_KEY');

            // Si on est sur Netlify, essayer de charger depuis la fonction
            if (!supabaseAnonKey && this.isNetlifyEnvironment()) {
                console.log('[SupabaseConfig] 🌐 Chargement depuis Netlify...');
                const netlifyVars = await this.loadNetlifyEnvVars();
                if (netlifyVars) {
                    supabaseUrl = netlifyVars.url;
                    supabaseAnonKey = netlifyVars.anonKey;
                }
            }

            // Vérifier qu'on a bien les clés
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Variables d\'environnement Supabase manquantes');
            }

            // Configuration Supabase
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
            console.log('[SupabaseConfig] ✅ Configuration chargée avec succès');

        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur:', error.message);
            this.showConfigError(error.message);
            throw error;
        }
    }

    getEnvVar(name) {
        // Variables d'environnement (différentes selon l'environnement)
        if (typeof import !== 'undefined' && import.meta && import.meta.env) {
            return import.meta.env[name];
        }
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name];
        }
        if (typeof window !== 'undefined' && window.NETLIFY_ENV) {
            return window.NETLIFY_ENV[name];
        }
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
                console.warn('[SupabaseConfig] ⚠️ Fonction Netlify non disponible');
                return null;
            }
            
            const jsCode = await response.text();
            if (jsCode.includes('window.NETLIFY_ENV')) {
                eval(jsCode);
                return window.NETLIFY_ENV ? {
                    url: window.NETLIFY_ENV.VITE_SUPABASE_URL,
                    anonKey: window.NETLIFY_ENV.VITE_SUPABASE_ANON_KEY
                } : null;
            }
            return null;
        } catch (error) {
            console.warn('[SupabaseConfig] ⚠️ Erreur chargement Netlify:', error.message);
            return null;
        }
    }

    showConfigError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; z-index: 9999;
            background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px;
            font-family: Arial, sans-serif; color: #dc2626; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🚨 Configuration Supabase Manquante</h3>
            <p><strong>Problème :</strong> ${message}</p>
            <p><strong>Solution :</strong> Configurez vos variables d'environnement sur Netlify :</p>
            <ul style="margin: 10px 0;">
                <li><code>VITE_SUPABASE_URL</code></li>
                <li><code>VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Fermer</button>
        `;
        document.body.appendChild(errorDiv);
    }

    getConfig() {
        if (!this.initialized) {
            throw new Error('Configuration non initialisée');
        }
        return this.config;
    }

    async testConnection() {
        try {
            // Attendre que Supabase soit chargé
            let attempts = 0;
            while (!window.supabase && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.supabase) {
                throw new Error('Supabase non chargé');
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
                message: 'Connexion Supabase réussie !',
                environment: this.isNetlifyEnvironment() ? 'production' : 'development',
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
}

// Créer l'instance globale
window.supabaseConfig = new SupabaseConfig();

// Fonction de test simple
window.testSupabase = async function() {
    console.log('🧪 Test de la configuration Supabase...');
    try {
        const result = await window.supabaseConfig.testConnection();
        console.log(result.success ? '✅' : '❌', result.message);
        if (result.environment) {
            console.log('🌍 Environnement:', result.environment);
        }
        return result;
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        return { success: false, message: error.message };
    }
};

// Fonction de diagnostic complète
window.diagnoseSupabase = async function() {
    console.group('🔍 DIAGNOSTIC SUPABASE COMPLET');
    
    try {
        const config = window.supabaseConfig.getConfig();
        
        console.log('📋 Configuration:', {
            url: config.url,
            hasAnonKey: !!config.anonKey,
            keyLength: config.anonKey?.length,
            environment: window.supabaseConfig.getEnvironment()
        });
        
        console.log('🔧 Variables d\'environnement détectées:', {
            VITE_SUPABASE_URL: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_URL'),
            VITE_SUPABASE_ANON_KEY: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_ANON_KEY'),
            isNetlify: window.supabaseConfig.isNetlifyEnvironment()
        });
        
        console.log('🔗 Test de connexion...');
        const connectionTest = await window.supabaseConfig.testConnection();
        console.log('📊 Résultat:', connectionTest);
        
        if (connectionTest.success) {
            console.log('🎉 Tout fonctionne parfaitement !');
        } else {
            console.log('⚠️ Problème détecté:', connectionTest.message);
        }
        
    } catch (error) {
        console.error('💥 Erreur lors du diagnostic:', error.message);
    }
    
    console.groupEnd();
};

console.log('📱 SupabaseConfig chargé - Utilisez testSupabase() ou diagnoseSupabase()');
