// AuthService.js - Service d'authentification Microsoft Graph ADAPTATIF multi-domaines v4.0

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        this.maxConfigWaitAttempts = 50; // 5 secondes max
        
        // Détection automatique du domaine
        this.currentDomain = window.location.hostname;
        this.isTestEnvironment = this.currentDomain.includes('coruscating-dodol') || 
                                 this.currentDomain.includes('localhost') || 
                                 this.currentDomain.includes('127.0.0.1');
        
        console.log('[AuthService] Constructor called - Adaptive multi-domain support v4.0');
        console.log('[AuthService] Current domain:', this.currentDomain);
        console.log('[AuthService] Test environment:', this.isTestEnvironment);
        
        // Vérifier le domaine avec approche adaptative
        this.verifyDomain();
        
        // Attendre que la configuration soit disponible avec timeout
        this.waitForConfig();
    }

    verifyDomain() {
        const supportedDomains = [
            'emailsortpro.netlify.app',
            'emailsortpro.fr',
            'coruscating-dodol-f30e8d.netlify.app',
            'localhost',
            '127.0.0.1'
        ];
        
        const isSupported = supportedDomains.some(domain => this.currentDomain.includes(domain));
        
        console.log('[AuthService] Domain verification:', {
            current: this.currentDomain,
            supported: supportedDomains,
            isSupported: isSupported,
            isTest: this.isTestEnvironment
        });
        
        if (!isSupported) {
            console.warn('[AuthService] ⚠️ Unknown domain! Authentication may fail.');
            console.warn('[AuthService] Supported domains:', supportedDomains);
        }
    }

    waitForConfig() {
        console.log('[AuthService] Waiting for configuration...');
        
        if (!window.AppConfig) {
            this.configWaitAttempts++;
            
            if (this.configWaitAttempts >= this.maxConfigWaitAttempts) {
                console.error('[AuthService] ❌ Configuration timeout - AppConfig not available after 5 seconds');
                return;
            }
            
            console.log(`[AuthService] AppConfig not yet available, waiting... (${this.configWaitAttempts}/${this.maxConfigWaitAttempts})`);
            setTimeout(() => this.waitForConfig(), 100);
            return;
        }
        
        // Vérifier immédiatement la configuration
        const validation = window.AppConfig.validate();
        console.log('[AuthService] Configuration validation:', validation);
        
        // Vérification adaptative de l'URI de redirection
        if (window.AppConfig.msal?.redirectUri) {
            const configuredDomain = new URL(window.AppConfig.msal.redirectUri).hostname;
            if (configuredDomain !== this.currentDomain) {
                console.warn('[AuthService] ⚠️ Redirect URI domain mismatch detected');
                console.warn('[AuthService] Current domain:', this.currentDomain);
                console.warn('[AuthService] Configured domain:', configuredDomain);
                console.log('[AuthService] Will adapt configuration automatically...');
            }
        }
        
        if (!validation.valid) {
            console.error('[AuthService] Configuration invalid:', validation.issues);
            // Continuer quand même pour permettre l'affichage des erreurs
        } else {
            console.log('[AuthService] ✅ Configuration valid for', this.currentDomain);
        }
    }

    async initialize() {
        console.log('[AuthService] Initialize called for', this.currentDomain);
        
        // Éviter l'initialisation multiple
        if (this.initializationPromise) {
            console.log('[AuthService] Already initializing, waiting for existing promise...');
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
            
            // Vérifier que MSAL est chargé
            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded - check if script is included');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Vérifier que la configuration est disponible
            if (!window.AppConfig) {
                throw new Error('AppConfig not loaded - check if config.js is included before AuthService.js');
            }

            // Validation avec adaptation automatique
            let validation = window.AppConfig.forceValidate();
            console.log('[AuthService] Initial configuration validation:', validation);
            
            // Adapter la configuration au domaine actuel
            const adaptedConfig = this.adaptConfigForCurrentDomain();
            console.log('[AuthService] Configuration adapted for', this.currentDomain);
            
            // Re-valider après adaptation
            validation = window.AppConfig.validate();
            
            if (!validation.valid) {
                console.warn('[AuthService] Configuration issues detected after adaptation:', validation.issues);
                // Continuer quand même en mode dégradé
            }

            console.log('[AuthService] ✅ Configuration ready for', this.currentDomain);
            
            // Log de la configuration utilisée (sans exposer de secrets)
            console.log('[AuthService] Using configuration for', this.currentDomain, {
                clientId: window.AppConfig.msal.clientId ? window.AppConfig.msal.clientId.substring(0, 8) + '...' : 'MISSING',
                authority: window.AppConfig.msal.authority,
                redirectUri: window.AppConfig.msal.redirectUri,
                postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri,
                cacheLocation: window.AppConfig.msal.cache.cacheLocation,
                isTestEnvironment: this.isTestEnvironment
            });

            // Créer l'instance MSAL avec configuration adaptée
            console.log('[AuthService] Creating MSAL instance for', this.currentDomain);
            
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
            
            // Validation finale avant création MSAL
            if (!msalConfig.auth.clientId || msalConfig.auth.clientId === 'CONFIGURATION_REQUIRED') {
                throw new Error('CRITICAL: clientId is missing or invalid in MSAL config');
            }
            
            // Validation du format du Client ID
            if (!/^[a-f0-9-]{36}$/i.test(msalConfig.auth.clientId)) {
                throw new Error(`CRITICAL: clientId format is invalid: ${msalConfig.auth.clientId}. Must be a valid GUID.`);
            }
            
            console.log('[AuthService] MSAL config prepared for', this.currentDomain, {
                clientId: msalConfig.auth.clientId ? '✅ Present (valid GUID)' : '❌ Missing',
                authority: msalConfig.auth.authority ? '✅ Present' : '❌ Missing',
                redirectUri: msalConfig.auth.redirectUri ? '✅ Present' : '❌ Missing',
                postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri ? '✅ Present' : '❌ Missing',
                cacheLocation: msalConfig.cache?.cacheLocation || 'default',
                domainMatch: msalConfig.auth.redirectUri?.includes(this.currentDomain) ? '✅ Correct' : '❌ Will be adapted'
            });
            
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            console.log('[AuthService] ✅ MSAL instance created successfully for', this.currentDomain);
            
            // Initialiser MSAL
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized for', this.currentDomain);
            
            // Gérer la redirection si elle existe
            try {
                console.log('[AuthService] Checking for redirect response...');
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response) {
                    console.log('[AuthService] ✅ Redirect response received for', this.currentDomain, {
                        username: response.account?.username,
                        name: response.account?.name
                    });
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                } else {
                    console.log('[AuthService] No redirect response');
                    
                    // Pas de redirection, vérifier s'il y a un compte dans le cache
                    const accounts = this.msalInstance.getAllAccounts();
                    console.log('[AuthService] Accounts in cache:', accounts.length);
                    
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache:', this.account.username);
                    } else {
                        console.log('[AuthService] No account in cache');
                    }
                }
            } catch (redirectError) {
                console.warn('[AuthService] Redirect handling error (non-critical):', redirectError);
                
                // Gestion spéciale des erreurs de redirection
                if (redirectError.message && redirectError.message.includes('redirect_uri')) {
                    console.error('[AuthService] ❌ REDIRECT URI ERROR for', this.currentDomain);
                    throw new Error(`Redirect URI error: Configure https://${this.currentDomain}/auth-callback.html in Azure Portal`);
                }
                
                // Continuer même en cas d'erreur de redirection non critique
            }

            this.isInitialized = true;
            console.log('[AuthService] ✅ Initialization completed successfully for', this.currentDomain);
            
            return true;

        } catch (error) {
            console.error('[AuthService] ❌ Initialization failed for', this.currentDomain, error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // Gestion d'erreurs spécifiques avec adaptation au domaine
            if (error.message.includes('unauthorized_client')) {
                console.error('[AuthService] AZURE CONFIG ERROR: Client ID incorrect or app not configured for', this.currentDomain);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `Erreur de configuration Azure pour ${this.currentDomain}. Client ID incorrect.`,
                        'error',
                        15000
                    );
                }
            } else if (error.message.includes('redirect_uri') || error.message.includes('Redirect URI')) {
                console.error('[AuthService] REDIRECT URI ERROR:', error.message);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `URI de redirection invalide. Configurez: https://${this.currentDomain}/auth-callback.html`,
                        'error',
                        20000
                    );
                }
            }
            
            throw error;
        }
    }

    // Nouvelle méthode pour adapter la configuration au domaine actuel
    adaptConfigForCurrentDomain() {
        if (!window.AppConfig) return;
        
        const currentOrigin = window.location.origin;
        const expectedRedirectUri = `${currentOrigin}/auth-callback.html`;
        const expectedLogoutUri = currentOrigin;
        
        console.log('[AuthService] Adapting configuration for current domain...');
        console.log('[AuthService] Current origin:', currentOrigin);
        console.log('[AuthService] Expected redirect URI:', expectedRedirectUri);
        
        // Adapter les URIs au domaine actuel
        if (window.AppConfig.msal.redirectUri !== expectedRedirectUri) {
            console.log('[AuthService] Updating redirect URI from', window.AppConfig.msal.redirectUri, 'to', expectedRedirectUri);
            window.AppConfig.msal.redirectUri = expectedRedirectUri;
        }
        
        if (window.AppConfig.msal.postLogoutRedirectUri !== expectedLogoutUri) {
            console.log('[AuthService] Updating logout URI from', window.AppConfig.msal.postLogoutRedirectUri, 'to', expectedLogoutUri);
            window.AppConfig.msal.postLogoutRedirectUri = expectedLogoutUri;
        }
        
        // En mode test, adapter les settings pour plus de debug
        if (this.isTestEnvironment) {
            console.log('[AuthService] Test environment detected, enabling enhanced logging...');
            if (window.AppConfig.msal.system && window.AppConfig.msal.system.loggerOptions) {
                window.AppConfig.msal.system.loggerOptions.logLevel = 'Verbose';
                window.AppConfig.app.debug = true;
            }
        }
        
        return {
            redirectUri: window.AppConfig.msal.redirectUri,
            postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri,
            domain: this.currentDomain,
            isTest: this.isTestEnvironment
        };
    }

    isAuthenticated() {
        const authenticated = this.account !== null && this.isInitialized;
        console.log('[AuthService] Authentication check for', this.currentDomain, {
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
        console.log('[AuthService] Login attempt started for', this.currentDomain);
        
        if (!this.isInitialized) {
            console.log('[AuthService] Not initialized, initializing first...');
            await this.initialize();
        }

        try {
            // Vérifier encore une fois la configuration avant le login
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                throw new Error(`Configuration invalid before login for ${this.currentDomain}: ${validation.issues.join(', ')}`);
            }

            // Préparer la requête de login avec validation
            const loginRequest = {
                scopes: window.AppConfig.scopes.login,
                prompt: 'select_account'
            };

            console.log('[AuthService] Login request prepared for', this.currentDomain, {
                scopes: loginRequest.scopes,
                prompt: loginRequest.prompt,
                clientId: this.msalInstance?.getConfiguration()?.auth?.clientId ? '✅ Present in MSAL' : '❌ Missing in MSAL',
                redirectUri: this.msalInstance?.getConfiguration()?.auth?.redirectUri,
                domain: this.currentDomain
            });
            
            // Vérification finale avant login
            if (!this.msalInstance) {
                throw new Error('MSAL instance not available');
            }
            
            const msalConfig = this.msalInstance.getConfiguration();
            if (!msalConfig?.auth?.clientId) {
                throw new Error('CRITICAL: clientId missing in MSAL instance');
            }
            
            if (!msalConfig?.auth?.redirectUri?.includes(this.currentDomain)) {
                console.warn('[AuthService] ⚠️ redirectUri domain mismatch, but proceeding...');
                console.warn('[AuthService] Expected domain:', this.currentDomain);
                console.warn('[AuthService] Configured domain:', new URL(msalConfig.auth.redirectUri).hostname);
            }

            console.log('[AuthService] Initiating login redirect for', this.currentDomain);
            console.log('[AuthService] MSAL instance config verified:', {
                clientId: msalConfig.auth.clientId.substring(0, 8) + '...',
                authority: msalConfig.auth.authority,
                redirectUri: msalConfig.auth.redirectUri,
                currentDomain: this.currentDomain
            });
            
            // Utiliser loginRedirect pour éviter les problèmes de popup
            await this.msalInstance.loginRedirect(loginRequest);
            // Note: La redirection va se produire, pas de code après cette ligne
            
        } catch (error) {
            console.error('[AuthService] ❌ Login error for', this.currentDomain, error);
            
            // Gestion d'erreurs adaptative
            let userMessage = 'Erreur de connexion';
            
            if (error.errorCode) {
                const errorCode = error.errorCode;
                console.log('[AuthService] MSAL Error code:', errorCode);
                
                if (window.AppConfig.errors[errorCode]) {
                    userMessage = window.AppConfig.errors[errorCode];
                } else {
                    switch (errorCode) {
                        case 'unauthorized_client':
                            userMessage = `Configuration Azure incorrecte pour ${this.currentDomain}. Vérifiez votre Client ID.`;
                            break;
                        case 'invalid_request':
                            userMessage = `URI de redirection invalide. Configurez: https://${this.currentDomain}/auth-callback.html`;
                            break;
                        default:
                            userMessage = `Erreur MSAL: ${errorCode}`;
                    }
                }
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(userMessage, 'error', 12000);
            }
            
            throw error;
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

            console.log('[AuthService] Logout request for', this.currentDomain, logoutRequest);
            await this.msalInstance.logoutRedirect(logoutRequest);
            // La redirection va se produire
            
        } catch (error) {
            console.error('[AuthService] Logout error for', this.currentDomain, error);
            // Force cleanup même en cas d'erreur
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
                console.log('[AuthService] ✅ Token acquired successfully for', this.currentDomain);
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
            console.log('[AuthService] Fetching user info from Graph API for', this.currentDomain);
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
            console.log('[AuthService] ✅ User info retrieved for', this.currentDomain, userInfo.displayName);
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
        console.log('[AuthService] Force cleanup initiated for', this.currentDomain);
        
        // Reset internal state
        this.account = null;
        this.isInitialized = false;
        this.msalInstance = null;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        
        // Clear MSAL cache plus agressivement
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
                    console.log('[AuthService] Removed cache key:', key);
                } catch (e) {
                    console.warn('[AuthService] Error removing key:', key, e);
                }
            });
        }
        
        console.log('[AuthService] ✅ Cleanup complete for', this.currentDomain);
    }

    // Méthode de diagnostic adaptative
    getDiagnosticInfo() {
        return {
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            configWaitAttempts: this.configWaitAttempts,
            currentDomain: this.currentDomain,
            isTestEnvironment: this.isTestEnvironment,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri,
                domainInRedirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri?.includes(this.currentDomain)
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                environment: window.AppConfig.app?.environment,
                validation: window.AppConfig.validate(),
                debug: window.AppConfig.getDebugInfo()
            } : { exists: false },
            uriValidation: {
                expectedRedirectUri: `https://${this.currentDomain}/auth-callback.html`,
                configuredRedirectUri: window.AppConfig?.msal?.redirectUri,
                match: window.AppConfig?.msal?.redirectUri === `https://${this.currentDomain}/auth-callback.html`
            }
        };
    }
}

