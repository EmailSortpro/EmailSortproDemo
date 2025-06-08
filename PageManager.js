// PageManager.js - Version 12.0 - CORRECTION BOUCLE DASHBOARD

class PageManager {
    constructor() {
        // Core state
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.temporaryEmailStorage = [];
        this.lastScanData = null;
        this.isLoading = false; // CRITIQUE: éviter les boucles
        
        // Page renderers
        this.pages = {
            dashboard: (container) => this.renderDashboard(container),
            scanner: (container) => this.renderScanner(container),
            emails: (container) => this.renderEmails(container),
            tasks: (container) => this.renderTasks(container),
            categories: (container) => this.renderCategories(container),
            settings: (container) => this.renderSettings(container),
            ranger: (container) => this.renderRanger(container)
        };
        
        this.init();
    }

    init() {
        console.log('[PageManager] Initialized v12.0 - Correction boucle dashboard');
        this.setupNavigationHandlers();
    }

    setupNavigationHandlers() {
        // Event delegation pour éviter les fuites mémoire
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.loadPage(navItem.dataset.page);
            }
        });
    }

    // =====================================
    // PAGE LOADING - CORRIGÉ
    // =====================================
    async loadPage(pageName) {
        // Éviter les rechargements inutiles
        if (this.isLoading || this.currentPage === pageName) {
            console.log(`[PageManager] Page ${pageName} already loaded or loading`);
            return;
        }

        console.log(`[PageManager] Loading page: ${pageName}`);
        this.isLoading = true;

        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[PageManager] Page content container not found');
            this.isLoading = false;
            return;
        }

        try {
            // Mettre à jour la navigation AVANT le chargement
            this.updateNavigation(pageName);
            
            // Afficher le loading seulement si nécessaire
            if (window.uiManager && typeof window.uiManager.showLoading === 'function') {
                window.uiManager.showLoading(`Chargement ${pageName}...`);
            }

            // Vider le contenu précédent
            pageContent.innerHTML = '';
            
            // Charger la page
            if (this.pages[pageName]) {
                await this.pages[pageName](pageContent);
                this.currentPage = pageName;
                console.log(`[PageManager] ✅ Page ${pageName} loaded successfully`);
            } else {
                throw new Error(`Page ${pageName} not found`);
            }

        } catch (error) {
            console.error(`[PageManager] Error loading page ${pageName}:`, error);
            this.showErrorPage(pageContent, error);
        } finally {
            // Toujours cacher le loading et déverrouiller
            if (window.uiManager && typeof window.uiManager.hideLoading === 'function') {
                window.uiManager.hideLoading();
            }
            this.isLoading = false;
        }
    }

    showErrorPage(container, error) {
        container.innerHTML = `
            <div class="error-page">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="error-title">Erreur de chargement</h3>
                <p class="error-message">${error.message}</p>
                <button class="btn btn-primary" onclick="window.pageManager.loadPage('dashboard')">
                    <i class="fas fa-home"></i> Retour au tableau de bord
                </button>
            </div>
        `;
        this.addErrorStyles();
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // =====================================
    // DASHBOARD - SIMPLIFIÉ
    // =====================================
    async renderDashboard(container) {
        console.log('[PageManager] Rendering dashboard...');
        
        const taskStats = this.getTaskStats();
        const emailStats = this.getEmailStats();
        const scanData = this.lastScanData;
        
        container.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1 class="dashboard-title">Tableau de bord</h1>
                    <p class="dashboard-subtitle">Vue d'ensemble de votre gestion d'emails</p>
                </div>

                <div class="dashboard-stats">
                    ${this.createStatsCards(taskStats, emailStats)}
                </div>

                <div class="dashboard-actions">
                    ${this.createActionCards()}
                </div>

                ${scanData ? this.createScanSummary(scanData) : this.createWelcomeMessage()}
            </div>
        `;

        this.addDashboardStyles();
    }

    getTaskStats() {
        if (window.taskManager && typeof window.taskManager.getStats === 'function') {
            return window.taskManager.getStats();
        }
        return {
            total: 0,
            byStatus: { todo: 0, 'in-progress': 0, completed: 0 },
            overdue: 0
        };
    }

    getEmailStats() {
        const emails = window.emailScanner?.getAllEmails() || this.temporaryEmailStorage || [];
        return {
            total: emails.length,
            categorized: emails.filter(e => e.category && e.category !== 'other').length,
            withTasks: this.createdTasks.size
        };
    }

    createStatsCards(taskStats, emailStats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${emailStats.total}</div>
                        <div class="stat-label">Emails analysés</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${taskStats.total}</div>
                        <div class="stat-label">Tâches créées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${taskStats.byStatus.completed}</div>
                        <div class="stat-label">Tâches terminées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tag"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${emailStats.categorized}</div>
                        <div class="stat-label">Emails catégorisés</div>
                    </div>
                </div>
            </div>
        `;
    }

    createActionCards() {
        return `
            <div class="actions-grid">
                <div class="action-card" onclick="window.pageManager.loadPage('scanner')">
                    <div class="action-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="action-title">Scanner des emails</h3>
                    <p class="action-description">Analysez et catégorisez vos emails automatiquement</p>
                </div>
                
                <div class="action-card" onclick="window.pageManager.loadPage('emails')">
                    <div class="action-icon">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h3 class="action-title">Voir les emails</h3>
                    <p class="action-description">Consultez vos emails catégorisés</p>
                </div>
                
                <div class="action-card" onclick="window.pageManager.loadPage('tasks')">
                    <div class="action-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h3 class="action-title">Gérer les tâches</h3>
                    <p class="action-description">Suivez vos tâches créées depuis vos emails</p>
                </div>
                
                <div class="action-card" onclick="window.pageManager.loadPage('settings')">
                    <div class="action-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <h3 class="action-title">Paramètres</h3>
                    <p class="action-description">Configurez vos catégories et préférences</p>
                </div>
            </div>
        `;
    }

    createWelcomeMessage() {
        return `
            <div class="welcome-card">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2 class="welcome-title">Commencez votre organisation</h2>
                    <p class="welcome-text">
                        Scannez vos emails pour découvrir les fonctionnalités d'EmailSortPro
                    </p>
                    <button class="btn btn-primary btn-large" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i> Démarrer le scan
                    </button>
                </div>
            </div>
        `;
    }

    createScanSummary(scanData) {
        return `
            <div class="scan-summary">
                <h3 class="scan-title">Dernier scan effectué</h3>
                <div class="scan-stats">
                    <div class="scan-stat">
                        <span class="scan-number">${scanData.total || 0}</span>
                        <span class="scan-label">emails analysés</span>
                    </div>
                    <div class="scan-stat">
                        <span class="scan-number">${scanData.categorized || 0}</span>
                        <span class="scan-label">catégorisés</span>
                    </div>
                    <div class="scan-stat">
                        <span class="scan-number">${scanData.tasksCreated || 0}</span>
                        <span class="scan-label">tâches créées</span>
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================
    // AUTRES PAGES - SIMPLIFIÉES
    // =====================================
    async renderScanner(container) {
        console.log('[PageManager] Rendering scanner page...');
        
        // Essayer d'utiliser le module de scan s'il existe
        if (window.scanStartModule && typeof window.scanStartModule.render === 'function') {
            try {
                await window.scanStartModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] ScanStartModule error:', error);
            }
        }
        
        // Interface de scan de base
        container.innerHTML = `
            <div class="scanner-container">
                <div class="scanner-header">
                    <h1 class="scanner-title">Scanner d'emails</h1>
                    <p class="scanner-subtitle">Analysez vos emails Outlook automatiquement</p>
                </div>
                
                <div class="scanner-card">
                    <div class="scanner-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Scanner vos emails</h3>
                    <p>Connectez-vous à votre compte Outlook pour analyser vos emails</p>
                    <button class="btn btn-primary" onclick="this.innerHTML='<i class=&quot;fas fa-spinner fa-spin&quot;></i> Scan en cours...'; this.disabled=true;">
                        <i class="fas fa-play"></i> Démarrer le scan
                    </button>
                </div>
            </div>
        `;
        
        this.addScannerStyles();
    }

    async renderEmails(container) {
        console.log('[PageManager] Rendering emails page...');
        
        const emails = window.emailScanner?.getAllEmails() || this.temporaryEmailStorage || [];
        
        if (emails.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h3 class="empty-title">Aucun email</h3>
                    <p class="empty-text">Scannez d'abord vos emails pour les voir ici</p>
                    <button class="btn btn-primary" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i> Scanner des emails
                    </button>
                </div>
            `;
            return;
        }

        // Interface emails simplifiée
        container.innerHTML = `
            <div class="emails-container">
                <div class="emails-header">
                    <h1 class="emails-title">Emails (${emails.length})</h1>
                    <div class="emails-actions">
                        <button class="btn btn-secondary" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i> Actualiser
                        </button>
                    </div>
                </div>
                
                <div class="emails-list">
                    ${emails.slice(0, 50).map(email => this.renderEmailCard(email)).join('')}
                </div>
                
                ${emails.length > 50 ? `
                    <div class="emails-more">
                        <p>Affichage de 50 emails sur ${emails.length}</p>
                        <button class="btn btn-outline">Voir plus</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.addEmailsStyles();
    }

    renderEmailCard(email) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const hasTask = this.createdTasks.has(email.id);
        
        return `
            <div class="email-card ${hasTask ? 'has-task' : ''}" data-email-id="${email.id}">
                <div class="email-avatar">
                    ${senderName.charAt(0).toUpperCase()}
                </div>
                <div class="email-content">
                    <div class="email-header">
                        <span class="email-sender">${senderName}</span>
                        <span class="email-date">${this.formatDate(email.receivedDateTime)}</span>
                    </div>
                    <div class="email-subject">${email.subject || 'Sans sujet'}</div>
                    <div class="email-preview">${(email.bodyPreview || '').substring(0, 100)}...</div>
                </div>
                <div class="email-actions">
                    ${!hasTask ? `
                        <button class="btn btn-sm" onclick="window.pageManager.createTaskFromEmail('${email.id}')">
                            <i class="fas fa-tasks"></i>
                        </button>
                    ` : `
                        <span class="task-badge">
                            <i class="fas fa-check"></i> Tâche
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    async renderTasks(container) {
        console.log('[PageManager] Rendering tasks page...');
        
        if (window.tasksView && typeof window.tasksView.render === 'function') {
            try {
                window.tasksView.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] TasksView error:', error);
            }
        }
        
        // Interface tâches de base
        const tasks = this.getAllTasks();
        
        container.innerHTML = `
            <div class="tasks-container">
                <div class="tasks-header">
                    <h1 class="tasks-title">Tâches (${tasks.length})</h1>
                </div>
                
                ${tasks.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 class="empty-title">Aucune tâche</h3>
                        <p class="empty-text">Créez des tâches à partir de vos emails</p>
                        <button class="btn btn-primary" onclick="window.pageManager.loadPage('emails')">
                            <i class="fas fa-inbox"></i> Voir les emails
                        </button>
                    </div>
                ` : `
                    <div class="tasks-list">
                        ${tasks.map(task => this.renderTaskCard(task)).join('')}
                    </div>
                `}
            </div>
        `;
        
        this.addTasksStyles();
    }

    async renderCategories(container) {
        console.log('[PageManager] Rendering categories page...');
        
        const categories = window.categoryManager?.getCategories() || {};
        
        container.innerHTML = `
            <div class="categories-container">
                <div class="categories-header">
                    <h1 class="categories-title">Catégories</h1>
                </div>
                
                <div class="categories-grid">
                    ${Object.entries(categories).map(([id, cat]) => `
                        <div class="category-card">
                            <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                                ${cat.icon}
                            </div>
                            <h3 class="category-name">${cat.name}</h3>
                            <p class="category-description">${cat.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.addCategoriesStyles();
    }

    async renderSettings(container) {
        console.log('[PageManager] Rendering settings page...');
        
        container.innerHTML = `
            <div class="settings-container">
                <div class="settings-header">
                    <h1 class="settings-title">Paramètres</h1>
                </div>
                
                <div class="settings-card">
                    <h3>Configuration IA</h3>
                    <p>Configurez Claude AI pour analyser vos emails automatiquement</p>
                    <button class="btn btn-primary" onclick="window.aiTaskAnalyzer?.showConfigurationModal()">
                        <i class="fas fa-cog"></i> Configurer Claude AI
                    </button>
                </div>
                
                <div class="settings-card">
                    <h3>Catégories</h3>
                    <p>Gérez vos catégories d'emails</p>
                    <button class="btn btn-secondary" onclick="window.pageManager.loadPage('categories')">
                        <i class="fas fa-tags"></i> Gérer les catégories
                    </button>
                </div>
            </div>
        `;
        
        this.addSettingsStyles();
    }

    async renderRanger(container) {
        console.log('[PageManager] Rendering ranger page...');
        
        container.innerHTML = `
            <div class="ranger-container">
                <div class="ranger-header">
                    <h1 class="ranger-title">Ranger par domaine</h1>
                    <p class="ranger-subtitle">Organisez vos emails par expéditeur</p>
                </div>
                
                <div class="ranger-card">
                    <div class="ranger-icon">
                        <i class="fas fa-folder-tree"></i>
                    </div>
                    <h3>Organisation automatique</h3>
                    <p>Triez vos emails par domaine d'expéditeur</p>
                    <button class="btn btn-primary">
                        <i class="fas fa-magic"></i> Organiser automatiquement
                    </button>
                </div>
            </div>
        `;
        
        this.addRangerStyles();
    }

    // =====================================
    // UTILITY METHODS
    // =====================================
    getAllTasks() {
        if (window.taskManager && typeof window.taskManager.getAllTasks === 'function') {
            return window.taskManager.getAllTasks();
        }
        return [];
    }

    renderTaskCard(task) {
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-content">
                    <h4 class="task-title">${task.title}</h4>
                    <p class="task-description">${task.description || ''}</p>
                </div>
                <div class="task-meta">
                    <span class="task-status ${task.status}">${task.status}</span>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // Moins de 24h
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 604800000) { // Moins d'une semaine
            return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    }

    async refreshEmails() {
        if (window.uiManager) {
            window.uiManager.showToast('Actualisation des emails...', 'info');
        }
        
        // Force reload de la page emails
        this.currentPage = null;
        await this.loadPage('emails');
    }

    async createTaskFromEmail(emailId) {
        console.log('[PageManager] Creating task from email:', emailId);
        
        if (window.uiManager) {
            window.uiManager.showToast('Création de tâche...', 'info');
        }
        
        // Logique simplifiée de création de tâche
        this.createdTasks.add(emailId);
        
        if (window.uiManager) {
            window.uiManager.showToast('Tâche créée avec succès', 'success');
        }
        
        // Rafraîchir l'affichage
        await this.refreshEmails();
    }

    // =====================================
    // STYLES - OPTIMISÉS
    // =====================================
    addDashboardStyles() {
        if (document.getElementById('dashboardStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'dashboardStyles';
        styles.textContent = `
            .dashboard-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
            .dashboard-header { text-align: center; margin-bottom: 40px; }
            .dashboard-title { font-size: 2.5rem; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
            .dashboard-subtitle { font-size: 1.1rem; color: #6b7280; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .stat-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
            .stat-icon { width: 48px; height: 48px; background: #667eea; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
            .stat-number { font-size: 2rem; font-weight: 700; color: #1f2937; }
            .stat-label { color: #6b7280; font-size: 14px; }
            
            .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .action-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s ease; text-align: center; }
            .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .action-icon { font-size: 3rem; color: #667eea; margin-bottom: 16px; }
            .action-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #1f2937; }
            .action-description { color: #6b7280; font-size: 14px; line-height: 1.5; }
            
            .welcome-card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .welcome-icon { font-size: 4rem; color: #667eea; margin-bottom: 24px; }
            .welcome-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; color: #1f2937; }
            .welcome-text { color: #6b7280; margin-bottom: 32px; line-height: 1.5; }
            
            .scan-summary { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .scan-title { font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
            .scan-stats { display: flex; gap: 32px; }
            .scan-stat { text-align: center; }
            .scan-number { display: block; font-size: 1.8rem; font-weight: 700; color: #667eea; }
            .scan-label { color: #6b7280; font-size: 14px; }
            
            .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; text-decoration: none; }
            .btn-primary { background: #667eea; color: white; }
            .btn-primary:hover { background: #5a67d8; transform: translateY(-1px); }
            .btn-large { padding: 16px 32px; font-size: 1.1rem; }
        `;
        document.head.appendChild(styles);
    }

    addErrorStyles() {
        if (document.getElementById('errorStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'errorStyles';
        styles.textContent = `
            .error-page { text-align: center; padding: 60px 20px; }
            .error-icon { font-size: 4rem; color: #ef4444; margin-bottom: 24px; }
            .error-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; color: #1f2937; }
            .error-message { color: #6b7280; margin-bottom: 32px; }
        `;
        document.head.appendChild(styles);
    }

    addScannerStyles() {
        if (document.getElementById('scannerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scannerStyles';
        styles.textContent = `
            .scanner-container { padding: 20px; max-width: 800px; margin: 0 auto; }
            .scanner-header { text-align: center; margin-bottom: 40px; }
            .scanner-title { font-size: 2.5rem; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
            .scanner-subtitle { font-size: 1.1rem; color: #6b7280; }
            .scanner-card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .scanner-icon { font-size: 4rem; color: #667eea; margin-bottom: 24px; }
        `;
        document.head.appendChild(styles);
    }

    addEmailsStyles() {
        if (document.getElementById('emailsStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'emailsStyles';
        styles.textContent = `
            .emails-container { padding: 20px; }
            .emails-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .emails-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
            .emails-list { display: flex; flex-direction: column; gap: 12px; }
            .email-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
            .email-card.has-task { border-left: 4px solid #10b981; }
            .email-avatar { width: 48px; height: 48px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
            .email-content { flex: 1; }
            .email-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .email-sender { font-weight: 600; color: #1f2937; }
            .email-date { color: #6b7280; font-size: 14px; }
            .email-subject { font-weight: 600; margin-bottom: 4px; color: #374151; }
            .email-preview { color: #6b7280; font-size: 14px; }
            .btn-sm { padding: 8px 12px; font-size: 12px; }
            .btn-secondary { background: #f3f4f6; color: #374151; }
            .btn-secondary:hover { background: #e5e7eb; }
            .task-badge { background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
            .empty-state { text-align: center; padding: 60px 20px; }
            .empty-icon { font-size: 4rem; color: #d1d5db; margin-bottom: 24px; }
            .empty-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; color: #1f2937; }
            .empty-text { color: #6b7280; margin-bottom: 32px; }
        `;
        document.head.appendChild(styles);
    }

    addTasksStyles() {
        if (document.getElementById('tasksStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'tasksStyles';
        styles.textContent = `
            .tasks-container { padding: 20px; }
            .tasks-header { margin-bottom: 24px; }
            .tasks-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
            .tasks-list { display: flex; flex-direction: column; gap: 12px; }
            .task-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
            .task-title { font-weight: 600; margin-bottom: 4px; color: #1f2937; }
            .task-description { color: #6b7280; font-size: 14px; }
            .task-meta { display: flex; gap: 8px; }
            .task-status, .task-priority { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
            .task-status.todo { background: #fef3c7; color: #d97706; }
            .task-status.completed { background: #dcfce7; color: #16a34a; }
            .task-priority.high { background: #fee2e2; color: #dc2626; }
            .task-priority.medium { background: #fef3c7; color: #d97706; }
            .task-priority.low { background: #f3f4f6; color: #6b7280; }
        `;
        document.head.appendChild(styles);
    }

    addCategoriesStyles() {
        if (document.getElementById('categoriesStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'categoriesStyles';
        styles.textContent = `
            .categories-container { padding: 20px; }
            .categories-header { margin-bottom: 24px; }
            .categories-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
            .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .category-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
            .category-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 16px; }
            .category-name { font-weight: 600; margin-bottom: 8px; color: #1f2937; }
            .category-description { color: #6b7280; font-size: 14px; }
        `;
        document.head.appendChild(styles);
    }

    addSettingsStyles() {
        if (document.getElementById('settingsStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'settingsStyles';
        styles.textContent = `
            .settings-container { padding: 20px; max-width: 800px; margin: 0 auto; }
            .settings-header { margin-bottom: 32px; }
            .settings-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
            .settings-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
            .settings-card h3 { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #1f2937; }
            .settings-card p { color: #6b7280; margin-bottom: 16px; }
        `;
        document.head.appendChild(styles);
    }

    addRangerStyles() {
        if (document.getElementById('rangerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'rangerStyles';
        styles.textContent = `
            .ranger-container { padding: 20px; max-width: 800px; margin: 0 auto; }
            .ranger-header { text-align: center; margin-bottom: 40px; }
            .ranger-title { font-size: 2.5rem; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
            .ranger-subtitle { font-size: 1.1rem; color: #6b7280; }
            .ranger-card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .ranger-icon { font-size: 4rem; color: #667eea; margin-bottom: 24px; }
        `;
        document.head.appendChild(styles);
    }
}

// Create global instance
window.pageManager = new PageManager();

// Bind methods to preserve context
Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
    }
});

console.log('✅ PageManager v12.0 loaded - Correction boucle dashboard');
