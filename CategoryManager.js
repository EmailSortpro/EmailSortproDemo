// CategoryManager.js - Version 21.0 - Détection newsletters renforcée et synchronisation parfaite

class CategoryManager {
    constructor() {
        this.categories = {};
        this.weightedKeywords = {};
        this.customCategories = {};
        this.settings = this.loadSettings();
        this.isInitialized = false;
        this.debugMode = false;
        this.eventListenersSetup = false;
        
        // Système de synchronisation renforcé
        this.syncQueue = [];
        this.syncInProgress = false;
        this.changeListeners = new Set();
        this.lastSyncTimestamp = 0;
        
        // Cache pour optimisation
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
        
        this.initializeCategories();
        this.loadCustomCategories();
        this.initializeWeightedDetection();
        this.initializeFilters();
        this.setupEventListeners();
        this.startAutoSync();
        
        console.log('[CategoryManager] ✅ Version 21.0 - Détection newsletters renforcée');
    }

    // ================================================
    // SYSTÈME DE SYNCHRONISATION AUTOMATIQUE
    // ================================================
    startAutoSync() {
        setInterval(() => {
            this.processSettingsChanges();
        }, 2000);
        
        this.setupImmediateSync();
    }

    setupImmediateSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'categorySettings') {
                console.log('[CategoryManager] 🔄 Changement localStorage détecté');
                this.reloadSettingsFromStorage();
                this.notifyAllModules('storageChange');
            }
        });
    }

    processSettingsChanges() {
        if (this.syncInProgress || this.syncQueue.length === 0) return;
        
        this.syncInProgress = true;
        
        try {
            while (this.syncQueue.length > 0) {
                const change = this.syncQueue.shift();
                this.applySettingChange(change);
            }
            
            this.lastSyncTimestamp = Date.now();
            
        } catch (error) {
            console.error('[CategoryManager] Erreur sync queue:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    applySettingChange(change) {
        const { type, value, notifyModules } = change;
        
        console.log(`[CategoryManager] 📝 Application changement: ${type}`, value);
        
        switch (type) {
            case 'taskPreselectedCategories':
                this.settings.taskPreselectedCategories = [...value];
                break;
            case 'activeCategories':
                this.settings.activeCategories = value;
                break;
            case 'categoryExclusions':
                this.settings.categoryExclusions = { ...this.settings.categoryExclusions, ...value };
                break;
            case 'scanSettings':
                this.settings.scanSettings = { ...this.settings.scanSettings, ...value };
                break;
            case 'automationSettings':
                this.settings.automationSettings = { ...this.settings.automationSettings, ...value };
                break;
            case 'preferences':
                this.settings.preferences = { ...this.settings.preferences, ...value };
                break;
            default:
                this.settings = { ...this.settings, ...value };
        }
        
        this.saveSettingsToStorage();
        
        if (notifyModules !== false) {
            this.notifySpecificModules(type, value);
            this.notifyAllModules(type, value);
        }
    }

    // ================================================
    // NOTIFICATION DES MODULES
    // ================================================
    notifySpecificModules(type, value) {
        console.log(`[CategoryManager] 📢 Notification spécialisée: ${type}`);
        
        // EmailScanner - PRIORITÉ ABSOLUE
        if (window.emailScanner) {
            switch (type) {
                case 'taskPreselectedCategories':
                    console.log('[CategoryManager] → EmailScanner: taskPreselectedCategories');
                    if (typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
                        window.emailScanner.updateTaskPreselectedCategories(value);
                    }
                    setTimeout(() => {
                        if (window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                            console.log('[CategoryManager] → EmailScanner: Déclenchement re-catégorisation');
                            window.emailScanner.recategorizeEmails?.();
                        }
                    }, 100);
                    break;
                    
                case 'activeCategories':
                    console.log('[CategoryManager] → EmailScanner: activeCategories');
                    if (typeof window.emailScanner.updateSettings === 'function') {
                        window.emailScanner.updateSettings({ activeCategories: value });
                    }
                    setTimeout(() => {
                        if (window.emailScanner.emails && window.emailScanner.emails.length > 0) {
                            window.emailScanner.recategorizeEmails?.();
                        }
                    }, 100);
                    break;
                    
                case 'categoryExclusions':
                case 'preferences':
                    if (typeof window.emailScanner.updateSettings === 'function') {
                        window.emailScanner.updateSettings({ [type]: value });
                    }
                    break;
            }
        }
        
        // PageManager
        if (window.pageManager) {
            console.log('[CategoryManager] → PageManager:', type);
            if (typeof window.pageManager.handleCategoryManagerChange === 'function') {
                window.pageManager.handleCategoryManagerChange(type, value, this.settings);
            }
        }
        
        // AITaskAnalyzer
        if (window.aiTaskAnalyzer) {
            if (type === 'taskPreselectedCategories') {
                console.log('[CategoryManager] → AITaskAnalyzer: taskPreselectedCategories');
                if (typeof window.aiTaskAnalyzer.updatePreselectedCategories === 'function') {
                    window.aiTaskAnalyzer.updatePreselectedCategories(value);
                }
            }
        }
    }

    notifyAllModules(type, value) {
        setTimeout(() => {
            this.dispatchEvent('categorySettingsChanged', { 
                settings: this.settings,
                type,
                value,
                timestamp: Date.now()
            });
            
            this.dispatchEvent('settingsChanged', { 
                type, 
                value,
                source: 'CategoryManager',
                timestamp: Date.now()
            });
        }, 10);
        
        this.changeListeners.forEach(listener => {
            try {
                listener(type, value, this.settings);
            } catch (error) {
                console.error('[CategoryManager] Erreur listener:', error);
            }
        });
    }

    // ================================================
    // API PUBLIQUE POUR CHANGEMENTS DE PARAMÈTRES
    // ================================================
    updateTaskPreselectedCategories(categories, notifyModules = true) {
        console.log('[CategoryManager] 📋 updateTaskPreselectedCategories:', categories);
        
        const normalizedCategories = Array.isArray(categories) ? [...categories] : [];
        
        this.invalidateTaskCategoriesCache();
        
        this.syncQueue.push({
            type: 'taskPreselectedCategories',
            value: normalizedCategories,
            notifyModules,
            timestamp: Date.now()
        });
        
        if (!this.syncInProgress) {
            this.processSettingsChanges();
        }
        
        return normalizedCategories;
    }

    // ================================================
    // GESTION DES PARAMÈTRES
    // ================================================
    loadSettings() {
        try {
            const saved = localStorage.getItem('categorySettings');
            const defaultSettings = this.getDefaultSettings();
            
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                const mergedSettings = { ...defaultSettings, ...parsedSettings };
                console.log('[CategoryManager] ✅ Settings chargés depuis localStorage');
                return mergedSettings;
            } else {
                console.log('[CategoryManager] 📝 Utilisation settings par défaut');
                return defaultSettings;
            }
        } catch (error) {
            console.error('[CategoryManager] ❌ Erreur chargement paramètres:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettingsToStorage() {
        try {
            localStorage.setItem('categorySettings', JSON.stringify(this.settings));
            console.log('[CategoryManager] 💾 Settings sauvegardés');
        } catch (error) {
            console.error('[CategoryManager] ❌ Erreur sauvegarde paramètres:', error);
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
                autoCategrize: true
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
                detectCC: true
            }
        };
    }

    // ================================================
    // MÉTHODES PUBLIQUES
    // ================================================
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    getTaskPreselectedCategories() {
        const now = Date.now();
        const CACHE_DURATION = 10000;
        
        if (this._taskCategoriesCache && 
            this._taskCategoriesCacheTime && 
            (now - this._taskCategoriesCacheTime) < CACHE_DURATION) {
            return [...this._taskCategoriesCache];
        }
        
        const categories = this.settings.taskPreselectedCategories || [];
        
        this._taskCategoriesCache = [...categories];
        this._taskCategoriesCacheTime = now;
        
        return [...categories];
    }

    invalidateTaskCategoriesCache() {
        this._taskCategoriesCache = null;
        this._taskCategoriesCacheTime = 0;
    }

    getActiveCategories() {
        if (!this.settings.activeCategories) {
            return Object.keys(this.categories);
        }
        return [...this.settings.activeCategories];
    }

    getCategories() {
        return this.categories;
    }
    
    getCategory(categoryId) {
        if (categoryId === 'all') {
            return { id: 'all', name: 'Tous', icon: '📧', color: '#1e293b' };
        }
        if (categoryId === 'other') {
            return { id: 'other', name: 'Autre', icon: '❓', color: '#64748b' };
        }
        return this.categories[categoryId] || null;
    }

    // ================================================
    // SYSTÈME D'ÉCOUTE
    // ================================================
    addChangeListener(callback) {
        this.changeListeners.add(callback);
        console.log(`[CategoryManager] 👂 Listener ajouté (${this.changeListeners.size} total)`);
        
        return () => {
            this.changeListeners.delete(callback);
        };
    }

    // ================================================
    // INITIALISATION DES CATÉGORIES
    // ================================================
    initializeCategories() {
        this.categories = {
            // PRIORITÉ MAXIMALE - NEWSLETTERS/MARKETING
            newsletters: {
                name: 'Newsletters & Marketing',
                icon: '📰',
                color: '#8b5cf6',
                description: 'Newsletters, promotions et marketing',
                priority: 100,
                isCustom: false
            },
            
            // PRIORITÉ ÉLEVÉE
            security: {
                name: 'Sécurité',
                icon: '🔒',
                color: '#dc2626',
                description: 'Alertes de sécurité et authentification',
                priority: 90,
                isCustom: false
            },
            
            tasks: {
                name: 'Actions Requises',
                icon: '✅',
                color: '#ef4444',
                description: 'Tâches à faire et demandes d\'action',
                priority: 85,
                isCustom: false
            },
            
            // PRIORITÉ NORMALE
            finance: {
                name: 'Finance',
                icon: '💰',
                color: '#059669',
                description: 'Factures, commandes et paiements',
                priority: 80,
                isCustom: false
            },
            
            meetings: {
                name: 'Réunions',
                icon: '📅',
                color: '#f59e0b',
                description: 'Invitations et rendez-vous',
                priority: 75,
                isCustom: false
            },
            
            commercial: {
                name: 'Commercial',
                icon: '💼',
                color: '#3b82f6',
                description: 'Opportunités et devis',
                priority: 70,
                isCustom: false
            },
            
            support: {
                name: 'Support',
                icon: '🛠️',
                color: '#6366f1',
                description: 'Assistance et tickets',
                priority: 65,
                isCustom: false
            },
            
            project: {
                name: 'Projets',
                icon: '📊',
                color: '#10b981',
                description: 'Gestion de projet',
                priority: 60,
                isCustom: false
            },
            
            notifications: {
                name: 'Notifications',
                icon: '🔔',
                color: '#94a3b8',
                description: 'Notifications automatiques',
                priority: 40,
                isCustom: false
            },
            
            // PRIORITÉ BASSE
            cc: {
                name: 'En Copie',
                icon: '📋',
                color: '#64748b',
                description: 'Emails en copie',
                priority: 30,
                isCustom: false
            }
        };
        
        this.isInitialized = true;
    }

    // ================================================
    // MOTS-CLÉS RENFORCÉS POUR NEWSLETTERS
    // ================================================
    initializeWeightedDetection() {
        this.weightedKeywords = {
            // PRIORITÉ MAXIMALE - NEWSLETTERS/MARKETING
            newsletters: {
                absolute: [
                    // MOTS-CLÉS DE DÉSABONNEMENT - TRÈS SPÉCIFIQUES
                    'se désinscrire', 'se desinscrire', 'désinscrire', 'desinscrire',
                    'unsubscribe', 'désabonner', 'desabonner', 'désinscription',
                    'paramétrez vos choix', 'parametrez vos choix',
                    'gérer vos préférences', 'gerer vos preferences',
                    'gérer la réception', 'gerer la reception',
                    'email preferences', 'préférences email', 'preferences email',
                    'communication preferences', 'préférences de communication',
                    'vous ne souhaitez plus recevoir', 'ne souhaitez plus recevoir',
                    'ne plus recevoir de communications', 'plus recevoir de communications',
                    'arrêter les emails', 'arreter les emails', 'stop emails',
                    'disable these notifications', 'turn off notifications',
                    'manage notifications', 'notification settings',
                    'update your preferences', 'modifier vos préférences',
                    'opt out', 'opt-out', 'se retirer', 'retirer de la liste',
                    
                    // INDICATEURS NEWSLETTER DIRECTS
                    'newsletter', 'newsletter hebdomadaire', 'newsletter mensuelle',
                    'this email was sent to', 'you are receiving this',
                    'vous recevez cet email', 'cet email est envoyé',
                    'version en ligne', 'voir en ligne', 'view online',
                    'if you cannot view this email', 'si vous ne voyez pas',
                    
                    // TERMES PROMOTIONNELS FORTS
                    'offre limitée', 'offre speciale', 'limited offer', 'special offer',
                    'vente privée', 'ventes privees', 'private sale',
                    'promotion exclusive', 'promo exclusive', 'exclusive offer',
                    'jusqu\'à -', 'jusqu a -', 'up to -', 'réduction de',
                    'soldes', 'sales', 'rabais', 'remise',
                    
                    // TERMES E-COMMERCE
                    'découvrir la vente', 'decouvrir la vente', 'je découvre',
                    'shop now', 'acheter maintenant', 'commander maintenant',
                    'voir l\'offre', 'voir l offre', 'profiter de l\'offre',
                    'nouvelles marques', 'nouvelles collections', 'new arrivals',
                    
                    // FORMULES MARKETING TYPIQUES
                    'suivez-nous', 'suivez nous', 'follow us',
                    'app mobile', 'application mobile', 'télécharger l\'app',
                    'réseaux sociaux', 'social media'
                ],
                strong: [
                    'newsletter', 'mailing', 'campaign', 'marketing',
                    'promotion', 'promo', 'offer', 'deal', 'sale',
                    'boutique', 'shopping', 'store', 'vente',
                    'nouveauté', 'new', 'nouveau', 'collection',
                    'exclusive', 'special', 'limited', 'limitée',
                    'découvrir', 'discover', 'explore', 'voir',
                    'acheter', 'buy', 'shop', 'commander'
                ],
                weak: [
                    'offre', 'produit', 'service', 'brand', 'marque',
                    'update', 'news', 'info', 'information'
                ],
                exclusions: [
                    'facture', 'invoice', 'commande', 'order',
                    'livraison', 'delivery', 'expédition', 'shipping',
                    'confirmation', 'reçu', 'receipt'
                ]
            },

            security: {
                absolute: [
                    'alerte de connexion', 'nouvelle connexion',
                    'activité suspecte', 'suspicious activity',
                    'code de vérification', 'verification code',
                    'two-factor', '2fa', 'authentification',
                    'password reset', 'réinitialisation mot de passe'
                ],
                strong: [
                    'sécurité', 'security', 'vérification', 'verify',
                    'authentification', 'password', 'mot de passe'
                ],
                weak: ['compte', 'account', 'accès'],
                exclusions: ['newsletter', 'promotion', 'marketing']
            },

            tasks: {
                absolute: [
                    'action required', 'action requise',
                    'please complete', 'veuillez compléter',
                    'task assigned', 'tâche assignée',
                    'urgent', 'deadline', 'échéance'
                ],
                strong: [
                    'urgent', 'priority', 'priorité',
                    'complete', 'compléter', 'action',
                    'task', 'tâche', 'todo'
                ],
                weak: ['demande', 'request', 'need'],
                exclusions: ['newsletter', 'marketing', 'promotion']
            },

            finance: {
                absolute: [
                    'facture', 'invoice', 'payment', 'paiement',
                    'virement', 'transfer', 'commande',
                    'n°commande', 'numéro commande', 'order number',
                    'livraison commande', 'confirmation commande'
                ],
                strong: [
                    'montant', 'amount', 'total', 'facture',
                    'commande', 'order', 'achat', 'vente',
                    'livraison', 'delivery', 'prix', 'price'
                ],
                weak: ['euro', 'dollar', 'payment'],
                exclusions: ['newsletter', 'marketing', 'promotion']
            },

            meetings: {
                absolute: [
                    'demande de réunion', 'meeting request',
                    'invitation réunion', 'meeting invitation',
                    'teams meeting', 'zoom meeting',
                    'rendez-vous', 'appointment'
                ],
                strong: [
                    'meeting', 'réunion', 'schedule',
                    'calendar', 'calendrier', 'appointment'
                ],
                weak: ['agenda', 'disponible', 'available'],
                exclusions: ['newsletter', 'promotion']
            },

            commercial: {
                absolute: [
                    'devis', 'quotation', 'proposal',
                    'contrat', 'contract', 'opportunité'
                ],
                strong: [
                    'client', 'customer', 'prospect',
                    'commercial', 'business', 'vente'
                ],
                weak: ['offre', 'négociation'],
                exclusions: ['newsletter', 'marketing']
            },

            support: {
                absolute: [
                    'ticket #', 'numéro de ticket',
                    'support ticket', 'demande de support'
                ],
                strong: [
                    'support', 'assistance', 'help',
                    'ticket', 'problème', 'issue'
                ],
                weak: ['help', 'aide', 'question'],
                exclusions: ['newsletter', 'marketing']
            },

            project: {
                absolute: [
                    'project update', 'milestone',
                    'sprint', 'livrable projet'
                ],
                strong: [
                    'projet', 'project', 'development',
                    'agile', 'scrum'
                ],
                weak: ['phase', 'étape'],
                exclusions: ['newsletter', 'marketing']
            },

            notifications: {
                absolute: [
                    'do not reply', 'ne pas répondre',
                    'noreply@', 'automated message'
                ],
                strong: [
                    'automated', 'automatic', 'notification'
                ],
                weak: ['alert', 'info'],
                exclusions: ['newsletter', 'urgent']
            },

            cc: {
                absolute: [
                    'copie pour information', 'for your information',
                    'fyi', 'en copie'
                ],
                strong: ['information', 'copie', 'copy'],
                weak: ['info'],
                exclusions: ['urgent', 'action required']
            }
        };

        console.log('[CategoryManager] Mots-clés initialisés avec détection newsletters renforcée');
    }

    // ================================================
    // ANALYSE D'EMAIL PRINCIPALE
    // ================================================
    analyzeEmail(email) {
        if (!email) return { category: 'other', score: 0, confidence: 0 };
        
        const content = this.extractCompleteContent(email);
        
        // ÉTAPE 1: DÉTECTION PRIORITAIRE DES NEWSLETTERS
        const newsletterResult = this.analyzeCategory(content, this.weightedKeywords.newsletters);
        if (newsletterResult.score >= 100 || newsletterResult.hasAbsolute) {
            console.log('[CategoryManager] 📰 Newsletter détectée avec score:', newsletterResult.score);
            return {
                category: 'newsletters',
                score: newsletterResult.score,
                confidence: this.calculateConfidence(newsletterResult),
                matchedPatterns: newsletterResult.matches,
                hasAbsolute: newsletterResult.hasAbsolute,
                priority: 100
            };
        }
        
        // ÉTAPE 2: VÉRIFICATIONS D'EXCLUSION
        if (this.shouldExcludeSpam() && this.isSpamEmail(email)) {
            return { category: 'spam', score: 0, confidence: 0, isSpam: true };
        }
        
        if (this.isGloballyExcluded(content, email)) {
            return { category: 'excluded', score: 0, confidence: 0, isExcluded: true };
        }
        
        // ÉTAPE 3: DÉTECTION CC
        if (this.shouldDetectCC() && this.isInCC(email)) {
            return {
                category: 'cc',
                score: 100,
                confidence: 0.95,
                matchedPatterns: [{ keyword: 'email_in_cc', type: 'detected', score: 100 }],
                hasAbsolute: true,
                isCC: true
            };
        }
        
        // ÉTAPE 4: ANALYSE DE TOUTES LES AUTRES CATÉGORIES
        const allResults = this.analyzeAllCategories(content);
        const selectedResult = this.selectBestCategory(allResults);
        
        if (!selectedResult || selectedResult.score < 30) {
            return {
                category: 'other',
                score: 0,
                confidence: 0,
                matchedPatterns: [],
                hasAbsolute: false,
                reason: 'no_category_matched'
            };
        }
        
        return selectedResult;
    }

    analyzeAllCategories(content) {
        const results = {};
        const activeCategories = this.getActiveCategories();
        
        // Exclure newsletters car déjà testée
        const categoriesToTest = activeCategories.filter(cat => cat !== 'newsletters');
        
        for (const categoryId of categoriesToTest) {
            if (!this.categories[categoryId] || !this.weightedKeywords[categoryId]) {
                continue;
            }
            
            const keywords = this.weightedKeywords[categoryId];
            const score = this.calculateScore(content, keywords, categoryId);
            
            results[categoryId] = {
                category: categoryId,
                score: score.total,
                hasAbsolute: score.hasAbsolute,
                matches: score.matches,
                confidence: this.calculateConfidence(score),
                priority: this.categories[categoryId]?.priority || 50
            };
        }
        
        return results;
    }

    selectBestCategory(results) {
        const MIN_SCORE_THRESHOLD = 30;
        const MIN_CONFIDENCE_THRESHOLD = 0.5;
        
        const sortedResults = Object.values(results)
            .filter(r => r.score >= MIN_SCORE_THRESHOLD && r.confidence >= MIN_CONFIDENCE_THRESHOLD)
            .sort((a, b) => {
                if (a.hasAbsolute && !b.hasAbsolute) return -1;
                if (!a.hasAbsolute && b.hasAbsolute) return 1;
                if (a.priority !== b.priority) return b.priority - a.priority;
                return b.score - a.score;
            });
        
        const bestResult = sortedResults[0];
        
        if (bestResult) {
            return {
                category: bestResult.category,
                score: bestResult.score,
                confidence: bestResult.confidence,
                matchedPatterns: bestResult.matches,
                hasAbsolute: bestResult.hasAbsolute
            };
        }
        
        return null;
    }

    // ================================================
    // CALCUL DE SCORE
    // ================================================
    calculateScore(content, keywords, categoryId) {
        let totalScore = 0;
        let hasAbsolute = false;
        const matches = [];
        const text = content.text;
        
        // Bonus de base pour certaines catégories
        const categoryBonus = {
            'security': 10,
            'tasks': 15,
            'finance': 10
        };
        
        if (categoryBonus[categoryId]) {
            totalScore += categoryBonus[categoryId];
            matches.push({ keyword: 'category_bonus', type: 'bonus', score: categoryBonus[categoryId] });
        }
        
        // Test des exclusions
        if (keywords.exclusions && keywords.exclusions.length > 0) {
            for (const exclusion of keywords.exclusions) {
                if (this.findInText(text, exclusion)) {
                    totalScore -= 50;
                    matches.push({ keyword: exclusion, type: 'exclusion', score: -50 });
                }
            }
        }
        
        // Test des mots-clés absolus
        if (keywords.absolute && keywords.absolute.length > 0) {
            for (const keyword of keywords.absolute) {
                if (this.findInText(text, keyword)) {
                    totalScore += 100;
                    hasAbsolute = true;
                    matches.push({ keyword, type: 'absolute', score: 100 });
                    
                    // Bonus si dans le sujet
                    if (content.subject && this.findInText(content.subject, keyword)) {
                        totalScore += 50;
                        matches.push({ keyword: keyword + ' (in subject)', type: 'bonus', score: 50 });
                    }
                }
            }
        }
        
        // Test des mots-clés forts
        if (keywords.strong && keywords.strong.length > 0) {
            let strongMatches = 0;
            for (const keyword of keywords.strong) {
                if (this.findInText(text, keyword)) {
                    totalScore += 40;
                    strongMatches++;
                    matches.push({ keyword, type: 'strong', score: 40 });
                    
                    if (content.subject && this.findInText(content.subject, keyword)) {
                        totalScore += 20;
                        matches.push({ keyword: keyword + ' (in subject)', type: 'bonus', score: 20 });
                    }
                }
            }
            
            if (strongMatches >= 2) {
                totalScore += 30;
                matches.push({ keyword: 'multiple_strong_matches', type: 'bonus', score: 30 });
            }
        }
        
        // Test des mots-clés faibles
        if (keywords.weak && keywords.weak.length > 0) {
            for (const keyword of keywords.weak) {
                if (this.findInText(text, keyword)) {
                    totalScore += 15;
                    matches.push({ keyword, type: 'weak', score: 15 });
                }
            }
        }
        
        return { 
            total: Math.max(0, totalScore), 
            hasAbsolute, 
            matches 
        };
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
    extractCompleteContent(email) {
        let allText = '';
        let subject = '';
        
        if (email.subject && email.subject.trim()) {
            subject = email.subject;
            allText += (email.subject + ' ').repeat(10);
        }
        
        if (email.from?.emailAddress?.address) {
            allText += (email.from.emailAddress.address + ' ').repeat(3);
        }
        
        if (email.bodyPreview) {
            allText += email.bodyPreview + ' ';
        }
        
        if (email.body?.content) {
            const cleanedBody = this.cleanHtml(email.body.content);
            allText += cleanedBody + ' ';
        }
        
        return {
            text: allText.toLowerCase().trim(),
            subject: subject.toLowerCase(),
            domain: this.extractDomain(email.from?.emailAddress?.address)
        };
    }

    findInText(text, keyword) {
        if (!text || !keyword) return false;
        
        const normalizedText = text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[éèêëÉÈÊË]/gi, 'e')
            .replace(/[àâäÀÂÄ]/gi, 'a')
            .replace(/[ùûüÙÛÜ]/gi, 'u')
            .replace(/[çÇ]/gi, 'c')
            .replace(/[îïÎÏ]/gi, 'i')
            .replace(/[ôöÔÖ]/gi, 'o')
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const normalizedKeyword = keyword.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[éèêëÉÈÊË]/gi, 'e')
            .replace(/[àâäÀÂÄ]/gi, 'a')
            .replace(/[ùûüÙÛÜ]/gi, 'u')
            .replace(/[çÇ]/gi, 'c')
            .replace(/[îïÎÏ]/gi, 'i')
            .replace(/[ôöÔÖ]/gi, 'o')
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        return normalizedText.includes(normalizedKeyword);
    }

    cleanHtml(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&[^;]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractDomain(email) {
        if (!email || !email.includes('@')) return 'unknown';
        return email.split('@')[1]?.toLowerCase() || 'unknown';
    }

    calculateConfidence(score) {
        if (score.hasAbsolute) return 0.95;
        if (score.total >= 200) return 0.90;
        if (score.total >= 150) return 0.85;
        if (score.total >= 100) return 0.80;
        if (score.total >= 80) return 0.75;
        if (score.total >= 60) return 0.70;
        if (score.total >= 40) return 0.60;
        return 0.50;
    }

    analyzeCategory(content, keywords) {
        return this.calculateScore(content, keywords, 'single');
    }

    // ================================================
    // MÉTHODES DE VÉRIFICATION
    // ================================================
    isSpamEmail(email) {
        if (email.parentFolderId) {
            const folderInfo = email.parentFolderId.toLowerCase();
            if (folderInfo.includes('junk') || 
                folderInfo.includes('spam') || 
                folderInfo.includes('unwanted')) {
                return true;
            }
        }
        return false;
    }

    isGloballyExcluded(content, email) {
        const exclusions = this.settings.categoryExclusions;
        if (!exclusions) return false;
        
        if (exclusions.domains && exclusions.domains.length > 0) {
            for (const domain of exclusions.domains) {
                if (content.domain.includes(domain.toLowerCase())) {
                    return true;
                }
            }
        }
        
        return false;
    }

    isInCC(email) {
        if (!email.ccRecipients || !Array.isArray(email.ccRecipients) || email.ccRecipients.length === 0) {
            return false;
        }
        
        const currentUserEmail = this.getCurrentUserEmail();
        if (!currentUserEmail) return false;
        
        const isInToList = email.toRecipients?.some(recipient => {
            const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
            return recipientEmail === currentUserEmail.toLowerCase();
        }) || false;
        
        const isInCCList = email.ccRecipients.some(recipient => {
            const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
            return recipientEmail === currentUserEmail.toLowerCase();
        });
        
        return isInCCList && !isInToList;
    }

    getCurrentUserEmail() {
        try {
            const userInfo = localStorage.getItem('currentUserInfo');
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                return parsed.email || parsed.userPrincipalName;
            }
        } catch (e) {
            console.warn('[CategoryManager] Impossible de récupérer l\'email utilisateur');
        }
        return null;
    }

    shouldExcludeSpam() {
        return this.settings.preferences?.excludeSpam !== false;
    }

    shouldDetectCC() {
        return this.settings.preferences?.detectCC !== false;
    }

    // ================================================
    // MÉTHODES DIVERSES
    // ================================================
    loadCustomCategories() {
        // Placeholder pour catégories personnalisées
        this.customCategories = {};
    }

    initializeFilters() {
        // Placeholder pour filtres
    }

    setupEventListeners() {
        if (this.eventListenersSetup) return;
        this.eventListenersSetup = true;
    }

    dispatchEvent(eventName, detail) {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { 
                detail: {
                    ...detail,
                    source: 'CategoryManager',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error(`[CategoryManager] Erreur dispatch ${eventName}:`, error);
        }
    }

    // ================================================
    // MÉTHODES DE TEST
    // ================================================
    testEmail(subject, body = '', from = 'test@example.com') {
        const testEmail = {
            subject: subject,
            body: { content: body },
            bodyPreview: body.substring(0, 100),
            from: { emailAddress: { address: from } },
            toRecipients: [{ emailAddress: { address: 'user@example.com' } }],
            receivedDateTime: new Date().toISOString()
        };
        
        const result = this.analyzeEmail(testEmail);
        
        console.log('\n[CategoryManager] TEST RESULT:');
        console.log(`Subject: "${subject}"`);
        console.log(`Category: ${result.category}`);
        console.log(`Score: ${result.score}pts`);
        console.log(`Confidence: ${Math.round(result.confidence * 100)}%`);
        
        return result;
    }
}

// ================================================
// INITIALISATION GLOBALE
// ================================================
if (window.categoryManager) {
    console.log('[CategoryManager] 🔄 Nettoyage ancienne instance...');
    window.categoryManager.destroy?.();
}

console.log('[CategoryManager] 🚀 Création nouvelle instance v21.0...');
window.categoryManager = new CategoryManager();

// Fonctions de test globales
window.testCategoryManager = function() {
    console.group('🧪 TEST CategoryManager v21.0');
    
    const tests = [
        { subject: "Vous ne souhaitez plus recevoir de communications - paramétrez vos choix", expected: "newsletters" },
        { subject: "Se désabonner de cette newsletter", expected: "newsletters" },
        { subject: "Jusqu'à -70% sur les nouvelles marques", expected: "newsletters" },
        { subject: "Newsletter Trainline - Dès 19€ en 2de classe", expected: "newsletters" },
        { subject: "Action requise: Confirmer votre commande", expected: "tasks" },
        { subject: "Facture #12345 - Échéance dans 3 jours", expected: "finance" }
    ];
    
    tests.forEach(test => {
        window.categoryManager.testEmail(test.subject, '', 'test@example.com');
    });
    
    console.groupEnd();
    return { success: true, testsRun: tests.length };
};

console.log('✅ CategoryManager v21.0 loaded - Détection newsletters renforcée');
