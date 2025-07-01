// app.js - Application EmailSortPro v9.0 SIMPLIFIÉE
// Version qui se connecte d'abord, puis vérifie les licences si disponible

class EmailSortProApp {
    constructor() {
        this.state = {
            initialized: false,
            authenticated: false,
            user: null,
            currentPage: 'dashboard',
            error: null
        };
        
        // Exposer l'état d'initialisation directement sur l'instance
        this.initialized = false;

        console.log('[App] EmailSortPro v9.0 starting...');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('[App] Initialisation...');
            
            // Marquer comme initialisé dès le début pour permettre la vérification externe
            this.state.initialized = true;
            this.initialized = true;
            
            // Vérifier si l'utilisateur est déjà authentifié
            const existingAuth = await this.checkExistingAuthentication();
            
            if (existingAuth) {
                console.log('[App] Utilisateur déjà authentifié:', existingAuth.email);
                this.state.authenticated = true;
                this.state.user = existingAuth;
                
                // Essayer de vérifier la licence si le système est disponible
                const licenseValid = await this.checkLicense(existingAuth.email);
                
                if (licenseValid) {
                    await this.startApplication();
                } else {
                    console.log('[App] Licence invalide ou système non disponible');
                    // Si pas de licence valide mais authentifié, afficher quand même l'app
                    await this.startApplication();
                }
            } else {
                console.log('[App] Pas d\'authentification existante');
                this.showLoginPage();
            }

        } catch (error) {
            console.error('[App] Erreur initialisation:', error);
            this.showErrorPage('Erreur d\'initialisation: ' + error.message);
        }
    }

    async checkExistingAuthentication() {
        console.log('[App] Vérification authentification existante...');
        
        // Attendre que les services soient prêts
        await this.waitForAuthServices();
        
        // Vérifier Microsoft
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account && account.username) {
                console.log('[App] Authentification Microsoft trouvée');
                return {
                    provider: 'microsoft',
                    email: account.username,
                    name: account.name,
                    account: account
                };
            }
        }
        
        // Vérifier Google
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account && account.email) {
                console.log('[App] Authentification Google trouvée');
                return {
                    provider: 'google',
                    email: account.email,
                    name: account.name,
                    account: account
                };
            }
        }
        
        return null;
    }

    async waitForAuthServices() {
        console.log('[App] Attente des services d\'auth...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes
        
        while (attempts < maxAttempts) {
            if ((window.authService || window.googleAuthService)) {
                console.log('[App] Services d\'auth disponibles');
                return;
            }
            await this.sleep(100);
            attempts++;
        }
        
        console.warn('[App] Services d\'auth non disponibles après timeout');
    }

    async checkLicense(email) {
        // Si AuthLicenseManager est disponible, l'utiliser
        if (window.authLicenseManager) {
            try {
                console.log('[App] Vérification licence avec AuthLicenseManager...');
                
                // Attendre que le manager soit initialisé
                if (!window.authLicenseManager.initialized) {
                    await window.authLicenseManager.initialize();
                }
                
                // Vérifier la licence
                const result = await window.authLicenseManager.authenticateWithEmail(email);
                return result && result.valid;
                
            } catch (error) {
                console.warn('[App] Erreur vérification licence:', error);
                // En cas d'erreur, permettre l'accès
                return true;
            }
        } else {
            console.log('[App] Pas de système de licence disponible');
            // Pas de système de licence, autoriser l'accès
            return true;
        }
    }

    async startApplication() {
        console.log('[App] Démarrage de l\'application...');

        try {
            // Configurer l'interface
            this.setupUI();

            // Afficher l'application
            this.showApplication();

            console.log('[App] ✅ Application démarrée avec succès');

        } catch (error) {
            console.error('[App] Erreur de démarrage:', error);
            this.showErrorPage('Erreur de démarrage: ' + error.message);
        }
    }

    setupUI() {
        console.log('[App] Configuration de l\'interface...');

        // Configurer la navigation
        this.setupNavigation();

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

    showLoginPage() {
        console.log('[App] Affichage de la page de connexion...');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
    }

    showApplication() {
        console.log('[App] Affichage de l\'application...');

        // Utiliser la fonction showApp de l'index si disponible
        if (window.showApp) {
            window.showApp();
        } else {
            // Sinon, faire l'affichage manuellement
            const loginPage = document.getElementById('loginPage');
            if (loginPage) {
                loginPage.style.display = 'none';
            }

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

            this.loadDashboard();
        }

        // Mettre à jour l'affichage utilisateur
        this.updateUserDisplay();
    }

    updateUserDisplay() {
        if (window.updateUserDisplay && this.state.user) {
            window.updateUserDisplay(this.state.user);
        }
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

    async login(provider = 'microsoft') {
        console.log('[App] Connexion demandée pour:', provider);
        
        try {
            let authResult = null;
            
            if (provider === 'microsoft' && window.authService) {
                // Se connecter à Microsoft
                await window.authService.login();
                
                // Vérifier si connecté
                if (window.authService.isAuthenticated()) {
                    const account = window.authService.getAccount();
                    if (account && account.username) {
                        authResult = {
                            provider: 'microsoft',
                            email: account.username,
                            name: account.name,
                            account: account
                        };
                    }
                }
            } else if (provider === 'google' && window.googleAuthService) {
                // Se connecter à Google
                await window.googleAuthService.login();
                // Google redirige, donc on ne récupère pas le résultat ici
                return;
            } else {
                throw new Error(`Service d'authentification ${provider} non disponible`);
            }
            
            if (authResult) {
                console.log('[App] Authentification réussie:', authResult.email);
                this.state.authenticated = true;
                this.state.user = authResult;
                
                // Essayer de vérifier la licence
                const licenseValid = await this.checkLicense(authResult.email);
                
                if (licenseValid) {
                    await this.startApplication();
                } else {
                    // Même sans licence valide, afficher l'app
                    await this.startApplication();
                }
            }
            
        } catch (error) {
            console.error('[App] Erreur de connexion:', error);
            throw error;
        }
    }

    async logout() {
        console.log('[App] Déconnexion demandée...');

        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }

        try {
            // Déconnexion du service d'authentification
            if (this.state.user) {
                if (this.state.user.provider === 'microsoft' && window.authService) {
                    await window.authService.logout();
                } else if (this.state.user.provider === 'google' && window.googleAuthService) {
                    await window.googleAuthService.logout();
                }
            }
        } catch (error) {
            console.error('[App] Erreur déconnexion:', error);
        }

        // Recharger la page
        window.location.reload();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Diagnostic
    getDiagnostic() {
        return {
            version: '9.0',
            state: this.state,
            authManager: window.authLicenseManager?.debug ? window.authLicenseManager.debug() : 'Non disponible',
            services: {
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
        
        // Exposer les méthodes globales
        window.handleLogout = () => window.app.logout();
        
        window.diagnoseApp = () => {
            const diagnostic = window.app.getDiagnostic();
            console.group('🔍 APPLICATION DIAGNOSTIC v9.0');
            console.log('Version:', diagnostic.version);
            console.log('State:', diagnostic.state);
            console.log('AuthManager:', diagnostic.authManager);
            console.log('Services:', diagnostic.services);
            console.log('Environment:', diagnostic.environment);
            console.groupEnd();
            return diagnostic;
        };
        
        console.log('[App] ✅ Application créée avec succès');
        console.log('[App] 📋 Commandes disponibles:');
        console.log('  - diagnoseApp() : Diagnostic complet');
        console.log('  - handleLogout() : Déconnexion');
        
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

console.log('✅ EmailSortProApp v9.0 chargé - Se connecte d\'abord, vérifie licence ensuite');
