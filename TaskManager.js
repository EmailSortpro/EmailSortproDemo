// TaskManager Pro v8.4 - CORRIGÉ avec affichage email complet et suggestions de réponse

// =====================================
// ENHANCED TASK MANAGER CLASS
// =====================================
class TaskManager {
    constructor() {
        this.tasks = [];
        this.initialized = false;
        this.selectedTasks = new Set();
        this.init();
    }

    async init() {
        try {
            console.log('[TaskManager] Initializing v8.4 - CORRIGÉ avec affichage email complet...');
            await this.loadTasks();
            this.initialized = true;
            console.log('[TaskManager] Initialization complete with', this.tasks.length, 'tasks');
        } catch (error) {
            console.error('[TaskManager] Initialization error:', error);
            this.tasks = [];
            this.initialized = true;
        }
    }

    async loadTasks() {
        try {
            const saved = localStorage.getItem('emailsort_tasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
                console.log(`[TaskManager] Loaded ${this.tasks.length} tasks from storage`);
            } else {
                console.log('[TaskManager] No saved tasks found, creating sample tasks');
                this.generateSampleTasks();
            }
        } catch (error) {
            console.error('[TaskManager] Error loading tasks:', error);
            this.tasks = [];
        }
    }

    generateSampleTasks() {
        const sampleTasks = [
            {
                id: 'sample_1',
                title: 'Répondre à l\'équipe marketing sur la campagne Q2',
                description: '📧 RÉSUMÉ EXÉCUTIF\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDe: Sarah Martin (acme-corp.com)\nObjet: Demande de validation pour la campagne marketing Q2\n📮 Réponse attendue\n\n🎯 ACTIONS REQUISES:\n1. Valider les visuels de la campagne\n2. Confirmer le budget alloué\n3. Définir les dates de lancement\n\n💡 INFORMATIONS CLÉS:\n• Budget proposé : 50k€\n• Cible : 25-45 ans\n• Canaux : LinkedIn, Google Ads\n\n⚠️ POINTS D\'ATTENTION:\n• Deadline serrée pour le lancement\n• Coordination avec l\'équipe commerciale requise',
                priority: 'high',
                status: 'todo',
                category: 'email',
                hasEmail: true,
                emailFrom: 'sarah.martin@acme-corp.com',
                emailFromName: 'Sarah Martin',
                emailSubject: 'Validation campagne marketing Q2',
                emailDate: '2025-06-06T09:15:00Z',
                emailDomain: 'acme-corp.com',
                emailContent: `Email de: Sarah Martin <sarah.martin@acme-corp.com>
Date: ${new Date().toLocaleString('fr-FR')}
Sujet: Validation campagne marketing Q2

Bonjour,

J'espère que vous allez bien. Je vous contacte concernant notre campagne marketing Q2 qui nécessite votre validation.

Nous avons préparé les éléments suivants :
- Visuels créatifs pour les réseaux sociaux
- Budget détaillé de 50k€
- Calendrier de lancement

Pourriez-vous valider ces éléments avant vendredi ? Nous devons coordonner avec l'équipe commerciale pour le lancement.

Merci d'avance,
Sarah Martin`,
                // NOUVEAU: Contenu HTML complet de l'email
                emailHtmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">ACME Corp</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Marketing Department</p>
                    </div>
                    <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                        <p>Bonjour,</p>
                        <p>J'espère que vous allez bien. Je vous contacte concernant notre <strong>campagne marketing Q2</strong> qui nécessite votre validation.</p>
                        <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Éléments préparés :</h3>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Visuels créatifs pour les réseaux sociaux</li>
                                <li><strong>Budget détaillé de 50k€</strong></li>
                                <li>Calendrier de lancement</li>
                            </ul>
                        </div>
                        <p><strong>Pourriez-vous valider ces éléments avant vendredi ?</strong> Nous devons coordonner avec l'équipe commerciale pour le lancement.</p>
                        <p style="margin-top: 30px;">Merci d'avance,<br><strong>Sarah Martin</strong></p>
                    </div>
                </div>`,
                tags: ['marketing', 'validation', 'q2'],
                client: 'ACME Corp',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                needsReply: true,
                dueDate: '2025-06-08',
                summary: 'Validation urgente de la campagne marketing Q2 avec budget de 50k€',
                actions: [
                    { text: 'Valider les visuels de la campagne', deadline: null },
                    { text: 'Confirmer le budget alloué', deadline: '2025-06-07' },
                    { text: 'Définir les dates de lancement', deadline: null }
                ],
                keyInfo: [
                    'Budget proposé : 50k€',
                    'Cible : 25-45 ans',
                    'Canaux : LinkedIn, Google Ads'
                ],
                risks: [
                    'Deadline serrée pour le lancement',
                    'Coordination avec l\'équipe commerciale requise'
                ],
                // NOUVEAU: Suggestions de réponse personnalisées
                suggestedReplies: [
                    {
                        tone: 'formel',
                        subject: 'Re: Validation campagne marketing Q2 - Approuvé',
                        content: `Bonjour Sarah,

Merci pour ce dossier complet sur la campagne marketing Q2.

Après examen des éléments fournis, je valide :
✓ Les visuels créatifs - très bien conçus
✓ Le budget de 50k€ - approuvé 
✓ Le calendrier de lancement - cohérent avec nos objectifs

Vous pouvez procéder au lancement en coordination avec l'équipe commerciale comme prévu.

Excellente initiative, félicitations à toute l'équipe !

Cordialement,
[Votre nom]`
                    },
                    {
                        tone: 'urgent',
                        subject: 'Re: Validation campagne marketing Q2 - Questions urgentes',
                        content: `Bonjour Sarah,

J'ai examiné le dossier campagne Q2 avec attention.

Avant validation finale, j'ai quelques questions urgentes :

1. Budget 50k€ : quelle répartition LinkedIn vs Google Ads ?
2. Cible 25-45 ans : avez-vous les personas détaillés ?
3. Coordination commerciale : qui est le référent côté vente ?

Pouvons-nous organiser un point rapidement demain pour clarifier ces aspects ?

Dans l'attente de votre retour,
[Votre nom]`
                    }
                ],
                method: 'ai'
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
    }

    // MÉTHODE PRINCIPALE POUR CRÉER UNE TÂCHE À PARTIR D'UN EMAIL - CORRIGÉE AVEC IA
    async createTaskFromEmail(taskData, email = null) {
        console.log('[TaskManager] Creating task from email with AI-powered reply suggestions:', taskData.title);
        
        // Assurer un ID unique
        const taskId = taskData.id || this.generateId();
        
        // EXTRAIRE LE CONTENU COMPLET DE L'EMAIL
        const fullEmailContent = this.extractFullEmailContent(email, taskData);
        const htmlEmailContent = this.extractHtmlEmailContent(email, taskData);
        
        // GÉNÉRER DES SUGGESTIONS DE RÉPONSE VIA IA SI NÉCESSAIRE
        let suggestedReplies = taskData.suggestedReplies || [];
        
        // Si pas de suggestions fournies et qu'on a un email, générer via IA
        if ((!suggestedReplies || suggestedReplies.length === 0) && 
            (email || taskData.emailFrom) && 
            window.aiTaskAnalyzer) {
            
            try {
                console.log('[TaskManager] Generating AI-powered reply suggestions...');
                suggestedReplies = await this.generateIntelligentReplySuggestions(email || taskData, taskData);
                console.log('[TaskManager] Generated', suggestedReplies.length, 'AI reply suggestions');
            } catch (error) {
                console.warn('[TaskManager] AI reply generation failed:', error);
                // Générer des suggestions de base en fallback
                suggestedReplies = this.generateBasicReplySuggestions(email || taskData, taskData);
            }
        }
        
        // Construire la tâche complète avec toutes les données email
        const task = {
            id: taskId,
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || null,
            category: taskData.category || 'email',
            
            // DONNÉES EMAIL COMPLÈTES AVEC CONTENU
            emailId: taskData.emailId || null,
            emailFrom: taskData.emailFrom || (email?.from?.emailAddress?.address),
            emailFromName: taskData.emailFromName || (email?.from?.emailAddress?.name),
            emailSubject: taskData.emailSubject || email?.subject,
            emailContent: fullEmailContent, // CONTENU COMPLET TEXTE
            emailHtmlContent: htmlEmailContent, // NOUVEAU: CONTENU HTML COMPLET
            emailDomain: taskData.emailDomain || (taskData.emailFrom ? taskData.emailFrom.split('@')[1] : ''),
            hasEmail: true,
            emailReplied: false,
            emailDate: taskData.emailDate || email?.receivedDateTime,
            needsReply: taskData.needsReply !== false, // Par défaut true pour les emails
            hasAttachments: email?.hasAttachments || false,
            
            // DONNÉES STRUCTURÉES DE L'IA - COMPLÈTES
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            aiAnalysis: taskData.aiAnalysis || null,
            
            // NOUVEAU: Suggestions de réponse personnalisées IA
            suggestedReplies: suggestedReplies,
            aiRepliesGenerated: suggestedReplies.length > 0,
            aiRepliesGeneratedAt: suggestedReplies.length > 0 ? new Date().toISOString() : null,
            
            // MÉTADONNÉES
            tags: taskData.tags || [],
            client: taskData.client || 'Externe',
            
            // TIMESTAMPS
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            method: taskData.method || 'ai'
        };
        
        // Ajouter la tâche
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        
        console.log('[TaskManager] Task created successfully with AI reply suggestions:', {
            id: task.id,
            hasEmailContent: !!task.emailContent,
            hasHtmlContent: !!task.emailHtmlContent,
            contentLength: task.emailContent?.length || 0,
            htmlContentLength: task.emailHtmlContent?.length || 0,
            hasActions: task.actions?.length || 0,
            hasKeyInfo: task.keyInfo?.length || 0,
            hasRisks: task.risks?.length || 0,
            hasSuggestedReplies: task.suggestedReplies?.length || 0,
            aiRepliesGenerated: task.aiRepliesGenerated
        });
        
        return task;
    }

    // NOUVELLE MÉTHODE POUR GÉNÉRER DES SUGGESTIONS DE RÉPONSE INTELLIGENTES VIA IA
    async generateIntelligentReplySuggestions(email, taskData) {
        if (!window.aiTaskAnalyzer) {
            console.warn('[TaskManager] AITaskAnalyzer not available');
            return this.generateBasicReplySuggestions(email, taskData);
        }

        try {
            const senderName = email.from?.emailAddress?.name || taskData.emailFromName || 'l\'expéditeur';
            const senderEmail = email.from?.emailAddress?.address || taskData.emailFrom || '';
            const subject = email.subject || taskData.emailSubject || 'votre message';
            const content = email.body?.content || email.bodyPreview || taskData.emailContent || '';
            const urgency = taskData.priority || 'medium';
            const hasActions = taskData.actions && taskData.actions.length > 0;
            const keyInfo = taskData.keyInfo || [];
            const risks = taskData.risks || [];

            // Construire un prompt spécialisé pour la génération de réponses
            const replyPrompt = `Tu es un assistant expert en communication professionnelle. Génère 3 suggestions de réponse personnalisées pour cet email.

CONTEXTE DE L'EMAIL:
Expéditeur: ${senderName} <${senderEmail}>
Sujet: ${subject}
Priorité détectée: ${urgency}
Actions requises: ${hasActions ? 'Oui' : 'Non'}

CONTENU DE L'EMAIL:
${content}

${keyInfo.length > 0 ? `INFORMATIONS CLÉS IDENTIFIÉES:\n${keyInfo.map(info => `• ${info}`).join('\n')}\n` : ''}

${risks.length > 0 ? `POINTS D'ATTENTION:\n${risks.map(risk => `• ${risk}`).join('\n')}\n` : ''}

INSTRUCTIONS:
1. Analyse le contexte, le ton et l'urgence de l'email
2. Génère 3 réponses différentes adaptées au contexte
3. Varie les tons: professionnel, urgent si nécessaire, et une version plus détaillée
4. Personalise avec le nom de l'expéditeur et les éléments spécifiques mentionnés
5. Inclus des éléments concrets de l'email original

FORMAT DE RÉPONSE JSON:
{
  "suggestions": [
    {
      "tone": "professionnel",
      "subject": "Re: [sujet original]",
      "content": "Réponse complète et personnalisée...",
      "description": "Réponse professionnelle standard"
    },
    {
      "tone": "urgent",
      "subject": "Re: [sujet] - Traitement prioritaire",
      "content": "Réponse adaptée à l'urgence...",
      "description": "Réponse pour traitement urgent"
    },
    {
      "tone": "détaillé",
      "subject": "Re: [sujet] - Réponse détaillée",
      "content": "Réponse complète avec tous les détails...",
      "description": "Réponse complète et détaillée"
    }
  ]
}`;

            // Appeler l'IA pour générer les suggestions
            const aiResponse = await this.callAIForReplySuggestions(replyPrompt);
            
            if (aiResponse && aiResponse.suggestions && Array.isArray(aiResponse.suggestions)) {
                console.log('[TaskManager] AI generated', aiResponse.suggestions.length, 'reply suggestions');
                return aiResponse.suggestions.map(suggestion => ({
                    tone: suggestion.tone || 'neutre',
                    subject: suggestion.subject || `Re: ${subject}`,
                    content: suggestion.content || '',
                    description: suggestion.description || '',
                    generatedBy: 'claude-ai',
                    generatedAt: new Date().toISOString()
                }));
            } else {
                console.warn('[TaskManager] Invalid AI response format');
                return this.generateBasicReplySuggestions(email, taskData);
            }

        } catch (error) {
            console.error('[TaskManager] Error generating AI reply suggestions:', error);
            return this.generateBasicReplySuggestions(email, taskData);
        }
    }

    // MÉTHODE POUR APPELER L'IA CLAUDE SPÉCIFIQUEMENT POUR LES RÉPONSES
    async callAIForReplySuggestions(prompt) {
        if (!window.aiTaskAnalyzer) {
            throw new Error('AITaskAnalyzer not available');
        }

        // Utiliser la même infrastructure que AITaskAnalyzer mais avec un prompt spécialisé
        try {
            // Vérifier si l'API est configurée
            if (window.aiTaskAnalyzer.apiKey) {
                console.log('[TaskManager] Using Claude API for reply suggestions');
                return await this.callClaudeAPI(prompt);
            } else {
                console.log('[TaskManager] No API key, using local generation');
                return this.generateBasicReplySuggestionsFromPrompt(prompt);
            }
        } catch (error) {
            console.error('[TaskManager] AI API call failed:', error);
            throw error;
        }
    }

    // APPEL À L'API CLAUDE POUR LES SUGGESTIONS DE RÉPONSE
    async callClaudeAPI(prompt) {
        const apiUrl = 'https://api.anthropic.com/v1/messages';
        const apiKey = window.aiTaskAnalyzer.apiKey;
        
        // Essayer d'abord le proxy local si disponible
        if (window.aiTaskAnalyzer.useLocalProxy && window.aiTaskAnalyzer.localProxyUrl) {
            try {
                const response = await fetch(window.aiTaskAnalyzer.localProxyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        apiKey: apiKey,
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 2048,
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                        temperature: 0.7,
                        system: "Tu es un expert en communication professionnelle. Tu génères des réponses email personnalisées et adaptées au contexte. Réponds toujours en JSON valide avec des suggestions pratiques et utilisables."
                    })
                });

                if (!response.ok) {
                    throw new Error(`Local proxy error: ${response.status}`);
                }

                const data = await response.json();
                return this.parseClaudeReplyResponse(data);
                
            } catch (error) {
                console.warn('[TaskManager] Local proxy failed, trying CORS solutions:', error);
            }
        }

        // Essayer les solutions CORS en fallback
        for (const proxyUrl of window.aiTaskAnalyzer.corsProxies) {
            try {
                const targetUrl = encodeURIComponent(apiUrl);
                const response = await fetch(proxyUrl + targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 2048,
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    throw new Error(`CORS proxy error: ${response.status}`);
                }

                const data = await response.json();
                return this.parseClaudeReplyResponse(data);
                
            } catch (error) {
                console.warn(`[TaskManager] CORS proxy ${proxyUrl} failed:`, error);
            }
        }

        throw new Error('All Claude API methods failed');
    }

    // PARSER LA RÉPONSE DE CLAUDE POUR LES SUGGESTIONS
    parseClaudeReplyResponse(response) {
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
            
            // Valider la structure
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                throw new Error('Invalid suggestions format');
            }
            
            return parsed;
            
        } catch (error) {
            console.error('[TaskManager] Parse Claude reply error:', error);
            throw error;
        }
    }

    // SUGGESTIONS DE BASE EN FALLBACK
    generateBasicReplySuggestions(email, taskData) {
        const senderName = email.from?.emailAddress?.name || taskData.emailFromName || 'l\'expéditeur';
        const subject = email.subject || taskData.emailSubject || 'votre message';
        const urgency = taskData.priority || 'medium';
        const hasActions = taskData.actions && taskData.actions.length > 0;

        const suggestions = [];

        // Réponse professionnelle standard
        suggestions.push({
            tone: 'professionnel',
            subject: `Re: ${subject}`,
            content: `Bonjour ${senderName},

Merci pour votre message concernant "${subject}".

J'ai bien pris connaissance de votre demande et je m'en occupe rapidement. Je vous tiendrai informé de l'avancement.

${hasActions ? 'Je traite les points que vous avez mentionnés et je vous reviens avec les éléments demandés.' : ''}

Cordialement,
[Votre nom]`,
            description: 'Réponse professionnelle standard',
            generatedBy: 'local-fallback',
            generatedAt: new Date().toISOString()
        });

        // Réponse urgente si nécessaire
        if (urgency === 'urgent' || urgency === 'high') {
            suggestions.push({
                tone: 'urgent',
                subject: `Re: ${subject} - Traitement prioritaire`,
                content: `Bonjour ${senderName},

Je viens de prendre connaissance de votre message urgent.

Je comprends l'importance de cette demande et je la traite en priorité absolue. Je vous reviens dans les meilleurs délais avec une réponse complète.

${hasActions ? 'Toutes les actions nécessaires sont en cours de traitement.' : ''}

Je reste à votre disposition pour toute information complémentaire.

Cordialement,
[Votre nom]`,
                description: 'Réponse pour traitement urgent',
                generatedBy: 'local-fallback',
                generatedAt: new Date().toISOString()
            });
        }

        // Réponse de confirmation détaillée
        suggestions.push({
            tone: 'détaillé',
            subject: `Re: ${subject} - Confirmation de réception`,
            content: `Bonjour ${senderName},

Je vous confirme la bonne réception de votre message du ${new Date().toLocaleDateString('fr-FR')}.

${hasActions ? 'J\'ai identifié les actions suivantes à mettre en œuvre et je vais les traiter dans l\'ordre de priorité :' : 'J\'étudie attentivement votre demande et je prépare une réponse appropriée.'}

${taskData.actions ? taskData.actions.map((action, idx) => `${idx + 1}. ${action.text}`).join('\n') : ''}

Je vous tiendrai informé de l'avancement et je vous recontacte rapidement avec les éléments demandés.

N'hésitez pas à me recontacter si vous avez des questions complémentaires.

Cordialement,
[Votre nom]`,
            description: 'Réponse complète et détaillée',
            generatedBy: 'local-fallback',
            generatedAt: new Date().toISOString()
        });

        console.log('[TaskManager] Generated', suggestions.length, 'basic reply suggestions');
        return suggestions;
    }

    // NOUVELLE MÉTHODE POUR EXTRAIRE LE CONTENU COMPLET DE L'EMAIL
    extractFullEmailContent(email, taskData) {
        console.log('[TaskManager] Extracting full email content...');
        
        // Priorité 1: Contenu passé directement dans taskData
        if (taskData.emailContent && taskData.emailContent.length > 50) {
            console.log('[TaskManager] Using email content from taskData');
            return taskData.emailContent;
        }
        
        // Priorité 2: Contenu complet de l'email
        if (email?.body?.content) {
            console.log('[TaskManager] Using email body content');
            return this.cleanEmailContent(email.body.content);
        }
        
        // Priorité 3: Contenu HTML de l'email (si disponible)
        if (email?.body?.type === 'html' && email?.body?.content) {
            console.log('[TaskManager] Using HTML email content');
            return this.convertHtmlToText(email.body.content);
        }
        
        // Priorité 4: Preview de l'email étendu
        if (email?.bodyPreview && email.bodyPreview.length > 20) {
            console.log('[TaskManager] Using extended email preview');
            return this.buildExtendedPreview(email);
        }
        
        // Priorité 5: Construire un contenu minimal mais complet
        console.log('[TaskManager] Building minimal email content');
        return this.buildMinimalEmailContent(email, taskData);
    }

    // NOUVELLE MÉTHODE POUR EXTRAIRE LE CONTENU HTML COMPLET
    extractHtmlEmailContent(email, taskData) {
        console.log('[TaskManager] Extracting HTML email content...');
        
        // Priorité 1: Contenu HTML passé directement dans taskData
        if (taskData.emailHtmlContent && taskData.emailHtmlContent.length > 50) {
            console.log('[TaskManager] Using HTML email content from taskData');
            return taskData.emailHtmlContent;
        }
        
        // Priorité 2: Contenu HTML de l'email
        if (email?.body?.contentType === 'html' && email?.body?.content) {
            console.log('[TaskManager] Using email HTML body content');
            return this.cleanHtmlEmailContent(email.body.content);
        }
        
        // Priorité 3: Contenu de l'email (même si text, on peut le formater)
        if (email?.body?.content) {
            console.log('[TaskManager] Converting text to HTML');
            return this.convertTextToHtml(email.body.content, email);
        }
        
        // Priorité 4: Construire un HTML à partir du contenu texte
        const textContent = this.extractFullEmailContent(email, taskData);
        return this.convertTextToHtml(textContent, email);
    }

    cleanEmailContent(content) {
        if (!content) return '';
        
        // Nettoyer le contenu HTML et garder seulement le texte
        const cleanContent = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer scripts
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Supprimer styles
            .replace(/<[^>]*>/g, ' ') // Supprimer toutes les balises HTML
            .replace(/&nbsp;/g, ' ') // Remplacer &nbsp;
            .replace(/&amp;/g, '&') // Remplacer &amp;
            .replace(/&lt;/g, '<') // Remplacer &lt;
            .replace(/&gt;/g, '>') // Remplacer &gt;
            .replace(/&quot;/g, '"') // Remplacer &quot;
            .replace(/\s+/g, ' ') // Normaliser les espaces
            .trim();
            
        return cleanContent.length > 100 ? cleanContent : '';
    }

    // NOUVELLE MÉTHODE POUR NETTOYER LE CONTENU HTML
    cleanHtmlEmailContent(htmlContent) {
        if (!htmlContent) return '';
        
        // Nettoyer le HTML en gardant la structure visuelle
        let cleanHtml = htmlContent
            // Supprimer les scripts et styles dangereux
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '') // Supprimer les événements JS
            .replace(/javascript:/gi, '') // Supprimer javascript:
            
            // Nettoyer les attributs dangereux
            .replace(/style="[^"]*"/gi, (match) => {
                // Garder seulement les styles de mise en forme de base
                const safeStyles = match.match(/(color|background|font-size|font-weight|text-align|margin|padding|border):[^;]*/gi);
                return safeStyles ? `style="${safeStyles.join(';')}"` : '';
            });
        
        // Encapsuler dans un conteneur sécurisé
        return `<div class="email-content-viewer" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${cleanHtml}
        </div>`;
    }

    // NOUVELLE MÉTHODE POUR CONVERTIR TEXTE EN HTML
    convertTextToHtml(textContent, email) {
        if (!textContent) return '';
        
        const senderName = email?.from?.emailAddress?.name || 'Expéditeur';
        const senderEmail = email?.from?.emailAddress?.address || '';
        const subject = email?.subject || 'Sans sujet';
        const date = email?.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString('fr-FR') : '';
        
        // Créer un HTML formaté à partir du texte
        const htmlContent = textContent
            .replace(/\n/g, '<br>')
            .replace(/Email de:([^\n]+)/g, '<strong>De:</strong>$1')
            .replace(/Date:([^\n]+)/g, '<strong>Date:</strong>$1')
            .replace(/Sujet:([^\n]+)/g, '<strong>Sujet:</strong>$1')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **texte** -> bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // *texte* -> italic
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'); // Links
        
        return `<div class="email-content-viewer" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                    <strong>De:</strong> ${senderName} &lt;${senderEmail}&gt;<br>
                    <strong>Date:</strong> ${date}<br>
                    <strong>Sujet:</strong> ${subject}
                </div>
            </div>
            <div style="font-size: 14px; line-height: 1.8;">
                ${htmlContent}
            </div>
        </div>`;
    }

    convertHtmlToText(htmlContent) {
        if (!htmlContent) return '';
        
        // Créer un élément temporaire pour extraire le texte
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Extraire le texte propre
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        return textContent.trim();
    }

    buildExtendedPreview(email) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const subject = email.subject || 'Sans sujet';
        const date = email.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString('fr-FR') : '';
        const preview = email.bodyPreview || '';
        
        return `Email de: ${senderName} <${senderEmail}>
Date: ${date}
Sujet: ${subject}

${preview}

[Contenu complet non disponible - Aperçu seulement]`;
    }

    buildMinimalEmailContent(email, taskData) {
        const senderName = taskData.emailFromName || email?.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = taskData.emailFrom || email?.from?.emailAddress?.address || '';
        const subject = taskData.emailSubject || email?.subject || 'Sans sujet';
        const date = taskData.emailDate || email?.receivedDateTime;
        const formattedDate = date ? new Date(date).toLocaleString('fr-FR') : 'Date inconnue';
        
        // Construire un contenu basé sur l'analyse IA si disponible
        let content = `Email de: ${senderName} <${senderEmail}>
Date: ${formattedDate}
Sujet: ${subject}

`;

        // Ajouter le résumé s'il existe
        if (taskData.summary) {
            content += `${taskData.summary}\n\n`;
        }
        
        // Ajouter les actions s'elles existent
        if (taskData.actions && taskData.actions.length > 0) {
            content += `Actions mentionnées dans l'email:\n`;
            taskData.actions.forEach((action, idx) => {
                content += `${idx + 1}. ${action.text}\n`;
            });
            content += '\n';
        }
        
        // Ajouter les informations clés
        if (taskData.keyInfo && taskData.keyInfo.length > 0) {
            content += `Informations importantes:\n`;
            taskData.keyInfo.forEach(info => {
                content += `• ${info}\n`;
            });
            content += '\n';
        }
        
        // Ajouter un message si le contenu complet n'est pas disponible
        content += `[Contenu complet de l'email non disponible - Résumé généré par IA]`;
        
        return content;
    }

    // MÉTHODE ALTERNATIVE POUR CRÉER UNE TÂCHE NORMALE
    createTask(taskData) {
        console.log('[TaskManager] Creating normal task:', taskData.title || 'Untitled');
        
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || null,
            category: taskData.category || 'other',
            
            // Email info
            emailId: taskData.emailId || null,
            emailFrom: taskData.emailFrom || null,
            emailFromName: taskData.emailFromName || null,
            emailSubject: taskData.emailSubject || null,
            emailContent: taskData.emailContent || '',
            emailHtmlContent: taskData.emailHtmlContent || '', // NOUVEAU
            hasEmail: !!(taskData.emailId || taskData.emailFrom || taskData.emailContent),
            emailReplied: false,
            emailDate: taskData.emailDate || taskData.createdAt,
            needsReply: taskData.needsReply || false,
            
            // Structured data (ajout pour unifier avec PageManager)
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            suggestedReplies: taskData.suggestedReplies || [], // NOUVEAU
            
            // Metadata
            tags: taskData.tags || [],
            client: taskData.client || 'Interne',
            
            // Timestamps
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            method: taskData.method || 'manual'
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        return task;
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index === -1) return null;
        
        this.tasks[index] = {
            ...this.tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        if (updates.status === 'completed' && !this.tasks[index].completedAt) {
            this.tasks[index].completedAt = new Date().toISOString();
        }
        
        this.saveTasks();
        this.emitTaskUpdate('update', this.tasks[index]);
        return this.tasks[index];
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index === -1) return null;
        
        const deleted = this.tasks.splice(index, 1)[0];
        this.saveTasks();
        this.emitTaskUpdate('delete', deleted);
        return deleted;
    }

