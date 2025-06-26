// analytics.js - Système de tracking utilisateur complet pour EmailSortPro v1.0
// Fichier unique avec toutes les fonctionnalités d'analytics

class EmailSortProAnalytics {
    constructor() {
        this.version = '1.0';
        this.appName = 'EmailSortPro';
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.userProvider = null;
        this.sessionStartTime = Date.now();
        this.currentPage = null;
        this.pageStartTime = Date.now();
        this.events = [];
        this.config = {
            endpoint: '/api/analytics', // À adapter selon votre backend
            batchSize: 20,
            flushInterval: 30000, // 30 secondes
            enabledEvents: [
                'session_start',
                'user_login',
                'page_view',
                'user_action',
                'feature_usage',
                'error_tracking',
                'performance',
                'session_end'
            ],
            privacy: {
                anonymizeIP: true,
                respectDoNotTrack: this.shouldRespectDoNotTrack(),
                enableTracking: true
            },
            debug: window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app')
        };
        
        this.init();
    }

    // ===========================================
    // INITIALISATION ET CONFIGURATION
    // ===========================================
    
    init() {
        this.log('🚀 EmailSortPro Analytics initialized');
        
        // Vérifier le consentement
        if (!this.hasConsent()) {
            this.log('⏸️ Analytics paused - waiting for consent');
            return;
        }
        
        // Démarrer la session
        this.trackSessionStart();
        
        // Configurer les événements automatiques
        this.setupAutoTracking();
        
        // Démarrer le flush automatique
        this.startAutoFlush();
        
        // Gérer la fermeture de session
        this.setupSessionEnd();
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    shouldRespectDoNotTrack() {
        return navigator.doNotTrack === '1' || 
               navigator.doNotTrack === 'yes' || 
               window.doNotTrack === '1';
    }

    hasConsent() {
        // Vérifier si l'utilisateur a donné son consentement
        const consent = localStorage.getItem('emailsortpro_analytics_consent');
        return consent === 'accepted' || this.config.debug; // Toujours autorisé en mode debug
    }

    setConsent(accepted) {
        localStorage.setItem('emailsortpro_analytics_consent', accepted ? 'accepted' : 'denied');
        this.config.privacy.enableTracking = accepted;
        
        if (accepted && this.events.length === 0) {
            this.init(); // Redémarrer si pas encore initialisé
        }
        
        this.log(accepted ? '✅ Analytics consent granted' : '❌ Analytics consent denied');
    }

    // ===========================================
    // MÉTHODES DE TRACKING PRINCIPALES
    // ===========================================

    // 1. AUTHENTIFICATION
    trackLogin(provider, userEmail, userName) {
        this.userId = userEmail;
        this.userProvider = provider;
        
        this.trackEvent('user_login', {
            provider: provider,
            user_id: this.hashEmail(userEmail),
            user_name: userName ? this.hashString(userName) : null,
            session_duration_before_login: Date.now() - this.sessionStartTime,
            is_return_user: this.isReturnUser()
        });
        
        // Sauvegarder pour les prochaines visites
        this.saveUserData();
        
        this.log('👤 User login tracked:', provider);
    }

    trackLogout() {
        this.trackEvent('user_logout', {
            provider: this.userProvider,
            session_duration: Date.now() - this.sessionStartTime,
            pages_visited: this.getUniquePages().length
        });
        
        this.userId = null;
        this.userProvider = null;
        this.clearUserData();
        
        this.log('👋 User logout tracked');
    }

    // 2. NAVIGATION
    trackPageView(pageName, additionalData = {}) {
        const now = Date.now();
        
        // Tracker la page précédente si elle existe
        if (this.currentPage) {
            this.trackEvent('page_duration', {
                page: this.currentPage,
                duration: now - this.pageStartTime,
                exit_time: now
            });
        }
        
        // Tracker la nouvelle page
        this.currentPage = pageName;
        this.pageStartTime = now;
        
        this.trackEvent('page_view', {
            page: pageName,
            referrer: document.referrer,
            url: window.location.href,
            user_agent: navigator.userAgent.substring(0, 200),
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            session_page_count: this.getSessionPageCount(),
            ...additionalData
        });
        
        this.log('📄 Page view tracked:', pageName);
    }

    // 3. ACTIONS UTILISATEUR
    trackAction(actionType, details = {}) {
        this.trackEvent('user_action', {
            action: actionType,
            page: this.currentPage,
            details: details,
            timestamp: Date.now()
        });
        
        this.log('🔥 Action tracked:', actionType, details);
    }

    // 4. UTILISATION DES FONCTIONNALITÉS
    trackFeatureUsage(featureName, usage_data = {}) {
        this.trackEvent('feature_usage', {
            feature: featureName,
            page: this.currentPage,
            usage_data: usage_data,
            user_experience_level: this.getUserExperienceLevel()
        });
        
        this.log('⚡ Feature usage tracked:', featureName);
    }

    // 5. ERREURS
    trackError(errorType, errorDetails, context = {}) {
        this.trackEvent('error_tracking', {
            error_type: errorType,
            error_message: errorDetails.message || errorDetails,
            error_stack: errorDetails.stack ? errorDetails.stack.substring(0, 500) : null,
            page: this.currentPage,
            user_agent: navigator.userAgent.substring(0, 200),
            url: window.location.href,
            context: context,
            severity: this.getErrorSeverity(errorType)
        });
        
        this.log('❌ Error tracked:', errorType, errorDetails);
    }

    // 6. PERFORMANCE
    trackPerformance(metricName, value, unit = 'ms') {
        this.trackEvent('performance', {
            metric: metricName,
            value: value,
            unit: unit,
            page: this.currentPage,
            timestamp: Date.now()
        });
        
        this.log('⚡ Performance tracked:', metricName, `${value}${unit}`);
    }

    // ===========================================
    // TRACKING AUTOMATIQUE
    // ===========================================

    setupAutoTracking() {
        // Tracking des clics automatique
        document.addEventListener('click', (e) => {
            if (!this.config.privacy.enableTracking) return;
            
            const element = e.target.closest('button, a, .nav-item, .action-card');
            if (element) {
                const elementInfo = this.getElementInfo(element);
                this.trackAction('click', elementInfo);
            }
        });

        // Tracking des erreurs JavaScript
        window.addEventListener('error', (e) => {
            this.trackError('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack
            });
        });

        // Tracking des promesses rejetées
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError('promise_rejection', {
                reason: e.reason?.message || e.reason,
                stack: e.reason?.stack
            });
        });

        // Tracking de la performance de base
        if (window.performance) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = performance.timing;
                    this.trackPerformance('page_load_time', timing.loadEventEnd - timing.navigationStart);
                    this.trackPerformance('dom_ready_time', timing.domContentLoadedEventEnd - timing.navigationStart);
                    this.trackPerformance('first_paint', this.getFirstPaint());
                }, 100);
            });
        }

        this.log('🤖 Auto-tracking configured');
    }

    setupSessionEnd() {
        // Tracking de fin de session
        const trackSessionEnd = () => {
            this.trackEvent('session_end', {
                session_duration: Date.now() - this.sessionStartTime,
                pages_visited: this.getUniquePages().length,
                actions_count: this.getActionsCount(),
                errors_count: this.getErrorsCount()
            });
            this.flush(); // Forcer l'envoi immédiat
        };

        window.addEventListener('beforeunload', trackSessionEnd);
        window.addEventListener('pagehide', trackSessionEnd);
        
        // Heartbeat pour les sessions longues
        setInterval(() => {
            if (this.config.privacy.enableTracking) {
                this.trackEvent('session_heartbeat', {
                    session_duration: Date.now() - this.sessionStartTime,
                    current_page: this.currentPage
                });
            }
        }, 300000); // Toutes les 5 minutes
    }

    // ===========================================
    // MÉTHODES SPÉCIFIQUES EMAILSORTPRO
    // ===========================================

    // Tracking spécifique aux emails
    trackEmailAction(action, emailData = {}) {
        this.trackFeatureUsage('email_management', {
            action: action,
            email_count: emailData.count || 1,
            email_provider: this.userProvider,
            folder: emailData.folder,
            category: emailData.category
        });
    }

    // Tracking spécifique aux tâches
    trackTaskAction(action, taskData = {}) {
        this.trackFeatureUsage('task_management', {
            action: action,
            task_priority: taskData.priority,
            has_deadline: !!taskData.deadline,
            task_source: taskData.source || 'manual'
        });
    }

    // Tracking du scanner d'emails
    trackScannerUsage(scanData = {}) {
        this.trackFeatureUsage('email_scanner', {
            emails_scanned: scanData.emailsScanned || 0,
            categories_found: scanData.categoriesFound || 0,
            scan_duration: scanData.duration || 0,
            scan_success: scanData.success || false
        });
    }

    // Tracking de l'organisation par domaine
    trackDomainOrganization(organizationData = {}) {
        this.trackFeatureUsage('domain_organization', {
            domains_processed: organizationData.domainsProcessed || 0,
            emails_organized: organizationData.emailsOrganized || 0,
            folders_created: organizationData.foldersCreated || 0
        });
    }

    // ===========================================
    // GESTION DES ÉVÉNEMENTS ET ENVOI
    // ===========================================

    trackEvent(eventType, data) {
        if (!this.config.privacy.enableTracking || !this.config.enabledEvents.includes(eventType)) {
            return;
        }

        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId ? this.hashEmail(this.userId) : null,
            app_name: this.appName,
            app_version: this.version,
            page: this.currentPage,
            data: data
        };

        this.events.push(event);
        
        // Flush automatique si le buffer est plein
        if (this.events.length >= this.config.batchSize) {
            this.flush();
        }
    }

    trackSessionStart() {
        this.trackEvent('session_start', {
            user_agent: navigator.userAgent.substring(0, 200),
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer,
            url: window.location.href,
            is_return_user: this.isReturnUser(),
            session_count: this.getSessionCount()
        });
    }

    startAutoFlush() {
        setInterval(() => {
            if (this.events.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
    }

    async flush() {
        if (this.events.length === 0 || !this.config.privacy.enableTracking) {
            return;
        }

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            if (this.config.debug) {
                // En mode debug, juste logger
                this.log('📤 Would send events:', eventsToSend);
                return;
            }

            // Envoyer au serveur
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events: eventsToSend,
                    session_id: this.sessionId,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.log('📤 Events sent successfully:', eventsToSend.length);

        } catch (error) {
            this.log('❌ Failed to send events:', error);
            
            // Remettre les événements dans la queue en cas d'erreur
            this.events = [...eventsToSend, ...this.events];
            
            // Limiter la taille pour éviter l'accumulation
            if (this.events.length > 100) {
                this.events = this.events.slice(-50);
            }
        }
    }

    // ===========================================
    // MÉTHODES UTILITAIRES
    // ===========================================

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    hashEmail(email) {
        // Hash simple pour anonymiser (à améliorer avec une vraie fonction de hash)
        if (!email) return null;
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'user_' + Math.abs(hash).toString(36);
    }

    hashString(str) {
        if (!str) return null;
        return 'hash_' + btoa(str).substring(0, 10);
    }

    getElementInfo(element) {
        return {
            tag: element.tagName.toLowerCase(),
            class: element.className,
            id: element.id,
            text: element.textContent?.substring(0, 50) || '',
            data_page: element.dataset?.page || null
        };
    }

    getUniquePages() {
        return [...new Set(this.events
            .filter(e => e.type === 'page_view')
            .map(e => e.data.page))];
    }

    getSessionPageCount() {
        return this.events.filter(e => e.type === 'page_view').length + 1;
    }

    getActionsCount() {
        return this.events.filter(e => e.type === 'user_action').length;
    }

    getErrorsCount() {
        return this.events.filter(e => e.type === 'error_tracking').length;
    }

    getUserExperienceLevel() {
        const sessionCount = this.getSessionCount();
        if (sessionCount <= 1) return 'new';
        if (sessionCount <= 5) return 'beginner';
        if (sessionCount <= 20) return 'intermediate';
        return 'expert';
    }

    getErrorSeverity(errorType) {
        const criticalErrors = ['javascript_error', 'auth_error', 'data_loss'];
        return criticalErrors.includes(errorType) ? 'critical' : 'warning';
    }

    getFirstPaint() {
        if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        }
        return null;
    }

    isReturnUser() {
        return localStorage.getItem('emailsortpro_user_returning') === 'true';
    }

    getSessionCount() {
        const count = parseInt(localStorage.getItem('emailsortpro_session_count') || '0');
        localStorage.setItem('emailsortpro_session_count', (count + 1).toString());
        return count + 1;
    }

    saveUserData() {
        localStorage.setItem('emailsortpro_user_returning', 'true');
        localStorage.setItem('emailsortpro_last_provider', this.userProvider);
    }

    clearUserData() {
        localStorage.removeItem('emailsortpro_last_provider');
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[Analytics]', ...args);
        }
    }

    // ===========================================
    // API PUBLIQUE POUR LES TESTS
    // ===========================================

    // Méthode pour tester le système
    test() {
        this.log('🧪 Running analytics test...');
        
        this.trackPageView('test_page');
        this.trackAction('test_action', { test: true });
        this.trackFeatureUsage('test_feature', { testData: 'success' });
        this.trackError('test_error', { message: 'Test error' });
        this.trackPerformance('test_metric', 100);
        
        this.log('🧪 Test events generated:', this.events.length);
        
        return {
            events: this.events.length,
            sessionId: this.sessionId,
            userId: this.userId,
            config: this.config
        };
    }

    // Obtenir les statistiques de la session
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionDuration: Date.now() - this.sessionStartTime,
            currentPage: this.currentPage,
            eventsCount: this.events.length,
            pagesVisited: this.getUniquePages(),
            actionsCount: this.getActionsCount(),
            errorsCount: this.getErrorsCount(),
            userExperienceLevel: this.getUserExperienceLevel()
        };
    }

    // Configurer l'endpoint pour le serveur
    setEndpoint(endpoint) {
        this.config.endpoint = endpoint;
        this.log('🔧 Analytics endpoint set to:', endpoint);
    }

    // Activer/désactiver le mode debug
    setDebugMode(enabled) {
        this.config.debug = enabled;
        this.log(enabled ? '🐛 Debug mode enabled' : '🐛 Debug mode disabled');
    }
}

