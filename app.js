// app.js - Application principale EmailSortPro
// Gère l'initialisation de l'application, l'authentification et la navigation

class EmailSortProApp {
    constructor() {
        this.initialized = false;
        this.currentProvider = null;
        this.authCheckInterval = null;
        this.licenseCheckInterval = null; // AJOUT : pour surveiller la licence
        
        console.log('[App] EmailSortPro initialized');
    }

    async initialize() {
        console.log('[App] Starting initialization...');
        
        try {
            // Initialiser l'UI Manager en premier
            if (!window.uiManager) {
                console.error('[App] UIManager not found!');
                return;
            }

            // AJOUT : Initialiser le système de licence si disponible
            if (window.licenseService || window.supabaseConfig) {
                await this.initializeLicenseSystem();
            }

            // Vérifier l'authentification existante
            const isAuthenticated = await this.checkExistingAuth();
            
            if (isAuthenticated) {
                console.log('[App] User already authenticated');
                
                // AJOUT : Vérifier la licence si le service est disponible
                if (window.licenseService && window.licenseService.initialized) {
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) {
                        await this.handleLicenseError();
                        return;
                    }
                    this.startLicenseMonitoring();
                }
                
                await this.showApplication();
            } else {
                console.log('[App] No existing authentication found');
                this.showLoginPage();
            }

            // Configurer les gestionnaires d'événements
            this.setupEventHandlers();
            
            // Démarrer la vérification périodique de l'authentification
            this.startAuthMonitoring();

            this.initialized = true;
            console.log('[App] ✅ Initialization complete');

        } catch (error) {
            console.error('[App] Initialization error:', error);
            
            // AJOUT : Gérer les erreurs de licence
            if (error.message && error.message.includes('LICENSE_')) {
                await this.handleLicenseError(error.message);
            } else {
                window.uiManager.showToast('Erreur d\'initialisation: ' + error.message, 'error');
            }
        }
    }

    // AJOUT : Méthode pour initialiser le système de licence
    async initializeLicenseSystem() {
        try {
            if (window.supabaseConfig && !window.supabaseConfig.initialized) {
                console.log('[App] Initializing Supabase...');
                await window.initializeSupabaseConfig();
            }

            if (window.licenseService && !window.licenseService.initialized) {
                console.log('[App] Initializing LicenseService...');
                await window.licenseService.initialize();
            }
        } catch (error) {
            console.error('[App] License system initialization error:', error);
            // Continuer sans système de licence
        }
    }

    async checkExistingAuth() {
        try {
            // Vérifier Microsoft Auth
            if (window.authService) {
                // NE PAS réinitialiser si déjà fait
                if (!window.authService.initialized) {
                    await window.authService.initialize();
                }
                
                if (window.authService.isAuthenticated()) {
                    this.currentProvider = 'microsoft';
                    
                    // Mettre à jour l'affichage utilisateur
                    const user = window.authService.getUser();
                    if (user && window.updateUserDisplay) {
                        window.updateUserDisplay(user);
                    }
                    
                    return true;
                }
            }

            // Vérifier Google Auth
            if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
                this.currentProvider = 'google';
                
                const user = await window.googleAuthService.getUser();
                if (user && window.updateUserDisplay) {
                    window.updateUserDisplay(user);
                }
                
                return true;
            }

            return false;

        } catch (error) {
            console.error('[App] Error checking authentication:', error);
            
            // AJOUT : Propager les erreurs de licence
            if (error.message && error.message.includes('LICENSE_')) {
                throw error;
            }
            
            return false;
        }
    }

    // AJOUT : Méthode pour vérifier la licence
    async verifyUserLicense() {
        try {
            if (!window.licenseService || !window.licenseService.initialized) {
                return true; // Permettre l'accès si pas de service
            }

            let userEmail = null;
            
            if (this.currentProvider === 'microsoft' && window.authService) {
                const user = window.authService.getUser();
                userEmail = user?.email;
            } else if (this.currentProvider === 'google' && window.googleAuthService) {
                const user = await window.googleAuthService.getUser();
                userEmail = user?.email;
            }

            if (!userEmail) {
                return true; // Permettre l'accès si pas d'email
            }

            const licenseStatus = await window.licenseService.checkLicenseStatus(userEmail);
            return licenseStatus.valid;

        } catch (error) {
            console.error('[App] License verification error:', error);
            return true; // Permettre l'accès en cas d'erreur
        }
    }

    // AJOUT : Méthode pour gérer les erreurs de licence
    async handleLicenseError(errorType = 'LICENSE_EXPIRED') {
        console.log('[App] Handling license error:', errorType);
        
        if (errorType === 'LICENSE_EXPIRED') {
            this.showLicenseExpiredOverlay();
        } else if (errorType === 'LICENSE_BLOCKED') {
            this.showLicenseBlockedOverlay();
        }
        
        // Arrêter les vérifications
        if (this.licenseCheckInterval) {
            clearInterval(this.licenseCheckInterval);
        }
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        setTimeout(() => {
            this.logout();
        }, 2000);
    }

    // AJOUT : Afficher overlay licence expirée
    showLicenseExpiredOverlay() {
        const existingOverlay = document.getElementById('license-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'license-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            backdrop-filter: blur(5px);
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: #fee2e2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                ">
                    <i class="fas fa-clock" style="font-size: 36px; color: #dc2626;"></i>
                </div>
                
                <h2 style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 16px;
                ">Licence Expirée</h2>
                
                <p style="
                    font-size: 16px;
                    color: #6b7280;
                    margin-bottom: 32px;
                    line-height: 1.5;
                ">
                    Votre période d'essai ou votre licence a expiré. 
                    Pour continuer à utiliser EmailSortPro, veuillez contacter le support.
                </p>
                
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button onclick="window.location.href='mailto:vianneyhastings@emailsortpro.fr?subject=Renouvellement licence'" style="
                        background: #4F46E5;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        <i class="fas fa-envelope"></i> Contacter le support
                    </button>
                    
                    <button onclick="window.app.logout()" style="
                        background: #f3f4f6;
                        color: #6b7280;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // AJOUT : Afficher overlay licence bloquée
    showLicenseBlockedOverlay() {
        const existingOverlay = document.getElementById('license-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'license-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: #fef2f2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                ">
                    <i class="fas fa-ban" style="font-size: 36px; color: #dc2626;"></i>
                </div>
                
                <h2 style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 16px;
                ">Accès Bloqué</h2>
                
                <p style="
                    font-size: 16px;
                    color: #6b7280;
                    margin-bottom: 32px;
                ">
                    Votre accès a été temporairement suspendu. 
                    Veuillez contacter le support.
                </p>
                
                <button onclick="window.location.href='mailto:support@emailsortpro.fr'" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    <i class="fas fa-envelope"></i> Contacter le support
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // AJOUT : Démarrer la surveillance de licence
    startLicenseMonitoring() {
        if (!window.licenseService) return;
        
        this.licenseCheckInterval = setInterval(async () => {
            const licenseValid = await this.verifyUserLicense();
            if (!licenseValid) {
                console.log('[App] License no longer valid');
                await this.handleLicenseError();
            }
        }, 5 * 60 * 1000); // Toutes les 5 minutes
    }

    async login() {
        try {
            console.log('[App] Starting Microsoft login...');
            
            if (!window.authService) {
                throw new Error('AuthService not available');
            }

            // IMPORTANT : Attendre que l'app soit initialisée
            if (!this.initialized) {
                console.log('[App] Waiting for initialization...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const result = await window.authService.login();
            
            if (result) {
                this.currentProvider = 'microsoft';
                
                // AJOUT : Vérifier la licence si disponible
                if (window.licenseService && window.licenseService.initialized) {
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) {
                        await this.handleLicenseError();
                        return;
                    }
                    this.startLicenseMonitoring();
                }
                
                await this.showApplication();
            }

        } catch (error) {
            console.error('[App] Login error:', error);
            
            // AJOUT : Gérer les erreurs de licence
            if (error.message && error.message.includes('LICENSE_')) {
                await this.handleLicenseError(error.message);
            } else {
                window.uiManager.showToast('Erreur de connexion: ' + error.message, 'error');
            }
        }
    }

    async logout() {
        try {
            console.log('[App] Starting logout process...');
            
            // Arrêter les vérifications
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                this.authCheckInterval = null;
            }
            // AJOUT : Arrêter la surveillance de licence
            if (this.licenseCheckInterval) {
                clearInterval(this.licenseCheckInterval);
                this.licenseCheckInterval = null;
            }

            // Déconnexion selon le provider
            if (this.currentProvider === 'microsoft' && window.authService) {
                await window.authService.logout();
            } else if (this.currentProvider === 'google' && window.googleAuthService) {
                await window.googleAuthService.logout();
            }

            // Nettoyer l'état
            this.currentProvider = null;
            
            // Recharger la page pour un état propre
            window.location.reload();

        } catch (error) {
            console.error('[App] Logout error:', error);
            // Forcer le rechargement même en cas d'erreur
            window.location.reload();
        }
    }

    async showApplication() {
        console.log('[App] Showing application interface...');
        
        // Masquer la page de login et afficher l'app
        if (window.showApp) {
            window.showApp();
        }

        // Initialiser les composants de l'application
        await this.initializeAppComponents();
        
        // Tracker l'événement
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('app_loaded', {
                provider: this.currentProvider
            });
        }
    }

    showLoginPage() {
        console.log('[App] Showing login page...');
        
        // S'assurer que la page de login est visible
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }

        // Masquer l'interface de l'app
        document.body.classList.remove('app-active');
        document.body.classList.add('login-mode');
    }

    async initializeAppComponents() {
        console.log('[App] Initializing app components...');
        
        try {
            // Initialiser MailService
            if (window.mailService && !window.mailService.initialized) {
                await window.mailService.initialize();
            }

            // Initialiser les gestionnaires
            const managers = [
                'categoryManager',
                'taskManager',
                'pageManager'
            ];

            for (const manager of managers) {
                if (window[manager] && typeof window[manager].initialize === 'function') {
                    console.log(`[App] Initializing ${manager}...`);
                    try {
                        await window[manager].initialize();
                    } catch (error) {
                        console.error(`[App] Error initializing ${manager}:`, error);
                    }
                }
            }

            // Initialiser le module de démarrage si présent
            if (window.startScanModule && typeof window.startScanModule.initialize === 'function') {
                await window.startScanModule.initialize();
            }

            console.log('[App] ✅ All components initialized');

        } catch (error) {
            console.error('[App] Component initialization error:', error);
        }
    }

    setupEventHandlers() {
        // Gérer les erreurs globales
        window.addEventListener('error', (event) => {
            console.error('[App] Global error:', event.error);
            
            // Éviter d'afficher les erreurs de script externes
            if (event.filename && !event.filename.includes(window.location.hostname)) {
                event.preventDefault();
                return;
            }
        });

        // Gérer les promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled promise rejection:', event.reason);
            
            // AJOUT : Gérer les erreurs de licence
            if (event.reason && event.reason.message && event.reason.message.includes('LICENSE_')) {
                event.preventDefault();
                this.handleLicenseError(event.reason.message);
            }
        });

        // Gérer la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                // AJOUT : Vérifier la licence quand l'utilisateur revient
                if (this.licenseCheckInterval && window.licenseService) {
                    this.verifyUserLicense();
                }
            }
        });

        // Gérer le resize de la fenêtre
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.checkScrollNeeded();
            }, 150);
        });
    }

    startAuthMonitoring() {
        // Vérifier l'authentification toutes les 30 minutes
        this.authCheckInterval = setInterval(async () => {
            console.log('[App] Periodic auth check...');
            
            const isAuthenticated = await this.checkExistingAuth();
            if (!isAuthenticated && this.initialized) {
                console.log('[App] Authentication lost, redirecting to login...');
                this.showLoginPage();
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    // Méthode pour vérifier le scroll
    checkScrollNeeded() {
        const body = document.body;
        const html = document.documentElement;
        const windowHeight = window.innerHeight;
        const documentHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
        );

        if (documentHeight > windowHeight) {
            body.style.overflowY = 'auto';
        } else {
            body.style.overflowY = 'hidden';
        }
    }

    // Méthodes de debug
    getDebugInfo() {
        return {
            initialized: this.initialized,
            currentProvider: this.currentProvider,
            authenticated: this.currentProvider !== null,
            services: {
                authService: !!window.authService,
                googleAuthService: !!window.googleAuthService,
                licenseService: !!window.licenseService,
                mailService: !!window.mailService,
                uiManager: !!window.uiManager
            },
            intervals: {
                authCheck: !!this.authCheckInterval,
                licenseCheck: !!this.licenseCheckInterval
            }
        };
    }
}

// Créer l'instance de l'application
window.app = new EmailSortProApp();

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app.initialize();
    });
} else {
    // DOM déjà chargé
    window.app.initialize();
}

// Exposer les méthodes globales pour la compatibilité
window.checkScrollNeeded = () => window.app.checkScrollNeeded();

console.log('[App] ✅ EmailSortPro loaded');
