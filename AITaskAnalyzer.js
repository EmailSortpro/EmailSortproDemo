// AITaskAnalyzer.js - Module d'analyse IA avec solution CORS

class AITaskAnalyzer {
    constructor() {
        // Configuration pour l'API Claude via proxy
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-haiku-20240307';
        this.maxTokens = 4096;
        
        // Solutions pour contourner CORS
        this.corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://proxy.cors.sh/'
        ];
        
        // Configuration du proxy local (recommandé)
        this.localProxyUrl = 'http://localhost:3001/api/claude';
        this.useLocalProxy = true;
        
        // Clé API
        this.apiKey = localStorage.getItem('claude_api_key') || '';
        
        // Mode de fonctionnement
        this.mode = 'hybrid'; // 'api-only', 'local-only', 'hybrid'
        this.apiAvailable = false;
        this.lastApiTest = null;
        
        // Templates de prompts optimisés
        this.promptTemplates = {
            emailAnalysis: `Tu es un assistant expert en gestion d'emails et de tâches. Analyse cet email en détail et fournis une réponse structurée.

Email de: {sender}
Sujet: {subject}
Date: {date}
Contenu: {content}

INSTRUCTIONS IMPORTANTES:
1. Identifie TOUS les endroits dans l'email où une action est attendue et mets-les en évidence
2. Fournis des suggestions de réponses adaptées au contexte
3. Analyse le ton et l'urgence de l'email
4. Inclus TOUTES les informations de l'email dans la tâche principale

Fournis une analyse complète au format JSON avec:

{
  "summary": "Résumé exécutif en 2-3 phrases...",
  "importance": "urgent|high|medium|low",
  "actionsHighlighted": [
    {
      "action": "Description de l'action requise",
      "location": "Ligne X ou 'Dans le paragraphe Y'",
      "excerpt": "Citation exacte du passage",
      "deadline": "YYYY-MM-DD ou null"
    }
  ],
  "mainTask": {
    "title": "Titre de la tâche principale",
    "priority": "urgent|high|medium|low",
    "dueDate": "YYYY-MM-DD ou null",
    "description": "Description détaillée incluant TOUT le contexte de l'email..."
  },
  "subtasks": [
    {"title": "Sous-tâche 1", "priority": "medium"},
    {"title": "Sous-tâche 2", "priority": "low"}
  ],
  "actionPoints": [
    "Action 1 à entreprendre (Ligne X)",
    "Action 2 à réaliser (Paragraphe Y)"
  ],
  "suggestedReplies": [
    {
      "tone": "formel|informel|neutre",
      "subject": "Re: ...",
      "content": "Texte complet de la réponse suggérée..."
    }
  ],
  "insights": {
    "keyInfo": ["Info importante 1", "Info importante 2"],
    "risks": ["Risque identifié"],
    "opportunities": ["Opportunité détectée"],
    "emailTone": "formel|urgent|amical|neutre",
    "responseExpected": true,
    "attachments": ["Liste des pièces jointes mentionnées"],
    "contacts": ["Contacts et numéros mentionnés"],
    "links": ["Liens importants dans l'email"]
  },
  "importantExcerpts": [
    {
      "text": "Citation exacte du passage important",
      "context": "Pourquoi c'est important",
      "actionRequired": true
    }
  ],
  "emailMetadata": {
    "sender": "{sender}",
    "senderEmail": "{senderEmail}",
    "subject": "{subject}",
    "date": "{date}",
    "hasAttachments": false,
    "fullContent": "{content}"
  },
  "category": "finance|meeting|urgent|tasks|security|client|important|other",
  "suggestedDeadline": "YYYY-MM-DD ou null",
  "tags": ["tag1", "tag2", "tag3"]
}`
        };
        
