// TaskManager Pro v12.0 - Version optimisée avec intégration Outlook

class TaskManager {
    constructor() {
        this.tasks = [];
        this.initialized = false;
        this.selectedTasks = new Set();
        this.init();
    }

    async init() {
        try {
            console.log('[TaskManager] Initializing v12.0...');
            await this.loadTasks();
            this.initialized = true;
            console.log('[TaskManager] Initialized with', this.tasks.length, 'tasks');
        } catch (error) {
            console.error('[TaskManager] Init error:', error);
            this.tasks = [];
            this.initialized = true;
        }
    }

    async loadTasks() {
        try {
            const saved = localStorage.getItem('emailsort_tasks');
            if (saved) {
                this.tasks = JSON.parse(saved).map(task => this.ensureTaskProperties(task));
                console.log(`[TaskManager] Loaded ${this.tasks.length} tasks`);
            } else {
                console.log('[TaskManager] Creating sample tasks');
                this.generateSampleTasks();
            }
        } catch (error) {
            console.error('[TaskManager] Load error:', error);
            this.tasks = [];
        }
    }

    ensureTaskProperties(task) {
        return {
            id: task.id || this.generateId(),
            title: task.title || 'Tâche sans titre',
            description: task.description || '',
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            dueDate: task.dueDate || null,
            category: task.category || 'other',
            client: task.client || 'Interne',
            tags: Array.isArray(task.tags) ? task.tags : [],
            hasEmail: task.hasEmail || false,
            emailId: task.emailId || null,
            emailFrom: task.emailFrom || null,
            emailFromName: task.emailFromName || null,
            emailSubject: task.emailSubject || null,
            emailContent: task.emailContent || '',
            emailHtmlContent: task.emailHtmlContent || '',
            emailDomain: task.emailDomain || null,
            emailDate: task.emailDate || null,
            emailReplied: task.emailReplied || false,
            needsReply: task.needsReply || false,
            hasAttachments: task.hasAttachments || false,
            summary: task.summary || '',
            actions: Array.isArray(task.actions) ? task.actions : [],
            keyInfo: Array.isArray(task.keyInfo) ? task.keyInfo : [],
            risks: Array.isArray(task.risks) ? task.risks : [],
            // SUPPRIMÉ: suggestedReplies, aiRepliesGenerated, aiRepliesGeneratedAt, aiAnalysis
            checklist: Array.isArray(task.checklist) ? task.checklist : [],
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || new Date().toISOString(),
            completedAt: task.completedAt || null,
            method: task.method || 'manual'
        };
    }

    generateSampleTasks() {
        const samples = [
            {
                id: 'sample_1',
                title: 'Répondre à l\'équipe marketing sur la campagne Q2',
                description: 'Email de Sarah Martin concernant la validation de la campagne marketing Q2.\nBudget proposé : 50k€\nCible : 25-45 ans\nCanaux : LinkedIn, Google Ads',
                priority: 'high',
                status: 'todo',
                category: 'email',
                hasEmail: true,
                emailFrom: 'sarah.martin@acme-corp.com',
                emailFromName: 'Sarah Martin',
                emailSubject: 'Validation campagne marketing Q2',
                emailDate: '2025-06-06T09:15:00Z',
                emailDomain: 'acme-corp.com',
                client: 'ACME Corp',
                dueDate: '2025-06-20',
                needsReply: true,
                checklist: [
                    { id: 'cl1', text: 'Analyser les visuels proposés', completed: false },
                    { id: 'cl2', text: 'Vérifier le budget disponible', completed: true },
                    { id: 'cl3', text: 'Valider avec la direction', completed: false }
                ]
            },
            {
                id: 'sample_2',
                title: 'Préparer présentation trimestrielle',
                description: 'Préparer la présentation des résultats Q1 pour le comité de direction',
                priority: 'medium',
                status: 'in-progress',
                category: 'work',
                client: 'Direction',
                dueDate: '2025-06-25',
                checklist: [
                    { id: 'cl4', text: 'Rassembler données Q1', completed: true },
                    { id: 'cl5', text: 'Créer slides PowerPoint', completed: false },
                    { id: 'cl6', text: 'Préparer discours', completed: false }
                ]
            },
            {
                id: 'sample_3',
                title: 'Répondre à Jean Dupont - Devis urgent',
                description: 'Jean Dupont demande un devis pour un projet de refonte website',
                priority: 'urgent',
                status: 'relance',
                category: 'email',
                hasEmail: true,
                emailFrom: 'jean.dupont@example.com',
                emailFromName: 'Jean Dupont',
                emailSubject: 'Demande de devis - Refonte site web',
                emailDate: '2025-06-15T14:30:00Z',
                emailDomain: 'example.com',
                client: 'Jean Dupont',
                dueDate: '2025-06-17',
                needsReply: true,
                checklist: [
                    { id: 'cl7', text: 'Évaluer complexité du projet', completed: true },
                    { id: 'cl8', text: 'Chiffrer les coûts', completed: false },
                    { id: 'cl9', text: 'Envoyer devis détaillé', completed: false }
                ]
            }
        ];
        
        this.tasks = samples.map(task => this.ensureTaskProperties(task));
        this.saveTasks();
    }

