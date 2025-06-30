// license-check.js - Vérification des licences avec base de données - CORRIGÉ
// Version complète avec gestion d'expiration et contact admin

let isCheckingLicense = false;
let licenseCheckAttempts = 0;
const MAX_LICENSE_CHECK_ATTEMPTS = 3;

async function checkUserLicense() {
    // Éviter les vérifications multiples simultanées
    if (isCheckingLicense) {
        console.log('[License Check] Already checking license, skipping...');
        return;
    }

    // Attendre que le DOM soit chargé
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
        console.log('[License Check] Waiting for DOM...');
        window.addEventListener('load', checkUserLicense);
        return;
    }

    isCheckingLicense = true;
    licenseCheckAttempts++;

    console.log(`[License Check] 🚀 Starting license verification (attempt ${licenseCheckAttempts})...`);

    try {
        // Vérifier si on est sur une page qui ne nécessite pas de licence
        if (isExemptPage()) {
            console.log('[License Check] ✅ Exempt page detected, skipping license check');
            isCheckingLicense = false;
            return;
        }

        // Charger les dépendances nécessaires
        console.log('[License Check] Loading dependencies...');
        await loadDependencies();

        // Initialiser Supabase avec retry
        console.log('[License Check] Initializing Supabase...');
        const config = await initializeSupabaseWithRetry();
        if (!config) {
            throw new Error('Failed to initialize Supabase configuration');
        }

        // Initialiser le service de licence
        console.log('[License Check] Initializing License Service...');
        const licenseServiceReady = await initializeLicenseService();
        if (!licenseServiceReady) {
            throw new Error('Failed to initialize License Service');
        }

        // MODE PRODUCTION - Authentification requise
        console.log('[License Check] 🔐 PRODUCTION MODE - Authentication required');
        
        // Vérifier si l'utilisateur est déjà authentifié
        let userEmail = getStoredUserEmail();
        
        if (!userEmail) {
            // Demander l'email utilisateur
            userEmail = await promptForEmail();
            if (!userEmail) {
                showLicenseError('Email requis pour accéder à l\'application', 'authentication_required');
                return;
            }
        }

        // Authentifier et vérifier la licence
        console.log('[License Check] Checking license for:', userEmail);
        const licenseResult = await window.licenseService.authenticateWithEmail(userEmail);
        
        if (!licenseResult.valid) {
            console.warn('[License Check] ❌ Invalid license:', licenseResult);
            clearStoredUserEmail();
            
            // Gestion spécifique des erreurs de licence
            await handleLicenseError(licenseResult);
            return;
        }

        // Licence valide - continuer
        await handleValidLicense(userEmail, licenseResult);

    } catch (error) {
        console.error('[License Check] ❌ Critical error:', error);
        await handleCriticalError(error);
    } finally {
        isCheckingLicense = false;
    }
}

// === GESTION DES LICENCES VALIDES ===

async function handleValidLicense(userEmail, licenseResult) {
    // Stocker l'email pour la prochaine fois
    storeUserEmail(userEmail);

    console.log('[License Check] ✅ Valid license for:', userEmail);
    console.log('[License Check] User:', licenseResult.user);
    console.log('[License Check] Status:', licenseResult.status);
    console.log('[License Check] Days remaining:', licenseResult.daysRemaining);
    
    // Exposer l'utilisateur globalement pour compatibilité
    window.currentUser = licenseResult.user;
    window.licenseStatus = licenseResult;
    
    // Afficher des avertissements si nécessaire
    if (licenseResult.status === 'trial' && licenseResult.daysRemaining <= 3) {
        showTrialWarning(licenseResult.daysRemaining);
    }
    
    // Synchroniser les analytics locaux avec la base
    try {
        if (window.analyticsManager && window.licenseService.syncLocalAnalytics) {
            await window.licenseService.syncLocalAnalytics();
        }
    } catch (error) {
        console.warn('[License Check] Analytics sync failed:', error);
    }
    
    // Tracker la connexion dans les analytics locaux
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('license_check_success', {
            email: userEmail,
            role: licenseResult.user?.role,
            company: licenseResult.user?.company?.name,
            license_status: licenseResult.status,
            licenses_count: licenseResult.licenses?.length || 0,
            days_remaining: licenseResult.daysRemaining
        });
    }

    // Initialiser la page si tout est OK
    await initializeApplication();
}

// === GESTION DES ERREURS DE LICENCE ===

