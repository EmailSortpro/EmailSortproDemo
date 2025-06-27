// config-supabase.js - Configuration Supabase sécurisée avec vos vraies clés
// Attention : Ces clés sont visibles côté client, utilisez uniquement la clé anonyme

class SupabaseConfig {
    constructor() {
        // Configuration avec vos vraies clés Supabase
        this.url = 'https://oxyiamruvyliueecpaam.supabase.co';
        this.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlhbXJ1dnlsaXVlZWNwYWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDM0MTgsImV4cCI6MjA2NTk3OTQxOH0.Wy_jbUB7D5Bly-rZB6oc2bXUHzZQ8MivDL4vdM1jcE0';
        
        // Pour la production Netlify, on peut utiliser les variables d'environnement
        if (window.location.hostname.includes('netlify.app')) {
            // Les variables seront injectées par Netlify si configurées
            this.url = window.SUPABASE_URL || this.url;
            this.anonKey = window.SUPABASE_ANON_KEY || this.anonKey;
        }

        // Configuration des rôles et permissions pour EmailSortPro
        this.roles = {
            SUPER_ADMIN: 'super_admin',
            COMPANY_ADMIN: 'company_admin', 
            USER: 'user',
            BLOCKED: 'blocked'
        };

        // Configuration des statuts de connexion
        this.connectionStatus = {
            ALLOWED: 'allowed',
            BLOCKED: 'blocked',
            SUSPENDED: 'suspended',
            PENDING: 'pending'
        };

        // Initialiser le client Supabase
        this.initializeClient();
    }

    initializeClient() {
        try {
            // Vérifier si Supabase est disponible
            if (typeof window !== 'undefined' && window.supabase) {
                this.client = window.supabase.createClient(this.url, this.anonKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                });
                
                console.log('✅ Client Supabase initialisé pour EmailSortPro');
                
                // Test de connexion
                this.testConnection();
            } else {
                console.warn('⚠️ SDK Supabase non disponible, chargement en cours...');
                
                // Essayer de charger le SDK Supabase
                this.loadSupabaseSDK().then(() => {
                    this.initializeClient();
                });
            }
        } catch (error) {
            console.error('❌ Erreur initialisation Supabase:', error);
            this.client = null;
        }
    }

    async loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            // Vérifier si déjà chargé
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('✅ SDK Supabase chargé');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Erreur chargement SDK Supabase');
                reject(new Error('Impossible de charger Supabase'));
            };
            document.head.appendChild(script);
        });
    }

    async testConnection() {
        try {
            if (!this.client) return false;

            // Test simple de connexion
            const { data, error } = await this.client
                .from('users')
                .select('count', { count: 'exact', head: true });

            if (error && !error.message.includes('relation "users" does not exist')) {
                console.error('🚨 Erreur connexion Supabase:', error.message);
                return false;
            }

            console.log('✅ Connexion Supabase validée');
            return true;
        } catch (error) {
            console.warn('⚠️ Test de connexion Supabase échoué:', error.message);
            return false;
        }
    }

    getConfig() {
        return {
            url: this.url,
            anonKey: this.anonKey,
            client: this.client,
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            roles: this.roles,
            connectionStatus: this.connectionStatus
        };
    }

    getClient() {
        return this.client;
    }

    // Méthodes utilitaires pour les rôles
    canManageUsers(userRole) {
        return [this.roles.SUPER_ADMIN, this.roles.COMPANY_ADMIN].includes(userRole);
    }

    canBlockUsers(userRole) {
        return [this.roles.SUPER_ADMIN, this.roles.COMPANY_ADMIN].includes(userRole);
    }

    isSuperAdmin(userRole) {
        return userRole === this.roles.SUPER_ADMIN;
    }

    isCompanyAdmin(userRole) {
        return userRole === this.roles.COMPANY_ADMIN;
    }

    // Méthodes utilitaires pour les statuts de connexion
    isConnectionAllowed(status) {
        return status === this.connectionStatus.ALLOWED;
    }

    isConnectionBlocked(status) {
        return [
            this.connectionStatus.BLOCKED, 
            this.connectionStatus.SUSPENDED
        ].includes(status);
    }

    getConnectionStatusLabel(status) {
        switch (status) {
            case this.connectionStatus.ALLOWED: return 'Autorisé';
            case this.connectionStatus.BLOCKED: return 'Bloqué';
            case this.connectionStatus.SUSPENDED: return 'Suspendu';
            case this.connectionStatus.PENDING: return 'En attente';
            default: return 'Inconnu';
        }
    }

    // Méthode pour vérifier si les tables existent
    async checkTablesExist() {
        if (!this.client) return false;

        const requiredTables = ['users', 'companies', 'licenses', 'analytics_events', 'admin_actions'];
        const results = {};

        for (const table of requiredTables) {
            try {
                const { error } = await this.client
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .limit(0);

                results[table] = !error;
            } catch (error) {
                results[table] = false;
            }
        }

        const allExist = Object.values(results).every(exists => exists);
        
        if (allExist) {
            console.log('✅ Toutes les tables EmailSortPro existent');
        } else {
            console.warn('⚠️ Tables manquantes:', Object.keys(results).filter(t => !results[t]));
        }

        return { allExist, tables: results };
    }

    // Méthode pour obtenir les statistiques de la base
    async getDatabaseStats() {
        if (!this.client) return null;

        try {
            const stats = {};

            // Compter les utilisateurs
            const { count: usersCount } = await this.client
                .from('users')
                .select('*', { count: 'exact', head: true });
            stats.users = usersCount || 0;

            // Compter les sociétés
            const { count: companiesCount } = await this.client
                .from('companies')
                .select('*', { count: 'exact', head: true });
            stats.companies = companiesCount || 0;

            // Compter les licences
            const { count: licensesCount } = await this.client
                .from('licenses')
                .select('*', { count: 'exact', head: true });
            stats.licenses = licensesCount || 0;

            // Compter les événements analytics
            const { count: eventsCount } = await this.client
                .from('analytics_events')
                .select('*', { count: 'exact', head: true });
            stats.events = eventsCount || 0;

            console.log('📊 Statistiques base de données:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Erreur récupération statistiques:', error);
            return null;
        }
    }
}

