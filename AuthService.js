// AuthService.js - Service d'authentification Microsoft Graph CORRIGÉ pour emailsortpro.netlify.app v3.1

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        this.maxConfigWaitAttempts = 50; // 5 secondes max
        this.expectedDomain = 'emailsortpro.netlify.app';
        
        console.log('[AuthService] Constructor called - Enhanced support for emailsortpro.netlify.app');
        
        // Vérifier le domaine immédiatement
        this.verifyDomain();
        
        // Attendre que la configuration soit disponible avec timeout
        this.waitForConfig();
    }

    verifyDomain() {
        const currentDomain = window.location.hostname;
        const isCorrectDomain = currentDomain === this.expectedDomain;
        
        console.log('[AuthService] Domain verification:', {
            current: currentDomain,
            expected: this.expectedDomain,
            isCorrect: isCorrectDomain
        });
        
        if (!isCorrectDomain && !currentDomain.includes('localhost') && !currentDomain.includes('127.0.0.1')) {
            console.warn('[AuthService] ⚠️ Domain mismatch! Authentication may fail.');
            console.warn('[AuthService] Azure App Registration must be configured for:', this.expectedDomain);
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
        
        // Vérification spécifique pour le nouveau domaine
        if (window.AppConfig.msal?.redirectUri && 
            !window.AppConfig.msal.redirectUri.includes(this.expectedDomain)) {
            console.error('[AuthService] ❌ Redirect URI does not match expected domain!');
            console.error('[AuthService] Expected domain:', this.expectedDomain);
            console.error('[AuthService] Configured URI:', window.AppConfig.msal.redirectUri);
        }
        
        if (!validation.valid) {
            console.error('[AuthService] Configuration invalid for emailsortpro.netlify.app:', validation.issues);
            // Continuer quand même pour permettre l'affichage des erreurs
        } else {
            console.log('[AuthService] ✅ Configuration valid for emailsortpro.netlify.app');
        }
    }

    async initialize() {
        console.log('[AuthService] Initialize called for emailsortpro.netlify.app');
        
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
            console.log('[AuthService] Starting initialization for emailsortpro.netlify.app...');
            
            // Vérifier que MSAL est chargé
            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded - check if script is included');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Vérifier que la configuration est disponible ET valide
            if (!window.AppConfig) {
                throw new Error('AppConfig not loaded - check if config.js is included before AuthService.js');
            }

            const validation = window.AppConfig.forceValidate();
            console.log('[AuthService] Configuration validation result for new domain:', validation);
            
            if (!validation.valid) {
                // Vérification spéciale pour les erreurs de domaine
                const domainIssues = validation.issues.filter(issue => 
                    issue.includes('emailsortpro.netlify.app') || 
                    issue.includes('redirect') || 
                    issue.includes('URI')
                );
                
                if (domainIssues.length > 0) {
                    const errorMsg = `Configuration invalide pour emailsortpro.netlify.app: ${domainIssues.join(', ')}`;
                    console.error('[AuthService]', errorMsg);
                    throw new Error(errorMsg);
                } else {
                    console.warn('[AuthService] Configuration issues detected, but proceeding...');
                }
            }

            console.log('[AuthService] ✅ Configuration validated for emailsortpro.netlify.app');
            
            // Log de la configuration utilisée (sans exposer de secrets)
            console.log('[AuthService] Using configuration for emailsortpro.netlify.app:', {
                clientId: window.AppConfig.msal.clientId ? window.AppConfig.msal.clientId.substring(0, 8) + '...' : 'MISSING',
                authority: window.AppConfig.msal.authority,
                redirectUri: window.AppConfig.msal.redirectUri,
                postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri,
                cacheLocation: window.AppConfig.msal.cache.cacheLocation,
                environment: window.AppConfig.app?.environment || 'unknown',
                domain: window.AppConfig.app?.domain
            });

            // Vérification critique des URIs pour le nouveau domaine
            const expectedRedirectUri = `https://${this.expectedDomain}/auth-callback.html`;
            const expectedLogoutUri = `https://${this.expectedDomain}/`;
            
            if (window.AppConfig.msal.redirectUri !== expectedRedirectUri) {
                console.error('[AuthService] ❌ CRITICAL: Redirect URI mismatch!');
                console.error('[AuthService] Expected:', expectedRedirectUri);
                console.error('[AuthService] Configured:', window.AppConfig.msal.redirectUri);
                throw new Error(`Redirect URI must be configured as: ${expectedRedirectUri}`);
            }
            
            if (window.AppConfig.msal.postLogoutRedirectUri !== expectedLogoutUri) {
                console.warn('[AuthService] ⚠️ Logout URI mismatch (non-critical)');
                console.warn('[AuthService] Expected:', expectedLogoutUri);
                console.warn('[AuthService] Configured:', window.AppConfig.msal.postLogoutRedirectUri);
            }

            // Créer l'instance MSAL avec validation renforcée
            console.log('[AuthService] Creating MSAL instance for emailsortpro.netlify.app...');
            
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
            
            console.log('[AuthService] MSAL config prepared for emailsortpro.netlify.app:', {
                clientId: msalConfig.auth.clientId ? '✅ Present (valid GUID)' : '❌ Missing',
                authority: msalConfig.auth.authority ? '✅ Present' : '❌ Missing',
                redirectUri: msalConfig.auth.redirectUri ? '✅ Present' : '❌ Missing',
                postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri ? '✅ Present' : '❌ Missing',
                cacheLocation: msalConfig.cache?.cacheLocation || 'default',
                domainMatch: msalConfig.auth.redirectUri?.includes(this.expectedDomain) ? '✅ Correct' : '❌ Wrong domain'
            });
            
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            console.log('[AuthService] ✅ MSAL instance created successfully for emailsortpro.netlify.app');
            
            // Initialiser MSAL
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized for emailsortpro.netlify.app');
            
            // Gérer la redirection si elle existe
            try {
                console.log('[AuthService] Checking for redirect response...');
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response) {
                    console.log('[AuthService] ✅ Redirect response received for emailsortpro.netlify.app:', {
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
                
                // Gestion spéciale des erreurs de redirection pour le nouveau domaine
                if (redirectError.message && redirectError.message.includes('redirect_uri')) {
                    console.error('[AuthService] ❌ REDIRECT URI ERROR for emailsortpro.netlify.app!');
                    throw new Error(`Redirect URI error: Configure https://${this.expectedDomain}/auth-callback.html in Azure Portal`);
                }
                
                // Continuer même en cas d'erreur de redirection non critique
            }

            this.isInitialized = true;
            console.log('[AuthService] ✅ Initialization completed successfully for emailsortpro.netlify.app');
            
            return true;

        } catch (error) {
            console.error('[AuthService] ❌ Initialization failed for emailsortpro.netlify.app:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // Gestion d'erreurs spécifiques avec messages détaillés pour le nouveau domaine
            if (error.message.includes('unauthorized_client')) {
                console.error('[AuthService] AZURE CONFIG ERROR: Client ID incorrect or app not configured for emailsortpro.netlify.app');
                if (window.uiManager) {
                    window.uiManager.showToast(
                        'Erreur de configuration Azure pour emailsortpro.netlify.app. Client ID incorrect.',
                        'error',
                        15000
                    );
                }
            } else if (error.message.includes('redirect_uri') || error.message.includes('Redirect URI')) {
                console.error('[AuthService] REDIRECT URI ERROR:', error.message);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `URI de redirection invalide. Configurez: https://${this.expectedDomain}/auth-callback.html`,
                        'error',
                        20000
                    );
                }
            } else if (error.message.includes('clientId')) {
                console.error('[AuthService] CLIENT ID ERROR:', error.message);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        'Erreur critique: Client ID manquant ou invalide',
                        'error',
                        15000
                    );
                }
            }
            
            throw error;
        }
    }

    isAuthenticated() {
        const authenticated = this.account !== null && this.isInitialized;
        console.log('[AuthService] Authentication check for emailsortpro.netlify.app:', {
            hasAccount: !!this.account,
            isInitialized: this.isInitialized,
            result: authenticated,
            domain: window.location.hostname
        });
        return authenticated;
    }

    getAccount() {
        return this.account;
    }

    async login() {
        console.log('[AuthService] Login attempt started for emailsortpro.netlify.app...');
        
        if (!this.isInitialized) {
            console.log('[AuthService] Not initialized, initializing first...');
            await this.initialize();
        }

        try {
            // Vérifier encore une fois la configuration avant le login
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                throw new Error(`Configuration invalid before login for emailsortpro.netlify.app: ${validation.issues.join(', ')}`);
            }

            // Vérification spéciale de l'URI de redirection
            const currentUrl = window.location.origin;
            const expectedOrigin = `https://${this.expectedDomain}`;
            
            if (currentUrl !== expectedOrigin) {
                console.warn('[AuthService] ⚠️ Origin mismatch detected');
                console.warn('[AuthService] Current:', currentUrl);
                console.warn('[AuthService] Expected:', expectedOrigin);
            }

            // Préparer la requête de login avec validation
            const loginRequest = {
                scopes: window.AppConfig.scopes.login,
                prompt: 'select_account'
            };

            console.log('[AuthService] Login request prepared for emailsortpro.netlify.app:', {
                scopes: loginRequest.scopes,
                prompt: loginRequest.prompt,
                clientId: this.msalInstance?.getConfiguration()?.auth?.clientId ? '✅ Present in MSAL' : '❌ Missing in MSAL',
                redirectUri: this.msalInstance?.getConfiguration()?.auth?.redirectUri,
                domain: window.location.hostname
            });
            
            // Vérification finale avant login
            if (!this.msalInstance) {
                throw new Error('MSAL instance not available');
            }
            
            const msalConfig = this.msalInstance.getConfiguration();
            if (!msalConfig?.auth?.clientId) {
                throw new Error('CRITICAL: clientId missing in MSAL instance');
            }
            
            if (!msalConfig?.auth?.redirectUri?.includes(this.expectedDomain)) {
                throw new Error(`CRITICAL: redirectUri does not match expected domain ${this.expectedDomain}`);
            }

            console.log('[AuthService] Initiating login redirect for emailsortpro.netlify.app...');
            console.log('[AuthService] MSAL instance config verified:', {
                clientId: msalConfig.auth.clientId.substring(0, 8) + '...',
                authority: msalConfig.auth.authority,
                redirectUri: msalConfig.auth.redirectUri,
                domainMatch: msalConfig.auth.redirectUri.includes(this.expectedDomain) ? '✅' : '❌'
            });
            
            // Utiliser loginRedirect pour éviter les problèmes de popup
            await this.msalInstance.loginRedirect(loginRequest);
            // Note: La redirection va se produire, pas de code après cette ligne
            
        } catch (error) {
            console.error('[AuthService] ❌ Login error for emailsortpro.netlify.app:', error);
            
            // Gestion d'erreurs spécifiques avec logging détaillé
            let userMessage = 'Erreur de connexion';
            
            if (error.errorCode) {
                const errorCode = error.errorCode;
                console.log('[AuthService] MSAL Error code:', errorCode);
                console.log('[AuthService] MSAL Error details:', {
                    errorCode: error.errorCode,
                    errorMessage: error.errorMessage,
                    subError: error.subError,
                    correlationId: error.correlationId
                });
                
                if (window.AppConfig.errors[errorCode]) {
                    userMessage = window.AppConfig.errors[errorCode];
                } else {
                    switch (errorCode) {
                        case 'popup_window_error':
                            userMessage = 'Popup bloqué. Autorisez les popups et réessayez.';
                            break;
                        case 'user_cancelled':
                            userMessage = 'Connexion annulée par l\'utilisateur.';
                            break;
                        case 'network_error':
                            userMessage = 'Erreur réseau. Vérifiez votre connexion.';
                            break;
                        case 'unauthorized_client':
                            userMessage = `Configuration Azure incorrecte pour ${this.expectedDomain}. Vérifiez votre Client ID.`;
                            break;
                        case 'invalid_client':
                            userMessage = `Client ID invalide pour ${this.expectedDomain}. Vérifiez votre configuration Azure.`;
                            break;
                        case 'invalid_request':
                            userMessage = `URI de redirection invalide. Configurez: https://${this.expectedDomain}/auth-callback.html`;
                            break;
                        default:
                            userMessage = `Erreur MSAL: ${errorCode}`;
                    }
                }
            } else if (error.message.includes('clientId')) {
                userMessage = 'Erreur de configuration: Client ID manquant ou invalide';
                console.error('[AuthService] Client ID error details:', {
                    configClientId: window.AppConfig?.msal?.clientId,
                    msalClientId: this.msalInstance?.getConfiguration()?.auth?.clientId,
                    environment: window.AppConfig?.app?.environment,
                    domain: window.AppConfig?.app?.domain
                });
            } else if (error.message.includes('redirectUri') || error.message.includes('redirect_uri')) {
                userMessage = `URI de redirection incorrecte. Configurez: https://${this.expectedDomain}/auth-callback.html dans Azure Portal`;
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(userMessage, 'error', 12000);
            }
            
            throw error;
        }
    }

    async logout() {
        console.log('[AuthService] Logout initiated for emailsortpro.netlify.app...');
        
        if (!this.isInitialized) {
            console.warn('[AuthService] Not initialized for logout, force cleanup');
            this.forceCleanup();
            return;
        }

        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: `https://${this.expectedDomain}/`
            };

            console.log('[AuthService] Logout request for emailsortpro.netlify.app:', logoutRequest);
            await this.msalInstance.logoutRedirect(logoutRequest);
            // La redirection va se produire
            
        } catch (error) {
            console.error('[AuthService] Logout error for emailsortpro.netlify.app:', error);
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
                console.log('[AuthService] ✅ Token acquired successfully for emailsortpro.netlify.app');
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
            console.log('[AuthService] Fetching user info from Graph API for emailsortpro.netlify.app...');
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
            console.log('[AuthService] ✅ User info retrieved for emailsortpro.netlify.app:', userInfo.displayName);
            return userInfo;

        } catch (error) {
            console.error('[AuthService] Error getting user info:', error);
            throw error;
        }
    }

    async reset() {
        console.log('[AuthService] Resetting authentication for emailsortpro.netlify.app...');
        
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
        console.log('[AuthService] Force cleanup initiated for emailsortpro.netlify.app...');
        
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
        
        console.log('[AuthService] ✅ Cleanup complete for emailsortpro.netlify.app');
    }

    // Méthode de diagnostic améliorée pour le nouveau domaine
    getDiagnosticInfo() {
        return {
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            configWaitAttempts: this.configWaitAttempts,
            expectedDomain: this.expectedDomain,
            currentDomain: window.location.hostname,
            domainMatch: window.location.hostname === this.expectedDomain,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri,
                domainInRedirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri?.includes(this.expectedDomain)
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                environment: window.AppConfig.app?.environment,
                domain: window.AppConfig.app?.domain,
                validation: window.AppConfig.validate(),
                debug: window.AppConfig.getDebugInfo()
            } : { exists: false },
            uriValidation: {
                expectedRedirectUri: `https://${this.expectedDomain}/auth-callback.html`,
                configuredRedirectUri: window.AppConfig?.msal?.redirectUri,
                match: window.AppConfig?.msal?.redirectUri === `https://${this.expectedDomain}/auth-callback.html`
            }
        };
    }
}