async function handleLicenseError(licenseResult) {
    const { status, message, adminContact } = licenseResult;
    
    // Tracker l'erreur
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('license_check_failed', {
            status: status,
            message: message,
            admin_contact: adminContact?.email
        });
    }

    switch (status) {
        case 'expired':
            showExpiredLicenseError(adminContact);
            break;
        case 'blocked':
            showBlockedLicenseError(adminContact);
            break;
        case 'not_found':
            showUserNotFoundError();
            break;
        case 'error':
            showLicenseError(message || 'Erreur de connexion au service de licences', 'service_error');
            break;
        default:
            showLicenseError(message || 'Statut de licence invalide', 'invalid_status');
    }
}

async function handleCriticalError(error) {
    console.error('[License Check] Critical error details:', error);
    
    // Tracker l'erreur critique
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('license_check_critical_error', {
            error: error.message,
            stack: error.stack?.substring(0, 500),
            attempts: licenseCheckAttempts
        });
    }

    // Retry si pas trop d'tentatives
    if (licenseCheckAttempts < MAX_LICENSE_CHECK_ATTEMPTS) {
        console.log(`[License Check] Retrying... (${licenseCheckAttempts}/${MAX_LICENSE_CHECK_ATTEMPTS})`);
        setTimeout(() => {
            isCheckingLicense = false;
            checkUserLicense();
        }, 2000 * licenseCheckAttempts);
        return;
    }

    showLicenseError(`Erreur critique: ${error.message}`, 'critical_error');
}

// === CHARGEMENT DES DÉPENDANCES ===

async function loadDependencies() {
    const dependencies = [
        { 
            name: 'config-supabase.js', 
            check: () => window.supabaseConfig,
            url: './config-supabase.js'
        },
        { 
            name: 'LicenseService.js', 
            check: () => window.licenseService,
            url: './LicenseService.js'
        }
    ];

    for (const dep of dependencies) {
        if (!dep.check()) {
            console.log(`[License Check] Loading ${dep.name}...`);
            await loadScript(dep.url);
            
            // Attendre que le script soit vraiment chargé
            let attempts = 0;
            while (!dep.check() && attempts < 100) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!dep.check()) {
                throw new Error(`Failed to load ${dep.name} after 10 seconds`);
            }
            
            console.log(`[License Check] ✅ ${dep.name} loaded successfully`);
        } else {
            console.log(`[License Check] ✅ ${dep.name} already available`);
        }
    }
}

