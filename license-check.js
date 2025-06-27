// license-check.js - Vérification des licences et redirection
// Version complète sans mode démo pour EmailSortPro

async function checkUserLicense() {
    // Configuration des modes - PRODUCTION uniquement
    const AUTH_REQUIRED = true; // Authentification toujours requise
    
    // Attendre que le DOM soit chargé
    if (document.readyState !== 'complete') {
        window.addEventListener('load', checkUserLicense);
        return;
    }

    console.log('[License Check] 🚀 Démarrage de la vérification de licence...');

    try {
        // Charger le service de licence si pas encore fait
        if (!window.licenseService) {
            console.log('[License Check] Chargement du service de licence...');
            await loadLicenseService();
        }

        // Initialiser le service de licence
        await window.licenseService.initialize();

        // MODE PRODUCTION - Authentification complète
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
            storeUserEmail(userEmail);
        }

        // Vérifier la licence
        console.log('[License Check] Vérification de la licence pour:', userEmail);
        const licenseResult = await window.licenseService.checkUserLicense(userEmail);
        
        if (!licenseResult.valid) {
            console.warn('[License Check] ❌ Licence invalide:', licenseResult.message);
            clearStoredUserEmail();
            showLicenseError(licenseResult.message || 'Licence invalide');
            return;
        }

        console.log('[License Check] ✅ Licence valide pour:', userEmail);
        console.log('[License Check] Rôle utilisateur:', licenseResult.user?.role);
        
        // Tracker la connexion
        if (window.licenseService.trackEvent) {
            await window.licenseService.trackEvent('user_login', {
                email: userEmail,
                role: licenseResult.user?.role,
                company: licenseResult.user?.company?.name
            });
        }

        // Initialiser la page si tout est OK
        if (window.initializePage) {
            console.log('[License Check] Initialisation de la page...');
            window.initializePage();
        } else {
            console.warn('[License Check] ⚠️ Fonction initializePage non trouvée');
        }

    } catch (error) {
        console.error('[License Check] ❌ Erreur lors de la vérification de licence:', error);
        showLicenseError('Erreur de connexion au service de licences');
    }
}

// === FONCTIONS UTILITAIRES ===

async function loadLicenseService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './LicenseService.js';
        script.onload = () => {
            console.log('[License Check] ✅ Service de licence chargé');
            resolve();
        };
        script.onerror = () => {
            console.error('[License Check] ❌ Échec du chargement du service de licence');
            reject(new Error('Impossible de charger LicenseService.js'));
        };
        document.head.appendChild(script);
    });
}

async function promptForEmail() {
    // Vérifier si on est sur la page analytics (pas de prompt nécessaire)
    if (window.location.pathname.includes('analytics.html')) {
        return null; // La page analytics gère sa propre authentification
    }

    const userEmail = prompt('Entrez votre email pour accéder à l\'application:', 'vianney.hastings@hotmail.fr');
    
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
        return localStorage.getItem('userEmail');
    } catch (error) {
        console.warn('[License Check] Impossible de lire le localStorage:', error);
        return null;
    }
}

function storeUserEmail(email) {
    try {
        localStorage.setItem('userEmail', email);
    } catch (error) {
        console.warn('[License Check] Impossible d\'écrire dans le localStorage:', error);
    }
}

