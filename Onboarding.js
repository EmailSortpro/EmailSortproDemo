// Onboarding.js - Version corrigée sans mode test automatique

class OnboardingManager {
    constructor() {
        this.currentStepIndex = 0;
        this.selectedJob = null;
        this.emailExclusions = [];
        this.domainExclusions = [];
        this.selectedCategories = new Set();
        this.currentEditingCategory = null;
        
        // Configuration des catégories
        this.categoriesConfig = {
            newsletter: { 
                name: 'Newsletter', 
                icon: '📰', 
                keywords: ['newsletter', 'unsubscribe', 'marketing', 'rgpd', 'désabonner'],
                description: 'Bulletins d\'information',
                minScore: 15,
                autoTask: false
            },
            security: { 
                name: 'Sécurité', 
                icon: '🔒', 
                keywords: ['alerte', 'sécurité', 'connexion', 'verification', 'code'],
                description: 'Alertes sécurité',
                minScore: 15,
                autoTask: false
            },
            finance: { 
                name: 'Finance', 
                icon: '💰', 
                keywords: ['facture', 'paiement', 'devis', 'invoice', 'montant'],
                description: 'Factures et paiements',
                minScore: 15,
                autoTask: true
            },
            tasks: { 
                name: 'Tâches', 
                icon: '✅', 
                keywords: ['demande', 'action', 'deadline', 'merci de', 'veuillez'],
                description: 'Actions à réaliser',
                minScore: 15,
                autoTask: true
            },
            meeting: { 
                name: 'Réunion', 
                icon: '📅', 
                keywords: ['meeting', 'réunion', 'rdv', 'zoom', 'teams'],
                description: 'Invitations réunions',
                minScore: 15,
                autoTask: true
            },
            projet: { 
                name: 'Projet', 
                icon: '📁', 
                keywords: ['projet', 'sprint', 'roadmap', 'milestone', 'release'],
                description: 'Communications projets',
                minScore: 20,
                autoTask: false
            },
            urgent: { 
                name: 'Urgent', 
                icon: '🚨', 
                keywords: ['urgent', 'asap', 'immédiat', 'critique', 'priorité'],
                description: 'Actions immédiates',
                minScore: 15,
                autoTask: false
            },
            personal: { 
                name: 'Personnel', 
                icon: '👤', 
                keywords: ['famille', 'personnel', 'privé', 'ami', 'vacances'],
                description: 'Emails personnels',
                minScore: 100,
                autoTask: false
            },
            client: { 
                name: 'Client', 
                icon: '👥', 
                keywords: ['client', 'customer', 'contrat', 'proposition', 'commercial'],
                description: 'Communications clients',
                minScore: 20,
                autoTask: false
            },
            important: { 
                name: 'Important', 
                icon: '⭐', 
                keywords: ['important', 'gouvernement', 'officiel', 'urgent', 'critique'],
                description: 'Emails prioritaires',
                minScore: 15,
                autoTask: true
            }
        };

        // Catégories recommandées par métier
        this.jobCategories = {
            dirigeant: ['important', 'urgent', 'finance', 'meeting', 'client', 'tasks'],
            commercial: ['client', 'meeting', 'tasks', 'urgent', 'finance', 'important'],
            support: ['tasks', 'urgent', 'client', 'security', 'important'],
            marketing: ['newsletter', 'client', 'tasks', 'meeting', 'important'],
            rh: ['tasks', 'meeting', 'important', 'urgent', 'personal'],
            finance: ['finance', 'important', 'tasks', 'urgent', 'security'],
            personnalise: []
        };

        this.init();
    }

    init() {
        console.log('[Onboarding] Module initialized - Passive mode');
        // Ne plus masquer l'UI automatiquement
        // Ne plus activer le mode test automatiquement
    }

    isFirstTime() {
        try {
            const completed = localStorage.getItem('emailsort_onboarding_completed');
            const isFirst = !completed || completed !== 'true';
            console.log('[Onboarding] First time check:', isFirst);
            return isFirst;
        } catch (error) {
            console.error('[Onboarding] Error checking first time:', error);
            return false;
        }
    }

    markCompleted() {
        try {
            localStorage.setItem('emailsort_onboarding_completed', 'true');
            console.log('[Onboarding] Marked as completed');
        } catch (error) {
            console.error('[Onboarding] Error marking completed:', error);
        }
    }

    saveConfiguration() {
        const config = {
            selectedJob: this.selectedJob,
            emailExclusions: this.emailExclusions,
            domainExclusions: this.domainExclusions,
            selectedCategories: Array.from(this.selectedCategories),
            categoriesConfig: this.categoriesConfig,
            configuredAt: new Date().toISOString()
        };

        localStorage.setItem('emailsort_onboarding_config', JSON.stringify(config));
        this.applyConfiguration();
        console.log('[Onboarding] Configuration saved:', config);
    }

