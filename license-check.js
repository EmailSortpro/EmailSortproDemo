// license-check.js - Vérification des licences CORRIGÉ v3.0
// Version simplifiée et fiable pour production

(function() {
    'use strict';
    
    console.log('[License Check] Loading v3.0 - Simplified production version...');
    
    let licenseCheckInProgress = false;
    let licenseCheckCompleted = false;
    
    // === FONCTION PRINCIPALE ===
    async function checkUserLicense() {
        // Éviter les vérifications multiples
        if (licenseCheckInProgress || licenseCheckCompleted) {
            console.log('[License Check] Check already in progress or completed');
            return;
        }
        
        licenseCheckInProgress = true;
        console.log('[License Check] Starting license verification...');
        
        try {
            // Étape 1 : Attendre que les dépendances soient chargées
            await waitForDependencies();
            
            // Étape 2 : Obtenir l'email de l'utilisateur
            const userEmail = await getUserEmail();
            if (!userEmail) {
                throw new Error('No user email available');
            }
            
            // Étape 3 : Vérifier la licence
            const licenseResult = await verifyLicense(userEmail);
            
            // Étape 4 : Traiter le résultat
            await handleLicenseResult(licenseResult);
            
            licenseCheckCompleted = true;
            console.log('[License Check] ✅ License check completed successfully');
            
        } catch (error) {
            console.error('[License Check] Error:', error);
            handleLicenseError({
                status: 'error',
                message: error.message
            });
        } finally {
            licenseCheckInProgress = false;
        }
    }
    
    // === ATTENTE DES DÉPENDANCES ===
    
    async function waitForDependencies() {
        console.log('[License Check] Waiting for dependencies...');
        
        // Attendre Supabase
        let attempts = 0;
        while (!window.supabase && attempts < 50) {
            await sleep(100);
            attempts++;
        }
        
        if (!window.supabase) {
            console.warn('[License Check] Supabase not loaded after 5 seconds');
        }
        
        // Attendre le service de licence
        attempts = 0;
        while (!window.licenseService && attempts < 50) {
            await sleep(100);
            attempts++;
        }
        
        if (!window.licenseService) {
            throw new Error('License service not available');
        }
        
        // Attendre l'initialisation du service
        if (!window.licenseService.initialized) {
            console.log('[License Check] Waiting for license service initialization...');
            attempts = 0;
            while (!window.licenseService.initialized && attempts < 30) {
                await sleep(100);
                attempts++;
            }
        }
        
        console.log('[License Check] ✅ Dependencies ready');
    }
    
    // === OBTENTION DE L'EMAIL ===
    
    async function getUserEmail() {
        console.log('[License Check] Getting user email...');
        
        // 1. Vérifier dans le localStorage
        const storedEmail = localStorage.getItem('emailsortpro_user_email');
        if (storedEmail && storedEmail !== 'null') {
            console.log('[License Check] Using stored email:', storedEmail);
            return storedEmail;
        }
        
        // 2. Vérifier les services d'authentification
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account && account.username) {
                console.log('[License Check] Using Microsoft email:', account.username);
                storeUserEmail(account.username);
                return account.username;
            }
        }
        
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account && account.email) {
                console.log('[License Check] Using Google email:', account.email);
                storeUserEmail(account.email);
                return account.email;
            }
        }
        
        // 3. Utiliser l'email par défaut en développement
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app')) {
            const defaultEmail = 'vianney.hastings@hotmail.fr';
            console.log('[License Check] Using default email for development:', defaultEmail);
            return defaultEmail;
        }
        
        // 4. Demander l'email à l'utilisateur
        const userEmail = prompt('Entrez votre email pour accéder à l\'application:');
        if (userEmail && isValidEmail(userEmail)) {
            storeUserEmail(userEmail);
            return userEmail;
        }
        
        return null;
    }
    
    // === VÉRIFICATION DE LA LICENCE ===
    
    async function verifyLicense(email) {
        console.log('[License Check] Verifying license for:', email);
        
        try {
            if (!window.licenseService || !window.licenseService.authenticateWithEmail) {
                throw new Error('License service not properly initialized');
            }
            
            const result = await window.licenseService.authenticateWithEmail(email);
            
            console.log('[License Check] License result:', {
                valid: result.valid,
                status: result.status,
                daysRemaining: result.daysRemaining,
                offline: result.offline
            });
            
            return result;
            
        } catch (error) {
            console.error('[License Check] Verification error:', error);
            throw error;
        }
    }
    
    // === TRAITEMENT DU RÉSULTAT ===
    
    async function handleLicenseResult(result) {
        if (!result) {
            throw new Error('No license result');
        }
        
        if (result.valid) {
            // Licence valide
            console.log('[License Check] ✅ Valid license');
            
            // Stocker les informations
            window.currentUser = result.user;
            window.licenseStatus = {
                status: result.status,
                valid: result.valid,
                daysRemaining: result.daysRemaining,
                message: result.message
            };
            
            // Émettre l'événement de succès
            window.dispatchEvent(new CustomEvent('userAuthenticated', {
                detail: {
                    user: result.user,
                    status: result
                }
            }));
            
            // Afficher un avertissement si nécessaire
            if (result.status === 'trial' && result.daysRemaining <= 3) {
                showTrialWarning(result.daysRemaining);
            }
            
            // Tracker l'événement
            if (window.analyticsManager) {
                window.analyticsManager.trackEvent('license_check_success', {
                    email: result.user.email,
                    status: result.status,
                    daysRemaining: result.daysRemaining
                });
            }
            
        } else {
            // Licence invalide
            console.warn('[License Check] ❌ Invalid license');
            handleLicenseError(result);
        }
    }
    
    // === GESTION DES ERREURS ===
    
    function handleLicenseError(result) {
        console.error('[License Check] License error:', result);
        
        // Émettre l'événement d'erreur
        window.dispatchEvent(new CustomEvent('licenseCheckFailed', {
            detail: result
        }));
        
        // Tracker l'erreur
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('license_check_failed', {
                status: result.status,
                message: result.message
            });
        }
        
        // Afficher l'erreur
        showLicenseError(result);
    }
    
    function showLicenseError(result) {
        const { status, message, adminContact } = result;
        
        // Supprimer les overlays existants
        document.querySelectorAll('.license-error-overlay').forEach(el => el.remove());
        
        // Créer l'overlay d'erreur
        const overlay = document.createElement('div');
        overlay.className = 'license-error-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
        `;
        
        let icon = '⚠️';
        let title = 'Accès refusé';
        let actions = '';
        
        switch (status) {
            case 'expired':
                icon = '⏰';
                title = 'Période d\'essai expirée';
                actions = `
                    <button onclick="window.retryLogin()" class="btn-primary">
                        <i class="fas fa-refresh"></i> Réessayer
                    </button>
                    ${adminContact ? `
                        <button onclick="window.contactAdmin()" class="btn-secondary">
                            <i class="fas fa-envelope"></i> Contacter l'admin
                        </button>
                    ` : ''}
                `;
                break;
                
            case 'blocked':
                icon = '🚫';
                title = 'Accès bloqué';
                actions = `
                    ${adminContact ? `
                        <button onclick="window.contactAdmin()" class="btn-secondary">
                            <i class="fas fa-envelope"></i> Contacter l'admin
                        </button>
                    ` : ''}
                `;
                break;
                
            default:
                actions = `
                    <button onclick="window.retryLogin()" class="btn-primary">
                        <i class="fas fa-refresh"></i> Réessayer
                    </button>
                `;
        }
        
        const errorBox = document.createElement('div');
        errorBox.style.cssText = `
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            text-align: center;
            max-width: 550px;
            width: 90%;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            animation: slideInUp 0.3s ease-out;
        `;
        
        errorBox.innerHTML = `
            <div style="color: #dc2626; font-size: 4rem; margin-bottom: 1.5rem;">${icon}</div>
            <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.75rem;">${title}</h2>
            <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">${message || 'Une erreur est survenue'}</p>
            ${adminContact ? `
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left;">
                    <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px;">👤 Contactez votre administrateur :</h4>
                    <p style="margin: 0; color: #0369a1;">
                        <strong>${adminContact.name}</strong><br>
                        📧 <a href="mailto:${adminContact.email}" style="color: #0284c7;">${adminContact.email}</a>
                    </p>
                </div>
            ` : ''}
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
                ${actions}
            </div>
        `;
        
        overlay.appendChild(errorBox);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Ajouter les styles si nécessaire
        if (!document.getElementById('license-error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'license-error-styles';
            styles.textContent = `
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }
                .btn-secondary {
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    background: #4b5563;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    function showTrialWarning(daysRemaining) {
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 12px;
            text-align: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        warningDiv.innerHTML = `
            ⏳ Attention : Votre période d'essai expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} !
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                margin-left: 10px;
                cursor: pointer;
            ">✕</button>
        `;
        
        document.body.insertBefore(warningDiv, document.body.firstChild);
        
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.remove();
            }
        }, 10000);
    }
    
    // === FONCTIONS UTILITAIRES ===
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function storeUserEmail(email) {
        try {
            localStorage.setItem('emailsortpro_user_email', email);
            localStorage.setItem('emailsortpro_last_check', new Date().toISOString());
        } catch (error) {
            console.warn('[License Check] Cannot store email:', error);
        }
    }
    
    function isExemptPage() {
        const exemptPages = ['analytics.html', 'auth-callback.html', 'setup.html'];
        const currentPage = window.location.pathname.split('/').pop();
        return exemptPages.includes(currentPage);
    }
    
    // === FONCTIONS GLOBALES ===
    
    window.retryLogin = function() {
        console.log('[License Check] Retry login requested');
        
        // Effacer les données stockées
        try {
            localStorage.removeItem('emailsortpro_user_email');
            localStorage.removeItem('emailsortpro_current_user');
            localStorage.removeItem('emailsortpro_last_check');
        } catch (error) {
            console.warn('[License Check] Error clearing storage:', error);
        }
        
        // Reset les variables
        licenseCheckInProgress = false;
        licenseCheckCompleted = false;
        
        // Recharger la page
        window.location.reload();
    };
    
    window.contactAdmin = function() {
        const adminContact = window.licenseStatus?.adminContact;
        if (adminContact && adminContact.email) {
            const subject = encodeURIComponent('Demande d\'accès EmailSortPro');
            const body = encodeURIComponent(`Bonjour,\n\nJe souhaiterais obtenir l'accès à EmailSortPro.\n\nMon email: ${window.currentUser?.email || ''}\n\nMerci,`);
            window.open(`mailto:${adminContact.email}?subject=${subject}&body=${body}`);
        } else {
            alert('Informations de contact administrateur non disponibles.');
        }
    };
    
    window.debugLicenseCheck = async function() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            licenseCheckInProgress,
            licenseCheckCompleted,
            currentUser: window.currentUser,
            licenseStatus: window.licenseStatus,
            services: {
                supabase: !!window.supabase,
                licenseService: !!window.licenseService,
                licenseServiceInitialized: window.licenseService?.initialized,
                authService: !!window.authService,
                googleAuthService: !!window.googleAuthService
            },
            storedEmail: localStorage.getItem('emailsortpro_user_email'),
            page: window.location.pathname,
            isExempt: isExemptPage()
        };
        
        // Test du service de licence
        if (window.licenseService && window.licenseService.debug) {
            debugInfo.licenseServiceDebug = await window.licenseService.debug();
        }
        
        console.log('[License Check] Debug info:', debugInfo);
        return debugInfo;
    };
    
    // === INITIALISATION ===
    
    // Vérifier si c'est une page exemptée
    if (isExemptPage()) {
        console.log('[License Check] Exempt page, skipping license check');
        return;
    }
    
    // Exposer la fonction principale
    window.checkUserLicense = checkUserLicense;
    
    // NE PAS lancer automatiquement la vérification - laisser app.js la gérer
    console.log('[License Check] ✅ System ready v3.0 - Manual trigger only');
    
})();
