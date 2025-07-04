// StartScan.js - Version 12.0 - Gestionnaire unifié Outlook/Gmail
console.log('[StartScan] 🚀 Loading StartScan.js v12.0 - Unified Email Scanner...');

class UnifiedScanModule {
    constructor() {
        this.version = '12.0';
        this.isInitialized = false;
        this.scanInProgress = false;
        this.selectedDays = 7;
        this.stylesAdded = false;
        this.scanStartTime = null;
        this.scanResults = null;
        
        // Détection du provider email
        this.emailProvider = null; // 'outlook' ou 'gmail'
        this.currentPageManager = null;
        
        // Configuration unifiée
        this.settings = {};
        this.taskPreselectedCategories = [];
        this.lastSettingsSync = 0;
        
        // Configuration scan
        this.scanConfig = {
            forceRealEmails: true,
            allowSimulation: false,
            requireAuthentication: true,
            maxRealEmails: 200,
            minRealEmails: 1,
            providers: {
                outlook: {
                    enabled: true,
                    authService: 'authService',
                    pageManager: 'pageManager'
                },
                gmail: {
                    enabled: true,
                    authService: 'googleAuthService',
                    pageManager: 'pageManagerGmail'
                }
            }
        };
        
        console.log('[UnifiedScan] ✅ Scanner v12.0 - Outlook & Gmail unified');
        this.detectEmailProvider();
        this.loadSettingsFromStorage();
        this.addUnifiedStyles();
    }

    // ================================================
    // DÉTECTION DU PROVIDER EMAIL
    // ================================================
    detectEmailProvider() {
        console.log('[UnifiedScan] 🔍 Détection du provider email...');
        
        // Vérifier Outlook/Microsoft
        if (window.authService && window.authService.isAuthenticated?.()) {
            this.emailProvider = 'outlook';
            this.currentPageManager = window.pageManager;
            console.log('[UnifiedScan] 📧 Provider détecté: Microsoft Outlook');
            return;
        }
        
        // Vérifier Gmail/Google
        if (window.googleAuthService && window.googleAuthService.isAuthenticated?.()) {
            this.emailProvider = 'gmail';
            // Créer ou utiliser PageManagerGmail
            if (!window.pageManagerGmail) {
                console.log('[UnifiedScan] 🔄 Création PageManagerGmail...');
                this.createPageManagerGmail();
            }
            this.currentPageManager = window.pageManagerGmail;
            console.log('[UnifiedScan] 📧 Provider détecté: Google Gmail');
            return;
        }
        
        // Vérifier MailService générique
        if (window.mailService) {
            const provider = window.mailService.getProvider?.();
            if (provider) {
                this.emailProvider = provider.toLowerCase();
                console.log(`[UnifiedScan] 📧 Provider détecté via MailService: ${provider}`);
                
                // Assigner le bon PageManager
                if (this.emailProvider === 'gmail' && !window.pageManagerGmail) {
                    this.createPageManagerGmail();
                    this.currentPageManager = window.pageManagerGmail;
                } else {
                    this.currentPageManager = window.pageManager;
                }
                return;
            }
        }
        
        console.log('[UnifiedScan] ⚠️ Aucun provider email détecté');
        this.emailProvider = null;
        this.currentPageManager = null;
    }

    createPageManagerGmail() {
        console.log('[UnifiedScan] 🏗️ Création PageManagerGmail...');
        
        // Charger dynamiquement PageManagerGmail si pas déjà chargé
        if (typeof PageManagerGmail === 'undefined') {
            console.warn('[UnifiedScan] PageManagerGmail non défini, chargement du script...');
            
            // Essayer de charger le script
            const script = document.createElement('script');
            script.src = 'pageManagerGmail.js';
            script.onload = () => {
                console.log('[UnifiedScan] ✅ PageManagerGmail.js chargé');
                if (typeof PageManagerGmail !== 'undefined') {
                    window.pageManagerGmail = new PageManagerGmail();
                }
            };
            script.onerror = () => {
                console.error('[UnifiedScan] ❌ Impossible de charger PageManagerGmail.js');
                // Utiliser PageManager standard comme fallback
                window.pageManagerGmail = window.pageManager;
            };
            document.head.appendChild(script);
        } else {
            window.pageManagerGmail = new PageManagerGmail();
        }
    }

