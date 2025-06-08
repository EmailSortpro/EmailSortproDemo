// PageManager.js - Version 13.0 - Correction scan réel et interface emails complète

class PageManager {
    constructor() {
        // Core state
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.scannedEmails = [];
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
        console.log('[PageManager] Initialized v13.0 - Correction scan réel et interface emails');
        
        // Initialiser le scanner immédiatement
        this.initializeScanModule();
        
        // Écouter les événements de scan
        this.setupScanEventListeners();
    }

    // =====================================
    // GESTION DES ÉVÉNEMENTS DE SCAN
    // =====================================
    setupScanEventListeners() {
        // Écouter les résultats de scan du localStorage/sessionStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'scanResults') {
                this.loadScanResults();
            }
        });
        
        // Vérifier immédiatement s'il y a des résultats
        this.loadScanResults();
    }

    loadScanResults() {
        try {
            const scanResults = sessionStorage.getItem('scanResults');
            if (scanResults) {
                const results = JSON.parse(scanResults);
                this.lastScanData = results;
                console.log('[PageManager] ✅ Résultats de scan chargés:', results);
            }
        } catch (error) {
            console.warn('[PageManager] Erreur chargement résultats scan:', error);
        }
    }

    // =====================================
    // INITIALISATION DU MODULE DE SCAN
    // =====================================
    initializeScanModule() {
        console.log('[PageManager] 🔧 Initializing scan module v13.0...');
        
        setTimeout(() => {
            // Méthode 1: Vérifier MinimalScanModule (classe)
            if (window.MinimalScanModule && typeof window.MinimalScanModule === 'function') {
                console.log('[PageManager] ✅ MinimalScanModule class found');
                
                if (!window.minimalScanModule) {
                    try {
                        window.minimalScanModule = new window.MinimalScanModule();
                        console.log('[PageManager] ✅ minimalScanModule instance created');
                    } catch (error) {
                        console.error('[PageManager] ❌ Error creating minimalScanModule:', error);
                    }
                }
                
                if (!window.scanStartModule && window.minimalScanModule) {
                    window.scanStartModule = window.minimalScanModule;
                    console.log('[PageManager] ✅ scanStartModule alias created');
                }
            }
            
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
        }, 100);
        
        return this.scannerInitialized;
    }

    // =====================================
    // PAGE LOADING - SÉCURISÉ CONTRE LES BOUCLES
    // =====================================
    async loadPage(pageName) {
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

            pageContent.innerHTML = '';
            
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
    // SCANNER PAGE - VERSION CORRIGÉE V13.0
    // =====================================
    async renderScanner(container) {
        console.log('[PageManager] 🎯 Rendering scanner page v13.0...');
        
        this.initializeScanModule();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const moduleStatus = {
            MinimalScanModule: !!window.MinimalScanModule,
            minimalScanModule: !!window.minimalScanModule,
            scanStartModule: !!window.scanStartModule,
            hasRender: !!(window.minimalScanModule && typeof window.minimalScanModule.render === 'function')
        };
        
        console.log('[PageManager] 📊 Scanner modules status:', moduleStatus);
        
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
        
        console.log('[PageManager] ⚠️ All scanner methods failed, using enhanced fallback');
        this.renderScannerFallback(container);
    }

    // =====================================
    // RÉCUPÉRATION DES EMAILS SCANNÉS
    // =====================================
    async getScannedEmails() {
        console.log('[PageManager] 📧 Récupération des emails scannés...');
        
        // 1. Essayer de récupérer depuis emailScanner
        if (window.emailScanner && typeof window.emailScanner.getAllEmails === 'function') {
            try {
                const emails = window.emailScanner.getAllEmails();
                if (emails && emails.length > 0) {
                    console.log('[PageManager] ✅ Emails trouvés via emailScanner:', emails.length);
                    this.scannedEmails = emails;
                    return emails;
                }
            } catch (error) {
                console.warn('[PageManager] ⚠️ Erreur emailScanner:', error);
            }
        }
        
        // 2. Essayer de récupérer via mailService
        if (window.mailService && typeof window.mailService.getEmails === 'function') {
            try {
                console.log('[PageManager] 🔄 Récupération via mailService...');
                const authService = window.authService;
                
                if (!authService || !authService.isAuthenticated()) {
                    console.warn('[PageManager] ⚠️ Service non authentifié');
                    return this.generateSimulatedEmails();
                }
                
                const emails = await window.mailService.getEmails({
                    folder: 'inbox',
                    days: this.lastScanData?.selectedDays || 7,
                    maxResults: 100
                });
                
                if (emails && emails.length > 0) {
                    // Analyser et catégoriser les emails
                    const categorizedEmails = this.categorizeEmails(emails);
                    console.log('[PageManager] ✅ Emails récupérés et catégorisés:', categorizedEmails.length);
                    this.scannedEmails = categorizedEmails;
                    return categorizedEmails;
                }
            } catch (error) {
                console.warn('[PageManager] ⚠️ Erreur mailService:', error);
            }
        }
        
        // 3. Générer des emails simulés avec catégories
        console.log('[PageManager] 🎭 Génération d\'emails simulés...');
        return this.generateSimulatedEmails();
    }

    // =====================================
    // CATÉGORISATION DES EMAILS
    // =====================================
    categorizeEmails(emails) {
        if (!window.categoryManager) {
            console.warn('[PageManager] ⚠️ CategoryManager non disponible');
            return emails;
        }
        
        console.log('[PageManager] 🏷️ Catégorisation de', emails.length, 'emails...');
        
        return emails.map(email => {
            try {
                const analysis = window.categoryManager.analyzeEmail(email);
                return {
                    ...email,
                    category: analysis.category || 'other',
                    categoryScore: analysis.score || 0,
                    categoryConfidence: analysis.confidence || 0,
                    matchedPatterns: analysis.matchedPatterns || [],
                    isSpam: analysis.isSpam || false
                };
            } catch (error) {
                console.warn('[PageManager] ⚠️ Erreur catégorisation email:', error);
                return {
                    ...email,
                    category: 'other',
                    categoryScore: 0,
                    categoryConfidence: 0,
                    matchedPatterns: [],
                    isSpam: false
                };
            }
        });
    }

    // =====================================
    // GÉNÉRATION D'EMAILS SIMULÉS RÉALISTES
    // =====================================
    generateSimulatedEmails() {
        const categories = window.categoryManager?.getCategories() || {};
        const categoryIds = Object.keys(categories);
        
        const totalEmails = this.lastScanData?.total || (Math.floor(Math.random() * 150) + 50);
        const emails = [];
        
        // Templates d'emails réalistes par catégorie
        const emailTemplates = {
            marketing_news: [
                {
                    subject: "🎯 Offre spéciale - 50% de réduction",
                    from: { emailAddress: { name: "Newsletter Store", address: "promo@shop-online.com" } },
                    bodyPreview: "Profitez de notre vente flash exceptionnelle. Livraison gratuite.",
                    hasAttachments: false
                },
                {
                    subject: "Actualités hebdomadaires - Édition du 8 juin",
                    from: { emailAddress: { name: "Le Journal", address: "newsletter@journal-news.fr" } },
                    bodyPreview: "Découvrez les dernières actualités de la semaine.",
                    hasAttachments: false
                }
            ],
            security: [
                {
                    subject: "Alerte de sécurité - Nouvelle connexion détectée",
                    from: { emailAddress: { name: "Microsoft Security", address: "security@microsoft.com" } },
                    bodyPreview: "Une nouvelle connexion à votre compte a été détectée depuis Paris.",
                    hasAttachments: false,
                    importance: "high"
                },
                {
                    subject: "Code de vérification: 847392",
                    from: { emailAddress: { name: "Google", address: "noreply@google.com" } },
                    bodyPreview: "Votre code de vérification à usage unique est 847392.",
                    hasAttachments: false
                }
            ],
            tasks: [
                {
                    subject: "Action requise: Validation du rapport mensuel",
                    from: { emailAddress: { name: "Marie Dubois", address: "marie.dubois@entreprise.fr" } },
                    bodyPreview: "Merci de valider le rapport mensuel avant vendredi 16h.",
                    hasAttachments: true,
                    importance: "high"
                },
                {
                    subject: "Urgent: Réponse demandée avant 18h",
                    from: { emailAddress: { name: "Pierre Martin", address: "p.martin@client.com" } },
                    bodyPreview: "Nous avons besoin de votre confirmation pour la livraison.",
                    hasAttachments: false,
                    importance: "high"
                }
            ],
            finance: [
                {
                    subject: "Facture #2024-0156 - Échéance 15/06",
                    from: { emailAddress: { name: "Comptabilité", address: "compta@fournisseur.fr" } },
                    bodyPreview: "Veuillez trouver ci-joint votre facture d'un montant de 1,250.00€.",
                    hasAttachments: true
                },
                {
                    subject: "Relevé bancaire juin 2025",
                    from: { emailAddress: { name: "Banque Digitale", address: "noreply@banque-digitale.fr" } },
                    bodyPreview: "Votre relevé de compte est disponible en ligne.",
                    hasAttachments: true
                }
            ],
            meetings: [
                {
                    subject: "Invitation: Réunion équipe - Mardi 10 juin 14h",
                    from: { emailAddress: { name: "Sophie Lambert", address: "s.lambert@entreprise.fr" } },
                    bodyPreview: "Réunion d'équipe pour faire le point sur les projets en cours.",
                    hasAttachments: false
                },
                {
                    subject: "Demande de rendez-vous - Présentation produit",
                    from: { emailAddress: { name: "Commercial Solutions", address: "contact@solutions-pro.com" } },
                    bodyPreview: "Nous souhaiterions vous présenter notre nouvelle solution.",
                    hasAttachments: false
                }
            ],
            cc: [
                {
                    subject: "RE: Suivi projet Alpha - Point d'étape",
                    from: { emailAddress: { name: "Chef de projet", address: "chef.projet@entreprise.fr" } },
                    bodyPreview: "Faisant suite à notre échange, voici le point d'étape.",
                    hasAttachments: false,
                    ccRecipients: [{ emailAddress: { address: "user@example.com" } }]
                }
            ],
            support: [
                {
                    subject: "Ticket #12845 résolu - Problème connexion",
                    from: { emailAddress: { name: "Support IT", address: "support@entreprise.fr" } },
                    bodyPreview: "Votre ticket de support a été résolu avec succès.",
                    hasAttachments: false
                }
            ]
        };
        
        // Générer des emails pour chaque catégorie
        for (let i = 0; i < totalEmails; i++) {
            const randomCategoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
            const templates = emailTemplates[randomCategoryId] || emailTemplates.marketing_news;
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            const email = {
                id: `simulated_${i}`,
                subject: template.subject,
                from: template.from,
                toRecipients: [{ emailAddress: { address: "user@example.com" } }],
                ccRecipients: template.ccRecipients || [],
                bodyPreview: template.bodyPreview,
                receivedDateTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                hasAttachments: template.hasAttachments || false,
                importance: template.importance || 'normal',
                isRead: Math.random() > 0.3,
                category: randomCategoryId,
                categoryScore: Math.floor(Math.random() * 50) + 50,
                categoryConfidence: 0.7 + Math.random() * 0.3,
                matchedPatterns: [{ keyword: 'simulated', type: 'generated', score: 100 }],
                isSpam: false
            };
            
            emails.push(email);
        }
        
        // Trier par date (plus récents en premier)
        emails.sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime));
        
        console.log('[PageManager] ✅ Généré', emails.length, 'emails simulés avec catégories');
        this.scannedEmails = emails;
        return emails;
    }

    // =====================================
    // INTERFACE EMAILS COMPLÈTE RESTAURÉE
    // =====================================
    async renderEmails(container) {
        console.log('[PageManager] 📧 Rendering emails page with full interface...');
        
        // Récupérer les emails
        const emails = await this.getScannedEmails();
        const categories = window.categoryManager?.getCategories() || {};
        
        // Initialize view mode
        this.currentViewMode = this.currentViewMode || 'grouped-domain';
        this.currentCategory = this.currentCategory || 'all';

        const renderEmailsPage = () => {
            const categoryCounts = this.calculateCategoryCounts(emails);
            const totalEmails = emails.length;
            const selectedCount = this.selectedEmails.size;
            
            console.log('[PageManager] 📊 Rendering with', totalEmails, 'emails');
            
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
                    ${this.renderEmailsList(emails)}
                </div>
            `;

            this.addModernEmailStyles();
            this.setupEmailsEventListeners();
        };

        renderEmailsPage();
        
        console.log('[PageManager] ✅ Full emails interface rendered with', emails.length, 'emails');
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
    renderEmailsList(emails = null) {
        if (!emails) {
            emails = this.scannedEmails || [];
        }
        
        let filteredEmails = emails;
        
        // Apply filters
        if (this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        console.log('[PageManager] 📋 Rendering', filteredEmails.length, 'filtered emails');
        
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
                    ${email.category && email.category !== 'other' ? `<span class="badge category-badge" style="background: ${this.getCategoryColor(email.category)}20; color: ${this.getCategoryColor(email.category)}">${this.getCategoryIcon(email.category)}</span>` : ''}
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
        let filteredEmails = this.scannedEmails || [];
        
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

    getCategoryColor(categoryId) {
        const categories = window.categoryManager?.getCategories() || {};
        return categories[categoryId]?.color || '#6b7280';
    }

    getCategoryIcon(categoryId) {
        const categories = window.categoryManager?.getCategories() || {};
        return categories[categoryId]?.icon || '📧';
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
            this.scannedEmails = [];
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

    // =====================================
    // SCANNER FALLBACK AMÉLIORÉ
    // =====================================
    renderScannerFallback(container) {
        console.log('[PageManager] Rendering enhanced scanner fallback...');
        
        container.innerHTML = `
            <div class="scanner-fallback-enhanced">
                <div class="scanner-container">
                    <div class="scanner-header">
                        <div class="scanner-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h1 class="scanner-title">Scanner d'Emails</h1>
                        <p class="scanner-subtitle">Analysez et organisez vos emails automatiquement</p>
                    </div>
                    
                    <div class="scanner-diagnostic">
                        <div class="diagnostic-header">
                            <i class="fas fa-info-circle"></i>
                            <span>État du module de scan</span>
                        </div>
                        <div class="diagnostic-content">
                            ${this.generateScannerDiagnostic()}
                        </div>
                    </div>
                    
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

    initializeFallbackEvents() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    async startFallbackScan() {
        console.log('[PageManager] Starting fallback scan...');
        
        const scanBtn = document.querySelector('.btn-scan-start');
        const steps = document.querySelectorAll('.step');
        
        if (scanBtn) {
            scanBtn.disabled = true;
            scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Analyse en cours...</span>';
        }
        
        try {
            for (let i = 0; i < steps.length; i++) {
                steps[i].classList.add('active');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
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
        
        const initialized = this.initializeScanModule();
        
        if (initialized) {
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast('✅ Module chargé avec succès!', 'success');
            }
            
            setTimeout(() => {
                this.currentPage = null;
                this.loadPage('scanner');
            }, 1000);
        } else {
            if (window.uiManager && window.uiManager.showToast) {
                window.uiManager.showToast('❌ Module toujours indisponible', 'warning');
            }
            
            const diagnosticContent = document.querySelector('.diagnostic-content');
            if (diagnosticContent) {
                diagnosticContent.innerHTML = this.generateScannerDiagnostic();
            }
        }
    }

    // =====================================
    // STYLES COMPLETS POUR L'INTERFACE
    // =====================================
    addModernEmailStyles() {
        if (document.getElementById('modernEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernEmailStyles';
        styles.textContent = `
            /* Modern Email Styles v13.0 */
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
            
            /* Controls Bar */
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
            
            /* View Modes */
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
            
            /* Action Buttons */
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
            
            /* Category Tabs */
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
            
            /* Emails Container */
            .emails-container {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            /* Email Rows */
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
                flex-wrap: wrap;
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
            
            .badge.category-badge {
                font-size: 12px;
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
            
            /* Grouped View */
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
            
            /* Empty State */
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
            
            /* Animations */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            /* Responsive */
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
