// app.js - Version 8.0 - CORRECTION LOGIQUE AUTHENTIFICATION

class App {
    constructor() {
        console.log('[App] Constructor v8.0 - Correction logique authentification...');
        console.log('[App] Current domain:', window.CURRENT_HOSTNAME);
        
        this.initAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // Bind methods to preserve context
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.initialize = this.initialize.bind(this);
        
        console.log('[App] Initializing...');
        this.initialize();
    }

    async initialize() {
        if (this.isInitializing || this.isInitialized) {
            console.log('[App] Already initializing or initialized, skipping...');
            return;
        }

        this.isInitializing = true;
        this.initAttempts++;

        console.log(`[App] Starting initialization attempt ${this.initAttempts}`);

        try {
            await this.waitForCriticalServices();
            this.checkPrerequisites();
            await this.initializeAuth();
            await this.setupApplication();
            
            this.isInitialized = true;
            console.log('[App] ✅ Initialization completed successfully');

        } catch (error) {
            console.error(`[App] ❌ Initialization failed (attempt ${this.initAttempts}):`, error);
            
            if (this.initAttempts < this.maxInitAttempts) {
                console.log(`[App] Retrying initialization in 2 seconds...`);
                setTimeout(() => {
                    this.isInitializing = false;
                    this.initialize();
                }, 2000);
            } else {
                console.error('[App] ❌ Max initialization attempts reached');
                this.showInitializationError(error);
            }
        } finally {
            this.isInitializing = false;
        }
    }

