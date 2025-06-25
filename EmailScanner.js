// EmailScanner.js - Version 9.0 - Compatible Web (coruscating-dodol-f30e8d.netlify.app)

class EmailScanner {
    constructor() {
        this.emails = [];
        this.categorizedEmails = {};
        this.scanProgress = null;
        this.isScanning = false;
        this.settings = {};
        this.eventListenersSetup = false;
        
        // Système de synchronisation adapté au web
        this.taskPreselectedCategories = [];
        this.lastSettingsSync = 0;
        this.syncInterval = null;
        this.changeListener = null;
        
        // Configuration web
        this.webConfig = {
            simulationMode: true,
            maxEmails: 100,
            apiEndpoint: 'https://coruscating-dodol-f30e8d.netlify.app/.netlify/functions',
            cacheDuration: 300000 // 5 minutes
        };
        
        // Métriques de performance
        this.scanMetrics = {
            startTime: null,
            categorizedCount: 0,
            keywordMatches: {},
            categoryDistribution: {}
        };
        
        // Cache pour optimisation web
        this.cache = new Map();
        
        console.log('[EmailScanner] ✅ Version 9.0 - Compatible Web');
        this.initializeWebMode();
    }

    // ================================================
    // INITIALISATION MODE WEB
    // ================================================
    async initializeWebMode() {
        try {
            // 1. Charger les paramètres depuis le stockage web
            await this.loadWebSettings();
            
            // 2. Initialiser les catégories par défaut si nécessaire
            this.initializeDefaultCategories();
            
            // 3. S'enregistrer comme listener si CategoryManager disponible
            this.registerWebChangeListener();
            
            // 4. Démarrer la surveillance adaptée au web
            this.startWebSync();
            
            // 5. Setup event listeners web
            this.setupWebEventListeners();
            
            console.log('[EmailScanner] 🌐 Mode web initialisé');
            console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur initialisation web:', error);
            this.settings = this.getDefaultWebSettings();
            this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
        }
    }

