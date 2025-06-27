// Service de gestion des licences pour intégration avec le code existant
class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
    }

    // Initialiser le service
    async initialize() {
        if (this.initialized) return true;

        try {
            // Attendre que Supabase soit initialisé
            if (!window.supabaseClient) {
                // Tenter d'initialiser Supabase
                const initialized = await initializeSupabase();
                if (!initialized) {
                    console.error('[LicenseService] Impossible d\'initialiser Supabase');
                    return false;
                }
            }

            this.supabase = window.supabaseClient;
            
            // Vérifier l'authentification
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                console.error('[LicenseService] Aucun utilisateur connecté');
                return false;
            }

            // Récupérer les données utilisateur
            const { data: userData, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    companies (
                        id,
                        name,
                        domain
                    ),
                    licenses (
                        type,
                        status,
                        expires_at
                    )
                `)
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('[LicenseService] Erreur lors de la récupération des données:', error);
                return false;
            }

            this.currentUser = userData;
            this.initialized = true;

            // Mettre à jour last_login_at
            await this.supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', userData.id);

            console.log('[LicenseService] Service initialisé avec succès');
            return true;

        } catch (error) {
            console.error('[LicenseService] Erreur d\'initialisation:', error);
            return false;
        }
    }

    // Vérifier si l'utilisateur a accès
    async checkAccess() {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.currentUser) {
            return { hasAccess: false, reason: 'not_authenticated' };
        }

        const licenseStatus = this.currentUser.license_status;
        const expiresAt = new Date(this.currentUser.license_expires_at);
        const now = new Date();

        // Vérifier l'expiration
        if (expiresAt < now && licenseStatus !== 'blocked') {
            await this.supabase
                .from('users')
                .update({ license_status: 'expired' })
                .eq('id', this.currentUser.id);
            
            return { hasAccess: false, reason: 'expired' };
        }

        // Vérifier le statut
        if (licenseStatus === 'blocked') {
            return { hasAccess: false, reason: 'blocked' };
        }

        if (licenseStatus === 'expired') {
            return { hasAccess: false, reason: 'expired' };
        }

        return { hasAccess: true, licenseStatus };
    }

    // Obtenir les données analytics selon le rôle
    async getAnalyticsData() {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.currentUser) {
            throw new Error('Utilisateur non authentifié');
        }

        const role = this.currentUser.role;
        const companyId = this.currentUser.company_id;
        const userId = this.currentUser.id;

        let analyticsData = {
            companies: [],
            users: [],
            licenses: [],
            events: [],
            stats: {}
        };

        try {
            if (role === 'super_admin') {
                // Super admin : accès à tout
                const [companies, users, licenses, events] = await Promise.all([
                    this.supabase.from('companies').select('*').order('created_at', { ascending: false }),
                    this.supabase.from('users').select('*, companies(name)').order('created_at', { ascending: false }),
                    this.supabase.from('licenses').select('*, companies(name), users(email, name)').order('created_at', { ascending: false }),
                    this.supabase.from('analytics_events').select('*, users(email, name)').order('created_at', { ascending: false }).limit(1000)
                ]);

                analyticsData.companies = companies.data || [];
                analyticsData.users = users.data || [];
                analyticsData.licenses = licenses.data || [];
                analyticsData.events = events.data || [];

            } else if (role === 'admin') {
                // Admin : accès aux données de sa société
                const [users, licenses] = await Promise.all([
                    this.supabase.from('users').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
                    this.supabase.from('licenses').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
                ]);

                analyticsData.users = users.data || [];
                analyticsData.licenses = licenses.data || [];

                // Événements des utilisateurs de la société
                const userIds = (users.data || []).map(u => u.id);
                if (userIds.length > 0) {
                    const { data: events } = await this.supabase
                        .from('analytics_events')
                        .select('*')
                        .in('user_id', userIds)
                        .order('created_at', { ascending: false })
                        .limit(500);
                    
                    analyticsData.events = events || [];
                }

            } else {
                // Utilisateur : accès à ses propres données
                const { data: events } = await this.supabase
                    .from('analytics_events')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(100);
                
                analyticsData.events = events || [];
            }

            // Calculer les statistiques
            analyticsData.stats = this.calculateStats(analyticsData);

            return analyticsData;

        } catch (error) {
            console.error('[LicenseService] Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Calculer les statistiques
    calculateStats(data) {
        const now = new Date();
        const today = now.toDateString();

        return {
            totalCompanies: data.companies.length,
            totalUsers: data.users.length,
            activeUsers: data.users.filter(u => 
                u.license_status === 'active' || u.license_status === 'trial'
            ).length,
            totalLicenses: data.licenses.length,
            activeLicenses: data.licenses.filter(l => 
                l.status === 'active' && new Date(l.expires_at) > now
            ).length,
            totalEvents: data.events.length,
            eventsToday: data.events.filter(e => 
                new Date(e.created_at).toDateString() === today
            ).length
        };
    }

    // Enregistrer un événement
    async trackEvent(eventType, eventData = {}) {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('analytics_events')
                .insert({
                    user_id: this.currentUser.id,
                    event_type: eventType,
                    event_data: eventData
                });
        } catch (error) {
            console.error('[LicenseService] Erreur lors de l\'enregistrement de l\'événement:', error);
        }
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Se déconnecter
    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.initialized = false;
            window.location.href = '/login.html';
        } catch (error) {
            console.error('[LicenseService] Erreur lors de la déconnexion:', error);
        }
    }
}

// Créer une instance globale
window.licenseService = new LicenseService();

// Pour la compatibilité avec votre code existant
window.analyticsManager = {
    getAnalyticsData: async function() {
        return await window.licenseService.getAnalyticsData();
    },
    trackEvent: async function(eventType, eventData) {
        return await window.licenseService.trackEvent(eventType, eventData);
    }
};
