// LicenseService.js - Service de gestion des licences CORRIGÉ v4.0
// Version optimisée pour Netlify avec connexion Supabase fiable

(function() {
    'use strict';
    
    console.log('[LicenseService] Loading v4.0 - Production ready...');
    
    class LicenseService {
        constructor() {
            this.supabase = null;
            this.currentUser = null;
            this.initialized = false;
            this.config = null;
            this.isNetlify = window.location.hostname.includes('netlify.app');
            this.connectionAttempts = 0;
            this.maxConnectionAttempts = 3;
            
            console.log('[LicenseService] Constructor v4.0');
            console.log('[LicenseService] Environment:', this.isNetlify ? 'Netlify' : 'Local');
            
            // Initialiser immédiatement
            this.initialize();
        }

        async initialize() {
            if (this.initialized) {
                console.log('[LicenseService] Already initialized');
                return true;
            }

            console.log('[LicenseService] Starting initialization...');
            
            try {
                // Étape 1 : Attendre que Supabase soit chargé
                await this.waitForSupabase();
                
                // Étape 2 : Initialiser la configuration
                await this.initializeSupabaseConfig();
                
                // Étape 3 : Créer le client Supabase
                await this.createSupabaseClient();
                
                this.initialized = true;
                console.log('[LicenseService] ✅ Initialization complete');
                
                // Émettre l'événement de disponibilité
                this.emitReadyEvent();
                
                return true;
                
            } catch (error) {
                console.error('[LicenseService] Initialization error:', error);
                this.initialized = true; // Marquer comme initialisé même en cas d'erreur
                this.emitReadyEvent();
                return false;
            }
        }

        async waitForSupabase() {
            console.log('[LicenseService] Waiting for Supabase library...');
            
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes
            
            while (!window.supabase && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.supabase) {
                throw new Error('Supabase library not loaded after 5 seconds');
            }
            
            console.log('[LicenseService] ✅ Supabase library ready');
        }

        async initializeSupabaseConfig() {
            console.log('[LicenseService] Initializing Supabase config...');
            
            // Attendre que supabaseConfig soit disponible
            let attempts = 0;
            const maxAttempts = 30; // 3 secondes
            
            while (!window.supabaseConfig && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.supabaseConfig) {
                throw new Error('Supabase config not available');
            }
            
            // Initialiser la configuration si nécessaire
            if (!window.supabaseConfig.initialized) {
                if (typeof window.initializeSupabaseConfig === 'function') {
                    console.log('[LicenseService] Calling initializeSupabaseConfig...');
                    await window.initializeSupabaseConfig();
                } else if (typeof window.supabaseConfig.initialize === 'function') {
                    console.log('[LicenseService] Calling supabaseConfig.initialize...');
                    await window.supabaseConfig.initialize();
                }
            }
            
            // Récupérer la configuration
            this.config = window.supabaseConfig.getConfig();
            
            if (!this.config || !this.config.url || !this.config.anonKey) {
                throw new Error('Invalid Supabase configuration');
            }
            
            console.log('[LicenseService] ✅ Config loaded:', {
                url: this.config.url.substring(0, 30) + '...',
                hasKey: !!this.config.anonKey
            });
        }

        async createSupabaseClient() {
            console.log('[LicenseService] Creating Supabase client...');
            
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage
                    }
                }
            );
            
            // Test de connexion
            console.log('[LicenseService] Testing connection...');
            const { data, error } = await this.supabase.auth.getSession();
            
            if (error && error.message.includes('Invalid API key')) {
                throw new Error('Invalid API key');
            }
            
            console.log('[LicenseService] ✅ Supabase client created and tested');
        }

        emitReadyEvent() {
            window.licenseServiceReady = true;
            
            setTimeout(() => {
                try {
                    window.dispatchEvent(new CustomEvent('licenseServiceReady', {
                        detail: { service: this }
                    }));
                    console.log('[LicenseService] ✅ Ready event emitted');
                } catch (eventError) {
                    console.warn('[LicenseService] Error emitting ready event:', eventError);
                }
            }, 100);
        }

        // === AUTHENTIFICATION ===

        async authenticateWithEmail(email) {
            console.log('[LicenseService] Authenticating user:', email);
            
            const cleanEmail = email.toLowerCase().trim();
            
            try {
                // Vérifier que Supabase est disponible
                if (!this.supabase) {
                    console.warn('[LicenseService] Supabase not available, using trial mode');
                    return this.createTrialLicense(cleanEmail);
                }
                
                // Rechercher l'utilisateur dans la base
                const { data: user, error } = await this.supabase
                    .from('users')
                    .select(`
                        *,
                        company:companies(*)
                    `)
                    .eq('email', cleanEmail)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[LicenseService] Database error:', error);
                    throw error;
                }

                if (!user) {
                    console.log('[LicenseService] User not found, creating new user');
                    const newUser = await this.createNewUser(cleanEmail);
                    return this.formatLicenseResponse(newUser);
                }

                // Mettre à jour la dernière connexion
                await this.updateLastLogin(user.id);
                
                // Stocker l'utilisateur courant
                this.currentUser = user;
                
                // Retourner la réponse formatée
                return this.formatLicenseResponse(user);
                
            } catch (error) {
                console.error('[LicenseService] Authentication error:', error);
                // En cas d'erreur, retourner une licence d'essai
                return this.createTrialLicense(cleanEmail);
            }
        }

        async createNewUser(email) {
            const domain = email.split('@')[1];
            const name = email.split('@')[0];
            const isPersonalEmail = this.isPersonalEmailDomain(domain);
            
            try {
                // Chercher ou créer la société
                let company = null;
                
                if (!isPersonalEmail) {
                    // Chercher une société existante avec ce domaine
                    const { data: existingCompany } = await this.supabase
                        .from('companies')
                        .select('*')
                        .eq('domain', domain)
                        .single();
                    
                    company = existingCompany;
                }
                
                if (!company) {
                    // Créer une nouvelle société
                    const { data: newCompany, error: companyError } = await this.supabase
                        .from('companies')
                        .insert([{
                            name: isPersonalEmail ? `Personnel - ${email}` : domain,
                            domain: domain,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (companyError) throw companyError;
                    company = newCompany;
                }
                
                // Créer l'utilisateur
                const newUser = {
                    email: email,
                    name: name,
                    company_id: company.id,
                    role: 'user',
                    license_status: 'trial',
                    license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    first_login_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
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
                
                console.log('[LicenseService] ✅ New user created:', data.email);
                return data;
                
            } catch (error) {
                console.error('[LicenseService] Error creating user:', error);
                throw error;
            }
        }

        async updateLastLogin(userId) {
            try {
                await this.supabase
                    .from('users')
                    .update({ 
                        last_login_at: new Date().toISOString()
                    })
                    .eq('id', userId);
            } catch (error) {
                console.warn('[LicenseService] Failed to update last login:', error);
            }
        }

        formatLicenseResponse(user) {
            const now = new Date();
            const expiresAt = new Date(user.license_expires_at);
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            // Déterminer le statut
            let status = 'trial';
            let valid = true;
            let message = '';
            
            if (user.license_status === 'blocked') {
                status = 'blocked';
                valid = false;
                message = 'Votre accès a été bloqué par un administrateur';
            } else if (expiresAt < now) {
                status = 'expired';
                valid = false;
                message = 'Votre période d\'essai a expiré';
            } else if (user.license_status === 'active') {
                status = 'active';
                message = 'Licence active';
            } else {
                status = 'trial';
                message = `Période d'essai - ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`;
            }
            
            this.currentUser = user;
            
            return {
                valid: valid,
                status: status,
                user: user,
                message: message,
                daysRemaining: Math.max(0, daysRemaining),
                adminContact: this.getAdminContact(user)
            };
        }

        createTrialLicense(email) {
            const domain = email.split('@')[1];
            const name = email.split('@')[0];
            
            const user = {
                id: 'trial_' + Date.now(),
                email: email,
                name: name,
                role: 'user',
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                company: {
                    id: 'trial_company_' + Date.now(),
                    name: this.isPersonalEmailDomain(domain) ? `Personnel - ${email}` : domain,
                    domain: domain
                },
                created_at: new Date().toISOString()
            };
            
            this.currentUser = user;
            
            return {
                valid: true,
                status: 'trial',
                user: user,
                message: 'Période d\'essai - 15 jours restants (Mode hors ligne)',
                daysRemaining: 15,
                offline: true
            };
        }

        getAdminContact(user) {
            // Si l'utilisateur a une société, chercher l'admin
            if (user.company_id && user.company) {
                return {
                    name: user.company.name + ' Admin',
                    email: `admin@${user.company.domain}`
                };
            }
            return null;
        }

        // === MÉTHODES UTILITAIRES ===

        getCurrentUser() {
            return this.currentUser;
        }

        isAdmin() {
            return this.currentUser?.role === 'company_admin' || 
                   this.currentUser?.role === 'super_admin';
        }

        async logout() {
            console.log('[LicenseService] Logging out...');
            
            this.currentUser = null;
            window.currentUser = null;
            window.licenseStatus = null;
            
            if (this.supabase) {
                try {
                    await this.supabase.auth.signOut();
                } catch (error) {
                    console.warn('[LicenseService] Logout error:', error);
                }
            }
            
            // Nettoyer le localStorage
            try {
                localStorage.removeItem('emailsortpro_user_email');
                localStorage.removeItem('emailsortpro_current_user');
                localStorage.removeItem('emailsortpro_last_check');
            } catch (error) {
                console.warn('[LicenseService] Error clearing localStorage:', error);
            }
        }

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

        // === ANALYTICS ===

        async trackAnalyticsEvent(eventType, eventData = {}) {
            if (!this.supabase || !this.currentUser) {
                return;
            }

            try {
                const event = {
                    user_id: this.currentUser.id,
                    user_email: this.currentUser.email,
                    event_type: eventType,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                };

                await this.supabase
                    .from('analytics_events')
                    .insert([event]);
                    
                console.log('[LicenseService] Analytics event tracked:', eventType);
            } catch (error) {
                console.warn('[LicenseService] Analytics error:', error);
            }
        }

        // === DEBUG ===

        async debug() {
            const debugInfo = {
                initialized: this.initialized,
                hasSupabase: !!this.supabase,
                hasConfig: !!this.config,
                currentUser: this.currentUser,
                isAdmin: this.isAdmin(),
                connectionAttempts: this.connectionAttempts
            };
            
            // Test de connexion
            if (this.supabase) {
                try {
                    const { count, error } = await this.supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true });
                    
                    debugInfo.databaseConnection = !error;
                    debugInfo.userCount = count;
                } catch (error) {
                    debugInfo.databaseConnection = false;
                    debugInfo.connectionError = error.message;
                }
            }
            
            console.log('[LicenseService] Debug info:', debugInfo);
            return debugInfo;
        }
    }

    // === CRÉATION DE L'INSTANCE GLOBALE ===

    // Supprimer l'ancienne instance si elle existe
    if (window.licenseService) {
        console.log('[LicenseService] Removing old instance');
        delete window.licenseService;
    }
    
    // Créer la nouvelle instance
    window.licenseService = new LicenseService();
    console.log('[LicenseService] ✅ Global instance created v4.0');
    
    // Exposer la classe pour debug
    window.LicenseService = LicenseService;

})();
