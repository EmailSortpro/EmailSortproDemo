// StartScan.js - Version 11.2 - EMAILS RÉELS FORCÉS - Suppression mode simulation

console.log('[StartScan] 🚀 Loading StartScan.js v11.2 - EMAILS RÉELS FORCÉS...');

class MinimalScanModule {
    constructor() {
        this.isInitialized = false;
        this.scanInProgress = false;
        this.selectedDays = 7;
        this.stylesAdded = false;
        this.scanStartTime = null;
        this.scanResults = null;
        
        // Intégration avec les paramètres
        this.settings = {};
        this.taskPreselectedCategories = [];
        this.lastSettingsSync = 0;
        
        // Configuration EMAILS RÉELS UNIQUEMENT
        this.scanConfig = {
            forceRealEmails: true,          // FORCÉ
            allowSimulation: false,         // INTERDIT
            requireAuthentication: true,    // OBLIGATOIRE
            maxRealEmails: 200,
            minRealEmails: 1               // Au moins 1 email réel requis
        };
        
        console.log('[MinimalScan] ✅ Scanner v11.2 - EMAILS RÉELS FORCÉS, simulation INTERDITE');
        this.loadSettingsFromStorage();
        this.addMinimalStyles();
    }

    // ================================================
    // INTÉGRATION AVEC STOCKAGE WEB
    // ================================================
    loadSettingsFromStorage() {
        try {
            // Priorité 1: CategoryManager si disponible
            if (window.categoryManager && typeof window.categoryManager.getSettings === 'function') {
                this.settings = window.categoryManager.getSettings();
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[MinimalScan] ✅ Paramètres chargés depuis CategoryManager');
                
                if (this.settings.scanSettings?.defaultPeriod) {
                    this.selectedDays = this.settings.scanSettings.defaultPeriod;
                }
            } else {
                // Priorité 2: localStorage pour environnement web
                this.loadFromLocalStorage();
            }
            
            this.lastSettingsSync = Date.now();
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur chargement paramètres:', error);
            this.settings = this.getDefaultSettings();
            this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('categorySettings');
            if (saved) {
                this.settings = JSON.parse(saved);
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[MinimalScan] 📦 Paramètres chargés depuis localStorage');
                
                if (this.settings.scanSettings?.defaultPeriod) {
                    this.selectedDays = this.settings.scanSettings.defaultPeriod;
                }
            } else {
                this.settings = this.getDefaultSettings();
                this.taskPreselectedCategories = [];
            }
        } catch (error) {
            console.warn('[MinimalScan] ⚠️ Erreur localStorage:', error);
            this.settings = this.getDefaultSettings();
            this.taskPreselectedCategories = [];
        }
    }

    getDefaultSettings() {
        return {
            scanSettings: {
                defaultPeriod: 7,
                defaultFolder: 'inbox',
                autoAnalyze: true,
                autoCategrize: true,
                forceRealEmails: true,        // FORCÉ
                allowSimulation: false        // INTERDIT
            },
            taskPreselectedCategories: ['tasks', 'commercial', 'meetings'],
            preferences: {
                excludeSpam: true,
                detectCC: true,
                showNotifications: true,
                realEmailsOnly: true          // FORCÉ
            }
        };
    }

    checkSettingsUpdate() {
        const now = Date.now();
        if (now - this.lastSettingsSync < 5000) return;
        
        try {
            const oldTaskCategories = [...this.taskPreselectedCategories];
            const oldSelectedDays = this.selectedDays;
            
            this.loadSettingsFromStorage();
            
            const categoriesChanged = JSON.stringify(oldTaskCategories.sort()) !== 
                                     JSON.stringify([...this.taskPreselectedCategories].sort());
            const daysChanged = oldSelectedDays !== this.selectedDays;
            
            if (categoriesChanged || daysChanged) {
                console.log('[MinimalScan] 🔄 Paramètres mis à jour détectés');
                this.updateUIWithNewSettings();
            }
        } catch (error) {
            console.error('[MinimalScan] Erreur vérification paramètres:', error);
        }
    }

    updateUIWithNewSettings() {
        // Mettre à jour la sélection de durée
        const durationOptions = document.querySelectorAll('.duration-option');
        durationOptions.forEach(option => {
            option.classList.remove('selected');
            if (parseInt(option.dataset.days) === this.selectedDays) {
                option.classList.add('selected');
            }
        });
        
        // Mettre à jour l'affichage des catégories
        this.updatePreselectedCategoriesDisplay();
    }

