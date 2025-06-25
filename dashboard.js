// dashboard.js - Module Dashboard Réutilisable pour index.html et app.js

class DashboardModule {
    constructor() {
        this.stats = {
            emailsCount: 0,
            tasksCount: 0,
            timesSaved: '0h'
        };
        this.isInitialized = false;
        console.log('[Dashboard] Module créé');
    }

    // =====================================
    // GÉNÉRATION DU CONTENU DASHBOARD
    // =====================================
    generateDashboardHTML() {
        return `
            <div class="dashboard-container">
                <!-- Header du dashboard -->
                <div class="dashboard-header">
                    <!-- Guide rapide -->
                    <div class="quick-guide">
                        <p class="guide-intro">Commencez par <strong>Scanner</strong> vos emails pour découvrir la puissance de l'IA :</p>
                        <div class="guide-steps">
                            <span class="guide-step">1) Sélectionnez la période</span>
                            <span class="guide-step">2) L'IA analyse automatiquement</span>
                            <span class="guide-step">3) Récupérez vos emails triés</span>
                        </div>
                    </div>
                </div>

                <!-- Actions principales -->
                <div class="dashboard-actions">
                    <div class="action-card scan-card" onclick="window.dashboardModule.startAction('scan')">
                        <div class="action-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 class="action-title">Scanner</h3>
                        <p class="action-description">
                            Commencez ici ! L'IA analyse vos emails
                            <small>
                                1) Choisissez la période<br>
                                2) Analyse automatique<br>
                                3) Emails classés par catégories
                            </small>
                        </p>
                    </div>

                    <div class="action-card organize-card" onclick="window.dashboardModule.startAction('organize')">
                        <div class="action-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <h3 class="action-title">Organiser</h3>
                        <p class="action-description">
                            Triez par expéditeur et domaines
                            <small>
                                1) Analyse des expéditeurs<br>
                                2) Groupement automatique<br>
                                3) Création de dossiers
                            </small>
                        </p>
                    </div>

                    <div class="action-card tasks-card" onclick="window.dashboardModule.startAction('tasks')">
                        <div class="action-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 class="action-title">Tâches</h3>
                        <p class="action-description">
                            Consultez vos tâches générées
                            <small>
                                1) Tâches détectées<br>
                                2) Priorités assignées<br>
                                3) Suivi et validation
                            </small>
                        </p>
                    </div>

                    <div class="action-card settings-card" onclick="window.dashboardModule.startAction('settings')">
                        <div class="action-icon">
                            <i class="fas fa-sliders-h"></i>
                        </div>
                        <h3 class="action-title">Paramètres</h3>
                        <p class="action-description">
                            Personnalisez l'IA à vos besoins
                            <small>
                                1) Catégories custom<br>
                                2) Règles de tri<br>
                                3) Préférences d'analyse
                            </small>
                        </p>
                    </div>
                </div>

                <!-- Stats simples -->
                <div class="dashboard-stats">
                    <div class="stat">
                        <div class="stat-number" id="emailsCount">${this.stats.emailsCount}</div>
                        <div class="stat-label">Emails analysés</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="tasksCount">${this.stats.tasksCount}</div>
                        <div class="stat-label">Tâches créées</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="timesSaved">${this.stats.timesSaved}</div>
                        <div class="stat-label">Temps économisé</div>
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================
    // AFFICHAGE DU DASHBOARD
    // =====================================
    render(targetElement = null) {
        console.log('[Dashboard] Rendering dashboard...');
        
        const container = targetElement || document.getElementById('pageContent');
        if (!container) {
            console.error('[Dashboard] Target container not found');
            return false;
        }

        // Masquer tout autre contenu dynamique
        const dynamicContent = container.querySelectorAll('.page-minimal, .emails-page, .scanner-container, .tasks-page, .settings-page, .ranger-page');
        dynamicContent.forEach(content => {
            if (content) content.style.display = 'none';
        });

        // Vérifier s'il y a déjà un dashboard
        let dashboardContainer = container.querySelector('.dashboard-container');
        
        if (!dashboardContainer) {
            // Créer le dashboard
            container.innerHTML = this.generateDashboardHTML();
            dashboardContainer = container.querySelector('.dashboard-container');
            console.log('[Dashboard] Dashboard créé');
        } else {
            // Afficher le dashboard existant
            dashboardContainer.style.display = 'block';
            console.log('[Dashboard] Dashboard existant affiché');
        }

        // Afficher le container
        container.style.display = 'block';
        container.style.opacity = '1';

        // Mettre à jour les statistiques
        this.updateStats();

        // Animer les stats après un délai
        setTimeout(() => {
            this.animateStats();
        }, 800);

        // Marquer comme initialisé
        this.isInitialized = true;

        console.log('[Dashboard] ✅ Dashboard rendu avec succès');
        return true;
    }

    // =====================================
    // GESTION DES ACTIONS
    // =====================================
    startAction(action) {
        console.log(`[Dashboard] Action déclenchée: ${action}`);
        
        // Ajouter un effet visuel de clic
        if (event && event.target) {
            const actionCard = event.target.closest('.action-card');
            if (actionCard) {
                actionCard.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    actionCard.style.transform = '';
                }, 100);
            }
        }

        // Rediriger vers l'action appropriée
        this.navigateToPage(action);
    }

    navigateToPage(action) {
        let targetPage = '';
        
        switch(action) {
            case 'scan':
                targetPage = 'scanner';
                break;
            case 'organize':
                targetPage = 'ranger';
                break;
            case 'tasks':
                targetPage = 'tasks';
                break;
            case 'settings':
                targetPage = 'settings';
                break;
            default:
                console.warn('[Dashboard] Action inconnue:', action);
                return;
        }

        // Utiliser PageManager si disponible
        if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
            console.log('[Dashboard] Navigation via PageManager vers:', targetPage);
            window.pageManager.loadPage(targetPage);
        } else {
            console.warn('[Dashboard] PageManager non disponible, navigation directe');
            this.directNavigation(targetPage);
        }
    }

    directNavigation(page) {
        // Navigation directe sans PageManager
        console.log('[Dashboard] Navigation directe vers:', page);
        
        // Mettre à jour la navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Définir le mode de page
        if (window.setPageMode) {
            window.setPageMode(page);
        }

        // Masquer le dashboard
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }

        console.log('[Dashboard] Navigation directe effectuée');
    }

    // =====================================
    // GESTION DES STATISTIQUES
    // =====================================
    updateStats() {
        // Récupérer les stats depuis les services si disponibles
        try {
            if (window.taskManager && typeof window.taskManager.getStats === 'function') {
                const taskStats = window.taskManager.getStats();
                this.stats.tasksCount = taskStats.total || 0;
            }

            if (window.emailScanner && window.emailScanner.lastScanResults) {
                this.stats.emailsCount = window.emailScanner.lastScanResults.total || 0;
            }

            // Calculer le temps économisé (estimation)
            const estimatedTimePerEmail = 0.5; // 30 secondes par email
            const timeInMinutes = this.stats.emailsCount * estimatedTimePerEmail;
            if (timeInMinutes >= 60) {
                this.stats.timesSaved = Math.floor(timeInMinutes / 60) + 'h';
            } else {
                this.stats.timesSaved = Math.floor(timeInMinutes) + 'min';
            }

        } catch (error) {
            console.warn('[Dashboard] Erreur lors de la mise à jour des stats:', error);
            
            // Valeurs par défaut
            this.stats = {
                emailsCount: 847,
                tasksCount: 18,
                timesSaved: '5h'
            };
        }

        console.log('[Dashboard] Stats mises à jour:', this.stats);
    }

    animateStats() {
        // Animation simple des compteurs
        const emailsElement = document.getElementById('emailsCount');
        const tasksElement = document.getElementById('tasksCount');
        const timesElement = document.getElementById('timesSaved');

        if (emailsElement) {
            this.animateNumber(emailsElement, 0, this.stats.emailsCount, 1500);
        }

        if (tasksElement) {
            this.animateNumber(tasksElement, 0, this.stats.tasksCount, 1200);
        }

        if (timesElement) {
            setTimeout(() => {
                timesElement.textContent = this.stats.timesSaved;
            }, 1000);
        }
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const currentValue = Math.floor(start + (difference * easeOutQuad));
            
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = end;
            }
        };

        requestAnimationFrame(updateNumber);
    }

    // =====================================
    // MÉTHODES UTILITAIRES
    // =====================================
    refreshStats() {
        this.updateStats();
        this.animateStats();
    }

    isVisible() {
        const dashboardContainer = document.querySelector('.dashboard-container');
        return dashboardContainer && dashboardContainer.style.display !== 'none';
    }

    hide() {
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
    }

    show() {
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'block';
        }
    }

    // =====================================
    // MÉTHODE D'INITIALISATION
    // =====================================
    init() {
        console.log('[Dashboard] Initialisation du module dashboard...');
        
        // Vérifier les dépendances
        const dependencies = this.checkDependencies();
        if (!dependencies.allReady) {
            console.warn('[Dashboard] Certaines dépendances manquent:', dependencies.missing);
        }

        // Attacher les événements globaux si nécessaire
        this.setupGlobalEvents();

        console.log('[Dashboard] ✅ Module dashboard initialisé');
        return true;
    }

    checkDependencies() {
        const required = ['pageManager'];
        const optional = ['taskManager', 'emailScanner', 'uiManager'];
        
        const missing = required.filter(dep => !window[dep]);
        const optionalMissing = optional.filter(dep => !window[dep]);

        return {
            allReady: missing.length === 0,
            missing: missing,
            optionalMissing: optionalMissing
        };
    }

    setupGlobalEvents() {
        // Écouter les événements de mise à jour des stats
        if (window.addEventListener) {
            window.addEventListener('emailsScanned', () => {
                console.log('[Dashboard] Événement emailsScanned reçu');
                this.refreshStats();
            });

            window.addEventListener('taskCreated', () => {
                console.log('[Dashboard] Événement taskCreated reçu');
                this.refreshStats();
            });

            window.addEventListener('taskUpdated', () => {
                console.log('[Dashboard] Événement taskUpdated reçu');
                this.refreshStats();
            });
        }
    }

    // =====================================
    // MÉTHODE POUR PAGEMANAGER
    // =====================================
    getPageContent() {
        // Méthode spéciale pour PageManager
        return {
            title: 'Dashboard',
            content: this.generateDashboardHTML(),
            onLoad: () => {
                this.updateStats();
                setTimeout(() => this.animateStats(), 800);
            }
        };
    }
}

// =====================================
// INITIALISATION GLOBALE
// =====================================

// Créer l'instance globale
window.dashboardModule = new DashboardModule();

// Fonction globale pour les actions (compatibilité avec l'HTML existant)
window.startDashboardAction = function(action) {
    if (window.dashboardModule) {
        window.dashboardModule.startAction(action);
    } else {
        console.error('[Dashboard] Module dashboard non disponible');
    }
};

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardModule.init();
    });
} else {
    // DOM déjà prêt
    window.dashboardModule.init();
}

console.log('[Dashboard] ✅ Module dashboard.js chargé');

// Export pour compatibilité
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardModule;
}
