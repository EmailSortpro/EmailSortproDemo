// AuthService.js - Service d'authentification Microsoft Graph STRICT v5.1

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        this.maxConfigWaitAttempts = 50; // 5 secondes max
        
        // Détection stricte du domaine actuel
        this.currentDomain = window.location.hostname;
        this.currentOrigin = window.location.origin;
        this.currentUrl = window.location.href;
        this.isTestEnvironment = this.currentDomain.includes('test') || 
                                 this.currentDomain.includes('preview') || 
                                 this.currentDomain.includes('coruscating-dodol') ||
                                 this.currentDomain.includes('localhost') || 
                                 this.currentDomain.includes('127.0.0.1');
        
        console.log('[AuthService] Constructor v5.1 - STRICT domain validation');
        console.log('[AuthService] Domain detection:', {
            hostname: this.currentDomain,
            origin: this.currentOrigin,
            url: this.currentUrl,
            isTest: this.isTestEnvironment
        });
        
        // Validation stricte du domaine et URI
        this.validateDomainConfiguration();
        
        // Attendre que la configuration soit disponible
        this.waitForConfig();
    }

    validateDomainConfiguration() {
        // Whitelist des dom    validateDomainConfiguration() {
        // Whitelist des domaines autorisés avec leurs URIs exactes
        this.ALLOWED_DOMAINS = {
            'emailsortpro.netlify.app': {
                redirectUri: 'https://emailsortpro.netlify.app/auth-callback.html',
                postLogoutUri: 'https://emailsortpro.netlify.app/',
                clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'
            },
            'coruscating-dodol-f30e8d.netlify.app': {
                redirectUri: 'https://coruscating-dodol-f30e8d.netlify.app/auth-callback.html',
                postLogoutUri: 'https://coruscating-dodol-f30e8d.netlify.app/',
                clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'
            },
            'localhost': {
                redirectUri: 'http://localhost:3000/auth-callback.html',
                postLogoutUri: 'http://localhost:3000/',
                clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'
            },
            '127.0.0.1': {
                redirectUri: 'http://127.0.0.1:3000/auth-callback.html',
                postLogoutUri: 'http://127.0.0.1:3000/',
                clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'
            }
        };

        // Vérifier si le domaine est autorisé
        this.domainConfig = this.ALLOWED_DOMAINS[this.currentDomain];
        
        if (!this.domainConfig) {
            // Pour les domaines Netlify non listés, générer la config
            if (this.currentDomain.includes('netlify.app')) {
                console.warn('[AuthService] ⚠️ Netlify domain not in whitelist, generating config');
                this.domainConfig = {
                    redirectUri: `https://${this.currentDomain}/auth-callback.html`,
                    postLogoutUri: `https://${this.currentDomain}/`,
                    clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'
                };
            } else {
                console.error('[AuthService] ❌ Domain not supported:', this.currentDomain);
                this.domainConfig = null;
            }
        } else {
            console.log('[AuthService] ✅ Domain whitelisted:', this.currentDomain);
        }

        console.log('[AuthService] Domain configuration:', this.domainConfig);
    }

    waitForConfig() {
        console.log('[AuthService] Waiting for strict configuration...');
        
        if (!window.AppConfig) {
            this.configWaitAttempts++;
            
            if (this.configWaitAttempts >= this.maxConfigWaitAttempts) {
                console.warn('[AuthService] ⚠️ Configuration timeout - Creating strict fallback');
                this.createStrictFallbackConfig();
                return;
            }
            
            console.log(`[AuthService] AppConfig not yet available, waiting... (${this.configWaitAttempts}/${this.maxConfigWaitAttempts})`);
            setTimeout(() => this.waitForConfig(), 100);
            return;
        }
        
        // Valider la configuration strictement
        this.validateStrictConfig();
    }

    validateStrictConfig() {
        if (!window.AppConfig || !this.domainConfig) {
            console.error('[AuthService] ❌ Missing configuration or unsupported domain');
            return;
        }

        // Validation stricte des URIs
        const configuredRedirectUri = window.AppConfig.msal.redirectUri;
        const expectedRedirectUri = this.domainConfig.redirectUri;

        if (configuredRedirectUri !== expectedRedirectUri) {
            console.error('[AuthService] ❌ CRITICAL: Redirect URI mismatch!');
            console.error('[AuthService] Expected:', expectedRedirectUri);
            console.error('[AuthService] Configured:', configuredRedirectUri);
            
            // Forcer la correction
            window.AppConfig.msal.redirectUri = expectedRedirectUri;
            window.AppConfig.msal.postLogoutRedirectUri = this.domainConfig.postLogoutUri;
            console.log('[AuthService] ✅ URIs forcibly corrected to match domain');
        }

        const validation = window.AppConfig.validate();
        console.log('[AuthService] Strict configuration validation:', validation);

        if (!validation.valid) {
            console.error('[AuthService] Configuration validation failed:', validation.issues);
        } else {
            console.log('[AuthService] ✅ Strict configuration validated for', this.currentDomain);
        }
    }

    createStrictFallbackConfig() {
        if (!this.domainConfig) {
            console.error('[AuthService] Cannot create fallback - domain not supported');
            return;
        }

        console.log('[AuthService] Creating strict fallback configuration');

        window.AppConfig = {
            msal: {
                clientId: this.domainConfig.clientId,
                authority: 'https://login.microsoftonline.com/common',
                redirectUri: this.domainConfig.redirectUri,
                postLogoutRedirectUri: this.domainConfig.postLogoutUri,
                cache: {
                    cacheLocation: 'localStorage',
                    storeAuthStateInCookie: true
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message) => {
                            if (this.isTestEnvironment) {
                                console.log(`[MSAL ${level}] ${message}`);
                            }
                        },
                        piiLoggingEnabled: false,
                        logLevel: this.isTestEnvironment ? 'Verbose' : 'Warning'
                    },
                    allowNativeBroker: false,
                    allowRedirectInIframe: false
                }
            },
            scopes: {
                login: [
                    'https://graph.microsoft.com/User.Read',
                    'https://graph.microsoft.com/Mail.Read',
                    'https://graph.microsoft.com/Mail.ReadWrite'
                ],
                silent: [
                    'https://graph.microsoft.com/User.Read',
                    'https://graph.microsoft.com/Mail.Read',
                    'https://graph.microsoft.com/Mail.ReadWrite'
                ]
            },
            app: {
                name: 'EmailSortPro',
                version: '5.1.0',
                debug: this.isTestEnvironment,
                environment: this.isTestEnvironment ? 'test' : 'production',
                domain: this.currentDomain,
                strictFallback: true
            },
            validate() {
                return { valid: true, issues: [] };
            },
            getDebugInfo() {
                return {
                    hostname: window.location.hostname,
                    domain: this.app.domain,
                    environment: this.app.environment,
                    clientId: this.msal.clientId.substring(0, 8) + '...',
                    redirectUri: this.msal.redirectUri,
                    strictFallback: true,
                    timestamp: new Date().toISOString()
                };
            }
        };

        console.log('[AuthService] ✅ Strict fallback configuration created');
    }

    async initialize() {
        console.log('[AuthService] Initialize with strict validation for', this.currentDomain);
        
        if (this.initializationPromise) {
            console.log('[AuthService] Already initializing, waiting...');
            return this.initializationPromise;
        }
        
        if (this.isInitialized) {
            console.log('[AuthService] Already initialized');
            return Promise.resolve();
        }

        this.initializationPromise = this._doStrictInitialize();
        return this.initializationPromise;
    }

    async _doStrictInitialize() {
        try {
            console.log('[AuthService] Starting STRICT initialization for', this.currentDomain);
            
            // Vérifications préliminaires
            if (!this.domainConfig) {
                throw new Error(`Domain ${this.currentDomain} is not supported. Please contact administrator.`);
            }

            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded - check internet connection');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Attendre la configuration
            let waitAttempts = 0;
            while (!window.AppConfig && waitAttempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitAttempts++;
            }

            if (!window.AppConfig) {
                console.warn('[AuthService] AppConfig unavailable, using strict fallback');
                this.createStrictFallbackConfig();
            }

            // Validation stricte finale
            this.validateStrictConfig();

            // Vérification critique des URIs
            const configuredRedirectUri = window.AppConfig.msal.redirectUri;
            const expectedRedirectUri = this.domainConfig.redirectUri;

            if (configuredRedirectUri !== expectedRedirectUri) {
                throw new Error(`CRITICAL URI mismatch: Expected ${expectedRedirectUri}, got ${configuredRedirectUri}`);
            }

            console.log('[AuthService] ✅ Strict URI validation passed:', {
                clientId: window.AppConfig.msal.clientId.substring(0, 8) + '...',
                redirectUri: configuredRedirectUri,
                domain: this.currentDomain,
                exactMatch: true
            });

            // Créer la configuration MSAL avec validation stricte
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
            
            // Validation finale du Client ID
            if (!msalConfig.auth.clientId || !/^[a-f0-9-]{36}$/i.test(msalConfig.auth.clientId)) {
                throw new Error(`Invalid Client ID: ${msalConfig.auth.clientId}`);
            }
            
            console.log('[AuthService] MSAL config strict validation passed:', {
                clientId: '✅ Valid GUID',
                redirectUri: msalConfig.auth.redirectUri,
                domainMatch: msalConfig.auth.redirectUri.includes(this.currentDomain) ? '✅' : '❌',
                exactUriMatch: msalConfig.auth.redirectUri === this.domainConfig.redirectUri ? '✅' : '❌'
            });
            
            // Créer et initialiser l'instance MSAL
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized with strict config');
            
            // Gérer la redirection avec validation
            try {
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response && response.account) {
                    console.log('[AuthService] ✅ Authentication successful via redirect:', {
                        username: response.account.username,
                        name: response.account.name
                    });
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                    
                    // Sauvegarder la configuration qui a fonctionné
                    try {
                        localStorage.setItem('emailsortpro_client_id', window.AppConfig.msal.clientId);
                        localStorage.setItem('emailsortpro_redirect_uri', window.AppConfig.msal.redirectUri);
                        localStorage.setItem('emailsortpro_domain', this.currentDomain);
                        console.log('[AuthService] ✅ Working strict configuration saved');
                    } catch (e) {
                        console.warn('[AuthService] Could not save configuration:', e);
                    }
                } else {
                    console.log('[AuthService] No redirect response, checking cache...');
                    
                    const accounts = this.msalInstance.getAllAccounts();
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache:', this.account.username);
                    } else {
                        console.log('[AuthService] No cached account found');
                    }
                }
            } catch (redirectError) {
                console.warn('[AuthService] Redirect handling error:', redirectError);
                
                if (redirectError.message && redirectError.message.includes('redirect_uri')) {
                    console.error('[AuthService] ❌ REDIRECT URI ERROR!');
                    throw new Error(`Redirect URI error: Configure EXACTLY ${this.domainConfig.redirectUri} as Single-page application (SPA) in Azure Portal`);
                }
            }

            this.isInitialized = true;
            console.log('[AuthService] ✅ STRICT initialization completed for', this.currentDomain);
            
            return true;

        } catch (error) {
            console.error('[AuthService] ❌ STRICT initialization failed:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // Messages d'erreur spécifiques avec solutions exactes
            if (error.message.includes('URI mismatch') || error.message.includes('redirect_uri')) {
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `ERREUR URI: Configurez EXACTEMENT ${this.domainConfig?.redirectUri} comme Single-page application (SPA) dans Azure Portal`,
                        'error', 25000
                    );
                }
            } else if (error.message.includes('Domain') && error.message.includes('not supported')) {
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `Domaine ${this.currentDomain} non supporté. Contactez l'administrateur.`,
                        'error', 15000
                    );
                }
            }
            
            throw error;
        }
    }

    async login() {
        console.log('[AuthService] STRICT login attempt for', this.currentDomain);
        
        if (!this.domainConfig) {
            throw new Error(`Domain ${this.currentDomain} is not supported for authentication`);
        }

        if (!this.isInitialized) {
            console.log('[AuthService] Not initialized, initializing with strict validation...');
            await this.initialize();
        }

        try {
            // Validation pré-login stricte
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                throw new Error(`Configuration validation failed: ${validation.issues.join(', ')}`);
            }

            // Vérification critique de l'URI avant login
            const msalConfig = this.msalInstance.getConfiguration();
            if (msalConfig.auth.redirectUri !== this.domainConfig.redirectUri) {
                throw new Error(`CRITICAL: URI mismatch at login: Expected ${this.domainConfig.redirectUri}, got ${msalConfig.auth.redirectUri}`);
            }

            const loginRequest = {
                scopes: window.AppConfig.scopes.login,
                prompt: 'select_account'
            };

            console.log('[AuthService] STRICT login request validated:', {
                scopes: loginRequest.scopes,
                clientId: msalConfig.auth.clientId.substring(0, 8) + '...',
                redirectUri: msalConfig.auth.redirectUri,
                expectedUri: this.domainConfig.redirectUri,
                exactMatch: msalConfig.auth.redirectUri === this.domainConfig.redirectUri ? '✅' : '❌'
            });

            console.log('[AuthService] Initiating login redirect with strict validation...');
            await this.msalInstance.loginRedirect(loginRequest);
            
        } catch (error) {
            console.error('[AuthService] ❌ STRICT login error:', error);
            
            let userMessage = 'Erreur de connexion';
            
            if (error.errorCode) {
                switch (error.errorCode) {
                    case 'unauthorized_client':
                        userMessage = `Client ID ${window.AppConfig.msal.clientId.substring(0, 8)}... non autorisé pour ${this.currentDomain}`;
                        break;
                    case 'invalid_request':
                        userMessage = `URI de redirection invalide. Configurez EXACTEMENT: ${this.domainConfig.redirectUri} comme Single-page application (SPA)`;
                        break;
                    case 'invalid_client':
                        userMessage = 'Client ID invalide ou application non autorisée.';
                        break;
                    default:
                        userMessage = `Erreur MSAL: ${error.errorCode}`;
                }
            } else if (error.message.includes('URI mismatch') || error.message.includes('CRITICAL')) {
                userMessage = `Erreur de configuration critique: ${error.message}`;
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(userMessage, 'error', 20000);
            }
            
            throw error;
        }
    }

    // Méthodes existantes conservées avec validation stricte
    isAuthenticated() {
        const authenticated = this.account !== null && this.isInitialized;
        console.log('[AuthService] STRICT authentication check:', {
            hasAccount: !!this.account,
            isInitialized: this.isInitialized,
            result: authenticated,
            domain: this.currentDomain,
            domainSupported: !!this.domainConfig
        });
        return authenticated;
    }

    getAccount() {
        return this.account;
    }

    async logout() {
        console.log('[AuthService] STRICT logout for', this.currentDomain);
        
        if (!this.isInitialized) {
            console.warn('[AuthService] Not initialized for logout, force cleanup');
            this.forceCleanup();
            return;
        }

        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: this.domainConfig?.postLogoutUri || this.currentOrigin
            };

            console.log('[AuthService] STRICT logout request:', logoutRequest);
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
        console.log('[AuthService] Resetting STRICT authentication');
        
        try {
            if (this.msalInstance && this.account) {
                await this.msalInstance.logoutSilent({ account: this.account });
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
        this.configWaitAttempts = 0;
        
        // Clear MSAL cache
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
                    console.warn('[AuthService] Error removing key:', key, e);
                }
            });
        }
        
        console.log('[AuthService] ✅ Cleanup complete');
    }

    getDiagnosticInfo() {
        return {
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            currentDomain: this.currentDomain,
            currentOrigin: this.currentOrigin,
            currentUrl: this.currentUrl,
            isTestEnvironment: this.isTestEnvironment,
            domainSupported: !!this.domainConfig,
            domainWhitelisted: !!this.ALLOWED_DOMAINS[this.currentDomain],
            domainConfig: this.domainConfig,
            strictValidation: true,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri,
                exactUriMatch: this.msalInstance.getConfiguration()?.auth?.redirectUri === this.domainConfig?.redirectUri
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                environment: window.AppConfig.app?.environment,
                validation: window.AppConfig.validate(),
                debug: window.AppConfig.getDebugInfo ? window.AppConfig.getDebugInfo() : 'Not available'
            } : { exists: false },
            uriValidation: {
                expectedRedirectUri: this.domainConfig?.redirectUri,
                configuredRedirectUri: window.AppConfig?.msal?.redirectUri,
                exactMatch: window.AppConfig?.msal?.redirectUri === this.domainConfig?.redirectUri,
                domainInUri: window.AppConfig?.msal?.redirectUri?.includes(this.currentDomain)
            }
        };
    }
}

