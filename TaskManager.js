// TaskManager Pro v12.0 - Version FINALE optimisée avec intégration Outlook
console.log('🚀 TaskManager v12.0 FINALE - Bouton Répondre à l\'email en premier!');

class TaskManager {
    constructor() {
        this.tasks = [];
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('[TaskManager] Initializing v12.0 FINALE...');
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
                description: 'Email de Sarah Martin concernant la validation de la campagne marketing Q2.',
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

    filterTasks(filters = {}) {
        let filtered = [...this.tasks];
        
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(t => t.status === filters.status);
        }
        
        if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }
        
        if (filters.client && filters.client !== 'all') {
            filtered = filtered.filter(t => t.client === filters.client);
        }
        
        if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(s) || 
                t.description.toLowerCase().includes(s) ||
                (t.client && t.client.toLowerCase().includes(s))
            );
        }
        
        if (filters.overdue) {
            filtered = filtered.filter(t => 
                t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date()
            );
        }
        
        if (filters.needsReply) {
            filtered = filtered.filter(t => 
                t.needsReply || (t.hasEmail && !t.emailReplied && t.status !== 'completed')
            );
        }
        
        return this.sortTasks(filtered, filters.sortBy || 'created');
    }

    sortTasks(tasks, sortBy) {
        const sorted = [...tasks];
        
        switch (sortBy) {
            case 'priority':
                const order = { urgent: 0, high: 1, medium: 2, low: 3 };
                sorted.sort((a, b) => order[a.priority] - order[b.priority]);
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
            case 'client':
                sorted.sort((a, b) => a.client.localeCompare(b.client));
                break;
            case 'created':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return sorted;
    }

    getAllClients() {
        const clients = new Set(['Interne']);
        this.tasks.forEach(task => {
            if (task.client && task.client.trim()) {
                clients.add(task.client.trim());
            }
        });
        return Array.from(clients).sort();
    }

    getStats() {
        const stats = {
            total: this.tasks.length,
            todo: 0,
            'in-progress': 0,
            relance: 0,
            bloque: 0,
            reporte: 0,
            completed: 0,
            overdue: 0,
            needsReply: 0
        };
        
        this.tasks.forEach(task => {
            stats[task.status]++;
            
            if (task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date()) {
                stats.overdue++;
            }
            
            if (task.needsReply || (task.hasEmail && !task.emailReplied && task.status !== 'completed')) {
                stats.needsReply++;
            }
        });
        
        return stats;
    }

    // Utilities
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractEmailInfo(email, taskData) {
        const info = {
            emailFrom: email?.from?.emailAddress?.address || email?.from?.address || taskData.emailFrom,
            emailFromName: email?.from?.emailAddress?.name || email?.from?.name || taskData.emailFromName,
            emailSubject: email?.subject || taskData.emailSubject,
            emailDate: email?.receivedDateTime || taskData.emailDate,
            emailDomain: null,
            client: null
        };
        
        if (info.emailFrom) {
            info.emailDomain = info.emailFrom.split('@')[1];
        }
        
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

// TasksView - UI Optimized
class TasksView {
    constructor() {
        this.filters = {
            status: 'all',
            priority: 'all',
            client: 'all',
            search: '',
            sortBy: 'created'
        };
        
        this.selectedTasks = new Set();
        this.viewMode = 'normal';
        this.showFilters = false;
        
        window.addEventListener('taskUpdate', () => this.refreshView());
    }

    render(container) {
        if (!container) return;
        
        if (!window.taskManager?.initialized) {
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement...</p></div>';
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
                            </div>
                        ` : ''}
                        
                        <button class="btn btn-new" onclick="window.tasksView.showCreateModal()">
                            <i class="fas fa-plus"></i> Nouvelle tâche
                        </button>
                        
                        <button class="btn btn-filters ${this.showFilters ? 'active' : ''}" 
                                onclick="window.tasksView.toggleFilters()">
                            <i class="fas fa-filter"></i> Filtres
                        </button>
                    </div>
                </div>
                
                <div class="status-pills">
                    ${this.renderStatusPills(stats)}
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
                        <select onchange="window.tasksView.updateFilter('priority', this.value)">
                            <option value="all">Toutes</option>
                            <option value="urgent" ${this.filters.priority === 'urgent' ? 'selected' : ''}>🚨 Urgente</option>
                            <option value="high" ${this.filters.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                            <option value="medium" ${this.filters.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                            <option value="low" ${this.filters.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-building"></i> Client</label>
                        <select onchange="window.tasksView.updateFilter('client', this.value)">
                            <option value="all">Tous</option>
                            ${window.taskManager.getAllClients().map(client => `
                                <option value="${this.escape(client)}" ${this.filters.client === client ? 'selected' : ''}>
                                    ${this.escape(client)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-sort"></i> Trier par</label>
                        <select onchange="window.tasksView.updateFilter('sortBy', this.value)">
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
        const filtered = tasks.filter(t => t.status !== 'completed' || this.filters.status === 'completed');
        
        if (filtered.length === 0) {
            return '<div class="empty-state"><i class="fas fa-tasks"></i><h3>Aucune tâche</h3></div>';
        }

        return `<div class="tasks-list">
            ${filtered.map(task => this.renderTask(task)).join('')}
        </div>`;
    }

    renderTask(task) {
        const selected = this.selectedTasks.has(task.id);
        const due = this.formatDueDate(task.dueDate);
        
        return `
            <div class="task-item ${task.status === 'completed' ? 'completed' : ''} ${selected ? 'selected' : ''}" 
                 data-id="${task.id}">
                <input type="checkbox" ${selected ? 'checked' : ''} 
                       onclick="window.tasksView.toggleSelect('${task.id}')">
                <div class="task-info">
                    <div class="task-header">
                        <h3>${this.escape(task.title)}</h3>
                        <div class="badges">
                            <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                            ${task.hasEmail && task.needsReply && !task.emailReplied ? 
                                '<span class="reply-badge">📧 À répondre</span>' : ''}
                        </div>
                    </div>
                    <div class="task-meta">
                        <span class="client">${this.escape(task.client)}</span>
                        <span class="due ${due.class}">${due.text}</span>
                    </div>
                </div>
                ${this.renderActions(task)}
            </div>
        `;
    }

    renderActions(task) {
        console.log('🎯 Rendering actions for task:', task.title, 'hasEmail:', task.hasEmail, 'emailFrom:', task.emailFrom);
        
        const actions = [];
        
        // BOUTON RÉPONDRE EN PREMIER POUR LES EMAILS
        if (task.hasEmail && task.emailFrom) {
            actions.push(`<button class="action-btn reply" 
                    onclick="event.stopPropagation(); window.tasksView.openInOutlook('${task.id}')" 
                    title="Répondre à l'email">
                <i class="fas fa-reply"></i>
            </button>`);
        }
        
        if (task.status !== 'completed') {
            actions.push(`<button class="action-btn complete" 
                    onclick="event.stopPropagation(); window.tasksView.complete('${task.id}')" 
                    title="Terminer">
                <i class="fas fa-check"></i>
            </button>`);
        }
        
        actions.push(`<button class="action-btn edit" 
                onclick="event.stopPropagation(); window.tasksView.showEditModal('${task.id}')" 
                title="Modifier">
            <i class="fas fa-edit"></i>
        </button>`);
        
        actions.push(`<button class="action-btn details" 
                onclick="event.stopPropagation(); window.tasksView.showDetails('${task.id}')" 
                title="Détails">
            <i class="fas fa-eye"></i>
        </button>`);
        
        return `<div class="task-actions">${actions.join('')}</div>`;
    }

    // MÉTHODE POUR OUVRIR DANS OUTLOOK
    openInOutlook(taskId) {
        console.log('📧 Opening email in Outlook for task:', taskId);
        const task = window.taskManager.getTask(taskId);
        if (!task || !task.hasEmail) return;
        
        const subject = `Re: ${task.emailSubject || 'Sans sujet'}`;
        const to = task.emailFrom;
        const body = `\n\n\n-----Message d'origine-----\nDe: ${task.emailFromName || task.emailFrom}\nDate: ${task.emailDate ? new Date(task.emailDate).toLocaleString('fr-FR') : ''}\nSujet: ${task.emailSubject || ''}\n\n${task.emailContent || ''}`;
        
        const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        console.log('📬 Opening mailto URL');
        window.open(mailtoUrl);
        
        // Marquer comme répondu
        window.taskManager.updateTask(taskId, { 
            emailReplied: true,
            needsReply: false,
            status: task.status === 'todo' ? 'in-progress' : task.status
        });
        
        this.showToast('Email ouvert dans votre client mail', 'success');
        this.refreshView();
    }

    // Modal Methods
    showCreateModal() {
        this.showModal('Créer une tâche', this.renderTaskForm(), () => {
            const data = this.getFormData();
            if (!data.title) {
                this.showToast('Le titre est requis', 'warning');
                return false;
            }
            
            window.taskManager.createTask(data);
            this.showToast('Tâche créée', 'success');
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
    }

    showDetails(taskId) {
        const task = window.taskManager.getTask(taskId);
        if (!task) return;
        
        const content = this.renderTaskDetails(task);
        
        this.showModal('Détails de la tâche', content, null, {
            footer: `
                ${task.hasEmail && task.emailFrom ? `
                    <button class="btn btn-reply" onclick="window.tasksView.openInOutlook('${task.id}')">
                        <i class="fas fa-reply"></i> Répondre à l'email
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="window.tasksView.closeModal()">Fermer</button>
                <button class="btn btn-primary" onclick="window.tasksView.closeModal(); window.tasksView.showEditModal('${task.id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
            `
        });
    }

    renderTaskForm(task = {}) {
        return `
            <form id="taskForm" class="task-form">
                <div class="form-group">
                    <label>Titre *</label>
                    <input type="text" id="title" value="${this.escape(task.title || '')}" required>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="description" rows="3">${this.escape(task.description || '')}</textarea>
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
                            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Terminé</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Client</label>
                        <input type="text" id="client" value="${this.escape(task.client || 'Interne')}">
                    </div>
                    <div class="form-group">
                        <label>Échéance</label>
                        <input type="date" id="dueDate" value="${task.dueDate || ''}">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3><i class="fas fa-check-square"></i> Checklist</h3>
                    <div id="checklist" class="checklist-container">
                        ${(task.checklist || []).map(item => `
                            <div class="checklist-item">
                                <input type="checkbox" ${item.completed ? 'checked' : ''}>
                                <input type="text" value="${this.escape(item.text)}" placeholder="Tâche...">
                                <button type="button" onclick="this.parentElement.remove()">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn-add" onclick="window.tasksView.addChecklistItem()">
                        <i class="fas fa-plus"></i> Ajouter
                    </button>
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
                    </div>
                </div>
                
                ${task.checklist?.length > 0 ? `
                    <div class="section">
                        <h3><i class="fas fa-check-square"></i> Checklist</h3>
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
                    </div>
                </div>
                
                ${task.hasEmail ? `
                    <div class="section">
                        <h3><i class="fas fa-envelope"></i> Email</h3>
                        <div class="email-details">
                            <div><strong>De:</strong> ${this.escape(task.emailFromName || task.emailFrom || '')}</div>
                            <div><strong>Sujet:</strong> ${this.escape(task.emailSubject || '')}</div>
                            <div><strong>Date:</strong> ${task.emailDate ? new Date(task.emailDate).toLocaleString('fr-FR') : ''}</div>
                            <div><strong>Répondu:</strong> ${task.emailReplied ? '✅ Oui' : '❌ Non'}</div>
                        </div>
                        ${task.emailContent ? `
                            <div class="email-content">
                                <div class="email-box">${task.emailHtmlContent || this.escape(task.emailContent).replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Utility Methods
    showModal(title, content, onSave, options = {}) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        
        const modalId = 'modal_' + Date.now();
        const html = `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal-container">
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
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i><span>${message}</span>`;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Form helpers
    getFormData() {
        const form = document.getElementById('taskForm');
        if (!form) return {};
        
        return {
            title: form.querySelector('#title').value.trim(),
            description: form.querySelector('#description').value.trim(),
            priority: form.querySelector('#priority').value,
            status: form.querySelector('#status').value,
            client: form.querySelector('#client').value.trim() || 'Interne',
            dueDate: form.querySelector('#dueDate').value || null,
            checklist: this.getChecklistData()
        };
    }

    addChecklistItem() {
        const container = document.getElementById('checklist');
        if (!container) return;
        
        container.insertAdjacentHTML('beforeend', `
            <div class="checklist-item">
                <input type="checkbox">
                <input type="text" placeholder="Nouvelle tâche...">
                <button type="button" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `);
    }

    getChecklistData() {
        const items = [];
        document.querySelectorAll('#checklist .checklist-item').forEach(item => {
            const text = item.querySelector('input[type="text"]').value.trim();
            if (text) {
                items.push({
                    id: 'cl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    text,
                    completed: item.querySelector('input[type="checkbox"]').checked
                });
            }
        });
        return items;
    }

    // Event handlers
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
    toggleSelect(taskId) {
        if (this.selectedTasks.has(taskId)) {
            this.selectedTasks.delete(taskId);
        } else {
            this.selectedTasks.add(taskId);
        }
        this.refreshView();
    }

    clearSelection() {
        this.selectedTasks.clear();
        this.refreshView();
    }

    complete(taskId) {
        window.taskManager.updateTask(taskId, { 
            status: 'completed',
            completedAt: new Date().toISOString()
        });
        this.showToast('Tâche terminée', 'success');
    }

    // Filters
    quickFilter(id) {
        this.filters = { ...this.filters, status: 'all', overdue: false, needsReply: false };
        
        switch (id) {
            case 'todo':
            case 'in-progress':
            case 'relance':
            case 'completed':
                this.filters.status = id;
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

    clearSearch() {
        this.filters.search = '';
        this.refreshView();
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
            case 'all': return this.filters.status === 'all' && !this.filters.needsReply;
            case 'todo': return this.filters.status === 'todo';
            case 'in-progress': return this.filters.status === 'in-progress';
            case 'relance': return this.filters.status === 'relance';
            case 'completed': return this.filters.status === 'completed';
            case 'needsReply': return this.filters.needsReply;
            default: return false;
        }
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
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .selection-info {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #dbeafe;
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
            }

            .btn:hover {
                background: var(--bg-secondary);
                border-color: var(--primary);
                transform: translateY(-1px);
                box-shadow: var(--shadow-lg);
            }

            .btn-new {
                background: var(--primary);
                color: white;
                border: none;
            }

            .btn-new:hover {
                background: var(--primary-hover);
            }

            .btn-clear {
                width: 44px;
                padding: 0;
                background: var(--bg-secondary);
            }

            .btn-filters.active {
                background: #eff6ff;
                color: var(--primary);
                border-color: var(--primary);
            }

            .status-pills {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
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
            }

            .status-pill:hover {
                border-color: var(--primary);
                background: #f0f9ff;
                transform: translateY(-1px);
            }

            .status-pill.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .status-pill .count {
                background: rgba(0,0,0,0.1);
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 10px;
            }

            /* Filters */
            .filters-panel {
                background: rgba(255,255,255,0.95);
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

            .filter-group label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 600;
                font-size: 12px;
                margin-bottom: 6px;
            }

            .filter-group select {
                width: 100%;
                height: 44px;
                padding: 0 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: white;
                font-size: 13px;
                cursor: pointer;
            }

            .btn-reset {
                background: var(--bg-secondary);
                color: var(--text-secondary);
            }

            /* Tasks List */
            .tasks-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: rgba(255,255,255,0.8);
                border-radius: 12px;
                padding: 8px;
            }

            .task-item {
                background: white;
                border-radius: 8px;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s;
                cursor: pointer;
            }

            .task-item:hover {
                transform: translateY(-1px);
                box-shadow: var(--shadow-lg);
            }

            .task-item.selected {
                background: #eff6ff;
                border: 1px solid var(--primary);
            }

            .task-item.completed {
                opacity: 0.6;
            }

            .task-item.completed h3 {
                text-decoration: line-through;
            }

            .task-info {
                flex: 1;
            }

            .task-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .task-header h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: var(--text);
            }

            .badges {
                display: flex;
                gap: 6px;
            }

            .status-badge,
            .reply-badge {
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
            }

            .status-badge.todo { background: #fef3c7; color: #d97706; }
            .status-badge.in-progress { background: #eff6ff; color: #2563eb; }
            .status-badge.relance { background: #fef2f2; color: #dc2626; }
            .status-badge.completed { background: #f0fdf4; color: #16a34a; }

            .reply-badge {
                background: #fef2f2;
                color: #dc2626;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .task-meta {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: var(--text-secondary);
            }

            .due.overdue { color: var(--danger); font-weight: 600; }
            .due.today { color: var(--warning); font-weight: 600; }
            .due.tomorrow { color: var(--warning); }
            .due.week { color: var(--primary); }

            /* Actions */
            .task-actions {
                display: flex;
                gap: 4px;
            }

            .action-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .action-btn:hover {
                transform: translateY(-1px);
            }

            .action-btn.reply {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
                font-weight: bold;
            }

            .action-btn.reply:hover {
                background: var(--primary-hover);
                transform: scale(1.1);
            }

            .action-btn.complete:hover { 
                background: #dcfce7; 
                border-color: var(--success); 
                color: var(--success); 
            }

            .action-btn.edit:hover { 
                background: #fef3c7; 
                border-color: var(--warning); 
                color: var(--warning); 
            }

            .action-btn.details:hover { 
                background: #f3e8ff; 
                border-color: #8b5cf6; 
                color: #8b5cf6; 
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
            }

            .modal-container {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
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
            }

            .modal-header .close:hover {
                background: var(--bg-secondary);
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

            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text);
            }

            .btn-primary {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-primary:hover {
                background: var(--primary-hover);
            }

            .btn-reply {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-reply:hover {
                background: var(--primary-hover);
            }

            /* Forms */
            .task-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .form-group label {
                font-weight: 600;
                font-size: 14px;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                padding: 12px;
                border: 2px solid var(--border);
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }

            .form-section {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--border);
            }

            .form-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .checklist-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .checklist-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 6px;
            }

            .checklist-item input[type="checkbox"] {
                width: 16px;
                height: 16px;
            }

            .checklist-item input[type="text"] {
                flex: 1;
                border: none;
                background: transparent;
                padding: 4px;
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
            }

            .btn-add {
                background: #8b5cf6;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .btn-add:hover {
                background: #7c3aed;
            }

            /* Task Details */
            .task-details {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .details-header h1 {
                margin: 0 0 12px 0;
                font-size: 24px;
                font-weight: 700;
            }

            .meta-badges {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .priority-badge,
            .due-badge {
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
            }

            .priority-badge.urgent { background: #fef2f2; color: #dc2626; }
            .priority-badge.high { background: #fef3c7; color: #d97706; }
            .priority-badge.medium { background: #eff6ff; color: #2563eb; }
            .priority-badge.low { background: #f0fdf4; color: #16a34a; }

            .due-badge.overdue { background: #fef2f2; color: #dc2626; }
            .due-badge.today { background: #fef3c7; color: #d97706; }
            .due-badge.tomorrow { background: #fef3c7; color: #d97706; }
            .due-badge.week { background: #eff6ff; color: #2563eb; }
            .due-badge.normal { background: var(--bg-secondary); color: #64748b; }
            .due-badge.no-due { background: var(--bg-secondary); color: #9ca3af; font-style: italic; }

            .section {
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
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .checklist-progress {
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .progress-bar {
                flex: 1;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: #8b5cf6;
                transition: width 0.3s;
            }

            .checklist-items {
                padding: 0 20px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .checklist-items .checklist-item.completed {
                background: #f0fdf4;
                border-color: #bbf7d0;
            }

            .checklist-items .checklist-item.completed span {
                text-decoration: line-through;
                color: #6b7280;
            }

            .info-grid {
                padding: 16px 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
            }

            .info-grid > div {
                display: flex;
                gap: 8px;
                font-size: 14px;
            }

            .email-details {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .email-details > div {
                display: flex;
                gap: 8px;
                font-size: 14px;
            }

            .email-content {
                padding: 0 20px 16px;
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

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 60px;
                background: rgba(255,255,255,0.8);
                border-radius: 16px;
            }

            .empty-state i {
                font-size: 48px;
                color: #d1d5db;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 20px;
                font-weight: 700;
                color: var(--text);
                margin: 0;
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
            @media (max-width: 768px) {
                .main-controls {
                    flex-direction: column;
                    gap: 12px;
                }

                .search-box {
                    max-width: none;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .status-pills {
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Global initialization FINALE
function initTaskManagerFinal() {
    console.log('[TaskManager] 🚀 Initializing v12.0 FINALE...');
    
    // Nettoyer les anciennes instances
    if (window.taskManager) {
        console.log('[TaskManager] ⚠️ Suppression ancienne instance');
        delete window.taskManager;
    }
    
    if (window.tasksView) {
        console.log('[TaskManager] ⚠️ Suppression ancienne vue');
        delete window.tasksView;
    }
    
    // Créer les nouvelles instances
    window.taskManager = new TaskManager();
    window.tasksView = new TasksView();
    
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
    
    console.log('✅ TaskManager v12.0 FINALE loaded - Bouton Répondre à l\'email visible!');
}

// Forcer l'initialisation immédiate
initTaskManagerFinal();

// S'assurer que c'est bien chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('[TaskManager] DOM ready - v12.0 FINALE');
    if (!window.taskManager || !window.taskManager.initialized) {
        initTaskManagerFinal();
    }
});

// Fallback
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.taskManager || !window.taskManager.initialized) {
            console.log('[TaskManager] Fallback init - v12.0 FINALE');
            initTaskManagerFinal();
        }
    }, 1000);
});