    async loadWebSettings() {
        // Priorité 1: CategoryManager si disponible
        if (window.categoryManager && typeof window.categoryManager.getSettings === 'function') {
            try {
                this.settings = window.categoryManager.getSettings();
                this.taskPreselectedCategories = window.categoryManager.getTaskPreselectedCategories();
                console.log('[EmailScanner] ✅ Paramètres chargés depuis CategoryManager');
                return true;
            } catch (error) {
                console.warn('[EmailScanner] ⚠️ Erreur CategoryManager:', error);
            }
        }
        
        // Priorité 2: localStorage pour persistance web
        return this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('categorySettings');
            if (saved) {
                this.settings = JSON.parse(saved);
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[EmailScanner] 📦 Paramètres chargés depuis localStorage');
            } else {
                this.settings = this.getDefaultWebSettings();
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[EmailScanner] 📝 Utilisation paramètres par défaut web');
            }
            
            this.lastSettingsSync = Date.now();
            return true;
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur localStorage:', error);
            this.settings = this.getDefaultWebSettings();
            this.taskPreselectedCategories = [];
            return false;
        }
    }

    getDefaultWebSettings() {
        return {
            activeCategories: null,
            excludedDomains: [],
            excludedKeywords: [],
            taskPreselectedCategories: ['tasks', 'commercial', 'meetings'],
            categoryExclusions: {
                domains: [],
                emails: []
            },
            scanSettings: {
                defaultPeriod: 7,
                defaultFolder: 'inbox',
                autoAnalyze: true,
                autoCategrize: true,
                webMode: true,
                simulationMode: true
            },
            automationSettings: {
                autoCreateTasks: false,
                groupTasksByDomain: false,
                skipDuplicates: true,
                autoAssignPriority: false
            },
            preferences: {
                darkMode: false,
                compactView: false,
                showNotifications: true,
                excludeSpam: true,
                detectCC: true,
                webOptimized: true
            },
            webConfig: {
                simulateData: true,
                maxEmails: 100,
                cacheDuration: 300000
            }
        };
    }

    initializeDefaultCategories() {
        // Catégories par défaut pour mode web
        this.defaultWebCategories = {
            'tasks': { icon: '✅', name: 'Tâches', color: '#10b981', priority: 90 },
            'commercial': { icon: '💼', name: 'Commercial', color: '#3b82f6', priority: 80 },
            'meetings': { icon: '🤝', name: 'Réunions', color: '#8b5cf6', priority: 70 },
            'finance': { icon: '💰', name: 'Finance', color: '#f59e0b', priority: 60 },
            'personal': { icon: '👤', name: 'Personnel', color: '#06b6d4', priority: 50 },
            'newsletters': { icon: '📧', name: 'Newsletters', color: '#84cc16', priority: 30 },
            'support': { icon: '🎧', name: 'Support', color: '#f97316', priority: 40 },
            'other': { icon: '📂', name: 'Autre', color: '#6b7280', priority: 10 }
        };
        
        // Initialiser le container des emails catégorisés
        Object.keys(this.defaultWebCategories).forEach(catId => {
            this.categorizedEmails[catId] = [];
        });
        
        console.log('[EmailScanner] 🎨 Catégories par défaut initialisées');
    }

    registerWebChangeListener() {
        if (window.categoryManager && typeof window.categoryManager.addChangeListener === 'function') {
            this.changeListener = window.categoryManager.addChangeListener((type, value, fullSettings) => {
                console.log(`[EmailScanner] 📨 Changement web reçu: ${type}`, value);
                this.handleWebSettingsChange(type, value, fullSettings);
            });
            console.log('[EmailScanner] 👂 Listener web enregistré');
        }
    }

    handleWebSettingsChange(type, value, fullSettings) {
        console.log(`[EmailScanner] 🔄 Traitement changement web: ${type}`);
        
        const needsRecategorization = [
            'taskPreselectedCategories',
            'activeCategories',
            'categoryExclusions',
            'preferences'
        ].includes(type);
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[EmailScanner] 📋 Mise à jour catégories pré-sélectionnées:', value);
                this.taskPreselectedCategories = Array.isArray(value) ? [...value] : [];
                this.settings.taskPreselectedCategories = this.taskPreselectedCategories;
                this.saveToLocalStorage();
                break;
                
            case 'activeCategories':
                console.log('[EmailScanner] 🏷️ Mise à jour catégories actives:', value);
                this.settings.activeCategories = value;
                this.saveToLocalStorage();
                break;
                
            case 'fullSettings':
                console.log('[EmailScanner] 🔄 Synchronisation complète web');
                this.settings = { ...this.settings, ...fullSettings };
                this.taskPreselectedCategories = fullSettings.taskPreselectedCategories || [];
                this.saveToLocalStorage();
                break;
        }
        
        // Re-catégorisation si nécessaire et emails présents
        if (needsRecategorization && this.emails.length > 0) {
            console.log('[EmailScanner] 🔄 Re-catégorisation automatique web');
            setTimeout(() => {
                this.recategorizeEmails();
            }, 100);
        }
        
        // Notifier les autres modules
        setTimeout(() => {
            this.dispatchEvent('emailScannerSynced', {
                type,
                value,
                settings: this.settings,
                taskPreselectedCategories: this.taskPreselectedCategories,
                webMode: true
            });
        }, 10);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('categorySettings', JSON.stringify(this.settings));
            console.log('[EmailScanner] 💾 Paramètres sauvegardés en localStorage');
        } catch (error) {
            console.warn('[EmailScanner] ⚠️ Erreur sauvegarde localStorage:', error);
        }
    }

    startWebSync() {
        // Surveillance moins fréquente en mode web pour économiser les ressources
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.checkWebSettingsSync();
        }, 15000); // Toutes les 15 secondes
    }

    async checkWebSettingsSync() {
        if (!window.categoryManager) return;
        
        try {
            const currentManagerCategories = window.categoryManager.getTaskPreselectedCategories();
            const categoriesChanged = JSON.stringify([...this.taskPreselectedCategories].sort()) !== 
                                     JSON.stringify([...currentManagerCategories].sort());
            
            if (categoriesChanged) {
                console.log('[EmailScanner] 🔄 Désynchronisation web détectée, correction...');
                this.taskPreselectedCategories = [...currentManagerCategories];
                this.saveToLocalStorage();
                
                if (this.emails.length > 0) {
                    await this.recategorizeEmails();
                }
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur vérification sync web:', error);
        }
    }

    // ================================================
    // SCAN PRINCIPAL ADAPTÉ AU WEB
    // ================================================
    async scan(options = {}) {
        console.log('[EmailScanner] 🚀 === DÉMARRAGE SCAN WEB ===');
        
        // Synchronisation pré-scan
        await this.loadWebSettings();
        
        const scanSettings = this.settings.scanSettings || {};
        const mergedOptions = {
            days: options.days || scanSettings.defaultPeriod || 7,
            folder: options.folder || scanSettings.defaultFolder || 'inbox',
            onProgress: options.onProgress || null,
            includeSpam: options.includeSpam !== undefined ? options.includeSpam : !this.settings.preferences?.excludeSpam,
            maxEmails: Math.min(options.maxEmails || this.webConfig.maxEmails, 100), // Limite web
            autoAnalyze: options.autoAnalyze !== undefined ? options.autoAnalyze : scanSettings.autoAnalyze,
            autoCategrize: options.autoCategrize !== undefined ? options.autoCategrize : scanSettings.autoCategrize,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            webMode: true,
            simulationMode: this.webConfig.simulationMode
        };

        if (this.isScanning) {
            console.warn('[EmailScanner] Scan web déjà en cours');
            return null;
        }

        try {
            this.isScanning = true;
            this.reset();
            this.scanProgress = mergedOptions.onProgress;
            this.scanMetrics.startTime = Date.now();

            console.log('[EmailScanner] 📊 Options scan web:', mergedOptions);
            console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);

            if (this.scanProgress) {
                this.scanProgress({ 
                    phase: 'fetching', 
                    message: `Simulation de ${mergedOptions.days} jours d'emails...`,
                    progress: { current: 0, total: 100 }
                });
            }

            // Mode simulation pour environnement web
            let emails;
            if (mergedOptions.simulationMode || !window.mailService) {
                console.log('[EmailScanner] 🎭 Mode simulation web');
                emails = await this.generateSimulatedEmails(mergedOptions);
            } else {
                console.log('[EmailScanner] 🔄 Tentative scan réel');
                try {
                    emails = await this.performRealScan(mergedOptions);
                } catch (error) {
                    console.warn('[EmailScanner] ⚠️ Scan réel échoué, basculement simulation:', error);
                    emails = await this.generateSimulatedEmails(mergedOptions);
                }
            }

            this.emails = emails || [];
            console.log(`[EmailScanner] ✅ ${this.emails.length} emails obtenus`);

            if (this.emails.length === 0) {
                return this.buildEmptyResults();
            }

            // Stocker les catégories pré-sélectionnées dans les métriques
            this.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];

            if (mergedOptions.autoCategrize) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'categorizing',
                        message: 'Catégorisation intelligente...',
                        progress: { current: 0, total: this.emails.length }
                    });
                }

                await this.categorizeEmails(this.taskPreselectedCategories);
            }

            if (mergedOptions.autoAnalyze) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: 'Analyse IA simplifiée...',
                        progress: { current: 0, total: Math.min(this.emails.length, 10) }
                    });
                }

                await this.performWebAnalysis();
            }

            const results = this.getDetailedResults();

            if (this.scanProgress) {
                this.scanProgress({
                    phase: 'complete',
                    message: 'Scan web terminé !',
                    results
                });
            }

            this.logScanResults(results);
            
            // Dispatch avec toutes les infos nécessaires
            setTimeout(() => {
                this.dispatchEvent('scanCompleted', {
                    results,
                    emails: this.emails,
                    breakdown: results.breakdown,
                    taskPreselectedCategories: [...this.taskPreselectedCategories],
                    preselectedCount: results.stats.preselectedForTasks,
                    scanMetrics: this.scanMetrics,
                    webMode: true
                });
            }, 10);

            return results;

        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur scan web:', error);
            
            if (this.scanProgress) {
                this.scanProgress({
                    phase: 'error',
                    message: `Erreur: ${error.message}`,
                    error
                });
            }
            
            throw error;
        } finally {
            this.isScanning = false;
        }
    }

    // ================================================
    // GÉNÉRATION D'EMAILS SIMULÉS POUR LE WEB
    // ================================================
    async generateSimulatedEmails(options) {
        console.log('[EmailScanner] 🎭 Génération emails simulés...');
        
        const emailCount = Math.floor(Math.random() * 50) + 30; // 30-80 emails
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
                'Proposition commerciale importante',
                'Nouvelle offre exclusive',
                'Rendez-vous commercial urgent',
                'Présentation produit innovant'
            ],
            tasks: [
                'Action requise: Validation projet',
                'Tâche urgente à compléter',
                'Livrable attendu pour demain',
                'Projet à finaliser cette semaine'
            ],
            meetings: [
                'Réunion équipe - Lundi 14h',
                'Planning meeting Q1',
                'Confirmation rendez-vous',
                'Invitation conférence'
            ],
            finance: [
                'Facture en attente',
                'Relevé de compte',
                'Autorisation virement',
                'Budget approuvé'
            ],
            newsletters: [
                'Newsletter hebdomadaire',
                'Actualités du secteur',
                'Tendances marché',
                'Veille technologique'
            ],
            support: [
                'Ticket #12345 résolu',
                'Mise à jour système',
                'Maintenance programmée',
                'Nouvelle fonctionnalité'
            ],
            personal: [
                'Invitation anniversaire',
                'Photos vacances',
                'Nouvelles de la famille',
                'Plan weekend'
            ]
        };
        
        for (let i = 0; i < emailCount; i++) {
            const template = senderTemplates[Math.floor(Math.random() * senderTemplates.length)];
            const subjects = subjectTemplates[template.type] || ['Email générique'];
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            
            const daysAgo = Math.floor(Math.random() * options.days);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            const email = {
                id: `sim-${i}-${Date.now()}`,
                subject: subject,
                from: {
                    emailAddress: {
                        address: `${template.name.toLowerCase().replace(' ', '.')}@${template.domain}`,
                        name: template.name
                    }
                },
                receivedDateTime: date.toISOString(),
                bodyPreview: this.generateEmailPreview(template.type),
                hasAttachments: Math.random() > 0.7,
                importance: Math.random() > 0.9 ? 'high' : 'normal',
                isRead: Math.random() > 0.3,
                simulatedCategory: template.type, // Hint pour la catégorisation
                webSimulated: true
            };
            
            emails.push(email);
            
            // Progression
            if (this.scanProgress && i % 10 === 0) {
                this.scanProgress({
                    phase: 'fetching',
                    message: `Génération: ${i}/${emailCount} emails`,
                    progress: { current: i, total: emailCount }
                });
            }
            
            // Délai pour simulation réaliste
            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        console.log(`[EmailScanner] ✅ ${emails.length} emails simulés générés`);
        return emails;
    }

    generateEmailPreview(category) {
        const previews = {
            commercial: 'Nous avons le plaisir de vous présenter notre nouvelle offre...',
            tasks: 'Merci de bien vouloir valider ce projet avant la fin de semaine...',
            meetings: 'Nous vous confirmons le rendez-vous prévu le...',
            finance: 'Veuillez trouver ci-joint votre facture du mois...',
            newsletters: 'Découvrez les dernières actualités de notre secteur...',
            support: 'Votre demande de support a été traitée avec succès...',
            personal: 'J\'espère que tu vas bien. Je voulais te raconter...'
        };
        
        return previews[category] || 'Contenu de l\'email...';
    }

    async performRealScan(options) {
        // Tentative de scan réel si services disponibles
        if (!window.mailService) {
            throw new Error('MailService non disponible');
        }
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - options.days);
        
        console.log('[EmailScanner] 📧 Tentative scan réel...');
        
        if (typeof window.mailService.getEmailsFromFolder === 'function') {
            return await window.mailService.getEmailsFromFolder(options.folder, {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                top: options.maxEmails
            });
        } else if (typeof window.mailService.getEmails === 'function') {
            return await window.mailService.getEmails({
                folder: options.folder,
                days: options.days,
                maxEmails: options.maxEmails
            });
        } else {
            throw new Error('Aucune méthode de récupération d\'emails disponible');
        }
    }

    buildEmptyResults() {
        return {
            success: true,
            total: 0,
            categorized: 0,
            breakdown: {},
            stats: { 
                processed: 0, 
                errors: 0,
                preselectedForTasks: 0,
                highConfidence: 0,
                absoluteMatches: 0
            },
            emails: [],
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            scanMetrics: this.scanMetrics,
            webMode: true
        };
    }

    // ================================================
    // CATÉGORISATION ADAPTÉE AU WEB
    // ================================================
    async categorizeEmails(overridePreselectedCategories = null) {
        const total = this.emails.length;
        let processed = 0;
        let errors = 0;

        const taskPreselectedCategories = overridePreselectedCategories || this.taskPreselectedCategories || [];
        
        console.log('[EmailScanner] 🏷️ === CATÉGORISATION WEB ===');
        console.log('[EmailScanner] 📊 Total emails:', total);
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', taskPreselectedCategories);

        const categoryStats = {};
        const keywordStats = {};
        
        // Initialiser avec catégories par défaut web
        Object.keys(this.defaultWebCategories).forEach(catId => {
            categoryStats[catId] = 0;
            keywordStats[catId] = {
                absoluteMatches: 0,
                strongMatches: 0,
                weakMatches: 0,
                exclusionMatches: 0
            };
        });

        const preselectedStats = {};
        taskPreselectedCategories.forEach(catId => {
            preselectedStats[catId] = 0;
        });

        // Traitement par batch pour performance web
        const batchSize = 25;
        for (let i = 0; i < this.emails.length; i += batchSize) {
            const batch = this.emails.slice(i, i + batchSize);
            
            for (const email of batch) {
                try {
                    const analysis = this.analyzeEmailWeb(email);
                    
                    const finalCategory = analysis.category || 'other';
                    
                    email.category = finalCategory;
                    email.categoryScore = analysis.score || 0;
                    email.categoryConfidence = analysis.confidence || 0;
                    email.matchedPatterns = analysis.matchedPatterns || [];
                    email.hasAbsolute = analysis.hasAbsolute || false;
                    email.isSpam = analysis.isSpam || false;
                    email.isCC = analysis.isCC || false;
                    email.isExcluded = analysis.isExcluded || false;
                    
                    // Marquer les emails pré-sélectionnés
                    email.isPreselectedForTasks = taskPreselectedCategories.includes(finalCategory);
                    
                    if (email.isPreselectedForTasks) {
                        preselectedStats[finalCategory] = (preselectedStats[finalCategory] || 0) + 1;
                    }
                    
                    // Ajouter à la catégorie
                    if (!this.categorizedEmails[finalCategory]) {
                        this.categorizedEmails[finalCategory] = [];
                    }
                    
                    this.categorizedEmails[finalCategory].push(email);
                    categoryStats[finalCategory] = (categoryStats[finalCategory] || 0) + 1;

                } catch (error) {
                    console.error('[EmailScanner] ❌ Erreur catégorisation web:', error);
                    
                    email.category = 'other';
                    email.categoryError = error.message;
                    email.isPreselectedForTasks = false;
                    email.categoryScore = 0;
                    email.categoryConfidence = 0;
                    email.matchedPatterns = [];
                    
                    if (!this.categorizedEmails.other) {
                        this.categorizedEmails.other = [];
                    }
                    this.categorizedEmails.other.push(email);
                    categoryStats.other = (categoryStats.other || 0) + 1;
                    errors++;
                }

                processed++;
            }

            // Progression
            if (this.scanProgress && (i % batchSize === 0 || processed === total)) {
                const percent = Math.round((processed / total) * 100);
                this.scanProgress({
                    phase: 'categorizing',
                    message: `Catégorisation: ${processed}/${total} emails (${percent}%)`,
                    progress: { current: processed, total }
                });
            }

            // Pause pour ne pas bloquer l'interface web
            if (i < this.emails.length - batchSize) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const preselectedCount = this.emails.filter(e => e.isPreselectedForTasks).length;
        
        this.scanMetrics.categorizedCount = processed;
        this.scanMetrics.keywordMatches = keywordStats;
        this.scanMetrics.categoryDistribution = categoryStats;
        this.scanMetrics.preselectedCount = preselectedCount;
        this.scanMetrics.preselectedStats = preselectedStats;
        this.scanMetrics.errors = errors;
        
        console.log('[EmailScanner] ✅ === CATÉGORISATION WEB TERMINÉE ===');
        console.log('[EmailScanner] 📊 Distribution:', categoryStats);
        console.log('[EmailScanner] ⭐ Total pré-sélectionnés:', preselectedCount);
        console.log('[EmailScanner] ⚠️ Erreurs:', errors);
    }

    analyzeEmailWeb(email) {
        // Analyse simplifiée pour mode web
        const subject = (email.subject || '').toLowerCase();
        const from = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        const domain = from.split('@')[1] || '';
        
        // Utiliser l'indice de simulation si disponible
        if (email.simulatedCategory && this.defaultWebCategories[email.simulatedCategory]) {
            return {
                category: email.simulatedCategory,
                score: 85 + Math.floor(Math.random() * 15), // Score réaliste 85-100
                confidence: 0.8 + Math.random() * 0.2, // Confiance 80-100%
                matchedPatterns: [
                    { type: 'domain', keyword: domain, score: 20 },
                    { type: 'subject', keyword: 'simulation', score: 15 }
                ],
                hasAbsolute: Math.random() > 0.7,
                isSpam: false,
                isCC: false,
                isExcluded: false,
                webAnalysis: true
            };
        }
        
        // Analyse par mots-clés simplifiée
        const categories = this.getWebCategoryAnalysis(subject, from, preview, domain);
        const topCategory = categories[0] || { category: 'other', score: 10, confidence: 0.3 };
        
        return {
            category: topCategory.category,
            score: topCategory.score,
            confidence: topCategory.confidence,
            matchedPatterns: topCategory.patterns || [],
            hasAbsolute: topCategory.score >= 90,
            isSpam: this.isSpamWeb(subject, from, domain),
            isCC: this.isCCWeb(email),
            isExcluded: false,
            webAnalysis: true
        };
    }

    getWebCategoryAnalysis(subject, from, preview, domain) {
        const categories = [];
        
        // Mots-clés simplifiés pour chaque catégorie
        const patterns = {
            tasks: ['action', 'urgent', 'compléter', 'livrable', 'projet', 'deadline', 'tâche'],
            commercial: ['offre', 'commercial', 'vente', 'proposition', 'devis', 'client'],
            meetings: ['réunion', 'meeting', 'rendez-vous', 'invitation', 'planning', 'rdv'],
            finance: ['facture', 'paiement', 'budget', 'comptabilité', 'virement', 'relevé'],
            newsletters: ['newsletter', 'actualités', 'désabonner', 'unsubscribe', 'veille'],
            support: ['support', 'ticket', 'assistance', 'maintenance', 'mise à jour'],
            personal: ['famille', 'ami', 'personnel', 'privé', 'vacation', 'birthday']
        };
        
        const text = `${subject} ${from} ${preview}`.toLowerCase();
        
        Object.entries(patterns).forEach(([category, keywords]) => {
            let score = 0;
            let matches = [];
            
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 15;
                    matches.push({ type: 'keyword', keyword, score: 15 });
                }
            });
            
            // Bonus domaine
            if (category === 'commercial' && ['company', 'corp', 'business'].some(d => domain.includes(d))) {
                score += 10;
                matches.push({ type: 'domain', keyword: domain, score: 10 });
            }
            
            if (score > 0) {
                categories.push({
                    category,
                    score: Math.min(100, score + Math.floor(Math.random() * 20)), // Ajouter variabilité
                    confidence: Math.min(1, score / 100 + Math.random() * 0.3),
                    patterns: matches
                });
            }
        });
        
        return categories.sort((a, b) => b.score - a.score);
    }

    isSpamWeb(subject, from, domain) {
        const spamIndicators = ['spam', 'viagra', 'casino', 'lottery', 'winner', 'urgent money'];
        const text = `${subject} ${from}`.toLowerCase();
        return spamIndicators.some(indicator => text.includes(indicator));
    }

    isCCWeb(email) {
        // Simulation simple détection CC
        return Math.random() > 0.8; // 20% chance d'être en CC
    }

    // ================================================
    // ANALYSE IA SIMPLIFIÉE POUR LE WEB
    // ================================================
    async performWebAnalysis() {
        console.log('[EmailScanner] 🤖 Analyse IA web simplifiée...');
        
        // Analyser seulement les emails pré-sélectionnés en priorité
        const preselectedEmails = this.emails.filter(email => 
            email.isPreselectedForTasks && 
            email.categoryConfidence > 0.6
        ).slice(0, 5); // Limiter à 5 pour performance web
        
        console.log(`[EmailScanner] 🎯 Analyse de ${preselectedEmails.length} emails prioritaires`);
        
        for (let i = 0; i < preselectedEmails.length; i++) {
            const email = preselectedEmails[i];
            
            try {
                // Simulation d'analyse IA
                const analysis = this.simulateAIAnalysis(email);
                email.aiAnalysis = analysis;
                email.taskSuggested = analysis?.mainTask?.title ? true : false;
                
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: `Analyse IA: ${i + 1}/${preselectedEmails.length}`,
                        progress: { current: i + 1, total: preselectedEmails.length }
                    });
                }
                
                // Délai pour simulation réaliste
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error('[EmailScanner] ❌ Erreur analyse IA web:', error);
                email.aiAnalysisError = error.message;
            }
        }
        
        const totalSuggested = this.emails.filter(e => e.taskSuggested).length;
        console.log('[EmailScanner] ✅ Analyse IA web terminée -', totalSuggested, 'tâches suggérées');
    }

    simulateAIAnalysis(email) {
        const category = email.category;
        const taskTemplates = {
            tasks: {
                title: `Compléter: ${email.subject?.substring(0, 30)}`,
                description: 'Tâche identifiée automatiquement par IA',
                priority: 'high'
            },
            commercial: {
                title: `Suivre proposition commerciale`,
                description: 'Répondre à la demande commerciale',
                priority: 'medium'
            },
            meetings: {
                title: `Préparer réunion`,
                description: 'Se préparer pour la réunion planifiée',
                priority: 'medium'
            },
            finance: {
                title: `Traiter facture/paiement`,
                description: 'Vérifier et traiter le document financier',
                priority: 'high'
            }
        };
        
        const template = taskTemplates[category] || {
            title: `Traiter email de ${email.from?.emailAddress?.name}`,
            description: 'Email nécessitant une action',
            priority: 'low'
        };
        
        return {
            summary: `Email de ${email.from?.emailAddress?.name} concernant ${category}`,
            importance: template.priority,
            mainTask: {
                title: template.title,
                description: template.description,
                priority: template.priority,
                dueDate: null
            },
            tags: [category, 'web-analyzed'],
            webSimulated: true
        };
    }

    // ================================================
    // MÉTHODES D'ACCÈS ADAPTÉES AU WEB
    // ================================================
    getAllEmails() {
        return [...this.emails];
    }

    getEmailsByCategory(categoryId) {
        if (categoryId === 'all') {
            return [...this.emails];
        }
        return this.emails.filter(email => email.category === categoryId);
    }

    getPreselectedEmails() {
        return this.emails.filter(email => email.isPreselectedForTasks);
    }

    getTaskPreselectedCategories() {
        // Version optimisée pour le web avec cache
        const now = Date.now();
        const CACHE_DURATION = 60000; // 1 minute
        
        if (this._categoriesCache && 
            this._categoriesCacheTime && 
            (now - this._categoriesCacheTime) < CACHE_DURATION) {
            return [...this._categoriesCache];
        }
        
        // Vérifier CategoryManager si disponible
        if (window.categoryManager && typeof window.categoryManager.getTaskPreselectedCategories === 'function') {
            const managerCategories = window.categoryManager.getTaskPreselectedCategories();
            this._categoriesCache = [...managerCategories];
            this._categoriesCacheTime = now;
            
            // Sync locale si différent
            if (JSON.stringify([...this.taskPreselectedCategories].sort()) !== 
                JSON.stringify([...managerCategories].sort())) {
                this.taskPreselectedCategories = [...managerCategories];
            }
            
            return [...managerCategories];
        }
        
        return [...this.taskPreselectedCategories];
    }

    updateTaskPreselectedCategories(categories) {
        console.log('[EmailScanner] 📋 === updateTaskPreselectedCategories WEB ===');
        console.log('[EmailScanner] 📥 Nouvelles catégories:', categories);
        
        const oldCategories = [...this.taskPreselectedCategories];
        this.taskPreselectedCategories = Array.isArray(categories) ? [...categories] : [];
        
        // Mettre à jour settings locaux
        if (!this.settings) this.settings = {};
        this.settings.taskPreselectedCategories = this.taskPreselectedCategories;
        
        // Sauvegarder en localStorage
        this.saveToLocalStorage();
        
        // Invalider le cache
        this._categoriesCache = null;
        this._categoriesCacheTime = 0;
        
        const hasChanged = JSON.stringify(oldCategories.sort()) !== 
                          JSON.stringify([...this.taskPreselectedCategories].sort());
        
        if (hasChanged && this.emails.length > 0) {
            console.log('[EmailScanner] 🔄 Changement détecté, re-catégorisation web...');
            setTimeout(() => {
                this.recategorizeEmails();
            }, 100);
        }
        
        return this.taskPreselectedCategories;
    }

    // ================================================
    // RE-CATÉGORISATION WEB
    // ================================================
    async recategorizeEmails() {
        if (this.emails.length === 0) {
            console.log('[EmailScanner] Aucun email à recatégoriser');
            return;
        }

        console.log('[EmailScanner] 🔄 === RE-CATÉGORISATION WEB ===');
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        
        // Réinitialiser les métriques
        this.scanMetrics.startTime = Date.now();
        this.scanMetrics.categorizedCount = 0;
        this.scanMetrics.keywordMatches = {};
        this.scanMetrics.categoryDistribution = {};
        
        // Vider les catégories actuelles
        Object.keys(this.categorizedEmails).forEach(cat => {
            this.categorizedEmails[cat] = [];
        });

        // Re-catégoriser
        await this.categorizeEmails();
        
        console.log('[EmailScanner] ✅ Re-catégorisation web terminée');
        
        // Notifier
        setTimeout(() => {
            this.dispatchEvent('emailsRecategorized', {
                emails: this.emails,
                breakdown: this.getDetailedResults().breakdown,
                taskPreselectedCategories: this.taskPreselectedCategories,
                preselectedCount: this.emails.filter(e => e.isPreselectedForTasks).length,
                keywordStats: this.scanMetrics.keywordMatches,
                webMode: true
            });
        }, 10);
    }

    // ================================================
    // RÉSULTATS DÉTAILLÉS WEB
    // ================================================
    getDetailedResults() {
        const breakdown = {};
        let totalCategorized = 0;
        let totalWithHighConfidence = 0;
        let totalWithAbsolute = 0;
        let totalWithTasks = 0;
        let totalPreselected = 0;
        let totalExcluded = 0;
        let totalSpam = 0;

        Object.entries(this.categorizedEmails).forEach(([catId, emails]) => {
            breakdown[catId] = emails.length;
            
            if (catId === 'spam') {
                totalSpam += emails.length;
            } else if (catId === 'excluded') {
                totalExcluded += emails.length;
            } else if (catId !== 'other') {
                totalCategorized += emails.length;
            }
            
            emails.forEach(email => {
                if (email.categoryConfidence >= 0.8) {
                    totalWithHighConfidence++;
                }
                if (email.hasAbsolute) {
                    totalWithAbsolute++;
                }
                if (email.taskSuggested) {
                    totalWithTasks++;
                }
                if (email.isPreselectedForTasks) {
                    totalPreselected++;
                }
            });
        });

        const avgConfidence = this.calculateAverageConfidence();
        const avgScore = this.calculateAverageScore();
        const scanDuration = this.scanMetrics.startTime ? 
            Math.round((Date.now() - this.scanMetrics.startTime) / 1000) : 0;

        return {
            success: true,
            total: this.emails.length,
            categorized: totalCategorized,
            breakdown,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: {
                processed: this.emails.length,
                errors: this.emails.filter(e => e.categoryError).length,
                highConfidence: totalWithHighConfidence,
                absoluteMatches: totalWithAbsolute,
                taskSuggestions: totalWithTasks,
                preselectedForTasks: totalPreselected,
                averageConfidence: avgConfidence,
                averageScore: avgScore,
                categoriesUsed: Object.keys(breakdown).filter(cat => breakdown[cat] > 0).length,
                spamFiltered: totalSpam,
                ccDetected: this.emails.filter(e => e.isCC).length,
                excluded: totalExcluded,
                scanDuration: scanDuration,
                webMode: true
            },
            keywordStats: this.scanMetrics.keywordMatches,
            emails: this.emails,
            settings: this.settings,
            scanMetrics: this.scanMetrics,
            webConfig: this.webConfig
        };
    }

    // ================================================
    // MÉTHODES UTILITAIRES WEB
    // ================================================
    calculateAverageConfidence() {
        if (this.emails.length === 0) return 0;
        
        const totalConfidence = this.emails.reduce((sum, email) => {
            return sum + (email.categoryConfidence || 0);
        }, 0);
        
        return Math.round((totalConfidence / this.emails.length) * 100) / 100;
    }

    calculateAverageScore() {
        if (this.emails.length === 0) return 0;
        
        const totalScore = this.emails.reduce((sum, email) => {
            return sum + (email.categoryScore || 0);
        }, 0);
        
        return Math.round(totalScore / this.emails.length);
    }

    reset() {
        console.log('[EmailScanner] 🔄 Réinitialisation web...');
        this.emails = [];
        this.categorizedEmails = {};
        
        this.scanMetrics = {
            startTime: Date.now(),
            categorizedCount: 0,
            keywordMatches: {},
            categoryDistribution: {}
        };
        
        // Initialiser avec catégories par défaut web
        Object.keys(this.defaultWebCategories).forEach(catId => {
            this.categorizedEmails[catId] = [];
        });
        
        console.log('[EmailScanner] ✅ Réinitialisation web terminée');
    }

    getEmailById(emailId) {
        return this.emails.find(email => email.id === emailId);
    }

    searchEmails(query) {
        if (!query) return [...this.emails];

        const searchTerm = query.toLowerCase();
        
        return this.emails.filter(email => {
            const subject = (email.subject || '').toLowerCase();
            const body = (email.bodyPreview || '').toLowerCase();
            const from = (email.from?.emailAddress?.address || '').toLowerCase();
            const fromName = (email.from?.emailAddress?.name || '').toLowerCase();
            const category = (email.category || '').toLowerCase();

            return subject.includes(searchTerm) ||
                   body.includes(searchTerm) ||
                   from.includes(searchTerm) ||
                   fromName.includes(searchTerm) ||
                   category.includes(searchTerm);
        });
    }

    // ================================================
    // DEBUG WEB
    // ================================================
    getDebugInfo() {
        const preselectedCount = this.emails.filter(e => e.isPreselectedForTasks).length;
        const preselectedWithTasks = this.emails.filter(e => e.isPreselectedForTasks && e.taskSuggested).length;
        
        return {
            isScanning: this.isScanning,
            totalEmails: this.emails.length,
            categorizedCount: Object.values(this.categorizedEmails)
                .reduce((sum, emails) => sum + emails.length, 0),
            categories: Object.keys(this.categorizedEmails)
                .filter(cat => this.categorizedEmails[cat].length > 0),
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            preselectedEmailsCount: preselectedCount,
            preselectedWithTasksCount: preselectedWithTasks,
            avgConfidence: this.calculateAverageConfidence(),
            avgScore: this.calculateAverageScore(),
            settings: this.settings,
            hasTaskSuggestions: this.emails.filter(e => e.taskSuggested).length,
            categoryManagerAvailable: !!window.categoryManager,
            mailServiceAvailable: !!window.mailService,
            lastSettingsSync: this.lastSettingsSync,
            syncInterval: !!this.syncInterval,
            scanMetrics: this.scanMetrics,
            webConfig: this.webConfig,
            webMode: true,
            changeListener: !!this.changeListener,
            syncStatus: {
                lastSync: this.lastSettingsSync,
                categoriesInSync: this.verifyCategoriesSync(),
                settingsSource: window.categoryManager ? 'CategoryManager' : 'localStorage'
            }
        };
    }

    verifyCategoriesSync() {
        if (!window.categoryManager) return false;
        
        try {
            const managerCategories = window.categoryManager.getTaskPreselectedCategories();
            return JSON.stringify([...this.taskPreselectedCategories].sort()) === 
                   JSON.stringify([...managerCategories].sort());
        } catch (error) {
            return false;
        }
    }

    // ================================================
    // LOGGING WEB
    // ================================================
    logScanResults(results) {
        console.log('[EmailScanner] 📊 === RÉSULTATS WEB FINAUX ===');
        console.log(`[EmailScanner] Mode: WEB SIMULATION`);
        console.log(`[EmailScanner] Total emails: ${results.total}`);
        console.log(`[EmailScanner] Catégorisés: ${results.categorized} (${Math.round((results.categorized / results.total) * 100)}%)`);
        console.log(`[EmailScanner] ⭐ PRÉ-SÉLECTIONNÉS POUR TÂCHES: ${results.stats.preselectedForTasks}`);
        console.log(`[EmailScanner] Suggestions de tâches: ${results.stats.taskSuggestions}`);
        console.log(`[EmailScanner] Confiance moyenne: ${results.stats.averageConfidence}`);
        console.log(`[EmailScanner] Durée du scan: ${results.stats.scanDuration}s`);
        console.log(`[EmailScanner] 📋 Catégories pré-sélectionnées: ${results.taskPreselectedCategories.join(', ')}`);
        
        console.log('[EmailScanner] Distribution par catégorie:');
        Object.entries(results.breakdown).forEach(([cat, count]) => {
            if (count > 0) {
                const percentage = Math.round((count / results.total) * 100);
                const categoryInfo = this.defaultWebCategories[cat] || { name: cat, icon: '📂' };
                const isPreselected = this.taskPreselectedCategories.includes(cat);
                const preselectedMark = isPreselected ? ' ⭐ PRÉ-SÉLECTIONNÉ' : '';
                console.log(`[EmailScanner]   ${categoryInfo.icon} ${categoryInfo.name}: ${count} emails (${percentage}%)${preselectedMark}`);
            }
        });
        
        console.log('[EmailScanner] ===============================');
    }

    // ================================================
    // EXPORT WEB
    // ================================================
    exportToJSON() {
        const data = {
            scanDate: new Date().toISOString(),
            totalEmails: this.emails.length,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: this.getDetailedResults().stats,
            settings: this.settings,
            webConfig: this.webConfig,
            webMode: true,
            categories: {},
            emails: []
        };

        // Ajouter résumé par catégorie
        Object.entries(this.categorizedEmails).forEach(([catId, emails]) => {
            const categoryInfo = this.defaultWebCategories[catId] || { name: catId, icon: '📂' };
            const preselectedInCategory = emails.filter(e => e.isPreselectedForTasks).length;
            
            data.categories[catId] = {
                name: categoryInfo.name,
                icon: categoryInfo.icon,
                count: emails.length,
                percentage: Math.round((emails.length / this.emails.length) * 100),
                preselectedCount: preselectedInCategory,
                isPreselectedCategory: this.taskPreselectedCategories.includes(catId)
            };
        });

        // Ajouter détails emails
        data.emails = this.emails.map(email => ({
            id: email.id,
            date: email.receivedDateTime,
            from: {
                name: email.from?.emailAddress?.name,
                email: email.from?.emailAddress?.address
            },
            subject: email.subject,
            category: email.category,
            confidence: email.categoryConfidence,
            score: email.categoryScore,
            taskSuggested: email.taskSuggested,
            isPreselectedForTasks: email.isPreselectedForTasks,
            webSimulated: email.webSimulated || false
        }));

        return JSON.stringify(data, null, 2);
    }

    exportResults(format = 'json') {
        console.log('[EmailScanner] 📤 Export web des résultats en', format);
        
        if (this.emails.length === 0) {
            this.showWebToast('Aucune donnée à exporter', 'warning');
            return;
        }

        try {
            let content, filename, mimeType;

            if (format === 'json') {
                content = this.exportToJSON();
                filename = `email_scan_web_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json;charset=utf-8;';
            } else {
                // CSV simplifié pour web
                content = this.exportToCSVWeb();
                filename = `email_scan_web_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv;charset=utf-8;';
            }

            this.downloadFile(content, filename, mimeType);
            this.showWebToast(`${this.emails.length} emails exportés`, 'success');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur export web:', error);
            this.showWebToast('Erreur lors de l\'export', 'error');
        }
    }

    exportToCSVWeb() {
        const rows = [
            ['Date', 'De', 'Email', 'Sujet', 'Catégorie', 'Confiance', 'Pré-sélectionné', 'Tâche Suggérée']
        ];

        this.emails.forEach(email => {
            const categoryInfo = this.defaultWebCategories[email.category] || { name: email.category };
            
            rows.push([
                new Date(email.receivedDateTime).toLocaleString('fr-FR'),
                email.from?.emailAddress?.name || '',
                email.from?.emailAddress?.address || '',
                email.subject || 'Sans sujet',
                categoryInfo.name,
                Math.round((email.categoryConfidence || 0) * 100) + '%',
                email.isPreselectedForTasks ? 'Oui' : 'Non',
                email.taskSuggested ? 'Oui' : 'Non'
            ]);
        });

        return '\ufeff' + rows.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    showWebToast(message, type = 'info', duration = 3000) {
        // Toast simple pour environnement web
        if (window.uiManager?.showToast) {
            window.uiManager.showToast(message, type, duration);
            return;
        }
        
        // Fallback toast natif
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    // ================================================
    // EVENT LISTENERS WEB
    // ================================================
    setupWebEventListeners() {
        if (this.eventListenersSetup) {
            return;
        }

        // Version simplifiée pour le web
        this.forceSyncHandler = (event) => {
            if (event.detail?.source === 'EmailScanner') {
                return;
            }
            
            console.log('[EmailScanner] 🚀 Synchronisation web forcée');
            this.loadWebSettings();
            
            if (this.emails.length > 0) {
                setTimeout(() => {
                    this.recategorizeEmails();
                }, 100);
            }
        };

        window.addEventListener('forceSynchronization', this.forceSyncHandler);
        
        this.eventListenersSetup = true;
        console.log('[EmailScanner] ✅ Event listeners web configurés');
    }

    dispatchEvent(eventName, detail) {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { 
                detail: {
                    ...detail,
                    source: 'EmailScanner',
                    timestamp: Date.now(),
                    webMode: true
                }
            }));
        } catch (error) {
            console.error(`[EmailScanner] Erreur dispatch web ${eventName}:`, error);
        }
    }

    // ================================================
    // NETTOYAGE WEB
    // ================================================
    cleanup() {
        console.log('[EmailScanner] 🧹 Nettoyage web...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.changeListener && typeof this.changeListener === 'function') {
            this.changeListener();
            this.changeListener = null;
        }
        
        if (this.forceSyncHandler) {
            window.removeEventListener('forceSynchronization', this.forceSyncHandler);
        }
        this.eventListenersSetup = false;
        
        // Nettoyer cache
        this.cache.clear();
        this._categoriesCache = null;
        this._categoriesCacheTime = 0;
        
        this.emails = [];
        this.categorizedEmails = {};
        this.taskPreselectedCategories = [];
        this.scanProgress = null;
        this.scanMetrics = { startTime: null, categorizedCount: 0, keywordMatches: {}, categoryDistribution: {} };
        
        console.log('[EmailScanner] ✅ Nettoyage web terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        console.log('[EmailScanner] Instance web détruite');
    }

    // ================================================
    // MÉTHODES UTILITAIRES SPÉCIFIQUES WEB
    // ================================================
    getCategoryColor(categoryId) {
        return this.defaultWebCategories[categoryId]?.color || '#64748b';
    }

    getCategoryIcon(categoryId) {
        return this.defaultWebCategories[categoryId]?.icon || '📂';
    }

    getCategoryName(categoryId) {
        return this.defaultWebCategories[categoryId]?.name || categoryId || 'Autre';
    }

    getWebCompatibleCategories() {
        return this.defaultWebCategories;
    }

    isWebMode() {
        return true;
    }

    getWebConfig() {
        return { ...this.webConfig };
    }
}

