// app.js - Version 7.0 - CORRECTION BOUCLE INITIALISATION

class App {
    constructor() {
        console.log('[App] Constructor v7.0 - Correction boucle initialisation...');
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
        // Éviter les multiples initialisations simultanées
        if (this.isInitializing || this.isInitialized) {
            console.log('[App] Already initializing or initialized, skipping...');
            return;
        }

        this.isInitializing = true;
        this.initAttempts++;

        console.log(`[App] Starting initialization attempt ${this.initAttempts}`);

        try {
            // Attendre que tous les services critiques soient disponibles
            await this.waitForCriticalServices();
            
            // Vérifier les prérequis
            this.checkPrerequisites();
            
            // Initialiser l'authentification
            await this.initializeAuth();
            
            // Configurer l'application
            await this.setupApplication();
            
            // Marquer comme initialisé
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
        
        const requiredServices = [
            'authService', 'uiManager', 'mailService', 
            'taskManager', 'pageManager'
        ];
        
        const maxWait = 10000; // 10 secondes max
        const checkInterval = 100;
        let waited = 0;
        
        while (waited < maxWait) {
            const missing = requiredServices.filter(service => !window[service]);
            
            if (missing.length === 0) {
                console.log('[App] ✅ All critical services available');
                return true;
            }
            
            if (waited % 1000 === 0) { // Log toutes les secondes
                console.log(`[App] Waiting for services: ${missing.join(', ')}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        throw new Error(`Critical services missing: ${requiredServices.filter(s => !window[s]).join(', ')}`);
    }

    checkPrerequisites() {
        console.log('[App] Checking prerequisites...');
        
        // Vérifier la configuration
        if (!window.AppConfig) {
            throw new Error('AppConfig not available');
        }
        
        if (window.AppConfig.error) {
            throw new Error(`Configuration error: ${window.AppConfig.message}`);
        }
        
        // Valider la configuration
        const validation = window.AppConfig.validate();
        if (!validation.valid) {
            throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
        }
        
        // Vérifier MSAL
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

        // Vérifier l'état d'authentification
        await this.checkAuthenticationStatus();
    }

    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        try {
            const authResult = window.authService.isAuthenticated();
            
            if (authResult.isAuthenticated) {
                console.log('[App] User is authenticated, getting user info...');
                const userInfo = await window.authService.getUserInfo();
                console.log('[App] ✅ User authenticated:', userInfo.displayName);
                
                await this.showApplication();
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
        
        // Initialiser les gestionnaires d'événements
        this.setupEventListeners();
        
        // Bind des méthodes globales pour éviter les erreurs
        this.bindGlobalMethods();
        
        console.log('[App] ✅ Application setup completed');
    }

    setupEventListeners() {
        console.log('[App] Setting up event listeners...');
        
        // Gestion de la connexion
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Gestion de la navigation (event delegation)
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.handleNavigation(navItem.dataset.page);
            }
        });
        
        // Gestion de la déconnexion
        const logoutElements = document.querySelectorAll('[data-action="logout"]');
        logoutElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
        
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
            console.log('[App] ✅ Login successful:', result);
            
            // Cacher l'overlay de chargement
            this.hideLoadingOverlay();
            
            // Afficher l'application
            await this.showApplication();
            
        } catch (error) {
            console.error('[App] ❌ Login failed:', error);
            
            // Restaurer le bouton de connexion
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fab fa-microsoft"></i> Se connecter à Outlook';
                loginBtn.disabled = false;
            }
            
            // Cacher l'overlay de chargement
            this.hideLoadingOverlay();
            
            // Afficher l'erreur
            this.showLoginError(error);
        }
    }

    async logout() {
        console.log('[App] Starting logout process...');
        
        try {
            await window.authService.logout();
            console.log('[App] ✅ Logout successful');
            
            // Réinitialiser l'état de l'application
            this.resetApplicationState();
            
            // Afficher la page de connexion
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
            // Masquer la page de connexion
            this.hideLoginPage();
            
            // Afficher l'interface de l'application
            this.showAppInterface();
            
            // Mettre à jour le statut d'authentification
            this.updateAuthStatus();
            
            // Charger la page par défaut (dashboard)
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
        
        // Ajouter la classe app-active
        document.body.classList.add('app-active');
        
        // Les styles CSS gèrent automatiquement l'affichage des éléments
        // grâce à la classe app-active
    }

    hideAppInterface() {
        document.body.classList.remove('app-active');
    }

    updateAuthStatus() {
        if (window.uiManager && typeof window.uiManager.updateAuthStatus === 'function') {
            window.uiManager.updateAuthStatus('authenticated');
        }
    }

    async loadDefaultPage() {
        console.log('[App] Loading default page...');
        
        // Petit délai pour laisser l'interface se stabiliser
        setTimeout(() => {
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                window.pageManager.loadPage('dashboard');
            }
        }, 100);
    }

    showLoadingOverlay(message = 'Chargement...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const textElement = overlay.querySelector('.login-loading-text div');
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
        
        const errorCode = error.errorCode || error.code || error.name;
        
        // Messages d'erreur personnalisés
        const errorMessages = {
            'popup_window_error': 'Popup bloquée. Autorisez les popups pour ce site.',
            'user_cancelled': 'Connexion annulée par l\'utilisateur.',
            'network_error': 'Erreur réseau. Vérifiez votre connexion.',
            'invalid_client': 'Configuration invalide. Contactez l\'administrateur.',
            'unauthorized_client': 'Application non autorisée.',
            'consent_required': 'Autorisation requise. Acceptez les permissions.',
            'interaction_required': 'Interaction requise. Reconnectez-vous.',
            'login_required': 'Connexion requise.',
            'token_expired': 'Session expirée. Reconnectez-vous.',
            'invalid_request': 'Requête invalide.',
            'temporarily_unavailable': 'Service temporairement indisponible.'
        };
        
        return errorMessages[errorCode] || error.message || 'Erreur de connexion';
    }

    resetApplicationState() {
        console.log('[App] Resetting application state...');
        
        // Réinitialiser les gestionnaires
        if (window.pageManager) {
            window.pageManager.currentPage = null;
            window.pageManager.selectedEmails.clear();
            window.pageManager.isLoading = false;
        }
        
        // Vider le contenu des pages
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = '';
        }
        
        // Réinitialiser la navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Activer le premier élément de navigation
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
            // Réessayer dans 100ms
            setTimeout(initializeApp, 100);
            return null;
        }
        
        console.log('[App] All required services available, starting initialization...');
        appInstance = new App();
        window.app = appInstance;
        
        return appInstance;
        
    } catch (error) {
        console.error('[App] ❌ Failed to create app instance:', error);
        
        // Afficher une erreur critique
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: #dc2626; color: white; display: flex; align-items: center; justify-content: center;
            z-index: 99999; text-align: center; padding: 20px;
        `;
        errorDiv.innerHTML = `
            <div>
                <h2>Erreur critique</h2>
                <p>${error.message}</p>
                <button onclick="window.location.reload()" 
                        style="background: white; color: #dc2626; border: none; padding: 10px 20px; 
                               border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Recharger
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        return null;
    }
}

// Événements d'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM déjà chargé
    initializeApp();
}

// Export pour compatibilité
window.App = App;
window.initializeApp = initializeApp;

console.log('✅ App v7.0 loaded - Correction boucle initialisation');
