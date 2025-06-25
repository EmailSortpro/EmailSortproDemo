// StartScan.js - Version 11.0 - Compatible Web avec synchronisation EmailScanner complète

console.log('[StartScan] 🚀 Loading StartScan.js v11.0 - Synchronisation complète...');

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
        
        // Configuration pour environnement web
        this.webConfig = {
            apiEndpoint: 'https://coruscating-dodol-f30e8d.netlify.app/.netlify/functions',
            isDemoMode: true,
            simulateEmailData: true
        };
        
        console.log('[MinimalScan] Scanner v11.0 initialized - Synchronisation EmailScanner');
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
            this.settings = this.getDefaultWebSettings();
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
                this.settings = this.getDefaultWebSettings();
                this.taskPreselectedCategories = [];
            }
        } catch (error) {
            console.warn('[MinimalScan] ⚠️ Erreur localStorage:', error);
            this.settings = this.getDefaultWebSettings();
            this.taskPreselectedCategories = [];
        }
    }

    getDefaultWebSettings() {
        return {
            scanSettings: {
                defaultPeriod: 7,
                defaultFolder: 'inbox',
                autoAnalyze: true,
                autoCategrize: true,
                webMode: true
            },
            taskPreselectedCategories: ['tasks', 'commercial', 'meetings'],
            preferences: {
                excludeSpam: true,
                detectCC: true,
                showNotifications: true,
                demoMode: true
            },
            webConfig: {
                simulateData: true,
                maxEmails: 100
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
        
        if (this.taskPreselectedCategories.length === 0) {
            display.innerHTML = `
                <div class="preselected-info no-selection">
                    <i class="fas fa-info-circle"></i>
                    <span>Mode démonstration - Simulation intelligente activée</span>
                </div>
            `;
        } else {
            const categoryDetails = this.getWebCompatibleCategories();
            
            display.innerHTML = `
                <div class="preselected-info">
                    <i class="fas fa-star"></i>
                    <span>Catégories pré-sélectionnées pour simulation:</span>
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

    getWebCompatibleCategories() {
        // Catégories par défaut pour le mode web
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

    addMinimalStyles() {
        if (this.stylesAdded || document.getElementById('minimal-scan-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'minimal-scan-styles';
        styles.textContent = `
            /* Scanner Web Compatible v11.0 */
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
            
            /* Affichage mode web */
            .web-mode-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 20px;
                border: 1px solid rgba(16, 185, 129, 0.2);
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
        console.log('[MinimalScan] ✅ Styles web v11.0 ajoutés');
    }

    async render(container) {
        console.log('[MinimalScan] 🎯 Rendu du scanner web v11.0...');
        
        try {
            this.addMinimalStyles();
            this.checkSettingsUpdate();
            
            // Mode web - pas besoin d'authentification complexe
            container.innerHTML = this.renderWebScanner();
            this.initializeEvents();
            this.isInitialized = true;
            
            console.log('[MinimalScan] ✅ Scanner web v11.0 rendu avec succès');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur lors du rendu:', error);
            container.innerHTML = this.renderError(error);
        }
    }

    renderWebScanner() {
        return `
            <div class="minimal-scanner">
                <div class="scanner-card-minimal">
                    <div class="web-mode-badge">
                        <i class="fas fa-robot"></i>
                        <span>Simulation IA Intelligente</span>
                    </div>
                    
                    <div class="scanner-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <h1 class="scanner-title">Scanner Email IA</h1>
                    <p class="scanner-subtitle">Démonstration d'organisation automatique intelligente</p>
                    
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
                            <div class="step-label">Simulation IA</div>
                        </div>
                        <div class="step" id="step3">
                            <div class="step-number">3</div>
                            <div class="step-label">Synchronisation</div>
                        </div>
                    </div>
                    
                    <div class="duration-section">
                        <div class="duration-label">Période de simulation</div>
                        <div class="duration-options">
                            ${this.renderDurationOptions()}
                        </div>
                    </div>
                    
                    <button class="scan-button-minimal" id="minimalScanBtn" onclick="window.minimalScanModule.startScan()">
                        <i class="fas fa-robot"></i>
                        <span>Lancer la simulation intelligente</span>
                    </button>
                    
                    <div class="progress-section-minimal" id="progressSection">
                        <div class="progress-bar-minimal">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">Initialisation...</div>
                        <div class="progress-status" id="progressStatus">Préparation simulation</div>
                    </div>
                    
                    <div class="scan-info">
                        <div class="scan-info-main">
                            <i class="fas fa-info-circle"></i>
                            <span>Simulation IA avec synchronisation EmailScanner</span>
                        </div>
                        ${this.renderScanInfoDetails()}
                    </div>
                </div>
            </div>
        `;
    }

    renderPreselectedCategories() {
        if (this.taskPreselectedCategories.length === 0) {
            return `
                <div class="preselected-info no-selection">
                    <i class="fas fa-info-circle"></i>
                    <span>Mode simulation intelligente - IA complète activée</span>
                </div>
            `;
        }
        
        const categoryDetails = this.getWebCompatibleCategories();
        
        return `
            <div class="preselected-info">
                <i class="fas fa-star"></i>
                <span>Catégories IA de simulation:</span>
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
        
        details.push('Simulation IA Claude');
        
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
        console.log('[MinimalScan] ✅ Événements web initialisés');
        
        if (this.settingsCheckInterval) {
            clearInterval(this.settingsCheckInterval);
        }
        
        // Vérification périodique moins fréquente en mode web
        this.settingsCheckInterval = setInterval(() => {
            this.checkSettingsUpdate();
        }, 15000);
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
        
        console.log('[MinimalScan] 🚀 Démarrage simulation avec synchronisation EmailScanner');
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
                scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Simulation IA en cours...</span>';
            }
            
            // SIMULATION AVEC SYNCHRONISATION EMAILSCANNER
            await this.executeWebSimulationWithSync();
            
            this.setActiveStep(3);
            this.completeScan();
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur simulation:', error);
            this.showScanError(error);
        }
    }

    async executeWebSimulationWithSync() {
        console.log('[MinimalScan] 🎭 Simulation IA avec synchronisation EmailScanner...');
        
        const phases = [
            { progress: 10, message: 'Initialisation de la simulation IA...', status: 'Démarrage' },
            { progress: 25, message: 'Génération d\'emails intelligents...', status: 'Création IA' },
            { progress: 40, message: 'Synchronisation avec EmailScanner...', status: 'Connexion' },
            { progress: 60, message: 'Classification par IA Claude...', status: 'Analyse IA' },
            { progress: 80, message: 'Injection dans EmailScanner...', status: 'Synchronisation' },
            { progress: 95, message: 'Finalisation des résultats...', status: 'Compilation' },
            { progress: 100, message: 'Simulation terminée et synchronisée !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            // Traitement spécial pour la synchronisation EmailScanner
            if (phase.progress === 40) {
                await this.prepareEmailScannerSync();
            } else if (phase.progress === 60) {
                await this.generateAndCategorizeEmails();
            } else if (phase.progress === 80) {
                await this.syncWithEmailScanner();
            }
            
            // Délai réaliste pour la simulation
            const delay = Math.random() * 1000 + 500; // 500ms à 1.5s
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Finaliser la synchronisation
        await this.finalizeSync();
    }

    async prepareEmailScannerSync() {
        console.log('[MinimalScan] 📡 Préparation synchronisation EmailScanner...');
        
        // S'assurer qu'EmailScanner existe
        if (!window.emailScanner) {
            console.warn('[MinimalScan] EmailScanner non trouvé, création d\'instance...');
            // Attendre un peu au cas où il se charge
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!window.emailScanner) {
                console.warn('[MinimalScan] EmailScanner toujours absent, scan indépendant');
                return false;
            }
        }
        
        // Synchroniser les paramètres avec EmailScanner
        if (window.emailScanner.updateTaskPreselectedCategories) {
            window.emailScanner.updateTaskPreselectedCategories(this.taskPreselectedCategories);
            console.log('[MinimalScan] ✅ Catégories synchronisées avec EmailScanner');
        }
        
        return true;
    }

    async generateAndCategorizeEmails() {
        console.log('[MinimalScan] 🏭 Génération et catégorisation d\'emails...');
        
        const emailCount = Math.floor(Math.random() * 50) + 50; // 50-100 emails
        const emails = [];
        
        const senderTemplates = [
            { domain: 'company.com', name: 'Jean Dupont', type: 'commercial', priority: 'medium' },
            { domain: 'client-urgent.fr', name: 'Marie Martin', type: 'tasks', priority: 'high' },
            { domain: 'meetings.org', name: 'Pierre Bernard', type: 'meetings', priority: 'medium' },
            { domain: 'finance-corp.com', name: 'Service Comptabilité', type: 'finance', priority: 'high' },
            { domain: 'newsletter-tech.com', name: 'TechNews', type: 'newsletters', priority: 'low' },
            { domain: 'support-app.com', name: 'Support Technique', type: 'support', priority: 'medium' },
            { domain: 'gmail.com', name: 'Ami Personnel', type: 'personal', priority: 'low' },
            { domain: 'project-manager.io', name: 'Project Manager', type: 'tasks', priority: 'high' },
            { domain: 'sales-team.com', name: 'Équipe Commerciale', type: 'commercial', priority: 'medium' },
            { domain: 'calendly.com', name: 'Calendly', type: 'meetings', priority: 'medium' }
        ];
        
        const subjectTemplates = {
            commercial: [
                'Proposition commerciale urgente - Q1 2025',
                'Nouvelle offre exclusive - 30% de réduction',
                'Rendez-vous commercial confirmé',
                'Présentation produit innovant - Demo disponible'
            ],
            tasks: [
                'Action requise: Validation projet Alpha',
                'Tâche critique à compléter avant vendredi',
                'Livrable attendu pour demain 16h',
                'Projet urgent à finaliser cette semaine',
                'Review code requis - URGENT',
                'Deadline projet approche - Action nécessaire'
            ],
            meetings: [
                'Réunion équipe - Lundi 14h salle de conf',
                'Planning meeting Q1 - Préparation nécessaire',
                'Confirmation rendez-vous client important',
                'Invitation conférence innovation 2025',
                'Daily standup - Points bloquants',
                'Réunion stratégique - Participation requise'
            ],
            finance: [
                'Facture en attente de validation - Urgent',
                'Relevé de compte mensuel disponible',
                'Autorisation virement - Signature requise',
                'Budget Q1 approuvé - Détails en PJ',
                'Rapport financier trimestriel',
                'Remboursement frais mission - Action requise'
            ],
            newsletters: [
                'Newsletter tech hebdomadaire - Innovations',
                'Actualités du secteur - Janvier 2025',
                'Tendances marché - Rapport mensuel',
                'Veille technologique - Points clés'
            ],
            support: [
                'Ticket #12345 résolu - Vérification requise',
                'Mise à jour système planifiée - Action requise',
                'Maintenance programmée cette nuit',
                'Nouvelle fonctionnalité disponible'
            ],
            personal: [
                'Invitation anniversaire samedi',
                'Photos vacances Noël à voir',
                'Nouvelles de la famille',
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
            
            // Générer une priorité intelligente basée sur le contenu
            let importance = 'normal';
            let categoryScore = 60 + Math.floor(Math.random() * 40); // 60-100
            let categoryConfidence = 0.6 + Math.random() * 0.4; // 0.6-1.0
            
            if (subject.includes('urgent') || subject.includes('URGENT') || template.priority === 'high') {
                importance = 'high';
                categoryScore += 10;
                categoryConfidence += 0.1;
            }
            
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
                importance: importance,
                isRead: Math.random() > 0.3,
                
                // Métadonnées de simulation IA
                simulatedCategory: template.type,
                category: template.type,
                categoryScore: Math.min(100, categoryScore),
                categoryConfidence: Math.min(1.0, categoryConfidence),
                isPreselectedForTasks: this.taskPreselectedCategories.includes(template.type),
                webSimulated: true,
                aiGenerated: true,
                
                // Métadonnées d'analyse
                matchedPatterns: [
                    { type: 'domain', keyword: template.domain, score: 20 },
                    { type: 'subject', keyword: template.type, score: 25 }
                ],
                hasAbsolute: categoryScore >= 90,
                isSpam: false,
                isCC: Math.random() > 0.8,
                isExcluded: false
            };
            
            emails.push(email);
        }
        
        this.generatedEmails = emails;
        console.log(`[MinimalScan] ✅ ${emails.length} emails générés avec IA`);
        
        return emails;
    }

    async syncWithEmailScanner() {
        console.log('[MinimalScan] 🔄 Synchronisation avec EmailScanner...');
        
        if (!window.emailScanner || !this.generatedEmails) {
            console.warn('[MinimalScan] Impossible de synchroniser avec EmailScanner');
            return false;
        }
        
        try {
            // Réinitialiser EmailScanner
            if (typeof window.emailScanner.reset === 'function') {
                window.emailScanner.reset();
            }
            
            // Injecter les emails générés
            window.emailScanner.emails = [...this.generatedEmails];
            console.log('[MinimalScan] ✅ Emails injectés dans EmailScanner');
            
            // Synchroniser les paramètres
            if (typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
                window.emailScanner.updateTaskPreselectedCategories(this.taskPreselectedCategories);
            }
            
            // Re-catégoriser avec les bonnes catégories
            if (typeof window.emailScanner.categorizeEmails === 'function') {
                await window.emailScanner.categorizeEmails(this.taskPreselectedCategories);
                console.log('[MinimalScan] ✅ Re-catégorisation effectuée');
            }
            
            // Mettre à jour les métriques
            if (window.emailScanner.scanMetrics) {
                window.emailScanner.scanMetrics.startTime = this.scanStartTime;
                window.emailScanner.scanMetrics.categorizedCount = this.generatedEmails.length;
                window.emailScanner.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
            }
            
            console.log('[MinimalScan] ✅ Synchronisation EmailScanner complète');
            return true;
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur synchronisation EmailScanner:', error);
            return false;
        }
    }

    async finalizeSync() {
        console.log('[MinimalScan] 🎯 Finalisation de la synchronisation...');
        
        // Générer les résultats finaux
        this.generateSimulatedResults();
        
        // Sauvegarder les résultats pour la page emails
        try {
            const scanResults = {
                success: true,
                total: this.generatedEmails?.length || 0,
                categorized: this.generatedEmails?.length || 0,
                taskPreselectedCategories: [...this.taskPreselectedCategories],
                preselectedForTasks: this.generatedEmails?.filter(e => e.isPreselectedForTasks).length || 0,
                scanDuration: Math.floor((Date.now() - this.scanStartTime) / 1000),
                timestamp: Date.now(),
                webSimulation: true,
                emailScannerSynced: true
            };
            
            localStorage.setItem('scanResults', JSON.stringify(scanResults));
            console.log('[MinimalScan] 💾 Résultats sauvegardés');
            
        } catch (error) {
            console.warn('[MinimalScan] Erreur sauvegarde résultats:', error);
        }
        
        // Dispatcher les événements pour notifier les autres modules
        setTimeout(() => {
            this.dispatchSyncEvents();
        }, 100);
    }

    dispatchSyncEvents() {
        try {
            // Événement de fin de scan
            window.dispatchEvent(new CustomEvent('scanCompleted', {
                detail: {
                    results: this.scanResults,
                    emails: this.generatedEmails,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: 'MinimalScanModule',
                    timestamp: Date.now()
                }
            }));
            
            // Événement de synchronisation EmailScanner
            window.dispatchEvent(new CustomEvent('emailScannerSynced', {
                detail: {
                    emailCount: this.generatedEmails?.length || 0,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: 'MinimalScanModule',
                    timestamp: Date.now()
                }
            }));
            
            console.log('[MinimalScan] ✅ Événements de synchronisation envoyés');
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur dispatch événements:', error);
        }
    }

    generateEmailPreview(category, subject) {
        const previews = {
            commercial: 'Nous avons le plaisir de vous présenter notre nouvelle offre commerciale exceptionnelle. Cette proposition unique vous permettra d\'optimiser vos résultats...',
            tasks: 'Action requise de votre part. Ce projet nécessite votre validation avant la fin de semaine. Merci de bien vouloir traiter cette demande en priorité...',
            meetings: 'Nous confirmons votre participation à la réunion prévue. L\'ordre du jour sera envoyé séparément. Préparation recommandée...',
            finance: 'Veuillez trouver ci-joint les documents financiers pour validation. Votre signature est requise pour finaliser cette opération...',
            newsletters: 'Découvrez les dernières actualités et innovations de notre secteur. Ce mois-ci, focus sur les tendances émergentes...',
            support: 'Votre demande de support a été traitée avec succès. Les modifications ont été appliquées et testées...',
            personal: 'J\'espère que tu vas bien. Je voulais te tenir au courant des dernières nouvelles et organiser notre prochaine rencontre...'
        };
        
        return previews[category] || 'Contenu de l\'email simulé par IA...';
    }

    generateSimulatedResults() {
        const emailCount = this.generatedEmails?.length || 0;
        const categorizedCount = emailCount;
        const preselectedCount = this.generatedEmails?.filter(e => e.isPreselectedForTasks).length || 0;
        
        this.scanResults = {
            success: true,
            total: emailCount,
            categorized: categorizedCount,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: { 
                preselectedForTasks: preselectedCount,
                taskSuggestions: Math.floor(preselectedCount * 0.8),
                highConfidence: Math.floor(categorizedCount * 0.7),
                webSimulation: true,
                emailScannerSynced: true
            },
            breakdown: this.generateCategoryBreakdown(categorizedCount)
        };
        
        console.log('[MinimalScan] 📊 Résultats simulés générés:', this.scanResults);
    }

    generateCategoryBreakdown(total) {
        if (!this.generatedEmails) return {};
        
        const breakdown = {};
        
        this.generatedEmails.forEach(email => {
            const category = email.category || 'other';
            breakdown[category] = (breakdown[category] || 0) + 1;
        });
        
        return breakdown;
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

    completeScan() {
        setTimeout(() => {
            const scanBtn = document.getElementById('minimalScanBtn');
            if (scanBtn) {
                const preselectedCount = this.scanResults?.stats?.preselectedForTasks || 0;
                
                scanBtn.innerHTML = `<i class="fas fa-check"></i> <span>Simulation IA terminée !</span>`;
                scanBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                if (preselectedCount > 0) {
                    scanBtn.style.position = 'relative';
                    scanBtn.insertAdjacentHTML('beforeend', `
                        <span class="success-badge">
                            ✅ ${preselectedCount} emails synchronisés
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
            webSimulation: true,
            emailScannerSynced: true
        };
        
        try {
            localStorage.setItem('scanResults', JSON.stringify(essentialResults));
            console.log('[MinimalScan] 💾 Résultats finaux sauvegardés');
        } catch (error) {
            console.warn('[MinimalScan] Erreur stockage final:', error);
        }
        
        // Notification de succès
        this.showWebNotification(essentialResults);
        
        setTimeout(() => {
            if (window.pageManager && typeof window.pageManager.loadPage === 'function') {
                window.pageManager.loadPage('emails');
            } else {
                // Fallback pour mode web standalone
                this.showResultsInPlace(essentialResults);
            }
        }, 500);
    }

    showWebNotification(results) {
        // Créer une notification personnalisée pour le web
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
        
        const message = results.preselectedForTasks > 0 ?
            `✅ ${results.total} emails simulés<br>🔄 ${results.preselectedForTasks} synchronisés avec EmailScanner` :
            `✅ ${results.total} emails simulés<br>🔄 Synchronisés avec EmailScanner`;
        
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        // Ajouter animation CSS
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

    showResultsInPlace(results) {
        // Afficher les résultats directement dans le scanner pour mode standalone
        const container = document.querySelector('.scanner-card-minimal');
        if (!container) return;
        
        container.innerHTML = `
            <div class="scanner-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <i class="fas fa-check"></i>
            </div>
            
            <h1 class="scanner-title">Simulation IA Terminée !</h1>
            <p class="scanner-subtitle">Synchronisation EmailScanner réussie</p>
            
            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${results.total}</div>
                        <div style="font-size: 14px; color: #6b7280;">Emails simulés</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${results.categorized}</div>
                        <div style="font-size: 14px; color: #6b7280;">Catégorisés</div>
                    </div>
                    ${results.preselectedForTasks > 0 ? `
                        <div>
                            <div style="font-size: 28px; font-weight: 700; color: #8b5cf6;">🔄 ${results.preselectedForTasks}</div>
                            <div style="font-size: 14px; color: #6b7280;">Synchronisés</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="scan-button-minimal" onclick="window.minimalScanModule.resetScanner()" 
                        style="width: auto; padding: 0 24px; height: 50px;">
                    <i class="fas fa-redo"></i>
                    <span>Nouvelle simulation</span>
                </button>
                
                <button class="scan-button-minimal" onclick="window.pageManager?.loadPage('emails')" 
                        style="width: auto; padding: 0 24px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                    <i class="fas fa-envelope"></i>
                    <span>Voir les emails</span>
                </button>
            </div>
            
            <div class="scan-info" style="margin-top: 20px;">
                <div class="scan-info-main">
                    <i class="fas fa-robot"></i>
                    <span>Simulation IA avec synchronisation EmailScanner</span>
                </div>
                <div class="scan-info-details">Durée: ${results.scanDuration}s • Mode: IA Complète • Synchronisé</div>
            </div>
        `;
    }

    showScanError(error) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="font-size: 16px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">Erreur de simulation</div>
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
        this.generatedEmails = null;
        
        this.setActiveStep(1);
        
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.classList.remove('visible');
            progressSection.innerHTML = `
                <div class="progress-bar-minimal">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">Initialisation...</div>
                <div class="progress-status" id="progressStatus">Préparation simulation</div>
            `;
        }
        
        // Recharger l'interface complète
        const container = document.querySelector('.scanner-card-minimal');
        if (container) {
            container.outerHTML = this.renderWebScanner();
        }
        
        this.loadSettingsFromStorage();
        this.updatePreselectedCategoriesDisplay();
        
        console.log('[MinimalScan] 🔄 Scanner web réinitialisé');
    }

    updateSettings(newSettings) {
        console.log('[MinimalScan] 📝 Mise à jour paramètres web:', newSettings);
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.taskPreselectedCategories) {
            this.taskPreselectedCategories = [...newSettings.taskPreselectedCategories];
        }
        
        if (newSettings.scanSettings?.defaultPeriod) {
            this.selectedDays = newSettings.scanSettings.defaultPeriod;
        }
        
        // Sauvegarder en localStorage pour persistance web
        try {
            localStorage.setItem('categorySettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('[MinimalScan] Erreur sauvegarde localStorage:', error);
        }
        
        this.updateUIWithNewSettings();
    }

    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            scanInProgress: this.scanInProgress,
            selectedDays: this.selectedDays,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            settings: this.settings,
            lastSettingsSync: this.lastSettingsSync,
            scanResults: this.scanResults,
            generatedEmails: this.generatedEmails?.length || 0,
            webConfig: this.webConfig,
            webMode: true,
            emailScannerSync: {
                available: !!window.emailScanner,
                synced: this.scanResults?.emailScannerSynced || false
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
        this.generatedEmails = null;
        
        console.log('[MinimalScan] 🧹 Nettoyage web terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        this.taskPreselectedCategories = [];
        console.log('[MinimalScan] Instance web détruite');
    }
}

// ================================================
// INITIALISATION WEB COMPATIBLE
// ================================================

// Créer l'instance globale avec protection
if (window.minimalScanModule) {
    window.minimalScanModule.destroy?.();
}

// Configuration pour environnement web
window.MinimalScanModule = MinimalScanModule;
window.minimalScanModule = new MinimalScanModule();
window.scanStartModule = window.minimalScanModule;

// Fonctions utilitaires pour débogage web
window.testWebScanner = function() {
    console.group('🧪 TEST Scanner Web v11.0');
    console.log('Configuration:', window.minimalScanModule.webConfig);
    console.log('Paramètres:', window.minimalScanModule.settings);
    console.log('Catégories:', window.minimalScanModule.taskPreselectedCategories);
    console.log('Debug Info:', window.minimalScanModule.getDebugInfo());
    console.groupEnd();
    return { success: true, webMode: true, syncEnabled: true };
};

window.simulateWebScan = function() {
    if (window.minimalScanModule.scanInProgress) {
        console.log('Simulation déjà en cours');
        return;
    }
    
    console.log('🚀 Démarrage simulation manuelle avec sync');
    window.minimalScanModule.startScan();
    return { success: true, message: 'Simulation avec sync démarrée' };
};

// Auto-initialisation si DOM prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[MinimalScan] 📱 DOM prêt - Scanner web avec sync initialisé');
    });
} else {
    console.log('[MinimalScan] 📱 Scanner web avec sync prêt');
}

console.log('✅ StartScan v11.0 loaded - Web Compatible avec synchronisation EmailScanner complète');
