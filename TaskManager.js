// TaskManager Pro v9.0 - Interface Moderne et Minimaliste
// Structure claire avec regroupement par domaine/expéditeur

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
            console.log('[TaskManager] Initializing v9.0 - Interface moderne...');
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
                client: 'ACME Corp',
                company: 'acme-corp.com',
                emailFrom: 'sarah.martin@acme-corp.com',
                emailFromName: 'Sarah Martin',
                priority: 'high',
                status: 'todo',
                category: 'marketing',
                type: 'email',
                dueDate: '2025-06-10',
                createdAt: new Date().toISOString(),
                hasEmail: true,
                needsReply: true
            },
            {
                id: 'task_2', 
                title: 'Révision contrat partenariat',
                client: 'TechFlow',
                company: 'techflow.io',
                emailFrom: 'legal@techflow.io',
                emailFromName: 'Marie Dubois',
                priority: 'urgent',
                status: 'in-progress',
                category: 'legal',
                type: 'email',
                dueDate: '2025-06-08',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                hasEmail: true,
                needsReply: true
            },
            {
                id: 'task_3',
                title: 'Préparation présentation client',
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
                needsReply: false
            },
            {
                id: 'task_4',
                title: 'Analyse budget Q3',
                client: 'Finance Corp',
                company: 'financecorp.com',
                emailFrom: 'finance@financecorp.com',
                emailFromName: 'Julie Chen',
                priority: 'medium',
                status: 'completed',
                category: 'finance',
                type: 'email',
                dueDate: '2025-06-05',
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                hasEmail: true,
                needsReply: false
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
    }

    createTaskFromEmail(taskData, email = null) {
        console.log('[TaskManager] Creating task from email:', taskData.title);
        
        const taskId = taskData.id || this.generateId();
        
        const task = {
            id: taskId,
            title: taskData.title || 'Nouvelle tâche',
            client: taskData.client || this.extractClient(taskData.emailFrom),
            company: taskData.company || this.extractCompany(taskData.emailFrom),
            emailFrom: taskData.emailFrom || (email?.from?.emailAddress?.address),
            emailFromName: taskData.emailFromName || (email?.from?.emailAddress?.name),
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            category: taskData.category || 'email',
            type: taskData.type || 'email',
            dueDate: taskData.dueDate || null,
            hasEmail: true,
            needsReply: taskData.needsReply !== false,
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.emitTaskUpdate('create', task);
        
        console.log('[TaskManager] Task created successfully:', task.id);
        return task;
    }

    createTask(taskData) {
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title || 'Nouvelle tâche',
            client: taskData.client || 'Client',
            company: taskData.company || 'company.com',
            emailFrom: taskData.emailFrom || null,
            emailFromName: taskData.emailFromName || null,
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            category: taskData.category || 'other',
            type: taskData.type || 'task',
            dueDate: taskData.dueDate || null,
            hasEmail: false,
            needsReply: false,
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
            if (task.needsReply) grouped[key].needsReply++;
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
            needsReply: this.tasks.filter(t => t.needsReply && t.status !== 'completed').length
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
// MODERN MINIMALIST TASKS VIEW
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
        this.viewMode = 'grouped'; // grouped | list
        
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
                    <div class="loading-spinner"></div>
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
            <div class="modern-tasks-app">
                ${this.renderHeader(stats)}
                ${this.renderFilters()}
                ${this.renderTasksContent()}
            </div>
        `;

        this.addModernStyles();
        this.setupEventListeners();
        console.log('[TasksView] Modern minimalist interface rendered');
    }

    renderHeader(stats) {
        return `
            <header class="tasks-header">
                <div class="header-left">
                    <h1 class="page-title">Tâches</h1>
                    <div class="stats-pills">
                        <span class="stat-pill stat-primary">${stats.total} total</span>
                        <span class="stat-pill stat-urgent">${stats.overdue} urgente${stats.overdue > 1 ? 's' : ''}</span>
                        <span class="stat-pill stat-reply">${stats.needsReply} à répondre</span>
                    </div>
                </div>
                
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" 
                               class="search-input" 
                               placeholder="Rechercher..." 
                               value="${this.currentFilters.search}"
                               onInput="window.tasksView.handleSearch(this.value)">
                        <i class="search-icon">🔍</i>
                    </div>
                    
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
            </header>
        `;
    }

    renderFilters() {
        const companies = [...new Set(window.taskManager.getAllTasks().map(t => t.company))].sort();
        const types = [...new Set(window.taskManager.getAllTasks().map(t => t.type))].sort();
        
        return `
            <div class="filters-bar">
                <div class="filter-group">
                    <select class="filter-select" onchange="window.tasksView.updateFilter('status', this.value)">
                        <option value="all" ${this.currentFilters.status === 'all' ? 'selected' : ''}>Tous les statuts</option>
                        <option value="todo" ${this.currentFilters.status === 'todo' ? 'selected' : ''}>À faire</option>
                        <option value="in-progress" ${this.currentFilters.status === 'in-progress' ? 'selected' : ''}>En cours</option>
                        <option value="completed" ${this.currentFilters.status === 'completed' ? 'selected' : ''}>Terminé</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select" onchange="window.tasksView.updateFilter('priority', this.value)">
                        <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>Toutes priorités</option>
                        <option value="urgent" ${this.currentFilters.priority === 'urgent' ? 'selected' : ''}>🔥 Urgente</option>
                        <option value="high" ${this.currentFilters.priority === 'high' ? 'selected' : ''}>🔴 Haute</option>
                        <option value="medium" ${this.currentFilters.priority === 'medium' ? 'selected' : ''}>🟡 Normale</option>
                        <option value="low" ${this.currentFilters.priority === 'low' ? 'selected' : ''}>🟢 Basse</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select" onchange="window.tasksView.updateFilter('company', this.value)">
                        <option value="all" ${this.currentFilters.company === 'all' ? 'selected' : ''}>Toutes sociétés</option>
                        ${companies.map(company => `
                            <option value="${company}" ${this.currentFilters.company === company ? 'selected' : ''}>${company}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select" onchange="window.tasksView.updateFilter('type', this.value)">
                        <option value="all" ${this.currentFilters.type === 'all' ? 'selected' : ''}>Tous types</option>
                        ${types.map(type => `
                            <option value="${type}" ${this.currentFilters.type === type ? 'selected' : ''}>${this.getTypeLabel(type)}</option>
                        `).join('')}
                    </select>
                </div>
                
                <button class="filter-reset" onclick="window.tasksView.resetFilters()">
                    <i class="icon">🔄</i> Reset
                </button>
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
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-right">
                    <div class="task-badges">
                        <span class="type-badge ${task.type}">
                            ${typeIcon} ${this.getTypeLabel(task.type)}
                        </span>
                        
                        ${task.needsReply ? '<span class="reply-badge">📧 Réponse</span>' : ''}
                        
                        ${dueDateInfo.badge ? dueDateInfo.badge : ''}
                    </div>
                    
                    <div class="task-actions">
                        <span class="status-badge ${task.status}">
                            ${statusIcon}
                        </span>
                        
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

    // Event Handlers
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
                        
                        ${task.emailFromName ? `
                            <div class="email-info">
                                <h3>Information email</h3>
                                <p><strong>De:</strong> ${task.emailFromName} (${task.emailFrom})</p>
                                ${task.needsReply ? '<p class="needs-reply">📧 Réponse requise</p>' : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Fermer
                        </button>
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

    createTask() {
        const title = document.getElementById('task-title').value.trim();
        const client = document.getElementById('task-client').value.trim();
        const company = document.getElementById('task-company').value.trim();
        const priority = document.getElementById('task-priority').value;
        const type = document.getElementById('task-type').value;
        const dueDate = document.getElementById('task-duedate').value;

        if (!title) {
            this.showToast('Le titre est requis', 'error');
            return;
        }

        const taskData = {
            title,
            client: client || 'Client',
            company: company || 'company.com',
            priority,
            type,
            dueDate: dueDate || null
        };

        window.taskManager.createTask(taskData);
        document.querySelector('.modal-overlay').remove();
        this.showToast('Tâche créée avec succès', 'success');
    }

    completeTask(taskId) {
        window.taskManager.updateTask(taskId, { status: 'completed' });
        this.showToast('Tâche marquée comme terminée', 'success');
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
            /* Modern Minimalist Task Manager Styles */
            .modern-tasks-app {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #fafbfc;
                min-height: 100vh;
                color: #1a1a1a;
            }

            /* Header */
            .tasks-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 32px;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 24px;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 24px;
            }

            .page-title {
                font-size: 32px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0;
            }

            .stats-pills {
                display: flex;
                gap: 12px;
            }

            .stat-pill {
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                color: white;
            }

            .stat-primary { background: #3b82f6; }
            .stat-urgent { background: #ef4444; }
            .stat-reply { background: #f59e0b; }

            .header-actions {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .search-box {
                position: relative;
            }

            .search-input {
                padding: 12px 16px 12px 44px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 14px;
                width: 280px;
                background: white;
                transition: border-color 0.2s ease;
            }

            .search-input:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 16px;
                color: #6b7280;
            }

            .view-toggle {
                display: flex;
                background: #f3f4f6;
                border-radius: 8px;
                padding: 4px;
            }

            .toggle-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border: none;
                background: transparent;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
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
                padding: 12px 24px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .btn-primary:hover {
                background: #2563eb;
            }

            .btn-secondary {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: white;
                color: #374151;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-secondary:hover {
                border-color: #d1d5db;
                background: #f9fafb;
            }

            /* Filters */
            .filters-bar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 0 32px 24px;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .filter-select {
                padding: 8px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                font-size: 14px;
                color: #374151;
                cursor: pointer;
                min-width: 150px;
            }

            .filter-select:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .filter-reset {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: #f3f4f6;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                color: #6b7280;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .filter-reset:hover {
                background: #e5e7eb;
                color: #374151;
            }

            /* Tasks Container */
            .tasks-container {
                padding: 0 32px;
                max-width: 1200px;
                margin: 0 auto;
            }

            /* Grouped View */
            .task-group {
                background: white;
                border-radius: 12px;
                margin-bottom: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
                overflow: hidden;
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

            .badge.urgent { background: #ef4444; }
            .badge.reply { background: #f59e0b; }

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

            /* Task Cards */
            .task-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .task-card:hover {
                background: #f9fafb;
                transform: translateY(-1px);
            }

            .task-card:last-child {
                border-bottom: none;
            }

            .task-card.completed {
                opacity: 0.6;
            }

            .task-left {
                display: flex;
                align-items: center;
                gap: 16px;
                flex: 1;
            }

            .priority-indicator {
                width: 4px;
                height: 40px;
                border-radius: 2px;
            }

            .task-content {
                flex: 1;
            }

            .task-header {
                margin-bottom: 4px;
            }

            .task-title {
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0 0 4px 0;
            }

            .task-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #6b7280;
            }

            .client-name {
                font-weight: 500;
                color: #374151;
            }

            .separator {
                color: #d1d5db;
            }

            .company-domain {
                font-family: monospace;
                background: #f3f4f6;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
            }

            .sender-info {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
            }

            .task-right {
                display: flex;
                align-items: center;
                gap: 16px;
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
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                color: white;
            }

            .type-badge.email { background: #3b82f6; }
            .type-badge.meeting { background: #10b981; }
            .type-badge.call { background: #f59e0b; }
            .type-badge.task { background: #6b7280; }

            .reply-badge {
                background: #f59e0b;
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
            }

            .due-badge {
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
            }

            .due-badge.overdue {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .due-badge.today {
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fde68a;
            }

            .due-badge.tomorrow {
                background: #ecfdf5;
                color: #059669;
                border: 1px solid #a7f3d0;
            }

            .due-badge.soon {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
            }

            .task-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-badge {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 2px solid;
            }

            .status-badge.todo {
                background: #fef3c7;
                color: #d97706;
                border-color: #fde68a;
            }

            .status-badge.in-progress {
                background: #eff6ff;
                color: #2563eb;
                border-color: #bfdbfe;
            }

            .status-badge.completed {
                background: #ecfdf5;
                color: #059669;
                border-color: #a7f3d0;
            }

            .action-btn {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: #f3f4f6;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .action-btn:hover {
                background: #e5e7eb;
                transform: scale(1.05);
            }

            .quick-complete:hover {
                background: #ecfdf5;
            }

            /* List View */
            .list-view .task-card {
                background: white;
                border-radius: 12px;
                margin-bottom: 8px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 64px 32px;
                color: #6b7280;
            }

            .empty-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .empty-state h3 {
                font-size: 24px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }

            .empty-state p {
                font-size: 16px;
                margin-bottom: 24px;
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
            }

            .task-details-modal,
            .create-task-modal {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
            }

            .modal-header h2 {
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0;
            }

            .close-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: #f3f4f6;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                color: #6b7280;
                transition: all 0.2s ease;
            }

            .close-btn:hover {
                background: #e5e7eb;
                color: #374151;
            }

            .modal-content {
                padding: 24px;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 24px;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .detail-item label {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .detail-item span {
                font-size: 14px;
                color: #1a1a1a;
                font-weight: 500;
            }

            .priority-urgent { color: #ef4444; }
            .priority-high { color: #f97316; }
            .priority-medium { color: #eab308; }
            .priority-low { color: #22c55e; }

            .status-todo { color: #d97706; }
            .status-in-progress { color: #2563eb; }
            .status-completed { color: #059669; }

            .email-info {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
            }

            .email-info h3 {
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0 0 12px 0;
            }

            .needs-reply {
                color: #f59e0b;
                font-weight: 600;
                font-size: 14px;
            }

            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 24px;
                border-top: 1px solid #e5e7eb;
            }

            /* Form Styles */
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

            .form-input,
            .form-select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                background: white;
                transition: border-color 0.2s ease;
            }

            .form-input:focus,
            .form-select:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }

            /* Loading State */
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 64px 32px;
                color: #6b7280;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Toast */
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 100000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .toast.show {
                transform: translateY(0);
                opacity: 1;
            }

            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            .toast-info { background: #3b82f6; }

            /* Responsive */
            @media (max-width: 768px) {
                .tasks-header {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                    padding: 16px;
                }

                .header-left {
                    justify-content: center;
                }

                .header-actions {
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .search-input {
                    width: 100%;
                    max-width: 280px;
                }

                .filters-bar {
                    flex-wrap: wrap;
                    padding: 0 16px 16px;
                }

                .tasks-container {
                    padding: 0 16px;
                }

                .task-card {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                }

                .task-right {
                    width: 100%;
                    justify-content: space-between;
                }

                .detail-grid {
                    grid-template-columns: 1fr;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================================
// GLOBAL INITIALIZATION
// =====================================
function initializeModernTaskManager() {
    console.log('[TaskManager] Initializing modern interface v9.0...');
    
    if (!window.taskManager || !window.taskManager.initialized) {
        window.taskManager = new TaskManager();
    }
    
    if (!window.tasksView) {
        window.tasksView = new TasksView();
    }
    
    // Bind methods
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
    
    console.log('✅ TaskManager v9.0 - Interface moderne et minimaliste chargé');
}

// Initialize immediately and on DOM ready
initializeModernTaskManager();

document.addEventListener('DOMContentLoaded', initializeModernTaskManager);
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.taskManager || !window.taskManager.initialized) {
            initializeModernTaskManager();
        }
    }, 1000);
});