// Créer l'instance globale avec gestion d'erreur stricte
try {
    window.authService = new AuthService();
    console.log('[AuthService] ✅ Global STRICT instance created v5.1 for', window.location.hostname);
} catch (error) {
    console.error('[AuthService] ❌ Failed to create STRICT global instance:', error);
    
    window.authService = {
        isInitialized: false,
        initialize: () => Promise.reject(new Error('AuthService failed to initialize: ' + error.message)),
        login: () => Promise.reject(new Error('AuthService not available: ' + error.message)),
        isAuthenticated: () => false,
        getDiagnosticInfo: () => ({ 
            error: 'AuthService failed to create: ' + error.message,
            currentDomain: window.location.hostname,
            strictMode: true,
            timestamp: new Date().toISOString()
        })
    };
}

// Fonction de diagnostic globale stricte
window.diagnoseMSAL = function() {
    console.group('🔍 DIAGNOSTIC MSAL STRICT v5.1 - ' + window.location.hostname);
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        const configDiag = window.AppConfig ? window.AppConfig.getDebugInfo() : null;
        
        console.log('🔐 AuthService STRICT:', authDiag);
        console.log('⚙️ Configuration:', configDiag);
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🎯 Current domain:', authDiag.currentDomain);
        console.log('🧪 Test environment:', authDiag.isTestEnvironment);
        console.log('✅ Domain whitelisted:', authDiag.domainWhitelisted ? '✅' : '❌');
        console.log('🔧 Domain supported:', authDiag.domainSupported ? '✅' : '❌');
        console.log('🔄 Strict validation:', authDiag.strictValidation ? '✅' : '❌');
        
        // Validation URI CRITIQUE
        console.log('🔗 STRICT URI Validation:');
        console.log('  Expected Redirect URI:', authDiag.uriValidation.expectedRedirectUri);
        console.log('  Configured Redirect URI:', authDiag.uriValidation.configuredRedirectUri);
        console.log('  EXACT Match:', authDiag.uriValidation.exactMatch ? '✅' : '❌');
        console.log('  Domain in URI:', authDiag.uriValidation.domainInUri ? '✅' : '❌');
        
        if (!authDiag.uriValidation.exactMatch) {
            console.log('🚨 CRITICAL ACTION REQUIRED FOR AZURE PORTAL:');
            console.log(`  1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps`);
            console.log(`  2. Select your app`);
            console.log(`  3. Go to Authentication`);
            console.log(`  4. Add redirect URI EXACTLY: ${authDiag.uriValidation.expectedRedirectUri}`);
            console.log(`  5. Select "Single-page application (SPA)" type`);
            console.log(`  6. CRITICAL: The URI must match EXACTLY (case sensitive)`);
            console.log(`  7. Remove any incorrect URIs`);
        } else {
            console.log('✅ URI configuration is CORRECT');
        }
        
        return { authDiag, configDiag };
        
    } catch (error) {
        console.error('❌ STRICT diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ AuthService STRICT v5.1 loaded with exact URI validation for:', window.location.hostname);

    waitForConfig() {
        console.log('[AuthService] Waiting for configuration...');
        
        if (!window.AppConfig) {
            this.configWaitAttempts++;
            
            if (this.configWaitAttempts >= this.maxConfigWaitAttempts) {
                console.warn('[AuthService] ⚠️ Configuration timeout - Creating fallback config');
                this.createFallbackConfig();
                return;
            }
            
            console.log(`[AuthService] AppConfig not yet available, waiting... (${this.configWaitAttempts}/${this.maxConfigWaitAttempts})`);
            setTimeout(() => this.waitForConfig(), 100);
            return;
        }
        
        // Adapter la configuration existante
        this.adaptExistingConfig();
        
        // Vérifier la configuration
        const validation = window.AppConfig.validate();
        console.log('[AuthService] Configuration validation:', validation);
        
        if (!validation.valid) {
            console.warn('[AuthService] Configuration issues detected:', validation.issues);
        } else {
            console.log('[AuthService] ✅ Configuration valid for', this.currentDomain);
        }
    }

    createFallbackConfig() {
        console.log('[AuthService] Creating fallback configuration for', this.currentDomain);
        
        // Client ID par défaut (universel)
        const defaultClientId = '8fec3ae1-78e3-4b5d-a425-00b8f20516f7';
        
        // Essayer de récupérer un Client ID sauvegardé
        let clientId = defaultClientId;
        try {
            const savedClientId = localStorage.getItem('emailsortpro_client_id');
            if (savedClientId && 
                savedClientId !== 'VOTRE_CLIENT_ID_ICI' && 
                savedClientId !== 'CONFIGURATION_REQUIRED' &&
                /^[a-f0-9-]{36}$/i.test(savedClientId)) {
                clientId = savedClientId;
                console.log('[AuthService] Using saved client ID from localStorage');
            }
        } catch (e) {
            console.warn('[AuthService] Cannot access localStorage:', e);
        }

        window.AppConfig = {
            msal: {
                clientId: clientId,
                authority: 'https://login.microsoftonline.com/common',
                redirectUri: this.dynamicConfig.redirectUri,
                postLogoutRedirectUri: this.dynamicConfig.postLogoutRedirectUri,
                cache: {
                    cacheLocation: 'localStorage',
                    storeAuthStateInCookie: true
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message) => {
                            if (this.isTestEnvironment) {
                                console.log(`[MSAL ${level}] ${message}`);
                            }
                        },
                        piiLoggingEnabled: false,
                        logLevel: this.isTestEnvironment ? 'Verbose' : 'Warning'
                    },
                    allowNativeBroker: false,
                    allowRedirectInIframe: false
                }
            },
            scopes: {
                login: [
                    'https://graph.microsoft.com/User.Read',
                    'https://graph.microsoft.com/Mail.Read',
                    'https://graph.microsoft.com/Mail.ReadWrite'
                ],
                silent: [
                    'https://graph.microsoft.com/User.Read',
                    'https://graph.microsoft.com/Mail.Read',
                    'https://graph.microsoft.com/Mail.ReadWrite'
                ]
            },
            app: {
                name: 'EmailSortPro',
                version: '5.0.0',
                debug: this.isTestEnvironment,
                environment: this.isTestEnvironment ? 'test' : 'production',
                domain: this.currentDomain,
                urls: this.dynamicConfig,
                fallback: true
            },
            validate() {
                const issues = [];
                if (!this.msal.clientId || this.msal.clientId === 'CONFIGURATION_REQUIRED') {
                    issues.push('Client ID not configured');
                }
                return { valid: issues.length === 0, issues };
            },
            getDebugInfo() {
                return {
                    hostname: window.location.hostname,
                    domain: this.app.domain,
                    environment: this.app.environment,
                    clientId: this.msal.clientId.substring(0, 8) + '...',
                    redirectUri: this.msal.redirectUri,
                    fallbackConfig: true,
                    timestamp: new Date().toISOString()
                };
            }
        };

        console.log('[AuthService] ✅ Fallback configuration created for', this.currentDomain);
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
            
            // Vérifier que MSAL est chargé
            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded - check internet connection');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Attendre que la configuration soit disponible
            let waitAttempts = 0;
            while (!window.AppConfig && waitAttempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitAttempts++;
            }

            if (!window.AppConfig) {
                console.warn('[AuthService] AppConfig still not available, creating fallback');
                this.createFallbackConfig();
            }

            // S'assurer que la configuration est adaptée au domaine actuel
            this.adaptExistingConfig();
            
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                console.warn('[AuthService] Configuration issues:', validation.issues);
            }

            console.log('[AuthService] Using configuration:', {
                clientId: window.AppConfig.msal.clientId.substring(0, 8) + '...',
                authority: window.AppConfig.msal.authority,
                redirectUri: window.AppConfig.msal.redirectUri,
                postLogoutRedirectUri: window.AppConfig.msal.postLogoutRedirectUri,
                domain: this.currentDomain,
                urlMatch: window.AppConfig.msal.redirectUri.includes(this.currentDomain)
            });

            // Validation critique des URIs
            if (!window.AppConfig.msal.redirectUri.includes(this.currentDomain)) {
                console.error('[AuthService] ❌ CRITICAL: Redirect URI domain mismatch!');
                console.error('[AuthService] Expected domain:', this.currentDomain);
                console.error('[AuthService] Configured URI:', window.AppConfig.msal.redirectUri);
                
                // Force l'adaptation
                window.AppConfig.msal.redirectUri = this.dynamicConfig.redirectUri;
                window.AppConfig.msal.postLogoutRedirectUri = this.dynamicConfig.postLogoutRedirectUri;
                console.log('[AuthService] ✅ URIs forcibly adapted to current domain');
            }

            // Créer la configuration MSAL
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
                throw new Error('CRITICAL: clientId is missing or invalid');
            }
            
            if (!/^[a-f0-9-]{36}$/i.test(msalConfig.auth.clientId)) {
                throw new Error(`CRITICAL: clientId format invalid: ${msalConfig.auth.clientId}`);
            }
            
            console.log('[AuthService] MSAL config validation passed:', {
                clientId: '✅ Valid GUID',
                redirectUri: msalConfig.auth.redirectUri,
                redirectUriDomainMatch: msalConfig.auth.redirectUri.includes(this.currentDomain) ? '✅' : '❌',
                currentDomain: this.currentDomain
            });
            
            // Créer et initialiser l'instance MSAL
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            await this.msalInstance.initialize();
            console.log('[AuthService] ✅ MSAL instance initialized');
            
            // Gérer la redirection
            try {
                const response = await this.msalInstance.handleRedirectPromise();
                
                if (response && response.account) {
                    console.log('[AuthService] ✅ Authentication successful via redirect:', {
                        username: response.account.username,
                        name: response.account.name
                    });
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                    
                    // Sauvegarder le Client ID qui a fonctionné
                    try {
                        localStorage.setItem('emailsortpro_client_id', window.AppConfig.msal.clientId);
                        console.log('[AuthService] ✅ Working Client ID saved');
                    } catch (e) {
                        console.warn('[AuthService] Could not save Client ID:', e);
                    }
                } else {
                    console.log('[AuthService] No redirect response, checking cache...');
                    
                    const accounts = this.msalInstance.getAllAccounts();
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache:', this.account.username);
                    } else {
                        console.log('[AuthService] No cached account found');
                    }
                }
            } catch (redirectError) {
                console.warn('[AuthService] Redirect handling error:', redirectError);
                
                if (redirectError.message && redirectError.message.includes('redirect_uri')) {
                    console.error('[AuthService] ❌ REDIRECT URI ERROR!');
                    throw new Error(`Redirect URI error: Configure ${this.dynamicConfig.redirectUri} in Azure Portal as Single-page application (SPA)`);
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
            if (error.message.includes('unauthorized_client')) {
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `Configuration Azure incorrecte pour ${this.currentDomain}. Vérifiez votre Client ID.`,
                        'error', 15000
                    );
                }
            } else if (error.message.includes('redirect_uri') || error.message.includes('Redirect URI')) {
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `URI de redirection invalide. Configurez: ${this.dynamicConfig.redirectUri} comme Single-page application (SPA) dans Azure Portal`,
                        'error', 20000
                    );
                }
            }
            
            throw error;
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
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
            }

            const loginRequest = {
                scopes: window.AppConfig.scopes.login,
                prompt: 'select_account'
            };

            console.log('[AuthService] Login request prepared:', {
                scopes: loginRequest.scopes,
                clientId: this.msalInstance.getConfiguration().auth.clientId.substring(0, 8) + '...',
                redirectUri: this.msalInstance.getConfiguration().auth.redirectUri,
                currentDomain: this.currentDomain,
                uriMatch: this.msalInstance.getConfiguration().auth.redirectUri.includes(this.currentDomain)
            });
            
            // Validation finale avant login
            const msalConfig = this.msalInstance.getConfiguration();
            if (!msalConfig.auth.redirectUri.includes(this.currentDomain)) {
                console.error('[AuthService] ❌ URI mismatch detected at login!');
                throw new Error(`Redirect URI mismatch: Expected ${this.dynamicConfig.redirectUri}, got ${msalConfig.auth.redirectUri}`);
            }

            console.log('[AuthService] Initiating login redirect...');
            await this.msalInstance.loginRedirect(loginRequest);
            
        } catch (error) {
            console.error('[AuthService] ❌ Login error:', error);
            
            let userMessage = 'Erreur de connexion';
            
            if (error.errorCode) {
                switch (error.errorCode) {
                    case 'unauthorized_client':
                        userMessage = `Configuration Azure incorrecte pour ${this.currentDomain}. Vérifiez votre Client ID.`;
                        break;
                    case 'invalid_request':
                        userMessage = `URI de redirection invalide. Configurez: ${this.dynamicConfig.redirectUri} comme Single-page application (SPA)`;
                        break;
                    case 'invalid_client':
                        userMessage = 'Client ID invalide ou application non autorisée.';
                        break;
                    default:
                        userMessage = `Erreur MSAL: ${error.errorCode}`;
                }
            } else if (error.message.includes('redirect_uri') || error.message.includes('URI mismatch')) {
                userMessage = `Configuration Azure requise: Ajoutez ${this.dynamicConfig.redirectUri} comme URI de redirection Single-page application (SPA)`;
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(userMessage, 'error', 15000);
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
                postLogoutRedirectUri: this.dynamicConfig.postLogoutRedirectUri
            };

            console.log('[AuthService] Logout request:', logoutRequest);
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
        console.log('[AuthService] Resetting authentication');
        
        try {
            if (this.msalInstance && this.account) {
                await this.msalInstance.logoutSilent({ account: this.account });
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
        this.configWaitAttempts = 0;
        
        // Clear MSAL cache
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
                    console.warn('[AuthService] Error removing key:', key, e);
                }
            });
        }
        
        console.log('[AuthService] ✅ Cleanup complete');
    }

    getDiagnosticInfo() {
        return {
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            currentDomain: this.currentDomain,
            currentOrigin: this.currentOrigin,
            currentUrl: this.currentUrl,
            isTestEnvironment: this.isTestEnvironment,
            dynamicConfig: this.dynamicConfig,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri,
                domainMatch: this.msalInstance.getConfiguration()?.auth?.redirectUri?.includes(this.currentDomain)
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                environment: window.AppConfig.app?.environment,
                validation: window.AppConfig.validate(),
                debug: window.AppConfig.getDebugInfo ? window.AppConfig.getDebugInfo() : 'Not available'
            } : { exists: false },
            uriValidation: {
                expectedRedirectUri: this.dynamicConfig.redirectUri,
                configuredRedirectUri: window.AppConfig?.msal?.redirectUri,
                match: window.AppConfig?.msal?.redirectUri === this.dynamicConfig.redirectUri,
                domainInUri: window.AppConfig?.msal?.redirectUri?.includes(this.currentDomain)
            }
        };
    }
}

