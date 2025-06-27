// config-supabase.js - Configuration Supabase sécurisée avec gestion des sociétés
// Version corrigée pour EmailSortPro avec vianney.hastings@hotmail.fr comme admin par défaut

class SupabaseConfig {
    constructor() {
        // Configuration avec les vraies clés Supabase
        this.url = 'https://oxyiamruvyliueecpaam.supabase.co';
        this.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlhbXJ1dnlsaXVlZWNwYWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDM0MTgsImV4cCI6MjA2NTk3OTQxOH0.Wy_jbUB7D5Bly-rZB6oc2bXUHzZQ8MivDL4vdM1jcE0';
        
        // Pour la production, utiliser les variables d'environnement si disponibles
        if (typeof process !== 'undefined' && process.env) {
            this.url = process.env.SUPABASE_URL || this.url;
            this.anonKey = process.env.SUPABASE_ANON_KEY || this.anonKey;
        } else if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('vercel.app')) {
            // Variables d'environnement pour déploiement
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

        // Configuration des statuts de licence
        this.licenseStatus = {
            ACTIVE: 'active',
            TRIAL: 'trial',
            EXPIRED: 'expired',
            BLOCKED: 'blocked',
            PENDING: 'pending'
        };

        // Configuration des statuts de connexion
        this.connectionStatus = {
            ALLOWED: 'allowed',
            BLOCKED: 'blocked',
            SUSPENDED: 'suspended',
            PENDING: 'pending'
        };

        // Emails d'administrateurs par défaut
        this.defaultAdmins = [
            'vianney.hastings@hotmail.fr'
        ];

        // Initialiser le client Supabase
        this.client = null;
        this.initialized = false;
        this.initializeClient();
    }