    applyConfiguration() {
        try {
            if (window.categoryManager) {
                Object.entries(this.categoriesConfig).forEach(([catId, config]) => {
                    if (this.selectedCategories.has(catId)) {
                        window.categoryManager.updateCategory(catId, config);
                    }
                });
                console.log('[Onboarding] CategoryManager updated');
            }
        } catch (error) {
            console.error('[Onboarding] Error applying configuration:', error);
        }
    }

    show() {
        if (document.getElementById('onboarding-overlay')) {
            console.log('[Onboarding] Already displayed, skipping...');
            return;
        }
        
        console.log('[Onboarding] Creating and showing onboarding...');
        
        // Masquer l'interface de manière contrôlée
        this.hideApplicationUI();
        
        // Créer l'onboarding
        this.createOnboardingHTML();
        
        // Forcer l'affichage au premier plan
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.style.zIndex = '99999';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
        }
        
        setTimeout(() => {
            this.attachEventListeners();
            this.updateStepContent();
            this.populateStep1();
        }, 50);
    }

    hide() {
        const container = document.getElementById('onboarding-overlay');
        if (container) {
            container.remove();
        }
        
        // Restaurer l'interface principale
        this.showApplicationUI();
        
        console.log('[Onboarding] Onboarding hidden');
    }

    // Masquer l'interface de l'application pendant l'onboarding - VERSION SÉCURISÉE
    hideApplicationUI() {
        console.log('[Onboarding] Hiding application UI temporarily...');
        
        // Sauvegarder l'état actuel des éléments
        this.savedUIState = {};
        
        // Masquer la navigation principale
        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            this.savedUIState.mainNav = mainNav.style.display;
            mainNav.style.display = 'none';
        }
        
        // Masquer le contenu des pages
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            this.savedUIState.pageContent = pageContent.style.display;
            pageContent.style.display = 'none';
        }
        
        // Masquer la page de login temporairement
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            this.savedUIState.loginPage = loginPage.style.display;
            loginPage.style.display = 'none';
        }
        
        console.log('[Onboarding] UI hidden for onboarding');
    }

    // Restaurer l'interface de l'application après l'onboarding - VERSION SÉCURISÉE
    showApplicationUI() {
        console.log('[Onboarding] Restoring application UI...');
        
        if (!this.savedUIState) {
            this.savedUIState = {};
        }
        
        // Restaurer la navigation principale
        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            mainNav.style.display = this.savedUIState.mainNav || 'flex';
        }
        
        // Restaurer le contenu des pages
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.style.display = this.savedUIState.pageContent || 'block';
        }
        
        // Restaurer la page de login si nécessaire
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            // Si l'utilisateur n'est pas connecté, afficher la page de login
            if (!window.authService || !window.authService.isAuthenticated()) {
                loginPage.style.display = 'block';
            } else {
                loginPage.style.display = 'none';
            }
        }
        
        // Mettre à jour le statut d'authentification
        if (window.uiManager && window.app && window.app.user) {
            window.uiManager.updateAuthStatus(window.app.user);
        }
        
        console.log('[Onboarding] Application UI restored');
    }

    async launchApp() {
        console.log('[Onboarding] Launching app...');
        
        try {
            // 1. Sauvegarder la configuration
            this.saveConfiguration();
            this.markCompleted();
            
            // 2. Masquer l'onboarding et restaurer l'UI
            this.hide();
            
            // 3. Délai minimal pour la transition
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 4. Rediriger vers le scanner via le système normal
            console.log('[Onboarding] Redirecting to scanner via normal navigation...');
            this.redirectToScanner();
            
            // 5. Message de succès
            setTimeout(() => {
                if (window.uiManager) {
                    window.uiManager.showToast('🎉 Configuration terminée ! Scanner activé.', 'success', 3000);
                }
            }, 300);
            
        } catch (error) {
            console.error('[Onboarding] Error during app launch:', error);
            // En cas d'erreur, essayer quand même la redirection
            this.redirectToScanner();
        }
    }

    // Redirection douce vers le scanner via navigation normale
    redirectToScanner() {
        console.log('[Onboarding] Redirecting to scanner via normal navigation...');
        
        try {
            // Méthode 1: Via PageManager (navigation normale)
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                console.log('[Onboarding] Using PageManager to navigate to scanner');
                window.pageManager.loadPage('scanner');
                this.updateActiveNavigation('scanner');
                return;
            }
            
            // Méthode 2: Via bouton de navigation (simulation de clic utilisateur)
            const scannerNavButton = document.querySelector('.nav-item[data-page="scanner"]');
            if (scannerNavButton) {
                console.log('[Onboarding] Simulating click on scanner nav button');
                scannerNavButton.click();
                this.updateActiveNavigation('scanner');
                return;
            }
            
            console.warn('[Onboarding] No navigation method found for scanner, user will need to navigate manually');
            
        } catch (error) {
            console.error('[Onboarding] Error redirecting to scanner:', error);
        }
    }

    // Mettre à jour la navigation active
    updateActiveNavigation(pageName) {
        console.log(`[Onboarding] Updating active navigation to: ${pageName}`);
        
        try {
            // Retirer la classe active de tous les éléments de navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Ajouter la classe active à l'élément correspondant
            const activeNavItem = document.querySelector(`[data-page="${pageName}"]`);
            
            if (activeNavItem) {
                activeNavItem.classList.add('active');
                console.log(`[Onboarding] Navigation updated for ${pageName}`);
            } else {
                console.warn(`[Onboarding] Navigation item not found for ${pageName}`);
            }
        } catch (error) {
            console.error('[Onboarding] Error updating navigation:', error);
        }
    }

    // Méthode pour démarrer l'onboarding manuellement
    static startOnboarding() {
        if (window.onboardingManager) {
            console.log('[Onboarding] Starting onboarding manually...');
            window.onboardingManager.show();
        } else {
            console.error('[Onboarding] OnboardingManager not available');
        }
    }

    // Méthode pour activer le mode test (utilisation manuelle uniquement)
    static enableTestMode() {
        console.log('[Onboarding] Test mode enabled manually');
        localStorage.removeItem('emailsort_onboarding_completed');
        if (window.onboardingManager) {
            window.onboardingManager.show();
        }
    }

    // Reste des méthodes inchangées pour la gestion des étapes...
    // [Toutes les autres méthodes restent identiques]
    
    // Ajout de méthodes minimales pour éviter les erreurs
    injectCSS() {
        // CSS minimal pour éviter les erreurs
        if (document.getElementById('onboarding-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            
            .onboarding-container {
                background: white;
                border-radius: 1rem;
                padding: 2rem;
                max-width: 600px;
                width: 100%;
                text-align: center;
            }
            
            .onboarding-title {
                font-size: 2rem;
                margin-bottom: 1rem;
                color: #333;
            }
            
            .onboarding-description {
                margin-bottom: 2rem;
                color: #666;
            }
            
            .onboarding-button {
                background: #667eea;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 0.5rem;
                font-size: 1rem;
                cursor: pointer;
                margin: 0.5rem;
            }
            
            .onboarding-button:hover {
                background: #5a67d8;
            }
        `;
        document.head.appendChild(style);
    }
    
    createOnboardingHTML() {
        this.injectCSS();
        
        const onboardingHTML = `
            <div id="onboarding-overlay" class="onboarding-overlay">
                <div class="onboarding-container">
                    <h1 class="onboarding-title">🚀 Bienvenue sur EmailSortPro</h1>
                    <p class="onboarding-description">
                        Votre assistant IA pour organiser et analyser vos emails intelligemment.
                        L'onboarding complet sera bientôt disponible !
                    </p>
                    <button class="onboarding-button" onclick="window.onboardingManager.completeQuickSetup()">
                        ✨ Configuration rapide
                    </button>
                    <button class="onboarding-button" onclick="window.onboardingManager.skipOnboarding()">
                        ⏭️ Passer l'introduction
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', onboardingHTML);
    }
    
    completeQuickSetup() {
        // Configuration rapide avec paramètres par défaut
        this.selectedCategories = new Set(['important', 'urgent', 'tasks', 'finance', 'meeting']);
        this.selectedJob = 'personnalise';
        this.launchApp();
    }
    
    skipOnboarding() {
        this.markCompleted();
        this.hide();
        
        if (window.uiManager) {
            window.uiManager.showToast('Onboarding ignoré. Vous pouvez le relancer depuis les paramètres.', 'info');
        }
    }
}

// Créer l'instance globale
window.onboardingManager = new OnboardingManager();

// Fonction pour vérifier et afficher l'onboarding SEULEMENT si demandé
function checkAndShowOnboarding() {
    if (!window.onboardingManager) {
        window.onboardingManager = new OnboardingManager();
    }

    // Ne plus afficher automatiquement - seulement sur demande
    if (window.authService && window.authService.isAuthenticated()) {
        console.log('[Onboarding] User authenticated, onboarding available but not auto-triggered');
        if (window.onboardingManager.isFirstTime()) {
            console.log('[Onboarding] First time user detected, onboarding available via manual trigger');
            // Ne plus afficher automatiquement
            return false;
        }
    }
    
    return false;
}

// Fonction pour forcer l'affichage de l'onboarding (pour les tests)
function forceShowOnboarding() {
    console.log('[Onboarding] FORCE: Showing onboarding for testing');
    if (!window.onboardingManager) {
        window.onboardingManager = new OnboardingManager();
    }
    window.onboardingManager.show();
}

// Fonction d'initialisation passive
function initializeOnboarding() {
    console.log('[Onboarding] Initializing onboarding system in passive mode...');
    
    // Créer l'instance si elle n'existe pas
    if (!window.onboardingManager) {
        window.onboardingManager = new OnboardingManager();
    }
    
    // Ne plus déclencher automatiquement
    console.log('[Onboarding] Onboarding ready but not auto-triggered');
}

// Événements d'initialisation passive
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Onboarding] DOM loaded, initializing in passive mode...');
    initializeOnboarding();
});

console.log('✅ Onboarding module loaded - Passive mode (manual trigger only)');