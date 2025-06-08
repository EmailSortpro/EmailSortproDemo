// StartScan.js - Module de scan intelligent CORRIGÉ pour emails réels v8.1

console.log('[StartScan] 🚀 Loading StartScan.js v8.1 - REAL EMAIL SCANNING...');

// ===== MODULE DE SCAN MINIMALISTE CORRIGÉ =====
class MinimalScanModule {
    constructor() {
        this.isScanning = false;
        this.emails = [];
        this.categories = [];
        this.progress = 0;
        this.forceRealEmails = true; // CORRECTION: Forcer l'utilisation des vrais emails
        
        console.log('[MinimalScan] Scanner minimaliste v8.1 initialized - REAL EMAILS ONLY');
        this.addStyles();
    }

    // CORRECTION: Scan des VRAIS emails uniquement
    async startScan(options = {}) {
        console.log('[MinimalScan] 🚀 Starting REAL email scan...');
        
        if (this.isScanning) {
            console.log('[MinimalScan] Scan already in progress');
            return { success: false, message: 'Scan déjà en cours' };
        }

        // Vérifier l'authentification AVANT le scan
        if (!window.authService || !window.authService.isAuthenticated()) {
            console.error('[MinimalScan] ❌ User not authenticated - cannot scan real emails');
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Vous devez être connecté pour scanner vos emails réels',
                    'error',
                    5000
                );
            }
            
