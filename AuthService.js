// AuthService.js - Service d'authentification Microsoft Graph CORRIGÉ v6.0

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.configCheckAttempts = 0;
        this.maxConfigCheckAttempts = 100; // 10 secondes max
        
        this.currentDomain = window.location.hostname;
        this.isTestEnvironment = this.currentDomain.includes('coruscating-dodol') || 
                                 this.currentDomain.includes('localhost') || 
                                 this.currentDomain.includes('127.0.0.1') ||
                                 this.currentDomain.includes('preview');
        
        console.log('[AuthService] Constructor v6.0 - Multi-domain support');
        console.log('[AuthService] Current domain:', this.currentDomain);
        console.log('[AuthService] Test environment:', this.isTestEnvironment);
        
        // Attendre que la configuration soit disponible
        this.waitForConfiguration();
    }

    async waitForConfiguration() {
        console.log('[AuthService] Waiting for configuration...');
        
        const checkConfig = () => {
            this.configCheckAttempts++;
            
            if (window.AppConfig && !window.AppConfig.error) {
                console.log('[AuthService] ✅ Configuration available after', this.configCheckAttempts, 'attempts');
                this.validateConfiguration();
                return true;
            }
            
            if (this.configCheckAttempts >= this.maxConfigCheckAttempts) {
                console.error('[AuthService] ❌ Configuration timeout after', this.maxConfigCheckAttempts, 'attempts');
                this.handleConfigurationError('Configuration timeout');
                return false;
            }
            
            console.log(`[AuthService] Configuration not ready, attempt ${this.configCheckAttempts}/${this.maxConfigCheckAttempts}`);
            setTimeout(checkConfig, 100);
            return false;
        };
        
        checkConfig();
    }

    validateConfiguration() {
        if (!window.AppConfig) {
            throw new Error('AppConfig not available');
        }
        
        const validation = window.AppConfig.validate();
        console.log('[AuthService] Configuration validation:', validation);
        
        if (!validation.valid) {
            console.warn('[AuthService] Configuration issues:', validation.issues);
            // Continuer quand même mais noter les problèmes
        }
        
        // Vérifier la compatibilité du domaine
        const configuredDomain = new URL(window.AppConfig.msal.redirectUri).hostname;
        if (configuredDomain !== this.currentDomain) {
            console.warn('[AuthService] ⚠️ Domain mismatch detected');
            console.warn('[AuthService] Current:', this.currentDomain);
            console.warn('[AuthService] Configured:', configuredDomain);
        }
        
        console.log('[AuthService] ✅ Configuration validated for', this.currentDomain);
    }

    handleConfigurationError(message) {
        console.error('[AuthService] Configuration error:', message);
        
        // Créer un service de fallback
        this.createFallbackService(message);
    }

    createFallbackService(error) {
        console.log('[AuthService] Creating fallback service due to:', error);
        
        // Service minimal pour éviter les erreurs
        this.isInitialized = false;
        this.account = null;
        this.msalInstance = null;
        
        console.warn('[AuthService] ⚠️ Fallback mode active - limited functionality');
    }

    async initialize() {
        console.log('[AuthService] Initialize called for', this.currentDomain);
        
        if (this.initializationPromise) {
            console.log('[AuthService] Already initializing, waiting...');
            return this.initializationPromise;
        }
        
        if (this.isInitialized) {
            console.log('[AuthService] Already initialized');
            return Promise.resolve();
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('[AuthService] Starting initialization for', this.currentDomain);
            
            // Attendre la configuration si nécessaire
            if (!window.AppConfig || window.AppConfig.error) {
                console.log('[AuthService] Waiting for configuration...');
                await this.waitForConfigurationPromise();
            }
            
            // Vérifier MSAL
            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Vérifier la configuration
            if (!window.AppConfig || window.AppConfig.error) {
                throw new Error('AppConfig not available or has errors');
            }

            // Validation finale
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                console.warn('[AuthService] Configuration validation issues:', validation.issues);
                // Continuer quand même pour permettre l'affichage des erreurs
            }

            console.log('[AuthService] Using configuration:', {
                clientId: window.AppConfig.msal.clientId ? window.AppConfig.msal.clientId.substring(0, 8) + '...' : 'MISSING',
                authority: window.AppConfig.msal.authority,
                redirectUri: window.AppConfig.msal.redirectUri,
                domain: this.currentDomain
            });

            // Créer l'instance MSAL
            const msalConfig = {
                auth: {
                    clientId: window.AppConfig.msal.clientId,
                    authority: window.AppConfig.msal.authority,
                    redirectUri: window.AppConfig.msal.redirectUri,
                    postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri
                },
                cache: window.AppConfig.msal.cache,
                system: window.AppConfig.msal.system
            };
            
            // Validation finale avant création
            if (!msalConfig.auth.clientId || msalConfig.auth.clientId === 'CONFIGURATION_REQUIRED') {
                throw new Error('Client ID is missing or invalid');
            }
            
            if (!/^[a-f0-9-]{36}$/i.test(msalConfig.auth.clientId)) {
                throw new Error(`Invalid Client ID format: ${msalConfig.auth.clientId}`);
            }
            
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            console.log('[AuthService] ✅ MSAL instance created for', this.currentDomain);
            
            // Initialiser MSAL
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized');
            
            // Gérer la redirection
            try {
                console.log('[AuthService] Checking for redirect response...');
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response) {
                    console.log('[AuthService] ✅ Redirect response received:', {
                        username: response.account?.username,
                        name: response.account?.name
                    });
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                } else {
                    console.log('[AuthService] No redirect response');
                    
                    // Vérifier le cache
                    const accounts = this.msalInstance.getAllAccounts();
                    console.log('[AuthService] Accounts in cache:', accounts.length);
                    
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache:', this.account.username);
                    }
                }
            } catch (redirectError) {
                console.warn('[AuthService] Redirect handling error (non-critical):', redirectError);
                
                if (redirectError.message && redirectError.message.includes('redirect_uri')) {
                    console.error('[AuthService] ❌ REDIRECT URI ERROR');
                    throw new Error(`Redirect URI error for ${this.currentDomain}: Configure ${window.AppConfig.msal.redirectUri} in Azure Portal`);
                }
            }

            this.isInitialized = true;
            console.log('[AuthService] ✅ Initialization completed for', this.currentDomain);
            
            return true;

        } catch (error) {
            console.error('[AuthService] ❌ Initialization failed:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // Gestion d'erreurs spécifiques
            this.handleInitializationError(error);
            throw error;
        }
    }

    async waitForConfigurationPromise() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 secondes max
            const startTime = Date.now();
            
            const checkConfig = () => {
                if (window.AppConfig && !window.AppConfig.error) {
                    resolve();
                    return;
                }
                
                if (Date.now() - startTime > maxWait) {
                    reject(new Error('Configuration timeout'));
                    return;
                }
                
                setTimeout(checkConfig, 100);
            };
            
            checkConfig();
        });
    }

    handleInitializationError(error) {
        if (error.message.includes('unauthorized_client')) {
            console.error('[AuthService] AZURE CONFIG ERROR: Client ID incorrect for', this.currentDomain);
        } else if (error.message.includes('redirect_uri') || error.message.includes('Redirect URI')) {
            console.error('[AuthService] REDIRECT URI ERROR:', error.message);
        }
        
        // Notifier l'interface utilisateur si disponible
        if (window.uiManager) {
            let errorMessage = 'Erreur d\'initialisation de l\'authentification.';
            
            if (error.message.includes('unauthorized_client')) {
                errorMessage = `Configuration Azure incorrecte pour ${this.currentDomain}. Vérifiez votre Client ID.`;
            } else if (error.message.includes('redirect_uri')) {
                errorMessage = `URI de redirection invalide. Configurez: ${window.AppConfig?.msal?.redirectUri || 'URI_MANQUANTE'}`;
            }
            
            window.uiManager.showToast(errorMessage, 'error', 15000);
        }
    }

    isAuthenticated() {
        const authenticated = this.account !== null && this.isInitialized;
        console.log('[AuthService] Authentication check:', {
            hasAccount: !!this.account,
            isInitialized: this.isInitialized,
            result: authenticated,
            domain: this.currentDomain
        });
        return authenticated;
    }

    getAccount() {
        return this.account;
    }

    async login() {
        console.log('[AuthService] Login attempt for', this.currentDomain);
        
        if (!this.isInitialized) {
            console.log('[AuthService] Not initialized, initializing first...');
            await this.initialize();
        }

        try {
            // Vérifier la configuration avant le login
            if (!window.AppConfig || window.AppConfig.error) {
                throw new Error('Configuration not available for login');
            }
            
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                console.warn('[AuthService] Configuration issues before login:', validation.issues);
                // Continuer quand même
            }

            const loginRequest = {
                scopes: window.AppConfig.scopes.login,
                prompt: 'select_account'
            };

            console.log('[AuthService] Login request prepared:', {
                scopes: loginRequest.scopes,
                clientId: this.msalInstance?.getConfiguration()?.auth?.clientId ? '✅ Present' : '❌ Missing',
                redirectUri: this.msalInstance?.getConfiguration()?.auth?.redirectUri,
                domain: this.currentDomain
            });
            
            if (!this.msalInstance) {
                throw new Error('MSAL instance not available');
            }
            
            const msalConfig = this.msalInstance.getConfiguration();
            if (!msalConfig?.auth?.clientId) {
                throw new Error('Client ID missing in MSAL instance');
            }

            console.log('[AuthService] Initiating login redirect for', this.currentDomain);
            await this.msalInstance.loginRedirect(loginRequest);
            
        } catch (error) {
            console.error('[AuthService] ❌ Login error:', error);
            this.handleLoginError(error);
            throw error;
        }
    }

    handleLoginError(error) {
        let userMessage = 'Erreur de connexion';
        
        if (error.errorCode) {
            const errorCode = error.errorCode;
            console.log('[AuthService] MSAL Error code:', errorCode);
            
            if (window.AppConfig?.errors?.[errorCode]) {
                userMessage = window.AppConfig.errors[errorCode];
            } else {
                switch (errorCode) {
                    case 'unauthorized_client':
                        userMessage = `Configuration Azure incorrecte pour ${this.currentDomain}. Vérifiez votre Client ID.`;
                        break;
                    case 'invalid_request':
                        userMessage = `URI de redirection invalide. Configurez: ${window.AppConfig?.msal?.redirectUri}`;
                        break;
                    default:
                        userMessage = `Erreur MSAL: ${errorCode}`;
                }
            }
        } else if (error.message) {
            if (error.message.includes('Configuration not available')) {
                userMessage = 'Configuration manquante. Vérifiez la configuration de l\'application.';
            } else if (error.message.includes('Client ID')) {
                userMessage = 'Configuration Client ID invalide.';
            }
        }
        
        if (window.uiManager) {
            window.uiManager.showToast(userMessage, 'error', 12000);
        }
    }

    async logout() {
        console.log('[AuthService] Logout initiated for', this.currentDomain);
        
        if (!this.isInitialized) {
            console.warn('[AuthService] Not initialized for logout, force cleanup');
            this.forceCleanup();
            return;
        }

        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: window.location.origin
            };

            console.log('[AuthService] Logout request for', this.currentDomain);
            await this.msalInstance.logoutRedirect(logoutRequest);
            
        } catch (error) {
            console.error('[AuthService] Logout error:', error);
            this.forceCleanup();
        }
    }

    async getAccessToken() {
        if (!this.isAuthenticated()) {
            console.warn('[AuthService] Not authenticated for token request');
            return null;
        }

        try {
            const tokenRequest = {
                scopes: window.AppConfig.scopes.silent,
                account: this.account,
                forceRefresh: false
            };

            console.log('[AuthService] Requesting access token for scopes:', tokenRequest.scopes);
            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            
            if (response && response.accessToken) {
                console.log('[AuthService] ✅ Token acquired successfully');
                return response.accessToken;
            } else {
                throw new Error('No access token in response');
            }
            
        } catch (error) {
            console.warn('[AuthService] Silent token acquisition failed:', error);
            
            if (error instanceof msal.InteractionRequiredAuthError) {
                console.log('[AuthService] Interaction required, redirecting to login...');
                await this.login();
                return null;
            } else {
                console.error('[AuthService] Token acquisition error:', error);
                return null;
            }
        }
    }

    async getUserInfo() {
        const token = await this.getAccessToken();
        if (!token) {
            throw new Error('No access token available');
        }

        try {
            console.log('[AuthService] Fetching user info from Graph API');
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AuthService] Graph API error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userInfo = await response.json();
            console.log('[AuthService] ✅ User info retrieved:', userInfo.displayName);
            return userInfo;

        } catch (error) {
            console.error('[AuthService] Error getting user info:', error);
            throw error;
        }
    }

    async reset() {
        console.log('[AuthService] Resetting authentication for', this.currentDomain);
        
        try {
            if (this.msalInstance && this.account) {
                await this.msalInstance.logoutSilent({
                    account: this.account
                });
            }
        } catch (error) {
            console.warn('[AuthService] Silent logout failed during reset:', error);
        }

        this.forceCleanup();
    }

    forceCleanup() {
        console.log('[AuthService] Force cleanup for', this.currentDomain);
        
        this.account = null;
        this.isInitialized = false;
        this.msalInstance = null;
        this.initializationPromise = null;
        this.configCheckAttempts = 0;
        
        // Nettoyer le cache MSAL
        if (window.localStorage) {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('msal') || key.includes('auth') || key.includes('login'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('[AuthService] Error removing key:', key);
                }
            });
        }
        
        console.log('[AuthService] ✅ Cleanup completed');
    }

    getDiagnosticInfo() {
        return {
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            configCheckAttempts: this.configCheckAttempts,
            currentDomain: this.currentDomain,
            isTestEnvironment: this.isTestEnvironment,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                hasError: !!window.AppConfig.error,
                environment: window.AppConfig.app?.environment,
                validation: window.AppConfig.validate ? window.AppConfig.validate() : { valid: false, issues: ['validate method missing'] }
            } : { exists: false },
            timestamp: new Date().toISOString()
        };
    }
}

