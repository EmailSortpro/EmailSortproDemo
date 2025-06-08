// MailService.js - Service de récupération des emails Microsoft Graph CORRIGÉ v6.1

class MailService {
    constructor() {
        this.isInitialized = false;
        this.currentDomain = window.location.hostname;
        this.isTestMode = false; // CORRECTION: Désactiver le mode test par défaut
        this.lastSyncTime = null;
        this.emails = [];
        this.folders = [];
        this.syncInProgress = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('[MailService] Constructor v6.1 - Service de récupération des emails RÉELS');
        console.log('[MailService] Domain:', this.currentDomain);
        console.log('[MailService] Test mode:', this.isTestMode);
        
        this.init();
    }

    async init() {
        try {
            console.log('[MailService] Initializing for real email access...');
            
            // Vérifier si AuthService est disponible et authentifié
            if (!window.authService) {
                console.warn('[MailService] AuthService not available, will retry later');
                return;
            }
            
            // Attendre que l'authentification soit complète
            if (!window.authService.isAuthenticated()) {
                console.log('[MailService] Not authenticated yet, waiting...');
                return;
            }
            
            this.isInitialized = true;
            console.log('[MailService] ✅ Initialized for real email access');
            
        } catch (error) {
            console.error('[MailService] Initialization error:', error);
        }
    }

    // CORRECTION: Méthode pour forcer l'utilisation des emails réels
    async getEmails(options = {}) {
        console.log('[MailService] Getting REAL emails from Microsoft Graph...');
        
        if (!window.authService || !window.authService.isAuthenticated()) {
            console.error('[MailService] Not authenticated - cannot fetch real emails');
            return this.getDemoEmails(); // Fallback temporaire
        }

        try {
            const token = await window.authService.getAccessToken();
            if (!token) {
                console.error('[MailService] No access token available');
                return this.getDemoEmails();
            }

            // CORRECTION: Récupérer les vrais emails
            const realEmails = await this.fetchRealEmails(token, options);
            
            if (realEmails && realEmails.length > 0) {
                console.log(`[MailService] ✅ Retrieved ${realEmails.length} REAL emails`);
                this.emails = realEmails;
                this.lastSyncTime = new Date();
                
                // Sauvegarder les emails récupérés
                this.saveEmailsToCache(realEmails);
                
                return realEmails;
            } else {
                console.warn('[MailService] No real emails found, using demo fallback');
                return this.getDemoEmails();
            }
            
        } catch (error) {
            console.error('[MailService] Error fetching real emails:', error);
            console.log('[MailService] Falling back to demo emails due to error');
            return this.getDemoEmails();
        }
    }

