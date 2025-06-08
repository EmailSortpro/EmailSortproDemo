// AuthService.js - Version 8.0 - CORRECTION AUTHENTIFICATION

class AuthService {
    constructor() {
        console.log('[AuthService] Constructor v8.0 - Correction authentification');
        console.log('[AuthService] Current domain:', window.CURRENT_HOSTNAME);
        console.log('[AuthService] Test environment:', window.IS_TEST_ENV);

        this.msalInstance = null;
        this.isInitialized = false;
        this.config = null;
        this.currentUser = null;
        this.isAuthenticating = false;

        this.waitForConfiguration();
    }

    async waitForConfiguration() {
        console.log('[AuthService] Waiting for configuration...');
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.AppConfig && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log(`[AuthService] ✅ Configuration available after ${attempts} attempts`);
        this.validateConfiguration();
    }

    validateConfiguration() {
        if (!window.AppConfig) {
            throw new Error('AppConfig not available after waiting');
        }

        if (window.AppConfig.error) {
            throw new Error(`Configuration error: ${window.AppConfig.message}`);
        }

        const validation = window.AppConfig.validate();
        console.log('[AuthService] Configuration validation:', validation);
        
        if (!validation.valid) {
            throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
        }

        this.config = {
            clientId: window.AppConfig.msal.clientId,
            authority: window.AppConfig.msal.authority,
            redirectUri: window.AppConfig.msal.redirectUri,
            postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri,
            scopes: window.AppConfig.scopes.login,
            domain: window.CURRENT_HOSTNAME
        };

        console.log('[AuthService] ✅ Configuration validated for', this.config.domain);
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('[AuthService] Already initialized');
            return;
        }

        console.log('[AuthService] Initialize called for', this.config.domain);

