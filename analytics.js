// analytics.js - Module Analytics Complet pour EmailSortPro v1.0

class AnalyticsManager {
    constructor() {
        this.storageKey = 'emailsortpro_analytics';
        this.sessionKey = 'emailsortpro_session';
        this.initialized = false;
        this.currentSession = null;
        this.analytics = this.loadAnalytics();
        
        console.log('[Analytics] Manager initialized');
        this.initializeSession();
    }

    // === GESTION DES SESSIONS ===
    initializeSession() {
        const sessionId = this.generateSessionId();
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        const domain = window.location.hostname;
        
        this.currentSession = {
            sessionId: sessionId,
            startTime: timestamp,
            domain: domain,
            userAgent: userAgent,
            actions: [],
            errors: [],
            emailStats: null,
            authProvider: null,
            userInfo: null
        };

        // Sauvegarder la session courante
        sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        
        // Enregistrer le démarrage de session
        this.trackEvent('session_start', {
            domain: domain,
            userAgent: userAgent.substring(0, 100),
            timestamp: timestamp
        });

        console.log('[Analytics] Session initialized:', sessionId);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // === TRACKING DES ÉVÉNEMENTS ===
    trackEvent(eventType, eventData = {}) {
        if (!this.currentSession) {
            this.initializeSession();
        }

        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            data: eventData,
            sessionId: this.currentSession.sessionId
        };

        // Ajouter à la session courante
        this.currentSession.actions.push(event);
        sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));

        // Ajouter aux analytics persistantes
        if (!this.analytics.events) {
            this.analytics.events = [];
        }
        this.analytics.events.push(event);

        // Maintenir seulement les 1000 derniers événements
        if (this.analytics.events.length > 1000) {
            this.analytics.events = this.analytics.events.slice(-1000);
        }

        this.saveAnalytics();
        console.log('[Analytics] Event tracked:', eventType, eventData);
    }

    // === TRACKING SPÉCIFIQUE EMAILSORTPRO ===
    trackAuthentication(provider, userInfo) {
        this.currentSession.authProvider = provider;
        this.currentSession.userInfo = {
            name: userInfo.name || userInfo.displayName,
            email: userInfo.email || userInfo.mail || userInfo.userPrincipalName,
            domain: userInfo.email ? userInfo.email.split('@')[1] : 'unknown'
        };

        this.trackEvent('auth_success', {
            provider: provider,
            userDomain: this.currentSession.userInfo.domain,
            userName: this.currentSession.userInfo.name
        });

        // Mettre à jour les stats utilisateurs
        this.updateUserStats();
    }

    trackPageVisit(pageName) {
        this.trackEvent('page_visit', {
            page: pageName,
            timestamp: new Date().toISOString()
        });
    }

    trackEmailScan(emailCount, errors = []) {
        const scanData = {
            emailCount: emailCount,
            errorCount: errors.length,
            domain: window.location.hostname,
            timestamp: new Date().toISOString()
        };

        if (errors.length > 0) {
            scanData.errors = errors;
            errors.forEach(error => this.trackError('scan_error', error));
        }

        this.trackEvent('email_scan', scanData);
        
        // Mettre à jour les stats de scan
        this.updateScanStats(emailCount);
    }

    trackTaskGeneration(taskCount, categories = []) {
        this.trackEvent('task_generation', {
            taskCount: taskCount,
            categories: categories,
            timestamp: new Date().toISOString()
        });
    }

    trackError(errorType, errorData) {
        const error = {
            type: errorType,
            message: errorData.message || errorData,
            stack: errorData.stack,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        if (this.currentSession) {
            this.currentSession.errors.push(error);
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        }

        this.trackEvent('error', error);
    }

    // === MISE À JOUR DES STATISTIQUES ===
    updateUserStats() {
        if (!this.currentSession.userInfo) return;

        const userDomain = this.currentSession.userInfo.domain;
        
        if (!this.analytics.userStats) {
            this.analytics.userStats = {};
        }

        if (!this.analytics.userStats[userDomain]) {
            this.analytics.userStats[userDomain] = {
                count: 0,
                lastAccess: null,
                totalSessions: 0,
                providers: {}
            };
        }

        this.analytics.userStats[userDomain].count++;
        this.analytics.userStats[userDomain].lastAccess = new Date().toISOString();
        this.analytics.userStats[userDomain].totalSessions++;
        
        const provider = this.currentSession.authProvider;
        if (!this.analytics.userStats[userDomain].providers[provider]) {
            this.analytics.userStats[userDomain].providers[provider] = 0;
        }
        this.analytics.userStats[userDomain].providers[provider]++;

        this.saveAnalytics();
    }

    updateScanStats(emailCount) {
        if (!this.analytics.scanStats) {
            this.analytics.scanStats = {
                totalScans: 0,
                totalEmails: 0,
                averageEmailsPerScan: 0,
                scansByDay: {}
            };
        }

        this.analytics.scanStats.totalScans++;
        this.analytics.scanStats.totalEmails += emailCount;
        this.analytics.scanStats.averageEmailsPerScan = 
            Math.round(this.analytics.scanStats.totalEmails / this.analytics.scanStats.totalScans);

        // Stats par jour
        const today = new Date().toISOString().split('T')[0];
        if (!this.analytics.scanStats.scansByDay[today]) {
            this.analytics.scanStats.scansByDay[today] = { scans: 0, emails: 0 };
        }
        this.analytics.scanStats.scansByDay[today].scans++;
        this.analytics.scanStats.scansByDay[today].emails += emailCount;

        this.saveAnalytics();
    }

    // === STOCKAGE ET RÉCUPÉRATION ===
    loadAnalytics() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('[Analytics] Error loading analytics:', error);
        }
        
        return {
            events: [],
            userStats: {},
            scanStats: {
                totalScans: 0,
                totalEmails: 0,
                averageEmailsPerScan: 0,
                scansByDay: {}
            },
            createdAt: new Date().toISOString()
        };
    }

    saveAnalytics() {
        try {
            this.analytics.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.analytics));
        } catch (error) {
            console.warn('[Analytics] Error saving analytics:', error);
        }
    }

    // === MÉTHODES D'ANALYSE ===
    getAnalyticsData() {
        return {
            ...this.analytics,
            currentSession: this.currentSession
        };
    }

    getUsersByDomain() {
        const domains = {};
        
        Object.keys(this.analytics.userStats || {}).forEach(domain => {
            const stats = this.analytics.userStats[domain];
            domains[domain] = {
                userCount: stats.count,
                totalSessions: stats.totalSessions,
                lastAccess: stats.lastAccess,
                providers: stats.providers,
                averageSessionsPerUser: Math.round(stats.totalSessions / stats.count * 100) / 100
            };
        });

        return domains;
    }

    getPageUsageStats() {
        const pages = {};
        
        (this.analytics.events || [])
            .filter(event => event.type === 'page_visit')
            .forEach(event => {
                const page = event.data.page;
                if (!pages[page]) {
                    pages[page] = { visits: 0, lastVisit: null };
                }
                pages[page].visits++;
                pages[page].lastVisit = event.timestamp;
            });

        return pages;
    }

    getErrorStats() {
        const errors = {};
        
        (this.analytics.events || [])
            .filter(event => event.type === 'error')
            .forEach(event => {
                const errorType = event.data.type || 'unknown';
                if (!errors[errorType]) {
                    errors[errorType] = { count: 0, lastOccurrence: null, messages: [] };
                }
                errors[errorType].count++;
                errors[errorType].lastOccurrence = event.timestamp;
                
                if (event.data.message && !errors[errorType].messages.includes(event.data.message)) {
                    errors[errorType].messages.push(event.data.message);
                }
            });

        return errors;
    }

    getScanFrequency() {
        const scans = (this.analytics.events || [])
            .filter(event => event.type === 'email_scan')
            .map(event => ({
                date: event.timestamp.split('T')[0],
                emailCount: event.data.emailCount,
                timestamp: event.timestamp
            }));

        // Grouper par date
        const scansByDate = {};
        scans.forEach(scan => {
            if (!scansByDate[scan.date]) {
                scansByDate[scan.date] = { count: 0, totalEmails: 0 };
            }
            scansByDate[scan.date].count++;
            scansByDate[scan.date].totalEmails += scan.emailCount;
        });

        return scansByDate;
    }

    getRecentActivity(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        
        return (this.analytics.events || [])
            .filter(event => event.timestamp > cutoff)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // === EXPORT ET NETTOYAGE ===
    exportAnalytics() {
        const exportData = {
            ...this.analytics,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emailsortpro-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    clearAnalytics() {
        this.analytics = {
            events: [],
            userStats: {},
            scanStats: {
                totalScans: 0,
                totalEmails: 0,
                averageEmailsPerScan: 0,
                scansByDay: {}
            },
            createdAt: new Date().toISOString()
        };
        
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
        
        console.log('[Analytics] Analytics data cleared');
    }

    // === MÉTHODES POUR L'INTÉGRATION ===
    // Ces méthodes doivent être appelées depuis les autres modules

    // À appeler depuis PageManager.js
    onPageLoad(pageName) {
        this.trackPageVisit(pageName);
    }

    // À appeler depuis AuthService.js
    onAuthSuccess(provider, userInfo) {
        this.trackAuthentication(provider, userInfo);
    }

    // À appeler depuis EmailScanner.js
    onEmailScanComplete(emailCount, errors = []) {
        this.trackEmailScan(emailCount, errors);
    }

    // À appeler depuis TaskManager.js
    onTasksGenerated(taskCount, categories = []) {
        this.trackTaskGeneration(taskCount, categories);
    }

    // À appeler depuis UIManager.js pour les erreurs
    onError(errorType, errorData) {
        this.trackError(errorType, errorData);
    }

    // À appeler depuis DomainOrganizer.js
    onDomainOrganization(domainCount, emailCount) {
        this.trackEvent('domain_organization', {
            domainCount: domainCount,
            emailCount: emailCount,
            timestamp: new Date().toISOString()
        });
    }
}

// === MODULE ANALYTICS POUR LA PAGE ===
class AnalyticsModule {
    constructor() {
        this.container = null;
        this.refreshInterval = null;
        this.analytics = window.analyticsManager || new AnalyticsManager();
    }

    render() {
        console.log('[AnalyticsModule] Rendering analytics page...');
        
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[AnalyticsModule] Page content container not found');
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'analytics-container';
        this.container.innerHTML = this.getAnalyticsHTML();
        
        pageContent.innerHTML = '';
        pageContent.appendChild(this.container);
        
        // Initialiser les événements
        this.initializeEvents();
        
        // Charger les données
        this.loadAnalyticsData();
        
        // Auto-refresh toutes les 30 secondes
        this.startAutoRefresh();
        
        console.log('[AnalyticsModule] Analytics page rendered');
    }

    getAnalyticsHTML() {
        return `
            <div class="analytics-page">
                <div class="analytics-header">
                    <h1><i class="fas fa-chart-line"></i> Analytics EmailSortPro</h1>
                    <div class="analytics-actions">
                        <button id="refreshAnalytics" class="btn-secondary">
                            <i class="fas fa-sync"></i> Actualiser
                        </button>
                        <button id="exportAnalytics" class="btn-secondary">
                            <i class="fas fa-download"></i> Exporter
                        </button>
                        <button id="clearAnalytics" class="btn-danger">
                            <i class="fas fa-trash"></i> Vider
                        </button>
                    </div>
                </div>

                <div class="analytics-grid">
                    <!-- Statistiques générales -->
                    <div class="analytics-card overview-card">
                        <h3><i class="fas fa-tachometer-alt"></i> Vue d'ensemble</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number" id="totalSessions">-</div>
                                <div class="stat-label">Sessions totales</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="totalScans">-</div>
                                <div class="stat-label">Scans effectués</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="totalEmails">-</div>
                                <div class="stat-label">Emails analysés</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="totalErrors">-</div>
                                <div class="stat-label">Erreurs détectées</div>
                            </div>
                        </div>
                    </div>

                    <!-- Utilisateurs par domaine -->
                    <div class="analytics-card users-card">
                        <h3><i class="fas fa-users"></i> Utilisateurs par domaine</h3>
                        <div id="usersDomainChart" class="chart-container">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>

                    <!-- Utilisation des pages -->
                    <div class="analytics-card pages-card">
                        <h3><i class="fas fa-file-alt"></i> Utilisation des pages</h3>
                        <div id="pagesChart" class="chart-container">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>

                    <!-- Fréquence des scans -->
                    <div class="analytics-card scans-card">
                        <h3><i class="fas fa-search"></i> Fréquence des scans</h3>
                        <div id="scansChart" class="chart-container">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>

                    <!-- Erreurs -->
                    <div class="analytics-card errors-card">
                        <h3><i class="fas fa-exclamation-triangle"></i> Erreurs détectées</h3>
                        <div id="errorsChart" class="chart-container">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>

                    <!-- Activité récente -->
                    <div class="analytics-card activity-card">
                        <h3><i class="fas fa-clock"></i> Activité récente</h3>
                        <div id="recentActivity" class="activity-list">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .analytics-page {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .analytics-header h1 {
                    color: #1f2937;
                    font-size: 2rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .analytics-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-secondary, .btn-danger {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }

                .btn-secondary {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }

                .btn-secondary:hover {
                    background: #e2e8f0;
                    border-color: #cbd5e1;
                }

                .btn-danger {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }

                .btn-danger:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 24px;
                }

                .analytics-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .analytics-card h3 {
                    color: #1f2937;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .overview-card {
                    grid-column: 1 / -1;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                }

                .stat-item {
                    text-align: center;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #4F46E5;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .chart-container {
                    min-height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .loading {
                    color: #64748b;
                    font-style: italic;
                }

                .activity-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    flex-shrink: 0;
                }

                .activity-icon.session { background: #dbeafe; color: #1d4ed8; }
                .activity-icon.scan { background: #dcfce7; color: #16a34a; }
                .activity-icon.error { background: #fef2f2; color: #dc2626; }
                .activity-icon.page { background: #fef3c7; color: #d97706; }

                .activity-content {
                    flex: 1;
                }

                .activity-title {
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 4px;
                }

                .activity-details {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .activity-time {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    white-space: nowrap;
                }

                .chart-simple {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .chart-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chart-bar {
                    flex: 1;
                    height: 8px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .chart-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4F46E5, #6366F1);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .chart-label {
                    min-width: 120px;
                    font-size: 0.875rem;
                    color: #1f2937;
                    font-weight: 500;
                }

                .chart-value {
                    min-width: 40px;
                    text-align: right;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .analytics-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .analytics-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }
                    
                    .analytics-actions {
                        justify-content: center;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;
    }

    initializeEvents() {
        // Bouton refresh
        const refreshBtn = document.getElementById('refreshAnalytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData();
            });
        }

        // Bouton export
        const exportBtn = document.getElementById('exportAnalytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.analytics.exportAnalytics();
            });
        }

        // Bouton clear
        const clearBtn = document.getElementById('clearAnalytics');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données analytics ?')) {
                    this.analytics.clearAnalytics();
                    this.loadAnalyticsData();
                }
            });
        }
    }

    loadAnalyticsData() {
        console.log('[AnalyticsModule] Loading analytics data...');
        
        const data = this.analytics.getAnalyticsData();
        
        // Statistiques générales
        this.updateOverviewStats(data);
        
        // Utilisateurs par domaine
        this.updateUsersDomainChart(data);
        
        // Utilisation des pages
        this.updatePagesChart(data);
        
        // Fréquence des scans
        this.updateScansChart(data);
        
        // Erreurs
        this.updateErrorsChart(data);
        
        // Activité récente
        this.updateRecentActivity(data);
    }

    updateOverviewStats(data) {
        const totalSessions = Object.values(data.userStats || {})
            .reduce((sum, stats) => sum + stats.totalSessions, 0);
        
        document.getElementById('totalSessions').textContent = totalSessions.toLocaleString();
        document.getElementById('totalScans').textContent = (data.scanStats?.totalScans || 0).toLocaleString();
        document.getElementById('totalEmails').textContent = (data.scanStats?.totalEmails || 0).toLocaleString();
        
        const errorEvents = (data.events || []).filter(e => e.type === 'error');
        document.getElementById('totalErrors').textContent = errorEvents.length.toLocaleString();
    }

    updateUsersDomainChart(data) {
        const container = document.getElementById('usersDomainChart');
        const usersByDomain = this.analytics.getUsersByDomain();
        
        if (Object.keys(usersByDomain).length === 0) {
            container.innerHTML = '<div class="loading">Aucune donnée utilisateur</div>';
            return;
        }

        const sortedDomains = Object.entries(usersByDomain)
            .sort(([,a], [,b]) => b.userCount - a.userCount);
        
        const maxCount = Math.max(...sortedDomains.map(([,stats]) => stats.userCount));
        
        container.innerHTML = `
            <div class="chart-simple">
                ${sortedDomains.map(([domain, stats]) => `
                    <div class="chart-item">
                        <div class="chart-label">${domain}</div>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${(stats.userCount / maxCount) * 100}%"></div>
                        </div>
                        <div class="chart-value">${stats.userCount}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updatePagesChart(data) {
        const container = document.getElementById('pagesChart');
        const pageStats = this.analytics.getPageUsageStats();
        
        if (Object.keys(pageStats).length === 0) {
            container.innerHTML = '<div class="loading">Aucune donnée de navigation</div>';
            return;
        }

        const sortedPages = Object.entries(pageStats)
            .sort(([,a], [,b]) => b.visits - a.visits);
        
        const maxVisits = Math.max(...sortedPages.map(([,stats]) => stats.visits));
        
        container.innerHTML = `
            <div class="chart-simple">
                ${sortedPages.map(([page, stats]) => `
                    <div class="chart-item">
                        <div class="chart-label">${page}</div>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${(stats.visits / maxVisits) * 100}%"></div>
                        </div>
                        <div class="chart-value">${stats.visits}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateScansChart(data) {
        const container = document.getElementById('scansChart');
        const scansByDate = this.analytics.getScanFrequency();
        
        if (Object.keys(scansByDate).length === 0) {
            container.innerHTML = '<div class="loading">Aucun scan effectué</div>';
            return;
        }

        const sortedDates = Object.entries(scansByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 7); // Derniers 7 jours
        
        const maxScans = Math.max(...sortedDates.map(([,stats]) => stats.count));
        
        container.innerHTML = `
            <div class="chart-simple">
                ${sortedDates.map(([date, stats]) => `
                    <div class="chart-item">
                        <div class="chart-label">${new Date(date).toLocaleDateString()}</div>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${(stats.count / maxScans) * 100}%"></div>
                        </div>
                        <div class="chart-value">${stats.count}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateErrorsChart(data) {
        const container = document.getElementById('errorsChart');
        const errorStats = this.analytics.getErrorStats();
        
        if (Object.keys(errorStats).length === 0) {
            container.innerHTML = '<div class="loading">Aucune erreur détectée</div>';
            return;
        }

        const sortedErrors = Object.entries(errorStats)
            .sort(([,a], [,b]) => b.count - a.count);
        
        const maxCount = Math.max(...sortedErrors.map(([,stats]) => stats.count));
        
        container.innerHTML = `
            <div class="chart-simple">
                ${sortedErrors.map(([errorType, stats]) => `
                    <div class="chart-item">
                        <div class="chart-label">${errorType}</div>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${(stats.count / maxCount) * 100}%"></div>
                        </div>
                        <div class="chart-value">${stats.count}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateRecentActivity(data) {
        const container = document.getElementById('recentActivity');
        const recentEvents = this.analytics.getRecentActivity(24);
        
        if (recentEvents.length === 0) {
            container.innerHTML = '<div class="loading">Aucune activité récente</div>';
            return;
        }

        const getActivityIcon = (eventType) => {
            switch (eventType) {
                case 'session_start': return { class: 'session', icon: 'fa-sign-in-alt' };
                case 'email_scan': return { class: 'scan', icon: 'fa-search' };
                case 'error': return { class: 'error', icon: 'fa-exclamation-triangle' };
                case 'page_visit': return { class: 'page', icon: 'fa-file-alt' };
                default: return { class: 'session', icon: 'fa-circle' };
            }
        };

        const getActivityTitle = (event) => {
            switch (event.type) {
                case 'session_start': return 'Nouvelle session';
                case 'email_scan': return `Scan de ${event.data.emailCount} emails`;
                case 'error': return `Erreur: ${event.data.type}`;
                case 'page_visit': return `Visite page: ${event.data.page}`;
                default: return event.type;
            }
        };

        container.innerHTML = `
            ${recentEvents.slice(0, 10).map(event => {
                const icon = getActivityIcon(event.type);
                const title = getActivityTitle(event);
                const time = new Date(event.timestamp).toLocaleString();
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon ${icon.class}">
                            <i class="fas ${icon.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${title}</div>
                            <div class="activity-details">${JSON.stringify(event.data).substring(0, 100)}...</div>
                        </div>
                        <div class="activity-time">${time}</div>
                    </div>
                `;
            }).join('')}
        `;
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadAnalyticsData();
        }, 30000); // Refresh toutes les 30 secondes
    }

    hide() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    destroy() {
        this.hide();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
    }
}

// Créer l'instance globale de l'analytics manager
if (!window.analyticsManager) {
    window.analyticsManager = new AnalyticsManager();
    console.log('[Analytics] Global AnalyticsManager created');
}

// Créer le module analytics global
window.analyticsModule = new AnalyticsModule();

console.log('[Analytics] ✅ Analytics module loaded successfully v1.0');
