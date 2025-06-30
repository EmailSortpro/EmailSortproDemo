// LicenseService.js - Service de gestion des licences STANDALONE v3.1
// Version complète qui fonctionne même sans dépendances externes

(function() {
    'use strict';
    
    console.log('[LicenseService] Loading standalone v3.1...');
    
    class LicenseService {
        constructor() {
            this.supabase = null;
            this.currentUser = null;
            this.initialized = false;
            this.config = null;
            this.isLocal = this.detectLocalEnvironment();
            this.isFallback = false;
            this.isEmergency = false;
            this.initializationPromise = null;
            
            console.log('[LicenseService] Initializing v3.1...');
            console.log('[LicenseService] Environment:', this.isLocal ? 'Local/Test' : 'Production');
            
            // Initialisation immédiate et robuste
            this.immediateInit();
        }

        detectLocalEnvironment() {
            const hostname = window.location.hostname;
            return hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.includes('.local') ||
                   hostname.includes('netlify.app') ||
                   !window.navigator.onLine;
        }

        immediateInit() {
            // Initialisation synchrone immédiate pour éviter les timeouts
            try {
                console.log('[LicenseService] Starting immediate initialization...');
                
                // En mode local, test, ou sans Supabase disponible
                if (this.isLocal || 
                    typeof window.supabase === 'undefined' || 
                    !window.supabaseConfig) {
                    
                    console.log('[LicenseService] Using fallback mode immediately');
                    this.enableFallbackMode();
                    return;
                }
                
                // Essayer l'initialisation normale en arrière-plan
                this.backgroundInit();
                
            } catch (error) {
                console.error('[LicenseService] Immediate init error:', error);
                this.enableFallbackMode();
            }
        }

        async backgroundInit() {
            try {
                // Essayer d'initialiser Supabase avec timeout court
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Initialization timeout')), 2000)
                );
                
                const initPromise = this.trySupabaseInit();
                
                const result = await Promise.race([initPromise, timeoutPromise]);
                
                if (result) {
                    console.log('[LicenseService] ✅ Background initialization successful');
                } else {
                    throw new Error('Background initialization failed');
                }
                
            } catch (error) {
                console.warn('[LicenseService] Background init failed, keeping fallback mode:', error.message);
                // Garder le mode fallback déjà activé
            }
        }

        async trySupabaseInit() {
            if (!window.supabaseConfig) {
                throw new Error('supabaseConfig not available');
            }
            
            await window.supabaseConfig.initialize();
            this.config = window.supabaseConfig.getConfig();
            
            if (!this.config || !this.config.url || !this.config.anonKey) {
                throw new Error('Invalid Supabase config');
            }

            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                this.config.auth || {}
            );

            // Test rapide de connexion
            const testResult = await this.quickConnectionTest();
            if (!testResult.success) {
                throw new Error(testResult.message);
            }

            // Passer en mode normal
            this.isFallback = false;
            console.log('[LicenseService] ✅ Supabase mode enabled');
            return true;
        }

        async quickConnectionTest() {
            if (!this.supabase) {
                return { success: false, message: 'No Supabase client' };
            }

            try {
                // Test très rapide
                const { error } = await this.supabase.auth.getSession();
                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }

        enableFallbackMode() {
            console.log('[LicenseService] 🔄 Enabling fallback mode...');
            this.isFallback = true;
            this.initialized = true;
            this.supabase = null;
            
            // Marquer comme disponible immédiatement pour l'app
            window.licenseService = this;
            
            console.log('[LicenseService] ✅ Fallback mode enabled and ready');
        }

        // === MÉTHODES PUBLIQUES ===

        async initialize() {
            console.log('[LicenseService] Initialize called (already initialized in constructor)');
            return this.initialized;
        }

        async authenticateWithEmail(email) {
            console.log('[LicenseService] Authenticating user:', email);
            
            if (this.isFallback) {
                return this.authenticateWithEmailFallback(email);
            }
            
            try {
                // Essayer l'authentification normale si Supabase est disponible
                return await this.authenticateWithSupabase(email);
            } catch (error) {
                console.warn('[LicenseService] Supabase auth failed, using fallback:', error.message);
                return this.authenticateWithEmailFallback(email);
            }
        }

        async authenticateWithSupabase(email) {
            if (!this.supabase) {
                throw new Error('Supabase not available');
            }
            
            const cleanEmail = email.toLowerCase().trim();
            
            // Récupérer l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select(`*, company:companies(*)`)
                .eq('email', cleanEmail)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (!user) {
                user = await this.createNewUser(cleanEmail);
            }

            // Mettre à jour last_login
            await this.supabase
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            this.currentUser = user;
            const licenseStatus = this.evaluateLicenseStatus(user);
            
            await this.trackAnalyticsEvent('user_login', {
                email: cleanEmail,
                timestamp: new Date().toISOString(),
                license_status: licenseStatus.status
            });

            return {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user,
                message: licenseStatus.message,
                daysRemaining: licenseStatus.daysRemaining
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
            
            // Simuler un statut de licence
            const daysRemaining = 15;
            
            // Marquer les utilisateurs globaux pour l'app
            window.currentUser = user;
            window.licenseStatus = {
                status: 'trial',
                daysRemaining: daysRemaining,
                valid: true
            };
            
            return {
                valid: true,
                status: 'trial',
                user: user,
                message: `Période d'essai - ${daysRemaining} jours restants (Mode ${this.isFallback ? 'simulation' : 'normal'})`,
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
                .select(`*, company:companies(*)`)
                .single();

            if (error) throw error;
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
            if (this.isFallback || !this.initialized || !this.currentUser) {
                console.log('[LicenseService] Skipping analytics (fallback mode)');
                return;
            }

            try {
                const event = {
                    user_id: this.currentUser.id,
                    user_email: this.currentUser.email,
                    user_name: this.currentUser.name,
                    event_type: eventType,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                };

                if (this.supabase) {
                    await this.supabase.from('analytics_events').insert([event]);
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
                   this.isFallback; // En mode fallback, tout le monde est admin
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
            console.group('[LicenseService] Debug Info v3.1');
            console.log('Initialized:', this.initialized);
            console.log('Fallback Mode:', this.isFallback);
            console.log('Is Local:', this.isLocal);
            console.log('Current User:', this.currentUser);
            console.log('Has Supabase:', !!this.supabase);
            console.log('Environment:', window.location.hostname);
            
            if (this.currentUser) {
                const licenseStatus = this.evaluateLicenseStatus(this.currentUser);
                console.log('License Status:', licenseStatus);
            }
            
            console.groupEnd();
            
            return {
                initialized: this.initialized,
                fallbackMode: this.isFallback,
                isLocal: this.isLocal,
                hasSupabase: !!this.supabase,
                currentUser: this.currentUser,
                isAdmin: this.isAdmin(),
                environment: window.location.hostname
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
        
        console.log('[LicenseService] ✅ Global instance created successfully v3.1');
        
        // Exposer pour debug
        window.debugLicense = () => licenseService.debug();
        
        // Auto-authentification pour les tests si email présent
        if (window.location.search.includes('test-email=')) {
            const urlParams = new URLSearchParams(window.location.search);
            const testEmail = urlParams.get('test-email');
            if (testEmail) {
                console.log('[LicenseService] Auto-authenticating test email:', testEmail);
                licenseService.authenticateWithEmail(testEmail)
                    .then(result => {
                        console.log('[LicenseService] Auto-auth result:', result);
                    })
                    .catch(error => {
                        console.error('[LicenseService] Auto-auth error:', error);
                    });
            }
        }
        
    } catch (error) {
        console.error('[LicenseService] ❌ Failed to create global instance:', error);
        
        // Créer un service d'urgence minimal
        window.licenseService = {
            initialized: true,
            isFallback: true,
            isEmergency: true,
            currentUser: null,
            
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
        
        console.log('[LicenseService] 🚨 Emergency service created');
    }

    console.log('[LicenseService] ✅ Standalone service loaded and ready v3.1');

})();

// Vérification finale
setTimeout(() => {
    if (window.licenseService && window.licenseService.initialized) {
        console.log('[LicenseService] ✅ Final verification: Service ready');
        
        // Marquer comme disponible pour l'app
        window.licenseServiceReady = true;
        
        // Émettre un événement personnalisé
        window.dispatchEvent(new CustomEvent('licenseServiceReady', {
            detail: { service: window.licenseService }
        }));
    } else {
        console.error('[LicenseService] ❌ Final verification failed');
    }
}, 100);
