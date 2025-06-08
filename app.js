// app.js - Application CORRIGÉE pour éviter le mode démo forcé v4.2

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.expectedDomain = 'coruscating-dodol-f30e8d.netlify.app';
        
        console.log('[App] Constructor - Application starting on:', this.expectedDomain);
        this.verifyDomain();
    }

    verifyDomain() {
        const currentDomain = window.location.hostname;
        if (currentDomain === this.expectedDomain) {
            console.log('[App] ✅ Running on correct domain:', currentDomain);
        } else {
            console.warn('[App] ⚠️ Domain mismatch - Expected:', this.expectedDomain, 'Current:', currentDomain);
        }
    }

    async init() {
        console.log('[App] Initializing on', this.expectedDomain, '...');
        
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
            if (!this.checkPrerequisites()) {
                return;
            }

            console.log('[App] Initializing auth service for', this.expectedDomain, '...');
            
            const initTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 20000)
            );
            
            const initPromise = window.authService.initialize();
            await Promise.race([initPromise, initTimeout]);
            
            console.log('[App] Auth service initialized for', this.expectedDomain);
            
            // INITIALISER LES MODULES CRITIQUES
            await this.initializeCriticalModules();
            
            // CORRECTION: Vérifier l'authentification SANS forcer le mode démo
            await this.checkAuthenticationStatusFixed();
            
        } catch (error) {
            await this.handleInitializationError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    // CORRECTION: Nouvelle méthode pour vérifier l'authentification sans forcer le démo
    async checkAuthenticationStatusFixed() {
        console.log('[App] 🔍 Checking authentication status (FIXED VERSION)...');
        
        // Vérifier d'abord si AuthService est initialisé
        if (!window.authService || !window.authService.isInitialized) {
            console.warn('[App] AuthService not properly initialized, showing login');
            this.showLogin();
            return;
        }

        // Vérifier l'authentification
        const isAuthenticated = window.authService.isAuthenticated();
        console.log('[App] Authentication check result:', isAuthenticated);

        if (isAuthenticated) {
            const account = window.authService.getAccount();
            console.log('[App] Account found:', account?.username);
            
            if (account) {
                try {
                    console.log('[App] 🔄 Getting user info for authenticated user...');
                    
                    // CORRECTION: Essayer de récupérer les infos utilisateur
                    this.user = await window.authService.getUserInfo();
                    this.isAuthenticated = true;
                    
                    console.log('[App] ✅ User authenticated successfully:', this.user.displayName || this.user.mail);
                    
                    // CORRECTION: Configurer les services pour le mode réel
                    await this.configureServicesForRealMode();
                    
                    // Afficher l'application
                    this.showAppWithTransition();
                    
                } catch (userInfoError) {
                    console.error('[App] ❌ Error getting user info:', userInfoError);
                    
                    // CORRECTION: Ne pas forcer le mode démo en cas d'erreur temporaire
                    if (userInfoError.message.includes('401') || userInfoError.message.includes('403')) {
                        console.log('[App] Token seems invalid, clearing auth and showing login');
                        await window.authService.reset();
                        this.showLogin();
                    } else {
                        console.warn('[App] Temporary error, but user is authenticated - proceeding with limited info');
                        
                        // Utiliser les infos du compte MSAL
                        this.user = {
                            displayName: account.name || account.username,
                            mail: account.username,
                            userPrincipalName: account.username
                        };
                        this.isAuthenticated = true;
                        
                        // Configurer pour le mode réel malgré l'erreur
                        await this.configureServicesForRealMode();
                        this.showAppWithTransition();
                    }
                }
            } else {
                console.log('[App] No active account found despite isAuthenticated=true');
                this.showLogin();
            }
        } else {
            console.log('[App] User not authenticated on', this.expectedDomain);
            this.showLogin();
        }
    }

    // NOUVELLE MÉTHODE: Configuration des services pour le mode réel
    async configureServicesForRealMode() {
        console.log('[App] 🔧 Configuring services for REAL mode...');
        
        try {
            // 1. Configurer MailService pour le mode réel
            if (window.mailService) {
                if (typeof window.mailService.enableRealMode === 'function') {
                    window.mailService.enableRealMode();
                    console.log('[App] ✅ MailService configured for real mode');
                }
                
                // Vérifier le statut d'authentification du MailService
                if (typeof window.mailService.checkAuthenticationStatus === 'function') {
                    const mailAuthStatus = await window.mailService.checkAuthenticationStatus();
                    console.log('[App] MailService auth status:', mailAuthStatus);
                }
            }
            
            // 2. Configurer le scanner pour les emails réels
            if (window.minimalScanModule) {
                if (window.minimalScanModule.forceRealEmails !== undefined) {
                    window.minimalScanModule.forceRealEmails = true;
                    console.log('[App] ✅ Scanner configured for real emails');
                }
            }
            
            // 3. Vider les caches de démo s'ils existent
            try {
                localStorage.removeItem('emailsort_demo_emails');
                localStorage.removeItem('emailsort_demo_mode');
                console.log('[App] ✅ Demo caches cleared');
            } catch (error) {
                console.warn('[App] Could not clear demo caches:', error);
            }
            
            // 4. Définir des variables globales pour indiquer le mode réel
            window.APP_REAL_MODE = true;
            window.APP_DEMO_MODE = false;
            
            console.log('[App] ✅ All services configured for REAL mode');
            
        } catch (error) {
            console.error('[App] ❌ Error configuring services for real mode:', error);
        }
    }

    // =====================================
    // INITIALISATION DES MODULES CRITIQUES - INCHANGÉE
    // =====================================
    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules for', this.expectedDomain, '...');
        
        // 1. Vérifier TaskManager
        await this.ensureTaskManagerReady();
        
        // 2. Vérifier PageManager
        await this.ensurePageManagerReady();
        
        // 3. Vérifier TasksView
        await this.ensureTasksViewReady();
        
        // 4. Vérifier EmailScanner
        await this.ensureEmailScannerReady();
        
        // 5. Bind methods
        this.bindModuleMethods();
        
        console.log('[App] Critical modules initialized for', this.expectedDomain);
    }

    async ensureTaskManagerReady() {
        console.log('[App] Ensuring TaskManager is ready...');
        
        if (window.taskManager && window.taskManager.initialized) {
            console.log('[App] ✅ TaskManager already ready');
            return true;
        }
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while ((!window.taskManager || !window.taskManager.initialized) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.taskManager || !window.taskManager.initialized) {
            console.error('[App] TaskManager not ready after 5 seconds');
            return false;
        }
        
        const essentialMethods = ['createTaskFromEmail', 'createTask', 'updateTask', 'deleteTask', 'getStats'];
        for (const method of essentialMethods) {
            if (typeof window.taskManager[method] !== 'function') {
                console.error(`[App] TaskManager missing essential method: ${method}`);
                return false;
            }
        }
        
        console.log('[App] ✅ TaskManager ready with', window.taskManager.getAllTasks().length, 'tasks');
        return true;
    }

    async ensurePageManagerReady() {
        console.log('[App] Ensuring PageManager is ready...');
        
        if (window.pageManager) {
            console.log('[App] ✅ PageManager already ready');
            return true;
        }
        
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!window.pageManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.pageManager) {
            console.error('[App] PageManager not ready after 3 seconds');
            return false;
        }
        
        console.log('[App] ✅ PageManager ready');
        return true;
    }

    async ensureTasksViewReady() {
        console.log('[App] Ensuring TasksView is ready...');
        
        if (window.tasksView) {
            console.log('[App] ✅ TasksView already ready');
            return true;
        }
        
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!window.tasksView && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.tasksView) {
            console.warn('[App] TasksView not ready after 3 seconds - will work without it');
            return false;
        }
        
        console.log('[App] ✅ TasksView ready');
        return true;
    }

    async ensureEmailScannerReady() {
        console.log('[App] Ensuring EmailScanner is ready...');
        
        if (!window.emailScanner) {
            console.log('[App] 🔧 Creating EmailScanner instance...');
            window.emailScanner = {
                emails: [],
                mode: 'real', // CORRECTION: Mode réel par défaut
                getAllEmails: function() {
                    console.log(`[EmailScanner] Returning ${this.emails.length} emails (mode: ${this.mode})`);
                    return this.emails || [];
                },
                setEmails: function(emails) {
                    if (Array.isArray(emails)) {
                        this.emails = emails;
                        this.mode = emails.some(e => e.isDemo) ? 'demo' : 'real';
                        console.log(`[EmailScanner] ✅ ${emails.length} emails stored (mode: ${this.mode})`);
                    } else {
                        console.warn('[EmailScanner] Invalid emails array provided');
                        this.emails = [];
                    }
                },
                scan: async function(options = {}) {
                    console.log('[EmailScanner] Scan requested with options:', options);
                    // Déléguer au MailService pour un scan réel
                    if (window.mailService && typeof window.mailService.scanEmailsForCategories === 'function') {
                        return await window.mailService.scanEmailsForCategories(options);
                    }
                    return {
                        success: true,
                        total: this.emails.length,
                        processed: this.emails.length,
                        mode: this.mode
                    };
                },
                getMode: function() {
                    return this.mode;
                },
                setRealMode: function() {
                    this.mode = 'real';
                    console.log('[EmailScanner] ✅ Switched to real mode');
                }
            };
            console.log('[App] ✅ EmailScanner created successfully (real mode)');
        } else {
            console.log('[App] ✅ EmailScanner already exists');
            // S'assurer qu'il est en mode réel
            if (typeof window.emailScanner.setRealMode === 'function') {
                window.emailScanner.setRealMode();
            }
        }
        
        const essentialMethods = ['getAllEmails', 'setEmails'];
        for (const method of essentialMethods) {
            if (typeof window.emailScanner[method] !== 'function') {
                console.error(`[App] EmailScanner missing essential method: ${method}`);
                return false;
            }
        }
        
        console.log('[App] ✅ EmailScanner ready');
        return true;
    }

    bindModuleMethods() {
        // Bind TaskManager methods
        if (window.taskManager) {
            try {
                Object.getOwnPropertyNames(Object.getPrototypeOf(window.taskManager)).forEach(name => {
                    if (name !== 'constructor' && typeof window.taskManager[name] === 'function') {
                        window.taskManager[name] = window.taskManager[name].bind(window.taskManager);
                    }
                });
                console.log('[App] ✅ TaskManager methods bound');
            } catch (error) {
                console.warn('[App] Error binding TaskManager methods:', error);
            }
        }
        
        // Bind PageManager methods
        if (window.pageManager) {
            try {
                Object.getOwnPropertyNames(Object.getPrototypeOf(window.pageManager)).forEach(name => {
                    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
                        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
                    }
                });
                console.log('[App] ✅ PageManager methods bound');
            } catch (error) {
                console.warn('[App] Error binding PageManager methods:', error);
            }
        }
        
        // Bind TasksView methods
        if (window.tasksView) {
            try {
                Object.getOwnPropertyNames(Object.getPrototypeOf(window.tasksView)).forEach(name => {
                    if (name !== 'constructor' && typeof window.tasksView[name] === 'function') {
                        window.tasksView[name] = window.tasksView[name].bind(window.tasksView);
                    }
                });
                console.log('[App] ✅ TasksView methods bound');
            } catch (error) {
                console.warn('[App] Error binding TasksView methods:', error);
            }
        }
        
        // Bind EmailScanner methods si c'est un objet avec prototype
        if (window.emailScanner && Object.getPrototypeOf(window.emailScanner) !== Object.prototype) {
            try {
                Object.getOwnPropertyNames(Object.getPrototypeOf(window.emailScanner)).forEach(name => {
                    if (name !== 'constructor' && typeof window.emailScanner[name] === 'function') {
                        window.emailScanner[name] = window.emailScanner[name].bind(window.emailScanner);
                    }
                });
                console.log('[App] ✅ EmailScanner methods bound');
            } catch (error) {
                console.warn('[App] Error binding EmailScanner methods:', error);
            }
        }
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

        if (!window.authService) {
            console.error('[App] AuthService not available');
            this.showError('Authentication service not available. Please refresh the page.');
            return false;
        }

        return true;
    }

    // MÉTHODE ORIGINALE CONSERVÉE POUR COMPATIBILITÉ (mais non utilisée)
    async checkAuthenticationStatus() {
        console.log('[App] 🚨 OLD checkAuthenticationStatus called - redirecting to FIXED version');
        return this.checkAuthenticationStatusFixed();
    }

    async handleInitializationError(error) {
        console.error('[App] Initialization error on', this.expectedDomain, ':', error);
        
        if (error.message.includes('unauthorized_client')) {
            this.showConfigurationError([
                'Configuration Azure incorrecte pour ' + this.expectedDomain,
                'Vérifiez votre Client ID dans la configuration',
                'Consultez la documentation Azure App Registration'
            ]);
            return;
        }
        
        if (error.message.includes('Configuration invalid')) {
            this.showConfigurationError(['Configuration invalide pour ' + this.expectedDomain + ' - vérifiez la configuration']);
            return;
        }
        
        if (this.initializationAttempts < this.maxInitAttempts && 
            (error.message.includes('timeout') || error.message.includes('network'))) {
            console.log(`[App] Retrying initialization on ${this.expectedDomain} (${this.initializationAttempts}/${this.maxInitAttempts})...`);
            this.isInitializing = false;
            this.initializationPromise = null;
            setTimeout(() => this.init(), 3000);
            return;
        }
        
        this.showError('Failed to initialize the application on ' + this.expectedDomain + '. Please check the configuration and refresh the page.');
    }

    showConfigurationError(issues) {
        console.error('[App] Configuration error on', this.expectedDomain, ':', issues);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="hero-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: white;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 2s infinite;">
                            <i class="fas fa-exclamation-triangle" style="color: #fbbf24;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Configuration requise</h1>
                        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); padding: 30px; border-radius: 20px; margin: 30px 0; text-align: left;">
                            <h3 style="color: #fbbf24; margin-bottom: 15px;">Problèmes détectés pour ${this.expectedDomain} :</h3>
                            <ul style="margin-left: 20px;">
                                ${issues.map(issue => `<li style="margin: 8px 0;">${issue}</li>`).join('')}
                            </ul>
                            <div style="margin-top: 20px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                                <h4 style="margin-bottom: 10px;">Pour résoudre :</h4>
                                <ol style="margin-left: 20px;">
                                    <li>Cliquez sur "Configurer l'application"</li>
                                    <li>Suivez l'assistant de configuration</li>
                                    <li>Entrez votre Azure Client ID</li>
                                    <li>Configurez l'URI: https://${this.expectedDomain}/auth-callback.html</li>
                                </ol>
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="setup.html" class="cta-button" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white;">
                                <i class="fas fa-cog"></i>
                                Configurer l'application
                            </a>
                            <button onclick="location.reload()" class="cta-button" style="background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3);">
                                <i class="fas fa-refresh"></i>
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.hideModernLoading();
    }

    setupEventListeners() {
        console.log('[App] Setting up event listeners for', this.expectedDomain, '...');
        
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            newLoginBtn.addEventListener('click', () => this.login());
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page && window.pageManager) {
                    window.pageManager.loadPage(page);
                }
            });
        });

        window.addEventListener('error', (event) => {
            console.error('[App] Global error on', this.expectedDomain, ':', event.error);
            
            if (event.error && event.error.message && 
                event.error.message.includes('ScanStart.js') && 
                event.error.message.includes('Unexpected token')) {
                console.warn('[App] ScanStart.js syntax error detected - handled inline');
                return;
            }
            
            if (event.error && event.error.message) {
                const message = event.error.message;
                if (message.includes('unauthorized_client')) {
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            'Erreur de configuration Azure pour ' + this.expectedDomain + '. Vérifiez votre Client ID.',
                            'error',
                            10000
                        );
                    }
                }
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled promise rejection on', this.expectedDomain, ':', event.reason);
            
            if (event.reason && event.reason.message && 
                event.reason.message.includes('Cannot read properties of undefined')) {
                
                if (event.reason.message.includes('createTaskFromEmail')) {
                    console.error('[App] TaskManager createTaskFromEmail error detected');
                    
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            'Erreur du gestionnaire de tâches. Veuillez actualiser la page.',
                            'warning'
                        );
                    }
                }
            }
            
            if (event.reason && event.reason.errorCode) {
                console.log('[App] MSAL promise rejection:', event.reason.errorCode);
            }
        });
    }

    async login() {
        console.log('[App] Login attempted on', this.expectedDomain, '...');
        
        try {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion en cours...';
            }
            
            this.showModernLoading('Connexion à Outlook...');
            
            if (!window.authService.isInitialized) {
                console.log('[App] AuthService not initialized, initializing...');
                await window.authService.initialize();
            }
            
            await window.authService.login();
            
        } catch (error) {
            console.error('[App] Login error on', this.expectedDomain, ':', error);
            
            this.hideModernLoading();
            
            let errorMessage = 'Échec de la connexion sur ' + this.expectedDomain + '. Veuillez réessayer.';
            
            if (error.errorCode) {
                const errorCode = error.errorCode;
                if (window.AppConfig.errors && window.AppConfig.errors[errorCode]) {
                    errorMessage = window.AppConfig.errors[errorCode];
                } else {
                    switch (errorCode) {
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
                            errorMessage = 'Configuration incorrecte pour ' + this.expectedDomain + '. Vérifiez votre Azure Client ID.';
                            break;
                        default:
                            errorMessage = `Erreur: ${errorCode}`;
                    }
                }
            } else if (error.message.includes('unauthorized_client')) {
                errorMessage = 'Configuration Azure incorrecte pour ' + this.expectedDomain + '. Vérifiez votre Client ID.';
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(errorMessage, 'error', 8000);
            }
            
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fab fa-microsoft"></i> Se connecter à Outlook';
            }
        }
    }

    async logout() {
        console.log('[App] Logout attempted on', this.expectedDomain, '...');
        
        try {
            const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
            if (!confirmed) return;
            
            this.showModernLoading('Déconnexion...');
            
            if (window.authService) {
                await window.authService.logout();
            } else {
                this.forceCleanup();
            }
            
        } catch (error) {
            console.error('[App] Logout error on', this.expectedDomain, ':', error);
            this.hideModernLoading();
            if (window.uiManager) {
                window.uiManager.showToast('Erreur de déconnexion. Nettoyage forcé...', 'warning');
            }
            this.forceCleanup();
        }
    }

    forceCleanup() {
        console.log('[App] Force cleanup on', this.expectedDomain, '...');
        
        this.user = null;
        this.isAuthenticated = false;
        this.isInitializing = false;
        this.initializationPromise = null;
        
        if (window.authService) {
            window.authService.forceCleanup();
        }
        
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

    showLogin() {
        console.log('[App] Showing login page on', this.expectedDomain);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        
        document.body.classList.remove('app-active');
        
        this.hideModernLoading();
        
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(null);
        }
    }

    showAppWithTransition() {
        console.log('[App] 🎯 Showing application with transition (REAL MODE)');
        
        this.hideModernLoading();
        
        // Définir des variables globales pour confirmer le mode réel
        window.APP_REAL_MODE = true;
        window.APP_DEMO_MODE = false;
        window.APP_AUTHENTICATED_USER = this.user;
        
        // Activer le mode app
        document.body.classList.add('app-active');
        console.log('[App] ✅ App mode activated (REAL MODE) on', this.expectedDomain);
        
        // Afficher les éléments
        const loginPage = document.getElementById('loginPage');
        const appHeader = document.querySelector('.app-header');
        const appNav = document.querySelector('.app-nav');
        const pageContent = document.getElementById('pageContent');
        
        if (loginPage) {
            loginPage.style.display = 'none';
            console.log('[App] Login page hidden');
        }
        
        if (appHeader) {
            appHeader.style.display = 'block';
            appHeader.style.opacity = '1';
            appHeader.style.visibility = 'visible';
            console.log('[App] Header displayed');
        }
        
        if (appNav) {
            appNav.style.display = 'block';
            appNav.style.opacity = '1';
            appNav.style.visibility = 'visible';
            console.log('[App] Navigation displayed');
        }
        
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
            pageContent.style.visibility = 'visible';
            console.log('[App] Page content displayed');
        }
        
        // Mettre à jour l'interface utilisateur
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Charger le dashboard
        if (window.pageManager) {
            setTimeout(() => {
                window.pageManager.loadPage('dashboard');
                console.log('[App] Dashboard loading requested');
            }, 100);
        } else {
            console.warn('[App] PageManager not available');
        }
        
        // Forcer l'affichage avec CSS
        this.forceAppDisplay();
        
        console.log('[App] ✅ Application fully displayed in REAL MODE on', this.expectedDomain);
        console.log('[App] 👤 Authenticated user:', this.user?.displayName || this.user?.mail);
    }

    forceAppDisplay() {
        const forceDisplayStyle = document.createElement('style');
        forceDisplayStyle.id = 'force-app-display';
        forceDisplayStyle.textContent = `
            body.app-active #loginPage {
                display: none !important;
            }
            body.app-active .app-header {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            body.app-active .app-nav {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            body.app-active #pageContent {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        
        const oldStyle = document.getElementById('force-app-display');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        document.head.appendChild(forceDisplayStyle);
        console.log('[App] Force display CSS injected');
    }

    showModernLoading(message = 'Chargement...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.login-loading-text');
            if (loadingText) {
                loadingText.innerHTML = `
                    <div>${message}</div>
                    <div style="font-size: 14px; opacity: 0.8; margin-top: 10px;">Authentification en cours sur ${this.expectedDomain}</div>
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
            document.body.style.overflow = 'auto';
        }
    }

    showError(message) {
        console.error('[App] Showing error on', this.expectedDomain, ':', message);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="hero-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: white;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 2s infinite;">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Erreur d'application</h1>
                        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); padding: 30px; border-radius: 20px; margin: 30px 0;">
                            <p style="font-size: 1.2rem; line-height: 1.6;">${message}</p>
                            <p style="font-size: 1rem; opacity: 0.8; margin-top: 15px;">Domaine: ${this.expectedDomain}</p>
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="location.reload()" class="cta-button">
                                <i class="fas fa-refresh"></i>
                                Actualiser la page
                            </button>
                            <button onclick="window.app.forceCleanup()" class="cta-button" style="background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3);">
                                <i class="fas fa-undo"></i>
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
    }

    checkScanStartModule() {
        console.log('[App] Checking ScanStart module...');
        
        if (!window.scanStartModule) {
            console.warn('[App] ScanStart module not available');
            return {
                available: false,
                error: 'Module not loaded'
            };
        }
        
        if (typeof window.scanStartModule.render !== 'function') {
            console.warn('[App] ScanStart module incomplete');
            return {
                available: false,
                error: 'Module incomplete - missing render method'
            };
        }
        
        console.log('[App] ScanStart module OK');
        return {
            available: true,
            methods: Object.keys(window.scanStartModule)
        };
    }

    // NOUVELLE MÉTHODE: Diagnostic du mode de l'application
    getAppStatus() {
        return {
            domain: this.expectedDomain,
            isAuthenticated: this.isAuthenticated,
            user: this.user,
            realMode: window.APP_REAL_MODE || false,
            demoMode: window.APP_DEMO_MODE || false,
            mailServiceMode: window.mailService?.getStatus?.() || 'unknown',
            scannerMode: window.minimalScanModule?.getStatus?.() || 'unknown',
            emailScannerMode: window.emailScanner?.getMode?.() || 'unknown',
            initializationComplete: !this.isInitializing,
            timestamp: new Date().toISOString()
        };
    }
}

