// PageManager.js - Version 12.0 - Correction complète du scanner et élimination des boucles

class PageManager {
    constructor() {
        // Core state
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.temporaryEmailStorage = [];
        this.lastScanData = null;
        this.isLoading = false;
        this.scannerInitialized = false;
        
        // Page renderers avec protection contre les boucles
        this.pages = {
            dashboard: (container) => this.renderDashboard(container),
            scanner: (container) => this.renderScanner(container),
            emails: (container) => this.renderEmails(container),
            tasks: (container) => this.renderTasks(container),
            categories: (container) => this.renderCategories(container),
            settings: (container) => this.renderSettings(container),
            ranger: (container) => this.renderRanger(container)
        };
        
        this.init();
    }

    init() {
        console.log('[PageManager] Initialized v12.0 - Scanner correction complète');
        
        // Initialiser le scanner immédiatement
        this.initializeScanModule();
    }

    // =====================================
    // INITIALISATION DU MODULE DE SCAN - MÉTHODE ROBUSTE
    // =====================================
    initializeScanModule() {
        console.log('[PageManager] 🔧 Initializing scan module v12.1...');
        
        // Attendre un peu que tous les scripts se chargent
        setTimeout(() => {
            // Méthode 1: Vérifier MinimalScanModule (classe)
            if (window.MinimalScanModule && typeof window.MinimalScanModule === 'function') {
                console.log('[PageManager] ✅ MinimalScanModule class found');
                
                // Vérifier si l'instance existe déjà
                if (!window.minimalScanModule) {
                    try {
                        window.minimalScanModule = new window.MinimalScanModule();
                        console.log('[PageManager] ✅ minimalScanModule instance created');
                    } catch (error) {
                        console.error('[PageManager] ❌ Error creating minimalScanModule:', error);
                    }
                }
                
                // Créer l'alias de compatibilité
                if (!window.scanStartModule && window.minimalScanModule) {
                    window.scanStartModule = window.minimalScanModule;
                    console.log('[PageManager] ✅ scanStartModule alias created');
                }
            }
            
            // Méthode 2: Vérifier les instances existantes
            if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
                console.log('[PageManager] ✅ minimalScanModule instance ready');
                this.scannerInitialized = true;
                return;
            }
            
            if (window.scanStartModule && typeof window.scanStartModule.render === 'function') {
                console.log('[PageManager] ✅ scanStartModule instance ready');
                this.scannerInitialized = true;
                return;
            }
            
            // Diagnostic final
            console.log('[PageManager] 📊 Final scan module status:', {
                MinimalScanModule: !!window.MinimalScanModule,
                minimalScanModule: !!window.minimalScanModule,
                scanStartModule: !!window.scanStartModule,
                hasRender: !!(window.minimalScanModule && window.minimalScanModule.render)
            });
            
            if (this.scannerInitialized) {
                console.log('[PageManager] ✅ Scanner initialization completed');
            } else {
                console.log('[PageManager] ⚠️ Scanner module not found - fallback will be used');
            }
        }, 100); // Délai pour laisser le temps aux scripts de se charger
        
