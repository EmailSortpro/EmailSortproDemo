// license-check.js - Vérification des licences avec base de données
// Version intégrée avec Supabase pour EmailSortPro

async function checkUserLicense() {
    // Configuration
    const AUTH_REQUIRED = true;
    
    // Attendre que le DOM soit chargé
    if (document.readyState !== 'complete') {
        window.addEventListener('load', checkUserLicense);
        return;
    }

    console.log('[License Check] 🚀 Démarrage de la vérification de licence...');

    try {
        // Charger les dépendances nécessaires
        await loadDependencies();

        // Initialiser le service de licence
        const initResult = await window.licenseService.initialize();
        if (!initResult) {
            showLicenseError('Impossible d\'initialiser le service de licences');
            return;
        }

        // MODE PRODUCTION - Authentification requise
        console.log('[License Check] 🔐 MODE PRODUCTION - Authentification requise');
        
        // Vérifier si l'utilisateur est déjà authentifié
        let userEmail = getStoredUserEmail();
        
        if (!userEmail) {
            // Demander l'email utilisateur
            userEmail = await promptForEmail();
            if (!userEmail) {
                showLicenseError('Email requis pour accéder à l\'application');
                return;
            }
        }

        // Authentifier et vérifier la licence
        console.log('[License Check] Vérification de la licence pour:', userEmail);
        const licenseResult = await window.licenseService.authenticateWithEmail(userEmail);
        
        if (!licenseResult.valid) {
            console.warn('[License Check] ❌ Licence invalide:', licenseResult.message);
            clearStoredUserEmail();
            showLicenseError(licenseResult.message || 'Licence invalide');
            return;
        }

        // Stocker l'email pour la prochaine fois
        storeUserEmail(userEmail);

        console.log('[License Check] ✅ Licence valide pour:', userEmail);
        console.log('[License Check] Utilisateur:', licenseResult.user);
        console.log('[License Check] Rôle:', licenseResult.user?.role);
        
        // Exposer l'utilisateur globalement pour compatibilité
        window.currentUser = licenseResult.user;
        
        // Synchroniser les analytics locaux avec la base
        if (window.analyticsManager && window.licenseService.syncLocalAnalytics) {
            await window.licenseService.syncLocalAnalytics();
        }
        
        // Tracker la connexion dans les analytics locaux
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('license_check_success', {
                email: userEmail,
                role: licenseResult.user?.role,
                company: licenseResult.user?.company?.name,
                license_status: licenseResult.status,
                licenses_count: licenseResult.licenses?.length || 0
            });
        }

        // Initialiser la page si tout est OK
        if (window.initializePage) {
            console.log('[License Check] Initialisation de la page...');
            await window.initializePage();
        } else {
            console.warn('[License Check] ⚠️ Fonction initializePage non trouvée');
        }

    } catch (error) {
        console.error('[License Check] ❌ Erreur lors de la vérification de licence:', error);
        showLicenseError('Erreur de connexion au service de licences: ' + error.message);
    }
}

// === CHARGEMENT DES DÉPENDANCES ===

async function loadDependencies() {
    const dependencies = [
        { name: 'config-supabase.js', check: () => window.supabaseConfig },
        { name: 'LicenseService.js', check: () => window.licenseService }
    ];

    for (const dep of dependencies) {
        if (!dep.check()) {
            console.log(`[License Check] Chargement de ${dep.name}...`);
            await loadScript(dep.name);
            
            // Attendre que le script soit vraiment chargé
            let attempts = 0;
            while (!dep.check() && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!dep.check()) {
                throw new Error(`Impossible de charger ${dep.name}`);
            }
        }
    }
}