        try {
            await this.initializeMsal();
            this.isInitialized = true;
            console.log('[AuthService] ✅ Initialization completed for', this.config.domain);
        } catch (error) {
            console.error('[AuthService] ❌ Initialization failed:', error);
            throw error;
        }
    }

    async initializeMsal() {
        console.log('[AuthService] Starting initialization for', this.config.domain);
        
        // Vérifier que MSAL est disponible
        if (typeof msal === 'undefined') {
            throw new Error('MSAL library not loaded');
        }
        console.log('[AuthService] ✅ MSAL library available');

        // Configuration MSAL
        const msalConfig = {
            auth: {
                clientId: this.config.clientId,
                authority: this.config.authority,
                redirectUri: this.config.redirectUri,
                postLogoutRedirectUri: this.config.postLogoutRedirectUri
            },
            cache: {
                cacheLocation: 'localStorage',
                storeAuthStateInCookie: true
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (window.IS_TEST_ENV) {
                            console.log(`[MSAL ${level}] ${message}`);
                        }
                    },
                    piiLoggingEnabled: false,
                    logLevel: window.IS_TEST_ENV ? 'Verbose' : 'Warning'
                }
            }
        };

        console.log('[AuthService] Using configuration:', {
            clientId: this.config.clientId.substring(0, 8) + '...',
            authority: this.config.authority,
            redirectUri: this.config.redirectUri,
            domain: this.config.domain
        });

        // Créer l'instance MSAL
        this.msalInstance = new msal.PublicClientApplication(msalConfig);
        console.log('[AuthService] ✅ MSAL instance created for', this.config.domain);

        // Initialiser MSAL
        await this.msalInstance.initialize();
        console.log('[AuthService] ✅ MSAL instance initialized');

        // Gérer la réponse de redirection
        console.log('[AuthService] Checking for redirect response...');
        const response = await this.msalInstance.handleRedirectPromise();
        
        if (response) {
            console.log('[AuthService] ✅ Redirect response received:', {
                username: response.account?.username,
                name: response.account?.name
            });
            this.currentUser = response.account;
        } else {
            console.log('[AuthService] No redirect response, checking existing accounts...');
            
            // Vérifier s'il y a déjà un compte connecté
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                console.log('[AuthService] ✅ Found existing account:', {
                    username: accounts[0].username,
                    name: accounts[0].name
                });
                this.currentUser = accounts[0];
            } else {
                console.log('[AuthService] No existing accounts found');
                this.currentUser = null;
            }
        }
    }

    // =====================================
    // MÉTHODES D'AUTHENTIFICATION - CORRIGÉES
    // =====================================
    isAuthenticated() {
        if (!this.isInitialized || !this.msalInstance) {
            console.log('[AuthService] Not initialized, returning false');
            return {
                isAuthenticated: false,
                hasAccount: false,
                isInitialized: false,
                result: false,
                domain: this.config?.domain || window.CURRENT_HOSTNAME
            };
        }

        const accounts = this.msalInstance.getAllAccounts();
        const hasAccount = accounts.length > 0;
        
        // CORRECTION CRITIQUE : Utiliser les comptes MSAL, pas seulement currentUser
        const isAuthenticated = hasAccount && accounts[0] != null;
        
        if (isAuthenticated && !this.currentUser) {
            // Mettre à jour currentUser si on a trouvé un compte
            this.currentUser = accounts[0];
        }

        const result = {
            isAuthenticated: isAuthenticated,
            hasAccount: hasAccount,
            isInitialized: this.isInitialized,
            result: isAuthenticated, // CORRECTION : retourner isAuthenticated, pas hasAccount
            domain: this.config.domain,
            account: isAuthenticated ? accounts[0] : null
        };

        console.log('[AuthService] Authentication check:', result);
        return result;
    }

    async login() {
        if (this.isAuthenticating) {
            console.log('[AuthService] Login already in progress');
            return;
        }

        this.isAuthenticating = true;

        try {
            console.log('[AuthService] Starting login process...');

            if (!this.isInitialized || !this.msalInstance) {
                throw new Error('AuthService not initialized');
            }

            // Vérifier si déjà connecté
            const authStatus = this.isAuthenticated();
            if (authStatus.isAuthenticated) {
                console.log('[AuthService] Already authenticated, skipping login');
                this.isAuthenticating = false;
                return authStatus.account;
            }

            const loginRequest = {
                scopes: this.config.scopes,
                prompt: 'select_account'
            };

            console.log('[AuthService] Attempting popup login...');
            
            try {
                // Essayer le login popup d'abord
                const response = await this.msalInstance.loginPopup(loginRequest);
                
                if (response && response.account) {
                    this.currentUser = response.account;
                    console.log('[AuthService] ✅ Popup login successful:', {
                        username: response.account.username,
                        name: response.account.name
                    });
                    return response.account;
                }
            } catch (popupError) {
                console.log('[AuthService] Popup failed, trying redirect:', popupError.message);
                
                // Si popup échoue, utiliser redirect
                await this.msalInstance.loginRedirect(loginRequest);
                return null; // Le redirect va recharger la page
            }

        } catch (error) {
            console.error('[AuthService] ❌ Login failed:', error);
            throw this.processError(error);
        } finally {
            this.isAuthenticating = false;
        }
    }

    async logout() {
        try {
            console.log('[AuthService] Starting logout...');

            if (!this.isInitialized || !this.msalInstance) {
                throw new Error('AuthService not initialized');
            }

            const logoutRequest = {
                postLogoutRedirectUri: this.config.postLogoutRedirectUri,
                mainWindowRedirectUri: this.config.postLogoutRedirectUri
            };

            // Nettoyer l'état local
            this.currentUser = null;

            // Déconnexion MSAL
            await this.msalInstance.logoutPopup(logoutRequest);
            console.log('[AuthService] ✅ Logout successful');

        } catch (error) {
            console.error('[AuthService] ❌ Logout failed:', error);
            
            // Fallback : nettoyer manuellement et rediriger
            this.currentUser = null;
            if (this.msalInstance) {
                try {
                    await this.msalInstance.logoutRedirect({
                        postLogoutRedirectUri: this.config.postLogoutRedirectUri
                    });
                } catch (redirectError) {
                    console.error('[AuthService] Redirect logout also failed:', redirectError);
                    // Dernière option : recharger la page
                    window.location.href = this.config.postLogoutRedirectUri;
                }
            }
        }
    }

    async getUserInfo() {
        if (!this.isInitialized || !this.msalInstance) {
            throw new Error('AuthService not initialized');
        }

        // Vérifier l'authentification
        const authStatus = this.isAuthenticated();
        if (!authStatus.isAuthenticated) {
            throw new Error('User not authenticated');
        }

        // Utiliser le compte existant
        const account = authStatus.account || this.currentUser;
        if (!account) {
            throw new Error('No account found');
        }

        try {
            // Essayer d'obtenir un token pour accéder à Graph API
            console.log('[AuthService] Requesting access token for scopes:', this.config.scopes);
            
            const tokenRequest = {
                scopes: this.config.scopes,
                account: account,
                forceRefresh: false
            };

            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            console.log('[AuthService] ✅ Token acquired successfully');

            // Récupérer les infos utilisateur depuis Graph API
            console.log('[AuthService] Fetching user info from Graph API');
            const userInfo = await this.fetchUserInfoFromGraph(response.accessToken);
            console.log('[AuthService] ✅ User info retrieved:', userInfo.displayName);

            return userInfo;

        } catch (error) {
            console.error('[AuthService] Error getting user info:', error);
            
            // Fallback : utiliser les informations du compte MSAL
            return {
                id: account.localAccountId,
                displayName: account.name || account.username,
                mail: account.username,
                userPrincipalName: account.username
            };
        }
    }

    async fetchUserInfoFromGraph(accessToken) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async getAccessToken(scopes = null) {
        if (!this.isInitialized || !this.msalInstance) {
            throw new Error('AuthService not initialized');
        }

        const authStatus = this.isAuthenticated();
        if (!authStatus.isAuthenticated) {
            throw new Error('User not authenticated');
        }

        const account = authStatus.account || this.currentUser;
        const requestScopes = scopes || this.config.scopes;

        try {
            const tokenRequest = {
                scopes: requestScopes,
                account: account,
                forceRefresh: false
            };

            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            return response.accessToken;

        } catch (error) {
            console.log('[AuthService] Silent token acquisition failed, trying popup...');
            
            try {
                const tokenRequest = {
                    scopes: requestScopes,
                    account: account
                };

                const response = await this.msalInstance.acquireTokenPopup(tokenRequest);
                return response.accessToken;

            } catch (popupError) {
                console.error('[AuthService] Token acquisition failed:', popupError);
                throw this.processError(popupError);
            }
        }
    }

    // =====================================
    // GESTION D'ERREURS
    // =====================================
    processError(error) {
        const errorCode = error.errorCode || error.code || error.name || 'unknown_error';
        const errorMessage = error.errorMessage || error.message || 'Erreur inconnue';

        console.error('[AuthService] Processing error:', {
            code: errorCode,
            message: errorMessage,
            original: error
        });

        // Messages d'erreur personnalisés
        const friendlyMessages = {
            'popup_window_error': 'Popup bloquée. Autorisez les popups pour ce site.',
            'user_cancelled': 'Connexion annulée par l\'utilisateur.',
            'network_error': 'Erreur réseau. Vérifiez votre connexion.',
            'invalid_client': 'Configuration invalide. Contactez l\'administrateur.',
            'unauthorized_client': 'Application non autorisée pour ce domaine.',
            'consent_required': 'Autorisation requise. Acceptez les permissions.',
            'interaction_required': 'Interaction requise. Reconnectez-vous.',
            'login_required': 'Connexion requise.',
            'token_expired': 'Session expirée. Reconnectez-vous.',
            'invalid_request': 'Requête invalide. Vérifiez la configuration.',
            'temporarily_unavailable': 'Service temporairement indisponible. Réessayez plus tard.'
        };

        const friendlyMessage = friendlyMessages[errorCode] || errorMessage;

        return {
            code: errorCode,
            message: friendlyMessage,
            originalError: error,
            timestamp: new Date().toISOString()
        };
    }

    // =====================================
    // MÉTHODES UTILITAIRES
    // =====================================
    getConfiguration() {
        return {
            domain: this.config?.domain,
            clientId: this.config?.clientId?.substring(0, 8) + '...',
            redirectUri: this.config?.redirectUri,
            isInitialized: this.isInitialized,
            hasUser: !!this.currentUser
        };
    }

    getDebugInfo() {
        const accounts = this.msalInstance?.getAllAccounts() || [];
        
        return {
            isInitialized: this.isInitialized,
            hasInstance: !!this.msalInstance,
            currentUser: this.currentUser ? {
                username: this.currentUser.username,
                name: this.currentUser.name
            } : null,
            accountsCount: accounts.length,
            accounts: accounts.map(acc => ({
                username: acc.username,
                name: acc.name
            })),
            config: this.getConfiguration(),
            timestamp: new Date().toISOString()
        };
    }
}

// Créer l'instance globale
window.authService = new AuthService();

// Bind des méthodes pour préserver le contexte
Object.getOwnPropertyNames(AuthService.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.authService[name] === 'function') {
        window.authService[name] = window.authService[name].bind(window.authService);
    }
});

console.log('[AuthService] ✅ Global instance created for', window.CURRENT_HOSTNAME);

// Debug function globale
window.checkAuth = function() {
    console.log('=== AUTH DEBUG ===');
    if (window.authService) {
        const debug = window.authService.getDebugInfo();
        console.log('Auth Debug Info:', debug);
        
        const authStatus = window.authService.isAuthenticated();
        console.log('Auth Status:', authStatus);
        
        return { debug, authStatus };
    } else {
        console.log('AuthService not available');
        return null;
    }
};

console.log('✅ AuthService v8.0 loaded - Correction authentification');