// ===========================================
// INITIALISATION GLOBALE
// ===========================================

// Créer l'instance globale
window.emailSortProAnalytics = new EmailSortProAnalytics();

// Raccourcis pour faciliter l'utilisation
window.trackLogin = (provider, email, name) => window.emailSortProAnalytics.trackLogin(provider, email, name);
window.trackLogout = () => window.emailSortProAnalytics.trackLogout();
window.trackPage = (page, data) => window.emailSortProAnalytics.trackPageView(page, data);
window.trackAction = (action, details) => window.emailSortProAnalytics.trackAction(action, details);
window.trackFeature = (feature, data) => window.emailSortProAnalytics.trackFeatureUsage(feature, data);
window.trackError = (type, error, context) => window.emailSortProAnalytics.trackError(type, error, context);
window.trackPerformance = (metric, value, unit) => window.emailSortProAnalytics.trackPerformance(metric, value, unit);

// Raccourcis spécifiques EmailSortPro
window.trackEmail = (action, data) => window.emailSortProAnalytics.trackEmailAction(action, data);
window.trackTask = (action, data) => window.emailSortProAnalytics.trackTaskAction(action, data);
window.trackScanner = (data) => window.emailSortProAnalytics.trackScannerUsage(data);
window.trackDomainOrg = (data) => window.emailSortProAnalytics.trackDomainOrganization(data);

console.log('✅ EmailSortPro Analytics v1.0 loaded - Use window.emailSortProAnalytics.test() to test');
