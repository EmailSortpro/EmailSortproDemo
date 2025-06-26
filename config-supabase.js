// config-supabase.js - Configuration Supabase sécurisée
// NE PAS COMMITER CE FICHIER - Ajouter à .gitignore

class SupabaseConfig {
    constructor() {
        // Ces valeurs doivent être définies via variables d'environnement
        // ou un fichier de configuration séparé non versionné
        this.url = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
        this.anonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
        
        // Pour la production, utiliser Netlify Environment Variables
        if (window.location.hostname.includes('netlify.app')) {
            // Les variables seront injectées par Netlify
            this.url = window.SUPABASE_URL || this.url;
            this.anonKey = window.SUPABASE_ANON_KEY || this.anonKey;
        }
    }

    getConfig() {
        if (this.url === 'YOUR_SUPABASE_URL' || this.anonKey === 'YOUR_ANON_KEY') {
            console.warn('[SupabaseConfig] Configuration non définie');
            return null;
        }

        return {
            url: this.url,
            anonKey: this.anonKey,
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        };
    }
}

// Export singleton
window.supabaseConfig = new SupabaseConfig();

// Instructions pour Netlify:
// 1. Aller dans Site settings > Environment variables
// 2. Ajouter SUPABASE_URL et SUPABASE_ANON_KEY
// 3. Redéployer le site
