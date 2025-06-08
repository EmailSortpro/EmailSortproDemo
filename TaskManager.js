// TaskManager Pro v9.1 - Interface Moderne avec TOUTES les Fonctionnalités
// Menu centré + Email complet + Suggestions IA + Modification + etc.

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
            console.log('[TaskManager] Initializing v9.1 - Interface moderne avec toutes fonctionnalités...');
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
            const saved = localStorage.getItem('emailsort_tasks_v9');
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
                id: 'task_1',
                title: 'Validation campagne marketing Q2',
                description: '📧 RÉSUMÉ EXÉCUTIF\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDe: Sarah Martin (acme-corp.com)\nObjet: Demande de validation pour la campagne marketing Q2\n📮 Réponse attendue\n\n🎯 ACTIONS REQUISES:\n1. Valider les visuels de la campagne\n2. Confirmer le budget alloué\n3. Définir les dates de lancement\n\n💡 INFORMATIONS CLÉS:\n• Budget proposé : 50k€\n• Cible : 25-45 ans\n• Canaux : LinkedIn, Google Ads\n\n⚠️ POINTS D\'ATTENTION:\n• Deadline serrée pour le lancement\n• Coordination avec l\'équipe commerciale requise',
                client: 'ACME Corp',
                company: 'acme-corp.com',
                emailFrom: 'sarah.martin@acme-corp.com',
                emailFromName: 'Sarah Martin',
                emailSubject: 'Validation campagne marketing Q2',
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
                priority: 'high',
                status: 'todo',
                category: 'marketing',
                type: 'email',
                dueDate: '2025-06-10',
                createdAt: new Date().toISOString(),
                hasEmail: true,
                needsReply: true,
                emailReplied: false,
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
[Votre nom]`,
                        description: 'Réponse professionnelle d\'approbation',
                        generatedBy: 'claude-ai'
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
[Votre nom]`,
                        description: 'Réponse avec questions complémentaires',
                        generatedBy: 'claude-ai'
                    }
                ],
                tags: ['marketing', 'validation', 'q2'],
                summary: 'Validation urgente de la campagne marketing Q2 avec budget de 50k€',
                aiRepliesGenerated: true,
                aiRepliesGeneratedAt: new Date().toISOString()
            },
            {
                id: 'task_2', 
                title: 'Révision contrat partenariat',
                description: 'Révision complète du contrat de partenariat avec TechFlow pour la nouvelle année.',
                client: 'TechFlow',
                company: 'techflow.io',
                emailFrom: 'legal@techflow.io',
                emailFromName: 'Marie Dubois',
                emailSubject: 'Révision contrat partenariat 2025',
                emailContent: 'Email concernant la révision du contrat de partenariat pour 2025...',
                priority: 'urgent',
                status: 'in-progress',
                category: 'legal',
                type: 'email',
                dueDate: '2025-06-08',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                hasEmail: true,
                needsReply: true,
                emailReplied: false,
                actions: [
                    { text: 'Examiner les nouvelles clauses', deadline: '2025-06-08' },
                    { text: 'Valider les conditions financières', deadline: '2025-06-08' }
                ],
                keyInfo: ['Contrat annuel', 'Conditions modifiées'],
                risks: ['Délai très serré'],
                suggestedReplies: [],
                tags: ['legal', 'contrat', 'urgent'],
                summary: 'Révision urgente du contrat de partenariat TechFlow'
            },
            {
                id: 'task_3',
                title: 'Préparation présentation client',
                description: 'Préparer la présentation pour le client StartupXYZ concernant leur nouveau projet.',
                client: 'StartupXYZ',
                company: 'startup-xyz.fr',
                emailFrom: 'ceo@startup-xyz.fr',
                emailFromName: 'Pierre Laurent',
                priority: 'medium',
                status: 'todo', 
                category: 'presentation',
                type: 'meeting',
                dueDate: '2025-06-12',
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                hasEmail: false,
                needsReply: false,
                actions: [
                    { text: 'Créer les slides', deadline: '2025-06-11' },
                    { text: 'Préparer la démo', deadline: '2025-06-11' }
                ],
                keyInfo: ['Nouveau projet', 'Présentation stratégique'],
                risks: [],
                suggestedReplies: [],
                tags: ['presentation', 'client'],
                summary: 'Préparation présentation pour StartupXYZ'
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
    }

    // MÉTHODE PRINCIPALE POUR CRÉER UNE TÂCHE À PARTIR D'UN EMAIL - AVEC TOUTES LES FONCTIONNALITÉS
    async createTaskFromEmail(taskData, email = null) {
        console.log('[TaskManager] Creating task from email with all features:', taskData.title);
        
        const taskId = taskData.id || this.generateId();
        
        // EXTRAIRE LE CONTENU COMPLET DE L'EMAIL
        const fullEmailContent = this.extractFullEmailContent(email, taskData);
        const htmlEmailContent = this.extractHtmlEmailContent(email, taskData);
        
        // GÉNÉRER DES SUGGESTIONS DE RÉPONSE VIA IA SI NÉCESSAIRE
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
            client: taskData.client || this.extractClient(taskData.emailFrom),
            company: taskData.company || this.extractCompany(taskData.emailFrom),
            emailFrom: taskData.emailFrom || (email?.from?.emailAddress?.address),
            emailFromName: taskData.emailFromName || (email?.from?.emailAddress?.name),
            emailSubject: taskData.emailSubject || email?.subject,
            emailContent: fullEmailContent,
            emailHtmlContent: htmlEmailContent,
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            category: taskData.category || 'email',
            type: taskData.type || 'email',
            dueDate: taskData.dueDate || null,
            hasEmail: true,
            needsReply: taskData.needsReply !== false,
            emailReplied: false,
            emailDate: taskData.emailDate || email?.receivedDateTime,
            
            // DONNÉES STRUCTURÉES COMPLÈTES
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            tags: taskData.tags || [],
            
            // SUGGESTIONS DE RÉPONSE IA
            suggestedReplies: suggestedReplies,
            aiRepliesGenerated: suggestedReplies.length > 0,
            aiRepliesGeneratedAt: suggestedReplies.length > 0 ? new Date().toISOString() : null,
            
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            method: taskData.method || 'ai'
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        
        console.log('[TaskManager] Task created with all features:', task.id);
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

            const replyPrompt = `Tu es un assistant expert en communication professionnelle. Génère 3 suggestions de réponse personnalisées pour cet email.

CONTEXTE DE L'EMAIL:
Expéditeur: ${senderName} <${senderEmail}>
Sujet: ${subject}
Priorité détectée: ${urgency}
Actions requises: ${hasActions ? 'Oui' : 'Non'}

CONTENU DE L'EMAIL:
${content}

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
                return aiResponse.suggestions.map(suggestion => ({
                    tone: suggestion.tone || 'neutre',
                    subject: suggestion.subject || `Re: ${subject}`,
                    content: suggestion.content || '',
                    description: suggestion.description || '',
                    generatedBy: 'claude-ai',
                    generatedAt: new Date().toISOString()
                }));
            } else {
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
                return await this.callClaudeAPI(prompt);
            } else {
                return this.generateBasicReplySuggestionsFromPrompt(prompt);
            }
        } catch (error) {
            console.error('[TaskManager] AI API call failed:', error);
            throw error;
        }
    }

    generateBasicReplySuggestions(email, taskData) {
        const senderName = email.from?.emailAddress?.name || taskData.emailFromName || 'l\'expéditeur';
        const subject = email.subject || taskData.emailSubject || 'votre message';
        
        return [
            {
                tone: 'professionnel',
                subject: `Re: ${subject}`,
                content: `Bonjour ${senderName},

Merci pour votre message concernant "${subject}".

J'ai bien pris connaissance de votre demande et je m'en occupe rapidement. Je vous tiendrai informé de l'avancement.

Cordialement,
[Votre nom]`,
                description: 'Réponse professionnelle standard',
                generatedBy: 'local-fallback'
            }
        ];
    }

    // MÉTHODES POUR EXTRAIRE LE CONTENU EMAIL COMPLET
    extractFullEmailContent(email, taskData) {
        if (taskData.emailContent && taskData.emailContent.length > 50) {
            return taskData.emailContent;
        }
        
        if (email?.body?.content) {
            return this.cleanEmailContent(email.body.content);
        }
        
        return this.buildMinimalEmailContent(email, taskData);
    }

    extractHtmlEmailContent(email, taskData) {
        if (taskData.emailHtmlContent && taskData.emailHtmlContent.length > 50) {
            return taskData.emailHtmlContent;
        }
        
        if (email?.body?.contentType === 'html' && email?.body?.content) {
            return this.cleanHtmlEmailContent(email.body.content);
        }
        
        const textContent = this.extractFullEmailContent(email, taskData);
        return this.convertTextToHtml(textContent, email);
    }

    cleanEmailContent(content) {
        if (!content) return '';
        
        return content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
    }

    cleanHtmlEmailContent(htmlContent) {
        if (!htmlContent) return '';
        
        return htmlContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
    }

    convertTextToHtml(textContent, email) {
        if (!textContent) return '';
        
        const senderName = email?.from?.emailAddress?.name || 'Expéditeur';
        const senderEmail = email?.from?.emailAddress?.address || '';
        const subject = email?.subject || 'Sans sujet';
        const date = email?.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString('fr-FR') : '';
        
        const htmlContent = textContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return `<div class="email-content-viewer">
            <div class="email-header">
                <strong>De:</strong> ${senderName} &lt;${senderEmail}&gt;<br>
                <strong>Date:</strong> ${date}<br>
                <strong>Sujet:</strong> ${subject}
            </div>
            <div class="email-body">
                ${htmlContent}
            </div>
        </div>`;
    }

    buildMinimalEmailContent(email, taskData) {
        const senderName = taskData.emailFromName || email?.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = taskData.emailFrom || email?.from?.emailAddress?.address || '';
        const subject = taskData.emailSubject || email?.subject || 'Sans sujet';
        
        return `Email de: ${senderName} <${senderEmail}>
Sujet: ${subject}

${taskData.summary || 'Contenu de l\'email...'}`;
    }

    createTask(taskData) {
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            client: taskData.client || 'Client',
            company: taskData.company || 'company.com',
            emailFrom: taskData.emailFrom || null,
            emailFromName: taskData.emailFromName || null,
            emailSubject: taskData.emailSubject || null,
            emailContent: taskData.emailContent || '',
            emailHtmlContent: taskData.emailHtmlContent || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            category: taskData.category || 'other',
            type: taskData.type || 'task',
            dueDate: taskData.dueDate || null,
            hasEmail: false,
            needsReply: false,
            emailReplied: false,
            
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            tags: taskData.tags || [],
            suggestedReplies: taskData.suggestedReplies || [],
            
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
        
        if (filters.company && filters.company !== 'all') {
            filtered = filtered.filter(task => task.company === filters.company);
        }
        
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(task => task.type === filters.type);
        }
        
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(search) ||
                task.client.toLowerCase().includes(search) ||
                (task.emailFromName && task.emailFromName.toLowerCase().includes(search))
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
                task.needsReply && !task.emailReplied && task.status !== 'completed'
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
            case 'company':
                sorted.sort((a, b) => a.company.localeCompare(b.company));
                break;
            case 'created':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return sorted;
    }

    getGroupedTasks(tasks) {
        const grouped = {};
        
        tasks.forEach(task => {
            const key = task.company;
            if (!grouped[key]) {
                grouped[key] = {
                    company: key,
                    tasks: [],
                    count: 0,
                    urgent: 0,
                    needsReply: 0
                };
            }
            
            grouped[key].tasks.push(task);
            grouped[key].count++;
            
            if (task.priority === 'urgent') grouped[key].urgent++;
            if (task.needsReply && !task.emailReplied) grouped[key].needsReply++;
        });
        
        return Object.values(grouped).sort((a, b) => b.count - a.count);
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
                t.needsReply && !t.emailReplied && t.status !== 'completed'
            ).length
        };
    }

    extractClient(email) {
        if (!email) return 'Client';
        const domain = email.split('@')[1];
        if (!domain) return 'Client';
        
        const name = domain.split('.')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    extractCompany(email) {
        if (!email) return 'company.com';
        return email.split('@')[1] || 'company.com';
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
            localStorage.setItem('emailsort_tasks_v9', JSON.stringify(this.tasks));
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
// MODERN TASKS VIEW - MENU CENTRÉ + TOUTES FONCTIONNALITÉS
// =====================================
class TasksView {
    constructor() {
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            company: 'all',
            type: 'all',
            search: '',
            sortBy: 'created'
        };
        
        this.selectedTasks = new Set();
        this.expandedGroups = new Set();
        this.viewMode = 'grouped';
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

        // Force l'initialisation si nécessaire
        if (!window.taskManager || !window.taskManager.initialized) {
            console.log('[TasksView] TaskManager not ready, forcing initialization...');
            initializeModernTaskManager();
            
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Chargement des tâches...</p>
                </div>
            `;
            
            setTimeout(() => {
                console.log('[TasksView] Retrying render after initialization...');
                this.render(container);
            }, 1000);
            return;
        }

        const stats = window.taskManager.getStats();
        
        container.innerHTML = `
            <div class="modern-tasks-app">
                ${this.renderHeader(stats)}
                ${this.renderStatusFilters(stats)}
                ${this.renderAdvancedFilters()}
                ${this.renderTasksContent()}
            </div>
        `;

        this.addModernStyles();
        this.setupEventListeners();
        console.log('[TasksView] Modern interface with all features rendered');
    }

    renderHeader(stats) {
        return `
            <header class="tasks-header">
                <div class="header-container">
                    <div class="header-left">
                        <h1 class="page-title">Tâches</h1>
                        <span class="total-count">${stats.total} tâche${stats.total > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div class="header-center">
                        <div class="search-box">
                            <input type="text" 
                                   class="search-input" 
                                   placeholder="Rechercher dans les tâches..." 
                                   value="${this.currentFilters.search}"
                                   onInput="window.tasksView.handleSearch(this.value)">
                            <i class="search-icon">🔍</i>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <div class="view-toggle">
                            <button class="toggle-btn ${this.viewMode === 'grouped' ? 'active' : ''}" 
                                    onclick="window.tasksView.setViewMode('grouped')">
                                <i class="icon">📁</i> Groupé
                            </button>
                            <button class="toggle-btn ${this.viewMode === 'list' ? 'active' : ''}" 
                                    onclick="window.tasksView.setViewMode('list')">
                                <i class="icon">📄</i> Liste
                            </button>
                        </div>
                        
                        <button class="btn-primary" onclick="window.tasksView.showCreateModal()">
                            <i class="icon">➕</i> Nouvelle tâche
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    renderStatusFilters(stats) {
        const filters = [
            { id: 'all', name: 'Toutes', icon: '📋', count: stats.total },
            { id: 'todo', name: 'À faire', icon: '⏳', count: stats.todo },
            { id: 'in-progress', name: 'En cours', icon: '🔄', count: stats.inProgress },
            { id: 'overdue', name: 'En retard', icon: '⚠️', count: stats.overdue },
            { id: 'needsReply', name: 'À répondre', icon: '📧', count: stats.needsReply },
            { id: 'completed', name: 'Terminées', icon: '✅', count: stats.completed }
        ];

        return `
            <div class="status-filters">
                <div class="filters-container">
                    ${filters.map(filter => `
                        <button class="status-filter ${this.isFilterActive(filter.id) ? 'active' : ''}" 
                                onclick="window.tasksView.quickFilter('${filter.id}')">
                            <span class="filter-icon">${filter.icon}</span>
                            <span class="filter-name">${filter.name}</span>
                            <span class="filter-count">${filter.count}</span>
                        </button>
                    `).join('')}
                    
                    <button class="advanced-filters-toggle ${this.showAdvancedFilters ? 'active' : ''}" 
                            onclick="window.tasksView.toggleAdvancedFilters()">
                        <i class="icon">🔧</i>
                        Filtres avancés
                        <i class="chevron ${this.showAdvancedFilters ? 'up' : 'down'}">▼</i>
                    </button>
                </div>
            </div>
        `;
    }

    renderAdvancedFilters() {
        const companies = [...new Set(window.taskManager.getAllTasks().map(t => t.company))].sort();
        const types = [...new Set(window.taskManager.getAllTasks().map(t => t.type))].sort();
        
        return `
            <div class="advanced-filters ${this.showAdvancedFilters ? 'show' : ''}">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label>Priorité</label>
                        <select class="filter-select" onchange="window.tasksView.updateFilter('priority', this.value)">
                            <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>Toutes priorités</option>
                            <option value="urgent" ${this.currentFilters.priority === 'urgent' ? 'selected' : ''}>🔥 Urgente</option>
                            <option value="high" ${this.currentFilters.priority === 'high' ? 'selected' : ''}>🔴 Haute</option>
                            <option value="medium" ${this.currentFilters.priority === 'medium' ? 'selected' : ''}>🟡 Normale</option>
                            <option value="low" ${this.currentFilters.priority === 'low' ? 'selected' : ''}>🟢 Basse</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Société</label>
                        <select class="filter-select" onchange="window.tasksView.updateFilter('company', this.value)">
                            <option value="all" ${this.currentFilters.company === 'all' ? 'selected' : ''}>Toutes sociétés</option>
                            ${companies.map(company => `
                                <option value="${company}" ${this.currentFilters.company === company ? 'selected' : ''}>${company}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Type</label>
                        <select class="filter-select" onchange="window.tasksView.updateFilter('type', this.value)">
                            <option value="all" ${this.currentFilters.type === 'all' ? 'selected' : ''}>Tous types</option>
                            ${types.map(type => `
                                <option value="${type}" ${this.currentFilters.type === type ? 'selected' : ''}>${this.getTypeLabel(type)}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Tri</label>
                        <select class="filter-select" onchange="window.tasksView.updateFilter('sortBy', this.value)">
                            <option value="created" ${this.currentFilters.sortBy === 'created' ? 'selected' : ''}>Date création</option>
                            <option value="priority" ${this.currentFilters.sortBy === 'priority' ? 'selected' : ''}>Priorité</option>
                            <option value="dueDate" ${this.currentFilters.sortBy === 'dueDate' ? 'selected' : ''}>Échéance</option>
                            <option value="company" ${this.currentFilters.sortBy === 'company' ? 'selected' : ''}>Société</option>
                        </select>
                    </div>
                    
                    <button class="filter-reset" onclick="window.tasksView.resetFilters()">
                        <i class="icon">🔄</i> Reset
                    </button>
                </div>
            </div>
        `;
    }

    renderTasksContent() {
        const tasks = window.taskManager.filterTasks(this.currentFilters);
        
        if (tasks.length === 0) {
            return this.renderEmptyState();
        }

        if (this.viewMode === 'grouped') {
            return this.renderGroupedTasks(tasks);
        } else {
            return this.renderListTasks(tasks);
        }
    }

    renderGroupedTasks(tasks) {
        const groups = window.taskManager.getGroupedTasks(tasks);
        
        return `
            <div class="tasks-container grouped-view">
                ${groups.map(group => this.renderTaskGroup(group)).join('')}
            </div>
        `;
    }

    renderTaskGroup(group) {
        const isExpanded = this.expandedGroups.has(group.company);
        
        return `
            <div class="task-group ${isExpanded ? 'expanded' : ''}">
                <div class="group-header" onclick="window.tasksView.toggleGroup('${group.company}')">
                    <div class="group-info">
                        <div class="company-avatar">
                            ${group.company.charAt(0).toUpperCase()}
                        </div>
                        <div class="group-details">
                            <h3 class="company-name">${group.company}</h3>
                            <span class="task-count">${group.count} tâche${group.count > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    
                    <div class="group-badges">
                        ${group.urgent > 0 ? `<span class="badge urgent">${group.urgent} urgente${group.urgent > 1 ? 's' : ''}</span>` : ''}
                        ${group.needsReply > 0 ? `<span class="badge reply">${group.needsReply} à répondre</span>` : ''}
                        <i class="expand-icon ${isExpanded ? 'expanded' : ''}">▼</i>
                    </div>
                </div>
                
                <div class="group-tasks ${isExpanded ? 'show' : ''}">
                    ${group.tasks.map(task => this.renderTaskCard(task)).join('')}
                </div>
            </div>
        `;
    }

    renderListTasks(tasks) {
        return `
            <div class="tasks-container list-view">
                ${tasks.map(task => this.renderTaskCard(task)).join('')}
            </div>
        `;
    }

    renderTaskCard(task) {
        const priorityColor = this.getPriorityColor(task.priority);
        const statusIcon = this.getStatusIcon(task.status);
        const typeIcon = this.getTypeIcon(task.type);
        const dueDateInfo = this.formatDueDate(task.dueDate);
        const hasAiSuggestions = task.suggestedReplies && task.suggestedReplies.length > 0;
        
        return `
            <div class="task-card ${task.status}" 
                 data-task-id="${task.id}"
                 onclick="window.tasksView.showTaskDetails('${task.id}')">
                
                <div class="task-left">
                    <div class="priority-indicator" style="background: ${priorityColor}"></div>
                    
                    <div class="task-content">
                        <div class="task-header">
                            <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
                            <div class="task-meta">
                                <span class="client-name">${task.client}</span>
                                <span class="separator">•</span>
                                <span class="company-domain">${task.company}</span>
                            </div>
                        </div>
                        
                        ${task.emailFromName ? `
                            <div class="sender-info">
                                <i class="icon">👤</i>
                                <span>${task.emailFromName}</span>
                                ${hasAiSuggestions ? '<span class="ai-badge">🤖 IA</span>' : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-right">
                    <div class="task-badges">
                        <span class="type-badge ${task.type}">
                            ${typeIcon} ${this.getTypeLabel(task.type)}
                        </span>
                        
                        ${task.needsReply && !task.emailReplied ? '<span class="reply-badge">📧 Réponse</span>' : ''}
                        ${dueDateInfo.badge ? dueDateInfo.badge : ''}
                    </div>
                    
                    <div class="task-actions">
                        <span class="status-badge ${task.status}">
                            ${statusIcon}
                        </span>
                        
                        ${task.needsReply && !task.emailReplied ? `
                            <button class="action-btn reply-btn" 
                                    onclick="event.stopPropagation(); window.tasksView.replyToEmail('${task.id}')"
                                    title="Répondre à l'email">
                                📧
                            </button>
                        ` : ''}
                        
                        <button class="action-btn quick-complete" 
                                onclick="event.stopPropagation(); window.tasksView.quickComplete('${task.id}')"
                                title="Marquer terminé">
                            ✅
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>Aucune tâche trouvée</h3>
                <p>Aucune tâche ne correspond à vos critères de recherche</p>
                <button class="btn-primary" onclick="window.tasksView.resetFilters()">
                    Réinitialiser les filtres
                </button>
            </div>
        `;
    }

    // MODAL DÉTAILS COMPLET AVEC TOUTES LES FONCTIONNALITÉS
    showTaskDetails(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="task-details-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>${this.escapeHtml(task.title)}</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    
                    <div class="modal-content">
                        <!-- Informations principales -->
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Client</label>
                                <span>${task.client}</span>
                            </div>
                            <div class="detail-item">
                                <label>Société</label>
                                <span>${task.company}</span>
                            </div>
                            <div class="detail-item">
                                <label>Priorité</label>
                                <span class="priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Type</label>
                                <span>${this.getTypeLabel(task.type)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Statut</label>
                                <span class="status-${task.status}">${this.getStatusLabel(task.status)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Échéance</label>
                                <span>${task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : 'Aucune'}</span>
                            </div>
                        </div>
                        
                        <!-- Description -->
                        ${task.description ? `
                            <div class="detail-section">
                                <h3>Description</h3>
                                <div class="description-content">
                                    ${this.formatDescription(task.description)}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Actions requises -->
                        ${task.actions && task.actions.length > 0 ? `
                            <div class="detail-section">
                                <h3>Actions requises</h3>
                                <div class="actions-list">
                                    ${task.actions.map((action, idx) => `
                                        <div class="action-item">
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
                        
                        <!-- Informations clés -->
                        ${task.keyInfo && task.keyInfo.length > 0 ? `
                            <div class="detail-section">
                                <h3>Informations clés</h3>
                                <div class="info-list">
                                    ${task.keyInfo.map(info => `
                                        <div class="info-item">
                                            <i class="info-icon">▶</i>
                                            <span>${this.escapeHtml(info)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Points d'attention -->
                        ${task.risks && task.risks.length > 0 ? `
                            <div class="detail-section risks-section">
                                <h3>Points d'attention</h3>
                                <div class="risks-list">
                                    ${task.risks.map(risk => `
                                        <div class="risk-item">
                                            <i class="risk-icon">⚠️</i>
                                            <span>${this.escapeHtml(risk)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Informations email -->
                        ${task.hasEmail ? `
                            <div class="detail-section email-section">
                                <h3>Informations email</h3>
                                <div class="email-info">
                                    <p><strong>De:</strong> ${task.emailFromName || 'Inconnu'} (${task.emailFrom || 'email inconnu'})</p>
                                    <p><strong>Sujet:</strong> ${task.emailSubject || 'Sans sujet'}</p>
                                    ${task.needsReply && !task.emailReplied ? '<p class="needs-reply">📧 Réponse requise</p>' : ''}
                                    ${task.emailReplied ? '<p class="replied">✅ Réponse envoyée</p>' : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Contenu email complet -->
                        ${task.emailContent && task.emailContent.length > 100 ? `
                            <div class="detail-section">
                                <h3>Contenu de l'email</h3>
                                <div class="email-content-tabs">
                                    ${task.emailHtmlContent ? `
                                        <button class="tab-btn active" onclick="window.tasksView.switchEmailTab('html', '${task.id}')">
                                            Vue formatée
                                        </button>
                                        <button class="tab-btn" onclick="window.tasksView.switchEmailTab('text', '${task.id}')">
                                            Vue texte
                                        </button>
                                    ` : ''}
                                </div>
                                <div class="email-content-box">
                                    ${task.emailHtmlContent ? `
                                        <div id="email-html-${task.id}" class="email-content-view active">
                                            ${task.emailHtmlContent}
                                        </div>
                                        <div id="email-text-${task.id}" class="email-content-view" style="display: none;">
                                            ${this.formatEmailContent(task.emailContent)}
                                        </div>
                                    ` : `
                                        <div class="email-content-view">
                                            ${this.formatEmailContent(task.emailContent)}
                                        </div>
                                    `}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Suggestions de réponse IA -->
                        ${task.suggestedReplies && task.suggestedReplies.length > 0 ? `
                            <div class="detail-section suggestions-section">
                                <h3>Suggestions de réponse IA</h3>
                                <div class="suggestions-container">
                                    ${task.suggestedReplies.map((reply, idx) => `
                                        <div class="suggestion-card">
                                            <div class="suggestion-header">
                                                <span class="suggestion-tone ${reply.tone}">${this.getReplyToneLabel(reply.tone)}</span>
                                                <button class="copy-btn" onclick="window.tasksView.copyReply('${task.id}', ${idx})">
                                                    📋 Copier
                                                </button>
                                            </div>
                                            <div class="suggestion-subject">
                                                <strong>Sujet:</strong> ${this.escapeHtml(reply.subject)}
                                            </div>
                                            <div class="suggestion-content">
                                                ${this.escapeHtml(reply.content).replace(/\n/g, '<br>')}
                                            </div>
                                            <div class="suggestion-actions">
                                                <button class="use-reply-btn" onclick="window.tasksView.useReply('${task.id}', ${idx})">
                                                    📧 Utiliser cette réponse
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Tags -->
                        ${task.tags && task.tags.length > 0 ? `
                            <div class="detail-section">
                                <h3>Tags</h3>
                                <div class="tags-list">
                                    ${task.tags.map(tag => `
                                        <span class="tag">#${tag}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Fermer
                        </button>
                        
                        <button class="btn-secondary" onclick="window.tasksView.showEditModal('${task.id}')">
                            ✏️ Modifier
                        </button>
                        
                        ${task.needsReply && !task.emailReplied ? `
                            <button class="btn-primary" onclick="window.tasksView.replyToEmail('${task.id}')">
                                📧 Répondre
                            </button>
                        ` : ''}
                        
                        ${task.status !== 'completed' ? `
                            <button class="btn-primary" onclick="window.tasksView.completeTask('${task.id}'); this.closest('.modal-overlay').remove();">
                                ✅ Marquer terminé
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // MODAL DE MODIFICATION COMPLÈTE
    showEditModal(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="edit-task-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>Modifier la tâche</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="form-group">
                            <label>Titre *</label>
                            <input type="text" id="edit-task-title" class="form-input" value="${this.escapeHtml(task.title)}">
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="edit-task-description" class="form-textarea" rows="4">${this.escapeHtml(task.description || '')}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Client</label>
                                <input type="text" id="edit-task-client" class="form-input" value="${this.escapeHtml(task.client)}">
                            </div>
                            <div class="form-group">
                                <label>Société</label>
                                <input type="text" id="edit-task-company" class="form-input" value="${this.escapeHtml(task.company)}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="edit-task-priority" class="form-select">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Basse</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Normale</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 Haute</option>
                                    <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>🔥 Urgente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Statut</label>
                                <select id="edit-task-status" class="form-select">
                                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>⏳ À faire</option>
                                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>🔄 En cours</option>
                                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Terminé</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type</label>
                                <select id="edit-task-type" class="form-select">
                                    <option value="task" ${task.type === 'task' ? 'selected' : ''}>📋 Tâche</option>
                                    <option value="email" ${task.type === 'email' ? 'selected' : ''}>📧 Email</option>
                                    <option value="meeting" ${task.type === 'meeting' ? 'selected' : ''}>🤝 Réunion</option>
                                    <option value="call" ${task.type === 'call' ? 'selected' : ''}>📞 Appel</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Échéance</label>
                                <input type="date" id="edit-task-duedate" class="form-input" value="${task.dueDate || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Tags (séparés par des virgules)</label>
                            <input type="text" id="edit-task-tags" class="form-input" value="${task.tags ? task.tags.join(', ') : ''}">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Annuler
                        </button>
                        <button class="btn-primary" onclick="window.tasksView.saveTaskEdit('${task.id}')">
                            💾 Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('edit-task-title').focus();
    }

    // MODAL DE CRÉATION AVEC TOUTES LES OPTIONS
    showCreateModal() {
        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="create-task-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>Nouvelle tâche</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="form-group">
                            <label>Titre *</label>
                            <input type="text" id="task-title" class="form-input" placeholder="Titre de la tâche">
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="task-description" class="form-textarea" rows="4" placeholder="Description détaillée..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Client</label>
                                <input type="text" id="task-client" class="form-input" placeholder="Nom du client">
                            </div>
                            <div class="form-group">
                                <label>Société</label>
                                <input type="text" id="task-company" class="form-input" placeholder="company.com">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="task-priority" class="form-select">
                                    <option value="low">🟢 Basse</option>
                                    <option value="medium" selected>🟡 Normale</option>
                                    <option value="high">🔴 Haute</option>
                                    <option value="urgent">🔥 Urgente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select id="task-type" class="form-select">
                                    <option value="task">📋 Tâche</option>
                                    <option value="email">📧 Email</option>
                                    <option value="meeting">🤝 Réunion</option>
                                    <option value="call">📞 Appel</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Échéance</label>
                            <input type="date" id="task-duedate" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Tags (séparés par des virgules)</label>
                            <input type="text" id="task-tags" class="form-input" placeholder="tag1, tag2, tag3">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Annuler
                        </button>
                        <button class="btn-primary" onclick="window.tasksView.createTask()">
                            ✅ Créer la tâche
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('task-title').focus();
    }

    // Event Handlers complets
    handleSearch(value) {
        this.currentFilters.search = value;
        this.refreshView();
    }

    updateFilter(type, value) {
        this.currentFilters[type] = value;
        this.refreshView();
    }

    resetFilters() {
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            company: 'all',
            type: 'all',
            search: '',
            sortBy: 'created'
        };
        this.refreshView();
        this.showToast('Filtres réinitialisés', 'info');
    }

    quickFilter(filterId) {
        // Reset other filters
        this.currentFilters = {
            ...this.currentFilters,
            status: 'all',
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

    isFilterActive(filterId) {
        switch (filterId) {
            case 'all': 
                return this.currentFilters.status === 'all' && !this.currentFilters.overdue && !this.currentFilters.needsReply;
            case 'todo': 
                return this.currentFilters.status === 'todo';
            case 'in-progress': 
                return this.currentFilters.status === 'in-progress';
            case 'completed': 
                return this.currentFilters.status === 'completed';
            case 'overdue': 
                return this.currentFilters.overdue;
            case 'needsReply': 
                return this.currentFilters.needsReply;
            default: 
                return false;
        }
    }

    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;
        this.refreshView();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.refreshView();
    }

    toggleGroup(company) {
        if (this.expandedGroups.has(company)) {
            this.expandedGroups.delete(company);
        } else {
            this.expandedGroups.add(company);
        }
        this.refreshView();
    }

    quickComplete(taskId) {
        window.taskManager.updateTask(taskId, { status: 'completed' });
        this.showToast('Tâche marquée comme terminée', 'success');
    }

    completeTask(taskId) {
        window.taskManager.updateTask(taskId, { status: 'completed' });
        this.showToast('Tâche marquée comme terminée', 'success');
    }

    // NOUVELLES MÉTHODES POUR LES FONCTIONNALITÉS EMAIL
    replyToEmail(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        // Si on a des suggestions IA, les montrer
        if (task.suggestedReplies && task.suggestedReplies.length > 0) {
            this.showReplySuggestions(taskId);
        } else {
            // Sinon, réponse basique
            this.replyToEmailBasic(taskId);
        }
    }

    showReplySuggestions(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="reply-suggestions-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>Suggestions de réponse IA</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="ai-info">
                            <div class="ai-badge">🤖 Suggestions générées par Claude AI</div>
                            <p>Réponses personnalisées pour l'email de <strong>${task.emailFromName}</strong></p>
                        </div>
                        
                        <div class="suggestions-list">
                            ${task.suggestedReplies.map((reply, idx) => `
                                <div class="suggestion-card">
                                    <div class="suggestion-header">
                                        <span class="suggestion-tone ${reply.tone}">${this.getReplyToneLabel(reply.tone)}</span>
                                        <div class="suggestion-actions">
                                            <button class="copy-btn" onclick="window.tasksView.copyReply('${taskId}', ${idx})">
                                                📋 Copier
                                            </button>
                                            <button class="use-btn" onclick="window.tasksView.useReply('${taskId}', ${idx})">
                                                📧 Utiliser
                                            </button>
                                        </div>
                                    </div>
                                    <div class="suggestion-subject">
                                        <strong>Sujet:</strong> ${this.escapeHtml(reply.subject)}
                                    </div>
                                    <div class="suggestion-content">
                                        ${this.escapeHtml(reply.content).replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Fermer
                        </button>
                        <button class="btn-secondary" onclick="window.tasksView.replyToEmailBasic('${taskId}')">
                            📧 Réponse basique
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async copyReply(taskId, replyIndex) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.suggestedReplies || !task.suggestedReplies[replyIndex]) return;

        const reply = task.suggestedReplies[replyIndex];
        const text = `Sujet: ${reply.subject}\n\n${reply.content}`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Réponse copiée dans le presse-papiers', 'success');
        } catch (error) {
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
        
        // Créer le lien mailto
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        // Marquer comme répondu
        window.taskManager.updateTask(taskId, { 
            emailReplied: true,
            status: task.status === 'todo' ? 'in-progress' : task.status
        });
        
        this.showToast('Email de réponse ouvert dans votre client email', 'success');
        
        // Fermer les modals
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
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

    createTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const client = document.getElementById('task-client').value.trim();
        const company = document.getElementById('task-company').value.trim();
        const priority = document.getElementById('task-priority').value;
        const type = document.getElementById('task-type').value;
        const dueDate = document.getElementById('task-duedate').value;
        const tagsInput = document.getElementById('task-tags').value.trim();

        if (!title) {
            this.showToast('Le titre est requis', 'error');
            return;
        }

        const taskData = {
            title,
            description,
            client: client || 'Client',
            company: company || 'company.com',
            priority,
            type,
            dueDate: dueDate || null,
            tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : []
        };

        window.taskManager.createTask(taskData);
        document.querySelector('.modal-overlay').remove();
        this.showToast('Tâche créée avec succès', 'success');
    }

    saveTaskEdit(taskId) {
        const title = document.getElementById('edit-task-title').value.trim();
        const description = document.getElementById('edit-task-description').value.trim();
        const client = document.getElementById('edit-task-client').value.trim();
        const company = document.getElementById('edit-task-company').value.trim();
        const priority = document.getElementById('edit-task-priority').value;
        const status = document.getElementById('edit-task-status').value;
        const type = document.getElementById('edit-task-type').value;
        const dueDate = document.getElementById('edit-task-duedate').value;
        const tagsInput = document.getElementById('edit-task-tags').value.trim();

        if (!title) {
            this.showToast('Le titre est requis', 'error');
            return;
        }

        const updates = {
            title,
            description,
            client,
            company,
            priority,
            status,
            type,
            dueDate: dueDate || null,
            tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : []
        };

        window.taskManager.updateTask(taskId, updates);
        document.querySelector('.modal-overlay').remove();
        this.showToast('Tâche mise à jour avec succès', 'success');
    }

    // MÉTHODES POUR GÉRER LES ONGLETS EMAIL
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

    refreshView() {
        const container = document.querySelector('.modern-tasks-app');
        if (container) {
            const parent = container.parentElement;
            this.render(parent);
        }
    }

    setupEventListeners() {
        // Event listeners are handled via onclick attributes for simplicity
    }

    // Utility methods
    getPriorityColor(priority) {
        const colors = {
            urgent: '#ef4444',
            high: '#f97316', 
            medium: '#eab308',
            low: '#22c55e'
        };
        return colors[priority] || colors.medium;
    }

    getPriorityLabel(priority) {
        const labels = {
            urgent: '🔥 Urgente',
            high: '🔴 Haute',
            medium: '🟡 Normale', 
            low: '🟢 Basse'
        };
        return labels[priority] || labels.medium;
    }

    getStatusIcon(status) {
        const icons = {
            todo: '⏳',
            'in-progress': '🔄',
            completed: '✅'
        };
        return icons[status] || icons.todo;
    }

    getStatusLabel(status) {
        const labels = {
            todo: 'À faire',
            'in-progress': 'En cours',
            completed: 'Terminé'
        };
        return labels[status] || labels.todo;
    }

    getTypeIcon(type) {
        const icons = {
            email: '📧',
            meeting: '🤝',
            call: '📞',
            task: '📋'
        };
        return icons[type] || icons.task;
    }

    getTypeLabel(type) {
        const labels = {
            email: 'Email',
            meeting: 'Réunion', 
            call: 'Appel',
            task: 'Tâche'
        };
        return labels[type] || labels.task;
    }

    getReplyToneLabel(tone) {
        const labels = {
            formel: '👔 Formel',
            urgent: '🚨 Urgent',
            neutre: '📝 Neutre',
            détaillé: '📋 Détaillé',
            professionnel: '💼 Professionnel'
        };
        return labels[tone] || '📝 Neutre';
    }

    formatDueDate(dateString) {
        if (!dateString) return { badge: null };
        
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { 
                badge: `<span class="due-badge overdue">⚠️ Retard ${Math.abs(diffDays)}j</span>` 
            };
        } else if (diffDays === 0) {
            return { 
                badge: `<span class="due-badge today">📅 Aujourd'hui</span>` 
            };
        } else if (diffDays === 1) {
            return { 
                badge: `<span class="due-badge tomorrow">📅 Demain</span>` 
            };
        } else if (diffDays <= 7) {
            return { 
                badge: `<span class="due-badge soon">📅 ${diffDays}j</span>` 
            };
        }
        
        return { badge: null };
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
            } else {
                return deadlineDate.toLocaleDateString('fr-FR');
            }
        } catch (error) {
            return deadline;
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

    formatEmailContent(content) {
        if (!content) return '<p>Contenu non disponible</p>';
        
        const formattedContent = content
            .replace(/\n/g, '<br>')
            .replace(/Email de:/g, '<strong>Email de:</strong>')
            .replace(/Date:/g, '<strong>Date:</strong>')
            .replace(/Sujet:/g, '<strong>Sujet:</strong>');
            
        return `<div class="email-original-content">${formattedContent}</div>`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    addModernStyles() {
        if (document.getElementById('modernTaskStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernTaskStyles';
        styles.textContent = `
            /* Modern Minimalist Task Manager Styles - Menu centré + Toutes fonctionnalités */
            .modern-tasks-app {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #fafbfc;
                min-height: 100vh;
                color: #1a1a1a;
            }

            /* Header centré comme avant */
            .tasks-header {
                background: white;
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 24px;
                padding: 24px 32px;
            }

            .header-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1400px;
                margin: 0 auto;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 16px;
                min-width: 200px;
            }

            .page-title {
                font-size: 32px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0;
            }

            .total-count {
                background: #f3f4f6;
                color: #6b7280;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 600;
            }

            .header-center {
                flex: 1;
                max-width: 500px;
                margin: 0 32px;
            }

            .search-box {
                position: relative;
                width: 100%;
            }

            .search-input {
                padding: 14px 16px 14px 44px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 16px;
                width: 100%;
                background: white;
                transition: border-color 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .search-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 16px;
                color: #9ca3af;
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 16px;
                min-width: 200px;
                justify-content: flex-end;
            }

            .view-toggle {
                display: flex;
                background: #f3f4f6;
                border-radius: 10px;
                padding: 4px;
            }

            .toggle-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border: none;
                background: transparent;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                color: #6b7280;
                transition: all 0.2s ease;
            }

            .toggle-btn.active {
                background: white;
                color: #1a1a1a;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .btn-primary {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
            }

            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .btn-secondary {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: white;
                color: #374151;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-secondary:hover {
                border-color: #d1d5db;
                background: #f9fafb;
                transform: translateY(-1px);
            }

            /* Status Filters - Centrés */
            .status-filters {
                margin-bottom: 24px;
            }

            .filters-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 32px;
            }

            .status-filter {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .status-filter:hover {
                border-color: #3b82f6;
                background: #f8fafc;
                transform: translateY(-1px);
            }

            .status-filter.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: #667eea;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .filter-icon {
                font-size: 16px;
            }

            .filter-name {
                font-weight: 600;
            }

            .filter-count {
                background: rgba(0,0,0,0.1);
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 12px;
                font-weight: 700;
                min-width: 20px;
                text-align: center;
            }

            .status-filter.active .filter-count {
                background: rgba(255,255,255,0.25);
            }

            .advanced-filters-toggle {
                background: #f8fafc;
                border: 2px solid #e2e8f0;
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

            .chevron {
                transition: transform 0.2s ease;
                font-size: 12px;
                margin-left: 4px;
            }

            .chevron.up {
                transform: rotate(180deg);
            }

            /* Advanced Filters */
            .advanced-filters {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                margin: 0 auto 24px;
                max-width: 1400px;
                margin-left: auto;
                margin-right: auto;
                margin-bottom: 24px;
                overflow: hidden;
                max-height: 0;
                opacity: 0;
                transition: all 0.3s ease;
            }

            .advanced-filters.show {
                max-height: 200px;
                opacity: 1;
                padding: 20px 32px;
            }

            .filters-grid {
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

            .filter-group label {
                font-weight: 600;
                font-size: 14px;
                color: #374151;
            }

            .filter-select {
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
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

            .filter-reset {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 16px;
                background: #f3f4f6;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                color: #6b7280;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                height: fit-content;
            }

            .filter-reset:hover {
                background: #e5e7eb;
                color: #374151;
            }

            /* Tasks Container */
            .tasks-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 32px;
            }

            /* Grouped View */
            .task-group {
                background: white;
                border-radius: 16px;
                margin-bottom: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                overflow: hidden;
                transition: all 0.2s ease;
            }

            .task-group:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .group-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #f3f4f6;
            }

            .group-header:hover {
                background: #f9fafb;
            }

            .group-info {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .company-avatar {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 700;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .group-details h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1a1a1a;
            }

            .task-count {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }

            .group-badges {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .badge {
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                color: white;
            }

            .badge.urgent { 
                background: linear-gradient(135deg, #ef4444, #dc2626);
                box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
            }
            .badge.reply { 
                background: linear-gradient(135deg, #f59e0b, #d97706);
                box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
            }

            .expand-icon {
                font-size: 14px;
                color: #6b7280;
                transition: transform 0.2s ease;
            }

            .expand-icon.expanded {
                transform: rotate(180deg);
            }

            .group-tasks {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .group-tasks.show {
                max-height: 2000px;
            }

            /* Task Cards - Design moderne minimaliste */
            .task-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 24px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
            }

            .task-card:hover {
                background: #f8fafc;
                transform: translateY(-1px);
            }

            .task-card:last-child {
                border-bottom: none;
                border-radius: 0 0 16px 16px;
            }

            .task-card.completed {
                opacity: 0.6;
            }

            .task-card.completed .task-title {
                text-decoration: line-through;
            }

            .task-left {
                display: flex;
                align-items: center;
                gap: 16px;
                flex: 1;
                min-width: 0;
            }

            .priority-indicator {
                width: 4px;
                height: 48px;
                border-radius: 2px;
                flex-shrink: 0;
            }

            .task-content {
                flex: 1;
                min-width: 0;
            }

            .task-header {
                margin-bottom: 6px;
            }

            .task-title {
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0 0 4px 0;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .task-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #6b7280;
            }

            .client-name {
                font-weight: 600;
                color: #374151;
            }

            .separator {
                color: #d1d5db;
                font-weight: bold;
            }

            .company-domain {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
                color: #6b7280;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                border: 1px solid #e5e7eb;
            }

            .sender-info {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #6b7280;
                margin-top: 4px;
            }

            .ai-badge {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 600;
                animation: aiGlow 2s infinite alternate;
            }

            @keyframes aiGlow {
                0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
                100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); }
            }

            .task-right {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-shrink: 0;
            }

            .task-badges {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 6px;
            }

            .type-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                color: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }

            .type-badge.email { 
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }
            .type-badge.meeting { 
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .type-badge.call { 
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            .type-badge.task { 
                background: linear-gradient(135deg, #6b7280, #4b5563);
            }

            .reply-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 3px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
                animation: replyPulse 2s infinite;
            }

            @keyframes replyPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .due-badge {
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid;
            }

            .due-badge.overdue {
                background: linear-gradient(135deg, #fef2f2, #fee2e2);
                color: #dc2626;
                border-color: #fecaca;
                animation: urgentBlink 1s infinite;
            }

            @keyframes urgentBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .due-badge.today {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                color: #d97706;
                border-color: #fde68a;
            }

            .due-badge.tomorrow {
                background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                color: #059669;
                border-color: #a7f3d0;
            }

            .due-badge.soon {
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
                color: #2563eb;
                border-color: #bfdbfe;
            }

            .task-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-badge {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 2px solid;
                background: white;
                transition: all 0.2s ease;
            }

            .status-badge.todo {
                color: #d97706;
                border-color: #fde68a;
                background: linear-gradient(135deg, #fef3c7, #fde68a);
            }

            .status-badge.in-progress {
                color: #2563eb;
                border-color: #bfdbfe;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
            }

            .status-badge.completed {
                color: #059669;
                border-color: #a7f3d0;
                background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            }

            .action-btn {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s ease;
                border: 2px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            }

            .quick-complete {
                border-color: #a7f3d0;
                background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                color: #059669;
            }

            .quick-complete:hover {
                background: linear-gradient(135deg, #059669, #047857);
                color: white;
                border-color: #059669;
            }

            .reply-btn {
                border-color: #bfdbfe;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
                color: #2563eb;
            }

            .reply-btn:hover {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                border-color: #2563eb;
            }

            /* List View */
            .list-view .task-card {
                border-radius: 12px;
                margin-bottom: 8px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .list-view .task-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 32px;
                color: #6b7280;
                background: white;
                border-radius: 16px;
                margin: 0 auto;
                max-width: 500px;
            }

            .empty-icon {
                font-size: 64px;
                margin-bottom: 24px;
                opacity: 0.6;
            }

            .empty-state h3 {
                font-size: 24px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 12px;
            }

            .empty-state p {
                font-size: 16px;
                margin-bottom: 32px;
                line-height: 1.5;
            }

            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.75);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .task-details-modal,
            .create-task-modal,
            .edit-task-modal,
            .reply-suggestions-modal {
                background: white;
                border-radius: 20px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                border: 1px solid #e5e7eb;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 32px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            }

            .modal-header h2 {
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0;
            }

            .close-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: #f3f4f6;
                border-radius: 10px;
                cursor: pointer;
                font-size: 18px;
                color: #6b7280;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: #e5e7eb;
                color: #374151;
                transform: scale(1.05);
            }

            .modal-content {
                padding: 32px;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
                background: #f8fafc;
                padding: 24px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .detail-item label {
                font-size: 12px;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .detail-item span {
                font-size: 15px;
                color: #1a1a1a;
                font-weight: 600;
            }

            .priority-urgent { color: #ef4444; }
            .priority-high { color: #f97316; }
            .priority-medium { color: #eab308; }
            .priority-low { color: #22c55e; }

            .status-todo { color: #d97706; }
            .status-in-progress { color: #2563eb; }
            .status-completed { color: #059669; }

            .detail-section {
                margin-bottom: 32px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                overflow: hidden;
            }

            .detail-section h3 {
                font-size: 18px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0;
                padding: 20px 24px;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .description-content {
                padding: 24px;
            }

            .structured-description {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                color: #374151;
            }

            .simple-description {
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
            }

            .actions-list {
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .action-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                transition: all 0.2s ease;
            }

            .action-item:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
            }

            .action-number {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 700;
                flex-shrink: 0;
                box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
            }

            .action-text {
                flex: 1;
                font-size: 15px;
                color: #374151;
                font-weight: 500;
            }

            .action-deadline {
                font-size: 12px;
                color: #dc2626;
                font-weight: 600;
                background: #fef2f2;
                padding: 4px 8px;
                border-radius: 6px;
                border: 1px solid #fecaca;
            }

            .info-list,
            .risks-list {
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .info-item,
            .risk-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                font-size: 15px;
                color: #374151;
                line-height: 1.5;
                padding: 12px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }

            .info-icon {
                color: #3b82f6;
                font-size: 12px;
                margin-top: 2px;
            }

            .risk-item {
                background: #fef9e8;
                border-color: #fde68a;
            }

            .risk-icon {
                font-size: 14px;
                margin-top: 1px;
            }

            .risks-section {
                background: #fef9e8;
                border-color: #fde68a;
            }

            .risks-section h3 {
                background: #fef3c7;
                border-bottom-color: #fde68a;
                color: #92400e;
            }

            .email-section {
                background: #eff6ff;
                border-color: #bfdbfe;
            }

            .email-section h3 {
                background: #dbeafe;
                border-bottom-color: #bfdbfe;
                color: #1e40af;
            }

            .email-info {
                padding: 24px;
            }

            .email-info p {
                margin: 0 0 12px 0;
                font-size: 15px;
                line-height: 1.5;
            }

            .needs-reply {
                color: #f59e0b;
                font-weight: 600;
                font-size: 14px;
                background: #fef3c7;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #fde68a;
                display: inline-block;
            }

            .replied {
                color: #059669;
                font-weight: 600;
                font-size: 14px;
                background: #ecfdf5;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #a7f3d0;
                display: inline-block;
            }

            .email-content-tabs {
                display: flex;
                gap: 4px;
                margin-bottom: 16px;
                background: #f3f4f6;
                padding: 4px;
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
                color: #1a1a1a;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .email-content-box {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                padding: 20px;
                max-height: 400px;
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

            .email-header {
                background: #f8fafc;
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                margin-bottom: 16px;
                font-size: 14px;
            }

            .email-body {
                font-size: 14px;
                line-height: 1.6;
            }

            .email-original-content {
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
                white-space: pre-wrap;
            }

            /* Suggestions de réponse IA */
            .suggestions-section {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border-color: #7dd3fc;
            }

            .suggestions-section h3 {
                background: #f0f9ff;
                border-bottom-color: #7dd3fc;
                color: #075985;
            }

            .suggestions-container,
            .suggestions-list {
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .suggestion-card {
                background: white;
                border: 1px solid #bae6fd;
                border-radius: 12px;
                padding: 20px;
                transition: all 0.2s ease;
            }

            .suggestion-card:hover {
                border-color: #7dd3fc;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
            }

            .suggestion-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .suggestion-tone {
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
            }

            .suggestion-tone.formel {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .suggestion-tone.urgent {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .suggestion-tone.neutre {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
            }

            .suggestion-tone.détaillé {
                background: #f0fdf4;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            }

            .suggestion-tone.professionnel {
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fde68a;
            }

            .suggestion-actions {
                display: flex;
                gap: 8px;
            }

            .copy-btn,
            .use-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid;
            }

            .copy-btn {
                background: #f3f4f6;
                color: #374151;
                border-color: #d1d5db;
            }

            .copy-btn:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }

            .use-btn {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .use-btn:hover {
                background: #2563eb;
                border-color: #2563eb;
            }

            .suggestion-subject {
                font-size: 14px;
                color: #4b5563;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }

            .suggestion-content {
                font-size: 13px;
                color: #374151;
                line-height: 1.6;
                white-space: pre-wrap;
                background: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                margin-bottom: 12px;
            }

            .ai-info {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border: 1px solid #7dd3fc;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }

            .ai-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 12px;
                box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
            }

            .ai-info p {
                margin: 0;
                color: #075985;
                font-size: 14px;
                line-height: 1.5;
            }

            .tags-list {
                padding: 24px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .tag {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 500;
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
            }

            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 24px 32px;
                border-top: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            }

            /* Form Styles */
            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }

            .form-input,
            .form-select,
            .form-textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                background: white;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .form-input:focus,
            .form-select:focus,
            .form-textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

            /* Loading State */
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 80px 32px;
                color: #6b7280;
                background: white;
                border-radius: 16px;
                margin: 0 auto;
                max-width: 400px;
            }

            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Toast Notifications */
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                z-index: 100000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }

            .toast.show {
                transform: translateY(0);
                opacity: 1;
            }

            .toast-success { 
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .toast-error { 
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            .toast-info { 
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }

            /* Responsive Design */
            @media (max-width: 1024px) {
                .header-container {
                    padding: 0 16px;
                }
                
                .tasks-container {
                    padding: 0 16px;
                }
                
                .filters-container {
                    padding: 0 16px;
                }
            }

            @media (max-width: 768px) {
                .tasks-header {
                    padding: 16px;
                }
                
                .header-container {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                }

                .header-left {
                    justify-content: center;
                    min-width: auto;
                }

                .header-center {
                    margin: 0;
                    max-width: none;
                }

                .header-right {
                    justify-content: center;
                    min-width: auto;
                }

                .page-title {
                    font-size: 28px;
                }

                .view-toggle {
                    justify-content: center;
                }

                .filters-container {
                    flex-wrap: wrap;
                    justify-content: center;
                    padding: 0 16px;
                    gap: 8px;
                }

                .status-filter {
                    padding: 10px 16px;
                    font-size: 13px;
                }

                .filter-name {
                    display: none;
                }

                .advanced-filters.show {
                    padding: 16px;
                }

                .filters-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .task-card {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                }

                .task-left {
                    width: 100%;
                }

                .task-right {
                    width: 100%;
                    justify-content: space-between;
                }

                .task-title {
                    white-space: normal;
                    line-height: 1.4;
                }

                .detail-grid {
                    grid-template-columns: 1fr;
                    padding: 16px;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .modal-content {
                    padding: 20px;
                }

                .modal-header {
                    padding: 16px 20px;
                }

                .modal-actions {
                    padding: 16px 20px;
                    flex-direction: column;
                    gap: 8px;
                }

                .task-details-modal,
                .create-task-modal,
                .edit-task-modal,
                .reply-suggestions-modal {
                    margin: 10px;
                    border-radius: 16px;
                }
            }

            @media (max-width: 480px) {
                .page-title {
                    font-size: 24px;
                }

                .search-input {
                    font-size: 16px; /* Prevent zoom on iOS */
                }

                .task-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }

                .separator {
                    display: none;
                }

                .toast {
                    left: 16px;
                    right: 16px;
                    bottom: 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================================
// GLOBAL INITIALIZATION GARANTIE + INTÉGRATION PAGEMANAGER
// =====================================
function initializeModernTaskManager() {
    console.log('[TaskManager] Initializing modern interface v9.1 with all features...');
    
    if (!window.taskManager || !window.taskManager.initialized) {
        window.taskManager = new TaskManager();
    }
    
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
    
    // INTÉGRATION FORCÉE AVEC PAGEMANAGER
    if (window.pageManager && typeof window.pageManager.registerPageRenderer === 'function') {
        console.log('[TaskManager] Registering with PageManager...');
        
        window.pageManager.registerPageRenderer('tasks', (container) => {
            console.log('[TaskManager] PageManager requested tasks page render');
            if (window.tasksView && container) {
                window.tasksView.render(container);
            } else {
                console.error('[TaskManager] TasksView or container not available');
            }
        });
        
        console.log('[TaskManager] ✅ Registered with PageManager');
    } else {
        console.warn('[TaskManager] PageManager not available for registration');
    }
    
    // FALLBACK: Vérifier si on est sur la page tasks et forcer le rendu
    setTimeout(() => {
        const currentPage = window.location.hash || '#dashboard';
        if (currentPage.includes('tasks')) {
            console.log('[TaskManager] On tasks page, forcing render...');
            const container = document.querySelector('.content-area') || 
                            document.querySelector('#content') || 
                            document.querySelector('main');
            if (container && window.tasksView) {
                window.tasksView.render(container);
            }
        }
    }, 2000);
    
    console.log('✅ TaskManager v9.1 - Interface moderne avec TOUTES les fonctionnalités chargé');
}

// MÉTHODE GLOBALE POUR FORCER LE RENDU
window.renderTasksPage = function(container) {
    console.log('[TaskManager] Global renderTasksPage called');
    if (!window.tasksView) {
        initializeModernTaskManager();
    }
    if (window.tasksView && container) {
        window.tasksView.render(container);
    } else {
        console.error('[TaskManager] Cannot render - tasksView or container missing');
    }
};

// ÉCOUTER LES CHANGEMENTS DE HASH POUR FORCER LE RENDU SUR LA PAGE TASKS
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    console.log('[TaskManager] Hash changed to:', hash);
    
    if (hash.includes('tasks')) {
        setTimeout(() => {
            console.log('[TaskManager] Navigated to tasks, forcing render...');
            const container = document.querySelector('.content-area') || 
                            document.querySelector('#content') || 
                            document.querySelector('main') ||
                            document.querySelector('.page-content');
            
            if (container) {
                console.log('[TaskManager] Found container, rendering tasks...');
                if (!window.tasksView) {
                    initializeModernTaskManager();
                }
                if (window.tasksView) {
                    window.tasksView.render(container);
                }
            } else {
                console.error('[TaskManager] No container found for tasks page');
            }
        }, 500);
    }
});

// Initialisation immédiate ET sur DOMContentLoaded avec vérifications
initializeModernTaskManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[TaskManager] DOM ready, ensuring initialization...');
    initializeModernTaskManager();
    
    // Vérifier si on est déjà sur la page tasks
    setTimeout(() => {
        const hash = window.location.hash;
        if (hash.includes('tasks')) {
            console.log('[TaskManager] Already on tasks page, forcing render...');
            window.renderTasksPage(
                document.querySelector('.content-area') || 
                document.querySelector('#content') || 
                document.querySelector('main')
            );
        }
    }, 1000);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('[TaskManager] Window loaded, final initialization check...');
        if (!window.taskManager || !window.taskManager.initialized) {
            initializeModernTaskManager();
        }
        
        // Debug: Vérifier l'état des tâches
        if (window.taskManager && window.taskManager.initialized) {
            const stats = window.taskManager.getStats();
            console.log('[TaskManager] Current stats:', stats);
            
            // Si on est sur la page tasks, forcer le rendu
            if (window.location.hash.includes('tasks')) {
                const container = document.querySelector('.content-area') || 
                               document.querySelector('#content') || 
                               document.querySelector('main');
                if (container && window.tasksView) {
                    console.log('[TaskManager] Final render attempt...');
                    window.tasksView.render(container);
                }
            }
        }
    }, 2000);
});
