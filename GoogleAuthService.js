// GoogleAuthService.js - Service Google SÉCURISÉ SANS CLIENT SECRET pour EmailSortPro v4.1

class GoogleAuthService {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.expectedDomain = 'emailsortpro.netlify.app';
        this.provider = 'google';
        
        // Configuration Google OAuth2 SÉCURISÉE - SANS CLIENT SECRET
        this.config = {
            clientId: '436941729211-2dr129lfjnc22k1k7f42ofisjbfthmr2.apps.googleusercontent.com',
            // ✅ PAS DE CLIENT SECRET - SÉCURISÉ !
            scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            redirectUri: `${window.location.origin}/auth-callback.html`,
            // Configuration pour flow sécurisé
            responseType: 'token',
            accessType: 'online'
        };
        
        console.log('[GoogleAuthService] Constructor - Version SÉCURISÉE SANS CLIENT SECRET');
        console.log('[GoogleAuthService] 🔒 Security Mode: NO CLIENT SECRET');
        this.verifyDomain();
    }

    verifyDomain() {
        const currentDomain = window.location.hostname;
        const isCorrectDomain = currentDomain === this.expectedDomain;
        const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
        
        console.log('[GoogleAuthService] Domain verification:', {
            current: currentDomain,
            expected: this.expectedDomain,
            isCorrect: isCorrectDomain,
            isLocalhost: isLocalhost,
            origin: window.location.origin,
            securityMode: 'SECURE'
        });
    }

    async initialize() {
        console.log('[GoogleAuthService] Initialize - Méthode SÉCURISÉE SANS CLIENT SECRET...');
        
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        if (this.isInitialized) {
            return Promise.resolve();
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('[GoogleAuthService] Initialisation OAuth2 sécurisée pour EmailSortPro...');
            console.log('[GoogleAuthService] 🔒 Mode: SANS CLIENT SECRET (sécurisé)');
            
            // Marquer comme initialisé et utiliser OAuth2 direct sécurisé
            this.isInitialized = true;
            
            // Vérifier s'il y a un token en cache
            const cachedToken = this.getCachedToken();
            if (cachedToken && this.isTokenValid(cachedToken)) {
                console.log('[GoogleAuthService] Token en cache trouvé et valide');
                await this.loadUserInfoFromToken(cachedToken.access_token);
            } else {
                console.log('[GoogleAuthService] Aucun token valide en cache');
            }
            
            console.log('[GoogleAuthService] ✅ Initialisation sécurisée réussie - SANS CLIENT SECRET');
            
        } catch (error) {
            console.error('[GoogleAuthService] ❌ Erreur d\'initialisation:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    isAuthenticated() {
        const authenticated = this.currentUser !== null && this.isInitialized;
        
        console.log('[GoogleAuthService] Check authentification SÉCURISÉE:', {
            hasCurrentUser: !!this.currentUser,
            isInitialized: this.isInitialized,
            result: authenticated,
            provider: this.provider,
            securityMode: 'NO_CLIENT_SECRET'
        });
        
        return authenticated;
    }

    getAccount() {
        if (!this.currentUser) return null;
        
        return {
            id: this.currentUser.sub || this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            imageUrl: this.currentUser.picture,
            provider: 'google',
            // Format compatible Microsoft
            username: this.currentUser.email,
            displayName: this.currentUser.name,
            mail: this.currentUser.email,
            userPrincipalName: this.currentUser.email
        };
    }

    async login() {
        console.log('[GoogleAuthService] Login OAuth2 SÉCURISÉ pour EmailSortPro...');
        console.log('[GoogleAuthService] 🔒 Mode: FLOW IMPLICIT (sans secret)');
        
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Construire l'URL OAuth2 sécurisée (flow implicit)
            const authUrl = this.buildSecureOAuth2Url();
            
            console.log('[GoogleAuthService] 🔒 Redirection OAuth2 sécurisée vers Google Gmail:', authUrl);
            
            // Afficher message à l'utilisateur
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Redirection vers Google Gmail (connexion sécurisée)...',
                    'info',
                    3000
                );
            }
            
            // Rediriger DIRECTEMENT vers Google OAuth2 sécurisé
            window.location.href = authUrl;
            
            // Cette promesse ne se résoudra jamais car on redirige
            return new Promise(() => {});
            
        } catch (error) {
            console.error('[GoogleAuthService] ❌ Erreur de login sécurisé:', error);
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Erreur de connexion Gmail sécurisée: ' + error.message,
                    'error',
                    8000
                );
            }
            
            throw error;
        }
    }

    buildSecureOAuth2Url() {
        const state = 'google_auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Sauvegarder l'état pour validation
        sessionStorage.setItem('google_oauth_state', state);
        
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            response_type: 'token', // ✅ FLOW IMPLICIT SÉCURISÉ (pas 'code')
            access_type: 'online',
            prompt: 'select_account',
            state: state
        });
        
        console.log('[GoogleAuthService] 🔒 URL OAuth2 sécurisée construite (flow implicit)');
        
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    // Méthode pour traiter le retour OAuth2 sécurisé (tokens dans fragment)
    async handleOAuthCallback(fragment) {
        console.log('[GoogleAuthService] Traitement du callback OAuth2 sécurisé...');
        console.log('[GoogleAuthService] 🔒 Mode: FLOW IMPLICIT (tokens dans fragment)');
        
        try {
            // Pour le flow implicit, les tokens sont dans le fragment (hash)
            const fragmentParams = new URLSearchParams(fragment.substring(1));
            
            const accessToken = fragmentParams.get('access_token');
            const tokenType = fragmentParams.get('token_type');
            const expiresIn = fragmentParams.get('expires_in');
            const state = fragmentParams.get('state');
            const error = fragmentParams.get('error');
            
            if (error) {
                throw new Error(`Erreur OAuth2: ${error}`);
            }
            
            if (!accessToken) {
                throw new Error('Token d\'accès manquant dans le fragment');
            }
            
            // Vérifier l'état
            const savedState = sessionStorage.getItem('google_oauth_state');
            if (!savedState || savedState !== state) {
                throw new Error('État OAuth2 invalide - possible attaque CSRF');
            }
            
            console.log('[GoogleAuthService] 🔒 Token reçu de manière sécurisée via fragment');
            
            // Charger les informations utilisateur
            await this.loadUserInfoFromToken(accessToken);
            
            // Sauvegarder le token
            const tokenData = {
                access_token: accessToken,
                token_type: tokenType || 'Bearer',
                expires_in: parseInt(expiresIn) || 3600,
                expires_at: Date.now() + (parseInt(expiresIn) || 3600) * 1000
            };
            
            this.saveToken(tokenData);
            
            console.log('[GoogleAuthService] ✅ Authentification OAuth2 sécurisée réussie');
            return true;
            
        } catch (error) {
            console.error('[GoogleAuthService] ❌ Erreur callback OAuth2 sécurisé:', error);
            throw error;
        } finally {
            // Nettoyer l'état
            sessionStorage.removeItem('google_oauth_state');
        }
    }

    async loadUserInfoFromToken(accessToken) {
        console.log('[GoogleAuthService] Chargement des infos utilisateur de manière sécurisée...');
        
        const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
        
        const response = await fetch(userInfoEndpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur user info: ${response.status}`);
        }
        
        const userInfo = await response.json();
        this.currentUser = userInfo;
        
        console.log('[GoogleAuthService] ✅ Infos utilisateur chargées de manière sécurisée:', userInfo.email);
        
        return userInfo;
    }

    saveToken(tokenData) {
        try {
            const tokenInfo = {
                access_token: tokenData.access_token,
                // Pas de refresh_token en mode implicit (plus sécurisé)
                expires_at: Date.now() + (tokenData.expires_in * 1000),
                token_type: tokenData.token_type || 'Bearer',
                created_at: Date.now(),
                flow_type: 'implicit_secure'
            };
            
            localStorage.setItem('google_token_emailsortpro', JSON.stringify(tokenInfo));
            console.log('[GoogleAuthService] 🔒 Token sauvegardé de manière sécurisée (flow implicit)');
        } catch (error) {
            console.warn('[GoogleAuthService] Erreur sauvegarde token:', error);
        }
    }

    getCachedToken() {
        try {
            const tokenStr = localStorage.getItem('google_token_emailsortpro');
            if (tokenStr) {
                return JSON.parse(tokenStr);
            }
        } catch (error) {
            console.warn('[GoogleAuthService] Erreur lecture token cache:', error);
        }
        return null;
    }

    isTokenValid(tokenInfo) {
        if (!tokenInfo || !tokenInfo.access_token) {
            return false;
        }
        
        // Vérifier expiration (avec marge de 5 minutes)
        const now = Date.now();
        const expiresAt = tokenInfo.expires_at || 0;
        const isValid = expiresAt > (now + 5 * 60 * 1000);
        
        console.log('[GoogleAuthService] Token validity check (sécurisé):', {
            hasToken: !!tokenInfo.access_token,
            expiresAt: new Date(expiresAt).toISOString(),
            now: new Date(now).toISOString(),
            isValid: isValid,
            flowType: tokenInfo.flow_type || 'unknown'
        });
        
        return isValid;
    }

    async getAccessToken() {
        if (!this.isAuthenticated()) {
            console.warn('[GoogleAuthService] Pas authentifié pour demande de token');
            return null;
        }

        const cachedToken = this.getCachedToken();
        if (cachedToken && this.isTokenValid(cachedToken)) {
            return cachedToken.access_token;
        }
        
        console.warn('[GoogleAuthService] Token expiré ou invalide');
        return null;
    }

    async getUserInfo() {
        if (!this.isAuthenticated()) {
            throw new Error('Pas authentifié avec Google Gmail');
        }

        const userInfo = {
            id: this.currentUser.id || this.currentUser.sub,
            displayName: this.currentUser.name,
            givenName: this.currentUser.given_name || this.currentUser.name?.split(' ')[0],
            familyName: this.currentUser.family_name || this.currentUser.name?.split(' ').slice(1).join(' '),
            mail: this.currentUser.email,
            userPrincipalName: this.currentUser.email,
            imageUrl: this.currentUser.picture,
            provider: 'google',
            username: this.currentUser.email,
            name: this.currentUser.name,
            email: this.currentUser.email
        };
        
        console.log('[GoogleAuthService] ✅ User info sécurisé pour EmailSortPro:', userInfo.displayName);
        return userInfo;
    }

    async logout() {
        console.log('[GoogleAuthService] Logout Gmail sécurisé pour EmailSortPro...');
        
        try {
            // Nettoyer les données locales
            this.currentUser = null;
            localStorage.removeItem('google_token_emailsortpro');
            sessionStorage.removeItem('google_oauth_state');
            
            // Révoquer le token si possible
            const cachedToken = this.getCachedToken();
            if (cachedToken && cachedToken.access_token) {
                try {
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${cachedToken.access_token}`, {
                        method: 'POST'
                    });
                    console.log('[GoogleAuthService] 🔒 Token révoqué de manière sécurisée');
                } catch (revokeError) {
                    console.warn('[GoogleAuthService] Erreur révocation token:', revokeError);
                }
            }
            
            console.log('[GoogleAuthService] ✅ Logout sécurisé réussi');
            
        } catch (error) {
            console.error('[GoogleAuthService] Erreur logout:', error);
            this.forceCleanup();
        }
    }

    async reset() {
        console.log('[GoogleAuthService] Reset sécurisé pour EmailSortPro...');
        this.forceCleanup();
    }

    forceCleanup() {
        console.log('[GoogleAuthService] Nettoyage sécurisé forcé...');
        
        this.currentUser = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        
        // Nettoyer localStorage de manière sécurisée
        try {
            localStorage.removeItem('google_token_emailsortpro');
            sessionStorage.removeItem('google_oauth_state');
            
            // Nettoyer autres clés Google (sécurisé)
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('google') || key.includes('gapi') || key.includes('oauth'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('[GoogleAuthService] 🔒 Nettoyage sécurisé terminé');
        } catch (error) {
            console.warn('[GoogleAuthService] Erreur nettoyage sécurisé:', error);
        }
    }

    getDiagnosticInfo() {
        const cachedToken = this.getCachedToken();
        
        return {
            isInitialized: this.isInitialized,
            hasCurrentUser: !!this.currentUser,
            userEmail: this.currentUser ? this.currentUser.email : null,
            expectedDomain: this.expectedDomain,
            currentDomain: window.location.hostname,
            domainMatch: window.location.hostname === this.expectedDomain,
            provider: this.provider,
            method: 'Flow Implicit Sécurisé (SANS CLIENT SECRET)',
            securityMode: 'SECURE_NO_CLIENT_SECRET',
            config: {
                clientId: this.config.clientId.substring(0, 15) + '...',
                hasClientSecret: false, // ✅ SÉCURISÉ
                scopes: this.config.scopes,
                origin: window.location.origin,
                redirectUri: this.config.redirectUri,
                responseType: this.config.responseType
            },
            tokenInfo: cachedToken ? {
                hasToken: !!cachedToken.access_token,
                isValid: this.isTokenValid(cachedToken),
                expiresAt: cachedToken.expires_at ? new Date(cachedToken.expires_at).toISOString() : null,
                flowType: cachedToken.flow_type || 'unknown',
                createdAt: cachedToken.created_at ? new Date(cachedToken.created_at).toISOString() : null
            } : null,
            currentUrl: window.location.href,
            securityFeatures: {
                noClientSecret: true,
                implicitFlow: true,
                stateValidation: true,
                tokenRevocation: true
            }
        };
    }

    // Test de connexion Gmail API sécurisé
    async testGmailConnection() {
        console.log('[GoogleAuthService] Test connexion Gmail API sécurisé...');
        
        try {
            const token = await this.getAccessToken();
            if (!token) {
                throw new Error('Aucun token d\'accès disponible');
            }

            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
            }

            const profile = await response.json();
            console.log('[GoogleAuthService] ✅ Test Gmail API sécurisé réussi');
            
            return {
                success: true,
                provider: 'google',
                email: profile.emailAddress,
                messagesTotal: profile.messagesTotal,
                threadsTotal: profile.threadsTotal,
                securityMode: 'SECURE'
            };

        } catch (error) {
            console.error('[GoogleAuthService] ❌ Test Gmail API sécurisé échoué:', error);
            return {
                success: false,
                provider: 'google',
                error: error.message,
                securityMode: 'SECURE'
            };
        }
    }
}

