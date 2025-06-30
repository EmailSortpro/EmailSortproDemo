// LicenseService.js - Service de gestion des licences avec Supabase
// Version complète avec authentification et analytics - CORRIGÉ

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.config = null;
        console.log('[LicenseService] Initializing v2.0...');
    }

    async initialize() {
        try {
            console.log('[LicenseService] Starting initialization...');
            
            // Attendre que la configuration Supabase soit prête
            let attempts = 0;
            while (!window.supabaseConfig && attempts < 30) {
                console.log('[LicenseService] Waiting for Supabase config...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            if (!window.supabaseConfig) {
                throw new Error('Supabase configuration not available after 30s');
            }

            // Initialiser la configuration Supabase
            await window.supabaseConfig.initialize();
            this.config = window.supabaseConfig.getConfig();
            
            // Vérifier que Supabase est chargé
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase library not loaded');
            }

            // Créer le client Supabase
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                this.config.auth || {}
            );

            // Test de connexion
            const testResult = await this.testConnection();
            if (!testResult.success) {
                throw new Error(`Connection test failed: ${testResult.message}`);
            }

            this.initialized = true;
            console.log('[LicenseService] ✅ Initialized successfully');
            return true;
            
        } catch (error) {
            console.error('[LicenseService] ❌ Initialization failed:', error);
            this.initialized = false;
            return false;
        }
    }

    async testConnection() {
        if (!this.supabase) {
            return { success: false, message: 'Supabase client not initialized' };
        }

        try {
            console.log('[LicenseService] Testing connection...');
            
            // Test simple avec une requête auth
            const { data, error } = await this.supabase.auth.getSession();
            
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
        if (!this.initialized) {
            const initResult = await this.initialize();
            if (!initResult) {
                throw new Error('Failed to initialize LicenseService');
            }
        }
        
        try {
            const cleanEmail = email.toLowerCase().trim();
            console.log('[LicenseService] Authenticating user:', cleanEmail);
            
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
            
            // Récupérer les licences actives
            const { data: licenses } = await this.supabase
                .from('licenses')
                .select('*')
                .or(`company_id.eq.${user.company_id},user_id.eq.${user.id}`)
                .eq('status', 'active');

            // Tracker la connexion
            await this.trackAnalyticsEvent('user_login', {
                email: cleanEmail,
                timestamp: new Date().toISOString(),
                license_status: licenseStatus.status
            });

            console.log('[LicenseService] Authentication result:', {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user.email,
                company: user.company?.name
            });

            return {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user,
                licenses: licenses || [],
                message: licenseStatus.message,
                daysRemaining: licenseStatus.daysRemaining,
                adminContact: licenseStatus.adminContact
            };
            
        } catch (error) {
            console.error('[LicenseService] Authentication error:', error);
            return {
                valid: false,
                error: error.message,
                status: 'error'
            };
        }
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

        // Créer une licence trial si société créée
        if (companyId && role === 'company_admin') {
            await this.createTrialLicense(data.id, companyId);
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

    async createTrialLicense(userId, companyId) {
        const trialDays = 15;
        const expirationDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

        const { data, error } = await this.supabase
            .from('licenses')
            .insert([{
                company_id: companyId,
                user_id: userId,
                type: 'trial',
                status: 'active',
                max_users: 5, // Limite pour trial
                expires_at: expirationDate.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('[LicenseService] Error creating trial license:', error);
        } else {
            console.log('[LicenseService] ✅ Trial license created');
        }

        return data;
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
        if (!user.company_id) return null;

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
            return {
                valid: false,
                status: 'error',
                message: 'Erreur lors de la vérification'
            };
        }
    }

    // === ANALYTICS ===

    async trackAnalyticsEvent(eventType, eventData = {}) {
        if (!this.initialized || !this.currentUser) return;

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

    async syncLocalAnalytics() {
        if (!window.analyticsManager || !this.currentUser) return;

        try {
            const analyticsData = window.analyticsManager.getAnalyticsData();
            const events = analyticsData.events || [];
            
            // Filtrer les événements non synchronisés
            const unsyncedEvents = events.filter(event => !event.synced);
            
            if (unsyncedEvents.length === 0) return;

            console.log(`[LicenseService] Syncing ${unsyncedEvents.length} analytics events...`);

            // Préparer les événements pour l'insertion
            const eventsToInsert = unsyncedEvents.map(event => ({
                user_id: this.currentUser.id,
                user_email: event.userEmail || this.currentUser.email,
                user_name: this.currentUser.name,
                user_domain: this.currentUser.company?.domain || this.currentUser.email.split('@')[1],
                company_id: this.currentUser.company_id,
                session_id: event.sessionId,
                event_type: event.type,
                event_data: event.data,
                created_at: event.timestamp
            }));

            // Insérer par batch
            const batchSize = 50;
            for (let i = 0; i < eventsToInsert.length; i += batchSize) {
                const batch = eventsToInsert.slice(i, i + batchSize);
                
                const { error } = await this.supabase
                    .from('analytics_events')
                    .insert(batch);

                if (error) {
                    console.error('[LicenseService] Sync batch error:', error);
                } else {
                    // Marquer comme synchronisés
                    const syncedIndices = unsyncedEvents
                        .slice(i, i + batchSize)
                        .map(e => events.indexOf(e));
                    
                    syncedIndices.forEach(index => {
                        if (events[index]) {
                            events[index].synced = true;
                        }
                    });
                }
            }

            // Sauvegarder l'état mis à jour
            if (window.analyticsManager.saveAnalytics) {
                window.analyticsManager.saveAnalytics();
            }

            console.log('[LicenseService] ✅ Analytics sync completed');
            
        } catch (error) {
            console.error('[LicenseService] Sync analytics error:', error);
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
        if (this.currentUser) {
            await this.trackAnalyticsEvent('user_logout', {
                email: this.currentUser.email,
                timestamp: new Date().toISOString()
            });
        }

        this.currentUser = null;
        
        if (this.supabase) {
            await this.supabase.auth.signOut();
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
        console.group('[LicenseService] Debug Info');
        console.log('Initialized:', this.initialized);
        console.log('Current User:', this.currentUser);
        console.log('Has Supabase:', !!this.supabase);
        console.log('Config:', this.config ? 'Loaded' : 'Not loaded');
        
        if (this.currentUser) {
            const licenseStatus = this.evaluateLicenseStatus(this.currentUser);
            console.log('License Status:', licenseStatus);
        }
        
        // Test de connexion
        if (this.supabase) {
            const connectionTest = await this.testConnection();
            console.log('Connection Test:', connectionTest);
        }
        
        console.groupEnd();
        
        return {
            initialized: this.initialized,
            hasSupabase: !!this.supabase,
            hasConfig: !!this.config,
            currentUser: this.currentUser,
            isAdmin: this.isAdmin()
        };
    }
}

// Créer une instance globale
window.licenseService = new LicenseService();

// Exposer pour debug
window.debugLicense = () => window.licenseService.debug();

console.log('[LicenseService] ✅ Service loaded and ready v2.0');