        // Patterns d'analyse locale améliorés
        this.analysisPatterns = {
            actions: [
                { regex: /merci de (.+)/gi, type: 'request', weight: 3 },
                { regex: /veuillez (.+)/gi, type: 'request', weight: 3 },
                { regex: /pourriez-vous (.+)/gi, type: 'question', weight: 2 },
                { regex: /pouvez-vous (.+)/gi, type: 'question', weight: 2 },
                { regex: /please (.+)/gi, type: 'request', weight: 3 },
                { regex: /could you (.+)/gi, type: 'question', weight: 2 },
                { regex: /can you (.+)/gi, type: 'question', weight: 2 },
                { regex: /would you (.+)/gi, type: 'question', weight: 2 },
                { regex: /il faut (.+)/gi, type: 'requirement', weight: 3 },
                { regex: /nous devons (.+)/gi, type: 'requirement', weight: 3 },
                { regex: /we need to (.+)/gi, type: 'requirement', weight: 3 },
                { regex: /we must (.+)/gi, type: 'requirement', weight: 3 },
                { regex: /à faire\s*:?\s*(.+)/gi, type: 'todo', weight: 4 },
                { regex: /to do\s*:?\s*(.+)/gi, type: 'todo', weight: 4 },
                { regex: /action requise\s*:?\s*(.+)/gi, type: 'action', weight: 4 },
                { regex: /action required\s*:?\s*(.+)/gi, type: 'action', weight: 4 },
                { regex: /deadline\s*:?\s*(.+)/gi, type: 'deadline', weight: 5 },
                { regex: /due date\s*:?\s*(.+)/gi, type: 'deadline', weight: 5 },
                { regex: /avant le (.+)/gi, type: 'deadline', weight: 4 },
                { regex: /by (.+)/gi, type: 'deadline', weight: 4 },
                { regex: /before (.+)/gi, type: 'deadline', weight: 4 },
                { regex: /d'ici (.+)/gi, type: 'deadline', weight: 4 },
                { regex: /confirmer (.+)/gi, type: 'confirm', weight: 2 },
                { regex: /confirm (.+)/gi, type: 'confirm', weight: 2 },
                { regex: /valider (.+)/gi, type: 'validate', weight: 2 },
                { regex: /validate (.+)/gi, type: 'validate', weight: 2 },
                { regex: /envoyer (.+)/gi, type: 'send', weight: 2 },
                { regex: /send (.+)/gi, type: 'send', weight: 2 },
                { regex: /préparer (.+)/gi, type: 'prepare', weight: 2 },
                { regex: /prepare (.+)/gi, type: 'prepare', weight: 2 },
                { regex: /organiser (.+)/gi, type: 'organize', weight: 2 },
                { regex: /organize (.+)/gi, type: 'organize', weight: 2 },
                { regex: /schedule (.+)/gi, type: 'schedule', weight: 2 },
                { regex: /planifier (.+)/gi, type: 'schedule', weight: 2 },
                { regex: /répondre (.+)/gi, type: 'reply', weight: 2 },
                { regex: /reply (.+)/gi, type: 'reply', weight: 2 },
                { regex: /respond (.+)/gi, type: 'reply', weight: 2 },
                { regex: /examiner (.+)/gi, type: 'review', weight: 2 },
                { regex: /review (.+)/gi, type: 'review', weight: 2 },
                { regex: /vérifier (.+)/gi, type: 'check', weight: 2 },
                { regex: /check (.+)/gi, type: 'check', weight: 2 },
                { regex: /mettre à jour (.+)/gi, type: 'update', weight: 3 },
                { regex: /update (.+)/gi, type: 'update', weight: 3 },
                { regex: /compléter (.+)/gi, type: 'complete', weight: 3 },
                { regex: /complete (.+)/gi, type: 'complete', weight: 3 },
                { regex: /finaliser (.+)/gi, type: 'finalize', weight: 3 },
                { regex: /finalize (.+)/gi, type: 'finalize', weight: 3 }
            ],
            urgency: [
                { regex: /urgent/gi, weight: 10 },
                { regex: /asap/gi, weight: 10 },
                { regex: /immédiat/gi, weight: 10 },
                { regex: /immediate/gi, weight: 10 },
                { regex: /critique/gi, weight: 8 },
                { regex: /critical/gi, weight: 8 },
                { regex: /important/gi, weight: 6 },
                { regex: /priorité/gi, weight: 6 },
                { regex: /priority/gi, weight: 6 },
                { regex: /aujourd'hui/gi, weight: 8 },
                { regex: /today/gi, weight: 8 },
                { regex: /ce soir/gi, weight: 8 },
                { regex: /tonight/gi, weight: 8 },
                { regex: /demain/gi, weight: 5 },
                { regex: /tomorrow/gi, weight: 5 },
                { regex: /cette semaine/gi, weight: 3 },
                { regex: /this week/gi, weight: 3 },
                { regex: /dès que possible/gi, weight: 7 },
                { regex: /as soon as possible/gi, weight: 7 },
                { regex: /au plus vite/gi, weight: 7 },
                { regex: /rapidement/gi, weight: 5 },
                { regex: /quickly/gi, weight: 5 },
                { regex: /délai/gi, weight: 6 },
                { regex: /échéance/gi, weight: 7 },
                { regex: /deadline/gi, weight: 8 }
            ]
        };
        
        // Cache des analyses
        this.analysisCache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Initialisation
        this.init();
    }

    async init() {
        console.log('[AITaskAnalyzer] Initializing with CORS solutions');
        
        // Vérifier si une clé API est stockée
        if (this.apiKey) {
            console.log('[AITaskAnalyzer] API key found, will attempt API calls when requested');
            this.apiAvailable = true;
        } else {
            console.log('[AITaskAnalyzer] No API key configured, using local analysis only');
        }
    }

    isConfigured() {
        return true; // Toujours true car on a le fallback local
    }

    // Analyser un email avec stratégie hybride
    async analyzeEmailForTasks(email, options = {}) {
        console.log('[AITaskAnalyzer] Starting analysis for:', email.subject);
        
        // Vérifier le cache
        const cacheKey = `analysis_${email.id}`;
        const cached = this.getFromCache(cacheKey);
        if (cached && !options.forceRefresh) {
            console.log('[AITaskAnalyzer] Returning cached analysis');
            return cached;
        }

        try {
            let analysis;
            
            // Si l'API est demandée et qu'on a une clé
            if (options.useApi && this.apiKey) {
                try {
                    console.log('[AITaskAnalyzer] Attempting API analysis with CORS solutions');
                    analysis = await this.analyzeWithCORSSolution(email);
                } catch (apiError) {
                    console.log('[AITaskAnalyzer] API failed, falling back to local:', apiError.message);
                    analysis = await this.performEnhancedLocalAnalysis(email);
                }
            } else {
                // Utiliser l'analyse locale par défaut
                analysis = await this.performEnhancedLocalAnalysis(email);
            }
            
            // Enrichir l'analyse avec les métadonnées de l'email
            analysis.emailId = email.id;
            analysis.analyzedAt = new Date().toISOString();
            analysis.emailMetadata = {
                sender: email.from?.emailAddress?.name || 'Unknown',
                senderEmail: email.from?.emailAddress?.address || '',
                subject: email.subject || 'No subject',
                date: email.receivedDateTime,
                hasAttachments: email.hasAttachments || false,
                fullContent: this.extractEmailContent(email),
                webLink: email.webLink || null
            };
            
            // Mettre en cache
            this.setCache(cacheKey, analysis);
            
            return analysis;

        } catch (error) {
            console.error('[AITaskAnalyzer] Analysis error:', error);
            // Retourner une analyse basique en cas d'erreur
            return this.createBasicAnalysis(email);
        }
    }

    // Analyser avec solutions CORS
    async analyzeWithCORSSolution(email) {
        // 1. Essayer d'abord le proxy local s'il est configuré
        if (this.useLocalProxy && this.localProxyUrl) {
            try {
                return await this.analyzeWithLocalProxy(email);
            } catch (error) {
                console.log('[AITaskAnalyzer] Local proxy failed:', error.message);
            }
        }

        // 2. Essayer les proxies CORS publics
        for (const proxyUrl of this.corsProxies) {
            try {
                return await this.analyzeWithCORSProxy(email, proxyUrl);
            } catch (error) {
                console.log(`[AITaskAnalyzer] CORS proxy ${proxyUrl} failed:`, error.message);
            }
        }

        // 3. Essayer une requête directe (peut échouer avec CORS)
        try {
            return await this.analyzeDirectAPI(email);
        } catch (error) {
            console.log('[AITaskAnalyzer] Direct API failed:', error.message);
            throw new Error('All API methods failed');
        }
    }

    // Analyser avec un proxy local
    async analyzeWithLocalProxy(email) {
        const prompt = this.buildPrompt(email);

        const response = await fetch(this.localProxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: this.apiKey,
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3,
                system: "Tu es un assistant expert en productivité et gestion des emails. Tu analyses les emails pour extraire les tâches, deadlines et actions importantes. Tu identifies précisément où les actions sont demandées et suggères des réponses appropriées. Tu réponds toujours en français avec des suggestions précises et actionnables. Tu dois TOUJOURS inclure tout le contenu de l'email dans tes analyses."
            })
        });

        if (!response.ok) {
            throw new Error(`Local proxy error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = this.parseClaudeResponse(data);
        
        // Marquer comme analyse Claude
        analysis.method = 'claude-api-local-proxy';
        analysis.confidence = 0.95;
        
        return analysis;
    }

    // Analyser avec un proxy CORS public
    async analyzeWithCORSProxy(email, proxyUrl) {
        const prompt = this.buildPrompt(email);
        const targetUrl = encodeURIComponent(this.apiUrl);

        const response = await fetch(proxyUrl + targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3,
                system: "Tu es un assistant expert en productivité. Analyse les emails et fournis des réponses structurées en JSON."
            })
        });

        if (!response.ok) {
            throw new Error(`CORS proxy error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = this.parseClaudeResponse(data);
        
        analysis.method = 'claude-api-cors-proxy';
        analysis.confidence = 0.90;
        
        return analysis;
    }

    // Requête directe à l'API (peut échouer avec CORS)
    async analyzeDirectAPI(email) {
        const prompt = this.buildPrompt(email);

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = this.parseClaudeResponse(data);
        
        analysis.method = 'claude-api-direct';
        analysis.confidence = 0.95;
        
        return analysis;
    }

    // Construire le prompt pour Claude
    buildPrompt(email) {
        const content = this.extractEmailContent(email);
        const sender = email.from?.emailAddress?.name || 'Unknown';
        const senderEmail = email.from?.emailAddress?.address || '';
        const subject = email.subject || 'No subject';
        const date = new Date(email.receivedDateTime).toLocaleString('fr-FR');

        return this.promptTemplates.emailAnalysis
            .replace('{sender}', sender)
            .replace('{senderEmail}', senderEmail)
            .replace('{subject}', subject)
            .replace('{date}', date)
            .replace(/{content}/g, content);
    }

    // Parser la réponse de Claude
    parseClaudeResponse(response) {
        try {
            let jsonContent;
            
            // Gérer différents formats de réponse
            if (typeof response === 'object' && response.content) {
                if (Array.isArray(response.content)) {
                    jsonContent = response.content[0]?.text || '';
                } else {
                    jsonContent = response.content;
                }
            } else if (typeof response === 'string') {
                jsonContent = response;
            } else {
                jsonContent = JSON.stringify(response);
            }
            
            // Extraire le JSON de la réponse
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Claude response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Valider et formater la réponse
            return this.validateAndFormatAnalysis(parsed);
            
        } catch (error) {
            console.error('[AITaskAnalyzer] Parse error:', error);
            console.log('[AITaskAnalyzer] Raw response:', response);
            
            // Créer une analyse basique à partir du texte
            return this.createAnalysisFromText(response);
        }
    }

    // Valider et formater l'analyse
    validateAndFormatAnalysis(parsed) {
        return {
            summary: parsed.summary || 'Email analysé par Claude AI',
            importance: this.validatePriority(parsed.importance),
            actionsHighlighted: Array.isArray(parsed.actionsHighlighted) ? parsed.actionsHighlighted : [],
            mainTask: {
                title: parsed.mainTask?.title || 'Traiter cet email',
                priority: this.validatePriority(parsed.mainTask?.priority),
                dueDate: this.validateDate(parsed.mainTask?.dueDate),
                description: parsed.mainTask?.description || parsed.summary
            },
            subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.slice(0, 3) : [],
            actionPoints: Array.isArray(parsed.actionPoints) ? parsed.actionPoints : [],
            suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies : [],
            insights: {
                keyInfo: parsed.insights?.keyInfo || [],
                risks: parsed.insights?.risks || [],
                opportunities: parsed.insights?.opportunities || [],
                emailTone: parsed.insights?.emailTone || 'neutre',
                responseExpected: parsed.insights?.responseExpected !== false,
                attachments: parsed.insights?.attachments || [],
                contacts: parsed.insights?.contacts || [],
                links: parsed.insights?.links || []
            },
            importantExcerpts: Array.isArray(parsed.importantExcerpts) ? parsed.importantExcerpts : [],
            emailMetadata: parsed.emailMetadata || {},
            category: parsed.category || 'other',
            suggestedDeadline: this.validateDate(parsed.suggestedDeadline),
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : []
        };
    }

    // Analyse locale améliorée (fallback)
    async performEnhancedLocalAnalysis(email) {
        const subject = email.subject || '';
        const content = this.extractEmailContent(email);
        const sender = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown';
        const senderEmail = email.from?.emailAddress?.address || '';
        const fullText = (subject + ' ' + content).toLowerCase();
        
        // 1. Extraire toutes les actions et informations importantes
        const extractedActions = this.extractDetailedActions(content);
        const urgencyScore = this.calculateUrgencyScore(fullText, subject);
        const category = this.detectCategory(fullText, senderEmail);
        const extractedDates = this.extractAllDates(fullText);
        const keyPhrases = this.extractKeyPhrases(fullText);
        const attachments = this.extractAttachments(content);
        const contacts = this.extractContacts(content);
        const links = this.extractLinks(content);
        
        // 2. Générer un résumé intelligent
        const summary = this.generateIntelligentSummary(subject, content, extractedActions, urgencyScore);
        
        // 3. Déterminer l'importance
        const importance = urgencyScore > 70 ? 'urgent' : 
                          urgencyScore > 50 ? 'high' : 
                          urgencyScore > 30 ? 'medium' : 'low';
        
        // 4. Identifier et mettre en évidence les actions
        const actionsHighlighted = this.highlightDetailedActions(content, extractedActions);
        
        // 5. Créer la tâche principale avec TOUT le contenu
        const mainTask = this.createEnhancedMainTask(email, subject, content, sender, importance, extractedDates[0]);
        
        // 6. Générer des sous-tâches intelligentes
        const subtasks = this.generateIntelligentSubtasks(extractedActions, category);
        
        // 7. Points d'action détaillés
        const actionPoints = this.generateDetailedActionPoints(extractedActions, content);
        
        // 8. Générer des suggestions de réponse contextuelles
        const suggestedReplies = this.generateContextualReplies(email, category, urgencyScore, extractedActions);
        
        // 9. Extraire les insights
        const insights = this.extractDetailedInsights(content, category, urgencyScore, extractedActions, attachments, contacts, links);
        
        // 10. Extraire les passages importants
        const importantExcerpts = this.extractImportantPassages(content, extractedActions);
        
        // 11. Suggérer une deadline appropriée
        const suggestedDeadline = extractedDates[0] || this.suggestAppropriateDeadline(urgencyScore, category);
        
        // 12. Générer des tags pertinents
        const tags = this.generateRelevantTags(email, category, keyPhrases, sender);
        
        return {
            summary: summary,
            importance: importance,
            actionsHighlighted: actionsHighlighted,
            mainTask: mainTask,
            subtasks: subtasks,
            actionPoints: actionPoints,
            suggestedReplies: suggestedReplies,
            insights: insights,
            importantExcerpts: importantExcerpts,
            category: category,
            suggestedDeadline: suggestedDeadline,
            tags: tags,
            method: 'local-enhanced',
            confidence: this.calculateConfidence(extractedActions, urgencyScore)
        };
    }

    // Créer une tâche principale enrichie avec tout le contenu
    createEnhancedMainTask(email, subject, content, sender, priority, dueDate) {
        let title = subject.replace(/^(re|tr|fwd?):\s*/i, '').trim();
        
        if (title.length < 10 || /^(hello|bonjour|urgent|important|update|mise à jour)$/i.test(title)) {
            const actionMatch = content.match(/merci de .+|veuillez .+|il faut .+|à faire .+/i);
            if (actionMatch) {
                title = actionMatch[0].substring(0, 80);
            } else {
                title = `Traiter l'email de ${sender}`;
            }
        }
        
        // Créer une description complète incluant TOUT le contenu de l'email
        let fullDescription = `📧 Email de: ${sender}\n`;
        fullDescription += `📅 Date: ${new Date(email.receivedDateTime).toLocaleString('fr-FR')}\n`;
        fullDescription += `📋 Sujet: ${subject}\n\n`;
        fullDescription += `📝 CONTENU COMPLET DE L'EMAIL:\n`;
        fullDescription += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        fullDescription += content;
        fullDescription += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Ajouter les pièces jointes si présentes
        if (email.hasAttachments) {
            fullDescription += `📎 Pièces jointes: Oui\n\n`;
        }
        
        // Ajouter un résumé des actions
        const sentences = content.split(/[.!?]+/)
            .filter(s => s.trim().length > 20)
            .slice(0, 3);
        
        if (sentences.length > 0) {
            fullDescription += `📌 RÉSUMÉ DES POINTS CLÉS:\n`;
            sentences.forEach(s => {
                fullDescription += `• ${s.trim()}\n`;
            });
        }
        
        return {
            title: title.substring(0, 100),
            priority: priority,
            dueDate: dueDate,
            description: fullDescription,
            emailId: email.id,
            emailSubject: subject,
            emailSender: sender,
            emailDate: email.receivedDateTime,
            hasFullContent: true
        };
    }

    // Extraire les pièces jointes
    extractAttachments(content) {
        const attachments = [];
        const patterns = [
            /pièce[s]? jointe[s]?/gi,
            /document[s]? joint[s]?/gi,
            /ci-joint/gi,
            /attachment[s]?/gi,
            /attached/gi,
            /fichier[s]? joint[s]?/gi
        ];
        
        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                attachments.push('Documents mentionnés dans l\'email');
            }
        });
        
        return [...new Set(attachments)];
    }

    // Extraire les contacts
    extractContacts(content) {
        const contacts = [];
        
        // Patterns pour les emails
        const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
        const emails = content.match(emailPattern) || [];
        emails.forEach(email => contacts.push(`Email: ${email}`));
        
        // Patterns pour les téléphones
        const phonePatterns = [
            /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
            /\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2}/g
        ];
        
        phonePatterns.forEach(pattern => {
            const phones = content.match(pattern) || [];
            phones.forEach(phone => {
                if (phone.length >= 10) {
                    contacts.push(`Tél: ${phone}`);
                }
            });
        });
        
        return [...new Set(contacts)];
    }

    // Extraire les liens
    extractLinks(content) {
        const links = [];
        const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        const urls = content.match(urlPattern) || [];
        
        urls.forEach(url => {
            links.push(url);
        });
        
        return [...new Set(links)];
    }

    // Extraire des insights détaillés enrichis
    extractDetailedInsights(content, category, urgencyScore, actions, attachments, contacts, links) {
        const insights = {
            keyInfo: [],
            risks: [],
            opportunities: [],
            emailTone: 'neutre',
            responseExpected: true,
            attachments: attachments,
            contacts: contacts,
            links: links
        };
        
        // Détecter le ton de l'email
        if (urgencyScore > 70 || /urgent|critique|immédiat/i.test(content)) {
            insights.emailTone = 'urgent';
        } else if (/cordialement|sincèrement|respectueusement/i.test(content)) {
            insights.emailTone = 'formel';
        } else if (/salut|coucou|bisous|à\+/i.test(content)) {
            insights.emailTone = 'amical';
        }
        
        // Extraire les informations clés
        const keyPatterns = [
            { regex: /date\s*:\s*([^\n]+)/gi, type: 'Date' },
            { regex: /heure\s*:\s*([^\n]+)/gi, type: 'Heure' },
            { regex: /lieu\s*:\s*([^\n]+)/gi, type: 'Lieu' },
            { regex: /montant\s*:\s*([^\n]+)/gi, type: 'Montant' },
            { regex: /référence\s*:\s*([^\n]+)/gi, type: 'Référence' },
            { regex: /contact\s*:\s*([^\n]+)/gi, type: 'Contact' },
            { regex: /téléphone\s*:\s*([^\n]+)/gi, type: 'Téléphone' },
            { regex: /email\s*:\s*([^\n]+)/gi, type: 'Email' },
            { regex: /adresse\s*:\s*([^\n]+)/gi, type: 'Adresse' },
            { regex: /numéro\s*:\s*([^\n]+)/gi, type: 'Numéro' }
        ];
        
        keyPatterns.forEach(pattern => {
            const matches = content.match(pattern.regex);
            if (matches) {
                matches.forEach(match => {
                    insights.keyInfo.push(`${pattern.type}: ${match.replace(pattern.regex, '$1').trim()}`);
                });
            }
        });
        
        // Identifier les risques
        if (urgencyScore > 60 || actions.some(a => a.type === 'deadline')) {
            insights.risks.push('Délai serré ou échéance proche');
        }
        if (/problème|issue|erreur|bug|incident|retard/i.test(content)) {
            insights.risks.push('Problème ou incident mentionné');
        }
        if (/budget|coût|surcoût|dépassement/i.test(content)) {
            insights.risks.push('Impact budgétaire potentiel');
        }
        if (/confidentiel|secret|privé|ne pas divulguer/i.test(content)) {
            insights.risks.push('Information confidentielle');
        }
        
        // Identifier les opportunités
        if (/opportunité|opportunity|nouveau|croissance|expansion/i.test(content)) {
            insights.opportunities.push('Nouvelle opportunité d\'affaires');
        }
        if (/partenariat|collaboration|synergie/i.test(content)) {
            insights.opportunities.push('Possibilité de collaboration');
        }
        if (/amélioration|optimisation|gain/i.test(content)) {
            insights.opportunities.push('Potentiel d\'amélioration');
        }
        
        insights.responseExpected = actions.length > 0 || 
            /répondre|reply|merci de|veuillez|pourriez-vous|svp|s'il vous plaît|please/i.test(content);
        
        return insights;
    }

    // Autres méthodes existantes...
    extractDetailedActions(content) {
        const actions = [];
        const lines = content.split(/[\n.!?]+/);
        
        lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (trimmedLine.length < 10) return;
            
            this.analysisPatterns.actions.forEach(pattern => {
                const matches = trimmedLine.match(pattern.regex);
                if (matches) {
                    matches.forEach(match => {
                        const actionText = match.replace(pattern.regex, '$1').trim();
                        if (actionText.length > 5) {
                            actions.push({
                                text: actionText,
                                type: pattern.type,
                                weight: pattern.weight,
                                line: lineIndex + 1,
                                fullMatch: match,
                                context: trimmedLine
                            });
                        }
                    });
                }
            });
        });
        
        return actions
            .sort((a, b) => b.weight - a.weight)
            .filter((action, index, self) => 
                index === self.findIndex(a => a.text === action.text)
            );
    }

    // Configuration et autres méthodes utilitaires
    showConfigurationModal() {
        const content = `
            <div class="ai-config-modal">
                <div class="ai-config-header">
                    <i class="fas fa-robot"></i>
                    <h3>Configuration de l'analyse IA Claude</h3>
                </div>
                
                <div class="ai-config-body">
                    <div class="ai-status-card ${this.apiKey ? 'active' : 'inactive'}">
                        <div class="ai-status-icon">
                            <i class="fas fa-${this.apiKey ? 'check' : 'times'}-circle"></i>
                        </div>
                        <div class="ai-status-content">
                            <h4>Status: ${this.apiKey ? 'Configuré' : 'Non configuré'}</h4>
                            <p>${this.apiKey ? 'Claude AI est prêt à analyser vos emails' : 'Configurez votre clé API pour activer Claude'}</p>
                        </div>
                    </div>
                    
                    <div class="ai-features">
                        <h4>Fonctionnalités disponibles:</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> Analyse intelligente avec Claude AI</li>
                            <li><i class="fas fa-check"></i> Extraction automatique des tâches</li>
                            <li><i class="fas fa-check"></i> Suggestions de réponses personnalisées</li>
                            <li><i class="fas fa-check"></i> Détection des priorités et urgences</li>
                            <li><i class="fas fa-check"></i> Intégration complète du contenu email</li>
                            <li><i class="fas fa-check"></i> Solutions CORS intégrées</li>
                        </ul>
                    </div>
                    
                    <div class="ai-api-config">
                        <h4>Configuration API Claude:</h4>
                        <div class="form-group">
                            <label class="form-label">Clé API Anthropic</label>
                            <input type="password" class="form-input" id="api-key-input" 
                                   placeholder="sk-ant-api..." value="${this.apiKey}">
                            <small>Obtenez votre clé sur <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="use-local-proxy" ${this.useLocalProxy ? 'checked' : ''}>
                                Utiliser un proxy local (recommandé)
                            </label>
                            <input type="text" class="form-input" id="proxy-url-input" 
                                   placeholder="http://localhost:3001/api/claude" 
                                   value="${this.localProxyUrl}"
                                   ${!this.useLocalProxy ? 'disabled' : ''}>
                            <small>Un proxy local évite les problèmes CORS. Voir la documentation pour la configuration.</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mode d'analyse</label>
                            <select id="ai-mode-select" class="form-input">
                                <option value="hybrid" ${this.mode === 'hybrid' ? 'selected' : ''}>Hybride (API + Local)</option>
                                <option value="api-only" ${this.mode === 'api-only' ? 'selected' : ''}>API Claude uniquement</option>
                                <option value="local-only" ${this.mode === 'local-only' ? 'selected' : ''}>Analyse locale uniquement</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="ai-cors-info">
                        <h4>Solutions CORS disponibles:</h4>
                        <p>L'extension utilise automatiquement:</p>
                        <ul>
                            <li>Proxy local (si configuré)</li>
                            <li>Proxies CORS publics de secours</li>
                            <li>Analyse locale intelligente en fallback</li>
                        </ul>
                    </div>
                    
                    <div class="ai-test-section">
                        <button class="btn btn-secondary" onclick="window.aiTaskAnalyzer.testConfiguration()">
                            <i class="fas fa-flask"></i> Tester la configuration
                        </button>
                        <div id="test-result" style="margin-top: 10px;"></div>
                    </div>
                </div>
            </div>
        `;
        
        const footer = `
            <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">Annuler</button>
            <button class="btn btn-primary" onclick="window.aiTaskAnalyzer.saveConfiguration()">
                <i class="fas fa-save"></i> Sauvegarder
            </button>
        `;
        
        window.uiManager.showModal(content, {
            title: 'Configuration Claude AI',
            footer: footer,
            size: 'medium'
        });
        
        // Gérer le toggle du proxy local
        document.getElementById('use-local-proxy')?.addEventListener('change', (e) => {
            document.getElementById('proxy-url-input').disabled = !e.target.checked;
        });
    }

    // Tester la configuration
    async testConfiguration() {
        const resultDiv = document.getElementById('test-result');
        if (!resultDiv) return;
        
        resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Test en cours...';
        
        try {
            // Test email
            const testEmail = {
                id: 'test-' + Date.now(),
                subject: 'Test de configuration Claude AI',
                body: { content: 'Merci de confirmer que l\'API fonctionne correctement. Il faut répondre avant demain.' },
                from: { emailAddress: { name: 'Test User', address: 'test@example.com' } },
                receivedDateTime: new Date().toISOString()
            };
            
            const analysis = await this.analyzeEmailForTasks(testEmail, { useApi: true });
            
            if (analysis.method && analysis.method.includes('claude')) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> 
                        Configuration réussie! Claude AI est opérationnel.
                        <br>Méthode: ${analysis.method}
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        API non accessible, utilisation de l'analyse locale.
                        <br>Méthode: ${analysis.method}
                    </div>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-times-circle"></i> 
                    Erreur: ${error.message}
                </div>
            `;
        }
    }

    // Sauvegarder la configuration
    saveConfiguration() {
        const apiKeyInput = document.getElementById('api-key-input');
        const proxyUrlInput = document.getElementById('proxy-url-input');
        const useLocalProxy = document.getElementById('use-local-proxy');
        const modeSelect = document.getElementById('ai-mode-select');
        
        if (apiKeyInput) {
            this.apiKey = apiKeyInput.value.trim();
            if (this.apiKey) {
                localStorage.setItem('claude_api_key', this.apiKey);
                this.apiAvailable = true;
            } else {
                localStorage.removeItem('claude_api_key');
                this.apiAvailable = false;
            }
        }
        
        if (proxyUrlInput) {
            this.localProxyUrl = proxyUrlInput.value.trim();
        }
        
        if (useLocalProxy) {
            this.useLocalProxy = useLocalProxy.checked;
        }
        
        if (modeSelect) {
            this.mode = modeSelect.value;
        }
        
        window.uiManager.closeModal();
        window.uiManager.showToast('Configuration sauvegardée avec succès', 'success');
    }

    // Méthodes utilitaires existantes...
    calculateUrgencyScore(text, subject) {
        let score = 0;
        
        if (/urgent|asap|important/i.test(subject)) {
            score += 20;
        }
        
        this.analysisPatterns.urgency.forEach(pattern => {
            const matches = text.match(pattern.regex);
            if (matches) {
                score += pattern.weight * matches.length;
            }
        });
        
        const dates = this.extractAllDates(text);
        if (dates.length > 0) {
            const firstDate = new Date(dates[0]);
            const today = new Date();
            const daysDiff = Math.ceil((firstDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 0) score += 20;
            else if (daysDiff <= 1) score += 15;
            else if (daysDiff <= 3) score += 10;
            else if (daysDiff <= 7) score += 5;
        }
        
        return Math.min(score, 100);
    }

    detectCategory(text, senderEmail) {
        const categories = {
            meeting: ['meeting', 'réunion', 'call', 'visio', 'rendez-vous', 'agenda', 'calendrier', 'zoom', 'teams'],
            finance: ['facture', 'invoice', 'payment', 'paiement', 'devis', 'budget', 'comptabilité', 'remboursement'],
            project: ['projet', 'project', 'sprint', 'milestone', 'roadmap', 'planning', 'livrable'],
            client: ['client', 'customer', 'prospect', 'commercial', 'contrat', 'proposition'],
            security: ['sécurité', 'security', 'password', 'mot de passe', 'connexion', 'authentification'],
            tasks: ['tâche', 'task', 'action', 'todo', 'assignment', 'livrable']
        };
        
        let bestCategory = 'tasks';
        let bestScore = 0;
        
        Object.entries(categories).forEach(([cat, keywords]) => {
            let score = 0;
            keywords.forEach(keyword => {
                if (text.includes(keyword)) score += 2;
            });
            
            if (score > bestScore) {
                bestCategory = cat;
                bestScore = score;
            }
        });
        
        return bestCategory;
    }

    // Autres méthodes utilitaires existantes...
    extractAllDates(text) {
        const dates = [];
        const today = new Date();
        
        const datePatterns = [
            { 
                regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, 
                handler: (match) => {
                    const [_, day, month, year] = match;
                    const fullYear = year.length === 2 ? '20' + year : year;
                    return new Date(fullYear, month - 1, day);
                }
            },
            { regex: /aujourd'hui/gi, handler: () => new Date(today) },
            { regex: /today/gi, handler: () => new Date(today) },
            { regex: /demain/gi, handler: () => {
                const date = new Date(today);
                date.setDate(date.getDate() + 1);
                return date;
            }},
            { regex: /tomorrow/gi, handler: () => {
                const date = new Date(today);
                date.setDate(date.getDate() + 1);
                return date;
            }}
        ];
        
        datePatterns.forEach(({ regex, handler }) => {
            const matches = [...text.matchAll(regex)];
            matches.forEach(match => {
                try {
                    const date = handler(match);
                    if (date && !isNaN(date.getTime()) && date >= today) {
                        dates.push(date.toISOString().split('T')[0]);
                    }
                } catch (e) {}
            });
        });
        
        return [...new Set(dates)].sort();
    }

    generateIntelligentSummary(subject, content, actions, urgencyScore) {
        let summary = '';
        
        if (urgencyScore > 70) {
            summary = '🚨 URGENT: ';
        } else if (urgencyScore > 50) {
            summary = '⚡ Important: ';
        } else if (actions.length > 3) {
            summary = '📋 Multiple actions: ';
        }
        
        const cleanSubject = subject.replace(/^(re|tr|fwd?):\s*/i, '').trim();
        summary += cleanSubject;
        
        if (actions.length > 0) {
            const mainAction = actions[0];
            if (!summary.toLowerCase().includes(mainAction.text.toLowerCase())) {
                summary += '. ' + mainAction.fullMatch;
            }
        } else {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
            if (sentences.length > 0 && !sentences[0].toLowerCase().includes(cleanSubject.toLowerCase())) {
                summary += '. ' + sentences[0].trim();
            }
        }
        
        if (summary.length > 200) {
            summary = summary.substring(0, 197) + '...';
        }
        
        return summary;
    }

    highlightDetailedActions(content, extractedActions) {
        const highlighted = [];
        const lines = content.split('\n');
        
        extractedActions.forEach(action => {
            const lineIndex = action.line - 1;
            if (lines[lineIndex]) {
                highlighted.push({
                    action: action.fullMatch,
                    location: `Ligne ${action.line}`,
                    excerpt: action.context,
                    deadline: action.type === 'deadline' ? this.extractDateFromText(action.text) : null,
                    type: action.type,
                    priority: action.weight >= 4 ? 'high' : action.weight >= 2 ? 'medium' : 'low'
                });
            }
        });
        
        return highlighted.slice(0, 10);
    }

    generateIntelligentSubtasks(actions, category) {
        const subtasks = [];
        
        actions.slice(0, 3).forEach(action => {
            if (action.text.length > 10 && action.text.length < 80) {
                subtasks.push({
                    title: this.capitalizeFirst(action.text),
                    priority: action.weight >= 4 ? 'high' : 'medium'
                });
            }
        });
        
        const contextualSubtasks = {
            meeting: [
                { title: 'Confirmer la participation', priority: 'high' },
                { title: 'Préparer les documents pour la réunion', priority: 'medium' }
            ],
            finance: [
                { title: 'Vérifier les montants et détails', priority: 'high' },
                { title: 'Préparer les justificatifs', priority: 'medium' }
            ],
            project: [
                { title: 'Réviser les livrables', priority: 'high' },
                { title: 'Mettre à jour le planning', priority: 'medium' }
            ]
        };
        
        if (subtasks.length < 2 && contextualSubtasks[category]) {
            const toAdd = 3 - subtasks.length;
            subtasks.push(...contextualSubtasks[category].slice(0, toAdd));
        }
        
        return subtasks.slice(0, 3);
    }

    generateDetailedActionPoints(actions, content) {
        const actionPoints = [];
        
        actions.forEach(action => {
            let point = this.capitalizeFirst(action.text);
            if (action.line) {
                point += ` (Ligne ${action.line})`;
            }
            actionPoints.push(point);
        });
        
        if (actionPoints.length < 3) {
            if (/répondre|reply|response/i.test(content)) {
                actionPoints.push('Répondre à cet email');
            }
            if (/document|fichier|pièce jointe|attachment/i.test(content)) {
                actionPoints.push('Examiner les documents mentionnés');
            }
        }
        
        return actionPoints.slice(0, 5);
    }

    generateContextualReplies(email, category, urgencyScore, actions) {
        const suggestions = [];
        const sender = email.from?.emailAddress?.name || 'l\'expéditeur';
        const subject = email.subject || 'votre message';
        
        suggestions.push({
            tone: 'neutre',
            subject: `Re: ${subject}`,
            content: `Bonjour ${sender},\n\nJ'ai bien reçu votre message concernant "${subject}".\n\nJe prends connaissance de votre demande et je vous reviens rapidement avec les éléments demandés.\n\nCordialement,\n[Votre nom]`
        });
        
        if (urgencyScore > 70) {
            suggestions.push({
                tone: 'urgent',
                subject: `Re: ${subject} - Traitement en cours`,
                content: `Bonjour ${sender},\n\nJe viens de prendre connaissance de votre message urgent.\n\nJe traite votre demande en priorité absolue et je vous réponds dans l'heure.\n\nCordialement,\n[Votre nom]`
            });
        }
        
        if (category === 'meeting') {
            suggestions.push({
                tone: 'formel',
                subject: `Re: ${subject} - Confirmation`,
                content: `Bonjour ${sender},\n\nJe vous confirme ma disponibilité pour la réunion proposée.\n\nPourriez-vous me confirmer la date, l'heure et le lieu/lien de visioconférence ?\n\nCordialement,\n[Votre nom]`
            });
        }
        
        return suggestions.slice(0, 3);
    }

    extractImportantPassages(content, actions) {
        const excerpts = [];
        const lines = content.split('\n');
        const processedLines = new Set();
        
        actions.forEach(action => {
            if (!processedLines.has(action.line - 1)) {
                excerpts.push({
                    text: action.context,
                    context: `Action ${action.type} identifiée`,
                    actionRequired: true,
                    priority: action.weight >= 4 ? 'high' : 'medium'
                });
                processedLines.add(action.line - 1);
            }
        });
        
        const importantPatterns = [
            { regex: /important|urgent|critique|attention/i, context: 'Information critique' },
            { regex: /deadline|échéance|date limite/i, context: 'Deadline mentionnée' },
            { regex: /\d+[,.\s]?\d*\s*[€$£]/i, context: 'Montant financier' }
        ];
        
        lines.forEach((line, index) => {
            if (processedLines.has(index) || line.trim().length < 20) return;
            
            for (const pattern of importantPatterns) {
                if (pattern.regex.test(line)) {
                    excerpts.push({
                        text: line.trim(),
                        context: pattern.context,
                        actionRequired: false,
                        priority: 'medium'
                    });
                    processedLines.add(index);
                    break;
                }
            }
        });
        
        return excerpts.slice(0, 5);
    }

    suggestAppropriateDeadline(urgencyScore, category) {
        const today = new Date();
        let daysToAdd = 7;
        
        if (urgencyScore > 80) {
            daysToAdd = 0;
        } else if (urgencyScore > 60) {
            daysToAdd = 1;
        } else if (urgencyScore > 40) {
            daysToAdd = 3;
        } else if (urgencyScore > 20) {
            daysToAdd = 5;
        }
        
        const categoryAdjustments = {
            meeting: -2,
            finance: -1,
            security: -3,
            client: -1
        };
        
        if (categoryAdjustments[category] !== undefined) {
            daysToAdd = Math.max(0, daysToAdd + categoryAdjustments[category]);
        }
        
        const deadline = new Date(today);
        deadline.setDate(deadline.getDate() + daysToAdd);
        
        if (deadline.getDay() === 6) deadline.setDate(deadline.getDate() + 2);
        if (deadline.getDay() === 0) deadline.setDate(deadline.getDate() + 1);
        
        return deadline.toISOString().split('T')[0];
    }

    generateRelevantTags(email, category, keyPhrases, sender) {
        const tags = new Set();
        
        if (category !== 'other') {
            tags.add(category);
        }
        
        const urgencyScore = this.calculateUrgencyScore(
            email.subject + ' ' + this.extractEmailContent(email), 
            email.subject
        );
        
        if (urgencyScore > 60) {
            tags.add('urgent');
        } else if (urgencyScore > 40) {
            tags.add('important');
        }
        
        const domain = email.from?.emailAddress?.address?.split('@')[1]?.split('.')[0];
        if (domain && domain.length > 2 && !['gmail', 'outlook', 'yahoo', 'hotmail'].includes(domain)) {
            tags.add(domain.toLowerCase());
        }
        
        return Array.from(tags).slice(0, 5);
    }

    extractKeyPhrases(text) {
        const phrases = [];
        
        const patterns = [
            /il faut .{5,50}/gi,
            /nous devons .{5,50}/gi,
            /merci de .{5,50}/gi,
            /veuillez .{5,50}/gi,
            /important.{0,50}/gi,
            /urgent.{0,50}/gi
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleaned = match.trim().replace(/[.!?]+$/, '');
                    if (cleaned.length > 10 && cleaned.length < 100) {
                        phrases.push(cleaned);
                    }
                });
            }
        });
        
        return [...new Set(phrases)].slice(0, 5);
    }

    extractEmailContent(email) {
        let content = '';
        
        if (email.body && email.body.content) {
            content = email.body.content;
        } else if (email.bodyPreview) {
            content = email.bodyPreview;
        }
        
        if (content.includes('<') && content.includes('>')) {
            content = content
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<p[^>]*>/gi, '\n')
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/\n\s*\n/g, '\n\n')
                .replace(/[ \t]+/g, ' ')
                .trim();
        }
        
        return content;
    }

    extractDateFromText(text) {
        const dates = this.extractAllDates(text);
        return dates[0] || null;
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    validatePriority(priority) {
        const valid = ['urgent', 'high', 'medium', 'low'];
        return valid.includes(priority) ? priority : 'medium';
    }

    validateDate(dateStr) {
        if (!dateStr) return null;
        
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {}
        
        return null;
    }

    calculateConfidence(actions, urgencyScore) {
        let confidence = 0.7;
        
        if (actions.length > 5) confidence += 0.1;
        else if (actions.length > 3) confidence += 0.05;
        
        if (urgencyScore > 70 || urgencyScore < 20) confidence += 0.1;
        
        const highPriorityActions = actions.filter(a => a.weight >= 4).length;
        if (highPriorityActions > 2) confidence += 0.05;
        
        return Math.min(confidence, 0.95);
    }

    createBasicAnalysis(email) {
        const subject = email.subject || 'Email sans sujet';
        const sender = email.from?.emailAddress?.name || 'Expéditeur inconnu';
        const content = this.extractEmailContent(email);
        
        return {
            summary: `Email de ${sender}: ${subject}`,
            importance: 'medium',
            actionsHighlighted: [],
            mainTask: {
                title: `Examiner: ${subject}`,
                priority: 'medium',
                dueDate: null,
                description: `Email reçu de ${sender}\n\nContenu:\n${content}`,
                emailId: email.id,
                hasFullContent: true
            },
            subtasks: [],
            actionPoints: ['Lire et analyser cet email', 'Déterminer les actions nécessaires'],
            suggestedReplies: [{
                tone: 'neutre',
                subject: `Re: ${subject}`,
                content: `Bonjour,\n\nJ'ai bien reçu votre message et je vous recontacte rapidement.\n\nCordialement`
            }],
            insights: {
                keyInfo: [],
                risks: [],
                opportunities: [],
                emailTone: 'neutre',
                responseExpected: true,
                attachments: [],
                contacts: [],
                links: []
            },
            importantExcerpts: [],
            emailMetadata: {
                sender: sender,
                senderEmail: email.from?.emailAddress?.address || '',
                subject: subject,
                date: email.receivedDateTime,
                hasAttachments: email.hasAttachments || false,
                fullContent: content
            },
            category: 'other',
            suggestedDeadline: null,
            tags: [],
            method: 'basic-fallback',
            confidence: 0.5
        };
    }

    createAnalysisFromText(text) {
        const lines = text.split('\n').filter(l => l.trim());
        const summary = lines.find(l => l.length > 20) || 'Email analysé';
        
        const urgentMatch = /urgent|critique|immédiat/i.test(text);
        const priority = urgentMatch ? 'urgent' : 'medium';
        
        return {
            summary: summary.substring(0, 200),
            importance: priority,
            actionsHighlighted: [],
            mainTask: {
                title: 'Examiner: ' + summary.substring(0, 80),
                priority: priority,
                dueDate: null,
                description: summary,
                hasFullContent: false
            },
            subtasks: [],
            actionPoints: lines.slice(1, 4).filter(l => l.length > 10),
            suggestedReplies: [{
                tone: 'neutre',
                subject: 'Re: Email',
                content: 'Bonjour,\n\nJ\'ai bien reçu votre message et je vous recontacte rapidement.\n\nCordialement'
            }],
            insights: {
                keyInfo: [],
                risks: [],
                opportunities: [],
                emailTone: 'neutre',
                responseExpected: true,
                attachments: [],
                contacts: [],
                links: []
            },
            importantExcerpts: [],
            emailMetadata: {},
            category: 'other',
            suggestedDeadline: null,
            tags: [],
            method: 'claude-text-fallback',
            confidence: 0.6
        };
    }

    // Gestion du cache
    getFromCache(key) {
        const cached = this.analysisCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.analysisCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.analysisCache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        if (this.analysisCache.size > 100) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
        }
    }

    // Analyser plusieurs emails en batch
    async batchAnalyze(emails, options = {}) {
        const results = [];
        const total = emails.length;
        
        for (let i = 0; i < emails.length; i++) {
            try {
                const analysis = await this.analyzeEmailForTasks(emails[i], options);
                results.push({
                    email: emails[i],
                    analysis: analysis
                });
                
                if (options.onProgress) {
                    options.onProgress({
                        current: i + 1,
                        total: total,
                        percentage: Math.round(((i + 1) / total) * 100)
                    });
                }
                
                // Pause pour éviter le rate limiting
                if (options.useApi && this.apiKey) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`[AITaskAnalyzer] Error analyzing email ${i}:`, error);
                results.push({
                    email: emails[i],
                    analysis: this.createBasicAnalysis(emails[i]),
                    error: true
                });
            }
        }
        
        return results;
    }

    // Obtenir un résumé rapide
    async getQuickSummary(email) {
        const analysis = await this.analyzeEmailForTasks(email, { quickMode: true });
        return analysis.summary;
    }

    // Obtenir les stats d'utilisation
    getUsageStats() {
        return {
            cacheSize: this.analysisCache.size,
            apiConfigured: !!this.apiKey,
            apiAvailable: this.apiAvailable,
            model: this.apiKey ? this.model : 'Local Analysis',
            method: this.mode,
            mode: this.mode,
            lastApiTest: this.lastApiTest
        };
    }

    // Méthodes de compatibilité
    localTaskAnalysis(email) {
        return this.performEnhancedLocalAnalysis(email);
    }

    enhancedLocalAnalysis(email) {
        return this.performEnhancedLocalAnalysis(email);
    }

    // Configuration du proxy local (pour les développeurs)
    getProxySetupInstructions() {
        return `
// Créez un serveur proxy local avec Node.js
// Installez: npm install express cors axios

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/claude', async (req, res) => {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: req.body.model,
            max_tokens: req.body.max_tokens,
            messages: req.body.messages,
            temperature: req.body.temperature,
            system: req.body.system
        }, {
            headers: {
                'x-api-key': req.body.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.message
        });
    }
});

app.listen(3001, () => {
    console.log('Proxy server running on http://localhost:3001');
});
        `;
    }
}

// Create global instance
window.aiTaskAnalyzer = new AITaskAnalyzer();
console.log('✅ AITaskAnalyzer loaded - Enhanced with CORS solutions and full email integration');