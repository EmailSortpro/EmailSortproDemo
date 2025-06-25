// EmailScanner.js - Version 11.0 - Scan et catégorisation optimisés

class EmailScanner {
    constructor() {
        this.emails = [];
        this.categorizedEmails = {};
        this.scanProgress = null;
        this.isScanning = false;
        this.settings = {};
        
        // Synchronisation
        this.taskPreselectedCategories = [];
        this.lastSettingsSync = 0;
        this.syncInterval = null;
        this.changeListener = null;
        
        // Configuration
        this.realEmailsConfig = {
            requireRealEmails: true,
            rejectSimulation: true,
            validateAuthentication: true,
            maxEmails: 500,
            cacheDuration: 300000
        };
        
        // Métriques
        this.scanMetrics = {
            startTime: null,
            categorizedCount: 0,
            keywordMatches: {},
            categoryDistribution: {},
            taskPreselectedCategories: [],
            realEmailsOnly: true
        };
        
        // État de synchronisation
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Version 11.0 - Scan et catégorisation optimisés');
        this.initialize();
    }

    // ================================================
    // INITIALISATION
    // ================================================
    async initialize() {
        try {
            console.log('[EmailScanner] 🚀 Initialisation...');
            
            await this.loadSettings();
            this.initializeDefaultCategories();
            this.registerChangeListener();
            this.setupEventListeners();
            this.startSync();
            
            console.log('[EmailScanner] 🌐 Initialisé avec succès');
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur initialisation:', error);
            this.settings = this.getDefaultSettings();
            this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
        }
    }

