// analytics.js - Module Analytics Complet pour EmailSortPro v2.0
// Tracking des emails utilisateurs, fréquence et coûts de scan

class AnalyticsManager {
    constructor() {
        this.storageKey = 'emailsortpro_analytics';
        this.sessionKey = 'emailsortpro_session';
        this.initialized = false;
        this.currentSession = null;
        this.analytics = this.loadAnalytics();
        
        // Configuration des coûts (en centimes d'euros)
        this.costs = {
            emailScan: 0.5,        // 0.5 centime par email scanné
            aiAnalysis: 2,         // 2 centimes par analyse IA
            taskGeneration: 1,     // 1 centime par tâche générée
            domainOrganization: 3  // 3 centimes par organisation de domaine
        };
        
        console.log('[Analytics] Manager initialized v2.0');
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
            userInfo: null,
            costs: {
                total: 0,
                breakdown: {}
            }
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
            sessionId: this.currentSession.sessionId,
            userEmail: this.currentSession.userInfo?.email || 'anonymous'
        };

        // Ajouter à la session courante
        this.currentSession.actions.push(event);
        sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));

        // Ajouter aux analytics persistantes
        if (!this.analytics.events) {
            this.analytics.events = [];
        }
        this.analytics.events.push(event);

        // Maintenir seulement les 5000 derniers événements pour plus d'historique
        if (this.analytics.events.length > 5000) {
            this.analytics.events = this.analytics.events.slice(-5000);
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
            domain: userInfo.email ? userInfo.email.split('@')[1] : 'unknown',
            id: userInfo.id || null
        };

        this.trackEvent('auth_success', {
            provider: provider,
            userEmail: this.currentSession.userInfo.email,
            userDomain: this.currentSession.userInfo.domain,
            userName: this.currentSession.userInfo.name
        });

        // Mettre à jour les stats utilisateurs par email
        this.updateUserStatsByEmail();
    }

    trackPageVisit(pageName) {
        this.trackEvent('page_visit', {
            page: pageName,
            userEmail: this.currentSession.userInfo?.email || 'anonymous',
            timestamp: new Date().toISOString()
        });
    }

    trackEmailScan(emailCount, errors = []) {
        const userEmail = this.currentSession.userInfo?.email || 'anonymous';
        const scanCost = emailCount * this.costs.emailScan;
        
        const scanData = {
            emailCount: emailCount,
            errorCount: errors.length,
            domain: window.location.hostname,
            userEmail: userEmail,
            cost: scanCost,
            timestamp: new Date().toISOString()
        };

        if (errors.length > 0) {
            scanData.errors = errors;
            errors.forEach(error => this.trackError('scan_error', error));
        }

        this.trackEvent('email_scan', scanData);
        
        // Mettre à jour les coûts de la session
        this.updateSessionCost('emailScan', scanCost);
        
        // Mettre à jour les stats de scan par utilisateur
        this.updateScanStatsByUser(emailCount, scanCost);
    }

    trackAIAnalysis(analysisType, itemCount) {
        const userEmail = this.currentSession.userInfo?.email || 'anonymous';
        const analysisCost = itemCount * this.costs.aiAnalysis;
        
        this.trackEvent('ai_analysis', {
            type: analysisType,
            itemCount: itemCount,
            userEmail: userEmail,
            cost: analysisCost,
            timestamp: new Date().toISOString()
        });
        
        this.updateSessionCost('aiAnalysis', analysisCost);
    }

    trackTaskGeneration(taskCount, categories = []) {
        const userEmail = this.currentSession.userInfo?.email || 'anonymous';
        const taskCost = taskCount * this.costs.taskGeneration;
        
        this.trackEvent('task_generation', {
            taskCount: taskCount,
            categories: categories,
            userEmail: userEmail,
            cost: taskCost,
            timestamp: new Date().toISOString()
        });
        
        this.updateSessionCost('taskGeneration', taskCost);
    }

    trackDomainOrganization(domainCount, emailCount) {
        const userEmail = this.currentSession.userInfo?.email || 'anonymous';
        const orgCost = domainCount * this.costs.domainOrganization;
        
        this.trackEvent('domain_organization', {
            domainCount: domainCount,
            emailCount: emailCount,
            userEmail: userEmail,
            cost: orgCost,
            timestamp: new Date().toISOString()
        });
        
        this.updateSessionCost('domainOrganization', orgCost);
    }

    trackError(errorType, errorData) {
        const error = {
            type: errorType,
            message: errorData.message || errorData,
            stack: errorData.stack,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 100),
            userEmail: this.currentSession.userInfo?.email || 'anonymous'
        };

        if (this.currentSession) {
            this.currentSession.errors.push(error);
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        }

        this.trackEvent('error', error);
    }

    // === MISE À JOUR DES STATISTIQUES ===
    updateUserStatsByEmail() {
        if (!this.currentSession.userInfo?.email) return;

        const userEmail = this.currentSession.userInfo.email;
        
        if (!this.analytics.userStatsByEmail) {
            this.analytics.userStatsByEmail = {};
        }

        if (!this.analytics.userStatsByEmail[userEmail]) {
            this.analytics.userStatsByEmail[userEmail] = {
                name: this.currentSession.userInfo.name,
                domain: this.currentSession.userInfo.domain,
                firstSeen: new Date().toISOString(),
                lastAccess: null,
                totalSessions: 0,
                totalScans: 0,
                totalEmailsScanned: 0,
                totalCost: 0,
                providers: {},
                scanHistory: [],
                costBreakdown: {
                    emailScan: 0,
                    aiAnalysis: 0,
                    taskGeneration: 0,
                    domainOrganization: 0
                }
            };
        }

        const userStats = this.analytics.userStatsByEmail[userEmail];
        userStats.lastAccess = new Date().toISOString();
        userStats.totalSessions++;
        
        const provider = this.currentSession.authProvider;
        if (!userStats.providers[provider]) {
            userStats.providers[provider] = 0;
        }
        userStats.providers[provider]++;

        this.saveAnalytics();
    }

    updateScanStatsByUser(emailCount, cost) {
        if (!this.currentSession.userInfo?.email) return;
        
        const userEmail = this.currentSession.userInfo.email;
        const userStats = this.analytics.userStatsByEmail[userEmail];
        
        if (userStats) {
            userStats.totalScans++;
            userStats.totalEmailsScanned += emailCount;
            userStats.totalCost += cost;
            userStats.costBreakdown.emailScan += cost;
            
            // Ajouter à l'historique de scan (garder les 100 derniers)
            userStats.scanHistory.push({
                date: new Date().toISOString(),
                emailCount: emailCount,
                cost: cost
            });
            
            if (userStats.scanHistory.length > 100) {
                userStats.scanHistory = userStats.scanHistory.slice(-100);
            }
        }

        // Mettre à jour les stats globales de scan
        if (!this.analytics.scanStats) {
            this.analytics.scanStats = {
                totalScans: 0,
                totalEmails: 0,
                totalCost: 0,
                averageEmailsPerScan: 0,
                scansByDay: {},
                scansByUser: {}
            };
        }

        this.analytics.scanStats.totalScans++;
        this.analytics.scanStats.totalEmails += emailCount;
        this.analytics.scanStats.totalCost += cost;
        this.analytics.scanStats.averageEmailsPerScan = 
            Math.round(this.analytics.scanStats.totalEmails / this.analytics.scanStats.totalScans);

        // Stats par jour
        const today = new Date().toISOString().split('T')[0];
        if (!this.analytics.scanStats.scansByDay[today]) {
            this.analytics.scanStats.scansByDay[today] = { 
                scans: 0, 
                emails: 0, 
                cost: 0,
                users: new Set()
            };
        }
        this.analytics.scanStats.scansByDay[today].scans++;
        this.analytics.scanStats.scansByDay[today].emails += emailCount;
        this.analytics.scanStats.scansByDay[today].cost += cost;
        this.analytics.scanStats.scansByDay[today].users.add(userEmail);

        // Convertir Set en Array pour la sauvegarde
        this.analytics.scanStats.scansByDay[today].users = 
            Array.from(this.analytics.scanStats.scansByDay[today].users);

        this.saveAnalytics();
    }

    updateSessionCost(costType, amount) {
        if (!this.currentSession.costs.breakdown[costType]) {
            this.currentSession.costs.breakdown[costType] = 0;
        }
        
        this.currentSession.costs.breakdown[costType] += amount;
        this.currentSession.costs.total += amount;
        
        sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        
        // Mettre à jour le coût total de l'utilisateur
        if (this.currentSession.userInfo?.email) {
            const userEmail = this.currentSession.userInfo.email;
            if (this.analytics.userStatsByEmail[userEmail]) {
                this.analytics.userStatsByEmail[userEmail].totalCost += amount;
                this.analytics.userStatsByEmail[userEmail].costBreakdown[costType] += amount;
            }
        }
        
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
            userStats: {}, // Ancienne structure par domaine (legacy)
            userStatsByEmail: {}, // Nouvelle structure par email
            scanStats: {
                totalScans: 0,
                totalEmails: 0,
                totalCost: 0,
                averageEmailsPerScan: 0,
                scansByDay: {},
                scansByUser: {}
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

    getUsersByEmail() {
        const users = {};
        
        Object.keys(this.analytics.userStatsByEmail || {}).forEach(email => {
            const stats = this.analytics.userStatsByEmail[email];
            users[email] = {
                name: stats.name,
                domain: stats.domain,
                firstSeen: stats.firstSeen,
                lastAccess: stats.lastAccess,
                totalSessions: stats.totalSessions,
                totalScans: stats.totalScans,
                totalEmailsScanned: stats.totalEmailsScanned,
                totalCost: stats.totalCost,
                averageEmailsPerScan: stats.totalScans > 0 ? 
                    Math.round(stats.totalEmailsScanned / stats.totalScans) : 0,
                providers: stats.providers,
                costBreakdown: stats.costBreakdown,
                scanHistory: stats.scanHistory
            };
        });

        return users;
    }

    getTopUsers(limit = 10) {
        const users = this.getUsersByEmail();
        
        return Object.entries(users)
            .sort(([,a], [,b]) => b.totalScans - a.totalScans)
            .slice(0, limit)
            .map(([email, stats]) => ({
                email,
                ...stats
            }));
    }

    getUserCostAnalysis() {
        const users = this.getUsersByEmail();
        const analysis = {
            totalRevenue: 0,
            averageRevenuePerUser: 0,
            userCount: 0,
            costBreakdown: {
                emailScan: 0,
                aiAnalysis: 0,
                taskGeneration: 0,
                domainOrganization: 0
            },
            topSpenders: []
        };
        
        const userCosts = [];
        
        Object.entries(users).forEach(([email, stats]) => {
            analysis.totalRevenue += stats.totalCost;
            analysis.userCount++;
            
            Object.keys(stats.costBreakdown).forEach(type => {
                analysis.costBreakdown[type] += stats.costBreakdown[type];
            });
            
            userCosts.push({
                email,
                name: stats.name,
                totalCost: stats.totalCost,
                costBreakdown: stats.costBreakdown
            });
        });
        
        if (analysis.userCount > 0) {
            analysis.averageRevenuePerUser = analysis.totalRevenue / analysis.userCount;
        }
        
        analysis.topSpenders = userCosts
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 10);
        
        return analysis;
    }

    getPageUsageStats() {
        const pages = {};
        
        (this.analytics.events || [])
            .filter(event => event.type === 'page_visit')
            .forEach(event => {
                const page = event.data.page;
                if (!pages[page]) {
                    pages[page] = { visits: 0, lastVisit: null, users: new Set() };
                }
                pages[page].visits++;
                pages[page].lastVisit = event.timestamp;
                pages[page].users.add(event.userEmail);
            });

        // Convertir les Sets en Arrays et calculer les utilisateurs uniques
        Object.keys(pages).forEach(page => {
            pages[page].uniqueUsers = pages[page].users.size;
            pages[page].users = Array.from(pages[page].users);
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
                    errors[errorType] = { 
                        count: 0, 
                        lastOccurrence: null, 
                        messages: [],
                        affectedUsers: new Set()
                    };
                }
                errors[errorType].count++;
                errors[errorType].lastOccurrence = event.timestamp;
                errors[errorType].affectedUsers.add(event.userEmail);
                
                if (event.data.message && !errors[errorType].messages.includes(event.data.message)) {
                    errors[errorType].messages.push(event.data.message);
                }
            });

        // Convertir les Sets en Arrays
        Object.keys(errors).forEach(errorType => {
            errors[errorType].affectedUsersCount = errors[errorType].affectedUsers.size;
            errors[errorType].affectedUsers = Array.from(errors[errorType].affectedUsers);
        });

        return errors;
    }

    getScanFrequency() {
        const scans = (this.analytics.events || [])
            .filter(event => event.type === 'email_scan')
            .map(event => ({
                date: event.timestamp.split('T')[0],
                emailCount: event.data.emailCount,
                cost: event.data.cost,
                userEmail: event.userEmail,
                timestamp: event.timestamp
            }));

        // Grouper par date
        const scansByDate = {};
        scans.forEach(scan => {
            if (!scansByDate[scan.date]) {
                scansByDate[scan.date] = { 
                    count: 0, 
                    totalEmails: 0, 
                    totalCost: 0,
                    users: new Set()
                };
            }
            scansByDate[scan.date].count++;
            scansByDate[scan.date].totalEmails += scan.emailCount;
            scansByDate[scan.date].totalCost += scan.cost || 0;
            scansByDate[scan.date].users.add(scan.userEmail);
        });

        // Convertir les Sets en Arrays et calculer les moyennes
        Object.keys(scansByDate).forEach(date => {
            const stats = scansByDate[date];
            stats.uniqueUsers = stats.users.size;
            stats.users = Array.from(stats.users);
            stats.averageEmailsPerScan = Math.round(stats.totalEmails / stats.count);
            stats.averageCostPerScan = stats.totalCost / stats.count;
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
            version: '2.0',
            summary: {
                totalUsers: Object.keys(this.analytics.userStatsByEmail || {}).length,
                totalScans: this.analytics.scanStats?.totalScans || 0,
                totalRevenue: this.getUserCostAnalysis().totalRevenue,
                topUsers: this.getTopUsers(5)
            }
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
            userStatsByEmail: {},
            scanStats: {
                totalScans: 0,
                totalEmails: 0,
                totalCost: 0,
                averageEmailsPerScan: 0,
                scansByDay: {},
                scansByUser: {}
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

    // À appeler depuis AuthService.js et GoogleAuthService.js
    onAuthSuccess(provider, userInfo) {
        this.trackAuthentication(provider, userInfo);
    }

    // À appeler depuis EmailScanner.js
    onEmailScanComplete(emailCount, errors = []) {
        this.trackEmailScan(emailCount, errors);
    }

    // À appeler depuis AITaskAnalyzer.js
    onAIAnalysis(analysisType, itemCount) {
        this.trackAIAnalysis(analysisType, itemCount);
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
        this.trackDomainOrganization(domainCount, emailCount);
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
                                <div class="stat-number" id="totalUsers">-</div>
                                <div class="stat-label">Utilisateurs</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="totalScans">-</div>
                                <div class="stat-label">Scans effectués</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="totalEmails">-</div>
                                <div class="stat-label">Emails analysés</div>
                            </div>
                            <div class="stat-item highlight">
                                <div class="stat-number" id="totalRevenue">-</div>
                                <div class="stat-label">Revenus (€)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Top utilisateurs -->
                    <div class="analytics-card users-card">
                        <h3><i class="fas fa-users"></i> Top Utilisateurs</h3>
                        <div id="topUsersChart" class="chart-container">
                            <div class="loading">Chargement...</div>
                        </div>
                    </div>

                    <!-- Analyse des coûts -->
                    <div class="analytics-card costs-card">
                        <h3><i class="fas fa-euro-sign"></i> Analyse des Coûts</h3>
                        <div id="costsChart" class="chart-container">
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

                    <!-- Détail par utilisateur -->
                    <div class="analytics-card user-details-card">
                        <h3><i class="fas fa-user-chart"></i> Détail par Utilisateur</h3>
                        <div id="userDetailsTable" class="table-container">
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

                .user-details-card {
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

                .stat-item.highlight {
                    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
                    color: white;
                }

                .stat-item.highlight .stat-label {
                    color: rgba(255, 255, 255, 0.9);
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #4F46E5;
                    margin-bottom: 8px;
                }

                .stat-item.highlight .stat-number {
                    color: white;
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

                .table-container {
                    overflow-x: auto;
                }

                .user-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .user-table th {
                    background: #f8fafc;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }

                .user-table td {
                    padding: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .user-table tr:hover {
                    background: #f8fafc;
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
                    min-width: 200px;
                    font-size: 0.875rem;
                    color: #1f2937;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .chart-value {
                    min-width: 60px;
                    text-align: right;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .cost-breakdown {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 16px;
                }

                .cost-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-radius: 6px;
                }

                .cost-label {
                    font-weight: 500;
                    color: #475569;
                }

                .cost-value {
                    font-weight: 600;
                    color: #1f2937;
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
                    
                    .chart-label {
                        min-width: 120px;
                        font-size: 0.75rem;
                    }
                    
                    .user-table {
                        font-size: 0.75rem;
                    }
                    
                    .user-table th,
                    .user-table td {
                        padding: 8px;
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
        
        // Top utilisateurs
        this.updateTopUsersChart(data);
        
        // Analyse des coûts
        this.updateCostsChart(data);
        
        // Fréquence des scans
        this.updateScansChart(data);
        
        // Détail par utilisateur
        this.updateUserDetailsTable(data);
        
        // Activité récente
        this.updateRecentActivity(data);
    }

    updateOverviewStats(data) {
        const users = Object.keys(data.userStatsByEmail || {});
        const costAnalysis = this.analytics.getUserCostAnalysis();
        
        document.getElementById('totalUsers').textContent = users.length.toLocaleString();
        document.getElementById('totalScans').textContent = (data.scanStats?.totalScans || 0).toLocaleString();
        document.getElementById('totalEmails').textContent = (data.scanStats?.totalEmails || 0).toLocaleString();
        document.getElementById('totalRevenue').textContent = 
            (costAnalysis.totalRevenue / 100).toFixed(2) + ' €';
    }

    updateTopUsersChart(data) {
        const container = document.getElementById('topUsersChart');
        const topUsers = this.analytics.getTopUsers(5);
        
        if (topUsers.length === 0) {
            container.innerHTML = '<div class="loading">Aucune donnée utilisateur</div>';
            return;
        }

        const maxScans = Math.max(...topUsers.map(user => user.totalScans));
        
        container.innerHTML = `
            <div class="chart-simple">
                ${topUsers.map(user => `
                    <div class="chart-item">
                        <div class="chart-label" title="${user.email}">${user.email}</div>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${(user.totalScans / maxScans) * 100}%"></div>
                        </div>
                        <div class="chart-value">${user.totalScans} scans</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateCostsChart(data) {
        const container = document.getElementById('costsChart');
        const costAnalysis = this.analytics.getUserCostAnalysis();
        
        if (costAnalysis.userCount === 0) {
            container.innerHTML = '<div class="loading">Aucune donnée de coût</div>';
            return;
        }

        const costBreakdown = costAnalysis.costBreakdown;
        const total = Object.values(costBreakdown).reduce((sum, val) => sum + val, 0);
        
        container.innerHTML = `
            <div class="cost-breakdown">
                <div class="cost-item">
                    <span class="cost-label">Scan d'emails</span>
                    <span class="cost-value">${(costBreakdown.emailScan / 100).toFixed(2)} €</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Analyse IA</span>
                    <span class="cost-value">${(costBreakdown.aiAnalysis / 100).toFixed(2)} €</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Génération de tâches</span>
                    <span class="cost-value">${(costBreakdown.taskGeneration / 100).toFixed(2)} €</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Organisation par domaine</span>
                    <span class="cost-value">${(costBreakdown.domainOrganization / 100).toFixed(2)} €</span>
                </div>
                <div class="cost-item" style="background: #4F46E5; color: white; margin-top: 8px;">
                    <span class="cost-label">Total</span>
                    <span class="cost-value">${(total / 100).toFixed(2)} €</span>
                </div>
            </div>
            <div style="margin-top: 16px; text-align: center; color: #64748b; font-size: 0.875rem;">
                Revenu moyen par utilisateur: ${(costAnalysis.averageRevenuePerUser / 100).toFixed(2)} €
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
                        <div class="chart-value">${stats.count} (${(stats.totalCost / 100).toFixed(2)}€)</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateUserDetailsTable(data) {
        const container = document.getElementById('userDetailsTable');
        const users = this.analytics.getUsersByEmail();
        
        if (Object.keys(users).length === 0) {
            container.innerHTML = '<div class="loading">Aucune donnée utilisateur</div>';
            return;
        }

        const sortedUsers = Object.entries(users)
            .sort(([,a], [,b]) => b.totalCost - a.totalCost);
        
        container.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nom</th>
                        <th>Sessions</th>
                        <th>Scans</th>
                        <th>Emails</th>
                        <th>Moy./Scan</th>
                        <th>Coût Total</th>
                        <th>Dernière Activité</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedUsers.map(([email, stats]) => `
                        <tr>
                            <td>${email}</td>
                            <td>${stats.name || '-'}</td>
                            <td>${stats.totalSessions}</td>
                            <td>${stats.totalScans}</td>
                            <td>${stats.totalEmailsScanned}</td>
                            <td>${stats.averageEmailsPerScan}</td>
                            <td style="font-weight: 600; color: #4F46E5;">
                                ${(stats.totalCost / 100).toFixed(2)} €
                            </td>
                            <td>${new Date(stats.lastAccess).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
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
                case 'email_scan': return `Scan de ${event.data.emailCount} emails (${(event.data.cost / 100).toFixed(2)}€)`;
                case 'error': return `Erreur: ${event.data.type}`;
                case 'page_visit': return `Visite page: ${event.data.page}`;
                case 'auth_success': return `Connexion ${event.data.provider}`;
                default: return event.type;
            }
        };

        container.innerHTML = `
            ${recentEvents.slice(0, 20).map(event => {
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
                            <div class="activity-details">
                                ${event.userEmail || 'Anonyme'} - 
                                ${event.data.userEmail || event.data.userName || ''}
                            </div>
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
    console.log('[Analytics] Global AnalyticsManager created v2.0');
}

// Créer le module analytics global
window.analyticsModule = new AnalyticsModule();

console.log('[Analytics] ✅ Analytics module loaded successfully v2.0 - Email tracking & Cost analysis');
