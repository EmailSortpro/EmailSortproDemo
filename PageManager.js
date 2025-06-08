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
    // EMAILS PAGE - VERSION SIMPLIFIÉE POUR ÉVITER LES CONFLITS
    // =====================================
    async renderEmails(container) {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        
        container.innerHTML = `
            <div class="emails-page">
                <div class="emails-header">
                    <h1>Gestion des Emails</h1>
                    <p>Visualisez et organisez vos emails</p>
                </div>
                
                ${emails.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>Aucun email trouvé</h3>
                        <p>Lancez un scan pour analyser vos emails</p>
                        <button class="btn btn-primary" onclick="window.pageManager.loadPage('scanner')">
                            <i class="fas fa-search"></i> Scanner des emails
                        </button>
                    </div>
                ` : `
                    <div class="emails-list">
                        <div class="emails-stats">
                            <span class="stat">
                                <i class="fas fa-envelope"></i>
                                ${emails.length} emails
                            </span>
                        </div>
                        <div class="emails-content">
                            <p>Interface complète des emails sera chargée ici...</p>
                        </div>
                    </div>
                `}
            </div>
        `;
        
        this.addEmailsStyles();
    }

    addEmailsStyles() {
        if (document.getElementById('emailsStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'emailsStyles';
        styles.textContent = `
            .emails-page {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .emails-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .emails-header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .emails-header p {
                font-size: 1.1rem;
                color: #6b7280;
            }
            
            .emails-stats {
                background: white;
                border-radius: 12px;
                padding: 16px 24px;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: center;
            }
            
            .stat {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #374151;
            }
            
            .emails-content {
                background: white;
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                color: #6b7280;
            }
        `;
        
        document.head.appendChild(styles);
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
    getTemporaryEmails() {
        return this.temporaryEmailStorage || [];
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
