// PageManager.js - Version 14.1 - Unifié avec styles modernes et compatibilité CategoryManager complète

class PageManager {
    constructor() {
        // Core state
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
        
        // État de synchronisation complet
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
        this._lastLoggedTaskCategories = null;
        
        // Page modules mapping
        this.pageModules = {
            scanner: 'minimalScanModule',
            emails: null, // Handled internally
            tasks: 'tasksView',
            categories: 'categoriesPage',
            settings: 'categoriesPage',
            ranger: 'domainOrganizer'
        };
        
        // Safe initialization
        this.safeInit();
    }

    // Safe localStorage access
    getLocalStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('[PageManager] LocalStorage not available:', error);
            return null;
        }
    }

    setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('[PageManager] LocalStorage not available:', error);
        }
    }

    safeInit() {
        try {
            this.setupEventListeners();
            this.setupSyncListeners();
            this.setupCategoryManagerIntegration();
            this.isInitialized = true;
            console.log('[PageManager] ✅ Version 14.1 - Unifié avec CategoryManager');
        } catch (error) {
            console.error('[PageManager] Initialization error:', error);
        }
    }

    // ================================================
    // INTÉGRATION CATEGORYMANAGER COMPLÈTE
    // ================================================
    setupCategoryManagerIntegration() {
        console.log('[PageManager] 🔗 Configuration intégration CategoryManager...');
        
        // Vérifier si CategoryManager est disponible
        if (window.categoryManager) {
            console.log('[PageManager] ✅ CategoryManager détecté');
            this.syncState.categoryManagerSynced = true;
            
            // S'abonner aux changements CategoryManager
            window.categoryManager.addChangeListener((type, value, settings) => {
                console.log('[PageManager] 📨 Changement CategoryManager reçu:', type, value);
                this.handleCategoryManagerChange(type, value, settings);
            });
        } else {
            console.warn('[PageManager] ⚠️ CategoryManager non trouvé, attente...');
            // Réessayer dans 2 secondes
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
                
            case 'keywordsUpdated':
                this.handleKeywordsChange(value);
                break;
                
            default:
                this.handleGenericCategoryChange(type, value);
        }
        
        // Rafraîchir la vue si on est sur les emails
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 100);
        }
    }

    handleTaskPreselectedCategoriesChange(categories) {
        console.log('[PageManager] 📋 Catégories pré-sélectionnées changées:', categories);
        
        // Mettre à jour EmailScanner si disponible
        if (window.emailScanner && typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
            window.emailScanner.updateTaskPreselectedCategories(categories);
        }
        
        // Forcer la re-catégorisation si des emails existent
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            console.log('[PageManager] 🔄 Déclenchement re-catégorisation...');
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 150);
        }
        
        // Invalider le cache
        this.invalidateTaskCategoriesCache();
    }

    handleActiveCategoriesChange(categories) {
        console.log('[PageManager] 🏷️ Catégories actives changées:', categories);
        
        // Mettre à jour EmailScanner
        if (window.emailScanner && typeof window.emailScanner.updateSettings === 'function') {
            window.emailScanner.updateSettings({ activeCategories: categories });
        }
        
        // Déclencher re-catégorisation
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 150);
        }
    }

    handleCategoryStructureChange(type, value) {
        console.log('[PageManager] 📂 Structure catégories changée:', type, value);
        
        // Rafraîchir les filtres de catégories
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    handleKeywordsChange(value) {
        console.log('[PageManager] 🔤 Mots-clés changés:', value);
        
        // Déclencher re-catégorisation si nécessaire
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 200);
        }
    }

    handleGenericCategoryChange(type, value) {
        console.log('[PageManager] 🔧 Changement générique CategoryManager:', type, value);
        
        // Mettre à jour les autres modules si nécessaire
        if (window.aiTaskAnalyzer && type === 'automationSettings') {
            window.aiTaskAnalyzer.updateAutomationSettings?.(value);
        }
    }

    // ================================================
    // LISTENERS DE SYNCHRONISATION RENFORCÉS
    // ================================================
    setupSyncListeners() {
        console.log('[PageManager] 📡 Configuration des listeners de synchronisation...');
        
        // Écouter les événements de scan terminé depuis StartScan
        window.addEventListener('scanCompleted', (event) => {
            console.log('[PageManager] 📨 Scan terminé reçu:', event.detail);
            this.handleScanCompleted(event.detail);
        });
        
        // Écouter les événements de synchronisation EmailScanner
        window.addEventListener('emailScannerSynced', (event) => {
            console.log('[PageManager] 🔄 EmailScanner synchronisé:', event.detail);
            this.handleEmailScannerSynced(event.detail);
        });
        
        // Écouter les re-catégorisations
        window.addEventListener('emailsRecategorized', (event) => {
            console.log('[PageManager] 🏷️ Emails re-catégorisés:', event.detail);
            this.handleEmailsRecategorized(event.detail);
        });
        
        // Écouter les notifications de EmailScanner prêt
        window.addEventListener('emailScannerReady', (event) => {
            console.log('[PageManager] ✅ EmailScanner prêt:', event.detail);
            this.handleEmailScannerReady(event.detail);
        });
        
        // Écouter les changements CategoryManager
        window.addEventListener('categorySettingsChanged', (event) => {
            console.log('[PageManager] 📨 CategoryManager settings changed:', event.detail);
            this.handleCategorySettingsChanged(event.detail);
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
            
            // Si on est sur la page emails, rafraîchir automatiquement
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
            
            // Rafraîchir la page emails si on y est
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
            
            // Rafraîchir immédiatement si on est sur la page emails
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

    handleCategorySettingsChanged(settingsData) {
        console.log('[PageManager] 🔧 Traitement changement paramètres CategoryManager:', settingsData);
        
        // Si c'est un changement de catégories pré-sélectionnées, invalider le cache
        if (settingsData.settings?.taskPreselectedCategories) {
            this.invalidateTaskCategoriesCache();
            
            // Déclencher la re-catégorisation si des emails existent
            if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                console.log('[PageManager] 🔄 Déclenchement re-catégorisation...');
                setTimeout(() => {
                    window.emailScanner.recategorizeEmails?.();
                }, 100);
            }
        }
        
        // Mettre à jour l'affichage si on est sur la page emails
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    // ================================================
    // ÉVÉNEMENTS GLOBAUX HARMONISÉS
    // ================================================
    setupEventListeners() {
        // Écouter les changements génériques
        window.addEventListener('settingsChanged', (event) => {
            // Ignorer nos propres événements ou ceux de CategoryManager
            if (event.detail?.source === 'PageManager' || event.detail?.source === 'CategoryManager') {
                return;
            }
            
            console.log('[PageManager] 📨 Changement générique reçu:', event.detail);
            this.handleGenericSettingsChanged(event.detail);
        });

        // Écouter les erreurs globales
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
                
                // Mettre à jour le auto-analyzer si disponible
                if (window.aiTaskAnalyzer && typeof window.aiTaskAnalyzer.updatePreselectedCategories === 'function') {
                    window.aiTaskAnalyzer.updatePreselectedCategories(value);
                }
                
                // Déclencher la re-catégorisation
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
    // PAGE LOADING SYSTEM AVEC VÉRIFICATION SYNC
    // ================================================
    async loadPage(pageName) {
        console.log(`[PageManager] Loading page: ${pageName}`);

        if (!this.isInitialized) {
            console.warn('[PageManager] Not initialized, skipping page load');
            return;
        }

        // Handle dashboard redirect
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
            // Show loading
            this.showLoading(`Chargement ${pageName}...`);
            
            // Update navigation
            this.updateNavigation(pageName);
            
            // Clear container
            container.innerHTML = '';
            
            // Check authentication for protected pages
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
            
            // Vérification spéciale pour la page emails
            if (pageName === 'emails') {
                await this.checkEmailSyncStatus();
            }
            
            // Render page
            await this.renderPage(pageName, container);
            
            // Set current page
            this.currentPage = pageName;
            
            // Initialize page events
            this.initializePageEvents(pageName);
            
            // Hide loading
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
            // Vérifier l'état d'EmailScanner
            const emailScannerReady = window.emailScanner && 
                                    typeof window.emailScanner.getAllEmails === 'function';
            
            if (emailScannerReady) {
                const emails = window.emailScanner.getAllEmails();
                const startScanSynced = window.emailScanner.startScanSynced || false;
                
                console.log(`[PageManager] 📊 EmailScanner: ${emails.length} emails, StartScan sync: ${startScanSynced}`);
                
                this.syncState.emailScannerSynced = true;
                this.syncState.emailCount = emails.length;
                this.syncState.startScanSynced = startScanSynced;
                
                // Si pas d'emails mais scan results en localStorage, tenter de récupérer
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
                
                // Vérifier si les résultats sont récents (moins de 30 minutes)
                const now = Date.now();
                const resultAge = now - (results.timestamp || 0);
                const maxAge = 30 * 60 * 1000; // 30 minutes
                
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
        // Pages that require authentication
        const authPages = ['emails', 'tasks', 'scanner'];
        return authPages.includes(pageName);
    }

    async checkAuthenticationStatus() {
        try {
            // Check multiple authentication sources
            let isAuthenticated = false;
            let user = null;
            
            // Check AuthService
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
                
                // Try to get access token as final check
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
            
            // Check for stored authentication indicators
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
                <div class="auth-debug" style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
                    <strong>Debug info:</strong><br>
                    AuthService available: ${!!window.authService}<br>
                    Page: ${pageName}<br>
                    Timestamp: ${new Date().toLocaleString()}
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
        
        // Check if we should delegate to a module
        const moduleName = this.pageModules[pageName];
        if (moduleName && window[moduleName]) {
            console.log(`[PageManager] Delegating to module: ${moduleName}`);
            return await this.delegateToModule(moduleName, container);
        }
        
        // Handle internal pages
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
    // MÉTHODES POUR UTILISER LES SYSTÈMES EXISTANTS AVEC SYNC
    // ================================================
    getAllEmails() {
        // Priorité 1: EmailScanner avec vérification sync
        if (window.emailScanner && window.emailScanner.getAllEmails) {
            const emails = window.emailScanner.getAllEmails();
            console.log(`[PageManager] 📧 Récupération ${emails.length} emails depuis EmailScanner`);
            return emails;
        }
        
        // Priorité 2: Emails directs
        if (window.emailScanner && window.emailScanner.emails) {
            console.log(`[PageManager] 📧 Récupération ${window.emailScanner.emails.length} emails directs`);
            return window.emailScanner.emails;
        }
        
        // Fallback
        console.log('[PageManager] ⚠️ Aucun email trouvé dans EmailScanner');
        return [];
    }

    getCategories() {
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getCategories) {
            return window.categoryManager.getCategories();
        }
        
        // Priorité 2: EmailScanner default categories
        if (window.emailScanner && window.emailScanner.defaultWebCategories) {
            return window.emailScanner.defaultWebCategories;
        }
        
        // Fallback: Catégories basiques
        return {
            'all': { name: 'Tous', icon: '📧', color: '#1e293b' },
            'other': { name: 'Autre', icon: '❓', color: '#64748b' }
        };
    }

    getTaskPreselectedCategories() {
        // Vérifier le cache avec une durée de vie de 10 secondes
        const now = Date.now();
        const CACHE_DURATION = 10000; // 10 secondes
        
        if (this._taskCategoriesCache && 
            this._taskCategoriesCacheTime && 
            (now - this._taskCategoriesCacheTime) < CACHE_DURATION) {
            // Retourner depuis le cache sans logger
            return [...this._taskCategoriesCache];
        }
        
        let categories = [];
        
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getTaskPreselectedCategories) {
            categories = window.categoryManager.getTaskPreselectedCategories();
        }
        // Priorité 2: EmailScanner
        else if (window.emailScanner && window.emailScanner.getTaskPreselectedCategories) {
            categories = window.emailScanner.getTaskPreselectedCategories();
        }
        // Fallback: localStorage
        else {
            try {
                const settings = JSON.parse(this.getLocalStorageItem('categorySettings') || '{}');
                categories = settings.taskPreselectedCategories || [];
            } catch (error) {
                categories = [];
            }
        }
        
        // Mettre à jour le cache
        this._taskCategoriesCache = [...categories];
        this._taskCategoriesCacheTime = now;
        
        // Log seulement si changement ou première fois
        if (!this._lastLoggedTaskCategories || 
            JSON.stringify(this._lastLoggedTaskCategories) !== JSON.stringify(categories)) {
            console.log('[PageManager] 📋 Catégories tâches mises à jour:', categories);
            this._lastLoggedTaskCategories = [...categories];
        }
        
        return [...categories];
    }

    invalidateTaskCategoriesCache() {
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
        console.log('[PageManager] 🔄 Cache des catégories tâches invalidé');
    }

    // ================================================
    // PAGE RENDERERS - EMAILS AVEC SYNCHRONISATION COMPLÈTE ET STYLES MODERNES
    // ================================================
    async renderEmails(container) {
        console.log('[PageManager] 📧 Rendu page emails avec vérification synchronisation...');
        
        // Vérifier l'état de synchronisation
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
        const allVisible = visibleEmails.length > 0 && visibleEmails.every(email => this.selectedEmails.has(email.id));
        
        // Indicateur de synchronisation
        const syncIndicator = this.renderSyncIndicator();
        
        container.innerHTML = `
            <div class="tasks-page-modern">
                ${syncIndicator}
                
                ${!this.hideExplanation ? `
                    <div class="explanation-text-harmonized">
                        <i class="fas fa-info-circle"></i>
                        <span>Emails ${this.syncState.startScanSynced ? 'synchronisés depuis la simulation' : 'disponibles'}. Cliquez pour sélectionner et créer des tâches.</span>
                        <button class="explanation-close-btn" onclick="window.pageManager.hideExplanationMessage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}

                <div class="controls-bar-harmonized-expanded">
                    <!-- PREMIÈRE LIGNE : Barre de recherche étendue -->
                    <div class="search-line-full">
                        <div class="search-box-full">
                            <i class="fas fa-search search-icon-full"></i>
                            <input type="text" 
                                   class="search-input-full" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher dans vos emails (expéditeur, sujet, contenu)..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear-full" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- SECONDE LIGNE : Tous les boutons -->
                    <div class="buttons-line-full">
                        <!-- Modes de vue -->
                        <div class="view-modes-expanded">
                            <button class="view-mode-expanded ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('grouped-domain')"
                                    title="Par domaine">
                                <i class="fas fa-globe"></i>
                                <span>Domaine</span>
                            </button>
                            <button class="view-mode-expanded ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('grouped-sender')"
                                    title="Par expéditeur">
                                <i class="fas fa-user"></i>
                                <span>Expéditeur</span>
                            </button>
                            <button class="view-mode-expanded ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                    onclick="window.pageManager.changeViewMode('flat')"
                                    title="Liste complète">
                                <i class="fas fa-list"></i>
                                <span>Liste</span>
                            </button>
                        </div>
                        
                        <!-- Séparateur visuel -->
                        <div class="buttons-separator"></div>
                        
                        <!-- Actions principales -->
                        <div class="action-buttons-expanded">
                            <!-- Bouton Créer tâches -->
                            <button class="btn-expanded btn-primary ${selectedCount === 0 ? 'disabled' : ''}" 
                                    onclick="window.pageManager.createTasksFromSelection()"
                                    ${selectedCount === 0 ? 'disabled' : ''}>
                                <i class="fas fa-tasks"></i>
                                <span>Créer tâche${selectedCount > 1 ? 's' : ''}</span>
                                ${selectedCount > 0 ? `<span class="count-badge-main">${selectedCount}</span>` : ''}
                            </button>
                            
                            <!-- Bouton Actions -->
                            <div class="dropdown-action-expanded">
                                <button class="btn-expanded btn-secondary dropdown-toggle ${selectedCount === 0 ? 'disabled' : ''}" 
                                        onclick="window.pageManager.toggleBulkActions(event)"
                                        ${selectedCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-ellipsis-v"></i>
                                    <span>Actions</span>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <div class="dropdown-menu-expanded" id="bulkActionsMenu">
                                    <button class="dropdown-item-expanded" onclick="window.pageManager.bulkMarkAsRead()">
                                        <i class="fas fa-eye"></i>
                                        <span>Marquer comme lu</span>
                                    </button>
                                    <button class="dropdown-item-expanded" onclick="window.pageManager.bulkArchive()">
                                        <i class="fas fa-archive"></i>
                                        <span>Archiver</span>
                                    </button>
                                    <button class="dropdown-item-expanded danger" onclick="window.pageManager.bulkDelete()">
                                        <i class="fas fa-trash"></i>
                                        <span>Supprimer</span>
                                    </button>
                                    <div class="dropdown-divider"></div>
                                    <button class="dropdown-item-expanded" onclick="window.pageManager.bulkExport()">
                                        <i class="fas fa-download"></i>
                                        <span>Exporter</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Bouton Actualiser -->
                            <button class="btn-expanded btn-secondary" onclick="window.pageManager.refreshEmails()">
                                <i class="fas fa-sync-alt"></i>
                                <span>Actualiser</span>
                            </button>
                            
                            <!-- Bouton Effacer sélection (uniquement si des emails sont sélectionnés) -->
                            ${selectedCount > 0 ? `
                                <button class="btn-expanded btn-clear-selection" 
                                        onclick="window.pageManager.clearSelection()"
                                        title="Effacer la sélection">
                                    <i class="fas fa-times"></i>
                                    <span>Effacer (${selectedCount})</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Filtres de catégories -->
                <div class="status-filters-harmonized-twolines">
                    ${this.buildTwoLinesCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <!-- CONTENU DES EMAILS -->
                <div class="tasks-container-harmonized">
                    ${this.renderEmailsList()}
                </div>
            </div>
        `;

        this.addExpandedEmailStyles();
        this.setupEmailsEventListeners();
        
        // Auto-analyze si activé ET si catégories pré-sélectionnées configurées
        if (this.autoAnalyzeEnabled && emails.length > 0) {
            const preselectedCategories = this.getTaskPreselectedCategories();
            console.log('[PageManager] 🤖 Catégories pré-sélectionnées pour analyse:', preselectedCategories);
            
            if (preselectedCategories && preselectedCategories.length > 0) {
                // Filtrer les emails selon les catégories pré-sélectionnées
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
                    <span>✅ ${emailCount} emails synchronisés depuis la simulation (${timeAgo})</span>
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
                    <span>📧 ${emailCount} emails disponibles dans EmailScanner</span>
                    <div class="sync-badges">
                        <span class="sync-badge emailscanner">EmailScanner</span>
                        ${categoryManagerSynced ? '<span class="sync-badge categorymanager">CategoryManager</span>' : ''}
                    </div>
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

    buildTwoLinesCategoryTabs(categoryCounts, totalEmails, categories) {
        // Récupérer les catégories pré-sélectionnées
        const preselectedCategories = this.getTaskPreselectedCategories();
        console.log('[PageManager] 📌 Catégories pré-sélectionnées pour l\'affichage:', preselectedCategories);
        
        const tabs = [
            { 
                id: 'all', 
                name: 'Tous', 
                icon: '📧', 
                count: totalEmails,
                isPreselected: false 
            }
        ];
        
        // Ajouter les catégories avec emails
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
        
        // Ajouter "Autre" si nécessaire
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
        
        // Générer le HTML avec étoile TOUJOURS visible
        return tabs.map(tab => {
            const isCurrentCategory = this.currentCategory === tab.id;
            const baseClasses = `status-pill-harmonized-twolines ${isCurrentCategory ? 'active' : ''} ${tab.isPreselected ? 'preselected-category' : ''}`;
            
            return `
                <button class="${baseClasses}" 
                        onclick="window.pageManager.filterByCategory('${tab.id}')"
                        data-category-id="${tab.id}"
                        title="${tab.isPreselected ? '⭐ Catégorie pré-sélectionnée pour les tâches' : ''}">
                    <div class="pill-content-twolines">
                        <div class="pill-first-line-twolines">
                            <span class="pill-icon-twolines">${tab.icon}</span>
                            <span class="pill-count-twolines">${tab.count}</span>
                        </div>
                        <div class="pill-second-line-twolines">
                            <span class="pill-text-twolines">${tab.name}</span>
                        </div>
                    </div>
                    ${tab.isPreselected ? '<span class="preselected-star">⭐</span>' : ''}
                </button>
            `;
        }).join('');
    }

    // ================================================
    // GESTION DES EMAILS - MÉTHODES HARMONISÉES
    // ================================================
    renderEmailsList() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        console.log(`[PageManager] 📧 Rendu liste emails: ${emails.length} total, catégorie: ${this.currentCategory}`);
        
        // Appliquer le filtre de catégorie
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'other') {
                // CORRECTION CRITIQUE: Filtrer correctement les emails "Autre"
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
        
        // Appliquer le filtre de recherche
        if (this.searchTerm) {
            const beforeSearch = filteredEmails.length;
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
            console.log(`[PageManager] 🔍 Après recherche "${this.searchTerm}": ${filteredEmails.length} (était ${beforeSearch})`);
        }
        
        // Affichage si aucun email trouvé
        if (filteredEmails.length === 0) {
            console.log('[PageManager] 📭 Aucun email à afficher');
            return this.renderEmptyState();
        }

        // Rendu selon le mode de vue
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
            <div class="tasks-harmonized-list">
                ${emails.map(email => this.renderHarmonizedEmailRow(email)).join('')}
            </div>
        `;
    }

    renderHarmonizedEmailRow(email) {
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        
        // Récupérer les catégories pré-sélectionnées avec synchronisation forcée
        const preselectedCategories = this.getTaskPreselectedCategories();
        
        // Double vérification: le flag email.isPreselectedForTasks ET l'appartenance à une catégorie pré-sélectionnée
        let isPreselectedForTasks = email.isPreselectedForTasks === true;
        
        // Si le flag n'est pas défini mais que la catégorie est pré-sélectionnée, le corriger
        if (!isPreselectedForTasks && preselectedCategories.includes(email.category)) {
            isPreselectedForTasks = true;
            email.isPreselectedForTasks = true;
        }
        
        // CORRECTION CRITIQUE: Un email pré-sélectionné doit être automatiquement sélectionné pour création de tâche
        const isSelected = this.selectedEmails.has(email.id) || isPreselectedForTasks;
        
        // Si l'email est pré-sélectionné mais pas encore dans la sélection, l'ajouter
        if (isPreselectedForTasks && !this.selectedEmails.has(email.id)) {
            this.selectedEmails.add(email.id);
        }
        
        // Classes CSS pour l'email
        const cardClasses = [
            'task-harmonized-card',
            isSelected ? 'selected' : '',
            hasTask ? 'has-task' : '',
            isPreselectedForTasks ? 'preselected-task' : '',
            email.webSimulated ? 'web-simulated' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${cardClasses}" 
                 data-email-id="${email.id}"
                 data-category="${email.category}"
                 data-preselected="${isPreselectedForTasks}"
                 onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                
                <!-- Checkbox de sélection avec gestion d'événement corrigée -->
                <input type="checkbox" 
                       class="task-checkbox-harmonized" 
                       ${isSelected ? 'checked' : ''}
                       onchange="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                
                <!-- Indicateur de priorité avec couleur spéciale si pré-sélectionné -->
                <div class="priority-bar-harmonized" 
                     style="background-color: ${isPreselectedForTasks ? '#8b5cf6' : this.getEmailPriorityColor(email)}"></div>
                
                <!-- Contenu principal -->
                <div class="task-main-content-harmonized">
                    <div class="task-header-harmonized">
                        <h3 class="task-title-harmonized">${this.escapeHtml(email.subject || 'Sans sujet')}</h3>
                        <div class="task-meta-harmonized">
                            <span class="task-type-badge-harmonized">
                                ${email.webSimulated ? '🤖 Simulé' : '📧 Email'}
                            </span>
                            <span class="deadline-badge-harmonized">
                                📅 ${this.formatEmailDate(email.receivedDateTime)}
                            </span>
                            ${isPreselectedForTasks ? `
                                <span class="preselected-badge-harmonized">
                                    ⭐ Pré-sélectionné
                                </span>
                            ` : ''}
                            ${this.syncState.startScanSynced && email.webSimulated ? `
                                <span class="sync-badge-harmonized">
                                    🔄 Synchronisé
                                </span>
                            ` : ''}
                            ${email.categoryConfidence ? `
                                <span class="confidence-badge-harmonized">
                                    🎯 ${Math.round(email.categoryConfidence * 100)}%
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="task-recipient-harmonized">
                        <i class="fas fa-envelope"></i>
                        <span class="recipient-name-harmonized">${this.escapeHtml(senderName)}</span>
                        ${email.hasAttachments ? '<span class="reply-indicator-harmonized">• Pièce jointe</span>' : ''}
                        ${email.category && email.category !== 'other' ? `
                            <span class="category-indicator-harmonized" 
                                  style="background: ${this.getCategoryColor(email.category)}20; 
                                         color: ${this.getCategoryColor(email.category)};
                                         ${isPreselectedForTasks ? 'font-weight: 700;' : ''}">
                                ${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}
                                ${isPreselectedForTasks ? ' ⭐' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Actions rapides -->
                <div class="task-actions-harmonized">
                    ${this.renderHarmonizedEmailActions(email)}
                </div>
            </div>
        `;
    }

    renderHarmonizedEmailActions(email) {
        const hasTask = this.createdTasks.has(email.id);
        const actions = [];
        
        if (!hasTask) {
            actions.push(`
                <button class="action-btn-harmonized create-task" 
                        onclick="event.stopPropagation(); window.pageManager.showTaskCreationModal('${email.id}')"
                        title="Créer une tâche">
                    <i class="fas fa-tasks"></i>
                </button>
            `);
        } else {
            actions.push(`
                <button class="action-btn-harmonized view-task" 
                        onclick="event.stopPropagation(); window.pageManager.openCreatedTask('${email.id}')"
                        title="Voir la tâche">
                    <i class="fas fa-check-circle"></i>
                </button>
            `);
        }
        
        actions.push(`
            <button class="action-btn-harmonized details" 
                    onclick="event.stopPropagation(); window.pageManager.showEmailModal('${email.id}')"
                    title="Voir l'email">
                <i class="fas fa-eye"></i>
            </button>
        `);
        
        return actions.join('');
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="tasks-grouped-harmonized">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
    }

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="task-group-harmonized" data-group-key="${group.key}">
                <div class="group-header-harmonized" onclick="event.preventDefault(); event.stopPropagation(); window.pageManager.toggleGroup('${group.key}', event)">
                    <div class="group-avatar-harmonized" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info-harmonized">
                        <div class="group-name-harmonized">${displayName}</div>
                        <div class="group-meta-harmonized">${group.count} email${group.count > 1 ? 's' : ''} • ${this.formatEmailDate(group.latestDate)}</div>
                    </div>
                    <div class="group-expand-harmonized" onclick="event.preventDefault(); event.stopPropagation();">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content-harmonized" style="display: none;">
                    ${group.emails.map(email => this.renderHarmonizedEmailRow(email)).join('')}
                </div>
            </div>
        `;
    }

    // ================================================
    // EMAIL MANAGEMENT AVEC SYNCHRONISATION
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
        
        // Mise à jour immédiate de la checkbox spécifique
        const checkbox = document.querySelector(`[data-email-id="${emailId}"] .task-checkbox-harmonized`);
        if (checkbox) {
            checkbox.checked = this.selectedEmails.has(emailId);
        }
        
        // Mise à jour des compteurs et boutons SANS reconstruire toute la liste
        this.updateControlsBarOnly();
        
        console.log('[PageManager] Sélection mise à jour. Total sélectionnés:', this.selectedEmails.size);
    }

    updateControlsBarOnly() {
        const selectedCount = this.selectedEmails.size;
        const visibleEmails = this.getVisibleEmails();
        
        console.log('[PageManager] Mise à jour contrôles uniquement -', selectedCount, 'sélectionnés');
        
        // Mettre à jour le bouton "Créer tâches"
        const createTaskBtn = document.querySelector('.btn-primary[onclick*="createTasksFromSelection"]');
        if (createTaskBtn) {
            const span = createTaskBtn.querySelector('span');
            const countBadge = createTaskBtn.querySelector('.count-badge-main');
            
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
                    countBadge.style.display = 'block';
                } else {
                    countBadge.style.display = 'none';
                }
            } else if (selectedCount > 0) {
                // Créer le badge s'il n'existe pas
                const newBadge = document.createElement('span');
                newBadge.className = 'count-badge-main';
                newBadge.textContent = selectedCount;
                createTaskBtn.appendChild(newBadge);
            }
        }
        
        // Mettre à jour le bouton "Actions"
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
        
        // Gérer le bouton "Effacer sélection"
        const existingClearBtn = document.querySelector('.btn-clear-selection');
        const actionButtonsContainer = document.querySelector('.action-buttons-expanded');
        
        if (selectedCount > 0) {
            if (!existingClearBtn && actionButtonsContainer) {
                // Créer le bouton "Effacer sélection"
                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn-expanded btn-clear-selection';
                clearBtn.onclick = () => window.pageManager.clearSelection();
                clearBtn.title = 'Effacer la sélection';
                clearBtn.innerHTML = `
                    <i class="fas fa-times"></i>
                    <span>Effacer (${selectedCount})</span>
                `;
                actionButtonsContainer.appendChild(clearBtn);
            } else if (existingClearBtn) {
                // Mettre à jour le texte du bouton existant
                const span = existingClearBtn.querySelector('span');
                if (span) {
                    span.textContent = `Effacer (${selectedCount})`;
                }
            }
        } else {
            // Supprimer le bouton si aucune sélection
            if (existingClearBtn) {
                existingClearBtn.remove();
            }
        }
        
        console.log('[PageManager] Contrôles mis à jour -', selectedCount, 'sélectionnés');
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.refreshEmailsView();
        this.showToast('Sélection effacée', 'info');
    }

    refreshEmailsView() {
        console.log('[PageManager] Rafraîchissement vue emails...');
        
        // Sauvegarder l'état des groupes ouverts
        const expandedGroups = new Set();
        document.querySelectorAll('.task-group-harmonized.expanded').forEach(group => {
            const groupKey = group.dataset.groupKey;
            if (groupKey) {
                expandedGroups.add(groupKey);
            }
        });
        
        // Sauvegarder l'état de recherche
        const searchInput = document.getElementById('emailSearchInput');
        const currentSearchValue = searchInput ? searchInput.value : this.searchTerm;
        
        // Mettre à jour seulement le contenu des emails
        const emailsContainer = document.querySelector('.tasks-container-harmonized');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
            
            // Restaurer l'état des groupes ouverts
            expandedGroups.forEach(groupKey => {
                const group = document.querySelector(`[data-group-key="${groupKey}"]`);
                if (group) {
                    const content = group.querySelector('.group-content-harmonized');
                    const icon = group.querySelector('.group-expand-harmonized i');
                    const header = group.querySelector('.group-header-harmonized');
                    
                    if (content && icon && header) {
                        content.style.display = 'block';
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                        group.classList.add('expanded');
                        header.classList.add('expanded-header');
                    }
                }
            });
            
            console.log('[PageManager] Groupes restaurés:', expandedGroups.size);
        }
        
        // Mettre à jour seulement les contrôles
        this.updateControlsBarOnly();
        
        // Restaurer la recherche
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
            // Vérifier l'état de synchronisation
            await this.checkEmailSyncStatus();
            
            // Si EmailScanner a une méthode de re-catégorisation, l'utiliser
            if (this.safeCall(() => window.emailScanner?.recategorizeEmails)) {
                await window.emailScanner.recategorizeEmails();
            }
            
            // Recharger la page emails
            await this.loadPage('emails');
            this.showToast('Emails actualisés', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur d\'actualisation', 'error');
        }
    }

    // ================================================
    // GESTION DES FILTRES ET NAVIGATION
    // ================================================
    filterByCategory(categoryId) {
        console.log(`[PageManager] 🔍 Filtrage par catégorie: ${categoryId}`);
        
        this.currentCategory = categoryId;
        
        // Debug du filtrage
        const emails = this.getAllEmails();
        let filteredEmails;
        
        if (categoryId === 'all') {
            filteredEmails = emails;
            console.log(`[PageManager] 📧 Affichage de tous les emails: ${emails.length}`);
        } else if (categoryId === 'other') {
            // CORRECTION CRITIQUE: Filtrer correctement les emails "Autre"
            filteredEmails = emails.filter(email => {
                const cat = email.category;
                return !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
            });
            console.log(`[PageManager] 📌 Emails "Autre" trouvés: ${filteredEmails.length}`);
            
            // Debug des emails "Autre"
            if (filteredEmails.length > 0) {
                console.log('[PageManager] 🔍 Échantillon emails "Autre":', 
                    filteredEmails.slice(0, 3).map(e => ({
                        subject: e.subject?.substring(0, 40),
                        category: e.category,
                        categoryType: typeof e.category,
                        from: e.from?.emailAddress?.address
                    }))
                );
            }
        } else {
            filteredEmails = emails.filter(email => email.category === categoryId);
            console.log(`[PageManager] 🏷️ Emails dans catégorie "${categoryId}": ${filteredEmails.length}`);
        }
        
        // Mettre à jour l'affichage
        this.refreshEmailsView();
        
        // Mettre à jour visuellement le bouton actif
        document.querySelectorAll('.status-pill-harmonized-twolines').forEach(pill => {
            const pillCategoryId = pill.dataset.categoryId;
            if (pillCategoryId === categoryId) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
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
        // Arrêter la propagation pour éviter les conflits
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
        
        const content = group.querySelector('.group-content-harmonized');
        const icon = group.querySelector('.group-expand-harmonized i');
        const header = group.querySelector('.group-header-harmonized');
        
        if (!content || !icon || !header) {
            console.error('[PageManager] Éléments du groupe manquants');
            return;
        }
        
        const isExpanded = content.style.display !== 'none';
        
        if (isExpanded) {
            // Fermer le groupe
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
            header.classList.remove('expanded-header');
            console.log('[PageManager] Groupe fermé:', groupKey);
        } else {
            // Ouvrir le groupe
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
            header.classList.add('expanded-header');
            console.log('[PageManager] Groupe ouvert:', groupKey);
        }
    }

    handleEmailClick(event, emailId) {
        // Empêcher la propagation si c'est un clic sur checkbox
        if (event.target.type === 'checkbox') {
            console.log('[PageManager] Clic checkbox détecté, arrêt propagation');
            return;
        }
        
        // Empêcher la propagation si c'est un clic sur les actions
        if (event.target.closest('.task-actions-harmonized')) {
            console.log('[PageManager] Clic action détecté, arrêt propagation');
            return;
        }
        
        // Empêcher la propagation si c'est un clic dans un groupe header
        if (event.target.closest('.group-header-harmonized')) {
            console.log('[PageManager] Clic dans group header, arrêt propagation');
            return;
        }
        
        // Vérifier si c'est un double-clic pour sélection
        const now = Date.now();
        const lastClick = this.lastEmailClick || 0;
        
        if (now - lastClick < 300) {
            // Double-clic = toggle sélection
            console.log('[PageManager] Double-clic détecté, toggle sélection');
            event.preventDefault();
            event.stopPropagation();
            this.toggleEmailSelection(emailId);
            this.lastEmailClick = 0;
            return;
        }
        
        this.lastEmailClick = now;
        
        // Simple clic = ouvrir modal après délai pour permettre double-clic
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
    // ACTIONS BULK AMÉLIORÉES
    // ================================================
    toggleBulkActions(event) {
        event.stopPropagation();
        event.preventDefault();
        
        const menu = document.getElementById('bulkActionsMenu');
        const button = event.currentTarget;
        
        if (!menu || !button) return;
        
        const isCurrentlyVisible = menu.classList.contains('show');
        
        // Fermer tous les autres dropdowns
        document.querySelectorAll('.dropdown-menu-expanded.show').forEach(dropdown => {
            if (dropdown !== menu) {
                dropdown.classList.remove('show');
            }
        });
        
        // Retirer les classes show des autres boutons
        document.querySelectorAll('.dropdown-toggle.show').forEach(btn => {
            if (btn !== button) {
                btn.classList.remove('show');
            }
        });
        
        // Supprimer l'overlay existant
        const existingOverlay = document.querySelector('.dropdown-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        if (isCurrentlyVisible) {
            // Fermer le menu
            menu.classList.remove('show');
            button.classList.remove('show');
            console.log('[PageManager] Dropdown Actions fermé');
        } else {
            // Ouvrir le menu
            menu.classList.add('show');
            button.classList.add('show');
            console.log('[PageManager] Dropdown Actions ouvert');
            
            // S'assurer que le menu a le z-index maximum
            menu.style.zIndex = '9999';
            menu.style.position = 'absolute';
            
            // Créer un overlay pour détecter les clics à l'extérieur
            const overlay = document.createElement('div');
            overlay.className = 'dropdown-overlay show';
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 9998 !important;
                background: rgba(0, 0, 0, 0.05) !important;
                cursor: pointer !important;
                display: block !important;
            `;
            
            // Fermer le dropdown quand on clique sur l'overlay
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.remove('show');
                button.classList.remove('show');
                overlay.remove();
                console.log('[PageManager] Dropdown fermé via overlay');
            });
            
            // Ajouter l'overlay au body (pas dans le container des emails)
            document.body.appendChild(overlay);
            
            // Fermer avec Escape
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
            
            // Empêcher la fermeture quand on clique dans le menu
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Auto-fermeture après 15 secondes
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
        
        if (window.emailScanner) {
            await window.emailScanner.performBatchAction(selectedEmails, 'markAsRead');
        } else {
            this.showToast(`${selectedEmails.length} emails marqués comme lus`, 'success');
        }
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
            if (window.emailScanner) {
                await window.emailScanner.performBatchAction(selectedEmails, 'delete');
            } else {
                this.showToast(`${selectedEmails.length} emails supprimés`, 'success');
            }
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
            const emails = selectedEmails.map(id => this.getEmailById(id)).filter(Boolean);
            
            const csvContent = [
                ['De', 'Sujet', 'Date', 'Catégorie', 'Contenu'].join(','),
                ...emails.map(email => [
                    `"${email.from?.emailAddress?.name || email.from?.emailAddress?.address || ''}"`,
                    `"${email.subject || ''}"`,
                    email.receivedDateTime ? new Date(email.receivedDateTime).toLocaleDateString('fr-FR') : '',
                    `"${this.getCategoryName(email.category)}"`,
                    `"${(email.bodyPreview || '').substring(0, 100)}"`
                ].join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `emails_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Export terminé', 'success');
        }
        this.clearSelection();
    }

    // ================================================
    // CRÉATION DE TÂCHES AVEC SYNCHRONISATION
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
                    // Fallback: créer une tâche simple sans analyse IA
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
    // MODALS AMÉLIORÉES
    // ================================================
    showEmailModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'email_modal_' + Date.now();
        const syncBadge = email.webSimulated && this.syncState.startScanSynced ? 
            '<span class="sync-badge">🔄 Synchronisé depuis StartScan</span>' : '';
        
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>Email Complet</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="email-header">
                            <div class="email-field">
                                <span class="field-label">De:</span>
                                <span class="field-value">${email.from?.emailAddress?.name || ''} &lt;${email.from?.emailAddress?.address || ''}&gt;</span>
                            </div>
                            <div class="email-field">
                                <span class="field-label">Date:</span>
                                <span class="field-value">${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="email-field">
                                <span class="field-label">Sujet:</span>
                                <span class="field-value">${email.subject || 'Sans sujet'}</span>
                            </div>
                            ${email.category ? `
                                <div class="email-field">
                                    <span class="field-label">Catégorie:</span>
                                    <span class="field-value">${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}</span>
                                </div>
                            ` : ''}
                            ${email.categoryConfidence ? `
                                <div class="email-field">
                                    <span class="field-label">Confiance IA:</span>
                                    <span class="field-value">${Math.round(email.categoryConfidence * 100)}%</span>
                                </div>
                            ` : ''}
                            ${syncBadge}
                        </div>
                        <div class="email-body">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="btn btn-secondary">
                            Fermer
                        </button>
                        ${!this.createdTasks.has(emailId) ? `
                            <button onclick="document.getElementById('${uniqueId}').remove(); window.pageManager.showTaskCreationModal('${emailId}');" class="btn btn-primary">
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
        const modalHTML = this.buildTaskCreationModal(uniqueId, email, analysis);

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    buildTaskCreationModal(uniqueId, email, analysis) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || '';
        
        const enhancedTitle = analysis?.mainTask?.title?.includes(senderName) ? 
            analysis.mainTask.title : 
            (analysis?.mainTask?.title || `Email de ${senderName}`);
        
        return `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; 
                            max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">Créer une tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        ${this.buildTaskCreationForm(email, analysis)}
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
    }

    buildTaskCreationForm(email, analysis) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || '';
        
        const enhancedTitle = analysis?.mainTask?.title?.includes(senderName) ? 
            analysis.mainTask.title : 
            (analysis?.mainTask?.title || `Email de ${senderName}`);
        
        return `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                ${analysis ? `
                    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-robot" style="color: #0ea5e9; font-size: 20px;"></i>
                        <span style="color: #0c4a6e; font-weight: 600;">Analyse intelligente par Claude AI</span>
                    </div>
                ` : `
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 20px;"></i>
                        <span style="color: #92400e; font-weight: 600;">Création manuelle - Analyse IA non disponible</span>
                    </div>
                `}
                
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 48px; height: 48px; background: ${this.generateAvatarColor(senderName)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                        ${senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1f2937; font-size: 16px;">${senderName}</div>
                        <div style="color: #6b7280; font-size: 14px;">${senderEmail}</div>
                        <div style="color: #9ca3af; font-size: 12px;">@${senderDomain}</div>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Titre de la tâche</label>
                    <input type="text" id="task-title" 
                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                           value="${enhancedTitle}" 
                           onfocus="this.style.borderColor='#3b82f6'"
                           onblur="this.style.borderColor='#e5e7eb'" />
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Description</label>
                    <textarea id="task-description" 
                              style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical; min-height: 100px; transition: border-color 0.2s;"
                              onfocus="this.style.borderColor='#3b82f6'"
                              onblur="this.style.borderColor='#e5e7eb'"
                              rows="4">${analysis?.mainTask?.description || analysis?.summary || email.bodyPreview || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Priorité</label>
                        <select id="task-priority" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='#3b82f6'"
                                onblur="this.style.borderColor='#e5e7eb'">
                            <option value="urgent" ${analysis?.mainTask?.priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                            <option value="high" ${analysis?.mainTask?.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                            <option value="medium" ${!analysis?.mainTask?.priority || analysis?.mainTask?.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                            <option value="low" ${analysis?.mainTask?.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Date d'échéance</label>
                        <input type="date" id="task-duedate" 
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#3b82f6'"
                               onblur="this.style.borderColor='#e5e7eb'"
                               value="${analysis?.mainTask?.dueDate || ''}" />
                    </div>
                </div>
                
                ${this.syncState.startScanSynced && email.webSimulated ? `
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; color: #059669; font-size: 13px; font-weight: 500;">
                        <i class="fas fa-info-circle"></i>
                        <span>Email synchronisé depuis la simulation StartScan</span>
                    </div>
                ` : ''}
                
                <div>
                    <button onclick="window.pageManager.toggleEmailContext()" 
                            style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; transition: background 0.2s;"
                            onmouseover="this.style.background='#f1f5f9'"
                            onmouseout="this.style.background='#f8fafc'">
                        <i class="fas fa-chevron-right" id="context-toggle-icon" style="transition: transform 0.2s;"></i>
                        <span>Afficher le contenu original de l'email</span>
                    </button>
                    <div id="email-context-content" style="display: none; margin-top: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                            <div style="margin-bottom: 4px;"><strong>De:</strong> ${senderName} &lt;${senderEmail}&gt;</div>
                            <div style="margin-bottom: 4px;"><strong>Date:</strong> ${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</div>
                            <div><strong>Sujet:</strong> ${email.subject || 'Sans sujet'}</div>
                        </div>
                        <div style="max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 1.5; color: #374151;">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleEmailContext() {
        const content = document.getElementById('email-context-content');
        const icon = document.getElementById('context-toggle-icon');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
            icon.style.transform = 'rotate(90deg)';
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
            icon.style.transform = 'rotate(0deg)';
        }
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
    // AUTRES PAGES RENDERERS
    // ================================================
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
            this.addScannerStyles();
            return;
        }
        
        // User is authenticated, try to use the scan module
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            try {
                await window.minimalScanModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] Error with minimalScanModule:', error);
            }
        }
        
        // Fallback scanner interface
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
        
        this.addScannerStyles();
    }

    async startFallbackScan() {
        console.log('[PageManager] Starting fallback simulation scan...');
        
        try {
            this.showLoading('Simulation de scan en cours...');
            
            // Utiliser EmailScanner directement si disponible
            if (window.emailScanner && typeof window.emailScanner.scan === 'function') {
                const results = await window.emailScanner.scan({
                    days: 7,
                    simulationMode: true,
                    onProgress: (progress) => {
                        console.log('[PageManager] Scan progress:', progress);
                    }
                });
                
                console.log(`[PageManager] Fallback scan completed with ${results.total} emails`);
                
                this.hideLoading();
                this.showToast(`${results.total} emails simulés avec succès!`, 'success');
                
                // Mettre à jour l'état de synchronisation
                this.syncState.emailScannerSynced = true;
                this.syncState.emailCount = results.total;
                this.lastScanData = results;
                
                // Rediriger vers les emails
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
                <div class="sync-debug">
                    <small>Debug sync: EmailScanner=${this.syncState.emailScannerSynced}, StartScan=${this.syncState.startScanSynced}, CategoryManager=${this.syncState.categoryManagerSynced}, Count=${this.syncState.emailCount}</small>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        console.log(`[PageManager] 📭 Rendu état vide - Catégorie: ${this.currentCategory}, Recherche: "${this.searchTerm}"`);
        
        let title, text, action = '';
        
        if (this.searchTerm) {
            // État vide à cause de la recherche
            title = 'Aucun résultat trouvé';
            text = `Aucun email ne correspond à votre recherche "${this.searchTerm}"`;
            action = `
                <button class="btn-harmonized btn-primary" onclick="window.pageManager.clearSearch()">
                    <i class="fas fa-undo"></i>
                    <span>Effacer la recherche</span>
                </button>
            `;
        } else if (this.currentCategory === 'other') {
            // État vide pour la catégorie "Autre"
            title = 'Aucun email non catégorisé';
            text = 'Tous vos emails ont été correctement catégorisés ! 🎉';
            action = `
                <button class="btn-harmonized btn-primary" onclick="window.pageManager.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else if (this.currentCategory && this.currentCategory !== 'all') {
            // État vide pour une catégorie spécifique
            const categoryName = this.getCategoryName(this.currentCategory);
            title = `Aucun email dans "${categoryName}"`;
            text = 'Cette catégorie ne contient aucun email pour le moment.';
            action = `
                <button class="btn-harmonized btn-primary" onclick="window.pageManager.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else {
            // État vide général (aucun email du tout)
            title = 'Aucun email trouvé';
            text = 'Utilisez le scanner pour récupérer et analyser vos emails.';
            action = `
                <button class="btn-harmonized btn-primary" onclick="window.pageManager.loadPage('scanner')">
                    <i class="fas fa-search"></i>
                    <span>Aller au scanner</span>
                </button>
            `;
        }
        
        return `
            <div class="empty-state-harmonized">
                <div class="empty-state-icon-harmonized">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title-harmonized">${title}</h3>
                <p class="empty-state-text-harmonized">${text}</p>
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
        
        console.log(`[PageManager] 👁️ Calcul emails visibles: ${emails.length} total, catégorie: ${this.currentCategory}`);
        
        // Appliquer le filtre de catégorie
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'other') {
                // CORRECTION CRITIQUE: Filtrer correctement les emails "Autre"
                filteredEmails = filteredEmails.filter(email => {
                    const cat = email.category;
                    const isOther = !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
                    return isOther;
                });
                console.log(`[PageManager] 📌 Emails "Autre" visibles: ${filteredEmails.length}`);
            } else {
                filteredEmails = filteredEmails.filter(email => email.category === this.currentCategory);
                console.log(`[PageManager] 🏷️ Emails catégorie "${this.currentCategory}" visibles: ${filteredEmails.length}`);
            }
        }
        
        // Appliquer le filtre de recherche
        if (this.searchTerm) {
            const beforeSearch = filteredEmails.length;
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
            console.log(`[PageManager] 🔍 Après recherche "${this.searchTerm}": ${filteredEmails.length} visibles (était ${beforeSearch})`);
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
            
            // Si l'email a une catégorie valide
            if (cat && cat !== 'other' && cat !== null && cat !== undefined && cat !== '') {
                counts[cat] = (counts[cat] || 0) + 1;
            } else {
                // Email non catégorisé -> dans "other"
                uncategorizedCount++;
            }
        });
        
        // CORRECTION CRITIQUE: Toujours inclure "other" si il y a des emails non catégorisés
        if (uncategorizedCount > 0) {
            counts.other = uncategorizedCount;
            console.log(`[PageManager] 📌 ${uncategorizedCount} emails dans la catégorie "Autre"`);
        }
        
        // Debug des comptages
        console.log('[PageManager] 📊 Comptages finaux:', {
            categories: counts,
            totalEmails: emails.length,
            sumCounts: Object.values(counts).reduce((sum, count) => sum + count, 0)
        });
        
        // Vérification de cohérence
        const totalCounted = Object.values(counts).reduce((sum, count) => sum + count, 0);
        if (totalCounted !== emails.length) {
            console.error(`[PageManager] ❌ ERREUR COMPTAGE: ${totalCounted} comptés vs ${emails.length} emails totaux`);
        }
        
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
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.color) return category.color;
        }
        
        // Priorité 2: Categories locales
        const category = this.getCategories()[categoryId];
        if (category && category.color) return category.color;
        
        // Fallback
        return '#64748b';
    }

    getCategoryIcon(categoryId) {
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.icon) return category.icon;
        }
        
        // Priorité 2: Categories locales
        const category = this.getCategories()[categoryId];
        if (category && category.icon) return category.icon;
        
        // Fallback
        return '📌';
    }

    getCategoryName(categoryId) {
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getCategory) {
            const category = window.categoryManager.getCategory(categoryId);
            if (category && category.name) return category.name;
        }
        
        // Priorité 2: Categories locales
        const category = this.getCategories()[categoryId];
        if (category && category.name) return category.name;
        
        // Fallback
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
    // UTILITY METHODS
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
    // STYLES MODERNES UNIFIÉS
    // ================================================
    addExpandedEmailStyles() {
        if (document.getElementById('expandedEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'expandedEmailStyles';
        styles.textContent = `
            /* Variables CSS étendues */
            :root {
                --btn-height: 44px;
                --btn-padding-horizontal: 16px;
                --btn-font-size: 13px;
                --btn-border-radius: 10px;
                --btn-font-weight: 600;
                --btn-gap: 8px;
                --card-height: 76px;
                --card-padding: 14px;
                --card-border-radius: 12px;
                --action-btn-size: 36px;
                --gap-small: 8px;
                --gap-medium: 12px;
                --gap-large: 16px;
                --transition-speed: 0.2s;
                --shadow-base: 0 2px 8px rgba(0, 0, 0, 0.05);
                --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
                --preselect-color: #8b5cf6;
                --preselect-color-light: #a78bfa;
                --preselect-color-dark: #7c3aed;
                --sync-color: #10b981;
            }
            
            .tasks-page-modern {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                padding: var(--gap-large);
                font-size: var(--btn-font-size);
            }

            .explanation-text-harmonized {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: var(--card-border-radius);
                padding: var(--gap-medium);
                margin-bottom: var(--gap-medium);
                display: flex;
                align-items: center;
                gap: var(--gap-medium);
                color: #1e40af;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.5;
                backdrop-filter: blur(10px);
                position: relative;
            }

            .explanation-text-harmonized i {
                font-size: 16px;
                color: #3b82f6;
                flex-shrink: 0;
            }
            
            .explanation-close-btn {
                position: absolute;
                top: 8px;
                right: 8px;
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
                transition: all 0.2s ease;
            }
            
            .explanation-close-btn:hover {
                background: rgba(59, 130, 246, 0.2);
                transform: scale(1.1);
            }
            
            /* Indicateur de synchronisation */
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
            
            .sync-badge.startscan {
                color: #8b5cf6;
                border-color: rgba(139, 92, 246, 0.3);
            }
            
            .sync-badge.emailscanner {
                color: #10b981;
                border-color: rgba(16, 185, 129, 0.3);
            }
            
            .sync-badge.categorymanager {
                color: #f59e0b;
                border-color: rgba(245, 158, 11, 0.3);
            }
            
            /* Badge de synchronisation dans les emails */
            .sync-badge-harmonized {
                background: linear-gradient(135deg, var(--sync-color) 0%, #059669 100%);
                color: white !important;
                border: none !important;
                font-weight: 700 !important;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 3px;
                white-space: nowrap;
            }
            
            /* Badge de confiance */
            .confidence-badge-harmonized {
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
            
            /* ===== BARRE DE CONTRÔLES ÉTENDUE SUR 2 LIGNES ===== */
            .controls-bar-harmonized-expanded {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: var(--card-border-radius);
                padding: var(--gap-large);
                margin-bottom: var(--gap-medium);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
                display: flex;
                flex-direction: column;
                gap: var(--gap-large);
                position: relative;
                z-index: 1000;
            }
            
            /* PREMIÈRE LIGNE : Recherche étendue */
            .search-line-full {
                width: 100%;
                display: flex;
                justify-content: center;
            }
            
            .search-box-full {
                position: relative;
                width: 100%;
                max-width: 800px;
                height: calc(var(--btn-height) + 8px);
                display: flex;
                align-items: center;
            }
            
            .search-input-full {
                width: 100%;
                height: 100%;
                padding: 0 var(--gap-large) 0 56px;
                border: 2px solid #e5e7eb;
                border-radius: calc(var(--btn-border-radius) + 4px);
                font-size: calc(var(--btn-font-size) + 2px);
                background: #f9fafb;
                transition: all var(--transition-speed) ease;
                outline: none;
                font-weight: 500;
                color: #374151;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .search-input-full:focus {
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05);
                transform: translateY(-1px);
            }
            
            .search-input-full::placeholder {
                color: #9ca3af;
                font-weight: 400;
            }
            
            .search-icon-full {
                position: absolute;
                left: var(--gap-large);
                color: #6b7280;
                pointer-events: none;
                font-size: 18px;
                z-index: 1;
            }
            
            .search-input-full:focus + .search-icon-full {
                color: #3b82f6;
            }
            
            .search-clear-full {
                position: absolute;
                right: var(--gap-medium);
                background: #ef4444;
                color: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all var(--transition-speed) ease;
                box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
            }
            
            .search-clear-full:hover {
                background: #dc2626;
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
            }
            
            /* SECONDE LIGNE : Tous les boutons */
            .buttons-line-full {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--gap-large);
                width: 100%;
            }
            
            /* Modes de vue étendus */
            .view-modes-expanded {
                display: flex;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: var(--btn-border-radius);
                padding: 4px;
                gap: 2px;
                height: var(--btn-height);
                flex-shrink: 0;
            }
            
            .view-mode-expanded {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--btn-gap);
                padding: 0 var(--btn-padding-horizontal);
                height: calc(var(--btn-height) - 8px);
                border: none;
                background: transparent;
                color: #6b7280;
                border-radius: calc(var(--btn-border-radius) - 2px);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                min-width: 120px;
                white-space: nowrap;
            }
            
            .view-mode-expanded:hover {
                background: rgba(255, 255, 255, 0.8);
                color: #374151;
                transform: translateY(-1px);
            }
            
            .view-mode-expanded.active {
                background: white;
                color: #1f2937;
                box-shadow: var(--shadow-base);
                font-weight: 700;
                transform: translateY(-1px);
            }
            
            /* Séparateur visuel */
            .buttons-separator {
                width: 1px;
                height: calc(var(--btn-height) - 8px);
                background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
                flex-shrink: 0;
            }
            
            /* Actions étendues */
            .action-buttons-expanded {
                display: flex;
                align-items: center;
                gap: var(--gap-medium);
                flex: 1;
                justify-content: flex-end;
                position: relative;
                z-index: 1001;
            }
            
            .btn-expanded {
                height: var(--btn-height);
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                border-radius: var(--btn-border-radius);
                padding: 0 var(--btn-padding-horizontal);
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                display: flex;
                align-items: center;
                gap: var(--btn-gap);
                box-shadow: var(--shadow-base);
                position: relative;
                white-space: nowrap;
                flex-shrink: 0;
            }
            
            .btn-expanded:hover {
                background: #f9fafb;
                border-color: #6366f1;
                color: #1f2937;
                transform: translateY(-1px);
                box-shadow: var(--shadow-hover);
            }
            
            /* Boutons désactivés */
            .btn-expanded.disabled {
                opacity: 0.5;
                cursor: not-allowed !important;
                pointer-events: none;
            }
            
            .btn-expanded.disabled:hover {
                transform: none !important;
                box-shadow: var(--shadow-base) !important;
                background: white !important;
                border-color: #e5e7eb !important;
            }
            
            .btn-expanded.btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
                font-weight: 700;
            }
            
            .btn-expanded.btn-primary:hover {
                background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
            }
            
            .btn-expanded.btn-primary.disabled {
                background: #e5e7eb !important;
                color: #9ca3af !important;
                box-shadow: var(--shadow-base) !important;
            }
            
            .btn-expanded.btn-secondary {
                background: #f8fafc;
                color: #475569;
                border-color: #e2e8f0;
            }
            
            .btn-expanded.btn-secondary:hover {
                background: #f1f5f9;
                color: #334155;
                border-color: #cbd5e1;
            }
            
            .count-badge-main {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 3px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
                border: 2px solid white;
                animation: badgePulse 2s ease-in-out infinite;
            }
            
            @keyframes badgePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .btn-expanded.btn-clear-selection {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
                font-weight: 600;
            }
            
            .btn-expanded.btn-clear-selection:hover {
                background: #fee2e2;
                color: #b91c1c;
                border-color: #fca5a5;
                transform: translateY(-1px);
            }
            
            /* Dropdown étendu */
            .dropdown-action-expanded {
                position: relative;
                display: inline-block;
                z-index: 1002;
            }
            
            .dropdown-menu-expanded {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: var(--btn-border-radius);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
                min-width: 220px;
                z-index: 9999;
                padding: 8px 0;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(99, 102, 241, 0.2);
            }
            
            .dropdown-menu-expanded.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);
            }
            
            .dropdown-item-expanded {
                display: flex;
                align-items: center;
                gap: var(--gap-medium);
                padding: 12px 16px;
                background: none;
                border: none;
                width: 100%;
                text-align: left;
                color: #374151;
                font-size: var(--btn-font-size);
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .dropdown-item-expanded:hover {
                background: #f8fafc;
                color: #1f2937;
            }
            
            .dropdown-item-expanded.danger {
                color: #dc2626;
            }
            
            .dropdown-item-expanded.danger:hover {
                background: #fef2f2;
                color: #b91c1c;
            }
            
            .dropdown-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 8px 0;
            }
            
            .dropdown-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9998;
                background: rgba(0, 0, 0, 0.1);
                cursor: pointer;
                display: none;
            }
            
            .dropdown-overlay.show {
                display: block;
            }
            
            .dropdown-action-expanded .dropdown-toggle.show {
                background: #f0f9ff;
                border-color: #3b82f6;
                color: #1e40af;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                z-index: 1003;
                position: relative;
            }
            
            /* ===== FILTRES DE CATÉGORIES ===== */
            .status-filters-harmonized-twolines {
                display: flex;
                gap: var(--gap-small);
                margin-bottom: var(--gap-medium);
                flex-wrap: wrap;
                width: 100%;
                position: relative;
                z-index: 10;
            }
            
            .status-pill-harmonized-twolines {
                height: 60px;
                padding: var(--gap-small);
                font-size: 12px;
                font-weight: 700;
                flex: 0 1 calc(16.666% - var(--gap-small));
                min-width: 120px;
                max-width: 180px;
                border-radius: var(--btn-border-radius);
                box-shadow: var(--shadow-base);
                transition: all var(--transition-speed) ease;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                cursor: pointer;
                position: relative;
                overflow: visible;
                z-index: 11;
            }
            
            .status-pill-harmonized-twolines.preselected-category {
                animation: pulsePreselected 3s ease-in-out infinite;
                border-width: 2px;
            }
            
            .status-pill-harmonized-twolines.preselected-category::before {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: inherit;
                background: linear-gradient(45deg, var(--preselect-color), var(--preselect-color-light), var(--preselect-color));
                background-size: 300% 300%;
                animation: gradientShift 4s ease infinite;
                z-index: -1;
                opacity: 0.3;
            }
            
            @keyframes pulsePreselected {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.03); }
            }
            
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .pill-content-twolines {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                width: 100%;
                height: 100%;
                justify-content: center;
            }
            
            .pill-first-line-twolines {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .pill-icon-twolines {
                font-size: 16px;
            }
            
            .pill-count-twolines {
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
                background: var(--preselect-color);
                color: white;
                border-radius: 50%;
                display: flex !important;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
                animation: starPulse 2s ease-in-out infinite;
                z-index: 15;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            @keyframes starPulse {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
                }
                50% { 
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(139, 92, 246, 0.6);
                }
            }
            
            .pill-text-twolines {
                font-weight: 700;
                font-size: 12px;
                line-height: 1.2;
                text-align: center;
            }
            
            .status-pill-harmonized-twolines:hover {
                border-color: #3b82f6;
                background: #f0f9ff;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
                z-index: 12;
            }
            
            .status-pill-harmonized-twolines.active {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border-color: #3b82f6;
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                transform: translateY(-2px);
                z-index: 13;
            }
            
            .status-pill-harmonized-twolines.active.preselected-category {
                background: linear-gradient(135deg, var(--preselect-color) 0%, var(--preselect-color-dark) 100%);
                box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
            }
            
            .status-pill-harmonized-twolines.active .pill-count-twolines {
                background: rgba(255, 255, 255, 0.3);
                color: white;
            }
            
            /* Container des emails */
            .tasks-container-harmonized {
                background: transparent;
            }
            
            .tasks-harmonized-list {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            /* ===== CARTES D'EMAILS AVEC PRÉ-SÉLECTION ===== */
            .task-harmonized-card {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0;
                padding: var(--card-padding);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: var(--card-height);
                max-height: var(--card-height);
                border-bottom: 1px solid #e5e7eb;
                z-index: 1;
            }
            
            .task-harmonized-card:first-child {
                border-top-left-radius: var(--card-border-radius);
                border-top-right-radius: var(--card-border-radius);
                border-top: 1px solid #e5e7eb;
            }
            
            .task-harmonized-card:last-child {
                border-bottom-left-radius: var(--card-border-radius);
                border-bottom-right-radius: var(--card-border-radius);
                border-bottom: 1px solid #e5e7eb;
            }
            
            .task-harmonized-card:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                border-color: rgba(99, 102, 241, 0.2);
                border-left: 3px solid #6366f1;
                z-index: 3;
            }
            
            .task-harmonized-card.selected {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                border-color: #3b82f6;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
                z-index: 4;
            }
            
            .task-harmonized-card.has-task {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 3px solid #22c55e;
            }
            
            .task-harmonized-card.preselected-task {
                background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
                border-left: 3px solid var(--preselect-color);
                border-color: rgba(139, 92, 246, 0.3);
            }
            
            .task-harmonized-card.preselected-task:hover {
                border-left: 4px solid var(--preselect-color);
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
                border-color: rgba(139, 92, 246, 0.4);
            }
            
            .task-harmonized-card.preselected-task.selected {
                background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
                border-left: 4px solid var(--preselect-color);
                border-color: var(--preselect-color);
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
            }
            
            .task-harmonized-card.web-simulated {
                border-left: 3px solid var(--sync-color);
            }
            
            .task-harmonized-card.web-simulated:hover {
                border-left: 4px solid var(--sync-color);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
            }
            
            .task-checkbox-harmonized {
                margin-right: var(--gap-medium);
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 6px;
                border: 2px solid #d1d5db;
                background: white;
                transition: all var(--transition-speed) ease;
                flex-shrink: 0;
                appearance: none;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .task-checkbox-harmonized:checked {
                background: #6366f1;
                border-color: #6366f1;
            }
            
            .task-harmonized-card.preselected-task .task-checkbox-harmonized:checked {
                background: var(--preselect-color);
                border-color: var(--preselect-color);
            }
            
            .task-checkbox-harmonized:checked::after {
                content: '✓';
                color: white;
                font-size: 12px;
                font-weight: 700;
            }
            
            .priority-bar-harmonized {
                width: 4px;
                height: 56px;
                border-radius: 2px;
                margin-right: var(--gap-medium);
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .task-main-content-harmonized {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }
            
            .task-header-harmonized {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: var(--gap-medium);
                margin-bottom: 4px;
            }
            
            .task-title-harmonized {
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
            
            .task-meta-harmonized {
                display: flex;
                align-items: center;
                gap: var(--gap-small);
                flex-shrink: 0;
            }
            
            .task-type-badge-harmonized,
            .deadline-badge-harmonized {
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
            
            .preselected-badge-harmonized {
                display: flex;
                align-items: center;
                gap: 3px;
                background: linear-gradient(135deg, var(--preselect-color) 0%, var(--preselect-color-dark) 100%);
                color: white !important;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700 !important;
                border: none !important;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
                animation: badgePulse 2s ease-in-out infinite;
            }
            
            .task-recipient-harmonized {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }
            
            .recipient-name-harmonized {
                font-weight: 600;
                color: #374151;
            }
            
            .reply-indicator-harmonized {
                color: #dc2626;
                font-weight: 600;
                font-size: 10px;
            }
            
            .category-indicator-harmonized {
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 3px;
                transition: all 0.2s ease;
            }
            
            .task-harmonized-card.preselected-task .category-indicator-harmonized {
                box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
                animation: categoryGlow 2s ease-in-out infinite;
            }
            
            @keyframes categoryGlow {
                0%, 100% { 
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
                }
                50% { 
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.5);
                }
            }
            
            .task-actions-harmonized {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-left: var(--gap-medium);
                flex-shrink: 0;
                z-index: 10;
                position: relative;
            }
            
            .action-btn-harmonized {
                width: var(--action-btn-size);
                height: var(--action-btn-size);
                border: 2px solid transparent;
                border-radius: var(--btn-border-radius);
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
                z-index: 11;
                position: relative;
            }
            
            .action-btn-harmonized:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .action-btn-harmonized.create-task {
                color: #3b82f6;
            }
            
            .action-btn-harmonized.create-task:hover {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
                color: #2563eb;
            }
            
            .task-harmonized-card.preselected-task .action-btn-harmonized.create-task {
                color: var(--preselect-color);
                background: rgba(139, 92, 246, 0.1);
            }
            
            .task-harmonized-card.preselected-task .action-btn-harmonized.create-task:hover {
                background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
                border-color: var(--preselect-color);
                color: var(--preselect-color-dark);
            }
            
            .action-btn-harmonized.view-task {
                color: #16a34a;
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            }
            
            .action-btn-harmonized.view-task:hover {
                background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%);
                border-color: #16a34a;
                color: #15803d;
            }
            
            .action-btn-harmonized.details {
                color: #8b5cf6;
            }
            
            .action-btn-harmonized.details:hover {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-color: #8b5cf6;
                color: #7c3aed;
            }
            
            /* Vue groupée */
            .tasks-grouped-harmonized {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .task-group-harmonized {
                background: transparent;
                border: none;
                border-radius: 0;
                overflow: visible;
                margin: 0;
                padding: 0;
                z-index: 1;
            }
            
            .group-header-harmonized {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0;
                padding: var(--card-padding);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: var(--card-height);
                max-height: var(--card-height);
                border-bottom: 1px solid #e5e7eb;
                gap: var(--gap-medium);
                z-index: 1;
            }
            
            .group-avatar-harmonized {
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
            
            .group-info-harmonized {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }
            
            .group-name-harmonized {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                margin: 0;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .group-meta-harmonized {
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }
            
            .group-expand-harmonized {
                width: var(--action-btn-size);
                height: var(--action-btn-size);
                border: 2px solid transparent;
                border-radius: var(--btn-border-radius);
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
            
            .group-expand-harmonized:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                color: #374151;
            }
            
            .task-group-harmonized.expanded .group-expand-harmonized {
                transform: rotate(180deg) translateY(-1px);
                color: #3b82f6;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
            }
            
            .group-content-harmonized {
                background: transparent;
                margin: 0;
                padding: 0;
                display: none;
            }
            
            .task-group-harmonized.expanded .group-content-harmonized {
                display: block;
            }
            
            .group-content-harmonized .task-harmonized-card {
                border-radius: 0;
                margin: 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .group-content-harmonized .task-harmonized-card:last-child {
                border-bottom-left-radius: var(--card-border-radius);
                border-bottom-right-radius: var(--card-border-radius);
                border-bottom: 1px solid #e5e7eb;
            }
            
            /* État vide */
            .empty-state-harmonized {
                text-align: center;
                padding: 60px 30px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .empty-state-icon-harmonized {
                font-size: 48px;
                margin-bottom: 20px;
                color: #d1d5db;
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .empty-state-title-harmonized {
                font-size: 22px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .empty-state-text-harmonized {
                font-size: 15px;
                margin-bottom: 24px;
                max-width: 400px;
                line-height: 1.6;
                color: #6b7280;
                font-weight: 500;
            }
            
            .btn-harmonized {
                height: var(--btn-height);
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                border-radius: var(--btn-border-radius);
                padding: 0 var(--btn-padding-horizontal);
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                display: flex;
                align-items: center;
                gap: var(--btn-gap);
                box-shadow: var(--shadow-base);
                position: relative;
            }
            
            .btn-harmonized:hover {
                background: #f9fafb;
                border-color: #6366f1;
                color: #1f2937;
                transform: translateY(-1px);
                box-shadow: var(--shadow-hover);
            }
            
            .btn-harmonized.btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            }
            
            .btn-harmonized.btn-primary:hover {
                background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
            }
            
            /* RESPONSIVE */
            @media (max-width: 1400px) {
                .search-box-full {
                    max-width: 700px;
                }
                
                .buttons-line-full {
                    gap: var(--gap-medium);
                }
                
                .action-buttons-expanded {
                    gap: var(--gap-small);
                }
            }
            
            @media (max-width: 1200px) {
                .search-box-full {
                    max-width: 600px;
                }
                
                .view-mode-expanded {
                    min-width: 100px;
                    padding: 0 12px;
                }
                
                .btn-expanded {
                    padding: 0 12px;
                }
            }
            
            @media (max-width: 1024px) {
                .controls-bar-harmonized-expanded {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--card-border-radius);
                    padding: var(--gap-large);
                    margin-bottom: var(--gap-medium);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
                    display: flex;
                    flex-direction: column;
                    gap: var(--gap-large);
                    position: relative;
                    z-index: 100;
                }
                
                .buttons-line-full {
                    flex-direction: column;
                    gap: var(--gap-medium);
                    align-items: stretch;
                }
                
                .view-modes-expanded {
                    width: 100%;
                    justify-content: space-around;
                }
                
                .action-buttons-expanded {
                    width: 100%;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .search-box-full {
                    max-width: 100%;
                }
                
                .buttons-separator {
                    display: none;
                }
            }
            
            @media (max-width: 768px) {
                .view-mode-expanded span,
                .btn-expanded span {
                    display: none;
                }
                
                .view-mode-expanded {
                    min-width: 44px;
                    padding: 0;
                    justify-content: center;
                }
                
                .btn-expanded {
                    padding: 0 var(--gap-small);
                }
                
                .search-input-full {
                    font-size: var(--btn-font-size);
                    padding: 0 var(--gap-medium) 0 48px;
                }
                
                .search-icon-full {
                    left: var(--gap-medium);
                    font-size: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .controls-bar-harmonized-expanded {
                    padding: var(--gap-small);
                    gap: var(--gap-medium);
                }
                
                .action-buttons-expanded {
                    flex-direction: column;
                    gap: var(--gap-small);
                    align-items: stretch;
                }
                
                .action-buttons-expanded > * {
                    width: 100%;
                    justify-content: center;
                }
                
                .dropdown-menu-expanded {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90vw;
                    max-width: 300px;
                }
                
                .search-box-full {
                    height: calc(var(--btn-height) + 4px);
                }
                
                .search-input-full {
                    padding: 0 var(--gap-small) 0 40px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    addScannerStyles() {
        if (document.getElementById('scannerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scannerStyles';
        styles.textContent = `
            .scanner-page {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .scanner-page > div {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
        `;
        
        document.head.appendChild(styles);
    }

    // ================================================
    // DEBUG ET DIAGNOSTICS
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

    debugSync() {
        console.group('🔍 DEBUG Synchronisation PageManager v14.1');
        console.log('État sync:', this.syncState);
        console.log('EmailScanner:', {
            available: !!window.emailScanner,
            emails: window.emailScanner?.emails?.length || 0,
            startScanSynced: window.emailScanner?.startScanSynced || false
        });
        console.log('CategoryManager:', {
            available: !!window.categoryManager,
            preselectedCategories: this.getTaskPreselectedCategories(),
            categories: Object.keys(this.getCategories()).length,
            synced: this.syncState.categoryManagerSynced
        });
        console.log('StartScan:', {
            available: !!window.minimalScanModule,
            settings: window.minimalScanModule?.settings || {}
        });
        console.log('Last scan data:', this.lastScanData);
        console.log('Task categories cache:', {
            cached: !!this._taskCategoriesCache,
            cacheTime: this._taskCategoriesCacheTime,
            lastLogged: this._lastLoggedTaskCategories
        });
        console.groupEnd();
        
        return this.getSyncStatus();
    }

    debugPreselection() {
        console.group('🔍 DEBUG PRÉ-SÉLECTION COMPLÈTE v14.1');
        
        // 1. Sources des catégories
        console.group('📋 Sources des catégories pré-sélectionnées:');
        
        const categoriesFromManager = window.categoryManager?.getTaskPreselectedCategories() || [];
        const categoriesFromScanner = window.emailScanner?.getTaskPreselectedCategories() || [];
        const categoriesFromLocal = this.getTaskPreselectedCategories();
        
        console.log('CategoryManager:', categoriesFromManager);
        console.log('EmailScanner:', categoriesFromScanner);
        console.log('PageManager:', categoriesFromLocal);
        
        // Vérifier la cohérence
        const sources = [
            { name: 'CategoryManager', cats: categoriesFromManager },
            { name: 'EmailScanner', cats: categoriesFromScanner },
            { name: 'PageManager', cats: categoriesFromLocal }
        ];
        
        const referenceSource = categoriesFromManager;
        const inconsistencies = [];
        
        sources.forEach(source => {
            if (JSON.stringify([...source.cats].sort()) !== JSON.stringify([...referenceSource].sort())) {
                inconsistencies.push(source.name);
            }
        });
        
        if (inconsistencies.length > 0) {
            console.warn('⚠️ INCOHÉRENCES DÉTECTÉES:', inconsistencies);
        } else {
            console.log('✅ Toutes les sources sont synchronisées');
        }
        
        console.groupEnd();
        
        // 2. État des emails
        console.group('📧 État des emails:');
        
        const emails = this.getAllEmails();
        const preselectedEmails = emails.filter(e => e.isPreselectedForTasks === true);
        const shouldBePreselected = emails.filter(e => categoriesFromLocal.includes(e.category));
        const missedEmails = shouldBePreselected.filter(e => !e.isPreselectedForTasks);
        
        console.log('Total emails:', emails.length);
        console.log('Marqués pré-sélectionnés (flag):', preselectedEmails.length);
        console.log('Devraient être pré-sélectionnés (catégorie):', shouldBePreselected.length);
        console.log('Emails manqués:', missedEmails.length);
        
        if (missedEmails.length > 0) {
            console.warn('⚠️ Emails qui devraient être marqués mais ne le sont pas:');
            missedEmails.slice(0, 5).forEach(email => {
                console.log('  -', {
                    subject: email.subject?.substring(0, 40),
                    category: email.category,
                    isPreselectedForTasks: email.isPreselectedForTasks
                });
            });
        }
        
        console.groupEnd();
        
        // 3. Détails par catégorie
        console.group('📊 Détails par catégorie pré-sélectionnée:');
        
        categoriesFromLocal.forEach(catId => {
            const category = this.getCategories()[catId] || window.categoryManager?.getCategory(catId);
            const emailsInCategory = emails.filter(e => e.category === catId);
            const markedAsPreselected = emailsInCategory.filter(e => e.isPreselectedForTasks === true);
            
            console.group(`${category?.icon || '📂'} ${category?.name || catId} (${catId}):`);
            console.log('Total emails dans cette catégorie:', emailsInCategory.length);
            console.log('Marqués pré-sélectionnés:', markedAsPreselected.length);
            console.log('Pourcentage correct:', markedAsPreselected.length === emailsInCategory.length ? '✅ 100%' : `❌ ${Math.round(markedAsPreselected.length / emailsInCategory.length * 100)}%`);
            
            if (markedAsPreselected.length < emailsInCategory.length) {
                const notMarked = emailsInCategory.filter(e => !e.isPreselectedForTasks);
                console.warn('Emails non marqués:', notMarked.slice(0, 3).map(e => ({
                    subject: e.subject?.substring(0, 40),
                    categoryConfidence: Math.round((e.categoryConfidence || 0) * 100) + '%'
                })));
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
        
        // 4. État de l'affichage
        console.group('🖼️ État de l\'affichage:');
        
        const categoryButtons = document.querySelectorAll('.status-pill-harmonized-twolines');
        const preselectedButtons = document.querySelectorAll('.status-pill-harmonized-twolines.preselected-category');
        const emailCards = document.querySelectorAll('.task-harmonized-card');
        const preselectedCards = document.querySelectorAll('.task-harmonized-card.preselected-task');
        
        console.log('Boutons de catégorie totaux:', categoryButtons.length);
        console.log('Boutons avec style pré-sélectionné:', preselectedButtons.length);
        console.log('Cartes d\'email totales:', emailCards.length);
        console.log('Cartes avec style pré-sélectionné:', preselectedCards.length);
        
        console.groupEnd();
        
        console.groupEnd();
        
        return {
            sources: {
                categoryManager: categoriesFromManager,
                emailScanner: categoriesFromScanner,
                pageManager: categoriesFromLocal,
                isSync: inconsistencies.length === 0
            },
            emails: {
                total: emails.length,
                markedPreselected: preselectedEmails.length,
                shouldBePreselected: shouldBePreselected.length,
                missed: missedEmails.length
            },
            display: {
                categoryButtons: categoryButtons.length,
                preselectedButtons: preselectedButtons.length,
                emailCards: emailCards.length,
                preselectedCards: preselectedCards.length
            }
        };
    }

    forceUpdatePreselection() {
        console.log('[PageManager] 🔄 === FORCE UPDATE PRÉ-SÉLECTION ===');
        
        // 1. Forcer la synchronisation des catégories depuis CategoryManager
        const freshCategories = window.categoryManager?.getTaskPreselectedCategories() || [];
        console.log('[PageManager] 📋 Catégories fraîches depuis CategoryManager:', freshCategories);
        
        // 2. Invalider le cache local
        this.invalidateTaskCategoriesCache();
        
        // 3. Mettre à jour EmailScanner si disponible
        if (window.emailScanner && typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
            window.emailScanner.updateTaskPreselectedCategories(freshCategories);
            console.log('[PageManager] ✅ EmailScanner mis à jour');
        }
        
        // 4. Mettre à jour les emails
        const emails = this.getAllEmails();
        let updated = 0;
        let added = 0;
        let removed = 0;
        
        emails.forEach(email => {
            const shouldBePreselected = freshCategories.includes(email.category);
            const currentlyPreselected = email.isPreselectedForTasks === true;
            
            if (shouldBePreselected && !currentlyPreselected) {
                email.isPreselectedForTasks = true;
                updated++;
                added++;
                // Ajouter automatiquement à la sélection
                this.selectedEmails.add(email.id);
            } else if (!shouldBePreselected && currentlyPreselected) {
                email.isPreselectedForTasks = false;
                updated++;
                removed++;
                // Retirer de la sélection si nécessaire
                this.selectedEmails.delete(email.id);
            }
        });
        
        console.log(`[PageManager] 📊 Résultat: ${updated} emails mis à jour (${added} ajoutés, ${removed} retirés)`);
        
        // 5. Rafraîchir la vue emails complètement
        if (this.currentPage === 'emails') {
            this.refreshEmailsView();
        }
        
        // 6. Déclencher un événement pour notifier les autres modules
        setTimeout(() => {
            this.dispatchEvent('preselectionUpdated', {
                categories: freshCategories,
                updated: updated,
                added: added,
                removed: removed,
                source: 'PageManager'
            });
        }, 100);
        
        return {
            categories: freshCategories,
            emailsUpdated: updated,
            added: added,
            removed: removed
        };
    }

    // Méthode utilitaire pour dispatcher des événements
    dispatchEvent(eventName, detail) {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { 
                detail: {
                    ...detail,
                    source: 'PageManager',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error(`[PageManager] Erreur dispatch ${eventName}:`, error);
        }
    }

    // Test complet de synchronisation
    testSynchronization() {
        console.group('🧪 TEST SYNCHRONISATION PageManager v14.1');
        
        const debugInfo = this.getSyncStatus();
        console.log('Debug Info:', debugInfo);
        
        // Test modification taskPreselectedCategories
        const originalCategories = [...this.getTaskPreselectedCategories()];
        const testCategories = ['tasks', 'commercial'];
        
        console.log('Test: Modification taskPreselectedCategories');
        console.log('Avant:', originalCategories);
        
        // Simuler un changement via CategoryManager
        if (window.categoryManager && typeof window.categoryManager.updateTaskPreselectedCategories === 'function') {
            window.categoryManager.updateTaskPreselectedCategories(testCategories);
            
            setTimeout(() => {
                const newCategories = this.getTaskPreselectedCategories();
                console.log('Après:', newCategories);
                
                // Vérifier EmailScanner
                const emailScannerCategories = window.emailScanner?.getTaskPreselectedCategories() || [];
                console.log('EmailScanner a:', emailScannerCategories);
                
                const isSync = JSON.stringify(newCategories.sort()) === JSON.stringify(emailScannerCategories.sort());
                console.log('Synchronisation:', isSync ? '✅ OK' : '❌ ÉCHEC');
                
                // Remettre les valeurs originales
                window.categoryManager.updateTaskPreselectedCategories(originalCategories);
                
                console.groupEnd();
            }, 500);
        } else {
            console.warn('CategoryManager non disponible pour test');
            console.groupEnd();
        }
        
        return true;
    }

    // Cleanup et destruction
    cleanup() {
        // Nettoyer les event listeners
        if (this.categoryManagerChangeListener) {
            window.categoryManager?.removeChangeListener?.(this.categoryManagerChangeListener);
        }
        
        // Vider les caches
        this.invalidateTaskCategoriesCache();
        this.selectedEmails.clear();
        this.aiAnalysisResults.clear();
        this.createdTasks.clear();
        
        console.log('[PageManager] 🧹 Nettoyage effectué');
    }
}

// ================================================
// INITIALISATION GLOBALE SÉCURISÉE
// ================================================

// Créer l'instance globale avec nettoyage préalable
if (window.pageManager) {
    console.log('[PageManager] 🔄 Nettoyage ancienne instance...');
    window.pageManager.cleanup?.();
}

console.log('[PageManager] 🚀 Création nouvelle instance v14.1...');
window.pageManager = new PageManager();

// Bind des méthodes pour préserver le contexte
Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
    }
});

// ================================================
// FONCTIONS UTILITAIRES GLOBALES POUR DEBUG
// ================================================
window.debugPageManagerSync = function() {
    return window.pageManager?.debugSync() || { error: 'PageManager non disponible' };
};

window.debugPageManagerPreselection = function() {
    return window.pageManager?.debugPreselection() || { error: 'PageManager non disponible' };
};

window.forcePageManagerSync = function() {
    return window.pageManager?.forceUpdatePreselection() || { error: 'PageManager non disponible' };
};

window.testPageManagerSync = function() {
    console.group('🧪 TEST Synchronisation PageManager v14.1');
    
    const status = window.pageManager?.getSyncStatus();
    console.log('Status:', status);
    
    // Test de récupération d'emails
    const emails = window.pageManager?.getAllEmails() || [];
    console.log('Emails récupérés:', emails.length);
    
    // Test de catégories
    const categories = window.pageManager?.getCategories() || {};
    console.log('Catégories:', Object.keys(categories));
    
    // Test catégories pré-sélectionnées
    const preselected = window.pageManager?.getTaskPreselectedCategories() || [];
    console.log('Catégories pré-sélectionnées:', preselected);
    
    // Test synchronisation
    const syncTest = window.pageManager?.testSynchronization();
    
    console.groupEnd();
    
    return {
        success: true,
        status,
        emailCount: emails.length,
        categoryCount: Object.keys(categories).length,
        preselectedCount: preselected.length,
        syncTest
    };
};

window.refreshPageManagerEmails = function() {
    if (window.pageManager && window.pageManager.currentPage === 'emails') {
        window.pageManager.refreshEmailsView();
        return { success: true, message: 'Vue emails rafraîchie' };
    }
    return { success: false, message: 'Pas sur la page emails ou PageManager non disponible' };
};

// ================================================
// DIAGNOSTIC COMPLET
// ================================================
window.diagnosePageManager = function() {
    console.group('🏥 DIAGNOSTIC COMPLET PageManager v14.1');
    
    if (!window.pageManager) {
        console.error('❌ PageManager non disponible');
        console.groupEnd();
        return { error: 'PageManager non disponible' };
    }
    
    // Test des modules de base
    console.group('🔧 Modules de base:');
    console.log('EmailScanner:', !!window.emailScanner);
    console.log('CategoryManager:', !!window.categoryManager);
    console.log('TaskManager:', !!window.taskManager);
    console.log('AITaskAnalyzer:', !!window.aiTaskAnalyzer);
    console.log('MinimalScanModule:', !!window.minimalScanModule);
    console.groupEnd();
    
    // Test de l'état de synchronisation
    const syncStatus = window.pageManager.getSyncStatus();
    console.group('🔄 État de synchronisation:');
    console.log('Sync status:', syncStatus);
    console.groupEnd();
    
    // Test des données
    const emails = window.pageManager.getAllEmails();
    const categories = window.pageManager.getCategories();
    const preselected = window.pageManager.getTaskPreselectedCategories();
    
    console.group('📊 Données:');
    console.log('Emails:', emails.length);
    console.log('Catégories:', Object.keys(categories).length);
    console.log('Pré-sélectionnées:', preselected.length);
    console.groupEnd();
    
    // Test des fonctionnalités
    console.group('⚡ Fonctionnalités:');
    console.log('Page courante:', window.pageManager.currentPage);
    console.log('Emails sélectionnés:', window.pageManager.selectedEmails.size);
    console.log('Cache valide:', !!window.pageManager._taskCategoriesCache);
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        modules: {
            emailScanner: !!window.emailScanner,
            categoryManager: !!window.categoryManager,
            taskManager: !!window.taskManager,
            aiTaskAnalyzer: !!window.aiTaskAnalyzer
        },
        sync: syncStatus,
        data: {
            emails: emails.length,
            categories: Object.keys(categories).length,
            preselected: preselected.length
        },
        state: {
            currentPage: window.pageManager.currentPage,
            selectedEmails: window.pageManager.selectedEmails.size,
            cacheValid: !!window.pageManager._taskCategoriesCache
        }
    };
};

console.log('✅ PageManager v14.1 Unifié loaded - Compatible CategoryManager avec styles modernes');
console.log('🔧 Fonctions de debug disponibles:');
console.log('  - debugPageManagerSync()');
console.log('  - debugPageManagerPreselection()');
console.log('  - forcePageManagerSync()');
console.log('  - testPageManagerSync()');
console.log('  - refreshPageManagerEmails()');
console.log('  - diagnosePageManager()');