            return { 
                success: false, 
                message: 'Authentification requise pour scanner les emails réels',
                requiresAuth: true
            };
        }

        // Vérifier que MailService est disponible et configuré pour les emails réels
        if (!window.mailService) {
            console.error('[MinimalScan] MailService not available');
            return { success: false, message: 'Service de mail non disponible' };
        }

        // CORRECTION: Forcer le mode réel dans MailService
        if (typeof window.mailService.enableRealMode === 'function') {
            window.mailService.enableRealMode();
            console.log('[MinimalScan] ✅ Forced real email mode in MailService');
        }

        this.isScanning = true;
        this.progress = 0;

        try {
            // Afficher l'interface de scan
            this.showScanInterface();
            this.updateProgress(10, 'Connexion à votre boîte mail...');

            // CORRECTION: Utiliser scanEmailsForCategories du MailService corrigé
            console.log('[MinimalScan] Requesting real emails from MailService...');
            
            const scanOptions = {
                limit: options.limit || 100,
                folders: options.folders || ['inbox'],
                forceRefresh: options.forceRefresh || true // Forcer le refresh pour éviter le cache demo
            };

            this.updateProgress(30, 'Récupération de vos emails...');

            const result = await window.mailService.scanEmailsForCategories(scanOptions);
            
            console.log('[MinimalScan] MailService scan result:', result);

            if (!result.success) {
                throw new Error(result.message || 'Erreur lors du scan des emails');
            }

            if (!result.emails || result.emails.length === 0) {
                console.warn('[MinimalScan] No emails returned from scan');
                throw new Error('Aucun email trouvé dans votre boîte mail');
            }

            // CORRECTION: Vérifier que ce ne sont pas des emails de démo
            const realEmails = result.emails.filter(email => !email.isDemo && email.source !== 'demo');
            
            if (realEmails.length === 0) {
                console.error('[MinimalScan] Only demo emails found - real email access failed');
                throw new Error('Impossible d\'accéder à vos emails réels. Vérifiez vos permissions.');
            }

            console.log(`[MinimalScan] ✅ Found ${realEmails.length} REAL emails`);

            this.updateProgress(60, 'Analyse des catégories...');

            // Traitement et catégorisation
            this.emails = realEmails;
            this.categories = result.categories || [];

            this.updateProgress(80, 'Finalisation...');

            // Sauvegarder les résultats
            this.saveResults({
                emails: this.emails,
                categories: this.categories,
                stats: result.stats,
                timestamp: new Date().toISOString(),
                source: 'real-mailservice'
            });

            this.updateProgress(100, 'Scan terminé !');

            // Afficher les résultats
            setTimeout(() => {
                this.showResults();
            }, 1000);

            console.log(`[MinimalScan] ✅ Scan completed: ${this.emails.length} real emails processed`);

            return {
                success: true,
                message: `${this.emails.length} emails réels analysés avec succès`,
                emails: this.emails,
                categories: this.categories,
                stats: result.stats
            };

        } catch (error) {
            console.error('[MinimalScan] ❌ Scan error:', error);
            
            this.updateProgress(0, 'Erreur lors du scan');
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    'Erreur lors du scan: ' + error.message,
                    'error',
                    8000
                );
            }

            // Masquer l'interface après un délai
            setTimeout(() => {
                this.hideScanInterface();
            }, 3000);

            return {
                success: false,
                message: error.message,
                error: error
            };

        } finally {
            this.isScanning = false;
        }
    }

    updateProgress(percent, message) {
        this.progress = percent;
        console.log(`[MinimalScan] Progress: ${percent}% - ${message}`);
        
        // Mettre à jour l'interface
        const progressBar = document.querySelector('.scan-progress-bar');
        const progressText = document.querySelector('.scan-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }

        // Mettre à jour via UIManager si disponible
        if (window.uiManager && typeof window.uiManager.updateProgress === 'function') {
            window.uiManager.updateProgress(percent, message);
        }
    }

    showScanInterface() {
        console.log('[MinimalScan] Showing scan interface...');
        
        const existingInterface = document.getElementById('scanInterface');
        if (existingInterface) {
            existingInterface.remove();
        }

        const scanHTML = `
            <div id="scanInterface" class="scan-overlay">
                <div class="scan-container">
                    <div class="scan-header">
                        <h2><i class="fas fa-search"></i> Scan en cours</h2>
                        <p>Analyse de vos emails réels...</p>
                    </div>
                    
                    <div class="scan-progress">
                        <div class="scan-progress-bar" style="width: 0%"></div>
                    </div>
                    
                    <div class="scan-progress-text">Initialisation...</div>
                    
                    <div class="scan-stats" style="display: none;">
                        <div class="stat-item">
                            <span class="stat-label">Emails traités:</span>
                            <span class="stat-value" id="processedCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Catégories trouvées:</span>
                            <span class="stat-value" id="categoriesCount">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', scanHTML);
    }

    hideScanInterface() {
        const scanInterface = document.getElementById('scanInterface');
        if (scanInterface) {
            scanInterface.style.opacity = '0';
            setTimeout(() => scanInterface.remove(), 300);
        }
    }

    showResults() {
        console.log('[MinimalScan] Showing scan results...');
        
        this.hideScanInterface();
        
        // CORRECTION: Afficher les résultats des emails réels
        const resultsHTML = `
            <div id="scanResults" class="scan-overlay">
                <div class="scan-container results-container">
                    <div class="scan-header">
                        <h2><i class="fas fa-check-circle"></i> Scan terminé !</h2>
                        <p>${this.emails.length} emails réels analysés</p>
                    </div>
                    
                    <div class="results-summary">
                        <div class="result-card">
                            <h3>📧 Emails traités</h3>
                            <div class="result-number">${this.emails.length}</div>
                            <small>Emails réels de votre boîte mail</small>
                        </div>
                        
                        <div class="result-card">
                            <h3>📁 Catégories trouvées</h3>
                            <div class="result-number">${this.categories.length}</div>
                            <small>Catégories automatiquement détectées</small>
                        </div>
                        
                        <div class="result-card">
                            <h3>🎯 Non lus</h3>
                            <div class="result-number">${this.emails.filter(e => !e.isRead).length}</div>
                            <small>Emails nécessitant votre attention</small>
                        </div>
                    </div>
                    
                    <div class="categories-preview">
                        <h3>Principales catégories détectées:</h3>
                        <div class="categories-list">
                            ${this.categories.slice(0, 5).map(cat => `
                                <div class="category-item">
                                    <span class="category-name">${cat.name}</span>
                                    <span class="category-count">${cat.count} emails</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="results-actions">
                        <button onclick="window.minimalScanModule.viewEmails()" class="btn btn-primary">
                            <i class="fas fa-inbox"></i> Voir les emails
                        </button>
                        <button onclick="window.minimalScanModule.viewCategories()" class="btn btn-secondary">
                            <i class="fas fa-tags"></i> Gérer les catégories
                        </button>
                        <button onclick="window.minimalScanModule.closeResults()" class="btn btn-outline">
                            <i class="fas fa-times"></i> Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', resultsHTML);
    }

    closeResults() {
        const results = document.getElementById('scanResults');
        if (results) {
            results.style.opacity = '0';
            setTimeout(() => results.remove(), 300);
        }
    }

    viewEmails() {
        console.log('[MinimalScan] Viewing emails...');
        this.closeResults();
        
        // Naviguer vers la page des emails avec les résultats
        if (window.pageManager) {
            window.pageManager.loadPage('emails');
        }
    }

    viewCategories() {
        console.log('[MinimalScan] Viewing categories...');
        this.closeResults();
        
        // Naviguer vers la page des catégories
        if (window.pageManager) {
            window.pageManager.loadPage('settings');
        }
    }

    saveResults(data) {
        try {
            // Sauvegarder les emails scannés
            localStorage.setItem('emailsort_scan_results', JSON.stringify({
                ...data,
                version: '8.1',
                realEmails: true,
                demoMode: false
            }));
            
            // Mettre à jour emailScanner si disponible
            if (window.emailScanner && typeof window.emailScanner.setEmails === 'function') {
                window.emailScanner.setEmails(data.emails);
                console.log('[MinimalScan] ✅ Updated emailScanner with real emails');
            }
            
            console.log('[MinimalScan] ✅ Results saved successfully');
            
        } catch (error) {
            console.warn('[MinimalScan] Could not save results:', error);
        }
    }

    // Méthode pour vérifier le statut des emails
    checkEmailSource() {
        const realEmails = this.emails.filter(email => !email.isDemo && email.source !== 'demo');
        const demoEmails = this.emails.filter(email => email.isDemo || email.source === 'demo');
        
        return {
            total: this.emails.length,
            real: realEmails.length,
            demo: demoEmails.length,
            isRealMode: realEmails.length > 0,
            isDemoMode: demoEmails.length > 0 && realEmails.length === 0
        };
    }

    // Interface de rendu pour la page scanner
    render() {
        console.log('[MinimalScan] Rendering scanner interface...');
        
        // Vérifier d'abord l'authentification
        const isAuthenticated = window.authService?.isAuthenticated() || false;
        
        if (!isAuthenticated) {
            return `
                <div class="scan-page">
                    <div class="scan-auth-required">
                        <div class="auth-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h2>Authentification requise</h2>
                        <p>Vous devez être connecté à votre compte Microsoft pour scanner vos emails réels.</p>
                        <button onclick="window.authService?.login()" class="btn btn-primary">
                            <i class="fab fa-microsoft"></i>
                            Se connecter à Outlook
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="scan-page">
                <div class="scan-intro">
                    <h1><i class="fas fa-search"></i> Scanner d'emails intelligent</h1>
                    <p>Analysez vos emails réels et organisez-les automatiquement par catégories</p>
                </div>
                
                <div class="scan-options">
                    <div class="option-card">
                        <h3><i class="fas fa-bolt"></i> Scan rapide</h3>
                        <p>Analyse des 50 derniers emails de votre boîte de réception</p>
                        <button onclick="window.minimalScanModule.startScan({limit: 50})" class="btn btn-primary">
                            Démarrer le scan rapide
                        </button>
                    </div>
                    
                    <div class="option-card">
                        <h3><i class="fas fa-chart-bar"></i> Scan complet</h3>
                        <p>Analyse approfondie de vos 200 derniers emails</p>
                        <button onclick="window.minimalScanModule.startScan({limit: 200})" class="btn btn-secondary">
                            Démarrer le scan complet
                        </button>
                    </div>
                    
                    <div class="option-card">
                        <h3><i class="fas fa-cog"></i> Scan personnalisé</h3>
                        <p>Configuration avancée du scan</p>
                        <button onclick="window.minimalScanModule.showAdvancedOptions()" class="btn btn-outline">
                            Options avancées
                        </button>
                    </div>
                </div>
                
                <div class="scan-status">
                    <div class="status-item">
                        <i class="fas fa-user-check"></i>
                        <span>Connecté: ${window.authService?.getAccount()?.username || 'Inconnu'}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Accès sécurisé à vos emails réels</span>
                    </div>
                </div>
            </div>
        `;
    }

    showAdvancedOptions() {
        console.log('[MinimalScan] Showing advanced scan options...');
        // TODO: Implémenter les options avancées
        if (window.uiManager) {
            window.uiManager.showToast('Options avancées - Bientôt disponible', 'info');
        }
    }

    addStyles() {
        const styles = `
            <style id="minimal-scan-styles">
                .scan-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 1;
                    transition: opacity 0.3s ease;
                }
                
                .scan-container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    text-align: center;
                }
                
                .scan-header h2 {
                    color: #667eea;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .scan-progress {
                    background: #f0f0f0;
                    height: 8px;
                    border-radius: 4px;
                    margin: 20px 0;
                    overflow: hidden;
                }
                
                .scan-progress-bar {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    height: 100%;
                    width: 0%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .scan-progress-text {
                    color: #666;
                    font-size: 14px;
                    margin-top: 10px;
                }
                
                .scan-page {
                    padding: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                .scan-intro {
                    text-align: center;
                    margin-bottom: 40px;
                }
                
                .scan-intro h1 {
                    color: #667eea;
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                }
                
                .scan-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .option-card {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.2s ease;
                }
                
                .option-card:hover {
                    transform: translateY(-5px);
                }
                
                .option-card h3 {
                    color: #667eea;
                    margin-bottom: 15px;
                }
                
                .scan-status {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #28a745;
                    font-weight: 500;
                }
                
                .scan-auth-required {
                    text-align: center;
                    padding: 60px 20px;
                }
                
                .auth-icon {
                    font-size: 4rem;
                    color: #ffc107;
                    margin-bottom: 20px;
                }
                
                .results-container {
                    max-width: 600px;
                }
                
                .results-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .result-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                
                .result-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #667eea;
                }
                
                .categories-preview {
                    margin: 20px 0;
                    text-align: left;
                }
                
                .category-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .results-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 20px;
                }
                
                .btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-outline {
                    background: transparent;
                    color: #667eea;
                    border: 2px solid #667eea;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                @media (max-width: 768px) {
                    .scan-options {
                        grid-template-columns: 1fr;
                    }
                    
                    .scan-status {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .results-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `;
        
        // Supprimer les anciens styles s'ils existent
        const existingStyles = document.getElementById('minimal-scan-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('[MinimalScan] ✅ Styles minimalistes ajoutés');
    }

    // Méthode de diagnostic
    getStatus() {
        return {
            isScanning: this.isScanning,
            emailCount: this.emails.length,
            categoryCount: this.categories.length,
            progress: this.progress,
            forceRealEmails: this.forceRealEmails,
            emailSource: this.checkEmailSource(),
            authenticated: window.authService?.isAuthenticated() || false,
            mailServiceAvailable: !!window.mailService
        };
    }
}

// ===== CRÉATION DES INSTANCES GLOBALES =====
console.log('[StartScan] 🔧 Création des instances globales...');

try {
    // Instance du module minimaliste
    window.MinimalScanModule = MinimalScanModule;
    window.minimalScanModule = new MinimalScanModule();
    
    // Alias pour compatibilité
    window.scanStartModule = window.minimalScanModule;
    
    console.log('[StartScan] ✅ Instances créées:');
    console.log('- window.MinimalScanModule:', !!window.MinimalScanModule);
    console.log('- window.minimalScanModule:', !!window.minimalScanModule);
    console.log('- window.scanStartModule:', !!window.scanStartModule);
    
} catch (error) {
    console.error('[StartScan] ❌ Erreur lors de la création des instances:', error);
}

// Fonction de diagnostic globale
window.diagnoseScanModule = function() {
    console.group('🔍 DIAGNOSTIC SCAN MODULE v8.1');
    try {
        const status = window.minimalScanModule?.getStatus() || { error: 'Module not available' };
        console.log('📊 Module Status:', status);
        console.log('🔐 AuthService:', !!window.authService);
        console.log('✅ Authenticated:', window.authService?.isAuthenticated() || false);
        console.log('📧 MailService:', !!window.mailService);
        
        if (status.emailSource) {
            console.log('📈 Email Source Analysis:', status.emailSource);
            if (status.emailSource.isDemoMode) {
                console.warn('⚠️ Currently in DEMO mode - no real emails');
            } else if (status.emailSource.isRealMode) {
                console.log('✅ Using REAL emails');
            }
        }
        
        return status;
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('[StartScan] 🚀 Scanner v8.1 prêt pour emails RÉELS!');
console.log('[StartScan] Use diagnoseScanModule() for detailed diagnostic');
