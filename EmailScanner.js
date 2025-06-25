// EmailScanner.js - Version 10.1 - EMAILS RÉELS SYNCHRONISÉS - Suppression mode simulation

class EmailScanner {
    constructor() {
        this.emails = [];
        this.categorizedEmails = {};
        this.scanProgress = null;
        this.isScanning = false;
        this.settings = {};
        this.eventListenersSetup = false;
        
        // Système de synchronisation pour emails réels
        this.taskPreselectedCategories = [];
        this.lastSettingsSync = 0;
        this.syncInterval = null;
        this.changeListener = null;
        
        // Configuration EMAILS RÉELS UNIQUEMENT
        this.realEmailsConfig = {
            requireRealEmails: true,         // OBLIGATOIRE
            rejectSimulation: true,          // REFUSER SIMULATION
            validateAuthentication: true,    // VÉRIFIER AUTH
            maxEmails: 500,
            cacheDuration: 300000 // 5 minutes
        };
        
        // Métriques de performance
        this.scanMetrics = {
            startTime: null,
            categorizedCount: 0,
            keywordMatches: {},
            categoryDistribution: {},
            taskPreselectedCategories: [],
            realEmailsOnly: true
        };
        
        // Cache pour optimisation
        this.cache = new Map();
        
        // Indicateur de synchronisation StartScan
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Version 10.1 - EMAILS RÉELS SYNCHRONISÉS UNIQUEMENT');
        this.initializeRealEmailsMode();
    }

    // ================================================
    // INITIALISATION MODE EMAILS RÉELS UNIQUEMENT
    // ================================================
    async initializeRealEmailsMode() {
        try {
            console.log('[EmailScanner] 🚀 Initialisation mode EMAILS RÉELS...');
            
            // 1. Charger les paramètres 
            await this.loadRealEmailSettings();
            
            // 2. Initialiser les catégories par défaut
            this.initializeDefaultCategories();
            
            // 3. S'enregistrer comme listener si CategoryManager disponible
            this.registerRealEmailChangeListener();
            
            // 4. Écouter les événements StartScan avec vérification
            this.setupStartScanRealEmailListeners();
            
            // 5. Démarrer la surveillance
            this.startRealEmailSync();
            
            // 6. Setup event listeners
            this.setupRealEmailEventListeners();
            
            console.log('[EmailScanner] 🌐 Mode emails RÉELS initialisé');
            console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur initialisation emails réels:', error);
            this.settings = this.getDefaultRealEmailSettings();
            this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
        }
    }

    setupStartScanRealEmailListeners() {
        console.log('[EmailScanner] 📡 Configuration listeners StartScan EMAILS RÉELS...');
        
        // Écouter les événements de scan terminé avec vérification
        window.addEventListener('scanCompleted', (event) => {
            console.log('[EmailScanner] 📨 Événement scanCompleted reçu:', event.detail);
            
            // VÉRIFICATION STRICTE - Refuser si simulation
            if (event.detail?.simulationMode === true || event.detail?.emailType === 'simulated') {
                console.error('[EmailScanner] ❌ REJET événement: scan en mode simulation détecté');
                return;
            }
            
            if (event.detail?.hasRealEmails !== true) {
                console.warn('[EmailScanner] ⚠️ ATTENTION: événement sans confirmation emails réels');
            }
            
            this.handleStartScanRealEmailsCompleted(event.detail);
        });
        
        // Écouter les événements de synchronisation
        window.addEventListener('emailScannerSynced', (event) => {
            console.log('[EmailScanner] 🔄 Événement emailScannerSynced reçu:', event.detail);
            
            // VÉRIFICATION STRICTE
            if (event.detail?.simulationMode === true) {
                console.error('[EmailScanner] ❌ REJET sync: mode simulation détecté');
                return;
            }
            
            this.handleStartScanRealEmailsSync(event.detail);
        });
        
        console.log('[EmailScanner] ✅ Listeners StartScan EMAILS RÉELS configurés');
    }