// =====================================
// FONCTIONS GLOBALES D'URGENCE
// =====================================

// Fonction globale pour le reset d'urgence
window.emergencyReset = function() {
    console.log('[App] Emergency reset triggered on coruscating-dodol-f30e8d.netlify.app');
    
    const keysToKeep = ['emailsort_categories', 'emailsort_tasks', 'emailsortpro_client_id'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('[Emergency] Error removing key:', key);
            }
        }
    });
    
    window.location.reload();
};

// Fonction pour forcer l'affichage
window.forceShowApp = function() {
    console.log('[Global] Force show app triggered on coruscating-dodol-f30e8d.netlify.app');
    if (window.app && typeof window.app.showAppWithTransition === 'function') {
        window.app.showAppWithTransition();
    } else {
        document.body.classList.add('app-active');
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'none';
    }
};

// NOUVELLE FONCTION: Forcer le mode réel
window.forceRealMode = function() {
    console.log('[Global] 🔧 Forcing REAL mode for all services...');
    
    // Forcer le mode réel dans tous les services
    if (window.mailService && typeof window.mailService.enableRealMode === 'function') {
        window.mailService.enableRealMode();
        console.log('[Global] ✅ MailService forced to real mode');
    }
    
    if (window.minimalScanModule) {
        window.minimalScanModule.forceRealEmails = true;
        console.log('[Global] ✅ Scanner forced to real mode');
    }
    
    if (window.emailScanner && typeof window.emailScanner.setRealMode === 'function') {
        window.emailScanner.setRealMode();
        console.log('[Global] ✅ EmailScanner forced to real mode');
    }
    
    // Définir les variables globales
    window.APP_REAL_MODE = true;
    window.APP_DEMO_MODE = false;
    
    // Vider les caches de démo
    try {
        localStorage.removeItem('emailsort_demo_emails');
        localStorage.removeItem('emailsort_demo_mode');
        console.log('[Global] ✅ Demo caches cleared');
    } catch (error) {
        console.warn('[Global] Could not clear demo caches:', error);
    }
    
    console.log('[Global] ✅ REAL mode forced for all services');
    
    // Retourner le statut
    if (window.app && typeof window.app.getAppStatus === 'function') {
        return window.app.getAppStatus();
    }
};

