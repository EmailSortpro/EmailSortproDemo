// LicenseService.js - Service de gestion des licences avec contrôle des connexions
// Version corrigée pour EmailSortPro avec gestion des administrateurs par société

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.licenseCache = null;
        this.initialized = false;
        this.userCache = new Map();
        this.companyCache = new Map();
        this.tablesExist = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('[LicenseService] Initialisation...');
            
            // Vérifier la disponibilité de Supabase
            if (!window.supabase) {
                throw new Error('Supabase non disponible');
            }

            // Configuration Supabase
            const SUPABASE_URL = 'https://oxyiamruvyliueecpaam.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlhbXJ1dnlsaXVlZWNwYWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDM0MTgsImV4cCI6MjA2NTk3OTQxOH0.Wy_jbUB7D5Bly-rZB6oc2bXUHzZQ8MivDL4vdM1jcE0';

            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Vérifier si les tables existent
            await this.checkTablesExistence();
            
            this.initialized = true;
            console.log('[LicenseService] ✅ Initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur initialisation:', error);
            console.warn('[LicenseService] 🔄 Mode dégradé - Fonctions admin désactivées');
            
            // Mode dégradé - service partiellement fonctionnel
            this.initialized = true;
            this.tablesExist = false;
            return false;
        }
    }

    async checkTablesExistence() {
        try {
            const requiredTables = ['users', 'companies'];
            const results = {};

            for (const table of requiredTables) {
                try {
                    const { error } = await this.supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true })
                        .limit(0);

                    results[table] = !error;
                } catch (error) {
                    results[table] = false;
                }
            }

            this.tablesExist = Object.values(results).every(exists => exists);
            
            if (this.tablesExist) {
                console.log('[LicenseService] ✅ Toutes les tables requises existent');
            } else {
                console.warn('[LicenseService] ⚠️ Tables manquantes:', Object.keys(results).filter(t => !results[t]));
            }

            return { allExist: this.tablesExist, tables: results };
        } catch (error) {
            console.warn('[LicenseService] ⚠️ Impossible de vérifier les tables:', error.message);
            this.tablesExist = false;
            return { allExist: false, tables: {} };
        }
    }

    // === VÉRIFICATION DE LA LICENCE ===
    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        
        if (!this.tablesExist) {
            return {
                valid: true, // Mode dégradé - autoriser l'accès
                status: 'demo_mode',
                message: 'Mode démonstration - Tables non configurées',
                daysRemaining: 999,
                user: this.createMockUser(email)
            };
        }

        try {
            // Vérifier dans le cache
            if (this.licenseCache && this.licenseCache.email === email) {
                const cacheAge = Date.now() - this.licenseCache.timestamp;
                if (cacheAge < 2 * 60 * 1000) {
                    return this.licenseCache.result;
                }
            }

            // Rechercher l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    *, 
                    company:companies(*)
                `)
                .eq('email', email.toLowerCase())
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas - le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);

            // Évaluer le statut de la licence
            const licenseStatus = this.evaluateLicenseStatus(user);

            // Mettre en cache
            this.licenseCache = {
                email: email,
                timestamp: Date.now(),
                result: {
                    valid: licenseStatus.valid,
                    status: licenseStatus.status,
                    user: user,
                    message: licenseStatus.message,
                    daysRemaining: licenseStatus.daysRemaining,
                    connectionAllowed: true
                }
            };

            this.currentUser = user;
            
            // Exposer l'utilisateur globalement pour les autres modules
            window.currentUser = user;
            
            return this.licenseCache.result;

        } catch (error) {
            console.error('[LicenseService] Erreur vérification licence:', error);
            
            // En cas d'erreur, mode dégradé avec utilisateur mock
            const mockUser = this.createMockUser(email);
            return {
                valid: true,
                status: 'error_fallback',
                message: 'Mode dégradé - Erreur base de données',
                user: mockUser,
                error: error.message
            };
        }
    }

    // === CRÉATION D'UTILISATEUR ===
    async createNewUser(email) {
        try {
            // Obtenir ou créer la société basée sur le domaine
            const domain = email.split('@')[1];
            const company = await this.getOrCreateCompany(domain);

            // Déterminer le rôle (vianney.hastings@hotmail.fr est admin par défaut)
            const role = email.toLowerCase() === 'vianney.hastings@hotmail.fr' ? 'company_admin' : 'user';

            // Créer l'utilisateur
            const { data: newUser, error } = await this.supabase
                .from('users')
                .insert([
                    {
                        email: email.toLowerCase(),
                        name: email.split('@')[0],
                        company_id: company.id,
                        role: role,
                        license_status: 'active',
                        license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        first_login_at: new Date().toISOString(),
                        last_login_at: new Date().toISOString()
                    }
                ])
                .select(`
                    *,
                    company:companies(*)
                `)
                .single();

            if (error) throw error;

            console.log(`[LicenseService] ✅ Utilisateur créé: ${email} (${role})`);
            return newUser;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur création utilisateur:', error);
            // Retourner un utilisateur mock en cas d'erreur
            return this.createMockUser(email);
        }
    }

    async getOrCreateCompany(domain) {
        try {
            // Chercher la société existante
            let { data: company, error } = await this.supabase
                .from('companies')
                .select('*')
                .eq('domain', domain)
                .single();

            if (error && error.code === 'PGRST116') {
                // Créer la société
                const { data: newCompany, error: createError } = await this.supabase
                    .from('companies')
                    .insert([
                        {
                            name: `Société ${domain}`,
                            domain: domain
                        }
                    ])
                    .select()
                    .single();

                if (createError) throw createError;
                company = newCompany;
                console.log(`[LicenseService] ✅ Société créée: ${company.name}`);
            } else if (error) {
                throw error;
            }

            return company;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur gestion société:', error);
            // Retourner une société mock
            return {
                id: 'mock-company-' + Date.now(),
                name: `Société ${domain}`,
                domain: domain
            };
        }
    }

    createMockUser(email) {
        // Créer un utilisateur fictif pour le mode dégradé
        const role = email.toLowerCase() === 'vianney.hastings@hotmail.fr' ? 'company_admin' : 'user';
        const domain = email.split('@')[1];
        
        const mockUser = {
            id: 'mock-user-' + Date.now(),
            email: email,
            name: email.split('@')[0],
            role: role,
            license_status: 'active',
            company_id: 'mock-company-1',
            company: {
                id: 'mock-company-1',
                name: `Société ${domain}`,
                domain: domain
            },
            created_at: new Date().toISOString(),
            last_login_at: new Date().toISOString(),
            license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        console.log(`[LicenseService] 🧪 Utilisateur mock créé: ${email} (${role})`);
        return mockUser;
    }

    evaluateLicenseStatus(user) {
        if (user.license_status === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Accès bloqué. Veuillez contacter votre administrateur.'
            };
        }

        if (user.license_status === 'active' || user.license_status === 'trial') {
            return {
                valid: true,
                status: user.license_status,
                message: user.license_status === 'trial' ? 'Période d\'essai' : 'Licence active',
                daysRemaining: 30
            };
        }

        return {
            valid: false,
            status: 'invalid',
            message: 'Statut de licence invalide'
        };
    }

    async updateLastLogin(userId) {
        if (!this.tablesExist) return;
        
        try {
            await this.supabase
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.warn('[LicenseService] Erreur mise à jour login:', error);
        }
    }

    // === GESTION DES UTILISATEURS PAR SOCIÉTÉ ===
    async getAllUsersGroupedByCompany() {
        if (!this.isAdmin() || !this.tablesExist) {
            console.warn('[LicenseService] Accès refusé ou tables manquantes - retour données mock');
            return this.getMockData();
        }

        try {
            let query = this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `);

            // Si admin de société, filtrer par société
            if (this.currentUser.role === 'company_admin') {
                query = query.eq('company_id', this.currentUser.company_id);
            }

            const { data: users, error } = await query.order('company_id, last_login_at', { ascending: false });

            if (error) throw error;

            // Grouper par société
            const groupedUsers = {};
            users.forEach(user => {
                const companyKey = user.company ? user.company.id : 'no_company';
                const companyName = user.company ? user.company.name : 'Sans société';
                
                if (!groupedUsers[companyKey]) {
                    groupedUsers[companyKey] = {
                        company: user.company || { id: null, name: companyName, domain: null },
                        users: []
                    };
                }
                
                groupedUsers[companyKey].users.push(user);
            });

            return groupedUsers;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération utilisateurs groupés:', error);
            return this.getMockData();
        }
    }

    // === CONTRÔLE DES CONNEXIONS ===
    async blockUser(userId, reason = 'Bloqué par un administrateur') {
        if (!this.canBlockUsers() || !this.tablesExist) {
            return { success: false, error: 'Droits insuffisants ou service non disponible' };
        }

        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'blocked',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            this.invalidateCache();
            await this.logAdminAction('block_user', { target_user_id: userId, reason: reason });

            return { success: true, message: 'Utilisateur bloqué avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur blocage utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    async unblockUser(userId) {
        if (!this.canBlockUsers() || !this.tablesExist) {
            return { success: false, error: 'Droits insuffisants ou service non disponible' };
        }

        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            this.invalidateCache();
            await this.logAdminAction('unblock_user', { target_user_id: userId });

            return { success: true, message: 'Utilisateur débloqué avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur déblocage utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    // === GESTION DES SOCIÉTÉS (Super Admin uniquement) ===
    async blockCompany(companyId, reason = 'Société bloquée par un administrateur') {
        if (!this.isSuperAdmin() || !this.tablesExist) {
            return { success: false, error: 'Seuls les super-administrateurs peuvent bloquer des sociétés' };
        }

        try {
            // Pour cette version, on bloque tous les utilisateurs de la société
            const { error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'blocked',
                    updated_at: new Date().toISOString()
                })
                .eq('company_id', companyId);

            if (error) throw error;

            this.invalidateCache();
            await this.logAdminAction('block_company', { company_id: companyId, reason: reason });

            return { success: true, message: 'Société bloquée avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur blocage société:', error);
            return { success: false, error: error.message };
        }
    }

    async unblockCompany(companyId) {
        if (!this.isSuperAdmin() || !this.tablesExist) {
            return { success: false, error: 'Seuls les super-administrateurs peuvent débloquer des sociétés' };
        }

        try {
            // Pour cette version, on débloque tous les utilisateurs de la société
            const { error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('company_id', companyId);

            if (error) throw error;

            this.invalidateCache();
            await this.logAdminAction('unblock_company', { company_id: companyId });

            return { success: true, message: 'Société débloquée avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur déblocage société:', error);
            return { success: false, error: error.message };
        }
    }

    // === DONNÉES MOCK POUR MODE DÉGRADÉ ===
    getMockData() {
        return {
            'demo-company-1': {
                company: { 
                    id: 'demo-company-1', 
                    name: 'Société de démonstration', 
                    domain: 'demo.com'
                },
                users: [
                    {
                        id: 'vianney-demo',
                        email: 'vianney.hastings@hotmail.fr',
                        name: 'Vianney Hastings',
                        license_status: 'active',
                        role: 'company_admin',
                        last_login_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'demo-user-1',
                        email: 'admin@demo.com',
                        name: 'Administrateur Démo',
                        license_status: 'active',
                        role: 'user',
                        last_login_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'demo-user-2',
                        email: 'user@demo.com',
                        name: 'Utilisateur Démo',
                        license_status: 'trial',
                        role: 'user',
                        last_login_at: new Date(Date.now() - 48*60*60*1000).toISOString(),
                        created_at: new Date().toISOString()
                    }
                ]
            }
        };
    }

    // === LOGGING DES ACTIONS ADMIN ===
    async logAdminAction(action, details = {}) {
        if (!this.currentUser || !this.tablesExist) return;

        // Pour cette version, on log en console
        console.log(`[LicenseService] 📝 Action admin: ${action}`, {
            admin: this.currentUser.email,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    // === MÉTHODES DE VÉRIFICATION DES DROITS ===
    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        if (!this.tablesExist) return true; // Mode démo - accès admin
        
        return this.currentUser && ['company_admin', 'super_admin'].includes(this.currentUser.role);
    }

    isSuperAdmin() {
        if (!this.tablesExist) return true; // Mode démo - accès super admin
        
        return this.currentUser && this.currentUser.role === 'super_admin';
    }

    isCompanyAdmin() {
        return this.currentUser && this.currentUser.role === 'company_admin';
    }

    canBlockUsers() {
        return this.isAdmin();
    }

    canBlockCompanies() {
        return this.isSuperAdmin();
    }

    invalidateCache() {
        this.licenseCache = null;
        this.userCache.clear();
        this.companyCache.clear();
    }

    // === MÉTHODES ANALYTICS ===
    async trackEvent(eventType, eventData = {}) {
        if (!this.currentUser) return;

        // Pour cette version, on utilise l'analytics manager si disponible
        if (window.analyticsManager) {
            await window.analyticsManager.trackEvent(eventType, {
                ...eventData,
                email: this.currentUser.email,
                company_id: this.currentUser.company_id
            });
        } else {
            console.log(`[LicenseService] 📊 Événement: ${eventType}`, eventData);
        }
    }

    // === MÉTHODES UTILITAIRES ===
    getUserRole() {
        return this.currentUser?.role || 'user';
    }

    getCompanyId() {
        return this.currentUser?.company_id;
    }

    hasAccess() {
        return this.currentUser && this.currentUser.license_status === 'active';
    }

    checkLicenseStatus() {
        if (!this.currentUser) return 'invalid';
        return this.currentUser.license_status;
    }

    async logout() {
        this.currentUser = null;
        this.invalidateCache();
        window.currentUser = null;
        
        // Rediriger vers la page de connexion
        window.location.href = '/';
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

// Exposer les constantes pour compatibilité
window.LICENSE_STATUS = {
    ACTIVE: 'active',
    TRIAL: 'trial',
    EXPIRED: 'expired',
    BLOCKED: 'blocked'
};

window.USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    COMPANY_ADMIN: 'company_admin',
    USER: 'user'
};

console.log('✅ LicenseService avec contrôle des connexions chargé (mode dégradé supporté)');
console.log('💡 Utilisez window.licenseService pour accéder au service');