// Créer l'instance globale avec gestion d'erreur renforcée
try {
    window.authService = new AuthService();
    console.log('[AuthService] ✅ Global instance created successfully for emailsortpro.netlify.app');
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
            expectedDomain: 'emailsortpro.netlify.app',
            currentDomain: window.location.hostname
        })
    };
}

// Fonction de diagnostic globale améliorée pour le nouveau domaine
window.diagnoseMSAL = function() {
    console.group('🔍 DIAGNOSTIC MSAL DÉTAILLÉ - emailsortpro.netlify.app');
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        const configDiag = window.AppConfig ? window.AppConfig.getDebugInfo() : null;
        
        console.log('🔐 AuthService:', authDiag);
        console.log('⚙️ Configuration:', configDiag);
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🎯 Expected domain:', authDiag.expectedDomain);
        console.log('✅ Domain match:', authDiag.domainMatch);
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

// Test de disponibilité de la configuration au chargement
setTimeout(() => {
    if (window.AppConfig) {
        const validation = window.AppConfig.validate();
        const expectedDomain = 'emailsortpro.netlify.app';
        
        if (!validation.valid) {
            console.warn('🚨 WARNING: Configuration invalid for emailsortpro.netlify.app');
            console.log('Issues:', validation.issues);
        }
        
        // Vérification spécifique du domaine
        if (window.AppConfig.msal?.redirectUri && 
            !window.AppConfig.msal.redirectUri.includes(expectedDomain)) {
            console.error('🚨 CRITICAL: Redirect URI does not match expected domain!');
            console.error('Expected:', `https://${expectedDomain}/auth-callback.html`);
            console.error('Configured:', window.AppConfig.msal.redirectUri);
        }
        
        console.log('Use diagnoseMSAL() for detailed diagnostic');
    }
}, 2000);

console.log('✅ AuthService loaded with enhanced support for emailsortpro.netlify.app v3.1');
