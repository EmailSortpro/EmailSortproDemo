// profil.js - Page de profil utilisateur pour EmailSortProAI
(function() {
    'use strict';

    console.log('[PROFILE] 🎯 Loading profile module...');

    // Email administrateur
    const ADMIN_EMAIL = 'vianneyhastings@emailsortpro.fr';

    class ProfilePage {
        constructor() {
            this.container = null;
            this.user = null;
            this.companyInfo = null;
            this.stats = {
                totalEmails: 0,
                totalTasks: 0,
                lastSync: null,
                accountCreated: null,
                scanFrequency: 'Non calculée',
                averageEmailsPerDay: 0,
                totalScans: 0
            };
        }

        // Initialiser la page
        async init() {
            console.log('[PROFILE] Initializing profile page...');
            
            // Récupérer les informations utilisateur
            await this.loadUserInfo();
            
            // Charger les informations d'entreprise
            await this.loadCompanyInfo();
            
            // Charger les statistiques
            await this.loadStats();
            
            // Rendre la page
            this.render();
        }

        // Charger les informations utilisateur
        async loadUserInfo() {
            try {
                // Vérifier d'abord Microsoft
                if (window.authService && window.authService.isAuthenticated()) {
                    this.user = await window.authService.getUser();
                    this.user.provider = 'microsoft';
                    this.user.providerName = 'Microsoft Outlook';
                    this.user.providerIcon = 'fab fa-microsoft';
                    this.user.providerColor = '#00BCF2';
                }
                // Sinon vérifier Google
                else if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
                    this.user = window.googleAuthService.getUser();
                    this.user.provider = 'google';
                    this.user.providerName = 'Google Gmail';
                    this.user.providerIcon = 'fab fa-google';
                    this.user.providerColor = '#EA4335';
                }

                console.log('[PROFILE] User loaded:', this.user);
            } catch (error) {
                console.error('[PROFILE] Error loading user:', error);
            }
        }

        // Charger les informations d'entreprise
        async loadCompanyInfo() {
            try {
                // Extraire les infos de l'utilisateur
                if (this.user) {
                    const email = this.user.mail || this.user.email || this.user.userPrincipalName || '';
                    const domain = email.split('@')[1] || '';
                    
                    // Extraire nom et prénom
                    const fullName = this.user.displayName || this.user.name || '';
                    const nameParts = fullName.split(' ');
                    
                    this.companyInfo = {
                        firstName: nameParts[0] || '',
                        lastName: nameParts.slice(1).join(' ') || '',
                        fullName: fullName,
                        email: email,
                        company: this.extractCompanyName(domain),
                        domain: domain,
                        department: this.user.department || this.user.jobTitle || 'Non spécifié'
                    };
                }

                // Charger les infos de licence si disponibles
                if (window.licenseManager && window.licenseManager.currentLicense) {
                    const license = window.licenseManager.currentLicense;
                    this.companyInfo.licenseType = license.type || 'Standard';
                    this.companyInfo.licenseExpiry = license.validUntil;
                }

            } catch (error) {
                console.error('[PROFILE] Error loading company info:', error);
            }
        }

        // Extraire le nom de l'entreprise du domaine
        extractCompanyName(domain) {
            if (!domain) return 'Non spécifié';
            
            // Cas spéciaux
            const specialCases = {
                'gmail.com': 'Compte Gmail personnel',
                'outlook.com': 'Compte Outlook personnel',
                'hotmail.com': 'Compte Hotmail personnel',
                'yahoo.com': 'Compte Yahoo personnel',
                'emailsortpro.fr': 'EmailSortPro'
            };
            
            if (specialCases[domain]) {
                return specialCases[domain];
            }
            
            // Extraire le nom du domaine
            const parts = domain.split('.');
            if (parts.length >= 2) {
                return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
            
            return domain;
        }

        // Charger les statistiques
        async loadStats() {
            try {
                // Récupérer le nombre total d'emails
                const emailsData = localStorage.getItem('emailsData');
                if (emailsData) {
                    const emails = JSON.parse(emailsData);
                    this.stats.totalEmails = emails.length;
                }

                // Récupérer le nombre total de tâches
                const tasksData = localStorage.getItem('tasks');
                if (tasksData) {
                    const tasks = JSON.parse(tasksData);
                    this.stats.totalTasks = tasks.length;
                }

                // Récupérer la dernière synchronisation
                this.stats.lastSync = localStorage.getItem('lastSyncTime');

                // Récupérer la date de première connexion
                this.stats.accountCreated = localStorage.getItem('firstLoginDate');
                if (!this.stats.accountCreated && this.user) {
                    this.stats.accountCreated = new Date().toISOString();
                    localStorage.setItem('firstLoginDate', this.stats.accountCreated);
                }

                // Calculer la fréquence de scan
                this.calculateScanFrequency();

                // Récupérer le nombre total de scans
                const scanHistory = localStorage.getItem('scanHistory');
                if (scanHistory) {
                    const history = JSON.parse(scanHistory);
                    this.stats.totalScans = history.length;
                }

            } catch (error) {
                console.error('[PROFILE] Error loading stats:', error);
            }
        }

        // Calculer la fréquence de scan
        calculateScanFrequency() {
            try {
                const scanHistory = localStorage.getItem('scanHistory');
                if (!scanHistory) {
                    this.stats.scanFrequency = 'Aucun scan effectué';
                    return;
                }

                const history = JSON.parse(scanHistory);
                if (history.length < 2) {
                    this.stats.scanFrequency = '1 scan effectué';
                    return;
                }

                // Calculer la moyenne entre les scans
                const dates = history.map(h => new Date(h.date)).sort((a, b) => a - b);
                const intervals = [];
                
                for (let i = 1; i < dates.length; i++) {
                    intervals.push(dates[i] - dates[i-1]);
                }

                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const avgDays = avgInterval / (1000 * 60 * 60 * 24);

                if (avgDays < 1) {
                    this.stats.scanFrequency = 'Plusieurs fois par jour';
                } else if (avgDays < 2) {
                    this.stats.scanFrequency = 'Quotidien';
                } else if (avgDays < 7) {
                    this.stats.scanFrequency = `Tous les ${Math.round(avgDays)} jours`;
                } else if (avgDays < 30) {
                    this.stats.scanFrequency = 'Hebdomadaire';
                } else {
                    this.stats.scanFrequency = 'Mensuel';
                }

                // Calculer emails par jour
                if (this.stats.accountCreated) {
                    const accountAge = (new Date() - new Date(this.stats.accountCreated)) / (1000 * 60 * 60 * 24);
                    this.stats.averageEmailsPerDay = Math.round(this.stats.totalEmails / Math.max(1, accountAge));
                }

            } catch (error) {
                console.error('[PROFILE] Error calculating scan frequency:', error);
                this.stats.scanFrequency = 'Non disponible';
            }
        }

        // Vérifier si l'utilisateur est admin
        isAdmin() {
            if (!this.user) return false;
            const userEmail = (this.user.mail || this.user.email || this.user.userPrincipalName || '').toLowerCase();
            return userEmail === ADMIN_EMAIL.toLowerCase();
        }

        // Formater une date
        formatDate(dateString) {
            if (!dateString) return 'Non disponible';
            
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'À l\'instant';
                if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
                if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
                if (diffDays < 30) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return 'Non disponible';
            }
        }

        // Obtenir les initiales
        getInitials(name) {
            if (!name) return '?';
            return name.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }

        // Rendre la page
        render() {
            const container = document.getElementById('pageContent');
            if (!container) {
                console.error('[PROFILE] Page content container not found');
                return;
            }

            this.container = container;

            // Contenu HTML
            let html = `
                <div class="profile-container">
                    <div class="profile-header">
                        <h1 class="profile-title">
                            <i class="fas fa-user-circle"></i>
                            Mon Profil
                        </h1>
                    </div>

                    <!-- Carte Utilisateur -->
                    <div class="profile-card user-card">
                        <div class="user-avatar-large" style="background: ${this.user?.providerColor || '#4F46E5'}">
                            ${this.getInitials(this.companyInfo?.fullName || 'U')}
                        </div>
                        
                        <div class="user-info-section">
                            <h2 class="user-name">${this.companyInfo?.fullName || 'Utilisateur'}</h2>
                            <p class="user-email">${this.companyInfo?.email || 'Email non disponible'}</p>
                            
                            <div class="user-meta">
                                <div class="meta-item">
                                    <i class="fas fa-building"></i>
                                    ${this.companyInfo?.company || 'Non spécifié'}
                                </div>
                                <div class="meta-item">
                                    <i class="${this.user?.providerIcon || 'fas fa-envelope'}"></i>
                                    ${this.user?.providerName || 'Email'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Informations d'entreprise -->
                    <div class="profile-section">
                        <h3 class="section-title">
                            <i class="fas fa-briefcase"></i>
                            Informations professionnelles
                        </h3>
                        
                        <div class="info-grid">
                            <div class="info-card">
                                <label>Prénom</label>
                                <value>${this.companyInfo?.firstName || 'Non spécifié'}</value>
                            </div>
                            <div class="info-card">
                                <label>Nom</label>
                                <value>${this.companyInfo?.lastName || 'Non spécifié'}</value>
                            </div>
                            <div class="info-card">
                                <label>Entreprise</label>
                                <value>${this.companyInfo?.company || 'Non spécifié'}</value>
                            </div>
                            <div class="info-card">
                                <label>Domaine</label>
                                <value>${this.companyInfo?.domain || 'Non spécifié'}</value>
                            </div>
                            <div class="info-card">
                                <label>Première connexion</label>
                                <value>${this.formatDate(this.stats.accountCreated)}</value>
                            </div>
                            <div class="info-card">
                                <label>Fréquence de scan</label>
                                <value>${this.stats.scanFrequency}</value>
                            </div>
                        </div>
                    </div>

                    <!-- Section spéciale pour l'admin (sans mention visible) -->
                    ${this.isAdmin() ? this.renderAdminSection() : ''}

                    <!-- Statistiques d'utilisation -->
                    <div class="profile-section">
                        <h3 class="section-title">
                            <i class="fas fa-chart-bar"></i>
                            Statistiques d'utilisation
                        </h3>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon" style="background: #3B82F6">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${this.stats.totalEmails.toLocaleString('fr-FR')}</div>
                                    <div class="stat-label">Emails analysés</div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon" style="background: #10B981">
                                    <i class="fas fa-tasks"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${this.stats.totalTasks.toLocaleString('fr-FR')}</div>
                                    <div class="stat-label">Tâches créées</div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon" style="background: #F59E0B">
                                    <i class="fas fa-search"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${this.stats.totalScans}</div>
                                    <div class="stat-label">Scans effectués</div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon" style="background: #8B5CF6">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${this.stats.averageEmailsPerDay}</div>
                                    <div class="stat-label">Emails/jour en moyenne</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Informations du compte -->
                    <div class="profile-section">
                        <h3 class="section-title">
                            <i class="fas fa-cog"></i>
                            Informations du compte
                        </h3>
                        
                        <div class="info-list">
                            <div class="info-item">
                                <span class="info-label">
                                    <i class="fas fa-sync"></i>
                                    Dernière synchronisation
                                </span>
                                <span class="info-value">${this.formatDate(this.stats.lastSync)}</span>
                            </div>

                            <div class="info-item">
                                <span class="info-label">
                                    <i class="fas fa-shield-alt"></i>
                                    Type de licence
                                </span>
                                <span class="info-value">
                                    <span class="license-badge ${this.companyInfo?.licenseType?.toLowerCase() || 'standard'}">
                                        ${this.companyInfo?.licenseType || 'Standard'}
                                    </span>
                                </span>
                            </div>

                            <div class="info-item">
                                <span class="info-label">
                                    <i class="fas fa-lock"></i>
                                    Sécurité
                                </span>
                                <span class="info-value">
                                    <span class="security-badge">
                                        <i class="fas fa-check-circle"></i>
                                        OAuth 2.0 sécurisé
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="profile-section">
                        <h3 class="section-title">
                            <i class="fas fa-tools"></i>
                            Actions
                        </h3>
                        
                        <div class="actions-grid">
                            <button class="action-button" onclick="window.profilePage.exportData()">
                                <i class="fas fa-download"></i>
                                Exporter mes données
                            </button>

                            <button class="action-button" onclick="window.profilePage.clearCache()">
                                <i class="fas fa-broom"></i>
                                Vider le cache
                            </button>

                            <button class="action-button danger" onclick="window.handleLogout()">
                                <i class="fas fa-sign-out-alt"></i>
                                Se déconnecter
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="profile-footer">
                        <p>
                            <i class="fas fa-info-circle"></i>
                            EmailSortProAI v3.0.2 • 
                            <a href="./privacy-policy.html" target="_blank">Politique de confidentialité</a> • 
                            <a href="./terms.html" target="_blank">Conditions d'utilisation</a>
                        </p>
                    </div>
                </div>
            `;

            container.innerHTML = html;

            // Appliquer les styles
            this.applyStyles();

            // Sauvegarder l'historique de scan si nécessaire
            this.updateScanHistory();
        }

        // Rendre la section admin (discrète)
        renderAdminSection() {
            return `
                <div class="profile-section special-section">
                    <h3 class="section-title">
                        <i class="fas fa-chart-line"></i>
                        Outils avancés
                    </h3>
                    
                    <div class="advanced-tools">
                        <a href="https://coruscating-dodol-f30e8d.netlify.app/analytics.html" 
                           target="_blank" 
                           class="tool-button analytics-button">
                            <div class="tool-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="tool-content">
                                <strong>Tableau de bord Analytics</strong>
                                <small>Statistiques détaillées de l'application</small>
                            </div>
                            <i class="fas fa-external-link-alt"></i>
                        </a>

                        <button class="tool-button" onclick="window.profilePage.showSystemInfo()">
                            <div class="tool-icon">
                                <i class="fas fa-server"></i>
                            </div>
                            <div class="tool-content">
                                <strong>Informations système</strong>
                                <small>État des services et diagnostics</small>
                            </div>
                        </button>
                    </div>
                </div>
            `;
        }

        // Mettre à jour l'historique de scan
        updateScanHistory() {
            try {
                let history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
                
                // Ajouter une entrée si c'est un nouveau scan
                const lastSync = localStorage.getItem('lastSyncTime');
                if (lastSync && !history.some(h => h.date === lastSync)) {
                    history.push({
                        date: lastSync,
                        emails: this.stats.totalEmails,
                        tasks: this.stats.totalTasks
                    });
                    
                    // Garder seulement les 50 derniers scans
                    if (history.length > 50) {
                        history = history.slice(-50);
                    }
                    
                    localStorage.setItem('scanHistory', JSON.stringify(history));
                }
            } catch (error) {
                console.error('[PROFILE] Error updating scan history:', error);
            }
        }

        // Appliquer les styles
        applyStyles() {
            const styleId = 'profile-page-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    /* Container principal */
                    .profile-container {
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        animation: fadeIn 0.3s ease-out;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    /* Header */
                    .profile-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .profile-title {
                        font-size: 2rem;
                        font-weight: 600;
                        color: #1f2937;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                    }

                    /* Carte utilisateur */
                    .profile-card {
                        background: white;
                        border-radius: 12px;
                        padding: 32px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        border: 1px solid #e5e7eb;
                        margin-bottom: 24px;
                    }

                    .user-card {
                        display: flex;
                        align-items: center;
                        gap: 32px;
                    }

                    .user-avatar-large {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                        font-weight: 600;
                        color: white;
                        flex-shrink: 0;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }

                    .user-info-section {
                        flex: 1;
                    }

                    .user-name {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin: 0 0 8px 0;
                    }

                    .user-email {
                        font-size: 1rem;
                        color: #6b7280;
                        margin: 0 0 16px 0;
                    }

                    .user-meta {
                        display: flex;
                        gap: 24px;
                        flex-wrap: wrap;
                    }

                    .meta-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.875rem;
                        color: #4b5563;
                    }

                    .meta-item i {
                        color: #9ca3af;
                    }

                    /* Sections */
                    .profile-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        border: 1px solid #e5e7eb;
                        margin-bottom: 24px;
                    }

                    .section-title {
                        font-size: 1.125rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin: 0 0 20px 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    /* Grille d'informations */
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                    }

                    .info-card {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .info-card label {
                        font-size: 0.875rem;
                        color: #6b7280;
                        font-weight: 500;
                    }

                    .info-card value {
                        font-size: 1rem;
                        color: #1f2937;
                        font-weight: 600;
                    }

                    /* Statistiques */
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    }

                    .stat-card {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px;
                        background: #f9fafb;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }

                    .stat-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        flex-shrink: 0;
                    }

                    .stat-content {
                        flex: 1;
                        min-width: 0;
                    }

                    .stat-value {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #1f2937;
                        line-height: 1.2;
                    }

                    .stat-label {
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-top: 4px;
                    }

                    /* Liste d'informations */
                    .info-list {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .info-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #f3f4f6;
                    }

                    .info-item:last-child {
                        border-bottom: none;
                    }

                    .info-label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #6b7280;
                        font-size: 0.875rem;
                    }

                    .info-value {
                        color: #1f2937;
                        font-weight: 500;
                        text-align: right;
                    }

                    .license-badge {
                        display: inline-flex;
                        align-items: center;
                        padding: 4px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        background: #e0e7ff;
                        color: #4338ca;
                    }

                    .license-badge.premium {
                        background: #fef3c7;
                        color: #d97706;
                    }

                    .license-badge.enterprise {
                        background: #dcfce7;
                        color: #16a34a;
                    }

                    .security-badge {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        color: #10b981;
                        font-size: 0.875rem;
                    }

                    /* Section spéciale (admin) */
                    .special-section {
                        background: #f8fafc;
                        border: 2px solid #e0e7ff;
                    }

                    .advanced-tools {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .tool-button {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px;
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        text-decoration: none;
                        color: inherit;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        font-family: inherit;
                        font-size: inherit;
                        width: 100%;
                        text-align: left;
                    }

                    .tool-button:hover {
                        border-color: #4F46E5;
                        box-shadow: 0 4px 6px rgba(79, 70, 229, 0.1);
                        transform: translateY(-2px);
                    }

                    .tool-icon {
                        width: 48px;
                        height: 48px;
                        background: #e0e7ff;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #4F46E5;
                        flex-shrink: 0;
                    }

                    .tool-content {
                        flex: 1;
                    }

                    .tool-content strong {
                        display: block;
                        font-size: 1rem;
                        color: #1f2937;
                        margin-bottom: 4px;
                    }

                    .tool-content small {
                        display: block;
                        font-size: 0.875rem;
                        color: #6b7280;
                    }

                    .analytics-button:hover .tool-icon {
                        background: #dcfce7;
                        color: #16a34a;
                    }

                    /* Actions */
                    .actions-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 12px;
                    }

                    .action-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 12px 20px;
                        background: #f3f4f6;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        color: #1f2937;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-size: 0.875rem;
                    }

                    .action-button:hover {
                        background: #e5e7eb;
                        border-color: #d1d5db;
                        transform: translateY(-2px);
                    }

                    .action-button.danger {
                        background: #fee2e2;
                        border-color: #fecaca;
                        color: #dc2626;
                    }

                    .action-button.danger:hover {
                        background: #fecaca;
                        border-color: #fca5a5;
                    }

                    /* Footer */
                    .profile-footer {
                        text-align: center;
                        padding: 20px;
                        color: #6b7280;
                        font-size: 0.875rem;
                    }

                    .profile-footer a {
                        color: #4F46E5;
                        text-decoration: none;
                    }

                    .profile-footer a:hover {
                        text-decoration: underline;
                    }

                    /* Responsive */
                    @media (max-width: 768px) {
                        .profile-container {
                            padding: 20px 15px;
                        }

                        .user-card {
                            flex-direction: column;
                            text-align: center;
                        }

                        .user-meta {
                            justify-content: center;
                        }

                        .info-grid {
                            grid-template-columns: 1fr;
                        }

                        .stats-grid {
                            grid-template-columns: 1fr;
                        }

                        .info-item {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 8px;
                        }

                        .info-value {
                            text-align: left;
                        }

                        .actions-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        // Exporter les données
        async exportData() {
            try {
                if (window.uiManager) {
                    window.uiManager.showToast('Préparation de l\'export...', 'info');
                }

                const exportData = {
                    user: {
                        firstName: this.companyInfo?.firstName,
                        lastName: this.companyInfo?.lastName,
                        fullName: this.companyInfo?.fullName,
                        email: this.companyInfo?.email,
                        company: this.companyInfo?.company,
                        provider: this.user?.provider
                    },
                    statistics: this.stats,
                    emails: JSON.parse(localStorage.getItem('emailsData') || '[]'),
                    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
                    categories: JSON.parse(localStorage.getItem('customCategories') || '[]'),
                    scanHistory: JSON.parse(localStorage.getItem('scanHistory') || '[]'),
                    exportDate: new Date().toISOString()
                };

                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `emailsortpro-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (window.uiManager) {
                    window.uiManager.showToast('Export terminé avec succès', 'success');
                }
            } catch (error) {
                console.error('[PROFILE] Export error:', error);
                if (window.uiManager) {
                    window.uiManager.showToast('Erreur lors de l\'export', 'error');
                }
            }
        }

        // Vider le cache
        clearCache() {
            if (confirm('Êtes-vous sûr de vouloir vider le cache ? Cela supprimera les données temporaires mais conservera vos tâches et paramètres.')) {
                try {
                    // Garder les données importantes
                    const important = {
                        tasks: localStorage.getItem('tasks'),
                        customCategories: localStorage.getItem('customCategories'),
                        firstLoginDate: localStorage.getItem('firstLoginDate'),
                        emailsortpro_client_id: localStorage.getItem('emailsortpro_client_id'),
                        scanHistory: localStorage.getItem('scanHistory')
                    };

                    // Nettoyer les données temporaires
                    localStorage.removeItem('emailsData');
                    localStorage.removeItem('scanProgress');
                    localStorage.removeItem('lastSyncTime');

                    // Restaurer les données importantes
                    Object.entries(important).forEach(([key, value]) => {
                        if (value) localStorage.setItem(key, value);
                    });

                    if (window.uiManager) {
                        window.uiManager.showToast('Cache vidé avec succès', 'success');
                    }

                    // Recharger les stats
                    this.loadStats().then(() => this.render());
                } catch (error) {
                    console.error('[PROFILE] Clear cache error:', error);
                    if (window.uiManager) {
                        window.uiManager.showToast('Erreur lors du nettoyage du cache', 'error');
                    }
                }
            }
        }

        // Afficher les informations système (admin)
        showSystemInfo() {
            const services = window.checkServices ? window.checkServices() : {};
            
            const info = `
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 0.875rem;">
                    <h4 style="margin: 0 0 16px 0; font-family: inherit;">État des services</h4>
                    ${Object.entries(services).map(([key, value]) => {
                        if (typeof value === 'object') {
                            return `<div><strong>${key}:</strong> ${JSON.stringify(value, null, 2)}</div>`;
                        }
                        return `<div><strong>${key}:</strong> ${value}</div>`;
                    }).join('')}
                    <div style="margin-top: 16px;">
                        <strong>Version:</strong> 3.0.2<br>
                        <strong>Build:</strong> ${new Date().toISOString()}<br>
                        <strong>Environment:</strong> ${window.location.hostname}
                    </div>
                </div>
            `;

            if (window.uiManager && window.uiManager.showModal) {
                window.uiManager.showModal('Informations système', info);
            } else {
                alert('Informations système:\n\n' + JSON.stringify(services, null, 2));
            }
        }
    }

    // Créer une instance globale
    window.profilePage = new ProfilePage();

    // Exporter pour PageManager
    window.ProfilePage = ProfilePage;

    console.log('[PROFILE] ✅ Profile module loaded successfully');
})();
