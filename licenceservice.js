// LicenseService.js - Service de gestion des licences CORRIGÉ v3.0
// Version simplifiée et robuste avec fallback automatique

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.config = null;
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.isFallback = false;
        
        console.log('[LicenseService] Initializing v3.0...');
        console.log('[LicenseService] Environment:', this.isLocal ? 'Local' : 'Production');
        
        // Auto-initialisation
        this.autoInitialize();
    }

    async autoInitialize() {
        try {
            const success = await this.initialize();
            if (!success) {
                console.warn('[LicenseService] Failed to initialize, switching to fallback mode');
                this.enableFallbackMode();
            }
        } catch (error) {
            console.error('[LicenseService] Auto-initialization error:', error);
            this.enableFallbackMode();
        }
    }

    async initialize() {
        try {
            console.log('[LicenseService] Starting initialization...');
            
            // En mode local ou si Supabase n'est pas disponible, utiliser le fallback
            if (this.isLocal || typeof window.supabase === 'undefined') {
                console.log('[LicenseService] Local environment or Supabase not available, using fallback');
                this.enableFallbackMode();
                return true;
            }
            
            // Attendre la configuration Supabase (avec timeout)
            let attempts = 0;
            while (!window.supabaseConfig && attempts < 10) {
                console.log('[LicenseService] Waiting for Supabase config...');
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            if (!window.supabaseConfig) {
                console.warn('[LicenseService] Supabase config not available, using fallback');
                this.enableFallbackMode();
                return true;
            }

            // Initialiser la configuration Supabase
            await window.supabaseConfig.initialize();
            this.config = window.supabaseConfig.getConfig();
            
            if (!this.config || !this.config.url || !this.config.anonKey) {
                console.warn('[LicenseService] Invalid Supabase config, using fallback');
                this.enableFallbackMode();
                return true;
            }

            // Créer le client Supabase
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                this.config.auth || {}
            );

            // Test de connexion rapide
            const testResult = await this.testConnection();
            if (!testResult.success) {
                console.warn('[LicenseService] Connection test failed, using fallback:', testResult.message);
                this.enableFallbackMode();
                return true;
            }

            this.initialized = true;
            console.log('[LicenseService] ✅ Initialized successfully with Supabase');
            return true;
            
        } catch (error) {
            console.error('[LicenseService] Initialization failed:', error);
            this.enableFallbackMode();
            return true; // Retourner true même en cas d'erreur car le fallback est activé
        }
    }

    enableFallbackMode() {
        console.log('[LicenseService] 🔄 Enabling fallback mode...');
        this.isFallback = true;
        this.initialized = true;
        this.supabase = null;
        console.log('[LicenseService] ✅ Fallback mode enabled');
    }

    async testConnection() {
        if (!this.supabase) {
            return { success: false, message: 'Supabase client not initialized' };
        }

        try {
            console.log('[LicenseService] Testing connection...');
            
            // Test simple avec timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            );
            
            const testPromise = this.supabase.auth.getSession();
            
            const { data, error } = await Promise.race([testPromise, timeoutPromise]);
            
            if (error && error.message.includes('Invalid API key')) {
                return { 
                    success: false, 
                    message: 'Invalid API key',
                    error: 'INVALID_API_KEY'
                };
            }
            
            console.log('[LicenseService] ✅ Connection test successful');
            return { 
                success: true, 
                message: 'Connection successful'
            };
            
        } catch (error) {
            console.error('[LicenseService] Connection test error:', error);
            return { 
                success: false, 
                message: `Connection error: ${error.message}`,
                error: error.code || 'CONNECTION_ERROR'
            };
        }
    }

    // === AUTHENTIFICATION ===
    
    async authenticateWithEmail(email) {
        console.log('[LicenseService] Authenticating user:', email);
        
        if (this.isFallback) {
            return this.authenticateWithEmailFallback(email);
        }
        
        if (!this.initialized) {
            const initResult = await this.initialize();
            if (!initResult || this.isFallback) {
                return this.authenticateWithEmailFallback(email);
            }
        }
        
        try {
            const cleanEmail = email.toLowerCase().trim();
            
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
                // Créer un nouvel utilisateur
                console.log('[LicenseService] Creating new user:', cleanEmail);
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

            // Stocker l'utilisateur courant
            this.currentUser = user;
            
            // Évaluer le statut de licence
            const licenseStatus = this.evaluateLicenseStatus(user);
            
            // Tracker la connexion
            await this.trackAnalyticsEvent('user_login', {
                email: cleanEmail,
                timestamp: new Date().toISOString(),
                license_status: licenseStatus.status
            });

            console.log('[LicenseService] Authentication successful:', {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user.email,
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
            
        } catch (error) {
            console.error('[LicenseService] Authentication error:', error);
            
            // En cas d'erreur, basculer vers le fallback
            console.warn('[LicenseService] Switching to fallback due to auth error');
            return this.authenticateWithEmailFallback(email);
        }
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
        
        return {
            valid: true,
            status: 'trial',
            user: user,
            message: `Période d'essai - ${daysRemaining} jours restants (Mode simulation)`,
            daysRemaining: daysRemaining,
            fallback: true
        };
    }

    async createNewUser(email) {
        const domain = email.split('@')[1];
        const name = email.split('@')[0];

        console.log('[LicenseService] Creating user for domain:', domain);

        // Vérifier si c'est un domaine d'entreprise existant
        const { data: company } = await this.supabase
            .from('companies')
            .select('*')
            .eq('domain', domain)
            .single();

        const isPersonalEmail = this.isPersonalEmailDomain(domain);

        // Si email personnel et pas de société, créer une société individuelle
        let companyId = company?.id;
        if (isPersonalEmail && !company) {
            const newCompany = await this.createPersonalCompany(email);
            companyId = newCompany.id;
        }

        // Déterminer le rôle
        let role = 'user';
        if (isPersonalEmail || !company) {
            role = 'company_admin'; // Premier utilisateur = admin
        } else if (company) {
            // Vérifier s'il y a déjà des admins dans cette société
            const { data: admins } = await this.supabase
                .from('users')
                .select('id')
                .eq('company_id', company.id)
                .eq('role', 'company_admin');
            
            if (!admins || admins.length === 0) {
                role = 'company_admin'; // Premier utilisateur de la société
            }
        }

        // Calculer la date d'expiration (15 jours d'essai)
        const trialDays = 15;
        const expirationDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

        const newUser = {
            email: email.toLowerCase(),
            name: name,
            company_id: companyId,
            role: role,
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

        if (error) {
            console.error('[LicenseService] Error creating user:', error);
            throw error;
        }

        console.log('[LicenseService] ✅ User created:', data.email, 'Role:', data.role);
        return data;
    }

    async createPersonalCompany(email) {
        const domain = email.split('@')[1];
        const companyName = `Personnel - ${email}`;
        
        const { data: company, error } = await this.supabase
            .from('companies')
            .insert([{
                name: companyName,
                domain: domain,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('[LicenseService] Error creating company:', error);
            throw error;
        }

        console.log('[LicenseService] ✅ Personal company created:', company.name);
        return company;
    }

    // === VÉRIFICATION DES LICENCES ===

    evaluateLicenseStatus(user) {
        // Vérifier si bloqué
        if (user.license_status === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Votre accès a été bloqué par votre administrateur.',
                adminContact: this.getAdminContact(user)
            };
        }

        // Vérifier l'expiration
        const expiresAt = new Date(user.license_expires_at);
        const now = new Date();
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        if (expiresAt < now) {
            return {
                valid: false,
                status: 'expired',
                message: `Votre période d'essai de 15 jours a expiré. Contactez votre administrateur pour renouveler votre licence.`,
                daysRemaining: 0,
                adminContact: this.getAdminContact(user)
            };
        }

        // Vérifier le statut
        if (user.license_status === 'active') {
            return {
                valid: true,
                status: 'active',
                message: 'Licence active',
                daysRemaining: daysRemaining
            };
        }

        if (user.license_status === 'trial') {
            // Avertissement si moins de 3 jours
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
            message: 'Statut de licence invalide. Contactez votre administrateur.',
            adminContact: this.getAdminContact(user)
        };
    }

    async getAdminContact(user) {
        if (!user.company_id || this.isFallback) return null;

        try {
            const { data: admins } = await this.supabase
                .from('users')
                .select('name, email')
                .eq('company_id', user.company_id)
                .eq('role', 'company_admin')
                .limit(1);

            return admins && admins.length > 0 ? admins[0] : null;
        } catch (error) {
            console.error('[LicenseService] Error getting admin contact:', error);
            return null;
        }
    }

    async checkUserLicense(email) {
        if (this.isFallback) {
            return this.authenticateWithEmailFallback(email);
        }
        
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            const { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `)
                .eq('email', email.toLowerCase())
                .single();

            if (error || !user) {
                return {
                    valid: false,
                    status: 'not_found',
                    message: 'Utilisateur non trouvé'
                };
            }

            return this.evaluateLicenseStatus(user);
            
        } catch (error) {
            console.error('[LicenseService] Check license error:', error);
            return this.authenticateWithEmailFallback(email);
        }
    }

    // === ANALYTICS ===

    async trackAnalyticsEvent(eventType, eventData = {}) {
        if (this.isFallback || !this.initialized || !this.currentUser) {
            console.log('[LicenseService] Skipping analytics (fallback mode or not initialized)');
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

            const { error } = await this.supabase
                .from('analytics_events')
                .insert([event]);

            if (error) {
                console.error('[LicenseService] Analytics error:', error);
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
        return this.currentUser?.role === 'company_admin' || this.currentUser?.role === 'super_admin';
    }

    async logout() {
        if (this.currentUser && !this.isFallback) {
            await this.trackAnalyticsEvent('user_logout', {
                email: this.currentUser.email,
                timestamp: new Date().toISOString()
            });
        }

        this.currentUser = null;
        
        if (this.supabase && !this.isFallback) {
            try {
                await this.supabase.auth.signOut();
            } catch (error) {
                console.warn('[LicenseService] Error during Supabase logout:', error);
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
        console.group('[LicenseService] Debug Info v3.0');
        console.log('Initialized:', this.initialized);
        console.log('Fallback Mode:', this.isFallback);
        console.log('Is Local:', this.isLocal);
        console.log('Current User:', this.currentUser);
        console.log('Has Supabase:', !!this.supabase);
        console.log('Config:', this.config ? 'Loaded' : 'Not loaded');
        
        if (this.currentUser) {
            const licenseStatus = this.evaluateLicenseStatus(this.currentUser);
            console.log('License Status:', licenseStatus);
        }
        
        // Test de connexion
        if (this.supabase && !this.isFallback) {
            try {
                const connectionTest = await this.testConnection();
                console.log('Connection Test:', connectionTest);
            } catch (error) {
                console.log('Connection Test Error:', error.message);
            }
        }
        
        console.groupEnd();
        
        return {
            initialized: this.initialized,
            fallbackMode: this.isFallback,
            isLocal: this.isLocal,
            hasSupabase: !!this.supabase,
            hasConfig: !!this.config,
            currentUser: this.currentUser,
            isAdmin: this.isAdmin()
        };
    }
}

// Créer une instance globale immédiatement
try {
    if (!window.licenseService) {
        window.licenseService = new LicenseService();
        console.log('[LicenseService] ✅ Global instance created successfully v3.0');
    } else {
        console.log('[LicenseService] Global instance already exists');
    }
} catch (error) {
    console.error('[LicenseService] ❌ Failed to create global instance:', error);
    
    // Créer un fallback minimal
    window.licenseService = {
        initialized: true,
        isFallback: true,
        currentUser: null,
        
        async initialize() {
            console.log('[LicenseService] Fallback: initialize called');
            return true;
        },
        
        async authenticateWithEmail(email) {
            console.log('[LicenseService] Fallback: authenticateWithEmail called for', email);
            const user = {
                email: email,
                name: email.split('@')[0],
                role: 'user',
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                company: { name: 'Demo Company' }
            };
            this.currentUser = user;
            return {
                valid: true,
                status: 'trial',
                user: user,
                daysRemaining: 15,
                message: 'Service de licence en mode simulation d\'urgence'
            };
        },
        
        getCurrentUser() {
            return this.currentUser;
        },
        
        isAdmin() {
            return true;
        },
        
        async logout() {
            console.log('[LicenseService] Fallback: logout called');
            this.currentUser = null;
        },
        
        async trackAnalyticsEvent() {
            console.log('[LicenseService] Fallback: trackAnalyticsEvent called');
        },
        
        async debug() {
            return {
                initialized: true,
                fallbackMode: true,
                emergency: true,
                message: 'Service de licence en mode simulation d\'urgence'
            };
        }
    };
}

// Exposer pour debug
window.debugLicense = () => window.licenseService.debug();

console.log('[LicenseService] ✅ Service loaded and ready v3.0 with robust fallback');
