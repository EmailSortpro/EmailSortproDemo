// config.js - Configuration centralisée pour EmailSortPro v4.0
// Configuration unifiée avec initialisation garantie

(function() {
    'use strict';
    
    console.log('[Config] Loading unified configuration v4.0...');
    
    // Configuration globale immédiate
    const EmailSortProConfig = {
        // Informations de base
        app: {
            name: 'EmailSortPro',
            version: '4.0.0',
            domain: 'coruscating-dodol-f30e8d.netlify.app',
            environment: window.location.hostname === 'localhost' ? 'development' : 'production'
        },
        
        // Microsoft Azure AD
        msal: {
            clientId: '8fec3ae1-78e3-4b5d-a425-00b8f20516f7', // REMPLACER par votre Client ID
            authority: 'https://login.microsoftonline.com/common',
            redirectUri: null, // Sera défini dynamiquement
            postLogoutRedirectUri: null, // Sera défini dynamiquement
            cache: {
                cacheLocation: 'localStorage',
                storeAuthStateInCookie: true
            },
            system: {
                windowHashTimeout: 9000,
                iframeHashTimeout: 9000,
                loadFrameTimeout: 9000,
                navigateFrameWait: 500,
                allowNativeBroker: false,
                allowRedirectInIframe: false
            }
        },
        
        // Google OAuth
        google: {
            clientId: 'VOTRE_CLIENT_ID_GOOGLE', // REMPLACER par votre Client ID Google
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
        },
        
        // Supabase (optionnel)
        supabase: {
            url: 'https://xyzcompany.supabase.co', // REMPLACER par votre URL Supabase
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // REMPLACER par votre clé
            enabled: false // Mettre à true si vous utilisez Supabase
        },
        
        // Scopes API
        scopes: {
            login: ['https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/Mail.Read'],
            silent: ['https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/Mail.Read']
        },
        
        // Messages d'erreur
        errors: {
            'popup_window_error': 'Les popups sont bloqués. Veuillez autoriser les popups pour ce site.',
            'user_cancelled': 'Connexion annulée par l\'utilisateur.',
            'network_error': 'Erreur réseau. Vérifiez votre connexion internet.',
            'unauthorized_client': 'Application non autorisée. Vérifiez la configuration Azure.',
            'invalid_client': 'Client ID invalide. Vérifiez votre configuration.',
            'invalid_request': 'Requête invalide. Vérifiez les URLs de redirection.',
            'interaction_in_progress': 'Une connexion est déjà en cours.',
            'access_denied': 'Accès refusé. Vérifiez vos permissions.',
            'configuration_not_found': 'Configuration non trouvée.',
            'supabase_not_configured': 'Supabase n\'est pas configuré.',
            'msal_not_configured': 'Client ID Azure non configuré.'
        }
    };
    
    // Définir les URIs dynamiquement selon l'environnement
    const baseUrl = EmailSortProConfig.app.environment === 'development' 
        ? 'http://localhost:3000' 
        : `https://${EmailSortProConfig.app.domain}`;
    
    EmailSortProConfig.msal.redirectUri = `${baseUrl}/auth-callback.html`;
    EmailSortProConfig.msal.postLogoutRedirectUri = baseUrl;
    EmailSortProConfig.google.redirectUri = `${baseUrl}/google-callback.html`;
    
    // Fonction de validation
    EmailSortProConfig.validate = function() {
        const issues = [];
        
        // Validation MSAL
        if (!this.msal.clientId || this.msal.clientId === 'VOTRE_CLIENT_ID_AZURE') {
            issues.push('Client ID Azure non configuré');
        }
        
        if (!/^[a-f0-9-]{36}$/i.test(this.msal.clientId)) {
            issues.push('Format Client ID Azure invalide');
        }
        
        // Validation Google (optionnel)
        if (this.google.clientId === 'VOTRE_CLIENT_ID_GOOGLE') {
            console.warn('[Config] Client ID Google non configuré');
        }
        
        // Validation Supabase (optionnel)
        if (this.supabase.enabled) {
            if (this.supabase.url === 'https://xyzcompany.supabase.co') {
                issues.push('URL Supabase non configurée');
            }
            if (this.supabase.anonKey.includes('...')) {
                issues.push('Clé Supabase non configurée');
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            warnings: this.google.clientId === 'VOTRE_CLIENT_ID_GOOGLE' ? ['Google non configuré'] : []
        };
    };
    
    // Fonction pour obtenir la configuration selon le contexte
    EmailSortProConfig.getForContext = function(context) {
        switch(context) {
            case 'auth':
                return {
                    msal: this.msal,
                    scopes: this.scopes,
                    errors: this.errors
                };
            case 'google':
                return {
                    google: this.google,
                    errors: this.errors
                };
            case 'supabase':
                if (!this.supabase.enabled) {
                    return null;
                }
                return this.supabase;
            default:
                return this;
        }
    };
    
    // Test de configuration
    EmailSortProConfig.test = function() {
        console.group('🔧 Configuration Test');
        
        const validation = this.validate();
        console.log('Validation:', validation);
        
        console.log('Environment:', this.app.environment);
        console.log('Domain:', this.app.domain);
        console.log('Base URL:', baseUrl);
        
        console.log('MSAL Config:', {
            clientId: this.msal.clientId.substring(0, 8) + '...',
            redirectUri: this.msal.redirectUri,
            configured: validation.issues.filter(i => i.includes('Azure')).length === 0
        });
        
        console.log('Supabase:', {
            enabled: this.supabase.enabled,
            configured: this.supabase.enabled ? validation.issues.filter(i => i.includes('Supabase')).length === 0 : 'N/A'
        });
        
        console.groupEnd();
        
        return validation;
    };
    
    // Exposer globalement de plusieurs façons pour garantir l'accès
    window.AppConfig = EmailSortProConfig;
    window.EmailSortProConfig = EmailSortProConfig;
    window.CONFIG = EmailSortProConfig;
    
    // Pour les modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EmailSortProConfig;
    }
    
    // Marquer comme chargé
    window._configLoaded = true;
    window._configLoadTime = Date.now();
    
    // Validation immédiate
    const validation = EmailSortProConfig.validate();
    if (!validation.valid) {
        console.error('[Config] ❌ Configuration issues:', validation.issues);
        console.log('[Config] 📋 Instructions:');
        console.log('1. Remplacez les valeurs VOTRE_CLIENT_ID_AZURE dans ce fichier');
        console.log('2. Si vous utilisez Supabase, configurez les valeurs et mettez enabled: true');
        console.log('3. Rechargez la page');
    } else {
        console.log('[Config] ✅ Configuration loaded and validated successfully');
    }
    
    // Log détaillé
    console.log('[Config] Configuration ready:', {
        app: EmailSortProConfig.app,
        msalConfigured: !validation.issues.some(i => i.includes('Azure')),
        supabaseEnabled: EmailSortProConfig.supabase.enabled,
        environment: EmailSortProConfig.app.environment,
        loadTime: window._configLoadTime
    });
    
    // Événement pour signaler que la config est prête
    if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('config-loaded', { 
            detail: { 
                config: EmailSortProConfig,
                validation: validation 
            } 
        }));
    }
    
})();

// Fonction globale de diagnostic
window.diagnoseConfig = function() {
    console.group('🔍 DIAGNOSTIC CONFIGURATION');
    
    console.log('Config loaded:', !!window.AppConfig);
    console.log('Load time:', window._configLoadTime ? new Date(window._configLoadTime).toISOString() : 'Not loaded');
    console.log('Time since load:', window._configLoadTime ? `${Date.now() - window._configLoadTime}ms` : 'N/A');
    
    if (window.AppConfig) {
        const test = window.AppConfig.test();
        console.log('Test result:', test);
        
        if (!test.valid) {
            console.log('🚨 ACTIONS REQUISES:');
            test.issues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }
    } else {
        console.error('❌ Configuration non chargée!');
    }
    
    console.log('Global objects:', {
        AppConfig: !!window.AppConfig,
        EmailSortProConfig: !!window.EmailSortProConfig,
        CONFIG: !!window.CONFIG,
        _configLoaded: window._configLoaded
    });
    
    console.groupEnd();
};

console.log('✅ Config.js v4.0 loaded - Use diagnoseConfig() for diagnostic');
