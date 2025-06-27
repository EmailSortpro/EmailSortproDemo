// Vérification des licences et redirection
async function checkUserLicense() {
    // MODE TEST - ACCÈS SANS AUTHENTIFICATION
    const TEST_MODE = false; // Mode production - chargement des vraies données
    const DEMO_MODE = true; // Mode démo - accès sans auth mais avec vraies données
    
    // Attendre que le DOM soit chargé
    if (document.readyState !== 'complete') {
        window.addEventListener('load', checkUserLicense);
        return;
    }

    try {
        // Vérifier si initializeSupabase existe
        if (typeof initializeSupabase === 'function') {
            // Initialiser Supabase d'abord
            const initialized = await initializeSupabase();
            if (!initialized) {
                console.warn('[License Check] Supabase non initialisé');
                if (!TEST_MODE) {
                    showLicenseError('Erreur de connexion au service');
                    return;
                }
            }
        } else {
            console.warn('[License Check] initializeSupabase non trouvé');
        }

        // MODE DEMO - Accès sans auth mais avec vraies données
        if (DEMO_MODE && !TEST_MODE) {
            console.log('[License Check] 🔧 MODE DEMO - Accès aux vraies données sans authentification');
            
            // Créer un utilisateur demo avec droits super_admin pour voir toutes les données
            if (!authManager.currentUser) {
                authManager.currentUser = {
                    id: 'demo-user-id',
                    email: 'demo@example.com',
                    name: 'Utilisateur Demo',
                    role: 'super_admin', // Pour voir toutes les données
                    license_status: 'active',
                    license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    company_id: 'demo-company-id'
                };
            }
            
            // Utiliser la vraie fonction initializePage qui charge depuis la BDD
            if (window.initializePage) {
                console.log('[License Check] Appel de initializePage pour charger les vraies données');
                window.initializePage();
            }
            return;
        }

        // CODE NORMAL (quand TEST_MODE = false)
        // Vérifier l'authentification
        const isAuthenticated = await authManager.checkAuth();
        
        if (!isAuthenticated) {
            // Rediriger vers la page de connexion
            window.location.href = '/login.html';
            return;
        }

        // Vérifier l'accès
        if (!authManager.hasAccess()) {
            // Créer et afficher le message d'erreur de licence
            showLicenseError();
            return;
        }

        // Si tout est OK, initialiser la page
        if (window.initializePage) {
            window.initializePage();
        }

    } catch (error) {
        console.error('Erreur lors de la vérification de licence:', error);
        if (!TEST_MODE) {
            showLicenseError();
        } else {
            // En mode test, initialiser quand même
            if (window.initializePage) {
                window.initializePage();
            }
        }
    }
}

// Afficher le message d'erreur de licence
function showLicenseError() {
    const status = authManager.checkLicenseStatus();
    let message = '';
    
    switch (status) {
        case LICENSE_STATUS.EXPIRED:
            message = 'Votre licence a expiré.';
            break;
        case LICENSE_STATUS.BLOCKED:
            message = 'Votre accès a été bloqué.';
            break;
        default:
            message = 'Vous n\'avez pas accès à cette ressource.';
    }

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
    `;

    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    errorBox.innerHTML = `
        <div style="color: #dc2626; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #1f2937; margin-bottom: 1rem;">Accès Refusé</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">${message}</p>
        <p style="color: #6b7280; margin-bottom: 2rem;">
            Veuillez contacter votre administrateur pour renouveler votre licence.
        </p>
        <button onclick="authManager.logout()" style="
            background-color: #3b82f6;
            color: white;
            padding: 0.5rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        ">Se déconnecter</button>
    `;

    overlay.appendChild(errorBox);
    document.body.appendChild(overlay);

    // Désactiver tout le contenu de la page
    document.body.style.overflow = 'hidden';
}

// Lancer la vérification au chargement
checkUserLicense();
