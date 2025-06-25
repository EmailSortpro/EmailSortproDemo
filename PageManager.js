// PageManager.js - Version 14.0 - Synchronisation complète avec StartScan et EmailScanner

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
        
        // État de synchronisation
        this.syncState = {
            startScanSynced: false,
            emailScannerSynced: false,
            lastSyncTimestamp: null,
            emailCount: 0
        };
        
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
            this.isInitialized = true;
            console.log('[PageManager] ✅ Version 14.0 - Synchronisation complète initialisée');
        } catch (error) {
            console.error('[PageManager] Initialization error:', error);
        }
    }

    // ================================================
    // LISTENERS DE SYNCHRONISATION STARTSCAN/EMAILSCANNER
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

    // ================================================
    // ÉVÉNEMENTS GLOBAUX
    // ================================================
    setupEventListeners() {
        // Écouter les changements de paramètres
        window.addEventListener('categorySettingsChanged', (event) => {
            console.log('[PageManager] 📨 Settings changed:', event.detail);
            this.handleSettingsChanged(event.detail);
        });

        // Écouter les changements génériques
        window.addEventListener('settingsChanged', (event) => {
            console.log('[PageManager] 📨 Generic settings changed:', event.detail);
            this.handleGenericSettingsChanged(event.detail);
        });

        // Écouter les erreurs globales
        window.addEventListener('error', (event) => {
            console.error('[PageManager] Global error:', event.error);
        });
    }

    handleSettingsChanged(settingsData) {
        console.log('[PageManager] 🔧 Processing settings change:', settingsData);
        
        if (settingsData.settings?.taskPreselectedCategories) {
            console.log('[PageManager] 📋 Preselected categories changed:', settingsData.settings.taskPreselectedCategories);
            
            // Déclencher la re-catégorisation si des emails existent
            if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                console.log('[PageManager] 🔄 Triggering re-categorization...');
                setTimeout(() => {
                    this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                }, 100);
            }
        }
        
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    handleGenericSettingsChanged(changeData) {
        console.log('[PageManager] 🔧 Processing generic change:', changeData);
        
        const { type, value } = changeData;
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[PageManager] 📋 Task categories changed:', value);
                if (window.aiTaskAnalyzer && typeof window.aiTaskAnalyzer.updatePreselectedCategories === 'function') {
                    window.aiTaskAnalyzer.updatePreselectedCategories(value);
                }
                
                // Déclencher la re-catégorisation
                if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                    setTimeout(() => {
                        this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                    }, 150);
                }
                break;
                
            case 'activeCategories':
                console.log('[PageManager] 🏷️ Active categories changed:', value);
                if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                    setTimeout(() => {
                        this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                    }, 150);
                }
                break;
                
            case 'preferences':
                console.log('[PageManager] ⚙️ Preferences changed:', value);
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
            const scanResults = localStorage.getItem('scanResults');
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
                    const storedAuth = localStorage.getItem('authStatus') || localStorage.getItem('userInfo');
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
    // PAGE RENDERERS - EMAILS AVEC SYNCHRONISATION COMPLÈTE
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

                <div class="controls-bar-harmonized">
                    <div class="search-section-harmonized">
                        <div class="search-box-harmonized">
                            <i class="fas fa-search search-icon-harmonized"></i>
                            <input type="text" 
                                   class="search-input-harmonized" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher emails..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear-harmonized" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="view-modes-harmonized">
                        <button class="view-mode-harmonized ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-domain')">
                            <i class="fas fa-globe"></i>
                            <span>Domaine</span>
                        </button>
                        <button class="view-mode-harmonized ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-sender')">
                            <i class="fas fa-user"></i>
                            <span>Expéditeur</span>
                        </button>
                        <button class="view-mode-harmonized ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('flat')">
                            <i class="fas fa-list"></i>
                            <span>Liste</span>
                        </button>
                    </div>
                    
                    <div class="action-buttons-harmonized">
                        <button class="btn-harmonized btn-selection-toggle" 
                                onclick="window.pageManager.toggleAllSelection()">
                            <i class="fas ${allVisible ? 'fa-square-check' : 'fa-square'}"></i>
                            <span>${allVisible ? 'Désélectionner' : 'Sélectionner'}</span>
                        </button>
                        
                        ${selectedCount > 0 ? `
                            <div class="selection-info-harmonized">
                                <span class="selection-count-harmonized">${selectedCount} sélectionné(s)</span>
                                <button class="btn-harmonized btn-clear-selection" onclick="window.pageManager.clearSelection()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <button class="btn-harmonized btn-primary" onclick="window.pageManager.createTasksFromSelection()">
                                <i class="fas fa-tasks"></i>
                                <span>Créer ${selectedCount} tâche${selectedCount > 1 ? 's' : ''}</span>
                            </button>
                        ` : ''}
                        
                        <button class="btn-harmonized btn-secondary" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                <div class="status-filters-harmonized-twolines">
                    ${this.buildCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <div class="tasks-container-harmonized">
                    ${this.renderEmailsList()}
                </div>
            </div>
        `;

        this.addHarmonizedEmailStyles();
        this.setupEmailsEventListeners();
    }

    renderSyncIndicator() {
        const { emailScannerSynced, startScanSynced, emailCount, lastSyncTimestamp } = this.syncState;
        
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
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getTaskPreselectedCategories) {
            return window.categoryManager.getTaskPreselectedCategories();
        }
        
        // Priorité 2: EmailScanner
        if (window.emailScanner && window.emailScanner.getTaskPreselectedCategories) {
            return window.emailScanner.getTaskPreselectedCategories();
        }
        
        // Fallback: localStorage
        try {
            const settings = JSON.parse(this.getLocalStorageItem('categorySettings') || '{}');
            return settings.taskPreselectedCategories || [];
        } catch (error) {
            return [];
        }
    }

    buildCategoryTabs(categoryCounts, totalEmails, categories) {
        const preselectedCategories = this.getTaskPreselectedCategories();
        console.log('[PageManager] 📌 Preselected categories for display:', preselectedCategories);
        
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
                    console.log(`[PageManager] ⭐ Preselected category: ${category.name} (${count} emails)`);
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
        
        return tabs.map(tab => {
            const isCurrentCategory = this.currentCategory === tab.id;
            const baseClasses = `status-pill-harmonized-twolines ${isCurrentCategory ? 'active' : ''}`;
            
            let extraClasses = '';
            let extraStyles = '';
            let preselectedBadge = '';
            
            if (tab.isPreselected && !isCurrentCategory) {
                extraClasses = ' preselected-category';
                extraStyles = `style="border: 2px solid ${tab.color || '#8b5cf6'}; background: ${tab.color ? tab.color + '10' : '#f3e8ff'};"`;
                preselectedBadge = '<span class="preselected-star">⭐</span>';
            } else if (tab.isPreselected && isCurrentCategory) {
                extraStyles = `style="box-shadow: 0 0 0 3px ${tab.color || '#8b5cf6'}40;"`;
                preselectedBadge = '<span class="preselected-star">⭐</span>';
            }
            
            return `
                <button class="${baseClasses}${extraClasses}" 
                        ${extraStyles}
                        onclick="window.pageManager.filterByCategory('${tab.id}')"
                        title="${tab.isPreselected ? '⭐ Catégorie pré-sélectionnée pour les tâches' : ''}">
                    <div class="pill-content-twolines">
                        <div class="pill-first-line-twolines">
                            <span class="pill-icon-twolines">${tab.icon}</span>
                            <span class="pill-count-twolines">${tab.count}</span>
                            ${preselectedBadge}
                        </div>
                        <div class="pill-second-line-twolines">
                            <span class="pill-text-twolines">${tab.name}</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    }

    renderEmailsList() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        // Appliquer les filtres
        if (this.currentCategory && this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        if (filteredEmails.length === 0) {
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
            <div class="tasks-harmonized-list">
                ${emails.map(email => this.renderEmailRow(email)).join('')}
            </div>
        `;
    }

    renderEmailRow(email) {
        const isSelected = this.selectedEmails.has(email.id);
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const preselectedCategories = this.getTaskPreselectedCategories();
        const isPreselectedForTasks = email.isPreselectedForTasks === true || preselectedCategories.includes(email.category);
        
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
                 onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                
                <input type="checkbox" 
                       class="task-checkbox-harmonized" 
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                
                <div class="priority-bar-harmonized" 
                     style="background-color: ${isPreselectedForTasks ? '#8b5cf6' : this.getEmailPriorityColor(email)}"></div>
                
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
                        </div>
                    </div>
                    
                    <div class="task-recipient-harmonized">
                        <i class="fas fa-envelope"></i>
                        <span class="recipient-name-harmonized">${this.escapeHtml(senderName)}</span>
                        ${email.hasAttachments ? '<span class="reply-indicator-harmonized">• Pièce jointe</span>' : ''}
                        ${email.category && email.category !== 'other' ? `
                            <span class="category-indicator-harmonized" 
                                  style="background: ${this.getCategoryColor(email.category)}20; 
                                         color: ${this.getCategoryColor(email.category)};">
                                ${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}
                            </span>
                        ` : ''}
                        ${email.categoryConfidence ? `
                            <span class="confidence-indicator-harmonized">
                                ${Math.round(email.categoryConfidence * 100)}% confiance
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions-harmonized">
                    ${this.renderEmailActions(email)}
                </div>
            </div>
        `;
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="tasks-grouped-harmonized">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
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

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="task-group-harmonized" data-group-key="${group.key}">
                <div class="group-header-harmonized" onclick="window.pageManager.toggleGroup('${group.key}')">
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
                    <div class="group-expand-harmonized">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content-harmonized" style="display: none;">
                    ${group.emails.map(email => this.renderEmailRow(email)).join('')}
                </div>
            </div>
        `;
    }

    // ================================================
    // EMAIL MANAGEMENT AVEC SYNCHRONISATION
    // ================================================
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

    refreshEmailsView() {
        const emailsContainer = document.querySelector('.tasks-container-harmonized');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
        
        // Mettre à jour l'indicateur de synchronisation
        const syncIndicator = document.querySelector('.sync-indicator');
        if (syncIndicator) {
            syncIndicator.outerHTML = this.renderSyncIndicator();
        }
    }

    // Continuer avec les autres méthodes existantes...
    toggleEmailSelection(emailId) {
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
        } else {
            this.selectedEmails.add(emailId);
        }
        this.refreshEmailsView();
    }

    toggleAllSelection() {
        const visibleEmails = this.getVisibleEmails();
        const allSelected = visibleEmails.length > 0 && visibleEmails.every(email => this.selectedEmails.has(email.id));
        
        if (allSelected) {
            visibleEmails.forEach(email => {
                this.selectedEmails.delete(email.id);
            });
            this.showToast('Emails désélectionnés', 'info');
        } else {
            visibleEmails.forEach(email => {
                this.selectedEmails.add(email.id);
            });
            this.showToast(`${visibleEmails.length} emails sélectionnés`, 'success');
        }
        
        this.refreshEmailsView();
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.refreshEmailsView();
        this.showToast('Sélection effacée', 'info');
    }

    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') return;
        if (event.target.closest('.task-actions-harmonized')) return;
        this.showEmailModal(emailId);
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        this.refreshEmailsView();
    }

    filterByCategory(categoryId) {
        this.currentCategory = categoryId;
        this.refreshEmailsView();
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

    hideExplanationMessage() {
        this.hideExplanation = true;
        this.setLocalStorageItem('hideEmailExplanation', 'true');
        this.refreshEmailsView();
    }

    toggleGroup(groupKey) {
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) return;
        
        const content = group.querySelector('.group-content-harmonized');
        const icon = group.querySelector('.group-expand-harmonized i');
        const header = group.querySelector('.group-header-harmonized');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
            header.classList.add('expanded-header');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
            header.classList.remove('expanded-header');
        }
    }

    // ================================================
    // TASK CREATION AVEC SYNCHRONISATION
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
                const taskData = this.buildTaskDataFromEmail(email);
                
                if (window.taskManager) {
                    const task = window.taskManager.createTaskFromEmail(taskData, email);
                    if (task) {
                        this.createdTasks.set(emailId, task.id);
                        created++;
                    }
                }
            } catch (error) {
                console.error('[PageManager] Error creating task:', emailId, error);
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

    showTaskCreationModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'task_modal_' + Date.now();
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>Créer une tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label>Titre de la tâche</label>
                            <input type="text" id="task-title" value="Email de ${senderName}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="task-description" class="form-textarea" rows="4">${email.bodyPreview || email.subject || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="task-priority" class="form-select">
                                    <option value="low">Basse</option>
                                    <option value="medium" selected>Normale</option>
                                    <option value="high">Haute</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date d'échéance</label>
                                <input type="date" id="task-duedate" class="form-input">
                            </div>
                        </div>
                        ${email.webSimulated && this.syncState.startScanSynced ? `
                            <div class="sync-info-task">
                                <i class="fas fa-info-circle"></i>
                                <span>Email synchronisé depuis la simulation StartScan</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="btn btn-secondary">
                            Annuler
                        </button>
                        <button onclick="window.pageManager.createTaskFromModal('${email.id}'); document.getElementById('${uniqueId}').remove();" class="btn btn-primary">
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
            const taskData = {
                ...this.buildTaskDataFromEmail(email),
                title,
                description,
                priority,
                dueDate
            };

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

    // ================================================
    // AUTRES MÉTHODES PAGES
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

    // ================================================
    // ACTIONS ET UTILITAIRES
    // ================================================
    configureAI() {
        if (window.aiTaskAnalyzer && window.aiTaskAnalyzer.showConfigurationModal) {
            window.aiTaskAnalyzer.showConfigurationModal();
        } else {
            this.showToast('Configuration IA non disponible', 'warning');
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

    renderEmailActions(email) {
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
                    <small>Debug sync: EmailScanner=${this.syncState.emailScannerSynced}, StartScan=${this.syncState.startScanSynced}, Count=${this.syncState.emailCount}</small>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state-harmonized">
                <div class="empty-state-icon-harmonized">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title-harmonized">Aucun email trouvé</h3>
                <p class="empty-state-text-harmonized">
                    ${this.searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun email dans cette catégorie'}
                </p>
                ${this.searchTerm ? `
                    <button class="btn-harmonized btn-primary" onclick="window.pageManager.clearSearch()">
                        <i class="fas fa-undo"></i>
                        <span>Effacer la recherche</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    getVisibleEmails() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
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
        const counts = {};
        emails.forEach(email => {
            const cat = email.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
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
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId)) ||
                        this.safeCall(() => window.emailScanner?.defaultWebCategories?.[categoryId]);
        return category?.color || '#64748b';
    }

    getCategoryIcon(categoryId) {
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId)) ||
                        this.safeCall(() => window.emailScanner?.defaultWebCategories?.[categoryId]);
        return category?.icon || '📌';
    }

    getCategoryName(categoryId) {
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId)) ||
                        this.safeCall(() => window.emailScanner?.defaultWebCategories?.[categoryId]);
        return category?.name || categoryId || 'Autre';
    }

    // ================================================
    // STYLES
    // ================================================
    addHarmonizedEmailStyles() {
        if (document.getElementById('harmonizedEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'harmonizedEmailStyles';
        styles.textContent = `
            /* Variables CSS */
            :root {
                --btn-height: 44px;
                --btn-padding: 16px;
                --btn-font-size: 13px;
                --btn-border-radius: 10px;
                --btn-font-weight: 600;
                --card-padding: 14px;
                --card-border-radius: 12px;
                --transition-speed: 0.2s;
                --shadow-base: 0 2px 8px rgba(0, 0, 0, 0.05);
                --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
                --preselect-color: #8b5cf6;
                --sync-color: #10b981;
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
            
            /* Cards simulées */
            .task-harmonized-card.web-simulated {
                border-left: 3px solid var(--sync-color);
            }
            
            .task-harmonized-card.web-simulated:hover {
                border-left: 4px solid var(--sync-color);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
            }
            
            /* Indicateur de confiance */
            .confidence-indicator-harmonized {
                background: rgba(16, 185, 129, 0.1);
                color: #059669;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
            }
            
            /* Info sync dans modal */
            .sync-info-task {
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 8px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #059669;
                font-size: 13px;
                font-weight: 500;
                margin-top: 16px;
            }
            
            /* Debug sync */
            .sync-debug {
                margin-top: 16px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
                text-align: center;
            }
            
            .sync-debug small {
                color: #6b7280;
                font-family: monospace;
            }
            
            /* Empty state amélioré */
            .empty-state-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 24px;
            }
            
            /* Reste des styles harmonisés existants... */
            /* (Garder tous les autres styles existants) */
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
    // MÉTHODES DE DEBUG ET STATUT
    // ================================================
    getSyncStatus() {
        return {
            ...this.syncState,
            emailScanner: {
                available: !!window.emailScanner,
                emails: window.emailScanner?.emails?.length || 0,
                startScanSynced: window.emailScanner?.startScanSynced || false
            },
            startScan: {
                available: !!window.minimalScanModule,
                categories: window.minimalScanModule?.taskPreselectedCategories || []
            },
            lastScanData: this.lastScanData
        };
    }

    debugSync() {
        console.group('🔍 DEBUG Synchronisation PageManager');
        console.log('État sync:', this.syncState);
        console.log('EmailScanner:', {
            available: !!window.emailScanner,
            emails: window.emailScanner?.emails?.length || 0,
            categories: window.emailScanner?.taskPreselectedCategories || [],
            startScanSynced: window.emailScanner?.startScanSynced || false
        });
        console.log('StartScan:', {
            available: !!window.minimalScanModule,
            categories: window.minimalScanModule?.taskPreselectedCategories || [],
            settings: window.minimalScanModule?.settings || {}
        });
        console.log('Last scan data:', this.lastScanData);
        console.groupEnd();
        
        return this.getSyncStatus();
    }
}

// Create global instance
if (!window.pageManager) {
    window.pageManager = new PageManager();
    
    // Bind methods to preserve context
    Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
        if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
            window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
        }
    });
}

// Fonctions utilitaires globales pour debug
window.debugPageManagerSync = function() {
    return window.pageManager?.debugSync() || { error: 'PageManager non disponible' };
};

window.testPageManagerSync = function() {
    console.group('🧪 TEST Synchronisation PageManager');
    
    const status = window.pageManager?.getSyncStatus();
    console.log('Status:', status);
    
    // Test de récupération d'emails
    const emails = window.pageManager?.getAllEmails() || [];
    console.log('Emails récupérés:', emails.length);
    
    // Test de catégories
    const categories = window.pageManager?.getCategories() || {};
    console.log('Catégories:', Object.keys(categories));
    
    console.groupEnd();
    
    return {
        success: true,
        status,
        emailCount: emails.length,
        categoryCount: Object.keys(categories).length
    };
};

console.log('✅ PageManager v14.0 loaded - Synchronisation complète avec StartScan et EmailScanner');
