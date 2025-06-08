// config.js - Configuration centralisée NETLIFY COMPATIBLE v3.0 - CORRIGÉE

// FONCTION DE DÉTECTION DE L'ENVIRONNEMENT AMÉLIORÉE
function detectEnvironment() {
    const hostname = window.location.hostname;
    const isNetlify = hostname.includes('netlify.app') || 
                     hostname.includes('netlifyapp.com') || 
                     hostname.includes('.netlify.com');
    const isGitHubPages = hostname.includes('github.io');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    console.log('[CONFIG] Environment detection:', {
        hostname,
        isNetlify,
        isGitHubPages,
        isLocalhost,
        origin: window.location.origin
    });
    
    return {
        type: isNetlify ? 'netlify' : isGitHubPages ? 'github' : isLocalhost ? 'localhost' : 'other',
        isNetlify,
        isGitHubPages,
        isLocalhost,
        hostname
    };
}

// FONCTION DE RÉCUPÉRATION DU CLIENT ID CORRIGÉE POUR NETLIFY
function getClientId(environment) {
    console.log('[CONFIG] Getting Client ID for environment:', environment.type);
    
    // 1. SOLUTION NETLIFY: Client ID configuré directement
    if (environment.isNetlify) {
        // Vérifier si le Client ID est configuré directement dans l'application
        if (window.NETLIFY_CLIENT_ID && window.NETLIFY_CLIENT_ID !== 'CONFIGURATION_REQUIRED') {
            console.log('[CONFIG] ✅ Using configured Netlify client ID');
            return window.NETLIFY_CLIENT_ID;
        }
        
        console.log('[CONFIG] 🚀 Netlify: Using default client ID for JavaScript vanilla app');
        return '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'; // Votre Client ID vérifié
    }
    
    // 2. Vérifier le localStorage (configuration sauvegardée)
    try {
        const savedClientId = localStorage.getItem('emailsortpro_client_id');
        if (savedClientId && savedClientId !== 'VOTRE_CLIENT_ID_ICI' && savedClientId !== 'CONFIGURATION_REQUIRED') {
            console.log('[CONFIG] ✅ Using saved client ID from localStorage');
            return savedClientId;
        }
    } catch (e) {
        console.warn('[CONFIG] Cannot access localStorage:', e);
    }
    
    // 3. Fallback par défaut selon l'environnement
    if (environment.isLocalhost) {
        console.log('[CONFIG] Using localhost development client ID');
        return '8fec3ae1-78e3-4b5d-a425-00b8f20516f7'; // Votre client ID de développement
    }
    
    // 4. Pour GitHub Pages ou autres
    if (environment.isGitHubPages) {
        console.log('[CONFIG] GitHub Pages - checking for saved configuration');
        return 'CONFIGURATION_REQUIRED';
    }
    
    console.warn('[CONFIG] ❌ No client ID found for environment:', environment.type);
    return 'CONFIGURATION_REQUIRED';
}