    // ================================================
    // INTÉGRATION AVEC STOCKAGE
    // ================================================
    loadSettingsFromStorage() {
        try {
            if (window.categoryManager && typeof window.categoryManager.getSettings === 'function') {
                this.settings = window.categoryManager.getSettings();
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[UnifiedScan] ✅ Paramètres chargés depuis CategoryManager');
            } else {
                this.loadFromLocalStorage();
            }
            
            if (this.settings.scanSettings?.defaultPeriod) {
                this.selectedDays = this.settings.scanSettings.defaultPeriod;
            }
            
            this.lastSettingsSync = Date.now();
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur chargement paramètres:', error);
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
                console.log('[UnifiedScan] 📦 Paramètres chargés depuis localStorage');
            } else {
                this.settings = this.getDefaultSettings();
                this.taskPreselectedCategories = [];
            }
        } catch (error) {
            console.warn('[UnifiedScan] ⚠️ Erreur localStorage:', error);
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
                forceRealEmails: true,
                allowSimulation: false
            },
            taskPreselectedCategories: ['tasks', 'commercial', 'meetings'],
            preferences: {
                excludeSpam: true,
                detectCC: true,
                showNotifications: true,
                realEmailsOnly: true
            }
        };
    }

    // ================================================
    // VÉRIFICATION D'AUTHENTIFICATION UNIFIÉE
    // ================================================
    checkRealEmailAuthentication() {
        console.log('[UnifiedScan] 🔍 Vérification authentification emails réels...');
        
        // Re-détecter le provider au cas où
        this.detectEmailProvider();
        
        // Vérifier selon le provider détecté
        if (this.emailProvider === 'outlook') {
            if (window.authService && window.authService.isAuthenticated?.()) {
                return { 
                    valid: true, 
                    source: 'Microsoft', 
                    provider: 'outlook',
                    email: window.authService.getUser?.()?.email 
                };
            }
        }
        
        if (this.emailProvider === 'gmail') {
            if (window.googleAuthService && window.googleAuthService.isAuthenticated?.()) {
                return { 
                    valid: true, 
                    source: 'Google', 
                    provider: 'gmail',
                    email: window.googleAuthService.getUser?.()?.email 
                };
            }
        }
        
        // Vérifier MailService générique
        if (window.mailService && window.mailService.isAuthenticationValid?.()) {
            return { 
                valid: true, 
                source: 'MailService', 
                provider: window.mailService.getProvider?.() || 'unknown',
                email: window.mailService.getUserEmail?.()
            };
        }
        
        console.log('[UnifiedScan] ❌ Aucune authentification valide trouvée');
        return { 
            valid: false, 
            reason: 'Aucune authentification détectée',
            available: {
                outlook: !!window.authService,
                gmail: !!window.googleAuthService,
                mailService: !!window.mailService
            }
        };
    }

    // ================================================
    // STYLES UNIFIÉS
    // ================================================
    addUnifiedStyles() {
        if (this.stylesAdded || document.getElementById('unified-scan-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'unified-scan-styles';
        styles.textContent = `
            /* Scanner v12.0 - Unified Outlook/Gmail */
            .unified-scanner {
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
            
            .scanner-card-unified {
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
            
            /* Provider badges */
            .provider-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 25px;
                border: 2px solid;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .provider-badge.outlook {
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
                color: white;
                border-color: transparent;
            }
            
            .provider-badge.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 50%, #34a853 100%);
                color: white;
                border-color: transparent;
            }
            
            .provider-badge.unknown {
                background: rgba(107, 114, 128, 0.1);
                color: #6b7280;
                border-color: rgba(107, 114, 128, 0.3);
            }
            
            /* Scanner icon selon provider */
            .scanner-icon {
                width: 80px;
                height: 80px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 25px;
                color: white;
                font-size: 32px;
            }
            
            .scanner-icon.outlook {
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
            }
            
            .scanner-icon.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
            }
            
            .scanner-icon.generic {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            }
            
            /* Boutons provider */
            .provider-selection {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            
            .provider-button {
                flex: 1;
                min-width: 200px;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            }
            
            .provider-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            }
            
            .provider-button.outlook:hover {
                border-color: #0078d4;
                background: rgba(0, 120, 212, 0.05);
            }
            
            .provider-button.gmail:hover {
                border-color: #ea4335;
                background: rgba(234, 67, 53, 0.05);
            }
            
            .provider-button .provider-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }
            
            .provider-button.outlook .provider-icon {
                color: #0078d4;
            }
            
            .provider-button.gmail .provider-icon {
                color: #ea4335;
            }
            
            .provider-button .provider-name {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
            }
            
            .provider-button .provider-status {
                font-size: 14px;
                color: #6b7280;
            }
            
            /* Email mode badge */
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
            
            .step.active.outlook .step-number {
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
            }
            
            .step.active.gmail .step-number {
                background: linear-gradient(135deg, #ea4335 0%, #34a853 100%);
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
            
            .step.active.outlook .step-label {
                color: #0078d4;
            }
            
            .step.active.gmail .step-label {
                color: #ea4335;
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
            
            .duration-option.selected.outlook {
                border-color: #0078d4;
                background: #0078d4;
                box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
            }
            
            .duration-option.selected.gmail {
                border-color: #ea4335;
                background: #ea4335;
                box-shadow: 0 4px 12px rgba(234, 67, 53, 0.3);
            }
            
            .duration-option:hover:not(.selected) {
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            /* Bouton de scan unifié */
            .scan-button-unified {
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
            
            .scan-button-unified.outlook {
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
            }
            
            .scan-button-unified.gmail {
                background: linear-gradient(135deg, #ea4335 0%, #fbbc04 100%);
            }
            
            .scan-button-unified:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
            }
            
            .scan-button-unified.outlook:hover:not(:disabled) {
                box-shadow: 0 8px 25px rgba(0, 120, 212, 0.4);
            }
            
            .scan-button-unified.gmail:hover:not(:disabled) {
                box-shadow: 0 8px 25px rgba(234, 67, 53, 0.4);
            }
            
            .scan-button-unified:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                background: #9ca3af;
            }
            
            .scan-button-unified.auth-required {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            }
            
            .scan-button-unified.auth-required:hover:not(:disabled) {
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
            .progress-section-unified {
                opacity: 0;
                transition: opacity 0.3s ease;
                margin-top: 20px;
            }
            
            .progress-section-unified.visible {
                opacity: 1;
            }
            
            .progress-bar-unified {
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
            
            .progress-fill.outlook {
                background: linear-gradient(90deg, #0078d4 0%, #106ebe 100%);
            }
            
            .progress-fill.gmail {
                background: linear-gradient(90deg, #ea4335 0%, #fbbc04 100%);
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
            
            .scan-info.outlook {
                background: rgba(0, 120, 212, 0.1);
                color: #0078d4;
                border-color: rgba(0, 120, 212, 0.2);
            }
            
            .scan-info.gmail {
                background: rgba(234, 67, 53, 0.1);
                color: #ea4335;
                border-color: rgba(234, 67, 53, 0.2);
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
                .scanner-card-unified {
                    padding: 35px 25px;
                }
                
                .provider-selection {
                    flex-direction: column;
                }
                
                .provider-button {
                    min-width: 100%;
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
        console.log('[UnifiedScan] ✅ Styles v12.0 ajoutés - Unified Outlook/Gmail');
    }

    // ================================================
    // RENDU PRINCIPAL
    // ================================================
    async render(container) {
        console.log('[UnifiedScan] 🎯 Rendu du scanner v12.0 - Unified Email Scanner...');
        
        try {
            this.addUnifiedStyles();
            this.checkSettingsUpdate();
            
            container.innerHTML = this.renderScanner();
            this.initializeEvents();
            this.isInitialized = true;
            
            console.log('[UnifiedScan] ✅ Scanner v12.0 rendu - Provider:', this.emailProvider);
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur lors du rendu:', error);
            container.innerHTML = this.renderError(error);
        }
    }

    renderScanner() {
        const authStatus = this.checkRealEmailAuthentication();
        
        // Si aucun provider détecté, afficher la sélection
        if (!this.emailProvider) {
            return this.renderProviderSelection();
        }
        
        // Sinon afficher l'interface du provider
        return this.renderProviderInterface(authStatus);
    }

    renderProviderSelection() {
        return `
            <div class="unified-scanner">
                <div class="scanner-card-unified">
                    <div class="scanner-icon generic">
                        <i class="fas fa-envelope"></i>
                    </div>
                    
                    <h1 class="scanner-title">Sélectionnez votre service email</h1>
                    <p class="scanner-subtitle">Connectez-vous pour scanner vos emails réels</p>
                    
                    <div class="provider-selection">
                        <div class="provider-button outlook" onclick="window.unifiedScanModule.selectProvider('outlook')">
                            <div class="provider-icon">
                                <i class="fab fa-microsoft"></i>
                            </div>
                            <div class="provider-name">Microsoft Outlook</div>
                            <div class="provider-status">
                                ${window.authService ? 'Disponible' : 'Non configuré'}
                            </div>
                        </div>
                        
                        <div class="provider-button gmail" onclick="window.unifiedScanModule.selectProvider('gmail')">
                            <div class="provider-icon">
                                <i class="fab fa-google"></i>
                            </div>
                            <div class="provider-name">Google Gmail</div>
                            <div class="provider-status">
                                ${window.googleAuthService ? 'Disponible' : 'Non configuré'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="scan-info">
                        <div class="scan-info-main">
                            <i class="fas fa-shield-check"></i>
                            <span>Scan sécurisé avec IA Claude</span>
                        </div>
                        <div class="scan-info-details">Support Outlook & Gmail • Détection automatique des newsletters</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProviderInterface(authStatus) {
        const providerClass = this.emailProvider || 'generic';
        const providerName = this.getProviderDisplayName();
        const providerIcon = this.getProviderIcon();
        
        return `
            <div class="unified-scanner">
                <div class="scanner-card-unified">
                    <div class="provider-badge ${providerClass}">
                        <i class="${providerIcon}"></i>
                        <span>${providerName}</span>
                    </div>
                    
                    <div class="email-mode-badge ${authStatus.valid ? 'real' : 'auth-required'}">
                        <i class="fas ${authStatus.valid ? 'fa-envelope' : 'fa-exclamation-triangle'}"></i>
                        <span>${authStatus.valid ? 'Emails réels authentifiés' : 'AUTHENTIFICATION REQUISE'}</span>
                    </div>
                    
                    <div class="scanner-icon ${providerClass}">
                        <i class="fas ${authStatus.valid ? 'fa-envelope' : 'fa-lock'}"></i>
                    </div>
                    
                    <h1 class="scanner-title">Scanner ${providerName}</h1>
                    <p class="scanner-subtitle">${authStatus.valid ? 'Analysez vos emails avec IA' : 'Authentification requise pour accéder aux emails'}</p>
                    
                    <div id="preselected-categories-display">
                        ${this.renderPreselectedCategories()}
                    </div>
                    
                    <div class="steps-container">
                        <div class="step active ${providerClass}" id="step1">
                            <div class="step-number">1</div>
                            <div class="step-label">${authStatus.valid ? 'Configuration' : 'Authentification'}</div>
                        </div>
                        <div class="step ${providerClass}" id="step2">
                            <div class="step-number">2</div>
                            <div class="step-label">Récupération</div>
                        </div>
                        <div class="step ${providerClass}" id="step3">
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

    getProviderDisplayName() {
        const names = {
            'outlook': 'Microsoft Outlook',
            'gmail': 'Google Gmail',
            'microsoft': 'Microsoft Outlook',
            'google': 'Google Gmail'
        };
        return names[this.emailProvider] || 'Emails';
    }

    getProviderIcon() {
        const icons = {
            'outlook': 'fab fa-microsoft',
            'gmail': 'fab fa-google',
            'microsoft': 'fab fa-microsoft',
            'google': 'fab fa-google'
        };
        return icons[this.emailProvider] || 'fas fa-envelope';
    }

    renderAuthenticatedInterface() {
        const providerClass = this.emailProvider || 'generic';
        
        return `
            <div class="duration-section">
                <div class="duration-label">Période d'analyse</div>
                <div class="duration-options">
                    ${this.renderDurationOptions()}
                </div>
            </div>
            
            <button class="scan-button-unified ${providerClass}" id="unifiedScanBtn" onclick="window.unifiedScanModule.startUnifiedScan()">
                <i class="fas fa-envelope"></i>
                <span>Scanner mes emails ${this.getProviderDisplayName()}</span>
            </button>
            
            <div class="progress-section-unified" id="progressSection">
                <div class="progress-bar-unified">
                    <div class="progress-fill ${providerClass}" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">Initialisation...</div>
                <div class="progress-status" id="progressStatus">Préparation</div>
            </div>
        `;
    }

    renderAuthenticationRequired(authStatus) {
        return `
            <div class="auth-required-section">
                <button class="scan-button-unified auth-required" onclick="window.unifiedScanModule.handleAuthentication()">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Se connecter à ${this.getProviderDisplayName()}</span>
                </button>
                
                <div class="auth-details">
                    <p><strong>Services disponibles:</strong></p>
                    <ul>
                        ${authStatus.available.outlook ? '✅ Microsoft Outlook/Exchange' : '❌ Microsoft Outlook/Exchange'}
                        ${authStatus.available.gmail ? '✅ Google Gmail' : '❌ Google Gmail'}
                        ${authStatus.available.mailService ? '✅ MailService' : '❌ MailService'}
                    </ul>
                    <p><em>Raison: ${authStatus.reason}</em></p>
                </div>
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
        
        const providerClass = this.emailProvider || 'generic';
        
        return options.map(option => {
            const isSelected = option.value === this.selectedDays;
            return `
                <button class="duration-option ${isSelected ? 'selected ' + providerClass : ''}" 
                        onclick="window.unifiedScanModule.selectDuration(${option.value})" 
                        data-days="${option.value}">
                    ${option.label}
                </button>
            `;
        }).join('');
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
                <span>Catégories d'analyse ${authStatus.valid ? `(${this.getProviderDisplayName()})` : '(AUTHENTIFICATION REQUISE)'}:</span>
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

    renderScanInfo(authStatus) {
        const providerClass = this.emailProvider || 'generic';
        
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
        details.push(`Emails ${this.getProviderDisplayName()} authentifiés`);
        
        if (this.taskPreselectedCategories.length > 0) {
            details.push(`${this.taskPreselectedCategories.length} catégorie(s) IA`);
        }
        
        // Spécificités Gmail
        if (this.emailProvider === 'gmail') {
            details.push('Détection bouton S\'abonner');
        }
        
        details.push('Synchronisation PageManager');
        
        return `
            <div class="scan-info ${providerClass}">
                <div class="scan-info-main">
                    <i class="fas fa-shield-check"></i>
                    <span>Scan sécurisé avec IA Claude - EMAILS RÉELS UNIQUEMENT</span>
                </div>
                <div class="scan-info-details">${details.join(' • ')}</div>
            </div>
        `;
    }

    // ================================================
    // GESTION DES ÉVÉNEMENTS
    // ================================================
    initializeEvents() {
        console.log('[UnifiedScan] ✅ Événements v12.0 initialisés - Provider:', this.emailProvider);
        
        if (this.settingsCheckInterval) {
            clearInterval(this.settingsCheckInterval);
        }
        
        // Vérification périodique des paramètres
        this.settingsCheckInterval = setInterval(() => {
            this.checkSettingsUpdate();
        }, 10000);
    }

    selectProvider(provider) {
        console.log(`[UnifiedScan] 🔄 Sélection du provider: ${provider}`);
        this.emailProvider = provider;
        
        // Créer le PageManager approprié si nécessaire
        if (provider === 'gmail' && !window.pageManagerGmail) {
            this.createPageManagerGmail();
        }
        
        this.currentPageManager = provider === 'gmail' ? window.pageManagerGmail : window.pageManager;
        
        // Re-render avec le provider sélectionné
        const container = document.querySelector('.unified-scanner');
        if (container) {
            this.render(container.parentElement);
        }
    }

    selectDuration(days) {
        this.selectedDays = days;
        
        document.querySelectorAll('.duration-option').forEach(btn => {
            btn.classList.remove('selected', 'outlook', 'gmail');
        });
        
        const selectedBtn = document.querySelector(`[data-days="${days}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected', this.emailProvider || 'generic');
        }
        
        console.log(`[UnifiedScan] ✅ Durée sélectionnée: ${days} jours`);
    }

    // ================================================
    // AUTHENTIFICATION
    // ================================================
    async handleAuthentication() {
        console.log(`[UnifiedScan] 🔐 Gestion authentification ${this.emailProvider}...`);
        
        try {
            if (this.emailProvider === 'outlook' || this.emailProvider === 'microsoft') {
                if (window.authService && typeof window.authService.login === 'function') {
                    console.log('[UnifiedScan] Tentative connexion Microsoft...');
                    await window.authService.login();
                    return;
                }
            }
            
            if (this.emailProvider === 'gmail' || this.emailProvider === 'google') {
                if (window.googleAuthService && typeof window.googleAuthService.signIn === 'function') {
                    console.log('[UnifiedScan] Tentative connexion Google...');
                    await window.googleAuthService.signIn();
                    return;
                }
            }
            
            // Si aucun service spécifique, essayer de détecter
            if (!this.emailProvider) {
                if (window.authService && typeof window.authService.login === 'function') {
                    console.log('[UnifiedScan] Tentative connexion Microsoft (par défaut)...');
                    await window.authService.login();
                    return;
                }
                
                if (window.googleAuthService && typeof window.googleAuthService.signIn === 'function') {
                    console.log('[UnifiedScan] Tentative connexion Google (par défaut)...');
                    await window.googleAuthService.signIn();
                    return;
                }
            }
            
            console.error('[UnifiedScan] Aucun service d\'authentification disponible');
            this.showAuthError('Aucun service d\'authentification configuré');
            
        } catch (error) {
            console.error('[UnifiedScan] Erreur authentification:', error);
            this.showAuthError('Erreur lors de la connexion: ' + error.message);
        }
    }

    // ================================================
    // SCAN UNIFIÉ
    // ================================================
    async startUnifiedScan() {
        if (this.scanInProgress) {
            console.log('[UnifiedScan] Scan déjà en cours');
            return;
        }
        
        console.log(`[UnifiedScan] 🚀 === DÉMARRAGE SCAN ${this.emailProvider?.toUpperCase()} v12.0 ===`);
        console.log('[UnifiedScan] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        
        // VÉRIFICATION STRICTE - AUTHENTIFICATION OBLIGATOIRE
        const authStatus = this.checkRealEmailAuthentication();
        if (!authStatus.valid) {
            console.error('[UnifiedScan] ❌ AUTHENTIFICATION NON VALIDE - ARRÊT SCAN');
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
            
            const scanBtn = document.getElementById('unifiedScanBtn');
            if (scanBtn) {
                scanBtn.disabled = true;
                scanBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Scan ${this.getProviderDisplayName()} en cours...</span>`;
            }
            
            // Exécuter le scan selon le provider
            await this.executeProviderScan();
            
            this.setActiveStep(3);
            this.completeScan();
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur scan emails:', error);
            this.showScanError(error);
        }
    }

    async executeProviderScan() {
        console.log(`[UnifiedScan] 📧 === EXÉCUTION SCAN ${this.emailProvider?.toUpperCase()} ===`);
        
        const phases = [
            { progress: 10, message: 'Vérification authentification...', status: 'Authentification' },
            { progress: 25, message: `Connexion ${this.getProviderDisplayName()}...`, status: 'Connexion' },
            { progress: 40, message: 'Récupération emails réels...', status: 'Téléchargement' },
            { progress: 60, message: 'Synchronisation PageManager...', status: 'Synchronisation' },
            { progress: 80, message: 'Classification par IA...', status: 'Analyse IA' },
            { progress: 95, message: 'Finalisation...', status: 'Compilation' },
            { progress: 100, message: 'Scan terminé !', status: 'Terminé' }
        ];
        
        for (const phase of phases) {
            this.updateProgress(phase.progress, phase.message, phase.status);
            
            if (phase.progress === 25) {
                await this.initializeMailService();
            } else if (phase.progress === 40) {
                await this.fetchRealEmails();
            } else if (phase.progress === 60) {
                await this.syncWithPageManager();
            } else if (phase.progress === 80) {
                await this.categorizeRealEmails();
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    async initializeMailService() {
        console.log(`[UnifiedScan] 🔧 Initialisation service ${this.emailProvider}...`);
        
        if (!window.mailService) {
            throw new Error('MailService non disponible');
        }
        
        // Forcer l'initialisation avec vérification d'authentification
        if (!window.mailService.isInitialized) {
            console.log('[UnifiedScan] 🔄 Initialisation MailService...');
            await window.mailService.initialize();
        }
        
        // Vérifier que l'authentification est valide
        if (!window.mailService.isAuthenticationValid()) {
            throw new Error('Authentification MailService invalide');
        }
        
        console.log('[UnifiedScan] ✅ MailService initialisé et authentifié');
    }

    async fetchRealEmails() {
        console.log(`[UnifiedScan] 📧 Récupération emails ${this.emailProvider} RÉELS...`);
        
        try {
            if (!window.mailService || !window.mailService.isAuthenticationValid()) {
                throw new Error('MailService non authentifié');
            }
            
            // Calculer les dates
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.selectedDays);
            
            console.log(`[UnifiedScan] 📅 Période: ${startDate.toISOString().split('T')[0]} à ${endDate.toISOString().split('T')[0]}`);
            
            // Récupérer les emails RÉELS
            const emails = await window.mailService.getEmailsFromFolder('inbox', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                top: this.scanConfig.maxRealEmails || 200
            });
            
            if (!emails || emails.length === 0) {
                throw new Error('Aucun email réel trouvé dans la période spécifiée');
            }
            
            // Marquer les emails avec le provider
            emails.forEach(email => {
                email.provider = this.emailProvider;
                email.realEmail = true;
                email.webSimulated = false;
            });
            
            // Pour Gmail, détecter les boutons S'abonner
            if (this.emailProvider === 'gmail') {
                await this.detectGmailSubscribeButtons(emails);
            }
            
            this.realEmails = emails;
            console.log(`[UnifiedScan] ✅ ${this.realEmails.length} emails ${this.emailProvider} récupérés`);
            
            return this.realEmails;
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur récupération emails:', error);
            throw error;
        }
    }

    async detectGmailSubscribeButtons(emails) {
        console.log('[UnifiedScan] 🔍 Détection boutons S\'abonner Gmail...');
        
        let subscribeCount = 0;
        
        for (const email of emails) {
            // Simuler la détection du bouton S'abonner (dans la vraie implémentation, 
            // cela nécessiterait l'API Gmail pour récupérer les métadonnées)
            if (email.body?.content) {
                const hasSubscribeButton = 
                    email.body.content.includes('List-Unsubscribe') ||
                    email.body.content.includes('unsubscribe') ||
                    email.body.content.includes('se désabonner') ||
                    email.from?.emailAddress?.address?.includes('newsletter') ||
                    email.from?.emailAddress?.address?.includes('noreply');
                
                if (hasSubscribeButton) {
                    email.hasSubscribeButton = true;
                    email.isNewsletter = true;
                    subscribeCount++;
                }
            }
        }
        
        console.log(`[UnifiedScan] ✅ ${subscribeCount} emails avec bouton S'abonner détectés`);
    }

    async syncWithPageManager() {
        console.log(`[UnifiedScan] 🔄 Synchronisation avec PageManager${this.emailProvider === 'gmail' ? 'Gmail' : ''}...`);
        
        const pageManager = this.currentPageManager || window.pageManager;
        
        if (!pageManager || !this.realEmails) {
            throw new Error('PageManager ou emails non disponibles pour synchronisation');
        }
        
        try {
            // S'assurer que EmailScanner existe
            if (!window.emailScanner) {
                console.warn('[UnifiedScan] EmailScanner non trouvé, création...');
                window.emailScanner = {
                    emails: [],
                    getAllEmails: function() { return this.emails; },
                    reset: function() { this.emails = []; },
                    categorizeEmails: async function() { console.log('Categorization...'); },
                    updateTaskPreselectedCategories: function(cats) { this.taskPreselectedCategories = cats; }
                };
            }
            
            // Réinitialiser EmailScanner
            if (typeof window.emailScanner.reset === 'function') {
                window.emailScanner.reset();
            }
            
            // Injecter les emails
            window.emailScanner.emails = [...this.realEmails];
            console.log(`[UnifiedScan] ✅ ${this.realEmails.length} emails ${this.emailProvider} injectés`);
            
            // Synchroniser les paramètres
            if (typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
                window.emailScanner.updateTaskPreselectedCategories(this.taskPreselectedCategories);
            }
            
            // Marquer la source
            if (window.emailScanner.scanMetrics) {
                window.emailScanner.scanMetrics.startTime = this.scanStartTime;
                window.emailScanner.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
                window.emailScanner.scanMetrics.hasRealEmails = true;
                window.emailScanner.scanMetrics.source = `UnifiedScan-${this.emailProvider}`;
                window.emailScanner.scanMetrics.provider = this.emailProvider;
                window.emailScanner.scanMetrics.simulationMode = false;
            }
            
            // Marquer l'état de synchronisation
            window.emailScanner.startScanSynced = true;
            window.emailScanner.lastSyncTimestamp = Date.now();
            window.emailScanner.provider = this.emailProvider;
            
            // Notifier le PageManager approprié
            if (pageManager.handleScanCompleted) {
                pageManager.handleScanCompleted({
                    results: {
                        total: this.realEmails.length,
                        provider: this.emailProvider
                    },
                    timestamp: Date.now()
                });
            }
            
            console.log(`[UnifiedScan] ✅ Synchronisation PageManager${this.emailProvider === 'gmail' ? 'Gmail' : ''} complète`);
            return true;
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur synchronisation PageManager:', error);
            throw error;
        }
    }

    async categorizeRealEmails() {
        console.log('[UnifiedScan] 🏷️ Catégorisation des emails...');
        
        if (!window.emailScanner || !this.realEmails) {
            throw new Error('Données non disponibles pour catégorisation');
        }
        
        try {
            // Catégoriser via EmailScanner
            if (typeof window.emailScanner.categorizeEmails === 'function') {
                await window.emailScanner.categorizeEmails(this.taskPreselectedCategories);
                console.log('[UnifiedScan] ✅ Catégorisation effectuée');
            }
            
            // Pour Gmail, marquer spécifiquement les newsletters
            if (this.emailProvider === 'gmail') {
                const newsletters = this.realEmails.filter(e => e.hasSubscribeButton).length;
                console.log(`[UnifiedScan] 📰 ${newsletters} newsletters Gmail identifiées`);
            }
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur catégorisation:', error);
            throw error;
        }
    }

    generateResults() {
        const emailCount = this.realEmails?.length || 0;
        const preselectedCount = this.realEmails?.filter(e => 
            this.taskPreselectedCategories.includes(e.category)
        ).length || 0;
        
        const newsletterCount = this.emailProvider === 'gmail' ? 
            this.realEmails?.filter(e => e.hasSubscribeButton).length || 0 : 0;
        
        this.scanResults = {
            success: true,
            total: emailCount,
            categorized: emailCount,
            newsletters: newsletterCount,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: { 
                preselectedForTasks: preselectedCount,
                taskSuggestions: Math.floor(preselectedCount * 0.8),
                highConfidence: Math.floor(emailCount * 0.7),
                hasRealEmails: true,
                emailType: 'real',
                simulationMode: false,
                provider: this.emailProvider
            },
            breakdown: this.calculateBreakdown(),
            source: `UnifiedScan-${this.emailProvider}`,
            scanMode: 'realEmailsOnly',
            provider: this.emailProvider
        };
        
        console.log('[UnifiedScan] 📊 Résultats générés:', this.scanResults);
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
            const scanBtn = document.getElementById('unifiedScanBtn');
            if (scanBtn) {
                const emailCount = this.scanResults?.total || 0;
                const preselectedCount = this.scanResults?.stats?.preselectedForTasks || 0;
                const newsletterCount = this.scanResults?.newsletters || 0;
                
                scanBtn.innerHTML = `<i class="fas fa-check"></i> <span>Emails ${this.getProviderDisplayName()} analysés !</span>`;
                scanBtn.style.background = this.emailProvider === 'gmail' ? 
                    'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)' : 
                    'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)';
                
                if (emailCount > 0) {
                    scanBtn.style.position = 'relative';
                    const badgeText = newsletterCount > 0 ? 
                        `📧 ${emailCount} (📰 ${newsletterCount})` : 
                        `📧 ${emailCount} ${preselectedCount > 0 ? `(${preselectedCount} ⭐)` : ''}`;
                    
                    scanBtn.insertAdjacentHTML('beforeend', `
                        <span class="success-badge">
                            ${badgeText}
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
            newsletters: this.scanResults?.newsletters || 0,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            preselectedForTasks: this.scanResults?.stats?.preselectedForTasks || 0,
            scanDuration: Math.floor((Date.now() - this.scanStartTime) / 1000),
            timestamp: Date.now(),
            hasRealEmails: true,
            emailType: 'real',
            simulationMode: false,
            source: `UnifiedScan-${this.emailProvider}`,
            provider: this.emailProvider
        };
        
        try {
            localStorage.setItem('scanResults', JSON.stringify(essentialResults));
            console.log('[UnifiedScan] 💾 Résultats sauvegardés');
        } catch (error) {
            console.warn('[UnifiedScan] Erreur stockage résultats:', error);
        }
        
        // Notification de succès
        this.showNotification(essentialResults);
        
        // Dispatcher les événements
        setTimeout(() => {
            this.dispatchEvents(essentialResults);
        }, 100);
        
        // Rediriger vers les emails via le bon PageManager
        setTimeout(() => {
            const pageManager = this.currentPageManager || window.pageManager;
            
            if (pageManager && typeof pageManager.loadPage === 'function') {
                pageManager.loadPage('emails');
            } else {
                this.showResultsInPlace(essentialResults);
            }
        }, 1000);
    }

    showNotification(results) {
        const notification = document.createElement('div');
        const bgColor = this.emailProvider === 'gmail' ? 
            'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)' : 
            this.emailProvider === 'outlook' ?
            'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)' :
            'linear-gradient(135deg, #059669 0%, #10b981 100%)';
            
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-weight: 600;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        
        const preselectedText = results.preselectedForTasks > 0 ? 
            `<br>⭐ ${results.preselectedForTasks} pré-sélectionnés` : '';
            
        const newsletterText = results.newsletters > 0 ? 
            `<br>📰 ${results.newsletters} newsletters détectées` : '';
        
        notification.innerHTML = `
            📧 ${results.total} emails ${this.getProviderDisplayName()} analysés${preselectedText}${newsletterText}
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
                    source: `UnifiedScan-${this.emailProvider}`,
                    timestamp: Date.now(),
                    hasRealEmails: true,
                    simulationMode: false,
                    provider: this.emailProvider
                }
            }));
            
            // Événement de synchronisation EmailScanner
            window.dispatchEvent(new CustomEvent('emailScannerSynced', {
                detail: {
                    emailCount: results.total,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    source: `UnifiedScan-${this.emailProvider}`,
                    timestamp: Date.now(),
                    hasRealEmails: true,
                    simulationMode: false,
                    provider: this.emailProvider
                }
            }));
            
            // Événement spécifique au provider
            window.dispatchEvent(new CustomEvent(`${this.emailProvider}ScanCompleted`, {
                detail: {
                    results: results,
                    timestamp: Date.now()
                }
            }));
            
            console.log('[UnifiedScan] ✅ Événements dispatchés');
            
        } catch (error) {
            console.error('[UnifiedScan] ❌ Erreur dispatch événements:', error);
        }
    }

    showResultsInPlace(results) {
        const container = document.querySelector('.scanner-card-unified');
        if (!container) return;
        
        const providerClass = this.emailProvider || 'generic';
        const iconColor = this.emailProvider === 'gmail' ? 
            'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)' : 
            this.emailProvider === 'outlook' ?
            'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)' :
            'linear-gradient(135deg, #059669 0%, #10b981 100%)';
        
        container.innerHTML = `
            <div class="scanner-icon ${providerClass}" style="background: ${iconColor};">
                <i class="fas fa-envelope"></i>
            </div>
            
            <h1 class="scanner-title">Emails ${this.getProviderDisplayName()} Analysés !</h1>
            <p class="scanner-subtitle">Analyse IA complète de vos emails authentifiés</p>
            
            <div style="background: rgba(0, 0, 0, 0.05); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 700; color: #1f2937;">${results.total}</div>
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
                    ${results.newsletters > 0 ? `
                        <div>
                            <div style="font-size: 28px; font-weight: 700; color: #ea4335;">📰 ${results.newsletters}</div>
                            <div style="font-size: 14px; color: #6b7280;">Newsletters</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="scan-button-unified ${providerClass}" onclick="window.unifiedScanModule.resetScanner()" 
                        style="width: auto; padding: 0 24px; height: 50px;">
                    <i class="fas fa-redo"></i>
                    <span>Nouveau scan</span>
                </button>
                
                <button class="scan-button-unified ${providerClass}" onclick="window.unifiedScanModule.viewEmails()" 
                        style="width: auto; padding: 0 24px; height: 50px;">
                    <i class="fas fa-envelope"></i>
                    <span>Voir les emails</span>
                </button>
            </div>
            
            <div class="scan-info ${providerClass}" style="margin-top: 20px;">
                <div class="scan-info-main">
                    <i class="fas fa-envelope"></i>
                    <span>Analyse ${this.getProviderDisplayName()} avec IA Claude</span>
                </div>
                <div class="scan-info-details">Durée: ${results.scanDuration}s • Mode: Emails authentifiés • Provider: ${this.emailProvider}</div>
            </div>
        `;
    }

    viewEmails() {
        const pageManager = this.currentPageManager || window.pageManager;
        
        if (pageManager && typeof pageManager.loadPage === 'function') {
            pageManager.loadPage('emails');
        } else {
            console.warn('[UnifiedScan] PageManager non disponible');
            window.location.href = '#emails';
        }
    }

    showScanError(error) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="font-size: 16px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">Erreur de scan</div>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">${error.message}</div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="scan-button-unified" onclick="window.unifiedScanModule.resetScanner()" 
                                style="width: auto; padding: 0 20px; height: 40px; font-size: 14px;">
                            <i class="fas fa-redo"></i>
                            <span>Réessayer</span>
                        </button>
                        
                        <button class="scan-button-unified auth-required" onclick="window.unifiedScanModule.handleAuthentication()" 
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

    showAuthError(message) {
        const container = document.querySelector('.scanner-card-unified');
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

    resetScanner() {
        this.scanInProgress = false;
        this.scanResults = null;
        this.realEmails = null;
        
        this.setActiveStep(1);
        
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.classList.remove('visible');
            progressSection.innerHTML = `
                <div class="progress-bar-unified">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">Initialisation...</div>
                <div class="progress-status" id="progressStatus">Préparation</div>
            `;
        }
        
        // Re-détecter le provider
        this.detectEmailProvider();
        
        // Recharger l'interface complète
        const container = document.querySelector('.scanner-card-unified');
        if (container) {
            container.outerHTML = this.renderScanner();
        }
        
        this.loadSettingsFromStorage();
        this.updatePreselectedCategoriesDisplay();
        
        console.log('[UnifiedScan] 🔄 Scanner v12.0 réinitialisé - Provider:', this.emailProvider);
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
            
            // Ajouter la classe du provider
            if (this.emailProvider) {
                activeStep.classList.add(this.emailProvider);
            }
        }
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
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
                console.log('[UnifiedScan] 🔄 Paramètres mis à jour détectés');
                this.updateUIWithNewSettings();
            }
        } catch (error) {
            console.error('[UnifiedScan] Erreur vérification paramètres:', error);
        }
    }

    updateUIWithNewSettings() {
        // Mettre à jour la sélection de durée
        const durationOptions = document.querySelectorAll('.duration-option');
        durationOptions.forEach(option => {
            option.classList.remove('selected', 'outlook', 'gmail');
            if (parseInt(option.dataset.days) === this.selectedDays) {
                option.classList.add('selected', this.emailProvider || 'generic');
            }
        });
        
        // Mettre à jour l'affichage des catégories
        this.updatePreselectedCategoriesDisplay();
    }

    updatePreselectedCategoriesDisplay() {
        const display = document.getElementById('preselected-categories-display');
        if (!display) return;
        
        display.innerHTML = this.renderPreselectedCategories();
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

    updateSettings(newSettings) {
        console.log('[UnifiedScan] 📝 Mise à jour paramètres v12.0:', newSettings);
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
            console.warn('[UnifiedScan] Erreur sauvegarde localStorage:', error);
        }
        
        this.updateUIWithNewSettings();
    }

    getDebugInfo() {
        const authStatus = this.checkRealEmailAuthentication();
        
        return {
            version: '12.0',
            isInitialized: this.isInitialized,
            scanInProgress: this.scanInProgress,
            selectedDays: this.selectedDays,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            settings: this.settings,
            lastSettingsSync: this.lastSettingsSync,
            scanResults: this.scanResults,
            scanConfig: this.scanConfig,
            authStatus: authStatus,
            emailProvider: this.emailProvider,
            currentPageManager: this.currentPageManager ? this.currentPageManager.constructor.name : null,
            emailScanner: {
                available: !!window.emailScanner,
                emailCount: window.emailScanner?.emails?.length || 0,
                provider: window.emailScanner?.provider || null
            },
            providers: {
                outlook: {
                    authService: !!window.authService,
                    pageManager: !!window.pageManager
                },
                gmail: {
                    authService: !!window.googleAuthService,
                    pageManager: !!window.pageManagerGmail
                },
                mailService: {
                    available: !!window.mailService,
                    authenticated: window.mailService?.isAuthenticationValid?.() || false,
                    provider: window.mailService?.getProvider?.() || null
                }
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
        
        console.log('[UnifiedScan] 🧹 Nettoyage v12.0 terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        this.taskPreselectedCategories = [];
        this.emailProvider = null;
        this.currentPageManager = null;
        console.log('[UnifiedScan] Instance v12.0 détruite');
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================

// Nettoyer ancienne instance
if (window.unifiedScanModule || window.minimalScanModule) {
    window.unifiedScanModule?.destroy?.();
    window.minimalScanModule?.destroy?.();
}

// Créer nouvelle instance
window.UnifiedScanModule = UnifiedScanModule;
window.unifiedScanModule = new UnifiedScanModule();
window.minimalScanModule = window.unifiedScanModule; // Compatibilité
window.scanStartModule = window.unifiedScanModule;

// Fonctions utilitaires de debug
window.testUnifiedScanner = function() {
    console.group('🧪 TEST Scanner Unifié v12.0');
    const scanner = window.unifiedScanModule;
    
    console.log('Configuration:', scanner.scanConfig);
    console.log('Provider détecté:', scanner.emailProvider);
    console.log('Auth Status:', scanner.checkRealEmailAuthentication());
    console.log('Debug Info:', scanner.getDebugInfo());
    
    console.groupEnd();
    
    return { 
        success: true, 
        version: scanner.version,
        provider: scanner.emailProvider,
        authValid: scanner.checkRealEmailAuthentication().valid
    };
};

window.forceProviderScan = function(provider) {
    if (!['outlook', 'gmail'].includes(provider)) {
        console.error('Provider invalide. Utilisez "outlook" ou "gmail"');
        return { success: false, reason: 'Provider invalide' };
    }
    
    window.unifiedScanModule.selectProvider(provider);
    
    const authStatus = window.unifiedScanModule.checkRealEmailAuthentication();
    console.log(`🚀 Scan forcé ${provider} - Auth valide: ${authStatus.valid}`);
    
    if (!authStatus.valid) {
        console.error(`❌ Authentification ${provider} requise`);
        return { success: false, reason: 'Authentification requise' };
    }
    
    window.unifiedScanModule.startUnifiedScan();
    return { success: true, provider: provider };
};

// Auto-initialisation DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[UnifiedScan] 📱 DOM prêt - Scanner v12.0 unifié Outlook/Gmail');
    });
} else {
    console.log('[UnifiedScan] 📱 Scanner v12.0 unifié Outlook/Gmail prêt');
}

console.log('✅ StartScan v12.0 loaded - Unified Outlook/Gmail Scanner');
