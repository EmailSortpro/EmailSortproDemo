// LicenseService.js - Service de gestion des licences avec Supabase
// Version complète avec authentification et analytics

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        console.log('[LicenseService] Initializing...');
    }

    async initialize() {
        try {
            // Attendre que la configuration Supabase soit prête
            if (!window.supabaseConfig) {
                console.log('[LicenseService] Waiting for Supabase config...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const config = window.supabaseConfig.getConfig();
            
            // Créer le client Supabase
            this.supabase = window.supabase.createClient(
                config.url,
                config.anonKey,
                config.auth
            );

            this.initialized = true;
            console.log('[LicenseService] ✅ Initialized successfully');
            return true;
            
        } catch (error) {
            console.error('[LicenseService] ❌ Initialization failed:', error);
            return false;
        }
    }

    // === AUTHENTIFICATION ===
    
    async authenticateWithEmail(email) {
        if (!this.initialized) await this.initialize();
        
        try {
            const cleanEmail = email.toLowerCase().trim();
            
            // Récupérer ou créer l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `)
                .eq('email', cleanEmail)
                .single();

            if (error || !user) {
                // Créer un nouvel utilisateur
                user = await this.createNewUser(cleanEmail);
            }

            // Mettre à jour last_login
            await this.supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', user.id);

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
                timestamp: new Date().toISOString()
            });

            return {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: user,
                licenses: licenses || [],
                message: licenseStatus.message,
                daysRemaining: licenseStatus.daysRemaining
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

        const newUser = {
            email: email.toLowerCase(),
            name: name,
            company_id: companyId,
            role: isPersonalEmail ? 'company_admin' : 'user',
            license_status: 'trial',
            license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

        // Créer une licence trial si société créée
        if (companyId && isPersonalEmail) {
            await this.createTrialLicense(data.id, companyId);
        }

        return data;
    }

    async createPersonalCompany(email) {
        const companyName = `Personnel - ${email}`;
        
        const { data: company, error } = await this.supabase
            .from('companies')
            .insert([{
                name: companyName,
                domain: email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('[LicenseService] Erreur création société:', error);
            throw error;
        }

        return company;
    }

    async createTrialLicense(userId, companyId) {
        const { data, error } = await this.supabase
            .from('licenses')
            .insert([{
                company_id: companyId,
                user_id: userId,
                type: 'trial',
                status: 'active',
                max_users: 1,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('[LicenseService] Erreur création licence trial:', error);
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

    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        
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
                    // Marquer comme synchronisés dans le localStorage
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

    async getUserAnalytics(days = 30) {
        if (!this.currentUser) return null;

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculer les statistiques
            const stats = {
                totalEvents: events.length,
                emailsScanned: 0,
                sessions: new Set(),
                lastActivity: null,
                eventTypes: {}
            };

            events.forEach(event => {
                if (event.session_id) {
                    stats.sessions.add(event.session_id);
                }
                
                if (event.event_type === 'email_scan' && event.event_data?.emailCount) {
                    stats.emailsScanned += event.event_data.emailCount;
                }
                
                if (!stats.eventTypes[event.event_type]) {
                    stats.eventTypes[event.event_type] = 0;
                }
                stats.eventTypes[event.event_type]++;
                
                if (!stats.lastActivity || new Date(event.created_at) > new Date(stats.lastActivity)) {
                    stats.lastActivity = event.created_at;
                }
            });

            return {
                events: events,
                stats: {
                    ...stats,
                    totalSessions: stats.sessions.size
                }
            };
            
        } catch (error) {
            console.error('[LicenseService] Get analytics error:', error);
            return null;
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
        this.currentUser = null;
        
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        
        localStorage.removeItem('emailsortpro_user_email');
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
        
        if (this.currentUser) {
            const licenseStatus = this.evaluateLicenseStatus(this.currentUser);
            console.log('License Status:', licenseStatus);
            
            const analytics = await this.getUserAnalytics(7);
            console.log('Recent Analytics:', analytics);
        }
        
        console.groupEnd();
        
        return {
            initialized: this.initialized,
            hasSupabase: !!this.supabase,
            currentUser: this.currentUser,
            isAdmin: this.isAdmin()
        };
    }
}

// Créer une instance globale
window.licenseService = new LicenseService();

console.log('[LicenseService] ✅ Service loaded and ready');
