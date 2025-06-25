// PageManager.js - Version 15.1 - Détection newsletters améliorée

class PageManager {
    constructor() {
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.lastScanData = null;
        this.hideExplanation = this.getLocalStorageItem('hideEmailExplanation') === 'true';
        this.isInitialized = false;
        
        // Vue modes pour les emails
        this.currentViewMode = 'grouped-domain';
        this.currentCategory = null;
        
        // État de synchronisation
        this.syncState = {
            startScanSynced: false,
            emailScannerSynced: false,
            categoryManagerSynced: false,
            lastSyncTimestamp: null,
            emailCount: 0
        };
        
        // Cache pour optimisation
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
        
        // Page modules mapping
        this.pageModules = {
            scanner: 'minimalScanModule',
            emails: null,
            tasks: 'tasksView',
            categories: 'categoriesPage',
            settings: 'categoriesPage',
            ranger: 'domainOrganizer'
        };
        
        this.safeInit();
    }

    getLocalStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('[PageManager] LocalStorage non disponible:', error);
            return null;
        }
    }

    setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('[PageManager] LocalStorage non disponible:', error);
        }
    }

    safeInit() {
        try {
            this.setupEventListeners();
            this.setupSyncListeners();
            this.setupCategoryManagerIntegration();
            this.isInitialized = true;
            console.log('[PageManager] ✅ Version 15.1 - Détection newsletters améliorée');
        } catch (error) {
            console.error('[PageManager] Erreur initialisation:', error);
        }
    }

    // ================================================
    // INTÉGRATION CATEGORYMANAGER
    // ================================================
    setupCategoryManagerIntegration() {
        console.log('[PageManager] 🔗 Configuration intégration CategoryManager...');
        
        if (window.categoryManager) {
            console.log('[PageManager] ✅ CategoryManager détecté');
            this.syncState.categoryManagerSynced = true;
            
            window.categoryManager.addChangeListener((type, value, settings) => {
                console.log('[PageManager] 📨 Changement CategoryManager reçu:', type, value);
                this.handleCategoryManagerChange(type, value, settings);
            });
        } else {
            console.warn('[PageManager] ⚠️ CategoryManager non trouvé, attente...');
            setTimeout(() => this.setupCategoryManagerIntegration(), 2000);
        }
    }

    handleCategoryManagerChange(type, value, settings) {
        console.log('[PageManager] 🔄 Traitement changement CategoryManager:', type);
        
        switch (type) {
            case 'taskPreselectedCategories':
                this.invalidateTaskCategoriesCache();
                this.handleTaskPreselectedCategoriesChange(value);
                break;
                
            case 'activeCategories':
                this.handleActiveCategoriesChange(value);
                break;
                
            case 'categoryCreated':
            case 'categoryUpdated':
            case 'categoryDeleted':
                this.handleCategoryStructureChange(type, value);
                break;
                
            default:
                this.handleGenericCategoryChange(type, value);
        }
        
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 100);
        }
    }

    handleTaskPreselectedCategoriesChange(categories) {
        console.log('[PageManager] 📋 Catégories pré-sélectionnées changées:', categories);
        
        if (window.emailScanner && typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
            window.emailScanner.updateTaskPreselectedCategories(categories);
        }
        
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            console.log('[PageManager] 🔄 Déclenchement re-catégorisation...');
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 150);
        }
        
        this.invalidateTaskCategoriesCache();
    }

    handleActiveCategoriesChange(categories) {
        console.log('[PageManager] 🏷️ Catégories actives changées:', categories);
        
        if (window.emailScanner && typeof window.emailScanner.updateSettings === 'function') {
            window.emailScanner.updateSettings({ activeCategories: categories });
        }
        
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 150);
        }
    }

    handleCategoryStructureChange(type, value) {
        console.log('[PageManager] 📂 Structure catégories changée:', type, value);
        
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    handleGenericCategoryChange(type, value) {
        console.log('[PageManager] 🔧 Changement générique CategoryManager:', type, value);
        
        if (window.aiTaskAnalyzer && type === 'automationSettings') {
            window.aiTaskAnalyzer.updateAutomationSettings?.(value);
        }
    }

    // ================================================
    // LISTENERS DE SYNCHRONISATION
    // ================================================
    setupSyncListeners() {
        console.log('[PageManager] 📡 Configuration des listeners de synchronisation...');
        
        window.addEventListener('scanCompleted', (event) => {
            console.log('[PageManager] 📨 Scan terminé reçu:', event.detail);
            this.handleScanCompleted(event.detail);
        });
        
        window.addEventListener('emailScannerSynced', (event) => {
            console.log('[PageManager] 🔄 EmailScanner synchronisé:', event.detail);
            this.handleEmailScannerSynced(event.detail);
        });
        
        window.addEventListener('emailsRecategorized', (event) => {
            console.log('[PageManager] 🏷️ Emails re-catégorisés:', event.detail);
            this.handleEmailsRecategorized(event.detail);
        });
        
        window.addEventListener('emailScannerReady', (event) => {
            console.log('[PageManager] ✅ EmailScanner prêt:', event.detail);
            this.handleEmailScannerReady(event.detail);
        });
        
        console.log('[PageManager] ✅ Listeners de synchronisation configurés');
    }

    handleScanCompleted(scanData) {
        console.log('[PageManager] 🎯 Traitement scan terminé...');
        
        try {
            this.syncState.startScanSynced = true;
            this.syncState.lastSyncTimestamp = scanData.timestamp || Date.now();
            this.syncState.emailCount = scanData.results?.total || 0;
            this.lastScanData = scanData;
            
            console.log(`[PageManager] ✅ Scan terminé: ${this.syncState.emailCount} emails`);
            
            if (this.currentPage === 'emails') {
                console.log('[PageManager] 📧 Rafraîchissement automatique page emails');
                setTimeout(() => {
                    this.loadPage('emails');
                }, 500);
            }
            
        } catch (error) {
            console.error('[PageManager] ❌ Erreur traitement scan terminé:', error);
        }
    }

    handleEmailScannerSynced(syncData) {
        console.log('[PageManager] 🔄 Traitement synchronisation EmailScanner...');
        
        try {
            this.syncState.emailScannerSynced = true;
            this.syncState.lastSyncTimestamp = syncData.timestamp || Date.now();
            
            if (syncData.emailCount !== undefined) {
                this.syncState.emailCount = syncData.emailCount;
            }
            
            console.log(`[PageManager] ✅ EmailScanner synchronisé: ${this.syncState.emailCount} emails`);
            
            if (this.currentPage === 'emails') {
                console.log('[PageManager] 📧 Rafraîchissement page emails après sync');
                setTimeout(() => {
                    this.refreshEmailsView();
                }, 200);
            }
            
        } catch (error) {
            console.error('[PageManager] ❌ Erreur traitement sync EmailScanner:', error);
        }
    }

    handleEmailsRecategorized(recatData) {
        console.log('[PageManager] 🏷️ Traitement re-catégorisation...');
        
        try {
            if (recatData.emails) {
                this.syncState.emailCount = recatData.emails.length;
            }
            
            if (recatData.preselectedCount !== undefined) {
                console.log(`[PageManager] ⭐ ${recatData.preselectedCount} emails pré-sélectionnés`);
            }
            
            if (this.currentPage === 'emails') {
                console.log('[PageManager] 📧 Rafraîchissement immédiat après re-catégorisation');
                this.refreshEmailsView();
            }
            
        } catch (error) {
            console.error('[PageManager] ❌ Erreur traitement re-catégorisation:', error);
        }
    }

    handleEmailScannerReady(readyData) {
        console.log('[PageManager] ✅ EmailScanner prêt pour synchronisation');
        
        this.syncState.emailScannerSynced = true;
        
        if (readyData.emailCount) {
            this.syncState.emailCount = readyData.emailCount;
        }
    }

    // ================================================
    // ÉVÉNEMENTS GLOBAUX
    // ================================================
    setupEventListeners() {
        window.addEventListener('settingsChanged', (event) => {
            if (event.detail?.source === 'PageManager') {
                return;
            }
            
            console.log('[PageManager] 📨 Changement générique reçu:', event.detail);
            this.handleGenericSettingsChanged(event.detail);
        });

        window.addEventListener('error', (event) => {
            console.error('[PageManager] Global error:', event.error);
        });
    }

    handleGenericSettingsChanged(changeData) {
        console.log('[PageManager] 🔧 Traitement changement générique:', changeData);
        
        const { type, value } = changeData;
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[PageManager] 📋 Catégories pour tâches changées:', value);
                this.invalidateTaskCategoriesCache();
                
                if (window.aiTaskAnalyzer && typeof window.aiTaskAnalyzer.updatePreselectedCategories === 'function') {
                    window.aiTaskAnalyzer.updatePreselectedCategories(value);
                }
                
                if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                    setTimeout(() => {
                        window.emailScanner.recategorizeEmails?.();
                    }, 150);
                }
                break;
                
            case 'activeCategories':
                console.log('[PageManager] 🏷️ Catégories actives changées:', value);
                if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                    setTimeout(() => {
                        window.emailScanner.recategorizeEmails?.();
                    }, 150);
                }
                break;
                
            case 'preferences':
                console.log('[PageManager] ⚙️ Préférences changées:', value);
                if (this.currentPage === 'emails') {
                    setTimeout(() => {
                        this.refreshEmailsView();
                    }, 100);
                }
                break;
        }
    }

    // ================================================
    // CHARGEMENT DES PAGES
    // ================================================
    async loadPage(pageName) {
        console.log(`[PageManager] Loading page: ${pageName}`);

        if (!this.isInitialized) {
            console.warn('[PageManager] Not initialized, skipping page load');
            return;
        }

        if (pageName === 'dashboard') {
            console.log('[PageManager] Dashboard handled by index.html');
            this.updateNavigation(pageName);
            this.showPageContent();
            return;
        }

        const container = this.getPageContainer();
        if (!container) {
            console.error('[PageManager] Page container not found');
            return;
        }

        try {
            this.showLoading(`Chargement ${pageName}...`);
            this.updateNavigation(pageName);
            container.innerHTML = '';
            
            if (this.requiresAuthentication(pageName)) {
                console.log(`[PageManager] Page requires authentication: ${pageName}`);
                const authStatus = await this.checkAuthenticationStatus();
                
                if (!authStatus.isAuthenticated) {
                    console.log('[PageManager] User not authenticated, showing auth required message');
                    this.hideLoading();
                    container.innerHTML = this.renderAuthRequiredState(pageName);
                    return;
                }
            }
            
            if (pageName === 'emails') {
                await this.checkEmailSyncStatus();
            }
            
            await this.renderPage(pageName, container);
            this.currentPage = pageName;
            this.initializePageEvents(pageName);
            this.hideLoading();

        } catch (error) {
            console.error(`[PageManager] Error loading page ${pageName}:`, error);
            this.hideLoading();
            this.showError(`Erreur: ${error.message}`);
            container.innerHTML = this.renderErrorPage(error);
        }
    }

    async checkEmailSyncStatus() {
        console.log('[PageManager] 🔍 Vérification état synchronisation emails...');
        
        try {
            const emailScannerReady = window.emailScanner && 
                                    typeof window.emailScanner.getAllEmails === 'function';
            
            if (emailScannerReady) {
                const emails = window.emailScanner.getAllEmails();
                const startScanSynced = window.emailScanner.startScanSynced || false;
                
                console.log(`[PageManager] 📊 EmailScanner: ${emails.length} emails, StartScan sync: ${startScanSynced}`);
                
                this.syncState.emailScannerSynced = true;
                this.syncState.emailCount = emails.length;
                this.syncState.startScanSynced = startScanSynced;
                
                if (emails.length === 0) {
                    await this.tryRecoverScanResults();
                }
            } else {
                console.warn('[PageManager] EmailScanner non disponible ou non prêt');
                this.syncState.emailScannerSynced = false;
            }
            
        } catch (error) {
            console.error('[PageManager] ❌ Erreur vérification sync emails:', error);
        }
    }

    async tryRecoverScanResults() {
        console.log('[PageManager] 🔄 Tentative de récupération des résultats de scan...');
        
        try {
            const scanResults = this.getLocalStorageItem('scanResults');
            if (scanResults) {
                const results = JSON.parse(scanResults);
                console.log('[PageManager] 📦 Résultats trouvés en localStorage:', results);
                
                const now = Date.now();
                const resultAge = now - (results.timestamp || 0);
                const maxAge = 30 * 60 * 1000;
                
                if (resultAge < maxAge) {
                    console.log('[PageManager] ✅ Résultats récents, mise à jour état sync');
                    this.syncState.emailCount = results.total || 0;
                    this.syncState.startScanSynced = results.emailScannerSynced || false;
                    this.lastScanData = results;
                } else {
                    console.log('[PageManager] ⚠️ Résultats trop anciens, ignorés');
                }
            }
        } catch (error) {
            console.error('[PageManager] ❌ Erreur récupération résultats:', error);
        }
    }

    requiresAuthentication(pageName) {
        const authPages = ['emails', 'tasks', 'scanner'];
        return authPages.includes(pageName);
    }

    async checkAuthenticationStatus() {
        try {
            let isAuthenticated = false;
            let user = null;
            
            if (window.authService) {
                if (typeof window.authService.isAuthenticated === 'function') {
                    isAuthenticated = window.authService.isAuthenticated();
                    console.log('[PageManager] AuthService.isAuthenticated():', isAuthenticated);
                }
                
                if (typeof window.authService.checkAuthStatus === 'function') {
                    try {
                        const authStatus = await window.authService.checkAuthStatus();
                        isAuthenticated = authStatus.isAuthenticated || isAuthenticated;
                        user = authStatus.user || user;
                        console.log('[PageManager] AuthService.checkAuthStatus():', authStatus);
                    } catch (error) {
                        console.warn('[PageManager] Error checking auth status:', error);
                    }
                }
                
                if (typeof window.authService.getAccessToken === 'function') {
                    try {
                        const token = await window.authService.getAccessToken();
                        if (token) {
                            isAuthenticated = true;
                            console.log('[PageManager] Access token available, user is authenticated');
                        }
                    } catch (error) {
                        console.warn('[PageManager] No access token available:', error);
                    }
                }
            }
            
            if (!isAuthenticated) {
                try {
                    const storedAuth = this.getLocalStorageItem('authStatus') || this.getLocalStorageItem('userInfo');
                    if (storedAuth) {
                        isAuthenticated = true;
                        console.log('[PageManager] Found stored authentication indicator');
                    }
                } catch (error) {
                    console.warn('[PageManager] Cannot access localStorage:', error);
                }
            }
            
            return {
                isAuthenticated,
                user,
                source: isAuthenticated ? 'detected' : 'none'
            };
            
        } catch (error) {
            console.error('[PageManager] Error checking authentication:', error);
            return {
                isAuthenticated: false,
                user: null,
                error: error.message
            };
        }
    }

    renderAuthRequiredState(pageName) {
        return `
            <div class="auth-required-state">
                <div class="auth-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="auth-title">Authentification requise</h3>
                <p class="auth-text">
                    Vous devez être connecté pour accéder à cette page.
                </p>
                <div class="auth-actions">
                    <button class="btn btn-primary" onclick="window.pageManager.handleLogin()">
                        <i class="fas fa-sign-in-alt"></i>
                        Se connecter
                    </button>
                    <button class="btn btn-secondary" onclick="window.pageManager.loadPage('dashboard')">
                        <i class="fas fa-home"></i>
                        Retour au tableau de bord
                    </button>
                </div>
            </div>
        `;
    }

    async handleLogin() {
        console.log('[PageManager] Handling login request...');
        
        try {
            if (window.authService && typeof window.authService.login === 'function') {
                console.log('[PageManager] Using AuthService.login()');
                await window.authService.login();
            } else if (window.authService && typeof window.authService.signIn === 'function') {
                console.log('[PageManager] Using AuthService.signIn()');
                await window.authService.signIn();
            } else {
                console.log('[PageManager] No login method available, redirecting to auth page');
                window.location.href = '/auth.html';
            }
        } catch (error) {
            console.error('[PageManager] Login error:', error);
            this.showError('Erreur lors de la connexion: ' + error.message);
        }
    }

    async renderPage(pageName, container) {
        console.log(`[PageManager] Rendering page: ${pageName}`);
        
        const moduleName = this.pageModules[pageName];
        if (moduleName && window[moduleName]) {
            console.log(`[PageManager] Delegating to module: ${moduleName}`);
            return await this.delegateToModule(moduleName, container);
        }
        
        switch (pageName) {
            case 'emails':
                return await this.renderEmails(container);
            case 'tasks':
                return await this.renderTasks(container);
            case 'categories':
                return await this.renderCategories(container);
            case 'settings':
                return await this.renderSettings(container);
            case 'scanner':
                return await this.renderScanner(container);
            case 'ranger':
                return await this.renderRanger(container);
            default:
                throw new Error(`Page ${pageName} not found`);
        }
    }

    async delegateToModule(moduleName, container) {
        const module = window[moduleName];
        if (!module) {
            throw new Error(`Module ${moduleName} not found`);
        }

        try {
            if (typeof module.render === 'function') {
                await module.render(container);
            } else if (typeof module.showPage === 'function') {
                await module.showPage(container);
            } else if (typeof module.renderSettings === 'function') {
                await module.renderSettings(container);
            } else {
                console.log(`[PageManager] Initializing module: ${moduleName}`);
                container.innerHTML = `
                    <div class="module-placeholder">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Loading ${moduleName}...</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`[PageManager] Error rendering module: ${moduleName}`, error);
            throw error;
        }
    }

    initializePageEvents(pageName) {
        console.log(`[PageManager] Initializing events for page: ${pageName}`);
        
        switch (pageName) {
            case 'emails':
                this.setupEmailsEventListeners();
                break;
        }
    }

    // ================================================
    // MÉTHODES POUR RÉCUPÉRER LES DONNÉES
    // ================================================
    getAllEmails() {
        if (window.emailScanner && window.emailScanner.getAllEmails) {
            const emails = window.emailScanner.getAllEmails();
            console.log(`[PageManager] 📧 Récupération ${emails.length} emails depuis EmailScanner`);
            return emails;
        }
        
        if (window.emailScanner && window.emailScanner.emails) {
            console.log(`[PageManager] 📧 Récupération ${window.emailScanner.emails.length} emails directs`);
            return window.emailScanner.emails;
        }
        
        console.log('[PageManager] ⚠️ Aucun email trouvé dans EmailScanner');
        return [];
    }

    getCategories() {
        if (window.categoryManager && window.categoryManager.getCategories) {
            return window.categoryManager.getCategories();
        }
        
        if (window.emailScanner && window.emailScanner.defaultWebCategories) {
            return window.emailScanner.defaultWebCategories;
        }
        
        return {
            'all': { name: 'Tous', icon: '📧', color: '#1e293b' },
            'other': { name: 'Autre', icon: '❓', color: '#64748b' }
        };
    }

    getTaskPreselectedCategories() {
        const now = Date.now();
        const CACHE_DURATION = 10000;
        
        if (this._taskCategoriesCache && 
            this._taskCategoriesCacheTime && 
            (now - this._taskCategoriesCacheTime) < CACHE_DURATION) {
            return [...this._taskCategoriesCache];
        }
        
        let categories = [];
        
        if (window.categoryManager && window.categoryManager.getTaskPreselectedCategories) {
            categories = window.categoryManager.getTaskPreselectedCategories();
        } else if (window.emailScanner && window.emailScanner.getTaskPreselectedCategories) {
            categories = window.emailScanner.getTaskPreselectedCategories();
        } else {
            try {
                const settings = JSON.parse(this.getLocalStorageItem('categorySettings') || '{}');
                categories = settings.taskPreselectedCategories || [];
            } catch (error) {
                categories = [];
            }
        }
        
        this._taskCategoriesCache = [...categories];
        this._taskCategoriesCacheTime = now;
        
        return [...categories];
    }

    invalidateTaskCategoriesCache() {
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
        console.log('[PageManager] 🔄 Cache des catégories tâches invalidé');
    }

    // ================================================
    // RENDU DE LA PAGE EMAILS CORRIGÉ
    // ================================================
    async renderEmails(container) {
        console.log('[PageManager] 📧 Rendu page emails...');
        
        const emails = this.getAllEmails();
        const categories = this.getCategories();
        
        console.log(`[PageManager] 📊 État sync: ${this.syncState.emailScannerSynced}, Emails: ${emails.length}`);
        
        if (emails.length === 0 && !this.syncState.startScanSynced) {
            container.innerHTML = this.renderEmptyEmailsState();
            return;
        }

        const categoryCounts = this.calculateCategoryCounts(emails);
        const totalEmails = emails.length;
        const selectedCount = this.selectedEmails.size;
        const visibleEmails = this.getVisibleEmails();
        
        const syncIndicator = this.renderSyncIndicator();
        
        container.innerHTML = `
            <div class="emails-page-modern">
                ${syncIndicator}
                
                ${!this.hideExplanation ? `
                    <div class="explanation-notice">
                        <i class="fas fa-info-circle"></i>
                        <span>Emails ${this.syncState.startScanSynced ? 'synchronisés depuis la simulation' : 'disponibles'}. Cliquez pour sélectionner et créer des tâches.</span>
                        <button class="explanation-close" onclick="window.pageManager.hideExplanationMessage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}

                <div class="controls-bar">
                    <div class="search-section">
                        <div class="search-box">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   class="search-input" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher dans vos emails..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="actions-section">
                        <div class="view-modes">
                            <button class="view-mode ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('grouped-domain')"
                                    title="Par domaine">
                                <i class="fas fa-globe"></i>
                                <span>Domaine</span>
                            </button>
                            <button class="view-mode ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('grouped-sender')"
                                    title="Par expéditeur">
                                <i class="fas fa-user"></i>
                                <span>Expéditeur</span>
                            </button>
                            <button class="view-mode ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('flat')"
                                    title="Liste complète">
                                <i class="fas fa-list"></i>
                                <span>Liste</span>
                            </button>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary ${selectedCount === 0 ? 'disabled' : ''}" 
                                    onclick="window.pageManager.createTasksFromSelection()"
                                    ${selectedCount === 0 ? 'disabled' : ''}
                                    title="Créer des tâches à partir des emails sélectionnés">
                                <i class="fas fa-tasks"></i>
                                <span>Créer tâche${selectedCount > 1 ? 's' : ''}</span>
                                ${selectedCount > 0 ? `<span class="count-badge">${selectedCount}</span>` : ''}
                            </button>
                            
                            <div class="dropdown-wrapper">
                                <button class="btn btn-secondary dropdown-toggle ${selectedCount === 0 ? 'disabled' : ''}" 
                                        onclick="window.pageManager.toggleBulkActions(event)"
                                        ${selectedCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-ellipsis-v"></i>
                                    <span>Actions</span>
                                </button>
                                <div class="dropdown-menu" id="bulkActionsMenu">
                                    <button class="dropdown-item" onclick="window.pageManager.bulkMarkAsRead()">
                                        <i class="fas fa-eye"></i>
                                        <span>Marquer comme lu</span>
                                    </button>
                                    <button class="dropdown-item" onclick="window.pageManager.bulkArchive()">
                                        <i class="fas fa-archive"></i>
                                        <span>Archiver</span>
                                    </button>
                                    <button class="dropdown-item danger" onclick="window.pageManager.bulkDelete()">
                                        <i class="fas fa-trash"></i>
                                        <span>Supprimer</span>
                                    </button>
                                    <div class="dropdown-divider"></div>
                                    <button class="dropdown-item" onclick="window.pageManager.bulkExport()">
                                        <i class="fas fa-download"></i>
                                        <span>Exporter</span>
                                    </button>
                                </div>
                            </div>
                            
                            <button class="btn btn-secondary" onclick="window.pageManager.refreshEmails()">
                                <i class="fas fa-sync-alt"></i>
                                <span>Actualiser</span>
                            </button>
                            
                            ${selectedCount > 0 ? `
                                <button class="btn btn-clear" 
                                        onclick="window.pageManager.clearSelection()"
                                        title="Effacer la sélection">
                                    <i class="fas fa-times"></i>
                                    <span>Effacer (${selectedCount})</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="category-filters">
                    ${this.buildCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <div class="emails-container">
                    ${this.renderEmailsList()}
                </div>
            </div>
        `;

        this.addEmailsStyles();
        this.setupEmailsEventListeners();
        
        if (this.autoAnalyzeEnabled && emails.length > 0) {
            const preselectedCategories = this.getTaskPreselectedCategories();
            console.log('[PageManager] 🤖 Catégories pré-sélectionnées pour analyse:', preselectedCategories);
            
            if (preselectedCategories && preselectedCategories.length > 0) {
                const emailsToAnalyze = emails.filter(email => 
                    preselectedCategories.includes(email.category)
                ).slice(0, 5);
                
                console.log('[PageManager] 🎯 Emails sélectionnés pour analyse:', emailsToAnalyze.length);
                
                if (emailsToAnalyze.length > 0) {
                    setTimeout(() => {
                        this.analyzeFirstEmails(emailsToAnalyze);
                    }, 1000);
                }
            }
        }
    }

    renderSyncIndicator() {
        const { emailScannerSynced, startScanSynced, categoryManagerSynced, emailCount, lastSyncTimestamp } = this.syncState;
        
        if (!emailScannerSynced && emailCount === 0) {
            return `
                <div class="sync-indicator warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Aucun email trouvé. Utilisez le scanner pour importer des emails.</span>
                    <button class="btn btn-primary btn-sm" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i> Aller au scanner
                    </button>
                </div>
            `;
        }
        
        if (startScanSynced && emailCount > 0) {
            const timeAgo = lastSyncTimestamp ? this.formatTimeAgo(lastSyncTimestamp) : 'récemment';
            return `
                <div class="sync-indicator success">
                    <i class="fas fa-check-circle"></i>
                    <span>✅ ${emailCount} emails synchronisés (${timeAgo})</span>
                    <div class="sync-badges">
                        <span class="sync-badge startscan">StartScan</span>
                        <span class="sync-badge emailscanner">EmailScanner</span>
                        ${categoryManagerSynced ? '<span class="sync-badge categorymanager">CategoryManager</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        if (emailScannerSynced && emailCount > 0) {
            return `
                <div class="sync-indicator info">
                    <i class="fas fa-info-circle"></i>
                    <span>📧 ${emailCount} emails disponibles</span>
                </div>
            `;
        }
        
        return '';
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'à l\'instant';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}j`;
    }

    buildCategoryTabs(categoryCounts, totalEmails, categories) {
        const preselectedCategories = this.getTaskPreselectedCategories();
        console.log('[PageManager] 📌 Catégories pré-sélectionnées pour affichage:', preselectedCategories);
        
        const tabs = [
            { 
                id: 'all', 
                name: 'Tous', 
                icon: '📧', 
                count: totalEmails,
                isPreselected: false 
            }
        ];
        
        Object.entries(categories).forEach(([catId, category]) => {
            const count = categoryCounts[catId] || 0;
            if (count > 0) {
                const isPreselected = preselectedCategories.includes(catId);
                tabs.push({
                    id: catId,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    count: count,
                    isPreselected: isPreselected
                });
                
                if (isPreselected) {
                    console.log(`[PageManager] ⭐ Catégorie pré-sélectionnée: ${category.name} (${count} emails)`);
                }
            }
        });
        
        const otherCount = categoryCounts.other || 0;
        if (otherCount > 0) {
            tabs.push({
                id: 'other',
                name: 'Autre',
                icon: '📌',
                count: otherCount,
                isPreselected: false
            });
        }
        
        return tabs.map(tab => {
            const isCurrentCategory = this.currentCategory === tab.id;
            const baseClasses = `category-tab ${isCurrentCategory ? 'active' : ''} ${tab.isPreselected ? 'preselected' : ''}`;
            
            return `
                <button class="${baseClasses}" 
                        onclick="window.pageManager.filterByCategory('${tab.id}')"
                        data-category-id="${tab.id}"
                        title="${tab.isPreselected ? '⭐ Catégorie pré-sélectionnée pour les tâches' : ''}">
                    <div class="tab-content">
                        <div class="tab-header">
                            <span class="tab-icon">${tab.icon}</span>
                            <span class="tab-count">${tab.count}</span>
                        </div>
                        <div class="tab-name">${tab.name}</div>
                    </div>
                    ${tab.isPreselected ? '<span class="preselected-star">⭐</span>' : ''}
                </button>
            `;
        }).join('');
    }

    // ================================================
    // RENDU DES EMAILS
    // ================================================
    renderEmailsList() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        console.log(`[PageManager] 📧 Rendu liste emails: ${emails.length} total, catégorie: ${this.currentCategory}`);
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'other') {
                filteredEmails = filteredEmails.filter(email => {
                    const cat = email.category;
                    const isOther = !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
                    return isOther;
                });
                console.log(`[PageManager] 📌 Emails "Autre" filtrés: ${filteredEmails.length}`);
            } else {
                filteredEmails = filteredEmails.filter(email => email.category === this.currentCategory);
                console.log(`[PageManager] 🏷️ Emails catégorie "${this.currentCategory}": ${filteredEmails.length}`);
            }
        }
        
        if (this.searchTerm) {
            const beforeSearch = filteredEmails.length;
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
            console.log(`[PageManager] 🔍 Après recherche "${this.searchTerm}": ${filteredEmails.length} (était ${beforeSearch})`);
        }
        
        if (filteredEmails.length === 0) {
            console.log('[PageManager] 📭 Aucun email à afficher');
            return this.renderEmptyState();
        }

        switch (this.currentViewMode) {
            case 'flat':
                return this.renderFlatView(filteredEmails);
            case 'grouped-domain':
            case 'grouped-sender':
                return this.renderGroupedView(filteredEmails, this.currentViewMode);
            default:
                return this.renderFlatView(filteredEmails);
        }
    }

    renderFlatView(emails) {
        return `
            <div class="emails-list">
                ${emails.map(email => this.renderEmailCard(email)).join('')}
            </div>
        `;
    }

    renderEmailCard(email) {
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        
        const preselectedCategories = this.getTaskPreselectedCategories();
        
        let isPreselectedForTasks = email.isPreselectedForTasks === true;
        
        if (!isPreselectedForTasks && preselectedCategories.includes(email.category)) {
            isPreselectedForTasks = true;
            email.isPreselectedForTasks = true;
        }
        
        const isSelected = this.selectedEmails.has(email.id) || isPreselectedForTasks;
        
        if (isPreselectedForTasks && !this.selectedEmails.has(email.id)) {
            this.selectedEmails.add(email.id);
        }
        
        const cardClasses = [
            'email-card',
            isSelected ? 'selected' : '',
            hasTask ? 'has-task' : '',
            isPreselectedForTasks ? 'preselected' : '',
            email.webSimulated ? 'simulated' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${cardClasses}" 
                 data-email-id="${email.id}"
                 data-category="${email.category}"
                 data-preselected="${isPreselectedForTasks}">
                
                <input type="checkbox" 
                       class="email-checkbox" 
                       ${isSelected ? 'checked' : ''}
                       onchange="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                
                <div class="priority-bar" 
                     style="background-color: ${isPreselectedForTasks ? '#8b5cf6' : this.getEmailPriorityColor(email)}"></div>
                
                <div class="email-content" onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                    <div class="email-header">
                        <h3 class="email-title">${this.escapeHtml(email.subject || 'Sans sujet')}</h3>
                        <div class="email-meta">
                            <span class="email-type">
                                ${email.webSimulated ? '🤖 Simulé' : '📧 Email'}
                            </span>
                            <span class="email-date">
                                📅 ${this.formatEmailDate(email.receivedDateTime)}
                            </span>
                            ${isPreselectedForTasks ? `
                                <span class="preselected-badge">
                                    ⭐ Pré-sélectionné
                                </span>
                            ` : ''}
                            ${this.syncState.startScanSynced && email.webSimulated ? `
                                <span class="sync-badge">
                                    🔄 Synchronisé
                                </span>
                            ` : ''}
                            ${email.categoryConfidence ? `
                                <span class="confidence-badge">
                                    🎯 ${Math.round(email.categoryConfidence * 100)}%
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="email-sender">
                        <i class="fas fa-envelope"></i>
                        <span class="sender-name">${this.escapeHtml(senderName)}</span>
                        ${email.hasAttachments ? '<span class="attachment-indicator">📎 Pièce jointe</span>' : ''}
                        ${email.category && email.category !== 'other' ? `
                            <span class="category-badge" 
                                  style="background: ${this.getCategoryColor(email.category)}20; 
                                         color: ${this.getCategoryColor(email.category)};
                                         ${isPreselectedForTasks ? 'font-weight: 700;' : ''}">
                                ${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}
                                ${isPreselectedForTasks ? ' ⭐' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="email-actions">
                    ${this.renderEmailActions(email)}
                </div>
            </div>
        `;
    }

    renderEmailActions(email) {
        const hasTask = this.createdTasks.has(email.id);
        const actions = [];
        
        if (!hasTask) {
            actions.push(`
                <button class="action-btn create-task" 
                        onclick="event.stopPropagation(); window.pageManager.showTaskCreationModal('${email.id}')"
                        title="Créer une tâche à partir de cet email">
                    <i class="fas fa-tasks"></i>
                </button>
            `);
        } else {
            actions.push(`
                <button class="action-btn view-task" 
                        onclick="event.stopPropagation(); window.pageManager.openCreatedTask('${email.id}')"
                        title="Voir la tâche créée">
                    <i class="fas fa-check-circle"></i>
                </button>
            `);
        }
        
        actions.push(`
            <button class="action-btn details" 
                    onclick="event.stopPropagation(); window.pageManager.showEmailModal('${email.id}')"
                    title="Voir le contenu complet de l'email">
                <i class="fas fa-eye"></i>
            </button>
        `);
        
        return actions.join('');
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="emails-grouped">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
    }

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="email-group" data-group-key="${group.key}">
                <div class="group-header" onclick="window.pageManager.toggleGroup('${group.key}', event)">
                    <div class="group-avatar" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info">
                        <div class="group-name">${displayName}</div>
                        <div class="group-meta">${group.count} email${group.count > 1 ? 's' : ''} • ${this.formatEmailDate(group.latestDate)}</div>
                    </div>
                    <div class="group-expand">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content" style="display: none;">
                    ${group.emails.map(email => this.renderEmailCard(email)).join('')}
                </div>
            </div>
        `;
    }

    // ================================================
    // GESTION DES EMAILS
    // ================================================
    toggleEmailSelection(emailId) {
        console.log('[PageManager] Toggle sélection email:', emailId);
        
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
            console.log('[PageManager] Email désélectionné:', emailId);
        } else {
            this.selectedEmails.add(emailId);
            console.log('[PageManager] Email sélectionné:', emailId);
        }
        
        const checkbox = document.querySelector(`[data-email-id="${emailId}"] .email-checkbox`);
        if (checkbox) {
            checkbox.checked = this.selectedEmails.has(emailId);
        }
        
        this.updateControlsOnly();
        
        console.log('[PageManager] Sélection mise à jour. Total sélectionnés:', this.selectedEmails.size);
    }

    updateControlsOnly() {
        const selectedCount = this.selectedEmails.size;
        
        const createTaskBtn = document.querySelector('.btn-primary[onclick*="createTasksFromSelection"]');
        if (createTaskBtn) {
            const span = createTaskBtn.querySelector('span');
            const countBadge = createTaskBtn.querySelector('.count-badge');
            
            if (selectedCount === 0) {
                createTaskBtn.classList.add('disabled');
                createTaskBtn.disabled = true;
            } else {
                createTaskBtn.classList.remove('disabled');
                createTaskBtn.disabled = false;
            }
            
            if (span) {
                span.textContent = `Créer tâche${selectedCount > 1 ? 's' : ''}`;
            }
            
            if (countBadge) {
                if (selectedCount > 0) {
                    countBadge.textContent = selectedCount;
                    countBadge.style.display = 'inline';
                } else {
                    countBadge.style.display = 'none';
                }
            } else if (selectedCount > 0) {
                const newBadge = document.createElement('span');
                newBadge.className = 'count-badge';
                newBadge.textContent = selectedCount;
                createTaskBtn.appendChild(newBadge);
            }
        }
        
        const actionsBtn = document.querySelector('.dropdown-toggle[onclick*="toggleBulkActions"]');
        if (actionsBtn) {
            if (selectedCount === 0) {
                actionsBtn.classList.add('disabled');
                actionsBtn.disabled = true;
            } else {
                actionsBtn.classList.remove('disabled');
                actionsBtn.disabled = false;
            }
        }
        
        const existingClearBtn = document.querySelector('.btn-clear');
        const actionButtonsContainer = document.querySelector('.action-buttons');
        
        if (selectedCount > 0) {
            if (!existingClearBtn && actionButtonsContainer) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn btn-clear';
                clearBtn.onclick = () => window.pageManager.clearSelection();
                clearBtn.title = 'Effacer la sélection';
                clearBtn.innerHTML = `
                    <i class="fas fa-times"></i>
                    <span>Effacer (${selectedCount})</span>
                `;
                actionButtonsContainer.appendChild(clearBtn);
            } else if (existingClearBtn) {
                const span = existingClearBtn.querySelector('span');
                if (span) {
                    span.textContent = `Effacer (${selectedCount})`;
                }
            }
        } else {
            if (existingClearBtn) {
                existingClearBtn.remove();
            }
        }
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.refreshEmailsView();
        this.showToast('Sélection effacée', 'info');
    }

    refreshEmailsView() {
        console.log('[PageManager] Rafraîchissement vue emails...');
        
        const expandedGroups = new Set();
        document.querySelectorAll('.email-group.expanded').forEach(group => {
            const groupKey = group.dataset.groupKey;
            if (groupKey) {
                expandedGroups.add(groupKey);
            }
        });
        
        const searchInput = document.getElementById('emailSearchInput');
        const currentSearchValue = searchInput ? searchInput.value : this.searchTerm;
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
            
            expandedGroups.forEach(groupKey => {
                const group = document.querySelector(`[data-group-key="${groupKey}"]`);
                if (group) {
                    const content = group.querySelector('.group-content');
                    const icon = group.querySelector('.group-expand i');
                    const header = group.querySelector('.group-header');
                    
                    if (content && icon && header) {
                        content.style.display = 'block';
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                        group.classList.add('expanded');
                        header.classList.add('expanded');
                    }
                }
            });
        }
        
        this.updateControlsOnly();
        
        setTimeout(() => {
            const newSearchInput = document.getElementById('emailSearchInput');
            if (newSearchInput && currentSearchValue && newSearchInput.value !== currentSearchValue) {
                newSearchInput.value = currentSearchValue;
            }
        }, 50);
        
        console.log('[PageManager] Vue emails rafraîchie avec', this.selectedEmails.size, 'sélectionnés');
    }

    async refreshEmails() {
        this.showLoading('Actualisation...');
        
        try {
            await this.checkEmailSyncStatus();
            
            if (this.safeCall(() => window.emailScanner?.recategorizeEmails)) {
                await window.emailScanner.recategorizeEmails();
            }
            
            await this.loadPage('emails');
            this.showToast('Emails actualisés', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur d\'actualisation', 'error');
        }
    }

    // ================================================
    // GESTION DES FILTRES
    // ================================================
    filterByCategory(categoryId) {
        console.log(`[PageManager] 🔍 Filtrage par catégorie: ${categoryId}`);
        
        this.currentCategory = categoryId;
        
        this.refreshEmailsView();
        
        document.querySelectorAll('.category-tab').forEach(tab => {
            const tabCategoryId = tab.dataset.categoryId;
            if (tabCategoryId === categoryId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        this.refreshEmailsView();
    }

    hideExplanationMessage() {
        this.hideExplanation = true;
        this.setLocalStorageItem('hideEmailExplanation', 'true');
        this.refreshEmailsView();
    }

    toggleGroup(groupKey, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('[PageManager] Toggle groupe:', groupKey);
        
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) {
            console.error('[PageManager] Groupe non trouvé:', groupKey);
            return;
        }
        
        const content = group.querySelector('.group-content');
        const icon = group.querySelector('.group-expand i');
        const header = group.querySelector('.group-header');
        
        if (!content || !icon || !header) {
            console.error('[PageManager] Éléments du groupe manquants');
            return;
        }
        
        const isExpanded = content.style.display !== 'none';
        
        if (isExpanded) {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
            header.classList.remove('expanded');
            console.log('[PageManager] Groupe fermé:', groupKey);
        } else {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
            header.classList.add('expanded');
            console.log('[PageManager] Groupe ouvert:', groupKey);
        }
    }

    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') {
            console.log('[PageManager] Clic checkbox détecté, arrêt propagation');
            return;
        }
        
        if (event.target.closest('.email-actions')) {
            console.log('[PageManager] Clic action détecté, arrêt propagation');
            return;
        }
        
        if (event.target.closest('.group-header')) {
            console.log('[PageManager] Clic dans group header, arrêt propagation');
            return;
        }
        
        const now = Date.now();
        const lastClick = this.lastEmailClick || 0;
        
        if (now - lastClick < 300) {
            console.log('[PageManager] Double-clic détecté, toggle sélection');
            event.preventDefault();
            event.stopPropagation();
            this.toggleEmailSelection(emailId);
            this.lastEmailClick = 0;
            return;
        }
        
        this.lastEmailClick = now;
        
        setTimeout(() => {
            if (Date.now() - this.lastEmailClick >= 250) {
                console.log('[PageManager] Simple clic confirmé, ouverture modal');
                this.showEmailModal(emailId);
            }
        }, 250);
    }

    setupEmailsEventListeners() {
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
    }

    handleSearch(term) {
        this.searchTerm = term.trim();
        this.refreshEmailsView();
    }

    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) searchInput.value = '';
        
        this.refreshEmailsView();
    }

    // ================================================
    // ACTIONS BULK
    // ================================================
    toggleBulkActions(event) {
        event.stopPropagation();
        event.preventDefault();
        
        const menu = document.getElementById('bulkActionsMenu');
        const button = event.currentTarget;
        
        if (!menu || !button) return;
        
        const isCurrentlyVisible = menu.classList.contains('show');
        
        document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
            if (dropdown !== menu) {
                dropdown.classList.remove('show');
            }
        });
        
        document.querySelectorAll('.dropdown-toggle.show').forEach(btn => {
            if (btn !== button) {
                btn.classList.remove('show');
            }
        });
        
        const existingOverlay = document.querySelector('.dropdown-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        if (isCurrentlyVisible) {
            menu.classList.remove('show');
            button.classList.remove('show');
            console.log('[PageManager] Dropdown Actions fermé');
        } else {
            menu.classList.add('show');
            button.classList.add('show');
            console.log('[PageManager] Dropdown Actions ouvert');
            
            const overlay = document.createElement('div');
            overlay.className = 'dropdown-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9998;
                background: rgba(0, 0, 0, 0.05);
                cursor: pointer;
            `;
            
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.remove('show');
                button.classList.remove('show');
                overlay.remove();
                console.log('[PageManager] Dropdown fermé via overlay');
            });
            
            document.body.appendChild(overlay);
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    menu.classList.remove('show');
                    button.classList.remove('show');
                    overlay.remove();
                    document.removeEventListener('keydown', handleEscape);
                    console.log('[PageManager] Dropdown fermé via Escape');
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            setTimeout(() => {
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                    button.classList.remove('show');
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                    console.log('[PageManager] Dropdown fermé automatiquement');
                }
            }, 15000);
        }
    }

    async bulkMarkAsRead() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        this.showToast(`${selectedEmails.length} emails marqués comme lus`, 'success');
        this.clearSelection();
    }

    async bulkArchive() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        if (confirm(`Archiver ${selectedEmails.length} email(s) ?`)) {
            this.showToast(`${selectedEmails.length} emails archivés`, 'success');
            this.clearSelection();
        }
    }

    async bulkDelete() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        if (confirm(`Supprimer définitivement ${selectedEmails.length} email(s) ?\n\nCette action est irréversible.`)) {
            this.showToast(`${selectedEmails.length} emails supprimés`, 'success');
            this.clearSelection();
            this.refreshEmailsView();
        }
    }

    async bulkExport() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        if (window.emailScanner) {
            window.emailScanner.exportResults('csv');
        } else {
            this.showToast('Export terminé', 'success');
        }
        this.clearSelection();
    }

    // ================================================
    // CRÉATION DE TÂCHES
    // ================================================
    async createTasksFromSelection() {
        if (this.selectedEmails.size === 0) {
            this.showToast('Aucun email sélectionné', 'warning');
            return;
        }
        
        let created = 0;
        this.showLoading(`Création de ${this.selectedEmails.size} tâches...`);
        
        for (const emailId of this.selectedEmails) {
            const email = this.getEmailById(emailId);
            if (!email || this.createdTasks.has(emailId)) continue;
            
            try {
                let analysis = this.aiAnalysisResults.get(emailId);
                if (!analysis && window.aiTaskAnalyzer) {
                    analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email);
                    this.aiAnalysisResults.set(emailId, analysis);
                }
                
                if (analysis && window.taskManager) {
                    const taskData = this.buildTaskDataFromAnalysis(email, analysis);
                    const task = window.taskManager.createTaskFromEmail(taskData, email);
                    if (task) {
                        this.createdTasks.set(emailId, task.id);
                        created++;
                    }
                } else {
                    const taskData = this.buildTaskDataFromEmail(email);
                    if (window.taskManager) {
                        const task = window.taskManager.createTaskFromEmail(taskData, email);
                        if (task) {
                            this.createdTasks.set(emailId, task.id);
                            created++;
                        }
                    }
                }
            } catch (error) {
                console.error('[PageManager] Erreur création tâche:', emailId, error);
            }
        }
        
        this.hideLoading();
        
        if (created > 0) {
            this.safeCall(() => window.taskManager?.saveTasks());
            this.showToast(`${created} tâche${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''}`, 'success');
            this.clearSelection();
        } else {
            this.showToast('Aucune tâche créée', 'warning');
        }
    }

    buildTaskDataFromAnalysis(email, analysis) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || 'unknown';
        
        return {
            id: this.generateTaskId(),
            title: analysis?.mainTask?.title || `Email de ${senderName}`,
            description: analysis?.mainTask?.description || analysis?.summary || email.bodyPreview || '',
            priority: analysis?.mainTask?.priority || 'medium',
            dueDate: analysis?.mainTask?.dueDate || null,
            status: 'todo',
            emailId: email.id,
            category: email.category || 'other',
            createdAt: new Date().toISOString(),
            aiGenerated: !!analysis,
            emailFrom: senderEmail,
            emailFromName: senderName,
            emailSubject: email.subject,
            emailDomain: senderDomain,
            emailDate: email.receivedDateTime,
            hasAttachments: email.hasAttachments || false,
            aiAnalysis: analysis,
            tags: [senderDomain, analysis?.importance, ...(analysis?.tags || [])].filter(Boolean),
            method: analysis ? 'ai' : 'manual',
            webSimulated: email.webSimulated || false,
            startScanSynced: this.syncState.startScanSynced
        };
    }

    buildTaskDataFromEmail(email) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || 'unknown';
        
        return {
            id: this.generateTaskId(),
            title: `Email de ${senderName}`,
            description: email.bodyPreview || email.subject || '',
            priority: 'medium',
            dueDate: null,
            status: 'todo',
            emailId: email.id,
            category: email.category || 'other',
            createdAt: new Date().toISOString(),
            aiGenerated: false,
            emailFrom: senderEmail,
            emailFromName: senderName,
            emailSubject: email.subject,
            emailDomain: senderDomain,
            emailDate: email.receivedDateTime,
            hasAttachments: email.hasAttachments || false,
            tags: [senderDomain].filter(Boolean),
            method: 'manual',
            webSimulated: email.webSimulated || false,
            startScanSynced: this.syncState.startScanSynced
        };
    }

    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getEmailById(emailId) {
        const emails = this.getAllEmails();
        return emails.find(email => email.id === emailId) || null;
    }

    // ================================================
    // MODALS
    // ================================================
    showEmailModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'email_modal_' + Date.now();
        const syncBadge = email.webSimulated && this.syncState.startScanSynced ? 
            '<span class="sync-badge">🔄 Synchronisé depuis StartScan</span>' : '';
        
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div class="modal-container" style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">📧 Email Complet</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
                            ×
                        </button>
                    </div>
                    <div class="modal-content" style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div class="email-details" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 12px;">
                                <span style="font-weight: 600; color: #374151; margin-right: 8px;">De:</span>
                                <span style="color: #6b7280;">${email.from?.emailAddress?.name || ''} &lt;${email.from?.emailAddress?.address || ''}&gt;</span>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <span style="font-weight: 600; color: #374151; margin-right: 8px;">Date:</span>
                                <span style="color: #6b7280;">${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</span>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <span style="font-weight: 600; color: #374151; margin-right: 8px;">Sujet:</span>
                                <span style="color: #6b7280;">${email.subject || 'Sans sujet'}</span>
                            </div>
                            ${email.category ? `
                                <div style="margin-bottom: 12px;">
                                    <span style="font-weight: 600; color: #374151; margin-right: 8px;">Catégorie:</span>
                                    <span style="background: ${this.getCategoryColor(email.category)}20; color: ${this.getCategoryColor(email.category)}; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}</span>
                                </div>
                            ` : ''}
                            ${email.categoryConfidence ? `
                                <div style="margin-bottom: 12px;">
                                    <span style="font-weight: 600; color: #374151; margin-right: 8px;">Confiance IA:</span>
                                    <span style="color: #059669; font-weight: 600;">${Math.round(email.categoryConfidence * 100)}%</span>
                                </div>
                            ` : ''}
                            ${syncBadge}
                        </div>
                        <div class="email-body" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; line-height: 1.6; color: #374151;">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 500; color: #374151;">
                            Fermer
                        </button>
                        ${!this.createdTasks.has(emailId) ? `
                            <button onclick="document.getElementById('${uniqueId}').remove(); window.pageManager.showTaskCreationModal('${emailId}');" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-tasks"></i> Créer une tâche
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    async showTaskCreationModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        let analysis;
        try {
            this.showLoading('Analyse de l\'email...');
            if (window.aiTaskAnalyzer) {
                analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email, { useApi: true });
                this.aiAnalysisResults.set(emailId, analysis);
            }
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.warn('[PageManager] Analyse IA non disponible, création manuelle');
            analysis = null;
        }

        const uniqueId = 'task_creation_modal_' + Date.now();
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        
        const enhancedTitle = analysis?.mainTask?.title?.includes(senderName) ? 
            analysis.mainTask.title : 
            (analysis?.mainTask?.title || `Email de ${senderName}`);

        const modalHTML = `
            <div id="${uniqueId}" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 99999999; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">✅ Créer une tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
                            ×
                        </button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            ${analysis ? `
                                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-robot" style="color: #0ea5e9; font-size: 20px;"></i>
                                    <span style="color: #0c4a6e; font-weight: 600;">✨ Analyse intelligente par Claude AI</span>
                                </div>
                            ` : `
                                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 20px;"></i>
                                    <span style="color: #92400e; font-weight: 600;">⚠️ Création manuelle - Analyse IA non disponible</span>
                                </div>
                            `}
                            
                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; background: ${this.generateAvatarColor(senderName)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                                    ${senderName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style="font-weight: 700; color: #1f2937; font-size: 16px;">${senderName}</div>
                                    <div style="color: #6b7280; font-size: 14px;">${senderEmail}</div>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">📝 Titre de la tâche</label>
                                <input type="text" id="task-title" 
                                       style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
                                       value="${enhancedTitle}" />
                            </div>
                            
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">📄 Description</label>
                                <textarea id="task-description" 
                                          style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical; min-height: 100px;"
                                          rows="4">${analysis?.mainTask?.description || analysis?.summary || email.bodyPreview || ''}</textarea>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">⚡ Priorité</label>
                                    <select id="task-priority" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                        <option value="urgent" ${analysis?.mainTask?.priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                                        <option value="high" ${analysis?.mainTask?.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                                        <option value="medium" ${!analysis?.mainTask?.priority || analysis?.mainTask?.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                                        <option value="low" ${analysis?.mainTask?.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">📅 Date d'échéance</label>
                                    <input type="date" id="task-duedate" 
                                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
                                           value="${analysis?.mainTask?.dueDate || ''}" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="padding: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 12px 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Annuler
                        </button>
                        <button onclick="window.pageManager.createTaskFromModal('${email.id}'); document.getElementById('${uniqueId}').remove();"
                                style="padding: 12px 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-check"></i> Créer la tâche
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    async createTaskFromModal(emailId) {
        const email = this.getEmailById(emailId);
        const analysis = this.aiAnalysisResults.get(emailId);
        
        if (!email) {
            this.showToast('Email non trouvé', 'error');
            return;
        }

        const title = document.getElementById('task-title')?.value;
        const description = document.getElementById('task-description')?.value;
        const priority = document.getElementById('task-priority')?.value;
        const dueDate = document.getElementById('task-duedate')?.value;

        if (!title) {
            this.showToast('Le titre est requis', 'warning');
            return;
        }

        try {
            let taskData;
            if (analysis) {
                taskData = this.buildTaskDataFromAnalysis(email, {
                    ...analysis,
                    mainTask: {
                        ...analysis.mainTask,
                        title,
                        description,
                        priority,
                        dueDate
                    }
                });
            } else {
                taskData = {
                    ...this.buildTaskDataFromEmail(email),
                    title,
                    description,
                    priority,
                    dueDate
                };
            }

            const task = window.taskManager?.createTaskFromEmail(taskData, email);
            if (task) {
                this.createdTasks.set(emailId, task.id);
                this.safeCall(() => window.taskManager?.saveTasks());
                this.showToast('Tâche créée avec succès', 'success');
                this.refreshEmailsView();
            } else {
                throw new Error('Erreur lors de la création de la tâche');
            }
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast('Erreur lors de la création', 'error');
        }
    }

    openCreatedTask(emailId) {
        const taskId = this.createdTasks.get(emailId);
        if (!taskId) return;
        
        this.loadPage('tasks').then(() => {
            setTimeout(() => {
                if (window.tasksView?.showTaskDetails) {
                    window.tasksView.showTaskDetails(taskId);
                }
            }, 100);
        });
    }

    // ================================================
    // AUTRES PAGES
    // ================================================
    async renderTasks(container) {
        if (window.tasksView && window.tasksView.render) {
            window.tasksView.render(container);
        } else {
            container.innerHTML = `
                <div class="tasks-page">
                    <div class="page-header">
                        <h1><i class="fas fa-tasks"></i> Tâches</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 class="empty-title">Aucune tâche</h3>
                        <p class="empty-text">Créez des tâches à partir de vos emails</p>
                        <button class="btn btn-primary" onclick="window.pageManager.loadPage('emails')">
                            <i class="fas fa-envelope"></i>
                            Voir les emails
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async renderCategories(container) {
        if (window.categoriesPage && window.categoriesPage.renderSettings) {
            window.categoriesPage.renderSettings(container);
        } else {
            const categories = this.getCategories();
            
            container.innerHTML = `
                <div class="categories-page">
                    <div class="page-header">
                        <h1><i class="fas fa-tags"></i> Catégories</h1>
                    </div>
                    
                    <div class="categories-grid">
                        ${Object.entries(categories).map(([id, cat]) => `
                            <div class="category-card">
                                <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                                    ${cat.icon}
                                </div>
                                <h3>${cat.name}</h3>
                                <p>${cat.description || 'Pas de description'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    async renderSettings(container) {
        if (window.categoriesPage && window.categoriesPage.renderSettings) {
            window.categoriesPage.renderSettings(container);
        } else {
            container.innerHTML = `
                <div class="settings-page">
                    <div class="page-header">
                        <h1><i class="fas fa-cog"></i> Paramètres</h1>
                    </div>
                    
                    <div class="settings-grid">
                        <div class="settings-card">
                            <h3><i class="fas fa-robot"></i> Configuration IA</h3>
                            <p>Configurez l'analyseur IA Claude</p>
                            <button class="btn btn-primary" onclick="window.pageManager.configureAI()">
                                <i class="fas fa-cog"></i> Configurer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-tags"></i> Catégories</h3>
                            <p>Gérez vos catégories d'emails</p>
                            <button class="btn btn-secondary" onclick="window.pageManager.loadPage('categories')">
                                <i class="fas fa-tags"></i> Gérer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-sync-alt"></i> Synchronisation</h3>
                            <p>État: ${this.syncState.emailScannerSynced ? 'Synchronisé' : 'Non synchronisé'}</p>
                            <div class="sync-status">
                                ${this.syncState.startScanSynced ? '✅ StartScan' : '❌ StartScan'}
                                ${this.syncState.emailScannerSynced ? '✅ EmailScanner' : '❌ EmailScanner'}
                                ${this.syncState.categoryManagerSynced ? '✅ CategoryManager' : '❌ CategoryManager'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async renderScanner(container) {
        console.log('[PageManager] Rendering scanner page...');
        
        const authStatus = await this.checkAuthenticationStatus();
        
        if (!authStatus.isAuthenticated) {
            container.innerHTML = `
                <div class="scanner-auth-required">
                    <div class="scanner-header">
                        <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                        <p>Connectez-vous pour analyser vos emails</p>
                    </div>
                    
                    <div class="auth-card">
                        <div class="auth-icon">
                            <i class="fab fa-microsoft"></i>
                        </div>
                        <h3>Connexion Microsoft Graph</h3>
                        <p>Accédez à vos emails Outlook/Exchange</p>
                        <button class="btn btn-primary btn-large" onclick="window.pageManager.handleLogin()">
                            <i class="fas fa-sign-in-alt"></i>
                            Se connecter à Microsoft
                        </button>
                    </div>
                    
                    <div class="scanner-info">
                        <div class="info-card">
                            <i class="fas fa-shield-alt"></i>
                            <h4>Sécurisé</h4>
                            <p>Authentification OAuth2 Microsoft</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-robot"></i>
                            <h4>IA Intégrée</h4>
                            <p>Analyse intelligente avec Claude AI</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-tasks"></i>
                            <h4>Productivité</h4>
                            <p>Convertit automatiquement en tâches</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            try {
                await window.minimalScanModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] Error with minimalScanModule:', error);
            }
        }
        
        container.innerHTML = `
            <div class="scanner-authenticated">
                <div class="scanner-header">
                    <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                    <p>Analysez vos emails et créez des tâches automatiquement</p>
                </div>
                
                <div class="scanner-status">
                    <div class="status-item">
                        <i class="fas fa-user"></i>
                        <span>Connecté${authStatus.user ? ' en tant que ' + authStatus.user : ''}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-database"></i>
                        <span>EmailScanner: ${window.emailScanner ? 'Disponible' : 'Non disponible'}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-sync-alt"></i>
                        <span>Synchronisation: ${this.syncState.emailScannerSynced ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
                
                <div class="scanner-fallback">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <h3>Scanner de simulation</h3>
                            <p>Le scanner principal n'est pas disponible. Utilisation du mode simulation.</p>
                            <button onclick="window.pageManager.startFallbackScan()" class="btn btn-primary">
                                <i class="fas fa-play"></i> Démarrer simulation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async startFallbackScan() {
        console.log('[PageManager] Starting fallback simulation scan...');
        
        try {
            this.showLoading('Simulation de scan en cours...');
            
            if (window.emailScanner && typeof window.emailScanner.scan === 'function') {
                const results = await window.emailScanner.scan({
                    days: 7,
                    simulationMode: false,
                    onProgress: (progress) => {
                        console.log('[PageManager] Scan progress:', progress);
                    }
                });
                
                console.log(`[PageManager] Fallback scan completed with ${results.total} emails`);
                
                this.hideLoading();
                this.showToast(`${results.total} emails analysés avec succès!`, 'success');
                
                this.syncState.emailScannerSynced = true;
                this.syncState.emailCount = results.total;
                this.lastScanData = results;
                
                setTimeout(() => {
                    this.loadPage('emails');
                }, 1000);
                
            } else {
                throw new Error('EmailScanner non disponible');
            }
            
        } catch (error) {
            console.error('[PageManager] Fallback scan error:', error);
            this.hideLoading();
            this.showError('Erreur lors de la simulation: ' + error.message);
        }
    }

    async renderRanger(container) {
        if (window.domainOrganizer && window.domainOrganizer.showPage) {
            window.domainOrganizer.showPage(container);
        } else {
            container.innerHTML = `
                <div class="ranger-page">
                    <div class="page-header">
                        <h1><i class="fas fa-folder-tree"></i> Ranger par domaine</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-folder-tree"></i>
                        </div>
                        <h3 class="empty-title">Module de rangement</h3>
                        <p class="empty-text">Organisez vos emails par domaine</p>
                    </div>
                </div>
            `;
        }
    }

    renderEmptyEmailsState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title">Aucun email trouvé</h3>
                <p class="empty-state-text">
                    Utilisez le scanner pour récupérer et analyser vos emails.
                </p>
                <div class="empty-state-actions">
                    <button class="btn btn-primary" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i>
                        Aller au scanner
                    </button>
                    ${this.syncState.emailScannerSynced ? `
                        <button class="btn btn-secondary" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            Actualiser
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        console.log(`[PageManager] 📭 Rendu état vide - Catégorie: ${this.currentCategory}, Recherche: "${this.searchTerm}"`);
        
        let title, text, action = '';
        
        if (this.searchTerm) {
            title = 'Aucun résultat trouvé';
            text = `Aucun email ne correspond à votre recherche "${this.searchTerm}"`;
            action = `
                <button class="btn btn-primary" onclick="window.pageManager.clearSearch()">
                    <i class="fas fa-undo"></i>
                    <span>Effacer la recherche</span>
                </button>
            `;
        } else if (this.currentCategory === 'other') {
            title = 'Aucun email non catégorisé';
            text = 'Tous vos emails ont été correctement catégorisés ! 🎉';
            action = `
                <button class="btn btn-primary" onclick="window.pageManager.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else if (this.currentCategory && this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            title = `Aucun email dans "${categoryName}"`;
            text = 'Cette catégorie ne contient aucun email pour le moment.';
            action = `
                <button class="btn btn-primary" onclick="window.pageManager.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else {
            title = 'Aucun email trouvé';
            text = 'Utilisez le scanner pour récupérer et analyser vos emails.';
            action = `
                <button class="btn btn-primary" onclick="window.pageManager.loadPage('scanner')">
                    <i class="fas fa-search"></i>
                    <span>Aller au scanner</span>
                </button>
            `;
        }
        
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-text">${text}</p>
                ${action}
            </div>
        `;
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
    configureAI() {
        if (window.aiTaskAnalyzer && window.aiTaskAnalyzer.showConfigurationModal) {
            window.aiTaskAnalyzer.showConfigurationModal();
        } else {
            this.showToast('Configuration IA non disponible', 'warning');
        }
    }

    getVisibleEmails() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'other') {
                filteredEmails = filteredEmails.filter(email => {
                    const cat = email.category;
                    const isOther = !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
                    return isOther;
                });
            } else {
                filteredEmails = filteredEmails.filter(email => email.category === this.currentCategory);
            }
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        return filteredEmails;
    }

    matchesSearch(email, searchTerm) {
        if (!searchTerm) return true;
        
        const search = searchTerm.toLowerCase();
        const subject = (email.subject || '').toLowerCase();
        const sender = (email.from?.emailAddress?.name || '').toLowerCase();
        const senderEmail = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        
        return subject.includes(search) || 
               sender.includes(search) || 
               senderEmail.includes(search) || 
               preview.includes(search);
    }

    calculateCategoryCounts(emails) {
        console.log('[PageManager] 📊 Calcul des comptages de catégories...');
        
        const counts = {};
        let uncategorizedCount = 0;
        
        emails.forEach(email => {
            const cat = email.category;
            
            if (cat && cat !== 'other' && cat !== null && cat !== undefined && cat !== '') {
                counts[cat] = (counts[cat] || 0) + 1;
            } else {
                uncategorizedCount++;
            }
        });
        
        if (uncategorizedCount > 0) {
            counts.other = uncategorizedCount;
            console.log(`[PageManager] 📌 ${uncategorizedCount} emails dans la catégorie "Autre"`);
        }
        
        console.log('[PageManager] 📊 Comptages finaux:', counts);
        
        return counts;
    }

    createEmailGroups(emails, groupMode) {
        const groups = {};
        
        emails.forEach(email => {
            let groupKey, groupName;
            
            if (groupMode === 'grouped-domain') {
                const domain = email.from?.emailAddress?.address?.split('@')[1] || 'unknown';
                groupKey = domain;
                groupName = domain;
            } else {
                const senderEmail = email.from?.emailAddress?.address || 'unknown';
                const senderName = email.from?.emailAddress?.name || senderEmail;
                groupKey = senderEmail;
                groupName = senderName;
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    name: groupName,
                    emails: [],
                    count: 0,
                    latestDate: null
                };
            }
            
            groups[groupKey].emails.push(email);
            groups[groupKey].count++;
            
            const emailDate = new Date(email.receivedDateTime);
            if (!groups[groupKey].latestDate || emailDate > groups[groupKey].latestDate) {
                groups[groupKey].latestDate = emailDate;
            }
        });
        
        return Object.values(groups).sort((a, b) => {
            if (!a.latestDate && !b.latestDate) return 0;
            if (!a.latestDate) return 1;
            if (!b.latestDate) return -1;
            return b.latestDate - a.latestDate;
        });
    }

    generateAvatarColor(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 360;
        const saturation = 65 + (Math.abs(hash) % 20);
        const lightness = 45 + (Math.abs(hash) % 15);
        
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 10}%))`;
    }

    getEmailPriorityColor(email) {
        if (email.importance === 'high') return '#ef4444';
        if (email.hasAttachments) return '#f97316';
        if (email.categoryScore >= 80) return '#10b981';
        return '#3b82f6';
    }

    formatEmailDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}j`;
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getEmailContent(email) {
        if (email.body?.content) {
            return email.body.content;
        }
        return `<p>${email.bodyPreview || 'Aucun contenu disponible'}</p>`;
    }

    getCategoryColor(categoryId) {
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.color) return category.color;
        }
        
        const category = this.getCategories()[categoryId];
        if (category && category.color) return category.color;
        
        return '#64748b';
    }

    getCategoryIcon(categoryId) {
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.icon) return category.icon;
        }
        
        const category = this.getCategories()[categoryId];
        if (category && category.icon) return category.icon;
        
        return '📌';
    }

    getCategoryName(categoryId) {
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.name) return category.name;
        }
        
        const category = this.getCategories()[categoryId];
        if (category && category.name) return category.name;
        
        return categoryId || 'Autre';
    }

    async analyzeFirstEmails(emails) {
        if (!window.aiTaskAnalyzer) return;
        
        for (const email of emails) {
            if (!this.aiAnalysisResults.has(email.id)) {
                try {
                    const analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email);
                    this.aiAnalysisResults.set(email.id, analysis);
                } catch (error) {
                    console.error('[PageManager] Erreur analyse email:', error);
                }
            }
        }
    }

    // ================================================
    // MÉTHODES SYSTÈME
    // ================================================
    safeCall(fn) {
        try {
            return fn();
        } catch (error) {
            console.warn('[PageManager] Safe call failed:', error);
            return null;
        }
    }

    getPageContainer() {
        return document.getElementById('pageContent') || document.querySelector('.page-content') || document.querySelector('#content');
    }

    showPageContent() {
        const pageContent = this.getPageContainer();
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
        }
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

    showLoading(message = 'Chargement...') {
        if (window.uiManager && window.uiManager.showLoading) {
            window.uiManager.showLoading(message);
        } else {
            console.log(`[PageManager] Loading: ${message}`);
        }
    }

    hideLoading() {
        if (window.uiManager && window.uiManager.hideLoading) {
            window.uiManager.hideLoading();
        }
    }

    showError(message) {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, 'error');
        } else {
            console.error(`[PageManager] Error: ${message}`);
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            console.log(`[PageManager] ${type.toUpperCase()}: ${message}`);
        }
    }

    renderErrorPage(error) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Erreur de chargement</h3>
                <p class="empty-state-text">${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    Recharger la page
                </button>
            </div>
        `;
    }

    // ================================================
    // STYLES CSS
    // ================================================
    addEmailsStyles() {
        if (document.getElementById('emailsPageStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'emailsPageStyles';
        styles.textContent = `
            .emails-page-modern {
                padding: 20px;
                background: #f8fafc;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            }

            .sync-indicator {
                margin-bottom: 16px;
                padding: 12px 16px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .sync-indicator.success {
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #059669;
            }
            
            .sync-indicator.info {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: #2563eb;
            }
            
            .sync-indicator.warning {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                color: #d97706;
            }
            
            .sync-badges {
                display: flex;
                gap: 6px;
                margin-left: auto;
            }
            
            .sync-badge {
                background: rgba(255, 255, 255, 0.8);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid rgba(0, 0, 0, 0.1);
            }

            .explanation-notice {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #1e40af;
                font-size: 14px;
                font-weight: 500;
            }
            
            .explanation-close {
                margin-left: auto;
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                color: #3b82f6;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .controls-bar {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .search-section {
                width: 100%;
            }

            .search-box {
                position: relative;
                max-width: 600px;
                margin: 0 auto;
            }

            .search-input {
                width: 100%;
                height: 44px;
                padding: 0 16px 0 48px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 14px;
                background: #f9fafb;
                transition: all 0.2s ease;
            }

            .search-input:focus {
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }

            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: #6b7280;
                font-size: 16px;
            }

            .search-clear {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: #ef4444;
                color: white;
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .actions-section {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
            }

            .view-modes {
                display: flex;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 4px;
                gap: 2px;
            }

            .view-mode {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: #6b7280;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 600;
            }

            .view-mode:hover {
                background: rgba(255, 255, 255, 0.8);
                color: #374151;
            }

            .view-mode.active {
                background: white;
                color: #1f2937;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .action-buttons {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .btn {
                height: 44px;
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 0 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                position: relative;
            }

            .btn:hover {
                background: #f9fafb;
                border-color: #6366f1;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            .btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }

            .btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            }

            .btn-primary:hover {
                background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
            }

            .btn-secondary {
                background: #f8fafc;
                color: #475569;
                border-color: #e2e8f0;
            }

            .btn-clear {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .count-badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: #ef4444;
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 16px;
                text-align: center;
                border: 2px solid white;
            }

            .dropdown-wrapper {
                position: relative;
            }

            .dropdown-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
                min-width: 200px;
                z-index: 9999;
                padding: 8px 0;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
            }

            .dropdown-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: none;
                border: none;
                width: 100%;
                text-align: left;
                color: #374151;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .dropdown-item:hover {
                background: #f8fafc;
                color: #1f2937;
            }

            .dropdown-item.danger {
                color: #dc2626;
            }

            .dropdown-item.danger:hover {
                background: #fef2f2;
                color: #b91c1c;
            }

            .dropdown-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 8px 0;
            }

            .category-filters {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }

            .category-tab {
                height: 60px;
                padding: 8px;
                font-size: 12px;
                font-weight: 700;
                flex: 0 1 calc(16.666% - 8px);
                min-width: 120px;
                max-width: 180px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                cursor: pointer;
                position: relative;
            }

            .category-tab.preselected {
                border-color: #8b5cf6;
                background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
            }

            .category-tab:hover {
                border-color: #3b82f6;
                background: #f0f9ff;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
            }

            .category-tab.active {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border-color: #3b82f6;
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                transform: translateY(-2px);
            }

            .tab-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                width: 100%;
                height: 100%;
                justify-content: center;
            }

            .tab-header {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .tab-icon {
                font-size: 16px;
            }

            .tab-count {
                background: rgba(0, 0, 0, 0.1);
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 800;
                min-width: 18px;
                text-align: center;
            }

            .preselected-star {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                background: #8b5cf6;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
            }

            .tab-name {
                font-weight: 700;
                font-size: 12px;
                line-height: 1.2;
                text-align: center;
            }

            .emails-container {
                background: transparent;
            }

            .emails-list {
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .email-card {
                display: flex;
                align-items: center;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 0;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: 80px;
                border-bottom: 1px solid #e5e7eb;
            }

            .email-card:first-child {
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                border-top: 1px solid #e5e7eb;
            }

            .email-card:last-child {
                border-bottom-left-radius: 12px;
                border-bottom-right-radius: 12px;
                border-bottom: 1px solid #e5e7eb;
            }

            .email-card:hover {
                background: #f8fafc;
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                border-color: rgba(99, 102, 241, 0.2);
                border-left: 3px solid #6366f1;
                z-index: 2;
            }

            .email-card.selected {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                border-color: #3b82f6;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
                z-index: 3;
            }

            .email-card.has-task {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 3px solid #22c55e;
            }

            .email-card.preselected {
                background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
                border-left: 3px solid #8b5cf6;
                border-color: rgba(139, 92, 246, 0.3);
            }

            .email-card.preselected:hover {
                border-left: 4px solid #8b5cf6;
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
                border-color: rgba(139, 92, 246, 0.4);
            }

            .email-card.preselected.selected {
                background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
                border-left: 4px solid #8b5cf6;
                border-color: #8b5cf6;
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
            }

            .email-checkbox {
                margin-right: 12px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 6px;
                border: 2px solid #d1d5db;
                background: white;
                transition: all 0.2s ease;
                flex-shrink: 0;
                appearance: none;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .email-checkbox:checked {
                background: #6366f1;
                border-color: #6366f1;
            }

            .email-checkbox:checked::after {
                content: '✓';
                color: white;
                font-size: 12px;
                font-weight: 700;
            }

            .email-card.preselected .email-checkbox:checked {
                background: #8b5cf6;
                border-color: #8b5cf6;
            }

            .priority-bar {
                width: 4px;
                height: 60px;
                border-radius: 2px;
                margin-right: 12px;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }

            .email-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }

            .email-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 4px;
            }

            .email-title {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                margin: 0;
                line-height: 1.3;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .email-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
                flex-wrap: wrap;
            }

            .email-type,
            .email-date {
                display: flex;
                align-items: center;
                gap: 3px;
                background: #f8fafc;
                color: #64748b;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #e2e8f0;
                white-space: nowrap;
            }

            .preselected-badge {
                display: flex;
                align-items: center;
                gap: 3px;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                border: none;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
            }

            .sync-badge {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border: none;
                font-weight: 700;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 3px;
                white-space: nowrap;
            }

            .confidence-badge {
                background: rgba(16, 185, 129, 0.1);
                color: #059669;
                border-color: #bbf7d0;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #bbf7d0;
                white-space: nowrap;
            }

            .email-sender {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }

            .sender-name {
                font-weight: 600;
                color: #374151;
            }

            .attachment-indicator {
                color: #dc2626;
                font-weight: 600;
                font-size: 10px;
            }

            .category-badge {
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 3px;
                transition: all 0.2s ease;
            }

            .email-actions {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-left: 12px;
                flex-shrink: 0;
                z-index: 10;
                position: relative;
            }

            .action-btn {
                width: 36px;
                height: 36px;
                border: 2px solid transparent;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.9);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 13px;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            }

            .action-btn:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .action-btn.create-task {
                color: #3b82f6;
            }

            .action-btn.create-task:hover {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
                color: #2563eb;
            }

            .action-btn.view-task {
                color: #16a34a;
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            }

            .action-btn.view-task:hover {
                background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%);
                border-color: #16a34a;
                color: #15803d;
            }

            .action-btn.details {
                color: #8b5cf6;
            }

            .action-btn.details:hover {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-color: #8b5cf6;
                color: #7c3aed;
            }

            .emails-grouped {
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .email-group {
                background: transparent;
                border: none;
                border-radius: 0;
                overflow: visible;
                margin: 0;
                padding: 0;
            }

            .group-header {
                display: flex;
                align-items: center;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 0;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: 80px;
                border-bottom: 1px solid #e5e7eb;
                gap: 12px;
            }

            .group-avatar {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 16px;
                flex-shrink: 0;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .group-info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }

            .group-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                margin: 0;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .group-meta {
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }

            .group-expand {
                width: 36px;
                height: 36px;
                border: 2px solid transparent;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.9);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 13px;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                flex-shrink: 0;
            }

            .group-expand:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                color: #374151;
            }

            .email-group.expanded .group-expand {
                transform: rotate(180deg) translateY(-1px);
                color: #3b82f6;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
            }

            .group-content {
                background: transparent;
                margin: 0;
                padding: 0;
                display: none;
            }

            .email-group.expanded .group-content {
                display: block;
            }

            .group-content .email-card {
                border-radius: 0;
                margin: 0;
                border-bottom: 1px solid #e5e7eb;
            }

            .group-content .email-card:last-child {
                border-bottom-left-radius: 12px;
                border-bottom-right-radius: 12px;
                border-bottom: 1px solid #e5e7eb;
            }

            .empty-state {
                text-align: center;
                padding: 60px 30px;
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 20px;
                color: #d1d5db;
            }

            .empty-state-title {
                font-size: 22px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 12px;
            }

            .empty-state-text {
                font-size: 15px;
                margin-bottom: 24px;
                max-width: 400px;
                line-height: 1.6;
                color: #6b7280;
                font-weight: 500;
            }

            @media (max-width: 768px) {
                .actions-section {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 12px;
                }

                .view-modes {
                    width: 100%;
                    justify-content: space-around;
                }

                .action-buttons {
                    width: 100%;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .category-filters {
                    justify-content: center;
                }

                .category-tab {
                    flex: 0 1 calc(50% - 8px);
                    min-width: 140px;
                }

                .email-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }

                .email-actions {
                    flex-direction: column;
                    gap: 2px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // ================================================
    // DEBUG ET NETTOYAGE
    // ================================================
    getSyncStatus() {
        return {
            ...this.syncState,
            emailScanner: {
                available: !!window.emailScanner,
                emails: window.emailScanner?.emails?.length || 0,
                startScanSynced: window.emailScanner?.startScanSynced || false
            },
            categoryManager: {
                available: !!window.categoryManager,
                preselectedCategories: this.getTaskPreselectedCategories(),
                categories: Object.keys(this.getCategories()).length
            },
            startScan: {
                available: !!window.minimalScanModule,
                settings: window.minimalScanModule?.settings || {}
            },
            lastScanData: this.lastScanData
        };
    }

    cleanup() {
        if (this.categoryManagerChangeListener) {
            window.categoryManager?.removeChangeListener?.(this.categoryManagerChangeListener);
        }
        
        this.invalidateTaskCategoriesCache();
        this.selectedEmails.clear();
        this.aiAnalysisResults.clear();
        this.createdTasks.clear();
        
        console.log('[PageManager] 🧹 Nettoyage effectué');
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================
if (window.pageManager) {
    console.log('[PageManager] 🔄 Nettoyage ancienne instance...');
    window.pageManager.cleanup?.();
}

console.log('[PageManager] 🚀 Création nouvelle instance v15.1...');
window.pageManager = new PageManager();

Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
    }
});

// Fonctions de debug globales
window.debugPageManagerSync = function() {
    return window.pageManager?.getSyncStatus() || { error: 'PageManager non disponible' };
};

window.refreshPageManagerEmails = function() {
    if (window.pageManager && window.pageManager.currentPage === 'emails') {
        window.pageManager.refreshEmailsView();
        return { success: true, message: 'Vue emails rafraîchie' };
    }
    return { success: false, message: 'Pas sur la page emails ou PageManager non disponible' };
};

console.log('✅ PageManager v15.1 loaded - Détection newsletters améliorée');
