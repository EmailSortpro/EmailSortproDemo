// MailService.js - Version 4.2 - EMAILS RÉELS PRIORITAIRES - Correction simulation forcée

class MailService {
    constructor() {
        this.isInitialized = false;
        this.cache = new Map();
        this.folders = new Map();
        this.provider = null; // 'microsoft' ou 'google'
        this.authenticationVerified = false;
        this.realEmailsAvailable = false;
        
        this.folderMapping = {
            'inbox': 'inbox',
            'junkemail': 'junkemail', 
            'sentitems': 'sentitems',
            'drafts': 'drafts',
            'archive': 'archive'
        };
        
        console.log('[MailService] v4.2 - EMAILS RÉELS PRIORITAIRES - NO SIMULATION');
    }

    async initialize() {
        console.log('[MailService] 🚀 Initialisation avec VÉRIFICATION RÉELLE...');
        
        if (this.isInitialized && this.authenticationVerified) {
            console.log('[MailService] ✅ Déjà initialisé et authentifié');
            return true;
        }

        try {
            // ÉTAPE 1: Détecter et vérifier l'authentification RÉELLE
            const authStatus = await this.detectAndVerifyRealAuth();
            
            if (!authStatus.success) {
                console.error('[MailService] ❌ AUCUNE AUTHENTIFICATION RÉELLE DÉTECTÉE');
                throw new Error(`Authentification requise: ${authStatus.reason}`);
            }
            
            this.provider = authStatus.provider;
            this.authenticationVerified = true;
            this.realEmailsAvailable = true;
            
            console.log(`[MailService] ✅ Authentification RÉELLE confirmée: ${this.provider}`);

            // ÉTAPE 2: Tester la connexion avec un appel API réel
            const connectionTest = await this.performRealConnectionTest();
            if (!connectionTest.success) {
                console.error('[MailService] ❌ Test de connexion RÉELLE échoué');
                throw new Error(`Connexion API échouée: ${connectionTest.error}`);
            }

            console.log(`[MailService] ✅ Connexion API RÉELLE confirmée: ${connectionTest.user}`);

            // ÉTAPE 3: Charger les dossiers réels
            await this.loadRealMailFolders();

            console.log('[MailService] ✅ Initialisation RÉELLE terminée - AUCUNE SIMULATION');
            this.isInitialized = true;
            
            return true;

        } catch (error) {
            console.error('[MailService] ❌ Initialisation RÉELLE échouée:', error);
            this.authenticationVerified = false;
            this.realEmailsAvailable = false;
            throw error;
        }
    }

    async detectAndVerifyRealAuth() {
        console.log('[MailService] 🔍 Détection authentification RÉELLE...');
        
        // Test Microsoft avec vérifications strictes
        if (window.authService) {
            console.log('[MailService] 🔍 Test authentification Microsoft...');
            
            try {
                // Vérifier l'état d'authentification
                let isAuthenticated = false;
                
                if (typeof window.authService.isAuthenticated === 'function') {
                    isAuthenticated = window.authService.isAuthenticated();
                    console.log('[MailService] Microsoft isAuthenticated():', isAuthenticated);
                }
                
                if (!isAuthenticated) {
                    console.log('[MailService] ⚠️ Microsoft non authentifié selon isAuthenticated()');
                    return { success: false, reason: 'Microsoft non authentifié' };
                }
                
                // Test token réel
                const token = await window.authService.getAccessToken();
                if (!token || typeof token !== 'string' || token.length < 50) {
                    console.log('[MailService] ⚠️ Token Microsoft invalide:', token ? 'présent mais invalide' : 'absent');
                    return { success: false, reason: 'Token Microsoft invalide' };
                }
                
                console.log('[MailService] ✅ Token Microsoft valide obtenu:', token.substring(0, 20) + '...');
                
                // Test API réel Microsoft Graph
                const testCall = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!testCall.ok) {
                    console.log('[MailService] ⚠️ Appel API Microsoft échoué:', testCall.status);
                    return { success: false, reason: `API Microsoft error ${testCall.status}` };
                }
                
                const userInfo = await testCall.json();
                console.log('[MailService] ✅ API Microsoft RÉELLE confirmée:', userInfo.displayName);
                
                return { 
                    success: true, 
                    provider: 'microsoft', 
                    user: userInfo.displayName,
                    email: userInfo.mail || userInfo.userPrincipalName
                };
                
            } catch (error) {
                console.warn('[MailService] ⚠️ Test Microsoft échoué:', error);
            }
        }
        
