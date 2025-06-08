// PageManager.js - Gestionnaire de pages avec délégation aux modules v11.2

class PageManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.isLoading = false;
        this.pages = new Map();
        this.loadedPages = new Set();
        this.realDataOnly = true;
        
        console.log('[PageManager] Initialized v11.2 - Module delegation system');
        this.initializePages();
    }

    initializePages() {
        // Configuration des pages avec leurs modules correspondants
        this.pages.set('dashboard', {
            title: 'Dashboard',
            module: null, // Géré directement par PageManager
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('scanner', {
            title: 'Scanner',
            module: 'minimalScanModule', // StartScan.js
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('emails', {
            title: 'Emails',
            module: 'EmailsModule', // Créé dans index.html
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('tasks', {
            title: 'Tâches',
            module: 'TasksModule', // Créé dans index.html
            requiresAuth: true,
            requiresRealData: false
        });
        
        this.pages.set('ranger', {
            title: 'Ranger',
            module: 'RangerModule', // Créé dans index.html
            requiresAuth: true,
            requiresRealData: false
        });
        
        this.pages.set('settings', {
            title: 'Paramètres',
            module: 'SettingsModule', // Créé dans index.html
            requiresAuth: true,
            requiresRealData: false
        });
    }

    async loadPage(pageName) {
        console.log('[PageManager] Loading page:', pageName);
        
        if (!this.pages.has(pageName)) {
            console.error('[PageManager] Unknown page:', pageName);
            return;
        }

        const pageConfig = this.pages.get(pageName);
        
        // Vérifier l'authentification
        if (pageConfig.requiresAuth && !this.isAuthenticated()) {
            console.warn('[PageManager] Page requires authentication:', pageName);
            this.showAuthRequired();
            return;
        }

        // Vérifier les données réelles si nécessaire
        if (pageConfig.requiresRealData && !this.hasRealData()) {
            console.warn('[PageManager] Page requires real data, ensuring data is loaded...');
            await this.ensureRealDataLoaded();
        }

        this.currentPage = pageName;
        this.updateNavigation(pageName);
        
        if (window.uiManager) {
            window.uiManager.showLoading(`Chargement ${pageConfig.title}...`);
        }

        try {
            await this.renderPage(pageName);
            this.loadedPages.add(pageName);
            
            if (window.uiManager) {
                window.uiManager.hideLoading();
            }
            
        } catch (error) {
            console.error('[PageManager] Error loading page:', error);
            
            if (window.uiManager) {
                window.uiManager.hideLoading();
                window.uiManager.showToast(
                    `Erreur lors du chargement de ${pageConfig.title}`,
                    'error'
                );
            }
        }
    }

    async renderPage(pageName) {
        console.log('[PageManager] Rendering page:', pageName);
        
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[PageManager] pageContent element not found');
            return;
        }

        const pageConfig = this.pages.get(pageName);
        let content = '';

        // Déléguer au module approprié ou gérer directement
        if (pageConfig.module) {
            content = await this.delegateToModule(pageConfig.module);
        } else {
            // Pages gérées directement (dashboard uniquement)
            switch (pageName) {
                case 'dashboard':
                    content = await this.renderDashboard();
                    break;
                default:
                    content = this.renderNotFound();
            }
        }

        pageContent.innerHTML = content;
        
        // Initialiser le module après le rendu
        if (pageConfig.module) {
            this.initializeModule(pageConfig.module);
        }
        
        // Initialiser les événements de la page
        this.initializePageEvents(pageName);
    }

    async delegateToModule(moduleName) {
        console.log('[PageManager] Delegating to module:', moduleName);
        
        const module = window[moduleName];
        
        if (!module) {
            console.error('[PageManager] Module not found:', moduleName);
            return `
                <div class="page-container">
                    <div style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2>Module non disponible</h2>
                        <p>Le module ${moduleName} n'est pas chargé.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="fas fa-refresh"></i>
                            Actualiser
                        </button>
                    </div>
                </div>
            `;
        }

        if (typeof module.render !== 'function') {
            console.error('[PageManager] Module missing render method:', moduleName);
            return `
                <div class="page-container">
                    <div style="text-align: center; padding: 60px 20px;">
                        <h2>Erreur de module</h2>
                        <p>Le module ${moduleName} ne peut pas être affiché.</p>
                    </div>
                </div>
            `;
        }

        try {
            return await module.render();
        } catch (error) {
            console.error('[PageManager] Error rendering module:', moduleName, error);
            return `
                <div class="page-container">
                    <div style="text-align: center; padding: 60px 20px;">
                        <h2>Erreur de rendu</h2>
                        <p>Impossible d'afficher le module ${moduleName}.</p>
                        <button onclick="window.pageManager.loadPage('dashboard')" class="btn btn-primary">
                            <i class="fas fa-home"></i>
                            Retour au dashboard
                        </button>
                    </div>
                </div>
            `;
        }
    }

    initializeModule(moduleName) {
        console.log('[PageManager] Initializing module:', moduleName);
        
        const module = window[moduleName];
        
        if (module && typeof module.init === 'function') {
            try {
                module.init();
                console.log('[PageManager] ✅ Module initialized:', moduleName);
            } catch (error) {
                console.error('[PageManager] Error initializing module:', moduleName, error);
            }
        }
    }

    // Dashboard géré directement par PageManager
    async renderDashboard() {
        console.log('[PageManager] Rendering dashboard...');
        
        const stats = await this.getRealStats();
        const user = window.APP_AUTHENTICATED_USER || window.authService?.getAccount();
        
        return `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">Bienvenue ${user?.displayName || user?.name || 'Utilisateur'}</h1>
                    <p class="page-subtitle">Votre tableau de bord EmailSortPro</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.totalEmails}</div>
                            <div class="stat-label">Emails analysés</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-envelope-open"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.unreadEmails}</div>
                            <div class="stat-label">Non lus</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tags"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.categories}</div>
                            <div class="stat-label">Catégories</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.tasks}</div>
                            <div class="stat-label">Tâches créées</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <div class="action-card" onclick="window.pageManager.loadPage('scanner')">
                        <div class="action-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 class="action-title">Scanner vos emails</h3>
                        <p class="action-description">Analysez et catégorisez vos emails automatiquement</p>
                        <button class="action-button">
                            <i class="fas fa-play"></i>
                            Démarrer
                        </button>
                    </div>
                    
                    <div class="action-card" onclick="window.pageManager.loadPage('emails')">
                        <div class="action-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3 class="action-title">Consulter vos emails</h3>
                        <p class="action-description">Voir vos emails triés par catégories</p>
                        <button class="action-button">
                            <i class="fas fa-eye"></i>
                            Voir
                        </button>
                    </div>
                    
                    <div class="action-card" onclick="window.pageManager.loadPage('tasks')">
                        <div class="action-icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <h3 class="action-title">Gérer vos tâches</h3>
                        <p class="action-description">Suivez les tâches créées depuis vos emails</p>
                        <button class="action-button">
                            <i class="fas fa-cog"></i>
                            Gérer
                        </button>
                    </div>
                </div>
                
                ${stats.recentActivity.length > 0 ? `
                    <div class="recent-activity">
                        <h2>Activité récente</h2>
                        <div class="activity-list">
                            ${stats.recentActivity.map(activity => `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="${activity.icon}"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-title">${activity.title}</div>
                                        <div class="activity-time">${activity.time}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <style>
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .stat-icon {
                    font-size: 2rem;
                    color: #667eea;
                    width: 50px;
                    text-align: center;
                }
                
                .stat-content {
                    flex: 1;
                }
                
                .stat-number {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .stat-label {
                    font-size: 0.9rem;
                    color: #6b7280;
                }
                
                .dashboard-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                    margin-top: 40px;
                }
                
                .action-card {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    border: 2px solid transparent;
                }
                
                .action-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-color: #667eea;
                }
                
                .action-icon {
                    font-size: 3.5rem;
                    margin-bottom: 20px;
                    color: #667eea;
                }
                
                .action-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 12px;
                }
                
                .action-description {
                    font-size: 0.95rem;
                    color: #6b7280;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                .action-button {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .action-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }
                
                .recent-activity {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    margin-top: 40px;
                }
                
                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                
                .activity-icon {
                    color: #667eea;
                    font-size: 1.2rem;
                }
                
                .activity-title {
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .activity-time {
                    font-size: 0.85rem;
                    color: #6b7280;
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                    }
                    
                    .dashboard-actions {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                    
                    .action-card {
                        padding: 24px;
                    }
                }
            </style>
        `;
    }

    renderAuthRequired() {
        return `
            <div class="page-container">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; color: #f59e0b; margin-bottom: 20px;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Authentification requise</h2>
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                    <button onclick="window.app.login()" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fab fa-microsoft"></i>
                        Se connecter
                    </button>
                </div>
            </div>
        `;
    }

    renderNotFound() {
        return `
            <div class="page-container">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; color: #6b7280; margin-bottom: 20px;">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <h2>Page non trouvée</h2>
                    <p>La page demandée n'existe pas.</p>
                    <button onclick="window.pageManager.loadPage('dashboard')" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-home"></i>
                        Retour au dashboard
                    </button>
                </div>
            </div>
        `;
    }

    // Vérifications et utilitaires
    isAuthenticated() {
        return window.authService?.isAuthenticated() && window.APP_REAL_MODE === true;
    }

    hasRealData() {
        if (window.emailScanner) {
            const emails = window.emailScanner.getAllEmails();
            if (emails.length === 0) return false;
            
            const demoEmails = emails.filter(e => e.isDemo || e.source === 'demo');
            return demoEmails.length === 0;
        }
        
        return false;
    }

    async ensureRealDataLoaded() {
        console.log('[PageManager] Ensuring real data is loaded...');
        
        try {
            if (window.mailService && this.isAuthenticated()) {
                const emails = await window.mailService.getEmails({ 
                    limit: 10, 
                    forceRefresh: true 
                });
                
                if (emails && emails.length > 0) {
                    const realEmails = emails.filter(e => !e.isDemo && e.source !== 'demo');
                    
                    if (realEmails.length > 0) {
                        if (window.emailScanner) {
                            window.emailScanner.setEmails(realEmails);
                        }
                        console.log('[PageManager] ✅ Real data loaded successfully');
                        return true;
                    }
                }
            }
            
            console.warn('[PageManager] Could not load real data');
            return false;
            
        } catch (error) {
            console.error('[PageManager] Error loading real data:', error);
            return false;
        }
    }

    async getRealStats() {
        const defaultStats = {
            totalEmails: 0,
            unreadEmails: 0,
            categories: 0,
            tasks: 0,
            recentActivity: []
        };

        try {
            // Emails
            if (window.emailScanner) {
                const emails = window.emailScanner.getAllEmails();
                const realEmails = emails.filter(e => !e.isDemo && e.source !== 'demo');
                
                defaultStats.totalEmails = realEmails.length;
                defaultStats.unreadEmails = realEmails.filter(e => !e.isRead).length;
                
                const categories = new Set(realEmails.map(e => e.category).filter(c => c));
                defaultStats.categories = categories.size;
            }
            
            // Tâches
            if (window.taskManager) {
                const tasks = window.taskManager.getAllTasks();
                defaultStats.tasks = tasks.length;
                
                const recentTasks = tasks
                    .filter(t => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                    .slice(0, 5);
                    
                defaultStats.recentActivity = recentTasks.map(task => ({
                    icon: 'fas fa-plus',
                    title: `Tâche créée: ${task.title}`,
                    time: this.formatDate(task.createdAt)
                }));
            }
            
            return defaultStats;
            
        } catch (error) {
            console.error('[PageManager] Error getting real stats:', error);
            return defaultStats;
        }
    }

    formatDate(date) {
        if (!date) return 'Date inconnue';
        
        const d = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hier';
        if (diffDays <= 7) return `Il y a ${diffDays} jours`;
        
        return d.toLocaleDateString('fr-FR');
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }

    initializePageEvents(pageName) {
        console.log('[PageManager] Initializing events for page:', pageName);
        
        // Événements spécifiques selon la page
        switch (pageName) {
            case 'dashboard':
                this.initializeDashboardEvents();
                break;
        }
    }

    initializeDashboardEvents() {
        // Ajouter des événements spécifiques au dashboard si nécessaire
        console.log('[PageManager] Dashboard events initialized');
    }

    showAuthRequired() {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = this.renderAuthRequired();
        }
    }

    // Méthodes publiques pour les actions
    async refreshEmails() {
        console.log('[PageManager] Refreshing emails...');
        
        if (window.uiManager) {
            window.uiManager.showToast('Actualisation des emails...', 'info');
        }
        
        try {
            if (window.mailService) {
                await window.mailService.enableRealMode();
                const emails = await window.mailService.getEmails({ forceRefresh: true });
                
                if (window.emailScanner) {
                    window.emailScanner.setEmails(emails);
                }
            }
            
            // Recharger la page emails si c'est la page actuelle
            if (this.currentPage === 'emails') {
                await this.loadPage('emails');
            }
            
            if (window.uiManager) {
                window.uiManager.showToast('Emails actualisés', 'success');
            }
            
        } catch (error) {
            console.error('[PageManager] Error refreshing emails:', error);
            
            if (window.uiManager) {
                window.uiManager.showToast('Erreur lors de l\'actualisation', 'error');
            }
        }
    }

    async refreshAllData() {
        console.log('[PageManager] Refreshing all data...');
        
        if (window.uiManager) {
            window.uiManager.showToast('Actualisation de toutes les données...', 'info');
        }
        
        try {
            // Forcer le mode réel
            if (window.forceRealMode) {
                window.forceRealMode();
            }
            
            // Actualiser les emails
            await this.refreshEmails();
            
            // Recharger la page actuelle
            await this.loadPage(this.currentPage);
            
            if (window.uiManager) {
                window.uiManager.showToast('Toutes les données actualisées', 'success');
            }
            
        } catch (error) {
            console.error('[PageManager] Error refreshing all data:', error);
            
            if (window.uiManager) {
                window.uiManager.showToast('Erreur lors de l\'actualisation complète', 'error');
            }
        }
    }

    // Méthodes pour les modules
    getAvailableModules() {
        const modules = {};
        
        this.pages.forEach((config, pageName) => {
            if (config.module) {
                modules[pageName] = {
                    module: config.module,
                    available: !!window[config.module],
                    hasRender: window[config.module] && typeof window[config.module].render === 'function',
                    hasInit: window[config.module] && typeof window[config.module].init === 'function'
                };
            }
        });
        
        return modules;
    }

    // Diagnostic
    getStatus() {
        return {
            currentPage: this.currentPage,
            isLoading: this.isLoading,
            loadedPages: Array.from(this.loadedPages),
            realDataOnly: this.realDataOnly,
            isAuthenticated: this.isAuthenticated(),
            hasRealData: this.hasRealData(),
            availableModules: this.getAvailableModules(),
            pageConfigs: Object.fromEntries(this.pages)
        };
    }
}

// Créer l'instance globale
try {
    window.pageManager = new PageManager();
    console.log('[PageManager] ✅ Global instance created successfully');
} catch (error) {
    console.error('[PageManager] ❌ Failed to create global instance:', error);
    
    // Instance de fallback
    window.pageManager = {
        currentPage: 'dashboard',
        loadPage: (page) => {
            console.error('[PageManager] Service not available, cannot load page:', page);
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                pageContent.innerHTML = `
                    <div class="page-container">
                        <div style="text-align: center; padding: 60px 20px;">
                            <h2>Erreur de chargement</h2>
                            <p>Le gestionnaire de pages n'est pas disponible.</p>
                            <button onclick="location.reload()" class="btn btn-primary">Actualiser</button>
                        </div>
                    </div>
                `;
            }
        },
        getStatus: () => ({ error: 'PageManager failed to initialize: ' + error.message })
    };
}

// Fonction de diagnostic pour les modules
window.diagnosePageModules = function() {
    console.group('🔍 DIAGNOSTIC PAGE MODULES v11.2');
    
    try {
        if (window.pageManager && typeof window.pageManager.getStatus === 'function') {
            const status = window.pageManager.getStatus();
            console.log('📊 PageManager Status:', status);
            
            console.log('\n📦 Modules disponibles:');
            Object.entries(status.availableModules).forEach(([page, moduleInfo]) => {
                const status = moduleInfo.available && moduleInfo.hasRender ? '✅' : '❌';
                console.log(`  ${status} ${page}: ${moduleInfo.module}`);
                if (!moduleInfo.available) {
                    console.log(`    ❌ Module ${moduleInfo.module} non trouvé`);
                } else if (!moduleInfo.hasRender) {
                    console.log(`    ❌ Méthode render() manquante`);
                }
            });
            
            console.log('\n🏠 Pages configurées:');
            Object.entries(status.pageConfigs).forEach(([page, config]) => {
                console.log(`  📄 ${page}: ${config.title} (${config.module || 'direct'})`);
            });
            
            return status;
        } else {
            console.error('❌ PageManager not available');
            return { error: 'PageManager not available' };
        }
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ PageManager v11.2 loaded - Module delegation system');
console.log('🔍 Use diagnosePageModules() for detailed module diagnostic');
