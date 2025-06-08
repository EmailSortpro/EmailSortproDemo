// PageManager.js - Gestionnaire de pages CORRIGÉ sans mode démo v11.1

class PageManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.isLoading = false;
        this.pages = new Map();
        this.loadedPages = new Set();
        this.realDataOnly = true; // CORRECTION: Forcer l'utilisation de données réelles uniquement
        
        console.log('[PageManager] Initialized v11.1 - REAL DATA ONLY MODE');
        this.initializePages();
    }

    initializePages() {
        // Configuration des pages SANS contenu de démo
        this.pages.set('dashboard', {
            title: 'Dashboard',
            component: 'dashboard',
            requiresAuth: true,
            requiresRealData: true // CORRECTION: Exiger des données réelles
        });
        
        this.pages.set('scanner', {
            title: 'Scanner',
            component: 'scanner',
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('emails', {
            title: 'Emails',
            component: 'emails',
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('tasks', {
            title: 'Tâches',
            component: 'tasks',
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('ranger', {
            title: 'Ranger',
            component: 'ranger',
            requiresAuth: true,
            requiresRealData: true
        });
        
        this.pages.set('settings', {
            title: 'Paramètres',
            component: 'settings',
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
        
        // CORRECTION: Vérifier l'authentification et les données réelles
        if (pageConfig.requiresAuth && !this.isAuthenticated()) {
            console.warn('[PageManager] Page requires authentication:', pageName);
            this.showAuthRequired();
            return;
        }

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

    // CORRECTION: Vérification de l'authentification
    isAuthenticated() {
        return window.authService?.isAuthenticated() && window.APP_REAL_MODE === true;
    }

    // CORRECTION: Vérification des données réelles
    hasRealData() {
        // Vérifier si nous avons des emails réels
        if (window.emailScanner) {
            const emails = window.emailScanner.getAllEmails();
            if (emails.length === 0) return false;
            
            // Vérifier qu'il n'y a pas d'emails de démo
            const demoEmails = emails.filter(e => e.isDemo || e.source === 'demo');
            return demoEmails.length === 0;
        }
        
        return false;
    }

    // CORRECTION: S'assurer que les données réelles sont chargées
    async ensureRealDataLoaded() {
        console.log('[PageManager] Ensuring real data is loaded...');
        
        try {
            if (window.mailService && this.isAuthenticated()) {
                // Forcer le chargement des emails réels
                const emails = await window.mailService.getEmails({ 
                    limit: 10, 
                    forceRefresh: true 
                });
                
                if (emails && emails.length > 0) {
                    // Vérifier que ce ne sont pas des emails de démo
                    const realEmails = emails.filter(e => !e.isDemo && e.source !== 'demo');
                    
                    if (realEmails.length > 0) {
                        // Mettre à jour EmailScanner avec les emails réels
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

    async renderPage(pageName) {
        console.log('[PageManager] Rendering page:', pageName);
        
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[PageManager] pageContent element not found');
            return;
        }

        let content = '';

        switch (pageName) {
            case 'dashboard':
                content = await this.renderDashboard();
                break;
            case 'scanner':
                content = await this.renderScanner();
                break;
            case 'emails':
                content = await this.renderEmails();
                break;
            case 'tasks':
                content = await this.renderTasks();
                break;
            case 'ranger':
                content = await this.renderRanger();
                break;
            case 'settings':
                content = await this.renderSettings();
                break;
            default:
                content = this.renderNotFound();
        }

        pageContent.innerHTML = content;
        
        // Initialiser les événements de la page
        this.initializePageEvents(pageName);
    }

    // CORRECTION: Dashboard avec données réelles uniquement
    async renderDashboard() {
        console.log('[PageManager] Rendering dashboard with REAL data...');
        
        // Récupérer les vraies statistiques
        const stats = await this.getRealStats();
        const user = window.APP_AUTHENTICATED_USER || window.authService?.getAccount();
        
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1>Bienvenue ${user?.displayName || user?.name || 'Utilisateur'}</h1>
                    <p class="dashboard-subtitle">Votre tableau de bord EmailSortPro</p>
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
        `;
    }

    // CORRECTION: Scanner avec gestion d'authentification
    async renderScanner() {
        console.log('[PageManager] Rendering scanner...');
        
        if (!this.isAuthenticated()) {
            return this.renderAuthRequired();
        }
        
        // Utiliser le module de scan
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            return window.minimalScanModule.render();
        }
        
        // Fallback si le module n'est pas disponible
        return `
            <div class="scanner-page">
                <div class="scanner-container">
                    <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                    <p>Le module de scan n'est pas disponible. Veuillez actualiser la page.</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="fas fa-refresh"></i>
                        Actualiser
                    </button>
                </div>
            </div>
        `;
    }

    // CORRECTION: Emails avec données réelles uniquement
    async renderEmails() {
        console.log('[PageManager] Rendering emails with REAL data...');
        
        if (!this.isAuthenticated()) {
            return this.renderAuthRequired();
        }
        
        const emails = await this.getRealEmails();
        
        if (emails.length === 0) {
            return `
                <div class="emails-page">
                    <div class="emails-header">
                        <h1><i class="fas fa-inbox"></i> Vos emails</h1>
                        <div class="emails-actions">
                            <button onclick="window.pageManager.refreshEmails()" class="btn btn-primary">
                                <i class="fas fa-sync"></i>
                                Actualiser
                            </button>
                            <button onclick="window.pageManager.loadPage('scanner')" class="btn btn-secondary">
                                <i class="fas fa-search"></i>
                                Scanner
                            </button>
                        </div>
                    </div>
                    
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h2>Aucun email trouvé</h2>
                        <p>Commencez par scanner vos emails pour les voir apparaître ici.</p>
                        <button onclick="window.pageManager.loadPage('scanner')" class="btn btn-primary">
                            <i class="fas fa-search"></i>
                            Scanner mes emails
                        </button>
                    </div>
                </div>
            `;
        }

        // Grouper par catégories
        const emailsByCategory = this.groupEmailsByCategory(emails);
        
        return `
            <div class="emails-page">
                <div class="emails-header">
                    <h1><i class="fas fa-inbox"></i> Vos emails (${emails.length})</h1>
                    <div class="emails-actions">
                        <button onclick="window.pageManager.refreshEmails()" class="btn btn-primary">
                            <i class="fas fa-sync"></i>
                            Actualiser
                        </button>
                        <button onclick="window.pageManager.loadPage('scanner')" class="btn btn-secondary">
                            <i class="fas fa-search"></i>
                            Nouveau scan
                        </button>
                    </div>
                </div>
                
                <div class="emails-content">
                    ${Object.entries(emailsByCategory).map(([category, categoryEmails]) => `
                        <div class="category-section">
                            <h2 class="category-title">
                                <i class="fas fa-folder"></i>
                                ${category} (${categoryEmails.length})
                            </h2>
                            <div class="emails-list">
                                ${categoryEmails.slice(0, 10).map(email => `
                                    <div class="email-item ${email.isRead ? 'read' : 'unread'}">
                                        <div class="email-sender">
                                            <strong>${email.from?.name || email.from?.address || 'Inconnu'}</strong>
                                        </div>
                                        <div class="email-subject">${email.subject || '(Sans objet)'}</div>
                                        <div class="email-preview">${email.bodyPreview || email.body?.substring(0, 100) || ''}</div>
                                        <div class="email-date">${this.formatDate(email.date)}</div>
                                        <div class="email-actions">
                                            <button onclick="window.pageManager.viewEmail('${email.id}')" class="btn-small">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            ${window.taskManager ? `
                                                <button onclick="window.taskManager.createTaskFromEmail('${email.id}')" class="btn-small">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                ${categoryEmails.length > 10 ? `
                                    <div class="load-more">
                                        <button onclick="window.pageManager.loadMoreEmails('${category}')" class="btn btn-outline">
                                            Voir plus (${categoryEmails.length - 10} restants)
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // CORRECTION: Tâches avec données réelles
    async renderTasks() {
        console.log('[PageManager] Rendering tasks...');
        
        if (!window.taskManager) {
            return `
                <div class="tasks-page">
                    <div class="error-message">
                        <h2>Gestionnaire de tâches non disponible</h2>
                        <p>Veuillez actualiser la page.</p>
                        <button onclick="location.reload()" class="btn btn-primary">Actualiser</button>
                    </div>
                </div>
            `;
        }
        
        const tasks = window.taskManager.getAllTasks();
        
        return `
            <div class="tasks-page">
                <div class="tasks-header">
                    <h1><i class="fas fa-tasks"></i> Vos tâches (${tasks.length})</h1>
                    <div class="tasks-actions">
                        <button onclick="window.taskManager.showCreateTaskModal()" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Nouvelle tâche
                        </button>
                    </div>
                </div>
                
                <div class="tasks-content">
                    ${tasks.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <h2>Aucune tâche</h2>
                            <p>Créez votre première tâche ou générez-en depuis vos emails.</p>
                            <div class="empty-actions">
                                <button onclick="window.taskManager.showCreateTaskModal()" class="btn btn-primary">
                                    <i class="fas fa-plus"></i>
                                    Créer une tâche
                                </button>
                                <button onclick="window.pageManager.loadPage('emails')" class="btn btn-secondary">
                                    <i class="fas fa-inbox"></i>
                                    Voir mes emails
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="tasks-list">
                            ${tasks.map(task => `
                                <div class="task-item ${task.completed ? 'completed' : ''}">
                                    <div class="task-checkbox">
                                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                               onchange="window.taskManager.toggleTaskCompletion('${task.id}')">
                                    </div>
                                    <div class="task-content">
                                        <div class="task-title">${task.title}</div>
                                        <div class="task-description">${task.description || ''}</div>
                                        ${task.emailSubject ? `
                                            <div class="task-email">
                                                <i class="fas fa-envelope"></i>
                                                ${task.emailSubject}
                                            </div>
                                        ` : ''}
                                        <div class="task-meta">
                                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                            <span class="task-date">${this.formatDate(task.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <button onclick="window.taskManager.editTask('${task.id}')" class="btn-small">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="window.taskManager.deleteTask('${task.id}')" class="btn-small btn-danger">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // Ranger - page simple pour organiser
    async renderRanger() {
        return `
            <div class="ranger-page">
                <div class="ranger-header">
                    <h1><i class="fas fa-folder-tree"></i> Ranger vos emails</h1>
                    <p>Organisez automatiquement vos emails par dossiers</p>
                </div>
                
                <div class="ranger-content">
                    <div class="coming-soon">
                        <div class="coming-soon-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <h2>Fonctionnalité en développement</h2>
                        <p>La fonction de rangement automatique sera bientôt disponible.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Paramètres
    async renderSettings() {
        const user = window.APP_AUTHENTICATED_USER || window.authService?.getAccount();
        
        return `
            <div class="settings-page">
                <div class="settings-header">
                    <h1><i class="fas fa-cog"></i> Paramètres</h1>
                </div>
                
                <div class="settings-content">
                    <div class="settings-section">
                        <h2>Compte</h2>
                        <div class="setting-item">
                            <label>Utilisateur connecté</label>
                            <div class="setting-value">${user?.displayName || user?.name || user?.username || 'Inconnu'}</div>
                        </div>
                        <div class="setting-item">
                            <label>Email</label>
                            <div class="setting-value">${user?.mail || user?.username || 'Inconnu'}</div>
                        </div>
                        <div class="setting-actions">
                            <button onclick="window.app.logout()" class="btn btn-danger">
                                <i class="fas fa-sign-out-alt"></i>
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h2>Données</h2>
                        <div class="setting-item">
                            <label>Mode</label>
                            <div class="setting-value">
                                <span class="badge badge-success">
                                    <i class="fas fa-check"></i>
                                    Mode réel activé
                                </span>
                            </div>
                        </div>
                        <div class="setting-actions">
                            <button onclick="window.pageManager.refreshAllData()" class="btn btn-primary">
                                <i class="fas fa-sync"></i>
                                Actualiser les données
                            </button>
                            <button onclick="window.emergencyReset()" class="btn btn-outline">
                                <i class="fas fa-undo"></i>
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAuthRequired() {
        return `
            <div class="auth-required">
                <div class="auth-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2>Authentification requise</h2>
                <p>Vous devez être connecté pour accéder à cette page.</p>
                <button onclick="window.app.login()" class="btn btn-primary">
                    <i class="fab fa-microsoft"></i>
                    Se connecter
                </button>
            </div>
        `;
    }

    renderNotFound() {
        return `
            <div class="not-found">
                <div class="not-found-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h2>Page non trouvée</h2>
                <p>La page demandée n'existe pas.</p>
                <button onclick="window.pageManager.loadPage('dashboard')" class="btn btn-primary">
                    <i class="fas fa-home"></i>
                    Retour au dashboard
                </button>
            </div>
        `;
    }

    // CORRECTION: Récupération des vraies statistiques
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
                
                // Compter les catégories uniques
                const categories = new Set(realEmails.map(e => e.category).filter(c => c));
                defaultStats.categories = categories.size;
            }
            
            // Tâches
            if (window.taskManager) {
                const tasks = window.taskManager.getAllTasks();
                defaultStats.tasks = tasks.length;
                
                // Activité récente des tâches
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

    // CORRECTION: Récupération des vrais emails
    async getRealEmails() {
        try {
            if (window.emailScanner) {
                const emails = window.emailScanner.getAllEmails();
                return emails.filter(e => !e.isDemo && e.source !== 'demo');
            }
            
            if (window.mailService) {
                const emails = await window.mailService.getEmails({ limit: 50 });
                return emails.filter(e => !e.isDemo && e.source !== 'demo');
            }
            
            return [];
            
        } catch (error) {
            console.error('[PageManager] Error getting real emails:', error);
            return [];
        }
    }

    groupEmailsByCategory(emails) {
        const grouped = {};
        
        emails.forEach(email => {
            const category = email.category || 'Non catégorisé';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(email);
        });
        
        return grouped;
    }

    // Méthodes utilitaires
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
        // Réinitialiser les événements spécifiques à chaque page
        console.log('[PageManager] Initializing events for page:', pageName);
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
            
            // Recharger la page emails
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

    viewEmail(emailId) {
        console.log('[PageManager] Viewing email:', emailId);
        // TODO: Implémenter la vue détail email
        if (window.uiManager) {
            window.uiManager.showToast('Vue détaillée - Bientôt disponible', 'info');
        }
    }

    loadMoreEmails(category) {
        console.log('[PageManager] Loading more emails for category:', category);
        // TODO: Implémenter le chargement progressif
        if (window.uiManager) {
            window.uiManager.showToast('Chargement progressif - Bientôt disponible', 'info');
        }
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
            document.getElementById('pageContent').innerHTML = `
                <div class="error-message">
                    <h2>Erreur de chargement</h2>
                    <p>Le gestionnaire de pages n'est pas disponible.</p>
                    <button onclick="location.reload()">Actualiser</button>
                </div>
            `;
        }
    };
}

console.log('✅ PageManager v11.1 loaded - NO DEMO MODE - REAL DATA ONLY');
