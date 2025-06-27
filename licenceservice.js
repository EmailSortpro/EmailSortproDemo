// LicenseService.js - Service de gestion des licences EmailSortPro
// Version complète sans mode démo

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
            
            // Pas de mode dégradé - le service ne fonctionne que si les tables existent
            this.initialized = false;
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
                    
                    if (error) {
                        console.warn(`[LicenseService] ⚠️ Table '${table}' non accessible:`, error.message);
                    } else {
                        console.log(`[LicenseService] ✅ Table '${table}' accessible`);
                    }
                } catch (error) {
                    results[table] = false;
                    console.warn(`[LicenseService] ❌ Erreur vérification table '${table}':`, error.message);
                }
            }

            this.tablesExist = Object.values(results).every(exists => exists);
            
            if (this.tablesExist) {
                console.log('[LicenseService] ✅ Toutes les tables requises sont accessibles');
            } else {
                console.warn('[LicenseService] ⚠️ Tables manquantes ou inaccessibles:', Object.keys(results).filter(t => !results[t]));
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
            console.error('[LicenseService] Tables non disponibles');
            return {
                valid: false,
                status: 'tables_unavailable',
                message: 'Service non disponible - Tables de base de données manquantes'
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

            // Rechercher l'utilisateur - requête simplifiée
            let { data: user, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas - le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // Récupérer la société séparément si l'utilisateur a une company_id
            if (user && user.company_id) {
                const { data: company } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('id', user.company_id)
                    .single();
                
                user.company = company;
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
            
            return {
                valid: false,
                status: 'error',
                message: 'Erreur lors de la vérification de la licence: ' + error.message,
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

            // Créer l'utilisateur avec la structure réelle
            const newUserData = {
                email: email.toLowerCase(),
                name: email.split('@')[0],
                role: role,
                license_status: 'active',
                license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_login_at: new Date().toISOString()
            };

            // Ajouter company_id seulement si on a réussi à créer/récupérer la société
            if (company && company.id) {
                newUserData.company_id = company.id;
            }

            const { data: newUser, error } = await this.supabase
                .from('users')
                .insert([newUserData])
                .select('*')
                .single();

            if (error) throw error;

            newUser.company = company;
            console.log(`[LicenseService] ✅ Utilisateur créé: ${email} (${role})`);
            return newUser;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur création utilisateur:', error);
            throw error;
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
                    .select('*')
                    .single();

                if (createError) throw createError;
                company = newCompany;
                console.log(`[LicenseService] ✅ Société créée: ${company.name}`);
            } else if (error) {
                console.warn('[LicenseService] ⚠️ Erreur recherche société:', error);
                return null;
            }

            return company;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur gestion société:', error);
            return null;
        }
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
            console.warn('[LicenseService] Accès refusé ou tables manquantes');
            return {};
        }

        try {
            // Charger les utilisateurs avec requête simplifiée
            let usersQuery = this.supabase.from('users').select('*');

            // Si admin de société, filtrer par société
            if (this.currentUser.role === 'company_admin' && this.currentUser.company_id) {
                usersQuery = usersQuery.eq('company_id', this.currentUser.company_id);
            }

            const { data: users, error: usersError } = await usersQuery.order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Charger les sociétés séparément
            const { data: companies, error: companiesError } = await this.supabase
                .from('companies')
                .select('*');

            if (companiesError) throw companiesError;

            // Associer les sociétés aux utilisateurs
            const companiesMap = {};
            companies.forEach(company => {
                companiesMap[company.id] = company;
            });

            users.forEach(user => {
                if (user.company_id && companiesMap[user.company_id]) {
                    user.company = companiesMap[user.company_id];
                }
            });

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
            return {};
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
            // Bloquer tous les utilisateurs de la société
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
            // Débloquer tous les utilisateurs de la société
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

    // === LOGGING DES ACTIONS ADMIN ===
    async logAdminAction(action, details = {}) {
        if (!this.currentUser || !this.tablesExist) return;

        // Log en console pour cette version
        console.log(`[LicenseService] 📝 Action admin: ${action}`, {
            admin: this.currentUser.email,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });

        // Tentative de sauvegarde en base si la table existe
        try {
            await this.supabase
                .from('admin_actions')
                .insert([{
                    admin_user_id: this.currentUser.id,
                    admin_email: this.currentUser.email,
                    action: action,
                    details: details,
                    timestamp: new Date().toISOString(),
                    ip_address: 'unknown'
                }]);
        } catch (error) {
            // Ignorer l'erreur si la table n'existe pas
            console.warn('[LicenseService] Impossible de sauvegarder l\'action admin (table admin_actions manquante)');
        }
    }

    // === MÉTHODES DE VÉRIFICATION DES DROITS ===
    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        if (!this.tablesExist || !this.currentUser) return false;
        
        return ['company_admin', 'super_admin'].includes(this.currentUser.role);
    }

    isSuperAdmin() {
        if (!this.tablesExist || !this.currentUser) return false;
        
        return this.currentUser.role === 'super_admin';
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

        // Log en console pour cette version
        console.log(`[LicenseService] 📊 Événement: ${eventType}`, {
            user: this.currentUser.email,
            data: eventData,
            timestamp: new Date().toISOString()
        });

        // Tentative de sauvegarde en base si la table existe
        try {
            await this.supabase
                .from('analytics_events')
                .insert([{
                    user_id: this.currentUser.id,
                    event_type: eventType,
                    event_data: {
                        ...eventData,
                        email: this.currentUser.email,
                        company_id: this.currentUser.company_id
                    }
                }]);
        } catch (error) {
            // Ignorer l'erreur si la table n'existe pas
            console.warn('[LicenseService] Impossible de sauvegarder l\'événement (table analytics_events manquante)');
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
        
        // Supprimer l'email stocké
        try {
            localStorage.removeItem('userEmail');
        } catch (error) {
            console.warn('[LicenseService] Impossible de supprimer l\'email du localStorage');
        }
        
        // Rediriger vers la page de connexion
        window.location.href = '/';
    }

    // === MÉTHODES DE DIAGNOSTIC ===
    async getDiagnosticInfo() {
        const info = {
            initialized: this.initialized,
            tablesExist: this.tablesExist,
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                role: this.currentUser.role,
                company: this.currentUser.company?.name
            } : null,
            permissions: {
                isAdmin: this.isAdmin(),
                isSuperAdmin: this.isSuperAdmin(),
                canBlockUsers: this.canBlockUsers(),
                canBlockCompanies: this.canBlockCompanies()
            }
        };

        if (this.tablesExist) {
            try {
                // Compter les utilisateurs
                const { count: userCount } = await this.supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });
                
                // Compter les sociétés
                const { count: companyCount } = await this.supabase
                    .from('companies')
                    .select('*', { count: 'exact', head: true });

                info.stats = {
                    totalUsers: userCount || 0,
                    totalCompanies: companyCount || 0
                };
            } catch (error) {
                info.stats = { error: error.message };
            }
        }

        return info;
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

// Fonction de diagnostic globale
window.diagnoseLicenseService = async function() {
    console.group('🔍 DIAGNOSTIC LICENSE SERVICE');
    const info = await window.licenseService.getDiagnosticInfo();
    console.log('Service info:', info);
    console.groupEnd();
    return info;
};

console.log('✅ LicenseService EmailSortPro chargé (sans mode démo)');
console.log('💡 Utilisez window.licenseService pour accéder au service');
console.log('🔍 Utilisez diagnoseLicenseService() pour le diagnostic');
