// AuthService.js - Service d'authentification Microsoft pour EmailSortPro
// Gère l'authentification avec Microsoft Graph API et les tokens d'accès

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.initialized = false;
        this.loginInProgress = false; // AJOUT : pour éviter les logins multiples
        this.scopes = {
            login: [
                'https://graph.microsoft.com/User.Read',
                'https://graph.microsoft.com/Mail.Read',
                'https://graph.microsoft.com/Mail.ReadWrite'
            ]
        };
        
        console.log('[AuthService] Service created');
    }

    async initialize() {
        if (this.initialized) {
            console.log('[AuthService] Already initialized');
            return true;
        }

        try {
            console.log('[AuthService] Initializing...');
            
            // Vérifier la configuration
            if (!window.AppConfig || !window.AppConfig.msal) {
                throw new Error('AppConfig not found or invalid');
            }

            // Valider la configuration
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                console.error('[AuthService] Configuration invalid:', validation.issues);
                throw new Error('Invalid configuration: ' + validation.issues.join(', '));
            }

            // Créer l'instance MSAL
            this.msalInstance = new msal.PublicClientApplication(window.AppConfig.msal);
            
            // Attendre l'initialisation
            await this.msalInstance.initialize();
            
            console.log('[AuthService] MSAL initialized successfully');
            
            // Gérer la réponse de redirection si présente
            try {
                const response = await this.msalInstance.handleRedirectPromise();
                if (response && response.account) {
                    console.log('[AuthService] Redirect response handled');
                    this.account = response.account;
                    
                    // AJOUT : Vérifier la licence après authentification
                    await this.checkUserLicenseAfterAuth();
                }
            } catch (error) {
                console.warn('[AuthService] No redirect to handle or error handling redirect:', error);
            }

            // Vérifier les comptes en cache
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0 && !this.account) {
                console.log('[AuthService] Found cached account');
                this.account = accounts[0];
                
                // AJOUT : Vérifier la licence pour le compte en cache
                await this.checkUserLicenseAfterAuth();
            }

            this.initialized = true;
            console.log('[AuthService] Initialization complete');
            return true;

        } catch (error) {
            console.error('[AuthService] Initialization error:', error);
            
            // AJOUT : Propager les erreurs de licence
            if (error.message && error.message.includes('LICENSE_')) {
                throw error;
            }
            
            throw error;
        }
    }

    async login() {
        // AJOUT : Vérifier si un login est déjà en cours
        if (this.loginInProgress) {
            console.log('[AuthService] Login already in progress, skipping...');
            return null;
        }

        try {
            this.loginInProgress = true; // AJOUT : Marquer le login comme en cours
            console.log('[AuthService] Starting login process...');
            
            if (!this.initialized) {
                await this.initialize();
            }

            const loginRequest = {
                scopes: this.scopes.login,
                prompt: 'select_account'
            };

            // Essayer la connexion avec popup d'abord
            try {
                console.log('[AuthService] Attempting popup login...');
                const response = await this.msalInstance.loginPopup(loginRequest);
                
                if (response && response.account) {
                    console.log('[AuthService] Popup login successful');
                    this.account = response.account;
                    
                    // AJOUT : Vérifier/créer la licence après connexion
                    await this.checkUserLicenseAfterAuth();
                    
                    // Tracking analytics
                    if (window.analyticsManager) {
                        window.analyticsManager.trackAuthentication('microsoft', {
                            name: this.account.name,
                            email: this.account.username,
                            id: this.account.localAccountId
                        });
                    }
                    
                    this.loginInProgress = false; // AJOUT : Réinitialiser le flag
                    return response;
                }
            } catch (popupError) {
                console.warn('[AuthService] Popup login failed:', popupError);
                
                // Vérifier si c'est une erreur d'interaction en cours
                if (popupError.errorCode === 'interaction_in_progress') {
                    console.log('[AuthService] Interaction in progress, waiting...');
                    this.loginInProgress = false;
                    
                    // Attendre un peu et retourner null
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return null;
                }
                
                if (popupError.errorCode === 'popup_window_error' || 
                    popupError.errorCode === 'empty_window_error') {
                    // Fallback vers redirect
                    console.log('[AuthService] Falling back to redirect login...');
                    await this.msalInstance.loginRedirect(loginRequest);
                    // La page sera rechargée, handleRedirectPromise gérera la suite
                } else {
                    throw popupError;
                }
            }

        } catch (error) {
            console.error('[AuthService] Login error:', error);
            
            // AJOUT : Propager les erreurs de licence
            if (error.message && error.message.includes('LICENSE_')) {
                throw error;
            }
            
            this.handleAuthError(error);
            throw error;
        } finally {
            this.loginInProgress = false; // AJOUT : Toujours réinitialiser le flag
        }
    }

    // AJOUT : Méthode pour vérifier la licence après authentification
    async checkUserLicenseAfterAuth() {
        try {
            if (!window.licenseService || !this.account) {
                console.log('[AuthService] License service not available or no account');
                return;
            }

            const email = this.account.username || this.account.mail || this.account.userPrincipalName;
            const name = this.account.name || this.account.displayName;

            console.log('[AuthService] Checking license for:', email);

            // Vérifier si l'utilisateur existe
            const userExists = await window.licenseService.checkUserExists(email);
            
            if (!userExists) {
                console.log('[AuthService] New user detected, creating trial license...');
                
                // Créer l'utilisateur avec licence d'essai
                const result = await window.licenseService.createUserWithTrial({
                    email: email,
                    name: name,
                    trialDays: 15
                });
                
                if (!result.success) {
                    throw new Error('Failed to create trial: ' + result.error);
                }
                
                // Afficher message de bienvenue
                if (window.uiManager) {
                    window.uiManager.showToast(
                        '🎉 Bienvenue ! Votre période d\'essai de 15 jours commence maintenant.',
                        'success',
                        5000
                    );
                }
            } else {
                // Vérifier le statut de la licence existante
                const licenseStatus = await window.licenseService.checkLicenseStatus(email);
                
                if (!licenseStatus.valid) {
                    if (licenseStatus.reason === 'expired') {
                        throw new Error('LICENSE_EXPIRED');
                    } else if (licenseStatus.reason === 'blocked') {
                        throw new Error('LICENSE_BLOCKED');
                    }
                    throw new Error('LICENSE_INVALID');
                }
                
                // Avertir si expiration proche
                if (licenseStatus.daysRemaining && licenseStatus.daysRemaining <= 5) {
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            `⚠️ Votre licence expire dans ${licenseStatus.daysRemaining} jour(s)`,
                            'warning',
                            5000
                        );
                    }
                }
            }
            
        } catch (error) {
            console.error('[AuthService] License check error:', error);
            
            // Si c'est une erreur de licence critique, la propager
            if (error.message && error.message.includes('LICENSE_')) {
                throw error;
            }
            
            // Sinon, permettre l'accès (mode dégradé)
            console.warn('[AuthService] Allowing access despite license error');
        }
    }

    async logout() {
        try {
            console.log('[AuthService] Starting logout...');
            
            if (!this.msalInstance) {
                console.log('[AuthService] No MSAL instance, clearing cache only');
                this.clearCache();
                return;
            }

            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length === 0) {
                console.log('[AuthService] No accounts to logout');
                this.clearCache();
                return;
            }

            const logoutRequest = {
                account: accounts[0],
                postLogoutRedirectUri: window.AppConfig?.msal?.postLogoutRedirectUri || window.location.origin
            };

            // Nettoyer avant la déconnexion
            this.clearCache();

            // Effectuer la déconnexion
            await this.msalInstance.logoutRedirect(logoutRequest);

        } catch (error) {
            console.error('[AuthService] Logout error:', error);
            // Force cleanup en cas d'erreur
            this.forceCleanup();
            throw error;
        }
    }

    async getToken(scopes = null) {
        try {
            if (!this.account) {
                throw new Error('No authenticated account');
            }

            const tokenRequest = {
                scopes: scopes || this.scopes.login,
                account: this.account,
                forceRefresh: false
            };

            // Essayer d'obtenir le token silencieusement
            try {
                const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
                return response.accessToken;
            } catch (silentError) {
                console.warn('[AuthService] Silent token acquisition failed:', silentError);
                
                // Si l'erreur nécessite une interaction
                if (silentError instanceof msal.InteractionRequiredAuthError) {
                    // Essayer avec popup
                    try {
                        const response = await this.msalInstance.acquireTokenPopup(tokenRequest);
                        return response.accessToken;
                    } catch (popupError) {
                        console.error('[AuthService] Popup token acquisition failed:', popupError);
                        // En dernier recours, rediriger
                        await this.msalInstance.acquireTokenRedirect(tokenRequest);
                    }
                }
                
                throw silentError;
            }

        } catch (error) {
            console.error('[AuthService] Token acquisition error:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    isAuthenticated() {
        return !!this.account;
    }

    getUser() {
        if (!this.account) return null;
        
        return {
            id: this.account.localAccountId || this.account.homeAccountId,
            name: this.account.name,
            email: this.account.username,
            displayName: this.account.name,
            mail: this.account.username,
            userPrincipalName: this.account.username,
            provider: 'microsoft'
        };
    }

    handleAuthError(error) {
        console.error('[AuthService] Authentication error:', error);
        
        let userMessage = 'Erreur d\'authentification';
        
        if (error.errorCode) {
            switch (error.errorCode) {
                case 'user_cancelled':
                    userMessage = 'Connexion annulée';
                    break;
                case 'consent_required':
                    userMessage = 'Autorisation requise - Veuillez accepter les permissions';
                    break;
                case 'interaction_required':
                    userMessage = 'Reconnexion requise';
                    break;
                case 'login_required':
                    userMessage = 'Connexion requise';
                    break;
                case 'invalid_grant':
                    userMessage = 'Session expirée - Veuillez vous reconnecter';
                    break;
                case 'popup_window_error':
                    userMessage = 'Popup bloquée - Autoriser les popups pour ce site';
                    break;
                case 'interaction_in_progress':
                    userMessage = 'Une connexion est déjà en cours...';
                    break;
                default:
                    userMessage = `Erreur: ${error.errorCode}`;
            }
        }
        
        if (window.uiManager) {
            window.uiManager.showToast(userMessage, 'error', 5000);
        }
    }

    clearCache() {
        this.account = null;
        this.loginInProgress = false; // AJOUT : Réinitialiser le flag
        
        // Nettoyer les clés MSAL du localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('msal') || key.includes('login.windows'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Nettoyer sessionStorage aussi
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('msal') || key.includes('login.windows'))) {
                sessionKeysToRemove.push(key);
            }
        }
        
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
        
        console.log('[AuthService] Cache cleared');
    }

    forceCleanup() {
        console.log('[AuthService] Force cleanup initiated');
        this.clearCache();
        this.account = null;
        this.msalInstance = null;
        this.initialized = false;
        this.loginInProgress = false; // AJOUT : Réinitialiser le flag
    }

    // Méthode pour compatibilité
    async handleAuthCallback() {
        console.log('[AuthService] handleAuthCallback called - handled in initialize()');
        return this.initialize();
    }

    // Debug
    getDebugInfo() {
        return {
            initialized: this.initialized,
            hasAccount: !!this.account,
            accountEmail: this.account?.username || null,
            msalConfigured: !!this.msalInstance,
            environment: window.AppConfig?.app?.environment || 'unknown',
            loginInProgress: this.loginInProgress // AJOUT : Pour le debug
        };
    }
}

// Créer l'instance globale
window.authService = new AuthService();

console.log('[AuthService] ✅ Service loaded');