// =====================================
// VÉRIFICATION DES SERVICES
// =====================================
function checkServicesReady() {
    const requiredServices = ['authService', 'uiManager'];
    const optionalServices = ['mailService', 'categoryManager'];
    
    const missingRequired = requiredServices.filter(service => !window[service]);
    const missingOptional = optionalServices.filter(service => !window[service]);
    
    if (missingRequired.length > 0) {
        console.error('[App] Missing REQUIRED services:', missingRequired);
        return false;
    }
    
    if (missingOptional.length > 0) {
        console.warn('[App] Missing optional services:', missingOptional);
    }
    
    if (!window.AppConfig) {
        console.error('[App] Missing AppConfig');
        return false;
    }
    
    return true;
}

// =====================================
// INITIALISATION PRINCIPALE
// =====================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, creating app instance for coruscating-dodol-f30e8d.netlify.app...');
    
    window.app = new App();
    
    const waitForServices = (attempts = 0) => {
        const maxAttempts = 50;
        
        if (checkServicesReady()) {
            console.log('[App] All required services ready, initializing on coruscating-dodol-f30e8d.netlify.app...');
            
            const scanStartStatus = window.app.checkScanStartModule();
            console.log('[App] ScanStart status:', scanStartStatus);
            
            setTimeout(() => {
                window.app.init();
            }, 100);
        } else if (attempts < maxAttempts) {
            console.log(`[App] Waiting for services... (${attempts + 1}/${maxAttempts})`);
            setTimeout(() => waitForServices(attempts + 1), 100);
        } else {
            console.error('[App] Timeout waiting for services, initializing anyway...');
            setTimeout(() => {
                window.app.init();
            }, 100);
        }
    };
    
    waitForServices();
});

