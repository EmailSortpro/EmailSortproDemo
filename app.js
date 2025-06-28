console.log('[App] ✅ Scroll manager initialized');
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
        
        // Bind autres modules...
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
    }

    checkPrerequisites() {
        // Vérification spéciale pour Netlify
        if (this.isNetlifyEnv) {
            console.log('[App] Running in Netlify environment, adjusting checks...');
        }

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

        if (!window.authService && !window.googleAuthService) {
            console.error('[App] No authentication service available');
            this.showError('Authentication service not available. Please refresh the page.');
            return false;
        }

        return true;
    }

    // =====================================
    // GESTION DU CALLBACK GOOGLE OAuth2
    // =====================================
    async handleGoogleCallback() {
        console.log('[App] Handling Google OAuth2 callback...');
        
        try {
            // Vérifier s'il y a des données de callback Google
            const callbackDataStr = sessionStorage.getItem('google_callback_data');
            if (!callbackDataStr) {
                console.log('[App] No Google callback data found');
                return false;
            }
            
            const callbackData = JSON.parse(callbackDataStr);
            console.log('[App] Found Google callback data:', callbackData);
            
            // Nettoyer les données de callback
            sessionStorage.removeItem('google_callback_data');
            
            // Traiter le callback avec le service Google
            const urlParams = new URLSearchParams();
            urlParams.set('code', callbackData.code);
            urlParams.set('state', callbackData.state);
            
            const success = await window.googleAuthService.handleOAuthCallback(urlParams);
            
            if (success) {
                console.log('[App] ✅ Google callback handled successfully');
                
                // Obtenir les informations utilisateur
                this.user = await window.googleAuthService.getUserInfo();
                this.user.provider = 'google';
                this.isAuthenticated = true;
                this.activeProvider = 'google';
                
                // VÉRIFICATION DE LICENCE SI LE SERVICE EST DISPONIBLE
                if (window.licenseService) {
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) {
                        return false;
                    }
                } else {
                    console.warn('[App] License service not available, skipping license check');
                }
                
                // ANALYTICS: Track authentication
                this.trackUserAuthentication(this.user);
                
                console.log('[App] ✅ Google user authenticated:', this.user.displayName || this.user.email);
                this.showAppWithTransition();
                return true;
            } else {
                throw new Error('Google callback processing failed');
            }
            
        } catch (error) {
            console.error('[App] ❌ Error handling Google callback:', error);
            
            // ANALYTICS: Track error
            this.trackError('google_callback_error', {
                message: error.message
            });
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Erreur de traitement Google: ' + error.message,
                    'error',
                    8000
                );
            }
            
            return false;
        }
    }

    async handleInitializationError(error) {
        console.error('[App] Initialization error:', error);
        
        // ANALYTICS: Track initialization error
        this.trackError('app_init_error', {
            message: error.message,
            attempt: this.initializationAttempts
        });
        
        if (error.message.includes('unauthorized_client')) {
            this.showConfigurationError([
                'Configuration Azure incorrecte',
                'Vérifiez votre Client ID dans la configuration',
                'Consultez la documentation Azure App Registration'
            ]);
            return;
        }
        
        if (error.message.includes('Configuration invalid')) {
            this.showConfigurationError(['Configuration invalide - vérifiez la configuration']);
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
        
        this.showError('Failed to initialize the application. Please check the configuration and refresh the page.');
    }

    // =====================================
    // MÉTHODES DE CONNEXION AVEC VÉRIFICATION DE LICENCE
    // =====================================

    // Méthode de connexion unifiée (backward compatibility)
    async login() {
        console.log('[App] Unified login attempted - defaulting to Microsoft...');
        return this.loginMicrosoft();
    }

    // Connexion Microsoft spécifique avec analytics
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
            
            // Note: La vérification de licence se fera automatiquement
            // dans checkAuthenticationStatus() après le rechargement de la page
            
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

    async logout() {
        console.log('[App] Logout attempted...');
        
        // ANALYTICS: Track logout attempt
        this.trackEvent('logout_attempt', { provider: this.activeProvider });
        
        try {
            const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
            if (!confirmed) return;
            
            this.showModernLoading('Déconnexion...');
            
            // Déconnexion selon le provider actif
            if (this.activeProvider === 'microsoft' && window.authService) {
                await window.authService.logout();
            } else if (this.activeProvider === 'google' && window.googleAuthService) {
                await window.googleAuthService.logout();
            } else {
                // Fallback: essayer les deux
                if (window.authService) {
                    try { await window.authService.logout(); } catch (e) {
                        console.warn('[App] Microsoft logout error:', e);
                    }
                }
                if (window.googleAuthService) {
                    try { await window.googleAuthService.logout(); } catch (e) {
                        console.warn('[App] Google logout error:', e);
                    }
                }
                this.forceCleanup();
            }
            
        } catch (error) {
            console.error('[App] Logout error:', error);
            
            // ANALYTICS: Track logout error
            this.trackError('logout_error', {
                message: error.message,
                provider: this.activeProvider
            });
            
            this.hideModernLoading();
            if (window.uiManager) {
                window.uiManager.showToast('Erreur de déconnexion. Nettoyage forcé...', 'warning');
            }
            this.forceCleanup();
        }
    }

    forceCleanup() {
        console.log('[App] Force cleanup dual provider...');
        
        // ANALYTICS: Track cleanup
        this.trackEvent('force_cleanup', { provider: this.activeProvider });
        
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.licenseUser = null;
        this.hasValidLicense = false;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentPage = 'dashboard';
        
        // Nettoyer les deux services d'authentification
        if (window.authService && typeof window.authService.forceCleanup === 'function') {
            window.authService.forceCleanup();
        }
        
        if (window.googleAuthService && typeof window.googleAuthService.forceCleanup === 'function') {
            window.googleAuthService.forceCleanup();
        }
        
        // Nettoyer le localStorage sélectivement
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
        
        // Nettoyer sessionStorage aussi
        try {
            sessionStorage.removeItem('google_callback_data');
            sessionStorage.removeItem('google_oauth_state');
            sessionStorage.removeItem('direct_token_data');
        } catch (e) {
            console.warn('[App] Error cleaning sessionStorage:', e);
        }
        
        // Clear currentUser global
        window.currentUser = null;
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    showLogin() {
        console.log('[App] Showing login page');
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        } else {
            console.error('[App] Login page element not found');
        }
        
        this.hideModernLoading();
        
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(null);
        }
    }

    showAppWithTransition() {
        console.log('[App] Showing application with transition - Provider:', this.activeProvider);
        
        // ANALYTICS: Track app display
        this.trackEvent('app_displayed', {
            provider: this.activeProvider,
            userEmail: this.user?.email || this.user?.mail,
            licenseStatus: this.licenseUser?.license_status,
            userRole: this.licenseUser?.role
        });
        
        this.hideModernLoading();
        
        // Retirer le mode login et activer le mode app
        document.body.classList.remove('login-mode');
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
        
        // Mettre à jour l'interface utilisateur avec le provider
        if (window.uiManager && typeof window.uiManager.updateAuthStatus === 'function') {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Mettre à jour l'affichage utilisateur avec badge provider
        if (window.updateUserDisplay && typeof window.updateUserDisplay === 'function') {
            window.updateUserDisplay(this.user);
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
            if (window.checkScrollNeeded) {
                window.checkScrollNeeded();
            }
        }, 1000);
        
        console.log(`[App] ✅ Application fully displayed with ${this.activeProvider} provider`);
    }

    showDashboardFallback() {
        console.log('[App] Showing dashboard fallback...');
        
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[App] Cannot show dashboard fallback - pageContent not found');
            return;
        }
        
        pageContent.innerHTML = `
            <div class="dashboard-fallback">
                <div class="dashboard-header">
                    <h1><i class="fas fa-tachometer-alt"></i> Tableau de bord</h1>
                    <p>Bienvenue dans EmailSortPro</p>
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
                    ${this.licenseUser ? `
                        <div class="license-info" style="margin-top: 2rem; text-align: center;">
                            <p style="color: #6b7280;">
                                ${this.licenseUser.license_status === 'trial' ? 
                                    `🎉 Période d'essai - ${this.user.licenseInfo?.daysRemaining || 15} jours restants` : 
                                    '✅ Licence active'}
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        console.log('[App] Dashboard fallback displayed');
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
            .dashboard-fallback {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            .dashboard-header {
                text-align: center;
                margin-bottom: 3rem;
            }
            .dashboard-header h1 {
                font-size: 2.5rem;
                color: #1f2937;
                margin-bottom: 0.5rem;
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }
            .dashboard-card {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .card-icon {
                font-size: 3rem;
                color: #3b82f6;
                margin-bottom: 1rem;
            }
            .provider-info {
                text-align: center;
                margin-top: 2rem;
            }
            .provider-badge {
                display: inline-block;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                font-weight: 600;
                color: white;
            }
            .provider-badge.microsoft {
                background: linear-gradient(135deg, #0078d4, #106ebe);
            }
            .provider-badge.google {
                background: linear-gradient(135deg, #4285f4, #34a853);
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
        }
        document.body.style.overflow = '';
    }

    showError(message) {
        console.error('[App] Showing error:', message);
        
        // ANALYTICS: Track error display
        this.trackError('app_error_display', { message: message });
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #1f2937;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 2s infinite;">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Erreur d'application</h1>
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 30px; border-radius: 20px; margin: 30px 0;">
                            <p style="font-size: 1.2rem; line-height: 1.6; color: #1f2937;">${message}</p>
                            ${this.isNetlifyEnv ? `
                                <div style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 10px;">
                                    <p style="font-size: 1rem; color: #1e40af;">
                                        <i class="fas fa-info-circle"></i>
                                        Environnement Netlify détecté: ${this.netlifyDomain}
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="location.reload()" class="login-button">
                                <i class="fas fa-refresh"></i>
                                Actualiser la page
                            </button>
                            <button onclick="window.app.forceCleanup()" class="login-button" style="background: rgba(107, 114, 128, 0.2); color: #374151; border: 1px solid rgba(107, 114, 128, 0.3);">
                                <i class="fas fa-undo"></i>
                                Réinitialiser
                            </button>
                            ${this.isNetlifyEnv ? `
                                <button onclick="window.diagnoseApp()" class="login-button" style="background: rgba(59, 130, 246, 0.2); color: #1e40af; border: 1px solid rgba(59, 130, 246, 0.3);">
                                    <i class="fas fa-stethoscope"></i>
                                    Diagnostic
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideModernLoading();
    }

    showConfigurationError(issues) {
        console.error('[App] Configuration error:', issues);
        
        // ANALYTICS: Track configuration error
        this.trackError('config_error', { issues: issues });
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="login-container">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #1f2937;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 2s infinite;">
                            <i class="fas fa-exclamation-triangle" style="color: #fbbf24;"></i>
                        </div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #1f2937;">Configuration requise</h1>
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 30px; border-radius: 20px; margin: 30px 0; text-align: left;">
                            <h3 style="color: #fbbf24; margin-bottom: 15px;">Problèmes détectés :</h3>
                            <ul style="margin-left: 20px;">
                                ${issues.map(issue => `<li style="margin: 8px 0;">${issue}</li>`).join('')}
                            </ul>
                            ${this.isNetlifyEnv ? `
                                <div style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.05); border-radius: 10px;">
                                    <h4 style="color: #1e40af; margin-bottom: 10px;">
                                        <i class="fas fa-cloud"></i> Environnement Netlify
                                    </h4>
                                    <p style="font-size: 0.9rem; color: #1e40af;">
                                        Domaine: ${this.netlifyDomain}<br>
                                        Vérifiez que les URLs de redirection sont configurées pour ce domaine.
                                    </p>
                                </div>
                            ` : ''}
                            <div style="margin-top: 20px; padding: 20px; background: rgba(251, 191, 36, 0.05); border-radius: 10px;">
                                <h4 style="margin-bottom: 10px;">Pour résoudre :</h4>
                                <ol style="margin-left: 20px;">
                                    <li>Cliquez sur "Configurer l'application"</li>
                                    <li>Suivez l'assistant de configuration</li>
                                    <li>Entrez vos Client IDs Azure et Google</li>
                                    ${this.isNetlifyEnv ? '<li>Configurez les URLs de redirection pour Netlify</li>' : ''}
                                </ol>
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="setup.html" class="login-button" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white;">
                                <i class="fas fa-cog"></i>
                                Configurer l'application
                            </a>
                            <button onclick="location.reload()" class="login-button" style="background: rgba(107, 114, 128, 0.2); color: #374151; border: 1px solid rgba(107, 114, 128, 0.3);">
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

    // =====================================
    // DIAGNOSTIC ET INFORMATIONS AVEC ANALYTICS ET LICENCE
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
                hasValidLicense: this.hasValidLicense,
                activeProvider: this.activeProvider,
                currentPage: this.currentPage,
                isInitialized: !this.isInitializing,
                initAttempts: this.initializationAttempts
            },
            user: this.user ? {
                name: this.user.displayName || this.user.name,
                email: this.user.mail || this.user.email,
                provider: this.user.provider,
                licenseStatus: this.licenseUser?.license_status,
                role: this.licenseUser?.role,
                company: this.licenseUser?.company?.name
            } : null,
            license: {
                serviceAvailable: !!window.licenseService,
                hasValidLicense: this.hasValidLicense,
                licenseUser: this.licenseUser ? {
                    email: this.licenseUser.email,
                    role: this.licenseUser.role,
                    status: this.licenseUser.license_status,
                    company: this.licenseUser.company?.name
                } : null
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
                    initialized: window.licenseService.initialized,
                    tablesExist: window.licenseService.tablesExist
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
                googleOAuthState: !!sessionStorage.getItem('google_oauth_state')
            },
            errors: {
                lastGlobalError: window.lastGlobalError || null,
                lastPromiseRejection: window.lastPromiseRejection || null
            }
        };
    }

    // Méthode de test pour vérifier les services critiques avec analytics
    testCriticalServices() {
        console.group('🧪 Test des services critiques avec analytics et licence');
        
        const tests = [];
        
        // Test LicenseService
        try {
            if (window.licenseService && window.licenseService.initialized) {
                tests.push({ service: 'LicenseService', status: '✅ OK', details: 'Service initialisé' });
            } else {
                tests.push({ service: 'LicenseService', status: '❌ ERROR', details: 'Service non initialisé' });
            }
        } catch (error) {
            tests.push({ service: 'LicenseService', status: '❌ ERROR', details: error.message });
        }
        
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
}

// =====================================
// FONCTIONS GLOBALES D'URGENCE AVEC ANALYTICS
// =====================================

window.emergencyReset = function() {
    console.log('[App] Emergency reset triggered for dual provider');
    
    // ANALYTICS: Track emergency reset
    if (window.app && window.app.trackEvent) {
        window.app.trackEvent('emergency_reset', { trigger: 'manual' });
    }
    
    const keysToKeep = ['emailsort_categories', 'emailsort_tasks', 'emailsortpro_client_id', 'emailsortpro_analytics'];
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
    
    // Nettoyer sessionStorage
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn('[Emergency] Error clearing sessionStorage:', e);
    }
    
    window.location.reload();
};

window.forceShowApp = function() {
    console.log('[Global] Force show app triggered');
    if (window.app && typeof window.app.showAppWithTransition === 'function') {
        window.app.showAppWithTransition();
    } else {
        document.body.classList.add('app-active');
        document.body.classList.remove('login-mode');
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'none';
        
        if (window.setPageMode) {
            window.setPageMode('dashboard');
        }
        
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            try {
                window.dashboardModule.render();
            } catch (error) {
                console.error('[Global] Dashboard render error:', error);
            }
        }
    }
};