    // CRUD Methods
    createTask(taskData) {
        const task = this.ensureTaskProperties({
            ...taskData,
            id: taskData.id || this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitUpdate('create', task);
        return task;
    }

    createTaskFromEmail(taskData, email = null) {
        const emailInfo = this.extractEmailInfo(email, taskData);
        
        const task = this.ensureTaskProperties({
            ...taskData,
            id: taskData.id || this.generateId(),
            hasEmail: true,
            emailContent: this.extractEmailContent(email, taskData),
            emailHtmlContent: this.extractHtmlContent(email, taskData),
            ...emailInfo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitUpdate('create', task);
        return task;
    }

    extractEmailInfo(email, taskData) {
        const info = {
            client: null,
            emailFrom: null,
            emailFromName: null,
            emailDomain: null,
            emailSubject: null,
            emailDate: null
        };

        if (email) {
            info.emailFrom = email.from?.emailAddress?.address || email.from?.address || null;
            info.emailFromName = email.from?.emailAddress?.name || email.from?.name || null;
            info.emailSubject = email.subject || null;
            info.emailDate = email.receivedDateTime || null;
            info.emailDomain = info.emailFrom?.split('@')[1] || null;
        }

        // Fallback to taskData
        Object.keys(info).forEach(key => {
            if (!info[key] && taskData[key]) {
                info[key] = taskData[key];
            }
        });

        // Determine client
        if (info.emailFromName && info.emailFromName !== info.emailFrom) {
            info.client = info.emailFromName;
        } else if (info.emailDomain) {
            info.client = this.formatDomain(info.emailDomain);
        } else {
            info.client = taskData.client || 'Externe';
        }

        return info;
    }

    formatDomain(domain) {
        if (!domain) return 'Externe';
        const clean = domain.replace(/^(www\.|mail\.|smtp\.|mx\.)/, '');
        const name = clean.split('.')[0];
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        this.tasks[index] = this.ensureTaskProperties({
            ...this.tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        });
        
        if (updates.status === 'completed' && !this.tasks[index].completedAt) {
            this.tasks[index].completedAt = new Date().toISOString();
        }
        
        this.saveTasks();
        this.emitUpdate('update', this.tasks[index]);
        return this.tasks[index];
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        const deleted = this.tasks.splice(index, 1)[0];
        this.saveTasks();
        this.emitUpdate('delete', deleted);
        return deleted;
    }

    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    // Filtering & Sorting
    filterTasks(filters = {}) {
        let filtered = [...this.tasks];
        
        const filterMap = {
            status: t => filters.status === 'all' || t.status === filters.status,
            priority: t => filters.priority === 'all' || t.priority === filters.priority,
            category: t => filters.category === 'all' || t.category === filters.category,
            client: t => filters.client === 'all' || t.client === filters.client,
            search: t => {
                const s = filters.search.toLowerCase();
                return !s || t.title.toLowerCase().includes(s) || 
                       t.description.toLowerCase().includes(s) ||
                       (t.emailFromName && t.emailFromName.toLowerCase().includes(s)) ||
                       (t.client && t.client.toLowerCase().includes(s));
            },
            overdue: t => !filters.overdue || (t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date()),
            needsReply: t => !filters.needsReply || (t.needsReply || (t.hasEmail && !t.emailReplied && t.status !== 'completed'))
        };
        
        Object.keys(filterMap).forEach(key => {
            if (filters[key] !== undefined) {
                filtered = filtered.filter(filterMap[key]);
            }
        });
        
        return this.sortTasks(filtered, filters.sortBy || 'created');
    }

    sortTasks(tasks, sortBy) {
        const sortFns = {
            priority: (a, b) => {
                const order = { urgent: 0, high: 1, medium: 2, low: 3 };
                return order[a.priority] - order[b.priority];
            },
            dueDate: (a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            },
            title: (a, b) => a.title.localeCompare(b.title),
            client: (a, b) => a.client.localeCompare(b.client),
            updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
            created: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        };
        
        return [...tasks].sort(sortFns[sortBy] || sortFns.created);
    }

    getAllClients() {
        const clients = new Set();
        this.tasks.forEach(task => {
            if (task.client && task.client.trim() && task.client !== 'Interne') {
                clients.add(task.client.trim());
            }
        });
        
        // Sync with EmailScanner if available
        if (window.emailScanner?.getAllEmails) {
            window.emailScanner.getAllEmails().forEach(email => {
                if (email.from?.emailAddress?.address) {
                    const name = email.from.emailAddress.name;
                    const domain = email.from.emailAddress.address.split('@')[1];
                    const client = name && name.trim() && name !== email.from.emailAddress.address 
                        ? name.trim() 
                        : this.formatDomain(domain);
                    clients.add(client);
                }
            });
        }
        
        return ['Interne', ...Array.from(clients).sort()];
    }

    getStats() {
        const byStatus = {};
        ['todo', 'in-progress', 'relance', 'bloque', 'reporte', 'completed'].forEach(status => {
            byStatus[status] = this.tasks.filter(t => t.status === status).length;
        });

        return {
            total: this.tasks.length,
            byStatus,
            ...byStatus,
            overdue: this.tasks.filter(t => 
                t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date()
            ).length,
            needsReply: this.tasks.filter(t => 
                t.needsReply || (t.hasEmail && !t.emailReplied && t.status !== 'completed')
            ).length
        };
    }

    // Utilities
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractEmailContent(email, taskData) {
        if (taskData.emailContent?.length > 50) return taskData.emailContent;
        if (email?.body?.content) return this.cleanContent(email.body.content);
        if (email?.bodyPreview) return email.bodyPreview;
        return taskData.emailContent || '';
    }

    extractHtmlContent(email, taskData) {
        if (taskData.emailHtmlContent?.length > 50) return taskData.emailHtmlContent;
        if (email?.body?.contentType === 'html' && email?.body?.content) {
            return this.cleanHtml(email.body.content);
        }
        return this.convertToHtml(this.extractEmailContent(email, taskData), email);
    }

    cleanContent(content) {
        if (!content) return '';
        return content
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }

    cleanHtml(html) {
        if (!html) return '';
        return `<div class="email-content-viewer">${
            html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .replace(/javascript:/gi, '')
        }</div>`;
    }

    convertToHtml(text, email) {
        if (!text) return '';
        const info = {
            name: email?.from?.emailAddress?.name || 'Expéditeur',
            email: email?.from?.emailAddress?.address || '',
            subject: email?.subject || 'Sans sujet',
            date: email?.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString('fr-FR') : ''
        };
        
        const content = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        return `<div class="email-content-viewer">
            <div class="email-header-info">
                <div><strong>De:</strong> ${info.name} &lt;${info.email}&gt;</div>
                <div><strong>Date:</strong> ${info.date}</div>
                <div><strong>Sujet:</strong> ${info.subject}</div>
            </div>
            <div class="email-body">${content}</div>
        </div>`;
    }

    saveTasks() {
        try {
            localStorage.setItem('emailsort_tasks', JSON.stringify(this.tasks));
            return true;
        } catch (error) {
            console.error('[TaskManager] Save error:', error);
            return false;
        }
    }

    emitUpdate(action, task) {
        window.dispatchEvent(new CustomEvent('taskUpdate', { detail: { action, task } }));
    }
}

// TasksView - Optimized UI
class TasksView {
    constructor() {
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            client: 'all',
            search: '',
            sortBy: 'created'
        };
        
        this.selectedTasks = new Set();
        this.viewMode = 'normal';
        this.showCompleted = false;
        this.showFilters = false;
        
        window.addEventListener('taskUpdate', () => this.refreshView());
    }

    render(container) {
        if (!container) return;
        
        if (!window.taskManager?.initialized) {
            container.innerHTML = this.renderLoading();
            setTimeout(() => {
                if (window.taskManager?.initialized) this.render(container);
            }, 500);
            return;
        }

        const stats = window.taskManager.getStats();
        container.innerHTML = `
            <div class="tasks-page">
                ${this.renderControls(stats)}
                ${this.renderFilters()}
                <div class="tasks-container" id="tasksContainer">
                    ${this.renderTasksList()}
                </div>
            </div>
        `;

        this.addStyles();
        this.bindEvents();
    }

    renderControls(stats) {
        const selected = this.selectedTasks.size;
        
        return `
            <div class="controls-section">
                <div class="main-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="taskSearch" placeholder="Rechercher..." value="${this.filters.search}">
                        ${this.filters.search ? `<button class="clear-search" onclick="window.tasksView.clearSearch()">
                            <i class="fas fa-times"></i>
                        </button>` : ''}
                    </div>
                    
                    <div class="actions">
                        ${selected > 0 ? `
                            <div class="selection-info">
                                <span>${selected} sélectionné(s)</span>
                                <button class="btn btn-clear" onclick="window.tasksView.clearSelection()">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button class="btn btn-bulk" onclick="window.tasksView.bulkActions()">
                                    Actions <span class="badge">${selected}</span>
                                </button>
                            </div>
                        ` : ''}
                        
                        <button class="btn btn-select-all" onclick="window.tasksView.selectAll()">
                            <i class="fas fa-check-square"></i> Tout sélectionner
                        </button>
                        
                        <button class="btn btn-refresh" onclick="window.tasksView.refresh()">
                            <i class="fas fa-sync-alt"></i> Actualiser
                        </button>
                        
                        <button class="btn btn-new" onclick="window.tasksView.showCreateModal()">
                            <i class="fas fa-plus"></i> Nouvelle
                        </button>
                        
                        <button class="btn btn-filters ${this.showFilters ? 'active' : ''}" 
                                onclick="window.tasksView.toggleFilters()">
                            <i class="fas fa-filter"></i> Filtres
                            <i class="fas fa-chevron-${this.showFilters ? 'up' : 'down'}"></i>
                        </button>
                    </div>
                </div>
                
                <div class="view-controls">
                    <div class="view-modes">
                        ${['minimal', 'normal', 'detailed'].map(mode => `
                            <button class="view-mode ${this.viewMode === mode ? 'active' : ''}" 
                                    onclick="window.tasksView.setViewMode('${mode}')">
                                ${mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="status-pills">
                        ${this.renderStatusPills(stats)}
                    </div>
                </div>
            </div>
        `;
    }

    renderStatusPills(stats) {
        const pills = [
            { id: 'all', label: 'Tous', icon: '📋', count: stats.total },
            { id: 'todo', label: 'À faire', icon: '⏳', count: stats.todo },
            { id: 'in-progress', label: 'En cours', icon: '🔄', count: stats['in-progress'] },
            { id: 'relance', label: 'Relancé', icon: '🔔', count: stats.relance },
            { id: 'bloque', label: 'Bloqué', icon: '🚫', count: stats.bloque },
            { id: 'reporte', label: 'Reporté', icon: '⏰', count: stats.reporte },
            { id: 'overdue', label: 'En retard', icon: '⚠️', count: stats.overdue },
            { id: 'needsReply', label: 'À répondre', icon: '📧', count: stats.needsReply },
            { id: 'completed', label: 'Terminées', icon: '✅', count: stats.completed }
        ];

        return pills.map(p => `
            <button class="status-pill ${this.isActiveFilter(p.id) ? 'active' : ''}" 
                    onclick="window.tasksView.quickFilter('${p.id}')">
                <span>${p.icon}</span>
                <span>${p.label}</span>
                <span class="count">${p.count}</span>
            </button>
        `).join('');
    }

    renderFilters() {
        return `
            <div class="filters-panel ${this.showFilters ? 'show' : ''}">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label><i class="fas fa-flag"></i> Priorité</label>
                        <select id="priorityFilter" onchange="window.tasksView.updateFilter('priority', this.value)">
                            <option value="all">Toutes</option>
                            <option value="urgent" ${this.filters.priority === 'urgent' ? 'selected' : ''}>🚨 Urgente</option>
                            <option value="high" ${this.filters.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                            <option value="medium" ${this.filters.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                            <option value="low" ${this.filters.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-building"></i> Client</label>
                        <select id="clientFilter" onchange="window.tasksView.updateFilter('client', this.value)">
                            <option value="all">Tous les clients</option>
                            ${window.taskManager.getAllClients().map(client => `
                                <option value="${this.escape(client)}" ${this.filters.client === client ? 'selected' : ''}>
                                    ${this.escape(client)} (${window.taskManager.tasks.filter(t => t.client === client).length})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-sort"></i> Trier par</label>
                        <select id="sortFilter" onchange="window.tasksView.updateFilter('sortBy', this.value)">
                            <option value="created" ${this.filters.sortBy === 'created' ? 'selected' : ''}>Date création</option>
                            <option value="priority" ${this.filters.sortBy === 'priority' ? 'selected' : ''}>Priorité</option>
                            <option value="dueDate" ${this.filters.sortBy === 'dueDate' ? 'selected' : ''}>Échéance</option>
                            <option value="title" ${this.filters.sortBy === 'title' ? 'selected' : ''}>Titre</option>
                            <option value="client" ${this.filters.sortBy === 'client' ? 'selected' : ''}>Client</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-reset" onclick="window.tasksView.resetFilters()">
                        <i class="fas fa-undo"></i> Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    renderTasksList() {
        const tasks = window.taskManager.filterTasks(this.filters);
        const filtered = this.showCompleted ? tasks : tasks.filter(t => t.status !== 'completed');
        
        if (filtered.length === 0) {
            return this.renderEmpty();
        }

        const renderFn = {
            minimal: t => this.renderMinimalTask(t),
            normal: t => this.renderNormalTask(t),
            detailed: t => this.renderDetailedTask(t)
        };

        const containerClass = this.viewMode === 'detailed' ? 'tasks-grid' : 'tasks-list';
        
        return `<div class="${containerClass}">
            ${filtered.map(renderFn[this.viewMode]).join('')}
        </div>`;
    }

    renderMinimalTask(task) {
        const selected = this.selectedTasks.has(task.id);
        const due = this.formatDueDate(task.dueDate);
        const client = this.getClientDisplay(task);
        
        return `
            <div class="task-item minimal ${task.status === 'completed' ? 'completed' : ''} ${selected ? 'selected' : ''}" 
                 data-id="${task.id}" onclick="window.tasksView.handleClick(event, '${task.id}')">
                <input type="checkbox" ${selected ? 'checked' : ''} 
                       onclick="event.stopPropagation(); window.tasksView.toggleSelect('${task.id}')">
                <div class="task-info">
                    <span class="title">${this.escape(task.title)}</span>
                    <span class="client">${client.icon} ${this.escape(client.name)}</span>
                </div>
                <div class="task-meta">
                    <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                    <span class="due ${due.class}">${due.text}</span>
                </div>
                ${this.renderActions(task)}
            </div>
        `;
    }

    renderNormalTask(task) {
        const selected = this.selectedTasks.has(task.id);
        const due = this.formatDueDate(task.dueDate);
        const client = this.getClientDisplay(task);
        const progress = this.getChecklistProgress(task.checklist);
        
        return `
            <div class="task-item normal ${task.status === 'completed' ? 'completed' : ''} ${selected ? 'selected' : ''}" 
                 data-id="${task.id}" onclick="window.tasksView.handleClick(event, '${task.id}')">
                <input type="checkbox" ${selected ? 'checked' : ''} 
                       onclick="event.stopPropagation(); window.tasksView.toggleSelect('${task.id}')">
                <div class="priority-bar" style="background:${this.getPriorityColor(task.priority)}"></div>
                <div class="task-main">
                    <div class="task-header">
                        <h3>${this.escape(task.title)}</h3>
                        <div class="badges">
                            <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                            ${progress.total > 0 ? `<span class="checklist-badge">
                                <i class="fas fa-check-square"></i> ${progress.completed}/${progress.total}
                            </span>` : ''}
                            ${task.hasEmail ? '<span class="email-badge">📧 Email</span>' : ''}
                            ${task.hasEmail && task.needsReply && !task.emailReplied ? 
                                '<span class="reply-needed-badge">⚠️ À répondre</span>' : ''}
                        </div>
                    </div>
                    <div class="task-details">
                        <span>${client.icon} ${this.escape(client.name)}</span>
                        <span class="due ${due.class}">${due.text}</span>
                    </div>
                </div>
                ${this.renderActions(task)}
            </div>
        `;
    }

    renderDetailedTask(task) {
        const selected = this.selectedTasks.has(task.id);
        const due = this.formatDueDate(task.dueDate);
        const client = this.getClientDisplay(task);
        const progress = this.getChecklistProgress(task.checklist);
        
        return `
            <div class="task-card ${task.status === 'completed' ? 'completed' : ''} ${selected ? 'selected' : ''}" 
                 data-id="${task.id}">
                <div class="card-header">
                    <input type="checkbox" ${selected ? 'checked' : ''} 
                           onclick="window.tasksView.toggleSelect('${task.id}')">
                    <div class="badges">
                        <span class="priority-badge ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                        ${task.hasEmail ? '<span class="email-badge">📧</span>' : ''}
                        ${task.hasEmail && task.needsReply && !task.emailReplied ? 
                            '<span class="reply-needed-badge">⚠️</span>' : ''}
                    </div>
                </div>
                <div class="card-content">
                    <h3 onclick="window.tasksView.showDetails('${task.id}')">${this.escape(task.title)}</h3>
                    <p>${this.escape(task.description.substring(0, 150))}${task.description.length > 150 ? '...' : ''}</p>
                    ${progress.total > 0 ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${(progress.completed/progress.total)*100}%"></div>
                            <span>${progress.completed}/${progress.total} tâches</span>
                        </div>
                    ` : ''}
                    <div class="card-meta">
                        <span>${client.icon} ${this.escape(client.name)}</span>
                        <span class="due ${due.class}">${due.text}</span>
                    </div>
                </div>
                <div class="card-actions">
                    ${this.renderDetailedActions(task)}
                </div>
            </div>
        `;
    }

    renderActions(task) {
        const actions = [];
        
        // PRIORITÉ 1: Bouton Répondre à l'email (le plus important pour les emails)
        if (task.hasEmail && task.emailFrom) {
            actions.push(`<button class="action-btn reply ${task.emailReplied ? 'replied' : ''}" 
                    onclick="event.stopPropagation(); window.tasksView.openInOutlook('${task.id}')" 
                    title="${task.emailReplied ? 'Email déjà répondu - Répondre à nouveau' : 'Répondre à l\'email'}">
                <i class="fas fa-reply"></i>
            </button>`);
        }
        
        if (task.status !== 'completed') {
            actions.push(`<button class="action-btn complete" onclick="event.stopPropagation(); window.tasksView.complete('${task.id}')" title="Terminer">
                <i class="fas fa-check"></i>
            </button>`);
        }
        
        actions.push(`<button class="action-btn edit" onclick="event.stopPropagation(); window.tasksView.showEditModal('${task.id}')" title="Modifier">
            <i class="fas fa-edit"></i>
        </button>`);
        
        actions.push(`<button class="action-btn details" onclick="event.stopPropagation(); window.tasksView.showDetails('${task.id}')" title="Détails">
            <i class="fas fa-eye"></i>
        </button>`);
        
        return `<div class="task-actions">${actions.join('')}</div>`;
    }

    renderDetailedActions(task) {
        const actions = [];
        
        // PRIORITÉ 1: Bouton Répondre pour les emails
        if (task.hasEmail && task.emailFrom) {
            actions.push(`<button class="btn-detailed reply ${task.emailReplied ? 'replied' : ''}" 
                    onclick="window.tasksView.openInOutlook('${task.id}')">
                <i class="fas fa-reply"></i> ${task.emailReplied ? 'Répondre à nouveau' : 'Répondre à l\'email'}
            </button>`);
        }
        
        if (task.status !== 'completed') {
            actions.push(`<button class="btn-detailed complete" onclick="window.tasksView.complete('${task.id}')">
                <i class="fas fa-check"></i> Terminé
            </button>`);
        }
        
        actions.push(`<button class="btn-detailed edit" onclick="window.tasksView.showEditModal('${task.id}')">
            <i class="fas fa-edit"></i> Modifier
        </button>`);
        
        actions.push(`<button class="btn-detailed details" onclick="window.tasksView.showDetails('${task.id}')">
            <i class="fas fa-eye"></i> Détails
        </button>`);
        
        return actions.join('');
    }

    // Nouvelle méthode pour ouvrir dans Outlook
    openInOutlook(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        const subject = `Re: ${task.emailSubject || 'Sans sujet'}`;
        const to = task.emailFrom;
        const body = `\n\n\n-----Message d'origine-----\nDe: ${task.emailFromName || task.emailFrom}\nDate: ${task.emailDate ? new Date(task.emailDate).toLocaleString('fr-FR') : ''}\nSujet: ${task.emailSubject || ''}\n\n${task.emailContent || ''}`;
        
        const outlookUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.open(outlookUrl);
        
        // Marquer comme répondu
        window.taskManager.updateTask(taskId, { 
            emailReplied: true,
            needsReply: false,
            status: task.status === 'todo' ? 'in-progress' : task.status
        });
        
        this.showToast('Email ouvert dans Outlook', 'success');
        this.refreshView();
    }

    // Modals
    showCreateModal() {
        this.showModal('Créer une nouvelle tâche', this.renderTaskForm(), () => {
            const data = this.getFormData();
            if (!data.title) {
                this.showToast('Le titre est requis', 'warning');
                return false;
            }
            
            window.taskManager.createTask(data);
            this.showToast('Tâche créée avec succès', 'success');
            this.refreshView();
            return true;
        });
    }

    showEditModal(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;
        
        this.showModal('Modifier la tâche', this.renderTaskForm(task), () => {
            const data = this.getFormData();
            if (!data.title) {
                this.showToast('Le titre est requis', 'warning');
                return false;
            }
            
            window.taskManager.updateTask(taskId, data);
            this.showToast('Tâche mise à jour', 'success');
            this.refreshView();
            return true;
        });
        
        // Populate checklist
        if (task.checklist?.length > 0) {
            setTimeout(() => {
                task.checklist.forEach(item => this.addChecklistItem(item.text, item.completed));
            }, 100);
        }
    }

    showDetails(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;
        
        const content = this.renderTaskDetails(task);
        
        this.showModal('Détails de la tâche', content, null, {
            footer: `
                ${task.hasEmail && task.emailFrom ? `
                    <button class="btn btn-reply ${task.emailReplied ? 'replied' : ''}" 
                            onclick="window.tasksView.openInOutlook('${task.id}')">
                        <i class="fas fa-reply"></i> ${task.emailReplied ? 'Répondre à nouveau' : 'Répondre à l\'email'}
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="window.tasksView.closeModal()">Fermer</button>
                <button class="btn btn-primary" onclick="window.tasksView.closeModal(); window.tasksView.showEditModal('${task.id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                ${task.status !== 'completed' ? `
                    <button class="btn btn-success" onclick="window.tasksView.complete('${task.id}'); window.tasksView.closeModal()">
                        <i class="fas fa-check"></i> Marquer terminé
                    </button>
                ` : ''}
            `
        });
    }

    renderTaskForm(task = {}) {
        return `
            <form id="taskForm" class="task-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Titre *</label>
                        <input type="text" id="title" value="${this.escape(task.title || '')}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="description" rows="4">${this.escape(task.description || '')}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Priorité</label>
                        <select id="priority">
                            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                            <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>🚨 Urgente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Statut</label>
                        <select id="status">
                            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>⏳ À faire</option>
                            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>🔄 En cours</option>
                            <option value="relance" ${task.status === 'relance' ? 'selected' : ''}>🔔 Relancé</option>
                            <option value="bloque" ${task.status === 'bloque' ? 'selected' : ''}>🚫 Bloqué</option>
                            <option value="reporte" ${task.status === 'reporte' ? 'selected' : ''}>⏰ Reporté</option>
                            ${task.id ? `<option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Terminé</option>` : ''}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Client/Projet</label>
                        <input type="text" id="client" value="${this.escape(task.client || 'Interne')}">
                    </div>
                    <div class="form-group">
                        <label>Échéance</label>
                        <input type="date" id="dueDate" value="${task.dueDate || ''}">
                    </div>
                </div>
                
                ${task.hasEmail ? `
                    <div class="form-section">
                        <h3><i class="fas fa-envelope"></i> Informations Email</h3>
                        <div class="email-info">
                            <div><strong>De:</strong> ${this.escape(task.emailFromName || task.emailFrom || '')}</div>
                            <div><strong>Sujet:</strong> ${this.escape(task.emailSubject || '')}</div>
                            <label>
                                <input type="checkbox" id="needsReply" ${task.needsReply ? 'checked' : ''}>
                                Réponse requise
                            </label>
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-section">
                    <div class="section-header">
                        <h3><i class="fas fa-check-square"></i> Liste de contrôle</h3>
                        <button type="button" class="btn-add" onclick="window.tasksView.addChecklistItem()">
                            <i class="fas fa-plus"></i> Ajouter
                        </button>
                    </div>
                    <div id="checklist" class="checklist-container"></div>
                </div>
            </form>
        `;
    }

    renderTaskDetails(task) {
        const due = this.formatDueDate(task.dueDate);
        const progress = this.getChecklistProgress(task.checklist);
        
        return `
            <div class="task-details">
                <div class="details-header">
                    <h1>${this.escape(task.title)}</h1>
                    <div class="meta-badges">
                        <span class="priority-badge ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                        <span class="due-badge ${due.class}">${due.text}</span>
                        ${progress.total > 0 ? `<span class="checklist-badge">
                            <i class="fas fa-check-square"></i> ${progress.completed}/${progress.total}
                        </span>` : ''}
                    </div>
                </div>
                
                ${task.checklist?.length > 0 ? `
                    <div class="section">
                        <h3><i class="fas fa-check-square"></i> Liste de contrôle</h3>
                        <div class="checklist-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${(progress.completed/progress.total)*100}%"></div>
                            </div>
                            <span>${progress.completed}/${progress.total} terminées</span>
                        </div>
                        <div class="checklist-items">
                            ${task.checklist.map(item => `
                                <div class="checklist-item ${item.completed ? 'completed' : ''}">
                                    <i class="fas ${item.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                                    <span>${this.escape(item.text)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="section">
                    <h3><i class="fas fa-info-circle"></i> Informations</h3>
                    <div class="info-grid">
                        <div><strong>Client:</strong> ${this.escape(task.client)}</div>
                        <div><strong>Créé le:</strong> ${new Date(task.createdAt).toLocaleString('fr-FR')}</div>
                        <div><strong>Modifié le:</strong> ${new Date(task.updatedAt).toLocaleString('fr-FR')}</div>
                        ${task.completedAt ? `<div><strong>Terminé le:</strong> ${new Date(task.completedAt).toLocaleString('fr-FR')}</div>` : ''}
                    </div>
                </div>
                
                ${task.hasEmail ? `
                    <div class="section">
                        <h3><i class="fas fa-envelope"></i> Email</h3>
                        <div class="email-details">
                            <div><strong>De:</strong> ${this.escape(task.emailFromName || task.emailFrom || '')}</div>
                            <div><strong>Sujet:</strong> ${this.escape(task.emailSubject || '')}</div>
                            <div><strong>Date:</strong> ${task.emailDate ? new Date(task.emailDate).toLocaleString('fr-FR') : 'Non spécifiée'}</div>
                            <div><strong>Réponse requise:</strong> ${task.needsReply ? '✅ Oui' : '❌ Non'}</div>
                            <div><strong>Déjà répondu:</strong> ${task.emailReplied ? '✅ Oui' : '❌ Non'}</div>
                        </div>
                        ${task.emailContent ? `
                            <div class="email-content">
                                <h4>Contenu</h4>
                                <div class="email-box">${task.emailHtmlContent || this.escape(task.emailContent).replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Form helpers
    getFormData() {
        const form = document.getElementById('taskForm');
        if (!form) return {};
        
        const data = {
            title: form.querySelector('#title').value.trim(),
            description: form.querySelector('#description').value.trim(),
            priority: form.querySelector('#priority').value,
            status: form.querySelector('#status').value,
            client: form.querySelector('#client').value.trim() || 'Interne',
            dueDate: form.querySelector('#dueDate').value || null,
            checklist: this.getChecklistData()
        };
        
        const needsReply = form.querySelector('#needsReply');
        if (needsReply) data.needsReply = needsReply.checked;
        
        return data;
    }

    addChecklistItem(text = '', completed = false) {
        const container = document.getElementById('checklist');
        if (!container) return;
        
        const id = 'cl_' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div class="checklist-item" data-id="${id}">
                <input type="checkbox" ${completed ? 'checked' : ''}>
                <input type="text" placeholder="Élément..." value="${this.escape(text)}">
                <button type="button" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `);
        
        const newInput = container.querySelector(`[data-id="${id}"] input[type="text"]`);
        if (newInput) newInput.focus();
    }

    getChecklistData() {
        const items = [];
        document.querySelectorAll('#checklist .checklist-item').forEach(item => {
            const text = item.querySelector('input[type="text"]').value.trim();
            if (text) {
                items.push({
                    id: item.dataset.id || 'cl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    text,
                    completed: item.querySelector('input[type="checkbox"]').checked
                });
            }
        });
        return items;
    }

    // Utilities
    showModal(title, content, onSave, options = {}) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        
        const modalId = 'modal_' + Date.now();
        const html = `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal-container ${options.large ? 'large' : ''}">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="close" onclick="window.tasksView.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">${content}</div>
                    <div class="modal-footer">
                        ${options.footer || `
                            <button class="btn btn-secondary" onclick="window.tasksView.closeModal()">Annuler</button>
                            ${onSave ? `<button class="btn btn-primary" onclick="window.tasksView.saveModal('${modalId}')">
                                <i class="fas fa-save"></i> Enregistrer
                            </button>` : ''}
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        document.body.style.overflow = 'hidden';
        
        if (onSave) window.tasksView._modalCallback = onSave;
    }

    saveModal(modalId) {
        if (this._modalCallback && this._modalCallback()) {
            this.closeModal();
        }
    }

    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        document.body.style.overflow = '';
        delete this._modalCallback;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Event handlers
    handleClick(event, taskId) {
        if (event.target.closest('.task-actions')) return;
        
        const now = Date.now();
        const lastClick = this.lastTaskClick || 0;
        
        if (now - lastClick < 300) {
            event.preventDefault();
            this.toggleSelect(taskId);
            this.lastTaskClick = 0;
            return;
        }
        
        this.lastTaskClick = now;
        setTimeout(() => {
            if (Date.now() - this.lastTaskClick >= 250) {
                this.showDetails(taskId);
            }
        }, 250);
    }

    bindEvents() {
        const search = document.getElementById('taskSearch');
        if (search) {
            let timeout;
            search.addEventListener('input', e => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filters.search = e.target.value.trim();
                    this.refreshView();
                }, 300);
            });
        }
    }

    // Actions
    selectAll() {
        const tasks = window.taskManager.filterTasks(this.filters);
        const filtered = this.showCompleted ? tasks : tasks.filter(t => t.status !== 'completed');
        
        const allSelected = filtered.every(t => this.selectedTasks.has(t.id));
        
        if (allSelected) {
            filtered.forEach(t => this.selectedTasks.delete(t.id));
            this.showToast('Sélection effacée', 'info');
        } else {
            filtered.forEach(t => this.selectedTasks.add(t.id));
            this.showToast(`${filtered.length} tâche(s) sélectionnée(s)`, 'success');
        }
        
        this.refreshView();
    }

    clearSelection() {
        this.selectedTasks.clear();
        this.refreshView();
    }

    toggleSelect(taskId) {
        if (this.selectedTasks.has(taskId)) {
            this.selectedTasks.delete(taskId);
        } else {
            this.selectedTasks.add(taskId);
        }
        this.refreshView();
    }

    complete(taskId) {
        window.taskManager.updateTask(taskId, { 
            status: 'completed',
            completedAt: new Date().toISOString()
        });
        this.showToast('Tâche terminée', 'success');
    }

    bulkActions() {
        const count = this.selectedTasks.size;
        if (count === 0) return;
        
        const action = prompt(`Actions pour ${count} tâche(s):\n\n1. Marquer comme terminé\n2. Changer priorité\n3. Changer statut\n4. Supprimer\n5. Exporter\n\nNuméro:`);
        
        if (!action) return;
        
        switch (action) {
            case '1':
                this.selectedTasks.forEach(id => this.complete(id));
                this.clearSelection();
                break;
            case '2':
                const priority = prompt('Priorité:\n1. Basse\n2. Normale\n3. Haute\n4. Urgente');
                const priorities = ['', 'low', 'medium', 'high', 'urgent'];
                if (priorities[priority]) {
                    this.selectedTasks.forEach(id => 
                        window.taskManager.updateTask(id, { priority: priorities[priority] })
                    );
                    this.showToast('Priorité mise à jour', 'success');
                    this.clearSelection();
                }
                break;
            case '3':
                const status = prompt('Statut:\n1. À faire\n2. En cours\n3. Relancé\n4. Bloqué\n5. Reporté\n6. Terminé');
                const statuses = ['', 'todo', 'in-progress', 'relance', 'bloque', 'reporte', 'completed'];
                if (statuses[status]) {
                    this.selectedTasks.forEach(id => 
                        window.taskManager.updateTask(id, { status: statuses[status] })
                    );
                    this.showToast('Statut mis à jour', 'success');
                    this.clearSelection();
                }
                break;
            case '4':
                if (confirm(`Supprimer ${count} tâche(s) ?`)) {
                    this.selectedTasks.forEach(id => window.taskManager.deleteTask(id));
                    this.showToast(`${count} tâche(s) supprimée(s)`, 'success');
                    this.clearSelection();
                }
                break;
            case '5':
                this.exportSelected();
                break;
        }
    }

    exportSelected() {
        const tasks = Array.from(this.selectedTasks)
            .map(id => window.taskManager.getTask(id))
            .filter(Boolean);
        
        const csv = [
            ['Titre', 'Description', 'Priorité', 'Statut', 'Échéance', 'Client'].join(','),
            ...tasks.map(t => [
                `"${t.title}"`,
                `"${t.description}"`,
                t.priority,
                t.status,
                t.dueDate || '',
                t.client
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        this.showToast('Export terminé', 'success');
    }

    // Filters
    quickFilter(id) {
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            client: 'all',
            search: this.filters.search,
            sortBy: this.filters.sortBy,
            overdue: false,
            needsReply: false
        };

        switch (id) {
            case 'all':
                break;
            case 'todo':
            case 'in-progress':
            case 'relance':
            case 'bloque':
            case 'reporte':
            case 'completed':
                this.filters.status = id;
                break;
            case 'overdue':
                this.filters.overdue = true;
                break;
            case 'needsReply':
                this.filters.needsReply = true;
                break;
        }

        this.refreshView();
    }

    updateFilter(type, value) {
        this.filters[type] = value;
        this.refreshView();
    }

    resetFilters() {
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            client: 'all',
            search: '',
            sortBy: 'created'
        };
        this.refreshView();
        this.showToast('Filtres réinitialisés', 'info');
    }

    toggleFilters() {
        this.showFilters = !this.showFilters;
        this.refreshView();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.refreshView();
    }

    clearSearch() {
        this.filters.search = '';
        this.refreshView();
    }

    refresh() {
        this.refreshView();
        this.showToast('Actualisé', 'success');
    }

    refreshView() {
        const container = document.getElementById('tasksContainer');
        if (container) {
            container.innerHTML = this.renderTasksList();
        }
        
        const controls = document.querySelector('.controls-section');
        if (controls) {
            const stats = window.taskManager.getStats();
            controls.outerHTML = this.renderControls(stats);
        }
        
        const filters = document.querySelector('.filters-panel');
        if (filters) {
            filters.outerHTML = this.renderFilters();
        }
        
        this.bindEvents();
    }

    // Helpers
    isActiveFilter(id) {
        switch (id) {
            case 'all': return this.filters.status === 'all' && !this.filters.overdue && !this.filters.needsReply;
            case 'todo': return this.filters.status === 'todo';
            case 'in-progress': return this.filters.status === 'in-progress';
            case 'relance': return this.filters.status === 'relance';
            case 'bloque': return this.filters.status === 'bloque';
            case 'reporte': return this.filters.status === 'reporte';
            case 'completed': return this.filters.status === 'completed';
            case 'overdue': return this.filters.overdue;
            case 'needsReply': return this.filters.needsReply;
            default: return false;
        }
    }

    getPriorityColor(priority) {
        const colors = { urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#10b981' };
        return colors[priority] || '#3b82f6';
    }

    getPriorityLabel(priority) {
        const labels = { urgent: '🚨 Urgente', high: '⚡ Haute', medium: '📌 Normale', low: '📄 Basse' };
        return labels[priority] || '📌 Normale';
    }

    getStatusLabel(status) {
        const labels = {
            todo: '⏳ À faire',
            'in-progress': '🔄 En cours',
            relance: '🔔 Relancé',
            bloque: '🚫 Bloqué',
            reporte: '⏰ Reporté',
            completed: '✅ Terminé'
        };
        return labels[status] || '⏳ À faire';
    }

    formatDueDate(date) {
        if (!date) return { text: 'Pas d\'échéance', class: 'no-due' };
        
        const due = new Date(date);
        const now = new Date();
        const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        if (days < 0) return { text: `En retard ${Math.abs(days)}j`, class: 'overdue' };
        if (days === 0) return { text: 'Aujourd\'hui', class: 'today' };
        if (days === 1) return { text: 'Demain', class: 'tomorrow' };
        if (days <= 7) return { text: `${days}j`, class: 'week' };
        
        return { text: due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), class: 'normal' };
    }

    getClientDisplay(task) {
        let name = task.client || 'Interne';
        let icon = '🏢';
        
        if (task.hasEmail) {
            if (task.emailFromName && task.emailFromName !== task.emailFrom) {
                name = task.emailFromName;
                icon = '👤';
            } else if (task.emailDomain) {
                icon = '📧';
            }
        } else if (name !== 'Interne') {
            icon = '👤';
        }
        
        return { name, icon };
    }

    getChecklistProgress(checklist) {
        if (!Array.isArray(checklist)) return { completed: 0, total: 0 };
        return {
            total: checklist.length,
            completed: checklist.filter(item => item.completed).length
        };
    }

    escape(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderLoading() {
        return `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement des tâches...</p>
            </div>
        `;
    }

    renderEmpty() {
        let message, action;
        
        if (this.filters.search) {
            message = `Aucune tâche pour "${this.filters.search}"`;
            action = `<button class="btn btn-primary" onclick="window.tasksView.clearSearch()">
                <i class="fas fa-undo"></i> Effacer recherche
            </button>`;
        } else if (this.hasActiveFilters()) {
            message = 'Aucune tâche avec ces filtres';
            action = `<button class="btn btn-primary" onclick="window.tasksView.resetFilters()">
                <i class="fas fa-undo"></i> Réinitialiser filtres
            </button>`;
        } else {
            message = 'Aucune tâche';
            action = `<button class="btn btn-primary" onclick="window.tasksView.showCreateModal()">
                <i class="fas fa-plus"></i> Créer une tâche
            </button>`;
        }
        
        return `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>${message}</h3>
                ${action}
            </div>
        `;
    }

    hasActiveFilters() {
        return this.filters.status !== 'all' ||
               this.filters.priority !== 'all' ||
               this.filters.category !== 'all' ||
               this.filters.client !== 'all' ||
               this.filters.overdue ||
               this.filters.needsReply;
    }

    addStyles() {
        if (document.getElementById('taskManagerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'taskManagerStyles';
        styles.textContent = `
            :root {
                --primary: #3b82f6;
                --primary-hover: #2563eb;
                --success: #10b981;
                --warning: #f59e0b;
                --danger: #ef4444;
                --text: #1f2937;
                --text-secondary: #6b7280;
                --bg: #ffffff;
                --bg-secondary: #f8fafc;
                --border: #e5e7eb;
                --radius: 8px;
                --shadow: 0 1px 3px rgba(0,0,0,0.1);
                --shadow-lg: 0 4px 12px rgba(0,0,0,0.1);
            }

            * { box-sizing: border-box; }

            .tasks-page {
                font-family: system-ui, -apple-system, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                padding: 16px;
                font-size: 14px;
            }

            /* Controls */
            .controls-section {
                background: rgba(255,255,255,0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            }

            .main-controls {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 16px;
            }

            .search-box {
                position: relative;
                flex: 1;
                max-width: 400px;
            }

            .search-box i {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-secondary);
            }

            .search-box input {
                width: 100%;
                height: 44px;
                padding: 0 44px;
                border: 2px solid var(--border);
                border-radius: 10px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .search-box input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
            }

            .clear-search {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: var(--danger);
                color: white;
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all 0.2s;
            }

            .clear-search:hover {
                background: #dc2626;
                transform: translateY(-50%) scale(1.1);
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .selection-info {
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 1px solid #93c5fd;
                border-radius: 8px;
                padding: 8px 12px;
                font-weight: 600;
                font-size: 13px;
            }

            .btn {
                height: 44px;
                padding: 0 16px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: white;
                color: var(--text);
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
                position: relative;
            }

            .btn:hover {
                background: var(--bg-secondary);
                border-color: var(--primary);
                transform: translateY(-1px);
                box-shadow: var(--shadow-lg);
            }

            .btn-new {
                background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
                color: white;
                border: none;
            }

            .btn-new:hover {
                background: linear-gradient(135deg, var(--primary-hover) 0%, #5856eb 100%);
            }

            .btn-bulk {
                background: var(--success);
                color: white;
                border: none;
            }

            .btn-bulk:hover {
                background: #059669;
            }

            .btn-clear {
                width: 44px;
                padding: 0;
                background: var(--bg-secondary);
                color: var(--text-secondary);
            }

            .btn-clear:hover {
                background: var(--danger);
                color: white;
            }

            .btn-filters.active {
                background: #eff6ff;
                color: var(--primary);
                border-color: var(--primary);
            }

            .badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: var(--danger);
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 16px;
                text-align: center;
                border: 2px solid white;
            }

            .view-controls {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .view-modes {
                display: flex;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 3px;
                gap: 2px;
            }

            .view-mode {
                padding: 8px 16px;
                border: none;
                background: transparent;
                color: var(--text-secondary);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 13px;
                font-weight: 600;
            }

            .view-mode:hover {
                background: rgba(255,255,255,0.8);
                color: var(--text);
            }

            .view-mode.active {
                background: white;
                color: var(--text);
                box-shadow: var(--shadow);
            }

            .status-pills {
                display: flex;
                gap: 8px;
                flex: 1;
                flex-wrap: wrap;
                justify-content: center;
            }

            .status-pill {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: white;
                border: 1px solid var(--border);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
                font-weight: 600;
                color: var(--text);
                min-width: 100px;
                justify-content: space-between;
            }

            .status-pill:hover {
                border-color: var(--primary);
                background: #f0f9ff;
                transform: translateY(-1px);
                box-shadow: var(--shadow);
            }

            .status-pill.active {
                background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
                color: white;
                border-color: var(--primary);
                box-shadow: var(--shadow-lg);
            }

            .status-pill .count {
                background: rgba(0,0,0,0.1);
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
            }

            .status-pill.active .count {
                background: rgba(255,255,255,0.3);
            }

            /* Filters */
            .filters-panel {
                background: rgba(255,255,255,0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                margin-bottom: 16px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s;
                opacity: 0;
            }

            .filters-panel.show {
                max-height: 200px;
                opacity: 1;
                padding: 20px;
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
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 600;
                font-size: 12px;
                color: var(--text);
            }

            .filter-group select {
                height: 44px;
                padding: 0 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: white;
                font-size: 13px;
                color: var(--text);
                cursor: pointer;
                transition: all 0.2s;
            }

            .filter-group select:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
            }

            .btn-reset {
                background: var(--bg-secondary);
                color: var(--text-secondary);
            }

            .btn-reset:hover {
                background: var(--border);
                color: var(--text);
            }

            /* Tasks List */
            .tasks-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
                background: rgba(255,255,255,0.8);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow);
            }

            .task-item {
                background: white;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }

            .task-item:hover {
                background: var(--bg-secondary);
                transform: translateY(-1px);
                box-shadow: var(--shadow-lg);
                z-index: 1;
            }

            .task-item.selected {
                background: #eff6ff;
                border-left: 4px solid var(--primary);
            }

            .task-item.completed {
                opacity: 0.6;
            }

            .task-item.completed .title {
                text-decoration: line-through;
            }

            /* Minimal View */
            .task-item.minimal {
                padding: 12px 16px;
                height: 56px;
            }

            .task-item input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
                flex-shrink: 0;
            }

            .task-info {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 16px;
                min-width: 0;
            }

            .title {
                font-weight: 600;
                color: var(--text);
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 2;
            }

            .client {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
            }

            .task-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .status-badge {
                font-size: 11px;
                font-weight: 600;
                padding: 3px 6px;
                border-radius: 4px;
                white-space: nowrap;
            }

            .status-badge.todo { background: #fef3c7; color: #d97706; }
            .status-badge.in-progress { background: #eff6ff; color: #2563eb; }
            .status-badge.relance { background: #fef2f2; color: #dc2626; }
            .status-badge.bloque { background: #f3f4f6; color: #6b7280; }
            .status-badge.reporte { background: #f0f9ff; color: #0ea5e9; }
            .status-badge.completed { background: #f0fdf4; color: #16a34a; }

            .due {
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
            }

            .due.overdue { color: var(--danger); font-weight: 600; }
            .due.today { color: var(--warning); font-weight: 600; }
            .due.tomorrow { color: var(--warning); }
            .due.week { color: var(--primary); }
            .due.normal { color: var(--text-secondary); }
            .due.no-due { color: #9ca3af; font-style: italic; }

            /* Normal View */
            .task-item.normal {
                padding: 16px;
                min-height: 72px;
            }

            .priority-bar {
                width: 4px;
                height: 48px;
                border-radius: 2px;
                margin-right: 12px;
                flex-shrink: 0;
            }

            .task-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 0;
            }

            .task-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .task-header h3 {
                font-size: 15px;
                font-weight: 700;
                color: var(--text);
                margin: 0;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex: 1;
            }

            .badges {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }

            .checklist-badge,
            .email-badge {
                padding: 3px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                border: 1px solid;
                display: flex;
                align-items: center;
                gap: 3px;
            }

            .checklist-badge {
                background: #f3e8ff;
                color: #8b5cf6;
                border-color: #c4b5fd;
            }

            .email-badge {
                background: #fef3c7;
                color: #d97706;
                border: none;
            }

            .reply-needed-badge {
                background: #fef2f2;
                color: #dc2626;
                border-color: #fecaca;
                font-weight: 700;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }

            .task-details {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 12px;
                color: var(--text-secondary);
            }

            /* Detailed View */
            .tasks-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 16px;
            }

            .task-card {
                background: rgba(255,255,255,0.95);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.2s;
                box-shadow: var(--shadow);
                display: flex;
                flex-direction: column;
                min-height: 200px;
            }

            .task-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
                border-color: rgba(59,130,246,0.3);
            }

            .task-card.selected {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-color: var(--primary);
            }

            .task-card.completed {
                opacity: 0.8;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            }

            .card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .card-content {
                flex: 1;
                margin-bottom: 12px;
            }

            .card-content h3 {
                font-size: 16px;
                font-weight: 700;
                color: var(--text);
                margin: 0 0 8px 0;
                cursor: pointer;
                transition: color 0.2s;
            }

            .card-content h3:hover {
                color: var(--primary);
            }

            .card-content p {
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.5;
                margin: 0 0 12px 0;
            }

            .progress-bar {
                position: relative;
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
                transition: width 0.3s;
            }

            .progress-bar span {
                position: absolute;
                right: 0;
                top: -20px;
                font-size: 11px;
                font-weight: 600;
                color: #8b5cf6;
            }

            .card-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                font-size: 12px;
            }

            .card-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            /* Actions */
            .task-actions {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
            }

            .action-btn {
                width: 32px;
                height: 32px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                font-size: 12px;
            }

            .action-btn:hover {
                background: var(--bg-secondary);
                border-color: var(--text-secondary);
                transform: translateY(-1px);
            }

            .action-btn.complete:hover { background: #dcfce7; border-color: var(--success); color: var(--success); }
            .action-btn.edit:hover { background: #fef3c7; border-color: var(--warning); color: var(--warning); }
            .action-btn.details:hover { background: #f3e8ff; border-color: #8b5cf6; color: #8b5cf6; }
            .action-btn.reply { 
                background: var(--primary); 
                color: white; 
                border-color: var(--primary);
            }
            .action-btn.reply:hover { 
                background: var(--primary-hover); 
                transform: translateY(-1px) scale(1.05);
            }
            .action-btn.reply.replied {
                background: #10b981;
                border-color: #10b981;
            }
            .action-btn.reply.replied:hover {
                background: #059669;
            }

            .btn-detailed {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid;
                white-space: nowrap;
            }

            .btn-detailed.complete {
                background: var(--success);
                color: white;
                border-color: var(--success);
            }

            .btn-detailed.complete:hover {
                background: #059669;
                border-color: #059669;
            }

            .btn-detailed.edit {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-detailed.edit:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
            }

            .btn-detailed.details {
                background: var(--bg-secondary);
                color: var(--text);
                border-color: var(--border);
            }

            .btn-detailed.details:hover {
                background: var(--border);
                border-color: var(--text-secondary);
            }

            .btn-detailed.reply {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-detailed.reply:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
                transform: translateY(-1px);
            }

            .btn-detailed.reply.replied {
                background: #10b981;
                border-color: #10b981;
            }

            .btn-detailed.reply.replied:hover {
                background: #059669;
                border-color: #059669;
            }

            /* Modal */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.75);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .modal-container {
                background: white;
                border-radius: 16px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }

            .modal-container.large {
                max-width: 1000px;
            }

            .modal-header {
                padding: 24px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h2 {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: var(--text);
            }

            .modal-header .close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: var(--text-secondary);
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .modal-header .close:hover {
                background: var(--bg-secondary);
                color: var(--text);
            }

            .modal-content {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }

            .modal-footer {
                padding: 24px;
                border-top: 1px solid var(--border);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            .modal-footer .btn {
                margin: 0;
            }

            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text);
                border-color: var(--border);
            }

            .btn-secondary:hover {
                background: var(--border);
                border-color: var(--text-secondary);
            }

            .btn-primary {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-primary:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
            }

            .btn-success {
                background: var(--success);
                color: white;
                border-color: var(--success);
            }

            .btn-success:hover {
                background: #059669;
                border-color: #059669;
            }

            .btn-reply {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-reply:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
            }

            /* Forms */
            .task-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .form-group label {
                font-weight: 600;
                color: var(--text);
                font-size: 14px;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                padding: 12px 16px;
                border: 2px solid var(--border);
                border-radius: 8px;
                font-size: 14px;
                background: white;
                transition: all 0.2s;
                font-family: inherit;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
            }

            .form-group textarea {
                resize: vertical;
                min-height: 80px;
            }

            .form-section {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--border);
            }

            .form-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--text);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .btn-add {
                background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .btn-add:hover {
                background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
                transform: translateY(-1px);
            }

            .checklist-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-height: 40px;
                padding: 8px;
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                background: #f9fafb;
            }

            .checklist-container:empty::before {
                content: "Aucun élément. Cliquez sur 'Ajouter' pour commencer.";
                color: #9ca3af;
                font-style: italic;
                font-size: 13px;
                text-align: center;
                padding: 16px;
                display: block;
            }

            .checklist-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: white;
                border: 1px solid var(--border);
                border-radius: 6px;
                transition: all 0.2s;
            }

            .checklist-item:hover {
                border-color: var(--primary);
                box-shadow: 0 2px 4px rgba(59,130,246,0.1);
            }

            .checklist-item input[type="checkbox"] {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                cursor: pointer;
            }

            .checklist-item input[type="text"] {
                flex: 1;
                border: none;
                outline: none;
                font-size: 14px;
                padding: 4px 8px;
                border-radius: 4px;
                background: transparent;
                transition: background 0.2s;
            }

            .checklist-item input[type="text"]:focus {
                background: #f8fafc;
            }

            .checklist-item button {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .checklist-item button:hover {
                background: #fee2e2;
                border-color: #fca5a5;
                transform: scale(1.05);
            }

            .email-info {
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 16px;
                font-size: 14px;
                color: var(--text);
            }

            .email-info > div {
                margin-bottom: 8px;
            }

            .email-info label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                font-weight: normal;
            }

            /* Task Details */
            .task-details {
                max-width: none;
            }

            .details-header {
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border);
            }

            .details-header h1 {
                font-size: 24px;
                font-weight: 700;
                color: var(--text);
                margin: 0 0 12px 0;
                line-height: 1.3;
            }

            .meta-badges {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .priority-badge,
            .due-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
            }

            .priority-badge.urgent { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .priority-badge.high { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .priority-badge.medium { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
            .priority-badge.low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

            .due-badge.overdue { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .due-badge.today { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .due-badge.tomorrow { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .due-badge.week { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
            .due-badge.normal { background: var(--bg-secondary); color: #64748b; border: 1px solid var(--border); }
            .due-badge.no-due { background: var(--bg-secondary); color: #9ca3af; border: 1px solid #d1d5db; font-style: italic; }

            .section {
                margin-bottom: 24px;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }

            .section h3 {
                margin: 0;
                padding: 16px 20px;
                background: white;
                border-bottom: 1px solid var(--border);
                font-size: 16px;
                font-weight: 600;
                color: var(--text);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section .content {
                padding: 16px 20px;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text);
            }

            .checklist-progress {
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .checklist-progress .progress-bar {
                flex: 1;
                margin: 0;
            }

            .checklist-progress span {
                font-size: 12px;
                font-weight: 600;
                color: #8b5cf6;
                white-space: nowrap;
            }

            .checklist-items {
                padding: 0 20px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .checklist-items .checklist-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: white;
                border: 1px solid var(--border);
                border-radius: 6px;
                transition: all 0.2s;
            }

            .checklist-items .checklist-item.completed {
                background: #f0fdf4;
                border-color: #bbf7d0;
            }

            .checklist-items .checklist-item.completed span {
                text-decoration: line-through;
                color: #6b7280;
            }

            .checklist-items .checklist-item i {
                color: #6b7280;
                font-size: 14px;
                flex-shrink: 0;
            }

            .checklist-items .checklist-item.completed i {
                color: #16a34a;
            }

            .info-grid {
                padding: 16px 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
            }

            .info-grid > div {
                display: flex;
                gap: 12px;
                font-size: 14px;
                color: var(--text);
            }

            .info-grid strong {
                min-width: 100px;
                color: var(--text);
            }

            .email-details {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .email-details > div {
                display: flex;
                gap: 12px;
                font-size: 14px;
            }

            .email-details strong {
                min-width: 120px;
                color: var(--text);
            }

            .email-content {
                padding: 0 20px 16px;
            }

            .email-content h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--text);
            }

            .email-box {
                background: white;
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 16px;
                max-height: 300px;
                overflow-y: auto;
                font-size: 14px;
                line-height: 1.6;
            }

            .email-content-viewer {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                color: #333;
            }

            .email-header-info {
                background: #f8fafc;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
                border-left: 4px solid var(--primary);
                font-size: 14px;
                color: #6b7280;
            }

            .email-header-info > div {
                margin-bottom: 8px;
            }

            .email-header-info > div:last-child {
                margin-bottom: 0;
            }

            .email-body {
                font-size: 14px;
                line-height: 1.8;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 60px 30px;
                background: rgba(255,255,255,0.8);
                border-radius: 16px;
                box-shadow: var(--shadow);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .empty-state i {
                font-size: 48px;
                margin-bottom: 20px;
                color: #d1d5db;
            }

            .empty-state h3 {
                font-size: 20px;
                font-weight: 700;
                color: var(--text);
                margin: 0 0 24px 0;
            }

            /* Loading */
            .loading {
                text-align: center;
                padding: 60px;
                color: var(--text-secondary);
            }

            .loading i {
                font-size: 32px;
                margin-bottom: 16px;
            }

            /* Toast */
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 500;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s;
                z-index: 10000;
            }

            .toast.show {
                transform: translateY(0);
                opacity: 1;
            }

            .toast.success { color: var(--success); border-left: 4px solid var(--success); }
            .toast.warning { color: var(--warning); border-left: 4px solid var(--warning); }
            .toast.error { color: var(--danger); border-left: 4px solid var(--danger); }
            .toast.info { color: var(--primary); border-left: 4px solid var(--primary); }

            /* Responsive */
            @media (max-width: 1024px) {
                .main-controls {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }

                .search-box {
                    max-width: none;
                }

                .actions {
                    justify-content: center;
                    width: 100%;
                }

                .view-controls {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }

                .view-modes {
                    align-self: center;
                }

                .status-pills {
                    justify-content: center;
                }

                .tasks-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .controls-section {
                    padding: 16px;
                }

                .task-item {
                    padding: 12px;
                }

                .task-info {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }

                .task-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }

                .badges {
                    align-self: flex-end;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .modal-container {
                    margin: 10px;
                }
            }

            @media (max-width: 480px) {
                .tasks-page {
                    padding: 8px;
                }

                .controls-section {
                    padding: 12px;
                }

                .btn {
                    height: 40px;
                    font-size: 12px;
                    padding: 0 12px;
                }

                .task-actions {
                    flex-direction: column;
                    gap: 2px;
                }

                .action-btn {
                    width: 28px;
                    height: 28px;
                    font-size: 11px;
                }

                .status-pills {
                    flex-direction: column;
                    gap: 6px;
                }

                .status-pill {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Global initialization
function initTaskManager() {
    console.log('[TaskManager] Initializing v12.0...');
    
    if (!window.taskManager || !window.taskManager.initialized) {
        window.taskManager = new TaskManager();
    }
    
    if (!window.tasksView) {
        window.tasksView = new TasksView();
    }
    
    // Bind methods
    const bindMethods = (obj, proto) => {
        Object.getOwnPropertyNames(proto).forEach(name => {
            if (name !== 'constructor' && typeof obj[name] === 'function') {
                obj[name] = obj[name].bind(obj);
            }
        });
    };
    
    bindMethods(window.taskManager, TaskManager.prototype);
    bindMethods(window.tasksView, TasksView.prototype);
    
    console.log('✅ TaskManager v12.0 loaded - Optimized with Outlook integration');
}

// Initialize
initTaskManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[TaskManager] DOM ready, ensuring init...');
    initTaskManager();
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.taskManager?.initialized) {
            console.log('[TaskManager] Fallback init...');
            initTaskManager();
        }
    }, 1000);
});