async function loadScript(filename) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./${filename}`;
        script.onload = () => {
            console.log(`[License Check] ✅ ${filename} chargé`);
            resolve();
        };
        script.onerror = () => {
            console.error(`[License Check] ❌ Échec du chargement de ${filename}`);
            reject(new Error(`Impossible de charger ${filename}`));
        };
        document.head.appendChild(script);
    });
}

// === FONCTIONS UTILITAIRES ===

async function promptForEmail() {
    // Vérifier si on est sur la page analytics (pas de prompt nécessaire)
    if (window.location.pathname.includes('analytics.html')) {
        return null;
    }

    // Utiliser l'email par défaut fourni
    const defaultEmail = 'vianney.hastings@hotmail.fr';
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
        console.warn('[License Check] Impossible de lire le localStorage:', error);
        return null;
    }
}

function storeUserEmail(email) {
    try {
        localStorage.setItem('emailsortpro_user_email', email);
    } catch (error) {
        console.warn('[License Check] Impossible d\'écrire dans le localStorage:', error);
    }
}

function clearStoredUserEmail() {
    try {
        localStorage.removeItem('emailsortpro_user_email');
    } catch (error) {
        console.warn('[License Check] Impossible de supprimer du localStorage:', error);
    }
}

// === GESTION DES ERREURS DE LICENCE ===

function showLicenseError(message = 'Accès refusé') {
    console.error('[License Check] 🚫 Affichage erreur de licence:', message);

    // Créer l'overlay d'erreur
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid #e2e8f0;
    `;

    // Déterminer le type d'erreur et l'icône appropriée
    let icon = '⚠️';
    let title = 'Accès Refusé';
    let helpText = 'Contactez votre administrateur système';

    if (message.includes('bloqué')) {
        icon = '🚫';
        title = 'Accès Bloqué';
    } else if (message.includes('expiré')) {
        icon = '⏰';
        title = 'Licence Expirée';
        helpText = 'Veuillez renouveler votre abonnement';
    } else if (message.includes('essai')) {
        icon = '⏳';
        title = 'Période d\'Essai';
        helpText = 'Profitez de votre période d\'essai gratuite';
    } else if (message.includes('connexion')) {
        icon = '🔌';
        title = 'Erreur de Connexion';
        helpText = 'Vérifiez votre connexion internet';
    }

    errorBox.innerHTML = `
        <div style="color: #dc2626; font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
        <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700;">${title}</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: #64748b; font-size: 0.875rem; margin: 0;">
                <strong>Besoin d'aide ?</strong><br>
                ${helpText}
            </p>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
            <button onclick="retryLogin()" style="
                background-color: #4F46E5;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 0.2s ease;
            ">Réessayer</button>
            <button onclick="debugConnection()" style="
                background-color: #6b7280;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 0.2s ease;
            ">Diagnostiquer</button>
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
        checkUserLicense();
    };

    window.debugConnection = async function() {
        console.log('🔍 Diagnostic de connexion...');
        const diagResult = await window.diagnoseSupabase();
        alert(`Diagnostic:\n${JSON.stringify(diagResult, null, 2)}`);
    };
}

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

    if (user.license_status === 'expired') {
        return { 
            canAccess: false, 
            reason: 'Votre licence a expiré. Veuillez renouveler votre abonnement' 
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
            
        case 'admin':
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
        case 'admin': return 'Administrateur';
        case 'user': return 'Utilisateur';
        default: return 'Utilisateur';
    }
}

// === GESTIONNAIRE D'AUTHENTIFICATION ===

const authManager = {
    currentUser: null,
    
    async checkAuth() {
        // Récupérer l'utilisateur depuis le service de licence
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
        return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
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

// Exposer authManager globalement
window.authManager = authManager;

// === FONCTIONS DE DÉBOGAGE ===

window.debugLicenseCheck = async function() {
    console.group('🔍 DEBUG LICENSE CHECK');
    console.log('Current user:', window.currentUser);
    console.log('License service:', !!window.licenseService);
    console.log('Supabase config:', !!window.supabaseConfig);
    console.log('Auth manager:', authManager);
    console.log('Stored email:', getStoredUserEmail());
    console.log('Page pathname:', window.location.pathname);
    
    if (window.currentUser) {
        const roleInfo = getUserRoleInfo(window.currentUser);
        const permCheck = checkUserPermissions(window.currentUser);
        console.log('Role info:', roleInfo);
        console.log('Permissions check:', permCheck);
    }
    
    // Test de connexion Supabase
    if (window.supabaseConfig) {
        console.log('Test connexion Supabase...');
        const testResult = await window.supabaseConfig.testConnection();
        console.log('Résultat test connexion:', testResult);
    }
    
    // Récupérer les analytics de l'utilisateur
    if (window.licenseService && window.currentUser) {
        console.log('Récupération des analytics utilisateur...');
        const analytics = await window.licenseService.getUserAnalytics();
        console.log('Analytics utilisateur:', analytics);
    }
    
    console.groupEnd();
    
    return {
        user: window.currentUser,
        hasLicenseService: !!window.licenseService,
        hasSupabaseConfig: !!window.supabaseConfig,
        storedEmail: getStoredUserEmail(),
        canAccess: authManager.hasAccess(),
        isAdmin: authManager.isAdmin()
    };
};

// === ÉVÉNEMENTS ET MONITORING ===

// Écouter les changements de visibilité pour revalider la licence
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && window.currentUser) {
        console.log('[License Check] 🔄 Page redevenue visible, vérification de la licence...');
        
        try {
            const licenseResult = await window.licenseService?.checkUserLicense(window.currentUser.email);
            if (licenseResult && !licenseResult.valid) {
                showLicenseError(licenseResult.message || 'Licence invalide');
            }
        } catch (error) {
            console.warn('[License Check] ⚠️ Erreur lors de la revérification:', error);
        }
    }
});

// Synchroniser périodiquement les analytics
setInterval(async () => {
    if (window.licenseService?.syncLocalAnalytics && window.currentUser) {
        await window.licenseService.syncLocalAnalytics();
    }
}, 5 * 60 * 1000); // Toutes les 5 minutes

// === DÉMARRAGE AUTOMATIQUE ===

console.log('[License Check] 🚀 Script de vérification de licence chargé (avec DB)');

// Lancer la vérification au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUserLicense);
} else {
    // DOM déjà chargé, démarrer après un court délai
    setTimeout(checkUserLicense, 100);
}

// Message d'instructions
console.log(`
🎯 LICENSE CHECK EMAILSORTPRO - VERSION BASE DE DONNÉES

📋 Fonctions disponibles:
   - checkUserLicense() - Vérifier la licence utilisateur
   - debugLicenseCheck() - Informations de debug complètes
   - authManager - Gestionnaire d'authentification

💾 Base de données:
   - Connexion via Supabase
   - Tables: users, companies, licenses, analytics_events
   - Synchronisation automatique des analytics

🔐 Rôles supportés:
   - super_admin: Accès complet
   - admin: Gestion de sa société (vianney.hastings@hotmail.fr)
   - user: Utilisation normale

💡 Pour déboguer: debugLicenseCheck()
`);

console.log('[License Check] ✅ Système prêt avec intégration base de données');