window.testServices = function() {
    console.log('[Global] Testing services...');
    if (window.app && typeof window.app.testCriticalServices === 'function') {
        return window.app.testCriticalServices();
    } else {
        console.error('[Global] App instance not available for testing');
        return [];
    }
};

window.repairMailService = function() {
    console.log('[Global] Repairing MailService...');
    if (window.app && typeof window.app.createMailServiceFallback === 'function') {
        window.app.createMailServiceFallback();
        console.log('[Global] MailService fallback created');
        return true;
    } else {
        console.error('[Global] Cannot repair MailService - App instance not available');
        return false;
    }
};

window.repairScanModule = function() {
    console.log('[Global] Repairing scan module...');
    if (window.app && typeof window.app.createScanModuleFallback === 'function') {
        window.app.createScanModuleFallback();
        console.log('[Global] Scan module fallback created');
        return true;
    } else {
        console.error('[Global] Cannot repair scan module - App instance not available');
        return false;
    }
};

// =====================================
// VÉRIFICATION DES SERVICES AVEC ANALYTICS ET LICENCE
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

window.checkServices = function() {
    const services = {
        required: ['uiManager', 'AppConfig'],
        auth: ['authService', 'googleAuthService'],
        license: ['licenseService'],
        optional: ['mailService', 'emailScanner', 'categoryManager', 'dashboardModule', 'pageManager', 'taskManager'],
        analytics: ['analyticsManager']
    };
    
    const result = {
        ready: true,
        available: {},
        missing: {},
        errors: {}
    };
    
    Object.keys(services).forEach(category => {
        result.available[category] = [];
        result.missing[category] = [];
        
        services[category].forEach(service => {
            try {
                if (window[service]) {
                    result.available[category].push(service);
                } else {
                    result.missing[category].push(service);
                    if (category === 'required') {
                        result.ready = false;
                    }
                }
            } catch (error) {
                result.errors[service] = error.message;
                result.missing[category].push(service);
                if (category === 'required') {
                    result.ready = false;
                }
            }
        });
    });
    
    // Vérification spéciale pour les services d'auth
    if (result.available.auth.length === 0) {
        result.ready = false;
    }
    
    return result;
};

