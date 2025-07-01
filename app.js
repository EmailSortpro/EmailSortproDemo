// app.js - Application EmailSortPro v8.0
// Version compatible avec AuthLicenseManager

class EmailSortProApp {
    constructor() {
        this.state = {
            initialized: false,
            authenticated: false,
            user: null,
            currentPage: 'dashboard',
            error: null
        };

        this.config = {
            domain: window.location.hostname,
            isNetlify: window.location.hostname.includes('netlify.app'),
            timeouts: {
                services: 10000,
                modules: 5000
            }
        };

        console.log('[App] EmailSortPro v8.0 starting...');
        this.initialize();
    }

    // ==========================================
    // INITIALISATION
    // ==========================================
    async initialize() {
        try {
            // 1. Attendre que AuthLicenseManager soit prêt
            await this.waitForAuthManager();

            // 2. Si utilisateur déjà authentifié, démarrer l'app
            if (window.authLicenseManager.isUserAuthenticated()) {
                console.log('[App] Utilisateur déjà authentifié');
                this.state.authenticated = true;
                this.state.user = window.authLicenseManager.getUser();
                await this.startApplication();
            } else {
                console.log('[App] Authentification requise');
                this.showLoginPage();
            }

            // 3. Écouter les événements d'authentification
            this.setupEventListeners();

            this.state.initialized = true;
            console.log('[App] ✅ Application initialisée');

        } catch (error) {
            console.error('[App] Erreur initialisation:', error);
            this.showErrorPage('Erreur d\'initialisation: ' + error.message);
        }
    }

    async waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes

        while (!window.authLicenseManager && attempts < maxAttempts) {
            await this.sleep(100);
            attempts++;
        }

        if (!window.authLicenseManager) {
            throw new Error('AuthLicenseManager non disponible');
        }

        // Attendre que le manager soit initialisé
        attempts = 0;
        while (!window.authLicenseManager.initialized && attempts < maxAttempts) {
            await this.sleep(100);
            attempts++;
        }

