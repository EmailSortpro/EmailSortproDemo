// app.js - Application CORRIGÉE avec initialisation garantie v6.0

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.servicesReady = false;
        
        console.log('[App] Constructor v6.0 - Application starting...');
        console.log('[App] Current domain:', window.location.hostname);
    }

    async init() {
        console.log('[App] Initializing...');
        
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
            console.log('[App] Starting initialization attempt', this.initializationAttempts);
            
            // Étape 1: Vérifier les prérequis
            if (!this.checkPrerequisites()) {
                throw new Error('Prerequisites check failed');
            }
            
            // Étape 2: Attendre que tous les services soient prêts
            await this.waitForServices();
            
            // Étape 3: Initialiser les modules critiques
            await this.initializeCriticalModules();
            
            // Étape 4: Initialiser AuthService
            console.log('[App] Initializing auth service...');
            
            const initTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth initialization timeout')), 30000)
            );
            
            const initPromise = window.authService.initialize();
            await Promise.race([initPromise, initTimeout]);
            
            console.log('[App] ✅ Auth service initialized');
            
            // Étape 5: Vérifier le statut d'authentification
            await this.checkAuthenticationStatus();
            
            console.log('[App] ✅ Initialization completed successfully');
            
        } catch (error) {
            await this.handleInitializationError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    checkPrerequisites() {
        console.log('[App] Checking prerequisites...');
        
        // Vérifier MSAL
        if (typeof msal === 'undefined') {
            console.error('[App] MSAL library not loaded');
            this.showError('MSAL library not loaded. Please refresh the page.');
            return false;
        }
        
        // Vérifier AppConfig
        if (!window.AppConfig) {
            console.error('[App] AppConfig not loaded');
            this.showError('Configuration not loaded. Please refresh the page.');
            return false;
        }
        
        if (window.AppConfig.error) {
            console.error('[App] AppConfig has errors:', window.AppConfig.error);
            this.showConfigurationError([window.AppConfig.message || 'Configuration error']);
            return false;
        }
        
        // Valider la configuration
        const validation = window.AppConfig.validate();
        if (!validation.valid) {
            console.error('[App] Configuration validation failed:', validation.issues);
            this.showConfigurationError(validation.issues);
            return false;
        }
        
        // Vérifier AuthService
        if (!window.authService) {
            console.error('[App] AuthService not available');
            this.showError('Authentication service not available. Please refresh the page.');
            return false;
        }
        
        console.log('[App] ✅ Prerequisites check passed');
        return true;
    }

    async waitForServices() {
        console.log('[App] Waiting for services...');
        
        const requiredServices = ['authService'];
        const optionalServices = ['uiManager', 'mailService', 'taskManager', 'pageManager'];
        
        // Attendre les services requis
        for (const service of requiredServices) {
            await this.waitForService(service, true);
        }
        
        // Vérifier les services optionnels
        for (const service of optionalServices) {
            await this.waitForService(service, false);
        }
        
        this.servicesReady = true;
        console.log('[App] ✅ Services check completed');
    }

    async waitForService(serviceName, required = false) {
        const maxAttempts = required ? 100 : 30; // 10s pour requis, 3s pour optionnel
        let attempts = 0;
        
        while (!window[serviceName] && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window[serviceName]) {
            console.log(`[App] ✅ ${serviceName} ready`);
        } else if (required) {
            console.error(`[App] ❌ Required service ${serviceName} not available`);
            throw new Error(`Required service ${serviceName} not available`);
        } else {
            console.warn(`[App] ⚠️ Optional service ${serviceName} not available`);
        }
    }

    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules...');
        
        // Créer UIManager si manquant
        if (!window.uiManager) {
            console.log('[App] Creating UIManager...');
            window.uiManager = this.createBasicUIManager();
        }
        
        // Initialiser TaskManager si disponible
        if (window.taskManager && typeof window.taskManager.initialize === 'function') {
            try {
                await window.taskManager.initialize();
                console.log('[App] ✅ TaskManager initialized');
            } catch (error) {
                console.warn('[App] TaskManager initialization failed:', error);
            }
        }
        
        // Initialiser PageManager si disponible
        if (window.pageManager && typeof window.pageManager.initialize === 'function') {
            try {
                await window.pageManager.initialize();
                console.log('[App] ✅ PageManager initialized');
            } catch (error) {
                console.warn('[App] PageManager initialization failed:', error);
            }
        }
        
        // Bind methods pour éviter les erreurs de contexte
        this.bindModuleMethods();
        
        console.log('[App] ✅ Critical modules initialized');
    }

    createBasicUIManager() {
        return {
            showToast: function(message, type = 'info', duration = 5000) {
                console.log(`[UIManager] ${type.toUpperCase()}: ${message}`);
                
                // Créer un toast simple
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#10b981'};
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    z-index: 10000;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: system-ui, sans-serif;
                    font-size: 14px;
                `;
                toast.textContent = message;
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, duration);
            },
            
            updateAuthStatus: function(user) {
                const authStatus = document.getElementById('authStatus');
                if (authStatus) {
                    if (user) {
                        authStatus.innerHTML = `
                            <span style="color: #10b981;">
                                <i class="fas fa-user-circle"></i> 
                                ${user.displayName || user.mail || 'Utilisateur'}
                            </span>
                            <button onclick="window.app.logout()" style="margin-left: 10px; background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                Déconnexion
                            </button>
                        `;
                    } else {
                        authStatus.innerHTML = '<span class="text-muted">Non connecté</span>';
                    }
                }
            }
        };
    }

    bindModuleMethods() {
        const modules = ['taskManager', 'pageManager', 'uiManager', 'mailService', 'categoryManager'];
        
        modules.forEach(moduleName => {
            if (window[moduleName] && typeof window[moduleName] === 'object') {
                try {
                    Object.getOwnPropertyNames(Object.getPrototypeOf(window[moduleName])).forEach(name => {
                        if (name !== 'constructor' && typeof window[moduleName][name] === 'function') {
                            window[moduleName][name] = window[moduleName][name].bind(window[moduleName]);
                        }
                    });
                    console.log(`[App] ✅ ${moduleName} methods bound`);
                } catch (error) {
                    console.warn(`[App] Error binding ${moduleName} methods:`, error);
                }
            }
        });
    }

    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        if (window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account) {
                console.log('[App] User is authenticated, getting user info...');
                try {
                    this.user = await window.authService.getUserInfo();
                    this.isAuthenticated = true;
                    console.log('[App] ✅ User authenticated:', this.user.displayName || this.user.mail);
                    this.showAppWithTransition();
                } catch (userInfoError) {
                    console.error('[App] Error getting user info:', userInfoError);
                    if (userInfoError.message.includes('401') || userInfoError.message.includes('403')) {
                        console.log('[App] Token invalid, clearing auth and showing login');
                        await window.authService.reset();
                        this.showLogin();
                    } else {
                        this.showLogin();
                    }
                }
            } else {
                console.log('[App] No active account found');
                this.showLogin();
            }
        } else {
            console.log('[App] User not authenticated');
            this.showLogin();
        }
    }

    async handleInitializationError(error) {
        console.error('[App] Initialization error:', error);
        
        if (error.message.includes('unauthorized_client')) {
            this.showConfigurationError([
                'Configuration Azure incorrecte',
                'Vérifiez votre Client ID dans la configuration',
                'Consultez la documentation Azure App Registration'
            ]);
            return;
        }
        
        if (error.message.includes('Configuration not loaded') || error.message.includes('Prerequisites check failed')) {
            this.showConfigurationError(['Configuration invalide ou manquante']);
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
        
        this.showError('Échec de l\'initialisation de l\'application. Veuillez vérifier la configuration et actualiser la page.');
    }

    showConfigurationError(issues) {
        console.error('[App] Configuration error:', issues);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="font-size: 4rem; margin-bottom: 20px; color: #fbbf24;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: white;">Configuration requise</h1>
                    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); padding: 30px; border-radius: 20px; margin: 30px 0; text-align: left; color: white;">
                        <h3 style="color: #fbbf24; margin-bottom: 15px; text-align: center;">Problèmes détectés :</h3>
                        <ul style="margin-left: 20px; text-align: left;">
                            ${issues.map(issue => `<li style="margin: 8px 0;">${issue}</li>`).join('')}
                        </ul>
                        <div style="margin-top: 20px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
                            <h4 style="margin-bottom: 10px;">Pour résoudre :</h4>
                            <ol style="margin-left: 20px; text-align: left;">
                                <li>Cliquez sur "Configurer l'application"</li>
                                <li>Suivez l'assistant de configuration</li>
                                <li>Entrez votre Azure Client ID</li>
                            </ol>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <a href="setup.html" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-cog"></i>
                            Configurer l'application
                        </a>
                        <button onclick="location.reload()" style="background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-refresh"></i>
                            Actualiser
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.hideModernLoading();
    }

    setupEventListeners() {
        console.log('[App] Setting up event listeners...');
        
        // Bouton de connexion
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            newLoginBtn.addEventListener('click', () => this.login());
        }

        // Navigation
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

        // Gestionnaires d'erreurs globaux
        window.addEventListener('error', (event) => {
            console.error('[App] Global error:', event.error);
            
            if (event.error && event.error.message) {
                const message = event.error.message;
                if (message.includes('unauthorized_client')) {
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            'Erreur de configuration Azure. Vérifiez votre Client ID.',
                            'error',
                            10000
                        );
                    }
                }
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled promise rejection:', event.reason);
            
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
        });
    }

    async login() {
        console.log('[App] Login attempted...');
        
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
            console.error('[App] Login error:', error);
            
            this.hideModernLoading();
            
            let errorMessage = 'Échec de la connexion. Veuillez réessayer.';
            
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
                            errorMessage = 'Configuration incorrecte. Vérifiez votre Azure Client ID.';
                            break;
                        default:
                            errorMessage = `Erreur: ${errorCode}`;
                    }
                }
            } else if (error.message.includes('unauthorized_client')) {
                errorMessage = 'Configuration Azure incorrecte. Vérifiez votre Client ID.';
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
        console.log('[App] Logout attempted...');
        
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
            console.error('[App] Logout error:', error);
            this.hideModernLoading();
            if (window.uiManager) {
                window.uiManager.showToast('Erreur de déconnexion. Nettoyage forcé...', 'warning');
            }
            this.forceCleanup();
        }
    }

    forceCleanup() {
        console.log('[App] Force cleanup...');
        
        this.user = null;
        this.isAuthenticated = false;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.servicesReady = false;
        
        if (window.authService) {
            window.authService.forceCleanup();
        }
        
        // Conserver uniquement les données essentielles
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
        console.log('[App] Showing login page');
        
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
        console.log('[App] Showing application with transition');
        
        this.hideModernLoading();
        
        // Activer le mode app
        document.body.classList.add('app-active');
        console.log('[App] App mode activated');
        
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
        
        console.log('[App] ✅ Application fully displayed');
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
            document.body.style.overflow = 'auto';
        }
    }

    showError(message) {
        console.error('[App] Showing error:', message);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="font-size: 4rem; margin-bottom: 20px; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: white;">Erreur d'application</h1>
                    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); padding: 30px; border-radius: 20px; margin: 30px 0; color: white;">
                        <p style="font-size: 1.2rem; line-height: 1.6;">${message}</p>
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="location.reload()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 50px; border: none; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-refresh"></i>
                            Actualiser la page
                        </button>
                        <button onclick="window.app.forceCleanup()" style="background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-undo"></i>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
    }

    getDiagnosticInfo() {
        return {
            isAuthenticated: this.isAuthenticated,
            hasUser: !!this.user,
            userName: this.user?.displayName || this.user?.mail,
            isInitializing: this.isInitializing,
            servicesReady: this.servicesReady,
            initializationAttempts: this.initializationAttempts,
            domain: window.location.hostname,
            appConfigValid: window.AppConfig ? window.AppConfig.validate().valid : false,
            authServiceReady: window.authService ? window.authService.isInitialized : false,
            services: {
                authService: !!window.authService,
                uiManager: !!window.uiManager,
                mailService: !!window.mailService,
                taskManager: !!window.taskManager,
                pageManager: !!window.pageManager
            },
            timestamp: new Date().toISOString()
        };
    }
}

// =====================================
// FONCTIONS GLOBALES D'URGENCE
// =====================================

window.emergencyReset = function() {
    console.log('[App] Emergency reset triggered');
    
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

window.forceShowApp = function() {
    console.log('[Global] Force show app triggered');
    if (window.app && typeof window.app.showAppWithTransition === 'function') {
        window.app.showAppWithTransition();
    } else {
        document.body.classList.add('app-active');
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'none';
    }
};

window.checkAppStatus = function() {
    console.log('=== APP STATUS v6.0 ===');
    
    if (window.app) {
        const diagnostic = window.app.getDiagnosticInfo();
        console.log('App diagnostic:', diagnostic);
        
        if (window.authService) {
            const authDiag = window.authService.getDiagnosticInfo();
            console.log('Auth diagnostic:', authDiag);
        }
        
        if (window.AppConfig) {
            const configDiag = window.AppConfig.getDebugInfo();
            console.log('Config diagnostic:', configDiag);
        }
        
        return diagnostic;
    } else {
        console.log('❌ App instance not available');
        return { error: 'App instance not available' };
    }
};

// =====================================
// INITIALISATION PRINCIPALE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, creating app instance...');
    
    // Vérification immédiate de la configuration
    if (!window.AppConfig) {
        console.error('[App] ❌ AppConfig not available on DOM load');
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; 
            padding: 15px; text-align: center; z-index: 99999; font-family: monospace;
        `;
        errorDiv.innerHTML = '❌ Configuration not loaded. Please refresh the page.';
        document.body.appendChild(errorDiv);
        return;
    }
    
    if (window.AppConfig.error) {
        console.error('[App] ❌ AppConfig has errors:', window.AppConfig.error);
        return;
    }
    
    // Créer l'instance de l'app
    window.app = new App();
    
    // Fonction pour vérifier la disponibilité des services
    function checkServicesAndStart() {
        const requiredServices = ['authService'];
        const missingServices = requiredServices.filter(service => !window[service]);
        
        if (missingServices.length === 0) {
            console.log('[App] All required services available, starting initialization...');
            setTimeout(() => {
                window.app.init().catch(error => {
                    console.error('[App] Initialization failed:', error);
                });
            }, 100);
        } else {
            console.log('[App] Missing services:', missingServices, '- retrying...');
            setTimeout(checkServicesAndStart, 200);
        }
    }
    
    checkServicesAndStart();
});

// Fallback de sécurité
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.app) {
            console.error('[App] App instance not created, creating fallback...');
            try {
                window.app = new App();
                window.app.init();
            } catch (error) {
                console.error('[App] Fallback creation failed:', error);
            }
        } else if (!window.app.isAuthenticated && !window.app.isInitializing) {
            console.log('[App] Fallback check - ensuring login page is visible...');
            const loginPage = document.getElementById('loginPage');
            if (loginPage && loginPage.style.display === 'none') {
                loginPage.style.display = 'flex';
            }
        }
    }, 5000);
});

console.log('✅ App v6.0 loaded with guaranteed initialization support');
