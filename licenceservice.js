// LicenseService.js - Service de gestion des licences avec contrôle des connexions

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.licenseCache = null;
        this.initialized = false;
        this.userCache = new Map(); // Cache des utilisateurs
        this.companyCache = new Map(); // Cache des sociétés
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Vérifier la configuration
            if (!window.supabaseConfig) {
                throw new Error('Configuration Supabase manquante');
            }

            const config = window.supabaseConfig.getConfig();
            if (!config) {
                throw new Error('Configuration Supabase invalide');
            }

            // Utiliser le client Supabase déjà configuré
            this.supabase = window.supabaseConfig.getClient();
            
            if (!this.supabase) {
                // Attendre que le client soit prêt
                await this.waitForSupabaseClient();
            }

            this.initialized = true;
            console.log('[LicenseService] ✅ Initialisé avec gestion des connexions');
            
            // Tester la connexion
            await this.testDatabaseConnection();
            
            return true;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur initialisation:', error);
            return false;
        }
    }

    async waitForSupabaseClient(maxAttempts = 10) {
        let attempts = 0;
        
        while (!this.supabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.supabase = window.supabaseConfig.getClient();
            attempts++;
        }
        
        if (!this.supabase) {
            throw new Error('Client Supabase non disponible après attente');
        }
    }

    async testDatabaseConnection() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('count', { count: 'exact', head: true })
                .limit(0);

            if (error && !error.message.includes('relation "users" does not exist')) {
                console.warn('[LicenseService] ⚠️ Tables possiblement manquantes:', error.message);
            } else {
                console.log('[LicenseService] ✅ Connexion base de données validée');
            }
        } catch (error) {
            console.warn('[LicenseService] ⚠️ Test connexion échoué:', error.message);
        }
    }

    async loadSupabaseClient() {
        // Cette méthode n'est plus nécessaire car le client est géré par SupabaseConfig
        return Promise.resolve();
    }

    // === VÉRIFICATION DE LA LICENCE AVEC CONTRÔLE DE CONNEXION ===
    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        if (!this.supabase) return { valid: false, error: 'Service non initialisé' };

        try {
            // Vérifier d'abord dans le cache
            if (this.licenseCache && this.licenseCache.email === email) {
                const cacheAge = Date.now() - this.licenseCache.timestamp;
                if (cacheAge < 2 * 60 * 1000) { // Cache de 2 minutes pour plus de réactivité
                    return this.licenseCache.result;
                }
            }

            // Rechercher ou créer l'utilisateur avec informations de société
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
                // Utilisateur n'existe pas, le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // VÉRIFICATION CRITIQUE : Statut de connexion
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

            // Vérifier le statut de la licence
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
            return {
                valid: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    // === VÉRIFICATION DU STATUT DE CONNEXION ===
    checkConnectionStatus(user) {
        const config = window.supabaseConfig.getConfig();
        
        // Vérifier si l'utilisateur est bloqué
        if (user.connection_status === config.connectionStatus.BLOCKED) {
            return {
                allowed: false,
                status: 'blocked',
                message: 'Votre accès a été bloqué par un administrateur.',
                blockedBy: user.blocked_by
            };
        }

        // Vérifier si l'utilisateur est suspendu
        if (user.connection_status === config.connectionStatus.SUSPENDED) {
            return {
                allowed: false,
                status: 'suspended',
                message: 'Votre accès est temporairement suspendu.',
                blockedBy: user.blocked_by
            };
        }

        // Vérifier si l'utilisateur est en attente
        if (user.connection_status === config.connectionStatus.PENDING) {
            return {
                allowed: false,
                status: 'pending',
                message: 'Votre accès est en attente d\'approbation.',
                blockedBy: null
            };
        }

        // Vérifier si la société est bloquée
        if (user.company && user.company.is_blocked) {
            return {
                allowed: false,
                status: 'company_blocked',
                message: 'L\'accès de votre société a été bloqué.',
                blockedBy: null
            };
        }

        return {
            allowed: true,
            status: 'allowed',
            message: 'Accès autorisé'
        };
    }

    // === GESTION DES UTILISATEURS PAR SOCIÉTÉ ===
    async getAllCompaniesList() {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            const { data: companies, error } = await this.supabase
                .from('companies')
                .select(`
                    *,
                    users_count:users(count),
                    active_users_count:users!inner(count)
                `)
                .eq('users.connection_status', 'allowed')
                .order('name');

            if (error) throw error;

            // Mettre en cache
            companies.forEach(company => {
                this.companyCache.set(company.id, company);
            });

            return companies;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération sociétés:', error);
            return [];
        }
    }

    async getUsersByCompany(companyId) {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            const { data: users, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(name, domain),
                    blocked_by:blocked_by_user_id(email, name)
                `)
                .eq('company_id', companyId)
                .order('last_login_at', { ascending: false });

            if (error) throw error;

            // Mettre en cache
            users.forEach(user => {
                this.userCache.set(user.email, user);
            });

            return users;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération utilisateurs société:', error);
            return [];
        }
    }

    async getAllUsersGroupedByCompany() {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
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
            return {};
        }
    }

    // === CONTRÔLE DES CONNEXIONS ===
    async blockUser(userId, reason = 'Bloqué par un administrateur') {
        if (!this.canBlockUsers()) {
            throw new Error('Droits insuffisants pour bloquer des utilisateurs');
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

            // Invalider le cache
            this.invalidateCache();

            // Logger l'action
            await this.logAdminAction('block_user', { 
                target_user_id: userId, 
                reason: reason 
            });

            return { success: true, message: 'Utilisateur bloqué avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur blocage utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    async unblockUser(userId) {
        if (!this.canBlockUsers()) {
            throw new Error('Droits insuffisants pour débloquer des utilisateurs');
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

            // Invalider le cache
            this.invalidateCache();

            // Logger l'action
            await this.logAdminAction('unblock_user', { 
                target_user_id: userId 
            });

            return { success: true, message: 'Utilisateur débloqué avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur déblocage utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    async blockCompany(companyId, reason = 'Société bloquée par un administrateur') {
        if (!this.isSuperAdmin()) {
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

            // Invalider le cache
            this.invalidateCache();

            // Logger l'action
            await this.logAdminAction('block_company', { 
                company_id: companyId, 
                reason: reason 
            });

            return { success: true, message: 'Société bloquée avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur blocage société:', error);
            return { success: false, error: error.message };
        }
    }

    async unblockCompany(companyId) {
        if (!this.isSuperAdmin()) {
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

            // Invalider le cache
            this.invalidateCache();

            // Logger l'action
            await this.logAdminAction('unblock_company', { 
                company_id: companyId 
            });

            return { success: true, message: 'Société débloquée avec succès' };
        } catch (error) {
            console.error('[LicenseService] Erreur déblocage société:', error);
            return { success: false, error: error.message };
        }
    }

    // === LOGS D'ACTIONS ADMINISTRATIVES ===
    async logAdminAction(action, details = {}) {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('admin_actions')
                .insert([{
                    admin_user_id: this.currentUser.id,
                    admin_email: this.currentUser.email,
                    action: action,
                    details: details,
                    timestamp: new Date().toISOString(),
                    ip_address: await this.getClientIP()
                }]);
        } catch (error) {
            console.warn('[LicenseService] Erreur log action admin:', error);
        }
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // === MÉTHODES EXISTANTES ÉTENDUES ===
    async createNewUser(email) {
        const domain = email.split('@')[1];
        const name = email.split('@')[0];

        // Vérifier si c'est un domaine d'entreprise existant
        const { data: company } = await this.supabase
            .from('companies')
            .select('*')
            .eq('domain', domain)
            .single();

        const isPersonalEmail = this.isPersonalEmailDomain(domain);
        const config = window.supabaseConfig.getConfig();

        const newUser = {
            email: email.toLowerCase(),
            name: name,
            company_id: company?.id || null,
            role: isPersonalEmail ? config.roles.COMPANY_ADMIN : config.roles.USER,
            license_status: 'trial',
            license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            connection_status: config.connectionStatus.ALLOWED, // Autorisé par défaut
            first_login_at: new Date()
        };

        const { data, error } = await this.supabase
            .from('users')
            .insert([newUser])
            .select(`
                *, 
                company:companies(*),
                blocked_by:blocked_by_user_id(email, name)
            `)
            .single();

        if (error) throw error;

        // Si email personnel et pas de société, créer une société individuelle
        if (isPersonalEmail && !company) {
            await this.createPersonalCompany(data.id, email);
        }

        return data;
    }

    // Créer une société pour un particulier
    async createPersonalCompany(userId, email) {
        const companyName = `Personnel - ${email}`;
        
        const { data: company, error: companyError } = await this.supabase
            .from('companies')
            .insert([{
                name: companyName,
                domain: email, // Utiliser l'email comme domaine unique
                is_blocked: false
            }])
            .select()
            .single();

        if (companyError) {
            console.error('[LicenseService] Erreur création société:', companyError);
            return;
        }

        // Mettre à jour l'utilisateur avec la société
        await this.supabase
            .from('users')
            .update({ 
                company_id: company.id,
                role: window.supabaseConfig.getConfig().roles.COMPANY_ADMIN
            })
            .eq('id', userId);

        // Créer une licence trial
        await this.supabase
            .from('licenses')
            .insert([{
                company_id: company.id,
                user_id: userId,
                type: 'trial',
                seats: 1,
                used_seats: 1,
                status: 'active',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }]);
    }

    // Évaluer le statut de la licence (méthode existante)
    evaluateLicenseStatus(user) {
        // Vérifier si bloqué
        if (user.license_status === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Accès bloqué. Veuillez contacter votre administrateur.'
            };
        }

        // Vérifier l'expiration
        const expiresAt = new Date(user.license_expires_at);
        const now = new Date();

        if (expiresAt < now) {
            return {
                valid: false,
                status: 'expired',
                message: 'Votre licence a expiré. Veuillez la renouveler.'
            };
        }

        // Vérifier le statut
        if (user.license_status === 'active' || user.license_status === 'trial') {
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            return {
                valid: true,
                status: user.license_status,
                message: user.license_status === 'trial' 
                    ? `Période d'essai - ${daysRemaining} jours restants`
                    : 'Licence active',
                daysRemaining: daysRemaining
            };
        }

        return {
            valid: false,
            status: 'invalid',
            message: 'Statut de licence invalide'
        };
    }

    // Mettre à jour la dernière connexion
    async updateLastLogin(userId) {
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

    // Vérifier si c'est un domaine email personnel
    isPersonalEmailDomain(domain) {
        const personalDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
            'live.com', 'aol.com', 'icloud.com', 'mail.com',
            'protonmail.com', 'yandex.com', 'zoho.com', 'gmx.com',
            'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net'
        ];
        
        return personalDomains.includes(domain.toLowerCase());
    }

    // === MÉTHODES DE VÉRIFICATION DES DROITS ===
    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        const config = window.supabaseConfig.getConfig();
        return [config.roles.SUPER_ADMIN, config.roles.COMPANY_ADMIN].includes(this.currentUser?.role);
    }

    isSuperAdmin() {
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

    // Invalider le cache
    invalidateCache() {
        this.licenseCache = null;
        this.userCache.clear();
        this.companyCache.clear();
    }

    // === MÉTHODES ANALYTICS ===
    async trackEvent(eventType, eventData = {}) {
        if (!this.currentUser) return;

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

console.log('✅ LicenseService avec contrôle des connexions chargé');
