// LicenseService.js - Service de gestion des licences EmailSortPro
// Version 3.0 avec authentification par email et gestion complète des licences

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = null;
        this.cachedLicenseStatus = null;
        this.cacheExpiry = null;
        
        console.log('[LicenseService] Service created v3.0');
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

    // NOUVELLE MÉTHODE PRINCIPALE POUR L'AUTHENTIFICATION PAR EMAIL
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
                console.log('[LicenseService] New user detected, creating trial account');
                // Créer un nouvel utilisateur avec période d'essai
                const createResult = await this.createUserWithTrial({
                    email: email,
                    name: email.split('@')[0],
                    trialDays: 15
                });
                
                if (!createResult.success) {
                    return {
                        valid: false,
                        status: 'error',
                        message: 'Impossible de créer votre compte d\'essai',
                        error: createResult.error
                    };
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
                .select('id, email')
                .eq('email', email)
                .single();

            if (error && error.code === 'PGRST116') {
                // Pas de résultat trouvé
                console.log('[LicenseService] User not found');
                return false;
            }

            if (error) {
                throw error;
            }

            console.log('[LicenseService] User exists:', !!data);
            return !!data;

        } catch (error) {
            console.error('[LicenseService] Error checking user:', error);
            return false;
        }
    }

    async createUserWithTrial({ email, name, trialDays = 15 }) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Creating user with trial:', { email, name, trialDays });
            
            // Calculer la date d'expiration
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + trialDays);

            // Extraire le domaine de l'email
            const domain = email.split('@')[1];

            // Créer l'utilisateur
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .insert({
                    email: email,
                    name: name || email.split('@')[0],
                    role: 'user',
                    license_status: 'trial',
                    license_expires_at: expiresAt.toISOString(),
                    first_login_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    login_count: 1
                })
                .select()
                .single();

            if (userError) {
                console.error('[LicenseService] Error creating user:', userError);
                
                // Si l'utilisateur existe déjà, mettre à jour
                if (userError.code === '23505') {
                    return await this.updateExistingUserTrial(email, expiresAt);
                }
                
                throw userError;
            }

            console.log('[LicenseService] ✅ User created with trial');

            // Créer ou mettre à jour les stats utilisateur
            await this.updateUserStats(email, name, domain);

            // Enregistrer l'événement analytics
            await this.recordAnalyticsEvent(userData.id, 'trial_started', {
                trial_days: trialDays,
                expires_at: expiresAt.toISOString()
            });

            return { success: true, user: userData };

        } catch (error) {
            console.error('[LicenseService] Error creating user with trial:', error);
            return { success: false, error: error.message };
        }
    }

    async updateExistingUserTrial(email, expiresAt) {
        try {
            console.log('[LicenseService] Updating existing user trial');
            
            // D'abord récupérer l'utilisateur pour avoir son login_count actuel
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
                    license_expires_at: expiresAt.toISOString(),
                    last_login_at: new Date().toISOString(),
                    login_count: (currentUser?.login_count || 0) + 1
                })
                .

            if (error) throw error;

            return { success: true, user: data };

        } catch (error) {
            console.error('[LicenseService] Error updating user trial:', error);
            return { success: false, error: error.message };
        }
    }

    async checkLicenseStatus(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log('[LicenseService] Checking license status for:', email);
            
            // Récupérer l'utilisateur
            const { data: user, error } = await this.supabase
                .from('users')
                .select('*, company:companies(*)')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Utilisateur non trouvé
                    console.log('[LicenseService] User not found');
                    return { 
                        valid: false, 
                        status: 'not_found',
                        message: 'Compte utilisateur non trouvé'
                    };
                }
                throw error;
            }

            // Vérifier le statut de licence
            const status = user.license_status;
            const expiresAt = user.license_expires_at ? new Date(user.license_expires_at) : null;
            const now = new Date();

            console.log('[LicenseService] User license info:', {
                status: status,
                expires_at: expiresAt,
                is_expired: expiresAt ? expiresAt < now : false
            });

            // Obtenir les infos de contact admin si disponibles
            let adminContact = null;
            if (user.company_id && user.company) {
                const { data: adminData } = await this.supabase
                    .from('users')
                    .select('email, name')
                    .eq('company_id', user.company_id)
                    .eq('role', 'company_admin')
                    .single();
                
                if (adminData) {
                    adminContact = adminData;
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
            // D'abord récupérer le login_count actuel
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

            // Créer l'utilisateur avec licence trial
            const result = await this.createUserWithTrial({
                email: email,
                name: email.split('@')[0],
                trialDays: 30 // 30 jours pour les utilisateurs ajoutés par admin
            });

            if (result.success && currentUser.company_id) {
                // Associer à la company
                await this.supabase
                    .from('users')
                    .update({ company_id: currentUser.company_id })
                    .eq('email', email);
            }

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
                .from('users')
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
                role: this.currentUser.role
            } : null,
            hasCachedStatus: !!this.cachedLicenseStatus,
            cacheExpiry: this.cacheExpiry,
            connectionTest: await this.testConnection()
        };
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('[LicenseService] ✅ Service loaded v3.0 - Authentication by email');
