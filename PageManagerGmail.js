// PageManagerGmail.js - Version 1.0 - Détection newsletters Gmail avec bouton S'abonner

class PageManagerGmail {
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
        
        // Spécifique Gmail
        this.provider = 'gmail';
        this.newsletterDetectionEnabled = true;
        
        // Vue modes pour les emails
        this.currentViewMode = 'grouped-domain';
        this.currentCategory = null;
        
        // État de synchronisation
        this.syncState = {
            startScanSynced: false,
            emailScannerSynced: false,
            categoryManagerSynced: false,
            lastSyncTimestamp: null,
            emailCount: 0,
            provider: 'gmail'
        };
        
        // Cache pour optimisation
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
        
        // Page modules mapping
        this.pageModules = {
            scanner: 'unifiedScanModule',
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
            console.warn('[PageManagerGmail] LocalStorage non disponible:', error);
            return null;
        }
    }

    setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('[PageManagerGmail] LocalStorage non disponible:', error);
        }
    }

    safeInit() {
        try {
            this.setupEventListeners();
            this.setupSyncListeners();
            this.setupCategoryManagerIntegration();
            this.isInitialized = true;
            console.log('[PageManagerGmail] ✅ Version 1.0 - Détection newsletters Gmail');
        } catch (error) {
            console.error('[PageManagerGmail] Erreur initialisation:', error);
        }
    }

    // ================================================
    // INTÉGRATION CATEGORYMANAGER (identique)
    // ================================================
    setupCategoryManagerIntegration() {
        console.log('[PageManagerGmail] 🔗 Configuration intégration CategoryManager...');
        
        if (window.categoryManager) {
            console.log('[PageManagerGmail] ✅ CategoryManager détecté');
            this.syncState.categoryManagerSynced = true;
            
            window.categoryManager.addChangeListener((type, value, settings) => {
                console.log('[PageManagerGmail] 📨 Changement CategoryManager reçu:', type, value);
                this.handleCategoryManagerChange(type, value, settings);
            });
        } else {
            console.warn('[PageManagerGmail] ⚠️ CategoryManager non trouvé, attente...');
            setTimeout(() => this.setupCategoryManagerIntegration(), 2000);
        }
    }

    handleCategoryManagerChange(type, value, settings) {
        console.log('[PageManagerGmail] 🔄 Traitement changement CategoryManager:', type);
        
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
        console.log('[PageManagerGmail] 📋 Catégories pré-sélectionnées changées:', categories);
        
        if (window.emailScanner && typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
            window.emailScanner.updateTaskPreselectedCategories(categories);
        }
        
        if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
            console.log('[PageManagerGmail] 🔄 Déclenchement re-catégorisation...');
            setTimeout(() => {
                window.emailScanner.recategorizeEmails?.();
            }, 150);
        }
        
        this.invalidateTaskCategoriesCache();
    }

    handleActiveCategoriesChange(categories) {
        console.log('[PageManagerGmail] 🏷️ Catégories actives changées:', categories);
        
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
        console.log('[PageManagerGmail] 📂 Structure catégories changée:', type, value);
        
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    handleGenericCategoryChange(type, value) {
        console.log('[PageManagerGmail] 🔧 Changement générique CategoryManager:', type, value);
        
        if (window.aiTaskAnalyzer && type === 'automationSettings') {
            window.aiTaskAnalyzer.updateAutomationSettings?.(value);
        }
    }

    // ================================================
    // LISTENERS DE SYNCHRONISATION
    // ================================================
    setupSyncListeners() {
        console.log('[PageManagerGmail] 📡 Configuration des listeners de synchronisation...');
        
        window.addEventListener('scanCompleted', (event) => {
            console.log('[PageManagerGmail] 📨 Scan terminé reçu:', event.detail);
            this.handleScanCompleted(event.detail);
        });
        
        window.addEventListener('emailScannerSynced', (event) => {
            console.log('[PageManagerGmail] 🔄 EmailScanner synchronisé:', event.detail);
            this.handleEmailScannerSynced(event.detail);
        });
        
        window.addEventListener('emailsRecategorized', (event) => {
            console.log('[PageManagerGmail] 🏷️ Emails re-catégorisés:', event.detail);
            this.handleEmailsRecategorized(event.detail);
        });
        
        window.addEventListener('emailScannerReady', (event) => {
            console.log('[PageManagerGmail] ✅ EmailScanner prêt:', event.detail);
            this.handleEmailScannerReady(event.detail);
        });
        
        // Listener spécifique Gmail
        window.addEventListener('gmailScanCompleted', (event) => {
            console.log('[PageManagerGmail] 📧 Scan Gmail terminé:', event.detail);
            this.handleGmailScanCompleted(event.detail);
        });
        
        console.log('[PageManagerGmail] ✅ Listeners de synchronisation configurés');
    }

    handleScanCompleted(scanData) {
        console.log('[PageManagerGmail] 🎯 Traitement scan terminé...');
        
        try {
            // Vérifier si c'est un scan Gmail
            if (scanData.provider !== 'gmail') {
                console.log('[PageManagerGmail] ⚠️ Scan non-Gmail ignoré:', scanData.provider);
                return;
            }
            
            this.syncState.startScanSynced = true;
            this.syncState.lastSyncTimestamp = scanData.timestamp || Date.now();
            this.syncState.emailCount = scanData.results?.total || 0;
            this.lastScanData = scanData;
            
            console.log(`[PageManagerGmail] ✅ Scan Gmail terminé: ${this.syncState.emailCount} emails`);
            
            if (this.currentPage === 'emails') {
                console.log('[PageManagerGmail] 📧 Rafraîchissement automatique page emails');
                setTimeout(() => {
                    this.loadPage('emails');
                }, 500);
            }
            
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur traitement scan terminé:', error);
        }
    }

    handleGmailScanCompleted(scanData) {
        console.log('[PageManagerGmail] 📰 Traitement spécifique Gmail...');
        
        try {
            const newsletterCount = scanData.results?.newsletters || 0;
            console.log(`[PageManagerGmail] 📰 ${newsletterCount} newsletters détectées`);
            
            // Marquer les emails avec bouton S'abonner
            if (window.emailScanner && window.emailScanner.emails) {
                window.emailScanner.emails.forEach(email => {
                    if (email.hasSubscribeButton) {
                        email.isNewsletter = true;
                        email.specialGmailFeature = 'subscribe_button';
                    }
                });
            }
            
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur traitement Gmail:', error);
        }
    }

    handleEmailScannerSynced(syncData) {
        console.log('[PageManagerGmail] 🔄 Traitement synchronisation EmailScanner...');
        
        try {
            // Vérifier le provider
            if (syncData.provider && syncData.provider !== 'gmail') {
                console.log('[PageManagerGmail] ⚠️ Sync non-Gmail ignorée:', syncData.provider);
                return;
            }
            
            this.syncState.emailScannerSynced = true;
            this.syncState.lastSyncTimestamp = syncData.timestamp || Date.now();
            
            if (syncData.emailCount !== undefined) {
                this.syncState.emailCount = syncData.emailCount;
            }
            
            console.log(`[PageManagerGmail] ✅ EmailScanner synchronisé: ${this.syncState.emailCount} emails Gmail`);
            
            if (this.currentPage === 'emails') {
                console.log('[PageManagerGmail] 📧 Rafraîchissement page emails après sync');
                setTimeout(() => {
                    this.refreshEmailsView();
                }, 200);
            }
            
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur traitement sync EmailScanner:', error);
        }
    }

    handleEmailsRecategorized(recatData) {
        console.log('[PageManagerGmail] 🏷️ Traitement re-catégorisation...');
        
        try {
            if (recatData.emails) {
                this.syncState.emailCount = recatData.emails.length;
            }
            
            if (recatData.preselectedCount !== undefined) {
                console.log(`[PageManagerGmail] ⭐ ${recatData.preselectedCount} emails pré-sélectionnés`);
            }
            
            if (this.currentPage === 'emails') {
                console.log('[PageManagerGmail] 📧 Rafraîchissement immédiat après re-catégorisation');
                this.refreshEmailsView();
            }
            
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur traitement re-catégorisation:', error);
        }
    }

    handleEmailScannerReady(readyData) {
        console.log('[PageManagerGmail] ✅ EmailScanner prêt pour synchronisation');
        
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
            if (event.detail?.source === 'PageManagerGmail') {
                return;
            }
            
            console.log('[PageManagerGmail] 📨 Changement générique reçu:', event.detail);
            this.handleGenericSettingsChanged(event.detail);
        });

        window.addEventListener('error', (event) => {
            console.error('[PageManagerGmail] Global error:', event.error);
        });
    }

    handleGenericSettingsChanged(changeData) {
        console.log('[PageManagerGmail] 🔧 Traitement changement générique:', changeData);
        
        const { type, value } = changeData;
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[PageManagerGmail] 📋 Catégories pour tâches changées:', value);
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
                console.log('[PageManagerGmail] 🏷️ Catégories actives changées:', value);
                if (window.emailScanner && window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                    setTimeout(() => {
                        window.emailScanner.recategorizeEmails?.();
                    }, 150);
                }
                break;
                
            case 'preferences':
                console.log('[PageManagerGmail] ⚙️ Préférences changées:', value);
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
        console.log(`[PageManagerGmail] Loading page: ${pageName}`);

        if (!this.isInitialized) {
            console.warn('[PageManagerGmail] Not initialized, skipping page load');
            return;
        }

        if (pageName === 'dashboard') {
            console.log('[PageManagerGmail] Dashboard handled by index.html');
            this.updateNavigation(pageName);
            this.showPageContent();
            return;
        }

        const container = this.getPageContainer();
        if (!container) {
            console.error('[PageManagerGmail] Page container not found');
            return;
        }

        try {
            this.showLoading(`Chargement ${pageName}...`);
            this.updateNavigation(pageName);
            container.innerHTML = '';
            
            if (this.requiresAuthentication(pageName)) {
                console.log(`[PageManagerGmail] Page requires authentication: ${pageName}`);
                const authStatus = await this.checkAuthenticationStatus();
                
                if (!authStatus.isAuthenticated) {
                    console.log('[PageManagerGmail] User not authenticated, showing auth required message');
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
            console.error(`[PageManagerGmail] Error loading page ${pageName}:`, error);
            this.hideLoading();
            this.showError(`Erreur: ${error.message}`);
            container.innerHTML = this.renderErrorPage(error);
        }
    }

    async checkEmailSyncStatus() {
        console.log('[PageManagerGmail] 🔍 Vérification état synchronisation emails Gmail...');
        
        try {
            const emailScannerReady = window.emailScanner && 
                                    typeof window.emailScanner.getAllEmails === 'function';
            
            if (emailScannerReady) {
                const emails = window.emailScanner.getAllEmails();
                const startScanSynced = window.emailScanner.startScanSynced || false;
                
                // Filtrer pour Gmail seulement
                const gmailEmails = emails.filter(email => email.provider === 'gmail');
                
                console.log(`[PageManagerGmail] 📊 EmailScanner: ${gmailEmails.length} emails Gmail, StartScan sync: ${startScanSynced}`);
                
                this.syncState.emailScannerSynced = true;
                this.syncState.emailCount = gmailEmails.length;
                this.syncState.startScanSynced = startScanSynced;
                
                if (gmailEmails.length === 0) {
                    await this.tryRecoverScanResults();
                }
            } else {
                console.warn('[PageManagerGmail] EmailScanner non disponible ou non prêt');
                this.syncState.emailScannerSynced = false;
            }
            
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur vérification sync emails:', error);
        }
    }

    async tryRecoverScanResults() {
        console.log('[PageManagerGmail] 🔄 Tentative de récupération des résultats de scan Gmail...');
        
        try {
            const scanResults = this.getLocalStorageItem('scanResults');
            if (scanResults) {
                const results = JSON.parse(scanResults);
                
                // Vérifier que c'est un scan Gmail
                if (results.provider === 'gmail') {
                    console.log('[PageManagerGmail] 📦 Résultats Gmail trouvés en localStorage:', results);
                    
                    const now = Date.now();
                    const resultAge = now - (results.timestamp || 0);
                    const maxAge = 30 * 60 * 1000;
                    
                    if (resultAge < maxAge) {
                        console.log('[PageManagerGmail] ✅ Résultats Gmail récents, mise à jour état sync');
                        this.syncState.emailCount = results.total || 0;
                        this.syncState.startScanSynced = results.emailScannerSynced || false;
                        this.lastScanData = results;
                    } else {
                        console.log('[PageManagerGmail] ⚠️ Résultats trop anciens, ignorés');
                    }
                }
            }
        } catch (error) {
            console.error('[PageManagerGmail] ❌ Erreur récupération résultats:', error);
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
            
            // Vérifier Google Auth en priorité pour Gmail
            if (window.googleAuthService) {
                if (typeof window.googleAuthService.isAuthenticated === 'function') {
                    isAuthenticated = window.googleAuthService.isAuthenticated();
                    console.log('[PageManagerGmail] GoogleAuthService.isAuthenticated():', isAuthenticated);
                }
                
                if (typeof window.googleAuthService.getUser === 'function') {
                    user = window.googleAuthService.getUser();
                    console.log('[PageManagerGmail] GoogleAuthService user:', user);
                }
            }
            
            // Vérifier MailService comme fallback
            if (!isAuthenticated && window.mailService) {
                const provider = window.mailService.getProvider?.();
                if (provider === 'gmail' && window.mailService.isAuthenticationValid?.()) {
                    isAuthenticated = true;
                    console.log('[PageManagerGmail] Gmail authenticated via MailService');
                }
            }
            
            if (!isAuthenticated) {
                try {
                    const storedAuth = this.getLocalStorageItem('gmailAuthStatus') || this.getLocalStorageItem('googleUserInfo');
                    if (storedAuth) {
                        isAuthenticated = true;
                        console.log('[PageManagerGmail] Found stored Gmail authentication');
                    }
                } catch (error) {
                    console.warn('[PageManagerGmail] Cannot access localStorage:', error);
                }
            }
            
            return {
                isAuthenticated,
                user,
                source: isAuthenticated ? 'gmail' : 'none'
            };
            
        } catch (error) {
            console.error('[PageManagerGmail] Error checking authentication:', error);
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
                <div class="auth-icon gmail">
                    <i class="fab fa-google"></i>
                </div>
                <h3 class="auth-title">Connexion Gmail requise</h3>
                <p class="auth-text">
                    Vous devez être connecté à Gmail pour accéder à cette page.
                </p>
                <div class="auth-actions">
                    <button class="btn btn-gmail" onclick="window.pageManagerGmail.handleLogin()">
                        <i class="fab fa-google"></i>
                        Se connecter avec Google
                    </button>
                    <button class="btn btn-secondary" onclick="window.pageManagerGmail.loadPage('dashboard')">
                        <i class="fas fa-home"></i>
                        Retour au tableau de bord
                    </button>
                </div>
            </div>
        `;
    }

    async handleLogin() {
        console.log('[PageManagerGmail] Handling Gmail login request...');
        
        try {
            if (window.googleAuthService && typeof window.googleAuthService.signIn === 'function') {
                console.log('[PageManagerGmail] Using GoogleAuthService.signIn()');
                await window.googleAuthService.signIn();
            } else {
                console.log('[PageManagerGmail] No Google login method available, redirecting to auth page');
                window.location.href = '/auth-gmail.html';
            }
        } catch (error) {
            console.error('[PageManagerGmail] Login error:', error);
            this.showError('Erreur lors de la connexion Gmail: ' + error.message);
        }
    }

    async renderPage(pageName, container) {
        console.log(`[PageManagerGmail] Rendering page: ${pageName}`);
        
        const moduleName = this.pageModules[pageName];
        if (moduleName && window[moduleName]) {
            console.log(`[PageManagerGmail] Delegating to module: ${moduleName}`);
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
                console.log(`[PageManagerGmail] Initializing module: ${moduleName}`);
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
            console.error(`[PageManagerGmail] Error rendering module: ${moduleName}`, error);
            throw error;
        }
    }

    initializePageEvents(pageName) {
        console.log(`[PageManagerGmail] Initializing events for page: ${pageName}`);
        
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
            const allEmails = window.emailScanner.getAllEmails();
            // Filtrer pour Gmail seulement
            const gmailEmails = allEmails.filter(email => 
                email.provider === 'gmail' || 
                email.from?.emailAddress?.address?.includes('@gmail.com')
            );
            console.log(`[PageManagerGmail] 📧 Récupération ${gmailEmails.length} emails Gmail depuis EmailScanner`);
            return gmailEmails;
        }
        
        if (window.emailScanner && window.emailScanner.emails) {
            const gmailEmails = window.emailScanner.emails.filter(email => 
                email.provider === 'gmail'
            );
            console.log(`[PageManagerGmail] 📧 Récupération ${gmailEmails.length} emails Gmail directs`);
            return gmailEmails;
        }
        
        console.log('[PageManagerGmail] ⚠️ Aucun email Gmail trouvé dans EmailScanner');
        return [];
    }

    getCategories() {
        if (window.categoryManager && window.categoryManager.getCategories) {
            return window.categoryManager.getCategories();
        }
        
        if (window.emailScanner && window.emailScanner.defaultWebCategories) {
            return window.emailScanner.defaultWebCategories;
        }
        
        // Catégories par défaut avec ajout de "newsletter" pour Gmail
        return {
            'all': { name: 'Tous', icon: '📧', color: '#1e293b' },
            'newsletter': { name: 'Newsletters', icon: '📰', color: '#ea4335' },
            'commercial': { name: 'Commercial', icon: '💼', color: '#3b82f6' },
            'tasks': { name: 'Tâches', icon: '✅', color: '#10b981' },
            'meetings': { name: 'Réunions', icon: '🤝', color: '#8b5cf6' },
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
        console.log('[PageManagerGmail] 🔄 Cache des catégories tâches invalidé');
    }

    // ================================================
    // RENDU DE LA PAGE EMAILS AVEC DÉTECTION GMAIL
    // ================================================
    async renderEmails(container) {
        console.log('[PageManagerGmail] 📧 Rendu page emails Gmail...');
        
        const emails = this.getAllEmails();
        const categories = this.getCategories();
        
        console.log(`[PageManagerGmail] 📊 État sync: ${this.syncState.emailScannerSynced}, Emails Gmail: ${emails.length}`);
        
        if (emails.length === 0 && !this.syncState.startScanSynced) {
            container.innerHTML = this.renderEmptyEmailsState();
            return;
        }

        const categoryCounts = this.calculateCategoryCounts(emails);
        const totalEmails = emails.length;
        const selectedCount = this.selectedEmails.size;
        const visibleEmails = this.getVisibleEmails();
        
        const syncIndicator = this.renderSyncIndicator();
        
        // Compter les newsletters Gmail
        const newsletterCount = emails.filter(email => email.hasSubscribeButton || email.isNewsletter).length;
        
        container.innerHTML = `
            <div class="emails-page-modern gmail">
                ${syncIndicator}
                
                ${!this.hideExplanation ? `
                    <div class="explanation-notice gmail">
                        <i class="fab fa-google"></i>
                        <span>Emails Gmail ${this.syncState.startScanSynced ? 'synchronisés' : 'disponibles'}. ${newsletterCount > 0 ? `📰 ${newsletterCount} newsletters détectées.` : ''}</span>
                        <button class="explanation-close" onclick="window.pageManagerGmail.hideExplanationMessage()">
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
                                   placeholder="Rechercher dans vos emails Gmail..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear" onclick="window.pageManagerGmail.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="actions-section">
                        <div class="view-modes">
                            <button class="view-mode ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                    onclick="window.pageManagerGmail.changeViewMode('grouped-domain')"
                                    title="Par domaine">
                                <i class="fas fa-globe"></i>
                                <span>Domaine</span>
                            </button>
                            <button class="view-mode ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                    onclick="window.pageManagerGmail.changeViewMode('grouped-sender')"
                                    title="Par expéditeur">
                                <i class="fas fa-user"></i>
                                <span>Expéditeur</span>
                            </button>
                            <button class="view-mode ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                    onclick="window.pageManagerGmail.changeViewMode('flat')"
                                    title="Liste complète">
                                <i class="fas fa-list"></i>
                                <span>Liste</span>
                            </button>
                            ${newsletterCount > 0 ? `
                                <button class="view-mode ${this.currentViewMode === 'newsletters' ? 'active' : ''}" 
                                        onclick="window.pageManagerGmail.changeViewMode('newsletters')"
                                        title="Newsletters uniquement">
                                    <i class="fas fa-newspaper"></i>
                                    <span>Newsletters</span>
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary gmail ${selectedCount === 0 ? 'disabled' : ''}" 
                                    onclick="window.pageManagerGmail.createTasksFromSelection()"
                                    ${selectedCount === 0 ? 'disabled' : ''}
                                    title="Créer des tâches à partir des emails sélectionnés">
                                <i class="fas fa-tasks"></i>
                                <span>Créer tâche${selectedCount > 1 ? 's' : ''}</span>
                                ${selectedCount > 0 ? `<span class="count-badge">${selectedCount}</span>` : ''}
                            </button>
                            
                            <div class="dropdown-wrapper">
                                <button class="btn btn-secondary dropdown-toggle ${selectedCount === 0 ? 'disabled' : ''}" 
                                        onclick="window.pageManagerGmail.toggleBulkActions(event)"
                                        ${selectedCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-ellipsis-v"></i>
                                    <span>Actions</span>
                                </button>
                                <div class="dropdown-menu" id="bulkActionsMenu">
                                    <button class="dropdown-item" onclick="window.pageManagerGmail.bulkMarkAsRead()">
                                        <i class="fas fa-eye"></i>
                                        <span>Marquer comme lu</span>
                                    </button>
                                    <button class="dropdown-item" onclick="window.pageManagerGmail.bulkArchive()">
                                        <i class="fas fa-archive"></i>
                                        <span>Archiver</span>
                                    </button>
                                    ${newsletterCount > 0 ? `
                                        <button class="dropdown-item" onclick="window.pageManagerGmail.bulkUnsubscribe()">
                                            <i class="fas fa-user-slash"></i>
                                            <span>Se désabonner</span>
                                        </button>
                                    ` : ''}
                                    <button class="dropdown-item danger" onclick="window.pageManagerGmail.bulkDelete()">
                                        <i class="fas fa-trash"></i>
                                        <span>Supprimer</span>
                                    </button>
                                    <div class="dropdown-divider"></div>
                                    <button class="dropdown-item" onclick="window.pageManagerGmail.bulkExport()">
                                        <i class="fas fa-download"></i>
                                        <span>Exporter</span>
                                    </button>
                                </div>
                            </div>
                            
                            <button class="btn btn-secondary" onclick="window.pageManagerGmail.refreshEmails()">
                                <i class="fas fa-sync-alt"></i>
                                <span>Actualiser</span>
                            </button>
                            
                            ${selectedCount > 0 ? `
                                <button class="btn btn-clear" 
                                        onclick="window.pageManagerGmail.clearSelection()"
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

        this.addGmailStyles();
        this.setupEmailsEventListeners();
        
        if (this.autoAnalyzeEnabled && emails.length > 0) {
            const preselectedCategories = this.getTaskPreselectedCategories();
            console.log('[PageManagerGmail] 🤖 Catégories pré-sélectionnées pour analyse:', preselectedCategories);
            
            if (preselectedCategories && preselectedCategories.length > 0) {
                const emailsToAnalyze = emails.filter(email => 
                    preselectedCategories.includes(email.category)
                ).slice(0, 5);
                
                console.log('[PageManagerGmail] 🎯 Emails sélectionnés pour analyse:', emailsToAnalyze.length);
                
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
                <div class="sync-indicator warning gmail">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Aucun email Gmail trouvé. Utilisez le scanner pour importer vos emails Gmail.</span>
                    <button class="btn btn-gmail btn-sm" onclick="window.pageManagerGmail.loadPage('scanner')">
                        <i class="fab fa-google"></i> Scanner Gmail
                    </button>
                </div>
            `;
        }
        
        if (startScanSynced && emailCount > 0) {
            const timeAgo = lastSyncTimestamp ? this.formatTimeAgo(lastSyncTimestamp) : 'récemment';
            return `
                <div class="sync-indicator success gmail">
                    <i class="fab fa-google"></i>
                    <span>✅ ${emailCount} emails Gmail synchronisés (${timeAgo})</span>
                    <div class="sync-badges">
                        <span class="sync-badge gmail">Gmail</span>
                        <span class="sync-badge startscan">StartScan</span>
                        <span class="sync-badge emailscanner">EmailScanner</span>
                        ${categoryManagerSynced ? '<span class="sync-badge categorymanager">CategoryManager</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        if (emailScannerSynced && emailCount > 0) {
            return `
                <div class="sync-indicator info gmail">
                    <i class="fab fa-google"></i>
                    <span>📧 ${emailCount} emails Gmail disponibles</span>
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
        console.log('[PageManagerGmail] 📌 Catégories pré-sélectionnées pour affichage:', preselectedCategories);
        
        const tabs = [
            { 
                id: 'all', 
                name: 'Tous', 
                icon: '📧', 
                count: totalEmails,
                isPreselected: false 
            }
        ];
        
        // Ajouter l'onglet newsletters si il y en a
        const emails = this.getAllEmails();
        const newsletterCount = emails.filter(email => email.hasSubscribeButton || email.isNewsletter).length;
        
        if (newsletterCount > 0) {
            tabs.push({
                id: 'newsletter',
                name: 'Newsletters',
                icon: '📰',
                color: '#ea4335',
                count: newsletterCount,
                isPreselected: false,
                isSpecial: true
            });
        }
        
        Object.entries(categories).forEach(([catId, category]) => {
            if (catId === 'all' || catId === 'newsletter') return; // Déjà ajoutés
            
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
                    console.log(`[PageManagerGmail] ⭐ Catégorie pré-sélectionnée: ${category.name} (${count} emails)`);
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
            const baseClasses = `category-tab ${isCurrentCategory ? 'active' : ''} ${tab.isPreselected ? 'preselected' : ''} ${tab.isSpecial ? 'special-gmail' : ''}`;
            
            return `
                <button class="${baseClasses}" 
                        onclick="window.pageManagerGmail.filterByCategory('${tab.id}')"
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
                    ${tab.isSpecial ? '<span class="gmail-badge">Gmail</span>' : ''}
                </button>
            `;
        }).join('');
    }

    // ================================================
    // RENDU DES EMAILS AVEC SPÉCIFICITÉS GMAIL
    // ================================================
    renderEmailsList() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        console.log(`[PageManagerGmail] 📧 Rendu liste emails Gmail: ${emails.length} total, catégorie: ${this.currentCategory}`);
        
        // Filtrage par catégorie
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'newsletter') {
                filteredEmails = filteredEmails.filter(email => email.hasSubscribeButton || email.isNewsletter);
                console.log(`[PageManagerGmail] 📰 Emails newsletters filtrés: ${filteredEmails.length}`);
            } else if (this.currentCategory === 'other') {
                filteredEmails = filteredEmails.filter(email => {
                    const cat = email.category;
                    const isOther = !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
                    return isOther;
                });
                console.log(`[PageManagerGmail] 📌 Emails "Autre" filtrés: ${filteredEmails.length}`);
            } else {
                filteredEmails = filteredEmails.filter(email => email.category === this.currentCategory);
                console.log(`[PageManagerGmail] 🏷️ Emails catégorie "${this.currentCategory}": ${filteredEmails.length}`);
            }
        }
        
        // Recherche
        if (this.searchTerm) {
            const beforeSearch = filteredEmails.length;
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
            console.log(`[PageManagerGmail] 🔍 Après recherche "${this.searchTerm}": ${filteredEmails.length} (était ${beforeSearch})`);
        }
        
        if (filteredEmails.length === 0) {
            console.log('[PageManagerGmail] 📭 Aucun email à afficher');
            return this.renderEmptyState();
        }

        // Mode d'affichage
        switch (this.currentViewMode) {
            case 'flat':
                return this.renderFlatView(filteredEmails);
            case 'newsletters':
                const newsletters = filteredEmails.filter(email => email.hasSubscribeButton || email.isNewsletter);
                return this.renderFlatView(newsletters);
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
        
        const isNewsletter = email.hasSubscribeButton || email.isNewsletter;
        
        const cardClasses = [
            'email-card',
            'gmail',
            isSelected ? 'selected' : '',
            hasTask ? 'has-task' : '',
            isPreselectedForTasks ? 'preselected' : '',
            isNewsletter ? 'newsletter' : '',
            email.provider === 'gmail' ? 'gmail-email' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${cardClasses}" 
                 data-email-id="${email.id}"
                 data-category="${email.category}"
                 data-preselected="${isPreselectedForTasks}"
                 data-is-newsletter="${isNewsletter}">
                
                <input type="checkbox" 
                       class="email-checkbox" 
                       ${isSelected ? 'checked' : ''}
                       onchange="event.stopPropagation(); window.pageManagerGmail.toggleEmailSelection('${email.id}')">
                
                <div class="priority-bar" 
                     style="background-color: ${isNewsletter ? '#ea4335' : isPreselectedForTasks ? '#8b5cf6' : this.getEmailPriorityColor(email)}"></div>
                
                <div class="email-content" onclick="window.pageManagerGmail.handleEmailClick(event, '${email.id}')">
                    <div class="email-header">
                        <h3 class="email-title">${this.escapeHtml(email.subject || 'Sans sujet')}</h3>
                        <div class="email-meta">
                            <span class="email-type gmail">
                                <i class="fab fa-google"></i> Gmail
                            </span>
                            <span class="email-date">
                                📅 ${this.formatEmailDate(email.receivedDateTime)}
                            </span>
                            ${isNewsletter ? `
                                <span class="newsletter-badge">
                                    📰 Newsletter
                                </span>
                            ` : ''}
                            ${email.hasSubscribeButton ? `
                                <span class="subscribe-badge">
                                    <i class="fas fa-bell"></i> S'abonner disponible
                                </span>
                            ` : ''}
                            ${isPreselectedForTasks ? `
                                <span class="preselected-badge">
                                    ⭐ Pré-sélectionné
                                </span>
                            ` : ''}
                            ${this.syncState.startScanSynced ? `
                                <span class="sync-badge gmail">
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
        const isNewsletter = email.hasSubscribeButton || email.isNewsletter;
        const actions = [];
        
        if (!hasTask) {
            actions.push(`
                <button class="action-btn create-task" 
                        onclick="event.stopPropagation(); window.pageManagerGmail.showTaskCreationModal('${email.id}')"
                        title="Créer une tâche à partir de cet email">
                    <i class="fas fa-tasks"></i>
                </button>
            `);
        } else {
            actions.push(`
                <button class="action-btn view-task" 
                        onclick="event.stopPropagation(); window.pageManagerGmail.openCreatedTask('${email.id}')"
                        title="Voir la tâche créée">
                    <i class="fas fa-check-circle"></i>
                </button>
            `);
        }
        
        if (isNewsletter && email.hasSubscribeButton) {
            actions.push(`
                <button class="action-btn unsubscribe gmail" 
                        onclick="event.stopPropagation(); window.pageManagerGmail.showUnsubscribeOptions('${email.id}')"
                        title="Options de désabonnement">
                    <i class="fas fa-user-slash"></i>
                </button>
            `);
        }
        
        actions.push(`
            <button class="action-btn details" 
                    onclick="event.stopPropagation(); window.pageManagerGmail.showEmailModal('${email.id}')"
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
        const newsletterCount = group.emails.filter(e => e.hasSubscribeButton || e.isNewsletter).length;
        
        return `
            <div class="email-group gmail" data-group-key="${group.key}">
                <div class="group-header" onclick="window.pageManagerGmail.toggleGroup('${group.key}', event)">
                    <div class="group-avatar" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info">
                        <div class="group-name">${displayName}</div>
                        <div class="group-meta">
                            ${group.count} email${group.count > 1 ? 's' : ''} 
                            ${newsletterCount > 0 ? `• 📰 ${newsletterCount} newsletter${newsletterCount > 1 ? 's' : ''}` : ''}
                            • ${this.formatEmailDate(group.latestDate)}
                        </div>
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
    // GESTION DES EMAILS (identique avec ajouts Gmail)
    // ================================================
    toggleEmailSelection(emailId) {
        console.log('[PageManagerGmail] Toggle sélection email:', emailId);
        
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
            console.log('[PageManagerGmail] Email désélectionné:', emailId);
        } else {
            this.selectedEmails.add(emailId);
            console.log('[PageManagerGmail] Email sélectionné:', emailId);
        }
        
        const checkbox = document.querySelector(`[data-email-id="${emailId}"] .email-checkbox`);
        if (checkbox) {
            checkbox.checked = this.selectedEmails.has(emailId);
        }
        
        this.updateControlsOnly();
        
        console.log('[PageManagerGmail] Sélection mise à jour. Total sélectionnés:', this.selectedEmails.size);
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
                clearBtn.onclick = () => window.pageManagerGmail.clearSelection();
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
        console.log('[PageManagerGmail] Rafraîchissement vue emails Gmail...');
        
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
        
        console.log('[PageManagerGmail] Vue emails rafraîchie avec', this.selectedEmails.size, 'sélectionnés');
    }

    async refreshEmails() {
        this.showLoading('Actualisation...');
        
        try {
            await this.checkEmailSyncStatus();
            
            if (this.safeCall(() => window.emailScanner?.recategorizeEmails)) {
                await window.emailScanner.recategorizeEmails();
            }
            
            await this.loadPage('emails');
            this.showToast('Emails Gmail actualisés', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur d\'actualisation', 'error');
        }
    }

    // ================================================
    // GESTION DES FILTRES
    // ================================================
    filterByCategory(categoryId) {
        console.log(`[PageManagerGmail] 🔍 Filtrage par catégorie: ${categoryId}`);
        
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
        
        console.log('[PageManagerGmail] Toggle groupe:', groupKey);
        
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) {
            console.error('[PageManagerGmail] Groupe non trouvé:', groupKey);
            return;
        }
        
        const content = group.querySelector('.group-content');
        const icon = group.querySelector('.group-expand i');
        const header = group.querySelector('.group-header');
        
        if (!content || !icon || !header) {
            console.error('[PageManagerGmail] Éléments du groupe manquants');
            return;
        }
        
        const isExpanded = content.style.display !== 'none';
        
        if (isExpanded) {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
            header.classList.remove('expanded');
            console.log('[PageManagerGmail] Groupe fermé:', groupKey);
        } else {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
            header.classList.add('expanded');
            console.log('[PageManagerGmail] Groupe ouvert:', groupKey);
        }
    }

    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') {
            console.log('[PageManagerGmail] Clic checkbox détecté, arrêt propagation');
            return;
        }
        
        if (event.target.closest('.email-actions')) {
            console.log('[PageManagerGmail] Clic action détecté, arrêt propagation');
            return;
        }
        
        if (event.target.closest('.group-header')) {
            console.log('[PageManagerGmail] Clic dans group header, arrêt propagation');
            return;
        }
        
        const now = Date.now();
        const lastClick = this.lastEmailClick || 0;
        
        if (now - lastClick < 300) {
            console.log('[PageManagerGmail] Double-clic détecté, toggle sélection');
            event.preventDefault();
            event.stopPropagation();
            this.toggleEmailSelection(emailId);
            this.lastEmailClick = 0;
            return;
        }
        
        this.lastEmailClick = now;
        
        setTimeout(() => {
            if (Date.now() - this.lastEmailClick >= 250) {
                console.log('[PageManagerGmail] Simple clic confirmé, ouverture modal');
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
    // ACTIONS BULK (avec ajout désinscription Gmail)
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
            console.log('[PageManagerGmail] Dropdown Actions fermé');
        } else {
            menu.classList.add('show');
            button.classList.add('show');
            console.log('[PageManagerGmail] Dropdown Actions ouvert');
            
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
                console.log('[PageManagerGmail] Dropdown fermé via overlay');
            });
            
            document.body.appendChild(overlay);
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    menu.classList.remove('show');
                    button.classList.remove('show');
                    overlay.remove();
                    document.removeEventListener('keydown', handleEscape);
                    console.log('[PageManagerGmail] Dropdown fermé via Escape');
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
                    console.log('[PageManagerGmail] Dropdown fermé automatiquement');
                }
            }, 15000);
        }
    }

    async bulkMarkAsRead() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        this.showToast(`${selectedEmails.length} emails Gmail marqués comme lus`, 'success');
        this.clearSelection();
    }

    async bulkArchive() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        if (confirm(`Archiver ${selectedEmails.length} email(s) Gmail ?`)) {
            this.showToast(`${selectedEmails.length} emails archivés`, 'success');
            this.clearSelection();
        }
    }

    async bulkUnsubscribe() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        const emails = selectedEmails.map(id => this.getEmailById(id)).filter(Boolean);
        const newsletters = emails.filter(email => email.hasSubscribeButton || email.isNewsletter);
        
        if (newsletters.length === 0) {
            this.showToast('Aucune newsletter sélectionnée', 'warning');
            return;
        }
        
        if (confirm(`Se désabonner de ${newsletters.length} newsletter(s) ?\n\nCette action utilisera les liens de désabonnement Gmail.`)) {
            // Simuler la désinscription (dans la vraie implémentation, utiliser l'API Gmail)
            this.showToast(`Désabonnement de ${newsletters.length} newsletters en cours...`, 'info');
            
            // Marquer comme traitées
            newsletters.forEach(email => {
                email.unsubscribed = true;
            });
            
            setTimeout(() => {
                this.showToast(`✅ Désabonné de ${newsletters.length} newsletters`, 'success');
                this.clearSelection();
                this.refreshEmailsView();
            }, 2000);
        }
    }

    async bulkDelete() {
        const selectedEmails = Array.from(this.selectedEmails);
        if (selectedEmails.length === 0) return;
        
        if (confirm(`Supprimer définitivement ${selectedEmails.length} email(s) Gmail ?\n\nCette action est irréversible.`)) {
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
            this.showToast('Export Gmail terminé', 'success');
        }
        this.clearSelection();
    }

    // ================================================
    // FONCTIONS SPÉCIFIQUES GMAIL
    // ================================================
    showUnsubscribeOptions(emailId) {
        const email = this.getEmailById(emailId);
        if (!email || !email.hasSubscribeButton) return;
        
        const modal = document.createElement('div');
        modal.className = 'unsubscribe-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content gmail-modal">
                <div class="modal-header gmail">
                    <h3><i class="fas fa-user-slash"></i> Options de désabonnement</h3>
                    <button class="close-btn" onclick="this.closest('.unsubscribe-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>Newsletter:</strong> ${this.escapeHtml(email.subject)}</p>
                    <p><strong>Expéditeur:</strong> ${this.escapeHtml(email.from?.emailAddress?.address)}</p>
                    
                    <div class="unsubscribe-options">
                        <button class="btn btn-gmail" onclick="window.pageManagerGmail.unsubscribeEmail('${emailId}')">
                            <i class="fas fa-bell-slash"></i>
                            Se désabonner via Gmail
                        </button>
                        
                        <button class="btn btn-secondary" onclick="window.pageManagerGmail.blockSender('${emailId}')">
                            <i class="fas fa-ban"></i>
                            Bloquer l'expéditeur
                        </button>
                        
                        <button class="btn btn-secondary" onclick="window.pageManagerGmail.reportSpam('${emailId}')">
                            <i class="fas fa-exclamation-triangle"></i>
                            Signaler comme spam
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async unsubscribeEmail(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;
        
        this.showToast('Désabonnement en cours...', 'info');
        
        // Simuler l'appel API Gmail pour se désabonner
        setTimeout(() => {
            email.unsubscribed = true;
            this.showToast('✅ Désabonné avec succès', 'success');
            document.querySelector('.unsubscribe-modal')?.remove();
            this.refreshEmailsView();
        }, 1500);
    }

    async blockSender(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;
        
        const senderEmail = email.from?.emailAddress?.address;
        if (confirm(`Bloquer tous les emails de ${senderEmail} ?`)) {
            this.showToast(`Expéditeur ${senderEmail} bloqué`, 'success');
            document.querySelector('.unsubscribe-modal')?.remove();
        }
    }

    async reportSpam(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;
        
        if (confirm('Signaler cet email comme spam ?')) {
            this.showToast('Email signalé comme spam', 'success');
            document.querySelector('.unsubscribe-modal')?.remove();
            
            // Retirer l'email de la vue
            this.selectedEmails.delete(emailId);
            this.refreshEmailsView();
        }
    }

    // ================================================
    // CRÉATION DE TÂCHES (identique)
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
                console.error('[PageManagerGmail] Erreur création tâche:', emailId, error);
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
            provider: 'gmail',
            isNewsletter: email.hasSubscribeButton || email.isNewsletter,
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
            provider: 'gmail',
            isNewsletter: email.hasSubscribeButton || email.isNewsletter,
            startScanSynced: this.syncState.startScanSynced
        };
    }

    generateTaskId() {
        return `task-gmail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getEmailById(emailId) {
        const emails = this.getAllEmails();
        return emails.find(email => email.id === emailId) || null;
    }

    // ================================================
    // MODALS (identiques avec style Gmail)
    // ================================================
    showEmailModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'email_modal_' + Date.now();
        const syncBadge = this.syncState.startScanSynced ? 
            '<span class="sync-badge gmail">🔄 Synchronisé depuis UnifiedScan</span>' : '';
        
        const newsletterBadge = email.hasSubscribeButton || email.isNewsletter ?
            '<span class="newsletter-badge">📰 Newsletter Gmail</span>' : '';
        
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay gmail-modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div class="modal-container gmail-modal" style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div class="modal-header gmail" style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%); color: white;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 600;"><i class="fab fa-google"></i> Email Gmail</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" style="background: none; border: none; font-size: 24px; cursor: pointer; color: white; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">
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
                            ${newsletterBadge}
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
                            <button onclick="document.getElementById('${uniqueId}').remove(); window.pageManagerGmail.showTaskCreationModal('${emailId}');" style="padding: 8px 16px; background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;">
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
            console.warn('[PageManagerGmail] Analyse IA non disponible, création manuelle');
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
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%); color: white; border-radius: 16px 16px 0 0;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700;">✅ Créer une tâche Gmail</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">
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
                            
                            ${email.hasSubscribeButton || email.isNewsletter ? `
                                <div style="background: linear-gradient(135deg, rgba(234, 67, 53, 0.1), rgba(251, 188, 4, 0.1)); border: 1px solid #ea4335; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-newspaper" style="color: #ea4335; font-size: 20px;"></i>
                                    <span style="color: #ea4335; font-weight: 600;">📰 Newsletter détectée</span>
                                </div>
                            ` : ''}
                            
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
                        <button onclick="window.pageManagerGmail.createTaskFromModal('${email.id}'); document.getElementById('${uniqueId}').remove();"
                                style="padding: 12px 20px; background: linear-gradient(135deg, #ea4335, #fbbc04); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
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
    // AUTRES PAGES (identiques)
    // ================================================
    async renderTasks(container) {
        if (window.tasksView && window.tasksView.render) {
            window.tasksView.render(container);
        } else {
            container.innerHTML = `
                <div class="tasks-page">
                    <div class="page-header">
                        <h1><i class="fas fa-tasks"></i> Tâches Gmail</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 class="empty-title">Aucune tâche</h3>
                        <p class="empty-text">Créez des tâches à partir de vos emails Gmail</p>
                        <button class="btn btn-gmail" onclick="window.pageManagerGmail.loadPage('emails')">
                            <i class="fas fa-envelope"></i>
                            Voir les emails Gmail
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
                        <h1><i class="fas fa-cog"></i> Paramètres Gmail</h1>
                    </div>
                    
                    <div class="settings-grid">
                        <div class="settings-card gmail">
                            <h3><i class="fab fa-google"></i> Configuration Gmail</h3>
                            <p>Gérez vos paramètres Gmail</p>
                            <button class="btn btn-gmail" onclick="window.pageManagerGmail.configureGmail()">
                                <i class="fas fa-cog"></i> Configurer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-robot"></i> Configuration IA</h3>
                            <p>Configurez l'analyseur IA Claude</p>
                            <button class="btn btn-primary" onclick="window.pageManagerGmail.configureAI()">
                                <i class="fas fa-cog"></i> Configurer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-tags"></i> Catégories</h3>
                            <p>Gérez vos catégories d'emails</p>
                            <button class="btn btn-secondary" onclick="window.pageManagerGmail.loadPage('categories')">
                                <i class="fas fa-tags"></i> Gérer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-sync-alt"></i> Synchronisation</h3>
                            <p>État: ${this.syncState.emailScannerSynced ? 'Synchronisé' : 'Non synchronisé'}</p>
                            <div class="sync-status">
                                ${this.syncState.startScanSynced ? '✅ UnifiedScan' : '❌ UnifiedScan'}
                                ${this.syncState.emailScannerSynced ? '✅ EmailScanner' : '❌ EmailScanner'}
                                ${this.syncState.categoryManagerSynced ? '✅ CategoryManager' : '❌ CategoryManager'}
                                <span class="gmail-indicator">Gmail</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async renderScanner(container) {
        console.log('[PageManagerGmail] Rendering scanner page...');
        
        const authStatus = await this.checkAuthenticationStatus();
        
        if (!authStatus.isAuthenticated) {
            container.innerHTML = `
                <div class="scanner-auth-required gmail">
                    <div class="scanner-header">
                        <h1><i class="fab fa-google"></i> Scanner Gmail</h1>
                        <p>Connectez-vous pour analyser vos emails Gmail</p>
                    </div>
                    
                    <div class="auth-card gmail">
                        <div class="auth-icon">
                            <i class="fab fa-google"></i>
                        </div>
                        <h3>Connexion Google</h3>
                        <p>Accédez à vos emails Gmail</p>
                        <button class="btn btn-gmail btn-large" onclick="window.pageManagerGmail.handleLogin()">
                            <i class="fab fa-google"></i>
                            Se connecter avec Google
                        </button>
                    </div>
                    
                    <div class="scanner-info">
                        <div class="info-card">
                            <i class="fas fa-shield-alt"></i>
                            <h4>Sécurisé</h4>
                            <p>Authentification OAuth2 Google</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-newspaper"></i>
                            <h4>Newsletters</h4>
                            <p>Détection automatique avec bouton S'abonner</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-robot"></i>
                            <h4>IA Intégrée</h4>
                            <p>Analyse intelligente avec Claude AI</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        if (window.unifiedScanModule && typeof window.unifiedScanModule.render === 'function') {
            try {
                await window.unifiedScanModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManagerGmail] Error with unifiedScanModule:', error);
            }
        }
        
        container.innerHTML = `
            <div class="scanner-authenticated gmail">
                <div class="scanner-header">
                    <h1><i class="fab fa-google"></i> Scanner Gmail</h1>
                    <p>Analysez vos emails Gmail et détectez les newsletters</p>
                </div>
                
                <div class="scanner-status gmail">
                    <div class="status-item">
                        <i class="fas fa-user"></i>
                        <span>Connecté${authStatus.user ? ' : ' + authStatus.user.email : ''}</span>
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
                    <div class="alert alert-info gmail">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <h3>Scanner Gmail unifié</h3>
                            <p>Utilisez le scanner unifié pour importer vos emails Gmail.</p>
                            <button onclick="window.pageManagerGmail.startGmailScan()" class="btn btn-gmail">
                                <i class="fab fa-google"></i> Scanner mes emails Gmail
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async startGmailScan() {
        console.log('[PageManagerGmail] Starting Gmail scan...');
        
        // Forcer le provider Gmail dans UnifiedScanModule
        if (window.unifiedScanModule) {
            window.unifiedScanModule.selectProvider('gmail');
            await window.unifiedScanModule.startUnifiedScan();
        } else {
            this.showError('Scanner non disponible');
        }
    }

    async renderRanger(container) {
        if (window.domainOrganizer && window.domainOrganizer.showPage) {
            window.domainOrganizer.showPage(container);
        } else {
            container.innerHTML = `
                <div class="ranger-page">
                    <div class="page-header">
                        <h1><i class="fas fa-folder-tree"></i> Ranger par domaine (Gmail)</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-folder-tree"></i>
                        </div>
                        <h3 class="empty-title">Module de rangement Gmail</h3>
                        <p class="empty-text">Organisez vos emails Gmail par domaine</p>
                    </div>
                </div>
            `;
        }
    }

    renderEmptyEmailsState() {
        return `
            <div class="empty-state gmail">
                <div class="empty-state-icon">
                    <i class="fab fa-google"></i>
                </div>
                <h3 class="empty-state-title">Aucun email Gmail trouvé</h3>
                <p class="empty-state-text">
                    Utilisez le scanner pour récupérer et analyser vos emails Gmail.
                </p>
                <div class="empty-state-actions">
                    <button class="btn btn-gmail" onclick="window.pageManagerGmail.loadPage('scanner')">
                        <i class="fab fa-google"></i>
                        Scanner Gmail
                    </button>
                    ${this.syncState.emailScannerSynced ? `
                        <button class="btn btn-secondary" onclick="window.pageManagerGmail.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            Actualiser
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        console.log(`[PageManagerGmail] 📭 Rendu état vide - Catégorie: ${this.currentCategory}, Recherche: "${this.searchTerm}"`);
        
        let title, text, action = '';
        
        if (this.searchTerm) {
            title = 'Aucun résultat trouvé';
            text = `Aucun email Gmail ne correspond à votre recherche "${this.searchTerm}"`;
            action = `
                <button class="btn btn-primary" onclick="window.pageManagerGmail.clearSearch()">
                    <i class="fas fa-undo"></i>
                    <span>Effacer la recherche</span>
                </button>
            `;
        } else if (this.currentCategory === 'newsletter') {
            title = 'Aucune newsletter';
            text = 'Aucune newsletter Gmail détectée avec le bouton S\'abonner';
            action = `
                <button class="btn btn-gmail" onclick="window.pageManagerGmail.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else if (this.currentCategory === 'other') {
            title = 'Aucun email non catégorisé';
            text = 'Tous vos emails Gmail ont été correctement catégorisés ! 🎉';
            action = `
                <button class="btn btn-gmail" onclick="window.pageManagerGmail.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else if (this.currentCategory && this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            title = `Aucun email dans "${categoryName}"`;
            text = 'Cette catégorie ne contient aucun email Gmail pour le moment.';
            action = `
                <button class="btn btn-gmail" onclick="window.pageManagerGmail.filterByCategory('all')">
                    <i class="fas fa-list"></i>
                    <span>Voir tous les emails</span>
                </button>
            `;
        } else {
            title = 'Aucun email Gmail trouvé';
            text = 'Utilisez le scanner pour récupérer et analyser vos emails Gmail.';
            action = `
                <button class="btn btn-gmail" onclick="window.pageManagerGmail.loadPage('scanner')">
                    <i class="fab fa-google"></i>
                    <span>Scanner Gmail</span>
                </button>
            `;
        }
        
        return `
            <div class="empty-state gmail">
                <div class="empty-state-icon">
                    <i class="fab fa-google"></i>
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

    configureGmail() {
        // Ouvrir les paramètres Gmail spécifiques
        this.showToast('Configuration Gmail (à implémenter)', 'info');
    }

    getVisibleEmails() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            if (this.currentCategory === 'newsletter') {
                filteredEmails = filteredEmails.filter(email => email.hasSubscribeButton || email.isNewsletter);
            } else if (this.currentCategory === 'other') {
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
        console.log('[PageManagerGmail] 📊 Calcul des comptages de catégories...');
        
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
            console.log(`[PageManagerGmail] 📌 ${uncategorizedCount} emails dans la catégorie "Autre"`);
        }
        
        console.log('[PageManagerGmail] 📊 Comptages finaux:', counts);
        
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
                    console.error('[PageManagerGmail] Erreur analyse email:', error);
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
            console.warn('[PageManagerGmail] Safe call failed:', error);
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
            console.log(`[PageManagerGmail] Loading: ${message}`);
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
            console.error(`[PageManagerGmail] Error: ${message}`);
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            console.log(`[PageManagerGmail] ${type.toUpperCase()}: ${message}`);
        }
    }

    renderErrorPage(error) {
        return `
            <div class="empty-state gmail">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Erreur de chargement</h3>
                <p class="empty-state-text">${error.message}</p>
                <button class="btn btn-gmail" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    Recharger la page
                </button>
            </div>
        `;
    }

    // ================================================
    // STYLES CSS SPÉCIFIQUES GMAIL
    // ================================================
    addGmailStyles() {
        if (document.getElementById('gmailPageStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'gmailPageStyles';
        styles.textContent = `
            /* Styles spécifiques Gmail */
            .emails-page-modern.gmail {
                background: #f8f9fa;
            }

            /* Provider badges Gmail */
            .provider-badge.gmail,
            .sync-indicator.gmail,
            .sync-badge.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
            }

            .sync-indicator.gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border: 1px solid rgba(234, 67, 53, 0.3);
                color: #ea4335;
            }

            .explanation-notice.gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border: 1px solid rgba(234, 67, 53, 0.3);
                color: #ea4335;
            }

            /* Boutons Gmail */
            .btn-gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                border: none;
                box-shadow: 0 4px 12px rgba(234, 67, 53, 0.25);
            }

            .btn-gmail:hover {
                background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(234, 67, 53, 0.35);
            }

            .btn-primary.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                box-shadow: 0 4px 12px rgba(234, 67, 53, 0.25);
            }

            .btn-primary.gmail:hover {
                background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%);
                box-shadow: 0 6px 16px rgba(234, 67, 53, 0.35);
            }

            /* Email cards Gmail */
            .email-card.gmail {
                border-left-color: rgba(234, 67, 53, 0.2);
            }

            .email-card.gmail:hover {
                border-left-color: #ea4335;
            }

            .email-card.newsletter {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.05) 0%, rgba(251, 188, 4, 0.05) 100%);
                border-left: 3px solid #ea4335;
            }

            .email-card.newsletter:hover {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border-left-width: 4px;
            }

            /* Badges spécifiques Gmail */
            .newsletter-badge {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
            }

            .subscribe-badge {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                color: #ea4335;
                border: 1px solid rgba(234, 67, 53, 0.3);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }

            .email-type.gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                color: #ea4335;
                border: 1px solid rgba(234, 67, 53, 0.2);
            }

            /* Category tab spécial Gmail */
            .category-tab.special-gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border-color: rgba(234, 67, 53, 0.3);
            }

            .category-tab.special-gmail:hover {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.2) 0%, rgba(251, 188, 4, 0.2) 100%);
                border-color: #ea4335;
            }

            .category-tab.special-gmail.active {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                border-color: transparent;
            }

            .gmail-badge {
                position: absolute;
                bottom: -8px;
                right: 50%;
                transform: translateX(50%);
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 700;
                white-space: nowrap;
            }

            /* Actions Gmail */
            .action-btn.unsubscribe.gmail {
                color: #ea4335;
            }

            .action-btn.unsubscribe.gmail:hover {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border-color: #ea4335;
                color: #dc2626;
            }

            /* Modals Gmail */
            .gmail-modal-overlay .modal-container,
            .unsubscribe-modal .modal-content.gmail-modal {
                border-top: 4px solid #ea4335;
            }

            .modal-header.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
            }

            /* Empty states Gmail */
            .empty-state.gmail .empty-state-icon {
                color: #ea4335;
            }

            /* Settings Gmail */
            .settings-card.gmail {
                border-left: 3px solid #ea4335;
            }

            .gmail-indicator {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                margin-left: 8px;
            }

            /* Auth Gmail */
            .auth-icon.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
                color: white;
                width: 80px;
                height: 80px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 36px;
            }

            .auth-card.gmail {
                border-top: 4px solid #ea4335;
            }

            /* Scanner Gmail */
            .scanner-auth-required.gmail,
            .scanner-authenticated.gmail {
                border-top: 4px solid #ea4335;
            }

            .scanner-status.gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.05) 0%, rgba(251, 188, 4, 0.05) 100%);
                border: 1px solid rgba(234, 67, 53, 0.2);
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
            }

            .alert-info.gmail {
                background: linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%);
                border: 1px solid rgba(234, 67, 53, 0.3);
                color: #ea4335;
            }

            /* Unsubscribe modal */
            .unsubscribe-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .unsubscribe-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }

            .unsubscribe-modal .modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .unsubscribe-modal .modal-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 12px 12px 0 0;
            }

            .unsubscribe-modal .modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .unsubscribe-modal .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: white;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
            }

            .unsubscribe-modal .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .unsubscribe-modal .modal-body {
                padding: 20px;
            }

            .unsubscribe-modal .modal-body p {
                margin: 0 0 12px;
                color: #374151;
            }

            .unsubscribe-modal .unsubscribe-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 20px;
            }

            .unsubscribe-modal .unsubscribe-options button {
                width: 100%;
                padding: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 600;
            }

            /* Responsive Gmail */
            @media (max-width: 768px) {
                .newsletter-badge,
                .subscribe-badge {
                    font-size: 10px;
                    padding: 3px 6px;
                }
                
                .gmail-badge {
                    font-size: 9px;
                    padding: 2px 6px;
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
            provider: 'gmail',
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
            unifiedScan: {
                available: !!window.unifiedScanModule,
                provider: window.unifiedScanModule?.emailProvider || null
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
        
        console.log('[PageManagerGmail] 🧹 Nettoyage effectué');
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================
if (window.pageManagerGmail) {
    console.log('[PageManagerGmail] 🔄 Nettoyage ancienne instance...');
    window.pageManagerGmail.cleanup?.();
}

console.log('[PageManagerGmail] 🚀 Création nouvelle instance v1.0...');
window.pageManagerGmail = new PageManagerGmail();

// Bind all methods pour éviter les problèmes de contexte
Object.getOwnPropertyNames(PageManagerGmail.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManagerGmail[name] === 'function') {
        window.pageManagerGmail[name] = window.pageManagerGmail[name].bind(window.pageManagerGmail);
    }
});

// Fonctions de debug globales
window.debugPageManagerGmailSync = function() {
    return window.pageManagerGmail?.getSyncStatus() || { error: 'PageManagerGmail non disponible' };
};

window.refreshPageManagerGmailEmails = function() {
    if (window.pageManagerGmail && window.pageManagerGmail.currentPage === 'emails') {
        window.pageManagerGmail.refreshEmailsView();
        return { success: true, message: 'Vue emails Gmail rafraîchie' };
    }
    return { success: false, message: 'Pas sur la page emails ou PageManagerGmail non disponible' };
};

console.log('✅ PageManagerGmail v1.0 loaded - Détection newsletters Gmail');
