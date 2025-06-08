// PageManager.js - Version 11.0 - Interface moderne épurée avec détails dans la ligne

class PageManager {
    constructor() {
        // Core state
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.temporaryEmailStorage = [];
        this.lastScanData = null;
        
        // Page renderers
        this.pages = {
            dashboard: (container) => this.renderDashboard(container),
            scanner: (container) => this.renderScanner(container),
            emails: (container) => this.renderEmails(container),
            tasks: (container) => this.renderTasks(container),
            categories: (container) => this.renderCategories(container),
            settings: (container) => this.renderSettings(container)
        };
        
        this.init();
    }

    init() {
        console.log('[PageManager] Initialized v11.0 - Interface moderne épurée');
    }

    // =====================================
    // PAGE LOADING
    // =====================================
    async loadPage(pageName) {
        console.log(`[PageManager] Loading page: ${pageName}`);

        const pageContent = document.getElementById('pageContent');
        if (!pageContent) {
            console.error('[PageManager] Page content container not found');
            return;
        }

        this.updateNavigation(pageName);
        window.uiManager.showLoading(`Chargement ${pageName}...`);

        try {
            pageContent.innerHTML = '';
            
            if (this.pages[pageName]) {
                await this.pages[pageName](pageContent);
                this.currentPage = pageName;
            } else {
                throw new Error(`Page ${pageName} not found`);
            }

            window.uiManager.hideLoading();

        } catch (error) {
            console.error(`[PageManager] Error loading page:`, error);
            window.uiManager.hideLoading();
            window.uiManager.showToast(`Erreur: ${error.message}`, 'error');
            
            pageContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="empty-state-title">Erreur de chargement</h3>
                    <p class="empty-state-text">${error.message}</p>
                    <button class="btn btn-primary" onclick="window.pageManager.loadPage('dashboard')">
                        Retour au tableau de bord
                    </button>
                </div>
            `;
        }
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // =====================================
    // EMAILS PAGE - INTERFACE MODERNE ÉPURÉE
    // =====================================
    async renderEmails(container) {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        const categories = window.categoryManager?.getCategories() || {};
        
        // Initialize view mode
        this.currentViewMode = this.currentViewMode || 'grouped-domain';
        this.currentCategory = this.currentCategory || 'all';

        const renderEmailsPage = () => {
            const categoryCounts = this.calculateCategoryCounts(emails);
            const totalEmails = emails.length;
            const selectedCount = this.selectedEmails.size;
            
            container.innerHTML = `
                <!-- HEADER INFORMATIF MODERNE -->
                <div class="modern-header">
                    <div class="header-info">
                        <i class="fas fa-info-circle info-icon"></i>
                        <span class="info-text">
                            ${selectedCount > 0 ? 
                                `${selectedCount} email${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}. Créez des tâches ou modifiez la sélection.` :
                                this.currentCategory === 'all' ? 
                                    `Visualisez vos ${totalEmails} emails par domaine, expéditeur ou en liste complète. Sélectionnez des emails pour créer des tâches.` :
                                    `Affichage de la catégorie "${this.getCategoryDisplayName(this.currentCategory)}". Utilisez les filtres pour naviguer entre les catégories.`
                            }
                        </span>
                    </div>
                    <div class="header-actions">
                        <button class="btn-select-all" onclick="window.pageManager.selectAllVisible()">
                            <i class="fas fa-check-square"></i> Sélectionner tout
                        </button>
                        <button class="btn-deselect-all" onclick="window.pageManager.clearSelection()">
                            <i class="fas fa-square"></i> Désélectionner tout
                        </button>
                    </div>
                </div>

                <!-- BARRE DE CONTRÔLES ÉPURÉE -->
                <div class="controls-bar">
                    <!-- Recherche -->
                    <div class="search-section">
                        <div class="search-box">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   class="search-input" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher emails..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Modes de vue -->
                    <div class="view-modes">
                        <button class="view-mode ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-domain')"
                                title="Par domaine">
                            <i class="fas fa-globe"></i>
                            <span>Par domaine</span>
                        </button>
                        <button class="view-mode ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-sender')"
                                title="Par expéditeur">
                            <i class="fas fa-user"></i>
                            <span>Par expéditeur</span>
                        </button>
                        <button class="view-mode ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('flat')"
                                title="Liste complète">
                            <i class="fas fa-list"></i>
                            <span>Liste</span>
                        </button>
                    </div>
                    
                    <!-- Actions -->
                    <div class="action-buttons">
                        <button class="btn-create-tasks ${selectedCount > 0 ? 'has-selection' : ''}" 
                                onclick="${selectedCount > 0 ? 'window.pageManager.createTasksFromSelection()' : 'window.pageManager.createTasksFromAllVisible()'}">
                            <i class="fas fa-tasks"></i>
                            <span>${selectedCount > 0 ? `Créer ${selectedCount} tâche${selectedCount > 1 ? 's' : ''}` : 'Créer tâches'}</span>
                            ${selectedCount > 0 ? `<span class="count-badge">${selectedCount}</span>` : ''}
                        </button>
                        
                        <button class="btn-refresh" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                <!-- FILTRES DE CATÉGORIES -->
                <div class="category-tabs">
                    ${this.buildCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <!-- CONTENU DES EMAILS -->
                <div class="emails-container">
                    ${this.renderEmailsList()}
                </div>
            `;

            this.addModernStyles();
            this.setupEmailsEventListeners();
        };

        renderEmailsPage();
        
        // Auto-analyze if enabled
        if (this.autoAnalyzeEnabled && emails.length > 0) {
            setTimeout(() => {
                this.analyzeFirstEmails(emails.slice(0, 5));
            }, 1000);
        }
    }

    // =====================================
    // FILTRES DE CATÉGORIES
    // =====================================
    buildCategoryTabs(categoryCounts, totalEmails, categories) {
        let tabs = `
            <button class="category-tab ${this.currentCategory === 'all' ? 'active' : ''}" 
                    onclick="window.pageManager.filterByCategory('all')">
                <span class="tab-icon">📧</span>
                <span class="tab-name">Tous</span>
                <span class="tab-count">${totalEmails}</span>
            </button>
        `;
        
        Object.entries(categories).forEach(([catId, category]) => {
            const count = categoryCounts[catId] || 0;
            if (count > 0) {
                tabs += `
                    <button class="category-tab ${this.currentCategory === catId ? 'active' : ''}" 
                            onclick="window.pageManager.filterByCategory('${catId}')"
                            style="--category-color: ${category.color}">
                        <span class="tab-icon">${category.icon}</span>
                        <span class="tab-name">${category.name}</span>
                        <span class="tab-count">${count}</span>
                    </button>
                `;
            }
        });
        
        const otherCount = categoryCounts.other || 0;
        if (otherCount > 0) {
            tabs += `
                <button class="category-tab ${this.currentCategory === 'other' ? 'active' : ''}" 
                        onclick="window.pageManager.filterByCategory('other')">
                    <span class="tab-icon">📌</span>
                    <span class="tab-name">Autre</span>
                    <span class="tab-count">${otherCount}</span>
                </button>
            `;
        }
        
        return tabs;
    }

    // =====================================
    // RENDU DES EMAILS
    // =====================================
    renderEmailsList() {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        let filteredEmails = emails;
        
        // Apply filters
        if (this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        if (filteredEmails.length === 0) {
            return this.renderEmptyState();
        }

        switch (this.currentViewMode) {
            case 'flat':
                return this.renderFlatView(filteredEmails);
            case 'grouped-domain':
            case 'grouped-sender':
                return this.renderGroupedView(filteredEmails, this.currentViewMode);
            default:
                return this.renderFlatView(filteredEmails);
        }
    }

    renderEmptyState() {
        return `
            <div class="empty-view">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-title">Aucun email trouvé</h3>
                <p class="empty-subtitle">
                    ${this.searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun email dans cette catégorie'}
                </p>
                ${this.searchTerm ? `
                    <button class="btn-clear-search" onclick="window.pageManager.clearSearch()">
                        <i class="fas fa-undo"></i>
                        <span>Effacer la recherche</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderFlatView(emails) {
        return `
            <div class="emails-flat-list">
                ${emails.map(email => this.renderModernEmailRow(email)).join('')}
            </div>
        `;
    }

    renderModernEmailRow(email) {
        const isSelected = this.selectedEmails.has(email.id);
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || '';
        
        // Générer couleur pour l'avatar
        const avatarColor = this.generateAvatarColor(senderName);
        
        return `
            <div class="email-row ${isSelected ? 'selected' : ''} ${hasTask ? 'has-task' : ''}" 
                 data-email-id="${email.id}"
                 onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                
                <!-- Checkbox de sélection -->
                <div class="email-checkbox">
                    <input type="checkbox" 
                           ${isSelected ? 'checked' : ''}
                           onclick="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                </div>
                
                <!-- Avatar de l'expéditeur -->
                <div class="email-avatar" style="background: ${avatarColor}">
                    ${senderName.charAt(0).toUpperCase()}
                </div>
                
                <!-- Informations de l'expéditeur -->
                <div class="email-sender-info">
                    <div class="sender-name">${this.escapeHtml(senderName)}</div>
                    <div class="sender-email">${this.escapeHtml(senderEmail)}</div>
                </div>
                
                <!-- Sujet de l'email -->
                <div class="email-subject">
                    <div class="subject-text">${this.escapeHtml(email.subject || 'Sans sujet')}</div>
                    <div class="email-preview">${this.escapeHtml(email.bodyPreview || '').substring(0, 100)}${email.bodyPreview && email.bodyPreview.length > 100 ? '...' : ''}</div>
                </div>
                
                <!-- Badges et indicateurs -->
                <div class="email-badges">
                    ${email.hasAttachments ? '<span class="badge attachment"><i class="fas fa-paperclip"></i></span>' : ''}
                    ${email.importance === 'high' ? '<span class="badge priority"><i class="fas fa-exclamation"></i></span>' : ''}
                    ${hasTask ? '<span class="badge task-created"><i class="fas fa-check"></i> Tâche</span>' : ''}
                </div>
                
                <!-- Date de réception -->
                <div class="email-date">
                    ${this.formatEmailDate(email.receivedDateTime)}
                </div>
                
                <!-- Actions rapides -->
                <div class="email-actions" onclick="event.stopPropagation()">
                    ${!hasTask ? `
                        <button class="action-btn create-task" 
                                onclick="window.pageManager.showTaskCreationModal('${email.id}')"
                                title="Créer une tâche">
                            <i class="fas fa-tasks"></i>
                        </button>
                    ` : `
                        <button class="action-btn view-task" 
                                onclick="window.pageManager.openCreatedTask('${email.id}')"
                                title="Voir la tâche">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    `}
                    <button class="action-btn view-email" 
                            onclick="window.pageManager.showEmailModal('${email.id}')"
                            title="Voir l'email">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="emails-grouped-list">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
    }

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="email-group" data-group-key="${group.key}">
                <div class="group-header" onclick="window.pageManager.toggleGroup('${group.key}')">
                    <div class="group-avatar" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info">
                        <div class="group-name">${displayName}</div>
                        <div class="group-meta">${group.count} email${group.count > 1 ? 's' : ''} • ${this.formatEmailDate(group.latestDate)}</div>
                    </div>
                    <div class="group-expand">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content" style="display: none;">
                    ${group.emails.map(email => this.renderModernEmailRow(email)).join('')}
                </div>
            </div>
        `;
    }

    // =====================================
    // ÉVÉNEMENTS ET HANDLERS
    // =====================================
    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') return;
        if (event.target.closest('.email-actions')) return;
        this.showEmailModal(emailId);
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        
        // Update buttons
        document.querySelectorAll('.view-mode').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.view-mode').classList.add('active');
        
        // Re-render
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    filterByCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Re-render
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    toggleEmailSelection(emailId) {
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
        } else {
            this.selectedEmails.add(emailId);
        }
        this.renderEmails(document.getElementById('pageContent'));
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.renderEmails(document.getElementById('pageContent'));
    }

    selectAllVisible() {
        const emails = this.getVisibleEmails();
        emails.forEach(email => {
            this.selectedEmails.add(email.id);
        });
        
        this.renderEmails(document.getElementById('pageContent'));
        window.uiManager.showToast(`${emails.length} emails sélectionnés`, 'success');
    }

    toggleGroup(groupKey) {
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) return;
        
        const content = group.querySelector('.group-content');
        const icon = group.querySelector('.group-expand i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
        }
    }

    setupEmailsEventListeners() {
        const searchInput = document.getElementById('emailSearchInput');
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

    handleSearch(term) {
        this.searchTerm = term.trim();
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) searchInput.value = '';
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    // =====================================
    // STYLES MODERNES ÉPURÉS
    // =====================================
    addModernStyles() {
        if (document.getElementById('modernEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modernEmailStyles';
        styles.textContent = `
            /* ===== RESET & BASE ===== */
            * {
                box-sizing: border-box;
            }
            
            /* ===== HEADER INFORMATIF MODERNE ===== */
            .modern-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #0ea5e9;
                border-radius: 12px;
                padding: 16px 20px;
                margin-bottom: 20px;
            }
            
            .header-info {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            
            .info-icon {
                color: #0ea5e9;
                font-size: 18px;
            }
            
            .info-text {
                color: #075985;
                font-weight: 600;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .header-actions {
                display: flex;
                gap: 8px;
            }
            
            .btn-select-all,
            .btn-deselect-all {
                display: flex;
                align-items: center;
                gap: 6px;
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                transition: all 0.2s ease;
            }
            
            .btn-select-all:hover,
            .btn-deselect-all:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            /* ===== BARRE DE CONTRÔLES ÉPURÉE ===== */
            .controls-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            /* ===== RECHERCHE ===== */
            .search-section {
                flex: 0 0 320px;
            }
            
            .search-box {
                position: relative;
                width: 100%;
            }
            
            .search-input {
                width: 100%;
                padding: 12px 16px 12px 44px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 14px;
                background: #f9fafb;
                transition: all 0.3s ease;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
            
            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: #9ca3af;
                font-size: 16px;
            }
            
            .search-clear {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: #ef4444;
                color: white;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                transition: background 0.2s;
            }
            
            .search-clear:hover {
                background: #dc2626;
            }
            
            /* ===== MODES DE VUE ===== */
            .view-modes {
                flex: 1;
                display: flex;
                justify-content: center;
            }
            
            .view-modes {
                display: flex;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 4px;
                gap: 4px;
            }
            
            .view-mode {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border: none;
                background: transparent;
                color: #6b7280;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
            }
            
            .view-mode:hover {
                background: rgba(255, 255, 255, 0.7);
                color: #374151;
            }
            
            .view-mode.active {
                background: white;
                color: #1f2937;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                font-weight: 600;
            }
            
            /* ===== BOUTONS D'ACTION ===== */
            .action-buttons {
                flex: 0 0 auto;
                display: flex;
                gap: 12px;
            }
            
            .btn-create-tasks,
            .btn-refresh {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                position: relative;
                white-space: nowrap;
            }
            
            .btn-create-tasks {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .btn-create-tasks:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            
            .btn-create-tasks.has-selection {
                background: linear-gradient(135deg, #10b981, #047857);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                animation: pulse 2s infinite;
            }
            
            .btn-refresh {
                background: white;
                color: #374151;
                border: 2px solid #e5e7eb;
            }
            
            .btn-refresh:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
            }
            
            .count-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                font-size: 11px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 20px;
                text-align: center;
                border: 2px solid white;
            }
            
            /* ===== ONGLETS DE CATÉGORIES ===== */
            .category-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .category-tab {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                color: #374151;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
            }
            
            .category-tab:hover {
                border-color: var(--category-color, #3b82f6);
                background: color-mix(in srgb, var(--category-color, #3b82f6) 5%, white);
                transform: translateY(-1px);
            }
            
            .category-tab.active {
                background: var(--category-color, #3b82f6);
                color: white;
                border-color: var(--category-color, #3b82f6);
                box-shadow: 0 4px 12px color-mix(in srgb, var(--category-color, #3b82f6) 30%, transparent);
            }
            
            .tab-icon {
                font-size: 16px;
            }
            
            .tab-count {
                background: rgba(0, 0, 0, 0.1);
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                min-width: 22px;
                text-align: center;
            }
            
            .category-tab.active .tab-count {
                background: rgba(255, 255, 255, 0.25);
            }
            
            /* ===== CONTAINER DES EMAILS ===== */
            .emails-container {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            /* ===== LIGNE D'EMAIL MODERNE ===== */
            .emails-flat-list {
                display: flex;
                flex-direction: column;
            }
            
            .email-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
                min-height: 80px;
            }
            
            .email-row:last-child {
                border-bottom: none;
            }
            
            .email-row:hover {
                background: #f8fafc;
            }
            
            .email-row.selected {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding-left: 16px;
            }
            
            .email-row.has-task {
                background: #f0fdf4;
                border-left: 4px solid #10b981;
                padding-left: 16px;
            }
            
            /* ===== ÉLÉMENTS DE LA LIGNE ===== */
            .email-checkbox {
                flex-shrink: 0;
            }
            
            .email-checkbox input {
                width: 18px;
                height: 18px;
                cursor: pointer;
                accent-color: #3b82f6;
            }
            
            .email-avatar {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 18px;
                flex-shrink: 0;
            }
            
            .email-sender-info {
                flex: 0 0 200px;
                min-width: 0;
            }
            
            .sender-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-bottom: 2px;
            }
            
            .sender-email {
                font-size: 13px;
                color: #6b7280;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-subject {
                flex: 1;
                min-width: 0;
                padding-right: 16px;
            }
            
            .subject-text {
                font-size: 15px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.3;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-preview {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .email-badges {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }
            
            .badge {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .badge.attachment {
                background: #fef3c7;
                color: #d97706;
            }
            
            .badge.priority {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .badge.task-created {
                background: #dcfce7;
                color: #16a34a;
            }
            
            .email-date {
                flex-shrink: 0;
                font-size: 13px;
                color: #6b7280;
                font-weight: 500;
                width: 60px;
                text-align: right;
            }
            
            .email-actions {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .email-row:hover .email-actions {
                opacity: 1;
            }
            
            .action-btn {
                width: 32px;
                height: 32px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-size: 13px;
            }
            
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .action-btn.create-task:hover {
                background: #dbeafe;
                color: #2563eb;
                border-color: #2563eb;
            }
            
            .action-btn.view-task {
                background: #dcfce7;
                color: #16a34a;
                border-color: #16a34a;
            }
            
            .action-btn.view-task:hover {
                background: #16a34a;
                color: white;
            }
            
            .action-btn.view-email:hover {
                background: #f3f4f6;
                color: #374151;
                border-color: #9ca3af;
            }
            
            /* ===== VUE GROUPÉE COMPACTE ===== */
            .emails-grouped-list {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .email-group {
                border-bottom: 1px solid #f3f4f6;
                margin: 0;
            }
            
            .email-group:last-child {
                border-bottom: none;
            }
            
            .group-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
                background: white;
                min-height: 56px;
                max-height: 56px;
                margin: 0;
            }
            
            .group-header:hover {
                background: #f8fafc;
            }
            
            .email-group.expanded .group-header {
                background: #f0f9ff;
                border-bottom: 1px solid #e0e7ff;
            }
            
            .group-avatar {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .group-info {
                flex: 1;
                min-width: 0;
            }
            
            .group-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                line-height: 1.3;
                margin-bottom: 2px;
            }
            
            .group-meta {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .group-expand {
                color: #9ca3af;
                transition: transform 0.2s ease;
                font-size: 14px;
            }
            
            .email-group.expanded .group-expand {
                transform: rotate(180deg);
                color: #3b82f6;
            }
            
            .group-content {
                background: #fafbfc;
                border-top: 1px solid #e5e7eb;
                margin: 0;
                padding: 0;
            }
            
            /* ===== ÉTAT VIDE ===== */
            .empty-view {
                text-align: center;
                padding: 80px 20px;
                color: #6b7280;
            }
            
            .empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
                color: #d1d5db;
            }
            
            .empty-title {
                font-size: 24px;
                font-weight: 700;
                color: #374151;
                margin: 0 0 8px 0;
            }
            
            .empty-subtitle {
                font-size: 16px;
                margin: 0 0 24px 0;
                line-height: 1.5;
            }
            
            .btn-clear-search {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .btn-clear-search:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            /* ===== ANIMATIONS ===== */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            /* ===== RESPONSIVE ===== */
            @media (max-width: 1024px) {
                .controls-bar {
                    flex-direction: column;
                    gap: 16px;
                }
                
                .search-section {
                    flex: none;
                    width: 100%;
                }
                
                .view-modes {
                    width: 100%;
                    justify-content: space-around;
                }
                
                .action-buttons {
                    width: 100%;
                    justify-content: center;
                }
            }
            
            @media (max-width: 768px) {
                .modern-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }
                
                .header-actions {
                    justify-content: center;
                }
                
                .controls-bar {
                    padding: 16px;
                    gap: 12px;
                }
                
                .view-mode span {
                    display: none;
                }
                
                .btn-create-tasks span,
                .btn-refresh span {
                    display: none;
                }
                
                .category-tabs {
                    justify-content: center;
                    gap: 6px;
                }
                
                .tab-name {
                    display: none;
                }
                
                .email-row {
                    padding: 12px 16px;
                    gap: 12px;
                }
                
                .email-avatar {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
                
                .email-sender-info {
                    flex: 0 0 140px;
                }
                
                .sender-name {
                    font-size: 14px;
                }
                
                .sender-email {
                    font-size: 12px;
                }
                
                .subject-text {
                    font-size: 14px;
                }
                
                .email-preview {
                    font-size: 12px;
                }
                
                .email-actions {
                    opacity: 1;
                }
            }
            
            /* Support pour les navigateurs sans color-mix */
            @supports not (color: color-mix(in srgb, red, blue)) {
                .category-tab:hover {
                    background: rgba(59, 130, 246, 0.05);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // UTILITY METHODS
    // =====================================
    generateAvatarColor(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 360;
        const saturation = 65 + (Math.abs(hash) % 20);
        const lightness = 45 + (Math.abs(hash) % 15);
        
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 10}%))`;
    }

    formatEmailDate(dateString) {
        if (!dateString) return '';
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
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    calculateCategoryCounts(emails) {
        const counts = {};
        emails.forEach(email => {
            const cat = email.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }

    createEmailGroups(emails, groupMode) {
        const groups = {};
        
        emails.forEach(email => {
            let groupKey, groupName;
            
            if (groupMode === 'grouped-domain') {
                const domain = email.from?.emailAddress?.address?.split('@')[1] || 'unknown';
                groupKey = domain;
                groupName = domain;
            } else {
                const senderEmail = email.from?.emailAddress?.address || 'unknown';
                const senderName = email.from?.emailAddress?.name || senderEmail;
                groupKey = senderEmail;
                groupName = senderName;
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    name: groupName,
                    emails: [],
                    count: 0,
                    latestDate: null
                };
            }
            
            groups[groupKey].emails.push(email);
            groups[groupKey].count++;
            
            const emailDate = new Date(email.receivedDateTime);
            if (!groups[groupKey].latestDate || emailDate > groups[groupKey].latestDate) {
                groups[groupKey].latestDate = emailDate;
            }
        });
        
        return Object.values(groups).sort((a, b) => {
            if (!a.latestDate && !b.latestDate) return 0;
            if (!a.latestDate) return 1;
            if (!b.latestDate) return -1;
            return b.latestDate - a.latestDate;
        });
    }

    matchesSearch(email, searchTerm) {
        if (!searchTerm) return true;
        
        const search = searchTerm.toLowerCase();
        const subject = (email.subject || '').toLowerCase();
        const sender = (email.from?.emailAddress?.name || '').toLowerCase();
        const senderEmail = (email.from?.emailAddress?.address || '').toLowerCase();
        const preview = (email.bodyPreview || '').toLowerCase();
        
        return subject.includes(search) || 
               sender.includes(search) || 
               senderEmail.includes(search) || 
               preview.includes(search);
    }

    // =====================================
    // TASK CREATION METHODS
    // =====================================
    async createTasksFromSelection() {
        if (this.selectedEmails.size === 0) {
            window.uiManager.showToast('Aucun email sélectionné', 'warning');
            return;
        }
        
        let created = 0;
        window.uiManager.showLoading(`Création de ${this.selectedEmails.size} tâches...`);
        
        for (const emailId of this.selectedEmails) {
            const email = this.getEmailById(emailId);
            if (!email || this.createdTasks.has(emailId)) continue;
            
            try {
                let analysis = this.aiAnalysisResults.get(emailId);
                if (!analysis && window.aiTaskAnalyzer) {
                    analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email);
                    this.aiAnalysisResults.set(emailId, analysis);
                }
                
                if (analysis && window.taskManager) {
                    const taskData = this.buildTaskDataFromAnalysis(email, analysis);
                    const task = window.taskManager.createTaskFromEmail(taskData, email);
                    this.createdTasks.set(emailId, task.id);
                    created++;
                }
            } catch (error) {
                console.error('[PageManager] Error creating task for email:', emailId, error);
            }
        }
        
        window.uiManager.hideLoading();
        
        if (created > 0) {
            window.taskManager?.saveTasks();
            window.uiManager.showToast(`${created} tâche${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''}`, 'success');
            this.clearSelection();
        } else {
            window.uiManager.showToast('Aucune tâche créée', 'warning');
        }
    }

    async createTasksFromAllVisible() {
        const emails = this.getVisibleEmails();
        if (emails.length === 0) {
            window.uiManager.showToast('Aucun email visible', 'warning');
            return;
        }
        
        const emailsToProcess = emails.filter(email => !this.createdTasks.has(email.id));
        if (emailsToProcess.length === 0) {
            window.uiManager.showToast('Toutes les tâches ont déjà été créées', 'info');
            return;
        }
        
        emailsToProcess.forEach(email => this.selectedEmails.add(email.id));
        await this.createTasksFromSelection();
    }

    getVisibleEmails() {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        let filteredEmails = emails;
        
        if (this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        return filteredEmails;
    }

    getEmailById(emailId) {
        const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
        return emails.find(e => e.id === emailId);
    }

    getTemporaryEmails() {
        return this.temporaryEmailStorage || [];
    }

    buildTaskDataFromAnalysis(email, analysis) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || 'unknown';
        
        return {
            id: this.generateTaskId(),
            title: analysis.mainTask?.title || `Email de ${senderName}`,
            description: analysis.mainTask?.description || analysis.summary || '',
            priority: analysis.mainTask?.priority || 'medium',
            dueDate: analysis.mainTask?.dueDate || null,
            status: 'todo',
            emailId: email.id,
            category: email.category || 'other',
            createdAt: new Date().toISOString(),
            aiGenerated: true,
            emailFrom: senderEmail,
            emailFromName: senderName,
            emailSubject: email.subject,
            emailDomain: senderDomain,
            emailDate: email.receivedDateTime,
            hasAttachments: email.hasAttachments || false,
            aiAnalysis: analysis,
            tags: [senderDomain, analysis.importance, ...(analysis.tags || [])].filter(Boolean),
            method: 'ai'
        };
    }

    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async refreshEmails() {
        window.uiManager.showLoading('Actualisation...');
        
        try {
            const emails = window.emailScanner?.getAllEmails() || this.getTemporaryEmails() || [];
            
            if (emails.length > 0 && window.categoryManager) {
                emails.forEach(email => {
                    const result = window.categoryManager.analyzeEmail(email);
                    email.category = result.category || 'other';
                });
            }
            
            await this.loadPage('emails');
            window.uiManager.showToast('Emails actualisés', 'success');
            
        } catch (error) {
            window.uiManager.hideLoading();
            window.uiManager.showToast('Erreur d\'actualisation', 'error');
        }
    }

    async analyzeFirstEmails(emails) {
        for (const email of emails) {
            if (!this.aiAnalysisResults.has(email.id)) {
                try {
                    const analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email, {
                        useApi: false,
                        quickMode: true
                    });
                    this.aiAnalysisResults.set(email.id, analysis);
                } catch (error) {
                    console.error('Auto-analysis error:', error);
                }
            }
        }
        
        const emailsContainer = document.querySelector('.emails-container');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
        }
    }

    // =====================================
    // MODAL METHODS
    // =====================================
    async showTaskCreationModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        let analysis;
        try {
            window.uiManager.showLoading('Analyse de l\'email...');
            analysis = await window.aiTaskAnalyzer.analyzeEmailForTasks(email, { useApi: true });
            this.aiAnalysisResults.set(emailId, analysis);
            window.uiManager.hideLoading();
        } catch (error) {
            window.uiManager.hideLoading();
            window.uiManager.showToast('Erreur d\'analyse', 'error');
            return;
        }

        const uniqueId = 'task_creation_modal_' + Date.now();
        const modalHTML = `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; 
                            max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">Créer une tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        ${this.buildTaskCreationForm(email, analysis)}
                    </div>
                    <div style="padding: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 12px 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Annuler
                        </button>
                        <button onclick="window.pageManager.createTaskFromModal('${emailId}'); document.getElementById('${uniqueId}').remove();"
                                style="padding: 12px 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-check"></i> Créer la tâche
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    buildTaskCreationForm(email, analysis) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || '';
        
        const enhancedTitle = analysis.mainTask.title.includes(senderName) ? 
            analysis.mainTask.title : 
            `${analysis.mainTask.title} - ${senderName}`;
        
        return `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-robot" style="color: #0ea5e9; font-size: 20px;"></i>
                    <span style="color: #0c4a6e; font-weight: 600;">Analyse intelligente par Claude AI</span>
                </div>
                
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 48px; height: 48px; background: ${this.generateAvatarColor(senderName)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                        ${senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1f2937; font-size: 16px;">${senderName}</div>
                        <div style="color: #6b7280; font-size: 14px;">${senderEmail}</div>
                        <div style="color: #9ca3af; font-size: 12px;">@${senderDomain}</div>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Titre de la tâche</label>
                    <input type="text" id="task-title" 
                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                           value="${enhancedTitle}" 
                           onfocus="this.style.borderColor='#3b82f6'"
                           onblur="this.style.borderColor='#e5e7eb'" />
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Description</label>
                    <textarea id="task-description" 
                              style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical; min-height: 100px; transition: border-color 0.2s;"
                              onfocus="this.style.borderColor='#3b82f6'"
                              onblur="this.style.borderColor='#e5e7eb'"
                              rows="4">${analysis.mainTask.description || analysis.summary || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Priorité</label>
                        <select id="task-priority" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='#3b82f6'"
                                onblur="this.style.borderColor='#e5e7eb'">
                            <option value="urgent" ${analysis.mainTask.priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                            <option value="high" ${analysis.mainTask.priority === 'high' ? 'selected' : ''}>⚡ Haute</option>
                            <option value="medium" ${analysis.mainTask.priority === 'medium' ? 'selected' : ''}>📌 Normale</option>
                            <option value="low" ${analysis.mainTask.priority === 'low' ? 'selected' : ''}>📄 Basse</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">Date d'échéance</label>
                        <input type="date" id="task-duedate" 
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#3b82f6'"
                               onblur="this.style.borderColor='#e5e7eb'"
                               value="${analysis.mainTask.dueDate || ''}" />
                    </div>
                </div>
                
                <div>
                    <button onclick="window.pageManager.toggleEmailContext()" 
                            style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; transition: background 0.2s;"
                            onmouseover="this.style.background='#f1f5f9'"
                            onmouseout="this.style.background='#f8fafc'">
                        <i class="fas fa-chevron-right" id="context-toggle-icon" style="transition: transform 0.2s;"></i>
                        <span>Afficher le contenu original de l'email</span>
                    </button>
                    <div id="email-context-content" style="display: none; margin-top: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                            <div style="margin-bottom: 4px;"><strong>De:</strong> ${senderName} &lt;${senderEmail}&gt;</div>
                            <div style="margin-bottom: 4px;"><strong>Date:</strong> ${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</div>
                            <div><strong>Sujet:</strong> ${email.subject || 'Sans sujet'}</div>
                        </div>
                        <div style="max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 1.5; color: #374151;">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleEmailContext() {
        const content = document.getElementById('email-context-content');
        const icon = document.getElementById('context-toggle-icon');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
            icon.style.transform = 'rotate(90deg)';
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    async createTaskFromModal(emailId) {
        const email = this.getEmailById(emailId);
        const analysis = this.aiAnalysisResults.get(emailId);
        
        if (!email || !analysis) {
            window.uiManager.showToast('Données manquantes', 'error');
            return;
        }

        const title = document.getElementById('task-title')?.value;
        const description = document.getElementById('task-description')?.value;
        const priority = document.getElementById('task-priority')?.value;
        const dueDate = document.getElementById('task-duedate')?.value;

        if (!title) {
            window.uiManager.showToast('Le titre est requis', 'warning');
            return;
        }

        try {
            const taskData = this.buildTaskDataFromAnalysis(email, {
                ...analysis,
                mainTask: {
                    ...analysis.mainTask,
                    title,
                    description,
                    priority,
                    dueDate
                }
            });

            const task = window.taskManager.createTaskFromEmail(taskData, email);
            this.createdTasks.set(emailId, task.id);
            
            window.taskManager.saveTasks();
            window.uiManager.showToast('Tâche créée avec succès', 'success');
            
            const emailsContainer = document.querySelector('.emails-container');
            if (emailsContainer) {
                emailsContainer.innerHTML = this.renderEmailsList();
            }
            
        } catch (error) {
            console.error('Error creating task:', error);
            window.uiManager.showToast('Erreur lors de la création', 'error');
        }
    }

    showEmailModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'email_modal_' + Date.now();
        const modalHTML = `
            <div id="${uniqueId}" 
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); 
                        z-index: 99999999; display: flex; align-items: center; justify-content: center; 
                        padding: 20px; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 16px; max-width: 800px; width: 100%; 
                           max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">Email Complet</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        <div style="margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 700; color: #374151; min-width: 60px;">De:</span>
                                <span style="color: #1f2937;">${email.from?.emailAddress?.name || ''} &lt;${email.from?.emailAddress?.address || ''}&gt;</span>
                            </div>
                            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 700; color: #374151; min-width: 60px;">Date:</span>
                                <span style="color: #1f2937;">${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 700; color: #374151; min-width: 60px;">Sujet:</span>
                                <span style="color: #1f2937; font-weight: 600;">${email.subject || 'Sans sujet'}</span>
                            </div>
                        </div>
                        <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; max-height: 400px; overflow-y: auto; line-height: 1.6; color: #374151;">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                    <div style="padding: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';"
                                style="padding: 12px 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Fermer
                        </button>
                        ${!this.createdTasks.has(emailId) ? `
                            <button onclick="document.getElementById('${uniqueId}').remove(); window.pageManager.showTaskCreationModal('${emailId}');"
                                    style="padding: 12px 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-tasks"></i> Créer une tâche
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    getEmailContent(email) {
        if (email.body?.content) {
            return email.body.content;
        }
        return `<p>${email.bodyPreview || 'Aucun contenu disponible'}</p>`;
    }

    openCreatedTask(emailId) {
        const taskId = this.createdTasks.get(emailId);
        if (!taskId) return;
        
        this.loadPage('tasks').then(() => {
            setTimeout(() => {
                if (window.tasksView?.showTaskDetails) {
                    window.tasksView.showTaskDetails(taskId);
                }
            }, 100);
        });
    }

    getCategoryDisplayName(categoryId) {
        const categories = window.categoryManager?.getCategories() || {};
        return categories[categoryId]?.name || categoryId;
    }

    // =====================================
    // OTHER PAGES (Dashboard, Scanner, Tasks, Categories, Settings)
    // =====================================
    async renderDashboard(container) {
        const scanData = this.lastScanData;
        const taskStats = window.taskManager?.getStats() || {
            total: 0,
            byStatus: { todo: 0, 'in-progress': 0, completed: 0 },
            overdue: 0
        };
        
        const aiConfigured = window.aiTaskAnalyzer?.isConfigured() || false;
        
        container.innerHTML = `
            <div class="dashboard-header">
                <h1 class="dashboard-title">Tableau de bord</h1>
                <div class="dashboard-actions">
                    <button class="btn primary" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i> Nouveau scan
                    </button>
                </div>
            </div>

            ${!aiConfigured ? `
                <div class="ai-banner">
                    <div class="ai-banner-icon"><i class="fas fa-magic"></i></div>
                    <div class="ai-banner-content">
                        <h3>Activez l'IA pour des suggestions intelligentes</h3>
                        <p>Configurez Claude AI pour analyser vos emails automatiquement</p>
                    </div>
                    <button class="btn primary" onclick="window.aiTaskAnalyzer?.showConfigurationModal()">
                        Configurer
                    </button>
                </div>
            ` : ''}

            <div class="dashboard-stats">
                ${this.createDashboardCard({
                    icon: 'fas fa-tasks',
                    label: 'Tâches totales',
                    value: taskStats.total,
                    color: '#3b82f6'
                })}
                ${this.createDashboardCard({
                    icon: 'fas fa-clock',
                    label: 'À faire',
                    value: taskStats.byStatus.todo,
                    color: '#06b6d4'
                })}
                ${this.createDashboardCard({
                    icon: 'fas fa-check-circle',
                    label: 'Terminées',
                    value: taskStats.byStatus.completed,
                    color: '#10b981'
                })}
                ${this.createDashboardCard({
                    icon: 'fas fa-exclamation-circle',
                    label: 'En retard',
                    value: taskStats.overdue,
                    color: '#ef4444'
                })}
            </div>

            ${scanData ? this.renderScanStats(scanData) : this.renderWelcome()}
        `;

        this.addDashboardStyles();
    }

    createDashboardCard({ icon, label, value, color }) {
        return `
            <div class="dashboard-card" style="--card-color: ${color}">
                <div class="card-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${value}</div>
                    <div class="card-label">${label}</div>
                </div>
            </div>
        `;
    }

    renderWelcome() {
        return `
            <div class="welcome-card">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <i class="fas fa-envelope-open-text"></i>
                    </div>
                    <h2 class="welcome-title">Bienvenue!</h2>
                    <p class="welcome-text">
                        Commencez par scanner vos emails pour les organiser automatiquement.
                    </p>
                    <button class="btn primary large" onclick="window.pageManager.loadPage('scanner')">
                        <i class="fas fa-search"></i> Démarrer le scan
                    </button>
                </div>
            </div>
        `;
    }

    renderScanStats(scanData) {
        return `
            <div class="scan-stats-card">
                <h3>Résultats du dernier scan</h3>
                <div class="scan-stats">
                    <div class="stat">
                        <span class="stat-number">${scanData.total}</span>
                        <span class="stat-label">emails analysés</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${scanData.categorized}</span>
                        <span class="stat-label">catégorisés</span>
                    </div>
                </div>
            </div>
        `;
    }

    async renderScanner(container) {
        console.log('[PageManager] Rendering scanner page...');
        
        if (window.scanStartModule && 
            typeof window.scanStartModule.render === 'function' && 
            window.scanStartModule.stylesAdded) {
            
            try {
                console.log('[PageManager] Using modern ScanStartModule');
                await window.scanStartModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] Error with ScanStartModule, falling back:', error);
            }
        }
        
        console.log('[PageManager] Using fallback scanner interface');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3 class="empty-title">Scanner d'emails</h3>
                <p class="empty-text">Module de scan en cours de chargement...</p>
            </div>
        `;
    }

    async renderTasks(container) {
        if (window.tasksView && window.tasksView.render) {
            window.tasksView.render(container);
        } else {
            container.innerHTML = `
                <div class="page-header">
                    <h1>Tâches</h1>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h3 class="empty-title">Aucune tâche</h3>
                    <p class="empty-text">Créez des tâches à partir de vos emails</p>
                </div>
            `;
        }
    }

    async renderCategories(container) {
        const categories = window.categoryManager?.getCategories() || {};
        
        container.innerHTML = `
            <div class="page-header">
                <h1>Catégories</h1>
            </div>
            
            <div class="categories-grid">
                ${Object.entries(categories).map(([id, cat]) => `
                    <div class="category-card">
                        <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                            ${cat.icon}
                        </div>
                        <h3>${cat.name}</h3>
                        <p>${cat.description || ''}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async renderSettings(container) {
        if (window.categoriesPage) {
            window.categoriesPage.renderSettings(container);
        } else {
            container.innerHTML = `
                <div class="page-header">
                    <h1>Paramètres</h1>
                </div>
                
                <div class="settings-card">
                    <h3>Configuration IA</h3>
                    <button class="btn primary" onclick="window.aiTaskAnalyzer?.showConfigurationModal()">
                        <i class="fas fa-cog"></i> Configurer Claude AI
                    </button>
                </div>
            `;
        }
    }

    addDashboardStyles() {
        if (document.getElementById('dashboardStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'dashboardStyles';
        styles.textContent = `
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
            }
            
            .dashboard-title {
                font-size: 32px;
                font-weight: 800;
                color: #111827;
                margin: 0;
            }
            
            .dashboard-actions {
                display: flex;
                gap: 12px;
            }
            
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }
            
            .dashboard-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
                display: flex;
                align-items: center;
                gap: 20px;
                transition: all 0.3s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .dashboard-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .card-icon {
                width: 60px;
                height: 60px;
                background: var(--card-color);
                color: white;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .card-content {
                flex: 1;
            }
            
            .card-value {
                font-size: 32px;
                font-weight: 800;
                color: #1f2937;
                line-height: 1;
                margin-bottom: 4px;
            }
            
            .card-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 600;
            }
            
            .welcome-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 48px;
                text-align: center;
            }
            
            .welcome-content {
                max-width: 400px;
                margin: 0 auto;
            }
            
            .welcome-icon {
                font-size: 64px;
                color: #3b82f6;
                margin-bottom: 24px;
            }
            
            .welcome-title {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 16px 0;
            }
            
            .welcome-text {
                font-size: 16px;
                color: #6b7280;
                line-height: 1.6;
                margin: 0 0 32px 0;
            }
            
            .ai-banner {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border: 1px solid #0ea5e9;
                border-radius: 16px;
                padding: 24px;
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 32px;
            }
            
            .ai-banner-icon {
                width: 48px;
                height: 48px;
                background: #0ea5e9;
                color: white;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            
            .ai-banner-content {
                flex: 1;
            }
            
            .ai-banner-content h3 {
                margin: 0 0 4px 0;
                font-size: 18px;
                font-weight: 700;
                color: #0c4a6e;
            }
            
            .ai-banner-content p {
                margin: 0;
                color: #075985;
                font-size: 14px;
            }
            
            .scan-stats-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
            }
            
            .scan-stats-card h3 {
                margin: 0 0 20px 0;
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
            }
            
            .scan-stats {
                display: flex;
                gap: 32px;
            }
            
            .stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: 800;
                color: #3b82f6;
            }
            
            .stat-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 600;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                text-decoration: none;
            }
            
            .btn.primary {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
            }
            
            .btn.primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 5px 16px rgba(59, 130, 246, 0.4);
            }
            
            .btn.large {
                padding: 16px 32px;
                font-size: 16px;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Create global instance
window.pageManager = new PageManager();

// Bind methods to preserve context
Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
        window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
    }
});

console.log('✅ PageManager v11.0 loaded - Interface moderne épurée');