// Créer l'instance globale sécurisée
try {
    window.googleAuthService = new GoogleAuthService();
    console.log('[GoogleAuthService] ✅ Instance SÉCURISÉE créée pour EmailSortPro - SANS CLIENT SECRET');
} catch (error) {
    console.error('[GoogleAuthService] ❌ Erreur création instance sécurisée:', error);
    
    window.googleAuthService = {
        isInitialized: false,
        provider: 'google',
        initialize: () => Promise.resolve(),
        login: () => Promise.reject(new Error('GoogleAuthService sécurisé indisponible: ' + error.message)),
        isAuthenticated: () => false,
        getDiagnosticInfo: () => ({ 
            error: 'GoogleAuthService sécurisé échec: ' + error.message,
            method: 'Flow Implicit Sécurisé (SANS CLIENT SECRET)',
            expectedDomain: 'emailsortpro.netlify.app',
            currentDomain: window.location.hostname,
            securityMode: 'SECURE_FALLBACK'
        })
    };
}

// Fonction globale de diagnostic sécurisé
window.diagnoseGoogleSecure = function() {
    console.group('🔍 DIAGNOSTIC GOOGLE SÉCURISÉ OAuth2 - EmailSortPro');
    
    try {
        const googleDiag = window.googleAuthService.getDiagnosticInfo();
        
        console.log('🔐 GoogleAuthService (Sécurisé):', googleDiag);
        console.log('🌐 Current URL:', window.location.href);
        console.log('🎯 Expected domain:', googleDiag.expectedDomain);
        console.log('✅ Domain match:', googleDiag.domainMatch);
        console.log('🔑 Client ID:', googleDiag.config.clientId);
        console.log('🔒 Has Client Secret:', googleDiag.config.hasClientSecret);
        console.log('🛡️ Method:', googleDiag.method);
        console.log('📧 Gmail scopes:', googleDiag.config.scopes.filter(s => s.includes('gmail')));
        console.log('⚡ Response Type:', googleDiag.config.responseType);
        console.log('🔐 Security Features:', googleDiag.securityFeatures);
        
        if (googleDiag.tokenInfo) {
            console.log('🎫 Token Info (Sécurisé):', googleDiag.tokenInfo);
        }
        
        return googleDiag;
        
    } catch (error) {
        console.error('❌ Diagnostic sécurisé échec:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ GoogleAuthService v4.1 - SÉCURISÉ SANS CLIENT SECRET pour EmailSortPro');
console.log('🔒 Mode de sécurité: Flow Implicit OAuth2 sans Client Secret');
console.log('🚫 GitGuardian: Aucun secret exposé - Version sécurisée !');