// CRÉATION IMMÉDIATE de la configuration
(function createConfiguration() {
    console.log('[CONFIG] 🚀 Creating configuration...');
    
    const environment = detectEnvironment();
    const clientId = getClientId(environment);
    
    console.log('[CONFIG] Configuration summary:', {
        environment: environment.type,
        hostname: environment.hostname,
        clientId: clientId === 'CONFIGURATION_REQUIRED' ? 'NEEDS_SETUP' : 'CONFIGURED',
        clientIdLength: clientId.length
    });
    
    // Construire l'URL de redirection selon l'environnement
    let redirectUri;
    if (environment.isNetlify) {
        redirectUri = `${window.location.origin}/auth-callback.html`;
    } else if (environment.isGitHubPages) {
        redirectUri = `${window.location.origin}/emailsortpro/auth-callback.html`;
    } else {
        redirectUri = `${window.location.origin}/auth-callback.html`;
    }
    
    console.log('[CONFIG] Redirect URI configured:', redirectUri);
    
    window.AppConfig = {
        // Configuration MSAL adaptée à l'environnement
        msal: {
            clientId: clientId,
            authority: 'https://login.microsoftonline.com/common',
            redirectUri: redirectUri,
            postLogoutRedirectUri: window.location.origin,
            
            // Configuration cache renforcée pour Netlify
            cache: {
                cacheLocation: 'localStorage',
                storeAuthStateInCookie: environment.isNetlify || environment.isGitHubPages // Cookies pour hébergement statique
            },
            
            // Configuration système avec debug adapté
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (environment.isLocalhost || window.debugMode) {
                            console.log(`[MSAL ${level}] ${message}`);
                        }
                    },
                    piiLoggingEnabled: false,
                    logLevel: environment.isLocalhost ? 'Verbose' : 'Warning'
                },
                allowNativeBroker: false
            }
        },
        
        // Scopes Microsoft Graph
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
        
        // Configuration de l'application
        app: {
            name: 'EmailSortPro',
            version: '3.0.0',
            debug: environment.isLocalhost,
            environment: environment.type,
            maxRetries: 3,
            retryDelay: 2000
        },
        
        // Configuration des emails
        email: {
            defaultFolder: 'inbox',
            defaultDays: 30,
            pageSize: 100,
            maxEmails: 10000
        },
        
        // Messages d'erreur personnalisés
        errors: {
            'unauthorized_client': 'Configuration Azure incorrecte. Vérifiez votre Client ID.',
            'invalid_client': 'Application non autorisée. Contactez l\'administrateur.',
            'consent_required': 'Autorisation requise. Veuillez accepter les permissions.',
            'interaction_required': 'Reconnexion requise.',
            'login_required': 'Connexion requise.',
            'network_error': 'Erreur réseau. Vérifiez votre connexion.',
            'token_expired': 'Session expirée. Reconnexion nécessaire.',
            'AADSTS900144': 'Erreur de configuration client_id. Actualisation requise.',
            'AADSTS50011': 'URL de redirection non configurée dans Azure.'
        },
        
        // Informations d'environnement
        environment: environment,
        
        // Méthode pour vérifier la configuration RENFORCÉE
        validate() {
            const issues = [];
            
            // Vérification du client ID avec tolérance pour Netlify
            if (!this.msal.clientId) {
                issues.push('Client ID manquant');
            } else if (this.msal.clientId === 'VOTRE_CLIENT_ID_ICI' || this.msal.clientId === 'CONFIGURATION_REQUIRED') {
                if (environment.isGitHubPages) {
                    issues.push('Client ID non configuré - utilisez setup.html');
                } else {
                    // Pour Netlify et autres, ne pas traiter comme une erreur bloquante
                    console.log('[CONFIG] Client ID par défaut utilisé pour', environment.type);
                }
            } else if (this.msal.clientId.length < 30) {
                issues.push('Client ID invalide (trop court)');
            } else if (!/^[a-f0-9-]{36}$/i.test(this.msal.clientId)) {
                issues.push('Format Client ID invalide (doit être un GUID)');
            }
            
            // Vérification de l'autorité
            if (!this.msal.authority || !this.msal.authority.includes('microsoftonline.com')) {
                issues.push('Authority URL invalide');
            }
            
            // Vérification du redirect URI
            if (!this.msal.redirectUri || !this.msal.redirectUri.includes(window.location.hostname)) {
                issues.push('Redirect URI ne correspond pas au domaine actuel');
            }
            
            return {
                valid: issues.length === 0,
                issues: issues,
                clientId: this.msal.clientId,
                authority: this.msal.authority,
                redirectUri: this.msal.redirectUri,
                environment: environment.type
            };
        },
        
        // Méthode pour obtenir les informations de debug RENFORCÉE
        getDebugInfo() {
            const validation = this.validate();
            return {
                hostname: window.location.hostname,
                origin: window.location.origin,
                environment: environment,
                userAgent: navigator.userAgent,
                msalVersion: window.msal ? window.msal.version || 'Loaded' : 'Not loaded',
                configValid: validation.valid,
                configIssues: validation.issues,
                clientIdLength: this.msal.clientId ? this.msal.clientId.length : 0,
                clientIdFormat: this.msal.clientId ? (this.msal.clientId.includes('-') ? 'GUID' : 'Invalid') : 'Missing',
                redirectUri: this.msal.redirectUri,
                timestamp: new Date().toISOString(),
                localStorage: {
                    available: typeof Storage !== 'undefined',
                    keys: typeof Storage !== 'undefined' ? Object.keys(localStorage).length : 0
                },
                netlifyConfig: environment.isNetlify ? {
                    processEnvExists: typeof process !== 'undefined' && !!process.env,
                    processEnvViteVar: typeof process !== 'undefined' && process.env ? process.env.VITE_AZURE_CLIENT_ID : null,
                    globalViteVar: typeof VITE_AZURE_CLIENT_ID !== 'undefined' ? VITE_AZURE_CLIENT_ID : null,
                    windowEnv: window.env || null
                } : 'N/A'
            };
        },
        
        // Méthode pour forcer la validation et correction NETLIFY-AWARE
        forceValidate() {
            console.log('[CONFIG] Force validation started for environment:', environment.type);
            
            const validation = this.validate();
            console.log('[CONFIG] Validation result:', validation);
            
            if (!validation.valid) {
                console.error('[CONFIG] CRITICAL: Configuration is invalid!', validation.issues);
                
                // Messages spécifiques selon l'environnement
                let errorMsg = `CONFIGURATION CRITIQUE (${environment.type}):\n${validation.issues.join('\n')}`;
                
                if (environment.isNetlify) {
                    errorMsg += `\n\nPour Netlify (JavaScript vanilla):\n`;
                    errorMsg += `1. L'application utilise un Client ID par défaut fonctionnel\n`;
                    errorMsg += `2. Pour personnaliser: utilisez setup.html\n`;
                    errorMsg += `3. Ou configurez localStorage: emailsortpro_client_id\n`;
                    errorMsg += `4. Client ID détecté: ${this.msal.clientId}`;
                }
                
                console.error(errorMsg);
                
                return {
                    valid: false,
                    issues: validation.issues,
                    environment: environment.type,
                    debug: this.getDebugInfo()
                };
            }
            
            console.log('[CONFIG] ✅ Configuration is valid for', environment.type);
            return { 
                valid: true, 
                environment: environment.type,
                debug: this.getDebugInfo() 
            };
        },
        
        // Méthode pour sauvegarder le client ID (pour les environnements qui le permettent)
        saveClientId(clientId) {
            if (!clientId || clientId === 'VOTRE_CLIENT_ID_ICI') {
                console.warn('[CONFIG] Invalid client ID provided for saving');
                return false;
            }
            
            try {
                localStorage.setItem('emailsortpro_client_id', clientId);
                
                // Mettre à jour la configuration actuelle
                this.msal.clientId = clientId;
                
                console.log('[CONFIG] ✅ Client ID saved and updated');
                return true;
            } catch (e) {
                console.error('[CONFIG] Cannot save client ID:', e);
                return false;
            }
        }
    };
    
    console.log('[CONFIG] ✅ Configuration created for:', environment.type);
    console.log('[CONFIG] Client ID source:', clientId === 'CONFIGURATION_REQUIRED' ? 'NEEDS_SETUP' : 'CONFIGURED');
    console.log('[CONFIG] Redirect URI:', redirectUri);
})();