// =====================================
// GESTION DES ERREURS GLOBALES AVEC ANALYTICS
// =====================================
window.addEventListener('error', (event) => {
    window.lastGlobalError = {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack || 'No stack trace',
        filename: event.filename,
        lineno: event.lineno,
        timestamp: new Date().toISOString()
    };
    
    // Track dans analytics si disponible
    if (window.app && window.app.trackError) {
        window.app.trackError('global_window_error', window.lastGlobalError);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    window.lastPromiseRejection = {
        reason: event.reason?.message || event.reason || 'Unknown rejection',
        stack: event.reason?.stack || 'No stack trace',
        timestamp: new Date().toISOString()
    };
    
    // Track dans analytics si disponible
    if (window.app && window.app.trackError) {
        window.app.trackError('unhandled_promise_rejection', window.lastPromiseRejection);
    }
});

// =====================================
// INITIALISATION PRINCIPALE AVEC ANALYTICS ET LICENCE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, creating dual provider app instance with license check...');
    
    try {
        document.body.classList.add('login-mode');
        
        window.app = new App();
        
        const waitForServices = (attempts = 0) => {
            const maxAttempts = 50;
            
            try {
                if (checkServicesReady()) {
                    console.log('[App] All required services ready, initializing dual provider app with license...');
                    
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

window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            if (!window.app) {
                console.error('[App] App instance not created, creating fallback...');
                document.body.classList.add('login-mode');
                window.app = new App();
                window.app.init();
            } else if (!window.app.isAuthenticated && !window.app.isInitializing) {
                console.log('[App] Fallback initialization check...');
                
                const loginPage = document.getElementById('loginPage');
                if (loginPage && loginPage.style.display === 'none') {
                    loginPage.style.display = 'flex';
                    document.body.classList.add('login-mode');
                }
            }
        } catch (loadError) {
            console.error('[App] Error during load event:', loadError);
            
            // Track error si analytics disponible
            if (window.app && window.app.trackError) {
                window.app.trackError('load_event_error', {
                    message: loadError.message
                });
            }
        }
    }, 5000);
});

// =====================================
// DIAGNOSTIC GLOBAL AVEC ANALYTICS ET LICENCE
// =====================================
window.diagnoseApp = function() {
    console.group('🔍 DIAGNOSTIC APPLICATION - EmailSortPro v5.0 avec Licence');
    
    try {
        if (window.app) {
            const appDiag = window.app.getDiagnosticInfo();
            
            console.log('🌐 Environment:', appDiag.environment);
            console.log('📱 App Status:', appDiag.app);
            console.log('👤 User:', appDiag.user);
            console.log('🔐 License:', appDiag.license);
            console.log('📊 Analytics:', appDiag.analytics);
            console.log('🛠️ Services:', appDiag.services);
            console.log('🏗️ DOM Elements:', appDiag.dom);
            console.log('💾 Session Data:', appDiag.sessionData);
            
            if (appDiag.errors.lastGlobalError || appDiag.errors.lastPromiseRejection) {
                console.log('❌ Recent Errors:', appDiag.errors);
            }
            
            // Test des services critiques
            const serviceTests = window.app.testCriticalServices();
            console.log('🧪 Service Tests:', serviceTests);
            
            // Diagnostic analytics spécifique
            if (window.analyticsManager) {
                console.log('📈 Analytics Data:', window.analyticsManager.getGlobalStats());
                console.log('👥 User Stats:', window.analyticsManager.getAllUsers().length + ' utilisateurs');
                console.log('🏢 Company Stats:', window.analyticsManager.getAllCompanies().length + ' sociétés');
            }
            
            // Diagnostic licence spécifique
            if (window.licenseService) {
                const licenseDiag = window.licenseService.getDiagnosticInfo();
                console.log('🔐 License Service:', licenseDiag);
            }
            
            return appDiag;
        } else {
            console.log('❌ App instance not available');
            
            // Diagnostic de base sans instance app
            const basicDiag = {
                error: 'App instance not available',
                services: window.checkServices ? window.checkServices() : 'checkServices not available',
                analytics: {
                    available: !!window.analyticsManager,
                    hasData: window.analyticsManager ? !!window.analyticsManager.getGlobalStats : false
                },
                license: {
                    available: !!window.licenseService,
                    initialized: window.licenseService ? window.licenseService.initialized : false
                },
                dom: {
                    loginPage: !!document.getElementById('loginPage'),
                    pageContent: !!document.getElementById('pageContent')
                },
                environment: {
                    isNetlify: window.location.hostname.includes('netlify.app'),
                    domain: window.location.hostname,
                    userAgent: navigator.userAgent.substring(0, 100)
                }
            };
            
            console.log('📊 Basic Diagnostic:', basicDiag);
            return basicDiag;
        }
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
        return { error: error.message, stack: error.stack };
    } finally {
        console.groupEnd();
    }
};

// =====================================
// FONCTIONS D'AIDE POUR NETLIFY AVEC ANALYTICS ET LICENCE
// =====================================
window.netlifyHelpers = {
    checkDomain: () => {
        const isNetlify = window.location.hostname.includes('netlify.app');
        const domain = window.location.hostname;
        console.log(`Environment: ${isNetlify ? 'Netlify' : 'Other'} (${domain})`);
        return { isNetlify, domain };
    },
    
    validateConfig: () => {
        if (!window.AppConfig) {
            console.error('AppConfig not loaded');
            return false;
        }
        
        const validation = window.AppConfig.validate();
        console.log('Config validation:', validation);
        return validation.valid;
    },
    
    testAuth: async () => {
        const results = {};
        
        if (window.authService) {
            try {
                results.microsoft = {
                    available: true,
                    initialized: window.authService.isInitialized,
                    authenticated: window.authService.isAuthenticated()
                };
            } catch (error) {
                results.microsoft = { error: error.message };
            }
        }
        
        if (window.googleAuthService) {
            try {
                results.google = {
                    available: true,
                    initialized: window.googleAuthService.isInitialized,
                    authenticated: window.googleAuthService.isAuthenticated()
                };
            } catch (error) {
                results.google = { error: error.message };
            }
        }
        
        console.log('Auth test results:', results);
        return results;
    },
    
    testLicense: async () => {
        const results = {
            available: !!window.licenseService,
            initialized: false,
            tablesExist: false,
            currentUser: null
        };
        
        if (window.licenseService) {
            try {
                results.initialized = window.licenseService.initialized;
                results.tablesExist = window.licenseService.tablesExist;
                results.currentUser = window.licenseService.getCurrentUser();
                
                if (window.licenseService.getDiagnosticInfo) {
                    results.diagnostic = await window.licenseService.getDiagnosticInfo();
                }
            } catch (error) {
                results.error = error.message;
            }
        }
        
        console.log('License test results:', results);
        return results;
    },
    
    testAnalytics: () => {
        const results = {
            available: !!window.analyticsManager,
            methods: {}
        };
        
        if (window.analyticsManager) {
            const methods = ['trackEvent', 'trackAuthentication', 'onError', 'getGlobalStats', 'getAllUsers', 'getAllCompanies'];
            methods.forEach(method => {
                results.methods[method] = typeof window.analyticsManager[method] === 'function';
            });
            
            try {
                results.stats = window.analyticsManager.getGlobalStats();
                results.users = window.analyticsManager.getAllUsers().length;
                results.companies = window.analyticsManager.getAllCompanies().length;
            } catch (error) {
                results.error = error.message;
            }
        }
        
        console.log('Analytics test results:', results);
        return results;
    }
};

