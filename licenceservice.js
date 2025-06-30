// LicenseService.js - Service de gestion des licences CORRIGÉ v3.2
// Version spéciale pour Netlify avec authentification base de données

(function() {
    'use strict';
    
    console.log('[LicenseService] Loading v3.2 - Netlify optimized with database auth...');
    
    class LicenseService {
        constructor() {
            this.supabase = null;
            this.currentUser = null;
            this.initialized = false;
            this.config = null;
            this.isNetlify = window.location.hostname.includes('netlify.app');
            this.isFallback = false;
            this.isEmergency = false;
            this.autoAuthInProgress = false;
            
            console.log('[LicenseService] Initializing v3.2...');
            console.log('[LicenseService] Environment:', this.isNetlify ? 'Netlify' : 'Local');
            
            // Initialisation immédiate
            this.immediateInit();
        }

        immediateInit() {
            try {
                console.log('[LicenseService] Starting immediate initialization...');
                
                // Marquer comme initialisé immédiatement pour éviter les blocages
                this.initialized = true;
                
                // Si on est sur Netlify, essayer l'authentification automatique
                if (this.isNetlify) {
                    this.tryNetlifyAuth();
                } else {
                    // En local, utiliser le fallback
                    this.enableFallbackMode();
                }
                
            } catch (error) {
                console.error('[LicenseService] Immediate init error:', error);
                this.enableFallbackMode();
            }
        }

        async tryNetlifyAuth() {
            try {
                console.log('[LicenseService] Attempting Netlify authentication...');
                
                // Essayer d'initialiser Supabase
                await this.initializeSupabase();
                
                // Si on a un utilisateur authentifié via les auth services, l'utiliser
                setTimeout(() => this.checkAuthServicesForUser(), 1000);
                
            } catch (error) {
                console.warn('[LicenseService] Netlify auth failed, using fallback:', error.message);
                this.enableFallbackMode();
            }
        }

        async initializeSupabase() {
            try {
                // Attendre que la config Supabase soit prête
                let attempts = 0;
                while (!window.supabaseConfig && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    attempts++;
                }

                if (!window.supabaseConfig) {
                    throw new Error('supabaseConfig not available');
                }

                // Initialiser la configuration
                await window.supabaseConfig.initialize();
                this.config = window.supabaseConfig.getConfig();
                
                if (!this.config || !this.config.url || !this.config.anonKey) {
                    throw new Error('Invalid Supabase config');
                }

                // Créer le client Supabase
                this.supabase = window.supabase.createClient(
                    this.config.url,
                    this.config.anonKey,
                    this.config.auth || {}
                );

                // Test rapide de connexion
                const { error } = await this.supabase.auth.getSession();
                if (error && !error.message.includes('session')) {
                    throw error;
                }

                console.log('[LicenseService] ✅ Supabase initialized successfully');
                this.isFallback = false;
                
            } catch (error) {
                console.warn('[LicenseService] Supabase initialization failed:', error.message);
                throw error;
            }
        }

        checkAuthServicesForUser() {
            console.log('[LicenseService] Checking auth services for authenticated user...');
            
            // Vérifier Microsoft Auth
            if (window.authService && window.authService.isAuthenticated()) {
                const account = window.authService.getAccount();
                if (account && account.username) {
                    console.log('[LicenseService] Found Microsoft user, authenticating:', account.username);
                    this.authenticateWithEmail(account.username);
                    return;
                }
            }
            
            // Vérifier Google Auth
            if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
                const account = window.googleAuthService.getAccount();
                if (account && account.email) {
                    console.log('[LicenseService] Found Google user, authenticating:', account.email);
                    this.authenticateWithEmail(account.email);
                    return;
                }
            }
            
            console.log('[LicenseService] No authenticated user found in auth services');
        }

        enableFallbackMode() {
            console.log('[LicenseService] 🔄 Enabling fallback mode...');
            this.isFallback = true;
            this.initialized = true;
            this.supabase = null;
            
            console.log('[LicenseService] ✅ Fallback mode enabled');
        }

        // === MÉTHODES PUBLIQUES ===

        async initialize() {
            console.log('[LicenseService] Initialize called (already initialized)');
            return this.initialized;
        }

        async authenticateWithEmail(email) {
            if (this.autoAuthInProgress) {
                console.log('[LicenseService] Auto-auth already in progress, skipping');
                return;
            }
            
            this.autoAuthInProgress = true;
            
            try {
                console.log('[LicenseService] Authenticating user:', email);
                
                let result;
                
                if (this.isFallback || !this.supabase) {
                    result = this.authenticateWithEmailFallback(email);
                } else {
                    try {
                        result = await this.authenticateWithSupabase(email);
                    } catch (error) {
                        console.warn('[LicenseService] Supabase auth failed, using fallback:', error.message);
                        result = this.authenticateWithEmailFallback(email);
                    }
                }
                
                // Marquer les variables globales
                if (result && result.valid && result.user) {
                    window.currentUser = result.user;
                    window.licenseStatus = {
                        status: result.status,
                        daysRemaining: result.daysRemaining,
                        valid: result.valid,
                        message: result.message
                    };
                    
                    console.log('[LicenseService] ✅ User authenticated and globals set:', {
                        email: result.user.email,
                        status: result.status,
                        daysRemaining: result.daysRemaining
                    });
                    
                    // Émettre un événement pour notifier l'app
                    window.dispatchEvent(new CustomEvent('userAuthenticated', {
                        detail: { user: result.user, status: result }
                    }));
                }
                
                return result;
                
            } catch (error) {
                console.error('[LicenseService] Authentication error:', error);
                return this.authenticateWithEmailFallback(email);
            } finally {
                this.autoAuthInProgress = false;
            }
        }

        async authenticateWithSupabase(email) {
            if (!this.supabase) {
                throw new Error('Supabase not available');
            }
            
            const cleanEmail = email.toLowerCase().trim();
            console.log('[LicenseService] Supabase authentication for:', cleanEmail);
            
            // Récupérer l'utilisateur avec sa société
            let { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `)
                .eq('email', cleanEmail)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            if (!user) {
                console.log('[LicenseService] User not found, creating new user:', cleanEmail);
                user = await this.createNewUser(cleanEmail);
            }

            // Mettre à jour last_login
            const { error: updateError } = await this.supabase
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.warn('[LicenseService] Failed to update last_login:', updateError);
            }

            this.currentUser = user;
            const licenseStatus = this.evaluateLicenseStatus(user);
            
            // Tracker la connexion
            await this.trackAnalyticsEvent('user_login', {
                email: cleanEmail,
                timestamp: new Date().toISOString(),
                license_status: licenseStatus.status
            });

            console.log('[LicenseService] ✅ Supabase authentication successful:', {
                email: user.email,
                status: licenseStatus.status,
                company: user.company?.name
            });

            return {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user,
                message: licenseStatus.message,
                daysRemaining: licenseStatus.daysRemaining,
                adminContact: licenseStatus.adminContact
            };
        }

        authenticateWithEmailFallback(email) {
            console.log('[LicenseService] Using fallback authentication for:', email);
            
            const cleanEmail = email.toLowerCase().trim();
            const domain = cleanEmail.split('@')[1];
            const name = cleanEmail.split('@')[0];
            
            // Créer un utilisateur simulé
            const user = {
                id: Date.now(),
                email: cleanEmail,
                name: name,
                role: 'user',
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                company: {
                    id: Date.now() + 1,
                    name: this.isPersonalEmailDomain(domain) ? `Personnel - ${cleanEmail}` : domain,
                    domain: domain
                },
                company_id: Date.now() + 1,
                created_at: new Date().toISOString(),
                first_login_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            };
            
            this.currentUser = user;
            const daysRemaining = 15;
            
            return {
                valid: true,
                status: 'trial',
                user: user,
                message: `Période d'essai - ${daysRemaining} jours restants ${this.isFallback ? '(Mode simulation)' : ''}`,
                daysRemaining: daysRemaining,
                fallback: this.isFallback
            };
        }

        async createNewUser(email) {
            const domain = email.split('@')[1];
            const name = email.split('@')[0];
            const isPersonalEmail = this.isPersonalEmailDomain(domain);
            const trialDays = 15;
            const expirationDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

            // Créer d'abord la société si nécessaire
            let company;
            if (isPersonalEmail) {
                const { data: newCompany, error: companyError } = await this.supabase
                    .from('companies')
                    .insert([{
                        name: `Personnel - ${email}`,
                        domain: domain,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (companyError) throw companyError;
                company = newCompany;
            } else {
                // Chercher société existante
                const { data: existingCompany } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('domain', domain)
                    .single();
                
                company = existingCompany;
            }

            const newUser = {
                email: email.toLowerCase(),
                name: name,
                company_id: company?.id,
                role: company ? 'company_admin' : 'user',
                license_status: 'trial',
                license_expires_at: expirationDate.toISOString(),
                first_login_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('users')
                .insert([newUser])
                .select(`
                    *,
                    company:companies(*)
                `)
                .single();

            if (error) throw error;
            
            console.log('[LicenseService] ✅ New user created:', data.email, 'Role:', data.role);
            return data;
        }

        evaluateLicenseStatus(user) {
            if (user.license_status === 'blocked') {
                return {
                    valid: false,
                    status: 'blocked',
                    message: 'Votre accès a été bloqué par votre administrateur.'
                };
            }

            const expiresAt = new Date(user.license_expires_at);
            const now = new Date();
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

            if (expiresAt < now) {
                return {
                    valid: false,
                    status: 'expired',
                    message: 'Votre période d\'essai a expiré.',
                    daysRemaining: 0
                };
            }

            if (user.license_status === 'active') {
                return {
                    valid: true,
                    status: 'active',
                    message: 'Licence active',
                    daysRemaining: daysRemaining
                };
            }

            if (user.license_status === 'trial') {
                let message = `Période d'essai - ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`;
                
                if (daysRemaining <= 3) {
                    message += ` ⚠️ Votre essai expire bientôt!`;
                }

                return {
                    valid: true,
                    status: 'trial',
                    message: message,
                    daysRemaining: daysRemaining,
                    warningLevel: daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low'
                };
            }

            return {
                valid: false,
                status: 'invalid',
                message: 'Statut de licence invalide.'
            };
        }

        async checkUserLicense(email) {
            try {
                return await this.authenticateWithEmail(email);
            } catch (error) {
                console.error('[LicenseService] Check license error:', error);
                return this.authenticateWithEmailFallback(email);
            }
        }

        // === ANALYTICS ===

        async trackAnalyticsEvent(eventType, eventData = {}) {
            if (this.isFallback || !this.currentUser) {
                console.log('[LicenseService] Skipping analytics (fallback mode)');
                return;
            }

            try {
                const event = {
                    user_id: this.currentUser.id,
                    user_email: this.currentUser.email,
                    user_name: this.currentUser.name,
                    user_domain: this.currentUser.company?.domain || this.currentUser.email.split('@')[1],
                    company_id: this.currentUser.company_id,
                    session_id: this.generateSessionId(),
                    event_type: eventType,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                };

                if (this.supabase) {
                    const { error } = await this.supabase
                        .from('analytics_events')
                        .insert([event]);

                    if (error) {
                        console.error('[LicenseService] Analytics error:', error);
                    } else {
                        console.log('[LicenseService] ✅ Analytics event tracked:', eventType);
                    }
                }
            } catch (error) {
                console.error('[LicenseService] Track event error:', error);
            }
        }

        // === GESTION DES UTILISATEURS ===

        getCurrentUser() {
            return this.currentUser;
        }

        isAdmin() {
            return this.currentUser?.role === 'company_admin' || 
                   this.currentUser?.role === 'super_admin' ||
                   this.isFallback;
        }

        async logout() {
            if (this.currentUser && !this.isFallback) {
                await this.trackAnalyticsEvent('user_logout', {
                    email: this.currentUser.email,
                    timestamp: new Date().toISOString()
                });
            }

            this.currentUser = null;
            
            // Nettoyer les variables globales
            window.currentUser = null;
            window.licenseStatus = null;
            
            if (this.supabase && !this.isFallback) {
                try {
                    await this.supabase.auth.signOut();
                } catch (error) {
                    console.warn('[LicenseService] Supabase logout error:', error);
                }
            }
            
            // Nettoyer le localStorage
            try {
                localStorage.removeItem('emailsortpro_user_email');
                localStorage.removeItem('emailsortpro_current_user');
            } catch (error) {
                console.warn('[LicenseService] Error clearing localStorage:', error);
            }
        }

        // === UTILITAIRES ===

        isPersonalEmailDomain(domain) {
            const personalDomains = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'hotmail.fr', 
                'outlook.com', 'live.com', 'msn.com', 'aol.com',
                'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
                'zoho.com', 'yandex.com', 'mail.com', 'gmx.com',
                'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr',
                'laposte.net', 'bbox.fr', 'numericable.fr'
            ];
            
            return personalDomains.includes(domain.toLowerCase());
        }

        generateSessionId() {
            if (!this._sessionId) {
                this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            return this._sessionId;
        }

        // === DEBUG ===

        async debug() {
            console.group('[LicenseService] Debug Info v3.2');
            console.log('Initialized:', this.initialized);
            console.log('Fallback Mode:', this.isFallback);
            console.log('Is Netlify:', this.isNetlify);
            console.log('Current User:', this.currentUser);
            console.log('Has Supabase:', !!this.supabase);
            console.log('Auto Auth In Progress:', this.autoAuthInProgress);
            
            if (this.currentUser) {
                const licenseStatus = this.evaluateLicenseStatus(this.currentUser);
                console.log('License Status:', licenseStatus);
            }
            
            // Test de connexion Supabase si disponible
            if (this.supabase && !this.isFallback) {
                try {
                    const { data, error } = await this.supabase
                        .from('users')
                        .select('count')
                        .limit(1);
                    console.log('Supabase Connection Test:', error ? 'Failed' : 'Success');
                } catch (testError) {
                    console.log('Supabase Connection Test: Error -', testError.message);
                }
            }
            
            console.groupEnd();
            
            return {
                initialized: this.initialized,
                fallbackMode: this.isFallback,
                isNetlify: this.isNetlify,
                hasSupabase: !!this.supabase,
                currentUser: this.currentUser,
                isAdmin: this.isAdmin(),
                autoAuthInProgress: this.autoAuthInProgress
            };
        }
    }

    // === CRÉATION DE L'INSTANCE GLOBALE ===

    try {
        // Éviter la double création
        if (window.licenseService) {
            console.log('[LicenseService] Instance already exists, skipping creation');
            return;
        }
        
        // Créer l'instance immédiatement
        const licenseService = new LicenseService();
        window.licenseService = licenseService;
        
        console.log('[LicenseService] ✅ Global instance created successfully v3.2');
        
        // Exposer pour debug
        window.debugLicense = () => licenseService.debug();
        
        // Marquer comme disponible immédiatement
        window.licenseServiceReady = true;
        
        // Émettre un événement personnalisé
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('licenseServiceReady', {
                detail: { service: licenseService }
            }));
        }, 100);
        
    } catch (error) {
        console.error('[LicenseService] ❌ Failed to create global instance:', error);
        
        // Créer un service d'urgence minimal
        window.licenseService = {
            initialized: true,
            isFallback: true,
            isEmergency: true,
            currentUser: null,
            autoAuthInProgress: false,
            
            async initialize() {
                return true;
            },
            
            async authenticateWithEmail(email) {
                console.log('[EmergencyLicenseService] Authenticating:', email);
                const user = {
                    email: email,
                    name: email.split('@')[0],
                    role: 'user',
                    license_status: 'trial',
                    company: { name: 'Demo Company' }
                };
                this.currentUser = user;
                window.currentUser = user;
                window.licenseStatus = { status: 'trial', valid: true, daysRemaining: 15 };
                return {
                    valid: true,
                    status: 'trial',
                    user: user,
                    daysRemaining: 15,
                    message: 'Service d\'urgence activé'
                };
            },
            
            getCurrentUser() { return this.currentUser; },
            isAdmin() { return true; },
            async logout() { 
                this.currentUser = null; 
                window.currentUser = null;
                window.licenseStatus = null;
            },
            async trackAnalyticsEvent() {},
            async debug() {
                return {
                    initialized: true,
                    fallbackMode: true,
                    isEmergency: true,
                    message: 'Service d\'urgence activé'
                };
            }
        };
        
        window.licenseServiceReady = true;
        console.log('[LicenseService] 🚨 Emergency service created');
    }

    console.log('[LicenseService] ✅ Service loaded and ready v3.2 - Netlify optimized');

})();

// Vérification finale et auto-authentification
setTimeout(() => {
    if (window.licenseService && window.licenseService.initialized) {
        console.log('[LicenseService] ✅ Final verification: Service ready');
        
        // Si on est sur Netlify et qu'on a déjà des services d'auth initialisés, 
        // essayer l'authentification automatique
        if (window.location.hostname.includes('netlify.app')) {
            setTimeout(() => {
                if (window.licenseService && typeof window.licenseService.checkAuthServicesForUser === 'function') {
                    window.licenseService.checkAuthServicesForUser();
                }
            }, 2000);
        }
    } else {
        console.error('[LicenseService] ❌ Final verification failed');
    }
}, 200);