function clearStoredUserEmail() {
    try {
        localStorage.removeItem('userEmail');
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
    let actionButton = '';

    if (message.includes('bloqué')) {
        icon = '🚫';
        title = 'Accès Bloqué';
    } else if (message.includes('expiré')) {
        icon = '⏰';
        title = 'Licence Expirée';
    } else if (message.includes('essai')) {
        icon = '⏳';
        title = 'Période d\'Essai';
    }

    // Bouton de déconnexion
    actionButton = `
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
            <button onclick="contactSupport()" style="
                background-color: #6b7280;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 0.2s ease;
            ">Contacter le support</button>
        </div>
    `;

    errorBox.innerHTML = `
        <div style="color: #dc2626; font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
        <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700;">${title}</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: #64748b; font-size: 0.875rem; margin: 0;">
                <strong>Besoin d'aide ?</strong><br>
                Contactez votre administrateur système ou l'équipe support EmailSortPro
            </p>
        </div>
        ${actionButton}
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

    window.contactSupport = function() {
        window.open('mailto:support@emailsortpro.com?subject=Problème d\'accès - EmailSortPro', '_blank');
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
                'Accès aux analytics globaux'
            );
            break;
            
        case 'company_admin':
            permissions.push(
                'Gestion des utilisateurs de sa société',
                'Ajout/suppression d\'utilisateurs',
                'Accès aux analytics de sa société',
                'Configuration des paramètres société'
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
        case 'company_admin': return 'Administrateur de Société';
        case 'user': return 'Utilisateur';
        default: return 'Utilisateur';
    }
}

// === INITIALISATION ET GESTION AUTH ===

// Gestionnaire d'authentification pour compatibilité
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
    
    checkLicenseStatus() {
        return this.currentUser?.license_status || 'unknown';
    },
    
    async logout() {
        this.currentUser = null;
        clearStoredUserEmail();
        
        if (window.licenseService?.logout) {
            await window.licenseService.logout();
        } else {
            window.location.href = '/';
        }
    }
};

// Exposer authManager globalement pour compatibilité
window.authManager = authManager;

// === INITIALISATION AUTOMATIQUE ===

// Fonction d'initialisation pour les pages
async function initializePageSafely() {
    try {
        console.log('[License Check] 📋 Initialisation sécurisée de la page...');
        
        // Vérifier que l'utilisateur est toujours valide
        if (window.currentUser) {
            const permCheck = checkUserPermissions(window.currentUser);
            if (!permCheck.canAccess) {
                showLicenseError(permCheck.reason);
                return;
            }
        }

        // Initialiser la page si la fonction existe
        if (window.initializePage && typeof window.initializePage === 'function') {
            await window.initializePage();
            console.log('[License Check] ✅ Page initialisée avec succès');
        } else {
            console.warn('[License Check] ⚠️ Fonction initializePage non disponible');
        }

        // Logger l'activité utilisateur
        if (window.licenseService?.trackEvent) {
            await window.licenseService.trackEvent('page_view', {
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('[License Check] ❌ Erreur lors de l\'initialisation de la page:', error);
        showLicenseError('Erreur lors de l\'initialisation de l\'application');
    }
}

// === ÉVÉNEMENTS ET DÉMARRAGE ===

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

// Fonction de debug pour les développeurs
window.debugLicenseCheck = function() {
    console.group('🔍 DEBUG LICENSE CHECK');
    console.log('Current user:', window.currentUser);
    console.log('License service:', !!window.licenseService);
    console.log('Auth manager:', authManager);
    console.log('Stored email:', getStoredUserEmail());
    console.log('Page pathname:', window.location.pathname);
    
    if (window.currentUser) {
        const roleInfo = getUserRoleInfo(window.currentUser);
        const permCheck = checkUserPermissions(window.currentUser);
        console.log('Role info:', roleInfo);
        console.log('Permissions check:', permCheck);
    }
    
    console.groupEnd();
    
    return {
        user: window.currentUser,
        hasLicenseService: !!window.licenseService,
        storedEmail: getStoredUserEmail(),
        canAccess: authManager.hasAccess()
    };
};

// === DÉMARRAGE AUTOMATIQUE ===

// Lancer la vérification au chargement
console.log('[License Check] 🚀 Script de vérification de licence chargé');

// Démarrer la vérification dès que possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUserLicense);
} else {
    // DOM déjà chargé, démarrer immédiatement
    setTimeout(checkUserLicense, 100);
}

// Message d'instructions pour les développeurs
console.log(`
🎯 LICENSE CHECK EMAILSORTPRO INITIALISÉ

📋 Fonctions disponibles:
   - checkUserLicense() - Vérifier la licence utilisateur
   - debugLicenseCheck() - Informations de debug
   - authManager - Gestionnaire d'authentification

⚙️ Mode de fonctionnement:
   - Production: Authentification complète requise

🔒 Rôles supportés:
   - super_admin: Accès complet à tout
   - company_admin: Gestion de sa société (vianney.hastings@hotmail.fr par défaut)
   - user: Utilisation normale

💡 Pour déboguer: debugLicenseCheck()
`);

console.log('[License Check] ✅ Système de vérification de licence EmailSortPro prêt');