    filterTasks(filters = {}) {
        let filtered = [...this.tasks];
        
        // Status filter
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }
        
        // Priority filter
        if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }
        
        // Category filter
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(task => task.category === filters.category);
        }
        
        // Client filter
        if (filters.client && filters.client !== 'all') {
            filtered = filtered.filter(task => task.client === filters.client);
        }
        
        // Tag filter
        if (filters.tag && filters.tag !== 'all') {
            filtered = filtered.filter(task => 
                task.tags && Array.isArray(task.tags) && task.tags.includes(filters.tag)
            );
        }
        
        // Date range filter
        if (filters.dateRange && filters.dateRange !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            filtered = filtered.filter(task => {
                const taskDate = new Date(task.createdAt);
                
                switch (filters.dateRange) {
                    case 'today':
                        return taskDate >= today;
                    case 'week':
                        return taskDate >= weekStart;
                    case 'month':
                        return taskDate >= monthStart;
                    case 'older':
                        return taskDate < monthStart;
                    default:
                        return true;
                }
            });
        }
        
        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(search) ||
                task.description.toLowerCase().includes(search) ||
                (task.emailFromName && task.emailFromName.toLowerCase().includes(search)) ||
                (task.client && task.client.toLowerCase().includes(search)) ||
                (task.tags && task.tags.some(tag => tag.toLowerCase().includes(search)))
            );
        }
        
        // Special filters
        if (filters.overdue) {
            filtered = filtered.filter(task => {
                if (!task.dueDate || task.status === 'completed') return false;
                return new Date(task.dueDate) < new Date();
            });
        }
        
        if (filters.needsReply) {
            filtered = filtered.filter(task => 
                task.needsReply || (task.hasEmail && !task.emailReplied && task.status !== 'completed')
            );
        }
        
        return this.sortTasks(filtered, filters.sortBy || 'created');
    }

    sortTasks(tasks, sortBy) {
        const sorted = [...tasks];
        
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'dueDate':
                sorted.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'sender':
                sorted.sort((a, b) => {
                    const senderA = (a.emailFromName || a.emailFrom || 'ZZZ').toLowerCase();
                    const senderB = (b.emailFromName || b.emailFrom || 'ZZZ').toLowerCase();
                    return senderA.localeCompare(senderB);
                });
                break;
            case 'client':
                sorted.sort((a, b) => {
                    const clientA = (a.client || 'ZZZ').toLowerCase();
                    const clientB = (b.client || 'ZZZ').toLowerCase();
                    return clientA.localeCompare(clientB);
                });
                break;
            case 'updated':
                sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
            case 'created':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return sorted;
    }

    getStats() {
        const byStatus = {
            todo: this.tasks.filter(t => t.status === 'todo').length,
            'in-progress': this.tasks.filter(t => t.status === 'in-progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };

        return {
            total: this.tasks.length,
            byStatus,
            todo: byStatus.todo,
            inProgress: byStatus['in-progress'],
            completed: byStatus.completed,
            overdue: this.tasks.filter(t => {
                if (!t.dueDate || t.status === 'completed') return false;
                return new Date(t.dueDate) < new Date();
            }).length,
            needsReply: this.tasks.filter(t => 
                t.needsReply || (t.hasEmail && !t.emailReplied && t.status !== 'completed')
            ).length
        };
    }

    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveTasks() {
        try {
            localStorage.setItem('emailsort_tasks', JSON.stringify(this.tasks));
            console.log(`[TaskManager] Saved ${this.tasks.length} tasks`);
            return true;
        } catch (error) {
            console.error('[TaskManager] Error saving tasks:', error);
            return false;
        }
    }

    emitTaskUpdate(action, task) {
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('taskUpdate', {
                detail: { action, task }
            }));
        }
    }
}