// ================================================
// CRÉATION INSTANCE GLOBALE WEB
// ================================================

// Nettoyer ancienne instance
if (window.emailScanner) {
    console.log('[EmailScanner] 🔄 Nettoyage ancienne instance web...');
    window.emailScanner.destroy?.();
}

console.log('[EmailScanner] 🚀 Création instance web v9.0...');
window.emailScanner = new EmailScanner();

// Fonctions utilitaires pour débogage web
window.testEmailScannerWeb = function() {
    console.group('🧪 TEST EmailScanner Web v9.0');
    
    const testEmails = [
        {
            subject: "Newsletter hebdomadaire - Mode web",
            from: { emailAddress: { address: "newsletter@example.com", name: "Example News" } },
            bodyPreview: "Voici votre newsletter en mode web",
            receivedDateTime: new Date().toISOString(),
            simulatedCategory: 'newsletters'
        },
        {
            subject: "Action requise: Tâche urgente web",
            from: { emailAddress: { address: "tasks@company.com", name: "Task Manager" } },
            bodyPreview: "Veuillez compléter cette tâche importante",
            receivedDateTime: new Date().toISOString(),
            simulatedCategory: 'tasks'
        }
    ];
    
    testEmails.forEach(email => {
        const analysis = window.emailScanner.analyzeEmailWeb(email);
        console.log('Email:', email.subject);
        console.log('Analyse:', analysis);
    });
    
    console.log('Debug Info Web:', window.emailScanner.getDebugInfo());
    console.log('Catégories pré-sélectionnées:', window.emailScanner.getTaskPreselectedCategories());
    console.log('Configuration web:', window.emailScanner.getWebConfig());
    
    console.groupEnd();
    return { success: true, testsRun: testEmails.length, webMode: true };
};

