// app.js - Application EmailSortPro CORRIGÉ v5.7
// Version avec intégration licence obligatoire et gestion d'erreurs améliorée

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentPage = 'dashboard';
        this.netlifyDomain = 'coruscating-dodol-f30e8d.netlify.app';
        this.isNetlifyEnv = window.location.hostname.includes('netlify.app');
        this.licenseCheckPassed = false;
        
        console.log('[App] Constructor - EmailSortPro v5.7 with license integration...');
        console.log('[App] Environment:', this.isNetlifyEnv ? 'Netlify' : 'Local');
        console.log('[App] Domain:', window.location.hostname);
        
        // CORRECTION 1: Ne PAS créer le LicenseService ici - laisser license-check.js s'en occuper
        console.log('[App] Waiting for license verification before initialization...');
        
        // Écouter les événements d'authentification de licence
        this.setupLicenseEventListeners();
        
        // Initialiser Analytics Manager
        this.initializeAnalytics();
    }

    // =====================================
    // ÉCOUTE DES ÉVÉNEMENTS DE LICENCE
    // =====================================
    setupLicenseEventListeners() {
        // Écouter l'authentification utilisateur RÉUSSIE depuis license-check.js
        window.addEventListener('userAuthenticated', (event) => {
            console.log('[App] License verification successful, user authenticated:', event.detail);
            
            const { user, status } = event.detail;
            this.user = user;
            this.isAuthenticated = true;
            this.activeProvider = this.detectProvider();
            this.licenseCheckPassed = true;
            
            // Démarrer l'initialisation de l'app maintenant que la licence est OK
            console.log('[App] License OK - Starting app initialization...');
            setTimeout(() => {
                this.init();
            }, 500);
        });
        
        // Écouter les événements de licence échouée
        window.addEventListener('licenseCheckFailed', (event) => {
            console.error('[App] License check failed:', event.detail);
            this.showLicenseError(event.detail);
        });
        
        // Écouter la disponibilité du service de licence
        window.addEventListener('licenseServiceReady', (event) => {
            console.log('[App] License service ready');
        });
    }

    // =====================================
    // INITIALISATION ANALYTICS
    // =====================================
    initializeAnalytics() {
        console.log('[App] Initializing analytics...');
        
        try {
            if (window.analyticsManager) {
                console.log('[App] ✅ Analytics manager ready');
                window.analyticsManager.onPageLoad('index');
                console.log('[App] ✅ Analytics initialized successfully');
            } else {
                setTimeout(() => {
                    if (window.analyticsManager) {
                        console.log('[App] ✅ Analytics manager now available');
                        window.analyticsManager.onPageLoad('index');
                    }
                }, 1000);
            }
        } catch (error) {
            console.warn('[App] Error initializing analytics:', error);
        }
    }

    async init() {
        console.log('[App] Initializing application...');
        
        // CORRECTION 2: Vérifier que la licence a été validée avant de continuer
        if (!this.licenseCheckPassed) {
            console.error('[App] ❌ Cannot initialize app without valid license');
            this.showError('Vérification de licence requise avant l\'initialisation');
            return;
        }
        
        if (this.initializationPromise) {
            console.log('[App] Already initializing, waiting...');
            return this.initializationPromise;
        }
        
        if (this.isInitializing) {
            console.log('[App] Already initializing, skipping...');
            return;
        }
        
        this.initializationPromise = this._doInit();
        return this.initializationPromise;
    }

    async _doInit() {
        this.isInitializing = true;
        this.initializationAttempts++;
        
        try {
            console.log('[App] Starting app initialization with valid license...');
            
            // 1. Vérifier les prérequis de base
            if (!this.checkPrerequisites()) {
                throw new Error('Prerequisites check failed');
            }

            // 2. Vérifier que le LicenseService est disponible et fonctionnel
            if (!window.licenseService || !window.licenseService.initialized) {
                throw new Error('LicenseService not properly initialized');
            }

            // 3. Initialiser les services d'authentification
            console.log('[App] Initializing auth services...');
            await this.initializeAuthServices();
            
            // 4. Initialiser les modules critiques
            await this.initializeCriticalModules();
            
            // 5. Vérifier l'état d'authentification
            await this.checkAuthenticationStatus();
            
        } catch (error) {
            await this.handleInitializationError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    detectProvider() {
        if (this.user?.provider) {
            return this.user.provider;
        }
        
        // Détecter le provider basé sur l'email
        const email = this.user?.email || this.user?.mail || '';
        if (email.includes('@outlook.com') || email.includes('@hotmail.') || email.includes('@live.com')) {
            return 'microsoft';
        }
        if (email.includes('@gmail.com') || email.includes('@googlemail.com')) {
            return 'google';
        }
        
        return 'microsoft'; // Par défaut
    }

    async initializeAuthServices() {
        const authPromises = [];
        
        if (window.authService) {
            authPromises.push(
                window.authService.initialize().then(() => {
                    console.log('[App] ✅ Microsoft auth service initialized');
                    return 'microsoft';
                }).catch(error => {
                    console.warn('[App] ⚠️ Microsoft auth service failed:', error.message);
                    return null;
                })
            );
        }
        
        if (window.googleAuthService) {
            authPromises.push(
                window.googleAuthService.initialize().then(() => {
                    console.log('[App] ✅ Google auth service initialized');
                    return 'google';
                }).catch(error => {
                    console.warn('[App] ⚠️ Google auth service failed:', error.message);
                    return null;
                })
            );
        }
        
        if (authPromises.length > 0) {
            const initTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth services timeout')), 15000)
            );
            
            try {
                const initResults = await Promise.race([
                    Promise.allSettled(authPromises),
                    initTimeout
                ]);
                
                console.log('[App] Auth services initialization results:', initResults);
            } catch (error) {
                console.warn('[App] Auth services timeout, continuing anyway:', error.message);
            }
        }
    }

    // =====================================
    // INITIALISATION DES MODULES CRITIQUES
    // =====================================
    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules...');
        
        await this.ensureTaskManagerReady();
        await this.ensurePageManagerReady();
        await this.ensureDashboardModuleReady();
        await this.ensureMailServiceReady();
        await this.ensureScanModulesReady();
        this.initializeScrollManager();
        
        console.log('[App] Critical modules initialized');
    }

    async ensureTaskManagerReady() {
        if (window.taskManager && window.taskManager.initialized) {
            console.log('[App] ✅ TaskManager ready');
            return true;
        }
        
        let attempts = 0;
        while ((!window.taskManager || !window.taskManager.initialized) && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.taskManager && window.taskManager.initialized) {
            console.log('[App] ✅ TaskManager ready');
            return true;
        } else {
            console.warn('[App] ⚠️ TaskManager not ready');
            return false;
        }
    }

    async ensurePageManagerReady() {
        if (window.pageManager) {
            console.log('[App] ✅ PageManager ready');
            return true;
        }
        
        let attempts = 0;
        while (!window.pageManager && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log(window.pageManager ? '[App] ✅ PageManager ready' : '[App] ⚠️ PageManager not ready');
        return !!window.pageManager;
    }

    async ensureDashboardModuleReady() {
        if (window.dashboardModule) {
            console.log('[App] ✅ DashboardModule ready');
            return true;
        }
        
        let attempts = 0;
        while (!window.dashboardModule && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log(window.dashboardModule ? '[App] ✅ DashboardModule ready' : '[App] ⚠️ DashboardModule not ready');
        return !!window.dashboardModule;
    }

    async ensureMailServiceReady() {
        if (window.mailService && typeof window.mailService.getEmailsFromFolder === 'function') {
            console.log('[App] ✅ MailService ready');
            return true;
        }
        
        let attempts = 0;
        while ((!window.mailService || typeof window.mailService.getEmailsFromFolder !== 'function') && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.mailService && typeof window.mailService.getEmailsFromFolder === 'function') {
            console.log('[App] ✅ MailService ready');
            return true;
        } else {
            console.warn('[App] ⚠️ MailService not ready, creating fallback...');
            this.createMailServiceFallback();
            return false;
        }
    }

    createMailServiceFallback() {
        if (!window.mailService) {
            window.mailService = {};
        }
        
        const fallbackMethods = {
            getEmailsFromFolder: async () => [],
            getFolders: async () => [{ id: 'inbox', displayName: 'Boîte de réception', totalItemCount: 0 }],
            getEmailCount: async () => 0,
            searchEmails: async () => [],
            moveToFolder: async () => true,
            markAsRead: async () => true,
            deleteEmail: async () => true
        };
        
        Object.keys(fallbackMethods).forEach(method => {
            if (typeof window.mailService[method] !== 'function') {
                window.mailService[method] = fallbackMethods[method];
            }
        });
        
        window.mailService._isFallback = true;
        console.log('[App] ✅ MailService fallback created');
    }

    async ensureScanModulesReady() {
        if (!window.minimalScanModule) {
            this.createScanModuleFallback();
        }
        
        if (!window.emailScanner) {
            this.createEmailScannerFallback();
        }
        
        console.log('[App] ✅ Scan modules ready');
    }

    createScanModuleFallback() {
        window.minimalScanModule = {
            render: () => {
                const pageContent = document.getElementById('pageContent');
                if (pageContent) {
                    pageContent.innerHTML = `
                        <div class="page-container">
                            <div class="page-header">
                                <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                                <p>Service de scan temporairement indisponible</p>
                            </div>
                            <div class="fallback-content">
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <div>
                                        <h3>Service temporairement indisponible</h3>
                                        <p>Le scanner d'emails n'est pas disponible pour le moment.</p>
                                        <button onclick="window.pageManager?.loadPage('dashboard')" class="btn btn-primary">
                                            <i class="fas fa-home"></i> Retour au tableau de bord
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            _isFallback: true
        };
    }

    createEmailScannerFallback() {
        window.emailScanner = {
            scanEmails: async () => ({
                success: false,
                message: 'Service de scan temporairement indisponible',
                emails: []
            }),
            analyzeEmails: async () => ({
                categories: [],
                stats: { total: 0, analyzed: 0 }
            }),
            _isFallback: true
        };
    }

    // =====================================
    // GESTION DU SCROLL
    // =====================================
    initializeScrollManager() {
        window.setPageMode = (pageName) => {
            if (!pageName || this.currentPage === pageName) {
                return;
            }
            
            const previousPage = this.currentPage;
            this.currentPage = pageName;
            
            console.log(`[App] Page mode changed: ${previousPage} → ${pageName}`);
            
            const body = document.body;
            body.classList.remove(
                'page-dashboard', 'page-scanner', 'page-emails', 
                'page-tasks', 'page-ranger', 'page-settings'
            );
            body.classList.add(`page-${pageName}`);
            
            // Dashboard: pas de scroll
            if (pageName === 'dashboard') {
                body.style.overflow = 'hidden';
                body.style.overflowY = 'hidden';
                body.style.overflowX = 'hidden';
            } else {
                // Autres pages: autoriser le scroll si nécessaire
                setTimeout(() => {
                    const contentHeight = document.documentElement.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    
                    if (contentHeight > viewportHeight + 100) {
                        body.style.overflow = '';
                        body.style.overflowY = '';
                        body.style.overflowX = '';
                    }
                }, 300);
            }
        };
        
        console.log('[App] ✅ Scroll manager initialized');
    }

    checkPrerequisites() {
        if (typeof msal === 'undefined') {
            console.error('[App] MSAL library not loaded');
            this.showError('MSAL library not loaded. Please refresh the page.');
            return false;
        }

        if (!window.AppConfig) {
            console.error('[App] Configuration not loaded');
            this.showError('Configuration not loaded. Please refresh the page.');
            return false;
        }

        const validation = window.AppConfig.validate();
        if (!validation.valid) {
            console.error('[App] Configuration invalid:', validation.issues);
            this.showConfigurationError(validation.issues);
            return false;
        }

        return true;
    }

    // =====================================
    // VÉRIFICATION DE L'AUTHENTIFICATION
    // =====================================
    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        // Si l'utilisateur est déjà authentifié (via les événements de licence)
        if (this.isAuthenticated && this.user) {
            console.log('[App] ✅ User already authenticated:', this.user.email);
            this.showAppWithTransition();
            return;
        }
        
        // Vérifier s'il y a déjà des données dans les variables globales
        if (window.currentUser && window.licenseStatus) {
            console.log('[App] ✅ Found user in global variables:', window.currentUser.email);
            this.user = window.currentUser;
            this.isAuthenticated = true;
            this.activeProvider = this.detectProvider();
            this.showAppWithTransition();
            return;
        }
        
        // Vérifier les callbacks OAuth
        const googleCallbackHandled = await this.handleGoogleCallback();
        if (googleCallbackHandled) {
            this.showAppWithTransition();
            return;
        }
        
        // Vérifier Microsoft
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account) {
                console.log('[App] Microsoft authentication found, getting user info...');
                try {
                    this.user = await window.authService.getUserInfo();
                    this.user.provider = 'microsoft';
                    this.isAuthenticated = true;
                    this.activeProvider = 'microsoft';
                    
                    console.log('[App] ✅ Microsoft user authenticated:', this.user.displayName || this.user.mail);
                    this.showAppWithTransition();
                    return;
                } catch (userInfoError) {
                    console.error('[App] Error getting Microsoft user info:', userInfoError);
                    await window.authService.reset();
                }
            }
        }
        
        // Vérifier Google
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account) {
                console.log('[App] Google authentication found, getting user info...');
                try {
                    this.user = await window.googleAuthService.getUserInfo();
                    this.user.provider = 'google';
                    this.isAuthenticated = true;
                    this.activeProvider = 'google';
                    
                    console.log('[App] ✅ Google user authenticated:', this.user.displayName || this.user.email);
                    this.showAppWithTransition();
                    return;
                } catch (userInfoError) {
                    console.error('[App] Error getting Google user info:', userInfoError);
                    await window.googleAuthService.reset();
                }
            }
        }
        
        // Aucune authentification trouvée
        console.log('[App] No valid authentication found');
        this.showLogin();
    }

    async handleGoogleCallback() {
        try {
            const callbackDataStr = sessionStorage.getItem('google_callback_data');
            if (!callbackDataStr) {
                return false;
            }
            
            const callbackData = JSON.parse(callbackDataStr);
            sessionStorage.removeItem('google_callback_data');
            
            const urlParams = new URLSearchParams();
            urlParams.set('code', callbackData.code);
            urlParams.set('state', callbackData.state);
            
            const success = await window.googleAuthService.handleOAuthCallback(urlParams);
            
            if (success) {
                this.user = await window.googleAuthService.getUserInfo();
                this.user.provider = 'google';
                this.isAuthenticated = true;
                this.activeProvider = 'google';
                
                console.log('[App] ✅ Google callback handled successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[App] Error handling Google callback:', error);
            return false;
        }
    }

    async handleInitializationError(error) {
        console.error('[App] Initialization error:', error);
        
        if (error.message.includes('Prerequisites check failed')) {
            return;
        }
        
        if (this.initializationAttempts < this.maxInitAttempts && 
            (error.message.includes('timeout') || error.message.includes('network'))) {
            console.log(`[App] Retrying initialization (${this.initializationAttempts}/${this.maxInitAttempts})...`);
            this.isInitializing = false;
            this.initializationPromise = null;
            setTimeout(() => this.init(), 3000);
            return;
        }
        
        this.showError('Failed to initialize the application. Please check the configuration and refresh the page.');
    }

    setupEventListeners() {
        console.log('[App] Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                try {
                    const page = e.currentTarget.dataset.page;
                    if (page && window.pageManager) {
                        this.currentPage = page;
                        
                        if (window.setPageMode) {
                            window.setPageMode(page);
                        }
                        
                        if (typeof window.pageManager.loadPage === 'function') {
                            window.pageManager.loadPage(page);
                        }
                    }
                } catch (error) {
                    console.error('[App] Navigation error:', error);
                }
            });
        });

        console.log('[App] ✅ Event listeners set up');
    }

    // =====================================
    // MÉTHODES DE CONNEXION
    // =====================================
    async login() {
        return this.loginMicrosoft();
    }

    async loginMicrosoft() {
        console.log('[App] Microsoft login attempted...');
        
        try {
            this.showModernLoading('Connexion à Outlook...');
            
            if (!window.authService) {
                throw new Error('Microsoft AuthService not available');
            }
            
            if (!window.authService.isInitialized) {
                await window.authService.initialize();
            }
            
            await window.authService.login();
            
        } catch (error) {
            console.error('[App] Microsoft login error:', error);
            this.hideModernLoading();
            
            let errorMessage = 'Échec de la connexion Microsoft. Veuillez réessayer.';
            
            if (error.errorCode) {
                switch (error.errorCode) {
                    case 'popup_window_error':
                        errorMessage = 'Popup bloqué. Autorisez les popups et réessayez.';
                        break;
                    case 'user_cancelled':
                        errorMessage = 'Connexion annulée.';
                        break;
                    case 'network_error':
                        errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
                        break;
                    case 'unauthorized_client':
                        errorMessage = 'Configuration incorrecte. Vérifiez votre Azure Client ID.';
                        break;
                    default:
                        errorMessage = `Erreur Microsoft: ${error.errorCode}`;
                }
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(errorMessage, 'error', 8000);
            }
            
            throw error;
        }
    }

    async logout() {
        console.log('[App] Logout attempted...');
        
        try {
            const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
            if (!confirmed) return;
            
            this.showModernLoading('Déconnexion...');
            
            // Déconnexion du système de licence
            if (window.licenseService?.logout) {
                await window.licenseService.logout();
            }
            
            // Déconnexion selon le provider actif
            if (this.activeProvider === 'microsoft' && window.authService) {
                await window.authService.logout();
            } else if (this.activeProvider === 'google' && window.googleAuthService) {
                await window.googleAuthService.logout();
            } else {
                this.forceCleanup();
            }
            
        } catch (error) {
            console.error('[App] Logout error:', error);
            this.hideModernLoading();
            this.forceCleanup();
        }
    }

    forceCleanup() {
        console.log('[App] Force cleanup...');
        
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentPage = 'dashboard';
        this.licenseCheckPassed = false;
        
        // Nettoyer les variables globales
        window.currentUser = null;
        window.licenseStatus = null;
        
        // Nettoyer les services d'authentification
        if (window.authService && typeof window.authService.forceCleanup === 'function') {
            window.authService.forceCleanup();
        }
        
        if (window.googleAuthService && typeof window.googleAuthService.forceCleanup === 'function') {
            window.googleAuthService.forceCleanup();
        }
        
        // Nettoyer le localStorage sélectivement
        const keysToKeep = ['emailsort_categories', 'emailsort_tasks', 'emailsortpro_client_id'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('[App] Error removing key:', key);
                }
            }
        });
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // =====================================
    // AFFICHAGE DE L'INTERFACE
    // =====================================
    showLogin() {
        console.log('[App] Showing login page');
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
        
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(null);
        }
    }

    showAppWithTransition() {
        console.log('[App] Showing application - Provider:', this.activeProvider);
        
        this.hideModernLoading();
        
        // Activer le mode app
        document.body.classList.remove('login-mode');
        document.body.classList.add('app-active');
        
        // Afficher les éléments
        const loginPage = document.getElementById('loginPage');
        const appHeader = document.querySelector('.app-header');
        const appNav = document.querySelector('.app-nav');
        const pageContent = document.getElementById('pageContent');
        
        if (loginPage) loginPage.style.display = 'none';
        if (appHeader) {
            appHeader.style.display = 'block';
            appHeader.style.opacity = '1';
            appHeader.style.visibility = 'visible';
        }
        if (appNav) {
            appNav.style.display = 'block';
            appNav.style.opacity = '1';
            appNav.style.visibility = 'visible';
        }
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
            pageContent.style.visibility = 'visible';
        }
        
        // Mettre à jour l'interface utilisateur
        if (window.uiManager && typeof window.uiManager.updateAuthStatus === 'function') {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Initialiser le dashboard
        this.currentPage = 'dashboard';
        if (window.setPageMode) {
            window.setPageMode('dashboard');
        }
        
        // Forcer pas de scroll pour le dashboard
        document.body.style.overflow = 'hidden';
        document.body.style.overflowY = 'hidden';
        
        // Charger le dashboard
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            setTimeout(() => {
                try {
                    window.dashboardModule.render();
                    console.log('[App] Dashboard loaded');
                } catch (error) {
                    console.error('[App] Dashboard render error:', error);
                    this.showDashboardFallback();
                }
            }, 100);
        } else {
            setTimeout(() => {
                this.showDashboardFallback();
            }, 500);
        }
        
        console.log(`[App] ✅ Application displayed with ${this.activeProvider} provider`);
    }

    showDashboardFallback() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;
        
        const userInfo = window.currentUser || this.user;
        const licenseInfo = window.licenseStatus;
        const isTrialUser = licenseInfo?.status === 'trial';
        const daysRemaining = licenseInfo?.daysRemaining || 0;
        const isEmergencyMode = window.licenseService?.isEmergency || false;
        
        pageContent.innerHTML = `
            <div class="dashboard-fallback">
                <div class="dashboard-header">
                    <h1><i class="fas fa-tachometer-alt"></i> Tableau de bord EmailSortPro</h1>
                    <p>Bienvenue ${userInfo?.name || userInfo?.displayName || 'Utilisateur'}</p>
                    ${!isEmergencyMode ? `
                        <div class="database-badge">
                            <i class="fas fa-database"></i>
                            Mode production - Données persistantes
                        </div>
                    ` : `
                        <div class="demo-badge">
                            <i class="fas fa-flask"></i>
                            Mode démonstration - Fonctionnalités complètes
                        </div>
                    `}
                    ${isTrialUser ? `
                        <div class="trial-badge">
                            <i class="fas fa-clock"></i>
                            Période d'essai: ${daysRemaining} jour${daysRemaining !== 1 ? 's' : ''} restant${daysRemaining !== 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <div class="card-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="card-content">
                                <h3>Scanner d'emails</h3>
                                <p>Analysez et triez vos emails automatiquement</p>
                                <button onclick="window.pageManager?.loadPage('scanner')" class="btn btn-primary">
                                    <i class="fas fa-search"></i> Accéder au scanner
                                </button>
                            </div>
                        </div>
                        <div class="dashboard-card">
                            <div class="card-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="card-content">
                                <h3>Gestionnaire de tâches</h3>
                                <p>Organisez vos tâches et suivez vos projets</p>
                                <button onclick="window.pageManager?.loadPage('tasks')" class="btn btn-primary">
                                    <i class="fas fa-list"></i> Voir les tâches
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="status-info">
                        <div class="provider-badge ${this.activeProvider || 'unknown'}">
                            <i class="fas fa-envelope"></i>
                            ${this.activeProvider === 'microsoft' ? 'Microsoft Outlook' : 
                              this.activeProvider === 'google' ? 'Google Gmail' : 
                              'Non connecté'}
                        </div>
                        ${userInfo?.company?.name ? `
                            <div class="company-badge">
                                <i class="fas fa-building"></i>
                                ${userInfo.company.name}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter les styles si pas déjà présents
        if (!document.getElementById('dashboard-styles')) {
            const style = document.createElement('style');
            style.id = 'dashboard-styles';
            style.textContent = `
                .dashboard-fallback { padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .dashboard-header { text-align: center; margin-bottom: 3rem; }
                .database-badge { 
                    display: inline-block; background: linear-gradient(135deg, #10b981, #059669); 
                    color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; margin-top: 1rem; 
                }
                .demo-badge { 
                    display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
                    color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; margin-top: 1rem; 
                }
                .trial-badge { 
                    display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); 
                    color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; margin-top: 1rem; 
                }
                .dashboard-grid { 
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                    gap: 2rem; margin-bottom: 2rem; 
                }
                .dashboard-card { 
                    background: white; border-radius: 12px; padding: 2rem; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); text-align: center; 
                    transition: transform 0.2s ease; 
                }
                .dashboard-card:hover { 
                    transform: translateY(-2px); box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15); 
                }
                .card-icon { font-size: 3rem; color: #3b82f6; margin-bottom: 1rem; }
                .status-info { 
                    display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; 
                }
                .provider-badge, .company-badge { 
                    display: inline-flex; align-items: center; gap: 0.5rem; 
                    padding: 0.75rem 1.5rem; border-radius: 25px; font-weight: 600; color: white; 
                }
                .provider-badge.microsoft { background: linear-gradient(135deg, #0078d4, #106ebe); }
                .provider-badge.google { background: linear-gradient(135deg, #4285f4, #34a853); }
                .provider-badge.unknown { background: linear-gradient(135deg, #6b7280, #4b5563); }
                .company-badge { background: linear-gradient(135deg, #6b7280, #4b5563); }
                .btn { 
                    padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; 
                    cursor: pointer; transition: all 0.2s ease; text-decoration: none; 
                    display: inline-flex; align-items: center; gap: 0.5rem; 
                }
                .btn-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
            `;
            document.head.appendChild(style);
        }
        
        console.log('[App] Dashboard fallback displayed');
    }

    showModernLoading(message = 'Chargement...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.login-loading-text');
            if (loadingText) {
                loadingText.innerHTML = `
                    <div>${message}</div>
                    <div style="font-size: 14px; opacity: 0.8; margin-top: 10px;">Authentification en cours</div>
                `;
            }
            loadingOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModernLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    showError(message) {
        console.error('[App] Showing error:', message);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #1f2937;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Erreur d'application</h1>
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 30px; border-radius: 20px; margin: 30px 0;">
                            <p style="font-size: 1.2rem; line-height: 1.6;">${message}</p>
                        </div>
                        <button onclick="location.reload()" class="login-button">
                            <i class="fas fa-refresh"></i> Actualiser la page
                        </button>
                    </div>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
    }

    showLicenseError(errorDetail) {
        console.error('[App] License error:', errorDetail);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #1f2937;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">
                            <i class="fas fa-lock" style="color: #ef4444;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Accès Refusé</h1>
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 30px; border-radius: 20px; margin: 30px 0;">
                            <p style="font-size: 1.2rem; line-height: 1.6;">${errorDetail.message || 'Licence invalide ou expirée'}</p>
                        </div>
                        <button onclick="location.reload()" class="login-button">
                            <i class="fas fa-refresh"></i> Réessayer
                        </button>
                    </div>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
    }

    showConfigurationError(issues) {
        console.error('[App] Configuration error:', issues);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #1f2937;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle" style="color: #fbbf24;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Configuration requise</h1>
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 30px; border-radius: 20px; margin: 30px 0; text-align: left;">
                            <h3 style="color: #fbbf24; margin-bottom: 15px;">Problèmes détectés :</h3>
                            <ul style="margin-left: 20px;">
                                ${issues.map(issue => `<li style="margin: 8px 0;">${issue}</li>`).join('')}
                            </ul>
                        </div>
                        <button onclick="location.reload()" class="login-button">
                            <i class="fas fa-refresh"></i> Actualiser
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.hideModernLoading();
    }

    // =====================================
    // DIAGNOSTIC
    // =====================================
    getDiagnosticInfo() {
        return {
            environment: {
                isNetlify: this.isNetlifyEnv,
                domain: window.location.hostname,
                userAgent: navigator.userAgent.substring(0, 100)
            },
            app: {
                isAuthenticated: this.isAuthenticated,
                activeProvider: this.activeProvider,
                currentPage: this.currentPage,
                isInitialized: !this.isInitializing,
                initAttempts: this.initializationAttempts,
                licenseCheckPassed: this.licenseCheckPassed
            },
            user: this.user ? {
                name: this.user.displayName || this.user.name,
                email: this.user.mail || this.user.email,
                provider: this.user.provider
            } : null,
            license: {
                currentUser: window.currentUser ? {
                    email: window.currentUser.email,
                    role: window.currentUser.role,
                    license_status: window.currentUser.license_status,
                    company: window.currentUser.company?.name
                } : null,
                licenseStatus: window.licenseStatus,
                licenseService: !!window.licenseService,
                licenseServiceReady: !!window.licenseServiceReady,
                isEmergency: window.licenseService?.isEmergency || false,
                fallback: window.licenseService?.isFallback || false
            },
            services: {
                licenseService: window.licenseService ? {
                    available: true,
                    initialized: window.licenseService.initialized,
                    isEmergency: window.licenseService.isEmergency || false,
                    isFallback: window.licenseService.isFallback || false,
                    autoAuthInProgress: window.licenseService.autoAuthInProgress || false
                } : { available: false }
            }
        };
    }

    testCriticalServices() {
        console.group('🧪 Test des services critiques v5.7');
        
        const tests = [];
        
        // Test LicenseService
        try {
            if (window.licenseService && window.licenseService.initialized) {
                const isEmergency = window.licenseService.isEmergency;
                const isFallback = window.licenseService.isFallback;
                
                let status = '✅ OK';
                let details = 'Service initialisé';
                
                if (isEmergency) {
                    status = '🚨 EMERGENCY';
                    details = 'Mode démonstration - Service d\'urgence activé';
                } else if (isFallback) {
                    status = '⚠️ FALLBACK';
                    details = 'Mode simulation - Données temporaires';
                } else {
                    status = '✅ DATABASE';
                    details = 'Mode base de données - Données persistantes';
                }
                
                tests.push({ 
                    service: 'LicenseService', 
                    status: status, 
                    details: details
                });
            } else {
                tests.push({ service: 'LicenseService', status: '❌ ERROR', details: 'Non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'LicenseService', status: '❌ ERROR', details: error.message });
        }
        
        tests.forEach(test => {
            console.log(`${test.status} ${test.service}: ${test.details}`);
        });
        
        console.groupEnd();
        return tests;
    }
}

// =====================================
// FONCTIONS GLOBALES
// =====================================

window.testServices = function() {
    console.log('[Global] Testing services...');
    if (window.app && typeof window.app.testCriticalServices === 'function') {
        return window.app.testCriticalServices();
    } else {
        console.error('[Global] App instance not available for testing');
        return [];
    }
};

window.testLicenseDatabase = function() {
    console.log('[Global] Testing license service...');
    if (window.licenseService && typeof window.licenseService.debug === 'function') {
        return window.licenseService.debug();
    } else {
        console.error('[Global] LicenseService not available');
        return {
            available: false,
            isEmergency: window.licenseService?.isEmergency || false,
            message: 'Service non disponible'
        };
    }
};

// Vérification des services
function checkServicesReady() {
    const requiredServices = ['uiManager'];
    const authServices = ['authService', 'googleAuthService'];
    
    try {
        const missingRequired = requiredServices.filter(service => !window[service]);
        const availableAuthServices = authServices.filter(service => window[service]);
        
        if (missingRequired.length > 0) {
            console.error('[App] Missing REQUIRED services:', missingRequired);
            return false;
        }
        
        if (availableAuthServices.length === 0) {
            console.error('[App] No authentication services available');
            return false;
        }
        
        if (!window.AppConfig) {
            console.error('[App] Missing AppConfig');
            return false;
        }
        
        console.log('[App] Available auth services:', availableAuthServices);
        console.log('[App] License service status:', window.licenseService ? 
            (window.licenseService.isEmergency ? 'emergency' : window.licenseService.isFallback ? 'fallback' : 'database') : 'not available');
        return true;
    } catch (error) {
        console.error('[App] Error checking services:', error);
        return false;
    }
}

// =====================================
// INITIALISATION PRINCIPALE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, waiting for license verification...');
    
    try {
        document.body.classList.add('login-mode');
        
        // CORRECTION 3: Créer l'app mais ne pas l'initialiser immédiatement
        // L'initialisation se fera via l'événement 'userAuthenticated' depuis license-check.js
        window.app = new App();
        
        console.log('[App] App instance created, waiting for license check...');
        
        // CORRECTION 4: Vérifier périodiquement si license-check.js est chargé
        let licenseCheckAttempts = 0;
        const maxLicenseCheckAttempts = 100; // 10 secondes
        
        const waitForLicenseCheck = () => {
            licenseCheckAttempts++;
            
            // Vérifier si license-check.js a été chargé (il expose checkUserLicense globalement)
            if (typeof window.checkUserLicense === 'function') {
                console.log('[App] license-check.js detected, license verification should start automatically');
                return;
            }
            
            if (licenseCheckAttempts >= maxLicenseCheckAttempts) {
                console.error('[App] license-check.js not found after 10 seconds');
                window.app.showError('Système de licence non disponible. Veuillez recharger la page.');
                return;
            }
            
            setTimeout(waitForLicenseCheck, 100);
        };
        
        // Démarrer la vérification
        setTimeout(waitForLicenseCheck, 100);
        
    } catch (domError) {
        console.error('[App] Critical error during DOM initialization:', domError);
        
        // Affichage d'erreur d'urgence
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: system-ui;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 25px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
                    <div style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="color: #1f2937; margin-bottom: 1rem;">Erreur critique</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">Une erreur critique s'est produite lors du chargement de l'application.</p>
                    <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        Recharger la page
                    </button>
                </div>
            </div>
        `;
    }
});

// =====================================
// DIAGNOSTIC GLOBAL
// =====================================
window.diagnoseApp = function() {
    console.group('🔍 DIAGNOSTIC APPLICATION v5.7 - LICENSE INTEGRATION');
    
    try {
        if (window.app) {
            const appDiag = window.app.getDiagnosticInfo();
            
            console.log('🌐 Environment:', appDiag.environment);
            console.log('📱 App Status:', appDiag.app);
            console.log('👤 User:', appDiag.user);
            console.log('🔐 License:', appDiag.license);
            console.log('🛠️ Services:', appDiag.services);
            
            // Test des services critiques
            const serviceTests = window.app.testCriticalServices();
            
            // Vérification spéciale du LicenseService
            if (window.licenseService) {
                console.log('🔐 LicenseService Status:');
                console.log('  - Initialized:', window.licenseService.initialized);
                console.log('  - Emergency Mode:', window.licenseService.isEmergency || false);
                console.log('  - Fallback Mode:', window.licenseService.isFallback || false);
                console.log('  - Auto Auth In Progress:', window.licenseService.autoAuthInProgress || false);
                console.log('  - Current User:', window.licenseService.currentUser?.email || 'None');
                
                if (typeof window.licenseService.debug === 'function') {
                    window.licenseService.debug().then(licenseDebug => {
                        console.log('🔐 License Debug:', licenseDebug);
                    });
                }
            } else {
                console.log('❌ LicenseService not found');
            }
            
            // Vérification des variables globales
            console.log('🌍 Global Variables:');
            console.log('  - window.currentUser:', window.currentUser?.email || 'None');
            console.log('  - window.licenseStatus:', window.licenseStatus || 'None');
            console.log('  - window.licenseServiceReady:', window.licenseServiceReady);
            console.log('  - window.checkUserLicense:', typeof window.checkUserLicense);
            
            return appDiag;
        } else {
            console.log('❌ App instance not available');
            return { error: 'App instance not available' };
        }
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
        return { error: error.message, stack: error.stack };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ App v5.7 loaded - LICENSE INTEGRATION CORRECTED');
console.log('🔧 Fonctions globales: window.diagnoseApp(), window.testServices(), window.testLicenseDatabase()');
console.log('🚨 License Required: App will only initialize after successful license verification');
console.log('⚡ Flow: license-check.js → userAuthenticated event → app initialization');
console.log('🧪 License Integration: Mandatory license check before any app functionality');