// Créer l'instance globale avec gestion d'erreur renforcée
try {
    window.authService = new AuthService();
    console.log('[AuthService] ✅ Global instance created for', window.location.hostname);
} catch (error) {
    console.error('[AuthService] ❌ Failed to create global instance:', error);
    
    // Instance de fallback
    window.authService = {
        isInitialized: false,
        initialize: () => Promise.reject(new Error('AuthService creation failed: ' + error.message)),
        login: () => Promise.reject(new Error('AuthService not available')),
        isAuthenticated: () => false,
        getAccount: () => null,
        reset: () => {},
        forceCleanup: () => {},
        getDiagnosticInfo: () => ({ 
            error: 'AuthService creation failed: ' + error.message,
            currentDomain: window.location.hostname,
            configExists: !!window.AppConfig,
            timestamp: new Date().toISOString()
        })
    };
}

// Fonction de diagnostic globale
window.diagnoseMSAL = function() {
    console.group('🔍 MSAL DIAGNOSTIC v6.0 - ' + window.location.hostname);
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        
        console.log('🔐 AuthService Status:', {
            initialized: authDiag.isInitialized,
            hasAccount: authDiag.hasAccount,
            domain: authDiag.currentDomain,
            isTest: authDiag.isTestEnvironment
        });
        
        console.log('⚙️ Configuration:', {
            exists: authDiag.appConfig.exists,
            hasError: authDiag.appConfig.hasError,
            validation: authDiag.appConfig.validation
        });
        
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);
        
        if (authDiag.msalConfig) {
            console.log('🔗 MSAL Config:', authDiag.msalConfig);
        }
        
        if (authDiag.appConfig.validation && !authDiag.appConfig.validation.valid) {
            console.log('🚨 Configuration Issues:', authDiag.appConfig.validation.issues);
        }
        
        return authDiag;
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ AuthService v6.0 loaded with guaranteed configuration support');
