// app.js - Application EmailSortPro v6.0
// Version réécrite, simplifiée et sans erreurs

class EmailSortProApp {
    constructor() {
        // État de l'application
        this.state = {
            initialized: false,
            licenseValid: false,
            authenticated: false,
            user: null,
            provider: null,
            currentPage: 'dashboard',
            error: null
        };

        // Configuration
        this.config = {
            domain: window.location.hostname,
            isNetlify: window.location.hostname.includes('netlify.app'),
            timeouts: {
                license: 30000,    // 30 secondes pour la licence
                services: 10000,   // 10 secondes pour les services
                modules: 5000      // 5 secondes pour les modules
            }
        };

        // Initialisation
        console.log('[App] EmailSortPro v6.0 starting...');
        console.log('[App] Environment:', this.config.isNetlify ? 'Netlify' : 'Local');
        console.log('[App] Domain:', this.config.domain);

        this.initialize();
    }

    // ==========================================
    // INITIALISATION PRINCIPALE
    // ==========================================
    async initialize() {
        try {
            // 1. Configuration des écouteurs d'événements
            this.setupEventListeners();

            // 2. Initialiser l'analytics si disponible
            this.initAnalytics();

            // 3. Attendre la vérification de licence
            await this.waitForLicenseCheck();

        } catch (error) {
            console.error('[App] Initialization error:', error);
            this.showErrorPage('Erreur d\'initialisation: ' + error.message);
        }
    }

    // ==========================================
    // GESTION DE LA LICENCE
    // ==========================================
    setupEventListeners() {
        // Licence validée
        window.addEventListener('userAuthenticated', (event) => {
            console.log('[App] License validated:', event.detail);
            this.handleLicenseSuccess(event.detail);
        });

        // Licence échouée
        window.addEventListener('licenseCheckFailed', (event) => {
            console.log('[App] License failed:', event.detail);
            this.handleLicenseFailed(event.detail);
        });

        // Service de licence prêt
        window.addEventListener('licenseServiceReady', () => {
            console.log('[App] License service ready');
        });
    }

    async waitForLicenseCheck() {
        console.log('[App] Waiting for license check...');
        
        // Créer une promesse qui se résout quand la licence est vérifiée
        const licensePromise = new Promise((resolve, reject) => {
            // Timeout de sécurité
            const timeout = setTimeout(() => {
                reject(new Error('License check timeout'));
            }, this.config.timeouts.license);

            // Vérifier si la licence est déjà validée
            if (this.state.licenseValid) {
                clearTimeout(timeout);
                resolve();
                return;
            }

            // Attendre l'événement de licence
            const handleSuccess = (event) => {
                clearTimeout(timeout);
                window.removeEventListener('userAuthenticated', handleSuccess);
                window.removeEventListener('licenseCheckFailed', handleFailed);
                this.handleLicenseSuccess(event.detail);
                resolve();
            };

            const handleFailed = (event) => {
                clearTimeout(timeout);
                window.removeEventListener('userAuthenticated', handleSuccess);
                window.removeEventListener('licenseCheckFailed', handleFailed);
                this.handleLicenseFailed(event.detail);
                reject(new Error('License check failed'));
            };

            window.addEventListener('userAuthenticated', handleSuccess, { once: true });
            window.addEventListener('licenseCheckFailed', handleFailed, { once: true });
        });

        try {
            await licensePromise;
        } catch (error) {
            console.error('[App] License check error:', error);
            
            // En environnement local, continuer sans licence
            if (!this.config.isNetlify) {
                console.warn('[App] Local environment - continuing without license');
                this.state.licenseValid = true;
                await this.startApplication();
            } else {
                throw error;
            }
        }
    }

    handleLicenseSuccess(detail) {
        console.log('[App] License success:', detail);
        
        // Mettre à jour l'état
        this.state.licenseValid = true;
        this.state.authenticated = true;
        this.state.user = detail.user;
        this.state.provider = this.detectProvider(detail.user);

        // Démarrer l'application
        this.startApplication();
    }

