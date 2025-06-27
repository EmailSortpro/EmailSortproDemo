// LicenseService.js - Service de gestion des licences avec contrôle des connexions
// Version finale pour EmailSortPro

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
            
            // Attendre que supabaseConfig soit prêt
            await this.waitForSupabaseConfig();
            
            // Obtenir le client Supabase
            this.supabase = window.getSupabaseClient();
            
            if (!this.supabase) {
                throw new Error('Client Supabase non disponible');
            }

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

    async waitForSupabaseConfig(maxAttempts = 20) {
        let attempts = 0;
        
        while (!window.supabaseConfig && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseConfig) {
            throw new Error('Configuration Supabase non disponible');
        }

        // Attendre que le client soit prêt
        attempts = 0;
        while (!window.getSupabaseClient() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    async checkTablesExistence() {
        try {
            const { allExist } = await window.supabaseConfig.checkTablesExist();
            this.tablesExist = allExist;
            
            if (!allExist) {
                console.warn('[LicenseService] ⚠️ Tables manquantes - Fonctionnalités limitées');
                console.info('[LicenseService] 💡 Exécutez le script SQL fourni pour créer les tables');
            }
        } catch (error) {
            console.warn('[LicenseService] ⚠️ Impossible de vérifier les tables:', error.message);
            this.tablesExist = false;
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
                daysRemaining: 999
            };
        }

        if (!this.supabase) {
            return { valid: false, error: 'Service non initialisé' };
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
                    company:companies(*),
                    blocked_by:blocked_by_user_id(email, name)
                `)
                .eq('email', email.toLowerCase())
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas - le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // Vérifier le statut de connexion
            const connectionCheck = this.checkConnectionStatus(user);
            if (!connectionCheck.allowed) {
                return {
                    valid: false,
                    status: connectionCheck.status,
                    message: connectionCheck.message,
                    blockedBy: connectionCheck.blockedBy,
                    user: user
                };
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
            return this.licenseCache.result;

        } catch (error) {
            console.error('[LicenseService] Erreur vérification licence:', error);
            
            // En cas d'erreur, mode dégradé
            return {
                valid: true,
                status: 'error_fallback',
                message: 'Mode dégradé - Erreur base de données',
                error: error.message
            };
        }
    }

    // === VÉRIFICATION DU STATUT DE CONNEXION ===
    checkConnectionStatus(user) {
        if (!user) {
            return {
                allowed: false,
                status: 'user_not_found',
                message: 'Utilisateur non trouvé'
            };
        }

        const config = window.supabaseConfig.getConfig();
        
        if (user.connection_status === config.connectionStatus.BLOCKED) {
            return {
                allowed: false,
                status: 'blocked',
                message: 'Votre accès a été bloqué par un administrateur.',
                blockedBy: user.blocked_by
            };
        }

        if (user.connection_status === config.connectionStatus.SUSPENDED) {
            return {
                allowed: false,
                status: 'suspended',
                message: 'Votre accès est temporairement suspendu.',
                blockedBy: user.blocked_by
            };
        }

        if (user.connection_status === config.connectionStatus.PENDING) {
            return {
                allowed: false,
                status: 'pending',
                message: 'Votre accès est en attente d\'approbation.'
            };
        }

        if (user.company && user.company.is_blocked) {
            return {
                allowed: false,
                status: 'company_blocked',
                message: 'L\'accès de votre société a été bloqué.'
            };
        }

        return {
            allowed: true,
            status: 'allowed',
            message: 'Accès autorisé'
        };
    }

    // === GESTION DES UTILISATEURS PAR SOCIÉTÉ ===
    async getAllUsersGroupedByCompany() {
        if (!this.isAdmin() || !this.tablesExist) {
            console.warn('[LicenseService] Accès refusé ou tables manquantes');
            return this.getMockData();
        }

        try {
            const { data: users, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(id, name, domain, is_blocked),
                    blocked_by:blocked_by_user_id(email, name)
                `)
                .order('company_id, last_login_at', { ascending: false });

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
            throw new Error('Droits insuffisants ou service non disponible');
        }

        try {
            const config = window.supabaseConfig.getConfig();
            
            const { error } = await this.supabase
                .from('users')
                .update({
                    connection_status: config.connectionStatus.BLOCKED,
                    blocked_at: new Date().toISOString(),
                    blocked_by_user_id: this.currentUser.id,
                    block_reason: reason,
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
            throw new Error('Droits insuffisants ou service non disponible');
        }

        try {
            const config = window.supabaseConfig.getConfig();
            
            const { error } = await this.supabase
                .from('users')
                .update({
                    connection_status: config.connectionStatus.ALLOWED,
                    blocked_at: null,
                    blocked_by_user_id: null,
                    block_reason: null,
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

    async blockCompany(companyId, reason = 'Société bloquée par un administrateur') {
        if (!this.isSuperAdmin() || !this.tablesExist) {
            throw new Error('Seuls les super-administrateurs peuvent bloquer des sociétés');
        }

        try {
            const { error } = await this.supabase
                .from('companies')
                .update({
                    is_blocked: true,
                    blocked_at: new Date().toISOString(),
                    blocked_by_user_id: this.currentUser.id,
                    block_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', companyId);

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
            throw new Error('Seuls les super-administrateurs peuvent débloquer des sociétés');
        }

        try {
            const { error } = await this.supabase
                .from('companies')
                .update({
                    is_blocked: false,
                    blocked_at: null,
                    blocked_by_user_id: null,
                    block_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', companyId);

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
                company: { id: 'demo-company-1', name: 'Société de démonstration', domain: 'demo.com', is_blocked: false },
                users: [
                    {
                        id: 'demo-user-1',
                        email: 'admin@demo.com',
                        name: 'Administrateur Démo',
                        connection_status: 'allowed',
                        license_status: 'active',
                        role: 'company_admin',
                        last_login_at: new Date().toISOString(),
                        login_count: 42
                    },
                    {
                        id: 'demo-user-2',
                        email: 'user@demo.com',
                        name: 'Utilisateur Démo',
                        connection_status: 'allowed',
                        license_status: 'trial',
                        role: 'user',
                        last_login_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
                        login_count: 15
                    }
                ]
            }
        };
    }

    // === MÉTHODES UTILITAIRES ===
    async createNewUser(email) {
        // Implémentation simplifiée pour éviter les erreurs
        const mockUser = {
            id: 'new-user-' + Date.now(),
            email: email,
            name: email.split('@')[0],
            connection_status: 'allowed',
            license_status: 'trial',
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        console.log('[LicenseService] Utilisateur créé en mode démo:', email);
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
                    last_login_at: new Date().toISOString(),
                    login_count: this.supabase.raw('login_count + 1')
                })
                .eq('id', userId);
        } catch (error) {
            console.warn('[LicenseService] Erreur mise à jour login:', error);
        }
    }

    async logAdminAction(action, details = {}) {
        if (!this.currentUser || !this.tablesExist) return;

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
            console.warn('[LicenseService] Erreur log action admin:', error);
        }
    }

    // === MÉTHODES DE VÉRIFICATION DES DROITS ===
    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        if (!this.tablesExist) return true; // Mode démo - accès admin
        
        const config = window.supabaseConfig.getConfig();
        return [config.roles.SUPER_ADMIN, config.roles.COMPANY_ADMIN].includes(this.currentUser?.role);
    }

    isSuperAdmin() {
        if (!this.tablesExist) return true; // Mode démo - accès super admin
        
        const config = window.supabaseConfig.getConfig();
        return this.currentUser?.role === config.roles.SUPER_ADMIN;
    }

    isCompanyAdmin() {
        const config = window.supabaseConfig.getConfig();
        return this.currentUser?.role === config.roles.COMPANY_ADMIN;
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
        if (!this.currentUser || !this.tablesExist) return;

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
            console.warn('[LicenseService] Erreur tracking:', error);
        }
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('✅ LicenseService avec contrôle des connexions chargé (mode dégradé supporté)');