// Fallback si l'initialisation échoue
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.app) {
            console.error('[App] App instance not created, creating fallback...');
            window.app = new App();
            window.app.init();
        } else if (!window.app.isAuthenticated && !window.app.isInitializing) {
            console.log('[App] Fallback initialization check...');
            
            const loginPage = document.getElementById('loginPage');
            if (loginPage && loginPage.style.display === 'none') {
                loginPage.style.display = 'flex';
            }
        }
    }, 5000);
});

// Fonction de diagnostic globale
window.diagnoseApp = function() {
    console.group('🔍 DIAGNOSTIC APP v4.2 - REAL MODE FIXED');
    try {
        if (window.app && typeof window.app.getAppStatus === 'function') {
            const status = window.app.getAppStatus();
            console.log('📊 App Status:', status);
            
            if (status.realMode) {
                console.log('✅ Application in REAL mode');
            } else if (status.demoMode) {
                console.warn('⚠️ Application in DEMO mode');
            } else {
                console.log('❓ Mode unknown');
            }
            
            return status;
        } else {
            console.error('❌ App instance not available');
            return { error: 'App not available' };
        }
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ App loaded - FIXED VERSION v4.2 - No more forced demo mode');
console.log('🎯 Use forceRealMode() to ensure real email access');
console.log('🔍 Use diagnoseApp() for detailed status information');
