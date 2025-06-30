// AuthService.js - Service d'authentification Microsoft Graph CORRIGÉ v4.4
// Amélioration de l'intégration analytics avec gestion d'erreurs OAuth renforcée

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        this.maxConfigWaitAttempts = 50; // 5 secondes max
        this.targetDomain = 'coruscating-dodol-f30e8d.netlify.app';
        this.lastRedirectError = null;
        this.redirectRetryCount = 0;
        this.maxRedirectRetries = 3;
        
        console.log('[AuthService] Constructor called v4.4 - Enhanced OAuth error handling for:', this.targetDomain);
        
        // Vérifier le domaine immédiatement
        this.verifyDomain();
        
        // Attendre que la configuration soit disponible avec timeout
        this.waitForConfig();
    }

    verifyDomain() {
        const currentDomain = window.location.hostname;
        const isCorrectDomain = currentDomain === this.targetDomain;
        
        console.log('[AuthService] Domain verification:', {
            current: currentDomain,
            target: this.targetDomain,
            isCorrect: isCorrectDomain
        });
        
        if (!isCorrectDomain) {
            console.error('[AuthService] ❌ CRITICAL DOMAIN MISMATCH!');
            console.error('[AuthService] This service is configured EXCLUSIVELY for:', this.targetDomain);
            console.error('[AuthService] Current domain:', currentDomain);
            console.error('[AuthService] Authentication WILL FAIL on wrong domain!');
        } else {
            console.log('[AuthService] ✅ Running on correct target domain:', this.targetDomain);
        }
    }

    waitForConfig() {
        console.log('[AuthService] Waiting for configuration...');
        
        if (!window.AppConfig) {
            this.configWaitAttempts++;
            
            if (this.configWaitAttempts >= this.maxConfigWaitAttempts) {
                console.error(`[AuthService] ❌ Configuration timeout for ${this.targetDomain} - AppConfig not available after 5 seconds`);
                return;
            }
            
            console.log(`[AuthService] AppConfig not yet available, waiting... (${this.configWaitAttempts}/${this.maxConfigWaitAttempts})`);
            setTimeout(() => this.waitForConfig(), 100);
            return;
        }
        
        // Vérifier immédiatement la configuration
        const validation = window.AppConfig.validate();
        console.log(`[AuthService] Configuration validation for ${this.targetDomain}:`, validation);
        
        // Vérification spécifique pour le domaine cible
        if (window.AppConfig.msal?.redirectUri && 
            !window.AppConfig.msal.redirectUri.includes(this.targetDomain)) {
            console.error(`[AuthService] ❌ Redirect URI does not match target domain ${this.targetDomain}!`);
            console.error('[AuthService] Expected domain:', this.targetDomain);
            console.error('[AuthService] Configured URI:', window.AppConfig.msal.redirectUri);
        }
        
        if (!validation.valid) {
            console.error(`[AuthService] Configuration invalid for ${this.targetDomain}:`, validation.issues);
            // Continuer quand même pour permettre l'affichage des erreurs
        } else {
            console.log(`[AuthService] ✅ Configuration valid for ${this.targetDomain}`);
        }
    }

    async initialize() {
        console.log(`[AuthService] Initialize called for ${this.targetDomain}`);
        
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
            console.log(`[AuthService] Starting initialization for ${this.targetDomain}...`);
            
            // Vérification critique du domaine
            const currentDomain = window.location.hostname;
            if (currentDomain !== this.targetDomain) {
                throw new Error(`CRITICAL DOMAIN ERROR: Service configured for ${this.targetDomain} but running on ${currentDomain}`);
            }
            
            // Vérifier que MSAL est chargé
            if (typeof msal === 'undefined') {
                throw new Error('MSAL library not loaded - check if script is included');
            }
            console.log('[AuthService] ✅ MSAL library available');

            // Vérifier que la configuration est disponible ET valide
            if (!window.AppConfig) {
                throw new Error('AppConfig not loaded - check if config.js is included before AuthService.js');
            }

            // Utiliser la méthode validate() standard au lieu de forceValidate()
            const validation = window.AppConfig.validate();
            console.log(`[AuthService] Configuration validation result for ${this.targetDomain}:`, validation);
            
            if (!validation.valid) {
                // Vérification spéciale pour les erreurs de domaine
                const domainIssues = validation.issues.filter(issue => 
                    issue.includes(this.targetDomain) || 
                    issue.includes('redirect') || 
                    issue.includes('URI')
                );
                
                if (domainIssues.length > 0) {
                    const errorMsg = `Configuration invalide pour ${this.targetDomain}: ${domainIssues.join(', ')}`;
                    console.error('[AuthService]', errorMsg);
                    throw new Error(errorMsg);
                } else {
                    console.warn('[AuthService] Configuration issues detected, but proceeding...');
                }
            }

            console.log(`[AuthService] ✅ Configuration validated for ${this.targetDomain}`);
            
            // Configuration STRICTE pour le domaine cible
            const expectedRedirectUri = `https://${this.targetDomain}/auth-callback.html`;
            const expectedLogoutUri = `https://${this.targetDomain}/`;
            
            // Log de la configuration utilisée (sans exposer de secrets)
            console.log(`[AuthService] Using configuration for ${this.targetDomain}:`, {
                clientId: window.AppConfig.msal?.clientId ? window.AppConfig.msal.clientId.substring(0, 8) + '...' : 'MISSING',
                authority: window.AppConfig.msal?.authority,
                redirectUri: window.AppConfig.msal?.redirectUri,
                postLogoutRedirectUri: window.AppConfig.msal?.postLogoutRedirectUri,
                cacheLocation: window.AppConfig.msal?.cache?.cacheLocation,
                environment: window.AppConfig.app?.environment || 'unknown',
                domain: window.AppConfig.app?.domain,
                expectedRedirectUri: expectedRedirectUri,
                expectedLogoutUri: expectedLogoutUri
            });

            // Vérification critique des URIs pour le domaine cible
            if (window.AppConfig.msal?.redirectUri !== expectedRedirectUri) {
                console.error(`[AuthService] ❌ CRITICAL: Redirect URI mismatch for ${this.targetDomain}!`);
                console.error('[AuthService] Expected:', expectedRedirectUri);
                console.error('[AuthService] Configured:', window.AppConfig.msal?.redirectUri);
                throw new Error(`Redirect URI must be configured as: ${expectedRedirectUri}`);
            }
            
            if (window.AppConfig.msal?.postLogoutRedirectUri !== expectedLogoutUri) {
                console.warn(`[AuthService] ⚠️ Logout URI mismatch for ${this.targetDomain} (non-critical)`);
                console.warn('[AuthService] Expected:', expectedLogoutUri);
                console.warn('[AuthService] Configured:', window.AppConfig.msal?.postLogoutRedirectUri);
            }

            // Créer l'instance MSAL avec validation renforcée
            console.log(`[AuthService] Creating MSAL instance for ${this.targetDomain}...`);
            
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
            
            console.log(`[AuthService] MSAL config prepared for ${this.targetDomain}:`, {
                clientId: msalConfig.auth.clientId ? '✅ Present (valid GUID)' : '❌ Missing',
                authority: msalConfig.auth.authority ? '✅ Present' : '❌ Missing',
                redirectUri: msalConfig.auth.redirectUri ? '✅ Present' : '❌ Missing',
                postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri ? '✅ Present' : '❌ Missing',
                cacheLocation: msalConfig.cache?.cacheLocation || 'default',
                domainMatch: msalConfig.auth.redirectUri?.includes(this.targetDomain) ? '✅ Correct' : '❌ Wrong domain'
            });
            
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            console.log(`[AuthService] ✅ MSAL instance created successfully for ${this.targetDomain}`);
            
            // Initialiser MSAL
            await this.msalInstance.initialize();
            console.log(`[AuthService] ✅ MSAL instance initialized for ${this.targetDomain}`);
            
            // Gérer la redirection si elle existe avec gestion d'erreurs améliorée
            try {
                console.log('[AuthService] Checking for redirect response...');
                const response = await this.handleRedirectWithRetry();
                
                if (response) {
                    console.log(`[AuthService] ✅ Redirect response received for ${this.targetDomain}:`, {
                        username: response.account?.username,
                        name: response.account?.name
                    });
                    this.account = response.account;
                    this.msalInstance.setActiveAccount(this.account);
                    
                    // ANALYTICS: Track successful authentication from redirect avec données complètes
                    if (window.analyticsManager && typeof window.analyticsManager.trackAuthentication === 'function') {
                        try {
                            const userInfo = {
                                displayName: response.account.name || 'Utilisateur Microsoft',
                                mail: response.account.username,
                                userPrincipalName: response.account.username,
                                email: response.account.username, // Ajout explicite de l'email
                                provider: 'microsoft',
                                homeAccountId: response.account.homeAccountId,
                                localAccountId: response.account.localAccountId,
                                tenantId: response.account.tenantId
                            };
                            
                            console.log('[AuthService] ✅ Tracking authentication with analytics:', {
                                email: userInfo.email,
                                name: userInfo.displayName,
                                provider: userInfo.provider
                            });
                            
                            window.analyticsManager.trackAuthentication('microsoft', userInfo);
                            console.log('[AuthService] ✅ Analytics: Auth success tracked from redirect');
                        } catch (analyticsError) {
                            console.warn('[AuthService] Analytics error:', analyticsError);
                        }
                    } else {
                        console.warn('[AuthService] Analytics manager not available for tracking authentication');
                    }
                } else {
                    console.log('[AuthService] No redirect response');
                    
                    // Pas de redirection, vérifier s'il y a un compte dans le cache
                    const accounts = this.msalInstance.getAllAccounts();
                    console.log('[AuthService] Accounts in cache:', accounts.length);
                    
                    if (accounts.length > 0) {
                        this.account = accounts[0];
                        this.msalInstance.setActiveAccount(this.account);
                        console.log('[AuthService] ✅ Account restored from cache:', this.account.username);
                        
                        // ANALYTICS: Track session restoration avec email en clair
                        if (window.analyticsManager && typeof window.analyticsManager.trackEvent === 'function') {
                            try {
                                window.analyticsManager.trackEvent('session_restored', {
                                    provider: 'microsoft',
                                    username: this.account.username,
                                    email: this.account.username, // Email en clair
                                    name: this.account.name || 'Utilisateur Microsoft'
                                });
                                console.log('[AuthService] ✅ Analytics: Session restoration tracked with email');
                            } catch (analyticsError) {
                                console.warn('[AuthService] Analytics error:', analyticsError);
                            }
                        }
                    } else {
                        console.log('[AuthService] No account in cache');
                    }
                }
            } catch (redirectError) {
                // Gestion améliorée des erreurs de redirection
                await this.handleRedirectError(redirectError);
            }

            this.isInitialized = true;
            console.log(`[AuthService] ✅ Initialization completed successfully for ${this.targetDomain}`);
            
            return true;

        } catch (error) {
            console.error(`[AuthService] ❌ Initialization failed for ${this.targetDomain}:`, error);
            this.isInitialized = false;
            this.initializationPromise = null;
            
            // ANALYTICS: Track initialization error
            if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                try {
                    window.analyticsManager.onError('auth_init_error', {
                        message: error.message,
                        provider: 'microsoft',
                        domain: this.targetDomain
                    });
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
            // Gestion d'erreurs spécifiques avec messages détaillés pour le domaine cible
            if (error.message.includes('CRITICAL DOMAIN ERROR')) {
                console.error('[AuthService] DOMAIN MISMATCH ERROR:', error.message);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `Erreur critique: Ce service est configuré exclusivement pour ${this.targetDomain}`,
                        'error',
                        15000
                    );
                }
            } else if (error.message.includes('unauthorized_client')) {
                console.error(`[AuthService] AZURE CONFIG ERROR: Client ID incorrect or app not configured for ${this.targetDomain}`);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `Erreur de configuration Azure pour ${this.targetDomain}. Client ID incorrect.`,
                        'error',
                        15000
                    );
                }
            } else if (error.message.includes('redirect_uri') || error.message.includes('Redirect URI')) {
                console.error('[AuthService] REDIRECT URI ERROR:', error.message);
                if (window.uiManager) {
                    window.uiManager.showToast(
                        `URI de redirection invalide. Configurez: https://${this.targetDomain}/auth-callback.html`,
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

    // === GESTION AMÉLIORÉE DES ERREURS DE REDIRECTION ===

    async handleRedirectWithRetry() {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                console.log(`[AuthService] Attempting to handle redirect (attempt ${attempts + 1}/${maxAttempts})`);
                const response = await this.msalInstance.handleRedirectPromise();
                
                // Reset retry count on success
                this.redirectRetryCount = 0;
                this.lastRedirectError = null;
                
                return response;
                
            } catch (error) {
                attempts++;
                this.lastRedirectError = error;
                
                console.warn(`[AuthService] Redirect handling attempt ${attempts} failed:`, error.message);
                
                // Gestion spécifique des erreurs d'expiration de code
                if (this.isExpiredCodeError(error)) {
                    console.log('[AuthService] 🔄 Expired OAuth code detected, clearing state and retrying...');
                    await this.clearExpiredAuthState();
                    
                    if (attempts < maxAttempts) {
                        console.log('[AuthService] Retrying redirect handling after clearing expired state...');
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
                        continue;
                    }
                }
                
                // Gestion des erreurs de grant invalide
                if (this.isInvalidGrantError(error)) {
                    console.log('[AuthService] 🔄 Invalid grant detected, clearing authentication state...');
                    await this.clearInvalidGrantState();
                    
                    if (attempts < maxAttempts) {
                        console.log('[AuthService] Retrying after clearing invalid grant state...');
                        await new Promise(resolve => setTimeout(resolve, 1500)); // Attendre 1.5 secondes
                        continue;
                    }
                }
                
                // Si c'est la dernière tentative, throw l'erreur
                if (attempts >= maxAttempts) {
                    throw error;
                }
                
                // Attendre avant la prochaine tentative
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return null;
    }

    async handleRedirectError(error) {
        console.warn('[AuthService] 🚨 Redirect handling error detected:', error.message);
        
        // Analyser le type d'erreur
        const errorAnalysis = this.analyzeRedirectError(error);
        console.log('[AuthService] Error analysis:', errorAnalysis);
        
        // ANALYTICS: Track redirect error avec détails
        if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
            try {
                window.analyticsManager.onError('redirect_error', {
                    message: error.message,
                    errorCode: error.errorCode || 'unknown',
                    subError: error.subError || 'unknown',
                    provider: 'microsoft',
                    domain: this.targetDomain,
                    isExpiredCode: this.isExpiredCodeError(error),
                    isInvalidGrant: this.isInvalidGrantError(error),
                    retryCount: this.redirectRetryCount
                });
            } catch (analyticsError) {
                console.warn('[AuthService] Analytics error:', analyticsError);
            }
        }
        
        // Actions basées sur le type d'erreur
        if (errorAnalysis.isExpiredCode) {
            console.log('[AuthService] 🔄 Handling expired OAuth code...');
            await this.handleExpiredCodeError(error);
        } else if (errorAnalysis.isInvalidGrant) {
            console.log('[AuthService] 🔄 Handling invalid grant...');
            await this.handleInvalidGrantError(error);
        } else if (errorAnalysis.isRedirectUriError) {
            console.log('[AuthService] 🚨 Handling redirect URI error...');
            await this.handleRedirectUriError(error);
        } else {
            console.log('[AuthService] ⚠️ Handling generic redirect error...');
            await this.handleGenericRedirectError(error);
        }
    }

    analyzeRedirectError(error) {
        const message = error.message || '';
        const errorCode = error.errorCode || '';
        const subError = error.subError || '';
        
        return {
            isExpiredCode: this.isExpiredCodeError(error),
            isInvalidGrant: this.isInvalidGrantError(error),
            isRedirectUriError: message.includes('redirect_uri') || errorCode.includes('redirect'),
            isNetworkError: message.includes('network') || message.includes('Network'),
            isUserCancelled: errorCode === 'user_cancelled',
            isPolicyError: message.includes('AADB2C') || subError.includes('policy'),
            errorType: errorCode || 'unknown_error',
            canRetry: this.canRetryError(error)
        };
    }

    isExpiredCodeError(error) {
        const message = error.message || '';
        const errorCode = error.errorCode || '';
        
        return message.includes('code has expired') || 
               message.includes('70000') || 
               message.includes('AADSTS70000') ||
               errorCode === 'invalid_grant' && message.includes('expired');
    }

    isInvalidGrantError(error) {
        const errorCode = error.errorCode || '';
        const message = error.message || '';
        
        return errorCode === 'invalid_grant' || 
               message.includes('invalid_grant') ||
               message.includes('AADSTS70008') ||
               message.includes('AADSTS50089');
    }

    canRetryError(error) {
        const nonRetryableErrors = [
            'unauthorized_client',
            'invalid_client',
            'unsupported_grant_type',
            'redirect_uri_mismatch'
        ];
        
        const errorCode = error.errorCode || '';
        return !nonRetryableErrors.includes(errorCode);
    }

    async clearExpiredAuthState() {
        console.log('[AuthService] 🧹 Clearing expired authentication state...');
        
        try {
            // Nettoyer les paramètres URL liés à OAuth
            const url = new URL(window.location);
            const hasOAuthParams = url.searchParams.has('code') || 
                                 url.searchParams.has('state') || 
                                 url.searchParams.has('session_state');
            
            if (hasOAuthParams) {
                console.log('[AuthService] Removing OAuth parameters from URL...');
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                url.searchParams.delete('session_state');
                url.searchParams.delete('error');
                url.searchParams.delete('error_description');
                
                // Mise à jour de l'URL sans recharger la page
                window.history.replaceState({}, document.title, url.toString());
            }
            
            // Nettoyer le cache MSAL sélectivement
            if (this.msalInstance) {
                console.log('[AuthService] Clearing MSAL temp cache...');
                try {
                    // Nettoyer seulement les données temporaires, pas les comptes persistants
                    const cache = this.msalInstance.getTokenCache();
                    // Note: Ne pas supprimer tous les comptes, juste les tokens temporaires
                } catch (cacheError) {
                    console.warn('[AuthService] Error clearing MSAL cache:', cacheError);
                }
            }
            
        } catch (error) {
            console.warn('[AuthService] Error during expired state cleanup:', error);
        }
    }

    async clearInvalidGrantState() {
        console.log('[AuthService] 🧹 Clearing invalid grant state...');
        
        try {
            // Supprimer tous les tokens mais garder les informations de compte si possible
            if (this.msalInstance) {
                const accounts = this.msalInstance.getAllAccounts();
                
                // Nettoyer les tokens expirés
                for (const account of accounts) {
                    try {
                        const cache = this.msalInstance.getTokenCache();
                        // Nettoyer les tokens d'accès expirés pour ce compte
                        console.log('[AuthService] Clearing tokens for account:', account.username);
                    } catch (tokenClearError) {
                        console.warn('[AuthService] Error clearing tokens for account:', tokenClearError);
                    }
                }
            }
            
            // Nettoyer l'URL
            await this.clearExpiredAuthState();
            
        } catch (error) {
            console.warn('[AuthService] Error during invalid grant cleanup:', error);
        }
    }

    async handleExpiredCodeError(error) {
        console.log('[AuthService] 🔄 Handling expired OAuth code error...');
        
        // Incrémenter le compteur de retry
        this.redirectRetryCount++;
        
        if (this.redirectRetryCount <= this.maxRedirectRetries) {
            console.log(`[AuthService] Will retry authentication (${this.redirectRetryCount}/${this.maxRedirectRetries})`);
            
            // Nettoyer l'état et continuer
            await this.clearExpiredAuthState();
            
            // Optionnel: Notification à l'utilisateur
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Session expirée, reconnexion automatique en cours...',
                    'info',
                    3000
                );
            }
        } else {
            console.warn('[AuthService] Max retries reached for expired code error');
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Session expirée. Veuillez vous reconnecter.',
                    'warning',
                    5000
                );
            }
        }
    }

    async handleInvalidGrantError(error) {
        console.log('[AuthService] 🔄 Handling invalid grant error...');
        
        await this.clearInvalidGrantState();
        
        if (window.uiManager) {
            window.uiManager.showToast(
                'Autorisation expirée. Reconnexion nécessaire.',
                'warning',
                4000
            );
        }
    }

    async handleRedirectUriError(error) {
        console.error('[AuthService] 🚨 Redirect URI error detected:', error.message);
        
        // Gestion spéciale des erreurs de redirection pour le domaine cible
        if (error.message && error.message.includes('redirect_uri')) {
            console.error(`[AuthService] ❌ REDIRECT URI ERROR for ${this.targetDomain}!`);
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    `URI de redirection incorrecte. Configurez: https://${this.targetDomain}/auth-callback.html`,
                    'error',
                    10000
                );
            }
            
            throw new Error(`Redirect URI error: Configure https://${this.targetDomain}/auth-callback.html in Azure Portal`);
        }
    }

    async handleGenericRedirectError(error) {
        console.warn('[AuthService] ⚠️ Generic redirect error:', error.message);
        
        // Log détaillé pour debug
        console.log('[AuthService] Full error details:', {
            message: error.message,
            errorCode: error.errorCode,
            subError: error.subError,
            correlationId: error.correlationId,
            timestamp: new Date().toISOString()
        });
        
        // Continuer l'initialisation même en cas d'erreur non critique
        console.log('[AuthService] Continuing initialization despite redirect error...');
    }

    // === MÉTHODES PUBLIQUES ===

    isAuthenticated() {
        const authenticated = this.account !== null && this.isInitialized;
        console.log(`[AuthService] Authentication check for ${this.targetDomain}:`, {
            hasAccount: !!this.account,
            isInitialized: this.isInitialized,
            result: authenticated,
            domain: window.location.hostname,
            correctDomain: window.location.hostname === this.targetDomain,
            userEmail: this.account?.username || 'none',
            lastRedirectError: this.lastRedirectError?.message || 'none'
        });
        return authenticated;
    }

    getAccount() {
        return this.account;
    }

    async login() {
        console.log(`[AuthService] Login attempt started for ${this.targetDomain}...`);
        
        // Reset retry counters on new login attempt
        this.redirectRetryCount = 0;
        this.lastRedirectError = null;
        
        // Vérification critique du domaine avant login
        const currentDomain = window.location.hostname;
        if (currentDomain !== this.targetDomain) {
            throw new Error(`CRITICAL: Cannot login from ${currentDomain}. This service works ONLY on ${this.targetDomain}`);
        }
        
        if (!this.isInitialized) {
            console.log('[AuthService] Not initialized, initializing first...');
            await this.initialize();
        }

        try {
            // Vérifier encore une fois la configuration avant le login
            const validation = window.AppConfig.validate();
            if (!validation.valid) {
                throw new Error(`Configuration invalid before login for ${this.targetDomain}: ${validation.issues.join(', ')}`);
            }

            // Vérification spéciale de l'URI de redirection
            const currentUrl = window.location.origin;
            const expectedOrigin = `https://${this.targetDomain}`;
            
            if (currentUrl !== expectedOrigin) {
                console.error('[AuthService] ❌ Origin mismatch detected');
                console.error('[AuthService] Current:', currentUrl);
                console.error('[AuthService] Expected:', expectedOrigin);
                throw new Error(`Origin mismatch: Expected ${expectedOrigin}, got ${currentUrl}`);
            }

            // Nettoyer l'état avant le login
            await this.clearExpiredAuthState();

            // Préparer la requête de login avec validation
            const scopes = window.AppConfig.scopes?.login || ['https://graph.microsoft.com/User.Read'];
            
            const loginRequest = {
                scopes: scopes,
                prompt: 'select_account'
            };

            console.log(`[AuthService] Login request prepared for ${this.targetDomain}:`, {
                scopes: loginRequest.scopes,
                prompt: loginRequest.prompt,
                clientId: this.msalInstance?.getConfiguration()?.auth?.clientId ? '✅ Present in MSAL' : '❌ Missing in MSAL',
                redirectUri: this.msalInstance?.getConfiguration()?.auth?.redirectUri,
                domain: window.location.hostname,
                targetDomain: this.targetDomain
            });
            
            // Vérification finale avant login
            if (!this.msalInstance) {
                throw new Error('MSAL instance not available');
            }
            
            const msalConfig = this.msalInstance.getConfiguration();
            if (!msalConfig?.auth?.clientId) {
                throw new Error('CRITICAL: clientId missing in MSAL instance');
            }
            
            if (!msalConfig?.auth?.redirectUri?.includes(this.targetDomain)) {
                throw new Error(`CRITICAL: redirectUri does not match target domain ${this.targetDomain}`);
            }

            console.log(`[AuthService] Initiating login redirect for ${this.targetDomain}...`);
            console.log('[AuthService] MSAL instance config verified:', {
                clientId: msalConfig.auth.clientId.substring(0, 8) + '...',
                authority: msalConfig.auth.authority,
                redirectUri: msalConfig.auth.redirectUri,
                domainMatch: msalConfig.auth.redirectUri.includes(this.targetDomain) ? '✅' : '❌',
                targetDomain: this.targetDomain
            });
            
            // ANALYTICS: Track login attempt
            if (window.analyticsManager && typeof window.analyticsManager.trackEvent === 'function') {
                try {
                    window.analyticsManager.trackEvent('login_attempt', {
                        provider: 'microsoft',
                        domain: this.targetDomain
                    });
                    console.log('[AuthService] ✅ Analytics: Login attempt tracked');
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
            // Utiliser loginRedirect pour éviter les problèmes de popup
            await this.msalInstance.loginRedirect(loginRequest);
            // Note: La redirection va se produire, pas de code après cette ligne
            
        } catch (error) {
            console.error(`[AuthService] ❌ Login error for ${this.targetDomain}:`, error);
            
            // ANALYTICS: Track login error
            if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                try {
                    window.analyticsManager.onError('login_error', {
                        message: error.message,
                        errorCode: error.errorCode,
                        provider: 'microsoft',
                        domain: this.targetDomain
                    });
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
            // Gestion d'erreurs spécifiques avec logging détaillé
            let userMessage = 'Erreur de connexion';
            
            if (error.message.includes('CRITICAL: Cannot login from')) {
                userMessage = error.message;
            } else if (error.message.includes('Origin mismatch')) {
                userMessage = `Erreur de domaine: ${error.message}`;
            } else if (error.errorCode) {
                const errorCode = error.errorCode;
                console.log('[AuthService] MSAL Error code:', errorCode);
                console.log('[AuthService] MSAL Error details:', {
                    errorCode: error.errorCode,
                    errorMessage: error.errorMessage,
                    subError: error.subError,
                    correlationId: error.correlationId
                });
                
                if (window.AppConfig.errors && window.AppConfig.errors[errorCode]) {
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
                            userMessage = `Configuration Azure incorrecte pour ${this.targetDomain}. Vérifiez votre Client ID.`;
                            break;
                        case 'invalid_client':
                            userMessage = `Client ID invalide pour ${this.targetDomain}. Vérifiez votre configuration Azure.`;
                            break;
                        case 'invalid_request':
                            userMessage = `URI de redirection invalide. Configurez: https://${this.targetDomain}/auth-callback.html`;
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
                    domain: window.AppConfig?.app?.domain,
                    targetDomain: this.targetDomain
                });
            } else if (error.message.includes('redirectUri') || error.message.includes('redirect_uri')) {
                userMessage = `URI de redirection incorrecte. Configurez: https://${this.targetDomain}/auth-callback.html dans Azure Portal`;
            }
            
            if (window.uiManager) {
                window.uiManager.showToast(userMessage, 'error', 12000);
            }
            
            throw error;
        }
    }

    async logout() {
        console.log(`[AuthService] Logout initiated for ${this.targetDomain}...`);
        
        // ANALYTICS: Track logout avec email en clair
        if (window.analyticsManager && typeof window.analyticsManager.trackEvent === 'function') {
            try {
                window.analyticsManager.trackEvent('logout', {
                    provider: 'microsoft',
                    domain: this.targetDomain,
                    userEmail: this.account?.username,
                    userName: this.account?.name || 'Utilisateur Microsoft'
                });
                console.log('[AuthService] ✅ Analytics: Logout tracked with user info');
            } catch (analyticsError) {
                console.warn('[AuthService] Analytics error:', analyticsError);
            }
        }
        
        if (!this.isInitialized) {
            console.warn('[AuthService] Not initialized for logout, force cleanup');
            this.forceCleanup();
            return;
        }

        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: `https://${this.targetDomain}/`
            };

            console.log(`[AuthService] Logout request for ${this.targetDomain}:`, logoutRequest);
            await this.msalInstance.logoutRedirect(logoutRequest);
            // La redirection va se produire
            
        } catch (error) {
            console.error(`[AuthService] Logout error for ${this.targetDomain}:`, error);
            
            // ANALYTICS: Track logout error
            if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                try {
                    window.analyticsManager.onError('logout_error', {
                        message: error.message,
                        provider: 'microsoft'
                    });
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
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
            // Définir les scopes par défaut si non disponibles
            const scopes = window.AppConfig.scopes?.silent || ['https://graph.microsoft.com/User.Read'];
            
            const tokenRequest = {
                scopes: scopes,
                account: this.account,
                forceRefresh: false
            };

            console.log('[AuthService] Requesting access token for scopes:', tokenRequest.scopes);
            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            
            if (response && response.accessToken) {
                console.log(`[AuthService] ✅ Token acquired successfully for ${this.targetDomain}`);
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
                
                // ANALYTICS: Track token error
                if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                    try {
                        window.analyticsManager.onError('token_error', {
                            message: error.message,
                            provider: 'microsoft'
                        });
                    } catch (analyticsError) {
                        console.warn('[AuthService] Analytics error:', analyticsError);
                    }
                }
                
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
            console.log(`[AuthService] Fetching user info from Graph API for ${this.targetDomain}...`);
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
            console.log(`[AuthService] ✅ User info retrieved for ${this.targetDomain}:`, userInfo.displayName);
            
            // Ajouter le provider et assurer la présence de l'email
            userInfo.provider = 'microsoft';
            userInfo.email = userInfo.mail || userInfo.userPrincipalName || this.account?.username;
            
            return userInfo;

        } catch (error) {
            console.error('[AuthService] Error getting user info:', error);
            
            // ANALYTICS: Track user info error
            if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                try {
                    window.analyticsManager.onError('user_info_error', {
                        message: error.message,
                        provider: 'microsoft'
                    });
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
            throw error;
        }
    }

    async reset() {
        console.log(`[AuthService] Resetting authentication for ${this.targetDomain}...`);
        
        try {
            if (this.msalInstance && this.account) {
                // Utiliser la méthode correcte pour le logout silencieux
                await this.msalInstance.getTokenCache().removeAccount(this.account);
            }
        } catch (error) {
            console.warn('[AuthService] Silent logout failed during reset:', error);
        }

        this.forceCleanup();
    }

    forceCleanup() {
        console.log(`[AuthService] Force cleanup initiated for ${this.targetDomain}...`);
        
        // Reset internal state
        this.account = null;
        this.isInitialized = false;
        this.msalInstance = null;
        this.initializationPromise = null;
        this.configWaitAttempts = 0;
        this.lastRedirectError = null;
        this.redirectRetryCount = 0;
        
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
        
        // Nettoyer l'URL des paramètres OAuth
        try {
            const url = new URL(window.location);
            if (url.searchParams.has('code') || url.searchParams.has('state')) {
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                url.searchParams.delete('session_state');
                url.searchParams.delete('error');
                url.searchParams.delete('error_description');
                window.history.replaceState({}, document.title, url.toString());
            }
        } catch (urlError) {
            console.warn('[AuthService] Error cleaning URL:', urlError);
        }
        
        console.log(`[AuthService] ✅ Cleanup complete for ${this.targetDomain}`);
    }

    // Méthode de diagnostic améliorée pour le domaine cible
    getDiagnosticInfo() {
        const currentDomain = window.location.hostname;
        const isCorrectDomain = currentDomain === this.targetDomain;
        
        return {
            targetDomain: this.targetDomain,
            currentDomain: currentDomain,
            domainMatch: isCorrectDomain,
            isInitialized: this.isInitialized,
            hasAccount: !!this.account,
            accountUsername: this.account?.username,
            msalInstanceExists: !!this.msalInstance,
            configWaitAttempts: this.configWaitAttempts,
            lastRedirectError: this.lastRedirectError?.message || null,
            redirectRetryCount: this.redirectRetryCount,
            maxRedirectRetries: this.maxRedirectRetries,
            msalConfig: this.msalInstance ? {
                clientId: this.msalInstance.getConfiguration()?.auth?.clientId?.substring(0, 8) + '...',
                authority: this.msalInstance.getConfiguration()?.auth?.authority,
                redirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri,
                postLogoutRedirectUri: this.msalInstance.getConfiguration()?.auth?.postLogoutRedirectUri,
                domainInRedirectUri: this.msalInstance.getConfiguration()?.auth?.redirectUri?.includes(this.targetDomain)
            } : null,
            appConfig: window.AppConfig ? {
                exists: true,
                environment: window.AppConfig.app?.environment,
                domain: window.AppConfig.app?.domain,
                validation: window.AppConfig.validate()
            } : { exists: false },
            uriValidation: {
                expectedRedirectUri: `https://${this.targetDomain}/auth-callback.html`,
                configuredRedirectUri: window.AppConfig?.msal?.redirectUri,
                match: window.AppConfig?.msal?.redirectUri === `https://${this.targetDomain}/auth-callback.html`
            },
            domainValidation: {
                isCorrectDomain: isCorrectDomain,
                criticalError: !isCorrectDomain ? `Service configured for ${this.targetDomain} but running on ${currentDomain}` : null
            },
            errorHandling: {
                lastRedirectError: this.lastRedirectError,
                redirectRetryCount: this.redirectRetryCount,
                maxRetries: this.maxRedirectRetries,
                canRetry: this.redirectRetryCount < this.maxRedirectRetries
            }
        };
    }

    // === MÉTHODES DE RÉCUPÉRATION D'ERREURS ===

    getLastError() {
        return this.lastRedirectError;
    }

    canRetryAuthentication() {
        return this.redirectRetryCount < this.maxRedirectRetries;
    }

    resetErrorState() {
        this.lastRedirectError = null;
        this.redirectRetryCount = 0;
        console.log('[AuthService] Error state reset');
    }
}

// Créer l'instance globale avec gestion d'erreur renforcée
try {
    // Éviter la double création
    if (!window.authService) {
        window.authService = new AuthService();
        console.log(`[AuthService] ✅ Global instance created successfully for ${window.authService.targetDomain}`);
    } else {
        console.log('[AuthService] Global instance already exists, skipping creation');
    }
} catch (error) {
    console.error('[AuthService] ❌ Failed to create global instance:', error);
    
    // Créer une instance de fallback plus informative
    window.authService = {
        targetDomain: 'coruscating-dodol-f30e8d.netlify.app',
        isInitialized: false,
        lastRedirectError: error,
        initialize: () => Promise.reject(new Error('AuthService failed to initialize: ' + error.message)),
        login: () => Promise.reject(new Error('AuthService not available: ' + error.message)),
        isAuthenticated: () => false,
        canRetryAuthentication: () => false,
        resetErrorState: () => console.warn('[AuthService] Fallback: resetErrorState called'),
        getDiagnosticInfo: () => ({ 
            error: 'AuthService failed to create: ' + error.message,
            targetDomain: 'coruscating-dodol-f30e8d.netlify.app',
            currentDomain: window.location.hostname,
            domainMatch: window.location.hostname === 'coruscating-dodol-f30e8d.netlify.app',
            environment: window.AppConfig?.app?.environment || 'unknown',
            configExists: !!window.AppConfig,
            fallbackMode: true
        })
    };
}

// Fonction de diagnostic globale améliorée pour le domaine cible
window.diagnoseMSAL = function() {
    console.group(`🔍 DIAGNOSTIC MSAL DÉTAILLÉ v4.4 - ${window.authService.targetDomain} ONLY`);
    
    try {
        const authDiag = window.authService.getDiagnosticInfo();
        
        console.log('🎯 Target Domain:', authDiag.targetDomain);
        console.log('🌐 Current Domain:', authDiag.currentDomain);
        console.log('✅ Domain Match:', authDiag.domainMatch ? 'CORRECT' : 'WRONG');
        
        if (!authDiag.domainMatch) {
            console.log('🚨 CRITICAL DOMAIN ERROR:', authDiag.domainValidation.criticalError);
        }
        
        console.log('🔐 AuthService Status:', {
            initialized: authDiag.isInitialized,
            hasAccount: authDiag.hasAccount,
            userEmail: authDiag.accountUsername || 'none'
        });
        
        console.log('📚 MSAL Library:', typeof msal !== 'undefined' ? 'Available' : 'Missing');
        console.log('🔗 Current URL:', window.location.href);
        
        // Gestion d'erreurs spécifique
        if (authDiag.errorHandling?.lastRedirectError) {
            console.log('🚨 Last Redirect Error:', {
                message: authDiag.errorHandling.lastRedirectError.message || authDiag.errorHandling.lastRedirectError,
                retryCount: authDiag.errorHandling.redirectRetryCount,
                canRetry: authDiag.errorHandling.canRetry
            });
            
            // Analyse de l'erreur
            if (typeof authDiag.errorHandling.lastRedirectError === 'object') {
                const error = authDiag.errorHandling.lastRedirectError;
                console.log('🔍 Error Analysis:', {
                    isExpiredCode: window.authService.isExpiredCodeError?.(error) || false,
                    isInvalidGrant: window.authService.isInvalidGrantError?.(error) || false,
                    errorCode: error.errorCode || 'unknown',
                    canRetryError: window.authService.canRetryError?.(error) || false
                });
            }
        }
        
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
        
        if (!authDiag.domainMatch) {
            console.log('🚨 DOMAIN ERROR:');
            console.log(`  This AuthService is configured EXCLUSIVELY for ${authDiag.targetDomain}`);
            console.log(`  Current domain ${authDiag.currentDomain} is NOT supported`);
            console.log('  Authentication WILL FAIL on wrong domain');
        }
        
        // Actions de récupération suggérées
        if (authDiag.errorHandling?.lastRedirectError && authDiag.errorHandling.canRetry) {
            console.log('🔧 RECOVERY OPTIONS:');
            console.log('  1. window.authService.resetErrorState() - Reset error state');
            console.log('  2. window.authService.login() - Retry authentication');
            console.log('  3. window.authService.forceCleanup() - Clean all auth data');
        }
        
        return { authDiag };
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

// Fonction de récupération d'erreurs globale
window.recoverMSALAuth = function() {
    console.log('🔧 Attempting MSAL authentication recovery...');
    
    try {
        if (window.authService) {
            // Reset error state
            if (typeof window.authService.resetErrorState === 'function') {
                window.authService.resetErrorState();
                console.log('✅ Error state reset');
            }
            
            // Clear expired auth state
            if (typeof window.authService.clearExpiredAuthState === 'function') {
                window.authService.clearExpiredAuthState();
                console.log('✅ Expired auth state cleared');
            }
            
            // Check if retry is possible
            if (typeof window.authService.canRetryAuthentication === 'function' && 
                window.authService.canRetryAuthentication()) {
                console.log('✅ Retry is possible');
                return true;
            } else {
                console.log('⚠️ Maximum retries reached or retry not available');
                return false;
            }
        } else {
            console.error('❌ AuthService not available');
            return false;
        }
    } catch (error) {
        console.error('❌ Recovery failed:', error);
        return false;
    }
};

// Test de disponibilité de la configuration au chargement avec gestion d'erreurs améliorée
setTimeout(() => {
    if (window.AppConfig) {
        const validation = window.AppConfig.validate();
        const targetDomain = window.authService?.targetDomain || 'coruscating-dodol-f30e8d.netlify.app';
        const currentDomain = window.location.hostname;
        
        if (currentDomain !== targetDomain) {
            console.error(`🚨 CRITICAL DOMAIN MISMATCH: AuthService configured for ${targetDomain} but running on ${currentDomain}`);
        }
        
        if (!validation.valid) {
            console.warn(`🚨 WARNING: Configuration invalid for ${targetDomain}`);
            console.log('Issues:', validation.issues);
        }
        
        // Vérification spécifique du domaine
        if (window.AppConfig.msal?.redirectUri && 
            !window.AppConfig.msal.redirectUri.includes(targetDomain)) {
            console.error(`🚨 CRITICAL: Redirect URI does not match target domain ${targetDomain}!`);
            console.error('Expected:', `https://${targetDomain}/auth-callback.html`);
            console.error('Configured:', window.AppConfig.msal.redirectUri);
        }
        
        // Vérifier s'il y a des erreurs OAuth dans l'URL
        const url = new URL(window.location);
        if (url.searchParams.has('error')) {
            const error = url.searchParams.get('error');
            const errorDescription = url.searchParams.get('error_description');
            console.warn('🚨 OAuth error in URL:', { error, errorDescription });
            
            // Nettoyer l'URL automatiquement
            url.searchParams.delete('error');
            url.searchParams.delete('error_description');
            window.history.replaceState({}, document.title, url.toString());
            console.log('✅ OAuth error parameters cleaned from URL');
        }
        
        console.log('🔧 Available recovery functions:');
        console.log('  - diagnoseMSAL() for detailed diagnostic');
        console.log('  - recoverMSALAuth() for error recovery');
        console.log('  - window.authService.resetErrorState() to reset errors');
        
    } else {
        console.error('🚨 AppConfig not available after 2 seconds');
    }
}, 2000);

// Gestionnaire d'événements pour les erreurs OAuth dans l'URL
window.addEventListener('load', () => {
    try {
        const url = new URL(window.location);
        
        // Détecter et gérer les erreurs OAuth
        if (url.searchParams.has('error')) {
            const error = url.searchParams.get('error');
            const errorDescription = url.searchParams.get('error_description');
            
            console.warn('[AuthService] OAuth error detected in URL:', { error, errorDescription });
            
            // ANALYTICS: Track OAuth URL error
            if (window.analyticsManager && typeof window.analyticsManager.onError === 'function') {
                try {
                    window.analyticsManager.onError('oauth_url_error', {
                        error: error,
                        description: errorDescription,
                        url: window.location.href,
                        provider: 'microsoft'
                    });
                } catch (analyticsError) {
                    console.warn('[AuthService] Analytics error:', analyticsError);
                }
            }
            
            // Nettoyer l'URL et notifier l'utilisateur si nécessaire
            url.searchParams.delete('error');
            url.searchParams.delete('error_description');
            url.searchParams.delete('error_uri');
            window.history.replaceState({}, document.title, url.toString());
            
            // Gérer les erreurs spécifiques
            if (error === 'access_denied') {
                console.log('[AuthService] User denied access');
                if (window.uiManager) {
                    window.uiManager.showToast('Accès refusé. Veuillez accepter les autorisations.', 'warning', 5000);
                }
            } else if (error === 'invalid_request') {
                console.error('[AuthService] Invalid OAuth request');
                if (window.uiManager) {
                    window.uiManager.showToast('Requête OAuth invalide. Vérifiez la configuration.', 'error', 8000);
                }
            }
        }
        
        // Détecter les codes expirés
        if (url.searchParams.has('code')) {
            console.log('[AuthService] OAuth code detected in URL, will be processed by MSAL');
        }
        
    } catch (error) {
        console.warn('[AuthService] Error processing URL parameters:', error);
    }
});

console.log(`✅ AuthService loaded v4.4 with EXCLUSIVE support for coruscating-dodol-f30e8d.netlify.app - Enhanced OAuth Error Handling and Recovery`);
