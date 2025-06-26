// app.js - Application EmailSortPro avec intégration Analytics et système de licences v5.0
// Tracking des emails en clair, filtrage par domaine et gestion des licences

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null; // 'microsoft' ou 'google'
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentPage = 'dashboard';
        this.netlifyDomain = 'coruscating-dodol-f30e8d.netlify.app';
        this.isNetlifyEnv = window.location.hostname.includes('netlify.app');
        this.licenseStatus = null; // Nouveau: état de la licence
        this.licenseCheckPassed = false; // Nouveau: validation licence
        
        console.log('[App] Constructor - EmailSortPro v5.0 with license management...');
        console.log('[App] Environment:', this.isNetlifyEnv ? 'Netlify' : 'Local');
        console.log('[App] Domain:', window.location.hostname);
        
        // Initialiser Analytics Manager immédiatement
        this.initializeAnalytics();
        
        // Initialiser le service de licences
        this.initializeLicenseService();
    }

    // =====================================
    // INITIALISATION DU SERVICE DE LICENCES
    // =====================================
    async initializeLicenseService() {
        console.log('[App] Initializing license service...');
        
        try {
            if (!window.licenseService) {
                console.warn('[App] License service not available yet, will retry...');
                
                // Attendre que le service soit chargé
                let attempts = 0;
                while (!window.licenseService && attempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.licenseService) {
                    console.error('[App] License service not available after 3 seconds');
                    return false;
                }
            }
            
            // Initialiser le service
            const initialized = await window.licenseService.initialize();
            if (initialized) {
                console.log('[App] ✅ License service initialized');
                return true;
            } else {
                console.warn('[App] License service initialization failed');
                return false;
            }
            
        } catch (error) {
            console.error('[App] Error initializing license service:', error);
            return false;
        }
    }

    // =====================================
    // VÉRIFICATION DE LICENCE
    // =====================================
    async checkUserLicense() {
        console.log('[App] Checking user license...');
        
        if (!this.user || !this.user.email) {
            console.warn('[App] No user email available for license check');
            return false;
        }
        
        if (!window.licenseService) {
            console.warn('[App] License service not available, allowing access');
            this.licenseCheckPassed = true;
            return true;
        }
        
        try {
            const userEmail = this.user.email || this.user.mail || this.user.userPrincipalName;
            console.log('[App] Checking license for:', userEmail);
            
            // Vérifier la licence
            const licenseResult = await window.licenseService.checkUserLicense(userEmail);
            this.licenseStatus = licenseResult;
            
            console.log('[App] License check result:', licenseResult);
            
            if (licenseResult.valid) {
                console.log('[App] ✅ License valid:', licenseResult.status);
                this.licenseCheckPassed = true;
                
                // Afficher un message selon le statut
                if (licenseResult.status === 'trial' && licenseResult.daysRemaining <= 7) {
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            `Période d'essai : ${licenseResult.daysRemaining} jours restants`,
                            'warning',
                            10000
                        );
                    }
                }
                
                // Track l'événement de licence valide
                this.trackEvent('license_check_success', {
                    status: licenseResult.status,
                    daysRemaining: licenseResult.daysRemaining,
                    userEmail: userEmail
                });
                
                return true;
            } else {
                console.warn('[App] ❌ License invalid:', licenseResult.status);
                this.licenseCheckPassed = false;
                
                // Track l'événement de licence invalide
                this.trackEvent('license_check_failed', {
                    status: licenseResult.status,
                    reason: licenseResult.message,
                    userEmail: userEmail
                });
                
                // Afficher la page de licence invalide
                this.showLicenseError(licenseResult);
                return false;
            }
            
        } catch (error) {
            console.error('[App] Error checking license:', error);
            
            // En cas d'erreur, permettre l'accès mais avertir
            this.licenseCheckPassed = true;
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Impossible de vérifier la licence. Accès temporaire accordé.',
                    'warning',
                    8000
                );
            }
            
            // Track l'erreur
            this.trackError('license_check_error', {
                message: error.message,
                userEmail: this.user.email
            });
            
            return true;
        }
    }

    // =====================================
    // AFFICHAGE ERREUR DE LICENCE
    // =====================================
    showLicenseError(licenseResult) {
        console.log('[App] Showing license error page...');
        
        this.hideModernLoading();
        
        // Masquer l'app et afficher la page d'erreur
        document.body.classList.remove('app-active');
        document.body.classList.add('license-error-mode');
        
        const pageContent = document.getElementById('pageContent');
        const appHeader = document.querySelector('.app-header');
        const appNav = document.querySelector('.app-nav');
        
        if (appHeader) appHeader.style.display = 'none';
        if (appNav) appNav.style.display = 'none';
        
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.innerHTML = `
                <div class="license-error-container">
                    <div class="license-error-content">
                        <div class="license-icon">
                            <i class="fas fa-key"></i>
                        </div>
                        
                        <h1>Licence ${licenseResult.status === 'expired' ? 'Expirée' : 'Invalide'}</h1>
                        
                        <div class="license-message">
                            <p>${licenseResult.message}</p>
                            ${licenseResult.user ? `
                                <div class="user-info-box">
                                    <p><strong>Utilisateur :</strong> ${licenseResult.user.name || 'Non défini'}</p>
                                    <p><strong>Email :</strong> ${licenseResult.user.email}</p>
                                    <p><strong>Société :</strong> ${licenseResult.user.company?.name || 'Individuel'}</p>
                                    <p><strong>Statut :</strong> ${licenseResult.status}</p>
                                    ${licenseResult.user.license_expires_at ? `
                                        <p><strong>Expiration :</strong> ${new Date(licenseResult.user.license_expires_at).toLocaleDateString('fr-FR')}</p>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="license-actions">
                            ${licenseResult.status === 'expired' ? `
                                <a href="mailto:vianneyhastings@emailsortpro.fr?subject=Renouvellement%20licence%20EmailSortPro&body=Bonjour,%0A%0AJe%20souhaite%20renouveler%20ma%20licence%20EmailSortPro.%0A%0AEmail:%20${this.user.email}%0A%0AMerci" 
                                   class="btn btn-primary">
                                    <i class="fas fa-envelope"></i>
                                    Demander le renouvellement
                                </a>
                            ` : ''}
                            
                            ${licenseResult.status === 'blocked' ? `
                                <a href="mailto:vianneyhastings@emailsortpro.fr?subject=Déblocage%20compte%20EmailSortPro&body=Bonjour,%0A%0AMon%20compte%20EmailSortPro%20est%20bloqué.%0A%0AEmail:%20${this.user.email}%0A%0AMerci" 
                                   class="btn btn-warning">
                                    <i class="fas fa-unlock"></i>
                                    Contacter l'administrateur
                                </a>
                            ` : ''}
                            
                            <button onclick="window.app.logout()" class="btn btn-secondary">
                                <i class="fas fa-sign-out-alt"></i>
                                Se déconnecter
                            </button>
                            
                            <button onclick="window.app.retryLicenseCheck()" class="btn btn-secondary">
                                <i class="fas fa-sync"></i>
                                Réessayer
                            </button>
                        </div>
                        
                        <div class="license-footer">
                            <p>
                                <i class="fas fa-info-circle"></i>
                                Pour toute question, contactez-nous : 
                                <a href="mailto:vianneyhastings@emailsortpro.fr">vianneyhastings@emailsortpro.fr</a>
                            </p>
                        </div>
                    </div>
                </div>
                
                <style>
                    .license-error-mode {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .license-error-container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    
                    .license-error-content {
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                        text-align: center;
                    }
                    
                    .license-icon {
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 30px;
                        font-size: 2rem;
                        color: white;
                    }
                    
                    .license-error-content h1 {
                        color: #1f2937;
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    
                    .license-message {
                        color: #6b7280;
                        font-size: 1.125rem;
                        line-height: 1.6;
                        margin-bottom: 30px;
                    }
                    
                    .user-info-box {
                        background: #f3f4f6;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: left;
                    }
                    
                    .user-info-box p {
                        margin: 8px 0;
                        font-size: 0.95rem;
                    }
                    
                    .license-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 30px;
                    }
                    
                    .license-actions .btn {
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        text-decoration: none;
                        transition: all 0.2s ease;
                        border: none;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    
                    .license-actions .btn-primary {
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                    }
                    
                    .license-actions .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
                    }
                    
                    .license-actions .btn-warning {
                        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                        color: white;
                    }
                    
                    .license-actions .btn-secondary {
                        background: #f3f4f6;
                        color: #4b5563;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .license-actions .btn-secondary:hover {
                        background: #e5e7eb;
                    }
                    
                    .license-footer {
                        color: #9ca3af;
                        font-size: 0.875rem;
                    }
                    
                    .license-footer a {
                        color: #3b82f6;
                        text-decoration: none;
                    }
                    
                    .license-footer a:hover {
                        text-decoration: underline;
                    }
                </style>
            `;
        }
        
        // Track l'affichage de la page d'erreur
        this.trackEvent('license_error_displayed', {
            status: licenseResult.status,
            userEmail: this.user.email
        });
    }

    // =====================================
    // RETRY LICENCE CHECK
    // =====================================
    async retryLicenseCheck() {
        console.log('[App] Retrying license check...');
        
        this.showModernLoading('Vérification de la licence...');
        
        try {
            // Invalider le cache du service de licence
            if (window.licenseService && window.licenseService.invalidateCache) {
                window.licenseService.invalidateCache();
            }
            
            // Revérifier la licence
            const isValid = await this.checkUserLicense();
            
            if (isValid) {
                // Si valide maintenant, afficher l'app
                this.showAppWithTransition();
            }
            
        } catch (error) {
            console.error('[App] Error retrying license check:', error);
            this.hideModernLoading();
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Erreur lors de la vérification. Veuillez réessayer.',
                    'error'
                );
            }
        }
    }

    // =====================================
    // INITIALISATION ANALYTICS AVEC CAPTURE D'EMAIL
    // =====================================
    initializeAnalytics() {
        console.log('[App] Initializing analytics with email tracking...');
        
        try {
            // Vérifier si l'analytics manager est disponible
            if (window.analyticsManager) {
                console.log('[App] ✅ Analytics manager ready');
                
                // Track page load event
                window.analyticsManager.onPageLoad('index');
                
                console.log('[App] ✅ Analytics initialized successfully');
            } else {
                console.warn('[App] Analytics manager not available yet, will retry...');
                
                // Retry après un délai
                setTimeout(() => {
                    if (window.analyticsManager) {
                        console.log('[App] ✅ Analytics manager now available');
                        window.analyticsManager.onPageLoad('index');
                    } else {
                        console.warn('[App] Analytics manager still not available');
                    }
                }, 1000);
            }
        } catch (error) {
            console.warn('[App] Error initializing analytics:', error);
        }
    }

    async init() {
        console.log('[App] Initializing dual provider application with license management...');
        
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

            console.log('[App] Initializing auth services...');
            
            const initTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 30000)
            );
            
            // Initialiser les deux services d'authentification en parallèle
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
            
            // Attendre au moins un service d'auth
            const initResults = await Promise.race([
                Promise.allSettled(authPromises),
                initTimeout
            ]);
            
            console.log('[App] Auth services initialization results:', initResults);
            
            // INITIALISER LES MODULES CRITIQUES
            await this.initializeCriticalModules();
            
            await this.checkAuthenticationStatus();
            
        } catch (error) {
            await this.handleInitializationError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    // =====================================
    // VÉRIFICATION DE L'AUTHENTIFICATION AVEC ANALYTICS ET LICENCES
    // =====================================
    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status for both providers...');
        
        // Vérifier d'abord s'il y a un callback Google à traiter
        const googleCallbackHandled = await this.handleGoogleCallback();
        if (googleCallbackHandled) {
            // Après authentification Google, vérifier la licence
            const licenseValid = await this.checkUserLicense();
            if (licenseValid) {
                this.showAppWithTransition();
            }
            return;
        }
        
        // Vérifier Microsoft d'abord
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account) {
                console.log('[App] Microsoft authentication found, getting user info...');
                try {
                    this.user = await window.authService.getUserInfo();
                    this.user.provider = 'microsoft';
                    this.isAuthenticated = true;
                    this.activeProvider = 'microsoft';
                    
                    // ANALYTICS: Track authentication avec email en clair
                    this.trackUserAuthentication(this.user);
                    
                    console.log('[App] ✅ Microsoft user authenticated:', this.user.displayName || this.user.mail);
                    
                    // NOUVEAU: Vérifier la licence
                    const licenseValid = await this.checkUserLicense();
                    if (licenseValid) {
                        this.showAppWithTransition();
                    }
                    return;
                } catch (userInfoError) {
                    console.error('[App] Error getting Microsoft user info:', userInfoError);
                    if (userInfoError.message.includes('401') || userInfoError.message.includes('403')) {
                        console.log('[App] Microsoft token seems invalid, clearing auth');
                        await window.authService.reset();
                    }
                }
            }
        }
        
        // Vérifier Google ensuite
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account) {
                console.log('[App] Google authentication found, getting user info...');
                try {
                    this.user = await window.googleAuthService.getUserInfo();
                    this.user.provider = 'google';
                    this.isAuthenticated = true;
                    this.activeProvider = 'google';
                    
                    // ANALYTICS: Track authentication avec email en clair
                    this.trackUserAuthentication(this.user);
                    
                    console.log('[App] ✅ Google user authenticated:', this.user.displayName || this.user.email);
                    
                    // NOUVEAU: Vérifier la licence
                    const licenseValid = await this.checkUserLicense();
                    if (licenseValid) {
                        this.showAppWithTransition();
                    }
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

    // =====================================
    // TRACKING ANALYTICS AVEC EMAIL EN CLAIR ET LICENCE
    // =====================================
    trackUserAuthentication(user) {
        console.log('[App] Tracking user authentication for analytics...');
        
        if (!window.analyticsManager || typeof window.analyticsManager.trackAuthentication !== 'function') {
            console.warn('[App] Analytics manager not available for authentication tracking');
            return;
        }
        
        try {
            // Préparer les données utilisateur avec email en clair
            const userInfo = {
                displayName: user.displayName || user.name || 'Utilisateur',
                mail: user.mail || user.email || user.userPrincipalName,
                userPrincipalName: user.userPrincipalName || user.email,
                email: user.email || user.mail || user.userPrincipalName, // Email explicite
                provider: user.provider || 'unknown',
                // Données supplémentaires si disponibles
                homeAccountId: user.homeAccountId,
                localAccountId: user.localAccountId,
                tenantId: user.tenantId,
                // NOUVEAU: Ajouter les infos de licence si disponibles
                licenseStatus: this.licenseStatus?.status || 'unknown',
                licenseValid: this.licenseCheckPassed
            };
            
            console.log('[App] ✅ Tracking authentication with email:', {
                email: userInfo.email,
                name: userInfo.displayName,
                provider: userInfo.provider,
                licenseStatus: userInfo.licenseStatus
            });
            
            // Appeler la méthode de tracking
            window.analyticsManager.trackAuthentication(userInfo.provider, userInfo);
            
            console.log('[App] ✅ Authentication tracked successfully in analytics');
            
        } catch (error) {
            console.warn('[App] Error tracking authentication:', error);
        }
    }

    // =====================================
    // TRACKING D'ÉVÉNEMENTS ANALYTICS AVEC LICENCE
    // =====================================
    trackEvent(eventType, eventData = {}) {
        if (!window.analyticsManager || typeof window.analyticsManager.trackEvent !== 'function') {
            return;
        }
        
        try {
            // Ajouter automatiquement les infos utilisateur et licence si disponibles
            const enrichedData = {
                ...eventData,
                userEmail: this.user?.email || this.user?.mail || 'anonymous',
                userName: this.user?.displayName || this.user?.name || 'Anonymous',
                provider: this.activeProvider || 'unknown',
                licenseStatus: this.licenseStatus?.status || 'unknown',
                licenseValid: this.licenseCheckPassed
            };
            
            window.analyticsManager.trackEvent(eventType, enrichedData);
            console.log('[App] ✅ Event tracked:', eventType, enrichedData);
        } catch (error) {
            console.warn('[App] Error tracking event:', error);
        }
    }

    // =====================================
    // AFFICHAGE DE L'APPLICATION AVEC VÉRIFICATION LICENCE
    // =====================================
    showAppWithTransition() {
        console.log('[App] Showing application with transition - Provider:', this.activeProvider);
        
        // Vérifier que la licence est valide avant d'afficher
        if (!this.licenseCheckPassed) {
            console.warn('[App] Cannot show app - license check not passed');
            return;
        }
        
        // ANALYTICS: Track app display
        this.trackEvent('app_displayed', {
            provider: this.activeProvider,
            userEmail: this.user?.email || this.user?.mail,
            licenseStatus: this.licenseStatus?.status
        });
        
        this.hideModernLoading();
        
        // Retirer le mode login et activer le mode app
        document.body.classList.remove('login-mode', 'license-error-mode');
        document.body.classList.add('app-active');
        console.log('[App] App mode activated');
        
        // Afficher les éléments avec vérification de leur existence
        const loginPage = document.getElementById('loginPage');
        const appHeader = document.querySelector('.app-header');
        const appNav = document.querySelector('.app-nav');
        const pageContent = document.getElementById('pageContent');
        
        if (loginPage) {
            loginPage.style.display = 'none';
            console.log('[App] Login page hidden');
        } else {
            console.warn('[App] Login page element not found');
        }
        
        if (appHeader) {
            appHeader.style.display = 'block';
            appHeader.style.opacity = '1';
            appHeader.style.visibility = 'visible';
            console.log('[App] Header displayed');
        } else {
            console.warn('[App] Header element not found');
        }
        
        if (appNav) {
            appNav.style.display = 'block';
            appNav.style.opacity = '1';
            appNav.style.visibility = 'visible';
            console.log('[App] Navigation displayed');
        } else {
            console.warn('[App] Navigation element not found');
        }
        
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
            pageContent.style.visibility = 'visible';
            console.log('[App] Page content displayed');
        } else {
            console.warn('[App] Page content element not found');
        }
        
        // Mettre à jour l'interface utilisateur avec le provider et la licence
        if (window.uiManager && typeof window.uiManager.updateAuthStatus === 'function') {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Mettre à jour l'affichage utilisateur avec badge provider et statut licence
        if (window.updateUserDisplay && typeof window.updateUserDisplay === 'function') {
            // Enrichir les données utilisateur avec la licence
            const userWithLicense = {
                ...this.user,
                licenseStatus: this.licenseStatus
            };
            window.updateUserDisplay(userWithLicense);
        }
        
        // INITIALISATION DASHBOARD VIA MODULE
        this.currentPage = 'dashboard';
        if (window.setPageMode) {
            window.setPageMode('dashboard');
        }
        
        // Forcer immédiatement pas de scroll pour le dashboard
        document.body.style.overflow = 'hidden';
        document.body.style.overflowY = 'hidden';
        console.log('[App] Dashboard scroll forcé à hidden');
        
        // CHARGER LE DASHBOARD VIA LE MODULE avec vérification robuste
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            console.log('[App] Loading dashboard via dashboardModule...');
            setTimeout(() => {
                try {
                    window.dashboardModule.render();
                    console.log('[App] Dashboard loaded via module for provider:', this.activeProvider);
                } catch (error) {
                    console.error('[App] Dashboard render error:', error);
                    this.showDashboardFallback();
                }
            }, 100);
        } else {
            console.warn('[App] Dashboard module not available, creating fallback...');
            setTimeout(() => {
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
            }, 500);
        }
        
        // Forcer l'affichage avec CSS
        this.forceAppDisplay();
        
        setTimeout(() => {
            window.checkScrollNeeded();
        }, 1000);
        
        console.log(`[App] ✅ Application fully displayed with ${this.activeProvider} provider`);
    }

    // =====================================
    // DASHBOARD FALLBACK AVEC INFO LICENCE
    // =====================================
    showDashboardFallback() {
        console.log('[App] Showing dashboard fallback...');
        
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[App] Cannot show dashboard fallback - pageContent not found');
            return;
        }
        
        // Ajouter les infos de licence au dashboard fallback
        const licenseInfo = this.licenseStatus ? `
            <div class="license-info-dashboard">
                <div class="license-badge ${this.licenseStatus.status}">
                    <i class="fas fa-key"></i>
                    Licence ${this.licenseStatus.status === 'trial' ? 'Essai' : this.licenseStatus.status}
                    ${this.licenseStatus.daysRemaining ? ` - ${this.licenseStatus.daysRemaining} jours restants` : ''}
                </div>
            </div>
        ` : '';
        
        pageContent.innerHTML = `
            <div class="dashboard-fallback">
                <div class="dashboard-header">
                    <h1><i class="fas fa-tachometer-alt"></i> Tableau de bord</h1>
                    <p>Bienvenue dans EmailSortPro</p>
                    ${licenseInfo}
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
                    <div class="provider-info">
                        <div class="provider-badge ${this.activeProvider}">
                            <i class="fas fa-${this.activeProvider === 'microsoft' ? 'envelope' : 'envelope'}"></i>
                            Connecté via ${this.activeProvider === 'microsoft' ? 'Microsoft Outlook' : 'Google Gmail'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('[App] Dashboard fallback displayed');
    }

    // [Les autres méthodes restent identiques...]

    // =====================================
    // MÉTHODES DE CONNEXION AVEC ANALYTICS ET LICENCES
    // =====================================

    // Méthode de connexion unifiée (backward compatibility)
    async login() {
        console.log('[App] Unified login attempted - defaulting to Microsoft...');
        return this.loginMicrosoft();
    }

    // Connexion Microsoft spécifique avec analytics et vérification licence
    async loginMicrosoft() {
        console.log('[App] Microsoft login attempted...');
        
        // ANALYTICS: Track login attempt
        this.trackEvent('login_attempt', { provider: 'microsoft' });
        
        try {
            this.showModernLoading('Connexion à Outlook...');
            
            if (!window.authService) {
                throw new Error('Microsoft AuthService not available');
            }
            
            if (!window.authService.isInitialized) {
                console.log('[App] Microsoft AuthService not initialized, initializing...');
                await window.authService.initialize();
            }
            
            await window.authService.login();
            
            // La vérification de licence se fera dans checkAuthenticationStatus
            
        } catch (error) {
            console.error('[App] Microsoft login error:', error);
            
            // ANALYTICS: Track login error
            this.trackError('microsoft_login_error', {
                message: error.message,
                errorCode: error.errorCode
            });
            
            this.hideModernLoading();
            
            let errorMessage = 'Échec de la connexion Microsoft. Veuillez réessayer.';
            
            if (error.errorCode) {
                const errorCode = error.errorCode;
                if (window.AppConfig.errors && window.AppConfig.errors[errorCode]) {
                    errorMessage = window.AppConfig.errors[errorCode];
                } else {
                    switch (errorCode) {
                        case 'popup_window_error':
                            errorMessage = 'Popup bloqué. Autorisez les popups pour Outlook et réessayez.';
                            break;
                        case 'user_cancelled':
                            errorMessage = 'Connexion Outlook annulée.';
                            break;
                        case 'network_error':
                            errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
                            break;
                        case 'unauthorized_client':
                            errorMessage = 'Configuration incorrecte. Vérifiez votre Azure Client ID.';
                            break;
                        default:
                            errorMessage = `Erreur Microsoft: ${errorCode}`;
                    }
                }
            } else if (error.message.includes('unauthorized_client')) {
                errorMessage = 'Configuration Azure incorrecte. Vérifiez votre Client ID.';
            } else if (error.message.includes('not available')) {
                errorMessage = 'Service Microsoft temporairement indisponible.';
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(errorMessage, 'error', 8000);
            }
            
            throw error;
        }
    }

    // =====================================
    // DIAGNOSTIC ET INFORMATIONS AVEC ANALYTICS ET LICENCES
    // =====================================
    getDiagnosticInfo() {
        return {
            environment: {
                isNetlify: this.isNetlifyEnv,
                domain: window.location.hostname,
                netlifyDomain: this.netlifyDomain,
                userAgent: navigator.userAgent.substring(0, 100)
            },
            app: {
                isAuthenticated: this.isAuthenticated,
                activeProvider: this.activeProvider,
                currentPage: this.currentPage,
                isInitialized: !this.isInitializing,
                initAttempts: this.initializationAttempts,
                // NOUVEAU: Info licence
                licenseCheckPassed: this.licenseCheckPassed,
                licenseStatus: this.licenseStatus
            },
            user: this.user ? {
                name: this.user.displayName || this.user.name,
                email: this.user.mail || this.user.email,
                provider: this.user.provider
            } : null,
            license: {
                serviceAvailable: !!window.licenseService,
                status: this.licenseStatus,
                checkPassed: this.licenseCheckPassed,
                currentUser: window.licenseService?.getCurrentUser ? window.licenseService.getCurrentUser() : null,
                isAdmin: window.licenseService?.isAdmin ? window.licenseService.isAdmin() : false
            },
            analytics: {
                available: !!window.analyticsManager,
                tracking: !!window.analyticsManager && typeof window.analyticsManager.trackEvent === 'function',
                lastSession: window.analyticsManager ? window.analyticsManager.currentSession : null
            },
            services: {
                microsoftAuth: window.authService ? {
                    available: true,
                    isInitialized: window.authService.isInitialized,
                    isAuthenticated: window.authService.isAuthenticated()
                } : { available: false },
                googleAuth: window.googleAuthService ? {
                    available: true,
                    isInitialized: window.googleAuthService.isInitialized,
                    isAuthenticated: window.googleAuthService.isAuthenticated(),
                    method: 'Direct OAuth2 (sans iframe)',
                    avoidsiFrameError: true
                } : { available: false },
                licenseService: window.licenseService ? {
                    available: true,
                    isInitialized: window.licenseService.initialized,
                    hasSupabase: !!window.licenseService.supabase,
                    cacheActive: !!window.licenseService.licenseCache
                } : { available: false },
                mailService: window.mailService ? {
                    available: true,
                    hasGetEmails: typeof window.mailService.getEmails === 'function',
                    isFallback: window.mailService._isFallback || false
                } : { available: false },
                pageManager: window.pageManager ? {
                    available: true,
                    hasLoadPage: typeof window.pageManager.loadPage === 'function'
                } : { available: false },
                taskManager: window.taskManager ? {
                    available: true,
                    isInitialized: window.taskManager.initialized,
                    taskCount: window.taskManager.getAllTasks ? window.taskManager.getAllTasks().length : 'unknown'
                } : { available: false },
                dashboardModule: window.dashboardModule ? {
                    available: true,
                    hasRender: typeof window.dashboardModule.render === 'function'
                } : { available: false },
                scanModule: window.minimalScanModule ? {
                    available: true,
                    hasRender: typeof window.minimalScanModule.render === 'function',
                    isFallback: window.minimalScanModule._isFallback || false
                } : { available: false },
                uiManager: window.uiManager ? {
                    available: true,
                    hasUpdateAuthStatus: typeof window.uiManager.updateAuthStatus === 'function'
                } : { available: false },
                analyticsManager: window.analyticsManager ? {
                    available: true,
                    hasTrackEvent: typeof window.analyticsManager.trackEvent === 'function',
                    hasTrackAuth: typeof window.analyticsManager.trackAuthentication === 'function',
                    hasOnError: typeof window.analyticsManager.onError === 'function'
                } : { available: false }
            },
            dom: {
                loginPage: !!document.getElementById('loginPage'),
                pageContent: !!document.getElementById('pageContent'),
                appHeader: !!document.querySelector('.app-header'),
                appNav: !!document.querySelector('.app-nav'),
                loadingOverlay: !!document.getElementById('loadingOverlay')
            },
            sessionData: {
                googleCallback: !!sessionStorage.getItem('google_callback_data'),
                googleToken: !!localStorage.getItem('google_token_emailsortpro'),
                directToken: !!sessionStorage.getItem('direct_token_data'),
                googleOAuthState: !!sessionStorage.getItem('google_oauth_state'),
                // NOUVEAU: Cache licence
                licenseCache: window.licenseService?.licenseCache ? 'Active' : 'None'
            },
            errors: {
                lastGlobalError: window.lastGlobalError || null,
                lastPromiseRejection: window.lastPromiseRejection || null
            }
        };
    }

    // Méthode de test pour vérifier les services critiques avec analytics et licences
    testCriticalServices() {
        console.group('🧪 Test des services critiques avec analytics et licences');
        
        const tests = [];
        
        // Test MailService
        try {
            if (window.mailService && typeof window.mailService.getEmails === 'function') {
                tests.push({ service: 'MailService', status: '✅ OK', details: 'getEmails disponible' });
            } else {
                tests.push({ service: 'MailService', status: '⚠️ FALLBACK', details: 'Service en mode dégradé' });
            }
        } catch (error) {
            tests.push({ service: 'MailService', status: '❌ ERROR', details: error.message });
        }
        
        // Test LicenseService - NOUVEAU
        try {
            if (window.licenseService && window.licenseService.initialized) {
                const currentUser = window.licenseService.getCurrentUser();
                tests.push({ 
                    service: 'LicenseService', 
                    status: '✅ OK', 
                    details: currentUser ? `User: ${currentUser.email}` : 'Initialisé'
                });
            } else {
                tests.push({ service: 'LicenseService', status: '⚠️ WARNING', details: 'Non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'LicenseService', status: '❌ ERROR', details: error.message });
        }
        
        // Test PageManager
        try {
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                tests.push({ service: 'PageManager', status: '✅ OK', details: 'loadPage disponible' });
            } else {
                tests.push({ service: 'PageManager', status: '❌ ERROR', details: 'loadPage non disponible' });
            }
        } catch (error) {
            tests.push({ service: 'PageManager', status: '❌ ERROR', details: error.message });
        }
        
        // Test TaskManager
        try {
            if (window.taskManager && window.taskManager.initialized) {
                tests.push({ service: 'TaskManager', status: '✅ OK', details: `${window.taskManager.getAllTasks().length} tâches` });
            } else {
                tests.push({ service: 'TaskManager', status: '❌ ERROR', details: 'Non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'TaskManager', status: '❌ ERROR', details: error.message });
        }
        
        // Test Auth Services
        try {
            if (window.authService && window.authService.isInitialized) {
                tests.push({ service: 'Microsoft Auth', status: '✅ OK', details: 'Initialisé' });
            } else {
                tests.push({ service: 'Microsoft Auth', status: '⚠️ WARNING', details: 'Non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'Microsoft Auth', status: '❌ ERROR', details: error.message });
        }
        
        try {
            if (window.googleAuthService && window.googleAuthService.isInitialized) {
                tests.push({ service: 'Google Auth', status: '✅ OK', details: 'Initialisé' });
            } else {
                tests.push({ service: 'Google Auth', status: '⚠️ WARNING', details: 'Non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'Google Auth', status: '❌ ERROR', details: error.message });
        }
        
        // Test Analytics Manager
        try {
            if (window.analyticsManager && typeof window.analyticsManager.trackEvent === 'function') {
                tests.push({ service: 'Analytics Manager', status: '✅ OK', details: 'Tracking disponible' });
            } else {
                tests.push({ service: 'Analytics Manager', status: '⚠️ WARNING', details: 'Non disponible' });
            }
        } catch (error) {
            tests.push({ service: 'Analytics Manager', status: '❌ ERROR', details: error.message });
        }
        
        tests.forEach(test => {
            console.log(`${test.status} ${test.service}: ${test.details}`);
        });
        
        console.groupEnd();
        return tests;
    }

    // =====================================
    // MÉTHODES IDENTIQUES DE LA VERSION PRÉCÉDENTE
    // =====================================
    
    // [Toutes les autres méthodes restent identiques à la version précédente]
    // Inclure ici toutes les méthodes non modifiées comme :
    // - initializeCriticalModules
    // - ensureTaskManagerReady
    // - ensurePageManagerReady
    // - ensureTasksViewReady
    // - ensureDashboardModuleReady
    // - ensureMailServiceReady
    // - ensureScanModulesReady
    // - createMailServiceFallback
    // - createScanModuleFallback
    // - createEmailScannerFallback
    // - initializeScrollManager
    // - bindModuleMethods
    // - checkPrerequisites
    // - handleGoogleCallback
    // - handleInitializationError
    // - setupEventListeners
    // - logout
    // - forceCleanup
    // - showLogin
    // - forceAppDisplay
    // - showModernLoading
    // - hideModernLoading
    // - showError
    // - showConfigurationError
    // etc...

    // [COPIER ICI TOUTES LES MÉTHODES NON MODIFIÉES DE LA VERSION PRÉCÉDENTE]
}

// =====================================
// FONCTIONS GLOBALES D'URGENCE AVEC ANALYTICS ET LICENCES
// =====================================

// [COPIER ICI TOUTES LES FONCTIONS GLOBALES DE LA VERSION PRÉCÉDENTE]
// Incluant :
// - window.emergencyReset
// - window.forceShowApp
// - window.testServices
// - window.repairMailService
// - window.repairScanModule
// - window.checkServices
// - window.diagnoseApp
// - window.netlifyHelpers
// - window.analyticsHelpers
// - window.licenseHelpers (NOUVEAU)

// NOUVEAU: Helpers pour les licences
window.licenseHelpers = {
    // Vérifier la licence d'un utilisateur
    checkLicense: async (email) => {
        if (!window.licenseService) {
            console.warn('[License] License service not available');
            return null;
        }
        
        try {
            return await window.licenseService.checkUserLicense(email);
        } catch (error) {
            console.error('[License] Error checking license:', error);
            return null;
        }
    },
    
    // Obtenir les infos de licence actuelles
    getCurrentLicense: () => {
        if (!window.app) return null;
        return window.app.licenseStatus;
    },
    
    // Forcer la revérification de licence
    forceRecheck: async () => {
        if (!window.app) return false;
        
        if (window.licenseService && window.licenseService.invalidateCache) {
            window.licenseService.invalidateCache();
        }
        
        return await window.app.retryLicenseCheck();
    },
    
    // Obtenir les utilisateurs de la société (admin seulement)
    getCompanyUsers: async () => {
        if (!window.licenseService || !window.licenseService.isAdmin()) {
            console.warn('[License] Admin rights required');
            return [];
        }
        
        try {
            return await window.licenseService.getCompanyUsers();
        } catch (error) {
            console.error('[License] Error getting company users:', error);
            return [];
        }
    },
    
    // Debug info
    getDebugInfo: () => {
        return {
            serviceAvailable: !!window.licenseService,
            serviceInitialized: window.licenseService?.initialized || false,
            currentUser: window.licenseService?.getCurrentUser ? window.licenseService.getCurrentUser() : null,
            isAdmin: window.licenseService?.isAdmin ? window.licenseService.isAdmin() : false,
            isSuperAdmin: window.licenseService?.isSuperAdmin ? window.licenseService.isSuperAdmin() : false,
            appLicenseStatus: window.app?.licenseStatus || null,
            licenseCheckPassed: window.app?.licenseCheckPassed || false
        };
    }
};

// =====================================
// GESTION DES ERREURS GLOBALES AVEC ANALYTICS ET LICENCES
// =====================================

// [COPIER ICI LA GESTION DES ERREURS DE LA VERSION PRÉCÉDENTE]

// =====================================
// INITIALISATION PRINCIPALE AVEC ANALYTICS ET LICENCES
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, creating dual provider app instance with analytics and license management...');
    
    try {
        document.body.classList.add('login-mode');
        
        window.app = new App();
        
        const waitForServices = (attempts = 0) => {
            const maxAttempts = 50;
            
            try {
                if (checkServicesReady()) {
                    console.log('[App] All required services ready, initializing dual provider app with analytics and licenses...');
                    
                    setTimeout(() => {
                        try {
                            window.app.init();
                        } catch (initError) {
                            console.error('[App] Error during app initialization:', initError);
                            if (window.app) {
                                window.app.showError('Erreur lors de l\'initialisation: ' + initError.message);
                            }
                        }
                    }, 100);
                } else if (attempts < maxAttempts) {
                    console.log(`[App] Waiting for services... (${attempts + 1}/${maxAttempts})`);
                    setTimeout(() => waitForServices(attempts + 1), 100);
                } else {
                    console.error('[App] Timeout waiting for services, initializing anyway...');
                    setTimeout(() => {
                        try {
                            window.app.init();
                        } catch (fallbackError) {
                            console.error('[App] Fallback initialization failed:', fallbackError);
                            if (window.app) {
                                window.app.showError('Échec de l\'initialisation de secours: ' + fallbackError.message);
                            }
                        }
                    }, 100);
                }
            } catch (serviceCheckError) {
                console.error('[App] Error checking services:', serviceCheckError);
                setTimeout(() => waitForServices(attempts + 1), 200);
            }
        };
        
        waitForServices();
        
    } catch (domError) {
        console.error('[App] Critical error during DOM initialization:', domError);
        
        // Track error si analytics disponible
        if (window.analyticsManager && window.analyticsManager.onError) {
            try {
                window.analyticsManager.onError('dom_init_error', {
                    message: domError.message,
                    stack: domError.stack
                });
            } catch (analyticsError) {
                console.warn('[App] Analytics error during DOM error tracking:', analyticsError);
            }
        }
        
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

// [COPIER ICI LES EVENT LISTENERS window.addEventListener DE LA VERSION PRÉCÉDENTE]

// =====================================
// VÉRIFICATION DES SERVICES AVEC LICENCES
// =====================================
function checkServicesReady() {
    const requiredServices = ['uiManager'];
    const authServices = ['authService', 'googleAuthService'];
    const optionalServices = ['mailService', 'emailScanner', 'categoryManager', 'dashboardModule', 'analyticsManager', 'licenseService'];
    
    try {
        const missingRequired = requiredServices.filter(service => !window[service]);
        const availableAuthServices = authServices.filter(service => window[service]);
        const missingOptional = optionalServices.filter(service => !window[service]);
        
        if (missingRequired.length > 0) {
            console.error('[App] Missing REQUIRED services:', missingRequired);
            return false;
        }
        
        if (availableAuthServices.length === 0) {
            console.error('[App] No authentication services available:', authServices);
            return false;
        }
        
        if (missingOptional.length > 0) {
            console.warn('[App] Missing optional services:', missingOptional);
        }
        
        if (!window.AppConfig) {
            console.error('[App] Missing AppConfig');
            return false;
        }
        
        console.log('[App] Available auth services:', availableAuthServices);
        console.log('[App] Analytics available:', !!window.analyticsManager);
        console.log('[App] License service available:', !!window.licenseService);
        return true;
    } catch (error) {
        console.error('[App] Error checking services:', error);
        return false;
    }
}

console.log('✅ App v5.0 loaded - DUAL PROVIDER (Microsoft + Google) + ANALYTICS + LICENSE MANAGEMENT');
console.log('🔧 Fonctions globales disponibles: window.diagnoseApp(), window.testServices(), window.repairMailService(), window.repairScanModule()');
console.log('🌐 Helpers Netlify: window.netlifyHelpers');
console.log('📊 Helpers Analytics: window.analyticsHelpers');
console.log('🔑 Helpers License: window.licenseHelpers');
console.log('📈 Analytics tracking: Email en clair, filtrage par domaine, société et statut de licence');
console.log('🔐 License management: Vérification automatique, période d\'essai, gestion entreprise');