    handleLicenseFailed(detail) {
        console.error('[App] License failed:', detail);
        
        this.state.licenseValid = false;
        this.state.error = detail.message || 'Licence invalide';
        
        this.showErrorPage(this.state.error);
    }

    detectProvider(user) {
        if (user?.provider) return user.provider;
        
        const email = user?.email || '';
        if (email.includes('@gmail.com')) return 'google';
        if (email.includes('@outlook.com') || email.includes('@hotmail.')) return 'microsoft';
        
        return 'unknown';
    }

    // ==========================================
    // DÉMARRAGE DE L'APPLICATION
    // ==========================================
    async startApplication() {
        console.log('[App] Starting application...');

        try {
            // 1. Vérifier les prérequis
            this.checkPrerequisites();

            // 2. Initialiser les services
            await this.initializeServices();

            // 3. Initialiser les modules
            await this.initializeModules();

            // 4. Configurer l'interface
            this.setupUI();

            // 5. Afficher l'application
            this.showApplication();

            console.log('[App] ✅ Application started successfully');
            this.state.initialized = true;

        } catch (error) {
            console.error('[App] Startup error:', error);
            this.showErrorPage('Erreur de démarrage: ' + error.message);
        }
    }

    checkPrerequisites() {
        console.log('[App] Checking prerequisites...');

        // Vérifier MSAL
        if (typeof msal === 'undefined') {
            throw new Error('MSAL library not loaded');
        }

        // Vérifier la configuration
        if (!window.AppConfig) {
            throw new Error('Application configuration not loaded');
        }

        // Valider la configuration
        const validation = window.AppConfig.validate();
        if (!validation.valid) {
            throw new Error('Invalid configuration: ' + validation.issues.join(', '));
        }

        console.log('[App] ✅ Prerequisites OK');
    }

    async initializeServices() {
        console.log('[App] Initializing services...');

        const services = [];

        // Service Microsoft
        if (window.authService) {
            services.push(
                this.initService('Microsoft Auth', () => window.authService.initialize())
            );
        }

        // Service Google
        if (window.googleAuthService) {
            services.push(
                this.initService('Google Auth', () => window.googleAuthService.initialize())
            );
        }

        // Attendre l'initialisation avec timeout
        const results = await Promise.allSettled(services);
        
        // Vérifier qu'au moins un service est disponible
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        if (successCount === 0 && services.length > 0) {
            throw new Error('No authentication service available');
        }

        console.log('[App] ✅ Services initialized');
    }

    async initService(name, initFunc) {
        try {
            console.log(`[App] Initializing ${name}...`);
            await Promise.race([
                initFunc(),
                this.timeout(this.config.timeouts.services, `${name} timeout`)
            ]);
            console.log(`[App] ✅ ${name} ready`);
            return true;
        } catch (error) {
            console.warn(`[App] ⚠️ ${name} failed:`, error.message);
            return false;
        }
    }

    async initializeModules() {
        console.log('[App] Initializing modules...');

        // Liste des modules à vérifier
        const modules = [
            { name: 'UIManager', check: () => window.uiManager },
            { name: 'TaskManager', check: () => window.taskManager?.initialized },
            { name: 'PageManager', check: () => window.pageManager },
            { name: 'DashboardModule', check: () => window.dashboardModule },
            { name: 'MailService', check: () => window.mailService }
        ];

        // Attendre que les modules soient prêts
        for (const module of modules) {
            await this.waitForModule(module.name, module.check);
        }

        // Créer les fallbacks si nécessaire
        this.createFallbacks();

        console.log('[App] ✅ Modules initialized');
    }

    async waitForModule(name, checkFunc) {
        const startTime = Date.now();
        const timeout = this.config.timeouts.modules;

        while (Date.now() - startTime < timeout) {
            if (checkFunc()) {
                console.log(`[App] ✅ ${name} ready`);
                return true;
            }
            await this.sleep(100);
        }

        console.warn(`[App] ⚠️ ${name} not ready after timeout`);
        return false;
    }