window.simulateEmailScanWeb = async function() {
    console.log('🚀 Simulation scan web...');
    
    try {
        const results = await window.emailScanner.scan({
            days: 7,
            simulationMode: true,
            onProgress: (progress) => {
                console.log(`Progression: ${progress.phase} - ${progress.message}`);
            }
        });
        
        console.log('✅ Simulation terminée:', results);
        return results;
    } catch (error) {
        console.error('❌ Erreur simulation:', error);
        return { error: error.message };
    }
};

window.debugEmailCategoriesWeb = function() {
    console.group('📊 DEBUG Catégories Web v9.0');
    console.log('Mode:', 'WEB SIMULATION');
    console.log('Settings:', window.emailScanner.settings);
    console.log('Catégories par défaut:', window.emailScanner.defaultWebCategories);
    console.log('Task Preselected Categories:', window.emailScanner.taskPreselectedCategories);
    console.log('Emails total:', window.emailScanner.emails.length);
    console.log('Emails pré-sélectionnés:', window.emailScanner.getPreselectedEmails().length);
    console.log('Debug complet web:', window.emailScanner.getDebugInfo());
    console.groupEnd();
};

// Auto-initialisation si DOM prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[EmailScanner] 📱 DOM prêt - Scanner web initialisé');
    });
} else {
    console.log('[EmailScanner] 📱 Scanner web prêt');
}

console.log('✅ EmailScanner v9.0 loaded - Web Compatible Mode (coruscating-dodol-f30e8d.netlify.app)');
