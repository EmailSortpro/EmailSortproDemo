// TaskManager Pro v9.2 - Module Indépendant et Auto-suffisant
// Se charge automatiquement et s'intègre parfaitement

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
            console.log('[TaskManager] Initializing v9.2 - Module indépendant...');
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
            },
            {
                id: 'task_4',
                title: 'Analyse budget Q3',
                description: 'Finaliser l\'analyse du budget Q3 avec les nouvelles directives.',
                client: 'Finance Corp',
                company: 'financecorp.com',
                priority: 'medium',
                status: 'completed',
                category: 'finance',
                type: 'task',
                dueDate: '2025-06-05',
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                hasEmail: false,
                needsReply: false,
                completedAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
    }

    // Méthodes principales identiques mais simplifiées pour l'indépendance
    async createTaskFromEmail(taskData, email = null) {
        console.log('[TaskManager] Creating task from email:', taskData.title);
        
        const taskId = taskData.id || this.generateId();
        const fullEmailContent = this.extractFullEmailContent(email, taskData);
        const htmlEmailContent = this.extractHtmlEmailContent(email, taskData);
        
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
            summary: taskData.summary || '',
            actions: taskData.actions || [],
            keyInfo: taskData.keyInfo || [],
            risks: taskData.risks || [],
            tags: taskData.tags || [],
            suggestedReplies: taskData.suggestedReplies || [],
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            method: taskData.method || 'ai'
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        return task;
    }

    createTask(taskData) {
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            client: taskData.client || 'Client',
            company: taskData.company || 'company.com',
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

    // Méthodes utilitaires
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

    extractFullEmailContent(email, taskData) {
        if (taskData.emailContent && taskData.emailContent.length > 50) {
            return taskData.emailContent;
        }
        
        if (email?.body?.content) {
            return email.body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        
        return `Email de: ${taskData.emailFromName || 'Inconnu'}
Sujet: ${taskData.emailSubject || 'Sans sujet'}

${taskData.summary || 'Contenu de l\'email...'}`;
    }

    extractHtmlEmailContent(email, taskData) {
        if (taskData.emailHtmlContent && taskData.emailHtmlContent.length > 50) {
            return taskData.emailHtmlContent;
        }
        
        if (email?.body?.contentType === 'html' && email?.body?.content) {
            return email.body.content;
        }
        
        const textContent = this.extractFullEmailContent(email, taskData);
        return `<div class="email-content-viewer">${textContent.replace(/\n/g, '<br>')}</div>`;
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
// MODERN TASKS VIEW - INDÉPENDANTE
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

    // MÉTHODE RENDER ADAPTÉE AU SYSTÈME EXISTANT
    render(container) {
        if (!container) {
            console.error('[TasksView] No container provided');
            return;
        }

        console.log('[TasksView] Rendering tasks interface in container:', container);

        // Force l'initialisation si nécessaire
        if (!window.taskManager || !window.taskManager.initialized) {
            console.log('[TasksView] TaskManager not ready, forcing initialization...');
            
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Initialisation du gestionnaire de tâches...</p>
                </div>
            `;
            
            // Forcer l'initialisation
            if (!window.taskManager) {
                window.taskManager = new TaskManager();
            }
            
            // Retry après initialisation
            const checkAndRender = () => {
                if (window.taskManager && window.taskManager.initialized) {
                    console.log('[TasksView] TaskManager ready, rendering...');
                    this.render(container);
                } else {
                    setTimeout(checkAndRender, 200);
                }
            };
            
            setTimeout(checkAndRender, 500);
            return;
        }

        const stats = window.taskManager.getStats();
        console.log('[TasksView] Current stats:', stats);
        
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
        console.log('[TasksView] ✅ Modern interface rendered successfully');
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

    // Event handlers principaux
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

    replyToEmail(taskId) {
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

    showTaskDetails(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;

        console.log('[TasksView] Showing task details for:', task.title);
        alert(`Détails de la tâche: ${task.title}\n\nClient: ${task.client}\nSociété: ${task.company}\nPriorité: ${task.priority}\nStatut: ${task.status}`);
    }

    showCreateModal() {
        const title = prompt('Titre de la nouvelle tâche:');
        if (!title) return;
        
        const client = prompt('Client:') || 'Client';
        const company = prompt('Société:') || 'company.com';
        
        const taskData = {
            title,
            client,
            company,
            priority: 'medium',
            type: 'task'
        };

        window.taskManager.createTask(taskData);
        this.showToast('Tâche créée avec succès', 'success');
    }

    refreshView() {
        const container = document.querySelector('.modern-tasks-app');
        if (container && container.parentElement) {
            console.log('[TasksView] Refreshing view...');
            this.render(container.parentElement);
        }
    }

    setupEventListeners() {
        // Event listeners handled via onclick for simplicity
    }

    showToast(message, type = 'info') {
        console.log(`[TasksView] Toast: ${message} (${type})`);
        
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 100000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

    getStatusIcon(status) {
        const icons = {
            todo: '⏳',
            'in-progress': '🔄',
            completed: '✅'
        };
        return icons[status] || icons.todo;
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addModernStyles() {
        if (document.getElementById('modernTaskStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernTaskStyles';
        styles.textContent = `
            /* TaskManager Styles - Compact but complete */
            .modern-tasks-app {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #fafbfc;
                min-height: 100vh;
                color: #1a1a1a;
                padding: 0;
                margin: 0;
            }

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

            .tasks-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 32px;
            }

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

            .list-view .task-card {
                border-radius: 12px;
                margin-bottom: 8px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .list-view .task-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

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
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
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

            /* Responsive */
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

                .task-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }

                .separator {
                    display: none;
                }

                .tasks-container {
                    padding: 0 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================================
// AUTO-REGISTRATION ET INTÉGRATION SYSTÈME
// =====================================

// Fonction d'initialisation globale auto-suffisante
function initializeTaskManagerModule() {
    console.log('[TaskManager] Auto-initializing independent module v9.2...');
    
    // Créer les instances globales
    if (!window.taskManager) {
        window.taskManager = new TaskManager();
    }
    
    if (!window.tasksView) {
        window.tasksView = new TasksView();
    }
    
    // Bind toutes les méthodes
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
    
    // AUTO-REGISTRATION avec PageManager (si disponible)
    const registerWithPageManager = () => {
        if (window.pageManager) {
            console.log('[TaskManager] PageManager detected, attempting auto-registration...');
            
            try {
                // Méthode 1: Essayer registerPageRenderer
                if (typeof window.pageManager.registerPageRenderer === 'function') {
                    window.pageManager.registerPageRenderer('tasks', (container) => {
                        console.log('[TaskManager] PageManager rendering tasks page');
                        if (window.tasksView && container) {
                            window.tasksView.render(container);
                        }
                    });
                    console.log('[TaskManager] ✅ Registered via registerPageRenderer');
                    return true;
                }
                
                // Méthode 2: Injection directe si pageRenderers existe
                if (window.pageManager.pageRenderers && typeof window.pageManager.pageRenderers === 'object') {
                    window.pageManager.pageRenderers.tasks = (container) => {
                        console.log('[TaskManager] Direct pageRenderers method called');
                        if (window.tasksView && container) {
                            window.tasksView.render(container);
                        }
                    };
                    console.log('[TaskManager] ✅ Registered via direct pageRenderers injection');
                    return true;
                }
                
                // Méthode 3: Override loadPage
                if (window.pageManager.loadPage && !window.pageManager._taskManagerOverride) {
                    const originalLoadPage = window.pageManager.loadPage.bind(window.pageManager);
                    window.pageManager._taskManagerOverride = true;
                    
                    window.pageManager.loadPage = function(pageName) {
                        if (pageName === 'tasks') {
                            console.log('[TaskManager] Intercepted loadPage for tasks');
                            
                            // Chercher le container
                            const selectors = ['.content-area', '#content', '.page-content', 'main'];
                            let container = null;
                            
                            for (const selector of selectors) {
                                container = document.querySelector(selector);
                                if (container) break;
                            }
                            
                            if (container && window.tasksView) {
                                container.innerHTML = '';
                                window.tasksView.render(container);
                                
                                // Simuler le succès
                                if (window.uiManager && window.uiManager.hideLoading) {
                                    setTimeout(() => window.uiManager.hideLoading(), 100);
                                }
                                
                                return Promise.resolve();
                            }
                        }
                        
                        return originalLoadPage(pageName);
                    };
                    
                    console.log('[TaskManager] ✅ Registered via loadPage override');
                    return true;
                }
                
            } catch (error) {
                console.warn('[TaskManager] PageManager registration failed:', error);
            }
        }
        
        return false;
    };
    
    // Essayer l'enregistrement immédiatement
    if (!registerWithPageManager()) {
        console.log('[TaskManager] PageManager not ready, setting up watcher...');
        
        // Watcher pour détecter quand PageManager devient disponible
        const checkPageManager = setInterval(() => {
            if (registerWithPageManager()) {
                clearInterval(checkPageManager);
            }
        }, 500);
        
        // Arrêter le watcher après 10 secondes
        setTimeout(() => {
            clearInterval(checkPageManager);
            console.log('[TaskManager] PageManager watcher stopped');
        }, 10000);
    }
    
    console.log('✅ TaskManager v9.2 - Module indépendant et auto-suffisant chargé');
}

// MÉTHODES GLOBALES D'ACCÈS DIRECT
window.renderTasksPage = function(container) {
    console.log('[TaskManager] Global renderTasksPage called');
    
    if (!window.tasksView) {
        initializeTaskManagerModule();
        setTimeout(() => {
            if (window.tasksView && container) {
                window.tasksView.render(container);
            }
        }, 200);
    } else if (container) {
        window.tasksView.render(container);
    }
};

window.showTasksPage = function() {
    console.log('[TaskManager] Global showTasksPage called');
    
    const selectors = ['.content-area', '#content', '.page-content', 'main', '.container'];
    let container = null;
    
    for (const selector of selectors) {
        container = document.querySelector(selector);
        if (container) {
            console.log('[TaskManager] Found container:', selector);
            break;
        }
    }
    
    if (container) {
        window.renderTasksPage(container);
    } else {
        console.error('[TaskManager] No suitable container found');
    }
};

// DÉTECTION AUTOMATIQUE DE NAVIGATION
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash.includes('tasks')) {
        setTimeout(() => {
            console.log('[TaskManager] Hash change detected, showing tasks...');
            window.showTasksPage();
        }, 300);
    }
});

// DÉTECTION DE CHANGEMENTS DE PAGE VIA MUTATION OBSERVER
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        if (window.location.hash.includes('tasks')) {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const container = node.querySelector && (
                                node.querySelector('.content-area') ||
                                node.querySelector('#content') ||
                                node.querySelector('.page-content')
                            ) || (
                                (node.classList && (
                                    node.classList.contains('content-area') ||
                                    node.classList.contains('page-content') ||
                                    node.id === 'content'
                                )) ? node : null
                            );
                            
                            if (container && window.tasksView) {
                                console.log('[TaskManager] Container detected via MutationObserver');
                                setTimeout(() => window.tasksView.render(container), 100);
                            }
                        }
                    }
                }
            });
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// INITIALISATION AUTOMATIQUE À DIFFÉRENTS MOMENTS
console.log('[TaskManager] Setting up auto-initialization...');

// Immédiat
initializeTaskManagerModule();

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[TaskManager] DOM ready, re-initializing...');
        initializeTaskManagerModule();
        
        // Vérifier si on est déjà sur tasks
        if (window.location.hash.includes('tasks')) {
            setTimeout(() => window.showTasksPage(), 500);
        }
    });
} else {
    console.log('[TaskManager] DOM already ready');
    if (window.location.hash.includes('tasks')) {
        setTimeout(() => window.showTasksPage(), 200);
    }
}

// Window Load
window.addEventListener('load', () => {
    console.log('[TaskManager] Window loaded, final check...');
    
    if (!window.taskManager || !window.taskManager.initialized) {
        initializeTaskManagerModule();
    }
    
    // Si on est sur tasks, forcer l'affichage
    if (window.location.hash.includes('tasks')) {
        setTimeout(() => {
            console.log('[TaskManager] On tasks page after load, forcing display...');
            window.showTasksPage();
        }, 1000);
    }
});

console.log('🚀 TaskManager v9.2 - Module indépendant et auto-suffisant initialisé');