async function loadScript(url) {
    return new Promise((resolve, reject) => {
        // Vérifier si le script n'est pas déjà chargé
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log(`[License Check] ✅ Script loaded: ${url}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`[License Check] ❌ Failed to load script: ${url}`);
            reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
    });
}

// === INITIALISATION AVEC RETRY ===

async function initializeSupabaseWithRetry() {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            attempts++;
            console.log(`[License Check] Supabase init attempt ${attempts}/${maxAttempts}`);
            
            const config = await window.initializeSupabaseConfig();
            if (config && config.initialized) {
                console.log('[License Check] ✅ Supabase initialized successfully');
                return config;
            }
            
            throw new Error('Supabase config not properly initialized');
            
        } catch (error) {
            console.error(`[License Check] Supabase init attempt ${attempts} failed:`, error);
            
            if (attempts === maxAttempts) {
                throw new Error(`Failed to initialize Supabase after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Attendre avant le prochain essai
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
    }
}

async function initializeLicenseService() {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            attempts++;
            console.log(`[License Check] License service init attempt ${attempts}/${maxAttempts}`);
            
            const result = await window.licenseService.initialize();
            if (result) {
                console.log('[License Check] ✅ License service initialized successfully');
                return true;
            }
            
            throw new Error('License service initialization returned false');
            
        } catch (error) {
            console.error(`[License Check] License service init attempt ${attempts} failed:`, error);
            
            if (attempts === maxAttempts) {
                throw new Error(`Failed to initialize License Service after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Attendre avant le prochain essai
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
    }
    
    return false;
}

// === FONCTIONS UTILITAIRES ===

function isExemptPage() {
    const exemptPages = [
        'analytics.html',
        'auth-callback.html',
        'setup.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    return exemptPages.includes(currentPage);
}

async function promptForEmail() {
    // Ne pas demander d'email sur certaines pages
    if (isExemptPage()) {
        return null;
    }

    // Utiliser l'email par défaut pour les tests
    const defaultEmail = 'vianney.hastings@hotmail.fr';
    
    // En mode développement, utiliser l'email par défaut
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app')) {
        console.log('[License Check] Using default email for development:', defaultEmail);
        return defaultEmail;
    }
    
    const userEmail = prompt('Entrez votre email pour accéder à l\'application:', defaultEmail);
    
    if (!userEmail || !isValidEmail(userEmail)) {
        return null;
    }
    
    return userEmail.toLowerCase().trim();
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getStoredUserEmail() {
    try {
        return localStorage.getItem('emailsortpro_user_email');
    } catch (error) {
        console.warn('[License Check] Cannot read localStorage:', error);
        return null;
    }
}

function storeUserEmail(email) {
    try {
        localStorage.setItem('emailsortpro_user_email', email);
        localStorage.setItem('emailsortpro_last_check', new Date().toISOString());
    } catch (error) {
        console.warn('[License Check] Cannot write to localStorage:', error);
    }
}

function clearStoredUserEmail() {
    try {
        localStorage.removeItem('emailsortpro_user_email');
        localStorage.removeItem('emailsortpro_last_check');
        localStorage.removeItem('emailsortpro_current_user');
    } catch (error) {
        console.warn('[License Check] Cannot clear localStorage:', error);
    }
}

// === INITIALISATION DE L'APPLICATION ===

async function initializeApplication() {
    console.log('[License Check] Initializing application...');
    
    try {
        // Attendre un peu pour que les autres modules se chargent
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (window.initializePage) {
            console.log('[License Check] Calling initializePage...');
            await window.initializePage();
        } else if (window.app && window.app.init) {
            console.log('[License Check] Calling app.init...');
            await window.app.init();
        } else {
            console.warn('[License Check] ⚠️ No initialization function found');
            
            // Essayer de déclencher l'événement DOMContentLoaded si pas encore fait
            if (document.readyState === 'complete') {
                const event = new Event('DOMContentLoaded');
                document.dispatchEvent(event);
            }
        }
        
        console.log('[License Check] ✅ Application initialized successfully');
        
    } catch (error) {
        console.error('[License Check] ❌ Application initialization failed:', error);
    }
}

// === AFFICHAGE DES ERREURS DE LICENCE ===

function showExpiredLicenseError(adminContact) {
    const adminInfo = adminContact ? 
        `<div class="admin-contact">
            <h4>👤 Contactez votre administrateur :</h4>
            <p><strong>${adminContact.name}</strong><br>
            📧 <a href="mailto:${adminContact.email}">${adminContact.email}</a></p>
        </div>` : 
        '<p>Contactez votre administrateur pour renouveler votre licence.</p>';

    showLicenseError(
        `Votre période d'essai de 15 jours a expiré. Vous devez obtenir une licence complète pour continuer à utiliser EmailSortPro.`,
        'expired',
        {
            icon: '⏰',
            title: 'Période d\'essai expirée',
            adminInfo: adminInfo,
            actions: `
                <button onclick="retryLogin()" class="btn-primary">
                    <i class="fas fa-refresh"></i> Vérifier à nouveau
                </button>
                <button onclick="contactAdmin()" class="btn-secondary">
                    <i class="fas fa-envelope"></i> Contacter l'admin
                </button>
            `
        }
    );
}

function showBlockedLicenseError(adminContact) {
    const adminInfo = adminContact ? 
        `<div class="admin-contact">
            <h4>👤 Contactez votre administrateur :</h4>
            <p><strong>${adminContact.name}</strong><br>
            📧 <a href="mailto:${adminContact.email}">${adminContact.email}</a></p>
        </div>` : 
        '<p>Contactez votre administrateur pour débloquer votre accès.</p>';

    showLicenseError(
        'Votre accès à EmailSortPro a été temporairement bloqué par votre administrateur.',
        'blocked',
        {
            icon: '🚫',
            title: 'Accès bloqué',
            adminInfo: adminInfo,
            actions: `
                <button onclick="retryLogin()" class="btn-primary">
                    <i class="fas fa-refresh"></i> Vérifier à nouveau
                </button>
                <button onclick="contactAdmin()" class="btn-secondary">
                    <i class="fas fa-envelope"></i> Contacter l'admin
                </button>
            `
        }
    );
}

function showUserNotFoundError() {
    showLicenseError(
        'Votre compte n\'a pas été trouvé dans notre base de données. Veuillez vérifier votre email ou contacter votre administrateur.',
        'not_found',
        {
            icon: '❓',
            title: 'Compte introuvable',
            actions: `
                <button onclick="retryWithDifferentEmail()" class="btn-primary">
                    <i class="fas fa-user"></i> Essayer un autre email
                </button>
                <button onclick="retryLogin()" class="btn-secondary">
                    <i class="fas fa-refresh"></i> Réessayer
                </button>
            `
        }
    );
}

function showTrialWarning(daysRemaining) {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'trial-warning';
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

    // Retirer automatiquement après 10 secondes
    setTimeout(() => {
        if (warningDiv.parentNode) {
            warningDiv.remove();
        }
    }, 10000);
}

function showLicenseError(message = 'Accès refusé', errorType = 'general', options = {}) {
    console.error('[License Check] 🚫 Showing license error:', message, errorType);

    // Valeurs par défaut
    const {
        icon = '⚠️',
        title = 'Accès refusé',
        adminInfo = '',
        actions = `
            <button onclick="retryLogin()" class="btn-primary">
                <i class="fas fa-refresh"></i> Réessayer
            </button>
            <button onclick="debugConnection()" class="btn-secondary">
                <i class="fas fa-stethoscope"></i> Diagnostiquer
            </button>
        `
    } = options;

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

    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
        background: white;
        padding: 2.5rem;
        border-radius: 16px;
        text-align: center;
        max-width: 550px;
        width: 90%;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(226, 232, 240, 0.8);
        position: relative;
        animation: slideInUp 0.3s ease-out;
    `;

    // Ajouter les styles d'animation
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
                margin: 6px;
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
                margin: 6px;
            }
            .btn-secondary:hover {
                background: #4b5563;
                transform: translateY(-1px);
            }
            .admin-contact {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                text-align: left;
            }
            .admin-contact h4 {
                margin: 0 0 8px 0;
                color: #0c4a6e;
                font-size: 14px;
            }
            .admin-contact p {
                margin: 0;
                color: #0369a1;
            }
            .admin-contact a {
                color: #0284c7;
                text-decoration: none;
            }
            .admin-contact a:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(styles);
    }

    errorBox.innerHTML = `
        <div style="color: #dc2626; font-size: 4rem; margin-bottom: 1.5rem; line-height: 1;">${icon}</div>
        <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.75rem; font-weight: 700;">${title}</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6; font-size: 1.1rem;">${message}</p>
        ${adminInfo}
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #64748b; font-size: 0.9rem; margin: 0; line-height: 1.5;">
                <strong>Type d'erreur :</strong> ${errorType}<br>
                <strong>Heure :</strong> ${new Date().toLocaleString()}<br>
                <strong>Tentatives :</strong> ${licenseCheckAttempts}/${MAX_LICENSE_CHECK_ATTEMPTS}
            </p>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px; flex-wrap: wrap;">
            ${actions}
        </div>
    `;

    overlay.appendChild(errorBox);
    document.body.appendChild(overlay);

    // Désactiver le défilement
    document.body.style.overflow = 'hidden';

    // Exposer les fonctions globalement
    window.retryLogin = function() {
        clearStoredUserEmail();
        overlay.remove();
        document.body.style.overflow = '';
        isCheckingLicense = false;
        licenseCheckAttempts = 0;
        checkUserLicense();
    };

    window.retryWithDifferentEmail = function() {
        clearStoredUserEmail();
        overlay.remove();
        document.body.style.overflow = '';
        isCheckingLicense = false;
        checkUserLicense();
    };

    window.contactAdmin = function() {
        if (window.currentUser?.company?.domain) {
            const domain = window.currentUser.company.domain;
            const subject = encodeURIComponent('Demande d\'accès EmailSortPro');
            const body = encodeURIComponent(`Bonjour,\n\nJe souhaiterais obtenir l'accès à EmailSortPro pour le domaine ${domain}.\n\nMon email: ${getStoredUserEmail() || 'Non spécifié'}\n\nMerci,`);
            window.open(`mailto:admin@${domain}?subject=${subject}&body=${body}`);
        } else {
            alert('Informations de contact administrateur non disponibles.');
        }
    };

    window.debugConnection = async function() {
        console.log('🔍 Diagnostic de connexion...');
        const diagResult = await debugLicenseCheck();
        
        // Créer une fenêtre de debug plus lisible
        const debugWindow = window.open('', '_blank', 'width=800,height=600');
        debugWindow.document.write(`
            <html>
                <head><title>Debug License Check</title></head>
                <body style="font-family: monospace; padding: 20px;">
                    <h2>🔍 Diagnostic EmailSortPro</h2>
                    <pre>${JSON.stringify(diagResult, null, 2)}</pre>
                    <button onclick="window.close()">Fermer</button>
                </body>
            </html>
        `);
    };
}

// === GESTIONNAIRE D'AUTHENTIFICATION ===

const authManager = {
    currentUser: null,
    
    async checkAuth() {
        this.currentUser = window.licenseService?.getCurrentUser() || window.currentUser;
        return !!this.currentUser;
    },
    
    hasAccess() {
        if (!this.currentUser) return false;
        const permCheck = checkUserPermissions(this.currentUser);
        return permCheck.canAccess;
    },
    
    getUserRole() {
        return this.currentUser?.role || 'user';
    },
    
    isAdmin() {
        return this.currentUser?.role === 'company_admin' || this.currentUser?.role === 'super_admin';
    },
    
    isSuperAdmin() {
        return this.currentUser?.role === 'super_admin';
    },
    
    checkLicenseStatus() {
        return this.currentUser?.license_status || 'unknown';
    },
    
    async logout() {
        this.currentUser = null;
        clearStoredUserEmail();
        
        if (window.licenseService?.logout) {
            await window.licenseService.logout();
        }
        
        window.location.href = '/';
    }
};

// === FONCTIONS DE GESTION DES RÔLES ===

function checkUserPermissions(user) {
    if (!user) return { canAccess: false, reason: 'Utilisateur non authentifié' };

    // Vérifier le statut de la licence
    if (user.license_status === 'blocked') {
        return { 
            canAccess: false, 
            reason: 'Votre accès a été bloqué par un administrateur' 
        };
    }

    // Vérifier la date d'expiration
    if (user.license_expires_at) {
        const expirationDate = new Date(user.license_expires_at);
        if (expirationDate < new Date()) {
            return { 
                canAccess: false, 
                reason: 'Votre licence a expiré le ' + expirationDate.toLocaleDateString() 
            };
        }
    }

    return { canAccess: true, user: user };
}

function getUserRoleInfo(user) {
    if (!user) return { role: 'unknown', permissions: [] };

    const permissions = [];
    
    switch (user.role) {
        case 'super_admin':
            permissions.push(
                'Accès à toutes les sociétés',
                'Gestion de tous les utilisateurs',
                'Blocage/déblocage des sociétés',
                'Accès aux analytics globaux',
                'Gestion des licences'
            );
            break;
            
        case 'company_admin':
            permissions.push(
                'Gestion des utilisateurs de sa société',
                'Ajout/suppression d\'utilisateurs',
                'Accès aux analytics de sa société',
                'Configuration des paramètres société',
                'Gestion des licences de sa société'
            );
            break;
            
        case 'user':
        default:
            permissions.push(
                'Utilisation de l\'application',
                'Accès à ses propres données',
                'Export de ses données'
            );
            break;
    }

    return {
        role: user.role || 'user',
        roleName: getRoleName(user.role),
        permissions: permissions,
        company: user.company?.name || 'Aucune société'
    };
}

function getRoleName(role) {
    switch (role) {
        case 'super_admin': return 'Super Administrateur';
        case 'company_admin': return 'Administrateur';
        case 'user': return 'Utilisateur';
        default: return 'Utilisateur';
    }
}

// Exposer authManager globalement
window.authManager = authManager;

// === FONCTIONS DE DÉBOGAGE ===

window.debugLicenseCheck = async function() {
    console.group('🔍 DEBUG LICENSE CHECK v2.0');
    
    const debugInfo = {
        timestamp: new Date().toISOString(),
        attempts: licenseCheckAttempts,
        maxAttempts: MAX_LICENSE_CHECK_ATTEMPTS,
        isChecking: isCheckingLicense,
        currentUser: window.currentUser,
        licenseStatus: window.licenseStatus,
        page: {
            pathname: window.location.pathname,
            hostname: window.location.hostname,
            isExempt: isExemptPage()
        },
        services: {
            licenseService: !!window.licenseService,
            supabaseConfig: !!window.supabaseConfig,
            analyticsManager: !!window.analyticsManager
        },
        storage: {
            storedEmail: getStoredUserEmail(),
            lastCheck: localStorage.getItem('emailsortpro_last_check')
        },
        environment: {
            userAgent: navigator.userAgent.substring(0, 100),
            localStorage: typeof Storage !== 'undefined',
            online: navigator.onLine
        }
    };
    
    // Informations détaillées sur l'utilisateur
    if (window.currentUser) {
        const roleInfo = getUserRoleInfo(window.currentUser);
        const permCheck = checkUserPermissions(window.currentUser);
        debugInfo.userDetails = {
            roleInfo: roleInfo,
            permissionCheck: permCheck,
            expirationDate: window.currentUser.license_expires_at,
            daysUntilExpiry: window.currentUser.license_expires_at ? 
                Math.ceil((new Date(window.currentUser.license_expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null
        };
    }
    
    // Test de connexion Supabase
    if (window.supabaseConfig) {
        try {
            const testResult = await window.supabaseConfig.testConnection();
            debugInfo.supabaseTest = testResult;
        } catch (error) {
            debugInfo.supabaseTest = { error: error.message };
        }
    }
    
    // Test du service de licence
    if (window.licenseService) {
        try {
            const serviceDebug = await window.licenseService.debug();
            debugInfo.licenseServiceTest = serviceDebug;
        } catch (error) {
            debugInfo.licenseServiceTest = { error: error.message };
        }
    }
    
    console.log('Debug Info:', debugInfo);
    console.groupEnd();
    
    return debugInfo;
};

// === ÉVÉNEMENTS ET MONITORING ===

// Écouter les changements de visibilité pour revalider la licence
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && window.currentUser) {
        console.log('[License Check] 🔄 Page visible again, checking license...');
        
        try {
            const licenseResult = await window.licenseService?.checkUserLicense(window.currentUser.email);
            if (licenseResult && !licenseResult.valid) {
                await handleLicenseError(licenseResult);
            }
        } catch (error) {
            console.warn('[License Check] ⚠️ Re-validation error:', error);
        }
    }
});

// Synchroniser périodiquement les analytics
setInterval(async () => {
    try {
        if (window.licenseService?.syncLocalAnalytics && window.currentUser) {
            await window.licenseService.syncLocalAnalytics();
        }
    } catch (error) {
        console.warn('[License Check] Analytics sync error:', error);
    }
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Vérifier périodiquement le statut de la licence (toutes les heures)
setInterval(async () => {
    try {
        if (window.currentUser && window.licenseService) {
            console.log('[License Check] 🔄 Periodic license check...');
            const licenseResult = await window.licenseService.checkUserLicense(window.currentUser.email);
            
            if (licenseResult && !licenseResult.valid) {
                console.warn('[License Check] ❌ License became invalid during session');
                await handleLicenseError(licenseResult);
            }
        }
    } catch (error) {
        console.warn('[License Check] Periodic check error:', error);
    }
}, 60 * 60 * 1000); // Toutes les heures

// === GESTION DES ERREURS GLOBALES ===

window.addEventListener('error', (event) => {
    console.error('[License Check] Global error:', event.error);
    
    // Tracker l'erreur si possible
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('global_error', {
            message: event.error?.message || 'Unknown error',
            filename: event.filename,
            lineno: event.lineno
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[License Check] Unhandled promise rejection:', event.reason);
    
    // Tracker l'erreur si possible
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('unhandled_rejection', {
            reason: event.reason?.message || event.reason || 'Unknown rejection'
        });
    }
});

// === DÉMARRAGE AUTOMATIQUE ===

console.log('[License Check] 🚀 License check script loaded v2.0 (with DB integration)');

// Lancer la vérification au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkUserLicense, 100);
    });
} else {
    // DOM déjà chargé, démarrer après un court délai
    setTimeout(checkUserLicense, 200);
}

// === INSTRUCTIONS D'UTILISATION ===

console.log(`
🎯 LICENSE CHECK EMAILSORTPRO v2.0 - DATABASE INTEGRATION

📋 Available Functions:
   - checkUserLicense() - Check user license
   - debugLicenseCheck() - Complete debug information
   - authManager - Authentication manager

💾 Database:
   - Connection via Supabase
   - Tables: users, companies, licenses, analytics_events
   - Automatic analytics synchronization

🔐 Supported Roles:
   - super_admin: Full access
   - company_admin: Company management
   - user: Normal usage

⏰ License Features:
   - 15-day trial period
   - Automatic expiration check
   - Admin contact retrieval
   - Grace period warnings

💡 For debugging: debugLicenseCheck()
🔧 For manual retry: retryLogin()
`);

console.log('[License Check] ✅ System ready with database integration');