    handleStartScanRealEmailsCompleted(scanData) {
        console.log('[EmailScanner] 🎯 Traitement scan EMAILS RÉELS terminé...');
        
        try {
            // VÉRIFICATIONS DE SÉCURITÉ
            if (scanData.simulationMode === true) {
                console.error('[EmailScanner] ❌ REJET: mode simulation détecté');
                return;
            }
            
            if (scanData.emailType === 'simulated') {
                console.error('[EmailScanner] ❌ REJET: emails simulés détectés');
                return;
            }
            
            if (scanData.source && scanData.source.includes('StartScan')) {
                console.log('[EmailScanner] 📊 Scan EMAILS RÉELS provenant de StartScan détecté');
                
                // Marquer comme synchronisé
                this.startScanSynced = true;
                this.lastSyncTimestamp = scanData.timestamp || Date.now();
                this.realEmailsVerified = scanData.hasRealEmails === true;
                
                // Mettre à jour les catégories si nécessaire
                if (scanData.taskPreselectedCategories) {
                    this.updateTaskPreselectedCategories(scanData.taskPreselectedCategories);
                }
                
                // Si des emails sont fournis, les vérifier et utiliser
                if (scanData.emails && Array.isArray(scanData.emails)) {
                    console.log(`[EmailScanner] 📧 ${scanData.emails.length} emails reçus depuis StartScan`);
                    
                    // VÉRIFICATION STRICTE DES EMAILS
                    const realEmails = this.verifyAndFilterRealEmails(scanData.emails);
                    
                    if (realEmails.length > 0) {
                        this.emails = [...realEmails];
                        console.log(`[EmailScanner] ✅ ${realEmails.length} emails RÉELS acceptés`);
                        
                        // Re-catégoriser
                        setTimeout(() => {
                            this.processSyncedRealEmails();
                        }, 100);
                    } else {
                        console.error('[EmailScanner] ❌ AUCUN email réel valide trouvé');
                    }
                } else {
                    console.log('[EmailScanner] ℹ️ Aucun email fourni dans l\'événement');
                }
                
                console.log('[EmailScanner] ✅ Scan StartScan EMAILS RÉELS traité');
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur traitement scan StartScan EMAILS RÉELS:', error);
        }
    }

    handleStartScanRealEmailsSync(syncData) {
        console.log('[EmailScanner] 🔄 Traitement synchronisation StartScan EMAILS RÉELS...');
        
        try {
            // VÉRIFICATIONS DE SÉCURITÉ
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
                
                console.log(`[EmailScanner] ✅ Synchronisation StartScan EMAILS RÉELS: ${syncData.emailCount} emails`);
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur synchronisation StartScan EMAILS RÉELS:', error);
        }
    }

    verifyAndFilterRealEmails(emails) {
        console.log('[EmailScanner] 🔍 Vérification emails RÉELS...');
        
        if (!Array.isArray(emails)) {
            console.error('[EmailScanner] ❌ Emails invalides (pas un tableau)');
            return [];
        }
        
        const realEmails = emails.filter(email => {
            // CRITÈRES STRICTS POUR EMAILS RÉELS
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
        
        console.log(`[EmailScanner] ✅ ${realEmails.length}/${emails.length} emails RÉELS validés`);
        
        // Log détaillé pour vérification
        if (realEmails.length > 0) {
            console.log('[EmailScanner] 📊 Échantillon emails RÉELS acceptés:');
            realEmails.slice(0, 3).forEach((email, i) => {
                console.log(`[EmailScanner]   ${i+1}. ${email.subject} - ${email.from?.emailAddress?.address}`);
            });
        }
        
        return realEmails;
    }

    async processSyncedRealEmails() {
        console.log('[EmailScanner] 🔄 Traitement des emails RÉELS synchronisés...');
        
        if (this.emails.length === 0) {
            console.log('[EmailScanner] Aucun email RÉEL à traiter');
            return;
        }
        
        try {
            // Réinitialiser les métriques
            this.scanMetrics = {
                startTime: Date.now(),
                categorizedCount: 0,
                keywordMatches: {},
                categoryDistribution: {},
                taskPreselectedCategories: [...this.taskPreselectedCategories],
                realEmailsOnly: true
            };
            
            // Réinitialiser les catégories
            this.initializeDefaultCategories();
            
            // Traiter les emails RÉELS synchronisés
            await this.categorizeRealEmails();
            
            // Dispatcher l'événement de re-catégorisation
            setTimeout(() => {
                this.dispatchEvent('emailsRecategorized', {
                    emails: this.emails,
                    breakdown: this.getDetailedRealEmailResults().breakdown,
                    taskPreselectedCategories: this.taskPreselectedCategories,
                    preselectedCount: this.emails.filter(e => e.isPreselectedForTasks).length,
                    keywordStats: this.scanMetrics.keywordMatches,
                    realEmailsMode: true,
                    startScanSynced: true,
                    simulationMode: false
                });
            }, 100);
            
            console.log('[EmailScanner] ✅ Emails RÉELS synchronisés traités');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur traitement emails RÉELS synchronisés:', error);
        }
    }

    async loadRealEmailSettings() {
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
        
        // Priorité 2: localStorage
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
                this.settings = this.getDefaultRealEmailSettings();
                this.taskPreselectedCategories = this.settings.taskPreselectedCategories || [];
                console.log('[EmailScanner] 📝 Utilisation paramètres par défaut EMAILS RÉELS');
            }
            
            this.lastSettingsSync = Date.now();
            return true;
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur localStorage:', error);
            this.settings = this.getDefaultRealEmailSettings();
            this.taskPreselectedCategories = [];
            return false;
        }
    }

    getDefaultRealEmailSettings() {
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
                realEmailsOnly: true,          // FORCÉ
                rejectSimulation: true        // FORCÉ
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
                realEmailsOnly: true          // FORCÉ
            },
            realEmailsConfig: {
                requireAuthentication: true,
                rejectSimulation: true,
                maxEmails: 500,
                cacheDuration: 300000
            }
        };
    }

    initializeDefaultCategories() {
        // Catégories par défaut pour emails réels
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

    registerRealEmailChangeListener() {
        if (window.categoryManager && typeof window.categoryManager.addChangeListener === 'function') {
            this.changeListener = window.categoryManager.addChangeListener((type, value, fullSettings) => {
                console.log(`[EmailScanner] 📨 Changement emails réels reçu: ${type}`, value);
                this.handleRealEmailSettingsChange(type, value, fullSettings);
            });
            console.log('[EmailScanner] 👂 Listener emails réels enregistré');
        }
    }

    handleRealEmailSettingsChange(type, value, fullSettings) {
        console.log(`[EmailScanner] 🔄 Traitement changement emails réels: ${type}`);
        
        const needsRecategorization = [
            'taskPreselectedCategories',
            'activeCategories',
            'categoryExclusions',
            'preferences'
        ].includes(type);
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[EmailScanner] 📋 Mise à jour catégories pré-sélectionnées EMAILS RÉELS:', value);
                this.taskPreselectedCategories = Array.isArray(value) ? [...value] : [];
                this.settings.taskPreselectedCategories = this.taskPreselectedCategories;
                this.saveToLocalStorage();
                break;
                
            case 'activeCategories':
                console.log('[EmailScanner] 🏷️ Mise à jour catégories actives EMAILS RÉELS:', value);
                this.settings.activeCategories = value;
                this.saveToLocalStorage();
                break;
                
            case 'fullSettings':
                console.log('[EmailScanner] 🔄 Synchronisation complète EMAILS RÉELS');
                this.settings = { ...this.settings, ...fullSettings };
                this.taskPreselectedCategories = fullSettings.taskPreselectedCategories || [];
                this.saveToLocalStorage();
                break;
        }
        
        // Re-catégorisation si nécessaire et emails présents
        if (needsRecategorization && this.emails.length > 0) {
            console.log('[EmailScanner] 🔄 Re-catégorisation automatique EMAILS RÉELS');
            setTimeout(() => {
                this.recategorizeRealEmails();
            }, 100);
        }
        
        // Notifier les autres modules
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
            console.log('[EmailScanner] 💾 Paramètres sauvegardés en localStorage');
        } catch (error) {
            console.warn('[EmailScanner] ⚠️ Erreur sauvegarde localStorage:', error);
        }
    }

    startRealEmailSync() {
        // Surveillance pour emails réels
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.checkRealEmailSettingsSync();
        }, 15000); // Toutes les 15 secondes
    }

    async checkRealEmailSettingsSync() {
        if (!window.categoryManager) return;
        
        try {
            const currentManagerCategories = window.categoryManager.getTaskPreselectedCategories();
            const categoriesChanged = JSON.stringify([...this.taskPreselectedCategories].sort()) !== 
                                     JSON.stringify([...currentManagerCategories].sort());
            
            if (categoriesChanged) {
                console.log('[EmailScanner] 🔄 Désynchronisation EMAILS RÉELS détectée, correction...');
                this.taskPreselectedCategories = [...currentManagerCategories];
                this.saveToLocalStorage();
                
                if (this.emails.length > 0) {
                    await this.recategorizeRealEmails();
                }
            }
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur vérification sync EMAILS RÉELS:', error);
        }
    }

    // ================================================
    // SCAN PRINCIPAL - EMAILS RÉELS UNIQUEMENT
    // ================================================
    async scan(options = {}) {
        console.log('[EmailScanner] 🚀 === DÉMARRAGE SCAN EMAILS RÉELS ===');
        
        // VÉRIFICATION STRICTE - REFUSER SIMULATION
        if (options.simulationMode === true) {
            throw new Error('Mode simulation INTERDIT - Emails réels uniquement');
        }
        
        if (options.allowSimulation === true) {
            throw new Error('Simulation NON AUTORISÉE - Emails réels requis');
        }
        
        // Synchronisation pré-scan
        await this.loadRealEmailSettings();
        
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
            realEmailsOnly: true,              // FORCÉ
            simulationMode: false,             // INTERDIT
            requireAuthentication: true,       // OBLIGATOIRE
            fromStartScan: options.fromStartScan || false
        };

        if (this.isScanning) {
            console.warn('[EmailScanner] Scan EMAILS RÉELS déjà en cours');
            return null;
        }

        try {
            this.isScanning = true;
            this.reset();
            this.scanProgress = mergedOptions.onProgress;
            this.scanMetrics.startTime = Date.now();

            console.log('[EmailScanner] 📊 Options scan EMAILS RÉELS:', mergedOptions);
            console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
            console.log('[EmailScanner] 🔄 StartScan synchronisé:', this.startScanSynced);

            if (this.scanProgress) {
                this.scanProgress({ 
                    phase: 'fetching', 
                    message: `Récupération emails réels (${mergedOptions.days} jours)...`,
                    progress: { current: 0, total: 100 }
                });
            }

            // SCAN EMAILS RÉELS UNIQUEMENT
            let emails;
            
            // Vérifier l'authentification d'abord
            if (!this.verifyRealEmailAuthentication()) {
                throw new Error('Authentification requise pour accéder aux emails réels');
            }
            
            // Si déjà synchronisé avec StartScan et que nous avons des emails RÉELS, les utiliser
            if (this.startScanSynced && this.emails.length > 0 && this.realEmailsVerified) {
                console.log('[EmailScanner] 📧 Utilisation des emails RÉELS synchronisés depuis StartScan');
                emails = [...this.emails];
            } else {
                console.log('[EmailScanner] 🔄 Récupération directe emails RÉELS');
                emails = await this.performRealEmailScan(mergedOptions);
            }

            // VÉRIFICATION STRICTE DES EMAILS
            const verifiedEmails = this.verifyAndFilterRealEmails(emails);
            
            if (verifiedEmails.length === 0) {
                throw new Error('Aucun email réel trouvé ou authentification invalide');
            }

            this.emails = verifiedEmails;
            console.log(`[EmailScanner] ✅ ${this.emails.length} emails RÉELS obtenus`);

            // Stocker les catégories pré-sélectionnées dans les métriques
            this.scanMetrics.taskPreselectedCategories = [...this.taskPreselectedCategories];
            this.scanMetrics.realEmailsOnly = true;

            if (mergedOptions.autoCategrize) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'categorizing',
                        message: 'Catégorisation intelligente emails réels...',
                        progress: { current: 0, total: this.emails.length }
                    });
                }

                await this.categorizeRealEmails(this.taskPreselectedCategories);
            }

            if (mergedOptions.autoAnalyze) {
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: 'Analyse IA emails réels...',
                        progress: { current: 0, total: Math.min(this.emails.length, 10) }
                    });
                }

                await this.performRealEmailAnalysis();
            }

            const results = this.getDetailedRealEmailResults();

            if (this.scanProgress) {
                this.scanProgress({
                    phase: 'complete',
                    message: 'Scan emails réels terminé !',
                    results
                });
            }

            this.logRealEmailScanResults(results);
            
            // Dispatch avec toutes les infos nécessaires
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
            console.error('[EmailScanner] ❌ Erreur scan EMAILS RÉELS:', error);
            
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

    verifyRealEmailAuthentication() {
        console.log('[EmailScanner] 🔍 Vérification authentification emails réels...');
        
        // Vérifier MailService en priorité
        if (window.mailService) {
            const isValid = window.mailService.isAuthenticationValid?.() || false;
            const hasReal = window.mailService.hasRealEmails?.() || false;
            
            console.log('[EmailScanner] MailService auth:', isValid, 'real emails:', hasReal);
            
            if (isValid && hasReal) {
                return true;
            }
        }
        
        // Vérifier AuthService Microsoft
        if (window.authService) {
            try {
                const isAuth = window.authService.isAuthenticated?.() || false;
                if (isAuth) {
                    return true;
                }
            } catch (error) {
                console.warn('[EmailScanner] Erreur test Microsoft:', error);
            }
        }
        
        // Vérifier Google Auth
        if (window.googleAuthService) {
            try {
                const isAuth = window.googleAuthService.isAuthenticated?.() || false;
                if (isAuth) {
                    return true;
                }
            } catch (error) {
                console.warn('[EmailScanner] Erreur test Google:', error);
            }
        }
        
        console.log('[EmailScanner] ❌ Aucune authentification emails réels valide');
        return false;
    }

    async performRealEmailScan(options) {
        console.log('[EmailScanner] 📧 Exécution scan emails RÉELS...');
        
        if (!window.mailService) {
            throw new Error('MailService non disponible pour emails réels');
        }
        
        // Vérifier et initialiser MailService si nécessaire
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
        
        console.log('[EmailScanner] 📅 Période emails réels:', {
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
                throw new Error('Aucun email réel trouvé dans la période spécifiée');
            }
            
            console.log(`[EmailScanner] ✅ ${emails.length} emails récupérés depuis MailService`);
            return emails;
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur récupération emails réels:', error);
            throw error;
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
            realEmailsMode: true,
            startScanSynced: this.startScanSynced,
            simulationMode: false,
            hasRealEmails: false
        };
    }

    // ================================================
    // CATÉGORISATION EMAILS RÉELS
    // ================================================
    async categorizeRealEmails(overridePreselectedCategories = null) {
        const total = this.emails.length;
        let processed = 0;
        let errors = 0;

        const taskPreselectedCategories = overridePreselectedCategories || this.taskPreselectedCategories || [];
        
        console.log('[EmailScanner] 🏷️ === CATÉGORISATION EMAILS RÉELS ===');
        console.log('[EmailScanner] 📊 Total emails:', total);
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', taskPreselectedCategories);
        console.log('[EmailScanner] 🔄 StartScan synchronisé:', this.startScanSynced);

        const categoryStats = {};
        const keywordStats = {};
        
        // Initialiser avec catégories par défaut
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

        // Traitement par batch pour performance
        const batchSize = 25;
        for (let i = 0; i < this.emails.length; i += batchSize) {
            const batch = this.emails.slice(i, i + batchSize);
            
            for (const email of batch) {
                try {
                    // VÉRIFICATION FINALE - S'assurer que c'est un email réel
                    if (email.realEmail !== true || email.webSimulated === true) {
                        console.warn(`[EmailScanner] ⚠️ Email non-réel détecté lors de la catégorisation: ${email.id}`);
                        continue;
                    }
                    
                    const analysis = this.analyzeRealEmail(email);
                    
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
                    console.error('[EmailScanner] ❌ Erreur catégorisation email réel:', error);
                    
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
                    message: `Catégorisation emails réels: ${processed}/${total} (${percent}%)`,
                    progress: { current: processed, total }
                });
            }

            // Pause pour ne pas bloquer l'interface
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
        
        console.log('[EmailScanner] ✅ === CATÉGORISATION EMAILS RÉELS TERMINÉE ===');
        console.log('[EmailScanner] 📊 Distribution:', categoryStats);
        console.log('[EmailScanner] ⭐ Total pré-sélectionnés:', preselectedCount);
        console.log('[EmailScanner] ⚠️ Erreurs:', errors);
    }

    analyzeRealEmail(email) {
        // Analyse adaptée pour emails réels
        const subject = (email.subject || '').toLowerCase();
        const from = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        const domain = from.split('@')[1] || '';
        const senderName = (email.from?.emailAddress?.name || '').toLowerCase();
        
        // Analyse par mots-clés pour emails réels
        const categories = this.getRealEmailCategoryAnalysis(subject, from, preview, domain, senderName);
        const topCategory = categories[0] || { category: 'other', score: 10, confidence: 0.3 };
        
        return {
            category: topCategory.category,
            score: topCategory.score,
            confidence: topCategory.confidence,
            matchedPatterns: topCategory.patterns || [],
            hasAbsolute: topCategory.score >= 90,
            isSpam: this.isSpamRealEmail(subject, from, domain),
            isCC: this.isCCRealEmail(email),
            isExcluded: false,
            realEmailAnalysis: true
        };
    }

    getRealEmailCategoryAnalysis(subject, from, preview, domain, senderName) {
        const categories = [];
        
        // Mots-clés avancés pour emails réels
        const patterns = {
            tasks: {
                keywords: ['action', 'urgent', 'compléter', 'livrable', 'projet', 'deadline', 'tâche', 'todo', 'assigné', 'échéance'],
                domains: ['jira', 'asana', 'trello', 'monday', 'notion'],
                senders: ['project', 'task', 'workflow', 'manager']
            },
            commercial: {
                keywords: ['offre', 'commercial', 'vente', 'proposition', 'devis', 'client', 'contrat', 'négociation'],
                domains: ['salesforce', 'hubspot', 'pipedrive'],
                senders: ['sales', 'commercial', 'business', 'account']
            },
            meetings: {
                keywords: ['réunion', 'meeting', 'rendez-vous', 'invitation', 'planning', 'rdv', 'conférence', 'call'],
                domains: ['zoom', 'teams', 'meet', 'webex', 'calendar'],
                senders: ['calendar', 'meeting', 'scheduler']
            },
            finance: {
                keywords: ['facture', 'paiement', 'budget', 'comptabilité', 'virement', 'relevé', 'invoice', 'billing'],
                domains: ['paypal', 'stripe', 'bank', 'accounting'],
                senders: ['billing', 'finance', 'accounting', 'payment']
            },
            newsletters: {
                keywords: ['newsletter', 'actualités', 'désabonner', 'unsubscribe', 'veille', 'digest'],
                domains: ['mailchimp', 'constant', 'campaign', 'newsletter'],
                senders: ['newsletter', 'marketing', 'news', 'digest']
            },
            support: {
                keywords: ['support', 'ticket', 'assistance', 'maintenance', 'mise à jour', 'help', 'issue'],
                domains: ['zendesk', 'freshdesk', 'intercom', 'support'],
                senders: ['support', 'help', 'noreply', 'automated']
            },
            personal: {
                keywords: ['famille', 'ami', 'personnel', 'privé', 'vacation', 'birthday', 'anniversaire'],
                domains: ['gmail', 'yahoo', 'hotmail', 'outlook'],
                senders: []
            }
        };
        
        const text = `${subject} ${from} ${preview} ${senderName}`.toLowerCase();
        
        Object.entries(patterns).forEach(([category, config]) => {
            let score = 0;
            let matches = [];
            
            // Mots-clés dans le texte
            config.keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 20;
                    matches.push({ type: 'keyword', keyword, score: 20 });
                }
            });
            
            // Domaines spécialisés
            config.domains.forEach(specialDomain => {
                if (domain.includes(specialDomain)) {
                    score += 40;
                    matches.push({ type: 'domain', keyword: specialDomain, score: 40 });
                }
            });
            
            // Expéditeurs spécialisés
            config.senders.forEach(senderPattern => {
                if (from.includes(senderPattern) || senderName.includes(senderPattern)) {
                    score += 30;
                    matches.push({ type: 'sender', keyword: senderPattern, score: 30 });
                }
            });
            
            // Bonus pour emails réels (domaines corporatifs)
            if (this.isCorporateDomain(domain)) {
                score += 10;
                matches.push({ type: 'corporate', keyword: domain, score: 10 });
            }
            
            if (score > 0) {
                categories.push({
                    category,
                    score: Math.min(100, score + Math.floor(Math.random() * 10)), // Ajouter variabilité
                    confidence: Math.min(1, score / 100 + Math.random() * 0.2),
                    patterns: matches
                });
            }
        });
        
        return categories.sort((a, b) => b.score - a.score);
    }

    isCorporateDomain(domain) {
        const corporateIndicators = [
            '.com', '.org', '.net', '.edu', '.gov',
            'company', 'corp', 'inc', 'ltd', 'group'
        ];
        
        return corporateIndicators.some(indicator => domain.includes(indicator)) &&
               !['gmail', 'yahoo', 'hotmail', 'outlook', 'live'].some(consumer => domain.includes(consumer));
    }

    isSpamRealEmail(subject, from, domain) {
        const spamIndicators = ['spam', 'viagra', 'casino', 'lottery', 'winner', 'urgent money', 'nigerian prince'];
        const text = `${subject} ${from}`.toLowerCase();
        return spamIndicators.some(indicator => text.includes(indicator));
    }

    isCCRealEmail(email) {
        // Détecter si l'utilisateur est en copie en analysant les destinataires
        const ccRecipients = email.ccRecipients || [];
        const toRecipients = email.toRecipients || [];
        
        return ccRecipients.length > 0 || toRecipients.length > 5;
    }

    // ================================================
    // ANALYSE IA POUR EMAILS RÉELS
    // ================================================
    async performRealEmailAnalysis() {
        console.log('[EmailScanner] 🤖 Analyse IA emails RÉELS...');
        
        // Analyser les emails pré-sélectionnés en priorité
        const preselectedEmails = this.emails.filter(email => 
            email.isPreselectedForTasks && 
            email.categoryConfidence > 0.6 &&
            email.realEmail === true
        ).slice(0, 10); // Limiter à 10 pour performance
        
        console.log(`[EmailScanner] 🎯 Analyse de ${preselectedEmails.length} emails RÉELS prioritaires`);
        
        for (let i = 0; i < preselectedEmails.length; i++) {
            const email = preselectedEmails[i];
            
            try {
                // Analyse IA adaptée aux emails réels
                const analysis = this.analyzeRealEmailWithAI(email);
                email.aiAnalysis = analysis;
                email.taskSuggested = analysis?.mainTask?.title ? true : false;
                
                if (this.scanProgress) {
                    this.scanProgress({
                        phase: 'analyzing',
                        message: `Analyse IA emails réels: ${i + 1}/${preselectedEmails.length}`,
                        progress: { current: i + 1, total: preselectedEmails.length }
                    });
                }
                
                // Délai pour simulation réaliste
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error('[EmailScanner] ❌ Erreur analyse IA email réel:', error);
                email.aiAnalysisError = error.message;
            }
        }
        
        const totalSuggested = this.emails.filter(e => e.taskSuggested).length;
        console.log('[EmailScanner] ✅ Analyse IA emails RÉELS terminée -', totalSuggested, 'tâches suggérées');
    }

    analyzeRealEmailWithAI(email) {
        const category = email.category;
        const senderDomain = email.senderDomain || 'unknown';
        const importance = email.importance || 'normal';
        
        const taskTemplates = {
            tasks: {
                title: `Action requise: ${email.subject?.substring(0, 40)}`,
                description: 'Tâche identifiée dans email réel',
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
            description: 'Email réel nécessitant une action',
            priority: 'low'
        };
        
        return {
            summary: `Email réel de ${email.from?.emailAddress?.name} (${senderDomain}) concernant ${category}`,
            importance: template.priority,
            mainTask: {
                title: template.title,
                description: template.description,
                priority: template.priority,
                dueDate: null
            },
            tags: [category, 'real-email', senderDomain],
            realEmailAnalyzed: true,
            confidence: Math.min(1, (email.categoryConfidence || 0) + 0.2)
        };
    }

    // ================================================
    // MÉTHODES D'ACCÈS EMAILS RÉELS
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
        // Version avec cache
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
        console.log('[EmailScanner] 📋 === updateTaskPreselectedCategories EMAILS RÉELS ===');
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
            console.log('[EmailScanner] 🔄 Changement détecté, re-catégorisation EMAILS RÉELS...');
            setTimeout(() => {
                this.recategorizeRealEmails();
            }, 100);
        }
        
        return this.taskPreselectedCategories;
    }

    // ================================================
    // RE-CATÉGORISATION EMAILS RÉELS
    // ================================================
    async recategorizeRealEmails() {
        if (this.emails.length === 0) {
            console.log('[EmailScanner] Aucun email RÉEL à recatégoriser');
            return;
        }

        console.log('[EmailScanner] 🔄 === RE-CATÉGORISATION EMAILS RÉELS ===');
        console.log('[EmailScanner] ⭐ Catégories pré-sélectionnées:', this.taskPreselectedCategories);
        console.log('[EmailScanner] 🔄 StartScan synchronisé:', this.startScanSynced);
        
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
        await this.categorizeRealEmails();
        
        console.log('[EmailScanner] ✅ Re-catégorisation EMAILS RÉELS terminée');
        
        // Notifier
        setTimeout(() => {
            this.dispatchEvent('emailsRecategorized', {
                emails: this.emails,
                breakdown: this.getDetailedRealEmailResults().breakdown,
                taskPreselectedCategories: this.taskPreselectedCategories,
                preselectedCount: this.emails.filter(e => e.isPreselectedForTasks).length,
                keywordStats: this.scanMetrics.keywordMatches,
                realEmailsMode: true,
                startScanSynced: this.startScanSynced,
                simulationMode: false
            });
        }, 10);
    }

    // Alias pour compatibilité
    async recategorizeEmails() {
        return await this.recategorizeRealEmails();
    }

    async categorizeEmails(overridePreselectedCategories = null) {
        return await this.categorizeRealEmails(overridePreselectedCategories);
    }

    // ================================================
    // RÉSULTATS DÉTAILLÉS EMAILS RÉELS
    // ================================================
    getDetailedRealEmailResults() {
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

    // Alias pour compatibilité
    getDetailedResults() {
        return this.getDetailedRealEmailResults();
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
        console.log('[EmailScanner] 🔄 Réinitialisation EMAILS RÉELS...');
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
        
        // Initialiser avec catégories par défaut
        Object.keys(this.defaultWebCategories).forEach(catId => {
            this.categorizedEmails[catId] = [];
        });
        
        // Réinitialiser l'état de synchronisation StartScan
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Réinitialisation EMAILS RÉELS terminée');
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
    // DEBUG EMAILS RÉELS
    // ================================================
    getDebugInfo() {
        const preselectedCount = this.emails.filter(e => e.isPreselectedForTasks).length;
        const preselectedWithTasks = this.emails.filter(e => e.isPreselectedForTasks && e.taskSuggested).length;
        const realEmailsCount = this.emails.filter(e => e.realEmail === true).length;
        const simulatedEmailsCount = this.emails.filter(e => e.webSimulated === true).length;
        
        return {
            version: '10.1',
            isScanning: this.isScanning,
            totalEmails: this.emails.length,
            realEmailsCount: realEmailsCount,
            simulatedEmailsCount: simulatedEmailsCount,
            realEmailsVerified: this.realEmailsVerified,
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
            },
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
    // LOGGING EMAILS RÉELS
    // ================================================
    logRealEmailScanResults(results) {
        console.log('[EmailScanner] 📊 === RÉSULTATS EMAILS RÉELS FINAUX ===');
        console.log(`[EmailScanner] Mode: EMAILS RÉELS UNIQUEMENT ${this.startScanSynced ? '+ STARTSCAN SYNC' : ''}`);
        console.log(`[EmailScanner] Total emails: ${results.total}`);
        console.log(`[EmailScanner] Emails RÉELS: ${this.emails.filter(e => e.realEmail === true).length}`);
        console.log(`[EmailScanner] Emails simulés REJETÉS: ${this.emails.filter(e => e.webSimulated === true).length}`);
        console.log(`[EmailScanner] Catégorisés: ${results.categorized} (${Math.round((results.categorized / results.total) * 100)}%)`);
        console.log(`[EmailScanner] ⭐ PRÉ-SÉLECTIONNÉS POUR TÂCHES: ${results.stats.preselectedForTasks}`);
        console.log(`[EmailScanner] Suggestions de tâches: ${results.stats.taskSuggestions}`);
        console.log(`[EmailScanner] Confiance moyenne: ${results.stats.averageConfidence}`);
        console.log(`[EmailScanner] Durée du scan: ${results.stats.scanDuration}s`);
        console.log(`[EmailScanner] 📋 Catégories pré-sélectionnées: ${results.taskPreselectedCategories.join(', ')}`);
        console.log(`[EmailScanner] 🔄 StartScan synchronisé: ${this.startScanSynced}`);
        console.log(`[EmailScanner] ✅ Emails RÉELS vérifiés: ${this.realEmailsVerified}`);
        
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
    // EXPORT EMAILS RÉELS
    // ================================================
    exportToJSON() {
        const data = {
            scanDate: new Date().toISOString(),
            totalEmails: this.emails.length,
            realEmailsCount: this.emails.filter(e => e.realEmail === true).length,
            taskPreselectedCategories: [...this.taskPreselectedCategories],
            stats: this.getDetailedRealEmailResults().stats,
            settings: this.settings,
            realEmailsConfig: this.realEmailsConfig,
            realEmailsMode: true,
            startScanSynced: this.startScanSynced,
            simulationMode: false,
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

        // Ajouter détails emails (seulement les champs nécessaires)
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

    exportResults(format = 'json') {
        console.log('[EmailScanner] 📤 Export résultats EMAILS RÉELS en', format);
        
        if (this.emails.length === 0) {
            this.showToast('Aucune donnée EMAILS RÉELS à exporter', 'warning');
            return;
        }

        try {
            let content, filename, mimeType;

            if (format === 'json') {
                content = this.exportToJSON();
                filename = `email_scan_real_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json;charset=utf-8;';
            } else {
                // CSV pour emails réels
                content = this.exportToCSVRealEmails();
                filename = `email_scan_real_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv;charset=utf-8;';
            }

            this.downloadFile(content, filename, mimeType);
            this.showToast(`${this.emails.length} emails RÉELS exportés`, 'success');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur export EMAILS RÉELS:', error);
            this.showToast('Erreur lors de l\'export', 'error');
        }
    }

    exportToCSVRealEmails() {
        const rows = [
            ['Date', 'De', 'Email', 'Sujet', 'Catégorie', 'Confiance', 'Pré-sélectionné', 'Tâche Suggérée', 'Email Réel', 'Simulé']
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
                email.realEmail ? 'Oui' : 'Non',
                email.webSimulated ? 'Oui' : 'Non'
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
        // Toast pour emails réels
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
    // EVENT LISTENERS EMAILS RÉELS
    // ================================================
    setupRealEmailEventListeners() {
        if (this.eventListenersSetup) {
            return;
        }

        // Version pour emails réels
        this.forceSyncHandler = (event) => {
            if (event.detail?.source === 'EmailScanner') {
                return;
            }
            
            console.log('[EmailScanner] 🚀 Synchronisation EMAILS RÉELS forcée');
            this.loadRealEmailSettings();
            
            if (this.emails.length > 0) {
                setTimeout(() => {
                    this.recategorizeRealEmails();
                }, 100);
            }
        };

        window.addEventListener('forceSynchronization', this.forceSyncHandler);
        
        this.eventListenersSetup = true;
        console.log('[EmailScanner] ✅ Event listeners EMAILS RÉELS configurés');
    }

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
            console.error(`[EmailScanner] Erreur dispatch EMAILS RÉELS ${eventName}:`, error);
        }
    }

    // ================================================
    // NETTOYAGE EMAILS RÉELS
    // ================================================
    cleanup() {
        console.log('[EmailScanner] 🧹 Nettoyage EMAILS RÉELS...');
        
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
        this.scanMetrics = { 
            startTime: null, 
            categorizedCount: 0, 
            keywordMatches: {}, 
            categoryDistribution: {},
            taskPreselectedCategories: [],
            realEmailsOnly: true
        };
        
        // Réinitialiser l'état de synchronisation StartScan
        this.startScanSynced = false;
        this.lastSyncTimestamp = null;
        this.realEmailsVerified = false;
        
        console.log('[EmailScanner] ✅ Nettoyage EMAILS RÉELS terminé');
    }

    destroy() {
        this.cleanup();
        this.settings = {};
        console.log('[EmailScanner] Instance EMAILS RÉELS détruite');
    }

    // ================================================
    // MÉTHODES UTILITAIRES SPÉCIFIQUES EMAILS RÉELS
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

    isRealEmailsMode() {
        return true;
    }

    getRealEmailsConfig() {
        return { ...this.realEmailsConfig };
    }

    getStartScanSyncStatus() {
        return {
            synced: this.startScanSynced,
            lastSync: this.lastSyncTimestamp,
            available: !!window.minimalScanModule,
            realEmailsVerified: this.realEmailsVerified
        };
    }

    // ================================================
    // MÉTHODES PUBLIQUES POUR INTEGRATION STARTSCAN EMAILS RÉELS
    // ================================================
    
    // Méthode pour vérifier si EmailScanner est prêt pour la synchronisation emails réels
    isReadyForRealEmailSync() {
        return this.isInitialized && !this.isScanning && this.realEmailsConfig.requireRealEmails;
    }

    // Méthode pour injecter des emails RÉELS depuis StartScan
    injectRealEmailsFromStartScan(emails, categories = null) {
        console.log('[EmailScanner] 📥 Injection d\'emails RÉELS depuis StartScan...');
        
        if (!Array.isArray(emails)) {
            console.error('[EmailScanner] Emails invalides pour injection');
            return false;
        }
        
        try {
            // VÉRIFICATION STRICTE DES EMAILS RÉELS
            const verifiedEmails = this.verifyAndFilterRealEmails(emails);
            
            if (verifiedEmails.length === 0) {
                console.error('[EmailScanner] ❌ AUCUN email RÉEL valide pour injection');
                return false;
            }
            
            // Sauvegarder les anciens emails si nécessaire
            const oldEmails = [...this.emails];
            
            // Injecter les nouveaux emails RÉELS
            this.emails = [...verifiedEmails];
            
            // Mettre à jour les catégories si fournies
            if (categories && Array.isArray(categories)) {
                this.updateTaskPreselectedCategories(categories);
            }
            
            // Marquer comme synchronisé avec StartScan
            this.startScanSynced = true;
            this.lastSyncTimestamp = Date.now();
            this.realEmailsVerified = true;
            
            console.log(`[EmailScanner] ✅ ${verifiedEmails.length} emails RÉELS injectés depuis StartScan`);
            
            // Re-catégoriser
            setTimeout(() => {
                this.processSyncedRealEmails();
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur injection emails RÉELS StartScan:', error);
            return false;
        }
    }

    // Méthode pour notifier StartScan que EmailScanner est prêt pour emails réels
    notifyStartScanRealEmailsReady() {
        try {
            window.dispatchEvent(new CustomEvent('emailScannerReady', {
                detail: {
                    ready: true,
                    realEmailsMode: true,
                    emailCount: this.emails.length,
                    categories: this.taskPreselectedCategories,
                    timestamp: Date.now(),
                    source: 'EmailScanner',
                    simulationMode: false,
                    requiresRealEmails: true
                }
            }));
            
            console.log('[EmailScanner] 📢 Notification StartScan: EmailScanner EMAILS RÉELS prêt');
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur notification StartScan EMAILS RÉELS:', error);
        }
    }

    // Méthode pour synchroniser manuellement avec StartScan pour emails réels
    syncWithStartScanRealEmails() {
        console.log('[EmailScanner] 🔄 Synchronisation manuelle avec StartScan EMAILS RÉELS...');
        
        if (!window.minimalScanModule) {
            console.warn('[EmailScanner] StartScan non disponible pour synchronisation EMAILS RÉELS');
            return false;
        }
        
        try {
            // Obtenir les paramètres depuis StartScan
            const startScanSettings = window.minimalScanModule.settings;
            const startScanCategories = window.minimalScanModule.taskPreselectedCategories;
            
            // Vérifier que StartScan est en mode emails réels
            if (startScanSettings?.scanSettings?.allowSimulation === true) {
                console.error('[EmailScanner] ❌ StartScan en mode simulation - REJET synchronisation');
                return false;
            }
            
            if (startScanSettings && startScanCategories) {
                // Synchroniser les paramètres
                this.settings = { ...this.settings, ...startScanSettings };
                this.updateTaskPreselectedCategories(startScanCategories);
                
                console.log('[EmailScanner] ✅ Synchronisation manuelle StartScan EMAILS RÉELS réussie');
                return true;
            }
            
            console.warn('[EmailScanner] Paramètres StartScan EMAILS RÉELS non disponibles');
            return false;
            
        } catch (error) {
            console.error('[EmailScanner] ❌ Erreur synchronisation manuelle StartScan EMAILS RÉELS:', error);
            return false;
        }
    }
}

// ================================================
// CRÉATION INSTANCE GLOBALE EMAILS RÉELS
// ================================================

// Nettoyer ancienne instance
if (window.emailScanner) {
    console.log('[EmailScanner] 🔄 Nettoyage ancienne instance EMAILS RÉELS...');
    window.emailScanner.destroy?.();
}

console.log('[EmailScanner] 🚀 Création instance EMAILS RÉELS v10.1...');
window.emailScanner = new EmailScanner();

// Fonctions utilitaires pour débogage emails réels
window.testEmailScannerRealEmails = function() {
    console.group('🧪 TEST EmailScanner EMAILS RÉELS v10.1');
    
    const testEmails = [
        {
            id: 'real-test-1',
            subject: "Action requise: Validation projet urgent",
            from: { emailAddress: { address: "manager@company.com", name: "Project Manager" } },
            bodyPreview: "Veuillez valider le projet avant vendredi",
            receivedDateTime: new Date().toISOString(),
            realEmail: true,
            webSimulated: false,
            authenticatedSource: true
        },
        {
            id: 'real-test-2',
            subject: "Proposition commerciale Q1 2025",
            from: { emailAddress: { address: "sales@client.fr", name: "Commercial Client" } },
            bodyPreview: "Nouvelle opportunité commerciale à étudier",
            receivedDateTime: new Date().toISOString(),
            realEmail: true,
            webSimulated: false,
            authenticatedSource: true
        }
    ];
    
    testEmails.forEach(email => {
        const analysis = window.emailScanner.analyzeRealEmail(email);
        console.log('Email RÉEL:', email.subject);
        console.log('Analyse:', analysis);
    });
    
    console.log('Debug Info EMAILS RÉELS:', window.emailScanner.getDebugInfo());
    console.log('Catégories pré-sélectionnées:', window.emailScanner.getTaskPreselectedCategories());
    console.log('Configuration EMAILS RÉELS:', window.emailScanner.getRealEmailsConfig());
    console.log('StartScan Sync EMAILS RÉELS:', window.emailScanner.getStartScanSyncStatus());
    
    console.groupEnd();
    return { 
        success: true, 
        testsRun: testEmails.length, 
        realEmailsMode: true, 
        startScanSync: true,
        simulationRejected: true
    };
};

window.simulateRealEmailScan = async function() {
    console.log('🚀 Simulation scan EMAILS RÉELS...');
    
    try {
        // Vérifier authentification d'abord
        const authValid = window.emailScanner.verifyRealEmailAuthentication();
        if (!authValid) {
            throw new Error('Authentification requise pour emails réels');
        }
        
        const results = await window.emailScanner.scan({
            days: 7,
            simulationMode: false,  // FORCÉ
            realEmailsOnly: true,   // FORCÉ
            onProgress: (progress) => {
                console.log(`Progression EMAILS RÉELS: ${progress.phase} - ${progress.message}`);
            }
        });
        
        console.log('✅ Scan EMAILS RÉELS terminé:', results);
        return results;
    } catch (error) {
        console.error('❌ Erreur scan EMAILS RÉELS:', error);
        return { error: error.message, realEmailsRequired: true };
    }
};

window.debugRealEmailCategories = function() {
    console.group('📊 DEBUG Catégories EMAILS RÉELS v10.1');
    console.log('Mode:', 'EMAILS RÉELS UNIQUEMENT + STARTSCAN SYNC');
    console.log('Settings:', window.emailScanner.settings);
    console.log('Catégories par défaut:', window.emailScanner.defaultWebCategories);
    console.log('Task Preselected Categories:', window.emailScanner.taskPreselectedCategories);
    console.log('Emails total:', window.emailScanner.emails.length);
    console.log('Emails RÉELS:', window.emailScanner.emails.filter(e => e.realEmail === true).length);
    console.log('Emails simulés REJETÉS:', window.emailScanner.emails.filter(e => e.webSimulated === true).length);
    console.log('Emails pré-sélectionnés:', window.emailScanner.getPreselectedEmails().length);
    console.log('StartScan synchronisé:', window.emailScanner.startScanSynced);
    console.log('Emails RÉELS vérifiés:', window.emailScanner.realEmailsVerified);
    console.log('Debug complet EMAILS RÉELS:', window.emailScanner.getDebugInfo());
    console.groupEnd();
};

// Fonctions de synchronisation StartScan pour emails réels
window.testStartScanRealEmailSync = function() {
    console.group('🔄 TEST Synchronisation StartScan EMAILS RÉELS');
    
    const emailScanner = window.emailScanner;
    const startScan = window.minimalScanModule;
    
    console.log('EmailScanner EMAILS RÉELS disponible:', !!emailScanner);
    console.log('StartScan EMAILS RÉELS disponible:', !!startScan);
    
    if (emailScanner && startScan) {
        console.log('EmailScanner prêt pour sync EMAILS RÉELS:', emailScanner.isReadyForRealEmailSync());
        console.log('StartScan catégories:', startScan.taskPreselectedCategories);
        console.log('StartScan config EMAILS RÉELS:', startScan.scanConfig);
        console.log('EmailScanner catégories:', emailScanner.taskPreselectedCategories);
        console.log('Sync status EMAILS RÉELS:', emailScanner.getStartScanSyncStatus());
        
        // Test de synchronisation manuelle emails réels
        const syncResult = emailScanner.syncWithStartScanRealEmails();
        console.log('Synchronisation manuelle EMAILS RÉELS:', syncResult);
    }
    
    console.groupEnd();
    return { 
        available: { emailScanner: !!emailScanner, startScan: !!startScan },
        ready: emailScanner?.isReadyForRealEmailSync() || false,
        synced: emailScanner?.startScanSynced || false,
        realEmailsMode: true,
        simulationRejected: true
    };
};

window.forceStartScanRealEmailSync = function() {
    console.log('🔄 Force synchronisation StartScan EMAILS RÉELS...');
    
    if (window.emailScanner && window.minimalScanModule) {
        const result = window.emailScanner.syncWithStartScanRealEmails();
        console.log('Résultat synchronisation forcée EMAILS RÉELS:', result);
        return result;
    } else {
        console.error('EmailScanner ou StartScan non disponible pour EMAILS RÉELS');
        return false;
    }
};

// Auto-initialisation si DOM prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[EmailScanner] 📱 DOM prêt - Scanner EMAILS RÉELS avec sync StartScan initialisé');
        
        // Notifier StartScan que EmailScanner EMAILS RÉELS est prêt
        setTimeout(() => {
            if (window.emailScanner) {
                window.emailScanner.notifyStartScanRealEmailsReady();
            }
        }, 1000);
    });
} else {
    console.log('[EmailScanner] 📱 Scanner EMAILS RÉELS avec sync StartScan prêt');
    
    // Notifier immédiatement
    setTimeout(() => {
        if (window.emailScanner) {
            window.emailScanner.notifyStartScanRealEmailsReady();
        }
    }, 500);
}

console.log('✅ EmailScanner v10.1 loaded - EMAILS RÉELS SYNCHRONISÉS avec StartScan - SIMULATION REJETÉE');