        console.log('[App] ✅ AuthLicenseManager prêt');
    }

    setupEventListeners() {
        window.addEventListener('userAuthenticated', (event) => {
            console.log('[App] Événement utilisateur authentifié:', event.detail);
            this.handleUserAuthenticated(event.detail);
        });

        window.addEventListener('licenseCheckFailed', (event) => {
            console.log('[App] Événement échec licence:', event.detail);
            this.handleLicenseError(event.detail);
        });
    }

    async handleUserAuthenticated(detail) {
        this.state.authenticated = true;
        this.state.user = detail.user;
        this.state.error = null;

        if (!this.state.initialized) {
            await this.startApplication();
        }
    }

    handleLicenseError(detail) {
        this.state.authenticated = false;
        this.state.user = null;
        this.state.error = detail.message;

        console.warn('[App] Erreur de licence:', detail);
        // L'AuthLicenseManager gère déjà l'affichage de l'erreur
    }

    // ==========================================
    // DÉMARRAGE DE L'APPLICATION
    // ==========================================
    async startApplication() {
        console.log('[App] Démarrage de l\'application...');

        try {
            // 1. Initialiser les services optionnels
            await this.initializeServices();

            // 2. Initialiser les modules optionnels
            await this.initializeModules();

            // 3. Configurer l'interface
            this.setupUI();

            // 4. L'affichage est déjà géré par showApp() depuis l'index.html

            console.log('[App] ✅ Application démarrée avec succès');

        } catch (error) {
            console.error('[App] Erreur de démarrage:', error);
            this.showErrorPage('Erreur de démarrage: ' + error.message);
        }
    }

    async initializeServices() {
        console.log('[App] Initialisation des services optionnels...');

        const services = [];

        // Services optionnels (pour compatibilité)
        if (window.authService && !window.authService.initialized) {
            services.push(this.initService('Microsoft Auth', () => window.authService.initialize()));
        }

        if (window.googleAuthService && !window.googleAuthService.initialized) {
            services.push(this.initService('Google Auth', () => window.googleAuthService.initialize()));
        }

        if (services.length > 0) {
            await Promise.allSettled(services);
        }

        console.log('[App] ✅ Services initialisés');
    }

    async initService(name, initFunc) {
        try {
            console.log(`[App] Initialisation ${name}...`);
            await Promise.race([
                initFunc(),
                this.timeout(this.config.timeouts.services, `${name} timeout`)
            ]);
            console.log(`[App] ✅ ${name} prêt`);
            return true;
        } catch (error) {
            console.warn(`[App] ⚠️ ${name} échoué:`, error.message);
            return false;
        }
    }

    async initializeModules() {
        console.log('[App] Initialisation des modules optionnels...');

        // Liste des modules optionnels
        const modules = [
            { name: 'UIManager', check: () => window.uiManager },
            { name: 'TaskManager', check: () => window.taskManager?.initialized },
            { name: 'PageManager', check: () => window.pageManager },
            { name: 'DashboardModule', check: () => window.dashboardModule },
            { name: 'MailService', check: () => window.mailService }
        ];

        // Attendre que les modules soient prêts (sans bloquer)
        for (const module of modules) {
            await this.waitForModule(module.name, module.check, false);
        }

        console.log('[App] ✅ Modules initialisés');
    }

    async waitForModule(name, checkFunc, required = true) {
        const startTime = Date.now();
        const timeout = this.config.timeouts.modules;

        while (Date.now() - startTime < timeout) {
            if (checkFunc()) {
                console.log(`[App] ✅ ${name} prêt`);
                return true;
            }
            await this.sleep(100);
        }

        if (required) {
            console.error(`[App] ❌ ${name} requis mais non disponible`);
            return false;
        } else {
            console.warn(`[App] ⚠️ ${name} optionnel non disponible`);
            return false;
        }
    }

    // ==========================================
    // INTERFACE UTILISATEUR
    // ==========================================
    setupUI() {
        console.log('[App] Configuration de l\'interface...');

        // Configurer la navigation
        this.setupNavigation();

        // Configurer le gestionnaire de scroll
        this.setupScrollManager();

        console.log('[App] ✅ Interface configurée');
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
            
            // Dashboard: gestion spéciale du scroll si nécessaire
            if (pageName === 'dashboard') {
                // Logique spécifique au dashboard
            }
        };
    }

    navigateToPage(pageName) {
        console.log('[App] Navigation vers:', pageName);
        
        this.state.currentPage = pageName;
        
        // Mettre à jour la navigation active
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
        
        if (window.setPageMode) {
            window.setPageMode(pageName);
        }
        
        // Utiliser PageManager si disponible
        if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
            window.pageManager.loadPage(pageName);
        } else {
            this.loadPageFallback(pageName);
        }
    }

    loadPageFallback(pageName) {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;

        switch (pageName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'scanner':
                this.loadScanner();
                break;
            case 'emails':
                this.loadEmails();
                break;
            case 'tasks':
                this.loadTasks();
                break;
            case 'settings':
                this.loadSettings();
                break;
            default:
                this.loadDashboard();
        }
    }

    loadDashboard() {
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            window.dashboardModule.render();
        } else {
            this.renderFallbackDashboard();
        }
    }

    loadScanner() {
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            window.minimalScanModule.render();
        } else {
            this.renderFallbackPage('Scanner', 'Module de scan non disponible');
        }
    }

    loadEmails() {
        this.renderFallbackPage('Emails', 'Module emails en cours de développement');
    }

    loadTasks() {
        if (window.tasksView && typeof window.tasksView.render === 'function') {
            window.tasksView.render();
        } else {
            this.renderFallbackPage('Tâches', 'Module tâches non disponible');
        }
    }

    loadSettings() {
        this.renderFallbackPage('Paramètres', 'Module paramètres en cours de développement');
    }

    // ==========================================
    // RENDU DES PAGES
    // ==========================================
    renderFallbackDashboard() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;

        const user = this.state.user || {};

        pageContent.innerHTML = `
            <div class="dashboard-container">
                <div style="text-align: center; margin-bottom: 3rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">
                        <i class="fas fa-tachometer-alt"></i> EmailSortPro Dashboard
                    </h1>
                    <p style="font-size: 1.2rem; color: #6b7280;">
                        Bienvenue ${user.name || user.email || 'Utilisateur'}
                    </p>
                    <div style="display: inline-block; background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 20px; margin-top: 1rem;">
                        <i class="fas fa-check-circle"></i> 
                        Licence ${user.license_status || 'active'}
                    </div>
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

                    <div onclick="window.app?.navigateToPage('emails')" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; text-align: center; transition: transform 0.2s;">
                        <div style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">Gestion des emails</h3>
                        <p style="color: #6b7280;">Consultez et organisez vos emails</p>
                    </div>

                    <div onclick="window.app?.navigateToPage('settings')" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; text-align: center; transition: transform 0.2s;">
                        <div style="font-size: 3rem; color: #8b5cf6; margin-bottom: 1rem;">
                            <i class="fas fa-cog"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">Paramètres</h3>
                        <p style="color: #6b7280;">Configurez votre application</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderFallbackPage(title, message) {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="dashboard-container">
                <div style="text-align: center; padding: 3rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #1f2937;">
                        <i class="fas fa-info-circle"></i> ${title}
                    </h1>
                    <p style="color: #6b7280; margin: 2rem 0; font-size: 1.1rem;">${message}</p>
                    <button onclick="window.app?.navigateToPage('dashboard')" style="
                        background: #3b82f6; 
                        color: white; 
                        border: none; 
                        padding: 0.75rem 1.5rem; 
                        border-radius: 8px; 
                        cursor: pointer;
                        font-size: 1rem;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                        <i class="fas fa-arrow-left"></i> Retour au dashboard
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // GESTION D'AFFICHAGE
    // ==========================================
    showLoginPage() {
        console.log('[App] Affichage de la page de connexion...');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
    }

    showErrorPage(message) {
        console.error('[App] Affichage page d\'erreur:', message);

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        errorPage.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 2rem; text-align: center; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937;">Erreur Application</h1>
                <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 0.75rem 1.5rem; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background 0.2s;
                ">
                    <i class="fas fa-redo"></i> Recharger la page
                </button>
            </div>
        `;

        document.body.appendChild(errorPage);
    }

    // ==========================================
    // MÉTHODES D'AUTHENTIFICATION (Compatibilité)
    // ==========================================
    async login(provider = 'email') {
        console.log('[App] Méthode login appelée (redirection vers AuthLicenseManager)');
        
        if (provider === 'email') {
            // Rediriger vers le formulaire email
            const emailInput = document.getElementById('userEmail');
            if (emailInput) {
                emailInput.focus();
            }
            return;
        }

        // Pour compatibilité avec l'ancien système
        if (provider === 'microsoft' && window.authService) {
            try {
                await window.authService.login();
                const account = window.authService.getAccount();
                if (account?.username) {
                    return await window.loginWithEmail(account.username);
                }
            } catch (error) {
                console.error('[App] Erreur login Microsoft:', error);
                throw error;
            }
        }

        throw new Error('Méthode de connexion non supportée');
    }

    async logout() {
        console.log('[App] Déconnexion demandée...');

        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }

        try {
            // Utiliser AuthLicenseManager pour la déconnexion
            if (window.authLicenseManager) {
                window.authLicenseManager.logout();
            } else {
                // Fallback
                window.location.reload();
            }
        } catch (error) {
            console.error('[App] Erreur déconnexion:', error);
            window.location.reload();
        }
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================
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
            version: '8.0',
            state: this.state,
            config: this.config,
            authManager: window.authLicenseManager?.debug(),
            services: {
                uiManager: !!window.uiManager,
                authService: !!window.authService,
                googleAuthService: !!window.googleAuthService,
                mailService: !!window.mailService,
                taskManager: !!window.taskManager,
                pageManager: !!window.pageManager,
                dashboardModule: !!window.dashboardModule
            },
            environment: {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                userAgent: navigator.userAgent.substring(0, 100)
            },
            timestamp: new Date().toISOString()
        };
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM chargé, création de l\'application...');
    
    try {
        // Créer l'instance de l'application
        window.app = new EmailSortProApp();
        
        // Exposer les méthodes globales pour compatibilité
        window.handleLogout = () => window.app.logout();
        
        window.diagnoseApp = () => {
            const diagnostic = window.app.getDiagnostic();
            console.group('🔍 APPLICATION DIAGNOSTIC v8.0');
            console.log('Version:', diagnostic.version);
            console.log('State:', diagnostic.state);
            console.log('Config:', diagnostic.config);
            console.log('AuthManager:', diagnostic.authManager);
            console.log('Services:', diagnostic.services);
            console.log('Environment:', diagnostic.environment);
            console.groupEnd();
            return diagnostic;
        };
        
        // Fonction pour forcer l'affichage de l'app (compatibilité)
        window.forceShowApp = function() {
            console.log('[App] Forçage de l\'affichage de l\'application...');
            if (window.showApp) {
                window.showApp();
            }
        };
        
        console.log('[App] ✅ Application créée avec succès');
        console.log('[App] 📋 Commandes disponibles:');
        console.log('  - diagnoseApp() : Diagnostic complet');
        console.log('  - handleLogout() : Déconnexion');
        console.log('  - debugAuth() : Debug AuthLicenseManager');
        console.log('  - forceShowApp() : Forcer affichage app');
        
    } catch (error) {
        console.error('[App] Erreur fatale:', error);
        
        // Affichage d'erreur critique
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1f2937; font-family: system-ui;">
                <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 500px;">
                    <div style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;">❌</div>
                    <h1 style="margin-bottom: 1rem; color: #1f2937;">Erreur Critique</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">${error.message}</p>
                    <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        Recharger
                    </button>
                </div>
            </div>
        `;
    }
});

console.log('✅ EmailSortProApp v8.0 chargé - Compatible avec AuthLicenseManager');