// Créer l'instance globale
try {
    window.authService = new AuthService();
    console.log('[AuthService] ✅ Global instance created v5.0 for', window.location.hostname);
} catch (error) {
    console.error('[AuthService] ❌ Failed to create global instance:', error);
    
    window.authService = {
        isInitialized: false,
        initialize: () => Promise.reject(new Error('AuthService failed to initialize: ' + error.message)),
        login: () => Promise.reject(new Error('AuthService not available: ' + error.message)),
        isAuthenticated: () => false,
        getDiagnosticInfo: () => ({ 
            error: 'AuthService failed to create: ' + error.message,
            currentDomain: window.location.hostname,
            timestamp: new Date().toISOString()
        })
    };
}

// Fonction de diagnostic globale
window.diagnoseMSAL = function() {
    console.group('🔍 DIAGNOSTIC MSAL v5.0 - ' + window.location.hostname);
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        const configDiag = window.AppConfig ? window.AppConfig.getDebugInfo() : null;
        
        console.log('🔐 AuthService:', authDiag);
        console.log('⚙️ Configuration:', configDiag);
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🎯 Current domain:', authDiag.currentDomain);
        console.log('🧪 Test environment:', authDiag.isTestEnvironment);
        console.log('🔄 Dynamic config:', authDiag.dynamicConfig);
        
        // Validation URI critique
        console.log('🔗 URI Validation:');
        console.log('  Expected Redirect URI:', authDiag.uriValidation.expectedRedirectUri);
        console.log('  Configured Redirect URI:', authDiag.uriValidation.configuredRedirectUri);
        console.log('  Exact Match:', authDiag.uriValidation.match ? '✅' : '❌');
        console.log('  Domain in URI:', authDiag.uriValidation.domainInUri ? '✅' : '❌');
        
        if (!authDiag.uriValidation.match) {
            console.log('🚨 ACTION REQUIRED:');
            console.log(`  1. Go to Azure Portal > App Registrations`);
            console.log(`  2. Select your app`);
            console.log(`  3. Go to Authentication`);
            console.log(`  4. Add redirect URI: ${authDiag.uriValidation.expectedRedirectUri}`);
            console.log(`  5. Select "Single-page application (SPA)" type`);
        }
        
        return { authDiag, configDiag };
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ AuthService v5.0 loaded with adaptive domain support for:', window.location.hostname);
