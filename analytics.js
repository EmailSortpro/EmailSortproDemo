// Gestion des analytics et des données
class AnalyticsManager {
    constructor() {
        this.companies = [];
        this.users = [];
        this.licenses = [];
        this.analyticsEvents = [];
    }

    // Charger toutes les données (selon le rôle)
    async loadData() {
        const userRole = authManager.getUserRole();
        
        try {
            if (userRole === USER_ROLES.SUPER_ADMIN) {
                // Super admin : accès à toutes les données
                await this.loadAllCompanies();
                await this.loadAllUsers();
                await this.loadAllLicenses();
                await this.loadAllAnalytics();
            } else if (userRole === USER_ROLES.ADMIN) {
                // Admin : accès aux données de sa société uniquement
                const companyId = authManager.currentUser.company_id;
                await this.loadCompanyData(companyId);
            } else {
                // Utilisateur normal : accès à ses propres données uniquement
                await this.loadUserData(authManager.currentUser.id);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    // Charger toutes les sociétés
    async loadAllCompanies() {
        const { data, error } = await supabaseClient
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        this.companies = data;
    }

    // Charger tous les utilisateurs
    async loadAllUsers() {
        const { data, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                companies (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        this.users = data;
    }

    // Charger toutes les licences
    async loadAllLicenses() {
        const { data, error } = await supabaseClient
            .from('licenses')
            .select(`
                *,
                companies (name),
                users (email, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        this.licenses = data;
    }

    // Charger tous les événements analytics
    async loadAllAnalytics() {
        const { data, error } = await supabaseClient
            .from('analytics_events')
            .select(`
                *,
                users (email, name)
            `)
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;
        this.analyticsEvents = data;
    }

    // Charger les données d'une société spécifique
    async loadCompanyData(companyId) {
        // Utilisateurs de la société
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;
        this.users = users;

        // Licences de la société
        const { data: licenses, error: licensesError } = await supabaseClient
            .from('licenses')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (licensesError) throw licensesError;
        this.licenses = licenses;

        // Événements analytics des utilisateurs de la société
        const userIds = users.map(u => u.id);
        if (userIds.length > 0) {
            const { data: events, error: eventsError } = await supabaseClient
                .from('analytics_events')
                .select('*')
                .in('user_id', userIds)
                .order('created_at', { ascending: false })
                .limit(500);

            if (eventsError) throw eventsError;
            this.analyticsEvents = events;
        }
    }

    // Charger les données d'un utilisateur spécifique
    async loadUserData(userId) {
        const { data: events, error } = await supabaseClient
            .from('analytics_events')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        this.analyticsEvents = events;
    }

    // Obtenir les statistiques globales
    getGlobalStats() {
        const now = new Date();
        
        return {
            totalCompanies: this.companies.length,
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => 
                u.license_status === LICENSE_STATUS.ACTIVE || 
                u.license_status === LICENSE_STATUS.TRIAL
            ).length,
            totalLicenses: this.licenses.length,
            activeLicenses: this.licenses.filter(l => 
                l.status === 'active' && 
                new Date(l.expires_at) > now
            ).length,
            totalEvents: this.analyticsEvents.length,
            eventsToday: this.analyticsEvents.filter(e => {
                const eventDate = new Date(e.created_at);
                return eventDate.toDateString() === now.toDateString();
            }).length
        };
    }

    // Obtenir les statistiques par société
    getCompanyStats(companyId) {
        const companyUsers = this.users.filter(u => u.company_id === companyId);
        const companyLicenses = this.licenses.filter(l => l.company_id === companyId);
        const userIds = companyUsers.map(u => u.id);
        const companyEvents = this.analyticsEvents.filter(e => userIds.includes(e.user_id));

        return {
            totalUsers: companyUsers.length,
            activeUsers: companyUsers.filter(u => 
                u.license_status === LICENSE_STATUS.ACTIVE || 
                u.license_status === LICENSE_STATUS.TRIAL
            ).length,
            licenses: companyLicenses,
            totalEvents: companyEvents.length
        };
    }

    // Enregistrer un événement analytics
    async trackEvent(eventType, eventData = {}) {
        if (!authManager.currentUser) return;

        try {
            const { error } = await supabaseClient
                .from('analytics_events')
                .insert({
                    user_id: authManager.currentUser.id,
                    event_type: eventType,
                    event_data: eventData
                });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'événement:', error);
        }
    }
}

// Instance globale
window.analyticsManager = new AnalyticsManager();
