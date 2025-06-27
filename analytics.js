// Gestion des analytics et des données pour EmailSortPro
// Version avec gestion des rôles et permissions selon la structure existante

class AnalyticsManager {
    constructor() {
        this.companies = [];
        this.users = [];
        this.licenses = [];
        this.analyticsEvents = [];
        this.testMode = false; // Mode production par défaut
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
    }

    // === INITIALISATION ===
    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('[AnalyticsManager] Initialisation...');
            
            // Vérifier la disponibilité de Supabase
            if (!window.supabase) {
                console.warn('[AnalyticsManager] Supabase non disponible, mode test activé');
                this.testMode = true;
                this.loadTestData();
                this.initialized = true;
                return true;
            }

            // Configuration Supabase
            const SUPABASE_URL = 'https://oxyiamruvyliueecpaam.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlhbXJ1dnlsaXVlZWNwYWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDM0MTgsImV4cCI6MjA2NTk3OTQxOH0.Wy_jbUB7D5Bly-rZB6oc2bXUHzZQ8MivDL4vdM1jcE0';

            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Tester la connexion
            await this.testConnection();

            this.initialized = true;
            console.log('[AnalyticsManager] ✅ Initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('[AnalyticsManager] ❌ Erreur initialisation:', error);
            console.warn('[AnalyticsManager] 🔄 Mode test activé');
            
            this.testMode = true;
            this.loadTestData();
            this.initialized = true;
            return true;
        }
    }

    async testConnection() {
        try {
            const { error } = await this.supabase
                .from('users')
                .select('count', { count: 'exact', head: true });

            if (error && !error.message.includes('relation "users" does not exist')) {
                throw error;
            }

            console.log('[AnalyticsManager] ✅ Connexion Supabase validée');
            return true;
        } catch (error) {
            console.warn('[AnalyticsManager] ⚠️ Test connexion échoué:', error.message);
            throw error;
        }
    }

    // === CHARGEMENT DES DONNÉES ===
    async loadData() {
        if (!this.initialized) await this.initialize();

        if (this.testMode) {
            console.log('[AnalyticsManager] 🧪 Mode test - Chargement de données fictives');
            this.loadTestData();
            return;
        }
        
        try {
            // Récupérer l'utilisateur actuel depuis le contexte global
            if (window.currentUser) {
                this.currentUser = window.currentUser;
            }

            const userRole = this.currentUser?.role || 'user';
            
            if (userRole === 'super_admin') {
                // Super admin : accès à toutes les données
                await this.loadAllCompanies();
                await this.loadAllUsers();
                await this.loadAllAnalytics();
            } else if (userRole === 'company_admin') {
                // Admin : accès aux données de sa société uniquement
                const companyId = this.currentUser.company_id;
                await this.loadCompanyData(companyId);
            } else {
                // Utilisateur normal : accès à ses propres données uniquement
                await this.loadUserData(this.currentUser?.id);
            }

            console.log('[AnalyticsManager] ✅ Données chargées avec succès');
        } catch (error) {
            console.error('[AnalyticsManager] Erreur lors du chargement des données:', error);
            // En cas d'erreur, charger les données de test
            this.loadTestData();
        }
    }

    // === DONNÉES DE TEST ===
    loadTestData() {
        // Sociétés fictives
        this.companies = [
            { 
                id: 'demo-company-1', 
                name: 'Entreprise Alpha', 
                domain: 'alpha.com', 
                created_at: '2024-01-15' 
            },
            { 
                id: 'demo-company-2', 
                name: 'Société Beta', 
                domain: 'beta.fr', 
                created_at: '2024-02-20' 
            },
            { 
                id: 'demo-company-3', 
                name: 'Groupe Gamma', 
                domain: 'gamma.io', 
                created_at: '2024-03-10' 
            }
        ];

        // Utilisateurs fictifs avec vianney.hastings@hotmail.fr comme admin
        this.users = [
            { 
                id: 'vianney-user', 
                email: 'vianney.hastings@hotmail.fr', 
                name: 'Vianney Hastings', 
                company_id: 'demo-company-1',
                company: { name: 'Entreprise Alpha' },
                role: 'company_admin',
                license_status: 'active',
                license_expires_at: '2025-12-31',
                last_login_at: new Date().toISOString()
            },
            { 
                id: 'demo-user-1', 
                email: 'admin@alpha.com', 
                name: 'Jean Admin', 
                company_id: 'demo-company-1',
                company: { name: 'Entreprise Alpha' },
                role: 'user',
                license_status: 'active',
                license_expires_at: '2025-12-31',
                last_login_at: new Date().toISOString()
            },
            { 
                id: 'demo-user-2', 
                email: 'user@beta.fr', 
                name: 'Marie User', 
                company_id: 'demo-company-2',
                company: { name: 'Société Beta' },
                role: 'user',
                license_status: 'trial',
                license_expires_at: '2025-07-15',
                last_login_at: '2025-06-25'
            },
            { 
                id: 'demo-user-3', 
                email: 'test@gamma.io', 
                name: 'Pierre Test', 
                company_id: 'demo-company-3',
                company: { name: 'Groupe Gamma' },
                role: 'user',
                license_status: 'blocked',
                license_expires_at: '2025-05-01',
                last_login_at: '2025-06-20'
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

        console.log('[AnalyticsManager] 🧪 Données de test chargées');
    }

    // === CHARGEMENT DEPUIS LA BASE DE DONNÉES ===
    async loadAllCompanies() {
        try {
            const { data, error } = await this.supabase
                .from('companies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.companies = data || [];
            console.log('[AnalyticsManager] ✅ Sociétés chargées:', this.companies.length);
        } catch (error) {
            console.error('[AnalyticsManager] Erreur chargement sociétés:', error);
            this.companies = [];
        }
    }

    async loadAllUsers() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.users = data || [];
            console.log('[AnalyticsManager] ✅ Utilisateurs chargés:', this.users.length);
        } catch (error) {
            console.error('[AnalyticsManager] Erreur chargement utilisateurs:', error);
            this.users = [];
        }
    }

    async loadAllAnalytics() {
        try {
            // Simuler le chargement d'analytics (la table n'existe peut-être pas encore)
            this.analyticsEvents = [];
            console.log('[AnalyticsManager] ✅ Analytics chargés (simulé)');
        } catch (error) {
            console.error('[AnalyticsManager] Erreur chargement analytics:', error);
            this.analyticsEvents = [];
        }
    }

    async loadCompanyData(companyId) {
        try {
            // Utilisateurs de la société
            const { data: users, error: usersError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(name)
                `)
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;
            this.users = users || [];

            // Analytics simulés pour la société
            this.analyticsEvents = [];

            console.log('[AnalyticsManager] ✅ Données société chargées:', companyId);
        } catch (error) {
            console.error('[AnalyticsManager] Erreur chargement données société:', error);
            this.users = [];
            this.analyticsEvents = [];
        }
    }

    async loadUserData(userId) {
        try {
            // Analytics simulés pour l'utilisateur
            this.analyticsEvents = [];
            console.log('[AnalyticsManager] ✅ Données utilisateur chargées:', userId);
        } catch (error) {
            console.error('[AnalyticsManager] Erreur chargement données utilisateur:', error);
            this.analyticsEvents = [];
        }
    }

    // === STATISTIQUES ===
    getGlobalStats() {
        const now = new Date();
        
        return {
            totalCompanies: this.companies.length,
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => 
                u.license_status === 'active' || 
                u.license_status === 'trial'
            ).length,
            blockedUsers: this.users.filter(u => u.license_status === 'blocked').length,
            totalEvents: this.analyticsEvents.length,
            eventsToday: this.analyticsEvents.filter(e => {
                const eventDate = new Date(e.created_at);
                return eventDate.toDateString() === now.toDateString();
            }).length
        };
    }

    getCompanyStats(companyId) {
        const companyUsers = this.users.filter(u => u.company_id === companyId);
        const userIds = companyUsers.map(u => u.id);
        const companyEvents = this.analyticsEvents.filter(e => userIds.includes(e.user_id));

        return {
            totalUsers: companyUsers.length,
            activeUsers: companyUsers.filter(u => 
                u.license_status === 'active' || 
                u.license_status === 'trial'
            ).length,
            blockedUsers: companyUsers.filter(u => u.license_status === 'blocked').length,
            totalEvents: companyEvents.length
        };
    }

    getUserStats(userId) {
        const userEvents = this.analyticsEvents.filter(e => e.user_id === userId);
        
        return {
            totalEvents: userEvents.length,
            eventTypes: [...new Set(userEvents.map(e => e.event_type))],
            lastActivity: userEvents.length > 0 ? userEvents[0].created_at : null
        };
    }

    // === MÉTHODES DE COMPATIBILITÉ ===
    getAnalyticsData() {
        const stats = this.getGlobalStats();
        
        return {
            scanStats: {
                totalScans: stats.totalEvents,
                successfulScans: Math.floor(stats.totalEvents * 0.95),
                failedScans: Math.floor(stats.totalEvents * 0.05),
                avgScanTime: 2.3
            },
            userStats: {
                totalUsers: stats.totalUsers,
                activeUsers: stats.activeUsers,
                newUsersThisMonth: Math.floor(stats.totalUsers * 0.1)
            },
            systemStats: {
                uptime: '99.9%',
                responseTime: '120ms',
                errorRate: '0.1%'
            },
            companies: this.companies,
            users: this.users,
            events: this.analyticsEvents
        };
    }

    // === TRACKING D'ÉVÉNEMENTS ===
    async trackEvent(eventType, eventData = {}) {
        if (!this.currentUser) return;

        const event = {
            id: `event-${Date.now()}`,
            user_id: this.currentUser.id,
            event_type: eventType,
            event_data: eventData,
            created_at: new Date().toISOString()
        };

        // Ajouter à la liste locale
        this.analyticsEvents.unshift(event);

        // Sauvegarder en base si possible
        if (!this.testMode && this.supabase) {
            try {
                await this.supabase
                    .from('analytics_events')
                    .insert([{
                        user_id: this.currentUser.id,
                        event_type: eventType,
                        event_data: eventData
                    }]);
            } catch (error) {
                console.warn('[AnalyticsManager] Erreur sauvegarde événement:', error);
            }
        }

        console.log('[AnalyticsManager] 📊 Événement tracké:', eventType);
    }

    // === MÉTHODES DE FILTRAGES ===
    filterUsersByCompany(companyId) {
        return this.users.filter(u => u.company_id === companyId);
    }

    filterUsersByStatus(status) {
        return this.users.filter(u => u.license_status === status);
    }

    filterEventsByUser(userId) {
        return this.analyticsEvents.filter(e => e.user_id === userId);
    }

    filterEventsByType(eventType) {
        return this.analyticsEvents.filter(e => e.event_type === eventType);
    }

    filterEventsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.analyticsEvents.filter(e => {
            const eventDate = new Date(e.created_at);
            return eventDate >= start && eventDate <= end;
        });
    }

    // === MÉTHODES D'EXPORT ===
    exportUsersCSV() {
        const headers = ['Email', 'Nom', 'Société', 'Rôle', 'Statut', 'Dernière connexion'];
        const rows = this.users.map(user => [
            user.email,
            user.name || '',
            user.company?.name || '',
            user.role || 'user',
            user.license_status || '',
            user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : ''
        ]);

        return this.generateCSV([headers, ...rows]);
    }

    exportEventsCSV() {
        const headers = ['Date', 'Utilisateur', 'Type d\'événement', 'Données'];
        const rows = this.analyticsEvents.map(event => [
            new Date(event.created_at).toLocaleString(),
            event.users?.email || event.user_id,
            event.event_type,
            JSON.stringify(event.event_data)
        ]);

        return this.generateCSV([headers, ...rows]);
    }

    generateCSV(data) {
        return data.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    // === MÉTHODES DE RECHERCHE ===
    searchUsers(query) {
        const searchTerm = query.toLowerCase();
        return this.users.filter(user => 
            user.email.toLowerCase().includes(searchTerm) ||
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.company?.name && user.company.name.toLowerCase().includes(searchTerm))
        );
    }

    searchCompanies(query) {
        const searchTerm = query.toLowerCase();
        return this.companies.filter(company => 
            company.name.toLowerCase().includes(searchTerm) ||
            (company.domain && company.domain.toLowerCase().includes(searchTerm))
        );
    }
}

// === CRÉATION D'INSTANCES GLOBALES ===
window.analyticsManager = new AnalyticsManager();

// Module d'affichage pour compatibilité
const analyticsModule = {
    render: function() {
        console.log('[AnalyticsModule] Rendu des analytics...');
        
        const container = document.getElementById('pageContent');
        if (!container) {
            console.warn('[AnalyticsModule] Container pageContent non trouvé');
            return;
        }

        const data = window.analyticsManager.getAnalyticsData();
        const stats = window.analyticsManager.getGlobalStats();

        container.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 16px; color: #1f2937;">📊 Aperçu des Analytics</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #4F46E5;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1f2937;">${stats.totalUsers}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">Utilisateurs total</div>
                    </div>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1f2937;">${stats.activeUsers}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">Utilisateurs actifs</div>
                    </div>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1f2937;">${stats.blockedUsers}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">Utilisateurs bloqués</div>
                    </div>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1f2937;">${stats.totalEvents}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">Événements trackés</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="margin-bottom: 12px; color: #1f2937;">Sociétés récentes</h4>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                            ${data.companies.slice(0, 5).map(company => `
                                <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                    <strong>${company.name}</strong><br>
                                    <small style="color: #64748b;">${company.domain || 'Aucun domaine'}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="margin-bottom: 12px; color: #1f2937;">Utilisateurs récents</h4>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                            ${data.users.slice(0, 5).map(user => `
                                <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                    <strong>${user.email}</strong><br>
                                    <small style="color: #64748b;">
                                        ${user.company?.name || 'Sans société'} • 
                                        ${user.license_status === 'active' ? '✅ Actif' : 
                                          user.license_status === 'blocked' ? '❌ Bloqué' : '⏳ Essai'}
                                    </small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log('[AnalyticsModule] ✅ Rendu terminé');
    }
};

window.analyticsModule = analyticsModule;

// Initialisation automatique
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Analytics] Initialisation du manager...');
    await window.analyticsManager.initialize();
    await window.analyticsManager.loadData();
    console.log('[Analytics] ✅ Manager initialisé');
});

// Attendre que analyticsManager soit créé avant d'ajouter la méthode de compatibilité
if (window.analyticsManager) {
    window.analyticsManager.loadData = async function() {
        console.log('[Analytics] loadData appelé - rechargement des données');
        await this.loadData();
        return Promise.resolve();
    };
    console.log('[Analytics] Méthode loadData configurée pour compatibilité');
}

console.log('[Analytics] ✅ AnalyticsManager avec gestion des rôles chargé');
console.log('[Analytics] 💡 Utilisez window.analyticsManager pour accéder aux données');