    // NOUVELLE MÉTHODE: Récupération des emails réels via Microsoft Graph
    async fetchRealEmails(token, options = {}) {
        console.log('[MailService] Fetching emails from Microsoft Graph API...');
        
        const {
            folder = 'inbox',
            limit = 50,
            filter = null,
            select = 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body,importance,isRead,hasAttachments'
        } = options;

        try {
            // Construction de l'URL avec les paramètres
            let graphUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages`;
            
            const params = new URLSearchParams();
            params.append('$select', select);
            params.append('$top', limit.toString());
            params.append('$orderby', 'receivedDateTime desc');
            
            if (filter) {
                params.append('$filter', filter);
            }
            
            graphUrl += '?' + params.toString();
            
            console.log('[MailService] Graph API URL:', graphUrl);
            
            const response = await fetch(graphUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ConsistencyLevel': 'eventual'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[MailService] Graph API error:', response.status, errorText);
                
                // Gestion d'erreurs spécifiques
                if (response.status === 401) {
                    console.error('[MailService] Token expired or invalid');
                    // Forcer une nouvelle authentification
                    if (window.authService) {
                        await window.authService.reset();
                    }
                } else if (response.status === 403) {
                    console.error('[MailService] Insufficient permissions for email access');
                    if (window.uiManager) {
                        window.uiManager.showToast(
                            'Permissions insuffisantes pour accéder aux emails. Vérifiez votre configuration Azure.',
                            'error',
                            10000
                        );
                    }
                } else if (response.status === 429) {
                    console.warn('[MailService] Rate limited, will retry later');
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[MailService] Graph API response:', {
                emailCount: data.value?.length || 0,
                hasNextLink: !!data['@odata.nextLink']
            });

            if (!data.value || !Array.isArray(data.value)) {
                console.warn('[MailService] Invalid response format from Graph API');
                return [];
            }

            // Traitement et normalisation des emails
            const processedEmails = data.value.map(email => this.processEmailFromGraph(email));
            
            console.log(`[MailService] ✅ Processed ${processedEmails.length} emails from Graph API`);
            return processedEmails;

        } catch (error) {
            console.error('[MailService] Error in fetchRealEmails:', error);
            throw error;
        }
    }

    // NOUVELLE MÉTHODE: Traitement des emails de l'API Graph
    processEmailFromGraph(graphEmail) {
        try {
            // Normalisation du format email pour l'application
            const processedEmail = {
                id: graphEmail.id,
                subject: graphEmail.subject || '(Sans objet)',
                from: {
                    name: graphEmail.from?.emailAddress?.name || 'Expéditeur inconnu',
                    address: graphEmail.from?.emailAddress?.address || 'unknown@example.com'
                },
                to: graphEmail.toRecipients?.map(recipient => ({
                    name: recipient.emailAddress?.name || '',
                    address: recipient.emailAddress?.address || ''
                })) || [],
                cc: graphEmail.ccRecipients?.map(recipient => ({
                    name: recipient.emailAddress?.name || '',
                    address: recipient.emailAddress?.address || ''
                })) || [],
                date: new Date(graphEmail.receivedDateTime),
                receivedDateTime: graphEmail.receivedDateTime,
                bodyPreview: graphEmail.bodyPreview || '',
                body: graphEmail.body?.content || graphEmail.bodyPreview || '',
                bodyType: graphEmail.body?.contentType || 'text',
                importance: graphEmail.importance || 'normal',
                isRead: graphEmail.isRead || false,
                hasAttachments: graphEmail.hasAttachments || false,
                
                // Métadonnées supplémentaires pour le traitement
                source: 'microsoft-graph',
                rawGraphData: graphEmail, // Garder les données brutes si nécessaire
                processedAt: new Date().toISOString(),
                
                // Champs pour la catégorisation
                category: null,
                tags: [],
                priority: this.determinePriority(graphEmail),
                
                // Informations extraites pour le scan
                domain: this.extractDomain(graphEmail.from?.emailAddress?.address),
                isInternal: this.isInternalEmail(graphEmail.from?.emailAddress?.address),
                threadId: graphEmail.conversationId || graphEmail.id
            };

            return processedEmail;
            
        } catch (error) {
            console.error('[MailService] Error processing email from Graph:', error);
            console.error('[MailService] Problematic email:', graphEmail);
            
            // Retourner un email minimal en cas d'erreur
            return {
                id: graphEmail.id || 'error-' + Date.now(),
                subject: 'Erreur de traitement',
                from: { name: 'Erreur', address: 'error@example.com' },
                to: [],
                cc: [],
                date: new Date(),
                body: 'Erreur lors du traitement de cet email',
                source: 'error',
                hasError: true
            };
        }
    }

    // Méthodes utilitaires pour le traitement
    determinePriority(graphEmail) {
        if (graphEmail.importance === 'high') return 'high';
        if (graphEmail.importance === 'low') return 'low';
        
        // Logique supplémentaire basée sur le contenu
        const subject = (graphEmail.subject || '').toLowerCase();
        if (subject.includes('urgent') || subject.includes('asap') || subject.includes('important')) {
            return 'high';
        }
        
        return 'normal';
    }

    extractDomain(emailAddress) {
        if (!emailAddress || !emailAddress.includes('@')) return 'unknown';
        return emailAddress.split('@')[1].toLowerCase();
    }

    isInternalEmail(emailAddress) {
        if (!emailAddress) return false;
        const domain = this.extractDomain(emailAddress);
        
        // Liste des domaines considérés comme internes (à adapter selon l'organisation)
        const internalDomains = [
            'hotmail.com',
            'outlook.com', 
            'live.com',
            'msn.com'
        ];
        
        return internalDomains.includes(domain);
    }

    // CORRECTION: Cache des emails récupérés
    saveEmailsToCache(emails) {
        try {
            const cacheData = {
                emails: emails,
                timestamp: new Date().toISOString(),
                count: emails.length,
                domain: this.currentDomain
            };
            
            localStorage.setItem('emailsort_cached_emails', JSON.stringify(cacheData));
            console.log(`[MailService] ✅ Cached ${emails.length} emails`);
            
        } catch (error) {
            console.warn('[MailService] Could not cache emails:', error);
        }
    }

    loadEmailsFromCache() {
        try {
            const cached = localStorage.getItem('emailsort_cached_emails');
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
            const maxAge = 30 * 60 * 1000; // 30 minutes
            
            if (cacheAge > maxAge) {
                console.log('[MailService] Cache expired, will fetch fresh emails');
                localStorage.removeItem('emailsort_cached_emails');
                return null;
            }
            
            console.log(`[MailService] Loaded ${cacheData.count} emails from cache`);
            return cacheData.emails;
            
        } catch (error) {
            console.warn('[MailService] Error loading from cache:', error);
            return null;
        }
    }

    // NOUVELLE MÉTHODE: Scan intelligent des emails
    async scanEmailsForCategories(options = {}) {
        console.log('[MailService] Starting intelligent email scan...');
        
        const {
            limit = 100,
            folders = ['inbox'],
            forceRefresh = false
        } = options;

        try {
            let allEmails = [];
            
            if (!forceRefresh) {
                // Essayer de charger depuis le cache d'abord
                const cachedEmails = this.loadEmailsFromCache();
                if (cachedEmails && cachedEmails.length > 0) {
                    console.log(`[MailService] Using ${cachedEmails.length} cached emails`);
                    allEmails = cachedEmails;
                }
            }
            
            if (allEmails.length === 0) {
                console.log('[MailService] Fetching fresh emails for scan...');
                
                // Récupérer des emails de plusieurs dossiers
                for (const folder of folders) {
                    try {
                        const folderEmails = await this.getEmails({
                            folder: folder,
                            limit: Math.ceil(limit / folders.length)
                        });
                        
                        if (folderEmails && folderEmails.length > 0) {
                            allEmails.push(...folderEmails);
                            console.log(`[MailService] Added ${folderEmails.length} emails from ${folder}`);
                        }
                        
                    } catch (error) {
                        console.warn(`[MailService] Error fetching from folder ${folder}:`, error);
                    }
                }
            }

            if (allEmails.length === 0) {
                console.warn('[MailService] No emails found for scanning');
                return {
                    success: false,
                    message: 'Aucun email trouvé pour l\'analyse',
                    emails: [],
                    categories: []
                };
            }

            // Analyse et catégorisation
            const analysisResult = await this.analyzeEmailsForCategories(allEmails);
            
            console.log(`[MailService] ✅ Scan completed: ${allEmails.length} emails analyzed`);
            
            return {
                success: true,
                message: `${allEmails.length} emails analysés avec succès`,
                emails: allEmails,
                categories: analysisResult.categories,
                stats: analysisResult.stats,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('[MailService] Error in scanEmailsForCategories:', error);
            return {
                success: false,
                message: 'Erreur lors du scan des emails: ' + error.message,
                emails: [],
                categories: []
            };
        }
    }

    // NOUVELLE MÉTHODE: Analyse des emails pour catégorisation
    async analyzeEmailsForCategories(emails) {
        console.log(`[MailService] Analyzing ${emails.length} emails for categorization...`);
        
        const categories = new Map();
        const domains = new Map();
        const senders = new Map();
        
        emails.forEach(email => {
            // Analyse par domaine
            const domain = email.domain || 'unknown';
            domains.set(domain, (domains.get(domain) || 0) + 1);
            
            // Analyse par expéditeur
            const senderKey = `${email.from.name} <${email.from.address}>`;
            senders.set(senderKey, (senders.get(senderKey) || 0) + 1);
            
            // Catégorisation automatique basique
            const category = this.determineEmailCategory(email);
            categories.set(category, (categories.get(category) || 0) + 1);
            
            // Assigner la catégorie à l'email
            email.category = category;
        });
        
        // Convertir en tableaux triés
        const sortedCategories = Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
            
        const sortedDomains = Array.from(domains.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([domain, count]) => ({ domain, count }));
            
        const sortedSenders = Array.from(senders.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // Top 20 senders
            .map(([sender, count]) => ({ sender, count }));

        const stats = {
            totalEmails: emails.length,
            categoriesFound: sortedCategories.length,
            topDomains: sortedDomains.slice(0, 10),
            topSenders: sortedSenders,
            readEmails: emails.filter(e => e.isRead).length,
            unreadEmails: emails.filter(e => !e.isRead).length,
            withAttachments: emails.filter(e => e.hasAttachments).length
        };
        
        console.log('[MailService] Analysis complete:', stats);
        
        return {
            categories: sortedCategories,
            stats: stats
        };
    }

    // Catégorisation automatique simple
    determineEmailCategory(email) {
        const subject = (email.subject || '').toLowerCase();
        const fromAddress = email.from.address.toLowerCase();
        const domain = email.domain.toLowerCase();
        
        // Newsletters et marketing
        if (subject.includes('newsletter') || subject.includes('unsubscribe') || 
            fromAddress.includes('no-reply') || fromAddress.includes('noreply')) {
            return 'Newsletter';
        }
        
        // Notifications système
        if (subject.includes('notification') || subject.includes('alert') || 
            fromAddress.includes('notification')) {
            return 'Notification';
        }
        
        // Réseaux sociaux
        if (domain.includes('facebook') || domain.includes('linkedin') || 
            domain.includes('twitter') || domain.includes('instagram')) {
            return 'Réseaux sociaux';
        }
        
        // E-commerce
        if (subject.includes('order') || subject.includes('purchase') || 
            subject.includes('invoice') || subject.includes('receipt')) {
            return 'E-commerce';
        }
        
        // Travail
        if (subject.includes('meeting') || subject.includes('project') || 
            subject.includes('deadline') || subject.includes('report')) {
            return 'Travail';
        }
        
        // Personnel par défaut
        return 'Personnel';
    }

    // Emails de démonstration comme fallback
    getDemoEmails() {
        console.log('[MailService] Using demo emails as fallback');
        
        return [
            {
                id: 'demo-1',
                subject: 'Mode démo - Connectez-vous pour voir vos vrais emails',
                from: { name: 'EmailSortPro', address: 'demo@emailsortpro.com' },
                to: [{ name: 'Vous', address: 'user@example.com' }],
                cc: [],
                date: new Date(),
                body: 'Ceci est un email de démonstration. Connectez-vous avec votre compte Microsoft pour voir vos vrais emails.',
                source: 'demo',
                category: 'Demo',
                domain: 'emailsortpro.com',
                isDemo: true
            }
        ];
    }

    // NOUVELLE MÉTHODE: Vérification du statut de connexion
    async checkAuthenticationStatus() {
        if (!window.authService) {
            console.log('[MailService] AuthService not available');
            return false;
        }
        
        const isAuth = window.authService.isAuthenticated();
        console.log('[MailService] Authentication status:', isAuth);
        
        if (isAuth && !this.isInitialized) {
            console.log('[MailService] Auth available but not initialized, initializing...');
            await this.init();
        }
        
        return isAuth;
    }

    // Méthode publique pour forcer le mode réel
    enableRealMode() {
        console.log('[MailService] Forcing real email mode...');
        this.isTestMode = false;
        this.emails = [];
        
        // Vider le cache pour forcer une nouvelle récupération
        try {
            localStorage.removeItem('emailsort_cached_emails');
        } catch (error) {
            console.warn('[MailService] Could not clear cache:', error);
        }
    }

    // Informations de diagnostic
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isTestMode: this.isTestMode,
            emailCount: this.emails.length,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            authenticated: window.authService?.isAuthenticated() || false,
            domain: this.currentDomain
        };
    }
}

// Créer l'instance globale
try {
    window.mailService = new MailService();
    console.log('[MailService] ✅ Global instance created successfully');
} catch (error) {
    console.error('[MailService] ❌ Failed to create global instance:', error);
    
    // Instance de fallback
    window.mailService = {
        isInitialized: false,
        getEmails: () => Promise.resolve([]),
        scanEmailsForCategories: () => Promise.resolve({ success: false, message: 'Service non disponible', emails: [] }),
        checkAuthenticationStatus: () => Promise.resolve(false),
        enableRealMode: () => console.warn('[MailService] Service not available'),
        getStatus: () => ({ error: 'Service failed to initialize: ' + error.message })
    };
}

// Fonction globale de diagnostic
window.diagnoseMailService = function() {
    console.group('🔍 DIAGNOSTIC MAILSERVICE v6.1');
    try {
        const status = window.mailService.getStatus();
        console.log('📊 Status:', status);
        console.log('🔐 AuthService available:', !!window.authService);
        console.log('✅ Authenticated:', window.authService?.isAuthenticated() || false);
        
        if (window.authService?.isAuthenticated()) {
            console.log('🎯 Ready for real email access');
        } else {
            console.log('⚠️ Not authenticated - will use demo mode');
        }
        
        return status;
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    } finally {
        console.groupEnd();
    }
};

console.log('✅ MailService v6.1 loaded with REAL email support - No more demo mode by default');
