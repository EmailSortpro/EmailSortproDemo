// Gestion des analytics et des données
class AnalyticsManager {
    constructor() {
        this.companies = [];
        this.users = [];
        this.licenses = [];
        this.analyticsEvents = [];
        this.testMode = true; // Mode test activé
    }

    // Charger toutes les données (selon le rôle)
    async loadData() {
        // En mode test, charger des données fictives
        if (this.testMode || !window.supabaseClient) {
            console.log('[Analytics] 🧪 Mode test - Chargement de données fictives');
            this.loadTestData();
            return;
        }
        
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
            // En cas d'erreur, charger les données de test
            this.loadTestData();
        }
    }

    // Charger des données de test
    loadTestData() {
        // Sociétés fictives
        this.companies = [
            { id: '1', name: 'Entreprise Alpha', domain: 'alpha.com', created_at: '2024-01-15' },
            { id: '2', name: 'Société Beta', domain: 'beta.fr', created_at: '2024-02-20' },
            { id: '3', name: 'Groupe Gamma', domain: 'gamma.io', created_at: '2024-03-10' }
        ];

        // Utilisateurs fictifs
        this.users = [
            { 
                id: '1', 
                email: 'admin@alpha.com', 
                name: 'Jean Admin', 
                company_id: '1',
                companies: { name: 'Entreprise Alpha' },
                role: 'admin',
                license_status: 'active',
                license_expires_at: '2025-12-31',
                last_login_at: new Date().toISOString()
            },
            { 
                id: '2', 
                email: 'user@beta.fr', 
                name: 'Marie User', 
                company_id: '2',
                companies: { name: 'Société Beta' },
                role: 'user',
                license_status: 'trial',
                license_expires_at: '2025-07-15',
                last_login_at: '2025-06-25'
            },
            { 
                id: '3', 
                email: 'test@gamma.io', 
                name: 'Pierre Test', 
                company_id: '3',
                companies: { name: 'Groupe Gamma' },
                role: 'user',
                license_status: 'expired',
                license_expires_at: '2025-05-01',
                last_login_at: '2025-06-20'
            }
        ];

        // Licences fictives
        this.licenses = [
            {
                id: '1',
                company_id: '1',
                companies: { name: 'Entreprise Alpha' },
                type: 'premium',
                seats: 50,
                used_seats: 32,
                price: 4999.99,
                status: 'active',
                expires_at: '2025-12-31'
            },
            {
                id: '2',
                company_id: '2',
                companies: { name: 'Société Beta' },
                type: 'standard',
                seats: 20,
                used_seats: 15,
                price: 1999.99,
                status: 'active',
                expires_at: '2025-07-15'
            }
        ];

        // Événements analytics fictifs
        const eventTypes = ['page_view', 'feature_use', 'export_data', 'user_login', 'report_generated'];
        const now = new Date();
        
        this.analyticsEvents = [];
        for (let i = 0; i < 100; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const eventDate = new Date(now);
            eventDate.setDate(eventDate.getDate() - daysAgo);
            
            this.analyticsEvents.push({
                id: `event-${i}`,
                user_id: this.users[Math.floor(Math.random() * this.users.length)].id,
                users: this.users[Math.floor(Math.random() * this.users.length)],
                event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                event_data: { test: true, value: Math.random() * 100 },
                created_at: eventDate.toISOString()
            });
        }

        // Trier par date décroissante
        this.analyticsEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
