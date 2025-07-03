// LicenceService.js - Service de gestion des licences EmailSortPro
// Version 4.1 avec RPC pour éviter la récursion RLS

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = null;
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        
        console.log('[LicenseService] Service created v4.1 - RPC version');
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

    // MÉTHODE POUR DÉTERMINER SI UN EMAIL EST PROFESSIONNEL
    isPersonalEmail(email) {
        const personalDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
            'live.com', 'msn.com', 'aol.com', 'mail.com', 'ymail.com',
            'protonmail.com', 'icloud.com', 'me.com', 'mac.com',
            'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net',
            'yahoo.fr', 'hotmail.fr', 'outlook.fr', 'gmail.fr'
        ];
        
        const domain = email.split('@')[1].toLowerCase();
        return personalDomains.includes(domain);
    }

    // MÉTHODE POUR CRÉER OU RÉCUPÉRER UNE SOCIÉTÉ
    async getOrCreateCompany(domain) {
        try {
            // Si c'est un email personnel, pas de société
            if (this.isPersonalEmail(`user@${domain}`)) {
                console.log('[LicenseService] Personal email domain, no company needed');
                return null;
            }

            console.log('[LicenseService] Checking company for domain:', domain);
            
            // Vérifier si la société existe déjà
            const { data: existingCompany, error: searchError } = await this.supabase
                .from('companies')
                .select('*')
                .eq('domain', domain)
                .single();

            if (existingCompany && !searchError) {
                console.log('[LicenseService] Company already exists:', existingCompany.name);
                return existingCompany;
            }

            // Si pas de société, la créer
            console.log('[LicenseService] Creating new company for domain:', domain);
            const companyName = domain.charAt(0).toUpperCase() + domain.slice(1).replace(/\.[^.]+$/, '');
            
            const { data: newCompany, error: createError } = await this.supabase
                .from('companies')
                .insert({
                    name: companyName,
                    domain: domain,
                    type: 'professional' // Nouveau champ pour indiquer le type
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

    // MÉTHODE POUR VÉRIFIER SI C'EST LE PREMIER UTILISATEUR D'UN DOMAINE
    async isFirstUserOfDomain(domain) {
        try {
            // Si c'est un domaine personnel, toujours retourner false
            if (this.isPersonalEmail(`user@${domain}`)) {
                return false;
            }

            // Utiliser une requête directe sur la vue users_view
            const { count, error } = await this.supabase
                .from('users_view')
                .select('*', { count: 'exact', head: true })
                .like('email', `%@${domain}`)
                .not('company_id', 'is', null);

            if (error) {
                console.error('[LicenseService] Error checking first user:', error);
                return false;
            }

            return count === 0;

        } catch (error) {
            console.error('[LicenseService] Error in isFirstUserOfDomain:', error);
            return false;
        }
    }

    // MÉTHODE PRINCIPALE POUR L'AUTHENTIFICATION PAR EMAIL (MODIFIÉE)
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

            // Extraire le domaine de l'email
            const domain = email.split('@')[1];
            const isPersonal = this.isPersonalEmail(email);

            // Vérifier si l'utilisateur existe
            const userExists = await this.checkUserExists(email);
            
            if (!userExists) {
                console.log('[LicenseService] New user detected, creating account');
                
                let company = null;
                let role = 'individual'; // Par défaut, utilisateur particulier
                let trialDays = 15; // 15 jours pour les particuliers
                
                if (!isPersonal) {
                    // Email professionnel
                    const isFirstUser = await this.isFirstUserOfDomain(domain);
                    company = await this.getOrCreateCompany(domain);
                    
                    if (isFirstUser && company) {
                        role = 'company_admin';
                        trialDays = 30; // 30 jours pour le premier utilisateur d'une entreprise
                    } else {
                        role = 'user';
                        trialDays = 15; // 15 jours pour les autres utilisateurs de l'entreprise
                    }
                }
                
                // Créer l'utilisateur
                const createResult = await this.createUserWithTrial({
                    email: email,
                    name: email.split('@')[0],
                    trialDays: trialDays,
                    role: role,
                    companyId: company ? company.id : null,
                    accountType: isPersonal ? 'individual' : 'professional'
                });
                
                if (!createResult.success) {
                    return {
                        valid: false,
                        status: 'error',
                        message: 'Impossible de créer votre compte',
                        error: createResult.error
                    };
                }
                
                // Si c'est le premier utilisateur d'une entreprise, mettre à jour domain_usage
                if (role === 'company_admin' && company) {
                    await this.updateDomainUsage(domain, company.id, email);
                }
            }

            // Vérifier le statut de la licence
            const licenseStatus = await this.checkLicenseStatus(email);
            
            // Mettre en cache le résultat (1 heure)
            if (licenseStatus.valid) {
                this.cachedLicenseStatus = licenseStatus;
                this.cacheExpiry = new Date(Date.now() + 60 * 60 * 1000);
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

    // NOUVELLE VERSION UTILISANT RPC
    async checkUserExists(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Checking if user exists:', email);
            
            // Utiliser la fonction RPC
            const { data, error } = await this.supabase
                .rpc('user_exists', { user_email: email });

            if (error) {
                console.error('[LicenseService] Error checking user:', error);
                return false;
            }

            console.log('[LicenseService] User exists:', data);
            return data;

        } catch (error) {
            console.error('[LicenseService] Error checking user:', error);
            return false;
        }
    }

    // NOUVELLE VERSION UTILISANT RPC
    async createUserWithTrial({ email, name, trialDays = 15, role = 'individual', companyId = null, accountType = 'individual' }) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Creating user with trial:', { 
                email, name, trialDays, role, companyId, accountType 
            });
            
            // Calculer la date d'expiration
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + trialDays);

            // Utiliser la fonction RPC pour créer l'utilisateur
            const { data, error } = await this.supabase
                .rpc('create_user_with_license', {
                    p_email: email,
                    p_name: name || email.split('@')[0],
                    p_role: role,
                    p_account_type: accountType,
                    p_company_id: companyId,
                    p_license_status: 'trial',
                    p_license_expires_at: expiresAt.toISOString()
                });

            if (error) {
                console.error('[LicenseService] Error creating user:', error);
                throw error;
            }

            if (data && data.length > 0 && data[0].success) {
                console.log('[LicenseService] ✅ User created with trial, role:', role, 'type:', accountType);

                // Créer ou mettre à jour les stats utilisateur
                const domain = email.split('@')[1];
                await this.updateUserStats(email, name, domain);

                // Enregistrer l'événement analytics
                await this.recordAnalyticsEvent(data[0].id, 'trial_started', {
                    trial_days: trialDays,
                    expires_at: expiresAt.toISOString(),
                    role: role,
                    account_type: accountType,
                    is_first_user: role === 'company_admin'
                });

                // Récupérer l'utilisateur créé
                const { data: userData } = await this.supabase
                    .rpc('get_user_by_email', { user_email: email });

                return { success: true, user: userData && userData[0] };
            } else {
                const errorMsg = data && data[0] ? data[0].error_message : 'Unknown error';
                console.error('[LicenseService] Failed to create user:', errorMsg);
                return { success: false, error: errorMsg };
            }

        } catch (error) {
            console.error('[LicenseService] Error creating user with trial:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDomainUsage(domain, companyId, adminEmail) {
        try {
            const { error } = await this.supabase
                .from('domain_usage')
                .upsert({
                    domain: domain,
                    company_id: companyId,
                    admin_email: adminEmail,
                    total_users: 1,
                    active_users: 1,
                    last_activity: new Date().toISOString()
                }, {
                    onConflict: 'domain'
                });

            if (error) {
                console.error('[LicenseService] Error updating domain usage:', error);
            } else {
                console.log('[LicenseService] ✅ Domain usage updated for:', domain);
            }

        } catch (error) {
            console.error('[LicenseService] Error in updateDomainUsage:', error);
        }
    }

    async updateExistingUserTrial(email, expiresAt) {
        try {
            console.log('[LicenseService] Updating existing user trial');
            
            // Utiliser la vue users_view pour la mise à jour
            const { data, error } = await this.supabase
                .from('users')
                .update({
                    license_status: 'trial',
                    license_expires_at: expiresAt.toISOString(),
                    last_login_at: new Date().toISOString()
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

    // NOUVELLE VERSION UTILISANT RPC
    async checkLicenseStatus(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Checking license status for:', email);
            
            // Utiliser la fonction RPC pour récupérer l'utilisateur
            const { data: userData, error } = await this.supabase
                .rpc('get_user_by_email', { user_email: email });

            if (error) {
                throw error;
            }

            if (!userData || userData.length === 0) {
                console.log('[LicenseService] User not found');
                return { 
                    valid: false, 
                    status: 'not_found',
                    message: 'Compte utilisateur non trouvé'
                };
            }

            const user = userData[0];

            // Récupérer les infos de la company si nécessaire
            if (user.company_id) {
                const { data: company } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('id', user.company_id)
                    .single();
                
                if (company) {
                    user.company = company;
                }
            }

            // Vérifier le statut de licence
            const status = user.license_status;
            const expiresAt = user.license_expires_at ? new Date(user.license_expires_at) : null;
            const now = new Date();

            console.log('[LicenseService] User license info:', {
                status: status,
                expires_at: expiresAt,
                is_expired: expiresAt ? expiresAt < now : false,
                role: user.role,
                account_type: user.account_type
            });

            // Obtenir les infos de contact admin si disponibles (seulement pour les pros)
            let adminContact = null;
            if (user.company_id && user.company && user.account_type === 'professional') {
                const { data: adminData } = await this.supabase
                    .from('users_view')
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
                    message: user.account_type === 'professional' 
                        ? 'Votre compte a été bloqué. Contactez votre administrateur.'
                        : 'Votre compte a été bloqué. Contactez le support.',
                    adminContact: adminContact
                };
            }

            // Vérifier l'expiration
            if (expiresAt && expiresAt < now) {
                // Mettre à jour le statut en base
                await this.updateUserLicenseStatus(user.id, 'expired');
                
                return { 
                    valid: false, 
                    status: 'expired',
                    message: 'Votre période d\'essai a expiré',
                    expiredAt: expiresAt,
                    adminContact: adminContact
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
                status: status,
                expiresAt: expiresAt,
                daysRemaining: daysRemaining,
                user: user,
                message: status === 'trial' ? `Période d'essai - ${daysRemaining} jours restants` : 'Licence active'
            };

        } catch (error) {
            console.error('[LicenseService] Error checking license:', error);
            // En cas d'erreur, permettre l'accès pour ne pas bloquer
            return { 
                valid: true, 
                status: 'error',
                error: error.message,
                message: 'Vérification temporairement indisponible'
            };
        }
    }

    async updateUserLicenseStatus(userId, newStatus) {
        try {
            // Utiliser la fonction RPC
            const { data, error } = await this.supabase
                .rpc('update_user_license_status', {
                    p_user_id: userId,
                    p_new_status: newStatus
                });

            if (error) throw error;

            console.log('[LicenseService] Updated user license status to:', newStatus);

        } catch (error) {
            console.error('[LicenseService] Error updating license status:', error);
        }
    }

    async updateLastLogin(userId) {
        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    last_login_at: new Date().toISOString()
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

    async recordAnalyticsEvent(userId, eventType, eventData) {
        try {
            const { error } = await this.supabase
                .from('analytics_events')
                .insert({
                    user_id: userId,
                    event_type: eventType,
                    event_data: eventData
                });

            if (error) {
                console.error('[LicenseService] Error recording analytics:', error);
            }

        } catch (error) {
            console.error('[LicenseService] Error in recordAnalyticsEvent:', error);
        }
    }

    // MÉTHODES EXISTANTES AVEC MODIFICATIONS POUR PERMISSIONS

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const user = this.extractUserFromAuth();
            if (!user || !user.email) {
                return null;
            }

            const { data } = await this.supabase
                .rpc('get_user_by_email', { user_email: user.email });

            if (data && data.length > 0) {
                const userData = data[0];
                
                // Récupérer la company si nécessaire
                if (userData.company_id) {
                    const { data: company } = await this.supabase
                        .from('companies')
                        .select('*')
                        .eq('id', userData.company_id)
                        .single();
                    
                    if (company) {
                        userData.company = company;
                    }
                }
                
                this.currentUser = userData;
                return userData;
            }

            return null;

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

    canViewUser(targetUserId) {
        if (!this.currentUser) {
            return false;
        }

        // Super admin voit tout
        if (this.currentUser.role === 'super_admin') {
            return true;
        }

        // Les particuliers ne voient que leur propre compte
        if (this.currentUser.account_type === 'individual') {
            return this.currentUser.id === targetUserId;
        }

        // Les admins d'entreprise voient tous les utilisateurs de leur société
        if (this.currentUser.role === 'company_admin' && this.currentUser.company_id) {
            // Vérifier si l'utilisateur cible est dans la même société
            return true; // La vérification sera faite côté requête
        }

        // Les utilisateurs normaux d'entreprise ne voient que leur propre compte
        return this.currentUser.id === targetUserId;
    }

    async getVisibleUsers() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                return [];
            }

            let query = this.supabase
                .from('users_view')
                .select('*')
                .order('created_at', { ascending: false });

            // Appliquer les filtres selon les permissions
            if (currentUser.role === 'super_admin') {
                // Pas de filtre, voit tout
            } else if (currentUser.role === 'company_admin' && currentUser.company_id) {
                // Voit tous les utilisateurs de sa société
                query = query.eq('company_id', currentUser.company_id);
            } else if (currentUser.account_type === 'individual') {
                // Voit seulement son propre compte
                query = query.eq('id', currentUser.id);
            } else {
                // Utilisateur normal d'entreprise, voit seulement son compte
                query = query.eq('id', currentUser.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('[LicenseService] Error fetching visible users:', error);
            return [];
        }
    }

    async getCompanyUsers() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser || !currentUser.company_id) {
                return [];
            }

            const { data, error } = await this.supabase
                .from('users_view')
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

            // Vérifier que c'est un email professionnel du même domaine
            const currentDomain = currentUser.email.split('@')[1];
            const newUserDomain = email.split('@')[1];
            
            if (currentDomain !== newUserDomain) {
                return { 
                    success: false, 
                    error: 'L\'utilisateur doit avoir une adresse email du même domaine' 
                };
            }

            // Créer l'utilisateur avec licence trial
            const result = await this.createUserWithTrial({
                email: email,
                name: email.split('@')[0],
                trialDays: 30, // 30 jours pour les utilisateurs ajoutés par admin
                role: 'user',
                companyId: currentUser.company_id,
                accountType: 'professional'
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

            // Vérifier que l'utilisateur cible est accessible
            if (!await this.canManageUser(userId)) {
                return { success: false, error: 'Vous ne pouvez pas gérer cet utilisateur' };
            }

            const updateData = {
                license_status: status,
                updated_at: new Date().toISOString()
            };

            if (expiresAt) {
                updateData.license_expires_at = expiresAt.toISOString();
            }

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;

            // Enregistrer l'action admin
            await this.recordAdminAction('update_license', {
                target_user_id: userId,
                new_status: status,
                new_expires_at: expiresAt
            });

            // Invalider le cache si c'est l'utilisateur actuel
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

    async canManageUser(targetUserId) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return false;

        // Super admin peut tout gérer
        if (currentUser.role === 'super_admin') return true;

        // Admin d'entreprise peut gérer les utilisateurs de sa société
        if (currentUser.role === 'company_admin' && currentUser.company_id) {
            const { data: targetUser } = await this.supabase
                .from('users_view')
                .select('company_id')
                .eq('id', targetUserId)
                .single();
            
            return targetUser && targetUser.company_id === currentUser.company_id;
        }

        return false;
    }

    async recordAdminAction(action, details) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return;

            await this.supabase
                .from('admin_actions')
                .insert({
                    admin_user_id: currentUser.id,
                    admin_email: currentUser.email,
                    action: action,
                    details: details,
                    ip_address: await this.getIPAddress()
                });

        } catch (error) {
            console.error('[LicenseService] Error recording admin action:', error);
        }
    }

    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return null;
        }
    }

    // Méthodes de debug
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('users_view')
                .select('count', { count: 'exact', head: true });

            if (error) throw error;

            console.log('[LicenseService] Connection test successful');
            return { success: true };

        } catch (error) {
            console.error('[LicenseService] Connection test failed:', error);
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

    // Nouvelle méthode de debug
    async debug() {
        return {
            initialized: this.initialized,
            hasSupabase: !!this.supabase,
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                status: this.currentUser.license_status,
                role: this.currentUser.role,
                account_type: this.currentUser.account_type,
                company: this.currentUser.company
            } : null,
            hasCachedStatus: !!this.cachedLicenseStatus,
            cacheExpiry: this.cacheExpiry,
            connectionTest: await this.testConnection()
        };
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('[LicenseService] ✅ Service loaded v4.1 - RPC version without RLS recursion');