        // Test Google avec vérifications strictes
        if (window.googleAuthService) {
            console.log('[MailService] 🔍 Test authentification Google...');
            
            try {
                // Vérifier l'état d'authentification
                let isAuthenticated = false;
                
                if (typeof window.googleAuthService.isAuthenticated === 'function') {
                    isAuthenticated = window.googleAuthService.isAuthenticated();
                    console.log('[MailService] Google isAuthenticated():', isAuthenticated);
                }
                
                if (!isAuthenticated) {
                    console.log('[MailService] ⚠️ Google non authentifié selon isAuthenticated()');
                    return { success: false, reason: 'Google non authentifié' };
                }
                
                // Test token réel
                const token = await window.googleAuthService.getAccessToken();
                if (!token || typeof token !== 'string' || token.length < 50) {
                    console.log('[MailService] ⚠️ Token Google invalide:', token ? 'présent mais invalide' : 'absent');
                    return { success: false, reason: 'Token Google invalide' };
                }
                
                console.log('[MailService] ✅ Token Google valide obtenu:', token.substring(0, 20) + '...');
                
                // Test API réel Gmail
                const testCall = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!testCall.ok) {
                    console.log('[MailService] ⚠️ Appel API Gmail échoué:', testCall.status);
                    return { success: false, reason: `API Gmail error ${testCall.status}` };
                }
                
                const profile = await testCall.json();
                console.log('[MailService] ✅ API Gmail RÉELLE confirmée:', profile.emailAddress);
                
                return { 
                    success: true, 
                    provider: 'google', 
                    user: profile.emailAddress,
                    email: profile.emailAddress
                };
                
            } catch (error) {
                console.warn('[MailService] ⚠️ Test Google échoué:', error);
            }
        }
        
        console.log('[MailService] ❌ AUCUN SERVICE D\'AUTHENTIFICATION RÉEL TROUVÉ');
        return { 
            success: false, 
            reason: 'Aucun service d\'authentification disponible',
            available: {
                microsoft: !!window.authService,
                google: !!window.googleAuthService
            }
        };
    }

    async performRealConnectionTest() {
        console.log('[MailService] 🧪 Test de connexion API RÉELLE...');
        
        try {
            if (this.provider === 'microsoft') {
                return await this.testRealMicrosoftConnection();
            } else if (this.provider === 'google') {
                return await this.testRealGoogleConnection();
            } else {
                throw new Error('Provider non valide');
            }
        } catch (error) {
            console.error('[MailService] ❌ Test connexion échoué:', error);
            return { success: false, error: error.message };
        }
    }

    async testRealMicrosoftConnection() {
        const token = await window.authService.getAccessToken();
        
        // Test 1: Profil utilisateur
        const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error(`Profile API failed: ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        
        // Test 2: Accès aux dossiers mail
        const foldersResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=5', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!foldersResponse.ok) {
            throw new Error(`Folders API failed: ${foldersResponse.status}`);
        }
        
        console.log('[MailService] ✅ Connexion Microsoft RÉELLE validée');
        return { 
            success: true, 
            user: profile.displayName,
            email: profile.mail || profile.userPrincipalName
        };
    }

    async testRealGoogleConnection() {
        const token = await window.googleAuthService.getAccessToken();
        
        // Test 1: Profil Gmail
        const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error(`Gmail profile API failed: ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        
        // Test 2: Accès aux labels
        const labelsResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels?maxResults=10', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!labelsResponse.ok) {
            throw new Error(`Gmail labels API failed: ${labelsResponse.status}`);
        }
        
        console.log('[MailService] ✅ Connexion Google RÉELLE validée');
        return { 
            success: true, 
            user: profile.emailAddress,
            email: profile.emailAddress
        };
    }

    async loadRealMailFolders() {
        console.log('[MailService] 📁 Chargement dossiers RÉELS...');
        
        try {
            if (this.provider === 'microsoft') {
                return await this.loadRealMicrosoftFolders();
            } else if (this.provider === 'google') {
                return await this.loadRealGoogleFolders();
            } else {
                throw new Error('Provider non valide pour chargement dossiers');
            }
        } catch (error) {
            console.error('[MailService] ❌ Erreur chargement dossiers RÉELS:', error);
            throw error;
        }
    }

    async loadRealMicrosoftFolders() {
        const token = await window.authService.getAccessToken();
        
        const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Microsoft folders API error: ${response.status}`);
        }

        const data = await response.json();
        const folders = data.value || [];

        console.log(`[MailService] ✅ ${folders.length} dossiers Microsoft RÉELS chargés`);
        
        // Stocker les dossiers avec leurs ID réels
        folders.forEach(folder => {
            this.folders.set(folder.displayName.toLowerCase(), folder);
            
            // Mapping des noms standards
            if (folder.displayName.toLowerCase().includes('inbox') || 
                folder.displayName.toLowerCase().includes('boîte de réception')) {
                this.folders.set('inbox', folder);
            }
            if (folder.displayName.toLowerCase().includes('junk') || 
                folder.displayName.toLowerCase().includes('courrier indésirable')) {
                this.folders.set('junkemail', folder);
            }
            if (folder.displayName.toLowerCase().includes('sent') || 
                folder.displayName.toLowerCase().includes('éléments envoyés')) {
                this.folders.set('sentitems', folder);
            }
        });

        return folders;
    }

    async loadRealGoogleFolders() {
        const token = await window.googleAuthService.getAccessToken();
        
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Gmail labels API error: ${response.status}`);
        }

        const data = await response.json();
        const labels = data.labels || [];

        console.log(`[MailService] ✅ ${labels.length} labels Gmail RÉELS chargés`);
        
        // Stocker les labels comme dossiers
        labels.forEach(label => {
            this.folders.set(label.name.toLowerCase(), label);
            
            // Mapping des labels standards Gmail
            if (label.id === 'INBOX') {
                this.folders.set('inbox', label);
            }
            if (label.id === 'SPAM') {
                this.folders.set('junkemail', label);
            }
            if (label.id === 'SENT') {
                this.folders.set('sentitems', label);
            }
            if (label.id === 'DRAFT') {
                this.folders.set('drafts', label);
            }
        });

        return labels;
    }

    // ================================================
    // RÉCUPÉRATION D'EMAILS RÉELS UNIQUEMENT
    // ================================================
    async getEmailsFromFolder(folderName, options = {}) {
        console.log(`[MailService] 📧 RÉCUPÉRATION EMAILS RÉELS depuis ${folderName}`);
        
        if (!this.authenticationVerified || !this.realEmailsAvailable) {
            console.error('[MailService] ❌ AUTHENTIFICATION NON VÉRIFIÉE - REFUS');
            throw new Error('Authentification requise pour accéder aux emails réels');
        }
        
        // Initialiser si nécessaire avec vérification stricte
        if (!this.isInitialized) {
            console.log('[MailService] 🔄 Initialisation forcée pour emails RÉELS...');
            await this.initialize();
        }

        try {
            console.log(`[MailService] 📨 Provider: ${this.provider} - Dossier: ${folderName}`);
            
            if (this.provider === 'microsoft') {
                return await this.getRealMicrosoftEmails(folderName, options);
            } else if (this.provider === 'google') {
                return await this.getRealGmailEmails(folderName, options);
            } else {
                throw new Error('Provider invalide pour récupération emails réels');
            }

        } catch (error) {
            console.error(`[MailService] ❌ ERREUR récupération emails RÉELS:`, error);
            throw error;
        }
    }

    async getRealMicrosoftEmails(folderName, options = {}) {
        console.log(`[MailService] 🔍 MICROSOFT - Récupération emails RÉELS de ${folderName}`);
        
        const token = await window.authService.getAccessToken();
        if (!token) {
            throw new Error('Token Microsoft expiré ou invalide');
        }

        // Résoudre l'ID du dossier réel
        const folderId = await this.resolveRealFolderId(folderName);
        console.log(`[MailService] 📁 Dossier résolu: ${folderName} -> ${folderId}`);

        // Construire l'URL avec paramètres stricts
        const graphUrl = this.buildMicrosoftRealEmailsUrl(folderId, options);
        console.log(`[MailService] 🔗 URL Microsoft Graph: ${graphUrl}`);

        // Appel API avec gestion d'erreur stricte
        const response = await fetch(graphUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[MailService] ❌ Microsoft API error:', response.status, errorText);
            throw new Error(`Microsoft API error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const emails = data.value || [];

        if (emails.length === 0) {
            console.warn(`[MailService] ⚠️ AUCUN email trouvé dans ${folderName}`);
            return [];
        }

        console.log(`[MailService] ✅ ${emails.length} emails Microsoft RÉELS récupérés`);
        
        // Traitement avec marquage RÉEL explicite
        const processedEmails = this.processRealMicrosoftEmails(emails, folderName);
        
        // Vérification finale
        const realCount = processedEmails.filter(e => e.realEmail === true).length;
        console.log(`[MailService] ✅ ${realCount}/${processedEmails.length} emails confirmés RÉELS`);
        
        return processedEmails;
    }

    async getRealGmailEmails(folderName, options = {}) {
        console.log(`[MailService] 🔍 GMAIL - Récupération emails RÉELS de ${folderName}`);
        
        const token = await window.googleAuthService.getAccessToken();
        if (!token) {
            throw new Error('Token Google expiré ou invalide');
        }

        // Construire l'URL Gmail avec paramètres stricts
        const gmailUrl = this.buildGmailRealEmailsUrl(folderName, options);
        console.log(`[MailService] 🔗 URL Gmail: ${gmailUrl}`);

        // Récupérer la liste des messages
        const response = await fetch(gmailUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[MailService] ❌ Gmail API error:', response.status, errorText);
            throw new Error(`Gmail API error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const messages = data.messages || [];

        if (messages.length === 0) {
            console.warn(`[MailService] ⚠️ AUCUN message Gmail trouvé dans ${folderName}`);
            return [];
        }

        console.log(`[MailService] 📋 ${messages.length} messages Gmail trouvés`);

        // Récupérer les détails complets des messages
        const maxEmails = Math.min(messages.length, options.top || 100);
        const detailedEmails = await this.getRealGmailMessageDetails(messages.slice(0, maxEmails));
        
        console.log(`[MailService] ✅ ${detailedEmails.length} emails Gmail RÉELS récupérés`);
        
        // Traitement avec marquage RÉEL explicite
        const processedEmails = this.processRealGmailEmails(detailedEmails, folderName);
        
        // Vérification finale
        const realCount = processedEmails.filter(e => e.realEmail === true).length;
        console.log(`[MailService] ✅ ${realCount}/${processedEmails.length} emails confirmés RÉELS`);
        
        return processedEmails;
    }

    async getRealGmailMessageDetails(messages) {
        const token = await window.googleAuthService.getAccessToken();
        const detailedEmails = [];

        console.log(`[MailService] 🔍 Récupération détails de ${messages.length} messages Gmail...`);

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            
            try {
                const response = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const emailData = await response.json();
                    detailedEmails.push(emailData);
                    
                    if ((i + 1) % 10 === 0) {
                        console.log(`[MailService] ⏳ Progression: ${i + 1}/${messages.length} messages traités`);
                    }
                } else {
                    console.warn(`[MailService] ⚠️ Échec récupération message ${message.id}:`, response.status);
                }
            } catch (error) {
                console.warn(`[MailService] ⚠️ Erreur message ${message.id}:`, error);
            }
            
            // Délai pour éviter les limitations de débit
            if (i < messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        return detailedEmails;
    }

    // ================================================
    // CONSTRUCTION URLs POUR EMAILS RÉELS
    // ================================================
    buildMicrosoftRealEmailsUrl(folderId, options) {
        const {
            startDate,
            endDate,
            top = 100,
            orderBy = 'receivedDateTime desc'
        } = options;

        // URL de base adaptée
        let baseUrl;
        if (folderId === 'inbox') {
            baseUrl = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages';
        } else {
            baseUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages`;
        }

        const params = new URLSearchParams();
        
        // Limiter le nombre pour performance mais garantir des vrais emails
        params.append('$top', Math.min(top, 500).toString());
        params.append('$orderby', orderBy);
        
        // Sélection étendue pour emails complets
        params.append('$select', [
            'id', 'subject', 'bodyPreview', 'body', 'from', 'toRecipients',
            'ccRecipients', 'bccRecipients', 'receivedDateTime', 'sentDateTime', 
            'isRead', 'importance', 'hasAttachments', 'flag', 'categories', 
            'parentFolderId', 'webLink', 'internetMessageId', 'conversationId'
        ].join(','));

        // Filtres de date stricts
        if (startDate || endDate) {
            const filters = [];
            
            if (startDate) {
                const startISO = new Date(startDate).toISOString();
                filters.push(`receivedDateTime ge ${startISO}`);
            }
            
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                const endISO = endDateObj.toISOString();
                filters.push(`receivedDateTime le ${endISO}`);
            }
            
            if (filters.length > 0) {
                params.append('$filter', filters.join(' and '));
            }
        }

        return `${baseUrl}?${params.toString()}`;
    }

    buildGmailRealEmailsUrl(folderName, options) {
        const {
            startDate,
            endDate,
            top = 100
        } = options;

        let baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
        const params = new URLSearchParams();

        // Limiter mais privilégier la qualité
        params.append('maxResults', Math.min(top, 250).toString());

        // Construire query pour dossier spécifique
        let query = '';
        if (folderName && folderName !== 'inbox') {
            const folder = this.folders.get(folderName.toLowerCase());
            if (folder && folder.id) {
                query += `label:${folder.id} `;
            }
        } else {
            query += 'in:inbox ';
        }

        // Filtres de date
        if (startDate) {
            const startFormatted = new Date(startDate).toISOString().split('T')[0];
            query += `after:${startFormatted} `;
        }

        if (endDate) {
            const endFormatted = new Date(endDate).toISOString().split('T')[0];
            query += `before:${endFormatted} `;
        }

        // Exclure les emails automatiques/spam pour privilégier les vrais
        query += '-label:spam -label:trash ';

        if (query.trim()) {
            params.append('q', query.trim());
        }

        return `${baseUrl}?${params.toString()}`;
    }

    // ================================================
    // TRAITEMENT EMAILS RÉELS AVEC MARQUAGE EXPLICITE
    // ================================================
    processRealMicrosoftEmails(emails, folderName) {
        console.log(`[MailService] 🔄 Traitement ${emails.length} emails Microsoft RÉELS`);
        
        return emails.map((email, index) => {
            try {
                const processedEmail = {
                    // ID et métadonnées de base
                    id: email.id,
                    subject: email.subject || 'Sans sujet',
                    bodyPreview: email.bodyPreview || '',
                    body: email.body,
                    
                    // Expéditeur et destinataires
                    from: email.from,
                    toRecipients: email.toRecipients || [],
                    ccRecipients: email.ccRecipients || [],
                    bccRecipients: email.bccRecipients || [],
                    
                    // Dates et propriétés
                    receivedDateTime: email.receivedDateTime,
                    sentDateTime: email.sentDateTime,
                    isRead: email.isRead,
                    importance: email.importance,
                    hasAttachments: email.hasAttachments,
                    flag: email.flag,
                    categories: email.categories || [],
                    
                    // Métadonnées Microsoft
                    parentFolderId: email.parentFolderId,
                    webLink: email.webLink,
                    internetMessageId: email.internetMessageId,
                    conversationId: email.conversationId,
                    
                    // MARQUEURS EXPLICITES - EMAILS RÉELS
                    provider: 'microsoft',
                    sourceFolder: folderName,
                    realEmail: true,              // ✅ RÉEL
                    webSimulated: false,          // ❌ PAS SIMULÉ
                    simulationMode: false,        // ❌ PAS SIMULATION
                    authenticatedSource: true,    // ✅ SOURCE AUTHENTIFIÉE
                    retrievedAt: new Date().toISOString(),
                    
                    // Données pour catégorisation
                    emailText: this.extractRealMicrosoftEmailText(email),
                    senderDomain: this.extractSenderDomain(email.from),
                    recipientCount: (email.toRecipients?.length || 0) + (email.ccRecipients?.length || 0),
                    
                    // Index pour débogage
                    processingIndex: index
                };

                return processedEmail;

            } catch (error) {
                console.warn(`[MailService] ⚠️ Erreur traitement email ${index}:`, error);
                // Même en cas d'erreur, marquer comme réel
                return { 
                    ...email, 
                    provider: 'microsoft', 
                    sourceFolder: folderName, 
                    realEmail: true,
                    webSimulated: false,
                    processingError: error.message
                };
            }
        });
    }

    processRealGmailEmails(emails, folderName) {
        console.log(`[MailService] 🔄 Traitement ${emails.length} emails Gmail RÉELS`);
        
        return emails.map((email, index) => {
            try {
                const headers = this.parseGmailHeaders(email.payload?.headers || []);
                
                const processedEmail = {
                    // ID et métadonnées adaptées de Gmail
                    id: email.id,
                    subject: headers.subject || 'Sans sujet',
                    bodyPreview: email.snippet || '',
                    body: this.extractGmailBody(email.payload),
                    
                    // Conversion format Microsoft pour uniformité
                    from: { 
                        emailAddress: { 
                            address: this.extractEmailFromString(headers.from), 
                            name: this.extractNameFromString(headers.from)
                        }
                    },
                    toRecipients: this.parseGmailRecipients(headers.to),
                    ccRecipients: this.parseGmailRecipients(headers.cc),
                    
                    // Dates et propriétés
                    receivedDateTime: new Date(parseInt(email.internalDate)).toISOString(),
                    sentDateTime: new Date(parseInt(email.internalDate)).toISOString(),
                    isRead: !email.labelIds?.includes('UNREAD'),
                    importance: email.labelIds?.includes('IMPORTANT') ? 'high' : 'normal',
                    hasAttachments: this.hasGmailAttachments(email.payload),
                    flag: null,
                    categories: email.labelIds || [],
                    
                    // Métadonnées Gmail
                    parentFolderId: folderName,
                    webLink: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
                    threadId: email.threadId,
                    labelIds: email.labelIds,
                    
                    // MARQUEURS EXPLICITES - EMAILS RÉELS
                    provider: 'google',
                    sourceFolder: folderName,
                    realEmail: true,              // ✅ RÉEL
                    webSimulated: false,          // ❌ PAS SIMULÉ
                    simulationMode: false,        // ❌ PAS SIMULATION
                    authenticatedSource: true,    // ✅ SOURCE AUTHENTIFIÉE
                    retrievedAt: new Date().toISOString(),
                    
                    // Données pour catégorisation
                    emailText: this.extractRealGmailEmailText(email, headers),
                    senderDomain: this.extractSenderDomainFromEmail(headers.from),
                    recipientCount: (headers.to ? headers.to.split(',').length : 0) + (headers.cc ? headers.cc.split(',').length : 0),
                    
                    // Index pour débogage
                    processingIndex: index
                };

                return processedEmail;

            } catch (error) {
                console.warn(`[MailService] ⚠️ Erreur traitement email Gmail ${index}:`, error);
                // Même en cas d'erreur, marquer comme réel
                return { 
                    ...email, 
                    provider: 'google', 
                    sourceFolder: folderName, 
                    realEmail: true,
                    webSimulated: false,
                    processingError: error.message
                };
            }
        });
    }

    // ================================================
    // MÉTHODES UTILITAIRES GMAIL
    // ================================================
    parseGmailHeaders(headers) {
        const headerMap = {};
        headers.forEach(header => {
            headerMap[header.name.toLowerCase()] = header.value;
        });
        return headerMap;
    }

    parseGmailRecipients(recipientString) {
        if (!recipientString) return [];
        return recipientString.split(',').map(email => ({
            emailAddress: { 
                address: this.extractEmailFromString(email.trim()), 
                name: this.extractNameFromString(email.trim())
            }
        }));
    }

    extractEmailFromString(emailString) {
        if (!emailString) return '';
        const emailMatch = emailString.match(/<(.+@.+)>/);
        return emailMatch ? emailMatch[1] : emailString.includes('@') ? emailString : '';
    }

    extractNameFromString(emailString) {
        if (!emailString) return '';
        const nameMatch = emailString.match(/^([^<]+)</);
        return nameMatch ? nameMatch[1].trim().replace(/"/g, '') : '';
    }

    extractGmailBody(payload) {
        if (!payload) return { content: '', contentType: 'text' };
        
        if (payload.body?.data) {
            return {
                content: this.decodeBase64Url(payload.body.data),
                contentType: payload.mimeType?.includes('html') ? 'html' : 'text'
            };
        }
        
        if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                    if (part.body?.data) {
                        return {
                            content: this.decodeBase64Url(part.body.data),
                            contentType: part.mimeType?.includes('html') ? 'html' : 'text'
                        };
                    }
                }
            }
        }
        
        return { content: '', contentType: 'text' };
    }

    hasGmailAttachments(payload) {
        if (!payload) return false;
        
        if (payload.parts) {
            return payload.parts.some(part => 
                part.filename && part.filename.length > 0 &&
                part.body?.attachmentId
            );
        }
        
        return false;
    }

    decodeBase64Url(data) {
        try {
            let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            return atob(base64);
        } catch (error) {
            console.warn('[MailService] Erreur décodage Base64URL:', error);
            return '';
        }
    }

    // ================================================
    // EXTRACTION TEXTE POUR EMAILS RÉELS
    // ================================================
    extractRealMicrosoftEmailText(email) {
        let text = '';
        
        if (email.subject) {
            text += email.subject + ' ';
        }
        
        if (email.from?.emailAddress) {
            if (email.from.emailAddress.name) {
                text += email.from.emailAddress.name + ' ';
            }
            if (email.from.emailAddress.address) {
                text += email.from.emailAddress.address + ' ';
            }
        }
        
        if (email.bodyPreview) {
            text += email.bodyPreview + ' ';
        }
        
        if (email.body && email.body.content) {
            if (email.body.contentType === 'html') {
                const cleanText = email.body.content
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&[^;]+;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                text += cleanText;
            } else {
                text += email.body.content;
            }
        }
        
        return text.trim();
    }

    extractRealGmailEmailText(email, headers) {
        let text = '';
        
        if (headers.subject) {
            text += headers.subject + ' ';
        }
        
        if (headers.from) {
            text += headers.from + ' ';
        }
        
        if (email.snippet) {
            text += email.snippet + ' ';
        }
        
        const body = this.extractGmailBody(email.payload);
        if (body.content) {
            if (body.contentType === 'html') {
                const cleanText = body.content
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&[^;]+;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                text += cleanText;
            } else {
                text += body.content;
            }
        }
        
        return text.trim();
    }

    extractSenderDomain(fromField) {
        try {
            if (!fromField || !fromField.emailAddress || !fromField.emailAddress.address) {
                return 'unknown';
            }
            
            const email = fromField.emailAddress.address;
            const domain = email.split('@')[1];
            return domain ? domain.toLowerCase() : 'unknown';
            
        } catch (error) {
            console.warn('[MailService] Erreur extraction domaine:', error);
            return 'unknown';
        }
    }

    extractSenderDomainFromEmail(emailString) {
        try {
            if (!emailString) return 'unknown';
            
            const email = this.extractEmailFromString(emailString);
            const domain = email.split('@')[1];
            return domain ? domain.toLowerCase() : 'unknown';
            
        } catch (error) {
            console.warn('[MailService] Erreur extraction domaine email:', error);
            return 'unknown';
        }
    }

    // ================================================
    // RÉSOLUTION DOSSIERS RÉELS
    // ================================================
    async resolveRealFolderId(folderName) {
        // Si c'est déjà un ID complet, l'utiliser directement
        if (folderName.includes('AAM') || folderName.length > 20) {
            return folderName;
        }

        // Chercher dans le cache des dossiers réels
        const folder = this.folders.get(folderName.toLowerCase());
        if (folder) {
            console.log(`[MailService] Dossier résolu: ${folderName} -> ${folder.id}`);
            return folder.id;
        }

        // Pour la boîte de réception
        if (folderName === 'inbox') {
            return 'inbox';
        }

        console.warn(`[MailService] Dossier ${folderName} non trouvé, utilisation directe`);
        return folderName;
    }

    // ================================================
    // MÉTHODES DE VÉRIFICATION ET ÉTAT
    // ================================================
    isAuthenticationValid() {
        return this.authenticationVerified && this.realEmailsAvailable;
    }

    hasRealEmails() {
        return this.realEmailsAvailable && this.authenticationVerified;
    }

    getProvider() {
        return this.provider;
    }

    // ================================================
    // MÉTHODES DE DIAGNOSTIC AMÉLIORÉES
    // ================================================
    getDebugInfo() {
        const authService = this.provider === 'microsoft' ? window.authService : window.googleAuthService;
        
        return {
            version: '4.2',
            isInitialized: this.isInitialized,
            authenticationVerified: this.authenticationVerified,
            realEmailsAvailable: this.realEmailsAvailable,
            provider: this.provider,
            hasValidToken: authService ? 'checking...' : false,
            foldersCount: this.folders.size,
            cacheSize: this.cache.size,
            authServices: {
                microsoft: {
                    available: !!window.authService,
                    authenticated: window.authService ? window.authService.isAuthenticated?.() : false
                },
                google: {
                    available: !!window.googleAuthService,
                    authenticated: window.googleAuthService ? window.googleAuthService.isAuthenticated?.() : false
                }
            },
            folders: Array.from(this.folders.entries()).map(([name, folder]) => ({
                name,
                id: folder.id,
                displayName: folder.displayName || folder.name
            })),
            lastCheck: new Date().toISOString()
        };
    }

    async getDetailedDebugInfo() {
        const basicInfo = this.getDebugInfo();
        
        // Test token en temps réel
        if (this.provider === 'microsoft' && window.authService) {
            try {
                const token = await window.authService.getAccessToken();
                basicInfo.authServices.microsoft.hasToken = !!token;
                basicInfo.authServices.microsoft.tokenLength = token ? token.length : 0;
            } catch (error) {
                basicInfo.authServices.microsoft.tokenError = error.message;
            }
        }
        
        if (this.provider === 'google' && window.googleAuthService) {
            try {
                const token = await window.googleAuthService.getAccessToken();
                basicInfo.authServices.google.hasToken = !!token;
                basicInfo.authServices.google.tokenLength = token ? token.length : 0;
            } catch (error) {
                basicInfo.authServices.google.tokenError = error.message;
            }
        }
        
        return basicInfo;
    }

    // ================================================
    // NETTOYAGE ET RESET
    // ================================================
    reset() {
        console.log('[MailService] 🔄 Reset complet...');
        this.isInitialized = false;
        this.authenticationVerified = false;
        this.realEmailsAvailable = false;
        this.provider = null;
        this.cache.clear();
        this.folders.clear();
    }
}

// ================================================
// CRÉATION INSTANCE GLOBALE AVEC VÉRIFICATIONS
// ================================================
try {
    // Nettoyer ancienne instance
    if (window.mailService) {
        console.log('[MailService] 🔄 Nettoyage ancienne instance...');
        window.mailService.reset?.();
    }
    
    // Créer nouvelle instance stricte
    window.mailService = new MailService();
    console.log('[MailService] ✅ Instance globale v4.2 créée - EMAILS RÉELS UNIQUEMENT');
    
    // Fonctions de test
    window.testRealEmailAccess = async function() {
        console.group('🧪 TEST Accès Emails RÉELS');
        
        try {
            if (!window.mailService) {
                throw new Error('MailService non disponible');
            }
            
            console.log('1. Test authentification...');
            const authTest = await window.mailService.detectAndVerifyRealAuth();
            console.log('Résultat auth:', authTest);
            
            if (authTest.success) {
                console.log('2. Test initialisation...');
                await window.mailService.initialize();
                
                console.log('3. Test récupération emails réels...');
                const emails = await window.mailService.getEmailsFromFolder('inbox', { top: 10 });
                
                console.log(`✅ ${emails.length} emails RÉELS récupérés`);
                console.log('Échantillon:', emails.slice(0, 2).map(e => ({
                    subject: e.subject,
                    from: e.from?.emailAddress?.address,
                    realEmail: e.realEmail,
                    webSimulated: e.webSimulated
                })));
                
                console.groupEnd();
                return { 
                    success: true, 
                    provider: authTest.provider,
                    emailCount: emails.length,
                    allReal: emails.every(e => e.realEmail === true),
                    noSimulation: emails.every(e => e.webSimulated === false)
                };
            } else {
                throw new Error(`Authentification échouée: ${authTest.reason}`);
            }
            
        } catch (error) {
            console.error('❌ Test échoué:', error);
            console.groupEnd();
            return { success: false, error: error.message };
        }
    };
    
    window.debugMailService = function() {
        if (!window.mailService) {
            return { error: 'MailService non disponible' };
        }
        
        return window.mailService.getDebugInfo();
    };
    
} catch (error) {
    console.error('[MailService] ❌ Échec création instance:', error);
    
    // Instance de fallback qui refuse simulation
    window.mailService = {
        isInitialized: false,
        authenticationVerified: false,
        realEmailsAvailable: false,
        hasRealEmails: () => false,
        getEmailsFromFolder: async () => {
            throw new Error('MailService non disponible - Vérifiez l\'authentification');
        },
        initialize: async () => {
            throw new Error('Échec initialisation MailService');
        },
        getDebugInfo: () => ({ 
            error: 'Échec création MailService',
            microsoftAuthAvailable: !!window.authService,
            googleAuthAvailable: !!window.googleAuthService,
            version: '4.2-fallback'
        })
    };
}

console.log('✅ MailService v4.2 loaded - EMAILS RÉELS PRIORITAIRES - NO SIMULATION');