// =====================================
// FONCTIONS ANALYTICS GLOBALES
// =====================================
window.analyticsHelpers = {
    // Fonction pour accéder aux analytics depuis analytics.html
    getAnalyticsData: () => {
        if (!window.analyticsManager) {
            console.warn('[Analytics] Analytics manager not available');
            return null;
        }
        
        try {
            return window.analyticsManager.getAnalyticsData();
        } catch (error) {
            console.error('[Analytics] Error getting analytics data:', error);
            return null;
        }
    },
    
    // Fonction pour filtrer les utilisateurs par domaine
    getUsersByDomain: (domain) => {
        if (!window.analyticsManager) {
            console.warn('[Analytics] Analytics manager not available');
            return [];
        }
        
        try {
            const allUsers = window.analyticsManager.getAllUsers();
            return allUsers.filter(user => {
                const userDomain = user.email ? user.email.split('@')[1] : '';
                return userDomain.toLowerCase().includes(domain.toLowerCase());
            });
        } catch (error) {
            console.error('[Analytics] Error filtering users by domain:', error);
            return [];
        }
    },
    
    // Fonction pour filtrer les utilisateurs par email
    getUserByEmail: (email) => {
        if (!window.analyticsManager) {
            console.warn('[Analytics] Analytics manager not available');
            return null;
        }
        
        try {
            const allUsers = window.analyticsManager.getAllUsers();
            return allUsers.find(user => 
                user.email && user.email.toLowerCase() === email.toLowerCase()
            );
        } catch (error) {
            console.error('[Analytics] Error finding user by email:', error);
            return null;
        }
    },
    
    // Fonction pour obtenir les statistiques par société
    getCompanyStats: (companyName) => {
        if (!window.analyticsManager) {
            console.warn('[Analytics] Analytics manager not available');
            return null;
        }
        
        try {
            const companies = window.analyticsManager.getAllCompanies();
            return companies.find(company => 
                company.name && company.name.toLowerCase() === companyName.toLowerCase()
            );
        } catch (error) {
            console.error('[Analytics] Error getting company stats:', error);
            return null;
        }
    },
    
    // Fonction pour exporter les données filtrées
    exportFilteredData: (filter = {}) => {
        if (!window.analyticsManager) {
            console.warn('[Analytics] Analytics manager not available');
            return;
        }
        
        try {
            let data = window.analyticsManager.getAnalyticsData();
            
            // Appliquer les filtres
            if (filter.domain) {
                const filteredUsers = {};
                Object.keys(data.users).forEach(email => {
                    const userDomain = email.split('@')[1];
                    if (userDomain && userDomain.toLowerCase().includes(filter.domain.toLowerCase())) {
                        filteredUsers[email] = data.users[email];
                    }
                });
                data.users = filteredUsers;
            }
            
            if (filter.company) {
                const filteredCompanies = {};
                Object.keys(data.companies).forEach(companyName => {
                    if (companyName.toLowerCase().includes(filter.company.toLowerCase())) {
                        filteredCompanies[companyName] = data.companies[companyName];
                    }
                });
                data.companies = filteredCompanies;
            }
            
            // Exporter
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `emailsortpro-analytics-filtered-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            console.log('[Analytics] Filtered data exported successfully');
        } catch (error) {
            console.error('[Analytics] Error exporting filtered data:', error);
        }
    }
};

console.log('✅ App v5.0 loaded - DUAL PROVIDER + ANALYTICS + LICENSE VERIFICATION');
console.log('🔧 Fonctions globales disponibles: window.diagnoseApp(), window.testServices(), window.repairMailService(), window.repairScanModule()');
console.log('🌐 Helpers Netlify: window.netlifyHelpers');
console.log('📊 Helpers Analytics: window.analyticsHelpers');
console.log('📈 Analytics tracking: Email en clair, filtrage par domaine et par société');
console.log('🔐 License verification: Vérification à la connexion et sur chaque changement de page');
console.log('👥 Onboarding: Processus pour nouveaux utilisateurs avec 15 jours d\'essai');// app.js - Application EmailSortPro avec intégration Analytics et Licence complète v5.0
// Vérification de licence sur toutes les pages et onboarding des nouveaux utilisateurs

class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null; // 'microsoft' ou 'google'
        this.licenseUser = null; // Utilisateur depuis la base de données licence
        this.hasValidLicense = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentPage = 'dashboard';
        this.netlifyDomain = 'coruscating-dodol-f30e8d.netlify.app';
        this.isNetlifyEnv = window.location.hostname.includes('netlify.app');
        
        console.log('[App] Constructor - EmailSortPro v5.0 with license verification...');
        console.log('[App] Environment:', this.isNetlifyEnv ? 'Netlify' : 'Local');
        console.log('[App] Domain:', window.location.hostname);
        
        // Initialiser Analytics Manager immédiatement mais avec gestion d'erreur
        this.initializeAnalytics();
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
                
                // Vérifier que la méthode existe avant de l'appeler
                if (typeof window.analyticsManager.onPageLoad === 'function') {
                    window.analyticsManager.onPageLoad('index');
                } else if (typeof window.analyticsManager.trackPageView === 'function') {
                    // Fallback vers une autre méthode si elle existe
                    window.analyticsManager.trackPageView('index');
                } else {
                    console.warn('[App] Analytics manager does not have onPageLoad or trackPageView method');
                }
                
                console.log('[App] ✅ Analytics initialized successfully');
            } else {
                console.warn('[App] Analytics manager not available yet, will retry...');
                
                // Retry après un délai
                setTimeout(() => {
                    if (window.analyticsManager) {
                        console.log('[App] ✅ Analytics manager now available');
                        if (typeof window.analyticsManager.onPageLoad === 'function') {
                            window.analyticsManager.onPageLoad('index');
                        }
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
        console.log('[App] Initializing dual provider application with license check...');
        
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

            // Charger d'abord le service de licence avec gestion d'erreur améliorée
            const licenseLoaded = await this.loadLicenseService();
            if (!licenseLoaded) {
                console.warn('[App] License service could not be loaded, continuing without license check');
                // Continuer sans vérification de licence pour ne pas bloquer l'app
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
    // CHARGEMENT DU SERVICE DE LICENCE
    // =====================================
    async loadLicenseService() {
        if (window.licenseService) {
            console.log('[App] License service already loaded');
            return true;
        }

        return new Promise((resolve) => {
            const script = document.createElement('script');
            
            // Essayer différents chemins selon l'environnement
            const possiblePaths = [
                './LicenseService.js',
                '/LicenseService.js',
                'LicenseService.js',
                './js/LicenseService.js',
                '/js/LicenseService.js'
            ];
            
            let currentPathIndex = 0;
            
            const tryNextPath = () => {
                if (currentPathIndex >= possiblePaths.length) {
                    console.error('[App] Failed to load license service from all possible paths');
                    resolve(false);
                    return;
                }
                
                script.src = possiblePaths[currentPathIndex];
                console.log(`[App] Trying to load license service from: ${script.src}`);
                currentPathIndex++;
            };
            
            script.onload = async () => {
                console.log('[App] ✅ License service loaded');
                try {
                    if (window.licenseService && window.licenseService.initialize) {
                        await window.licenseService.initialize();
                        console.log('[App] ✅ License service initialized');
                    }
                    resolve(true);
                } catch (error) {
                    console.error('[App] Error initializing license service:', error);
                    resolve(false);
                }
            };
            
            script.onerror = () => {
                console.warn(`[App] Failed to load license service from: ${script.src}`);
                script.remove(); // Enlever le script qui a échoué
                
                // Créer un nouveau script et essayer le prochain chemin
                const newScript = document.createElement('script');
                Object.assign(newScript, { onload: script.onload, onerror: script.onerror });
                script = newScript;
                
                tryNextPath();
                document.head.appendChild(script);
            };
            
            tryNextPath();
            document.head.appendChild(script);
        });
    }

    // =====================================
    // VÉRIFICATION DE L'AUTHENTIFICATION AVEC LICENCE
    // =====================================
    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status for both providers...');
        
        // Vérifier d'abord s'il y a un callback Google à traiter
        const googleCallbackHandled = await this.handleGoogleCallback();
        if (googleCallbackHandled) {
            // La vérification de licence se fera après
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
                    
                    // VÉRIFICATION DE LICENCE SI LE SERVICE EST DISPONIBLE
                    if (window.licenseService) {
                        const licenseValid = await this.verifyUserLicense();
                        if (!licenseValid) {
                            return; // L'utilisateur sera bloqué ou redirigé
                        }
                    } else {
                        console.warn('[App] License service not available, skipping license check');
                    }
                    
                    // ANALYTICS: Track authentication avec email en clair
                    this.trackUserAuthentication(this.user);
                    
                    console.log('[App] ✅ Microsoft user authenticated:', this.user.displayName || this.user.mail);
                    this.showAppWithTransition();
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
                    
                    // VÉRIFICATION DE LICENCE SI LE SERVICE EST DISPONIBLE
                    if (window.licenseService) {
                        const licenseValid = await this.verifyUserLicense();
                        if (!licenseValid) {
                            return;
                        }
                    } else {
                        console.warn('[App] License service not available, skipping license check');
                    }
                    
                    // ANALYTICS: Track authentication avec email en clair
                    this.trackUserAuthentication(this.user);
                    
                    console.log('[App] ✅ Google user authenticated:', this.user.displayName || this.user.email);
                    this.showAppWithTransition();
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
    // VÉRIFICATION DE LICENCE AVEC ONBOARDING
    // =====================================
    async verifyUserLicense() {
        console.log('[App] Verifying user license...');
        
        try {
            // Récupérer l'email de l'utilisateur
            const userEmail = this.user.email || this.user.mail || this.user.userPrincipalName;
            
            if (!userEmail) {
                console.error('[App] No user email found');
                this.showLicenseError('Email utilisateur introuvable');
                return false;
            }
            
            console.log('[App] Checking license for:', userEmail);
            
            // Vérifier si le service de licence est disponible
            if (!window.licenseService) {
                console.error('[App] License service not available');
                // Ne pas bloquer l'utilisateur si le service n'est pas disponible
                console.warn('[App] Continuing without license verification');
                return true;
            }
            
            // Vérifier la licence
            const licenseResult = await window.licenseService.checkUserLicense(userEmail);
            
            console.log('[App] License check result:', licenseResult);
            
            // Si l'utilisateur n'existe pas (code PGRST116), lancer l'onboarding
            if (licenseResult.error && licenseResult.error.includes('PGRST116')) {
                console.log('[App] New user detected, starting onboarding...');
                return await this.startUserOnboarding(userEmail);
            }
            
            // Vérifier la validité de la licence
            if (!licenseResult.valid) {
                // Tracker l'échec de licence
                this.trackEvent('license_check_failed', {
                    email: userEmail,
                    status: licenseResult.status,
                    reason: licenseResult.message
                });
                
                // Afficher l'erreur de licence avec infos de contact admin
                let adminContact = 'support@emailsortpro.com';
                if (licenseResult.user && licenseResult.user.company && licenseResult.user.company.admin_email) {
                    adminContact = licenseResult.user.company.admin_email;
                }
                
                this.showLicenseError(
                    licenseResult.message || 'Licence invalide',
                    adminContact
                );
                
                // Déconnecter l'utilisateur après 10 secondes
                setTimeout(async () => {
                    await this.forceLogout();
                }, 10000);
                
                return false;
            }
            
            // Licence valide - tracker le succès
            this.trackEvent('license_check_success', {
                email: userEmail,
                status: licenseResult.status,
                company: licenseResult.user?.company?.name,
                role: licenseResult.user?.role
            });
            
            // Stocker les infos de licence
            this.licenseUser = licenseResult.user;
            this.hasValidLicense = true;
            
            // Enrichir l'objet user avec les infos de licence
            this.user.licenseInfo = {
                status: licenseResult.status,
                role: licenseResult.user?.role,
                company: licenseResult.user?.company,
                expiresAt: licenseResult.user?.license_expires_at,
                daysRemaining: licenseResult.daysRemaining
            };
            
            // Exposer globalement pour les autres modules
            window.currentUser = this.licenseUser;
            
            console.log('[App] ✅ License valid for user:', userEmail);
            return true;
            
        } catch (error) {
            console.error('[App] License verification error:', error);
            
            // Tracker l'erreur
            this.trackError('license_verification_error', {
                message: error.message
            });
            
            // Si le service de licence n'est pas disponible, ne pas bloquer
            if (error.message.includes('licenseService is not defined') || 
                error.message.includes('Cannot read properties of undefined')) {
                console.warn('[App] License service error, continuing without verification');
                return true;
            }
            
            // En cas d'autre erreur, bloquer l'accès par sécurité
            this.showLicenseError('Erreur de vérification de licence: ' + error.message);
            
            setTimeout(async () => {
                await this.forceLogout();
            }, 10000);
            
            return false;
        }
    }

    // =====================================
    // PROCESSUS D'ONBOARDING POUR NOUVEAUX UTILISATEURS
    // =====================================
    async startUserOnboarding(email) {
        console.log('[App] Starting onboarding process for:', email);
        
        return new Promise((resolve) => {
            // Créer le modal d'onboarding
            const modal = document.createElement('div');
            modal.id = 'onboarding-modal';
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
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 3rem;
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                text-align: center;
            `;
            
            modalContent.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 1.5rem;">🎉</div>
                <h2 style="color: #1f2937; font-size: 2rem; margin-bottom: 1rem;">Bienvenue sur EmailSortPro !</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">
                    C'est votre première connexion. Configurons votre compte en quelques secondes.
                </p>
                
                <div id="onboarding-step-1">
                    <h3 style="color: #374151; margin-bottom: 1.5rem;">Quel est votre type de compte ?</h3>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                        <button id="btn-particulier" style="
                            flex: 1;
                            background: #f3f4f6;
                            border: 2px solid #e5e7eb;
                            padding: 1.5rem;
                            border-radius: 12px;
                            cursor: pointer;
                            transition: all 0.3s;
                        " onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">👤</div>
                            <div style="font-weight: 600; color: #1f2937;">Particulier</div>
                            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Usage personnel</div>
                        </button>
                        <button id="btn-professionnel" style="
                            flex: 1;
                            background: #f3f4f6;
                            border: 2px solid #e5e7eb;
                            padding: 1.5rem;
                            border-radius: 12px;
                            cursor: pointer;
                            transition: all 0.3s;
                        " onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏢</div>
                            <div style="font-weight: 600; color: #1f2937;">Professionnel</div>
                            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Usage entreprise</div>
                        </button>
                    </div>
                </div>
                
                <div id="onboarding-step-2" style="display: none;">
                    <h3 style="color: #374151; margin-bottom: 1.5rem;">Informations sur votre société</h3>
                    <div style="position: relative;">
                        <input type="text" id="company-name" placeholder="Nom de votre société" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #d1d5db;
                            border-radius: 8px;
                            font-size: 1rem;
                            margin-bottom: 1rem;
                        ">
                        <div id="company-suggestions" style="
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background: white;
                            border: 1px solid #d1d5db;
                            border-top: none;
                            border-radius: 0 0 8px 8px;
                            max-height: 200px;
                            overflow-y: auto;
                            display: none;
                            z-index: 10;
                        "></div>
                    </div>
                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 2rem;">
                        Entrez le nom de votre société. Nous vérifierons si elle est déjà enregistrée.
                    </p>
                    <button id="btn-validate-company" style="
                        background: #3b82f6;
                        color: white;
                        padding: 0.75rem 2rem;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                        Valider
                    </button>
                </div>
                
                <div id="onboarding-loading" style="display: none;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="color: #6b7280; margin-top: 1rem;">Création de votre compte...</p>
                </div>
                
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Gérer les clics sur les boutons
            const btnParticulier = modalContent.querySelector('#btn-particulier');
            const btnProfessionnel = modalContent.querySelector('#btn-professionnel');
            const btnValidateCompany = modalContent.querySelector('#btn-validate-company');
            const companyInput = modalContent.querySelector('#company-name');
            const companySuggestions = modalContent.querySelector('#company-suggestions');
            
            btnParticulier.addEventListener('click', async () => {
                console.log('[App] User selected: Particulier');
                modalContent.querySelector('#onboarding-step-1').style.display = 'none';
                modalContent.querySelector('#onboarding-loading').style.display = 'block';
                
                // Créer l'utilisateur comme particulier (administrateur par défaut)
                const success = await this.createNewUser(email, 'particulier', null);
                modal.remove();
                resolve(success);
            });
            
            btnProfessionnel.addEventListener('click', () => {
                console.log('[App] User selected: Professionnel');
                modalContent.querySelector('#onboarding-step-1').style.display = 'none';
                modalContent.querySelector('#onboarding-step-2').style.display = 'block';
            });
            
            // Gestion de l'autocomplete pour les entreprises
            let companySearchTimeout;
            companyInput.addEventListener('input', async (e) => {
                clearTimeout(companySearchTimeout);
                const searchTerm = e.target.value.trim();
                
                if (searchTerm.length < 2) {
                    companySuggestions.style.display = 'none';
                    return;
                }
                
                companySearchTimeout = setTimeout(async () => {
                    try {
                        // Rechercher les entreprises existantes
                        const companies = await this.searchCompanies(searchTerm);
                        
                        if (companies.length > 0) {
                            companySuggestions.innerHTML = companies.map(company => `
                                <div class="company-suggestion" style="
                                    padding: 0.75rem;
                                    cursor: pointer;
                                    border-bottom: 1px solid #f3f4f6;
                                    transition: background 0.2s;
                                " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
                                    <div style="font-weight: 600; color: #1f2937;">${company.name}</div>
                                    ${company.domain ? `<div style="font-size: 0.875rem; color: #6b7280;">${company.domain}</div>` : ''}
                                </div>
                            `).join('');
                            
                            companySuggestions.style.display = 'block';
                            
                            // Gérer les clics sur les suggestions
                            companySuggestions.querySelectorAll('.company-suggestion').forEach((suggestion, index) => {
                                suggestion.addEventListener('click', () => {
                                    companyInput.value = companies[index].name;
                                    companySuggestions.style.display = 'none';
                                });
                            });
                        } else {
                            companySuggestions.innerHTML = `
                                <div style="padding: 0.75rem; color: #6b7280; text-align: center;">
                                    Aucune société trouvée - Une nouvelle sera créée
                                </div>
                            `;
                            companySuggestions.style.display = 'block';
                        }
                    } catch (error) {
                        console.error('[App] Error searching companies:', error);
                        companySuggestions.style.display = 'none';
                    }
                }, 300);
            });
            
            // Cacher les suggestions quand on clique ailleurs
            document.addEventListener('click', (e) => {
                if (!companyInput.contains(e.target) && !companySuggestions.contains(e.target)) {
                    companySuggestions.style.display = 'none';
                }
            });
            
            btnValidateCompany.addEventListener('click', async () => {
                const companyName = companyInput.value.trim();
                
                if (!companyName) {
                    alert('Veuillez entrer le nom de votre société');
                    return;
                }
                
                console.log('[App] Company name entered:', companyName);
                modalContent.querySelector('#onboarding-step-2').style.display = 'none';
                modalContent.querySelector('#onboarding-loading').style.display = 'block';
                
                // Créer l'utilisateur professionnel
                const success = await this.createNewUser(email, 'professionnel', companyName);
                modal.remove();
                resolve(success);
            });
        });
    }

    // =====================================
    // RECHERCHE D'ENTREPRISES
    // =====================================
    async searchCompanies(searchTerm) {
        if (!window.licenseService || !window.licenseService.supabase) {
            return [];
        }
        
        try {
            const { data, error } = await window.licenseService.supabase
                .from('companies')
                .select('id, name, domain')
                .ilike('name', `%${searchTerm}%`)
                .limit(5);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[App] Error searching companies:', error);
            return [];
        }
    }

    // =====================================
    // CRÉATION D'UN NOUVEL UTILISATEUR
    // =====================================
    async createNewUser(email, userType, companyName) {
        console.log('[App] Creating new user:', { email, userType, companyName });
        
        try {
            if (!window.licenseService) {
                throw new Error('Service de licence non disponible');
            }
            
            // Pour les particuliers, les mettre en admin par défaut
            if (userType === 'particulier') {
                // Créer l'utilisateur directement avec le rôle company_admin
                const { data: newUser, error } = await window.licenseService.supabase
                    .from('users')
                    .insert([{
                        email: email.toLowerCase(),
                        name: email.split('@')[0],
                        role: 'company_admin', // Admin par défaut pour les particuliers
                        license_status: 'trial',
                        license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 jours d'essai
                        last_login_at: new Date().toISOString()
                    }])
                    .select('*')
                    .single();
                
                if (error) throw error;
                
                // Recharger pour obtenir toutes les infos
                const licenseResult = await window.licenseService.checkUserLicense(email);
                
                if (licenseResult.valid) {
                    this.licenseUser = licenseResult.user;
                    this.hasValidLicense = true;
                    this.enrichUserWithLicenseInfo(licenseResult);
                    
                    // Tracker la création
                    this.trackEvent('new_user_created', {
                        email: email,
                        userType: 'particulier',
                        role: 'company_admin'
                    });
                    
                    // Afficher un message de bienvenue
                    this.showWelcomeMessage();
                    
                    return true;
                }
            } else {
                // Pour les professionnels, utiliser le service de licence normal
                // qui gérera la création avec la bonne société
                const licenseResult = await window.licenseService.checkUserLicense(email);
                
                if (licenseResult.valid) {
                    this.licenseUser = licenseResult.user;
                    this.hasValidLicense = true;
                    this.enrichUserWithLicenseInfo(licenseResult);
                    
                    // Tracker la création
                    this.trackEvent('new_user_created', {
                        email: email,
                        userType: 'professionnel',
                        companyName: companyName,
                        role: licenseResult.user?.role
                    });
                    
                    // Afficher un message de bienvenue
                    this.showWelcomeMessage();
                    
                    return true;
                } else {
                    throw new Error(licenseResult.message || 'Échec de création du compte');
                }
            }
        } catch (error) {
            console.error('[App] Error creating new user:', error);
            this.showLicenseError('Erreur lors de la création du compte: ' + error.message);
            return false;
        }
    }

    // =====================================
    // ENRICHIR L'OBJET USER AVEC LES INFOS DE LICENCE
    // =====================================
    enrichUserWithLicenseInfo(licenseResult) {
        this.user.licenseInfo = {
            status: licenseResult.status,
            role: licenseResult.user?.role,
            company: licenseResult.user?.company,
            expiresAt: licenseResult.user?.license_expires_at,
            daysRemaining: licenseResult.daysRemaining || 15
        };
        
        // Exposer globalement
        window.currentUser = this.licenseUser;
    }

    // =====================================
    // MESSAGE DE BIENVENUE POUR NOUVEAUX UTILISATEURS
    // =====================================
    showWelcomeMessage() {
        const daysRemaining = this.user.licenseInfo?.daysRemaining || 15;
        const userRole = this.user.licenseInfo?.role === 'company_admin' ? 'Administrateur' : 'Utilisateur';
        
        const welcomeDiv = document.createElement('div');
        welcomeDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            z-index: 1000;
            animation: slideIn 0.5s ease-out;
        `;
        
        welcomeDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 1rem;">
                <div style="font-size: 2rem;">🎉</div>
                <div style="flex: 1;">
                    <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Bienvenue sur EmailSortPro !</h3>
                    <p style="margin-bottom: 0.5rem; opacity: 0.9;">
                        Votre compte ${userRole} a été créé avec succès.
                    </p>
                    <p style="font-size: 0.875rem; opacity: 0.8;">
                        Vous disposez de <strong>${daysRemaining} jours d'essai gratuit</strong> pour découvrir toutes les fonctionnalités.
                    </p>
                    ${this.user.licenseInfo?.company ? `
                        <p style="font-size: 0.875rem; opacity: 0.8; margin-top: 0.5rem;">
                            Société : ${this.user.licenseInfo.company.name}
                        </p>
                    ` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(welcomeDiv);
        
        // Style pour l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Retirer automatiquement après 10 secondes
        setTimeout(() => {
            welcomeDiv.style.animation = 'slideIn 0.5s ease-out reverse';
            setTimeout(() => welcomeDiv.remove(), 500);
        }, 10000);
    }

    // =====================================
    // AFFICHAGE DES ERREURS DE LICENCE
    // =====================================
    showLicenseError(message = 'Accès refusé', adminContact = 'support@emailsortpro.com') {
        console.error('[App] Showing license error:', message);
        
        // Cacher le loading
        this.hideModernLoading();
        
        // Créer l'overlay d'erreur
        const overlay = document.createElement('div');
        overlay.id = 'license-error-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const errorBox = document.createElement('div');
        errorBox.style.cssText = `
            background-color: white;
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        `;

        // Déterminer le type d'erreur et l'icône appropriée
        let icon = '⚠️';
        let title = 'Accès Refusé';
        let subtitle = '';
        let contactInfo = '';

        if (message.includes('bloqué')) {
            icon = '🚫';
            title = 'Accès Bloqué';
            subtitle = 'Votre compte a été bloqué par un administrateur';
            contactInfo = `Contactez votre administrateur : <strong>${adminContact}</strong>`;
        } else if (message.includes('expiré')) {
            icon = '⏰';
            title = 'Licence Expirée';
            subtitle = 'Votre période d\'essai ou d\'abonnement est terminée';
            contactInfo = `Pour continuer à utiliser EmailSortPro, contactez : <strong>${adminContact}</strong>`;
        } else if (message.includes('tables_unavailable') || message.includes('Service non disponible')) {
            icon = '🔧';
            title = 'Service Temporairement Indisponible';
            subtitle = 'Le service de vérification des licences est en maintenance';
            contactInfo = `Veuillez réessayer dans quelques instants ou contactez : <strong>support@emailsortpro.com</strong>`;
        } else {
            subtitle = 'Vous devez disposer d\'une licence valide pour accéder à EmailSortPro';
            contactInfo = `Pour obtenir une licence, contactez : <strong>${adminContact}</strong>`;
        }

        errorBox.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1.5rem; animation: pulse 2s infinite;">
                ${icon}
            </div>
            <h2 style="color: #1f2937; font-size: 2rem; margin-bottom: 0.5rem; font-weight: 700;">
                ${title}
            </h2>
            <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 2rem;">
                ${subtitle}
            </p>
            <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <p style="color: #991b1b; margin: 0; font-size: 1rem;">
                    ${message}
                </p>
            </div>
            <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <p style="color: #4b5563; font-size: 0.9rem; margin: 0;">
                    ${contactInfo}
                </p>
                ${this.licenseUser && this.licenseUser.company ? `
                    <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
                        Société : ${this.licenseUser.company.name}
                    </p>
                ` : ''}
            </div>
            <div style="font-size: 0.875rem; color: #9ca3af;">
                Déconnexion automatique dans 10 secondes...
            </div>
        `;

        overlay.appendChild(errorBox);
        document.body.appendChild(overlay);

        // Ajouter l'animation pulse
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(0.95); }
            }
        `;
        document.head.appendChild(style);
    }

    // [Le reste des méthodes reste identique...]

    // =====================================
    // DÉCONNEXION FORCÉE
    // =====================================
    async forceLogout() {
        console.log('[App] Force logout due to license issue...');
        
        try {
            // Nettoyer l'overlay d'erreur s'il existe
            const errorOverlay = document.getElementById('license-error-overlay');
            if (errorOverlay) {
                errorOverlay.remove();
            }
            
            // Tracker la déconnexion
            this.trackEvent('forced_logout', {
                reason: 'license_invalid',
                email: this.user?.email || this.user?.mail
            });
            
            // Déconnecter selon le provider
            if (this.activeProvider === 'microsoft' && window.authService) {
                await window.authService.logout();
            } else if (this.activeProvider === 'google' && window.googleAuthService) {
                await window.googleAuthService.logout();
            } else {
                // Fallback
                this.forceCleanup();
            }
        } catch (error) {
            console.error('[App] Error during force logout:', error);
            this.forceCleanup();
        }
    }

    // =====================================
    // VÉRIFICATION DE LICENCE SUR CHANGEMENT DE PAGE
    // =====================================
    async checkLicenseOnPageChange() {
        console.log('[App] Checking license on page change...');
        
        // Si pas d'utilisateur authentifié ou pas de service de licence, ne rien faire
        if (!this.isAuthenticated || !this.user || !window.licenseService) {
            return true;
        }
        
        // Si la licence n'a pas encore été vérifiée
        if (!this.hasValidLicense) {
            const isValid = await this.verifyUserLicense();
            return isValid;
        }
        
        // Vérifier périodiquement (toutes les 5 minutes)
        const lastCheck = this.lastLicenseCheck || 0;
        const now = Date.now();
        
        if (now - lastCheck > 5 * 60 * 1000) { // 5 minutes
            console.log('[App] Performing periodic license check...');
            this.lastLicenseCheck = now;
            
            const userEmail = this.user.email || this.user.mail || this.user.userPrincipalName;
            const licenseResult = await window.licenseService.checkUserLicense(userEmail);
            
            if (!licenseResult.valid) {
                this.hasValidLicense = false;
                this.showLicenseError(licenseResult.message);
                setTimeout(() => this.forceLogout(), 10000);
                return false;
            }
        }
        
        return true;
    }

    // [Le reste des méthodes reste identique avec ajout de la vérification de licence sur les changements de page]

    setupEventListeners() {
        console.log('[App] Setting up event listeners with license checks...');
        
        // NAVIGATION AVEC VÉRIFICATION DE LICENCE
        document.querySelectorAll('.nav-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', async (e) => {
                try {
                    const page = e.currentTarget.dataset.page;
                    if (page && window.pageManager) {
                        // VÉRIFIER LA LICENCE AVANT DE CHANGER DE PAGE
                        const licenseValid = await this.checkLicenseOnPageChange();
                        if (!licenseValid) {
                            console.log('[App] Navigation blocked due to invalid license');
                            return;
                        }
                        
                        this.currentPage = page;
                        
                        if (window.setPageMode) {
                            window.setPageMode(page);
                        }
                        
                        // Vérification robuste avant le chargement de page
                        if (typeof window.pageManager.loadPage === 'function') {
                            window.pageManager.loadPage(page);
                        } else {
                            console.error('[App] PageManager.loadPage is not a function');
                            if (window.uiManager) {
                                window.uiManager.showToast('Erreur de navigation', 'error');
                            }
                        }
                    }
                } catch (error) {
                    console.error('[App] Navigation error:', error);
                    
                    // ANALYTICS: Track navigation error
                    this.trackError('navigation_error', {
                        message: error.message,
                        targetPage: e.currentTarget.dataset.page
                    });
                    
                    if (window.uiManager) {
                        window.uiManager.showToast('Erreur de navigation: ' + error.message, 'error');
                    }
                }
            });
        });

        // [Reste des event listeners identique...]
        
        console.log('[App] ✅ Event listeners set up with license verification');
    }

    // [Garder toutes les autres méthodes existantes...]

    // =====================================
    // INITIALISATION DES MODULES CRITIQUES
    // =====================================
    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules...');
        
        // 1. Vérifier TaskManager
        await this.ensureTaskManagerReady();
        
        // 2. Vérifier PageManager
        await this.ensurePageManagerReady();
        
        // 3. Vérifier TasksView
        await this.ensureTasksViewReady();
        
        // 4. Vérifier DashboardModule
        await this.ensureDashboardModuleReady();
        
        // 5. Vérifier MailService avec fallback
        await this.ensureMailServiceReady();
        
        // 6. Vérifier les modules de scan
        await this.ensureScanModulesReady();
        
        // 7. Bind methods
        this.bindModuleMethods();
        
        // 8. Initialiser la gestion du scroll
        this.initializeScrollManager();
        
        console.log('[App] Critical modules initialized');
    }

    // =====================================
    // TRACKING ANALYTICS AVEC EMAIL EN CLAIR
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
                // Ajouter les infos de licence
                licenseStatus: this.licenseUser?.license_status,
                role: this.licenseUser?.role,
                company: this.licenseUser?.company?.name,
                // Données supplémentaires si disponibles
                homeAccountId: user.homeAccountId,
                localAccountId: user.localAccountId,
                tenantId: user.tenantId
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
    // TRACKING D'ÉVÉNEMENTS ANALYTICS
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
                licenseStatus: this.licenseUser?.license_status,
                userRole: this.licenseUser?.role,
                companyName: this.licenseUser?.company?.name
            };
            
            window.analyticsManager.trackEvent(eventType, enrichedData);
            console.log('[App] ✅ Event tracked:', eventType, enrichedData);
        } catch (error) {
            console.warn('[App] Error tracking event:', error);
        }
    }

    trackPageChange(pageName) {
        this.trackEvent('page_change', {
            page: pageName,
            previousPage: this.currentPage
        });
    }

    trackError(errorType, errorData) {
        if (!window.analyticsManager || typeof window.analyticsManager.onError !== 'function') {
            return;
        }
        
        try {
            window.analyticsManager.onError(errorType, {
                ...errorData,
                userEmail: this.user?.email || this.user?.mail || 'anonymous',
                provider: this.activeProvider || 'unknown',
                licenseStatus: this.licenseUser?.license_status
            });
            console.log('[App] ✅ Error tracked:', errorType, errorData);
        } catch (error) {
            console.warn('[App] Error tracking error:', error);
        }
    }

    // [Garder toutes les autres méthodes existantes comme ensureMailServiceReady, etc...]

    // =====================================
    // MÉTHODES RESTANTES NON MODIFIÉES
    // =====================================
    
    // Copier ici toutes les autres méthodes de la classe App qui n'ont pas été modifiées
    // comme ensureMailServiceReady, createMailServiceFallback, ensureTaskManagerReady, etc.
    // Pour éviter de répéter tout le code, je suppose qu'elles restent identiques
    
    async ensureMailServiceReady() {
        console.log('[App] Ensuring MailService is ready...');
        
        if (window.mailService && typeof window.mailService.getEmails === 'function') {
            console.log('[App] ✅ MailService already ready');
            return true;
        }
        
        // Attendre le chargement du service
        let attempts = 0;
        const maxAttempts = 30;
        
        while ((!window.mailService || typeof window.mailService.getEmails !== 'function') && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.mailService || typeof window.mailService.getEmails !== 'function') {
            console.warn('[App] MailService not ready, creating fallback...');
            this.createMailServiceFallback();
            return false;
        }
        
        console.log('[App] ✅ MailService ready');
        return true;
    }

    createMailServiceFallback() {
        console.log('[App] Creating MailService fallback...');
        
        if (!window.mailService) {
            window.mailService = {};
        }
        
        // Créer des méthodes fallback sécurisées
        const fallbackMethods = {
            getEmails: async () => {
                console.warn('[MailService] Fallback: getEmails called - returning empty array');
                return [];
            },
            
            getFolders: async () => {
                console.warn('[MailService] Fallback: getFolders called - returning default folders');
                return [
                    { id: 'inbox', displayName: 'Boîte de réception', totalItemCount: 0 },
                    { id: 'sent', displayName: 'Éléments envoyés', totalItemCount: 0 }
                ];
            },
            
            getEmailCount: async () => {
                console.warn('[MailService] Fallback: getEmailCount called - returning 0');
                return 0;
            },
            
            searchEmails: async () => {
                console.warn('[MailService] Fallback: searchEmails called - returning empty array');
                return [];
            },
            
            moveToFolder: async () => {
                console.warn('[MailService] Fallback: moveToFolder called - operation skipped');
                return true;
            },
            
            markAsRead: async () => {
                console.warn('[MailService] Fallback: markAsRead called - operation skipped');
                return true;
            },
            
            deleteEmail: async () => {
                console.warn('[MailService] Fallback: deleteEmail called - operation skipped');
                return true;
            }
        };
        
        // Ajouter les méthodes manquantes
        Object.keys(fallbackMethods).forEach(method => {
            if (typeof window.mailService[method] !== 'function') {
                window.mailService[method] = fallbackMethods[method];
            }
        });
        
        console.log('[App] ✅ MailService fallback created');
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

    async ensureDashboardModuleReady() {
        console.log('[App] Ensuring DashboardModule is ready...');
        
        if (window.dashboardModule) {
            console.log('[App] ✅ DashboardModule already ready');
            return true;
        }
        
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!window.dashboardModule && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.dashboardModule) {
            console.error('[App] DashboardModule not ready after 3 seconds');
            return false;
        }
        
        console.log('[App] ✅ DashboardModule ready');
        return true;
    }

    async ensureScanModulesReady() {
        console.log('[App] Ensuring scan modules are ready...');
        
        // Vérifier minimalScanModule
        if (window.minimalScanModule) {
            console.log('[App] ✅ MinimalScanModule available');
            
            // Vérifier que les méthodes essentielles existent
            if (typeof window.minimalScanModule.render !== 'function') {
                console.warn('[App] MinimalScanModule.render not available, creating fallback...');
                this.createScanModuleFallback();
            }
        } else {
            console.warn('[App] MinimalScanModule not available, creating fallback...');
            this.createScanModuleFallback();
        }
        
        // Vérifier emailScanner
        if (!window.emailScanner) {
            console.warn('[App] EmailScanner not available, creating fallback...');
            this.createEmailScannerFallback();
        }
        
        console.log('[App] ✅ Scan modules ready');
    }

    createScanModuleFallback() {
        console.log('[App] Creating scan module fallback...');
        
        window.minimalScanModule = {
            render: () => {
                console.log('[ScanFallback] Rendering fallback scanner...');
                
                const pageContent = document.getElementById('pageContent');
                if (!pageContent) {
                    console.error('[ScanFallback] pageContent not found');
                    return;
                }
                
                pageContent.innerHTML = `
                    <div class="page-container">
                        <div class="page-header">
                            <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                            <p>Service de scan temporairement indisponible</p>
                        </div>
                        <div class="fallback-content">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div>
                                    <h3>Service temporairement indisponible</h3>
                                    <p>Le scanner d'emails n'est pas disponible pour le moment. Veuillez réessayer plus tard.</p>
                                    <button onclick="window.pageManager.loadPage('dashboard')" class="btn btn-primary">
                                        <i class="fas fa-home"></i> Retour au tableau de bord
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                console.log('[ScanFallback] Fallback scanner rendered');
            },
            
            initialize: () => {
                console.log('[ScanFallback] Initialize called');
                return Promise.resolve();
            }
        };
        
        console.log('[App] ✅ Scan module fallback created');
    }

    createEmailScannerFallback() {
        console.log('[App] Creating email scanner fallback...');
        
        window.emailScanner = {
            scanEmails: async () => {
                console.warn('[EmailScanner] Fallback: scanEmails called');
                return {
                    success: false,
                    message: 'Service de scan temporairement indisponible',
                    emails: []
                };
            },
            
            analyzeEmails: async () => {
                console.warn('[EmailScanner] Fallback: analyzeEmails called');
                return {
                    categories: [],
                    stats: { total: 0, analyzed: 0 }
                };
            }
        };
        
        console.log('[App] ✅ Email scanner fallback created');
    }

    // =====================================
    // GESTION INTELLIGENTE DU SCROLL
    // =====================================
    initializeScrollManager() {
        console.log('[App] Initializing scroll manager...');
        
        // Variables pour éviter les boucles infinies
        let scrollCheckInProgress = false;
        let lastScrollState = null;
        let lastContentHeight = 0;
        let lastViewportHeight = 0;
        
        // Ajouter checkScrollNeeded au window pour l'utiliser globalement
        window.checkScrollNeeded = this.checkScrollNeeded;
        
        // Fonction pour vérifier si le scroll est nécessaire
        this.checkScrollNeeded = () => {
            if (scrollCheckInProgress) {
                return;
            }
            
            scrollCheckInProgress = true;
            
            setTimeout(() => {
                try {
                    const body = document.body;
                    const contentHeight = document.documentElement.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    const currentPage = this.currentPage || 'dashboard';
                    
                    // Vérifier si les dimensions ont réellement changé
                    const dimensionsChanged = 
                        Math.abs(contentHeight - lastContentHeight) > 10 || 
                        Math.abs(viewportHeight - lastViewportHeight) > 10;
                    
                    lastContentHeight = contentHeight;
                    lastViewportHeight = viewportHeight;
                    
                    // Dashboard: JAMAIS de scroll
                    if (currentPage === 'dashboard') {
                        const newState = 'dashboard-no-scroll';
                        if (lastScrollState !== newState) {
                            body.classList.remove('needs-scroll');
                            body.style.overflow = 'hidden';
                            body.style.overflowY = 'hidden';
                            body.style.overflowX = 'hidden';
                            lastScrollState = newState;
                        }
                        scrollCheckInProgress = false;
                        return;
                    }
                    
                    // Autres pages: scroll seulement si vraiment nécessaire
                    const threshold = 100;
                    const needsScroll = contentHeight > viewportHeight + threshold;
                    const newState = needsScroll ? 'scroll-enabled' : 'scroll-disabled';
                    
                    if (lastScrollState !== newState || dimensionsChanged) {
                        if (needsScroll) {
                            body.classList.add('needs-scroll');
                            body.style.overflow = '';
                            body.style.overflowY = '';
                            body.style.overflowX = '';
                        } else {
                            body.classList.remove('needs-scroll');
                            body.style.overflow = 'hidden';
                            body.style.overflowY = 'hidden';
                            body.style.overflowX = 'hidden';
                        }
                        lastScrollState = newState;
                    }
                    
                } catch (error) {
                    console.error('[SCROLL_MANAGER] Error checking scroll:', error);
                } finally {
                    scrollCheckInProgress = false;
                }
            }, 150);
        };

        // Fonction pour définir le mode de page avec analytics
        window.setPageMode = (pageName) => {
            if (!pageName || this.currentPage === pageName) {
                return;
            }
            
            const body = document.body;
            
            // Mettre à jour la page actuelle et tracker le changement
            const previousPage = this.currentPage;
            this.currentPage = pageName;
            
            // ANALYTICS: Track page change
            this.trackPageChange(pageName);
            
            console.log(`[App] Page mode changed: ${previousPage} → ${pageName}`);
            
            // Nettoyer les anciennes classes de page
            body.classList.remove(
                'page-dashboard', 'page-scanner', 'page-emails', 
                'page-tasks', 'page-ranger', 'page-settings', 
                'needs-scroll', 'login-mode'
            );
            
            // Ajouter la nouvelle classe de page
            body.classList.add(`page-${pageName}`);
            
            // Réinitialiser l'état du scroll
            lastScrollState = null;
            lastContentHeight = 0;
            lastViewportHeight = 0;
            
            // Dashboard: configuration immédiate
            if (pageName === 'dashboard') {
                body.style.overflow = 'hidden';
                body.style.overflowY = 'hidden';
                body.style.overflowX = 'hidden';
                lastScrollState = 'dashboard-no-scroll';
                return;
            }
            
            // Autres pages: vérifier après stabilisation du contenu
            setTimeout(() => {
                if (this.currentPage === pageName) {
                    this.checkScrollNeeded();
                }
            }, 300);
        };

        // Observer pour les changements de contenu avec gestion d'erreurs
        if (window.MutationObserver) {
            let observerTimeout;
            let pendingMutations = false;
            
            const contentObserver = new MutationObserver((mutations) => {
                try {
                    if (this.currentPage === 'dashboard') {
                        return;
                    }
                    
                    const significantChanges = mutations.some(mutation => {
                        try {
                            if (mutation.type === 'attributes') {
                                const attrName = mutation.attributeName;
                                const target = mutation.target;
                                
                                if (attrName === 'style' && target === document.body) {
                                    return false;
                                }
                                if (attrName === 'class' && target === document.body) {
                                    return false;
                                }
                            }
                            
                            if (mutation.type === 'childList') {
                                return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
                            }
                            
                            return false;
                        } catch (error) {
                            console.warn('[ScrollManager] Error processing mutation:', error);
                            return false;
                        }
                    });
                    
                    if (significantChanges && !pendingMutations) {
                        pendingMutations = true;
                        clearTimeout(observerTimeout);
                        
                        observerTimeout = setTimeout(() => {
                            if (this.currentPage !== 'dashboard' && !scrollCheckInProgress) {
                                this.checkScrollNeeded();
                            }
                            pendingMutations = false;
                        }, 250);
                    }
                } catch (error) {
                    console.error('[ScrollManager] Observer error:', error);
                }
            });

            try {
                contentObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                    attributeOldValue: false
                });
                console.log('[App] ✅ Content observer initialized');
            } catch (error) {
                console.warn('[App] Could not initialize content observer:', error);
            }
        }

        // Gestionnaire de redimensionnement
        let resizeTimeout;
        let lastWindowSize = { width: window.innerWidth, height: window.innerHeight };
        
        window.addEventListener('resize', () => {
            try {
                const currentSize = { width: window.innerWidth, height: window.innerHeight };
                
                const sizeChanged = 
                    Math.abs(currentSize.width - lastWindowSize.width) > 10 ||
                    Math.abs(currentSize.height - lastWindowSize.height) > 10;
                
                if (!sizeChanged || this.currentPage === 'dashboard') {
                    return;
                }
                
                lastWindowSize = currentSize;
                
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (this.currentPage !== 'dashboard' && !scrollCheckInProgress) {
                        this.checkScrollNeeded();
                    }
                }, 300);
            } catch (error) {
                console.error('[ScrollManager] Resize error:', error);
            }
        });

        console.log('[App] ✅ Scroll manager initialized');
    }