// Créer l'instance globale avec gestion d'erreur renforcée
try {
    window.authService = new AuthService();
    console.log('[AuthService] ✅ Global instance created successfully for', window.location.hostname);
} catch (error) {
    console.error('[AuthService] ❌ Failed to create global instance:', error);
    
    // Créer une instance de fallback plus informative
    window.authService = {
        isInitialized: false,
        initialize: () => Promise.reject(new Error('AuthService failed to initialize: ' + error.message)),
        login: () => Promise.reject(new Error('AuthService not available: ' + error.message)),
        isAuthenticated: () => false,
        getDiagnosticInfo: () => ({ 
            error: 'AuthService failed to create: ' + error.message,
            environment: window.AppConfig?.app?.environment || 'unknown',
            configExists: !!window.AppConfig,
            currentDomain: window.location.hostname
        })
    };
}

// Fonction de diagnostic globale adaptative
window.diagnoseMSAL = function() {
    console.group('🔍 DIAGNOSTIC MSAL ADAPTATIF - ' + window.location.hostname);
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        const configDiag = window.AppConfig ? window.AppConfig.getDebugInfo() : null;
        
        console.log('🔐 AuthService:', authDiag);
        console.log('⚙️ Configuration:', configDiag);
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🎯 Current domain:', authDiag.currentDomain);
        console.log('🧪 Test environment:', authDiag.isTestEnvironment);
        console.log('💾 LocalStorage keys:', Object.keys(localStorage).filter(k => k.includes('msal') || k.includes('auth')));
        
        // Validation spécifique des URIs
        console.log('🔗 URI Validation:');
        console.log('  Expected Redirect URI:', authDiag.uriValidation.expectedRedirectUri);
        console.log('  Configured Redirect URI:', authDiag.uriValidation.configuredRedirectUri);
        console.log('  URI Match:', authDiag.uriValidation.match ? '✅' : '❌');
        
        if (!authDiag.uriValidation.match) {
            console.log('🚨 ACTION REQUIRED:');
            console.log(`  Configure redirect URI in Azure Portal: ${authDiag.uriValidation.expectedRedirectUri}`);
        }
        
        return { authDiag, configDiag };
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ AuthService loaded with adaptive multi-domain support v4.0');
