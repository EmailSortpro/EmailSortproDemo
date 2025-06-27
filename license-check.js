// Vérification des licences et redirection
async function checkUserLicense() {
    // MODE TEST - ACCÈS SANS AUTHENTIFICATION
    const TEST_MODE = true; // Temporairement activé pour tester
    
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

        if (TEST_MODE) {
            console.log('[License Check] 🧪 MODE TEST ACTIVÉ - Accès sans authentification');
            
            // Créer un utilisateur fictif pour les tests
            if (!authManager.currentUser) {
                authManager.currentUser = {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    name: 'Utilisateur Test',
                    role: 'super_admin',
                    license_status: 'active',
                    license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    company_id: 'test-company-id'
                };
            }
            
            // Ajouter loadData à analyticsManager s'il existe
            if (window.analyticsManager && !window.analyticsManager.loadData) {
                window.analyticsManager.loadData = async function() {
                    console.log('[Analytics] loadData appelé - mode test, pas de chargement nécessaire');
                    return Promise.resolve();
                };
            }
            
            // Créer une fonction initializePage qui évite l'appel à loadData
            console.log('[License Check] Remplacement de initializePage pour éviter loadData');
            const originalInitializePage = window.initializePage;
            window.initializePage = async function() {
                try {
                    console.log('[License Check] Initialisation de la page (version adaptée)');
                    
                    // Si l'original existe et ne contient pas loadData, l'utiliser
                    if (originalInitializePage && !originalInitializePage.toString().includes('loadData')) {
                        return originalInitializePage();
                    }
                    
                    // Sinon, utiliser notre version personnalisée
                    // Afficher les informations utilisateur
                    const userNameEl = document.getElementById('userName');
                    const userRoleEl = document.getElementById('userRole');
                    if (userNameEl) userNameEl.textContent = authManager.currentUser.name || authManager.currentUser.email;
                    if (userRoleEl) {
                        const roleText = {
                            'super_admin': 'Super Admin',
                            'admin': 'Administrateur',
                            'user': 'Utilisateur'
                        };
                        userRoleEl.textContent = roleText[authManager.currentUser.role] || 'Utilisateur';
                    }
                    
                    // Afficher l'onglet sociétés pour les super admins
                    const companiesTab = document.getElementById('companiesTab');
                    if (companiesTab && authManager.currentUser.role === 'super_admin') {
                        companiesTab.style.display = 'block';
                    }
                    
                    // Afficher les stats de test
                    const statsGrid = document.getElementById('statsGrid');
                    if (statsGrid) {
                        statsGrid.innerHTML = `
                            <div class="stat-card">
                                <div class="stat-label">Sociétés</div>
                                <div class="stat-value">3</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Utilisateurs actifs</div>
                                <div class="stat-value">47</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Licences actives</div>
                                <div class="stat-value">12</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Événements aujourd'hui</div>
                                <div class="stat-value">234</div>
                            </div>
                        `;
                    }
                    
                    // Remplir les tableaux avec des données de test
                    const tables = {
                        'companiesTable': `
                            <tr>
                                <td>Entreprise Alpha</td>
                                <td>alpha.com</td>
                                <td>15</td>
                                <td>1</td>
                                <td>${new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                            <tr>
                                <td>Société Beta</td>
                                <td>beta.fr</td>
                                <td>23</td>
                                <td>2</td>
                                <td>${new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `,
                        'usersTable': `
                            <tr>
                                <td>admin@alpha.com</td>
                                <td>Jean Admin</td>
                                <td>Entreprise Alpha</td>
                                <td>admin</td>
                                <td><span class="status-badge status-active">active</span></td>
                                <td>${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</td>
                                <td>${new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                            <tr>
                                <td>user@beta.fr</td>
                                <td>Marie User</td>
                                <td>Société Beta</td>
                                <td>user</td>
                                <td><span class="status-badge status-trial">trial</span></td>
                                <td>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</td>
                                <td>${new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `,
                        'licensesTable': `
                            <tr>
                                <td>Entreprise Alpha</td>
                                <td>premium</td>
                                <td>50</td>
                                <td>15</td>
                                <td>4999.99 €</td>
                                <td><span class="status-badge status-active">active</span></td>
                                <td>${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `,
                        'eventsTable': `
                            <tr>
                                <td>${new Date().toLocaleString('fr-FR')}</td>
                                <td>test@example.com</td>
                                <td>page_view</td>
                                <td>{"page": "analytics"}</td>
                            </tr>
                        `
                    };
                    
                    // Injecter les données dans les tableaux
                    Object.entries(tables).forEach(([tableId, content]) => {
                        const tbody = document.querySelector(`#${tableId} tbody`);
                        if (tbody) tbody.innerHTML = content;
                    });
                    
                    // Tracker l'événement
                    if (window.analyticsManager && window.analyticsManager.trackEvent) {
                        window.analyticsManager.trackEvent('page_view', { page: 'analytics' });
                    }
                    
                    console.log('[License Check] Page initialisée avec succès (données de test)');
                } catch (error) {
                    console.error('[License Check] Erreur lors de l\'initialisation:', error);
                }
            };
            
            // Appeler la nouvelle fonction
            window.initializePage();
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