    async loadSettings() {
        // Priorité 1: CategoryManager
        if (window.categoryManager && typeof window.categoryManager.getSettings === 'function') {
            try {
                this.settings = window.categoryManager.getSettings();
                this.taskPreselectedCategories = window.categoryManager.getTaskPreselectedCategories();
                console.log('[EmailScanner] ✅ Settings chargés depuis CategoryManager');
                return true;
            } catch (error) {
                console.warn('[EmailScanner] ⚠️ Erreur CategoryManager:', error);
            }
        }
        
        // Priorité 2: localStorage
        return this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('categorySettings');
            if (saved) {
                this.settings = JSON.parse(saved);
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[EmailScanner] 📦 Settings chargés depuis localStorage');
            } else {
                this.settings = this.getDefaultSettings();
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[EmailScanner] 📝 Utilisation settings par défaut');
            }
            
            this.lastSettingsSync = Date.now();
            return true;
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur localStorage:', error);
            this.settings = this.getDefaultSettings();
            this.taskPreselectedCategories = [];
            return false;
        }
    }

    getDefaultSettings() {
        return {
            activeCategories: null,
            excludedDomains: [],
            excludedKeywords: [],
            taskPreselectedCategories: [],
            categoryExclusions: {
                domains: [],
                emails: []
            },
            scanSettings: {
                defaultPeriod: 7,
                defaultFolder: 'inbox',
                autoAnalyze: true,
                autoCategrize: true,
                realEmailsOnly: true,
                rejectSimulation: true
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
                realEmailsOnly: true
            }
        };
    }

    initializeDefaultCategories() {
        this.defaultWebCategories = {
            'newsletters': { icon: '📰', name: 'Newsletters', color: '#8b5cf6', priority: 100 },
            'tasks': { icon: '✅', name: 'Actions', color: '#ef4444', priority: 85 },
            'security': { icon: '🔒', name: 'Sécurité', color: '#dc2626', priority: 90 },
            'finance': { icon: '💰', name: 'Finance', color: '#059669', priority: 80 },
            'meetings': { icon: '📅', name: 'Réunions', color: '#f59e0b', priority: 75 },
            'commercial': { icon: '💼', name: 'Commercial', color: '#3b82f6', priority: 70 },
            'support': { icon: '🛠️', name: 'Support', color: '#6366f1', priority: 65 },
            'project': { icon: '📊', name: 'Projets', color: '#10b981', priority: 60 },
            'notifications': { icon: '🔔', name: 'Notifications', color: '#94a3b8', priority: 40 },
            'cc': { icon: '📋', name: 'En Copie', color: '#64748b', priority: 30 },
            'other': { icon: '📂', name: 'Autre', color: '#6b7280', priority: 10 }
        };
        
        Object.keys(this.defaultWebCategories).forEach(catId => {
            this.categorizedEmails[catId] = [];
        });
        
        console.log('[EmailScanner] 🎨 Catégories par défaut initialisées');
    }

    registerChangeListener() {
        if (window.categoryManager && typeof window.categoryManager.addChangeListener === 'function') {
            this.changeListener = window.categoryManager.addChangeListener((type, value, fullSettings) => {
                console.log(`[EmailScanner] 📨 Changement reçu: ${type}`, value);
                this.handleSettingsChange(type, value, fullSettings);
            });
            console.log('[EmailScanner] 👂 Listener enregistré avec CategoryManager');
        }
    }

    handleSettingsChange(type, value, fullSettings) {
        console.log(`[EmailScanner] 🔄 Traitement changement: ${type}`);
        
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
                console.log('[EmailScanner] 🔄 Synchronisation complète');
                this.settings = { ...this.settings, ...fullSettings };
                this.taskPreselectedCategories = fullSettings.taskPreselectedCategories || [];
                this.saveToLocalStorage();
                break;
        }
        
        if (needsRecategorization && this.emails.length > 0) {
            console.log('[EmailScanner] 🔄 Re-catégorisation automatique');
            setTimeout(() => {
                this.recategorizeEmails();
            }, 100);
        }
        
        setTimeout(() => {
            this.dispatchEvent('emailScannerSynced', {
                type,
                value,
                settings: this.settings,
                taskPreselectedCategories: this.taskPreselectedCategories,
                realEmailsMode: true,
                startScanSynced: this.startScanSynced,
                simulationMode: false
            });
        }, 10);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('categorySettings', JSON.stringify(this.settings));
            console.log('[EmailScanner] 💾 Settings sauvegardés');
        } catch (error) {
            console.warn('[EmailScanner] ⚠️ Erreur sauvegarde localStorage:', error);
        }
    }

    startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.checkSettingsSync();
        }, 15000);
    }

    async checkSettingsSync() {
        if (!window.categoryManager) return;
        
        try {
            const currentManagerCategories = window.categoryManager.getTaskPreselectedCategories();
            const categoriesChanged = JSON.stringify([...this.taskPreselectedCategories].sort()) !== 
                                     JSON.stringify([...currentManagerCategories].sort());
            
            if (categoriesChanged) {
                console.log('[EmailScanner] 🔄 Désynchronisation détectée, correction...');
                this.taskPreselectedCategories = [...currentManagerCategories];
                this.saveToLocalStorage();
                
                if (this.emails.length > 0) {
                    await this.recategorizeEmails();
                }
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur vérification sync:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('scanCompleted', (event) => {
            console.log('[EmailScanner] 📨 Événement scanCompleted reçu:', event.detail);
            
            if (event.detail?.simulationMode === true || event.detail?.emailType === 'simulated') {
                console.error('[EmailScanner] ❌ REJET événement: scan en mode simulation détecté');
                return;
            }
            
            if (event.detail?.hasRealEmails !== true) {
                console.warn('[EmailScanner] ⚠️ ATTENTION: événement sans confirmation emails réels');
            }
            
            this.handleScanCompleted(event.detail);
        });
        
        window.addEventListener('emailScannerSynced', (event) => {
            console.log('[EmailScanner] 🔄 Événement emailScannerSynced reçu:', event.detail);
            
            if (event.detail?.simulationMode === true) {
                console.error('[EmailScanner] ❌ REJET sync: mode simulation détecté');
                return;
            }
            
            this.handleSyncEvent(event.detail);
        });
    }

    handleScanCompleted(scanData) {
        console.log('[EmailScanner] 🎯 Traitement scan terminé...');
        
        try {
            if (scanData.simulationMode === true || scanData.emailType === 'simulated') {
                console.error('[EmailScanner] ❌ REJET: mode simulation détecté');
                return;
            }
            
            if (scanData.source && scanData.source.includes('StartScan')) {
                console.log('[EmailScanner] 📊 Scan provenant de StartScan détecté');
                
                this.startScanSynced = true;
                this.lastSyncTimestamp = scanData.timestamp || Date.now();
                this.realEmailsVerified = scanData.hasRealEmails === true;
                
                if (scanData.taskPreselectedCategories) {
                    this.updateTaskPreselectedCategories(scanData.taskPreselectedCategories);
                }
                
                if (scanData.emails && Array.isArray(scanData.emails)) {
                    console.log(`[EmailScanner] 📧 ${scanData.emails.length} emails reçus depuis StartScan`);
                    
                    const realEmails = this.verifyAndFilterRealEmails(scanData.emails);
                    
                    if (realEmails.length > 0) {
                        this.emails = [...realEmails];
                        console.log(`[EmailScanner] ✅ ${realEmails.length} emails réels acceptés`);
                        
                        setTimeout(() => {
                            this.processSyncedEmails();
                        }, 100);
                    } else {
                        console.error('[EmailScanner] ❌ AUCUN email réel valide trouvé');
                    }
                }
                
                console.log('[EmailScanner] ✅ Scan StartScan traité');
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur traitement scan terminé:', error);
        }
    }

    handleSyncEvent(syncData) {
        console.log('[EmailScanner] 🔄 Traitement synchronisation...');
        
        try {
            if (syncData.simulationMode === true) {
                console.error('[EmailScanner] ❌ REJET sync: mode simulation');
                return;
            }
            
            if (syncData.source && syncData.source.includes('StartScan')) {
                this.startScanSynced = true;
                this.lastSyncTimestamp = syncData.timestamp || Date.now();
                this.realEmailsVerified = syncData.hasRealEmails === true;
                
                if (syncData.taskPreselectedCategories) {
                    this.updateTaskPreselectedCategories(syncData.taskPreselectedCategories);
                }
                
                console.log(`[EmailScanner] ✅ Synchronisation StartScan: ${syncData.emailCount} emails`);
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur synchronisation:', error);
        }
    }

    verifyAndFilterRealEmails(emails) {
        console.log('[EmailScanner] 🔍 Vérification emails réels...');
        
        if (!Array.isArray(emails)) {
            console.error('[EmailScanner] ❌ Emails invalides (pas un tableau)');
            return [];
        }
        
        const realEmails = emails.filter(email => {
            const isReal = email.realEmail === true;
            const notSimulated = email.webSimulated !== true;
            const notSimulationMode = email.simulationMode !== true;
            const hasValidId = email.id && typeof email.id === 'string';
            const hasValidFrom = email.from && email.from.emailAddress && email.from.emailAddress.address;
            const hasSubject = email.subject !== undefined;
            
            const isValid = isReal && notSimulated && notSimulationMode && hasValidId && hasValidFrom && hasSubject;
            
            if (!isValid) {
                console.log(`[EmailScanner] ⚠️ Email rejeté: ${email.id} - Real:${isReal}, Simulated:${!notSimulated}, Valid:${hasValidId}`);
            }
            
            return isValid;
        });
        
        console.log(`[EmailScanner] ✅ ${realEmails.length}/${emails.length} emails réels validés`);
        
        if (realEmails.length > 0) {
            console.log('[EmailScanner] 📊 Échantillon emails réels acceptés:');
            realEmails.slice(0, 3).forEach((email, i) => {
                console.log(`[EmailScanner]   ${i+1}. ${email.subject} - ${email.from?.emailAddress?.address}`);
            });
        }
        
        return realEmails;
    }

    async processSyncedEmails() {
        console.log('[EmailScanner] 🔄 Traitement des emails synchronisés...');
        
        if (this.emails.length === 0) {
            console.log('[EmailScanner] Aucun email à traiter');
            return;
        }
        
        try {
            this.scanMetrics = {
                startTime: Date.now(),
                categorizedCount: 0,
                keywordMatches: {},
                categoryDistribution: {},
                taskPreselectedCategories: [...this.taskPreselectedCategories],
                realEmailsOnly: true
            };
            
            this.initializeDefaultCategories();
            
            await this.categorizeEmails();
            
            setTimeout(() => {
                this.dispatchEvent('emailsRecategorized', {
                    emails: this.emails,
                    breakdown: this.getDetailedResults().breakdown,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    preselectedCount: this.emails.filter(e => e.isPreselectedForTasks).length,
                    keywordStats: this.scanMetrics.keywordMatches,
                    realEmailsMode: true,
                    startScanSynced: true,
                    simulationMode: false
                });
            }, 100);
            
            console.log('[EmailScanner] ✅ Emails synchronisés traités');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur traitement emails synchronisés:', error);
        }
    }

    // ================================================
    // SCAN PRINCIPAL
    // ================================================
    async scan(options = {}) {
        console.log('[EmailScanner] 🚀 === DÉMARRAGE SCAN ===');
        
        if (options.simulationMode === true) {
            throw new Error('Mode simulation INTERDIT - Emails réels uniquement');
        }
        
        await this.loadSettings();
        
        const scanSettings = this.settings.scanSettings || {};
        const mergedOptions = {
            days: options.days || scanSettings.defaultPeriod || 7,
            folder: options.folder || scanSettings.defaultFolder || 'inbox',
            onProgress: options.onProgress || null,
            includeSpam: options.includeSpam !== undefined ? options.includeSpam : !this.settings.preferences?.excludeSpam,
            maxEmails: Math.min(options.maxEmails || this.realEmailsConfig.maxEmails, 500),
            autoAnalyze: options.autoAnalyze !== undefined ? options.autoAnalyze : scanSettings.autoAnalyze,
            autoCategrize: options.autoCategrize !== undefined ? options.autoCategrize : scanSettings.autoCategrize,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            realEmailsOnly: true,
            simulationMode: false,
            requireAuthentication: true,
            fromStartScan: options.fromStartScan || false
        };

        if (this.isScanning) {
            console.warn('[EmailScanner] Scan déjà en cours');
            return null;
        }

        try {
            this.isScanning = true;
            this.reset();
            this.scanProgress = mergedOptions.onProgress;
            this.scanMetrics.startTime = Date.now();

            console.log('[EmailScanner] 📊 Options scan:', mergedOptions);

            if (this.scanProgress) {
                this.scanProgress({ 
                    phase: 'fetching', 
                    message: `Récupération emails réels (${mergedOptions.days} jours)...`,
                    progress: { current: 0, total: 100 }
                });
            }

            let emails;
            
            if (!this.verifyAuthentication()) {
                throw new Error('Authentification requise pour accéder aux emails réels');
            }
            
            if (this.startScanSynced && this.emails.length > 0 && this.realEmailsVerified) {
                console.log('[EmailScanner] 📧 Utilisation des emails synchronisés depuis StartScan');
                emails = [...this.emails];
            } else {
                console.log('[EmailScanner] 🔄 Récupération directe emails');
                emails = await this.performScan(mergedOptions);
            }

            const verifiedEmails = this.verifyAndFilterRealEmails(emails);
            
            if (verifiedEmails.length === 0) {
                throw new Error('Aucun email réel trouvé ou authentification invalide');
            }

            this.emails = verifiedEmails;
            console.log(`[EmailScanner] ✅ ${this.emails.length} emails obtenus`);

            this.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
            this.scanMetrics.realEmailsOnly = true;

            if (mergedOptions.autoCategrize) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'categorizing',
                        message: 'Catégorisation intelligente emails...',
                        progress: { current: 0, total: this.emails.length }
                    });
                }

                await this.categorizeEmails(this.taskPreselectedCategories);
            }

            if (mergedOptions.autoAnalyze) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: 'Analyse IA emails...',
                        progress: { current: 0, total: Math.min(this.emails.length, 10) }
                    });
                }

                await this.performAnalysis();
            }

            const results = this.getDetailedResults();

            if (this.scanProgress) {
                this.scanProgress({
                    phase: 'complete',
                    message: 'Scan terminé !',
                    results
                });
            }

            this.logScanResults(results);
            
            setTimeout(() => {
                this.dispatchEvent('scanCompleted', {
                    results,
                    emails: this.emails,
                    breakdown: results.breakdown,
                    taskPreselectedCategories: [...this.taskPreselectedCategories],
                    preselectedCount: results.stats.preselectedForTasks,
                    scanMetrics: this.scanMetrics,
                    realEmailsMode: true,
                    startScanSynced: this.startScanSynced,
                    simulationMode: false,
                    hasRealEmails: true
                });
            }, 10);

            return results;

        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur scan:', error);
            
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

    verifyAuthentication() {
        console.log('[EmailScanner] 🔍 Vérification authentification...');
        
        if (window.mailService) {
            const isValid = window.mailService.isAuthenticationValid?.() || false;
            const hasReal = window.mailService.hasRealEmails?.() || false;
            
            console.log('[EmailScanner] MailService auth:', isValid, 'real emails:', hasReal);
            
            if (isValid && hasReal) {
                return true;
            }
        }
        
        if (window.authService) {
            try {
                const isAuth = window.authService.isAuthenticated?.() || false;
                if (isAuth) {
                    return true;
                }
            } catch (error) {
                console.warn('[EmailScanner] Erreur test auth:', error);
            }
        }
        
        console.log('[EmailScanner] ❌ Aucune authentification valide');
        return false;
    }

    async performScan(options) {
        console.log('[EmailScanner] 📧 Exécution scan...');
        
        if (!window.mailService) {
            throw new Error('MailService non disponible');
        }
        
        if (!window.mailService.isInitialized) {
            console.log('[EmailScanner] 🔧 Initialisation MailService...');
            await window.mailService.initialize();
        }
        
        if (!window.mailService.isAuthenticationValid()) {
            throw new Error('Authentification MailService invalide');
        }
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - options.days);
        
        console.log('[EmailScanner] 📅 Période:', {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            days: options.days
        });
        
        try {
            const emails = await window.mailService.getEmailsFromFolder(options.folder, {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                top: options.maxEmails
            });
            
            if (!emails || emails.length === 0) {
                throw new Error('Aucun email trouvé dans la période spécifiée');
            }
            
            console.log(`[EmailScanner] ✅ ${emails.length} emails récupérés depuis MailService`);
            return emails;
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur récupération emails:', error);
            throw error;
        }
    }

    // ================================================
    // CATÉGORISATION
    // ================================================
    async categorizeEmails(overridePreselectedCategories = null) {
        const total = this.emails.length;
        let processed = 0;
        let errors = 0;

        const taskPreselectedCategories = overridePreselectedCategories || this.taskPreselectedCategories || [];
        
        console.log('[EmailScanner] 🏷️ === CATÉGORISATION ===');
        console.log('[EmailScanner] 📊 Total emails:', total);
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', taskPreselectedCategories);

        const categoryStats = {};
        const keywordStats = {};
        
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

        const batchSize = 25;
        for (let i = 0; i < this.emails.length; i += batchSize) {
            const batch = this.emails.slice(i, i + batchSize);
            
            for (const email of batch) {
                try {
                    if (email.realEmail !== true || email.webSimulated === true) {
                        console.warn(`[EmailScanner] ⚠️ Email non-réel détecté: ${email.id}`);
                        continue;
                    }
                    
                    const analysis = this.analyzeEmail(email);
                    
                    const finalCategory = analysis.category || 'other';
                    
                    email.category = finalCategory;
                    email.categoryScore = analysis.score || 0;
                    email.categoryConfidence = analysis.confidence || 0;
                    email.matchedPatterns = analysis.matchedPatterns || [];
                    email.hasAbsolute = analysis.hasAbsolute || false;
                    email.isSpam = analysis.isSpam || false;
                    email.isCC = analysis.isCC || false;
                    email.isExcluded = analysis.isExcluded || false;
                    
                    email.isPreselectedForTasks = taskPreselectedCategories.includes(finalCategory);
                    
                    if (email.isPreselectedForTasks) {
                        preselectedStats[finalCategory] = (preselectedStats[finalCategory] || 0) + 1;
                    }
                    
                    if (!this.categorizedEmails[finalCategory]) {
                        this.categorizedEmails[finalCategory] = [];
                    }
                    
                    this.categorizedEmails[finalCategory].push(email);
                    categoryStats[finalCategory] = (categoryStats[finalCategory] || 0) + 1;

                } catch (error) {
                    console.error('[EmailScanner] ❌ Erreur catégorisation email:', error);
                    
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

            if (this.scanProgress && (i % batchSize === 0 || processed === total)) {
                const percent = Math.round((processed / total) * 100);
                this.scanProgress({
                    phase: 'categorizing',
                    message: `Catégorisation: ${processed}/${total} (${percent}%)`,
                    progress: { current: processed, total }
                });
            }

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
        
        console.log('[EmailScanner] ✅ === CATÉGORISATION TERMINÉE ===');
        console.log('[EmailScanner] 📊 Distribution:', categoryStats);
        console.log('[EmailScanner] ⭐ Total pré-sélectionnés:', preselectedCount);
        console.log('[EmailScanner] ⚠️ Erreurs:', errors);
    }

    analyzeEmail(email) {
        if (!window.categoryManager || typeof window.categoryManager.analyzeEmail !== 'function') {
            console.warn('[EmailScanner] CategoryManager non disponible pour analyse');
            return this.fallbackAnalyze(email);
        }
        
        try {
            const result = window.categoryManager.analyzeEmail(email);
            return {
                category: result.category || 'other',
                score: result.score || 0,
                confidence: result.confidence || 0,
                matchedPatterns: result.matchedPatterns || [],
                hasAbsolute: result.hasAbsolute || false,
                isSpam: result.isSpam || false,
                isCC: result.isCC || false,
                isExcluded: result.isExcluded || false
            };
        } catch (error) {
            console.error('[EmailScanner] Erreur analyse avec CategoryManager:', error);
            return this.fallbackAnalyze(email);
        }
    }

    fallbackAnalyze(email) {
        const subject = (email.subject || '').toLowerCase();
        const from = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        
        // Détection de base newsletters
        const newsletterKeywords = [
            'newsletter', 'unsubscribe', 'désabonner', 'se désinscrire',
            'promotion', 'offre', 'soldes', 'marketing'
        ];
        
        const text = `${subject} ${from} ${preview}`;
        const isNewsletter = newsletterKeywords.some(keyword => text.includes(keyword));
        
        if (isNewsletter) {
            return {
                category: 'newsletters',
                score: 80,
                confidence: 0.8,
                matchedPatterns: [{ keyword: 'newsletter_detected', type: 'fallback', score: 80 }],
                hasAbsolute: false
            };
        }
        
        // Autres détections basiques
        if (subject.includes('facture') || subject.includes('invoice') || subject.includes('commande')) {
            return { category: 'finance', score: 70, confidence: 0.7 };
        }
        
        if (subject.includes('réunion') || subject.includes('meeting')) {
            return { category: 'meetings', score: 70, confidence: 0.7 };
        }
        
        if (subject.includes('urgent') || subject.includes('action')) {
            return { category: 'tasks', score: 70, confidence: 0.7 };
        }
        
        return {
            category: 'other',
            score: 0,
            confidence: 0,
            matchedPatterns: [],
            hasAbsolute: false
        };
    }

    // ================================================
    // ANALYSE IA
    // ================================================
    async performAnalysis() {
        console.log('[EmailScanner] 🤖 Analyse IA...');
        
        const preselectedEmails = this.emails.filter(email => 
            email.isPreselectedForTasks && 
            email.categoryConfidence > 0.6 &&
            email.realEmail === true
        ).slice(0, 10);
        
        console.log(`[EmailScanner] 🎯 Analyse de ${preselectedEmails.length} emails prioritaires`);
        
        for (let i = 0; i < preselectedEmails.length; i++) {
            const email = preselectedEmails[i];
            
            try {
                const analysis = this.analyzeWithAI(email);
                email.aiAnalysis = analysis;
                email.taskSuggested = analysis?.mainTask?.title ? true : false;
                
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: `Analyse IA: ${i + 1}/${preselectedEmails.length}`,
                        progress: { current: i + 1, total: preselectedEmails.length }
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error('[EmailScanner] ❌ Erreur analyse IA email:', error);
                email.aiAnalysisError = error.message;
            }
        }
        
        const totalSuggested = this.emails.filter(e => e.taskSuggested).length;
        console.log('[EmailScanner] ✅ Analyse IA terminée -', totalSuggested, 'tâches suggérées');
    }

    analyzeWithAI(email) {
        const category = email.category;
        const senderDomain = email.senderDomain || 'unknown';
        const importance = email.importance || 'normal';
        
        const taskTemplates = {
            tasks: {
                title: `Action requise: ${email.subject?.substring(0, 40)}`,
                description: 'Tâche identifiée dans email',
                priority: importance === 'high' ? 'urgent' : 'high'
            },
            commercial: {
                title: `Suivi commercial: ${email.from?.emailAddress?.name}`,
                description: 'Opportunité commerciale à traiter',
                priority: 'medium'
            },
            meetings: {
                title: `Préparer réunion: ${email.subject?.substring(0, 30)}`,
                description: 'Préparation requise pour réunion',
                priority: 'medium'
            },
            finance: {
                title: `Traitement financier: ${email.subject?.substring(0, 30)}`,
                description: 'Document financier à traiter',
                priority: importance === 'high' ? 'urgent' : 'high'
            }
        };
        
        const template = taskTemplates[category] || {
            title: `Email de ${email.from?.emailAddress?.name || 'expéditeur inconnu'}`,
            description: 'Email nécessitant une action',
            priority: 'low'
        };
        
        return {
            summary: `Email de ${email.from?.emailAddress?.name} (${senderDomain}) concernant ${category}`,
            importance: template.priority,
            mainTask: {
                title: template.title,
                description: template.description,
                priority: template.priority,
                dueDate: null
            },
            tags: [category, 'real-email', senderDomain],
            confidence: Math.min(1, (email.categoryConfidence || 0) + 0.2)
        };
    }

    // ================================================
    // MÉTHODES D'ACCÈS
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
        const now = Date.now();
        const CACHE_DURATION = 60000;
        
        if (this._categoriesCache && 
            this._categoriesCacheTime && 
            (now - this._categoriesCacheTime) < CACHE_DURATION) {
            return [...this._categoriesCache];
        }
        
        if (window.categoryManager && typeof window.categoryManager.getTaskPreselectedCategories === 'function') {
            const managerCategories = window.categoryManager.getTaskPreselectedCategories();
            this._categoriesCache = [...managerCategories];
            this._categoriesCacheTime = now;
            
            if (JSON.stringify([...this.taskPreselectedCategories].sort()) !== 
                JSON.stringify([...managerCategories].sort())) {
                this.taskPreselectedCategories = [...managerCategories];
            }
            
            return [...managerCategories];
        }
        
        return [...this.taskPreselectedCategories];
    }

    updateTaskPreselectedCategories(categories) {
        console.log('[EmailScanner] 📋 updateTaskPreselectedCategories:', categories);
        
        const oldCategories = [...this.taskPreselectedCategories];
        this.taskPreselectedCategories = Array.isArray(categories) ? [...categories] : [];
        
        if (!this.settings) this.settings = {};
        this.settings.taskPreselectedCategories = this.taskPreselectedCategories;
        
        this.saveToLocalStorage();
        
        this._categoriesCache = null;
        this._categoriesCacheTime = 0;
        
        const hasChanged = JSON.stringify(oldCategories.sort()) !== 
                          JSON.stringify([...this.taskPreselectedCategories].sort());
        
        if (hasChanged && this.emails.length > 0) {
            console.log('[EmailScanner] 🔄 Changement détecté, re-catégorisation...');
            setTimeout(() => {
                this.recategorizeEmails();
            }, 100);
        }
        
        return this.taskPreselectedCategories;
    }

    // ================================================
    // RE-CATÉGORISATION
    // ================================================
    async recategorizeEmails() {
        if (this.emails.length === 0) {
            console.log('[EmailScanner] Aucun email à recatégoriser');
            return;
        }

        console.log('[EmailScanner] 🔄 === RE-CATÉGORISATION ===');
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        
        this.scanMetrics.startTime = Date.now();
        this.scanMetrics.categorizedCount = 0;
        this.scanMetrics.keywordMatches = {};
        this.scanMetrics.categoryDistribution = {};
        
        Object.keys(this.categorizedEmails).forEach(cat => {
            this.categorizedEmails[cat] = [];
        });

        await this.categorizeEmails();
        
        console.log('[EmailScanner] ✅ Re-catégorisation terminée');
        
        setTimeout(() => {
            this.dispatchEvent('emailsRecategorized', {
                emails: this.emails,
                breakdown: this.getDetailedResults().breakdown,
                taskPreselectedCategories: this.taskPreselectedCategories,
                preselectedCount: this.emails.filter(e => e.isPreselectedForTasks).length,
                keywordStats: this.scanMetrics.keywordMatches,
                realEmailsMode: true,
                startScanSynced: this.startScanSynced,
                simulationMode: false
            });
        }, 10);
    }

    // ================================================
    // RÉSULTATS DÉTAILLÉS
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
                realEmailsMode: true,
                startScanSynced: this.startScanSynced,
                simulationMode: false,
                hasRealEmails: true
            },
            keywordStats: this.scanMetrics.keywordMatches,
            emails: this.emails,
            settings: this.settings,
            scanMetrics: this.scanMetrics,
            realEmailsConfig: this.realEmailsConfig
        };
    }

    // ================================================
    // MÉTHODES UTILITAIRES
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
        console.log('[EmailScanner] 🔄 Réinitialisation...');
        this.emails = [];
        this.categorizedEmails = {};
        
        this.scanMetrics = {
            startTime: Date.now(),
            categorizedCount: 0,
            keywordMatches: {},
            categoryDistribution: {},
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            realEmailsOnly: true
        };
        
        Object.keys(this.defaultWebCategories).forEach(catId => {
            this.categorizedEmails[catId] = [];
        });
        
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Réinitialisation terminée');
    }

    getEmailById(emailId) {
        return this.emails.find(email => email.id === emailId);
    }

    logScanResults(results) {
        console.log('[EmailScanner] 📊 === RÉSULTATS FINAUX ===');
        console.log(`[EmailScanner] Total emails: ${results.total}`);
        console.log(`[EmailScanner] Catégorisés: ${results.categorized} (${Math.round((results.categorized / results.total) * 100)}%)`);
        console.log(`[EmailScanner] ⭐ PRÉ-SÉLECTIONNÉS: ${results.stats.preselectedForTasks}`);
        console.log(`[EmailScanner] Suggestions de tâches: ${results.stats.taskSuggestions}`);
        console.log(`[EmailScanner] Confiance moyenne: ${results.stats.averageConfidence}`);
        console.log(`[EmailScanner] Durée: ${results.stats.scanDuration}s`);
        console.log(`[EmailScanner] 📋 Catégories pré-sélectionnées: ${results.taskPreselectedCategories.join(', ')}`);
        console.log(`[EmailScanner] 🔄 StartScan synchronisé: ${this.startScanSynced}`);
        
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
    // EXPORT
    // ================================================
    exportResults(format = 'json') {
        console.log('[EmailScanner] 📤 Export résultats en', format);
        
        if (this.emails.length === 0) {
            this.showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        try {
            let content, filename, mimeType;

            if (format === 'json') {
                content = this.exportToJSON();
                filename = `email_scan_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json;charset=utf-8;';
            } else {
                content = this.exportToCSV();
                filename = `email_scan_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv;charset=utf-8;';
            }

            this.downloadFile(content, filename, mimeType);
            this.showToast(`${this.emails.length} emails exportés`, 'success');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur export:', error);
            this.showToast('Erreur lors de l\'export', 'error');
        }
    }

    exportToJSON() {
        const data = {
            scanDate: new Date().toISOString(),
            totalEmails: this.emails.length,
            realEmailsCount: this.emails.filter(e => e.realEmail === true).length,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: this.getDetailedResults().stats,
            settings: this.settings,
            realEmailsConfig: this.realEmailsConfig,
            realEmailsMode: true,
            startScanSynced: this.startScanSynced,
            simulationMode: false,
            categories: {},
            emails: []
        };

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
            realEmail: email.realEmail,
            webSimulated: email.webSimulated || false
        }));

        return JSON.stringify(data, null, 2);
    }

    exportToCSV() {
        const rows = [
            ['Date', 'De', 'Email', 'Sujet', 'Catégorie', 'Confiance', 'Pré-sélectionné', 'Tâche Suggérée', 'Email Réel']
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
                email.taskSuggested ? 'Oui' : 'Non',
                email.realEmail ? 'Oui' : 'Non'
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

    showToast(message, type = 'info', duration = 3000) {
        if (window.uiManager?.showToast) {
            window.uiManager.showToast(message, type, duration);
            return;
        }
        
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
            font-family: system-ui, sans-serif;
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
    // UTILITAIRES ET DEBUG
    // ================================================
    dispatchEvent(eventName, detail) {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { 
                detail: {
                    ...detail,
                    source: 'EmailScanner',
                    timestamp: Date.now(),
                    realEmailsMode: true,
                    startScanSynced: this.startScanSynced,
                    simulationMode: false,
                    hasRealEmails: true
                }
            }));
        } catch (error) {
            console.error(`[EmailScanner] Erreur dispatch ${eventName}:`, error);
        }
    }

    getDebugInfo() {
        const preselectedCount = this.emails.filter(e => e.isPreselectedForTasks).length;
        const realEmailsCount = this.emails.filter(e => e.realEmail === true).length;
        
        return {
            version: '11.0',
            isScanning: this.isScanning,
            totalEmails: this.emails.length,
            realEmailsCount: realEmailsCount,
            realEmailsVerified: this.realEmailsVerified,
            categorizedCount: Object.values(this.categorizedEmails)
                .reduce((sum, emails) => sum + emails.length, 0),
            categories: Object.keys(this.categorizedEmails)
                .filter(cat => this.categorizedEmails[cat].length > 0),
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            preselectedEmailsCount: preselectedCount,
            avgConfidence: this.calculateAverageConfidence(),
            avgScore: this.calculateAverageScore(),
            settings: this.settings,
            hasTaskSuggestions: this.emails.filter(e => e.taskSuggested).length,
            categoryManagerAvailable: !!window.categoryManager,
            mailServiceAvailable: !!window.mailService,
            mailServiceAuthenticated: window.mailService?.isAuthenticationValid?.() || false,
            lastSettingsSync: this.lastSettingsSync,
            syncInterval: !!this.syncInterval,
            scanMetrics: this.scanMetrics,
            realEmailsConfig: this.realEmailsConfig,
            realEmailsMode: true,
            changeListener: !!this.changeListener,
            startScanSync: {
                synced: this.startScanSynced,
                lastSync: this.lastSyncTimestamp,
                available: !!window.minimalScanModule
            }
        };
    }

    // ================================================
    // NETTOYAGE
    // ================================================
    cleanup() {
        console.log('[EmailScanner] 🧹 Nettoyage...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.changeListener && typeof this.changeListener === 'function') {
            this.changeListener();
            this.changeListener = null;
        }
        
        this.emails = [];
        this.categorizedEmails = {};
        this.taskPreselectedCategories = [];
        this.scanProgress = null;
        this.scanMetrics = { 
            startTime: null, 
            categorizedCount: 0, 
            keywordMatches: {}, 
            categoryDistribution: {},
            taskPreselectedCategories: [],
            realEmailsOnly: true
        };
        
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Nettoyage terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        console.log('[EmailScanner] Instance détruite');
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================
if (window.emailScanner) {
    console.log('[EmailScanner] 🔄 Nettoyage ancienne instance...');
    window.emailScanner.destroy?.();
}

console.log('[EmailScanner] 🚀 Création instance v11.0...');
window.emailScanner = new EmailScanner();

// Fonctions de test globales
window.testEmailScanner = function() {
    console.group('🧪 TEST EmailScanner v11.0');
    
    const testEmails = [
        {
            id: 'test-1',
            subject: "Newsletter Trainline - Se désabonner ici",
            from: { emailAddress: { address: "newsletter@trainline.com", name: "Trainline" } },
            bodyPreview: "Dès 19€ en 2de classe - Se désabonner",
            receivedDateTime: new Date().toISOString(),
            realEmail: true,
            webSimulated: false
        },
        {
            id: 'test-2',
            subject: "Action requise: Validation projet",
            from: { emailAddress: { address: "manager@company.com", name: "Manager" } },
            bodyPreview: "Veuillez valider le projet",
            receivedDateTime: new Date().toISOString(),
            realEmail: true,
            webSimulated: false
        }
    ];
    
    testEmails.forEach(email => {
        const analysis = window.emailScanner.analyzeEmail(email);
        console.log('Email:', email.subject);
        console.log('Analyse:', analysis);
    });
    
    console.log('Debug Info:', window.emailScanner.getDebugInfo());
    console.log('Catégories pré-sélectionnées:', window.emailScanner.getTaskPreselectedCategories());
    
    console.groupEnd();
    return { 
        success: true, 
        testsRun: testEmails.length, 
        realEmailsMode: true 
    };
};

window.simulateEmailScan = async function() {
    console.log('🚀 Simulation scan emails...');
    
    try {
        const authValid = window.emailScanner.verifyAuthentication();
        if (!authValid) {
            throw new Error('Authentification requise');
        }
        
        const results = await window.emailScanner.scan({
            days: 7,
            simulationMode: false,
            realEmailsOnly: true,
            onProgress: (progress) => {
                console.log(`Progression: ${progress.phase} - ${progress.message}`);
            }
        });
        
        console.log('✅ Scan terminé:', results);
        return results;
    } catch (error) {
        console.error('❌ Erreur scan:', error);
        return { error: error.message };
    }
};

console.log('✅ EmailScanner v11.0 loaded - Scan et catégorisation optimisés');