    createFallbacks() {
        // Fallback pour MailService
        if (!window.mailService || typeof window.mailService.getEmailsFromFolder !== 'function') {
            console.log('[App] Creating MailService fallback...');
            window.mailService = {
                getEmailsFromFolder: async () => [],
                getFolders: async () => [{ id: 'inbox', displayName: 'Inbox', totalItemCount: 0 }],
                getEmailCount: async () => 0,
                searchEmails: async () => [],
                _isFallback: true
            };
        }

        // Fallback pour Scanner
        if (!window.minimalScanModule) {
            console.log('[App] Creating Scanner fallback...');
            window.minimalScanModule = {
                render: () => this.renderFallbackPage('Scanner', 'Scanner module not available'),
                _isFallback: true
            };
        }
    }

    // ==========================================
    // INTERFACE UTILISATEUR
    // ==========================================
    setupUI() {
        console.log('[App] Setting up UI...');

        // Configurer la navigation
        this.setupNavigation();

        // Configurer le gestionnaire de scroll
        this.setupScrollManager();

        // Mettre à jour l'affichage utilisateur
        this.updateUserDisplay();

        console.log('[App] ✅ UI configured');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });
    }

    setupScrollManager() {
        window.setPageMode = (pageName) => {
            this.state.currentPage = pageName;
            
            const body = document.body;
            body.className = body.className.replace(/page-\w+/g, '');
            body.classList.add(`page-${pageName}`);
            
            // Dashboard: pas de scroll
            if (pageName === 'dashboard') {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        };
    }

    updateUserDisplay() {
        if (window.uiManager && this.state.user) {
            window.uiManager.updateAuthStatus(this.state.user);
        }
    }

    navigateToPage(pageName) {
        console.log('[App] Navigating to:', pageName);
        
        this.state.currentPage = pageName;
        
        if (window.setPageMode) {
            window.setPageMode(pageName);
        }
        
        if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
            window.pageManager.loadPage(pageName);
        }
    }

    // ==========================================
    // AFFICHAGE
    // ==========================================
    showApplication() {
        console.log('[App] Showing application...');

        // Masquer la page de login
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'none';
        }

        // Activer le mode application
        document.body.classList.remove('login-mode');
        document.body.classList.add('app-active');

        // Afficher les éléments de l'app
        const elements = ['.app-header', '.app-nav', '#pageContent'];
        elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.style.display = 'block';
                el.style.opacity = '1';
            }
        });

        // Charger le dashboard
        this.loadDashboard();
    }

    loadDashboard() {
        this.state.currentPage = 'dashboard';
        
        if (window.setPageMode) {
            window.setPageMode('dashboard');
        }

        // Essayer de charger le module dashboard
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            try {
                window.dashboardModule.render();
                console.log('[App] Dashboard loaded');
            } catch (error) {
                console.error('[App] Dashboard error:', error);
                this.renderFallbackDashboard();
            }
        } else {
            this.renderFallbackDashboard();
        }
    }

    renderFallbackDashboard() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;

        const user = this.state.user || {};
        const licenseInfo = window.licenseStatus || {};

        pageContent.innerHTML = `
            <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 3rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">
                        <i class="fas fa-tachometer-alt"></i> EmailSortPro Dashboard
                    </h1>
                    <p style="font-size: 1.2rem; color: #6b7280;">
                        Bienvenue ${user.name || user.email || 'Utilisateur'}
                    </p>
                    ${licenseInfo.status === 'trial' ? `
                        <div style="display: inline-block; background: #f59e0b; color: white; padding: 0.5rem 1rem; border-radius: 20px; margin-top: 1rem;">
                            <i class="fas fa-clock"></i> 
                            Période d'essai: ${licenseInfo.daysRemaining || 0} jours restants
                        </div>
                    ` : ''}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div onclick="window.app?.navigateToPage('scanner')" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; text-align: center; transition: transform 0.2s;">
                        <div style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem;">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">Scanner d'emails</h3>
                        <p style="color: #6b7280;">Analysez et triez vos emails automatiquement</p>
                    </div>

                    <div onclick="window.app?.navigateToPage('tasks')" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; text-align: center; transition: transform 0.2s;">
                        <div style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">Gestionnaire de tâches</h3>
                        <p style="color: #6b7280;">Organisez vos tâches et projets</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderFallbackPage(title, message) {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h1>${title}</h1>
                <p style="color: #6b7280; margin: 2rem 0;">${message}</p>
                <button onclick="window.app?.navigateToPage('dashboard')" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                    Retour au dashboard
                </button>
            </div>
        `;
    }

    showErrorPage(message) {
        console.error('[App] Showing error page:', message);

        // Créer la page d'erreur
        const errorPage = document.createElement('div');
        errorPage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
        `;

        errorPage.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 2rem; text-align: center; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Erreur</h1>
                <p style="color: #6b7280; margin-bottom: 2rem;">${message}</p>
                <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                    Recharger la page
                </button>
            </div>
        `;

        document.body.appendChild(errorPage);
    }

    // ==========================================
    // MÉTHODES D'AUTHENTIFICATION
    // ==========================================
    async login() {
        console.log('[App] Login requested...');
        
        if (!window.authService) {
            throw new Error('Authentication service not available');
        }

        try {
            await window.authService.login();
        } catch (error) {
            console.error('[App] Login error:', error);
            if (window.uiManager) {
                window.uiManager.showToast('Erreur de connexion: ' + error.message, 'error');
            }
            throw error;
        }
    }

    async logout() {
        console.log('[App] Logout requested...');

        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }

        try {
            // Déconnexion du service de licence
            if (window.licenseService?.logout) {
                await window.licenseService.logout();
            }

            // Déconnexion du service d'authentification
            if (this.state.provider === 'microsoft' && window.authService) {
                await window.authService.logout();
            } else if (this.state.provider === 'google' && window.googleAuthService) {
                await window.googleAuthService.logout();
            }
        } catch (error) {
            console.error('[App] Logout error:', error);
        }

        // Recharger la page
        window.location.reload();
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================
    initAnalytics() {
        if (window.analyticsManager) {
            try {
                window.analyticsManager.onPageLoad('index');
                console.log('[App] ✅ Analytics initialized');
            } catch (error) {
                console.warn('[App] Analytics error:', error);
            }
        }
    }

    timeout(ms, message = 'Operation timeout') {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error(message)), ms)
        );
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================
    // DIAGNOSTIC
    // ==========================================
    getDiagnostic() {
        return {
            version: '6.0',
            state: this.state,
            config: this.config,
            services: {
                uiManager: !!window.uiManager,
                authService: !!window.authService,
                googleAuthService: !!window.googleAuthService,
                licenseService: !!window.licenseService,
                mailService: !!window.mailService,
                taskManager: !!window.taskManager,
                pageManager: !!window.pageManager,
                dashboardModule: !!window.dashboardModule
            },
            environment: {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                userAgent: navigator.userAgent
            }
        };
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, creating application...');
    
    try {
        // Créer l'instance de l'application
        window.app = new EmailSortProApp();
        
        // Exposer les méthodes globales
        window.handleLogout = () => window.app.logout();
        window.diagnoseApp = () => {
            const diagnostic = window.app.getDiagnostic();
            console.group('🔍 APPLICATION DIAGNOSTIC');
            console.log('Version:', diagnostic.version);
            console.log('State:', diagnostic.state);
            console.log('Config:', diagnostic.config);
            console.log('Services:', diagnostic.services);
            console.log('Environment:', diagnostic.environment);
            console.groupEnd();
            return diagnostic;
        };
        
        console.log('[App] ✅ Application created successfully');
        console.log('[App] 📋 Available commands: diagnoseApp(), handleLogout()');
        
    } catch (error) {
        console.error('[App] Fatal error:', error);
        
        // Affichage d'erreur critique
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1f2937; font-family: system-ui;">
                <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 500px;">
                    <div style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;">❌</div>
                    <h1 style="margin-bottom: 1rem;">Erreur Critique</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">${error.message}</p>
                    <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        Recharger
                    </button>
                </div>
            </div>
        `;
    }
});

console.log('✅ EmailSortProApp v6.0 loaded - Simplified and error-free');