// Export singleton
window.supabaseConfig = new SupabaseConfig();

// Fonction globale pour accéder au client Supabase
window.getSupabaseClient = function() {
    return window.supabaseConfig.getClient();
};

// Fonction de diagnostic pour la page analytics
window.diagnoseSupabase = function() {
    console.group('🔍 DIAGNOSTIC SUPABASE - EmailSortPro');
    
    const config = window.supabaseConfig;
    
    console.log('🌐 Configuration:');
    console.log('  URL:', config.url);
    console.log('  Clé anonyme:', config.anonKey.substring(0, 20) + '...');
    console.log('  Client initialisé:', !!config.client);
    
    console.log('🔧 Méthodes disponibles:');
    console.log('  config.getClient() - Obtenir le client Supabase');
    console.log('  config.checkTablesExist() - Vérifier les tables');
    console.log('  config.getDatabaseStats() - Statistiques de la base');
    console.log('  config.testConnection() - Tester la connexion');
    
    console.log('👥 Rôles configurés:', config.roles);
    console.log('🔒 Statuts de connexion:', config.connectionStatus);
    
    console.groupEnd();
    
    return {
        url: config.url,
        clientReady: !!config.client,
        roles: config.roles,
        connectionStatus: config.connectionStatus
    };
};

// Auto-diagnostic au chargement
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[SupabaseConfig] 🚀 Configuration EmailSortPro chargée');
    
    // Attendre un peu pour que Supabase soit chargé
    setTimeout(async () => {
        const config = window.supabaseConfig;
        
        if (config.client) {
            // Vérifier les tables
            await config.checkTablesExist();
            
            // Obtenir les statistiques
            await config.getDatabaseStats();
        }
    }, 1000);
});

// Instructions pour les développeurs
console.log(`
🎯 CONFIGURATION SUPABASE EMAILSORTPRO PRÊTE

📋 Pour utiliser:
   - Client Supabase: window.getSupabaseClient()
   - Configuration: window.supabaseConfig.getConfig()
   - Diagnostic: window.diagnoseSupabase()

⚙️ Base de données:
   - URL: https://oxyiamruvyliueecpaam.supabase.co
   - Mode: Production avec clé anonyme
   - Tables: users, companies, licenses, analytics_events, admin_actions

🔒 Sécurité:
   - Seule la clé anonyme est exposée (normal)
   - Permissions gérées par Row Level Security (RLS)
   - Clé secrète gardée côté serveur Supabase
`);

console.log('[SupabaseConfig] ✅ Configuration avec gestion des sociétés et connexions chargée');
