// app.js - Application EmailSortPro avec intégration Analytics et Licence
// Version corrigée et simplifiée

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.licenseUser = null;
        this.hasValidLicense = false;
        this.isInitializing = false;
        this.currentPage = 'dashboard';
        this.isNetlifyEnv = window.location.hostname.includes('netlify.app');
        
        console.log('[App] Constructor - EmailSortPro v5.0...');
        console.log('[App] Environment:', this.isNetlifyEnv ? 'Netlify' : 'Local');
        
        // Initialiser Analytics de manière sûre
        this.initializeAnalyticsSafe();
    }

    // =====================================
    // INITIALISATION ANALYTICS SÉCURISÉE
    // =====================================
    initializeAnalyticsSafe() {
        try {
            if (window.analyticsManager) {
                console.log('[App] Analytics manager found');
                // Ne pas appeler de méthodes qui pourraient ne pas exister
            } else {
                console.log('[App] Analytics manager not available yet');
            }
        } catch (error) {
            console.warn('[App] Analytics initialization error:', error);
        }
    }

    // =====================================
    // INITIALISATION PRINCIPALE
    // =====================================
    async init() {
        if (this.isInitializing) {
            console.log('[App] Already initializing, skipping...');
            return;
        }
        
        this.isInitializing = true;
        console.log('[App] Starting initialization...');
        
        try {
            // 1. Vérifier les prérequis de base
            if (!this.checkBasicRequirements()) {
                throw new Error('Basic requirements not met');
            }

            // 2. Charger le service de licence (optionnel)
            await this.loadLicenseServiceSafe();

            // 3. Initialiser les services d'authentification
            await this.initializeAuthServices();
            
            // 4. Initialiser les modules critiques
            await this.initializeCriticalModules();
            
            // 5. Vérifier l'état d'authentification
            await this.checkAuthenticationStatus();
            
            console.log('[App] ✅ Initialization complete');
            
        } catch (error) {
            console.error('[App] Initialization error:', error);
            this.handleInitError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    // =====================================
    // VÉRIFICATIONS DE BASE
    // =====================================
    checkBasicRequirements() {
        console.log('[App] Checking basic requirements...');
        
        if (typeof msal === 'undefined') {
            console.error('[App] MSAL library not loaded');
            this.showError('Bibliothèque d\'authentification Microsoft non chargée');
            return false;
        }

        if (!window.AppConfig) {
            console.error('[App] Configuration not loaded');
            this.showError('Configuration non chargée');
            return false;
        }

        if (!window.authService && !window.googleAuthService) {
            console.error('[App] No authentication service available');
            this.showError('Aucun service d\'authentification disponible');
            return false;
        }

        console.log('[App] ✅ Basic requirements OK');
        return true;
    }

    // =====================================
    // CHARGEMENT SÉCURISÉ DU SERVICE DE LICENCE
    // =====================================
    async loadLicenseServiceSafe() {
        if (window.licenseService) {
            console.log('[App] License service already loaded');
            return true;
        }

        console.log('[App] Attempting to load license service...');
        
        try {
            // Essayer de charger le service
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = './LicenseService.js';
                
                script.onload = async () => {
                    console.log('[App] License service script loaded');
                    if (window.licenseService && window.licenseService.initialize) {
                        try {
                            await window.licenseService.initialize();
                            console.log('[App] ✅ License service initialized');
                            resolve(true);
                        } catch (err) {
                            console.warn('[App] License service init failed:', err);
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                };
                
                script.onerror = () => {
                    console.warn('[App] Could not load LicenseService.js');
                    resolve(false);
                };
                
                // Timeout après 3 secondes
                setTimeout(() => {
                    if (!window.licenseService) {
                        console.warn('[App] License service load timeout');
                        resolve(false);
                    }
                }, 3000);
                
                document.head.appendChild(script);
            });
            
            return true;
        } catch (error) {
            console.warn('[App] License service loading error:', error);
            return false;
        }
    }

    // =====================================
    // INITIALISATION DES SERVICES D'AUTH
    // =====================================
    async initializeAuthServices() {
        console.log('[App] Initializing auth services...');
        
        const promises = [];
        
        if (window.authService) {
            promises.push(
                window.authService.initialize()
                    .then(() => {
                        console.log('[App] ✅ Microsoft auth initialized');
                        return 'microsoft';
                    })
                    .catch(error => {
                        console.warn('[App] Microsoft auth failed:', error);
                        return null;
                    })
            );
        }
        
        if (window.googleAuthService) {
            promises.push(
                window.googleAuthService.initialize()
                    .then(() => {
                        console.log('[App] ✅ Google auth initialized');
                        return 'google';
                    })
                    .catch(error => {
                        console.warn('[App] Google auth failed:', error);
                        return null;
                    })
            );
        }
        
        const results = await Promise.allSettled(promises);
        const successfulServices = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
        
        if (successfulServices.length === 0) {
            throw new Error('No authentication service could be initialized');
        }
        
        console.log('[App] Auth services ready:', successfulServices);
    }

    // =====================================
    // VÉRIFICATION DE L'AUTHENTIFICATION
    // =====================================
    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        // Vérifier Google callback d'abord
        if (await this.handleGoogleCallback()) {
            return;
        }
        
        // Vérifier Microsoft
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account) {
                try {
                    this.user = await window.authService.getUserInfo();
                    this.user.provider = 'microsoft';
                    this.isAuthenticated = true;
                    this.activeProvider = 'microsoft';
                    
                    // Vérifier la licence si disponible
                    if (window.licenseService) {
                        const licenseValid = await this.verifyUserLicense();
                        if (!licenseValid) return;
                    }
                    
                    console.log('[App] ✅ Microsoft user authenticated');
                    this.showApp();
                    return;
                } catch (error) {
                    console.error('[App] Microsoft auth error:', error);
                    await window.authService.reset();
                }
            }
        }
        
        // Vérifier Google
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account) {
                try {
                    this.user = await window.googleAuthService.getUserInfo();
                    this.user.provider = 'google';
                    this.isAuthenticated = true;
                    this.activeProvider = 'google';
                    
                    // Vérifier la licence si disponible
                    if (window.licenseService) {
                        const licenseValid = await this.verifyUserLicense();
                        if (!licenseValid) return;
                    }
                    
                    console.log('[App] ✅ Google user authenticated');
                    this.showApp();
                    return;
                } catch (error) {
                    console.error('[App] Google auth error:', error);
                    await window.googleAuthService.reset();
                }
            }
        }
        
        // Pas d'authentification
        console.log('[App] No authentication found');
        this.showLogin();
    }

    // =====================================
    // VÉRIFICATION DE LICENCE SIMPLIFIÉE
    // =====================================
    async verifyUserLicense() {
        if (!window.licenseService) {
            console.log('[App] License service not available, skipping check');
            return true;
        }
        
        try {
            const userEmail = this.user.email || this.user.mail || this.user.userPrincipalName;
            if (!userEmail) {
                console.error('[App] No user email found');
                return true; // Ne pas bloquer si pas d'email
            }
            
            console.log('[App] Checking license for:', userEmail);
            const result = await window.licenseService.checkUserLicense(userEmail);
            
            // Si nouvel utilisateur, lancer l'onboarding
            if (result.error && result.error.includes('PGRST116')) {
                console.log('[App] New user detected');
                return await this.startOnboarding(userEmail);
            }
            
            // Si licence invalide
            if (!result.valid) {
                console.warn('[App] Invalid license:', result.message);
                this.showLicenseError(result.message || 'Licence invalide');
                setTimeout(() => this.logout(), 10000);
                return false;
            }
            
            // Licence valide
            this.licenseUser = result.user;
            this.hasValidLicense = true;
            console.log('[App] ✅ License valid');
            return true;
            
        } catch (error) {
            console.error('[App] License check error:', error);
            // Ne pas bloquer en cas d'erreur
            return true;
        }
    }

    // =====================================
    // ONBOARDING SIMPLIFIÉ
    // =====================================
    async startOnboarding(email) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; text-align: center;">
                    <h2 style="margin-bottom: 1rem;">Bienvenue sur EmailSortPro !</h2>
                    <p style="margin-bottom: 2rem;">Première connexion détectée. Choisissez votre type de compte :</p>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                        <button id="btn-personal" style="
                            flex: 1;
                            padding: 1rem;
                            border: 1px solid #ddd;
                            background: #f8f9fa;
                            border-radius: 8px;
                            cursor: pointer;
                        ">
                            <div style="font-size: 2rem;">👤</div>
                            <div>Personnel</div>
                        </button>
                        <button id="btn-pro" style="
                            flex: 1;
                            padding: 1rem;
                            border: 1px solid #ddd;
                            background: #f8f9fa;
                            border-radius: 8px;
                            cursor: pointer;
                        ">
                            <div style="font-size: 2rem;">🏢</div>
                            <div>Professionnel</div>
                        </button>
                    </div>
                    
                    <div id="company-section" style="display: none;">
                        <input type="text" id="company-name" placeholder="Nom de votre société" style="
                            width: 100%;
                            padding: 0.5rem;
                            margin-bottom: 1rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                        ">
                        <button id="btn-create" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 0.5rem 2rem;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Créer le compte</button>
                    </div>
                    
                    <div id="loading" style="display: none;">
                        <p>Création du compte...</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Gestion des clics
            modal.querySelector('#btn-personal').onclick = async () => {
                modal.querySelector('#loading').style.display = 'block';
                const success = await this.createUser(email, 'personal');
                modal.remove();
                resolve(success);
            };
            
            modal.querySelector('#btn-pro').onclick = () => {
                modal.querySelector('#company-section').style.display = 'block';
            };
            
            modal.querySelector('#btn-create').onclick = async () => {
                const companyName = modal.querySelector('#company-name').value.trim();
                if (!companyName) {
                    alert('Veuillez entrer le nom de votre société');
                    return;
                }
                modal.querySelector('#loading').style.display = 'block';
                const success = await this.createUser(email, 'pro', companyName);
                modal.remove();
                resolve(success);
            };
        });
    }

    // =====================================
    // CRÉATION D'UTILISATEUR
    // =====================================
    async createUser(email, type, companyName = null) {
        if (!window.licenseService) {
            console.error('[App] Cannot create user without license service');
            return true; // Ne pas bloquer
        }
        
        try {
            // Laisser le service de licence gérer la création
            const result = await window.licenseService.checkUserLicense(email);
            
            if (result.valid) {
                this.licenseUser = result.user;
                this.hasValidLicense = true;
                this.showWelcomeMessage();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[App] User creation error:', error);
            return true; // Ne pas bloquer
        }
    }

    // =====================================
    // AFFICHAGE DE BIENVENUE
    // =====================================
    showWelcomeMessage() {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        toast.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">Bienvenue !</h3>
            <p style="margin: 0;">Votre compte a été créé avec 15 jours d'essai gratuit.</p>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // =====================================
    // MÉTHODES D'AUTHENTIFICATION
    // =====================================
    async loginMicrosoft() {
        try {
            this.showLoading('Connexion à Microsoft...');
            
            if (!window.authService) {
                throw new Error('Service Microsoft non disponible');
            }
            
            await window.authService.login();
            
        } catch (error) {
            console.error('[App] Microsoft login error:', error);
            this.hideLoading();
            this.showToast('Erreur de connexion Microsoft', 'error');
        }
    }

    async loginGoogle() {
        try {
            this.showLoading('Connexion à Google...');
            
            if (!window.googleAuthService) {
                throw new Error('Service Google non disponible');
            }
            
            await window.googleAuthService.login();
            
        } catch (error) {
            console.error('[App] Google login error:', error);
            this.hideLoading();
            this.showToast('Erreur de connexion Google', 'error');
        }
    }

    async logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            this.showLoading('Déconnexion...');
            
            try {
                if (this.activeProvider === 'microsoft' && window.authService) {
                    await window.authService.logout();
                } else if (this.activeProvider === 'google' && window.googleAuthService) {
                    await window.googleAuthService.logout();
                }
            } catch (error) {
                console.error('[App] Logout error:', error);
            }
            
            this.cleanup();
            window.location.reload();
        }
    }

    // =====================================
    // AFFICHAGE DE L'APPLICATION
    // =====================================
    showApp() {
        console.log('[App] Showing application...');
        
        this.hideLoading();
        
        // Masquer la page de login
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'none';
        
        // Afficher l'app
        document.body.classList.remove('login-mode');
        document.body.classList.add('app-active');
        
        // Afficher les éléments
        ['app-header', 'app-nav'].forEach(className => {
            const element = document.querySelector(`.${className}`);
            if (element) {
                element.style.display = 'block';
                element.style.opacity = '1';
            }
        });
        
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
        }
        
        // Mettre à jour l'UI
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Charger le dashboard
        this.loadDashboard();
    }

    showLogin() {
        console.log('[App] Showing login page');
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'flex';
        
        this.hideLoading();
    }

    // =====================================
    // CHARGEMENT DU DASHBOARD
    // =====================================
    loadDashboard() {
        this.currentPage = 'dashboard';
        
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            try {
                window.dashboardModule.render();
            } catch (error) {
                console.error('[App] Dashboard render error:', error);
                this.showDashboardFallback();
            }
        } else {
            this.showDashboardFallback();
        }
    }

    showDashboardFallback() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;
        
        pageContent.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h1>Tableau de bord</h1>
                <p>Bienvenue dans EmailSortPro</p>
                <div style="margin-top: 2rem;">
                    <p>Connecté via ${this.activeProvider === 'microsoft' ? 'Microsoft' : 'Google'}</p>
                    <p>${this.user?.displayName || this.user?.name || this.user?.email || 'Utilisateur'}</p>
                </div>
            </div>
        `;
    }

    // =====================================
    // GESTION DES ERREURS
    // =====================================
    showError(message) {
        console.error('[App] Error:', message);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #dc3545;">Erreur</h1>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 1rem;
                        padding: 0.5rem 2rem;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Recharger</button>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideLoading();
    }

    showLicenseError(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px;">
                <h2 style="color: #dc3545;">Erreur de Licence</h2>
                <p>${message}</p>
                <p style="margin-top: 1rem;">Contactez votre administrateur : support@emailsortpro.com</p>
                <p style="font-size: 0.9rem; color: #666;">Déconnexion automatique dans 10 secondes...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // =====================================
    // UTILITAIRES
    // =====================================
    showLoading(message = 'Chargement...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('.login-loading-text');
            if (text) text.textContent = message;
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            alert(message);
        }
    }

    cleanup() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.licenseUser = null;
        this.hasValidLicense = false;
        
        // Nettoyer le localStorage sélectivement
        ['google_token', 'msal', 'license'].forEach(key => {
            Object.keys(localStorage).forEach(storageKey => {
                if (storageKey.includes(key)) {
                    localStorage.removeItem(storageKey);
                }
            });
        });
        
        sessionStorage.clear();
    }

    // =====================================
    // EVENT LISTENERS
    // =====================================
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page && window.pageManager) {
                    window.pageManager.loadPage(page);
                }
            });
        });
    }

    // =====================================
    // MODULES CRITIQUES
    // =====================================
    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules...');
        
        // Créer des fallbacks pour les modules manquants
        if (!window.mailService) {
            window.mailService = {
                getEmails: async () => [],
                getFolders: async () => [],
                getEmailCount: async () => 0
            };
        }
        
        if (!window.pageManager) {
            window.pageManager = {
                loadPage: (page) => {
                    console.log(`[PageManager] Loading page: ${page}`);
                    const pageContent = document.getElementById('pageContent');
                    if (pageContent) {
                        pageContent.innerHTML = `<div style="padding: 2rem;"><h1>${page}</h1><p>Page en construction</p></div>`;
                    }
                }
            };
        }
        
        console.log('[App] Critical modules ready');
    }

    // =====================================
    // GESTION DES CALLBACKS
    // =====================================
    async handleGoogleCallback() {
        const callbackData = sessionStorage.getItem('google_callback_data');
        if (!callbackData) return false;
        
        try {
            const data = JSON.parse(callbackData);
            sessionStorage.removeItem('google_callback_data');
            
            const urlParams = new URLSearchParams();
            urlParams.set('code', data.code);
            urlParams.set('state', data.state);
            
            const success = await window.googleAuthService.handleOAuthCallback(urlParams);
            
            if (success) {
                this.user = await window.googleAuthService.getUserInfo();
                this.user.provider = 'google';
                this.isAuthenticated = true;
                this.activeProvider = 'google';
                
                if (window.licenseService) {
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) return false;
                }
                
                this.showApp();
                return true;
            }
        } catch (error) {
            console.error('[App] Google callback error:', error);
        }
        
        return false;
    }

    // =====================================
    // GESTION DES ERREURS D'INIT
    // =====================================
    handleInitError(error) {
        console.error('[App] Init error:', error);
        
        if (error.message.includes('authentication')) {
            this.showError('Erreur d\'authentification. Veuillez recharger la page.');
        } else if (error.message.includes('configuration')) {
            this.showError('Erreur de configuration. Veuillez vérifier les paramètres.');
        } else {
            this.showError('Erreur de chargement de l\'application.');
        }
    }
}

// =====================================
// FONCTIONS GLOBALES
// =====================================
window.diagnoseApp = function() {
    console.group('🔍 DIAGNOSTIC');
    
    const diag = {
        app: window.app ? {
            isAuthenticated: window.app.isAuthenticated,
            activeProvider: window.app.activeProvider,
            hasLicense: window.app.hasValidLicense,
            user: window.app.user?.email || 'none'
        } : 'App not initialized',
        
        services: {
            microsoft: !!window.authService,
            google: !!window.googleAuthService,
            license: !!window.licenseService,
            analytics: !!window.analyticsManager,
            mail: !!window.mailService,
            page: !!window.pageManager
        },
        
        environment: {
            netlify: window.location.hostname.includes('netlify.app'),
            domain: window.location.hostname
        }
    };
    
    console.log('Diagnostic:', diag);
    console.groupEnd();
    
    return diag;
};

window.emergencyReset = function() {
    console.log('[Emergency] Reset triggered');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
};

// =====================================
// INITIALISATION
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded');
    
    try {
        // Créer l'instance de l'app
        window.app = new App();
        
        // Attendre que les services de base soient prêts
        setTimeout(() => {
            const requiredServices = ['uiManager'];
            const hasRequired = requiredServices.every(s => window[s]);
            const hasAuth = window.authService || window.googleAuthService;
            
            if (hasRequired && hasAuth) {
                console.log('[App] Services ready, initializing...');
                window.app.init();
            } else {
                console.error('[App] Missing required services');
                window.app.showError('Services requis non disponibles');
            }
        }, 500);
        
    } catch (error) {
        console.error('[App] Critical error:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="text-align: center;">
                    <h1>Erreur Critique</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Recharger</button>
                </div>
            </div>
        `;
    }
});

console.log('✅ EmailSortPro App v5.0 loaded');
console.log('🔧 Commands: diagnoseApp(), emergencyReset()');
