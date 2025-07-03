// LicenceService.js - Service de gestion des licences EmailSortPro
// Version 5.2 - Avec validation correcte des types de compte

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = null;
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        
        // Domaines personnels connus
        this.personalDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
            'aol.com', 'icloud.com', 'protonmail.com', 'mail.com', 'gmx.com',
            'yandex.com', 'zoho.com', 'fastmail.com', 'tutanota.com', 'hushmail.com',
            'yahoo.fr', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net',
            'wanadoo.fr', 'bbox.fr', 'hotmail.fr', 'live.fr', 'outlook.fr'
        ];
        
        // Types de compte valides (selon la contrainte de la base de données)
        this.validAccountTypes = ['personal', 'professional'];
        
        console.log('[LicenseService] Service created v5.2');
    }

    async initialize() {
        if (this.initialized) {
            return true;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._performInitialization();
        return this.initPromise;
    }

    async _performInitialization() {
        try {
            console.log('[LicenseService] Starting initialization...');
            
            // Charger Supabase
            if (!window.supabase) {
                await this.loadSupabaseLibrary();
            }

            // Initialiser la configuration
            if (!window.supabaseConfig || !window.supabaseConfig.initialized) {
                await window.initializeSupabaseConfig();
            }

            // Créer le client Supabase
            const config = window.supabaseConfig.getConfig();
            this.supabase = window.supabase.createClient(
                config.url,
                config.anonKey,
                config.auth
            );

            console.log('[LicenseService] ✅ Supabase client created');
            
            this.initialized = true;
            return true;

        } catch (error) {
            console.error('[LicenseService] Initialization error:', error);
            this.initialized = false;
            this.initPromise = null;
            throw error;
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('[LicenseService] Supabase library loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('[LicenseService] Failed to load Supabase library');
                reject(new Error('Failed to load Supabase'));
            };
            document.head.appendChild(script);
        });
    }

    // Vérifier si un domaine est personnel
    isPersonalDomain(email) {
        const domain = email.split('@')[1];
        return this.personalDomains.includes(domain.toLowerCase());
    }

    // Valider le type de compte
    validateAccountType(accountType) {
        return this.validAccountTypes.includes(accountType);
    }

    // MÉTHODE PRINCIPALE D'AUTHENTIFICATION
    async authenticateWithEmail(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Authenticating user:', email);
            
            // Vérifier le cache d'abord
            if (this.cachedLicenseStatus && this.cacheExpiry && new Date() < this.cacheExpiry) {
                const cachedUser = this.cachedLicenseStatus.user;
                if (cachedUser && cachedUser.email === email) {
                    console.log('[LicenseService] Using cached license status');
                    return this.cachedLicenseStatus;
                }
            }

            // Vérifier le statut de la licence
            const licenseStatus = await this.checkLicenseStatus(email);
            
            // Mettre en cache le résultat (1 heure)
            if (licenseStatus.valid) {
                this.cachedLicenseStatus = licenseStatus;
                this.cacheExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
                this.currentUser = licenseStatus.user;
            }
            
            // Mettre à jour la dernière connexion
            if (licenseStatus.valid && licenseStatus.user) {
                await this.updateLastLogin(licenseStatus.user.id);
            }
            
            return licenseStatus;

        } catch (error) {
            console.error('[LicenseService] Authentication error:', error);
            
            // En cas d'erreur réseau, utiliser le cache si disponible
            if (this.cachedLicenseStatus && error.message.includes('network')) {
                console.log('[LicenseService] Network error, using cached status');
                return { ...this.cachedLicenseStatus, offline: true };
            }
            
            return {
                valid: false,
                status: 'error',
                message: 'Erreur lors de la vérification de votre licence',
                error: error.message
            };
        }
    }

    async checkUserExists(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Checking if user exists:', email);
            
            const { data, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (error) {
                console.error('[LicenseService] Error checking user:', error);
                return false;
            }

            console.log('[LicenseService] User exists:', !!data);
            return !!data;

        } catch (error) {
            console.error('[LicenseService] Error checking user:', error);
            return false;
        }
    }

    async checkLicenseStatus(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Checking license status for:', email);
            
            // Option 1: Essayer d'abord avec RPC si disponible
            try {
                const { data: rpcData, error: rpcError } = await this.supabase
                    .rpc('check_user_by_email', { user_email: email });
                
                if (!rpcError && rpcData && rpcData.length > 0) {
                    console.log('[LicenseService] User found via RPC');
                    const user = rpcData[0];
                    return this.processUserLicense(user);
                }
            } catch (rpcErr) {
                console.log('[LicenseService] RPC not available, trying direct query');
            }
            
            // Option 2: Requête directe simplifiée
            const { data: users, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email);

            if (error) {
                console.error('[LicenseService] Database error:', error);
                return { 
                    valid: false, 
                    status: 'error',
                    message: 'Erreur de connexion à la base de données. Veuillez réessayer.'
                };
            }

            // Vérifier si on a trouvé l'utilisateur
            if (!users || users.length === 0) {
                console.log('[LicenseService] User not found');
                return { 
                    valid: false, 
                    status: 'not_found',
                    message: 'Compte utilisateur non trouvé'
                };
            }

            const user = users[0];
            return this.processUserLicense(user);

        } catch (error) {
            console.error('[LicenseService] Error checking license:', error);
            return { 
                valid: false, 
                status: 'error',
                error: error.message,
                message: 'Erreur de vérification. Veuillez réessayer.'
            };
        }
    }

    // Méthode séparée pour traiter la licence d'un utilisateur
    processUserLicense(user) {
        // Vérifier si l'utilisateur est un super admin (pas besoin de type de compte)
        if (user.role === 'super_admin') {
            console.log('[LicenseService] Super admin user, no account type needed');
            return {
                valid: true,
                status: user.license_status || 'active',
                user: user,
                message: 'Accès super administrateur'
            };
        }

        // Si l'utilisateur n'a pas de type de compte défini, le signaler
        if (!user.account_type) {
            console.log('[LicenseService] User needs account type setup');
            return {
                valid: true,
                status: 'needs_account_type',
                user: user,
                message: 'Type de compte à définir'
            };
        }

        // Vérifier le statut de licence
        const status = user.license_status;
        const startsAt = user.license_starts_at ? new Date(user.license_starts_at) : null;
        const expiresAt = user.license_expires_at ? new Date(user.license_expires_at) : null;
        const now = new Date();

        console.log('[LicenseService] User found:', {
            email: user.email,
            status: status,
            role: user.role,
            account_type: user.account_type,
            has_expiry: !!expiresAt
        });

        // Vérifier si bloqué
        if (status === 'blocked') {
            return { 
                valid: false, 
                status: 'blocked',
                message: 'Votre compte a été bloqué. Contactez votre administrateur.',
                user: user
            };
        }

        // Vérifier si la licence n'a pas encore commencé
        if (startsAt && startsAt > now) {
            return { 
                valid: false, 
                status: 'not_started',
                message: `Votre licence commencera le ${startsAt.toLocaleDateString('fr-FR')}`,
                startsAt: startsAt,
                user: user
            };
        }

        // Vérifier l'expiration
        if (expiresAt && expiresAt < now) {
            return { 
                valid: false, 
                status: 'expired',
                message: 'Votre période d\'essai a expiré',
                expiredAt: expiresAt,
                user: user
            };
        }

        // Calculer les jours restants
        let daysRemaining = null;
        if (expiresAt) {
            daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        }

        // La licence est valide
        return {
            valid: true,
            status: status || 'active',
            startsAt: startsAt,
            expiresAt: expiresAt,
            daysRemaining: daysRemaining,
            user: user,
            message: status === 'trial' ? `Période d'essai - ${daysRemaining} jours restants` : 'Licence active'
        };
    }

    // Méthode pour définir le type de compte d'un utilisateur existant
    async setUserAccountType(userId, accountType, companyName = null) {
        try {
            console.log('[LicenseService] Setting account type:', { userId, accountType, companyName });
            
            // Valider le type de compte
            if (!this.validateAccountType(accountType)) {
                throw new Error(`Type de compte invalide: ${accountType}. Types valides: ${this.validAccountTypes.join(', ')}`);
            }

            const updateData = {
                account_type: accountType,
                updated_at: new Date().toISOString()
            };

            // Si compte personnel
            if (accountType === 'personal') {
                updateData.role = 'company_admin'; // Admin de son propre compte
                
                // Si nom de société fourni, créer une société virtuelle
                if (companyName) {
                    const company = await this.getOrCreateVirtualCompany(companyName);
                    if (company) {
                        updateData.company_id = company.id;
                    }
                }
            } else if (accountType === 'professional') {
                // Pour professionnel, déterminer la société basée sur le domaine
                const { data: userData } = await this.supabase
                    .from('users')
                    .select('email')
                    .eq('id', userId)
                    .single();
                
                if (userData) {
                    const domain = userData.email.split('@')[1];
                    const company = await this.getOrCreateCompany(domain, companyName);
                    
                    if (company) {
                        updateData.company_id = company.id;
                        
                        // Vérifier si c'est le premier utilisateur
                        const isFirst = await this.isFirstUserOfCompany(company.id);
                        if (isFirst) {
                            updateData.role = 'company_admin';
                        }
                    }
                }
            }

            // Mettre à jour l'utilisateur
            const { data, error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('[LicenseService] Database error:', error);
                throw error;
            }

            console.log('[LicenseService] ✅ Account type set successfully');
            
            // Invalider le cache
            this.cachedLicenseStatus = null;
            this.cacheExpiry = null;
            
            return { success: true, user: data };

        } catch (error) {
            console.error('[LicenseService] Error setting account type:', error);
            return { success: false, error: error.message };
        }
    }

    async createUserWithAccountType(email, accountType, companyName = null) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Creating user:', { email, accountType, companyName });
            
            // Valider le type de compte
            if (!this.validateAccountType(accountType)) {
                throw new Error(`Type de compte invalide: ${accountType}`);
            }

            const domain = email.split('@')[1];
            const name = email.split('@')[0];
            
            // Déterminer les paramètres selon le type de compte
            let companyId = null;
            let role = 'user';
            let trialDays = 15;
            
            if (accountType === 'professional' || !this.isPersonalDomain(email)) {
                // Pour les comptes professionnels, créer ou récupérer la société
                const company = await this.getOrCreateCompany(domain, companyName);
                if (company) {
                    companyId = company.id;
                    // Vérifier si c'est le premier utilisateur de la société
                    const isFirst = await this.isFirstUserOfCompany(company.id);
                    if (isFirst) {
                        role = 'company_admin';
                        trialDays = 30;
                    }
                }
            } else if (accountType === 'personal') {
                // Pour les comptes personnels avec société
                if (companyName) {
                    const company = await this.getOrCreateVirtualCompany(companyName);
                    if (company) {
                        companyId = company.id;
                        role = 'company_admin'; // Admin de leur propre société virtuelle
                        trialDays = 30;
                    }
                } else {
                    // Compte personnel individuel
                    role = 'user';
                    trialDays = 30;
                }
            }
            
            // Créer l'utilisateur
            return await this.createUserWithTrial({
                email,
                name,
                role,
                companyId,
                trialDays,
                accountType: accountType
            });
            
        } catch (error) {
            console.error('[LicenseService] Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrCreateCompany(domain, companyName = null) {
        try {
            console.log('[LicenseService] Getting or creating company for domain:', domain);
            
            const { data: existing, error: searchError } = await this.supabase
                .from('companies')
                .select('*')
                .eq('domain', domain)
                .maybeSingle();

            if (existing) {
                console.log('[LicenseService] Company already exists:', existing.name);
                return existing;
            }

            // Créer la société
            const name = companyName || domain.charAt(0).toUpperCase() + domain.slice(1).replace(/\.[^.]+$/, '');
            
            const { data: newCompany, error: createError } = await this.supabase
                .from('companies')
                .insert({
                    name: name,
                    domain: domain,
                    is_virtual: false
                })
                .select()
                .single();

            if (createError) {
                console.error('[LicenseService] Error creating company:', createError);
                return null;
            }

            console.log('[LicenseService] ✅ Company created:', newCompany.name);
            return newCompany;

        } catch (error) {
            console.error('[LicenseService] Error in getOrCreateCompany:', error);
            return null;
        }
    }

    async getOrCreateVirtualCompany(companyName) {
        try {
            const sanitizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const virtualDomain = `${sanitizedName}.virtual`;
            
            const { data: existing, error: searchError } = await this.supabase
                .from('companies')
                .select('*')
                .eq('domain', virtualDomain)
                .maybeSingle();

            if (existing) {
                return existing;
            }

            const { data: newCompany, error: createError } = await this.supabase
                .from('companies')
                .insert({
                    name: companyName,
                    domain: virtualDomain,
                    is_virtual: true
                })
                .select()
                .single();

            if (createError) {
                console.error('[LicenseService] Error creating virtual company:', createError);
                return null;
            }

            return newCompany;

        } catch (error) {
            console.error('[LicenseService] Error in getOrCreateVirtualCompany:', error);
            return null;
        }
    }

    async isFirstUserOfCompany(companyId) {
        try {
            const { count, error } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);

            if (error) {
                console.error('[LicenseService] Error checking first user:', error);
                return false;
            }

            return count === 0;

        } catch (error) {
            console.error('[LicenseService] Error in isFirstUserOfCompany:', error);
            return false;
        }
    }

    async createUserWithTrial({ email, name, role = 'user', companyId = null, trialDays = 15, accountType = 'professional' }) {
        try {
            console.log('[LicenseService] Creating user with trial:', { email, name, role, companyId, trialDays, accountType });
            
            // Valider le type de compte
            if (!this.validateAccountType(accountType)) {
                throw new Error(`Type de compte invalide: ${accountType}`);
            }

            const startsAt = new Date();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + trialDays);

            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .insert({
                    email: email,
                    name: name || email.split('@')[0],
                    role: role,
                    company_id: companyId,
                    license_status: 'trial',
                    license_starts_at: startsAt.toISOString(),
                    license_expires_at: expiresAt.toISOString(),
                    first_login_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    login_count: 1,
                    account_type: accountType
                })
                .select()
                .single();

            if (userError) {
                console.error('[LicenseService] Error creating user:', userError);
                
                // Si l'utilisateur existe déjà, mettre à jour
                if (userError.code === '23505') {
                    return await this.updateExistingUserTrial(email, startsAt, expiresAt);
                }
                
                throw userError;
            }

            console.log('[LicenseService] ✅ User created with trial');

            // Mettre à jour les stats
            await this.updateUserStats(email, name, email.split('@')[1]);

            return { success: true, user: userData };

        } catch (error) {
            console.error('[LicenseService] Error creating user with trial:', error);
            return { success: false, error: error.message };
        }
    }

    async updateExistingUserTrial(email, startsAt, expiresAt) {
        try {
            console.log('[LicenseService] Updating existing user trial');
            
            const { data: currentUser, error: fetchError } = await this.supabase
                .from('users')
                .select('login_count')
                .eq('email', email)
                .single();
            
            if (fetchError) throw fetchError;
            
            const { data, error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'trial',
                    license_starts_at: startsAt.toISOString(),
                    license_expires_at: expiresAt.toISOString(),
                    last_login_at: new Date().toISOString(),
                    login_count: (currentUser?.login_count || 0) + 1
                })
                .eq('email', email)
                .select()
                .single();

            if (error) throw error;

            return { success: true, user: data };

        } catch (error) {
            console.error('[LicenseService] Error updating user trial:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserLicenseStatus(userId, newStatus) {
        try {
            const { error } = await this.supabase
                .from('users')
                .update({ 
                    license_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            console.log('[LicenseService] Updated user license status to:', newStatus);

        } catch (error) {
            console.error('[LicenseService] Error updating license status:', error);
        }
    }

    async updateLastLogin(userId) {
        try {
            const { data: currentUser, error: fetchError } = await this.supabase
                .from('users')
                .select('login_count')
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const { error } = await this.supabase
                .from('users')
                .update({
                    last_login_at: new Date().toISOString(),
                    login_count: (currentUser?.login_count || 0) + 1
                })
                .eq('id', userId);

            if (error) throw error;

        } catch (error) {
            console.error('[LicenseService] Error updating last login:', error);
        }
    }

    async updateUserStats(email, name, domain) {
        try {
            const { error } = await this.supabase
                .from('user_email_stats')
                .upsert({
                    email: email,
                    name: name,
                    domain: domain,
                    total_sessions: 1,
                    last_activity: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'email',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('[LicenseService] Error updating user stats:', error);
            }

        } catch (error) {
            console.error('[LicenseService] Error in updateUserStats:', error);
        }
    }

    // NOUVELLE MÉTHODE pour mettre à jour les dates de licence
    async updateUserLicenseDates(userId, startDate, endDate) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!this.isAdmin()) {
                return { success: false, error: 'Droits insuffisants' };
            }

            const startsAt = new Date(startDate);
            const expiresAt = new Date(endDate);

            if (startsAt >= expiresAt) {
                return { success: false, error: 'La date de fin doit être après la date de début' };
            }

            const updateData = {
                license_starts_at: startsAt.toISOString(),
                license_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            };

            const now = new Date();
            if (startsAt > now) {
                updateData.license_status = 'pending';
            } else if (expiresAt > now) {
                updateData.license_status = 'active';
            } else {
                updateData.license_status = 'expired';
            }

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;

            // Invalider le cache si c'est l'utilisateur actuel
            if (this.currentUser && this.currentUser.id === userId) {
                this.cachedLicenseStatus = null;
                this.cacheExpiry = null;
            }

            console.log('[LicenseService] ✅ License dates updated successfully');
            return { success: true };

        } catch (error) {
            console.error('[LicenseService] Error updating license dates:', error);
            return { success: false, error: error.message };
        }
    }

    // MÉTHODES EXISTANTES

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const user = this.extractUserFromAuth();
            if (!user || !user.email) {
                return null;
            }

            const { data, error } = await this.supabase
                .from('users')
                .select('*, company:companies(*)')
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('[LicenseService] Error fetching user:', error);
                return null;
            }

            this.currentUser = data;
            return data;

        } catch (error) {
            console.error('[LicenseService] Error getting current user:', error);
            return null;
        }
    }

    extractUserFromAuth() {
        // Microsoft Auth
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            return {
                email: account?.username,
                name: account?.name
            };
        }

        // Google Auth
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const googleUser = window.googleAuthService.getAccount();
            return {
                email: googleUser?.email,
                name: googleUser?.name || googleUser?.displayName
            };
        }

        return null;
    }

    isAdmin() {
        if (!this.currentUser) {
            return false;
        }
        
        return this.currentUser.role === 'company_admin' || 
               this.currentUser.role === 'super_admin';
    }

    async getCompanyUsers() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser || !currentUser.company_id) {
                return [];
            }

            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('company_id', currentUser.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('[LicenseService] Error fetching company users:', error);
            return [];
        }
    }

    async addUserToCompany(email) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser || !this.isAdmin()) {
                return { success: false, error: 'Droits insuffisants' };
            }

            const accountType = this.isPersonalDomain(email) ? 'personal' : 'professional';

            const result = await this.createUserWithTrial({
                email: email,
                name: email.split('@')[0],
                trialDays: 30,
                role: 'user',
                companyId: currentUser.company_id,
                accountType: accountType
            });

            return result;

        } catch (error) {
            console.error('[LicenseService] Error adding user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserLicense(userId, status, expiresAt = null) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!this.isAdmin()) {
                return { success: false, error: 'Droits insuffisants' };
            }

            const updateData = {
                license_status: status,
                updated_at: new Date().toISOString()
            };

            if (expiresAt) {
                updateData.license_expires_at = expiresAt.toISOString();
            }

            if (status === 'active') {
                const { data: targetUser } = await this.supabase
                    .from('users')
                    .select('license_starts_at')
                    .eq('id', userId)
                    .single();
                
                if (!targetUser?.license_starts_at) {
                    updateData.license_starts_at = new Date().toISOString();
                }
            }

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;

            if (this.currentUser && this.currentUser.id === userId) {
                this.cachedLicenseStatus = null;
                this.cacheExpiry = null;
            }

            return { success: true };

        } catch (error) {
            console.error('[LicenseService] Error updating license:', error);
            return { success: false, error: error.message };
        }
    }

    // MÉTHODE DELETEUSER
    async deleteUser(userId) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const currentUser = this.currentUser || await this.getCurrentUser();
            if (!currentUser || !this.isAdmin()) {
                return { success: false, error: 'Droits insuffisants' };
            }

            // Vérifier qu'on ne supprime pas un super admin si on n'est pas super admin
            const { data: targetUser } = await this.supabase
                .from('users')
                .select('role, email')
                .eq('id', userId)
                .single();

            if (targetUser && targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
                return { success: false, error: 'Seul un super admin peut supprimer un autre super admin' };
            }

            // Empêcher l'auto-suppression
            if (currentUser.id === userId) {
                return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' };
            }

            // Supprimer d'abord les stats associées
            await this.supabase
                .from('user_email_stats')
                .delete()
                .eq('email', targetUser.email);

            // Supprimer l'utilisateur
            const { error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            console.log('[LicenseService] ✅ User deleted successfully');
            return { success: true };

        } catch (error) {
            console.error('[LicenseService] Error deleting user:', error);
            return { success: false, error: error.message };
        }
    }

    clearCache() {
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        console.log('[LicenseService] Cache cleared');
    }

    reset() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = null;
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        console.log('[LicenseService] Service reset');
    }

    async debug() {
        return {
            initialized: this.initialized,
            hasSupabase: !!this.supabase,
            validAccountTypes: this.validAccountTypes,
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                status: this.currentUser.license_status,
                role: this.currentUser.role,
                company: this.currentUser.company,
                accountType: this.currentUser.account_type
            } : null,
            hasCachedStatus: !!this.cachedLicenseStatus,
            cacheExpiry: this.cacheExpiry
        };
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('[LicenseService] ✅ Service loaded v5.2 - With fixed account type validation');