    async waitForCriticalServices() {
        console.log('[App] Waiting for critical services...');
        
        const requiredServices = ['authService', 'uiManager', 'mailService', 'taskManager', 'pageManager'];
        const maxWait = 10000;
        const checkInterval = 100;
        let waited = 0;
        
        while (waited < maxWait) {
            const missing = requiredServices.filter(service => !window[service]);
            
            if (missing.length === 0) {
                console.log('[App] ✅ All critical services available');
                return true;
            }
            
            if (waited % 1000 === 0) {
                console.log(`[App] Waiting for services: ${missing.join(', ')}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        throw new Error(`Critical services missing: ${requiredServices.filter(s => !window[s]).join(', ')}`);
    }

    checkPrerequisites() {
        console.log('[App] Checking prerequisites...');
        
        if (!window.AppConfig) {
            throw new Error('AppConfig not available');
        }
        
        if (window.AppConfig.error) {
            throw new Error(`Configuration error: ${window.AppConfig.message}`);
        }
        
        const validation = window.AppConfig.validate();
        if (!validation.valid) {
            throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
        }
        
        if (typeof msal === 'undefined') {
            throw new Error('MSAL library not loaded');
        }
        
        console.log('[App] ✅ Prerequisites check passed');
    }

    async initializeAuth() {
        console.log('[App] Initializing authentication...');
        
        if (!window.authService) {
            throw new Error('AuthService not available');
        }
        
        await window.authService.initialize();
        console.log('[App] ✅ Auth service initialized');

        // CORRECTION CRITIQUE : Vérifier l'authentification correctement
        await this.checkAuthenticationStatus();
    }

    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        try {
            const authResult = window.authService.isAuthenticated();
            console.log('[App] Auth result received:', authResult);
            
            // CORRECTION : Utiliser authResult.isAuthenticated au lieu de authResult.result
            if (authResult.isAuthenticated && authResult.account) {
                console.log('[App] User is authenticated, getting user info...');
                
                try {
                    const userInfo = await window.authService.getUserInfo();
                    console.log('[App] ✅ User authenticated:', userInfo.displayName);
                    
                    // Montrer l'application immédiatement
                    await this.showApplication();
                    
                } catch (userInfoError) {
                    console.log('[App] Could not get user info, but user is authenticated:', userInfoError);
                    // Même si on ne peut pas récupérer les infos, on peut montrer l'app
                    await this.showApplication();
                }
            } else {
                console.log('[App] User not authenticated, showing login page');
                this.showLoginPage();
            }
            
        } catch (error) {
            console.error('[App] Auth check error:', error);
            this.showLoginPage();
        }
    }

    async setupApplication() {
        console.log('[App] Setting up application...');
        this.setupEventListeners();
        this.bindGlobalMethods();
        console.log('[App] ✅ Application setup completed');
    }

    setupEventListeners() {
        console.log('[App] Setting up event listeners...');
        
        // Gestion de la connexion
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            // Supprimer les anciens listeners
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Gestion de la navigation (event delegation)
        document.removeEventListener('click', this.navigationHandler);
        this.navigationHandler = (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.handleNavigation(navItem.dataset.page);
            }
        };
        document.addEventListener('click', this.navigationHandler);
        
        console.log('[App] ✅ Event listeners setup completed');
    }

    bindGlobalMethods() {
        console.log('[App] Binding global methods...');
        
        const services = ['taskManager', 'pageManager', 'uiManager', 'mailService', 'categoryManager'];
        
        services.forEach(serviceName => {
            const service = window[serviceName];
            if (service && typeof service === 'object') {
                Object.getOwnPropertyNames(Object.getPrototypeOf(service)).forEach(methodName => {
                    if (methodName !== 'constructor' && typeof service[methodName] === 'function') {
                        service[methodName] = service[methodName].bind(service);
                    }
                });
                console.log(`[App] ✅ ${serviceName} methods bound`);
            }
        });
    }

    handleNavigation(pageName) {
        if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
            window.pageManager.loadPage(pageName);
        } else {
            console.error('[App] PageManager not available for navigation');
        }
    }

    async login() {
        console.log('[App] Starting login process...');
        
        try {
            // Désactiver le bouton de connexion
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
                loginBtn.disabled = true;
            }
            
            // Afficher l'overlay de chargement
            this.showLoadingOverlay('Connexion à Microsoft...');
            
            // Tenter la connexion
            const result = await window.authService.login();
            console.log('[App] Login attempt completed:', result);
            
            // Cacher l'overlay de chargement
            this.hideLoadingOverlay();
            
            // CORRECTION : Vérifier l'état d'authentification après la tentative de connexion
            setTimeout(async () => {
                const authStatus = window.authService.isAuthenticated();
                console.log('[App] Post-login auth status:', authStatus);
                
                if (authStatus.isAuthenticated) {
                    console.log('[App] ✅ Login successful, showing application');
                    await this.showApplication();
                } else {
                    console.log('[App] Login did not complete, keeping login page');
                    this.showLoginPage();
                }
            }, 500); // Petit délai pour laisser MSAL se stabiliser
            
        } catch (error) {
            console.error('[App] ❌ Login failed:', error);
            
            // Restaurer le bouton de connexion
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fab fa-microsoft"></i> Se connecter à Outlook';
                loginBtn.disabled = false;
            }
            
            this.hideLoadingOverlay();
            this.showLoginError(error);
        }
    }

    async logout() {
        console.log('[App] Starting logout process...');
        
        try {
            await window.authService.logout();
            console.log('[App] ✅ Logout successful');
            
            this.resetApplicationState();
            this.showLoginPage();
            
        } catch (error) {
            console.error('[App] ❌ Logout failed:', error);
            
            if (window.uiManager) {
                window.uiManager.showToast('Erreur de déconnexion', 'error');
            }
        }
    }

    async showApplication() {
        console.log('[App] Showing application...');
        
        try {
            this.hideLoginPage();
            this.showAppInterface();
            this.updateAuthStatus();
            await this.loadDefaultPage();
            
            console.log('[App] ✅ Application fully displayed');
            
        } catch (error) {
            console.error('[App] ❌ Error showing application:', error);
            this.showLoginPage();
        }
    }

    showLoginPage() {
        console.log('[App] Showing login page...');
        
        // Retirer la classe app-active
        document.body.classList.remove('app-active');
        
        // Afficher la page de connexion
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        
        // Masquer l'interface de l'application
        this.hideAppInterface();
        
        // Restaurer le bouton de connexion
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fab fa-microsoft"></i> Se connecter à Outlook';
            loginBtn.disabled = false;
        }
    }

    hideLoginPage() {
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'none';
        }
    }

    showAppInterface() {
        console.log('[App] Activating app interface...');
        document.body.classList.add('app-active');
    }

    hideAppInterface() {
        document.body.classList.remove('app-active');
    }

    updateAuthStatus() {
        if (window.uiManager && typeof window.uiManager.updateAuthStatus === 'function') {
            // Récupérer les informations utilisateur
            if (window.authService && window.authService.isAuthenticated().isAuthenticated) {
                window.authService.getUserInfo()
                    .then(userInfo => {
                        window.uiManager.updateAuthStatus('authenticated', userInfo);
                    })
                    .catch(error => {
                        console.log('[App] Could not get user info for status update:', error);
                        window.uiManager.updateAuthStatus('authenticated', { displayName: 'Utilisateur' });
                    });
            } else {
                window.uiManager.updateAuthStatus('disconnected');
            }
        }
    }

    async loadDefaultPage() {
        console.log('[App] Loading default page...');
        
        // Attendre que l'interface soit stable
        setTimeout(() => {
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                window.pageManager.loadPage('dashboard');
            }
        }, 100);
    }

    showLoadingOverlay(message = 'Chargement...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const textElement = overlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
            overlay.classList.add('active');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showLoginError(error) {
        console.error('[App] Login error:', error);
        
        const message = this.getErrorMessage(error);
        
        if (window.uiManager && typeof window.uiManager.showToast === 'function') {
            window.uiManager.showToast(message, 'error');
        } else {
            alert(`Erreur de connexion: ${message}`);
        }
    }

    showInitializationError(error) {
        console.error('[App] Initialization error:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'init-error';
        errorDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white; display: flex; align-items: center; justify-content: center;
            z-index: 99999; text-align: center; padding: 20px;
        `;
        
        errorDiv.innerHTML = `
            <div style="max-width: 500px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                <h2 style="font-size: 2rem; margin-bottom: 16px;">Erreur d'initialisation</h2>
                <p style="margin-bottom: 20px; font-size: 1.1rem;">${error.message}</p>
                <button onclick="window.location.reload()" 
                        style="background: white; color: #dc2626; border: none; padding: 12px 24px; 
                               border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                    <i class="fas fa-redo"></i> Recharger la page
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    getErrorMessage(error) {
        if (!error) return 'Erreur inconnue';
        
        if (error.message) return error.message;
        if (error.code) return `Erreur ${error.code}`;
        
        return 'Erreur de connexion';
    }

    resetApplicationState() {
        console.log('[App] Resetting application state...');
        
        if (window.pageManager) {
            window.pageManager.currentPage = null;
            window.pageManager.selectedEmails?.clear();
            window.pageManager.isLoading = false;
        }
        
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = '';
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const firstNavItem = document.querySelector('.nav-item[data-page="dashboard"]');
        if (firstNavItem) {
            firstNavItem.classList.add('active');
        }
    }
}

// Initialisation automatique quand le DOM est prêt
let appInstance = null;

function initializeApp() {
    if (appInstance) {
        console.log('[App] App already initialized');
        return appInstance;
    }
    
    console.log('[App] DOM loaded, creating app instance...');
    
    try {
        // Vérifier que les services critiques sont disponibles
        const criticalServices = ['authService', 'uiManager'];
        const missing = criticalServices.filter(service => !window[service]);
        
        if (missing.length > 0) {
            console.log(`[App] Waiting for critical services: ${missing.join(', ')}`);
            setTimeout(initializeApp, 100);
            return null;
        }
        
        console.log('[App] All required services available, starting initialization...');
        appInstance = new App();
        window.app = appInstance;
        
        return appInstance;
        
    } catch (error) {
        console.error('[App] ❌ Failed to create app instance:', error);
        return null;
    }
}

// Événements d'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export pour compatibilité
window.App = App;
window.initializeApp = initializeApp;

console.log('✅ App v8.0 loaded - Correction logique authentification');
