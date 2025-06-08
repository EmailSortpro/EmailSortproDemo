// TaskManager Pro v9.0 - Interface Épurée et Moderne

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
            console.log('[TaskManager] Initializing v9.0 - Interface Épurée...');
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
                title: 'Validation campagne marketing Q2',
                description: '📧 RÉSUMÉ EXÉCUTIF\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDe: Sarah Martin (acme-corp.com)\nObjet: Demande de validation pour la campagne marketing Q2\n📮 Réponse attendue\n\n🎯 ACTIONS REQUISES:\n1. Valider les visuels de la campagne\n2. Confirmer le budget alloué\n3. Définir les dates de lancement\n\n💡 INFORMATIONS CLÉS:\n• Budget proposé : 50k€\n• Cible : 25-45 ans\n• Canaux : LinkedIn, Google Ads\n\n⚠️ POINTS D\'ATTENTION:\n• Deadline serrée pour le lancement\n• Coordination avec l\'équipe commerciale requise',
                priority: 'high',
                status: 'todo',
                category: 'email',
                type: 'email',
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
                    }
                ],
                method: 'ai'
            },
            {
                id: 'sample_2',
                title: 'Proposition commerciale Bankin\'',
                description: 'Offre record jusqu\'à 260€ offerts',
                priority: 'medium',
                status: 'todo',
                category: 'email',
                type: 'email',
                hasEmail: true,
                emailFrom: 'offres@bankin.com',
                emailFromName: 'Bankin\'',
                emailSubject: 'Offre record : jusqu\'à 260€ offerts',
                emailDate: '2025-06-06T14:30:00Z',
                emailDomain: 'bankin.com',
                tags: ['finance', 'offre'],
                client: 'Bankin\'',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                updatedAt: new Date(Date.now() - 3600000).toISOString(),
                needsReply: false,
                dueDate: null,
                method: 'ai'
            },
            {
                id: 'sample_3',
                title: 'Réunion équipe projet Alpha',
                description: 'Point mensuel sur l\'avancement du projet Alpha',
                priority: 'high',
                status: 'in-progress',
                category: 'meeting',
                type: 'réunion',
                hasEmail: false,
                client: 'Interne',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                updatedAt: new Date(Date.now() - 1800000).toISOString(),
                dueDate: '2025-06-09',
                method: 'manual'
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
    }

    async createTaskFromEmail(taskData, email = null) {
        console.log('[TaskManager] Creating task from email:', taskData.title);
        
        const taskId = taskData.id || this.generateId();
        const fullEmailContent = this.extractFullEmailContent(email, taskData);
        const htmlEmailContent = this.extractHtmlEmailContent(email, taskData);
        
        let suggestedReplies = taskData.suggestedReplies || [];
        
        if ((!suggestedReplies || suggestedReplies.length === 0) && 
            (email || taskData.emailFrom) && 
            window.aiTaskAnalyzer) {
            
            try {
                console.log('[TaskManager] Generating AI-powered reply suggestions...');
                suggestedReplies = await this.generateIntelligentReplySuggestions(email || taskData, taskData);
                console.log('[TaskManager] Generated', suggestedReplies.length, 'AI reply suggestions');
            } catch (error) {
                console.warn('[TaskManager] AI reply generation failed:', error);
                suggestedReplies = this.generateBasicReplySuggestions(email || taskData, taskData);
            }
        }
        
        const task = {
            id: taskId,
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || null,
            category: taskData.category || 'email',
            type: taskData.type || 'email',
            
            emailId: taskData.emailId || null,
            emailFrom: taskData.emailFrom || (email?.from?.emailAddress?.address),
            emailFromName: taskData.emailFromName || (email?.from?.emailAddress?.name),
            emailSubject: taskData.emailSubject || email?.subject,
            emailContent: fullEmailContent,
            emailHtmlContent: htmlEmailContent,
            emailDomain: taskData.emailDomain || (taskData.emailFrom ? taskData.emailFrom.split('@')[1] : ''),
            hasEmail: true,
            emailReplied: false,
            emailDate: taskData.emailDate || email?.receivedDateTime,
            needsReply: taskData.needsReply !== false,
            hasAttachments: email?.hasAttachments || false,
            
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            aiAnalysis: taskData.aiAnalysis || null,
            
            suggestedReplies: suggestedReplies,
            aiRepliesGenerated: suggestedReplies.length > 0,
            aiRepliesGeneratedAt: suggestedReplies.length > 0 ? new Date().toISOString() : null,
            
            tags: taskData.tags || [],
            client: taskData.client || 'Externe',
            
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            method: taskData.method || 'ai'
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        
        console.log('[TaskManager] Task created successfully:', task.id);
        return task;
    }

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

    async callAIForReplySuggestions(prompt) {
        if (!window.aiTaskAnalyzer) {
            throw new Error('AITaskAnalyzer not available');
        }

        try {
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

    async callClaudeAPI(prompt) {
        const apiUrl = 'https://api.anthropic.com/v1/messages';
        const apiKey = window.aiTaskAnalyzer.apiKey;
        
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

    parseClaudeReplyResponse(response) {
        try {
            let jsonContent;
            
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
            
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Claude response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                throw new Error('Invalid suggestions format');
            }
            
            return parsed;
            
        } catch (error) {
            console.error('[TaskManager] Parse Claude reply error:', error);
            throw error;
        }
    }

    generateBasicReplySuggestions(email, taskData) {
        const senderName = email.from?.emailAddress?.name || taskData.emailFromName || 'l\'expéditeur';
        const subject = email.subject || taskData.emailSubject || 'votre message';
        const urgency = taskData.priority || 'medium';
        const hasActions = taskData.actions && taskData.actions.length > 0;

        const suggestions = [];

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

    extractFullEmailContent(email, taskData) {
        console.log('[TaskManager] Extracting full email content...');
        
        if (taskData.emailContent && taskData.emailContent.length > 50) {
            console.log('[TaskManager] Using email content from taskData');
            return taskData.emailContent;
        }
        
        if (email?.body?.content) {
            console.log('[TaskManager] Using email body content');
            return this.cleanEmailContent(email.body.content);
        }
        
        if (email?.body?.type === 'html' && email?.body?.content) {
            console.log('[TaskManager] Using HTML email content');
            return this.convertHtmlToText(email.body.content);
        }
        
        if (email?.bodyPreview && email.bodyPreview.length > 20) {
            console.log('[TaskManager] Using extended email preview');
            return this.buildExtendedPreview(email);
        }
        
        console.log('[TaskManager] Building minimal email content');
        return this.buildMinimalEmailContent(email, taskData);
    }

    extractHtmlEmailContent(email, taskData) {
        console.log('[TaskManager] Extracting HTML email content...');
        
        if (taskData.emailHtmlContent && taskData.emailHtmlContent.length > 50) {
            console.log('[TaskManager] Using HTML email content from taskData');
            return taskData.emailHtmlContent;
        }
        
        if (email?.body?.contentType === 'html' && email?.body?.content) {
            console.log('[TaskManager] Using email HTML body content');
            return this.cleanHtmlEmailContent(email.body.content);
        }
        
        if (email?.body?.content) {
            console.log('[TaskManager] Converting text to HTML');
            return this.convertTextToHtml(email.body.content, email);
        }
        
        const textContent = this.extractFullEmailContent(email, taskData);
        return this.convertTextToHtml(textContent, email);
    }

    cleanEmailContent(content) {
        if (!content) return '';
        
        const cleanContent = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
            
        return cleanContent.length > 100 ? cleanContent : '';
    }

    cleanHtmlEmailContent(htmlContent) {
        if (!htmlContent) return '';
        
        let cleanHtml = htmlContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '')
            
            .replace(/style="[^"]*"/gi, (match) => {
                const safeStyles = match.match(/(color|background|font-size|font-weight|text-align|margin|padding|border):[^;]*/gi);
                return safeStyles ? `style="${safeStyles.join(';')}"` : '';
            });
        
        return `<div class="email-content-viewer" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${cleanHtml}
        </div>`;
    }

    convertTextToHtml(textContent, email) {
        if (!textContent) return '';
        
        const senderName = email?.from?.emailAddress?.name || 'Expéditeur';
        const senderEmail = email?.from?.emailAddress?.address || '';
        const subject = email?.subject || 'Sans sujet';
        const date = email?.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString('fr-FR') : '';
        
        const htmlContent = textContent
            .replace(/\n/g, '<br>')
            .replace(/Email de:([^\n]+)/g, '<strong>De:</strong>$1')
            .replace(/Date:([^\n]+)/g, '<strong>Date:</strong>$1')
            .replace(/Sujet:([^\n]+)/g, '<strong>Sujet:</strong>$1')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
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
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
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
        
        let content = `Email de: ${senderName} <${senderEmail}>
Date: ${formattedDate}
Sujet: ${subject}

`;

        if (taskData.summary) {
            content += `${taskData.summary}\n\n`;
        }
        
        if (taskData.actions && taskData.actions.length > 0) {
            content += `Actions mentionnées dans l'email:\n`;
            taskData.actions.forEach((action, idx) => {
                content += `${idx + 1}. ${action.text}\n`;
            });
            content += '\n';
        }
        
        if (taskData.keyInfo && taskData.keyInfo.length > 0) {
            content += `Informations importantes:\n`;
            taskData.keyInfo.forEach(info => {
                content += `• ${info}\n`;
            });
            content += '\n';
        }
        
        content += `[Contenu complet de l'email non disponible - Résumé généré par IA]`;
        
        return content;
    }

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
            type: taskData.type || 'tâche',
            
            emailId: taskData.emailId || null,
            emailFrom: taskData.emailFrom || null,
            emailFromName: taskData.emailFromName || null,
            emailSubject: taskData.emailSubject || null,
            emailContent: taskData.emailContent || '',
            emailHtmlContent: taskData.emailHtmlContent || '',
            hasEmail: !!(taskData.emailId || taskData.emailFrom || taskData.emailContent),
            emailReplied: false,
            emailDate: taskData.emailDate || taskData.createdAt,
            needsReply: taskData.needsReply || false,
            
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            suggestedReplies: taskData.suggestedReplies || [],
            
            tags: taskData.tags || [],
            client: taskData.client || 'Interne',
            
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
        
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }
        
        if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }
        
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(task => task.category === filters.category);
        }
        
        if (filters.client && filters.client !== 'all') {
            filtered = filtered.filter(task => task.client === filters.client);
        }
        
        if (filters.tag && filters.tag !== 'all') {
            filtered = filtered.filter(task => 
                task.tags && Array.isArray(task.tags) && task.tags.includes(filters.tag)
            );
        }
        
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
// MODERN TASKS VIEW - INTERFACE ÉPURÉE
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
        
        container.innerHTML = `
            <div class="tasks-page-modern">
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

                <div class="status-filters-large">
                    ${this.buildLargeStatusPills(stats)}
                    <button class="btn-large advanced-filters-toggle ${this.showAdvancedFilters ? 'active' : ''}" 
                            onclick="window.tasksView.toggleAdvancedFilters()">
                        <i class="fas fa-filter"></i>
                        <span class="btn-text-large">Filtres</span>
                        <i class="fas fa-chevron-${this.showAdvancedFilters ? 'up' : 'down'}"></i>
                    </button>
                </div>

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
                                <i class="fas fa-sort"></i> Trier par
                            </label>
                            <select class="filter-select" id="sortByFilter" 
                                    onchange="window.tasksView.updateFilter('sortBy', this.value)">
                                <option value="created" ${this.currentFilters.sortBy === 'created' ? 'selected' : ''}>Date création</option>
                                <option value="priority" ${this.currentFilters.sortBy === 'priority' ? 'selected' : ''}>Priorité</option>
                                <option value="dueDate" ${this.currentFilters.sortBy === 'dueDate' ? 'selected' : ''}>Date échéance</option>
                                <option value="title" ${this.currentFilters.sortBy === 'title' ? 'selected' : ''}>Titre A-Z</option>
                            </select>
                        </div>

                        <div class="filter-actions">
                            <button class="btn-small btn-secondary" onclick="window.tasksView.resetAllFilters()">
                                <i class="fas fa-undo"></i> Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>

                <div class="tasks-container-modern" id="tasksContainer">
                    ${this.renderTasksList()}
                </div>
            </div>
        `;

        this.addModernTaskStyles();
        this.setupEventListeners();
        console.log('[TasksView] Modern épuré interface rendered');
    }

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

        return this.renderCondensedView(filteredTasks);
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
            <div class="tasks-clean-list">
                ${tasks.map(task => this.renderCleanTaskItem(task)).join('')}
            </div>
        `;
    }

    // NOUVEAU RENDU ÉPURÉ ET MODERNE
    renderCleanTaskItem(task) {
        const isSelected = this.selectedTasks.has(task.id);
        const isCompleted = task.status === 'completed';
        
        // Destinataire : priorité email > client > type
        const recipient = task.hasEmail ? 
            (task.emailFromName || this.extractNameFromEmail(task.emailFrom) || 'Email inconnu') :
            (task.client !== 'Interne' ? task.client : task.type || 'Tâche');
            
        // Type visuel clair
        const taskTypeDisplay = this.getTaskTypeDisplay(task);
        
        // Deadline formatting
        const dueDateDisplay = this.formatDueDateSimple(task.dueDate);
        
        // Priority color
        const priorityColor = this.getPriorityColor(task.priority);
        
        return `
            <div class="task-clean-card ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                 data-task-id="${task.id}"
                 onclick="window.tasksView.handleTaskClick(event, '${task.id}')">
                
                <!-- Checkbox de sélection -->
                <input type="checkbox" 
                       class="task-checkbox-clean" 
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); window.tasksView.toggleTaskSelection('${task.id}')">
                
                <!-- Indicateur de priorité (barre colorée) -->
                <div class="priority-bar" style="background-color: ${priorityColor}"></div>
                
                <!-- Contenu principal -->
                <div class="task-main-content">
                    <div class="task-header-clean">
                        <h3 class="task-title-clean">${this.escapeHtml(task.title)}</h3>
                        <div class="task-meta-clean">
                            <span class="task-type-badge">${taskTypeDisplay.icon} ${taskTypeDisplay.label}</span>
                            ${dueDateDisplay.html}
                        </div>
                    </div>
                    
                    <div class="task-recipient-clean">
                        <i class="fas ${task.hasEmail ? 'fa-envelope' : 'fa-user'}"></i>
                        <span class="recipient-name">${this.escapeHtml(recipient)}</span>
                        ${task.hasEmail && task.needsReply ? '<span class="reply-indicator">• Réponse requise</span>' : ''}
                    </div>
                </div>
                
                <!-- Actions rapides -->
                <div class="task-actions-clean">
                    ${this.renderCleanActions(task)}
                </div>
            </div>
        `;
    }

    renderCleanActions(task) {
        const actions = [];
        
        // Bouton principal selon l'état
        if (task.status !== 'completed') {
            actions.push(`
                <button class="action-btn-clean complete" 
                        onclick="event.stopPropagation(); window.tasksView.markComplete('${task.id}')"
                        title="Marquer comme terminé">
                    <i class="fas fa-check"></i>
                </button>
            `);
        }
        
        // Bouton répondre pour les emails
        if (task.hasEmail && !task.emailReplied && task.status !== 'completed') {
            actions.push(`
                <button class="action-btn-clean reply" 
                        onclick="event.stopPropagation(); window.tasksView.replyToEmailWithAI('${task.id}')"
                        title="Répondre à l'email">
                    <i class="fas fa-reply"></i>
                </button>
            `);
        }
        
        // Bouton détails
        actions.push(`
            <button class="action-btn-clean details" 
                    onclick="event.stopPropagation(); window.tasksView.showTaskDetails('${task.id}')"
                    title="Voir les détails">
                <i class="fas fa-eye"></i>
            </button>
        `);
        
        return actions.join('');
    }

    // NOUVELLES FONCTIONS UTILITAIRES POUR L'AFFICHAGE ÉPURÉ
    getTaskTypeDisplay(task) {
        if (task.hasEmail) {
            return { 
                icon: '📧', 
                label: 'Email' 
            };
        }
        
        switch (task.category) {
            case 'meeting':
                return { icon: '🗓️', label: 'Réunion' };
            case 'call':
                return { icon: '📞', label: 'Appel' };
            case 'document':
                return { icon: '📄', label: 'Document' };
            case 'project':
                return { icon: '🎯', label: 'Projet' };
            default:
                return { icon: '✓', label: task.type || 'Tâche' };
        }
    }

    getPriorityColor(priority) {
        const colors = {
            urgent: '#ef4444',   // Rouge vif
            high: '#f97316',     // Orange
            medium: '#3b82f6',   // Bleu
            low: '#10b981'       // Vert
        };
        return colors[priority] || colors.medium;
    }

    formatDueDateSimple(dateString) {
        if (!dateString) {
            return { html: '<span class="no-deadline">Pas d\'échéance</span>', text: '' };
        }
        
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        let className = 'deadline-normal';
        let text = '';
        let bgColor = '#f3f4f6';
        let textColor = '#6b7280';
        
        if (diffDays < 0) {
            className = 'deadline-overdue';
            text = `En retard (${Math.abs(diffDays)}j)`;
            bgColor = '#fef2f2';
            textColor = '#dc2626';
        } else if (diffDays === 0) {
            className = 'deadline-today';
            text = 'Aujourd\'hui';
            bgColor = '#fef3c7';
            textColor = '#d97706';
        } else if (diffDays === 1) {
            className = 'deadline-tomorrow';
            text = 'Demain';
            bgColor = '#fef3c7';
            textColor = '#d97706';
        } else if (diffDays <= 7) {
            className = 'deadline-week';
            text = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
            bgColor = '#eff6ff';
            textColor = '#2563eb';
        } else {
            text = date.toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
        
        return {
            html: `<span class="deadline-badge ${className}" style="background-color: ${bgColor}; color: ${textColor};">
                📅 ${text}
            </span>`,
            text: text
        };
    }

    extractNameFromEmail(email) {
        if (!email) return null;
        
        // Extraire le nom avant @ et le formatter
        const namePart = email.split('@')[0];
        if (!namePart) return null;
        
        // Remplacer points et underscores par espaces, capitaliser
        return namePart
            .replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // MÉTHODES EXISTANTES ADAPTÉES
    handleTaskClick(event, taskId) {
        this.showTaskDetails(taskId);
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

    buildTaskDetailsContent(task) {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusLabel = this.getStatusLabel(task.status);
        const dueDateInfo = this.formatDueDateSimple(task.dueDate);
        
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
                        <h3><i class="fas fa-reply-all"></i> Suggestions de Réponse</h3>
                        <div class="suggested-replies-container">
                            ${task.suggestedReplies.slice(0, 2).map((reply, idx) => `
                                <div class="suggested-reply-card-compact">
                                    <div class="reply-header-compact">
                                        <span class="reply-tone-badge ${reply.tone}">
                                            ${this.getReplyToneIcon(reply.tone)} ${this.getReplyToneLabel(reply.tone)}
                                        </span>
                                        <button class="use-reply-btn-compact" onclick="window.tasksView.useReply('${task.id}', ${idx})">
                                            <i class="fas fa-paper-plane"></i> Utiliser
                                        </button>
                                    </div>
                                    <div class="reply-preview">
                                        ${this.escapeHtml(reply.content.substring(0, 150))}${reply.content.length > 150 ? '...' : ''}
                                    </div>
                                </div>
                            `).join('')}
                            ${task.suggestedReplies.length > 2 ? `
                                <button class="show-all-replies-btn" onclick="window.tasksView.showSuggestedReplies('${task.id}')">
                                    Voir toutes les suggestions (${task.suggestedReplies.length})
                                </button>
                            ` : ''}
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

    // MÉTHODES UTILITAIRES CONSERVÉES
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

    formatEmailContent(content) {
        if (!content) return '<p>Contenu non disponible</p>';
        
        const formattedContent = content
            .replace(/\n/g, '<br>')
            .replace(/Email de:/g, '<strong>Email de:</strong>')
            .replace(/Date:/g, '<strong>Date:</strong>')
            .replace(/Sujet:/g, '<strong>Sujet:</strong>');
            
        return `<div class="email-original-content">${formattedContent}</div>`;
    }

    switchEmailTab(tabType, taskId) {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
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

    useReply(taskId, replyIndex) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.suggestedReplies || !task.suggestedReplies[replyIndex]) return;

        const reply = task.suggestedReplies[replyIndex];
        const subject = reply.subject;
        const body = reply.content;
        const to = task.emailFrom;
        
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.open(mailtoLink);
        
        window.taskManager.updateTask(taskId, { 
            emailReplied: true,
            status: task.status === 'todo' ? 'in-progress' : task.status
        });
        
        this.showToast('Email de réponse ouvert dans votre client email', 'success');
        
        document.querySelectorAll('[id^="replies_modal_"], [id^="task_details_modal_"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
    }

    async replyToEmailWithAI(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        if (task.suggestedReplies && task.suggestedReplies.length > 0) {
            this.showSuggestedReplies(taskId);
            return;
        }
        
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

    markComplete(taskId) {
        window.taskManager.updateTask(taskId, { status: 'completed' });
        this.showToast('Tâche marquée comme terminée', 'success');
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

    updateSelectionUI() {
        document.querySelectorAll('[data-task-id]').forEach(item => {
            const taskId = item.dataset.taskId;
            const isSelected = this.selectedTasks.has(taskId);
            
            item.classList.toggle('selected', isSelected);
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = isSelected;
        });
    }

    showCreateModal() {
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
            type: 'tâche',
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
            case 0:
                this.selectedTasks.forEach(taskId => {
                    window.taskManager.updateTask(taskId, { status: 'completed' });
                });
                this.showToast(`${this.selectedTasks.size} tâche(s) marquée(s) comme terminée(s)`, 'success');
                this.clearSelection();
                break;
                
            case 1:
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
                
            case 2:
                if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedTasks.size} tâche(s) ?`)) {
                    this.selectedTasks.forEach(taskId => {
                        window.taskManager.deleteTask(taskId);
                    });
                    this.showToast(`${this.selectedTasks.size} tâche(s) supprimée(s)`, 'success');
                    this.clearSelection();
                }
                break;
                
            case 3:
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

    clearSearch() {
        this.currentFilters.search = '';
        const searchInput = document.getElementById('taskSearchInput');
        if (searchInput) searchInput.value = '';
        this.refreshView();
    }

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

    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.refreshView();
        console.log('[TasksView] Filter updated:', filterType, '=', value);
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
        
        const searchInput = document.getElementById('taskSearchInput');
        if (searchInput) searchInput.value = '';
        
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // STYLES ÉPURÉS ET MODERNES
    addModernTaskStyles() {
        if (document.getElementById('cleanTaskStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'cleanTaskStyles';
        styles.textContent = `
            /* Interface épurée et moderne pour TaskManager v9.0 */
            .tasks-page-modern {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                padding: 0;
            }
            
            .tasks-main-toolbar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 0;
                margin: 0 0 16px 0;
                min-height: 60px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.18);
            }
            
            .toolbar-left {
                display: flex;
                align-items: baseline;
                gap: 12px;
                min-width: 200px;
                flex-shrink: 0;
                padding: 0 20px;
            }
            
            .tasks-title {
                margin: 0;
                font-size: 32px;
                font-weight: 800;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .tasks-count-large {
                font-size: 16px;
                color: #6366f1;
                font-weight: 700;
                background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
                padding: 8px 16px;
                border-radius: 20px;
                border: 2px solid #c7d2fe;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
            }
            
            .toolbar-center {
                flex: 1;
                max-width: 500px;
                padding: 0 20px;
            }
            
            .search-wrapper-large {
                position: relative;
                width: 100%;
            }
            
            .search-input-large {
                width: 100%;
                padding: 16px 24px 16px 56px;
                border: 2px solid transparent;
                border-radius: 24px;
                font-size: 16px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                font-weight: 500;
                color: #374151;
            }
            
            .search-input-large:focus {
                outline: none;
                border-color: #6366f1;
                background: white;
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0, 0, 0, 0.12);
                transform: translateY(-2px);
            }
            
            .search-input-large::placeholder {
                color: #9ca3af;
                font-weight: 500;
            }
            
            .search-icon-large {
                position: absolute;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                color: #6366f1;
                font-size: 18px;
                font-weight: 600;
            }
            
            .search-clear-large {
                position: absolute;
                right: 16px;
                top: 50%;
                transform: translateY(-50%);
                background: #f3f4f6;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 8px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-weight: 600;
            }
            
            .search-clear-large:hover {
                background: #e5e7eb;
                color: #374151;
                transform: translateY(-50%) scale(1.05);
            }
            
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
                padding: 0 20px;
            }
            
            .selection-info-large {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 18px;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 2px solid #93c5fd;
                border-radius: 16px;
                font-size: 14px;
                color: #1e40af;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            .selection-count-large {
                font-weight: 700;
            }
            
            .btn-large {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 14px 24px;
                border: 2px solid transparent;
                border-radius: 16px;
                background: white;
                color: #374151;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                white-space: nowrap;
                min-height: 50px;
                box-sizing: border-box;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                backdrop-filter: blur(10px);
            }
            
            .btn-large:hover {
                background: #f9fafb;
                border-color: #6366f1;
                color: #1f2937;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
            
            .btn-large.active, .btn-large.btn-primary-large {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
            }
            
            .btn-large.btn-primary-large:hover, .btn-large.active:hover {
                background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
                transform: translateY(-3px);
                box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
            }
            
            .btn-large.btn-secondary-large {
                background: #f8fafc;
                color: #475569;
                border-color: #e2e8f0;
            }
            
            .btn-large.btn-secondary-large:hover {
                background: #f1f5f9;
                color: #334155;
                border-color: #cbd5e1;
            }
            
            .btn-text-large {
                font-weight: 600;
            }
            
            .status-filters-large {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin: 0 0 20px 0;
                padding: 20px;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .status-pill-large {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding: 14px 24px;
                border: 2px solid transparent;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.8);
                color: #374151;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 52px;
                box-sizing: border-box;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
                backdrop-filter: blur(10px);
            }
            
            .status-pill-large:hover {
                border-color: #6366f1;
                background: rgba(255, 255, 255, 0.95);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            }
            
            .status-pill-large.active {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
            }
            
            .pill-icon-large {
                font-size: 18px;
            }
            
            .pill-text-large {
                font-weight: 700;
                font-size: 15px;
            }
            
            .pill-count-large {
                background: rgba(0, 0, 0, 0.15);
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 13px;
                font-weight: 800;
                min-width: 24px;
                text-align: center;
            }
            
            .status-pill-large.active .pill-count-large {
                background: rgba(255, 255, 255, 0.25);
            }
            
            .advanced-filters-toggle {
                background: rgba(248, 250, 252, 0.8);
                border-color: #e2e8f0;
                color: #475569;
                backdrop-filter: blur(10px);
            }
            
            .advanced-filters-toggle:hover {
                background: rgba(241, 245, 249, 0.9);
                border-color: #cbd5e1;
            }
            
            .advanced-filters-toggle.active {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
            }
            
            .advanced-filters-panel {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                margin-bottom: 20px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.4s ease;
                opacity: 0;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            }
            
            .advanced-filters-panel.show {
                max-height: 300px;
                opacity: 1;
                padding: 24px;
            }
            
            .advanced-filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
                align-items: end;
            }
            
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .filter-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 700;
                font-size: 14px;
                color: #374151;
            }
            
            .filter-select {
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                font-size: 14px;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
            }
            
            .filter-select:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .filter-actions {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            
            .btn-small {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid;
            }
            
            .btn-small.btn-secondary {
                background: #f8fafc;
                color: #475569;
                border-color: #e2e8f0;
            }
            
            .btn-small.btn-secondary:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
                transform: translateY(-1px);
            }
            
            .btn-small.btn-primary {
                background: #6366f1;
                color: white;
                border-color: #6366f1;
            }
            
            .btn-small.btn-primary:hover {
                background: #5856eb;
                border-color: #5856eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            /* CARTES DE TÂCHES ÉPURÉES */
            .tasks-clean-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: transparent;
            }
            
            .task-clean-card {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                overflow: hidden;
            }
            
            .task-clean-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .task-clean-card:hover {
                background: white;
                transform: translateY(-4px);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                border-color: rgba(99, 102, 241, 0.2);
            }
            
            .task-clean-card:hover::before {
                opacity: 1;
            }
            
            .task-clean-card.selected {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
            }
            
            .task-clean-card.completed {
                opacity: 0.7;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-color: #22c55e;
            }
            
            .task-clean-card.completed .task-title-clean {
                text-decoration: line-through;
                color: #6b7280;
            }
            
            .task-checkbox-clean {
                margin-right: 20px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 6px;
                border: 2px solid #d1d5db;
                background: white;
                transition: all 0.2s ease;
            }
            
            .task-checkbox-clean:checked {
                background: #6366f1;
                border-color: #6366f1;
            }
            
            .priority-bar {
                width: 6px;
                height: 60px;
                border-radius: 3px;
                margin-right: 20px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .task-clean-card:hover .priority-bar {
                height: 70px;
                width: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            }
            
            .task-main-content {
                flex: 1;
                min-width: 0;
            }
            
            .task-header-clean {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
                gap: 16px;
            }
            
            .task-title-clean {
                font-weight: 700;
                color: #1f2937;
                font-size: 18px;
                margin: 0;
                line-height: 1.3;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .task-meta-clean {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }
            
            .task-type-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                color: #475569;
                padding: 6px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #e2e8f0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                white-space: nowrap;
            }
            
            .deadline-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                font-weight: 600;
                padding: 6px 12px;
                border-radius: 12px;
                white-space: nowrap;
                border: 1px solid;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .deadline-normal {
                background: #f8fafc;
                color: #64748b;
                border-color: #e2e8f0;
            }
            
            .deadline-week {
                background: #eff6ff;
                color: #2563eb;
                border-color: #bfdbfe;
            }
            
            .deadline-today, .deadline-tomorrow {
                background: #fef3c7;
                color: #d97706;
                border-color: #fde68a;
            }
            
            .deadline-overdue {
                background: #fef2f2;
                color: #dc2626;
                border-color: #fecaca;
                animation: pulse 2s infinite;
            }
            
            .no-deadline {
                color: #9ca3af;
                font-style: italic;
                font-size: 12px;
            }
            
            .task-recipient-clean {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #6b7280;
                font-size: 14px;
                font-weight: 500;
            }
            
            .task-recipient-clean i {
                color: #9ca3af;
                font-size: 14px;
            }
            
            .recipient-name {
                font-weight: 600;
                color: #374151;
            }
            
            .reply-indicator {
                color: #dc2626;
                font-weight: 600;
                font-size: 12px;
            }
            
            .task-actions-clean {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 20px;
            }
            
            .action-btn-clean {
                width: 40px;
                height: 40px;
                border: 2px solid transparent;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.8);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 16px;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }
            
            .action-btn-clean:hover {
                background: white;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }
            
            .action-btn-clean.complete {
                color: #16a34a;
                border-color: transparent;
            }
            
            .action-btn-clean.complete:hover {
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                border-color: #16a34a;
                color: #15803d;
            }
            
            .action-btn-clean.reply {
                color: #3b82f6;
                border-color: transparent;
            }
            
            .action-btn-clean.reply:hover {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
                color: #2563eb;
            }
            
            .action-btn-clean.details {
                color: #8b5cf6;
                border-color: transparent;
            }
            
            .action-btn-clean.details:hover {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-color: #8b5cf6;
                color: #7c3aed;
            }
            
            /* ÉTAT VIDE */
            .empty-state-modern {
                text-align: center;
                padding: 80px 40px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            }
            
            .empty-state-icon {
                font-size: 64px;
                margin-bottom: 24px;
                color: #d1d5db;
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .empty-state-title {
                font-size: 28px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 16px;
                background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .empty-state-text {
                font-size: 18px;
                margin-bottom: 32px;
                max-width: 500px;
                margin-left: auto;
                margin-right: auto;
                line-height: 1.6;
                color: #6b7280;
                font-weight: 500;
            }
            
            /* STYLES DES MODALS */
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 700;
                color: #374151;
                font-size: 15px;
            }
            
            .form-input, .form-select, .form-textarea {
                width: 100%;
                padding: 14px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 15px;
                background: white;
                transition: all 0.2s ease;
                font-weight: 500;
                color: #374151;
            }
            
            .form-input:focus, .form-select:focus, .form-textarea:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                background: #fafafa;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .form-textarea {
                resize: vertical;
                min-height: 100px;
                font-family: inherit;
            }
            
            /* DÉTAILS DES TÂCHES */
            .task-details-content {
                max-width: none;
            }
            
            .details-header {
                margin-bottom: 32px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f3f4f6;
            }
            
            .task-title-details {
                font-size: 32px;
                font-weight: 800;
                color: #1f2937;
                margin: 0 0 16px 0;
                line-height: 1.2;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .task-meta-badges {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .priority-badge, .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 700;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 2px solid;
            }
            
            .priority-urgent {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                color: #dc2626;
                border-color: #fecaca;
            }
            
            .priority-high {
                background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
                color: #d97706;
                border-color: #fde68a;
            }
            
            .priority-medium {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                color: #2563eb;
                border-color: #bfdbfe;
            }
            
            .priority-low {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                color: #16a34a;
                border-color: #bbf7d0;
            }
            
            .status-todo {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                color: #d97706;
                border-color: #f59e0b;
            }
            
            .status-in-progress {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                color: #2563eb;
                border-color: #3b82f6;
            }
            
            .status-completed {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                color: #16a34a;
                border-color: #22c55e;
            }
            
            .details-section {
                margin-bottom: 32px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            }
            
            .details-section h3 {
                margin: 0;
                padding: 20px 24px;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-bottom: 1px solid #e2e8f0;
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .email-details-grid {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .email-detail-item {
                display: flex;
                gap: 16px;
                font-size: 15px;
                padding: 12px 16px;
                background: #f8fafc;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
            }
            
            .email-detail-item strong {
                min-width: 100px;
                color: #374151;
                font-weight: 700;
            }
            
            .email-detail-item span {
                color: #4b5563;
                font-weight: 500;
            }
            
            .description-content {
                padding: 20px 24px;
            }
            
            .structured-description {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 14px;
                line-height: 1.6;
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                color: #374151;
            }
            
            .simple-description {
                font-size: 15px;
                line-height: 1.7;
                color: #374151;
                font-weight: 500;
            }
            
            .actions-list-details {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .action-item-details {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                transition: all 0.2s ease;
            }
            
            .action-item-details:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            .action-number {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 700;
                flex-shrink: 0;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .action-text {
                flex: 1;
                font-size: 15px;
                color: #374151;
                font-weight: 600;
            }
            
            .action-deadline {
                font-size: 12px;
                color: #dc2626;
                font-weight: 700;
                background: #fef2f2;
                padding: 6px 12px;
                border-radius: 8px;
                border: 1px solid #fecaca;
            }
            
            .info-grid {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .info-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                font-size: 15px;
                color: #374151;
                line-height: 1.5;
                padding: 12px 16px;
                background: #f8fafc;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
                font-weight: 500;
            }
            
            .info-item i {
                color: #6366f1;
                margin-top: 2px;
                font-weight: 600;
            }
            
            .attention-section {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-color: #f59e0b;
            }
            
            .attention-section h3 {
                background: linear-gradient(135deg, #fef9e8 0%, #fef3c7 100%);
                border-bottom-color: #f59e0b;
                color: #92400e;
            }
            
            .attention-list {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            
            .attention-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 12px;
                padding: 16px 20px;
                transition: all 0.2s ease;
            }
            
            .attention-item:hover {
                background: #fef9e8;
                border-color: #f59e0b;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
            }
            
            .attention-item i {
                font-size: 16px;
                color: #f59e0b;
                margin-top: 2px;
                font-weight: 600;
            }
            
            .attention-item span {
                flex: 1;
                font-size: 14px;
                color: #92400e;
                line-height: 1.5;
                font-weight: 600;
            }
            
            /* SUGGESTIONS DE RÉPONSE COMPACTES */
            .suggested-replies-section {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-color: #0ea5e9;
            }
            
            .suggested-replies-section h3 {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-bottom-color: #0ea5e9;
                color: #075985;
            }
            
            .suggested-replies-container {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .suggested-reply-card-compact {
                background: white;
                border: 1px solid #bae6fd;
                border-radius: 12px;
                padding: 16px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
            }
            
            .suggested-reply-card-compact:hover {
                border-color: #0ea5e9;
                box-shadow: 0 4px 16px rgba(14, 165, 233, 0.15);
                transform: translateY(-1px);
            }
            
            .reply-header-compact {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .reply-tone-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 700;
                text-transform: capitalize;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            
            .use-reply-btn-compact {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            
            .use-reply-btn-compact:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            .reply-preview {
                font-size: 13px;
                color: #374151;
                line-height: 1.5;
                background: #f8fafc;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                font-weight: 500;
            }
            
            .show-all-replies-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                color: #475569;
                border: 2px solid #cbd5e1;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                width: 100%;
            }
            
            .show-all-replies-btn:hover {
                background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
                border-color: #94a3b8;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(71, 85, 105, 0.15);
            }
            
            /* CONTENU EMAIL */
            .email-content-section {
                padding: 20px 24px;
            }
            
            .email-content-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 20px;
                background: #f3f4f6;
                padding: 6px;
                border-radius: 12px;
            }
            
            .tab-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: transparent;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: 1;
                justify-content: center;
            }
            
            .tab-btn.active {
                background: white;
                color: #1f2937;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .tab-btn:hover:not(.active) {
                background: rgba(255, 255, 255, 0.5);
                color: #374151;
            }
            
            .email-content-box {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                max-height: 500px;
                overflow-y: auto;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            .email-content-view {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.7;
                color: #374151;
                font-weight: 500;
            }
            
            .email-content-viewer {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.7;
                color: #333;
            }
            
            .email-original-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.7;
                color: #374151;
                white-space: pre-wrap;
                font-weight: 500;
            }
            
            .email-original-content strong {
                color: #1f2937;
                font-weight: 700;
            }
            
            /* SUGGESTIONS DE RÉPONSE MODAL */
            .replies-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .reply-suggestion-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 20px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            .reply-suggestion-card:hover {
                border-color: #6366f1;
                box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
                transform: translateY(-2px);
            }
            
            .reply-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .reply-card-actions {
                display: flex;
                gap: 12px;
            }
            
            .reply-subject-line {
                font-size: 14px;
                color: #4b5563;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-weight: 600;
            }
            
            .reply-content-preview {
                font-size: 14px;
                color: #374151;
                line-height: 1.6;
                white-space: pre-wrap;
                background: #f8fafc;
                padding: 16px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                max-height: 200px;
                overflow-y: auto;
                font-weight: 500;
            }
            
            /* ANIMATIONS */
            @keyframes pulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scale(1);
                }
                50% { 
                    opacity: 0.8; 
                    transform: scale(1.02);
                }
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .task-clean-card {
                animation: fadeInUp 0.3s ease-out;
            }
            
            /* RESPONSIVE */
            @media (max-width: 768px) {
                .tasks-main-toolbar {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                    padding: 12px;
                }
                
                .toolbar-left, .toolbar-center, .toolbar-right {
                    width: 100%;
                    max-width: none;
                    padding: 0;
                }
                
                .toolbar-right {
                    justify-content: center;
                }
                
                .status-filters-large {
                    padding: 16px;
                    gap: 8px;
                }
                
                .btn-large {
                    padding: 12px 20px;
                    font-size: 14px;
                    min-height: 48px;
                }
                
                .status-pill-large {
                    padding: 12px 18px;
                    font-size: 14px;
                    min-height: 48px;
                }
                
                .btn-text-large, .pill-text-large {
                    display: none;
                }
                
                .task-clean-card {
                    padding: 16px;
                    border-radius: 16px;
                }
                
                .task-header-clean {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .task-title-clean {
                    font-size: 16px;
                    white-space: normal;
                }
                
                .task-meta-clean {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .priority-bar {
                    height: 50px;
                    margin-right: 16px;
                }
                
                .task-actions-clean {
                    margin-left: 16px;
                    gap: 6px;
                }
                
                .action-btn-clean {
                    width: 36px;
                    height: 36px;
                    font-size: 14px;
                }
                
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .advanced-filters-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .task-meta-badges {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .email-details-grid {
                    padding: 16px 20px;
                }
                
                .details-section {
                    margin-bottom: 24px;
                }
                
                .details-section h3 {
                    padding: 16px 20px;
                    font-size: 16px;
                }
                
                .task-title-details {
                    font-size: 24px;
                }
                
                .empty-state-modern {
                    padding: 60px 20px;
                }
                
                .empty-state-title {
                    font-size: 24px;
                }
                
                .empty-state-text {
                    font-size: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .tasks-title {
                    font-size: 28px;
                }
                
                .tasks-count-large {
                    font-size: 14px;
                    padding: 6px 12px;
                }
                
                .search-input-large {
                    padding: 14px 20px 14px 48px;
                    font-size: 15px;
                }
                
                .task-clean-card {
                    padding: 12px;
                }
                
                .task-title-clean {
                    font-size: 15px;
                }
                
                .task-type-badge {
                    font-size: 12px;
                    padding: 4px 8px;
                }
                
                .deadline-badge {
                    font-size: 11px;
                    padding: 4px 8px;
                }
                
                .task-recipient-clean {
                    font-size: 13px;
                }
                
                .priority-bar {
                    width: 4px;
                    height: 40px;
                    margin-right: 12px;
                }
                
                .action-btn-clean {
                    width: 32px;
                    height: 32px;
                    font-size: 13px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================================
// GLOBAL INITIALIZATION
// =====================================

function initializeTaskManager() {
    console.log('[TaskManager] Initializing global instances v9.0...');
    
    if (!window.taskManager || !window.taskManager.initialized) {
        window.taskManager = new TaskManager();
    }
    
    if (!window.tasksView) {
        window.tasksView = new TasksView();
    }
    
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
    
    console.log('✅ TaskManager v9.0 loaded - Interface épurée et moderne');
}

initializeTaskManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[TaskManager] DOM ready, ensuring initialization...');
    initializeTaskManager();
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.taskManager || !window.taskManager.initialized) {
            console.log('[TaskManager] Fallback initialization...');
            initializeTaskManager();
        }
    }, 1000);
});