    async initializeClient() {
        try {
            console.log('[SupabaseConfig] 🚀 Initialisation du client...');
            
            // Vérifier si Supabase est disponible
            if (typeof window !== 'undefined' && window.supabase) {
                this.client = window.supabase.createClient(this.url, this.anonKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                        detectSessionInUrl: false
                    },
                    realtime: {
                        enabled: false
                    }
                });
                
                console.log('[SupabaseConfig] ✅ Client Supabase initialisé pour EmailSortPro');
                
                // Test de connexion
                await this.testConnection();
                this.initialized = true;
            } else {
                console.warn('[SupabaseConfig] ⚠️ SDK Supabase non disponible, chargement...');
                
                // Essayer de charger le SDK Supabase
                await this.loadSupabaseSDK();
                await this.initializeClient();
            }
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur initialisation:', error);
            this.client = null;
            this.initialized = false;
        }
    }

    async loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            // Vérifier si déjà chargé
            if (window.supabase) {
                resolve();
                return;
            }

            console.log('[SupabaseConfig] 📦 Chargement du SDK Supabase...');
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('[SupabaseConfig] ✅ SDK Supabase chargé avec succès');
                resolve();
            };
            script.onerror = () => {
                console.error('[SupabaseConfig] ❌ Erreur chargement SDK Supabase');
                reject(new Error('Impossible de charger le SDK Supabase'));
            };
            document.head.appendChild(script);
        });
    }

    async testConnection() {
        try {
            if (!this.client) return false;

            console.log('[SupabaseConfig] 🔍 Test de connexion...');

            // Test simple de connexion avec la table users
            const { data, error } = await this.client
                .from('users')
                .select('count', { count: 'exact', head: true });

            if (error && !error.message.includes('relation "users" does not exist')) {
                console.error('[SupabaseConfig] 🚨 Erreur connexion:', error.message);
                return false;
            }

            console.log('[SupabaseConfig] ✅ Connexion Supabase validée');
            return true;
        } catch (error) {
            console.warn('[SupabaseConfig] ⚠️ Test de connexion échoué:', error.message);
            return false;
        }
    }

    // === MÉTHODES DE CONFIGURATION ===

    getConfig() {
        return {
            url: this.url,
            anonKey: this.anonKey,
            client: this.client,
            initialized: this.initialized,
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            },
            roles: this.roles,
            licenseStatus: this.licenseStatus,
            connectionStatus: this.connectionStatus,
            defaultAdmins: this.defaultAdmins
        };
    }

    getClient() {
        return this.client;
    }

    isInitialized() {
        return this.initialized && this.client !== null;
    }

    // === MÉTHODES UTILITAIRES POUR LES RÔLES ===

    canManageUsers(userRole) {
        return [this.roles.SUPER_ADMIN, this.roles.COMPANY_ADMIN].includes(userRole);
    }

    canBlockUsers(userRole) {
        return [this.roles.SUPER_ADMIN, this.roles.COMPANY_ADMIN].includes(userRole);
    }

    canManageCompanies(userRole) {
        return userRole === this.roles.SUPER_ADMIN;
    }

    isSuperAdmin(userRole) {
        return userRole === this.roles.SUPER_ADMIN;
    }

    isCompanyAdmin(userRole) {
        return userRole === this.roles.COMPANY_ADMIN;
    }

    isDefaultAdmin(email) {
        return this.defaultAdmins.includes(email.toLowerCase());
    }

    getRoleForEmail(email) {
        if (this.isDefaultAdmin(email)) {
            return this.roles.COMPANY_ADMIN;
        }
        return this.roles.USER;
    }

    // === MÉTHODES UTILITAIRES POUR LES STATUTS ===

    isLicenseActive(status) {
        return [this.licenseStatus.ACTIVE, this.licenseStatus.TRIAL].includes(status);
    }

    isLicenseBlocked(status) {
        return status === this.licenseStatus.BLOCKED;
    }

    isConnectionAllowed(status) {
        return status === this.connectionStatus.ALLOWED;
    }

    isConnectionBlocked(status) {
        return [
            this.connectionStatus.BLOCKED, 
            this.connectionStatus.SUSPENDED
        ].includes(status);
    }

    getLicenseStatusLabel(status) {
        switch (status) {
            case this.licenseStatus.ACTIVE: return 'Actif';
            case this.licenseStatus.TRIAL: return 'Période d\'essai';
            case this.licenseStatus.EXPIRED: return 'Expiré';
            case this.licenseStatus.BLOCKED: return 'Bloqué';
            case this.licenseStatus.PENDING: return 'En attente';
            default: return 'Inconnu';
        }
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

    getRoleLabel(role) {
        switch (role) {
            case this.roles.SUPER_ADMIN: return 'Super Administrateur';
            case this.roles.COMPANY_ADMIN: return 'Administrateur de Société';
            case this.roles.USER: return 'Utilisateur';
            case this.roles.BLOCKED: return 'Bloqué';
            default: return 'Utilisateur';
        }
    }

    // === MÉTHODES DE VÉRIFICATION DES TABLES ===

    async checkTablesExist() {
        if (!this.client) {
            console.warn('[SupabaseConfig] ⚠️ Client non initialisé');
            return { allExist: false, tables: {} };
        }

        const requiredTables = ['users', 'companies'];
        const optionalTables = ['analytics_events', 'admin_actions'];
        const allTables = [...requiredTables, ...optionalTables];
        
        const results = {};

        console.log('[SupabaseConfig] 🔍 Vérification des tables...');

        for (const table of allTables) {
            try {
                const { error } = await this.client
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .limit(0);

                results[table] = !error;
                
                if (error) {
                    console.warn(`[SupabaseConfig] ⚠️ Table '${table}' non trouvée:`, error.message);
                } else {
                    console.log(`[SupabaseConfig] ✅ Table '${table}' existe`);
                }
            } catch (error) {
                results[table] = false;
                console.warn(`[SupabaseConfig] ❌ Erreur vérification table '${table}':`, error.message);
            }
        }

        const allExist = requiredTables.every(table => results[table]);
        const someExist = Object.values(results).some(exists => exists);
        
        if (allExist) {
            console.log('[SupabaseConfig] ✅ Toutes les tables requises existent');
        } else if (someExist) {
            console.warn('[SupabaseConfig] ⚠️ Certaines tables manquantes:', requiredTables.filter(t => !results[t]));
        } else {
            console.error('[SupabaseConfig] ❌ Aucune table trouvée - Base de données non configurée');
        }

        return { allExist, tables: results, requiredTables, optionalTables };
    }

    // === MÉTHODES DE STATISTIQUES ===

    async getDatabaseStats() {
        if (!this.client) {
            console.warn('[SupabaseConfig] ⚠️ Client non initialisé');
            return null;
        }

        try {
            console.log('[SupabaseConfig] 📊 Récupération des statistiques...');
            const stats = {};

            // Compter les utilisateurs
            try {
                const { count: usersCount } = await this.client
                    .from('users')
                    .select('*', { count: 'exact', head: true });
                stats.users = usersCount || 0;
            } catch (error) {
                stats.users = 0;
            }

            // Compter les sociétés
            try {
                const { count: companiesCount } = await this.client
                    .from('companies')
                    .select('*', { count: 'exact', head: true });
                stats.companies = companiesCount || 0;
            } catch (error) {
                stats.companies = 0;
            }

            // Compter les événements analytics si la table existe
            try {
                const { count: eventsCount } = await this.client
                    .from('analytics_events')
                    .select('*', { count: 'exact', head: true });
                stats.events = eventsCount || 0;
            } catch (error) {
                stats.events = 0;
            }

            console.log('[SupabaseConfig] 📊 Statistiques récupérées:', stats);
            return stats;
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur récupération statistiques:', error);
            return null;
        }
    }

    // === MÉTHODES DE GESTION DES UTILISATEURS ===

    async createUser(userData) {
        if (!this.client) throw new Error('Client non initialisé');

        try {
            // Assigner le rôle approprié selon l'email
            const role = this.getRoleForEmail(userData.email);
            
            const userToCreate = {
                ...userData,
                role: role,
                license_status: this.licenseStatus.ACTIVE,
                license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                first_login_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            };

            const { data, error } = await this.client
                .from('users')
                .insert([userToCreate])
                .select()
                .single();

            if (error) throw error;

            console.log(`[SupabaseConfig] ✅ Utilisateur créé: ${userData.email} (${role})`);
            return data;
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur création utilisateur:', error);
            throw error;
        }
    }

    async createCompany(companyData) {
        if (!this.client) throw new Error('Client non initialisé');

        try {
            const { data, error } = await this.client
                .from('companies')
                .insert([companyData])
                .select()
                .single();

            if (error) throw error;

            console.log(`[SupabaseConfig] ✅ Société créée: ${companyData.name}`);
            return data;
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur création société:', error);
            throw error;
        }
    }

    // === MÉTHODES DE VALIDATION ===

    validateUserData(userData) {
        const errors = [];

        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push('Email invalide');
        }

        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('Nom requis (minimum 2 caractères)');
        }

        if (userData.role && !Object.values(this.roles).includes(userData.role)) {
            errors.push('Rôle invalide');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateCompanyData(companyData) {
        const errors = [];

        if (!companyData.name || companyData.name.trim().length < 2) {
            errors.push('Nom de société requis (minimum 2 caractères)');
        }

        if (companyData.domain && !this.isValidDomain(companyData.domain)) {
            errors.push('Domaine invalide');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    // === MÉTHODES DE LOGGING ===

    async logActivity(activity, details = {}) {
        try {
            if (this.client) {
                await this.client
                    .from('admin_actions')
                    .insert([{
                        action: activity,
                        details: details,
                        timestamp: new Date().toISOString(),
                        ip_address: 'unknown'
                    }]);
            }
        } catch (error) {
            // Log en console si impossible de sauvegarder en base
            console.log(`[SupabaseConfig] 📝 Activité: ${activity}`, details);
        }
    }
}

// === EXPORT ET INITIALISATION ===

// Créer l'instance singleton
window.supabaseConfig = new SupabaseConfig();

// Fonction globale pour accéder au client Supabase
window.getSupabaseClient = function() {
    return window.supabaseConfig.getClient();
};

// Fonction d'initialisation asynchrone
window.initializeSupabase = async function() {
    try {
        console.log('[SupabaseConfig] 🚀 Initialisation Supabase...');
        
        // Attendre que le client soit prêt
        let attempts = 0;
        while (!window.supabaseConfig.isInitialized() && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (!window.supabaseConfig.isInitialized()) {
            throw new Error('Impossible d\'initialiser Supabase après 10 secondes');
        }

        console.log('[SupabaseConfig] ✅ Supabase initialisé avec succès');
        return true;
    } catch (error) {
        console.error('[SupabaseConfig] ❌ Erreur initialisation Supabase:', error);
        return false;
    }
};

// Fonction de diagnostic
window.diagnoseSupabase = function() {
    console.group('🔍 DIAGNOSTIC SUPABASE - EmailSortPro');
    
    const config = window.supabaseConfig;
    
    console.log('🌐 Configuration:');
    console.log('  URL:', config.url);
    console.log('  Clé anonyme:', config.anonKey.substring(0, 20) + '...');
    console.log('  Client initialisé:', config.isInitialized());
    
    console.log('🔧 Méthodes disponibles:');
    console.log('  config.getClient() - Obtenir le client Supabase');
    console.log('  config.checkTablesExist() - Vérifier les tables');
    console.log('  config.getDatabaseStats() - Statistiques de la base');
    console.log('  config.testConnection() - Tester la connexion');
    console.log('  initializeSupabase() - Initialiser Supabase');
    
    console.log('👥 Rôles configurés:', config.roles);
    console.log('📄 Statuts de licence:', config.licenseStatus);
    console.log('🔒 Statuts de connexion:', config.connectionStatus);
    console.log('👨‍💼 Admins par défaut:', config.defaultAdmins);
    
    console.groupEnd();
    
    return {
        url: config.url,
        clientReady: config.isInitialized(),
        roles: config.roles,
        licenseStatus: config.licenseStatus,
        connectionStatus: config.connectionStatus,
        defaultAdmins: config.defaultAdmins
    };
};

// Auto-diagnostic et initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[SupabaseConfig] 🚀 Configuration EmailSortPro chargée');
    
    // Attendre un peu pour que Supabase soit complètement chargé
    setTimeout(async () => {
        try {
            const config = window.supabaseConfig;
            
            if (config.isInitialized()) {
                // Vérifier les tables
                const tablesCheck = await config.checkTablesExist();
                
                if (tablesCheck.allExist) {
                    // Obtenir les statistiques
                    await config.getDatabaseStats();
                    console.log('[SupabaseConfig] ✅ Base de données prête');
                } else {
                    console.warn('[SupabaseConfig] ⚠️ Base de données incomplète');
                }
            } else {
                console.warn('[SupabaseConfig] ⚠️ Client non initialisé');
            }
        } catch (error) {
            console.error('[SupabaseConfig] ❌ Erreur lors du diagnostic:', error);
        }
    }, 2000);
});

// Instructions pour les développeurs
console.log(`
🎯 CONFIGURATION SUPABASE EMAILSORTPRO PRÊTE

📋 Pour utiliser:
   - Client Supabase: window.getSupabaseClient()
   - Configuration: window.supabaseConfig.getConfig()
   - Initialisation: await initializeSupabase()
   - Diagnostic: diagnoseSupabase()

⚙️ Base de données:
   - URL: https://oxyiamruvyliueecpaam.supabase.co
   - Mode: Production avec clé anonyme
   - Tables requises: users, companies
   - Tables optionnelles: analytics_events, admin_actions

🔒 Sécurité:
   - Seule la clé anonyme est exposée (normal)
   - Permissions gérées par Row Level Security (RLS)
   - Clé secrète gardée côté serveur Supabase

👨‍💼 Administration:
   - vianney.hastings@hotmail.fr = Administrateur par défaut
   - Autres utilisateurs = Utilisateurs normaux
   - Rôles: super_admin, company_admin, user

💡 Pour déboguer: diagnoseSupabase()
`);

console.log('[SupabaseConfig] ✅ Configuration avec gestion des sociétés et rôles chargée');
