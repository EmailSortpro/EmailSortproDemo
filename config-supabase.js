// config-supabase.js - Configuration Supabase pour EmailSortPro
// ⚠️ Ce fichier contient vos clés - ne pas committer dans Git !

class SupabaseConfig {
    constructor() {
        this.config = null;
        this.initialized = false;
        
        console.log('[SupabaseConfig] Initializing...');
        this.loadConfig();
    }

    loadConfig() {
        // 🔑 REMPLACEZ CES VALEURS PAR VOS VRAIES CLÉS SUPABASE
        const supabaseUrl = this.getEnvVar('VITE_SUPABASE_URL') || 
                           this.getEnvVar('SUPABASE_URL') || 
                           'https://VOTRE-PROJET.supabase.co'; // ← REMPLACEZ ICI
        
        const supabaseAnonKey = this.getEnvVar('VITE_SUPABASE_ANON_KEY') || 
                               this.getEnvVar('SUPABASE_ANON_KEY') || 
                               'eyJhbGciOiJIUzI1NiIsInR5cCI6JWT...'; // ← REMPLACEZ ICI
        
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
            environment: this.getEnvironment()
        });
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
        if (typeof window !== 'undefined' && window.netlifyEnv) {
            return window.netlifyEnv[name];
        }
        
        return null;
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
        
        if (!config.url || config.url.includes('VOTRE-PROJET')) {
            issues.push('URL Supabase manquante ou non configurée');
        }
        
        if (!config.anonKey || config.anonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6JWT...')) {
            issues.push('Clé anonyme Supabase manquante ou non configurée');
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
                throw new Error('Client Supabase non chargé');
            }
            
            const config = this.getConfig();
            const client = window.supabase.createClient(config.url, config.anonKey);
            
            // Test simple avec la table users
            const { data, error } = await client
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && error.code !== '42P01') {
                throw error;
            }
            
            return {
                success: true,
                message: 'Connexion Supabase réussie',
                environment: this.getEnvironment()
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
window.diagnoseSupabase = function() {
    console.group('🔍 DIAGNOSTIC SUPABASE');
    
    const config = window.supabaseConfig.getConfig();
    const validation = window.supabaseConfig.validate();
    
    console.log('Configuration:', {
        url: config.url,
        hasAnonKey: !!config.anonKey,
        environment: window.supabaseConfig.getEnvironment()
    });
    
    console.log('Validation:', validation);
    
    console.log('Variables d\'environnement détectées:', {
        VITE_SUPABASE_URL: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_URL'),
        SUPABASE_URL: !!window.supabaseConfig.getEnvVar('SUPABASE_URL'),
        VITE_SUPABASE_ANON_KEY: !!window.supabaseConfig.getEnvVar('VITE_SUPABASE_ANON_KEY'),
        SUPABASE_ANON_KEY: !!window.supabaseConfig.getEnvVar('SUPABASE_ANON_KEY')
    });
    
    if (!validation.valid) {
        console.log('🚨 ACTIONS REQUISES:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
        console.log('🔧 ÉTAPES DE CORRECTION:');
        console.log('  1. Allez sur https://supabase.com/dashboard');
        console.log('  2. Sélectionnez votre projet');
        console.log('  3. Settings > API');
        console.log('  4. Copiez Project URL et anon public key');
        console.log('  5. Remplacez les valeurs dans config-supabase.js');
    }
    
    console.groupEnd();
    
    return validation;
};

console.log('✅ SupabaseConfig loaded - Use diagnoseSupabase() for diagnostic');