// VALIDATION IMMÉDIATE au chargement du script
(function() {
    console.log('[CONFIG] Immediate validation on script load...');
    
    if (!window.AppConfig) {
        console.error('[CONFIG] CRITICAL: AppConfig not created!');
        return;
    }
    
    const validation = window.AppConfig.forceValidate();
    
    if (!validation.valid) {
        console.error('[CONFIG] IMMEDIATE VALIDATION FAILED:', validation);
        
        // Notification d'erreur adaptée à l'environnement
        const environment = window.AppConfig.environment;
        let errorMessage = 'Configuration invalide';
        let solutions = [];
        
        if (environment.isNetlify) {
            errorMessage = '⚠️ NETLIFY: Variable d\'environnement manquante';
            solutions = [
                '1. Aller dans Site settings > Environment variables sur Netlify',
                '2. Ajouter VITE_AZURE_CLIENT_ID avec votre Client ID Azure',
                '3. IMPORTANT: Redéployer le site après ajout de la variable',
                '4. La variable doit être préfixée par VITE_ pour être accessible'
            ];
        } else if (environment.isGitHubPages) {
            errorMessage = '⚠️ GITHUB PAGES: Configuration requise';
            solutions = [
                '1. Accéder à la page setup.html',
                '2. Configurer votre Client ID Azure',
                '3. La configuration sera sauvegardée localement'
            ];
        } else if (environment.isLocalhost) {
            errorMessage = '⚠️ LOCALHOST: Configuration de développement';
            solutions = [
                '1. Vérifier le Client ID dans config.js',
                '2. S\'assurer que l\'app Azure est configurée',
                '3. Tester la connexion'
            ];
        }
        
        // Créer une notification d'erreur immédiate avec solutions détaillées
        const errorDiv = document.createElement('div');
        errorDiv.id = 'config-error-immediate';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #dc2626;
            color: white;
            padding: 20px;
            z-index: 99999;
            text-align: center;
            font-family: monospace;
            font-size: 14px;
            border-bottom: 3px solid #b91c1c;
        `;
        errorDiv.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto;">
                <strong>${errorMessage}</strong><br><br>
                <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <strong>Environnement détecté:</strong> ${environment.type.toUpperCase()}<br>
                    <strong>Hostname:</strong> ${environment.hostname}<br>
                    <strong>Client ID actuel:</strong> <code>${window.AppConfig.msal.clientId || 'MANQUANT'}</code><br>
                    ${environment.isNetlify ? `<strong>Variable d'environnement VITE_AZURE_CLIENT_ID:</strong> ${typeof VITE_AZURE_CLIENT_ID !== 'undefined' ? VITE_AZURE_CLIENT_ID : 'NON DÉFINIE'}<br>` : ''}
                </div>
                ${solutions.length > 0 ? `
                <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <strong>Solutions pour ${environment.type}:</strong><br>
                    ${solutions.map(s => `${s}`).join('<br>')}
                </div>
                ` : ''}
                <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <strong>Problèmes détectés:</strong><br>
                    ${validation.issues.map(issue => `❌ ${issue}`).join('<br>')}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: white; color: #dc2626; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    Masquer
                </button>
                <button onclick="window.location.reload()" 
                        style="background: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    Actualiser
                </button>
                <button onclick="console.log('DEBUG:', window.AppConfig.getDebugInfo())" 
                        style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    Debug Console
                </button>
                ${environment.isGitHubPages ? `
                <button onclick="window.location.href='setup.html'" 
                        style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    Configurer
                </button>
                ` : ''}
            </div>
        `;
        
        // Ajouter dès que possible
        if (document.body) {
            document.body.appendChild(errorDiv);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(errorDiv);
            });
        }
    } else {
        console.log('[CONFIG] ✅ Immediate validation passed for', validation.environment);
        
        // Supprimer d'éventuelles erreurs précédentes
        const existingError = document.getElementById('config-error-immediate');
        if (existingError) {
            existingError.remove();
        }
    }
})();

// Validation supplémentaire au DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[CONFIG] DOMContentLoaded validation...');
    
    const validation = window.AppConfig.forceValidate();
    
    if (validation.valid) {
        console.log('[CONFIG] ✅ Final validation successful - Configuration ready for MSAL');
        console.log('[CONFIG] Environment:', validation.environment);
        
        // Supprimer d'éventuelles erreurs précédentes
        const existingError = document.getElementById('config-error-immediate');
        if (existingError) {
            existingError.remove();
        }
    } else {
        console.error('[CONFIG] ❌ Final validation failed for', validation.environment);
        
        // Si on est sur Netlify et que la config échoue, afficher un guide de debug
        if (validation.environment === 'netlify') {
            setTimeout(() => {
                console.group('🔧 GUIDE DE DEBUG NETLIFY');
                console.log('1. Vérifiez vos variables d\'environnement sur Netlify');
                console.log('2. La variable doit s\'appeler exactement: VITE_AZURE_CLIENT_ID');
                console.log('3. Après avoir ajouté/modifié la variable, redéployez le site');
                console.log('4. Debug info:', window.AppConfig.getDebugInfo());
                console.groupEnd();
            }, 3000);
        }
    }
});

// Fonction de diagnostic globale améliorée pour tous les environnements
window.diagnoseMSALConfig = function() {
    console.group('🔍 DIAGNOSTIC CONFIGURATION MSAL - TOUS ENVIRONNEMENTS');
    
    const debug = window.AppConfig.getDebugInfo();
    const validation = window.AppConfig.validate();
    
    console.log('🌐 Environnement:', debug.environment);
    console.log('📋 Configuration actuelle:', {
        clientId: window.AppConfig.msal.clientId,
        authority: window.AppConfig.msal.authority,
        redirectUri: window.AppConfig.msal.redirectUri
    });
    
    console.log('✅ Validation:', validation);
    console.log('🐛 Debug info complet:', debug);
    
    if (window.authService) {
        console.log('🔐 AuthService:', window.authService.getDiagnosticInfo?.() || 'Pas de diagnostic disponible');
    }
    
    // Suggestions spécifiques selon l'environnement
    if (debug.environment.isNetlify) {
        console.log('💡 Suggestions Netlify:');
        console.log('  - Variable VITE_AZURE_CLIENT_ID status:', debug.netlifyConfig);
        console.log('  - Redéployer après modification des variables d\'environnement');
        console.log('  - Vérifier que la variable est bien préfixée par VITE_');
    } else if (debug.environment.isGitHubPages) {
        console.log('💡 Suggestions GitHub Pages:');
        console.log('  - Utiliser setup.html pour configurer');
        console.log('  - Configuration sauvegardée dans localStorage');
    }
    
    console.groupEnd();
    
    return { debug, validation, environment: debug.environment };
};

// Messages de confirmation
console.log('✅ Configuration Netlify/Multi-environnement chargée avec succès v3.0');
console.log(`📱 Client ID configuré: ${window.AppConfig.msal.clientId}`);
console.log(`🌐 Environnement: ${window.AppConfig.environment.type}`);
console.log('🔍 Utilisez diagnoseMSALConfig() pour diagnostiquer');

// Test immédiat de disponibilité
if (window.AppConfig && window.AppConfig.msal && window.AppConfig.msal.clientId && window.AppConfig.msal.clientId !== 'CONFIGURATION_REQUIRED') {
    console.log('🎯 Configuration prête pour AuthService');
} else {
    console.warn('💥 ATTENTION: Configuration nécessite une intervention');
    if (window.AppConfig.environment.isNetlify) {
        console.warn('📝 NETLIFY: Configurez VITE_AZURE_CLIENT_ID dans les variables d\'environnement et redéployez');
    }
}
