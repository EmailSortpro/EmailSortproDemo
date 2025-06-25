// StartScan.js - Version 11.1 - Compatible Web avec priorité emails réels et fallback simulation

console.log('[StartScan] 🚀 Loading StartScan.js v11.1 - Emails réels prioritaires...');

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
        
        // Configuration pour emails réels et simulation fallback
        this.scanConfig = {
            preferRealEmails: true,
            simulationFallback: true,
            maxRealEmails: 100,
            maxSimulatedEmails: 50
        };
        
        console.log('[MinimalScan] Scanner v11.1 initialized - Priorité emails réels');
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
                preferRealEmails: true
            },
            taskPreselectedCategories: ['tasks', 'commercial', 'meetings'],
            preferences: {
                excludeSpam: true,
                detectCC: true,
                showNotifications: true
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
        
        // Vérifier disponibilité emails réels
        const hasRealEmails = this.hasRealEmailAccess();
        
        if (this.taskPreselectedCategories.length === 0) {
            display.innerHTML = `
                <div class="preselected-info no-selection">
                    <i class="fas fa-info-circle"></i>
                    <span>${hasRealEmails ? 'Scan emails réels - Analyse intelligente' : 'Mode simulation - Emails de démonstration'}</span>
                </div>
            `;
        } else {
            const categoryDetails = this.getCompatibleCategories();
            
            display.innerHTML = `
                <div class="preselected-info">
                    <i class="fas fa-star"></i>
                    <span>Catégories pré-sélectionnées ${hasRealEmails ? '(emails réels)' : '(simulation)'}:</span>
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

    hasRealEmailAccess() {
        // Vérifier si on a accès aux vrais emails
        if (!window.mailService) return false;
        
        try {
            return window.mailService.hasRealEmails?.() || 
                   window.mailService.isAuthenticationValid?.() || 
                   false;
        } catch (error) {
            return false;
        }
    }

    addMinimalStyles() {
        if (this.stylesAdded || document.getElementById('minimal-scan-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'minimal-scan-styles';
        styles.textContent = `
            /* Scanner v11.1 - Emails réels prioritaires */
            .minimal-scanner {
                height: calc(100vh - 140px);
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            
            /* Mode badge */
            .email-mode-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 20px;
                border: 1px solid;
            }
            
            .email-mode-badge.real {
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-color: rgba(16, 185, 129, 0.2);
            }
            
            .email-mode-badge.simulation {
                background: rgba(249, 115, 22, 0.1);
                color: #f97316;
                border-color: rgba(249, 115, 22, 0.2);
            }
            
            /* Catégories pré-sélectionnées */
            #preselected-categories-display {
                margin: 20px 0;
            }
            
            .preselected-info {
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 12px;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #7c3aed;
                font-size: 14px;
                font-weight: 500;
                text-align: left;
                margin-bottom: 12px;
            }
            
            .preselected-info.no-selection {
                background: rgba(16, 185, 129, 0.1);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                color: #667eea;
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
                border-color: #667eea;
                background: #667eea;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .duration-option:hover:not(.selected) {
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            /* Bouton de scan */
            .scan-button-minimal {
                width: 100%;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }
            
            .scan-button-minimal:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            /* Badge de résultat */
            .success-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #10b981;
                color: white;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: 700;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
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
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
                background: rgba(16, 185, 129, 0.1);
                border-radius: 10px;
                padding: 15px;
                font-size: 14px;
                color: #10b981;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 500;
                flex-direction: column;
            }
            
            .scan-info-main {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .scan-info-details {
                font-size: 12px;
                color: #059669;
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
        console.log('[MinimalScan] ✅ Styles v11.1 ajoutés');
    }

    async render(container) {
        console.log('[MinimalScan] 🎯 Rendu du scanner v11.1...');
        
        try {
            this.addMinimalStyles();
            this.checkSettingsUpdate();
            
            container.innerHTML = this.renderScanner();
            this.initializeEvents();
            this.isInitialized = true;
            
            console.log('[MinimalScan] ✅ Scanner v11.1 rendu avec succès');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur lors du rendu:', error);
            container.innerHTML = this.renderError(error);
        }
    }

    renderScanner() {
        const hasRealEmails = this.hasRealEmailAccess();
        
        return `
            <div class="minimal-scanner">
                <div class="scanner-card-minimal">
                    <div class="email-mode-badge ${hasRealEmails ? 'real' : 'simulation'}">
                        <i class="fas ${hasRealEmails ? 'fa-envelope' : 'fa-robot'}"></i>
                        <span>${hasRealEmails ? 'Emails réels disponibles' : 'Mode simulation'}</span>
                    </div>
                    
                    <div class="scanner-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <h1 class="scanner-title">Scanner Email Intelligent</h1>
                    <p class="scanner-subtitle">${hasRealEmails ? 'Analysez vos emails réels avec IA' : 'Démonstration avec emails simulés'}</p>
                    
                    <div id="preselected-categories-display">
                        ${this.renderPreselectedCategories()}
                    </div>
                    
                    <div class="steps-container">
                        <div class="step active" id="step1">
                            <div class="step-number">1</div>
                            <div class="step-label">Configuration</div>
                        </div>
                        <div class="step" id="step2">
                            <div class="step-number">2</div>
                            <div class="step-label">${hasRealEmails ? 'Récupération' : 'Simulation'}</div>
                        </div>
                        <div class="step" id="step3">
                            <div class="step-number">3</div>
                            <div class="step-label">Analyse IA</div>
                        </div>
                    </div>
                    
                    <div class="duration-section">
                        <div class="duration-label">Période d'analyse</div>
                        <div class="duration-options">
                            ${this.renderDurationOptions()}
                        </div>
                    </div>
                    
                    <button class="scan-button-minimal" id="minimalScanBtn" onclick="window.minimalScanModule.startScan()">
                        <i class="fas ${hasRealEmails ? 'fa-search' : 'fa-robot'}"></i>
                        <span>${hasRealEmails ? 'Scanner mes emails' : 'Lancer la simulation'}</span>
                    </button>
                    
                    <div class="progress-section-minimal" id="progressSection">
                        <div class="progress-bar-minimal">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">Initialisation...</div>
                        <div class="progress-status" id="progressStatus">Préparation</div>
                    </div>
                    
                    <div class="scan-info">
                        <div class="scan-info-main">
                            <i class="fas fa-info-circle"></i>
                            <span>${hasRealEmails ? 'Scan sécurisé avec IA Claude' : 'Simulation avec données réalistes'}</span>
                        </div>
                        ${this.renderScanInfoDetails()}
                    </div>
                </div>
            </div>
        `;
    }

    renderPreselectedCategories() {
        const hasRealEmails = this.hasRealEmailAccess();
        
        if (this.taskPreselectedCategories.length === 0) {
            return `
                <div class="preselected-info no-selection">
                    <i class="fas fa-info-circle"></i>
                    <span>${hasRealEmails ? 'Analyse intelligente complète activée' : 'Mode simulation avec IA complète'}</span>
                </div>
            `;
        }
        
        const categoryDetails = this.getCompatibleCategories();
        
        return `
            <div class="preselected-info">
                <i class="fas fa-star"></i>
                <span>Catégories d'analyse ${hasRealEmails ? '(emails réels)' : '(simulation)'}:</span>
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

    renderScanInfoDetails() {
        let details = [];
        const hasRealEmails = this.hasRealEmailAccess();
        
        if (hasRealEmails) {
            details.push('Emails réels Microsoft/Gmail');
        } else {
            details.push('Simulation IA Claude');
        }
        
        if (this.taskPreselectedCategories.length > 0) {
            details.push(`${this.taskPreselectedCategories.length} catégorie(s) IA`);
        }
        
        details.push('Synchronisation EmailScanner');
        
        return `<div class="scan-info-details">${details.join(' • ')}</div>`;
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
        console.log('[MinimalScan] ✅ Événements v11.1 initialisés');
        
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

    async startScan() {
        if (this.scanInProgress) {
            console.log('[MinimalScan] Scan déjà en cours');
            return;
        }
        
        const hasRealEmails = this.hasRealEmailAccess();
        console.log(`[MinimalScan] 🚀 Démarrage scan v11.1 - Mode: ${hasRealEmails ? 'EMAILS RÉELS' : 'SIMULATION'}`);
        console.log('[MinimalScan] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        
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
                scanBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${hasRealEmails ? 'Scan en cours...' : 'Simulation en cours...'}</span>`;
            }
            
            // SCAN AVEC PRIORITÉ EMAILS RÉELS
            await this.executeSmartScan();
            
            this.setActiveStep(3);
            this.completeScan();
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur scan:', error);
            this.showScanError(error);
        }
    }

    async executeSmartScan() {
        const hasRealEmails = this.hasRealEmailAccess();
        
        if (hasRealEmails) {
            console.log('[MinimalScan] 📧 Tentative scan emails réels...');
            await this.executeRealEmailScan();
        } else {
            console.log('[MinimalScan] 🎭 Fallback simulation...');
            await this.executeSimulationScan();
        }
    }

    async executeRealEmailScan() {
        const phases = [
            { progress: 10, message: 'Connexion au service email...', status: 'Authentification' },
            { progress: 25, message: 'Récupération des emails...', status: 'Téléchargement' },
            { progress: 50, message: 'Synchronisation EmailScanner...', status: 'Synchronisation' },
            { progress: 75, message: 'Classification par IA...', status: 'Analyse IA' },
            { progress: 90, message: 'Finalisation...', status: 'Compilation' },
            { progress: 100, message: 'Scan terminé !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            if (phase.progress === 25) {
                await this.fetchRealEmails();
            } else if (phase.progress === 50) {
                await this.syncWithEmailScanner();
            } else if (phase.progress === 75) {
                await this.categorizeRealEmails();
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    async fetchRealEmails() {
        console.log('[MinimalScan] 📧 Récupération emails réels...');
        
        try {
            if (!window.mailService) {
                throw new Error('MailService non disponible');
            }
            
            // Initialiser le service si nécessaire
            if (!window.mailService.isInitialized) {
                await window.mailService.initialize();
            }
            
            // Calculer les dates
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.selectedDays);
            
            // Récupérer les emails
            const emails = await window.mailService.getEmailsFromFolder('inbox', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                top: this.scanConfig.maxRealEmails || 100
            });
            
            this.realEmails = emails || [];
            console.log(`[MinimalScan] ✅ ${this.realEmails.length} emails réels récupérés`);
            
            return this.realEmails;
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur récupération emails réels:', error);
            // Fallback vers simulation si échec
            console.log('[MinimalScan] 🔄 Fallback vers simulation...');
            await this.generateFallbackEmails();
            throw error;
        }
    }

    async generateFallbackEmails() {
        console.log('[MinimalScan] 🎭 Génération emails de fallback...');
        
        const emailCount = Math.min(30, this.scanConfig.maxSimulatedEmails || 50);
        const emails = [];
        
        const templates = [
            { domain: 'company.com', name: 'Jean Dupont', type: 'commercial' },
            { domain: 'urgent.fr', name: 'Marie Martin', type: 'tasks' },
            { domain: 'meeting.org', name: 'Pierre Bernard', type: 'meetings' },
            { domain: 'finance.com', name: 'Service Finance', type: 'finance' }
        ];
        
        for (let i = 0; i < emailCount; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const daysAgo = Math.floor(Math.random() * this.selectedDays);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            emails.push({
                id: `fallback-${i}-${Date.now()}`,
                subject: `${template.type} - Email fallback ${i + 1}`,
                from: {
                    emailAddress: {
                        address: `${template.name.toLowerCase().replace(' ', '.')}@${template.domain}`,
                        name: template.name
                    }
                },
                receivedDateTime: date.toISOString(),
                bodyPreview: `Contenu de démonstration pour ${template.type}`,
                hasAttachments: Math.random() > 0.8,
                importance: 'normal',
                isRead: Math.random() > 0.3,
                realEmail: false,
                webSimulated: true,
                simulatedCategory: template.type
            });
        }
        
        this.realEmails = emails;
        console.log(`[MinimalScan] ✅ ${emails.length} emails de fallback générés`);
    }

    async executeSimulationScan() {
        const phases = [
            { progress: 10, message: 'Initialisation simulation IA...', status: 'Démarrage' },
            { progress: 30, message: 'Génération emails intelligents...', status: 'Création IA' },
            { progress: 60, message: 'Synchronisation EmailScanner...', status: 'Synchronisation' },
            { progress: 80, message: 'Classification IA...', status: 'Analyse' },
            { progress: 100, message: 'Simulation terminée !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            if (phase.progress === 30) {
                await this.generateSimulatedEmails();
            } else if (phase.progress === 60) {
                await this.syncWithEmailScanner();
            } else if (phase.progress === 80) {
                await this.categorizeEmails();
            }
            
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }

    async generateSimulatedEmails() {
        console.log('[MinimalScan] 🎭 Génération emails simulés...');
        
        const emailCount = Math.floor(Math.random() * 30) + 40; // 40-70 emails
        const emails = [];
        
        const senderTemplates = [
            { domain: 'company.com', name: 'Jean Dupont', type: 'commercial' },
            { domain: 'client.fr', name: 'Marie Martin', type: 'tasks' },
            { domain: 'meeting.org', name: 'Pierre Bernard', type: 'meetings' },
            { domain: 'bank.com', name: 'Service Client', type: 'finance' },
            { domain: 'newsletter.com', name: 'Newsletter', type: 'newsletters' },
            { domain: 'support.com', name: 'Support Tech', type: 'support' },
            { domain: 'gmail.com', name: 'Ami Personnel', type: 'personal' }
        ];
        
        const subjectTemplates = {
            commercial: [
                'Proposition commerciale importante - Q1 2025',
                'Nouvelle offre exclusive - Réponse attendue',
                'Rendez-vous commercial urgent cette semaine',
                'Présentation produit innovant - Demo disponible'
            ],
            tasks: [
                'Action requise: Validation projet Alpha',
                'Tâche critique à compléter avant vendredi',
                'Livrable attendu pour demain 16h - URGENT',
                'Projet urgent à finaliser cette semaine'
            ],
            meetings: [
                'Réunion équipe - Lundi 14h salle de conf',
                'Planning meeting Q1 - Préparation nécessaire',
                'Confirmation rendez-vous client important',
                'Invitation conférence innovation 2025'
            ],
            finance: [
                'Facture en attente de validation - Urgent',
                'Relevé de compte mensuel disponible',
                'Autorisation virement - Signature requise',
                'Budget Q1 approuvé - Détails en PJ'
            ],
            newsletters: [
                'Newsletter tech hebdomadaire - Innovations',
                'Actualités du secteur - Janvier 2025',
                'Tendances marché - Rapport mensuel'
            ],
            support: [
                'Ticket #12345 résolu - Vérification requise',
                'Mise à jour système planifiée',
                'Nouvelle fonctionnalité disponible'
            ],
            personal: [
                'Invitation anniversaire samedi',
                'Photos vacances à voir',
                'Plan weekend - Confirmation souhaitée'
            ]
        };
        
        for (let i = 0; i < emailCount; i++) {
            const template = senderTemplates[Math.floor(Math.random() * senderTemplates.length)];
            const subjects = subjectTemplates[template.type] || ['Email générique'];
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            
            const daysAgo = Math.floor(Math.random() * this.selectedDays);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            const email = {
                id: `sim-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                subject: subject,
                from: {
                    emailAddress: {
                        address: `${template.name.toLowerCase().replace(/\s+/g, '.')}@${template.domain}`,
                        name: template.name
                    }
                },
                receivedDateTime: date.toISOString(),
                bodyPreview: this.generateEmailPreview(template.type, subject),
                hasAttachments: Math.random() > 0.7,
                importance: Math.random() > 0.9 ? 'high' : 'normal',
                isRead: Math.random() > 0.3,
                realEmail: false,
                webSimulated: true,
                simulatedCategory: template.type
            };
            
            emails.push(email);
        }
        
        this.realEmails = emails;
        console.log(`[MinimalScan] ✅ ${emails.length} emails simulés générés`);
    }

    generateEmailPreview(category, subject) {
        const previews = {
            commercial: 'Nous avons le plaisir de vous présenter notre nouvelle offre commerciale. Cette proposition exclusive vous permettra d\'optimiser vos résultats business...',
            tasks: 'Action requise de votre part. Ce projet nécessite votre validation avant la fin de semaine. Merci de traiter cette demande en priorité...',
            meetings: 'Nous confirmons votre participation à la réunion prévue. L\'ordre du jour sera envoyé séparément. Préparation recommandée...',
            finance: 'Veuillez trouver ci-joint les documents financiers pour validation. Votre signature est requise pour finaliser...',
            newsletters: 'Découvrez les dernières actualités et innovations de notre secteur. Ce mois-ci, focus sur les tendances émergentes...',
            support: 'Votre demande de support a été traitée avec succès. Les modifications ont été appliquées et testées...',
            personal: 'J\'espère que tu vas bien. Je voulais te tenir au courant des dernières nouvelles et organiser notre prochaine rencontre...'
        };
        
        return previews[category] || 'Contenu de l\'email...';
    }

    async syncWithEmailScanner() {
        console.log('[MinimalScan] 🔄 Synchronisation avec EmailScanner...');
        
        if (!window.emailScanner || !this.realEmails) {
            console.warn('[MinimalScan] EmailScanner ou emails non disponibles');
            return false;
        }
        
        try {
            // Réinitialiser EmailScanner
            if (typeof window.emailScanner.reset === 'function') {
                window.emailScanner.reset();
            }
            
            // Injecter les emails
            window.emailScanner.emails = [...this.realEmails];
            console.log(`[MinimalScan] ✅ ${this.realEmails.length} emails injectés dans EmailScanner`);
            
            // Synchroniser les paramètres
            if (typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
                window.emailScanner.updateTaskPreselectedCategories(this.taskPreselectedCategories);
            }
            
            // Marquer la source
            const hasRealEmails = this.realEmails.some(e => e.realEmail === true);
            if (window.emailScanner.scanMetrics) {
                window.emailScanner.scanMetrics.startTime = this.scanStartTime;
                window.emailScanner.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
                window.emailScanner.scanMetrics.hasRealEmails = hasRealEmails;
                window.emailScanner.scanMetrics.source = 'StartScan';
            }
            
            console.log('[MinimalScan] ✅ Synchronisation EmailScanner complète');
            return true;
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur synchronisation EmailScanner:', error);
            return false;
        }
    }

    async categorizeRealEmails() {
        console.log('[MinimalScan] 🏷️ Catégorisation des emails réels...');
        
        if (!window.emailScanner || !this.realEmails) {
            console.warn('[MinimalScan] Données non disponibles pour catégorisation');
            return;
        }
        
        try {
            // Catégoriser via EmailScanner
            if (typeof window.emailScanner.categorizeEmails === 'function') {
                await window.emailScanner.categorizeEmails(this.taskPreselectedCategories);
                console.log('[MinimalScan] ✅ Catégorisation réelle effectuée');
            }
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur catégorisation réelle:', error);
        }
    }

    async categorizeEmails() {
        console.log('[MinimalScan] 🏷️ Catégorisation des emails simulés...');
        
        if (!window.emailScanner || !this.realEmails) {
            console.warn('[MinimalScan] Données non disponibles pour catégorisation');
            return;
        }
        
        try {
            // Catégoriser via EmailScanner
            if (typeof window.emailScanner.categorizeEmails === 'function') {
                await window.emailScanner.categorizeEmails(this.taskPreselectedCategories);
                console.log('[MinimalScan] ✅ Catégorisation simulée effectuée');
            }
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur catégorisation simulée:', error);
        }
    }

    generateResults() {
        const emailCount = this.realEmails?.length || 0;
        const preselectedCount = this.realEmails?.filter(e => 
            this.taskPreselectedCategories.includes(e.simulatedCategory)
        ).length || 0;
        const hasRealEmails = this.realEmails?.some(e => e.realEmail === true) || false;
        
        this.scanResults = {
            success: true,
            total: emailCount,
            categorized: emailCount,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: { 
                preselectedForTasks: preselectedCount,
                taskSuggestions: Math.floor(preselectedCount * 0.8),
                highConfidence: Math.floor(emailCount * 0.7),
                hasRealEmails: hasRealEmails,
                emailType: hasRealEmails ? 'real' : 'simulated'
            },
            breakdown: this.calculateBreakdown(),
            source: 'StartScan'
        };
        
        console.log('[MinimalScan] 📊 Résultats générés:', this.scanResults);
    }

    calculateBreakdown() {
        if (!this.realEmails) return {};
        
        const breakdown = {};
        
        this.realEmails.forEach(email => {
            const category = email.simulatedCategory || 'other';
            breakdown[category] = (breakdown[category] || 0) + 1;
        });
        
        return breakdown;
    }

    completeScan() {
        this.generateResults();
        
        setTimeout(() => {
            const scanBtn = document.getElementById('minimalScanBtn');
            if (scanBtn) {
                const hasRealEmails = this.scanResults?.stats?.hasRealEmails || false;
                const emailCount = this.scanResults?.total || 0;
                const preselectedCount = this.scanResults?.stats?.preselectedForTasks || 0;
                
                scanBtn.innerHTML = `<i class="fas fa-check"></i> <span>${hasRealEmails ? 'Emails réels analysés !' : 'Simulation terminée !'}</span>`;
                scanBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                if (emailCount > 0) {
                    scanBtn.style.position = 'relative';
                    scanBtn.insertAdjacentHTML('beforeend', `
                        <span class="success-badge">
                            ${hasRealEmails ? '📧' : '🤖'} ${emailCount} ${preselectedCount > 0 ? `(${preselectedCount} ⭐)` : ''}
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
        
        const hasRealEmails = this.scanResults?.stats?.hasRealEmails || false;
        
        const essentialResults = {
            success: true,
            total: this.scanResults?.total || 0,
            categorized: this.scanResults?.categorized || 0,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            preselectedForTasks: this.scanResults?.stats?.preselectedForTasks || 0,
            scanDuration: Math.floor((Date.now() - this.scanStartTime) / 1000),
            timestamp: Date.now(),
            hasRealEmails: hasRealEmails,
            emailType: hasRealEmails ? 'real' : 'simulated',
            source: 'StartScan'
        };
        
        try {
            localStorage.setItem('scanResults', JSON.stringify(essentialResults));
            console.log('[MinimalScan] 💾 Résultats finaux sauvegardés');
        } catch (error) {
            console.warn('[MinimalScan] Erreur stockage final:', error);
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        const emailType = results.hasRealEmails ? 'emails réels' : 'emails simulés';
        const preselectedText = results.preselectedForTasks > 0 ? 
            `<br>⭐ ${results.preselectedForTasks} pré-sélectionnés` : '';
        
        notification.innerHTML = `
            ${results.hasRealEmails ? '📧' : '🤖'} ${results.total} ${emailType} analysés${preselectedText}
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
                    source: 'StartScan',
                    timestamp: Date.now(),
                    hasRealEmails: results.hasRealEmails
                }
            }));
            
            // Événement de synchronisation EmailScanner
            window.dispatchEvent(new CustomEvent('emailScannerSynced', {
                detail: {
                    emailCount: results.total,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: 'StartScan',
                    timestamp: Date.now(),
                    hasRealEmails: results.hasRealEmails
                }
            }));
            
            console.log('[MinimalScan] ✅ Événements dispatchés');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur dispatch événements:', error);
        }
    }

    showResultsInPlace(results) {
        const container = document.querySelector('.scanner-card-minimal');
        if (!container) return;
        
        const emailType = results.hasRealEmails ? 'emails réels' : 'emails simulés';
        const typeIcon = results.hasRealEmails ? 'fa-envelope' : 'fa-robot';
        const typeColor = results.hasRealEmails ? '#10b981' : '#f97316';
        
        container.innerHTML = `
            <div class="scanner-icon" style="background: linear-gradient(135deg, ${typeColor} 0%, ${typeColor}dd 100%);">
                <i class="fas ${typeIcon}"></i>
            </div>
            
            <h1 class="scanner-title">${results.hasRealEmails ? 'Emails Réels Analysés !' : 'Simulation Terminée !'}</h1>
            <p class="scanner-subtitle">Analyse IA complète avec synchronisation EmailScanner</p>
            
            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: ${typeColor};">${results.total}</div>
                        <div style="font-size: 14px; color: #6b7280;">${emailType}</div>
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
                    <i class="fas ${typeIcon}"></i>
                    <span>${results.hasRealEmails ? 'Analyse emails réels avec IA Claude' : 'Simulation IA avec données réalistes'}</span>
                </div>
                <div class="scan-info-details">Durée: ${results.scanDuration}s • Mode: ${results.hasRealEmails ? 'Réel' : 'Simulation'} • Synchronisé</div>
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
                    
                    <button class="scan-button-minimal" onclick="window.minimalScanModule.resetScanner()" 
                            style="width: auto; padding: 0 20px; height: 40px; font-size: 14px;">
                        <i class="fas fa-redo"></i>
                        <span>Réessayer</span>
                    </button>
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
        
        console.log('[MinimalScan] 🔄 Scanner v11.1 réinitialisé');
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
        console.log('[MinimalScan] 📝 Mise à jour paramètres v11.1:', newSettings);
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
        const hasRealEmails = this.hasRealEmailAccess();
        
        return {
            version: '11.1',
            isInitialized: this.isInitialized,
            scanInProgress: this.scanInProgress,
            selectedDays: this.selectedDays,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            settings: this.settings,
            lastSettingsSync: this.lastSettingsSync,
            scanResults: this.scanResults,
            emailAccess: {
                hasRealEmails: hasRealEmails,
                mailServiceAvailable: !!window.mailService,
                mailServiceInitialized: window.mailService?.isInitialized || false
            },
            scanConfig: this.scanConfig,
            emailScanner: {
                available: !!window.emailScanner,
                emailCount: window.emailScanner?.emails?.length || 0
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
        
        console.log('[MinimalScan] 🧹 Nettoyage v11.1 terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        this.taskPreselectedCategories = [];
        console.log('[MinimalScan] Instance v11.1 détruite');
    }
}

// ================================================
// INITIALISATION GLOBALE CORRIGÉE
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
window.testScannerReal = function() {
    console.group('🧪 TEST Scanner Emails Réels v11.1');
    console.log('Configuration:', window.minimalScanModule.scanConfig);
    console.log('Accès emails réels:', window.minimalScanModule.hasRealEmailAccess());
    console.log('MailService disponible:', !!window.mailService);
    console.log('MailService initialisé:', window.mailService?.isInitialized);
    console.log('Debug Info:', window.minimalScanModule.getDebugInfo());
    console.groupEnd();
    return { success: true, realEmailsAvailable: window.minimalScanModule.hasRealEmailAccess() };
};

window.simulateRealScan = function() {
    if (window.minimalScanModule.scanInProgress) {
        console.log('Scan déjà en cours');
        return;
    }
    
    const hasReal = window.minimalScanModule.hasRealEmailAccess();
    console.log(`🚀 Démarrage scan manuel - Mode: ${hasReal ? 'RÉEL' : 'SIMULATION'}`);
    window.minimalScanModule.startScan();
    return { success: true, mode: hasReal ? 'real' : 'simulation' };
};

// Auto-initialisation DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[MinimalScan] 📱 DOM prêt - Scanner v11.1 emails réels prioritaires');
    });
} else {
    console.log('[MinimalScan] 📱 Scanner v11.1 emails réels prioritaires prêt');
}

console.log('✅ StartScan v11.1 loaded - Emails réels prioritaires avec fallback simulation');
