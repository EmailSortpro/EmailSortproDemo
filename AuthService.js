// AuthService.js - Service d'authentification Microsoft v6.0
// Avec attente de configuration robuste et gestion d'erreurs améliorée

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.targetDomain = 'coruscating-dodol-f30e8d.netlify.app';
        this.config = null;
        
        console.log('[AuthService] Constructor v6.0 - Robust configuration handling');
        console.log('[AuthService] Target domain:', this.targetDomain);
        console.log('[AuthService] Current domain:', window.location.hostname);
    }

    async waitForConfiguration() {
        console.log('[AuthService] Waiting for configuration...');
        
        // Vérifier d'abord si la config est déjà disponible
        if (window.AppConfig || window.EmailSortProConfig || window.CONFIG) {
            this.config = window.AppConfig || window.EmailSortProConfig || window.CONFIG;
            console.log('[AuthService] ✅ Configuration already available');
            return true;
        }
        
        // Attendre l'événement de configuration ou un timeout
        return new Promise((resolve) => {
            let resolved = false;
            
            // Écouter l'événement config-loaded
            const handleConfigLoaded = (event) => {
                if (!resolved) {
                    resolved = true;
                    this.config = event.detail?.config || window.AppConfig || window.EmailSortProConfig || window.CONFIG;
                    console.log('[AuthService] ✅ Configuration loaded via event');
                    window.removeEventListener('config-loaded', handleConfigLoaded);
                    resolve(true);
                }
            };
            
            window.addEventListener('config-loaded', handleConfigLoaded);
            
            // Vérification périodique
            let attempts = 0;
            const maxAttempts = 100; // 10 secondes
            
            const checkConfig = () => {
                attempts++;
                
                if (window.AppConfig || window.EmailSortProConfig || window.CONFIG || window._configLoaded) {
                    if (!resolved) {
                        resolved = true;
                        this.config = window.AppConfig || window.EmailSortProConfig || window.CONFIG;
                        console.log('[AuthService] ✅ Configuration found after', attempts, 'attempts');
                        window.removeEventListener('config-loaded', handleConfigLoaded);
                        resolve(true);
                    }
                } else if (attempts < maxAttempts) {
                    setTimeout(checkConfig, 100);
                } else {
                    if (!resolved) {
                        resolved = true;
                        console.error('[AuthService] ❌ Configuration timeout after 10 seconds');
                        window.removeEventListener('config-loaded', handleConfigLoaded);
                        
                        // Utiliser une configuration par défaut minimale
                        this.config = {
                            msal: {
                                clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7',
                                authority: 'https://login.microsoftonline.com/common',
                                redirectUri: `https://${this.targetDomain}/auth-callback.html`,
                                postLogoutRedirectUri: `https://${this.targetDomain}/`,
                                cache: {
                                    cacheLocation: 'localStorage',
                                    storeAuthStateInCookie: true
                                }
                            },
                            scopes: {
                                login: ['https://graph.microsoft.com/User.Read'],
                                silent: ['https://graph.microsoft.com/User.Read']
                            },
                            validate: () => ({ valid: true, issues: [] })
                        };
                        console.warn('[AuthService] Using fallback configuration');
                        resolve(true);
                    }
                }
            };
            
            // Démarrer la vérification
            checkConfig();
        });
    }

    async initialize() {
        console.log('[AuthService] Initialize called');
        
        if (this.initializationPromise) {
            console.log('[AuthService] Already initializing, returning existing promise');
            return this.initializationPromise;
        }
        
        if (this.isInitialized) {
            console.log('[AuthService] Already initialized');
            return Promise.resolve(true);
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('[AuthService] Starting initialization...');
            
            // 1. Attendre la configuration
            await this.waitForConfiguration();
            
            if (!this.config) {
                throw new Error('Configuration not available after waiting');
            }
            
            // 2. Valider la configuration
            if (this.config.validate && typeof this.config.validate === 'function') {
                const validation = this.config.validate();
                console.log('[AuthService] Configuration validation:', validation);
                
                if (!validation.valid && validation.issues.length > 0) {
                    // Filtrer les avertissements non critiques
                    const criticalIssues = validation.issues.filter(issue => 
                        issue.includes('Azure') || issue.includes('Client ID')
                    );
                    
                    if (criticalIssues.length > 0) {
                        console.error('[AuthService] Critical configuration issues:', criticalIssues);
                        throw new Error('Configuration critique manquante: ' + criticalIssues.join(', '));
                    }
                }
            }
            
            // 3. Vérifier MSAL
            if (typeof msal === 'undefined') {
                console.log('[AuthService] Waiting for MSAL library...');
                
                // Attendre que MSAL soit chargé
                let msalAttempts = 0;
                while (typeof msal === 'undefined' && msalAttempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    msalAttempts++;
                }
                
                if (typeof msal === 'undefined') {
                    throw new Error('MSAL library not loaded after 5 seconds');
                }
            }
            console.log('[AuthService] ✅ MSAL library available');
            
            // 4. Créer la configuration MSAL
            const msalConfig = {
                auth: {
                    clientId: this.config.msal.clientId,
                    authority: this.config.msal.authority || 'https://login.microsoftonline.com/common',
                    redirectUri: this.config.msal.redirectUri || window.location.origin + '/auth-callback.html',
                    postLogoutRedirectUri: this.config.msal.postLogoutRedirectUri || window.location.origin
                },
                cache: this.config.msal.cache || {
                    cacheLocation: 'localStorage',
                    storeAuthStateInCookie: true
                },
                system: this.config.msal.system || {
                    windowHashTimeout: 9000,
                    iframeHashTimeout: 9000,
                    loadFrameTimeout: 9000
                }
            };
            
            console.log('[AuthService] MSAL config:', {
                clientId: msalConfig.auth.clientId.substring(0, 8) + '...',
                authority: msalConfig.auth.authority,
                redirectUri: msalConfig.auth.redirectUri
            });
            
            // 5. Créer et initialiser MSAL
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized');
            
            // 6. Gérer la redirection
            try {
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response) {
                    console.log('[AuthService] ✅ Redirect response received');
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                    this.trackAuthentication(response.account);
                } else {
                    // Vérifier le cache
                    const accounts = this.msalInstance.getAllAccounts();
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache');
                    }
                }
            } catch (redirectError) {
                console.warn('[AuthService] Redirect handling error:', redirectError);
            }
            
            this.isInitialized = true;
            console.log('[AuthService] ✅ Initialization completed successfully');
            return true;
            
        } catch (error) {
            console.error('[AuthService] ❌ Initialization failed:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // Afficher l'erreur si UIManager disponible
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast(
                    'Erreur d\'initialisation: ' + error.message,
                    'error',
                    10000
                );
            }
            
            throw error;
        }
    }

    trackAuthentication(account) {
        if (window.analyticsManager && typeof window.analyticsManager.trackAuthentication === 'function') {
            try {
                const userInfo = {
                    displayName: account.name || 'Utilisateur Microsoft',
                    mail: account.username,
                    userPrincipalName: account.username,
                    email: account.username,
                    provider: 'microsoft',
                    homeAccountId: account.homeAccountId,
                    localAccountId: account.localAccountId,
                    tenantId: account.tenantId
                };
                
                window.analyticsManager.trackAuthentication('microsoft', userInfo);
                console.log('[AuthService] ✅ Analytics: Authentication tracked');
            } catch (error) {
                console.warn('[AuthService] Analytics error:', error);
            }
        }
    }

    isAuthenticated() {
        return this.account !== null && this.isInitialized;
    }

    getAccount() {
        return this.account;
    }

    async login() {
        console.log('[AuthService] Login attempt...');
        
        try {
            // S'assurer que le service est initialisé
            if (!this.isInitialized) {
                console.log('[AuthService] Not initialized, initializing first...');
                await this.initialize();
            }
            
            if (!this.msalInstance) {
                throw new Error('MSAL instance not available after initialization');
            }
            
            // Préparer la requête
            const scopes = this.config?.scopes?.login || ['https://graph.microsoft.com/User.Read'];
            const loginRequest = {
                scopes: scopes,
                prompt: 'select_account'
            };
            
            console.log('[AuthService] Starting login redirect...');
            
            // Track attempt
            if (window.analyticsManager && window.analyticsManager.trackEvent) {
                window.analyticsManager.trackEvent('login_attempt', { provider: 'microsoft' });
            }
            
            await this.msalInstance.loginRedirect(loginRequest);
            
        } catch (error) {
            console.error('[AuthService] ❌ Login error:', error);
            
            // Track error
            if (window.analyticsManager && window.analyticsManager.onError) {
                window.analyticsManager.onError('login_error', {
                    message: error.message,
                    provider: 'microsoft'
                });
            }
            
            // Message d'erreur approprié
            let userMessage = 'Erreur de connexion';
            
            if (error.errorCode) {
                userMessage = this.getErrorMessage(error.errorCode);
            } else if (error.message) {
                userMessage = error.message;
            }
            
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast(userMessage, 'error', 8000);
            }
            
            throw error;
        }
    }

    getErrorMessage(errorCode) {
        // Utiliser les messages de la config si disponibles
        if (this.config?.errors && this.config.errors[errorCode]) {
            return this.config.errors[errorCode];
        }
        
        // Messages par défaut
        const defaultMessages = {
            'popup_window_error': 'Popup bloqué. Autorisez les popups et réessayez.',
            'user_cancelled': 'Connexion annulée',
            'network_error': 'Erreur réseau. Vérifiez votre connexion.',
            'unauthorized_client': 'Configuration Azure incorrecte.',
            'invalid_client': 'Client ID invalide.',
            'invalid_request': 'Requête invalide.',
            'interaction_in_progress': 'Une connexion est déjà en cours.'
        };
        
        return defaultMessages[errorCode] || `Erreur: ${errorCode}`;
    }

    async logout() {
        console.log('[AuthService] Logout...');
        
        if (window.analyticsManager && window.analyticsManager.trackEvent) {
            window.analyticsManager.trackEvent('logout', {
                provider: 'microsoft',
                userEmail: this.account?.username
            });
        }
        
        if (!this.isInitialized || !this.msalInstance) {
            this.forceCleanup();
            return;
        }

        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: this.config?.msal?.postLogoutRedirectUri || window.location.origin
            };

            await this.msalInstance.logoutRedirect(logoutRequest);
            
        } catch (error) {
            console.error('[AuthService] Logout error:', error);
            this.forceCleanup();
        }
    }

    async getAccessToken() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const scopes = this.config?.scopes?.silent || ['https://graph.microsoft.com/User.Read'];
            
            const tokenRequest = {
                scopes: scopes,
                account: this.account,
                forceRefresh: false
            };

            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            
            if (response && response.accessToken) {
                return response.accessToken;
            }
            
            return null;
            
        } catch (error) {
            console.warn('[AuthService] Token acquisition failed:', error);
            
            if (error instanceof msal.InteractionRequiredAuthError) {
                await this.login();
            }
            
            return null;
        }
    }

    async getUserInfo() {
        const token = await this.getAccessToken();
        if (!token) {
            throw new Error('No access token available');
        }

        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userInfo = await response.json();
            
            // Enrichir les données
            userInfo.provider = 'microsoft';
            userInfo.email = userInfo.mail || userInfo.userPrincipalName || this.account?.username;
            
            return userInfo;

        } catch (error) {
            console.error('[AuthService] Error getting user info:', error);
            throw error;
        }
    }

    async reset() {
        console.log('[AuthService] Reset...');
        
        try {
            if (this.msalInstance && this.account) {
                await this.msalInstance.getTokenCache().removeAccount(this.account);
            }
        } catch (error) {
            console.warn('[AuthService] Reset error:', error);
        }

        this.forceCleanup();
    }

    forceCleanup() {
        console.log('[AuthService] Force cleanup...');
        
        this.account = null;
        this.isInitialized = false;
        this.msalInstance = null;
        this.initializationPromise = null;
        this.config = null;
        
        // Clear localStorage MSAL keys
        if (window.localStorage) {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('msal')) {
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
        
        console.log('[AuthService] ✅ Cleanup complete');
    }

    getDiagnosticInfo() {
        return {
            service: 'AuthService',
            version: '6.0',
            targetDomain: this.targetDomain,
            currentDomain: window.location.hostname,
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountEmail: this.account?.username,
            msalExists: !!this.msalInstance,
            configLoaded: !!this.config,
            configSource: this.config ? 'Loaded' : 'Not loaded',
            msalLibraryLoaded: typeof msal !== 'undefined'
        };
    }
}

// Créer l'instance globale
window.authService = new AuthService();
console.log('[AuthService] ✅ Global instance created (v6.0)');

// Fonction de diagnostic
window.diagnoseMSAL = function() {
    console.group('🔍 DIAGNOSTIC MSAL v6.0');
    
    const diag = window.authService.getDiagnosticInfo();
    console.log('AuthService:', diag);
    console.log('MSAL Library:', typeof msal !== 'undefined' ? '✅ Loaded' : '❌ Missing');
    console.log('Config available:', {
        AppConfig: !!window.AppConfig,
        EmailSortProConfig: !!window.EmailSortProConfig,
        CONFIG: !!window.CONFIG,
        _configLoaded: !!window._configLoaded
    });
    
    if (window.AppConfig && window.AppConfig.validate) {
        console.log('Config validation:', window.AppConfig.validate());
    }
    
    console.log('LocalStorage MSAL keys:', 
        Object.keys(localStorage).filter(k => k.includes('msal')).length
    );
    
    console.groupEnd();
    
    return diag;
};

console.log('✅ AuthService v6.0 loaded - Robust configuration handling');
console.log('Use diagnoseMSAL() for diagnostic');