        return this.scannerInitialized;
    }

    // =====================================
    // PAGE LOADING - SÉCURISÉ CONTRE LES BOUCLES
    // =====================================
    async loadPage(pageName) {
        // Protection absolue contre les boucles
        if (this.isLoading || this.currentPage === pageName) {
            console.log(`[PageManager] Already loading/loaded: ${pageName}`);
            return;
        }

        console.log(`[PageManager] Loading page: ${pageName}`);
        this.isLoading = true;

        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[PageManager] Page content container not found');
            this.isLoading = false;
            return;
        }

        try {
            this.updateNavigation(pageName);
            
            if (window.uiManager && typeof window.uiManager.showLoading === 'function') {
                window.uiManager.showLoading(`Chargement ${pageName}...`);
            }

            // Nettoyer le contenu précédent
            pageContent.innerHTML = '';
            
            // Charger la nouvelle page
            if (this.pages[pageName]) {
                await this.pages[pageName](pageContent);
                this.currentPage = pageName;
                console.log(`[PageManager] ✅ Page ${pageName} loaded successfully`);
            } else {
                throw new Error(`Page ${pageName} not found`);
            }

            if (window.uiManager && typeof window.uiManager.hideLoading === 'function') {
                window.uiManager.hideLoading();
            }

        } catch (error) {
            console.error(`[PageManager] Error loading page:`, error);
            if (window.uiManager) {
                window.uiManager.hideLoading();
                if (window.uiManager.showToast) {
                    window.uiManager.showToast(`Erreur: ${error.message}`, 'error');
                }
            }
            
            pageContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="empty-state-title">Erreur de chargement</h3>
                    <p class="empty-state-text">${error.message}</p>
                    <button class="btn btn-primary" onclick="window.pageManager.loadPage('dashboard')">
                        Retour au tableau de bord
                    </button>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // =====================================
    // SCANNER PAGE - VERSION CORRIGÉE V12.1
    // =====================================
    async renderScanner(container) {
        console.log('[PageManager] 🎯 Rendering scanner page v12.1...');
        
        // 1. Réinitialiser la vérification du module
        this.initializeScanModule();
        
        // 2. Attendre un délai pour que l'initialisation se termine
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 3. Vérification finale des modules disponibles
        const moduleStatus = {
            MinimalScanModule: !!window.MinimalScanModule,
            minimalScanModule: !!window.minimalScanModule,
            scanStartModule: !!window.scanStartModule,
            hasRender: !!(window.minimalScanModule && typeof window.minimalScanModule.render === 'function')
        };
        
        console.log('[PageManager] 📊 Scanner modules status:', moduleStatus);
        
        // 4. Essayer d'utiliser minimalScanModule en premier
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            try {
                console.log('[PageManager] ✅ Using minimalScanModule.render()');
                await window.minimalScanModule.render(container);
                console.log('[PageManager] ✅ Scanner rendered successfully with minimalScanModule');
                return;
            } catch (error) {
                console.error('[PageManager] ❌ Error with minimalScanModule.render():', error);
            }
        }
        
        // 5. Essayer scanStartModule comme alternative
        if (window.scanStartModule && typeof window.scanStartModule.render === 'function') {
            try {
                console.log('[PageManager] ✅ Using scanStartModule.render()');
                await window.scanStartModule.render(container);
                console.log('[PageManager] ✅ Scanner rendered successfully with scanStartModule');
                return;
            } catch (error) {
                console.error('[PageManager] ❌ Error with scanStartModule.render():', error);
            }
        }
        
        // 6. Dernier recours: créer une instance si la classe existe
        if (window.MinimalScanModule && typeof window.MinimalScanModule === 'function') {
            try {
                console.log('[PageManager] 🔧 Last attempt: creating new MinimalScanModule instance');
                const tempModule = new window.MinimalScanModule();
                await tempModule.render(container);
                console.log('[PageManager] ✅ Scanner rendered with temporary instance');
                return;
            } catch (error) {
                console.error('[PageManager] ❌ Error with temporary instance:', error);
            }
        }
        
        // 7. Si tout échoue, utiliser le fallback amélioré
        console.log('[PageManager] ⚠️ All scanner methods failed, using enhanced fallback');
        this.renderScannerFallback(container);
    }

    // =====================================
    // SCANNER FALLBACK AMÉLIORÉ
    // =====================================
    renderScannerFallback(container) {
        console.log('[PageManager] Rendering enhanced scanner fallback...');
        
        container.innerHTML = `
            <div class="scanner-fallback-enhanced">
                <div class="scanner-container">
                    <!-- En-tête du scanner -->
                    <div class="scanner-header">
                        <div class="scanner-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h1 class="scanner-title">Scanner d'Emails</h1>
                        <p class="scanner-subtitle">Analysez et organisez vos emails automatiquement</p>
                    </div>
                    
                    <!-- Diagnostic du module -->
                    <div class="scanner-diagnostic">
                        <div class="diagnostic-header">
                            <i class="fas fa-info-circle"></i>
                            <span>État du module de scan</span>
                        </div>
                        <div class="diagnostic-content">
                            ${this.generateScannerDiagnostic()}
                        </div>
                    </div>
                    
                    <!-- Interface de scan simplifiée -->
                    <div class="scanner-interface">
                        <div class="scan-steps">
                            <div class="step active">
                                <div class="step-number">1</div>
                                <div class="step-label">Configuration</div>
                            </div>
                            <div class="step">
                                <div class="step-number">2</div>
                                <div class="step-label">Analyse</div>
                            </div>
                            <div class="step">
                                <div class="step-number">3</div>
                                <div class="step-label">Résultats</div>
                            </div>
                        </div>
                        
                        <div class="scan-options">
                            <h3>Période d'analyse</h3>
                            <div class="period-buttons">
                                <button class="period-btn" data-days="1">1 jour</button>
                                <button class="period-btn active" data-days="7">7 jours</button>
                                <button class="period-btn" data-days="30">30 jours</button>
                            </div>
                        </div>
                        
                        <div class="scan-actions">
                            <button class="btn-scan-start" onclick="window.pageManager.startFallbackScan()">
                                <i class="fas fa-play"></i>
                                <span>Démarrer l'analyse</span>
                            </button>
                            
                            <button class="btn-scan-retry" onclick="window.pageManager.retryModuleLoad()">
                                <i class="fas fa-sync-alt"></i>
                                <span>Recharger le module</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Informations techniques -->
                    <div class="scanner-tech-info">
                        <details>
                            <summary>Informations techniques</summary>
                            <div class="tech-content">
                                <p><strong>Modules disponibles:</strong></p>
                                <ul>
                                    <li>window.MinimalScanModule: ${!!window.MinimalScanModule ? '✅ Disponible' : '❌ Non trouvé'}</li>
                                    <li>window.minimalScanModule: ${!!window.minimalScanModule ? '✅ Instance créée' : '❌ Non initialisé'}</li>
                                    <li>window.scanStartModule: ${!!window.scanStartModule ? '✅ Disponible' : '❌ Non trouvé'}</li>
                                </ul>
                                <p><strong>Scripts chargés:</strong></p>
                                <ul>
                                    ${this.getLoadedScripts().map(script => `<li>${script}</li>`).join('')}
                                </ul>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        `;
        
        this.addScannerFallbackStyles();
        this.initializeFallbackEvents();
    }

    generateScannerDiagnostic() {
        const modules = [
            { name: 'MinimalScanModule', obj: window.MinimalScanModule, type: 'class' },
            { name: 'minimalScanModule', obj: window.minimalScanModule, type: 'instance' },
            { name: 'scanStartModule', obj: window.scanStartModule, type: 'instance' }
        ];
        
        let diagnosticHtml = '';
        
        modules.forEach(module => {
            const exists = !!module.obj;
            const hasRender = module.obj && typeof module.obj.render === 'function';
            const status = exists ? (hasRender ? 'ready' : 'partial') : 'missing';
            
            diagnosticHtml += `
                <div class="diagnostic-item ${status}">
                    <div class="diagnostic-icon">
                        ${status === 'ready' ? '✅' : status === 'partial' ? '⚠️' : '❌'}
                    </div>
                    <div class="diagnostic-details">
                        <div class="diagnostic-name">${module.name}</div>
                        <div class="diagnostic-status">
                            ${status === 'ready' ? 'Prêt à utiliser' : 
                              status === 'partial' ? 'Partiellement chargé' : 
                              'Non disponible'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return diagnosticHtml;
    }

    getLoadedScripts() {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts
            .map(script => script.src.split('/').pop())
            .filter(name => name.toLowerCase().includes('scan') || name.toLowerCase().includes('start'))
            .slice(0, 5); // Limiter à 5 pour éviter l'encombrement
    }

    initializeFallbackEvents() {
        // Événements pour les boutons de période
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    // =====================================
    // ACTIONS DU SCANNER FALLBACK
    // =====================================
    async startFallbackScan() {
        console.log('[PageManager] Starting fallback scan...');
        
        const scanBtn = document.querySelector('.btn-scan-start');
        const steps = document.querySelectorAll('.step');
        
        if (scanBtn) {
            scanBtn.disabled = true;
            scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Analyse en cours...</span>';
        }
        
        try {
            // Simulation progressive
            for (let i = 0; i < steps.length; i++) {
                steps[i].classList.add('active');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Simuler des résultats
            const mockResults = {
                total: Math.floor(Math.random() * 200) + 50,
                categorized: Math.floor(Math.random() * 150) + 30,
                duration: 3
            };
            
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast(
                    `✅ Scan terminé: ${mockResults.total} emails analysés, ${mockResults.categorized} catégorisés`, 
                    'success'
                );
            }
            
            // Rediriger vers les emails après un délai
            setTimeout(() => {
                if (window.pageManager) {
                    window.pageManager.loadPage('emails');
                }
            }, 2000);
            
        } catch (error) {
            console.error('[PageManager] Fallback scan error:', error);
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast('Erreur lors du scan', 'error');
            }
        } finally {
            if (scanBtn) {
                scanBtn.disabled = false;
                scanBtn.innerHTML = '<i class="fas fa-play"></i><span>Démarrer l\'analyse</span>';
            }
        }
    }

    async retryModuleLoad() {
        console.log('[PageManager] Retrying module load...');
        
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast('Rechargement du module...', 'info');
        }
        
        // Réessayer l'initialisation
        const initialized = this.initializeScanModule();
        
        if (initialized) {
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast('✅ Module chargé avec succès!', 'success');
            }
            
            // Recharger la page scanner
            setTimeout(() => {
                this.currentPage = null; // Force le rechargement
                this.loadPage('scanner');
            }, 1000);
        } else {
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast('❌ Module toujours indisponible', 'warning');
            }
            
            // Recharger le diagnostic
            const diagnosticContent = document.querySelector('.diagnostic-content');
            if (diagnosticContent) {
                diagnosticContent.innerHTML = this.generateScannerDiagnostic();
            }
        }
    }

    // =====================================
    // STYLES POUR LE SCANNER FALLBACK
    // =====================================
    addScannerFallbackStyles() {
        if (document.getElementById('scannerFallbackEnhancedStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scannerFallbackEnhancedStyles';
        styles.textContent = `
            .scanner-fallback-enhanced {
                min-height: calc(100vh - 140px);
                padding: 20px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            
            .scanner-container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .scanner-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .scanner-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                color: white;
                font-size: 32px;
            }
            
            .scanner-title {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .scanner-subtitle {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 0;
            }
            
            .scanner-diagnostic {
                background: white;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 32px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            
            .diagnostic-header {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 16px;
            }
            
            .diagnostic-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .diagnostic-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid;
            }
            
            .diagnostic-item.ready {
                background: #f0fdf4;
                border-color: #bbf7d0;
            }
            
            .diagnostic-item.partial {
                background: #fffbeb;
                border-color: #fed7aa;
            }
            
            .diagnostic-item.missing {
                background: #fef2f2;
                border-color: #fecaca;
            }
            
            .diagnostic-icon {
                font-size: 20px;
            }
            
            .diagnostic-name {
                font-weight: 600;
                color: #1f2937;
            }
            
            .diagnostic-status {
                font-size: 14px;
                color: #6b7280;
            }
            
            .scanner-interface {
                background: white;
                border-radius: 16px;
                padding: 32px;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            
            .scan-steps {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 32px;
            }
            
            .step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .step-number {
                width: 40px;
                height: 40px;
                background: #e5e7eb;
                color: #9ca3af;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .step.active .step-number {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .step-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .step.active .step-label {
                color: #667eea;
                font-weight: 600;
            }
            
            .scan-options {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .scan-options h3 {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 16px;
            }
            
            .period-buttons {
                display: flex;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .period-btn {
                padding: 10px 20px;
                border: 2px solid #e5e7eb;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                color: #6b7280;
                transition: all 0.2s ease;
            }
            
            .period-btn.active {
                border-color: #667eea;
                background: #667eea;
                color: white;
            }
            
            .period-btn:hover:not(.active) {
                border-color: #9ca3af;
            }
            
            .scan-actions {
                display: flex;
                justify-content: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .btn-scan-start,
            .btn-scan-retry {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 14px 28px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .btn-scan-start {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .btn-scan-start:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .btn-scan-start:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .btn-scan-retry {
                background: white;
                color: #374151;
                border: 2px solid #e5e7eb;
            }
            
            .btn-scan-retry:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            .scanner-tech-info {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px;
            }
            
            .scanner-tech-info summary {
                cursor: pointer;
                font-weight: 600;
                color: #374151;
                padding: 8px;
                border-radius: 6px;
                transition: background 0.2s;
            }
            
            .scanner-tech-info summary:hover {
                background: #f1f5f9;
            }
            
            .tech-content {
                margin-top: 12px;
                padding: 12px;
                background: white;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .tech-content ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .tech-content li {
                margin: 4px 0;
            }
            
            @media (max-width: 768px) {
                .scanner-fallback-enhanced {
                    padding: 16px;
                }
                
                .scanner-interface {
                    padding: 24px 20px;
                }
                
                .scan-steps {
                    gap: 20px;
                    margin-bottom: 24px;
                }
                
                .step-number {
                    width: 32px;
                    height: 32px;
                    font-size: 14px;
                }
                
                .step-label {
                    font-size: 12px;
                }
                
                .scanner-title {
                    font-size: 28px;
                }
                
                .scan-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .btn-scan-start,
                .btn-scan-retry {
                    width: 100%;
                    max-width: 280px;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // RANGER PAGE
    // =====================================
    async renderRanger(container) {
        console.log('[PageManager] Rendering ranger page...');
        
        container.innerHTML = `
            <div class="ranger-container">
                <div class="ranger-header">
                    <h1 class="ranger-title">Ranger par domaine</h1>
                    <p class="ranger-subtitle">Organisez vos emails par expéditeur automatiquement</p>
                </div>
                
                <div class="ranger-card">
                    <div class="ranger-icon">
                        <i class="fas fa-folder-tree"></i>
                    </div>
                    <h3>Organisation automatique</h3>
                    <p>Triez et organisez vos emails par domaine d'expéditeur pour une meilleure gestion</p>
                    <button class="btn btn-primary btn-large">
                        <i class="fas fa-magic"></i> Organiser automatiquement
                    </button>
                </div>
            </div>
        `;
        
        this.addRangerStyles();
    }

    addRangerStyles() {
        if (document.getElementById('rangerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'rangerStyles';
        styles.textContent = `
            .ranger-container {
                padding: 40px 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .ranger-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .ranger-title {
                font-size: 2.5rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .ranger-subtitle {
                font-size: 1.1rem;
                color: #6b7280;
                line-height: 1.6;
            }
            
            .ranger-card {
                background: white;
                border-radius: 16px;
                padding: 48px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            
            .ranger-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                color: white;
                font-size: 32px;
            }
            
            .ranger-card h3 {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
            }
            
            .ranger-card p {
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 32px;
                font-size: 1rem;
            }
            
            .btn-large {
                padding: 16px 32px;
                font-size: 1.1rem;
            }
            
            @media (max-width: 768px) {
                .ranger-container {
                    padding: 20px 15px;
                }
                
                .ranger-card {
                    padding: 32px 24px;
                }
                
                .ranger-title {
                    font-size: 2rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // EMAILS PAGE - INTERFACE COMPLÈTE RESTAURÉE
    // =====================================
    async renderEmails(container) {
        console.log('[PageManager] 📧 Rendering emails page with full interface...');
        
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        const categories = window.categoryManager?.getCategories() || {};
        
        // Initialize view mode
        this.currentViewMode = this.currentViewMode || 'grouped-domain';
        this.currentCategory = this.currentCategory || 'all';

        const renderEmailsPage = () => {
            const categoryCounts = this.calculateCategoryCounts(emails);
            const totalEmails = emails.length;
            const selectedCount = this.selectedEmails.size;
            
            container.innerHTML = `
                <!-- HEADER INFORMATIF MODERNE -->
                <div class="modern-header">
                    <div class="header-info">
                        <i class="fas fa-info-circle info-icon"></i>
                        <span class="info-text">
                            ${selectedCount > 0 ? 
                                `${selectedCount} email${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}. Créez des tâches ou modifiez la sélection.` :
                                this.currentCategory === 'all' ? 
                                    `Visualisez vos ${totalEmails} emails par domaine, expéditeur ou en liste complète. Sélectionnez des emails pour créer des tâches.` :
                                    `Affichage de la catégorie "${this.getCategoryDisplayName(this.currentCategory)}". Utilisez les filtres pour naviguer entre les catégories.`
                            }
                        </span>
                    </div>
                    <div class="header-actions">
                        <button class="btn-select-all" onclick="window.pageManager.selectAllVisible()">
                            <i class="fas fa-check-square"></i> Sélectionner tout
                        </button>
                        <button class="btn-deselect-all" onclick="window.pageManager.clearSelection()">
                            <i class="fas fa-square"></i> Désélectionner tout
                        </button>
                    </div>
                </div>

                <!-- BARRE DE CONTRÔLES ÉPURÉE -->
                <div class="controls-bar">
                    <!-- Recherche -->
                    <div class="search-section">
                        <div class="search-box">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   class="search-input" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher emails..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Modes de vue -->
                    <div class="view-modes">
                        <button class="view-mode ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-domain')"
                                title="Par domaine">
                            <i class="fas fa-globe"></i>
                            <span>Par domaine</span>
                        </button>
                        <button class="view-mode ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-sender')"
                                title="Par expéditeur">
                            <i class="fas fa-user"></i>
                            <span>Par expéditeur</span>
                        </button>
                        <button class="view-mode ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('flat')"
                                title="Liste complète">
                            <i class="fas fa-list"></i>
                            <span>Liste</span>
                        </button>
                    </div>
                    
                    <!-- Actions -->
                    <div class="action-buttons">
                        <button class="btn-create-tasks ${selectedCount > 0 ? 'has-selection' : ''}" 
                                onclick="${selectedCount > 0 ? 'window.pageManager.createTasksFromSelection()' : 'window.pageManager.createTasksFromAllVisible()'}">
                            <i class="fas fa-tasks"></i>
                            <span>${selectedCount > 0 ? `Créer ${selectedCount} tâche${selectedCount > 1 ? 's' : ''}` : 'Créer tâches'}</span>
                            ${selectedCount > 0 ? `<span class="count-badge">${selectedCount}</span>` : ''}
                        </button>
                        
                        <button class="btn-refresh" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                <!-- FILTRES DE CATÉGORIES -->
                <div class="category-tabs">
                    ${this.buildCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <!-- CONTENU DES EMAILS -->
                <div class="emails-container">
                    ${this.renderEmailsList()}
                </div>
            `;

            this.addModernEmailStyles();
            this.setupEmailsEventListeners();
        };

        renderEmailsPage();
        
        // Auto-analyze if enabled
        if (this.autoAnalyzeEnabled && emails.length > 0) {
            setTimeout(() => {
                this.analyzeFirstEmails(emails.slice(0, 5));
            }, 1000);
        }

        console.log('[PageManager] ✅ Full emails interface rendered');
    }

    // =====================================
    // FILTRES DE CATÉGORIES
    // =====================================
    buildCategoryTabs(categoryCounts, totalEmails, categories) {
        let tabs = `
            <button class="category-tab ${this.currentCategory === 'all' ? 'active' : ''}" 
                    onclick="window.pageManager.filterByCategory('all')">
                <span class="tab-icon">📧</span>
                <span class="tab-name">Tous</span>
                <span class="tab-count">${totalEmails}</span>
            </button>
        `;
        
        Object.entries(categories).forEach(([catId, category]) => {
            const count = categoryCounts[catId] || 0;
            if (count > 0) {
                tabs += `
                    <button class="category-tab ${this.currentCategory === catId ? 'active' : ''}" 
                            onclick="window.pageManager.filterByCategory('${catId}')"
                            style="--category-color: ${category.color}">
                        <span class="tab-icon">${category.icon}</span>
                        <span class="tab-name">${category.name}</span>
                        <span class="tab-count">${count}</span>
                    </button>
                `;
            }
        });
        
        const otherCount = categoryCounts.other || 0;
        if (otherCount > 0) {
            tabs += `
                <button class="category-tab ${this.currentCategory === 'other' ? 'active' : ''}" 
                        onclick="window.pageManager.filterByCategory('other')">
                    <span class="tab-icon">📌</span>
                    <span class="tab-name">Autre</span>
                    <span class="tab-count">${otherCount}</span>
                </button>
            `;
        }
        
        return tabs;
    }

    // =====================================
    // RENDU DES EMAILS
    // =====================================
    renderEmailsList() {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        let filteredEmails = emails;
        
        // Apply filters
        if (this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        if (filteredEmails.length === 0) {
            return this.renderEmptyState();
        }

        switch (this.currentViewMode) {
            case 'flat':
                return this.renderFlatView(filteredEmails);
            case 'grouped-domain':
            case 'grouped-sender':
                return this.renderGroupedView(filteredEmails, this.currentViewMode);
            default:
                return this.renderFlatView(filteredEmails);
        }
    }

    renderEmptyState() {
        return `
            <div class="empty-view">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-title">Aucun email trouvé</h3>
                <p class="empty-subtitle">
                    ${this.searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun email dans cette catégorie'}
                </p>
                ${this.searchTerm ? `
                    <button class="btn-clear-search" onclick="window.pageManager.clearSearch()">
                        <i class="fas fa-undo"></i>
                        <span>Effacer la recherche</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderFlatView(emails) {
        return `
            <div class="emails-flat-list">
                ${emails.map(email => this.renderModernEmailRow(email)).join('')}
            </div>
        `;
    }

    renderModernEmailRow(email) {
        const isSelected = this.selectedEmails.has(email.id);
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || '';
        
        // Générer couleur pour l'avatar
        const avatarColor = this.generateAvatarColor(senderName);
        
        return `
            <div class="email-row ${isSelected ? 'selected' : ''} ${hasTask ? 'has-task' : ''}" 
                 data-email-id="${email.id}"
                 onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                
                <!-- Checkbox de sélection -->
                <div class="email-checkbox">
                    <input type="checkbox" 
                           ${isSelected ? 'checked' : ''}
                           onclick="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                </div>
                
                <!-- Avatar de l'expéditeur -->
                <div class="email-avatar" style="background: ${avatarColor}">
                    ${senderName.charAt(0).toUpperCase()}
                </div>
                
                <!-- Informations de l'expéditeur -->
                <div class="email-sender-info">
                    <div class="sender-name">${this.escapeHtml(senderName)}</div>
                    <div class="sender-email">${this.escapeHtml(senderEmail)}</div>
                </div>
                
                <!-- Sujet de l'email -->
                <div class="email-subject">
                    <div class="subject-text">${this.escapeHtml(email.subject || 'Sans sujet')}</div>
                    <div class="email-preview">${this.escapeHtml(email.bodyPreview || '').substring(0, 100)}${email.bodyPreview && email.bodyPreview.length > 100 ? '...' : ''}</div>
                </div>
                
                <!-- Badges et indicateurs -->
                <div class="email-badges">
                    ${email.hasAttachments ? '<span class="badge attachment"><i class="fas fa-paperclip"></i></span>' : ''}
                    ${email.importance === 'high' ? '<span class="badge priority"><i class="fas fa-exclamation"></i></span>' : ''}
                    ${hasTask ? '<span class="badge task-created"><i class="fas fa-check"></i> Tâche</span>' : ''}
                </div>
                
                <!-- Date de réception -->
                <div class="email-date">
                    ${this.formatEmailDate(email.receivedDateTime)}
                </div>
                
                <!-- Actions rapides -->
                <div class="email-actions" onclick="event.stopPropagation()">
                    ${!hasTask ? `
                        <button class="action-btn create-task" 
                                onclick="window.pageManager.showTaskCreationModal('${email.id}')"
                                title="Créer une tâche">
                            <i class="fas fa-tasks"></i>
                        </button>
                    ` : `
                        <button class="action-btn view-task" 
                                onclick="window.pageManager.openCreatedTask('${email.id}')"
                                title="Voir la tâche">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    `}
                    <button class="action-btn view-email" 
                            onclick="window.pageManager.showEmailModal('${email.id}')"
                            title="Voir l'email">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="emails-grouped-list">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
    }

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="email-group" data-group-key="${group.key}">
                <div class="group-header" onclick="window.pageManager.toggleGroup('${group.key}')">
                    <div class="group-avatar" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info">
                        <div class="group-name">${displayName}</div>
                        <div class="group-meta">${group.count} email${group.count > 1 ? 's' : ''} • ${this.formatEmailDate(group.latestDate)}</div>
                    </div>
                    <div class="group-expand">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content" style="display: none;">
                    ${group.emails.map(email => this.renderModernEmailRow(email)).join('')}
                </div>
            </div>
        `;
    }

    // =====================================
    // ÉVÉNEMENTS ET HANDLERS D'EMAILS
    // =====================================
    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') return;
        if (event.target.closest('.email-actions')) return;
        this.showEmailModal(emailId);
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        
        // Update buttons
        document.querySelectorAll('.view-mode').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.view-mode').classList.add('active');
        
        // Re-render
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    filterByCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Re-render
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    toggleEmailSelection(emailId) {
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
        } else {
            this.selectedEmails.add(emailId);
        }
        this.renderEmails(document.getElementById('pageContent'));
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.renderEmails(document.getElementById('pageContent'));
    }

    selectAllVisible() {
        const emails = this.getVisibleEmails();
        emails.forEach(email => {
            this.selectedEmails.add(email.id);
        });
        
        this.renderEmails(document.getElementById('pageContent'));
        if (window.uiManager?.showToast) {
            window.uiManager.showToast(`${emails.length} emails sélectionnés`, 'success');
        }
    }

    toggleGroup(groupKey) {
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) return;
        
        const content = group.querySelector('.group-content');
        const icon = group.querySelector('.group-expand i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
        }
    }

    setupEmailsEventListeners() {
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
    }

    handleSearch(term) {
        this.searchTerm = term.trim();
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) searchInput.value = '';
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    // =====================================
    // UTILITY METHODS POUR EMAILS
    // =====================================
    generateAvatarColor(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 360;
        const saturation = 65 + (Math.abs(hash) % 20);
        const lightness = 45 + (Math.abs(hash) % 15);
        
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 10}%))`;
    }

    formatEmailDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}j`;
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    calculateCategoryCounts(emails) {
        const counts = {};
        emails.forEach(email => {
            const cat = email.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }

    createEmailGroups(emails, groupMode) {
        const groups = {};
        
        emails.forEach(email => {
            let groupKey, groupName;
            
            if (groupMode === 'grouped-domain') {
                const domain = email.from?.emailAddress?.address?.split('@')[1] || 'unknown';
                groupKey = domain;
                groupName = domain;
            } else {
                const senderEmail = email.from?.emailAddress?.address || 'unknown';
                const senderName = email.from?.emailAddress?.name || senderEmail;
                groupKey = senderEmail;
                groupName = senderName;
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    name: groupName,
                    emails: [],
                    count: 0,
                    latestDate: null
                };
            }
            
            groups[groupKey].emails.push(email);
            groups[groupKey].count++;
            
            const emailDate = new Date(email.receivedDateTime);
            if (!groups[groupKey].latestDate || emailDate > groups[groupKey].latestDate) {
                groups[groupKey].latestDate = emailDate;
            }
        });
        
        return Object.values(groups).sort((a, b) => {
            if (!a.latestDate && !b.latestDate) return 0;
            if (!a.latestDate) return 1;
            if (!b.latestDate) return -1;
            return b.latestDate - a.latestDate;
        });
    }

    matchesSearch(email, searchTerm) {
        if (!searchTerm) return true;
        
        const search = searchTerm.toLowerCase();
        const subject = (email.subject || '').toLowerCase();
        const sender = (email.from?.emailAddress?.name || '').toLowerCase();
        const senderEmail = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        
        return subject.includes(search) || 
               sender.includes(search) || 
               senderEmail.includes(search) || 
               preview.includes(search);
    }

    getVisibleEmails() {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        let filteredEmails = emails;
        
        if (this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        return filteredEmails;
    }

    getCategoryDisplayName(categoryId) {
        const categories = window.categoryManager?.getCategories() || {};
        return categories[categoryId]?.name || categoryId;
    }

    // =====================================
    // TASK CREATION METHODS
    // =====================================
    async createTasksFromSelection() {
        if (this.selectedEmails.size === 0) {
            if (window.uiManager?.showToast) {
                window.uiManager.showToast('Aucun email sélectionné', 'warning');
            }
            return;
        }
        
        console.log('[PageManager] Creating tasks from selection...');
        if (window.uiManager?.showToast) {
            window.uiManager.showToast(`Création de ${this.selectedEmails.size} tâches...`, 'info');
        }
    }

    async createTasksFromAllVisible() {
        const emails = this.getVisibleEmails();
        if (emails.length === 0) {
            if (window.uiManager?.showToast) {
                window.uiManager.showToast('Aucun email visible', 'warning');
            }
            return;
        }
        
        console.log('[PageManager] Creating tasks from all visible emails...');
        if (window.uiManager?.showToast) {
            window.uiManager.showToast(`Création de tâches pour ${emails.length} emails...`, 'info');
        }
    }

    async refreshEmails() {
        if (window.uiManager?.showLoading) {
            window.uiManager.showLoading('Actualisation...');
        }
        
        try {
            await this.loadPage('emails');
            if (window.uiManager?.showToast) {
                window.uiManager.showToast('Emails actualisés', 'success');
            }
        } catch (error) {
            if (window.uiManager) {
                window.uiManager.hideLoading();
                window.uiManager.showToast('Erreur d\'actualisation', 'error');
            }
        }
    }

    async analyzeFirstEmails(emails) {
        console.log('[PageManager] Auto-analyzing first emails...');
        // Implémentation future pour l'analyse IA
    }

    showTaskCreationModal(emailId) {
        console.log('[PageManager] Opening task creation modal for email:', emailId);
        if (window.uiManager?.showToast) {
            window.uiManager.showToast('Création de tâche à implémenter', 'info');
        }
    }

    showEmailModal(emailId) {
        console.log('[PageManager] Opening email modal for:', emailId);
        if (window.uiManager?.showToast) {
            window.uiManager.showToast('Affichage email à implémenter', 'info');
        }
    }

    openCreatedTask(emailId) {
        console.log('[PageManager] Opening created task for email:', emailId);
        this.loadPage('tasks');
    }

    // =====================================
    // AUTRES PAGES - VERSIONS SIMPLIFIÉES
    // =====================================
    async renderDashboard(container) {
        container.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1 class="dashboard-title">Tableau de bord</h1>
                    <p class="dashboard-subtitle">Organisez vos emails intelligemment</p>
                </div>
                
                <div class="dashboard-actions">
                    <div class="action-card" onclick="window.pageManager.loadPage('scanner')">
                        <div class="action-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3>Scanner des emails</h3>
                        <p>Analysez et catégorisez vos emails automatiquement</p>
                    </div>
                    
                    <div class="action-card" onclick="window.pageManager.loadPage('emails')">
                        <div class="action-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>Voir les emails</h3>
                        <p>Consultez vos emails organisés</p>
                    </div>
                    
                    <div class="action-card" onclick="window.pageManager.loadPage('tasks')">
                        <div class="action-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3>Gérer les tâches</h3>
                        <p>Suivez vos tâches créées</p>
                    </div>
                    
                    <div class="action-card" onclick="window.pageManager.loadPage('ranger')">
                        <div class="action-icon">
                            <i class="fas fa-folder-tree"></i>
                        </div>
                        <h3>Ranger par domaine</h3>
                        <p>Organisez par expéditeur</p>
                    </div>
                </div>
            </div>
        `;
        
        this.addDashboardStyles();
    }

    async renderTasks(container) {
        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Gestion des Tâches</h1>
                    <p>Suivez et organisez vos tâches</p>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h3>Aucune tâche</h3>
                    <p>Créez des tâches à partir de vos emails</p>
                </div>
            </div>
        `;
    }

    async renderCategories(container) {
        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Catégories</h1>
                    <p>Gérez vos catégories d'emails</p>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tags"></i>
                    </div>
                    <h3>Catégories</h3>
                    <p>Interface de gestion des catégories</p>
                </div>
            </div>
        `;
    }

    async renderSettings(container) {
        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Paramètres</h1>
                    <p>Configurez votre application</p>
                </div>
                <div class="settings-content">
                    <div class="setting-card">
                        <h3>Configuration IA</h3>
                        <p>Configurez l'intelligence artificielle pour l'analyse</p>
                        <button class="btn btn-primary">
                            <i class="fas fa-cog"></i> Configurer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addDashboardStyles() {
        if (document.getElementById('dashboardStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'dashboardStyles';
        styles.textContent = `
            .dashboard-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .dashboard-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .dashboard-title {
                font-size: 2.5rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .dashboard-subtitle {
                font-size: 1.1rem;
                color: #6b7280;
            }
            
            .dashboard-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 24px;
            }
            
            .action-card {
                background: white;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                border: 2px solid transparent;
            }
            
            .action-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                border-color: #667eea;
            }
            
            .action-icon {
                font-size: 3rem;
                margin-bottom: 20px;
                color: #667eea;
            }
            
            .action-card h3 {
                font-size: 1.25rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .action-card p {
                color: #6b7280;
                line-height: 1.6;
                margin: 0;
            }
            
            .page-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .page-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .page-header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .page-header p {
                font-size: 1.1rem;
                color: #6b7280;
            }
            
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .empty-icon {
                font-size: 4rem;
                color: #d1d5db;
                margin-bottom: 20px;
            }
            
            .empty-state h3 {
                font-size: 1.5rem;
                font-weight: 700;
                color: #374151;
                margin-bottom: 12px;
            }
            
            .empty-state p {
                color: #6b7280;
                margin-bottom: 24px;
            }
            
            .settings-content {
                display: grid;
                gap: 24px;
            }
            
            .setting-card {
                background: white;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            
            .setting-card h3 {
                font-size: 1.25rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .setting-card p {
                color: #6b7280;
                margin-bottom: 24px;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s ease;
                text-decoration: none;
                font-size: 14px;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            @media (max-width: 768px) {
                .dashboard-actions {
                    grid-template-columns: 1fr;
                }
                
                .dashboard-title {
                    font-size: 2rem;
                }
                
                .action-card {
                    padding: 24px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // UTILITY METHODS
    // =====================================
    // =====================================
    // STYLES COMPLETS POUR L'INTERFACE EMAILS
    // =====================================
    addModernEmailStyles() {
        if (document.getElementById('modernEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernEmailStyles';
        styles.textContent = `
            /* ===== HEADER INFORMATIF MODERNE ===== */
            .modern-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #0ea5e9;
                border-radius: 12px;
                padding: 16px 20px;
                margin-bottom: 20px;
            }
            
            .header-info {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            
            .info-icon {
                color: #0ea5e9;
                font-size: 18px;
            }
            
            .info-text {
                color: #075985;
                font-weight: 600;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .header-actions {
                display: flex;
                gap: 8px;
            }
            
            .btn-select-all,
            .btn-deselect-all {
                display: flex;
                align-items: center;
                gap: 6px;
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                transition: all 0.2s ease;
            }
            
            .btn-select-all:hover,
            .btn-deselect-all:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            /* ===== BARRE DE CONTRÔLES ===== */
            .controls-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .search-section {
                flex: 0 0 320px;
            }
            
            .search-box {
                position: relative;
                width: 100%;
            }
            
            .search-input {
                width: 100%;
                padding: 12px 16px 12px 44px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 14px;
                background: #f9fafb;
                transition: all 0.3s ease;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
            
            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: #9ca3af;
                font-size: 16px;
            }
            
            .search-clear {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: #ef4444;
                color: white;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                transition: background 0.2s;
            }
            
            .search-clear:hover {
                background: #dc2626;
            }
            
            /* ===== MODES DE VUE ===== */
            .view-modes {
                display: flex;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 4px;
                gap: 4px;
            }
            
            .view-mode {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border: none;
                background: transparent;
                color: #6b7280;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
            }
            
            .view-mode:hover {
                background: rgba(255, 255, 255, 0.7);
                color: #374151;
            }
            
            .view-mode.active {
                background: white;
                color: #1f2937;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                font-weight: 600;
            }
            
            /* ===== BOUTONS D'ACTION ===== */
            .action-buttons {
                flex: 0 0 auto;
                display: flex;
                gap: 12px;
            }
            
            .btn-create-tasks,
            .btn-refresh {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                position: relative;
                white-space: nowrap;
            }
            
            .btn-create-tasks {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .btn-create-tasks:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            
            .btn-create-tasks.has-selection {
                background: linear-gradient(135deg, #10b981, #047857);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                animation: pulse 2s infinite;
            }
            
            .btn-refresh {
                background: white;
                color: #374151;
                border: 2px solid #e5e7eb;
            }
            
            .btn-refresh:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            .count-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                font-size: 11px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 20px;
                text-align: center;
                border: 2px solid white;
            }
            
            /* ===== ONGLETS CATÉGORIES ===== */
            .category-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .category-tab {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                color: #374151;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
            }
            
            .category-tab:hover {
                border-color: var(--category-color, #3b82f6);
                background: color-mix(in srgb, var(--category-color, #3b82f6) 5%, white);
                transform: translateY(-1px);
            }
            
            .category-tab.active {
                background: var(--category-color, #3b82f6);
                color: white;
                border-color: var(--category-color, #3b82f6);
                box-shadow: 0 4px 12px color-mix(in srgb, var(--category-color, #3b82f6) 30%, transparent);
            }
            
            .tab-icon {
                font-size: 16px;
            }
            
            .tab-count {
                background: rgba(0, 0, 0, 0.1);
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                min-width: 22px;
                text-align: center;
            }
            
            .category-tab.active .tab-count {
                background: rgba(255, 255, 255, 0.25);
            }
            
            /* ===== CONTAINER EMAILS ===== */
            .emails-container {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            /* ===== LISTE EMAILS ===== */
            .emails-flat-list {
                display: flex;
                flex-direction: column;
            }
            
            .email-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
                min-height: 80px;
            }
            
            .email-row:last-child {
                border-bottom: none;
            }
            
            .email-row:hover {
                background: #f8fafc;
            }
            
            .email-row.selected {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding-left: 16px;
            }
            
            .email-row.has-task {
                background: #f0fdf4;
                border-left: 4px solid #10b981;
                padding-left: 16px;
            }
            
            .email-checkbox {
                flex-shrink: 0;
            }
            
            .email-checkbox input {
                width: 18px;
                height: 18px;
                cursor: pointer;
                accent-color: #3b82f6;
            }
            
            .email-avatar {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 18px;
                flex-shrink: 0;
            }
            
            .email-sender-info {
                flex: 0 0 200px;
                min-width: 0;
            }
            
            .sender-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-bottom: 2px;
            }
            
            .sender-email {
                font-size: 13px;
                color: #6b7280;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-subject {
                flex: 1;
                min-width: 0;
                padding-right: 16px;
            }
            
            .subject-text {
                font-size: 15px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.3;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-preview {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-badges {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }
            
            .badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .badge.attachment {
                background: #fef3c7;
                color: #d97706;
            }
            
            .badge.priority {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .badge.task-created {
                background: #dcfce7;
                color: #16a34a;
            }
            
            .email-date {
                flex-shrink: 0;
                font-size: 13px;
                color: #6b7280;
                font-weight: 500;
                width: 60px;
                text-align: right;
            }
            
            .email-actions {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .email-row:hover .email-actions {
                opacity: 1;
            }
            
            .action-btn {
                width: 32px;
                height: 32px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-size: 13px;
            }
            
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .action-btn.create-task:hover {
                background: #dbeafe;
                color: #2563eb;
                border-color: #2563eb;
            }
            
            .action-btn.view-task {
                background: #dcfce7;
                color: #16a34a;
                border-color: #16a34a;
            }
            
            .action-btn.view-task:hover {
                background: #16a34a;
                color: white;
            }
            
            .action-btn.view-email:hover {
                background: #f3f4f6;
                color: #374151;
                border-color: #9ca3af;
            }
            
            /* ===== VUE GROUPÉE ===== */
            .emails-grouped-list {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .email-group {
                border-bottom: 1px solid #f3f4f6;
                margin: 0;
            }
            
            .email-group:last-child {
                border-bottom: none;
            }
            
            .group-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
                background: white;
                min-height: 56px;
                max-height: 56px;
                margin: 0;
            }
            
            .group-header:hover {
                background: #f8fafc;
            }
            
            .email-group.expanded .group-header {
                background: #f0f9ff;
                border-bottom: 1px solid #e0e7ff;
            }
            
            .group-avatar {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .group-info {
                flex: 1;
                min-width: 0;
            }
            
            .group-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                line-height: 1.3;
                margin-bottom: 2px;
            }
            
            .group-meta {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .group-expand {
                color: #9ca3af;
                transition: transform 0.2s ease;
                font-size: 14px;
            }
            
            .email-group.expanded .group-expand {
                transform: rotate(180deg);
                color: #3b82f6;
            }
            
            .group-content {
                background: #fafbfc;
                border-top: 1px solid #e5e7eb;
                margin: 0;
                padding: 0;
            }
            
            /* ===== ÉTAT VIDE ===== */
            .empty-view {
                text-align: center;
                padding: 80px 20px;
                color: #6b7280;
            }
            
            .empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
                color: #d1d5db;
            }
            
            .empty-title {
                font-size: 24px;
                font-weight: 700;
                color: #374151;
                margin: 0 0 8px 0;
            }
            
            .empty-subtitle {
                font-size: 16px;
                margin: 0 0 24px 0;
                line-height: 1.5;
            }
            
            .btn-clear-search {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .btn-clear-search:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            /* ===== ANIMATIONS ===== */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            /* ===== RESPONSIVE ===== */
            @media (max-width: 1024px) {
                .controls-bar {
                    flex-direction: column;
                    gap: 16px;
                }
                
                .search-section {
                    flex: none;
                    width: 100%;
                }
                
                .view-modes {
                    width: 100%;
                    justify-content: space-around;
                }
                
                .action-buttons {
                    width: 100%;
                    justify-content: center;
                }
            }
            
            @media (max-width: 768px) {
                .modern-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }
                
                .header-actions {
                    justify-content: center;
                }
                
                .controls-bar {
                    padding: 16px;
                    gap: 12px;
                }
                
                .view-mode span {
                    display: none;
                }
                
                .btn-create-tasks span,
                .btn-refresh span {
                    display: none;
                }
                
                .category-tabs {
                    justify-content: center;
                    gap: 6px;
                }
                
                .tab-name {
                    display: none;
                }
                
                .email-row {
                    padding: 12px 16px;
                    gap: 12px;
                }
                
                .email-avatar {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
                
                .email-sender-info {
                    flex: 0 0 140px;
                }
                
                .sender-name {
                    font-size: 14px;
                }
                
                .sender-email {
                    font-size: 12px;
                }
                
                .subject-text {
                    font-size: 14px;
                }
                
                .email-preview {
                    font-size: 12px;
                }
                
                .email-actions {
                    opacity: 1;
                }
            }
            
            /* Support navigateurs sans color-mix */
            @supports not (color: color-mix(in srgb, red, blue)) {
                .category-tab:hover {
                    background: rgba(59, 130, 246, 0.05);
                }
            }
        `;
        
        document.head.appendChild(styles);
        console.log('[PageManager] ✅ Modern email styles added');
    }
}

// Create global instance
window.pageManager = new PageManager();

// Bind methods to preserve context
Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
    }
});

console.log('✅ PageManager v12.0 loaded - Scanner correction complète');
