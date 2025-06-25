// StartScan.js - Version 10.0 - Compatible Web (coruscating-dodol-f30e8d.netlify.app)

console.log('[StartScan] 🚀 Loading StartScan.js v10.0 - Web Compatible...');

class MinimalScanModule {
    constructor() {
        this.isInitialized = false;
        this.scanInProgress = false;
        this.selectedDays = 7;
        this.stylesAdded = false;
        this.scanStartTime = null;
        
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
        
        console.log('[MinimalScan] Scanner v10.0 initialized - Web Compatible Mode');
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
                    <span>Mode démonstration - Données simulées</span>
                </div>
            `;
        } else {
            const categoryDetails = this.getWebCompatibleCategories();
            
            display.innerHTML = `
                <div class="preselected-info">
                    <i class="fas fa-star"></i>
                    <span>Catégories pré-sélectionnées (demo):</span>
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
            /* Scanner Web Compatible v10.0 */
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
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 20px;
                border: 1px solid rgba(59, 130, 246, 0.2);
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
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
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
                background: #8b5cf6;
                color: white;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: 700;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
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
                background: rgba(102, 126, 234, 0.1);
                border-radius: 10px;
                padding: 15px;
                font-size: 14px;
                color: #667eea;
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
                color: #8b5cf6;
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
        console.log('[MinimalScan] ✅ Styles web v10.0 ajoutés');
    }