    updatePreselectedCategoriesDisplay() {
        const display = document.getElementById('preselected-categories-display');
        if (!display) return;
        
        // Vérifier disponibilité emails réels - OBLIGATOIRE
        const authStatus = this.checkRealEmailAuthentication();
        
        if (this.taskPreselectedCategories.length === 0) {
            display.innerHTML = `
                <div class="preselected-info ${authStatus.valid ? 'real-emails' : 'auth-required'}">
                    <i class="fas ${authStatus.valid ? 'fa-envelope' : 'fa-exclamation-triangle'}"></i>
                    <span>${authStatus.valid ? 'Scan emails réels - Analyse intelligente' : 'AUTHENTIFICATION REQUISE pour emails réels'}</span>
                </div>
            `;
        } else {
            const categoryDetails = this.getCompatibleCategories();
            
            display.innerHTML = `
                <div class="preselected-info ${authStatus.valid ? 'real-emails' : 'auth-required'}">
                    <i class="fas ${authStatus.valid ? 'fa-star' : 'fa-exclamation-triangle'}"></i>
                    <span>Catégories pré-sélectionnées ${authStatus.valid ? '(emails réels)' : '(AUTHENTIFICATION REQUISE)'}:</span>
                </div>
                <div class="preselected-categories-grid">
                    ${categoryDetails.map(cat => `
                        <div class="preselected-category-badge" style="background: ${cat.color}20; border-color: ${cat.color};">
                            <span class="category-icon">${cat.icon}</span>
                            <span class="category-name">${cat.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    getCompatibleCategories() {
        // Catégories par défaut
        const defaultCategories = {
            'tasks': { icon: '✅', name: 'Tâches', color: '#10b981' },
            'commercial': { icon: '💼', name: 'Commercial', color: '#3b82f6' },
            'meetings': { icon: '🤝', name: 'Réunions', color: '#8b5cf6' },
            'finance': { icon: '💰', name: 'Finance', color: '#f59e0b' },
            'personal': { icon: '👤', name: 'Personnel', color: '#06b6d4' }
        };

        return this.taskPreselectedCategories.map(catId => {
            // Priorité au CategoryManager si disponible
            if (window.categoryManager?.getCategory) {
                const category = window.categoryManager.getCategory(catId);
                if (category) return category;
            }
            
            // Sinon utiliser les catégories par défaut
            return defaultCategories[catId] || { 
                icon: '📂', 
                name: catId, 
                color: '#6b7280' 
            };
        }).filter(Boolean);
    }

    checkRealEmailAuthentication() {
        console.log('[MinimalScan] 🔍 Vérification authentification emails réels...');
        
        // Vérifier MailService en priorité
        if (window.mailService) {
            const isValid = window.mailService.isAuthenticationValid?.() || false;
            const hasReal = window.mailService.hasRealEmails?.() || false;
            
            console.log('[MinimalScan] MailService auth:', isValid, 'real emails:', hasReal);
            
            if (isValid && hasReal) {
                return { valid: true, source: 'MailService', provider: window.mailService.getProvider?.() };
            }
        }
        
        // Vérifier AuthService Microsoft
        if (window.authService) {
            try {
                const isAuth = window.authService.isAuthenticated?.() || false;
                console.log('[MinimalScan] Microsoft auth:', isAuth);
                
                if (isAuth) {
                    return { valid: true, source: 'Microsoft', provider: 'microsoft' };
                }
            } catch (error) {
                console.warn('[MinimalScan] Erreur test Microsoft:', error);
            }
        }
        
        // Vérifier Google Auth
        if (window.googleAuthService) {
            try {
                const isAuth = window.googleAuthService.isAuthenticated?.() || false;
                console.log('[MinimalScan] Google auth:', isAuth);
                
                if (isAuth) {
                    return { valid: true, source: 'Google', provider: 'google' };
                }
            } catch (error) {
                console.warn('[MinimalScan] Erreur test Google:', error);
            }
        }
        
        console.log('[MinimalScan] ❌ Aucune authentification valide trouvée');
        return { 
            valid: false, 
            reason: 'Aucune authentification détectée',
            available: {
                mailService: !!window.mailService,
                microsoft: !!window.authService,
                google: !!window.googleAuthService
            }
        };
    }

    addMinimalStyles() {
        if (this.stylesAdded || document.getElementById('minimal-scan-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'minimal-scan-styles';
        styles.textContent = `
            /* Scanner v11.2 - EMAILS RÉELS FORCÉS */
            .minimal-scanner {
                height: calc(100vh - 140px);
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                overflow: hidden;
                position: relative;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            }
            
            .scanner-card-minimal {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 50px;
                width: 100%;
                max-width: 700px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: fadeIn 0.5s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .scanner-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 25px;
                color: white;
                font-size: 32px;
            }
            
            .scanner-title {
                font-size: 32px;
                font-weight: 600;
                color: #1a1a2e;
                margin-bottom: 12px;
            }
            
            .scanner-subtitle {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 35px;
            }
            
            /* Mode badge pour emails réels */
            .email-mode-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 20px;
                border: 2px solid;
            }
            
            .email-mode-badge.real {
                background: rgba(16, 185, 129, 0.1);
                color: #059669;
                border-color: rgba(16, 185, 129, 0.3);
            }
            
            .email-mode-badge.auth-required {
                background: rgba(239, 68, 68, 0.1);
                color: #dc2626;
                border-color: rgba(239, 68, 68, 0.3);
            }
            
            /* Info pré-sélectionnées */
            #preselected-categories-display {
                margin: 20px 0;
            }
            
            .preselected-info {
                border-radius: 12px;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 500;
                text-align: left;
                margin-bottom: 12px;
                border: 2px solid;
            }
            
            .preselected-info.real-emails {
                background: rgba(16, 185, 129, 0.1);
                border-color: rgba(16, 185, 129, 0.3);
                color: #059669;
            }
            
            .preselected-info.auth-required {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
                color: #dc2626;
            }
            
            .preselected-categories-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }
            
            .preselected-category-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                border: 2px solid;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s ease;
            }
            
            .preselected-category-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            /* Étapes visuelles */
            .steps-container {
                display: flex;
                justify-content: space-between;
                margin-bottom: 35px;
                padding: 0 20px;
            }
            
            .step {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
                position: relative;
            }
            
            .step:not(:last-child)::after {
                content: '';
                position: absolute;
                top: 20px;
                right: -50%;
                width: 100%;
                height: 2px;
                background: #e5e7eb;
                z-index: 1;
            }
            
            .step-number {
                width: 40px;
                height: 40px;
                background: #e5e7eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 600;
                color: #9ca3af;
                margin-bottom: 12px;
                position: relative;
                z-index: 2;
                transition: all 0.3s ease;
            }
            
            .step.active .step-number {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
            }
            
            .step-label {
                font-size: 14px;
                color: #6b7280;
                text-align: center;
                max-width: 80px;
                font-weight: 500;
            }
            
            .step.active .step-label {
                color: #059669;
                font-weight: 600;
            }
            
            /* Sélecteur de durée */
            .duration-section {
                margin-bottom: 35px;
            }
            
            .duration-label {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 20px;
            }
            
            .duration-options {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .duration-option {
                padding: 12px 20px;
                border: 2px solid #e5e7eb;
                background: white;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 500;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 85px;
                position: relative;
            }
            
            .duration-option.selected {
                border-color: #059669;
                background: #059669;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }
            
            .duration-option:hover:not(.selected) {
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            /* Bouton de scan */
            .scan-button-minimal {
                width: 100%;
                height: 60px;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border: none;
                border-radius: 15px;
                color: white;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 25px;
                position: relative;
                overflow: hidden;
            }
            
            .scan-button-minimal:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
            }
            
            .scan-button-minimal:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                background: #9ca3af;
            }
            
            .scan-button-minimal.auth-required {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            }
            
            .scan-button-minimal.auth-required:hover:not(:disabled) {
                box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
            }
            
            /* Badge de résultat */
            .success-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #059669;
                color: white;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: 700;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
            }
            
            /* Section de progression */
            .progress-section-minimal {
                opacity: 0;
                transition: opacity 0.3s ease;
                margin-top: 20px;
            }
            
            .progress-section-minimal.visible {
                opacity: 1;
            }
            
            .progress-bar-minimal {
                width: 100%;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #059669 0%, #10b981 100%);
                width: 0%;
                transition: width 0.5s ease;
            }
            
            .progress-text {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .progress-status {
                font-size: 14px;
                color: #9ca3af;
            }
            
            /* Info badge */
            .scan-info {
                background: rgba(5, 150, 105, 0.1);
                border-radius: 10px;
                padding: 15px;
                font-size: 14px;
                color: #059669;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 500;
                flex-direction: column;
                border: 2px solid rgba(5, 150, 105, 0.2);
            }
            
            .scan-info.auth-required {
                background: rgba(239, 68, 68, 0.1);
                color: #dc2626;
                border-color: rgba(239, 68, 68, 0.2);
            }
            
            .scan-info-main {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .scan-info-details {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
                text-align: center;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .scanner-card-minimal {
                    padding: 35px 25px;
                }
                
                .scanner-title {
                    font-size: 28px;
                }
                
                .scanner-subtitle {
                    font-size: 16px;
                }
                
                .duration-option {
                    padding: 10px 16px;
                    font-size: 13px;
                    min-width: 75px;
                }
                
                .steps-container {
                    padding: 0 10px;
                }
            }
            
            @media (max-width: 480px) {
                .preselected-categories-grid {
                    gap: 6px;
                }
                
                .preselected-category-badge {
                    font-size: 12px;
                    padding: 6px 10px;
                }
            }
        `;
        
        document.head.appendChild(styles);
        this.stylesAdded = true;
        console.log('[MinimalScan] ✅ Styles v11.2 ajoutés - EMAILS RÉELS');
    }

    async render(container) {
        console.log('[MinimalScan] 🎯 Rendu du scanner v11.2 - EMAILS RÉELS FORCÉS...');
        
        try {
            this.addMinimalStyles();
            this.checkSettingsUpdate();
            
            container.innerHTML = this.renderScanner();
            this.initializeEvents();
            this.isInitialized = true;
            
            console.log('[MinimalScan] ✅ Scanner v11.2 rendu - EMAILS RÉELS UNIQUEMENT');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur lors du rendu:', error);
            container.innerHTML = this.renderError(error);
        }
    }

    renderScanner() {
        const authStatus = this.checkRealEmailAuthentication();
        
        return `
            <div class="minimal-scanner">
                <div class="scanner-card-minimal">
                    <div class="email-mode-badge ${authStatus.valid ? 'real' : 'auth-required'}">
                        <i class="fas ${authStatus.valid ? 'fa-envelope' : 'fa-exclamation-triangle'}"></i>
                        <span>${authStatus.valid ? 'Emails réels authentifiés' : 'AUTHENTIFICATION REQUISE'}</span>
                    </div>
                    
                    <div class="scanner-icon">
                        <i class="fas ${authStatus.valid ? 'fa-envelope' : 'fa-lock'}"></i>
                    </div>
                    
                    <h1 class="scanner-title">Scanner Emails Réels</h1>
                    <p class="scanner-subtitle">${authStatus.valid ? 'Analysez vos emails authentifiés avec IA' : 'Authentification requise pour accéder aux emails'}</p>
                    
                    <div id="preselected-categories-display">
                        ${this.renderPreselectedCategories()}
                    </div>
                    
                    <div class="steps-container">
                        <div class="step active" id="step1">
                            <div class="step-number">1</div>
                            <div class="step-label">${authStatus.valid ? 'Configuration' : 'Authentification'}</div>
                        </div>
                        <div class="step" id="step2">
                            <div class="step-number">2</div>
                            <div class="step-label">Récupération</div>
                        </div>
                        <div class="step" id="step3">
                            <div class="step-number">3</div>
                            <div class="step-label">Analyse IA</div>
                        </div>
                    </div>
                    
                    ${authStatus.valid ? this.renderAuthenticatedInterface() : this.renderAuthenticationRequired(authStatus)}
                    
                    ${this.renderScanInfo(authStatus)}
                </div>
            </div>
        `;
    }

    renderAuthenticatedInterface() {
        return `
            <div class="duration-section">
                <div class="duration-label">Période d'analyse</div>
                <div class="duration-options">
                    ${this.renderDurationOptions()}
                </div>
            </div>
            
            <button class="scan-button-minimal" id="minimalScanBtn" onclick="window.minimalScanModule.startRealEmailsScan()">
                <i class="fas fa-envelope"></i>
                <span>Scanner mes emails réels</span>
            </button>
            
            <div class="progress-section-minimal" id="progressSection">
                <div class="progress-bar-minimal">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">Initialisation...</div>
                <div class="progress-status" id="progressStatus">Préparation</div>
            </div>
        `;
    }

    renderAuthenticationRequired(authStatus) {
        return `
            <div class="auth-required-section">
                <button class="scan-button-minimal auth-required" onclick="window.minimalScanModule.handleAuthentication()">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Se connecter pour accéder aux emails</span>
                </button>
                
                <div class="auth-details">
                    <p><strong>Services disponibles:</strong></p>
                    <ul>
                        ${authStatus.available.microsoft ? '✅ Microsoft Outlook/Exchange' : '❌ Microsoft Outlook/Exchange'}
                        ${authStatus.available.google ? '✅ Google Gmail' : '❌ Google Gmail'}
                        ${authStatus.available.mailService ? '✅ MailService' : '❌ MailService'}
                    </ul>
                    <p><em>Raison: ${authStatus.reason}</em></p>
                </div>
            </div>
        `;
    }

    renderPreselectedCategories() {
        const authStatus = this.checkRealEmailAuthentication();
        
        if (this.taskPreselectedCategories.length === 0) {
            return `
                <div class="preselected-info ${authStatus.valid ? 'real-emails' : 'auth-required'}">
                    <i class="fas ${authStatus.valid ? 'fa-info-circle' : 'fa-exclamation-triangle'}"></i>
                    <span>${authStatus.valid ? 'Analyse intelligente complète activée' : 'AUTHENTIFICATION REQUISE pour emails réels'}</span>
                </div>
            `;
        }
        
        const categoryDetails = this.getCompatibleCategories();
        
        return `
            <div class="preselected-info ${authStatus.valid ? 'real-emails' : 'auth-required'}">
                <i class="fas ${authStatus.valid ? 'fa-star' : 'fa-exclamation-triangle'}"></i>
                <span>Catégories d'analyse ${authStatus.valid ? '(emails réels)' : '(AUTHENTIFICATION REQUISE)'}:</span>
            </div>
            <div class="preselected-categories-grid">
                ${categoryDetails.map(cat => `
                    <div class="preselected-category-badge" style="background: ${cat.color}20; border-color: ${cat.color};">
                        <span class="category-icon">${cat.icon}</span>
                        <span class="category-name">${cat.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDurationOptions() {
        const options = [
            { value: 1, label: '1 jour' },
            { value: 3, label: '3 jours' },
            { value: 7, label: '7 jours' },
            { value: 15, label: '15 jours' },
            { value: 30, label: '30 jours' }
        ];
        
        return options.map(option => {
            const isSelected = option.value === this.selectedDays;
            return `
                <button class="duration-option ${isSelected ? 'selected' : ''}" 
                        onclick="window.minimalScanModule.selectDuration(${option.value})" 
                        data-days="${option.value}">
                    ${option.label}
                </button>
            `;
        }).join('');
    }

    renderScanInfo(authStatus) {
        if (!authStatus.valid) {
            return `
                <div class="scan-info auth-required">
                    <div class="scan-info-main">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Authentification requise pour accéder aux emails réels</span>
                    </div>
                    <div class="scan-info-details">AUCUNE simulation • Emails authentifiés uniquement</div>
                </div>
            `;
        }

        let details = [];
        details.push(`Emails ${authStatus.provider} authentifiés`);
        
        if (this.taskPreselectedCategories.length > 0) {
            details.push(`${this.taskPreselectedCategories.length} catégorie(s) IA`);
        }
        
        details.push('Synchronisation EmailScanner');
        
        return `
            <div class="scan-info">
                <div class="scan-info-main">
                    <i class="fas fa-shield-check"></i>
                    <span>Scan sécurisé avec IA Claude - EMAILS RÉELS UNIQUEMENT</span>
                </div>
                <div class="scan-info-details">${details.join(' • ')}</div>
            </div>
        `;
    }

    renderError(error) {
        return `
            <div class="minimal-scanner">
                <div class="scanner-card-minimal">
                    <div class="scanner-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1 class="scanner-title">Erreur</h1>
                    <p class="scanner-subtitle">${error.message}</p>
                    
                    <button class="scan-button-minimal" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i>
                        <span>Réessayer</span>
                    </button>
                </div>
            </div>
        `;
    }

    initializeEvents() {
        console.log('[MinimalScan] ✅ Événements v11.2 initialisés - EMAILS RÉELS');
        
        if (this.settingsCheckInterval) {
            clearInterval(this.settingsCheckInterval);
        }
        
        // Vérification périodique des paramètres
        this.settingsCheckInterval = setInterval(() => {
            this.checkSettingsUpdate();
        }, 10000);
    }

    selectDuration(days) {
        this.selectedDays = days;
        
        document.querySelectorAll('.duration-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`[data-days="${days}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
        
        console.log(`[MinimalScan] ✅ Durée sélectionnée: ${days} jours`);
    }

    async handleAuthentication() {
        console.log('[MinimalScan] 🔐 Gestion authentification...');
        
        try {
            // Essayer Microsoft en premier
            if (window.authService && typeof window.authService.login === 'function') {
                console.log('[MinimalScan] Tentative connexion Microsoft...');
                await window.authService.login();
                return;
            }
            
            // Essayer Google ensuite
            if (window.googleAuthService && typeof window.googleAuthService.signIn === 'function') {
                console.log('[MinimalScan] Tentative connexion Google...');
                await window.googleAuthService.signIn();
                return;
            }
            
            // Si aucun service disponible
            console.error('[MinimalScan] Aucun service d\'authentification disponible');
            this.showAuthError('Aucun service d\'authentification configuré');
            
        } catch (error) {
            console.error('[MinimalScan] Erreur authentification:', error);
            this.showAuthError('Erreur lors de la connexion: ' + error.message);
        }
    }

    showAuthError(message) {
        const container = document.querySelector('.scanner-card-minimal');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'auth-error';
            errorDiv.style.cssText = `
                background: rgba(239, 68, 68, 0.1);
                border: 2px solid rgba(239, 68, 68, 0.3);
                color: #dc2626;
                padding: 12px;
                border-radius: 8px;
                margin-top: 20px;
                font-weight: 500;
            `;
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            container.appendChild(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    async startRealEmailsScan() {
        if (this.scanInProgress) {
            console.log('[MinimalScan] Scan déjà en cours');
            return;
        }
        
        console.log('[MinimalScan] 🚀 === DÉMARRAGE SCAN EMAILS RÉELS v11.2 ===');
        console.log('[MinimalScan] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        
        // VÉRIFICATION STRICTE - AUTHENTIFICATION OBLIGATOIRE
        const authStatus = this.checkRealEmailAuthentication();
        if (!authStatus.valid) {
            console.error('[MinimalScan] ❌ AUTHENTIFICATION NON VALIDE - ARRÊT SCAN');
            this.showAuthError('Authentification requise pour scanner les emails réels');
            return;
        }
        
        try {
            this.scanInProgress = true;
            this.scanStartTime = Date.now();
            
            this.setActiveStep(2);
            
            const progressSection = document.getElementById('progressSection');
            if (progressSection) {
                progressSection.classList.add('visible');
            }
            
            const scanBtn = document.getElementById('minimalScanBtn');
            if (scanBtn) {
                scanBtn.disabled = true;
                scanBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Scan emails réels en cours...</span>`;
            }
            
            // SCAN EMAILS RÉELS UNIQUEMENT
            await this.executeRealEmailsScan();
            
            this.setActiveStep(3);
            this.completeScan();
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur scan emails réels:', error);
            this.showScanError(error);
        }
    }

    async executeRealEmailsScan() {
        console.log('[MinimalScan] 📧 === EXÉCUTION SCAN EMAILS RÉELS ===');
        
        const phases = [
            { progress: 10, message: 'Vérification authentification...', status: 'Authentification' },
            { progress: 25, message: 'Connexion service email...', status: 'Connexion' },
            { progress: 40, message: 'Récupération emails réels...', status: 'Téléchargement' },
            { progress: 60, message: 'Synchronisation EmailScanner...', status: 'Synchronisation' },
            { progress: 80, message: 'Classification par IA...', status: 'Analyse IA' },
            { progress: 95, message: 'Finalisation...', status: 'Compilation' },
            { progress: 100, message: 'Scan emails réels terminé !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            if (phase.progress === 25) {
                await this.initializeMailService();
            } else if (phase.progress === 40) {
                await this.fetchRealEmails();
            } else if (phase.progress === 60) {
                await this.syncWithEmailScanner();
            } else if (phase.progress === 80) {
                await this.categorizeRealEmails();
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    async initializeMailService() {
        console.log('[MinimalScan] 🔧 Initialisation MailService...');
        
        if (!window.mailService) {
            throw new Error('MailService non disponible');
        }
        
        // Forcer l'initialisation avec vérification d'authentification
        if (!window.mailService.isInitialized) {
            console.log('[MinimalScan] 🔄 Initialisation MailService...');
            await window.mailService.initialize();
        }
        
        // Vérifier que l'authentification est valide
        if (!window.mailService.isAuthenticationValid()) {
            throw new Error('Authentification MailService invalide');
        }
        
        console.log('[MinimalScan] ✅ MailService initialisé et authentifié');
    }

    async fetchRealEmails() {
        console.log('[MinimalScan] 📧 Récupération emails RÉELS...');
        
        try {
            if (!window.mailService || !window.mailService.isAuthenticationValid()) {
                throw new Error('MailService non authentifié');
            }
            
            // Calculer les dates
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.selectedDays);
            
            console.log(`[MinimalScan] 📅 Période: ${startDate.toISOString().split('T')[0]} à ${endDate.toISOString().split('T')[0]}`);
            
            // Récupérer les emails RÉELS
            const emails = await window.mailService.getEmailsFromFolder('inbox', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                top: this.scanConfig.maxRealEmails || 200
            });
            
            if (!emails || emails.length === 0) {
                throw new Error('Aucun email réel trouvé dans la période spécifiée');
            }
            
            // VÉRIFICATION STRICTE - TOUS LES EMAILS DOIVENT ÊTRE RÉELS
            const realEmails = emails.filter(email => email.realEmail === true && email.webSimulated !== true);
            
            if (realEmails.length === 0) {
                throw new Error('Aucun email réel authentifié trouvé');
            }
            
            if (realEmails.length < this.scanConfig.minRealEmails) {
                throw new Error(`Nombre insuffisant d'emails réels (${realEmails.length} trouvé(s), minimum ${this.scanConfig.minRealEmails})`);
            }
            
            this.realEmails = realEmails;
            console.log(`[MinimalScan] ✅ ${this.realEmails.length} emails RÉELS authentifiés récupérés`);
            
            // Log détaillé pour vérification
            console.log('[MinimalScan] 📊 Échantillon emails récupérés:');
            this.realEmails.slice(0, 3).forEach((email, i) => {
                console.log(`[MinimalScan]   ${i+1}. ${email.subject} - Real: ${email.realEmail}, Simulated: ${email.webSimulated}`);
            });
            
            return this.realEmails;
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur récupération emails réels:', error);
            throw error;
        }
    }

    async syncWithEmailScanner() {
        console.log('[MinimalScan] 🔄 Synchronisation avec EmailScanner...');
        
        if (!window.emailScanner || !this.realEmails) {
            throw new Error('EmailScanner ou emails non disponibles pour synchronisation');
        }
        
        try {
            // Réinitialiser EmailScanner
            if (typeof window.emailScanner.reset === 'function') {
                window.emailScanner.reset();
            }
            
            // Injecter les emails RÉELS
            window.emailScanner.emails = [...this.realEmails];
            console.log(`[MinimalScan] ✅ ${this.realEmails.length} emails RÉELS injectés dans EmailScanner`);
            
            // Synchroniser les paramètres
            if (typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
                window.emailScanner.updateTaskPreselectedCategories(this.taskPreselectedCategories);
            }
            
            // Marquer la source et la nature des emails
            if (window.emailScanner.scanMetrics) {
                window.emailScanner.scanMetrics.startTime = this.scanStartTime;
                window.emailScanner.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
                window.emailScanner.scanMetrics.hasRealEmails = true;
                window.emailScanner.scanMetrics.source = 'StartScan-RealEmails';
                window.emailScanner.scanMetrics.simulationMode = false;
            }
            
            // Marquer l'état de synchronisation
            window.emailScanner.startScanSynced = true;
            window.emailScanner.lastSyncTimestamp = Date.now();
            
            console.log('[MinimalScan] ✅ Synchronisation EmailScanner complète - EMAILS RÉELS');
            return true;
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur synchronisation EmailScanner:', error);
            throw error;
        }
    }

    async categorizeRealEmails() {
        console.log('[MinimalScan] 🏷️ Catégorisation des emails RÉELS...');
        
        if (!window.emailScanner || !this.realEmails) {
            throw new Error('Données non disponibles pour catégorisation');
        }
        
        try {
            // Catégoriser via EmailScanner
            if (typeof window.emailScanner.categorizeEmails === 'function') {
                await window.emailScanner.categorizeEmails(this.taskPreselectedCategories);
                console.log('[MinimalScan] ✅ Catégorisation emails RÉELS effectuée');
            }
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur catégorisation emails réels:', error);
            throw error;
        }
    }

    generateResults() {
        const emailCount = this.realEmails?.length || 0;
        const preselectedCount = this.realEmails?.filter(e => 
            this.taskPreselectedCategories.includes(e.category)
        ).length || 0;
        
        this.scanResults = {
            success: true,
            total: emailCount,
            categorized: emailCount,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: { 
                preselectedForTasks: preselectedCount,
                taskSuggestions: Math.floor(preselectedCount * 0.8),
                highConfidence: Math.floor(emailCount * 0.7),
                hasRealEmails: true,
                emailType: 'real',
                simulationMode: false
            },
            breakdown: this.calculateBreakdown(),
            source: 'StartScan-RealEmails',
            scanMode: 'realEmailsOnly'
        };
        
        console.log('[MinimalScan] 📊 Résultats emails RÉELS générés:', this.scanResults);
    }

    calculateBreakdown() {
        if (!this.realEmails) return {};
        
        const breakdown = {};
        
        this.realEmails.forEach(email => {
            const category = email.category || 'other';
            breakdown[category] = (breakdown[category] || 0) + 1;
        });
        
        return breakdown;
    }

    completeScan() {
        this.generateResults();
        
        setTimeout(() => {
            const scanBtn = document.getElementById('minimalScanBtn');
            if (scanBtn) {
                const emailCount = this.scanResults?.total || 0;
                const preselectedCount = this.scanResults?.stats?.preselectedForTasks || 0;
                
                scanBtn.innerHTML = `<i class="fas fa-check"></i> <span>Emails réels analysés !</span>`;
                scanBtn.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
                
                if (emailCount > 0) {
                    scanBtn.style.position = 'relative';
                    scanBtn.insertAdjacentHTML('beforeend', `
                        <span class="success-badge">
                            📧 ${emailCount} ${preselectedCount > 0 ? `(${preselectedCount} ⭐)` : ''}
                        </span>
                    `);
                }
            }
            
            setTimeout(() => {
                this.redirectToResults();
            }, 1500);
        }, 500);
    }

    redirectToResults() {
        this.scanInProgress = false;
        
        const essentialResults = {
            success: true,
            total: this.scanResults?.total || 0,
            categorized: this.scanResults?.categorized || 0,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            preselectedForTasks: this.scanResults?.stats?.preselectedForTasks || 0,
            scanDuration: Math.floor((Date.now() - this.scanStartTime) / 1000),
            timestamp: Date.now(),
            hasRealEmails: true,
            emailType: 'real',
            simulationMode: false,
            source: 'StartScan-RealEmails'
        };
        
        try {
            localStorage.setItem('scanResults', JSON.stringify(essentialResults));
            console.log('[MinimalScan] 💾 Résultats emails RÉELS sauvegardés');
        } catch (error) {
            console.warn('[MinimalScan] Erreur stockage résultats:', error);
        }
        
        // Notification de succès
        this.showNotification(essentialResults);
        
        // Dispatcher les événements
        setTimeout(() => {
            this.dispatchEvents(essentialResults);
        }, 100);
        
        // Rediriger vers les emails
        setTimeout(() => {
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                window.pageManager.loadPage('emails');
            } else {
                this.showResultsInPlace(essentialResults);
            }
        }, 1000);
    }

    showNotification(results) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        const preselectedText = results.preselectedForTasks > 0 ? 
            `<br>⭐ ${results.preselectedForTasks} pré-sélectionnés` : '';
        
        notification.innerHTML = `
            📧 ${results.total} emails RÉELS analysés${preselectedText}
        `;
        
        document.body.appendChild(notification);
        
        // Animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 4000);
    }

    dispatchEvents(results) {
        try {
            // Événement de fin de scan
            window.dispatchEvent(new CustomEvent('scanCompleted', {
                detail: {
                    results: results,
                    emails: this.realEmails || [],
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: 'StartScan-RealEmails',
                    timestamp: Date.now(),
                    hasRealEmails: true,
                    simulationMode: false
                }
            }));
            
            // Événement de synchronisation EmailScanner
            window.dispatchEvent(new CustomEvent('emailScannerSynced', {
                detail: {
                    emailCount: results.total,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: 'StartScan-RealEmails',
                    timestamp: Date.now(),
                    hasRealEmails: true,
                    simulationMode: false
                }
            }));
            
            console.log('[MinimalScan] ✅ Événements emails RÉELS dispatchés');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur dispatch événements:', error);
        }
    }

    showResultsInPlace(results) {
        const container = document.querySelector('.scanner-card-minimal');
        if (!container) return;
        
        container.innerHTML = `
            <div class="scanner-icon" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                <i class="fas fa-envelope"></i>
            </div>
            
            <h1 class="scanner-title">Emails Réels Analysés !</h1>
            <p class="scanner-subtitle">Analyse IA complète de vos emails authentifiés</p>
            
            <div style="background: rgba(5, 150, 105, 0.1); border-radius: 15px; padding: 25px; margin: 25px 0; border: 2px solid rgba(5, 150, 105, 0.2);">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #059669;">${results.total}</div>
                        <div style="font-size: 14px; color: #6b7280;">Emails réels</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${results.categorized}</div>
                        <div style="font-size: 14px; color: #6b7280;">Catégorisés</div>
                    </div>
                    ${results.preselectedForTasks > 0 ? `
                        <div>
                            <div style="font-size: 28px; font-weight: 700; color: #8b5cf6;">⭐ ${results.preselectedForTasks}</div>
                            <div style="font-size: 14px; color: #6b7280;">Pré-sélectionnés</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="scan-button-minimal" onclick="window.minimalScanModule.resetScanner()" 
                        style="width: auto; padding: 0 24px; height: 50px;">
                    <i class="fas fa-redo"></i>
                    <span>Nouveau scan</span>
                </button>
                
                <button class="scan-button-minimal" onclick="window.pageManager?.loadPage('emails')" 
                        style="width: auto; padding: 0 24px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                    <i class="fas fa-envelope"></i>
                    <span>Voir les emails</span>
                </button>
            </div>
            
            <div class="scan-info" style="margin-top: 20px;">
                <div class="scan-info-main">
                    <i class="fas fa-envelope"></i>
                    <span>Analyse emails RÉELS avec IA Claude - AUCUNE simulation</span>
                </div>
                <div class="scan-info-details">Durée: ${results.scanDuration}s • Mode: Emails authentifiés • Synchronisé</div>
            </div>
        `;
    }

    showScanError(error) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="font-size: 16px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">Erreur de scan</div>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">${error.message}</div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="scan-button-minimal" onclick="window.minimalScanModule.resetScanner()" 
                                style="width: auto; padding: 0 20px; height: 40px; font-size: 14px;">
                            <i class="fas fa-redo"></i>
                            <span>Réessayer</span>
                        </button>
                        
                        <button class="scan-button-minimal auth-required" onclick="window.minimalScanModule.handleAuthentication()" 
                                style="width: auto; padding: 0 20px; height: 40px; font-size: 14px;">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Se connecter</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.scanInProgress = false;
    }

    resetScanner() {
        this.scanInProgress = false;
        this.scanResults = null;
        this.realEmails = null;
        
        this.setActiveStep(1);
        
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.classList.remove('visible');
            progressSection.innerHTML = `
                <div class="progress-bar-minimal">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">Initialisation...</div>
                <div class="progress-status" id="progressStatus">Préparation</div>
            `;
        }
        
        // Recharger l'interface complète
        const container = document.querySelector('.scanner-card-minimal');
        if (container) {
            container.outerHTML = this.renderScanner();
        }
        
        this.loadSettingsFromStorage();
        this.updatePreselectedCategoriesDisplay();
        
        console.log('[MinimalScan] 🔄 Scanner v11.2 réinitialisé - EMAILS RÉELS');
    }

    updateProgress(percent, text, status) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressStatus = document.getElementById('progressStatus');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = text;
        if (progressStatus) progressStatus.textContent = status;
    }

    setActiveStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        const activeStep = document.getElementById(`step${stepNumber}`);
        if (activeStep) {
            activeStep.classList.add('active');
        }
    }

    updateSettings(newSettings) {
        console.log('[MinimalScan] 📝 Mise à jour paramètres v11.2:', newSettings);
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.taskPreselectedCategories) {
            this.taskPreselectedCategories = [...newSettings.taskPreselectedCategories];
        }
        
        if (newSettings.scanSettings?.defaultPeriod) {
            this.selectedDays = newSettings.scanSettings.defaultPeriod;
        }
        
        // Sauvegarder en localStorage
        try {
            localStorage.setItem('categorySettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('[MinimalScan] Erreur sauvegarde localStorage:', error);
        }
        
        this.updateUIWithNewSettings();
    }

    getDebugInfo() {
        const authStatus = this.checkRealEmailAuthentication();
        
        return {
            version: '11.2',
            isInitialized: this.isInitialized,
            scanInProgress: this.scanInProgress,
            selectedDays: this.selectedDays,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            settings: this.settings,
            lastSettingsSync: this.lastSettingsSync,
            scanResults: this.scanResults,
            scanConfig: this.scanConfig,
            authStatus: authStatus,
            emailScanner: {
                available: !!window.emailScanner,
                emailCount: window.emailScanner?.emails?.length || 0
            },
            mailService: {
                available: !!window.mailService,
                authenticated: window.mailService?.isAuthenticationValid?.() || false,
                provider: window.mailService?.getProvider?.() || null
            }
        };
    }

    cleanup() {
        if (this.settingsCheckInterval) {
            clearInterval(this.settingsCheckInterval);
            this.settingsCheckInterval = null;
        }
        
        this.scanInProgress = false;
        this.isInitialized = false;
        this.scanResults = null;
        this.realEmails = null;
        
        console.log('[MinimalScan] 🧹 Nettoyage v11.2 terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        this.taskPreselectedCategories = [];
        console.log('[MinimalScan] Instance v11.2 détruite');
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================

// Nettoyer ancienne instance
if (window.minimalScanModule) {
    window.minimalScanModule.destroy?.();
}

// Créer nouvelle instance
window.MinimalScanModule = MinimalScanModule;
window.minimalScanModule = new MinimalScanModule();
window.scanStartModule = window.minimalScanModule;

// Fonctions utilitaires de debug
window.testScannerRealEmails = function() {
    console.group('🧪 TEST Scanner Emails RÉELS v11.2');
    const scanner = window.minimalScanModule;
    
    console.log('Configuration:', scanner.scanConfig);
    console.log('Auth Status:', scanner.checkRealEmailAuthentication());
    console.log('MailService disponible:', !!window.mailService);
    
    if (window.mailService) {
        console.log('MailService authentifié:', window.mailService.isAuthenticationValid?.());
        console.log('MailService provider:', window.mailService.getProvider?.());
    }
    
    console.log('Debug Info:', scanner.getDebugInfo());
    console.groupEnd();
    
    return { 
        success: true, 
        realEmailsForced: scanner.scanConfig.forceRealEmails,
        simulationAllowed: scanner.scanConfig.allowSimulation,
        authValid: scanner.checkRealEmailAuthentication().valid
    };
};

window.forceRealEmailScan = function() {
    if (window.minimalScanModule.scanInProgress) {
        console.log('Scan déjà en cours');
        return;
    }
    
    const authStatus = window.minimalScanModule.checkRealEmailAuthentication();
    console.log(`🚀 Démarrage scan forcé - Auth valide: ${authStatus.valid}`);
    
    if (!authStatus.valid) {
        console.error('❌ Authentification requise pour scan emails réels');
        return { success: false, reason: 'Authentification requise' };
    }
    
    window.minimalScanModule.startRealEmailsScan();
    return { success: true, mode: 'realEmailsOnly' };
};

// Auto-initialisation DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[MinimalScan] 📱 DOM prêt - Scanner v11.2 emails RÉELS forcés');
    });
} else {
    console.log('[MinimalScan] 📱 Scanner v11.2 emails RÉELS forcés prêt');
}

console.log('✅ StartScan v11.2 loaded - EMAILS RÉELS FORCÉS, simulation INTERDITE');