// =====================================
// MODERN TASKS VIEW - AVEC AFFICHAGE CONTENU COMPLET
// =====================================
class TasksView {
    constructor() {
        this.currentFilters = {
            status: 'all',
            priority: 'all', 
            category: 'all',
            client: 'all',
            tag: 'all',
            search: '',
            sortBy: 'created',
            dateRange: 'all'
        };
        
        this.selectedTasks = new Set();
        this.currentViewMode = 'condensed';
        this.showCompleted = false;
        this.showAdvancedFilters = false;
        
        window.addEventListener('taskUpdate', () => {
            this.refreshView();
        });
    }

    // MÉTHODE PRINCIPALE POUR RENDRE L'INTERFACE - IDENTIQUE À PAGEMANAGER
    render(container) {
        if (!container) {
            console.error('[TasksView] No container provided');
            return;
        }

        if (!window.taskManager || !window.taskManager.initialized) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Chargement des tâches...</p>
                </div>
            `;
            
            setTimeout(() => {
                if (window.taskManager && window.taskManager.initialized) {
                    this.render(container);
                }
            }, 500);
            return;
        }

        const stats = window.taskManager.getStats();
        
        // INTERFACE IDENTIQUE À PAGEMANAGER - MÊME STRUCTURE
        container.innerHTML = `
            <div class="tasks-page-modern">
                <!-- Barre principale IDENTIQUE à PageManager -->
                <div class="tasks-main-toolbar">
                    <div class="toolbar-left">
                        <h1 class="tasks-title">Tâches</h1>
                        <span class="tasks-count-large">${stats.total} tâche${stats.total > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div class="toolbar-center">
                        <div class="search-wrapper-large">
                            <i class="fas fa-search search-icon-large"></i>
                            <input type="text" 
                                   class="search-input-large" 
                                   id="taskSearchInput"
                                   placeholder="Rechercher dans les tâches..." 
                                   value="${this.currentFilters.search}">
                            <button class="search-clear-large" id="searchClearBtn" 
                                    style="display: ${this.currentFilters.search ? 'flex' : 'none'}"
                                    onclick="window.tasksView.clearSearch()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-center-right">
                        <div class="view-modes-large">
                            <button class="btn-large ${this.currentViewMode === 'condensed' ? 'active' : ''}" 
                                    data-mode="condensed"
                                    onclick="window.tasksView.changeViewMode('condensed')">
                                <i class="fas fa-list"></i>
                                <span class="btn-text-large">Condensé</span>
                            </button>
                            <button class="btn-large ${this.currentViewMode === 'detailed' ? 'active' : ''}" 
                                    data-mode="detailed"
                                    onclick="window.tasksView.changeViewMode('detailed')">
                                <i class="fas fa-th-large"></i>
                                <span class="btn-text-large">Détaillé</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-right">
                        ${this.selectedTasks.size > 0 ? `
                            <div class="selection-info-large">
                                <span class="selection-count-large">${this.selectedTasks.size} sélectionné(s)</span>
                                <button class="btn-large btn-secondary-large" onclick="window.tasksView.clearSelection()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <button class="btn-large btn-primary-large" onclick="window.tasksView.bulkActions()">
                                <i class="fas fa-cog"></i>
                                <span class="btn-text-large">Actions</span>
                            </button>
                        ` : ''}
                        <button class="btn-large btn-primary-large" onclick="window.tasksView.showCreateModal()">
                            <i class="fas fa-plus"></i>
                            <span class="btn-text-large">Nouvelle tâche</span>
                        </button>
                    </div>
                </div>

                <!-- Filtres de statut avec bouton filtres avancés -->
                <div class="status-filters-large">
                    ${this.buildLargeStatusPills(stats)}
                    <button class="btn-large advanced-filters-toggle ${this.showAdvancedFilters ? 'active' : ''}" 
                            onclick="window.tasksView.toggleAdvancedFilters()">
                        <i class="fas fa-filter"></i>
                        <span class="btn-text-large">Filtres avancés</span>
                        <i class="fas fa-chevron-${this.showAdvancedFilters ? 'up' : 'down'}"></i>
                    </button>
                </div>

                <!-- Filtres avancés -->
                <div class="advanced-filters-panel ${this.showAdvancedFilters ? 'show' : ''}" id="advancedFiltersPanel">
                    <div class="advanced-filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-flag"></i> Priorité
                            </label>
                            <select class="filter-select" id="priorityFilter" 
                                    onchange="window.tasksView.updateFilter('priority', this.value)">
                                <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>Toutes</option>
                                <option value="urgent" ${this.currentFilters.priority === 'urgent' ? 'selected' : ''}>🚨 Urgente</option>
                                <option value="high" ${this.currentFilters.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                                <option value="medium" ${this.currentFilters.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                                <option value="low" ${this.currentFilters.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-building"></i> Client
                            </label>
                            <select class="filter-select" id="clientFilter" 
                                    onchange="window.tasksView.updateFilter('client', this.value)">
                                ${this.buildClientFilterOptions()}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-tags"></i> Tag
                            </label>
                            <select class="filter-select" id="tagFilter" 
                                    onchange="window.tasksView.updateFilter('tag', this.value)">
                                ${this.buildTagFilterOptions()}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-calendar"></i> Période
                            </label>
                            <select class="filter-select" id="dateRangeFilter" 
                                    onchange="window.tasksView.updateFilter('dateRange', this.value)">
                                <option value="all" ${this.currentFilters.dateRange === 'all' ? 'selected' : ''}>Toutes</option>
                                <option value="today" ${this.currentFilters.dateRange === 'today' ? 'selected' : ''}>Aujourd'hui</option>
                                <option value="week" ${this.currentFilters.dateRange === 'week' ? 'selected' : ''}>Cette semaine</option>
                                <option value="month" ${this.currentFilters.dateRange === 'month' ? 'selected' : ''}>Ce mois</option>
                                <option value="older" ${this.currentFilters.dateRange === 'older' ? 'selected' : ''}>Plus ancien</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-sort"></i> Trier par
                            </label>
                            <select class="filter-select" id="sortByFilter" 
                                    onchange="window.tasksView.updateFilter('sortBy', this.value)">
                                <option value="created" ${this.currentFilters.sortBy === 'created' ? 'selected' : ''}>Date création</option>
                                <option value="updated" ${this.currentFilters.sortBy === 'updated' ? 'selected' : ''}>Dernière modif</option>
                                <option value="priority" ${this.currentFilters.sortBy === 'priority' ? 'selected' : ''}>Priorité</option>
                                <option value="dueDate" ${this.currentFilters.sortBy === 'dueDate' ? 'selected' : ''}>Date échéance</option>
                                <option value="title" ${this.currentFilters.sortBy === 'title' ? 'selected' : ''}>Titre A-Z</option>
                                <option value="client" ${this.currentFilters.sortBy === 'client' ? 'selected' : ''}>Client</option>
                                <option value="sender" ${this.currentFilters.sortBy === 'sender' ? 'selected' : ''}>Expéditeur</option>
                            </select>
                        </div>

                        <div class="filter-actions">
                            <button class="btn-small btn-secondary" onclick="window.tasksView.resetAllFilters()">
                                <i class="fas fa-undo"></i> Réinitialiser
                            </button>
                            <div class="active-filters-count">
                                ${this.getActiveFiltersCount()} filtres actifs
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tasks-container-modern" id="tasksContainer">
                    ${this.renderTasksList()}
                </div>
            </div>
        `;

        // UTILISER LES MÊMES STYLES QUE PAGEMANAGER
        this.addModernTaskStyles();
        this.setupEventListeners();
        console.log('[TasksView] Modern interface rendered with PageManager styling');
    }

    // MÉTHODES IDENTIQUES À PAGEMANAGER
    buildLargeStatusPills(stats) {
        const pills = [
            { id: 'all', name: 'Toutes', icon: '📋', count: stats.total },
            { id: 'todo', name: 'À faire', icon: '⏳', count: stats.todo },
            { id: 'in-progress', name: 'En cours', icon: '🔄', count: stats.inProgress },
            { id: 'overdue', name: 'En retard', icon: '⚠️', count: stats.overdue },
            { id: 'needsReply', name: 'À répondre', icon: '📧', count: stats.needsReply },
            { id: 'completed', name: 'Terminées', icon: '✅', count: stats.completed }
        ];

        return pills.map(pill => `
            <button class="btn-large status-pill-large ${this.isFilterActive(pill.id) ? 'active' : ''}" 
                    data-filter="${pill.id}"
                    onclick="window.tasksView.quickFilter('${pill.id}')">
                <span class="pill-icon-large">${pill.icon}</span>
                <span class="pill-text-large">${pill.name}</span>
                <span class="pill-count-large">${pill.count}</span>
            </button>
        `).join('');
    }

    renderTasksList() {
        const tasks = window.taskManager.filterTasks(this.currentFilters);
        const filteredTasks = this.showCompleted ? tasks : tasks.filter(task => task.status !== 'completed');
        
        if (filteredTasks.length === 0) {
            return this.renderEmptyState();
        }

        switch (this.currentViewMode) {
            case 'detailed':
                return this.renderDetailedView(filteredTasks);
            case 'condensed':
            default:
                return this.renderCondensedView(filteredTasks);
        }
    }

    renderEmptyState() {
        return `
            <div class="empty-state-modern">
                <div class="empty-state-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <h3 class="empty-state-title">Aucune tâche trouvée</h3>
                <p class="empty-state-text">
                    ${this.hasActiveFilters() ? 'Aucune tâche ne correspond à vos critères' : 'Vous n\'avez aucune tâche'}
                </p>
                ${this.hasActiveFilters() ? `
                    <button class="btn-large btn-primary-large" onclick="window.tasksView.resetAllFilters()">
                        <i class="fas fa-undo"></i>
                        <span>Réinitialiser les filtres</span>
                    </button>
                ` : `
                    <button class="btn-large btn-primary-large" onclick="window.tasksView.showCreateModal()">
                        <i class="fas fa-plus"></i>
                        <span>Créer votre première tâche</span>
                    </button>
                `}
            </div>
        `;
    }

    renderCondensedView(tasks) {
        return `
            <div class="tasks-condensed-list">
                ${tasks.map(task => this.renderCondensedTaskItem(task)).join('')}
            </div>
        `;
    }

    // RENDU IDENTIQUE À L'INTERFACE EMAIL DE PAGEMANAGER AVEC BOUTON RÉPONDRE
    renderCondensedTaskItem(task) {
        const isSelected = this.selectedTasks.has(task.id);
        const isCompleted = task.status === 'completed';
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusIcon = this.getStatusIcon(task.status);
        
        const clientInfo = task.hasEmail ? 
            `@${task.emailDomain || 'email'}` : 
            task.client || 'Interne';
            
        const dueDateInfo = this.formatDueDate(task.dueDate);
        
        // Déterminer si on montre le bouton de réponse
        const showReplyButton = task.hasEmail && !task.emailReplied && task.status !== 'completed';
        const hasAiSuggestions = task.suggestedReplies && task.suggestedReplies.length > 0;
        
        return `
            <div class="task-condensed ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                 data-task-id="${task.id}"
                 onclick="window.tasksView.handleTaskClick(event, '${task.id}')">
                
                <input type="checkbox" 
                       class="task-checkbox-condensed" 
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); window.tasksView.toggleTaskSelection('${task.id}')">
                
                <div class="task-indicators">
                    <div class="priority-indicator priority-${task.priority}" title="Priorité ${task.priority}">
                        ${priorityIcon}
                    </div>
                    <div class="status-indicator status-${task.status}" title="Statut: ${task.status}">
                        ${statusIcon}
                    </div>
                </div>
                
                <div class="task-content-condensed">
                    <div class="task-header-line">
                        <span class="task-title-large">${this.escapeHtml(task.title)}</span>
                        <div class="task-meta-right">
                            <span class="client-badge">${clientInfo}</span>
                            ${dueDateInfo.html}
                            <span class="task-date-large">${this.formatRelativeDate(task.createdAt)}</span>
                        </div>
                    </div>
                    
                    ${task.hasEmail ? `
                        <div class="task-email-line">
                            <i class="fas fa-envelope"></i>
                            <span class="email-from">${this.escapeHtml(task.emailFromName || task.emailFrom || 'Email')}</span>
                            ${task.needsReply || showReplyButton ? 
                                '<span class="reply-needed">📧 Réponse requise</span>' : ''
                            }
                            ${hasAiSuggestions ? 
                                '<span class="has-ai-suggestions">🤖 Suggestions IA</span>' : ''
                            }
                            ${task.aiRepliesGenerated ? 
                                '<span class="ai-generated-badge">✨ IA</span>' : ''
                            }
                            ${task.tags && task.tags.length > 0 ? `
                                <div class="task-tags-line">
                                    <i class="fas fa-tags"></i>
                                    ${task.tags.slice(0, 3).map(tag => `
                                        <span class="task-tag" onclick="event.stopPropagation(); window.tasksView.filterByTag('${tag}')">#${tag}</span>
                                    `).join('')}
                                    ${task.tags.length > 3 ? `<span class="tags-more">+${task.tags.length - 3}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${showReplyButton ? `
                        <div class="task-reply-section">
                            <button class="reply-to-email-btn" 
                                    onclick="event.stopPropagation(); window.tasksView.replyToEmailWithAI('${task.id}')"
                                    title="${hasAiSuggestions ? 'Répondre avec suggestions IA' : 'Répondre à l\'email'}">
                                <i class="fas fa-reply"></i>
                                <span>Répondre au mail</span>
                                ${hasAiSuggestions ? '<i class="fas fa-robot ai-icon"></i>' : ''}
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="task-actions-condensed">
                    ${this.renderQuickActions(task)}
                </div>
            </div>
        `;
    }

    renderQuickActions(task, minimal = false) {
        const actions = [];
        
        if (task.status !== 'completed') {
            actions.push(`
                <button class="action-btn-modern complete" 
                        onclick="event.stopPropagation(); window.tasksView.markComplete('${task.id}')"
                        title="Marquer comme terminé">
                    <i class="fas fa-check"></i>
                </button>
            `);
        }
        
        // Bouton pour régénérer les suggestions IA
        if (task.hasEmail && window.aiTaskAnalyzer?.apiKey) {
            actions.push(`
                <button class="action-btn-modern ai-refresh" 
                        onclick="event.stopPropagation(); window.tasksView.regenerateAISuggestions('${task.id}')"
                        title="Régénérer suggestions IA">
                    <i class="fas fa-robot"></i>
                </button>
            `);
        }
        
        if (!minimal) {
            actions.push(`
                <button class="action-btn-modern edit" 
                        onclick="event.stopPropagation(); window.tasksView.showTaskDetails('${task.id}')"
                        title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
            `);
        }
        
        // Bouton de suppression modifié avec confirmation
        actions.push(`
            <button class="action-btn-modern delete-btn" 
                    onclick="event.stopPropagation(); window.tasksView.confirmDeleteTask('${task.id}')"
                    title="Supprimer cette tâche"
                    data-task-title="${this.escapeHtml(task.title)}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `);
        
        return actions.join('');
    }

    // NOUVELLE MÉTHODE POUR CONFIRMATION DE SUPPRESSION
    confirmDeleteTask(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        const modalHTML = `
            <div id="deleteConfirmModal" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 12px; max-width: 500px; width: 100%; 
                           box-shadow: 0 10px 40px rgba(0,0,0,0.3); border: 1px solid #e5e7eb;">
                    <div style="padding: 24px 24px 16px 24px; text-align: center;">
                        <div style="width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; 
                                   display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 28px; color: #dc2626;"></i>
                        </div>
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #1f2937;">Confirmer la suppression</h3>
                        <p style="margin: 0 0 16px 0; color: #6b7280; line-height: 1.5;">
                            Êtes-vous sûr de vouloir supprimer cette tâche ?
                        </p>
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                            <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                                ${this.escapeHtml(task.title)}
                            </div>
                            ${task.hasEmail ? `
                                <div style="font-size: 14px; color: #6b7280;">
                                    <i class="fas fa-envelope"></i> Email de ${task.emailFromName || task.emailFrom}
                                </div>
                            ` : ''}
                        </div>
                        <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: 500;">
                            ⚠️ Cette action est irréversible
                        </p>
                    </div>
                    <div style="padding: 16px 24px 24px 24px; display: flex; justify-content: center; gap: 12px;">
                        <button onclick="document.getElementById('deleteConfirmModal').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 10px 20px; background: #f3f4f6; border: 1px solid #d1d5db; 
                                       border-radius: 8px; cursor: pointer; font-weight: 500; color: #374151;">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button onclick="window.tasksView.executeDelete('${task.id}'); document.getElementById('deleteConfirmModal').remove();"
                                style="padding: 10px 20px; background: #dc2626; color: white; border: none; 
                                       border-radius: 8px; cursor: pointer; font-weight: 500;">
                            <i class="fas fa-trash-alt"></i> Supprimer définitivement
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    executeDelete(taskId) {
        window.taskManager.deleteTask(taskId);
        this.selectedTasks.delete(taskId);
        document.body.style.overflow = 'auto';
        this.showToast('Tâche supprimée définitivement', 'success');
    }

    // MÉTHODE POUR FILTRER PAR TAG
    filterByTag(tag) {
        this.currentFilters.tag = tag;
        this.showAdvancedFilters = true;
        
        // Mettre à jour le select
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            tagFilter.value = tag;
        }
        
        this.refreshView();
        this.showToast(`Filtré par tag: #${tag}`, 'info');
    }

    // Event handlers et interactions IDENTIQUES À PAGEMANAGER
    handleTaskClick(event, taskId) {
        if (this.currentViewMode === 'condensed') {
            this.showTaskDetails(taskId);
        } else {
            this.toggleTaskSelection(taskId);
        }
    }

    quickFilter(filterId) {
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: this.currentFilters.search,
            sortBy: this.currentFilters.sortBy,
            overdue: false,
            needsReply: false
        };

        switch (filterId) {
            case 'all':
                break;
            case 'todo':
            case 'in-progress':
            case 'completed':
                this.currentFilters.status = filterId;
                break;
            case 'overdue':
                this.currentFilters.overdue = true;
                break;
            case 'needsReply':
                this.currentFilters.needsReply = true;
                break;
        }

        this.refreshView();
    }

    showTaskDetails(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        const uniqueId = 'task_details_modal_' + Date.now();
        
        const modalHTML = `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 12px; max-width: 1000px; width: 100%; 
                           max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 30px rgba(0,0,0,0.3);">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 20px;">Détails de la tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 20px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        ${this.buildTaskDetailsContent(task)}
                    </div>
                    <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">
                            Fermer
                        </button>
                        ${task.hasEmail && task.suggestedReplies && task.suggestedReplies.length > 0 ? `
                            <button onclick="window.tasksView.showSuggestedReplies('${task.id}');"
                                    style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-reply"></i> Voir suggestions de réponse
                            </button>
                        ` : ''}
                        ${task.status !== 'completed' ? `
                            <button onclick="window.tasksView.markComplete('${task.id}'); document.getElementById('${uniqueId}').remove();"
                                    style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-check"></i> Marquer terminé
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    // CONTENU DES DÉTAILS AVEC CONTENU EMAIL COMPLET ET SUGGESTIONS DE RÉPONSE
    buildTaskDetailsContent(task) {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusLabel = this.getStatusLabel(task.status);
        const dueDateInfo = this.formatDueDate(task.dueDate);
        
        return `
            <div class="task-details-content">
                <div class="details-header">
                    <h1 class="task-title-details">${this.escapeHtml(task.title)}</h1>
                    <div class="task-meta-badges">
                        <span class="priority-badge priority-${task.priority}">
                            ${priorityIcon} ${this.getPriorityLabel(task.priority)}
                        </span>
                        <span class="status-badge status-${task.status}">
                            ${this.getStatusIcon(task.status)} ${statusLabel}
                        </span>
                        ${dueDateInfo.html}
                    </div>
                </div>

                ${task.hasEmail ? `
                    <div class="details-section">
                        <h3><i class="fas fa-envelope"></i> Informations Email</h3>
                        <div class="email-details-grid">
                            <div class="email-detail-item">
                                <strong>Expéditeur:</strong>
                                <span>${this.escapeHtml(task.emailFromName || task.emailFrom || 'Inconnu')}</span>
                            </div>
                            ${task.emailFrom ? `
                                <div class="email-detail-item">
                                    <strong>Email:</strong>
                                    <span>${this.escapeHtml(task.emailFrom)}</span>
                                </div>
                            ` : ''}
                            ${task.emailSubject ? `
                                <div class="email-detail-item">
                                    <strong>Sujet:</strong>
                                    <span>${this.escapeHtml(task.emailSubject)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${task.description && task.description !== task.title ? `
                    <div class="details-section">
                        <h3><i class="fas fa-align-left"></i> Description</h3>
                        <div class="description-content">
                            ${this.formatDescription(task.description)}
                        </div>
                    </div>
                ` : ''}

                ${task.actions && task.actions.length > 0 ? `
                    <div class="details-section">
                        <h3><i class="fas fa-tasks"></i> Actions Requises</h3>
                        <div class="actions-list-details">
                            ${task.actions.map((action, idx) => `
                                <div class="action-item-details">
                                    <span class="action-number">${idx + 1}</span>
                                    <span class="action-text">${this.escapeHtml(action.text)}</span>
                                    ${action.deadline ? `
                                        <span class="action-deadline">${this.formatDeadline(action.deadline)}</span>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${task.keyInfo && task.keyInfo.length > 0 ? `
                    <div class="details-section">
                        <h3><i class="fas fa-info-circle"></i> Informations Clés</h3>
                        <div class="info-grid">
                            ${task.keyInfo.map(info => `
                                <div class="info-item">
                                    <i class="fas fa-chevron-right"></i>
                                    <span>${this.escapeHtml(info)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${task.risks && task.risks.length > 0 ? `
                    <div class="details-section attention-section">
                        <h3><i class="fas fa-exclamation-triangle"></i> Points d'Attention</h3>
                        <div class="attention-list">
                            ${task.risks.map(risk => `
                                <div class="attention-item">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <span>${this.escapeHtml(risk)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${task.suggestedReplies && task.suggestedReplies.length > 0 ? `
                    <div class="details-section suggested-replies-section">
                        <h3><i class="fas fa-reply-all"></i> Suggestions de Réponse Personnalisées</h3>
                        <div class="suggested-replies-container">
                            ${task.suggestedReplies.map((reply, idx) => `
                                <div class="suggested-reply-card">
                                    <div class="reply-header">
                                        <div class="reply-tone-badge ${reply.tone}">
                                            ${this.getReplyToneIcon(reply.tone)} ${this.getReplyToneLabel(reply.tone)}
                                        </div>
                                        <button class="copy-reply-btn" onclick="window.tasksView.copyReplyToClipboard(${idx}, '${task.id}')">
                                            <i class="fas fa-copy"></i> Copier
                                        </button>
                                    </div>
                                    <div class="reply-subject">
                                        <strong>Sujet:</strong> ${this.escapeHtml(reply.subject)}
                                    </div>
                                    <div class="reply-content">
                                        ${this.escapeHtml(reply.content).replace(/\n/g, '<br>')}
                                    </div>
                                    <div class="reply-actions">
                                        <button class="use-reply-btn" onclick="window.tasksView.useReply('${task.id}', ${idx})">
                                            <i class="fas fa-paper-plane"></i> Utiliser cette réponse
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${task.emailContent && task.emailContent.length > 100 ? `
                    <div class="details-section">
                        <h3><i class="fas fa-envelope-open"></i> Contenu de l'Email</h3>
                        <div class="email-content-section">
                            ${task.emailHtmlContent ? `
                                <div class="email-content-tabs">
                                    <button class="tab-btn active" onclick="window.tasksView.switchEmailTab('html', '${task.id}')">
                                        <i class="fas fa-eye"></i> Vue formatée
                                    </button>
                                    <button class="tab-btn" onclick="window.tasksView.switchEmailTab('text', '${task.id}')">
                                        <i class="fas fa-code"></i> Vue texte
                                    </button>
                                </div>
                                <div class="email-content-box">
                                    <div id="email-html-${task.id}" class="email-content-view active">
                                        ${task.emailHtmlContent}
                                    </div>
                                    <div id="email-text-${task.id}" class="email-content-view" style="display: none;">
                                        ${this.formatEmailContent(task.emailContent)}
                                    </div>
                                </div>
                            ` : `
                                <div class="email-content-box">
                                    ${this.formatEmailContent(task.emailContent)}
                                </div>
                            `}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // NOUVELLE MÉTHODE POUR GÉRER LES ONGLETS EMAIL
    switchEmailTab(tabType, taskId) {
        // Gérer les onglets
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        // Gérer les contenus
        const htmlView = document.getElementById(`email-html-${taskId}`);
        const textView = document.getElementById(`email-text-${taskId}`);
        
        if (tabType === 'html') {
            htmlView.style.display = 'block';
            htmlView.classList.add('active');
            textView.style.display = 'none';
            textView.classList.remove('active');
        } else {
            htmlView.style.display = 'none';
            htmlView.classList.remove('active');
            textView.style.display = 'block';
            textView.classList.add('active');
        }
    }

    // NOUVELLE MÉTHODE POUR AFFICHER LES SUGGESTIONS DE RÉPONSE
    showSuggestedReplies(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.suggestedReplies || task.suggestedReplies.length === 0) return;

        const uniqueId = 'replies_modal_' + Date.now();
        
        const modalHTML = `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; 
                           max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 30px rgba(0,0,0,0.3);">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 20px;"><i class="fas fa-reply-all"></i> Suggestions de Réponse</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 20px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div class="ai-suggestions-info">
                            <div class="ai-badge">
                                <i class="fas fa-robot"></i>
                                <span>Suggestions générées par Claude AI</span>
                            </div>
                            <p>Ces réponses ont été personnalisées selon le contexte de l'email de <strong>${task.emailFromName || 'l\'expéditeur'}</strong></p>
                            ${task.aiRepliesGeneratedAt ? `
                                <p class="ai-generation-time">
                                    <i class="fas fa-clock"></i>
                                    Générées le ${new Date(task.aiRepliesGeneratedAt).toLocaleString('fr-FR')}
                                </p>
                            ` : ''}
                            ${window.aiTaskAnalyzer?.apiKey ? `
                                <div class="ai-actions">
                                    <button class="btn-sm btn-secondary" onclick="window.tasksView.regenerateAISuggestions('${taskId}')">
                                        <i class="fas fa-sync"></i> Régénérer
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="replies-list">
                            ${task.suggestedReplies.map((reply, idx) => `
                                <div class="reply-suggestion-card">
                                    <div class="reply-card-header">
                                        <div class="reply-tone-badge ${reply.tone}">
                                            ${this.getReplyToneIcon(reply.tone)} ${this.getReplyToneLabel(reply.tone)}
                                        </div>
                                        <div class="reply-card-actions">
                                            <button class="btn-sm btn-secondary" onclick="window.tasksView.copyReplyToClipboard(${idx}, '${taskId}')">
                                                <i class="fas fa-copy"></i> Copier
                                            </button>
                                            <button class="btn-sm btn-primary" onclick="window.tasksView.useReply('${taskId}', ${idx})">
                                                <i class="fas fa-paper-plane"></i> Utiliser
                                            </button>
                                        </div>
                                    </div>
                                    <div class="reply-subject-line">
                                        <strong>Sujet:</strong> ${this.escapeHtml(reply.subject)}
                                    </div>
                                    <div class="reply-content-preview">
                                        ${this.escapeHtml(reply.content).replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    // NOUVELLE MÉTHODE POUR COPIER UNE RÉPONSE
    async copyReplyToClipboard(replyIndex, taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.suggestedReplies || !task.suggestedReplies[replyIndex]) return;

        const reply = task.suggestedReplies[replyIndex];
        const text = `Sujet: ${reply.subject}\n\n${reply.content}`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Réponse copiée dans le presse-papiers', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showToast('Erreur lors de la copie', 'error');
        }
    }

    // NOUVELLE MÉTHODE POUR UTILISER UNE RÉPONSE
    useReply(taskId, replyIndex) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.suggestedReplies || !task.suggestedReplies[replyIndex]) return;

        const reply = task.suggestedReplies[replyIndex];
        const subject = reply.subject;
        const body = reply.content;
        const to = task.emailFrom;
        
        // Créer le lien mailto
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Ouvrir le client email
        window.open(mailtoLink);
        
        // Marquer comme répondu
        window.taskManager.updateTask(taskId, { 
            emailReplied: true,
            status: task.status === 'todo' ? 'in-progress' : task.status
        });
        
        this.showToast('Email de réponse ouvert dans votre client email', 'success');
        
        // Fermer les modals
        document.querySelectorAll('[id^="replies_modal_"], [id^="task_details_modal_"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
    }

    // NOUVELLE MÉTHODE POUR FORMATER LE CONTENU EMAIL
    formatEmailContent(content) {
        if (!content) return '<p>Contenu non disponible</p>';
        
        // Préserver la structure de l'email
        const formattedContent = content
            .replace(/\n/g, '<br>')
            .replace(/Email de:/g, '<strong>Email de:</strong>')
            .replace(/Date:/g, '<strong>Date:</strong>')
            .replace(/Sujet:/g, '<strong>Sujet:</strong>');
            
        return `<div class="email-original-content">${formattedContent}</div>`;
    }

    // Utility methods IDENTIQUES À PAGEMANAGER
    getPriorityIcon(priority) {
        const icons = { urgent: '🚨', high: '⚡', medium: '📌', low: '📄' };
        return icons[priority] || '📌';
    }

    getPriorityLabel(priority) {
        const labels = { urgent: 'Urgente', high: 'Haute', medium: 'Normale', low: 'Basse' };
        return labels[priority] || 'Normale';
    }

    getStatusIcon(status) {
        const icons = { todo: '⏳', 'in-progress': '🔄', completed: '✅' };
        return icons[status] || '⏳';
    }

    getStatusLabel(status) {
        const labels = { todo: 'À faire', 'in-progress': 'En cours', completed: 'Terminé' };
        return labels[status] || 'À faire';
    }

    getReplyToneIcon(tone) {
        const icons = {
            formel: '👔',
            informel: '😊',
            urgent: '🚨',
            neutre: '📝',
            amical: '🤝'
        };
        return icons[tone] || '📝';
    }

    getReplyToneLabel(tone) {
        const labels = {
            formel: 'Formel',
            informel: 'Informel',
            urgent: 'Urgent',
            neutre: 'Neutre',
            amical: 'Amical'
        };
        return labels[tone] || 'Neutre';
    }

    formatDueDate(dateString) {
        if (!dateString) return { html: '', text: '' };
        
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        let className = 'due-date-normal';
        let text = '';
        
        if (diffDays < 0) {
            className = 'due-date-overdue';
            text = `En retard de ${Math.abs(diffDays)}j`;
        } else if (diffDays === 0) {
            className = 'due-date-today';
            text = 'Aujourd\'hui';
        } else if (diffDays === 1) {
            className = 'due-date-tomorrow';
            text = 'Demain';
        } else if (diffDays <= 7) {
            className = 'due-date-soon';
            text = `${diffDays}j`;
        } else {
            text = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
        
        return {
            html: `<span class="due-date-badge ${className}">📅 ${text}</span>`,
            text: text
        };
    }

    formatRelativeDate(dateString) {
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
            return date.toLocaleDateString('fr-FR');
        }
    }

    formatDescription(description) {
        if (!description) return '';
        
        if (description.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) {
            return `<div class="structured-description">${description.replace(/\n/g, '<br>')}</div>`;
        } else {
            return `<div class="simple-description">${this.escapeHtml(description).replace(/\n/g, '<br>')}</div>`;
        }
    }

    formatDeadline(deadline) {
        if (!deadline) return '';
        
        try {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                return `Échue il y a ${Math.abs(diffDays)}j`;
            } else if (diffDays === 0) {
                return 'Aujourd\'hui';
            } else if (diffDays === 1) {
                return 'Demain';
            } else if (diffDays <= 7) {
                return `${diffDays}j`;
            } else {
                return deadlineDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short' 
                });
            }
        } catch (error) {
            return deadline;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isFilterActive(filterId) {
        switch (filterId) {
            case 'all': return this.currentFilters.status === 'all' && !this.currentFilters.overdue && !this.currentFilters.needsReply;
            case 'todo': return this.currentFilters.status === 'todo';
            case 'in-progress': return this.currentFilters.status === 'in-progress';
            case 'completed': return this.currentFilters.status === 'completed';
            case 'overdue': return this.currentFilters.overdue;
            case 'needsReply': return this.currentFilters.needsReply;
            default: return false;
        }
    }

    hasActiveFilters() {
        return this.currentFilters.status !== 'all' ||
               this.currentFilters.priority !== 'all' ||
               this.currentFilters.category !== 'all' ||
               this.currentFilters.client !== 'all' ||
               this.currentFilters.tag !== 'all' ||
               this.currentFilters.dateRange !== 'all' ||
               this.currentFilters.search !== '' ||
               this.currentFilters.overdue ||
               this.currentFilters.needsReply;
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        
        document.querySelectorAll('.btn-large[data-mode]').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.refreshView();
    }

    toggleTaskSelection(taskId) {
        if (this.selectedTasks.has(taskId)) {
            this.selectedTasks.delete(taskId);
        } else {
            this.selectedTasks.add(taskId);
        }
        
        this.updateSelectionUI();
        this.render(document.querySelector('.tasks-page-modern')?.parentElement);
    }

    clearSelection() {
        this.selectedTasks.clear();
        this.render(document.querySelector('.tasks-page-modern')?.parentElement);
    }

    markComplete(taskId) {
        window.taskManager.updateTask(taskId, { status: 'completed' });
        this.showToast('Tâche marquée comme terminée', 'success');
    }

    // NOUVELLE MÉTHODE POUR RÉPONDRE AVEC IA
    async replyToEmailWithAI(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        // Si on a déjà des suggestions IA, les afficher
        if (task.suggestedReplies && task.suggestedReplies.length > 0) {
            this.showSuggestedReplies(taskId);
            return;
        }
        
        // Sinon, générer des suggestions en temps réel
        try {
            this.showToast('Génération de suggestions IA...', 'info');
            
            const newSuggestions = await window.taskManager.generateIntelligentReplySuggestions(
                { 
                    from: { emailAddress: { name: task.emailFromName, address: task.emailFrom } },
                    subject: task.emailSubject,
                    body: { content: task.emailContent },
                    bodyPreview: task.emailContent
                }, 
                task
            );
            
            // Mettre à jour la tâche avec les nouvelles suggestions
            if (newSuggestions && newSuggestions.length > 0) {
                window.taskManager.updateTask(taskId, { 
                    suggestedReplies: newSuggestions,
                    aiRepliesGenerated: true,
                    aiRepliesGeneratedAt: new Date().toISOString()
                });
                
                this.showToast('Suggestions IA générées !', 'success');
                this.showSuggestedReplies(taskId);
                this.refreshView();
            } else {
                this.showToast('Impossible de générer des suggestions', 'warning');
                this.replyToEmailBasic(taskId);
            }
            
        } catch (error) {
            console.error('[TasksView] Error generating AI suggestions:', error);
            this.showToast('Erreur IA, réponse basique', 'warning');
            this.replyToEmailBasic(taskId);
        }
    }

    // MÉTHODE POUR RÉGÉNÉRER LES SUGGESTIONS IA
    async regenerateAISuggestions(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        try {
            this.showToast('Régénération des suggestions IA...', 'info');
            
            const newSuggestions = await window.taskManager.generateIntelligentReplySuggestions(
                { 
                    from: { emailAddress: { name: task.emailFromName, address: task.emailFrom } },
                    subject: task.emailSubject,
                    body: { content: task.emailContent },
                    bodyPreview: task.emailContent
                }, 
                task
            );
            
            if (newSuggestions && newSuggestions.length > 0) {
                window.taskManager.updateTask(taskId, { 
                    suggestedReplies: newSuggestions,
                    aiRepliesGenerated: true,
                    aiRepliesGeneratedAt: new Date().toISOString()
                });
                
                this.showToast('Nouvelles suggestions IA générées !', 'success');
                this.refreshView();
            } else {
                this.showToast('Impossible de régénérer les suggestions', 'warning');
            }
            
        } catch (error) {
            console.error('[TasksView] Error regenerating AI suggestions:', error);
            this.showToast('Erreur lors de la régénération', 'error');
        }
    }

    // MÉTHODE DE RÉPONSE BASIQUE EN FALLBACK
    replyToEmailBasic(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        const subject = `Re: ${task.emailSubject || 'Votre message'}`;
        const to = task.emailFrom;
        const body = `Bonjour ${task.emailFromName || ''},\n\nMerci pour votre message.\n\nCordialement,`;
        
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        window.taskManager.updateTask(taskId, { emailReplied: true });
        this.showToast('Email de réponse ouvert', 'success');
    }

    replyToEmail(taskId) {
        // Rediriger vers la méthode avec IA
        this.replyToEmailWithAI(taskId);
    }

    deleteTask(taskId) {
        // Rediriger vers la confirmation
        this.confirmDeleteTask(taskId);
    }

    showCreateModal() {
        // Implementation for creating new tasks
        const uniqueId = 'create_task_modal_' + Date.now();
        
        const modalHTML = `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 12px; max-width: 600px; width: 100%; 
                           max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 30px rgba(0,0,0,0.3);">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 20px;">Créer une nouvelle tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 20px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div class="form-group">
                            <label>Titre de la tâche *</label>
                            <input type="text" id="new-task-title" class="form-input" placeholder="Titre de la tâche" />
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="new-task-description" class="form-textarea" rows="4" placeholder="Description détaillée..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="new-task-priority" class="form-select">
                                    <option value="low">📄 Basse</option>
                                    <option value="medium" selected>📌 Normale</option>
                                    <option value="high">⚡ Haute</option>
                                    <option value="urgent">🚨 Urgente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date d'échéance</label>
                                <input type="date" id="new-task-duedate" class="form-input" />
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Client/Projet</label>
                            <input type="text" id="new-task-client" class="form-input" placeholder="Nom du client ou projet" value="Interne" />
                        </div>
                    </div>
                    <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">
                            Annuler
                        </button>
                        <button onclick="window.tasksView.createNewTask('${uniqueId}');"
                                style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Créer la tâche
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        
        // Focus sur le titre
        setTimeout(() => {
            const titleInput = document.getElementById('new-task-title');
            if (titleInput) titleInput.focus();
        }, 100);
    }

    createNewTask(modalId) {
        const title = document.getElementById('new-task-title')?.value?.trim();
        const description = document.getElementById('new-task-description')?.value?.trim();
        const priority = document.getElementById('new-task-priority')?.value;
        const dueDate = document.getElementById('new-task-duedate')?.value;
        const client = document.getElementById('new-task-client')?.value?.trim();

        if (!title) {
            this.showToast('Le titre est requis', 'warning');
            return;
        }

        const taskData = {
            title,
            description,
            priority,
            dueDate: dueDate || null,
            client: client || 'Interne',
            category: 'work',
            method: 'manual'
        };

        try {
            const task = window.taskManager.createTask(taskData);
            document.getElementById(modalId).remove();
            document.body.style.overflow = 'auto';
            
            this.showToast('Tâche créée avec succès', 'success');
            this.refreshView();
        } catch (error) {
            console.error('[TasksView] Error creating task:', error);
            this.showToast('Erreur lors de la création', 'error');
        }
    }

    clearSearch() {
        this.currentFilters.search = '';
        const searchInput = document.getElementById('taskSearchInput');
        if (searchInput) searchInput.value = '';
        this.refreshView();
    }

    // NOUVELLES MÉTHODES POUR LES FILTRES AVANCÉS
    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;
        
        const panel = document.getElementById('advancedFiltersPanel');
        const toggle = document.querySelector('.advanced-filters-toggle');
        
        if (panel) {
            panel.classList.toggle('show', this.showAdvancedFilters);
        }
        
        if (toggle) {
            toggle.classList.toggle('active', this.showAdvancedFilters);
            const chevron = toggle.querySelector('.fa-chevron-down, .fa-chevron-up');
            if (chevron) {
                chevron.classList.toggle('fa-chevron-down', !this.showAdvancedFilters);
                chevron.classList.toggle('fa-chevron-up', this.showAdvancedFilters);
            }
        }
    }

    buildClientFilterOptions() {
        const tasks = window.taskManager.getAllTasks();
        const clients = new Set();
        
        tasks.forEach(task => {
            if (task.client) {
                clients.add(task.client);
            }
        });
        
        let options = `<option value="all" ${this.currentFilters.client === 'all' ? 'selected' : ''}>Tous les clients</option>`;
        
        Array.from(clients).sort().forEach(client => {
            const count = tasks.filter(t => t.client === client).length;
            options += `<option value="${client}" ${this.currentFilters.client === client ? 'selected' : ''}>${client} (${count})</option>`;
        });
        
        return options;
    }

    buildTagFilterOptions() {
        const tasks = window.taskManager.getAllTasks();
        const tags = new Set();
        
        tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => tags.add(tag));
            }
        });
        
        let options = `<option value="all" ${this.currentFilters.tag === 'all' ? 'selected' : ''}>Tous les tags</option>`;
        
        Array.from(tags).sort().forEach(tag => {
            const count = tasks.filter(t => t.tags && t.tags.includes(tag)).length;
            options += `<option value="${tag}" ${this.currentFilters.tag === tag ? 'selected' : ''}>#${tag} (${count})</option>`;
        });
        
        return options;
    }

    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.refreshView();
        console.log('[TasksView] Filter updated:', filterType, '=', value);
    }

    getActiveFiltersCount() {
        let count = 0;
        
        if (this.currentFilters.status !== 'all') count++;
        if (this.currentFilters.priority !== 'all') count++;
        if (this.currentFilters.client !== 'all') count++;
        if (this.currentFilters.tag !== 'all') count++;
        if (this.currentFilters.dateRange !== 'all') count++;
        if (this.currentFilters.search !== '') count++;
        if (this.currentFilters.overdue) count++;
        if (this.currentFilters.needsReply) count++;
        
        return count;
    }

    resetAllFilters() {
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            client: 'all',
            tag: 'all',
            search: '',
            sortBy: 'created',
            dateRange: 'all',
            overdue: false,
            needsReply: false
        };
        
        // Reset search input
        const searchInput = document.getElementById('taskSearchInput');
        if (searchInput) searchInput.value = '';
        
        // Reset all filter selects
        document.querySelectorAll('.filter-select').forEach(select => {
            if (select.querySelector('option[value="all"]')) {
                select.value = 'all';
            } else if (select.id === 'sortByFilter') {
                select.value = 'created';
            }
        });
        
        this.refreshView();
        this.showToast('Filtres réinitialisés', 'info');
    }

    bulkActions() {
        if (this.selectedTasks.size === 0) return;
        
        const actions = [
            'Marquer comme terminé',
            'Changer la priorité',
            'Supprimer',
            'Exporter'
        ];
        
        const action = prompt(`Actions disponibles pour ${this.selectedTasks.size} tâche(s):\n\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nEntrez le numéro de l'action:`);
        
        if (!action) return;
        
        const actionIndex = parseInt(action) - 1;
        
        switch (actionIndex) {
            case 0: // Marquer comme terminé
                this.selectedTasks.forEach(taskId => {
                    window.taskManager.updateTask(taskId, { status: 'completed' });
                });
                this.showToast(`${this.selectedTasks.size} tâche(s) marquée(s) comme terminée(s)`, 'success');
                this.clearSelection();
                break;
                
            case 1: // Changer la priorité
                const priority = prompt('Nouvelle priorité:\n1. Basse\n2. Normale\n3. Haute\n4. Urgente\n\nEntrez le numéro:');
                const priorities = ['', 'low', 'medium', 'high', 'urgent'];
                if (priority && priorities[parseInt(priority)]) {
                    this.selectedTasks.forEach(taskId => {
                        window.taskManager.updateTask(taskId, { priority: priorities[parseInt(priority)] });
                    });
                    this.showToast(`Priorité mise à jour pour ${this.selectedTasks.size} tâche(s)`, 'success');
                    this.clearSelection();
                }
                break;
                
            case 2: // Supprimer
                if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedTasks.size} tâche(s) ?`)) {
                    this.selectedTasks.forEach(taskId => {
                        window.taskManager.deleteTask(taskId);
                    });
                    this.showToast(`${this.selectedTasks.size} tâche(s) supprimée(s)`, 'success');
                    this.clearSelection();
                }
                break;
                
            case 3: // Exporter
                this.exportSelectedTasks();
                break;
        }
    }

    exportSelectedTasks() {
        const tasks = Array.from(this.selectedTasks).map(id => window.taskManager.getTask(id)).filter(Boolean);
        
        const csvContent = [
            ['Titre', 'Description', 'Priorité', 'Statut', 'Échéance', 'Client', 'Créé le'].join(','),
            ...tasks.map(task => [
                `"${task.title}"`,
                `"${task.description || ''}"`,
                task.priority,
                task.status,
                task.dueDate || '',
                task.client || '',
                new Date(task.createdAt).toLocaleDateString('fr-FR')
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `taches_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Export terminé', 'success');
    }

    updateSelectionUI() {
        document.querySelectorAll('[data-task-id]').forEach(item => {
            const taskId = item.dataset.taskId;
            const isSelected = this.selectedTasks.has(taskId);
            
            item.classList.toggle('selected', isSelected);
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = isSelected;
        });
    }

    refreshView() {
        const container = document.getElementById('tasksContainer');
        if (container) {
            container.innerHTML = this.renderTasksList();
        }
        
        const stats = window.taskManager.getStats();
        document.querySelectorAll('.status-filters-large').forEach(container => {
            container.innerHTML = this.buildLargeStatusPills(stats);
        });
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('taskSearchInput');
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

    handleSearch(value) {
        this.currentFilters.search = value.trim();
        this.refreshView();
        
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) {
            clearBtn.style.display = this.currentFilters.search ? 'flex' : 'none';
        }
    }

    // STYLES IDENTIQUES À PAGEMANAGER + STYLES POUR CONTENU EMAIL ET SUGGESTIONS
    addModernTaskStyles() {
        // Utiliser les styles existants de PageManager s'ils sont déjà présents
        if (document.getElementById('optimizedEmailPageStyles')) {
            console.log('[TasksView] Using existing PageManager styles');
            // Ajouter seulement les nouveaux styles spécifiques aux suggestions
            this.addSuggestedRepliesStyles();
            return;
        }
        
        if (document.getElementById('modernTaskStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernTaskStyles';
        styles.textContent = `
            /* STYLES IDENTIQUES À PAGEMANAGER */
            .tasks-page-modern {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                min-height: 100vh;
                padding: 0;
            }
            
            .tasks-main-toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 4px 0 2px 0;
                border: none;
                margin: 0 0 4px 0;
                min-height: 48px;
                background: transparent;
            }
            
            .toolbar-left {
                display: flex;
                align-items: baseline;
                gap: 8px;
                min-width: 160px;
                flex-shrink: 0;
            }
            
            .tasks-title {
                margin: 0;
                font-size: 26px;
                font-weight: 700;
                color: #1f2937;
            }
            
            .tasks-count-large {
                font-size: 15px;
                color: #6b7280;
                font-weight: 600;
                background: #f3f4f6;
                padding: 5px 12px;
                border-radius: 14px;
            }
            
            .toolbar-center {
                flex: 1;
                max-width: 450px;
                min-width: 280px;
            }
            
            .search-wrapper-large {
                position: relative;
                width: 100%;
            }
            
            .search-input-large {
                width: 100%;
                padding: 14px 18px 14px 48px;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                font-size: 15px;
                background: white;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .search-input-large:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .search-icon-large {
                position: absolute;
                left: 18px;
                top: 50%;
                transform: translateY(-50%);
                color: #9ca3af;
                font-size: 17px;
            }
            
            .search-clear-large {
                position: absolute;
                right: 14px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 5px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .search-clear-large:hover {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .toolbar-center-right {
                flex-shrink: 0;
            }
            
            .view-modes-large {
                display: flex;
                gap: 5px;
                background: #f3f4f6;
                padding: 5px;
                border-radius: 10px;
            }
            
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
            }
            
            .selection-info-large {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 14px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 10px;
                font-size: 14px;
                color: #1e40af;
            }
            
            .selection-count-large {
                font-weight: 600;
            }
            
            .btn-large {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: 1px solid #d1d5db;
                border-radius: 10px;
                background: white;
                color: #374151;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                white-space: nowrap;
                min-height: 46px;
                box-sizing: border-box;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .btn-large:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                color: #1f2937;
                transform: translateY(-1px);
                box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            }
            
            .btn-large.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
                box-shadow: 0 3px 8px rgba(102, 126, 234, 0.25);
            }
            
            .btn-large.btn-primary-large {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            .btn-large.btn-primary-large:hover {
                background: #5a67d8;
                border-color: #5a67d8;
                transform: translateY(-1px);
                box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
            }
            
            .btn-large.btn-secondary-large {
                background: #f9fafb;
                color: #4b5563;
                border-color: #d1d5db;
            }
            
            .btn-large.btn-secondary-large:hover {
                background: #f3f4f6;
                color: #374151;
                transform: translateY(-1px);
            }
            
            .btn-text-large {
                font-weight: 600;
            }
            
            .status-filters-large {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin: 0 0 16px 0;
                padding: 0;
                background: transparent;
                border: none;
            }
            
            .status-pill-large {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 12px 20px;
                border: 1px solid #d1d5db;
                border-radius: 10px;
                background: white;
                color: #374151;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 46px;
                box-sizing: border-box;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .status-pill-large:hover {
                border-color: #667eea;
                background: #667eea12;
                transform: translateY(-1px);
                box-shadow: 0 3px 8px rgba(0,0,0,0.12);
            }
            
            .status-pill-large.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(0,0,0,0.15);
            }
            
            .pill-icon-large {
                font-size: 17px;
            }
            
            .pill-text-large {
                font-weight: 600;
                font-size: 15px;
            }
            
            .pill-count-large {
                background: rgba(0,0,0,0.1);
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 700;
                min-width: 22px;
                text-align: center;
            }
            
            .status-pill-large.active .pill-count-large {
                background: rgba(255,255,255,0.25);
            }
            
            .tasks-condensed-list {
                display: flex;
                flex-direction: column;
                gap: 3px;
                background: #f9fafb;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .task-condensed {
                display: flex;
                align-items: center;
                background: white;
                padding: 16px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #f3f4f6;
                min-height: 60px;
            }
            
            .task-condensed:last-child {
                border-bottom: none;
            }
            
            .task-condensed:hover {
                background: #f9fafb;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .task-condensed.selected {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
            }
            
            .task-condensed.completed {
                opacity: 0.7;
            }
            
            .task-condensed.completed .task-title-large {
                text-decoration: line-through;
            }
            
            .task-checkbox-condensed {
                margin-right: 16px;
                cursor: pointer;
                width: 18px;
                height: 18px;
            }
            
            .task-indicators {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-right: 16px;
                flex-shrink: 0;
            }
            
            .priority-indicator {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
            }
            
            .priority-urgent {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            .priority-high {
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fde68a;
            }
            
            .priority-medium {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
            }
            
            .priority-low {
                background: #f0fdf4;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            }
            
            .status-indicator {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                background: #f3f4f6;
                color: #6b7280;
                border: 1px solid #d1d5db;
            }
            
            .task-content-condensed {
                flex: 1;
                min-width: 0;
            }
            
            .task-header-line {
                display: flex;
                align-items: center;
                width: 100%;
                gap: 16px;
            }
            
            .task-title-large {
                font-weight: 700;
                color: #1f2937;
                font-size: 16px;
                white-space: nowrap;
                flex-shrink: 0;
                min-width: 250px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .task-meta-right {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
                margin-left: auto;
            }
            
            .client-badge {
                background: #f3f4f6;
                color: #6b7280;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
            }
            
            .due-date-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 6px;
                white-space: nowrap;
            }
            
            .due-date-normal {
                color: #6b7280;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
            }
            
            .due-date-soon {
                color: #d97706;
                background: #fef3c7;
                border: 1px solid #fde68a;
            }
            
            .due-date-today {
                color: #dc2626;
                background: #fef2f2;
                border: 1px solid #fecaca;
            }
            
            .due-date-overdue {
                color: #dc2626;
                background: #fef2f2;
                border: 1px solid #fecaca;
                animation: pulse 2s infinite;
            }
            
            .task-date-large {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
                white-space: nowrap;
            }
            
            .task-email-line {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
                font-size: 14px;
                color: #6b7280;
            }
            
            .email-from {
                font-weight: 500;
            }
            
            .reply-needed {
                background: #fef3c7;
                color: #d97706;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #fde68a;
            }
            
            .has-ai-suggestions {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #5a67d8;
                animation: aiGlow 2s infinite alternate;
            }
            
            .ai-generated-badge {
                background: #10b981;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #059669;
            }
            
            @keyframes aiGlow {
                0% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
                100% { box-shadow: 0 0 15px rgba(102, 126, 234, 0.8); }
            }
            
            .task-reply-section {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #f3f4f6;
            }
            
            .reply-to-email-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
            }
            
            .reply-to-email-btn:hover {
                background: linear-gradient(135deg, #5a67d8, #6c5ce7);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .reply-to-email-btn .ai-icon {
                animation: aiPulse 1.5s infinite;
                margin-left: 4px;
            }
            
            @keyframes aiPulse {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.1); }
            }
            
            .action-btn-modern.ai-refresh {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-color: #5a67d8;
            }
            
            .action-btn-modern.ai-refresh:hover {
                background: linear-gradient(135deg, #5a67d8, #6c5ce7);
                border-color: #4c51bf;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }
            
            .ai-generation-time {
                font-size: 12px;
                color: #6b7280;
                margin-top: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .ai-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }
            
            .task-actions-condensed {
                margin-left: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .action-btn-modern {
                width: 32px;
                height: 32px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-size: 14px;
            }
            
            .action-btn-modern:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            .action-btn-modern.complete:hover {
                background: #dcfce7;
                border-color: #16a34a;
                color: #16a34a;
            }
            
            .action-btn-modern.reply:hover {
                background: #dbeafe;
                border-color: #2563eb;
                color: #2563eb;
            }
            
            .action-btn-modern.edit:hover {
                background: #fef3c7;
                border-color: #d97706;
                color: #d97706;
            }
            
            /* NOUVEAUX STYLES POUR FILTRES AVANCÉS */
            .advanced-filters-toggle {
                background: #f8fafc;
                border-color: #e2e8f0;
                color: #475569;
            }
            
            .advanced-filters-toggle:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
            }
            
            .advanced-filters-toggle.active {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .advanced-filters-panel {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 16px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s ease;
                opacity: 0;
            }
            
            .advanced-filters-panel.show {
                max-height: 500px;
                opacity: 1;
                padding: 20px;
            }
            
            .advanced-filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                align-items: end;
            }
            
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .filter-label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 600;
                font-size: 14px;
                color: #374151;
            }
            
            .filter-select {
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                font-size: 14px;
                color: #374151;
                cursor: pointer;
                transition: border-color 0.2s ease;
            }
            
            .filter-select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .filter-actions {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .btn-small {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid;
            }
            
            .btn-small.btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border-color: #d1d5db;
            }
            
            .btn-small.btn-secondary:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }
            
            .active-filters-count {
                font-size: 12px;
                color: #6b7280;
                text-align: center;
                font-weight: 500;
            }
            
            /* STYLES POUR LES TAGS DANS LES TÂCHES */
            .task-tags-line {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
                font-size: 12px;
                color: #6b7280;
                flex-wrap: wrap;
            }
            
            .task-tag {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .task-tag:hover {
                background: linear-gradient(135deg, #5a67d8, #6c5ce7);
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
            }
            
            .tags-more {
                background: #f3f4f6;
                color: #6b7280;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
            }
            
            /* NOUVEAU STYLE POUR LE BOUTON DE SUPPRESSION */
            .action-btn-modern.delete-btn {
                background: #fef2f2;
                color: #dc2626;
                border-color: #fecaca;
                transition: all 0.3s ease;
            }
            
            .action-btn-modern.delete-btn:hover {
                background: #dc2626;
                color: white;
                border-color: #dc2626;
                transform: translateY(-1px) scale(1.05);
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
            }
            
            .empty-state-modern {
                text-align: center;
                padding: 60px 20px;
                color: #6b7280;
            }
            
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 20px;
                color: #d1d5db;
            }
            
            .empty-state-title {
                font-size: 24px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 12px;
            }
            
            .empty-state-text {
                font-size: 16px;
                margin-bottom: 24px;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
                line-height: 1.5;
            }
            
            /* Form styles pour les modals */
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .form-input, .form-select, .form-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                transition: border-color 0.2s ease;
            }
            
            .form-input:focus, .form-select:focus, .form-textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            
            .form-textarea {
                resize: vertical;
                min-height: 80px;
            }
            
            /* Task details modal styles */
            .task-details-content {
                max-width: none;
            }
            
            .details-header {
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .task-title-details {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 12px 0;
                line-height: 1.3;
            }
            
            .task-meta-badges {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .priority-badge, .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .details-section {
                margin-bottom: 24px;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .details-section h3 {
                margin: 0;
                padding: 16px 20px;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .email-details-grid {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .email-detail-item {
                display: flex;
                gap: 12px;
                font-size: 14px;
            }
            
            .email-detail-item strong {
                min-width: 80px;
                color: #374151;
            }
            
            .description-content {
                padding: 16px 20px;
            }
            
            .structured-description {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                background: white;
                padding: 16px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            
            .simple-description {
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
            }
            
            .actions-list-details {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .action-item-details {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: white;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            
            .action-number {
                width: 24px;
                height: 24px;
                background: #667eea;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .action-text {
                flex: 1;
                font-size: 14px;
                color: #374151;
            }
            
            .action-deadline {
                font-size: 12px;
                color: #dc2626;
                font-weight: 600;
                background: #fef2f2;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #fecaca;
            }
            
            .info-grid {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .info-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-size: 14px;
                color: #374151;
                line-height: 1.4;
            }
            
            .attention-section {
                background: #fef3c7;
                border-color: #fbbf24;
            }
            
            .attention-section h3 {
                background: #fef9e8;
                border-bottom-color: #fbbf24;
                color: #92400e;
            }
            
            .attention-list {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .attention-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 6px;
                padding: 10px 12px;
            }
            
            .attention-item i {
                font-size: 14px;
                color: #f59e0b;
                margin-top: 2px;
            }
            
            .attention-item span {
                flex: 1;
                font-size: 13px;
                color: #92400e;
                line-height: 1.4;
            }
            
            /* NOUVEAUX STYLES POUR LE CONTENU EMAIL */
            .email-content-section {
                padding: 16px 20px;
            }
            
            .email-content-tabs {
                display: flex;
                gap: 5px;
                margin-bottom: 16px;
                background: #f3f4f6;
                padding: 5px;
                border-radius: 8px;
            }
            
            .tab-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: transparent;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tab-btn.active {
                background: white;
                color: #1f2937;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .tab-btn:hover:not(.active) {
                background: rgba(255,255,255,0.5);
                color: #374151;
            }
            
            .email-content-box {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .email-content-view {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
            }
            
            .email-content-viewer {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            
            .email-original-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
                white-space: pre-wrap;
            }
            
            .email-original-content strong {
                color: #1f2937;
                font-weight: 600;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .tasks-main-toolbar {
                    flex-direction: column;
                    gap: 10px;
                    align-items: stretch;
                    padding: 4px 0 2px 0;
                    margin: 0 0 6px 0;
                }
                
                .toolbar-left,
                .toolbar-center,
                .toolbar-center-right,
                .toolbar-right {
                    width: 100%;
                    max-width: none;
                }
                
                .toolbar-right {
                    justify-content: flex-end;
                }
                
                .view-modes-large {
                    justify-content: center;
                }
                
                .status-filters-large {
                    padding: 0;
                    gap: 8px;
                    margin: 0 0 12px 0;
                }
                
                .btn-large {
                    padding: 10px 16px;
                    font-size: 14px;
                    min-height: 42px;
                }
                
                .status-pill-large {
                    padding: 10px 16px;
                    font-size: 14px;
                    min-height: 42px;
                }
                
                .btn-text-large {
                    display: none;
                }
                
                .pill-text-large {
                    display: none;
                }
                
                .task-condensed {
                    padding: 12px 16px;
                    min-height: 50px;
                }
                
                .task-indicators {
                    margin-right: 12px;
                }
                
                .task-header-line {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                }
                
                .task-title-large {
                    min-width: auto;
                    font-size: 15px;
                }
                
                .task-meta-right {
                    width: 100%;
                    justify-content: space-between;
                    margin-left: 0;
                }
                
                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
        
        // Ajouter les styles spécifiques aux suggestions de réponse
        this.addSuggestedRepliesStyles();
    }

    // NOUVEAUX STYLES POUR LES SUGGESTIONS DE RÉPONSE
    addSuggestedRepliesStyles() {
        if (document.getElementById('suggestedRepliesStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'suggestedRepliesStyles';
        styles.textContent = `
            /* Styles pour les suggestions de réponse */
            .suggested-replies-section {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #7dd3fc;
            }
            
            .suggested-replies-section h3 {
                background: #f0f9ff;
                border-bottom-color: #7dd3fc;
                color: #075985;
            }
            
            .suggested-replies-container {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .suggested-reply-card {
                background: white;
                border: 1px solid #bae6fd;
                border-radius: 8px;
                padding: 16px;
                transition: all 0.2s ease;
            }
            
            .suggested-reply-card:hover {
                border-color: #7dd3fc;
                box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
            }
            
            .reply-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .reply-tone-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
            }
            
            .reply-tone-badge.formel {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .reply-tone-badge.urgent {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            .reply-tone-badge.neutre {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
            }
            
            .reply-tone-badge.amical {
                background: #f0fdf4;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            }
            
            .copy-reply-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .copy-reply-btn:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }
            
            .reply-subject {
                font-size: 14px;
                color: #4b5563;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .reply-content {
                font-size: 13px;
                color: #374151;
                line-height: 1.6;
                white-space: pre-wrap;
                background: #f8fafc;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
                margin-bottom: 12px;
            }
            
            .reply-actions {
                display: flex;
                justify-content: flex-end;
            }
            
            .use-reply-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .use-reply-btn:hover {
                background: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
            }
            
            /* Styles pour le modal des suggestions */
            .ai-suggestions-info {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #7dd3fc;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
            }
            
            .ai-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #0ea5e9;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .ai-suggestions-info p {
                margin: 0;
                color: #075985;
                font-size: 14px;
            }
            
            .replies-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .reply-suggestion-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                transition: all 0.2s ease;
            }
            
            .reply-suggestion-card:hover {
                border-color: #3b82f6;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
            }
            
            .reply-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .reply-card-actions {
                display: flex;
                gap: 8px;
            }
            
            .btn-sm {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid;
            }
            
            .btn-sm.btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border-color: #d1d5db;
            }
            
            .btn-sm.btn-secondary:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }
            
            .btn-sm.btn-primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .btn-sm.btn-primary:hover {
                background: #2563eb;
                border-color: #2563eb;
                transform: translateY(-1px);
            }
            
            .reply-subject-line {
                font-size: 13px;
                color: #4b5563;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .reply-content-preview {
                font-size: 13px;
                color: #374151;
                line-height: 1.6;
                white-space: pre-wrap;
                background: #f8fafc;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
                max-height: 150px;
                overflow-y: auto;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================================
// GLOBAL INITIALIZATION GARANTIE
// =====================================

// Fonction d'initialisation garantie
function initializeTaskManager() {
    console.log('[TaskManager] Initializing global instances...');
    
    // Créer ou réinitialiser TaskManager
    if (!window.taskManager || !window.taskManager.initialized) {
        window.taskManager = new TaskManager();
    }
    
    // Créer ou réinitialiser TasksView  
    if (!window.tasksView) {
        window.tasksView = new TasksView();
    }
    
    // Bind methods pour éviter les erreurs de contexte
    Object.getOwnPropertyNames(TaskManager.prototype).forEach(name => {
        if (name !== 'constructor' && typeof window.taskManager[name] === 'function') {
            window.taskManager[name] = window.taskManager[name].bind(window.taskManager);
        }
    });

    Object.getOwnPropertyNames(TasksView.prototype).forEach(name => {
        if (name !== 'constructor' && typeof window.tasksView[name] === 'function') {
            window.tasksView[name] = window.tasksView[name].bind(window.tasksView);
        }
    });
    
    console.log('✅ TaskManager v8.4 CORRIGÉ loaded - Avec affichage email complet et suggestions de réponse personnalisées');
}

// Initialisation immédiate ET sur DOMContentLoaded
initializeTaskManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[TaskManager] DOM ready, ensuring initialization...');
    initializeTaskManager();
});

// Fallback sur window.load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.taskManager || !window.taskManager.initialized) {
            console.log('[TaskManager] Fallback initialization...');
            initializeTaskManager();
        }
    }, 1000);
});