    async render(container) {
        console.log('[MinimalScan] 🎯 Rendu du scanner web v10.0...');
        
        try {
            this.addMinimalStyles();
            this.checkSettingsUpdate();
            
            // Mode web - pas besoin d'authentification complexe
            container.innerHTML = this.renderWebScanner();
            this.initializeEvents();
            this.isInitialized = true;
            
            console.log('[MinimalScan] ✅ Scanner web v10.0 rendu avec succès');
            
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
                        <i class="fas fa-globe"></i>
                        <span>Mode Démonstration Web</span>
                    </div>
                    
                    <div class="scanner-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <h1 class="scanner-title">Scanner Email IA</h1>
                    <p class="scanner-subtitle">Démonstration d'organisation automatique d'emails</p>
                    
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
                            <div class="step-label">Simulation</div>
                        </div>
                        <div class="step" id="step3">
                            <div class="step-number">3</div>
                            <div class="step-label">Résultats</div>
                        </div>
                    </div>
                    
                    <div class="duration-section">
                        <div class="duration-label">Période simulée</div>
                        <div class="duration-options">
                            ${this.renderDurationOptions()}
                        </div>
                    </div>
                    
                    <button class="scan-button-minimal" id="minimalScanBtn" onclick="window.minimalScanModule.startScan()">
                        <i class="fas fa-play"></i>
                        <span>Démarrer la démonstration</span>
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
                            <span>Démonstration avec données simulées</span>
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
                    <span>Mode démonstration - Données simulées</span>
                </div>
            `;
        }
        
        const categoryDetails = this.getWebCompatibleCategories();
        
        return `
            <div class="preselected-info">
                <i class="fas fa-star"></i>
                <span>Catégories de démonstration:</span>
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
        
        details.push('Simulation IA avancée');
        
        if (this.taskPreselectedCategories.length > 0) {
            details.push(`${this.taskPreselectedCategories.length} catégorie(s) démo`);
        }
        
        details.push('Données 100% simulées');
        
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
        
        console.log('[MinimalScan] 🚀 Démarrage simulation web');
        console.log('[MinimalScan] ⭐ Catégories de démonstration:', this.taskPreselectedCategories);
        
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
                scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Simulation en cours...</span>';
            }
            
            await this.executeWebSimulation();
            
            this.setActiveStep(3);
            this.completeScan();
            
        } catch (error) {
            console.error('[MinimalScan] ❌ Erreur simulation:', error);
            this.showScanError(error);
        }
    }

    async executeWebSimulation() {
        console.log('[MinimalScan] 🎭 Simulation web en cours...');
        
        const phases = [
            { progress: 10, message: 'Connexion au serveur de simulation...', status: 'Initialisation' },
            { progress: 25, message: 'Génération d\'emails de test...', status: 'Création données' },
            { progress: 40, message: 'Classification par IA...', status: 'Analyse intelligente' },
            { progress: 60, message: 'Catégorisation automatique...', status: 'Organisation' },
            { progress: 80, message: 'Détection tâches prioritaires...', status: 'Priorisation' },
            { progress: 95, message: 'Finalisation des résultats...', status: 'Compilation' },
            { progress: 100, message: 'Simulation terminée !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            // Délai réaliste pour la simulation
            const delay = Math.random() * 1000 + 500; // 500ms à 1.5s
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Générer des résultats simulés réalistes
        this.generateSimulatedResults();
    }

    generateSimulatedResults() {
        const emailCount = Math.floor(Math.random() * 50) + 50; // 50-100 emails
        const categorizedCount = Math.floor(emailCount * 0.85); // 85% catégorisés
        const preselectedCount = this.taskPreselectedCategories.length > 0 ? 
            Math.floor(categorizedCount * 0.3) : 0; // 30% pré-sélectionnés
        
        this.scanResults = {
            success: true,
            total: emailCount,
            categorized: categorizedCount,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: { 
                preselectedForTasks: preselectedCount,
                taskSuggestions: Math.floor(preselectedCount * 0.8),
                highConfidence: Math.floor(categorizedCount * 0.7),
                webSimulation: true
            },
            breakdown: this.generateCategoryBreakdown(categorizedCount)
        };
        
        console.log('[MinimalScan] 📊 Résultats simulés générés:', this.scanResults);
    }

    generateCategoryBreakdown(total) {
        const breakdown = {};
        
        // Distribution réaliste
        const distributions = {
            'commercial': 0.25,
            'tasks': 0.20,
            'meetings': 0.15,
            'finance': 0.10,
            'personal': 0.15,
            'other': 0.15
        };
        
        Object.entries(distributions).forEach(([category, ratio]) => {
            breakdown[category] = Math.floor(total * ratio);
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
                
                scanBtn.innerHTML = `<i class="fas fa-check"></i> <span>Simulation terminée !</span>`;
                scanBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                if (preselectedCount > 0) {
                    scanBtn.style.position = 'relative';
                    scanBtn.insertAdjacentHTML('beforeend', `
                        <span class="success-badge">
                            ⭐ ${preselectedCount} emails simulés
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
            webSimulation: true
        };
        
        try {
            localStorage.setItem('scanResults', JSON.stringify(essentialResults));
            console.log('[MinimalScan] 💾 Résultats sauvegardés en localStorage');
        } catch (error) {
            console.warn('[MinimalScan] Erreur stockage:', error);
        }
        
        // Notification web-friendly
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
            `✅ ${results.total} emails simulés<br>⭐ ${results.preselectedForTasks} pré-sélectionnés` :
            `✅ ${results.total} emails simulés`;
        
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
            
            <h1 class="scanner-title">Simulation Terminée !</h1>
            <p class="scanner-subtitle">Résultats de l'analyse intelligente</p>
            
            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${results.total}</div>
                        <div style="font-size: 14px; color: #6b7280;">Emails analysés</div>
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
                    <span>Nouvelle simulation</span>
                </button>
                
                <button class="scan-button-minimal" onclick="window.minimalScanModule.showDetailedResults()" 
                        style="width: auto; padding: 0 24px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                    <i class="fas fa-chart-bar"></i>
                    <span>Voir détails</span>
                </button>
            </div>
            
            <div class="scan-info" style="margin-top: 20px;">
                <div class="scan-info-main">
                    <i class="fas fa-info-circle"></i>
                    <span>Simulation réalisée avec données fictives</span>
                </div>
                <div class="scan-info-details">Durée: ${results.scanDuration}s • Mode: Démonstration Web</div>
            </div>
        `;
    }

    showDetailedResults() {
        if (!this.scanResults) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 30px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Résultats Détaillés</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">×</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #374151; margin-bottom: 10px;">📊 Statistiques Générales</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 10px;">
                        <div>• Total emails simulés: <strong>${this.scanResults.total}</strong></div>
                        <div>• Emails catégorisés: <strong>${this.scanResults.categorized}</strong> (${Math.round((this.scanResults.categorized / this.scanResults.total) * 100)}%)</div>
                        <div>• Pré-sélectionnés pour tâches: <strong>${this.scanResults.stats.preselectedForTasks}</strong></div>
                        <div>• Suggestions de tâches: <strong>${this.scanResults.stats.taskSuggestions}</strong></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #374151; margin-bottom: 10px;">🏷️ Répartition par Catégorie</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 10px;">
                        ${Object.entries(this.scanResults.breakdown).map(([cat, count]) => {
                            const category = this.getWebCompatibleCategories().find(c => c.name.toLowerCase() === cat) || 
                                           { icon: '📂', name: cat };
                            return `<div>${category.icon} ${category.name}: <strong>${count}</strong> emails</div>`;
                        }).join('')}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="this.closest('.modal-overlay').remove()" 
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer;">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
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
            webConfig: this.webConfig,
            webMode: true
        };
    }

    cleanup() {
        if (this.settingsCheckInterval) {
            clearInterval(this.settingsCheckInterval);
            this.settingsCheckInterval = null;
        }
        
        this.scanInProgress = false;
        this.isInitialized = false;
        
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
    console.group('🧪 TEST Scanner Web v10.0');
    console.log('Configuration:', window.minimalScanModule.webConfig);
    console.log('Paramètres:', window.minimalScanModule.settings);
    console.log('Catégories:', window.minimalScanModule.taskPreselectedCategories);
    console.log('Debug Info:', window.minimalScanModule.getDebugInfo());
    console.groupEnd();
    return { success: true, webMode: true };
};

window.simulateWebScan = function() {
    if (window.minimalScanModule.scanInProgress) {
        console.log('Simulation déjà en cours');
        return;
    }
    
    console.log('🚀 Démarrage simulation manuelle');
    window.minimalScanModule.startScan();
    return { success: true, message: 'Simulation démarrée' };
};

// Auto-initialisation si DOM prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[MinimalScan] 📱 DOM prêt - Scanner web initialisé');
    });
} else {
    console.log('[MinimalScan] 📱 Scanner web prêt');
}

console.log('✅ StartScan v10.0 loaded - Web Compatible Mode (coruscating-dodol-f30e8d.netlify.app)');
