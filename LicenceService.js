// LicenseService.js - Service de gestion des licences EmailSortPro
// Version 6.0 - Version améliorée avec gestion complète des types de compte

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = null;
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        
        // Domaines personnels connus (liste étendue)
        this.personalDomains = [
            // International
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
            'aol.com', 'icloud.com', 'protonmail.com', 'mail.com', 'gmx.com',
            'yandex.com', 'zoho.com', 'fastmail.com', 'tutanota.com', 'hushmail.com',
            'me.com', 'mac.com', 'msn.com', 'rocketmail.com', 'ymail.com',
            // France
            'yahoo.fr', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net',
            'wanadoo.fr', 'bbox.fr', 'hotmail.fr', 'live.fr', 'outlook.fr',
            'gmx.fr', 'voila.fr', 'caramail.com', 'numericable.fr', 'neuf.fr',
            // Autres pays
            'gmx.de', 'web.de', 't-online.de', // Allemagne
            'libero.it', 'virgilio.it', 'tin.it', // Italie
            'terra.es', 'telefonica.net', // Espagne
            'mail.ru', 'bk.ru', 'list.ru', // Russie
            'qq.com', '163.com', '126.com', // Chine
            'naver.com', 'daum.net' // Corée
        ];
        
        console.log('[LicenseService] Service created v6.0 - Enhanced account type management');
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
        if (!email || !email.includes('@')) return false;
        const domain = email.split('@')[1].toLowerCase();
        return this.personalDomains.includes(domain);
    }

    // Déterminer automatiquement le type de compte basé sur l'email
    determineAccountType(email) {
        return this.isPersonalDomain(email) ? 'personal' : 'professional';
    }

    // MÉTHODE PRINCIPALE D'AUTHENTIFICATION AMÉLIORÉE
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

            // Vérifier si l'utilisateur existe
            const userExists = await this.checkUserExists(email);
            
            if (!userExists) {
                // L'utilisateur n'existe pas, retourner un statut approprié
                const accountType = this.determineAccountType(email);
                
                return {
                    valid: false,
                    status: 'not_found',
                    message: 'Compte utilisateur non trouvé',
                    needsRegistration: true,
                    suggestedAccountType: accountType,
                    isPersonalEmail: accountType === 'personal'
                };
            }

            // Vérifier le statut de la licence
            const licenseStatus = await this.checkLicenseStatus(email);
            
            // Si l'utilisateur existe mais n'a pas de type de compte défini
            if (licenseStatus.status === 'needs_account_type') {
                const accountType = this.determineAccountType(email);
                return {
                    ...licenseStatus,
                    suggestedAccountType: accountType,
                    isPersonalEmail: accountType === 'personal'
                };
            }
            
            // Mettre en cache le résultat si valide
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
            
            // Récupérer l'utilisateur SANS la jointure company pour éviter la récursion
            const { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    role,
                    license_status,
                    license_starts_at,
                    license_expires_at,
                    company_id,
                    first_login_at,
                    last_login_at,
                    login_count,
                    created_at,
                    updated_at,
                    account_type
                `)
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('[LicenseService] User not found');
                    return { 
                        valid: false, 
                        status: 'not_found',
                        message: 'Compte utilisateur non trouvé'
                    };
                }
                throw error;
            }

            // Récupérer la société séparément si nécessaire
            let company = null;
            if (user.company_id) {
                const { data: companyData, error: companyError } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('id', user.company_id)
                    .single();
                
                if (!companyError && companyData) {
                    company = companyData;
                    user.company = company;
                }
            }

            // Si l'utilisateur n'a pas de type de compte défini
            if (!user.account_type) {
                return {
                    valid: false,
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

            console.log('[LicenseService] User license info:', {
                status: status,
                starts_at: startsAt,
                expires_at: expiresAt,
                is_expired: expiresAt ? expiresAt < now : false,
                role: user.role,
                account_type: user.account_type,
                company: company?.name
            });

            // Obtenir les infos de contact admin si nécessaire
            let adminContact = null;
            if (user.company_id && user.role !== 'company_admin') {
                const { data: adminData } = await this.supabase
                    .from('users')
                    .select('email, name')
                    .eq('company_id', user.company_id)
                    .eq('role', 'company_admin')
                    .limit(1);
                
                if (adminData && adminData.length > 0) {
                    adminContact = adminData[0];
                }
            }

            // Vérifier si bloqué
            if (status === 'blocked') {
                return { 
                    valid: false, 
                    status: 'blocked',
                    message: 'Votre compte a été bloqué. Contactez votre administrateur.',
                    adminContact: adminContact
                };
            }

            // Vérifier si la licence n'a pas encore commencé
            if (startsAt && startsAt > now) {
                return { 
                    valid: false, 
                    status: 'not_started',
                    message: `Votre licence commencera le ${startsAt.toLocaleDateString('fr-FR')}`,
                    startsAt: startsAt,
                    adminContact: adminContact
                };
            }

            // Vérifier l'expiration
            if (expiresAt && expiresAt < now) {
                // Mettre à jour le statut en base
                await this.updateUserLicenseStatus(user.id, 'expired');
                
                const message = user.account_type === 'personal' 
                    ? 'Votre licence personnelle a expiré' 
                    : 'Votre période d\'essai a expiré. Contactez votre administrateur.';
                
                return { 
                    valid: false, 
                    status: 'expired',
                    message: message,
                    expiredAt: expiresAt,
                    adminContact: adminContact
                };
            }

            // Calculer les jours restants
            let daysRemaining = null;
            if (expiresAt) {
                daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            }

            // Message personnalisé selon le type de compte
            let message = 'Licence active';
            if (status === 'trial') {
                if (user.account_type === 'personal') {
                    message = `Compte personnel - ${daysRemaining ? daysRemaining + ' jours restants' : 'Actif'}`;
                } else {
                    message = `Période d'essai - ${daysRemaining} jours restants`;
                }
            }

            // La licence est valide
            return {
                valid: true,
                status: status,
                startsAt: startsAt,
                expiresAt: expiresAt,
                daysRemaining: daysRemaining,
                user: user,
                message: message,
                accountType: user.account_type,
                isPersonalAccount: user.account_type === 'personal',
                companyName: company?.name
            };

        } catch (error) {
            console.error('[LicenseService] Error checking license:', error);
            return { 
                valid: false, 
                status: 'error',
                error: error.message,
                message: 'Vérification temporairement indisponible'
            };
        }
    }

    // Créer un nouvel utilisateur avec détection automatique du type
    async createUser(email, companyName = null) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // Déterminer le type de compte
            const accountType = this.determineAccountType(email);
            
            console.log('[LicenseService] Creating user:', { 
                email, 
                accountType, 
                isPersonal: accountType === 'personal',
                companyName 
            });

            return await this.createUserWithAccountType(email, accountType, companyName);

        } catch (error) {
            console.error('[LicenseService] Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Méthode pour définir le type de compte d'un utilisateur existant
    async setUserAccountType(userId, accountType, companyName = null) {
        try {
            console.log('[LicenseService] Setting account type:', { userId, accountType, companyName });
            
            const updateData = {
                account_type: accountType,
                updated_at: new Date().toISOString()
            };

            // Si compte personnel
            if (accountType === 'personal') {
                updateData.role = 'company_admin'; // Admin de son propre compte
                
                // Si nom de société fourni pour un compte personnel
                if (companyName) {
                    const company = await this.getOrCreateVirtualCompany(companyName);
                    if (company) {
                        updateData.company_id = company.id;
                    }
                }
            } else {
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
                        
                        // Vérifier si c'est le premier utilisateur de la société
                        const isFirst = await this.isFirstUserOfCompany(company.id);
                        if (isFirst) {
                            updateData.role = 'company_admin';
                        } else {
                            updateData.role = 'user';
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

            if (error) throw error;

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

            console.log('[LicenseService] Creating user with account type:', { email, accountType, companyName });
            
            const domain = email.split('@')[1];
            const name = email.split('@')[0];
            
            // Déterminer les paramètres selon le type de compte
            let companyId = null;
            let role = 'user';
            let trialDays = 30; // 30 jours pour tous par défaut
            
            if (accountType === 'professional') {
                // Pour les comptes professionnels, créer ou récupérer la société
                const company = await this.getOrCreateCompany(domain, companyName);
                if (company) {
                    companyId = company.id;
                    
                    // Vérifier si c'est le premier utilisateur de la société
                    const isFirst = await this.isFirstUserOfCompany(company.id);
                    if (isFirst) {
                        role = 'company_admin';
                        console.log('[LicenseService] First user of company, setting as admin');
                    } else {
                        role = 'user';
                        console.log('[LicenseService] Additional user, setting as regular user');
                    }
                }
            } else if (accountType === 'personal') {
                // Pour les comptes personnels
                role = 'company_admin'; // Toujours admin de leur propre compte
                
                if (companyName) {
                    // Créer une société virtuelle si un nom est fourni
                    const company = await this.getOrCreateVirtualCompany(companyName);
                    if (company) {
                        companyId = company.id;
                    }
                }
            }
            
            // Créer l'utilisateur
            return await this.createUserWithTrial({
                email,
                name,
                role,
                companyId,
                trialDays,
                accountType
            });
            
        } catch (error) {
            console.error('[LicenseService] Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrCreateCompany(domain, companyName = null) {
        try {
            console.log('[LicenseService] Getting or creating company for domain:', domain);
            
            // Vérifier si la société existe déjà
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
            const name = companyName || this.generateCompanyName(domain);
            
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

            console.log('[LicenseService] ✅ Virtual company created:', newCompany.name);
            return newCompany;

        } catch (error) {
            console.error('[LicenseService] Error in getOrCreateVirtualCompany:', error);
            return null;
        }
    }

    // Générer un nom de société à partir du domaine
    generateCompanyName(domain) {
        // Enlever l'extension et capitaliser
        const baseName = domain.split('.')[0];
        return baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }

    async isFirstUserOfCompany(companyId) {
        try {
            const { count, error } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);

            if (error) {
                console.error('[LicenseService] Error checking first user:', error);
                return true; // En cas d'erreur, considérer comme premier utilisateur
            }

            return count === 0;

        } catch (error) {
            console.error('[LicenseService] Error in isFirstUserOfCompany:', error);
            return true;
        }
    }

    async createUserWithTrial({ email, name, role = 'user', companyId = null, trialDays = 30, accountType = 'professional' }) {
        try {
            console.log('[LicenseService] Creating user with trial:', { email, name, role, companyId, trialDays, accountType });
            
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
                
                // Si l'utilisateur existe déjà
                if (userError.code === '23505') {
                    return { 
                        success: false, 
                        error: 'Un compte existe déjà avec cette adresse email',
                        userExists: true 
                    };
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

    // Méthode pour récupérer les informations d'un administrateur
    async getCompanyAdmin(companyId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id, email, name')
                .eq('company_id', companyId)
                .eq('role', 'company_admin')
                .limit(1)
                .single();

            if (error) {
                console.error('[LicenseService] Error fetching admin:', error);
                return null;
            }

            return data;

        } catch (error) {
            console.error('[LicenseService] Error in getCompanyAdmin:', error);
            return null;
        }
    }

    // MÉTHODES EXISTANTES (conservées pour compatibilité)

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const user = this.extractUserFromAuth();
            if (!user || !user.email) {
                return null;
            }

            // Récupérer l'utilisateur sans jointure
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('[LicenseService] Error fetching user:', error);
                return null;
            }

            // Récupérer la société séparément si nécessaire
            if (data.company_id) {
                const { data: companyData, error: companyError } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('id', data.company_id)
                    .single();
                
                if (!companyError && companyData) {
                    data.company = companyData;
                }
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

            // Déterminer le type de compte
            const accountType = this.determineAccountType(email);

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

    // Méthodes de debug
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
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                status: this.currentUser.license_status,
                role: this.currentUser.role,
                company: this.currentUser.company,
                accountType: this.currentUser.account_type
            } : null,
            hasCachedStatus: !!this.cachedLicenseStatus,
            cacheExpiry: this.cacheExpiry,
            personalDomains: this.personalDomains.length
        };
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('[LicenseService] ✅ Service loaded v6.0 - Enhanced account type management');
