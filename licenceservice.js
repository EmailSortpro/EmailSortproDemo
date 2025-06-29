// LicenseService.js - Service de gestion des licences avec authentification email

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.licenseCache = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Vérifier la configuration
            if (!window.supabaseConfig) {
                throw new Error('Configuration Supabase manquante');
            }

            const config = window.supabaseConfig.getConfig();
            if (!config) {
                throw new Error('Configuration Supabase invalide');
            }

            // Charger Supabase client
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseClient();
            }

            // Initialiser le client
            this.supabase = window.supabase.createClient(config.url, config.anonKey, config.auth);
            this.initialized = true;

            console.log('[LicenseService] ✅ Initialisé');
            
            // Tester la connexion
            const { data, error } = await this.supabase.auth.getSession();
            if (!error) {
                console.log('[LicenseService] Session existante:', !!data.session);
            }
            
            return true;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur initialisation:', error);
            return false;
        }
    }

    async loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Impossible de charger Supabase'));
            document.head.appendChild(script);
        });
    }

    // Authentification directe avec email (sans mot de passe pour le moment)
    async authenticateWithEmail(email) {
        if (!this.initialized) await this.initialize();
        if (!this.supabase) return { valid: false, error: 'Service non initialisé' };

        try {
            // Pour l'instant, on simule une authentification en créant/récupérant l'utilisateur
            // Dans un cas réel, vous devriez utiliser Magic Link ou OTP
            const userResult = await this.checkUserLicense(email);
            
            if (userResult.valid && userResult.user) {
                // Stocker l'email comme authentification temporaire
                localStorage.setItem('emailsortpro_user_email', email);
                
                // Tracker l'événement de connexion dans analytics_events
                await this.trackAnalyticsEvent('user_login', {
                    email: email,
                    timestamp: new Date().toISOString(),
                    source: 'email_auth'
                });
            }
            
            return userResult;
        } catch (error) {
            console.error('[LicenseService] Erreur authentification:', error);
            return {
                valid: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    // Vérifier la licence d'un utilisateur
    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        if (!this.supabase) return { valid: false, error: 'Service non initialisé' };

        try {
            // Vérifier d'abord dans le cache
            if (this.licenseCache && this.licenseCache.email === email) {
                const cacheAge = Date.now() - this.licenseCache.timestamp;
                if (cacheAge < 5 * 60 * 1000) { // Cache de 5 minutes
                    return this.licenseCache.result;
                }
            }

            // Nettoyer l'email
            const cleanEmail = email.toLowerCase().trim();

            // Rechercher l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `)
                .eq('email', cleanEmail)
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas, le créer
                user = await this.createNewUser(cleanEmail);
            } else if (error) {
                throw error;
            }

            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);

            // Vérifier le statut de la licence
            const licenseStatus = this.evaluateLicenseStatus(user);

            // Récupérer les licences associées
            const { data: licenses } = await this.supabase
                .from('licenses')
                .select('*')
                .or(`company_id.eq.${user.company_id},user_id.eq.${user.id}`)
                .eq('status', 'active');

            // Mettre en cache
            this.licenseCache = {
                email: cleanEmail,
                timestamp: Date.now(),
                result: {
                    valid: licenseStatus.valid,
                    status: licenseStatus.status,
                    user: user,
                    licenses: licenses || [],
                    message: licenseStatus.message,
                    daysRemaining: licenseStatus.daysRemaining
                }
            };

            this.currentUser = user;
            
            // Lier aux analytics
            if (window.analyticsManager) {
                window.analyticsManager.onAuthSuccess('supabase', {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.email.split('@')[0],
                    displayName: user.name,
                    mail: user.email,
                    userPrincipalName: user.email
                });
            }
            
            return this.licenseCache.result;

        } catch (error) {
            console.error('[LicenseService] Erreur vérification licence:', error);
            return {
                valid: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    // Créer un nouvel utilisateur
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
            role: isPersonalEmail ? 'admin' : 'user',
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

    // Créer une société pour un particulier
    async createPersonalCompany(email) {
        const companyName = `Personnel - ${email}`;
        
        const { data: company, error } = await this.supabase
            .from('companies')
            .insert([{
                name: companyName,
                domain: email, // Utiliser l'email comme domaine unique
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

    // Créer une licence trial
    async createTrialLicense(userId, companyId) {
        const { error } = await this.supabase
            .from('licenses')
            .insert([{
                company_id: companyId,
                user_id: userId,
                type: 'trial',
                seats: 1,
                used_seats: 1,
                status: 'active',
                price: 0,
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('[LicenseService] Erreur création licence trial:', error);
        }
    }

    // Évaluer le statut de la licence
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

    // Mettre à jour la dernière connexion
    async updateLastLogin(userId) {
        try {
            await this.supabase
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.warn('[LicenseService] Erreur mise à jour login:', error);
        }
    }

    // Vérifier si c'est un domaine email personnel
    isPersonalEmailDomain(domain) {
        const personalDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
            'live.com', 'aol.com', 'icloud.com', 'mail.com',
            'protonmail.com', 'yandex.com', 'zoho.com', 'gmx.com',
            'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net'
        ];
        
        return personalDomains.includes(domain.toLowerCase());
    }

    // Obtenir les infos utilisateur actuelles
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est admin
    isAdmin() {
        return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
    }

    // Vérifier si l'utilisateur est super admin
    isSuperAdmin() {
        return this.currentUser?.role === 'super_admin';
    }

    // Invalider le cache
    invalidateCache() {
        this.licenseCache = null;
    }

    // === TRACKING ANALYTICS ===
    
    async trackAnalyticsEvent(eventType, eventData = {}) {
        if (!this.currentUser || !this.supabase) return;

        try {
            await this.supabase
                .from('analytics_events')
                .insert([{
                    user_id: this.currentUser.id,
                    event_type: eventType,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                }]);
        } catch (error) {
            console.warn('[LicenseService] Erreur tracking analytics:', error);
        }
    }

    // === MÉTHODES ADMIN ===

    // Obtenir tous les utilisateurs de la société
    async getCompanyUsers() {
        if (!this.currentUser?.company_id) return [];
        if (!this.isAdmin()) return [];

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('company_id', this.currentUser.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération utilisateurs:', error);
            return [];
        }
    }

    // Récupérer tous les événements analytics pour l'utilisateur
    async getUserAnalytics(userId = null) {
        try {
            const targetUserId = userId || this.currentUser?.id;
            if (!targetUserId) return [];

            const { data, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération analytics:', error);
            return [];
        }
    }

    // Mettre à jour le statut d'un utilisateur
    async updateUserLicense(userId, status, expiresAt = null) {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            const updateData = {
                license_status: status,
                updated_at: new Date().toISOString()
            };

            if (expiresAt) {
                updateData.license_expires_at = expiresAt;
            }

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .eq('company_id', this.currentUser.company_id); // Sécurité: même société

            if (error) throw error;

            // Invalider le cache
            this.invalidateCache();

            // Tracker l'événement
            await this.trackAnalyticsEvent('license_updated', {
                target_user_id: userId,
                new_status: status,
                updated_by: this.currentUser.email
            });

            return { success: true };
        } catch (error) {
            console.error('[LicenseService] Erreur mise à jour licence:', error);
            return { success: false, error: error.message };
        }
    }

    // Ajouter un utilisateur à la société
    async addUserToCompany(email) {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            // Vérifier si l'utilisateur existe
            let { data: existingUser } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (existingUser && existingUser.company_id) {
                throw new Error('Cet utilisateur appartient déjà à une société');
            }

            if (existingUser) {
                // Mettre à jour l'utilisateur existant
                const { error } = await this.supabase
                    .from('users')
                    .update({
                        company_id: this.currentUser.company_id,
                        license_status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id);

                if (error) throw error;
            } else {
                // Créer un nouvel utilisateur
                const { error } = await this.supabase
                    .from('users')
                    .insert([{
                        email: email.toLowerCase(),
                        name: email.split('@')[0],
                        company_id: this.currentUser.company_id,
                        role: 'user',
                        license_status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (error) throw error;
            }

            // Tracker l'événement
            await this.trackAnalyticsEvent('user_added_to_company', {
                added_email: email,
                added_by: this.currentUser.email
            });

            return { success: true };
        } catch (error) {
            console.error('[LicenseService] Erreur ajout utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    // === CONNEXION AVEC ANALYTICS EXISTANT ===
    
    // Synchroniser les événements du système analytics local avec la base
    async syncLocalAnalytics() {
        if (!this.currentUser || !window.analyticsManager) return;

        try {
            const analyticsData = window.analyticsManager.getAnalyticsData();
            const events = analyticsData.events || [];
            
            // Filtrer les événements récents non synchronisés
            const lastSyncKey = 'emailsortpro_last_analytics_sync';
            const lastSync = localStorage.getItem(lastSyncKey);
            const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
            
            const eventsToSync = events.filter(event => {
                const eventDate = new Date(event.timestamp);
                return eventDate > lastSyncDate;
            });

            if (eventsToSync.length > 0) {
                console.log(`[LicenseService] Synchronisation de ${eventsToSync.length} événements analytics`);
                
                // Préparer les événements pour l'insertion
                const analyticsEvents = eventsToSync.map(event => ({
                    user_id: this.currentUser.id,
                    event_type: event.type,
                    event_data: {
                        ...event.data,
                        local_timestamp: event.timestamp,
                        session_id: event.sessionId
                    },
                    created_at: event.timestamp
                }));

                // Insérer par batch de 100
                for (let i = 0; i < analyticsEvents.length; i += 100) {
                    const batch = analyticsEvents.slice(i, i + 100);
                    const { error } = await this.supabase
                        .from('analytics_events')
                        .insert(batch);
                    
                    if (error) {
                        console.error('[LicenseService] Erreur sync batch:', error);
                    }
                }

                // Mettre à jour la date de dernière synchronisation
                localStorage.setItem(lastSyncKey, new Date().toISOString());
            }
        } catch (error) {
            console.error('[LicenseService] Erreur synchronisation analytics:', error);
        }
    }

    // Déconnecter l'utilisateur
    async logout() {
        try {
            // Tracker l'événement de déconnexion
            if (this.currentUser) {
                await this.trackAnalyticsEvent('user_logout', {
                    email: this.currentUser.email
                });
            }

            // Nettoyer les données locales
            this.currentUser = null;
            this.licenseCache = null;
            localStorage.removeItem('emailsortpro_user_email');
            
            // Si on a une session Supabase, la fermer
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }

            console.log('[LicenseService] Déconnexion réussie');
        } catch (error) {
            console.error('[LicenseService] Erreur déconnexion:', error);
        }
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('✅ LicenseService chargé avec support base de données');
