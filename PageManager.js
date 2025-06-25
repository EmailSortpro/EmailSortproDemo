// PageManager.js - Version 13.1 - Compatible avec systèmes existants

class PageManager {
    constructor() {
        // Core state
        this.currentPage = null;
        this.selectedEmails = new Set();
        this.aiAnalysisResults = new Map();
        this.createdTasks = new Map();
        this.autoAnalyzeEnabled = true;
        this.searchTerm = '';
        this.lastScanData = null;
        this.hideExplanation = this.getLocalStorageItem('hideEmailExplanation') === 'true';
        this.isInitialized = false;
        
        // Vue modes pour les emails
        this.currentViewMode = 'grouped-domain';
        this.currentCategory = null;
        
        // Page modules mapping
        this.pageModules = {
            scanner: 'minimalScanModule',
            emails: null, // Handled internally
            tasks: 'tasksView',
            categories: 'categoriesPage',
            settings: 'categoriesPage',
            ranger: 'domainOrganizer'
        };
        
        // Safe initialization
        this.safeInit();
    }

    // Safe localStorage access
    getLocalStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('[PageManager] LocalStorage not available:', error);
            return null;
        }
    }

    setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('[PageManager] LocalStorage not available:', error);
        }
    }

    safeInit() {
        try {
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('[PageManager] ✅ Version 13.1 - Compatible avec systèmes existants');
        } catch (error) {
            console.error('[PageManager] Initialization error:', error);
        }
    }

    // ================================================
    // ÉVÉNEMENTS GLOBAUX
    // ================================================
    setupEventListeners() {
        // Écouter les changements de paramètres
        window.addEventListener('categorySettingsChanged', (event) => {
            console.log('[PageManager] 📨 Settings changed:', event.detail);
            this.handleSettingsChanged(event.detail);
        });

        // Écouter les changements génériques
        window.addEventListener('settingsChanged', (event) => {
            console.log('[PageManager] 📨 Generic settings changed:', event.detail);
            this.handleGenericSettingsChanged(event.detail);
        });

        // Écouter la recatégorisation des emails
        window.addEventListener('emailsRecategorized', (event) => {
            console.log('[PageManager] Emails recategorized');
            if (this.currentPage === 'emails') {
                setTimeout(() => {
                    this.refreshEmailsView();
                }, 100);
            }
        });

        // Écouter les fins de scan
        window.addEventListener('scanCompleted', (event) => {
            console.log('[PageManager] Scan completed');
            this.lastScanData = event.detail;
            if (this.currentPage === 'emails') {
                this.loadPage('emails');
            }
        });

        // Écouter les erreurs globales
        window.addEventListener('error', (event) => {
            console.error('[PageManager] Global error:', event.error);
        });
    }

    handleSettingsChanged(settingsData) {
        console.log('[PageManager] 🔧 Processing settings change:', settingsData);
        
        if (settingsData.settings?.taskPreselectedCategories) {
            console.log('[PageManager] 📋 Preselected categories changed:', settingsData.settings.taskPreselectedCategories);
            
            // Déclencher la re-catégorisation si des emails existent
            if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                console.log('[PageManager] 🔄 Triggering re-categorization...');
                setTimeout(() => {
                    this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                }, 100);
            }
        }
        
        if (this.currentPage === 'emails') {
            setTimeout(() => {
                this.refreshEmailsView();
            }, 200);
        }
    }

    handleGenericSettingsChanged(changeData) {
        console.log('[PageManager] 🔧 Processing generic change:', changeData);
        
        const { type, value } = changeData;
        
        switch (type) {
            case 'taskPreselectedCategories':
                console.log('[PageManager] 📋 Task categories changed:', value);
                if (window.aiTaskAnalyzer && typeof window.aiTaskAnalyzer.updatePreselectedCategories === 'function') {
                    window.aiTaskAnalyzer.updatePreselectedCategories(value);
                }
                
                // Déclencher la re-catégorisation
                if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                    setTimeout(() => {
                        this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                    }, 150);
                }
                break;
                
            case 'activeCategories':
                console.log('[PageManager] 🏷️ Active categories changed:', value);
                if (this.safeCall(() => window.emailScanner?.emails?.length > 0)) {
                    setTimeout(() => {
                        this.safeCall(() => window.emailScanner.recategorizeEmails?.());
                    }, 150);
                }
                break;
                
            case 'preferences':
                console.log('[PageManager] ⚙️ Preferences changed:', value);
                if (this.currentPage === 'emails') {
                    setTimeout(() => {
                        this.refreshEmailsView();
                    }, 100);
                }
                break;
        }
    }

    // ================================================
    // PAGE LOADING SYSTEM
    // ================================================
    async loadPage(pageName) {
        console.log(`[PageManager] Loading page: ${pageName}`);

        if (!this.isInitialized) {
            console.warn('[PageManager] Not initialized, skipping page load');
            return;
        }

        // Handle dashboard redirect
        if (pageName === 'dashboard') {
            console.log('[PageManager] Dashboard handled by index.html');
            this.updateNavigation(pageName);
            this.showPageContent();
            return;
        }

        const container = this.getPageContainer();
        if (!container) {
            console.error('[PageManager] Page container not found');
            return;
        }

        try {
            // Show loading
            this.showLoading(`Chargement ${pageName}...`);
            
            // Update navigation
            this.updateNavigation(pageName);
            
            // Clear container
            container.innerHTML = '';
            
            // Check authentication for protected pages
            if (this.requiresAuthentication(pageName)) {
                console.log(`[PageManager] Page requires authentication: ${pageName}`);
                const authStatus = await this.checkAuthenticationStatus();
                
                if (!authStatus.isAuthenticated) {
                    console.log('[PageManager] User not authenticated, showing auth required message');
                    this.hideLoading();
                    container.innerHTML = this.renderAuthRequiredState(pageName);
                    return;
                }
            }
            
            // Render page
            await this.renderPage(pageName, container);
            
            // Set current page
            this.currentPage = pageName;
            
            // Initialize page events
            this.initializePageEvents(pageName);
            
            // Hide loading
            this.hideLoading();

        } catch (error) {
            console.error(`[PageManager] Error loading page ${pageName}:`, error);
            this.hideLoading();
            this.showError(`Erreur: ${error.message}`);
            container.innerHTML = this.renderErrorPage(error);
        }
    }

    requiresAuthentication(pageName) {
        // Pages that require authentication
        const authPages = ['emails', 'tasks', 'scanner'];
        return authPages.includes(pageName);
    }

    async checkAuthenticationStatus() {
        try {
            // Check multiple authentication sources
            let isAuthenticated = false;
            let user = null;
            
            // Check AuthService
            if (window.authService) {
                if (typeof window.authService.isAuthenticated === 'function') {
                    isAuthenticated = window.authService.isAuthenticated();
                    console.log('[PageManager] AuthService.isAuthenticated():', isAuthenticated);
                }
                
                if (typeof window.authService.checkAuthStatus === 'function') {
                    try {
                        const authStatus = await window.authService.checkAuthStatus();
                        isAuthenticated = authStatus.isAuthenticated || isAuthenticated;
                        user = authStatus.user || user;
                        console.log('[PageManager] AuthService.checkAuthStatus():', authStatus);
                    } catch (error) {
                        console.warn('[PageManager] Error checking auth status:', error);
                    }
                }
                
                // Try to get access token as final check
                if (typeof window.authService.getAccessToken === 'function') {
                    try {
                        const token = await window.authService.getAccessToken();
                        if (token) {
                            isAuthenticated = true;
                            console.log('[PageManager] Access token available, user is authenticated');
                        }
                    } catch (error) {
                        console.warn('[PageManager] No access token available:', error);
                    }
                }
            }
            
            // Check for stored authentication indicators
            if (!isAuthenticated) {
                try {
                    const storedAuth = localStorage.getItem('authStatus') || localStorage.getItem('userInfo');
                    if (storedAuth) {
                        isAuthenticated = true;
                        console.log('[PageManager] Found stored authentication indicator');
                    }
                } catch (error) {
                    console.warn('[PageManager] Cannot access localStorage:', error);
                }
            }
            
            return {
                isAuthenticated,
                user,
                source: isAuthenticated ? 'detected' : 'none'
            };
            
        } catch (error) {
            console.error('[PageManager] Error checking authentication:', error);
            return {
                isAuthenticated: false,
                user: null,
                error: error.message
            };
        }
    }

    renderAuthRequiredState(pageName) {
        return `
            <div class="auth-required-state">
                <div class="auth-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="auth-title">Authentification requise</h3>
                <p class="auth-text">
                    Vous devez être connecté pour accéder à cette page.
                </p>
                <div class="auth-actions">
                    <button class="btn btn-primary" onclick="window.pageManager.handleLogin()">
                        <i class="fas fa-sign-in-alt"></i>
                        Se connecter
                    </button>
                    <button class="btn btn-secondary" onclick="window.pageManager.loadPage('dashboard')">
                        <i class="fas fa-home"></i>
                        Retour au tableau de bord
                    </button>
                </div>
                <div class="auth-debug" style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
                    <strong>Debug info:</strong><br>
                    AuthService available: ${!!window.authService}<br>
                    Page: ${pageName}<br>
                    Timestamp: ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    }

    async handleLogin() {
        console.log('[PageManager] Handling login request...');
        
        try {
            if (window.authService && typeof window.authService.login === 'function') {
                console.log('[PageManager] Using AuthService.login()');
                await window.authService.login();
            } else if (window.authService && typeof window.authService.signIn === 'function') {
                console.log('[PageManager] Using AuthService.signIn()');
                await window.authService.signIn();
            } else {
                console.log('[PageManager] No login method available, redirecting to auth page');
                window.location.href = '/auth.html';
            }
        } catch (error) {
            console.error('[PageManager] Login error:', error);
            this.showError('Erreur lors de la connexion: ' + error.message);
        }
    }

    async renderPage(pageName, container) {
        console.log(`[PageManager] Rendering page: ${pageName}`);
        
        // Check if we should delegate to a module
        const moduleName = this.pageModules[pageName];
        if (moduleName && window[moduleName]) {
            console.log(`[PageManager] Delegating to module: ${moduleName}`);
            return await this.delegateToModule(moduleName, container);
        }
        
        // Handle internal pages
        switch (pageName) {
            case 'emails':
                return await this.renderEmails(container);
            case 'tasks':
                return await this.renderTasks(container);
            case 'categories':
                return await this.renderCategories(container);
            case 'settings':
                return await this.renderSettings(container);
            case 'scanner':
                return await this.renderScanner(container);
            case 'ranger':
                return await this.renderRanger(container);
            default:
                throw new Error(`Page ${pageName} not found`);
        }
    }

    async delegateToModule(moduleName, container) {
        const module = window[moduleName];
        if (!module) {
            throw new Error(`Module ${moduleName} not found`);
        }

        try {
            if (typeof module.render === 'function') {
                await module.render(container);
            } else if (typeof module.showPage === 'function') {
                await module.showPage(container);
            } else if (typeof module.renderSettings === 'function') {
                await module.renderSettings(container);
            } else {
                console.log(`[PageManager] Initializing module: ${moduleName}`);
                container.innerHTML = `
                    <div class="module-placeholder">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Loading ${moduleName}...</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`[PageManager] Error rendering module: ${moduleName}`, error);
            throw error;
        }
    }

    initializePageEvents(pageName) {
        console.log(`[PageManager] Initializing events for page: ${pageName}`);
        
        switch (pageName) {
            case 'emails':
                this.setupEmailsEventListeners();
                break;
        }
    }

    // ================================================
    // PAGE RENDERERS - Utilise les systèmes existants
    // ================================================
    async renderEmails(container) {
        // Utiliser le système existant
        const emails = this.getAllEmails();
        const categories = this.getCategories();
        
        console.log(`[PageManager] Rendering emails page with ${emails.length} emails`);
        
        if (emails.length === 0) {
            container.innerHTML = this.renderEmptyEmailsState();
            return;
        }

        const categoryCounts = this.calculateCategoryCounts(emails);
        const totalEmails = emails.length;
        const selectedCount = this.selectedEmails.size;
        const visibleEmails = this.getVisibleEmails();
        const allVisible = visibleEmails.length > 0 && visibleEmails.every(email => this.selectedEmails.has(email.id));
        
        container.innerHTML = `
            <div class="tasks-page-modern">
                ${!this.hideExplanation ? `
                    <div class="explanation-text-harmonized">
                        <i class="fas fa-info-circle"></i>
                        <span>Cliquez sur vos emails pour les sélectionner, puis utilisez les boutons d'action pour transformer les emails sélectionnés en tâches ou effectuer d'autres opérations.</span>
                        <button class="explanation-close-btn" onclick="window.pageManager.hideExplanationMessage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}

                <div class="controls-bar-harmonized">
                    <div class="search-section-harmonized">
                        <div class="search-box-harmonized">
                            <i class="fas fa-search search-icon-harmonized"></i>
                            <input type="text" 
                                   class="search-input-harmonized" 
                                   id="emailSearchInput"
                                   placeholder="Rechercher emails..." 
                                   value="${this.searchTerm}">
                            ${this.searchTerm ? `
                                <button class="search-clear-harmonized" onclick="window.pageManager.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="view-modes-harmonized">
                        <button class="view-mode-harmonized ${this.currentViewMode === 'grouped-domain' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-domain')">
                            <i class="fas fa-globe"></i>
                            <span>Domaine</span>
                        </button>
                        <button class="view-mode-harmonized ${this.currentViewMode === 'grouped-sender' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('grouped-sender')">
                            <i class="fas fa-user"></i>
                            <span>Expéditeur</span>
                        </button>
                        <button class="view-mode-harmonized ${this.currentViewMode === 'flat' ? 'active' : ''}" 
                                onclick="window.pageManager.changeViewMode('flat')">
                            <i class="fas fa-list"></i>
                            <span>Liste</span>
                        </button>
                    </div>
                    
                    <div class="action-buttons-harmonized">
                        <button class="btn-harmonized btn-selection-toggle" 
                                onclick="window.pageManager.toggleAllSelection()">
                            <i class="fas ${allVisible ? 'fa-square-check' : 'fa-square'}"></i>
                            <span>${allVisible ? 'Désélectionner' : 'Sélectionner'}</span>
                        </button>
                        
                        ${selectedCount > 0 ? `
                            <div class="selection-info-harmonized">
                                <span class="selection-count-harmonized">${selectedCount} sélectionné(s)</span>
                                <button class="btn-harmonized btn-clear-selection" onclick="window.pageManager.clearSelection()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <button class="btn-harmonized btn-primary" onclick="window.pageManager.createTasksFromSelection()">
                                <i class="fas fa-tasks"></i>
                                <span>Créer ${selectedCount} tâche${selectedCount > 1 ? 's' : ''}</span>
                            </button>
                        ` : ''}
                        
                        <button class="btn-harmonized btn-secondary" onclick="window.pageManager.refreshEmails()">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>

                <div class="status-filters-harmonized-twolines">
                    ${this.buildCategoryTabs(categoryCounts, totalEmails, categories)}
                </div>

                <div class="tasks-container-harmonized">
                    ${this.renderEmailsList()}
                </div>
            </div>
        `;

        this.addHarmonizedEmailStyles();
        this.setupEmailsEventListeners();
    }

    // ================================================
    // MÉTHODES POUR UTILISER LES SYSTÈMES EXISTANTS
    // ================================================
    getAllEmails() {
        // Priorité 1: EmailScanner
        if (window.emailScanner && window.emailScanner.getAllEmails) {
            return window.emailScanner.getAllEmails();
        }
        
        // Priorité 2: Emails directs
        if (window.emailScanner && window.emailScanner.emails) {
            return window.emailScanner.emails;
        }
        
        // Fallback
        return [];
    }

    getCategories() {
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getCategories) {
            return window.categoryManager.getCategories();
        }
        
        // Fallback: Catégories basiques
        return {
            'all': { name: 'Tous', icon: '📧', color: '#1e293b' },
            'other': { name: 'Autre', icon: '❓', color: '#64748b' }
        };
    }

    getTaskPreselectedCategories() {
        // Priorité 1: CategoryManager
        if (window.categoryManager && window.categoryManager.getTaskPreselectedCategories) {
            return window.categoryManager.getTaskPreselectedCategories();
        }
        
        // Priorité 2: EmailScanner
        if (window.emailScanner && window.emailScanner.getTaskPreselectedCategories) {
            return window.emailScanner.getTaskPreselectedCategories();
        }
        
        // Fallback: localStorage
        try {
            const settings = JSON.parse(this.getLocalStorageItem('categorySettings') || '{}');
            return settings.taskPreselectedCategories || [];
        } catch (error) {
            return [];
        }
    }

    buildCategoryTabs(categoryCounts, totalEmails, categories) {
        const preselectedCategories = this.getTaskPreselectedCategories();
        console.log('[PageManager] 📌 Preselected categories for display:', preselectedCategories);
        
        const tabs = [
            { 
                id: 'all', 
                name: 'Tous', 
                icon: '📧', 
                count: totalEmails,
                isPreselected: false 
            }
        ];
        
        // Ajouter les catégories avec emails
        Object.entries(categories).forEach(([catId, category]) => {
            const count = categoryCounts[catId] || 0;
            if (count > 0) {
                const isPreselected = preselectedCategories.includes(catId);
                tabs.push({
                    id: catId,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    count: count,
                    isPreselected: isPreselected
                });
                
                if (isPreselected) {
                    console.log(`[PageManager] ⭐ Preselected category: ${category.name} (${count} emails)`);
                }
            }
        });
        
        // Ajouter "Autre" si nécessaire
        const otherCount = categoryCounts.other || 0;
        if (otherCount > 0) {
            tabs.push({
                id: 'other',
                name: 'Autre',
                icon: '📌',
                count: otherCount,
                isPreselected: false
            });
        }
        
        return tabs.map(tab => {
            const isCurrentCategory = this.currentCategory === tab.id;
            const baseClasses = `status-pill-harmonized-twolines ${isCurrentCategory ? 'active' : ''}`;
            
            let extraClasses = '';
            let extraStyles = '';
            let preselectedBadge = '';
            
            if (tab.isPreselected && !isCurrentCategory) {
                extraClasses = ' preselected-category';
                extraStyles = `style="border: 2px solid ${tab.color || '#8b5cf6'}; background: ${tab.color ? tab.color + '10' : '#f3e8ff'};"`;
                preselectedBadge = '<span class="preselected-star">⭐</span>';
            } else if (tab.isPreselected && isCurrentCategory) {
                extraStyles = `style="box-shadow: 0 0 0 3px ${tab.color || '#8b5cf6'}40;"`;
                preselectedBadge = '<span class="preselected-star">⭐</span>';
            }
            
            return `
                <button class="${baseClasses}${extraClasses}" 
                        ${extraStyles}
                        onclick="window.pageManager.filterByCategory('${tab.id}')"
                        title="${tab.isPreselected ? '⭐ Catégorie pré-sélectionnée pour les tâches' : ''}">
                    <div class="pill-content-twolines">
                        <div class="pill-first-line-twolines">
                            <span class="pill-icon-twolines">${tab.icon}</span>
                            <span class="pill-count-twolines">${tab.count}</span>
                            ${preselectedBadge}
                        </div>
                        <div class="pill-second-line-twolines">
                            <span class="pill-text-twolines">${tab.name}</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    }

    renderEmailsList() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        // Appliquer les filtres
        if (this.currentCategory && this.currentCategory !== 'all') {
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

    renderFlatView(emails) {
        return `
            <div class="tasks-harmonized-list">
                ${emails.map(email => this.renderEmailRow(email)).join('')}
            </div>
        `;
    }

    renderEmailRow(email) {
        const isSelected = this.selectedEmails.has(email.id);
        const hasTask = this.createdTasks.has(email.id);
        const senderName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
        const preselectedCategories = this.getTaskPreselectedCategories();
        const isPreselectedForTasks = email.isPreselectedForTasks === true || preselectedCategories.includes(email.category);
        
        const cardClasses = [
            'task-harmonized-card',
            isSelected ? 'selected' : '',
            hasTask ? 'has-task' : '',
            isPreselectedForTasks ? 'preselected-task' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${cardClasses}" 
                 data-email-id="${email.id}"
                 onclick="window.pageManager.handleEmailClick(event, '${email.id}')">
                
                <input type="checkbox" 
                       class="task-checkbox-harmonized" 
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); window.pageManager.toggleEmailSelection('${email.id}')">
                
                <div class="priority-bar-harmonized" 
                     style="background-color: ${isPreselectedForTasks ? '#8b5cf6' : this.getEmailPriorityColor(email)}"></div>
                
                <div class="task-main-content-harmonized">
                    <div class="task-header-harmonized">
                        <h3 class="task-title-harmonized">${this.escapeHtml(email.subject || 'Sans sujet')}</h3>
                        <div class="task-meta-harmonized">
                            <span class="task-type-badge-harmonized">📧 Email</span>
                            <span class="deadline-badge-harmonized">
                                📅 ${this.formatEmailDate(email.receivedDateTime)}
                            </span>
                            ${isPreselectedForTasks ? `
                                <span class="preselected-badge-harmonized">
                                    ⭐ Pré-sélectionné
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="task-recipient-harmonized">
                        <i class="fas fa-envelope"></i>
                        <span class="recipient-name-harmonized">${this.escapeHtml(senderName)}</span>
                        ${email.hasAttachments ? '<span class="reply-indicator-harmonized">• Pièce jointe</span>' : ''}
                        ${email.category && email.category !== 'other' ? `
                            <span class="category-indicator-harmonized" 
                                  style="background: ${this.getCategoryColor(email.category)}20; 
                                         color: ${this.getCategoryColor(email.category)};">
                                ${this.getCategoryIcon(email.category)} ${this.getCategoryName(email.category)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions-harmonized">
                    ${this.renderEmailActions(email)}
                </div>
            </div>
        `;
    }

    renderGroupedView(emails, groupMode) {
        const groups = this.createEmailGroups(emails, groupMode);
        
        return `
            <div class="tasks-grouped-harmonized">
                ${groups.map(group => this.renderEmailGroup(group, groupMode)).join('')}
            </div>
        `;
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

    renderEmailGroup(group, groupType) {
        const displayName = groupType === 'grouped-domain' ? `@${group.name}` : group.name;
        const avatarColor = this.generateAvatarColor(group.name);
        
        return `
            <div class="task-group-harmonized" data-group-key="${group.key}">
                <div class="group-header-harmonized" onclick="window.pageManager.toggleGroup('${group.key}')">
                    <div class="group-avatar-harmonized" style="background: ${avatarColor}">
                        ${groupType === 'grouped-domain' ? 
                            '<i class="fas fa-globe"></i>' : 
                            group.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="group-info-harmonized">
                        <div class="group-name-harmonized">${displayName}</div>
                        <div class="group-meta-harmonized">${group.count} email${group.count > 1 ? 's' : ''} • ${this.formatEmailDate(group.latestDate)}</div>
                    </div>
                    <div class="group-expand-harmonized">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="group-content-harmonized" style="display: none;">
                    ${group.emails.map(email => this.renderEmailRow(email)).join('')}
                </div>
            </div>
        `;
    }

    // ================================================
    // AUTRES MÉTHODES PAGES
    // ================================================
    async renderScanner(container) {
        console.log('[PageManager] Rendering scanner page...');
        
        const authStatus = await this.checkAuthenticationStatus();
        
        if (!authStatus.isAuthenticated) {
            container.innerHTML = `
                <div class="scanner-auth-required">
                    <div class="scanner-header">
                        <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                        <p>Connectez-vous pour analyser vos emails</p>
                    </div>
                    
                    <div class="auth-card">
                        <div class="auth-icon">
                            <i class="fab fa-microsoft"></i>
                        </div>
                        <h3>Connexion Microsoft Graph</h3>
                        <p>Accédez à vos emails Outlook/Exchange</p>
                        <button class="btn btn-primary btn-large" onclick="window.pageManager.handleLogin()">
                            <i class="fas fa-sign-in-alt"></i>
                            Se connecter à Microsoft
                        </button>
                    </div>
                    
                    <div class="scanner-info">
                        <div class="info-card">
                            <i class="fas fa-shield-alt"></i>
                            <h4>Sécurisé</h4>
                            <p>Authentification OAuth2 Microsoft</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-robot"></i>
                            <h4>IA Intégrée</h4>
                            <p>Analyse intelligente avec Claude AI</p>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-tasks"></i>
                            <h4>Productivité</h4>
                            <p>Convertit automatiquement en tâches</p>
                        </div>
                    </div>
                </div>
            `;
            this.addScannerStyles();
            return;
        }
        
        // User is authenticated, try to use the scan module
        if (window.minimalScanModule && typeof window.minimalScanModule.render === 'function') {
            try {
                await window.minimalScanModule.render(container);
                return;
            } catch (error) {
                console.error('[PageManager] Error with minimalScanModule:', error);
            }
        }
        
        // Fallback scanner interface
        container.innerHTML = `
            <div class="scanner-authenticated">
                <div class="scanner-header">
                    <h1><i class="fas fa-search"></i> Scanner d'emails</h1>
                    <p>Analysez vos emails et créez des tâches automatiquement</p>
                </div>
                
                <div class="scanner-controls">
                    <div class="control-group">
                        <label for="folder-select">Dossier à analyser:</label>
                        <select id="folder-select" class="form-select">
                            <option value="inbox">Boîte de réception</option>
                            <option value="sentitems">Éléments envoyés</option>
                            <option value="junkemail">Courrier indésirable</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label for="email-count">Nombre d'emails:</label>
                        <select id="email-count" class="form-select">
                            <option value="25">25 emails</option>
                            <option value="50" selected>50 emails</option>
                            <option value="100">100 emails</option>
                        </select>
                    </div>
                </div>
                
                <div class="scanner-actions">
                    <button class="btn btn-primary btn-large" onclick="window.pageManager.startEmailScan()">
                        <i class="fas fa-play"></i>
                        Démarrer l'analyse
                    </button>
                    
                    <button class="btn btn-secondary" onclick="window.pageManager.testMailConnection()">
                        <i class="fas fa-plug"></i>
                        Tester la connexion
                    </button>
                </div>
                
                <div id="scan-results" class="scan-results" style="display: none;"></div>
                
                <div class="scanner-status">
                    <div class="status-item">
                        <i class="fas fa-user"></i>
                        <span>Connecté${authStatus.user ? ' en tant que ' + authStatus.user : ''}</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-database"></i>
                        <span>EmailScanner: ${window.emailScanner ? 'Disponible' : 'Non disponible'}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.addScannerStyles();
    }

    async startEmailScan() {
        console.log('[PageManager] Starting email scan...');
        
        const folderSelect = document.getElementById('folder-select');
        const countSelect = document.getElementById('email-count');
        const resultsDiv = document.getElementById('scan-results');
        
        const folder = folderSelect ? folderSelect.value : 'inbox';
        const count = countSelect ? parseInt(countSelect.value) : 50;
        
        try {
            this.showLoading(`Analyse de ${count} emails...`);
            
            // Utiliser EmailScanner si disponible
            if (window.emailScanner && typeof window.emailScanner.scan === 'function') {
                const results = await window.emailScanner.scan({
                    folder: folder,
                    maxEmails: count,
                    onProgress: (progress) => {
                        console.log('[PageManager] Scan progress:', progress);
                    }
                });
                
                console.log(`[PageManager] Scan completed with ${results.total} emails`);
                
                if (resultsDiv) {
                    resultsDiv.style.display = 'block';
                    resultsDiv.innerHTML = `
                        <div class="scan-success">
                            <h3><i class="fas fa-check-circle"></i> Analyse terminée</h3>
                            <p>${results.total} emails analysés avec succès</p>
                            <div class="result-actions">
                                <button class="btn btn-primary" onclick="window.pageManager.loadPage('emails')">
                                    <i class="fas fa-envelope"></i>
                                    Voir les emails
                                </button>
                                <button class="btn btn-secondary" onclick="window.pageManager.loadPage('tasks')">
                                    <i class="fas fa-tasks"></i>
                                    Voir les tâches
                                </button>
                            </div>
                        </div>
                    `;
                }
                
                this.hideLoading();
                this.showToast(`${results.total} emails analysés avec succès!`, 'success');
                
            } else {
                throw new Error('EmailScanner non disponible');
            }
            
        } catch (error) {
            console.error('[PageManager] Email scan error:', error);
            this.hideLoading();
            this.showError('Erreur lors de l\'analyse: ' + error.message);
            
            if (resultsDiv) {
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = `
                    <div class="scan-error">
                        <h3><i class="fas fa-exclamation-triangle"></i> Erreur d'analyse</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-secondary" onclick="window.pageManager.testMailConnection()">
                            <i class="fas fa-plug"></i>
                            Tester la connexion
                        </button>
                    </div>
                `;
            }
        }
    }

    async testMailConnection() {
        console.log('[PageManager] Testing mail connection...');
        
        try {
            this.showLoading('Test de connexion...');
            
            if (window.mailService && typeof window.mailService.testConnection === 'function') {
                const result = await window.mailService.testConnection();
                
                this.hideLoading();
                
                if (result.success) {
                    this.showToast(`Connexion réussie! Utilisateur: ${result.user}`, 'success');
                } else {
                    this.showError(`Test de connexion échoué: ${result.error}`);
                }
            } else {
                throw new Error('MailService non disponible');
            }
            
        } catch (error) {
            console.error('[PageManager] Connection test error:', error);
            this.hideLoading();
            this.showError('Erreur de test: ' + error.message);
        }
    }

    async renderTasks(container) {
        if (window.tasksView && window.tasksView.render) {
            window.tasksView.render(container);
        } else {
            container.innerHTML = `
                <div class="tasks-page">
                    <div class="page-header">
                        <h1><i class="fas fa-tasks"></i> Tâches</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h3 class="empty-title">Aucune tâche</h3>
                        <p class="empty-text">Créez des tâches à partir de vos emails</p>
                        <button class="btn btn-primary" onclick="window.pageManager.loadPage('emails')">
                            <i class="fas fa-envelope"></i>
                            Voir les emails
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async renderCategories(container) {
        const categories = this.getCategories();
        
        container.innerHTML = `
            <div class="categories-page">
                <div class="page-header">
                    <h1><i class="fas fa-tags"></i> Catégories</h1>
                </div>
                
                <div class="categories-grid">
                    ${Object.entries(categories).map(([id, cat]) => `
                        <div class="category-card">
                            <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                                ${cat.icon}
                            </div>
                            <h3>${cat.name}</h3>
                            <p>${cat.description || 'Pas de description'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async renderSettings(container) {
        if (window.categoriesPage && window.categoriesPage.renderSettings) {
            window.categoriesPage.renderSettings(container);
        } else {
            container.innerHTML = `
                <div class="settings-page">
                    <div class="page-header">
                        <h1><i class="fas fa-cog"></i> Paramètres</h1>
                    </div>
                    
                    <div class="settings-grid">
                        <div class="settings-card">
                            <h3><i class="fas fa-robot"></i> Configuration IA</h3>
                            <p>Configurez l'analyseur IA Claude</p>
                            <button class="btn btn-primary" onclick="window.pageManager.configureAI()">
                                <i class="fas fa-cog"></i> Configurer
                            </button>
                        </div>
                        
                        <div class="settings-card">
                            <h3><i class="fas fa-tags"></i> Catégories</h3>
                            <p>Gérez vos catégories d'emails</p>
                            <button class="btn btn-secondary" onclick="window.pageManager.loadPage('categories')">
                                <i class="fas fa-tags"></i> Gérer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async renderRanger(container) {
        if (window.domainOrganizer && window.domainOrganizer.showPage) {
            window.domainOrganizer.showPage(container);
        } else {
            container.innerHTML = `
                <div class="ranger-page">
                    <div class="page-header">
                        <h1><i class="fas fa-folder-tree"></i> Ranger par domaine</h1>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-folder-tree"></i>
                        </div>
                        <h3 class="empty-title">Module de rangement</h3>
                        <p class="empty-text">Organisez vos emails par domaine</p>
                    </div>
                </div>
            `;
        }
    }

    // ================================================
    // EMAIL MANAGEMENT
    // ================================================
    toggleEmailSelection(emailId) {
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
        } else {
            this.selectedEmails.add(emailId);
        }
        this.refreshEmailsView();
    }

    toggleAllSelection() {
        const visibleEmails = this.getVisibleEmails();
        const allSelected = visibleEmails.length > 0 && visibleEmails.every(email => this.selectedEmails.has(email.id));
        
        if (allSelected) {
            visibleEmails.forEach(email => {
                this.selectedEmails.delete(email.id);
            });
            this.showToast('Emails désélectionnés', 'info');
        } else {
            visibleEmails.forEach(email => {
                this.selectedEmails.add(email.id);
            });
            this.showToast(`${visibleEmails.length} emails sélectionnés`, 'success');
        }
        
        this.refreshEmailsView();
    }

    clearSelection() {
        this.selectedEmails.clear();
        this.refreshEmailsView();
        this.showToast('Sélection effacée', 'info');
    }

    handleEmailClick(event, emailId) {
        if (event.target.type === 'checkbox') return;
        if (event.target.closest('.task-actions-harmonized')) return;
        this.showEmailModal(emailId);
    }

    changeViewMode(mode) {
        this.currentViewMode = mode;
        this.refreshEmailsView();
    }

    filterByCategory(categoryId) {
        this.currentCategory = categoryId;
        this.refreshEmailsView();
    }

    refreshEmailsView() {
        const emailsContainer = document.querySelector('.tasks-container-harmonized');
        if (emailsContainer) {
            emailsContainer.innerHTML = this.renderEmailsList();
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
        this.refreshEmailsView();
    }

    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById('emailSearchInput');
        if (searchInput) searchInput.value = '';
        this.refreshEmailsView();
    }

    hideExplanationMessage() {
        this.hideExplanation = true;
        this.setLocalStorageItem('hideEmailExplanation', 'true');
        this.refreshEmailsView();
    }

    toggleGroup(groupKey) {
        const group = document.querySelector(`[data-group-key="${groupKey}"]`);
        if (!group) return;
        
        const content = group.querySelector('.group-content-harmonized');
        const icon = group.querySelector('.group-expand-harmonized i');
        const header = group.querySelector('.group-header-harmonized');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            group.classList.add('expanded');
            header.classList.add('expanded-header');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            group.classList.remove('expanded');
            header.classList.remove('expanded-header');
        }
    }

    // ================================================
    // TASK CREATION
    // ================================================
    async createTasksFromSelection() {
        if (this.selectedEmails.size === 0) {
            this.showToast('Aucun email sélectionné', 'warning');
            return;
        }
        
        let created = 0;
        this.showLoading(`Création de ${this.selectedEmails.size} tâches...`);
        
        for (const emailId of this.selectedEmails) {
            const email = this.getEmailById(emailId);
            if (!email || this.createdTasks.has(emailId)) continue;
            
            try {
                const taskData = this.buildTaskDataFromEmail(email);
                
                if (window.taskManager) {
                    const task = window.taskManager.createTaskFromEmail(taskData, email);
                    if (task) {
                        this.createdTasks.set(emailId, task.id);
                        created++;
                    }
                }
            } catch (error) {
                console.error('[PageManager] Error creating task:', emailId, error);
            }
        }
        
        this.hideLoading();
        
        if (created > 0) {
            this.safeCall(() => window.taskManager?.saveTasks());
            this.showToast(`${created} tâche${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''}`, 'success');
            this.clearSelection();
        } else {
            this.showToast('Aucune tâche créée', 'warning');
        }
    }

    buildTaskDataFromEmail(email) {
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        const senderEmail = email.from?.emailAddress?.address || '';
        const senderDomain = senderEmail.split('@')[1] || 'unknown';
        
        return {
            id: this.generateTaskId(),
            title: `Email de ${senderName}`,
            description: email.bodyPreview || email.subject || '',
            priority: 'medium',
            dueDate: null,
            status: 'todo',
            emailId: email.id,
            category: email.category || 'other',
            createdAt: new Date().toISOString(),
            aiGenerated: false,
            emailFrom: senderEmail,
            emailFromName: senderName,
            emailSubject: email.subject,
            emailDomain: senderDomain,
            emailDate: email.receivedDateTime,
            hasAttachments: email.hasAttachments || false,
            tags: [senderDomain].filter(Boolean),
            method: 'manual'
        };
    }

    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getEmailById(emailId) {
        const emails = this.getAllEmails();
        return emails.find(email => email.id === emailId) || null;
    }

    // ================================================
    // MODALS
    // ================================================
    showEmailModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'email_modal_' + Date.now();
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>Email Complet</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="email-header">
                            <div class="email-field">
                                <span class="field-label">De:</span>
                                <span class="field-value">${email.from?.emailAddress?.name || ''} &lt;${email.from?.emailAddress?.address || ''}&gt;</span>
                            </div>
                            <div class="email-field">
                                <span class="field-label">Date:</span>
                                <span class="field-value">${new Date(email.receivedDateTime).toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="email-field">
                                <span class="field-label">Sujet:</span>
                                <span class="field-value">${email.subject || 'Sans sujet'}</span>
                            </div>
                        </div>
                        <div class="email-body">
                            ${this.getEmailContent(email)}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="btn btn-secondary">
                            Fermer
                        </button>
                        ${!this.createdTasks.has(emailId) ? `
                            <button onclick="document.getElementById('${uniqueId}').remove(); window.pageManager.showTaskCreationModal('${emailId}');" class="btn btn-primary">
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

    showTaskCreationModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) return;

        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        const uniqueId = 'task_modal_' + Date.now();
        const senderName = email.from?.emailAddress?.name || 'Inconnu';
        
        const modalHTML = `
            <div id="${uniqueId}" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>Créer une tâche</h2>
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label>Titre de la tâche</label>
                            <input type="text" id="task-title" value="Email de ${senderName}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="task-description" class="form-textarea" rows="4">${email.bodyPreview || email.subject || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="task-priority" class="form-select">
                                    <option value="low">Basse</option>
                                    <option value="medium" selected>Normale</option>
                                    <option value="high">Haute</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date d'échéance</label>
                                <input type="date" id="task-duedate" class="form-input">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('${uniqueId}').remove(); document.body.style.overflow = 'auto';" class="btn btn-secondary">
                            Annuler
                        </button>
                        <button onclick="window.pageManager.createTaskFromModal('${email.id}'); document.getElementById('${uniqueId}').remove();" class="btn btn-primary">
                            <i class="fas fa-check"></i> Créer la tâche
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    async createTaskFromModal(emailId) {
        const email = this.getEmailById(emailId);
        if (!email) {
            this.showToast('Email non trouvé', 'error');
            return;
        }

        const title = document.getElementById('task-title')?.value;
        const description = document.getElementById('task-description')?.value;
        const priority = document.getElementById('task-priority')?.value;
        const dueDate = document.getElementById('task-duedate')?.value;

        if (!title) {
            this.showToast('Le titre est requis', 'warning');
            return;
        }

        try {
            const taskData = {
                ...this.buildTaskDataFromEmail(email),
                title,
                description,
                priority,
                dueDate
            };

            const task = window.taskManager?.createTaskFromEmail(taskData, email);
            if (task) {
                this.createdTasks.set(emailId, task.id);
                this.safeCall(() => window.taskManager?.saveTasks());
                this.showToast('Tâche créée avec succès', 'success');
                this.refreshEmailsView();
            } else {
                throw new Error('Erreur lors de la création de la tâche');
            }
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast('Erreur lors de la création', 'error');
        }
    }

    // ================================================
    // ACTIONS
    // ================================================
    async refreshEmails() {
        this.showLoading('Actualisation...');
        
        try {
            if (this.safeCall(() => window.emailScanner?.recategorizeEmails)) {
                await window.emailScanner.recategorizeEmails();
            }
            
            await this.loadPage('emails');
            this.showToast('Emails actualisés', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur d\'actualisation', 'error');
        }
    }

    configureAI() {
        if (window.aiTaskAnalyzer && window.aiTaskAnalyzer.showConfigurationModal) {
            window.aiTaskAnalyzer.showConfigurationModal();
        } else {
            this.showToast('Configuration IA non disponible', 'warning');
        }
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

    renderEmailActions(email) {
        const hasTask = this.createdTasks.has(email.id);
        const actions = [];
        
        if (!hasTask) {
            actions.push(`
                <button class="action-btn-harmonized create-task" 
                        onclick="event.stopPropagation(); window.pageManager.showTaskCreationModal('${email.id}')"
                        title="Créer une tâche">
                    <i class="fas fa-tasks"></i>
                </button>
            `);
        } else {
            actions.push(`
                <button class="action-btn-harmonized view-task" 
                        onclick="event.stopPropagation(); window.pageManager.openCreatedTask('${email.id}')"
                        title="Voir la tâche">
                    <i class="fas fa-check-circle"></i>
                </button>
            `);
        }
        
        actions.push(`
            <button class="action-btn-harmonized details" 
                    onclick="event.stopPropagation(); window.pageManager.showEmailModal('${email.id}')"
                    title="Voir l'email">
                <i class="fas fa-eye"></i>
            </button>
        `);
        
        return actions.join('');
    }

    // ================================================
    // UTILITY METHODS
    // ================================================
    safeCall(fn) {
        try {
            return fn();
        } catch (error) {
            console.warn('[PageManager] Safe call failed:', error);
            return null;
        }
    }

    getPageContainer() {
        return document.getElementById('pageContent') || document.querySelector('.page-content') || document.querySelector('#content');
    }

    showPageContent() {
        const pageContent = this.getPageContainer();
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
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

    showLoading(message = 'Chargement...') {
        if (window.uiManager && window.uiManager.showLoading) {
            window.uiManager.showLoading(message);
        } else {
            console.log(`[PageManager] Loading: ${message}`);
        }
    }

    hideLoading() {
        if (window.uiManager && window.uiManager.hideLoading) {
            window.uiManager.hideLoading();
        }
    }

    showError(message) {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, 'error');
        } else {
            console.error(`[PageManager] Error: ${message}`);
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            console.log(`[PageManager] ${type.toUpperCase()}: ${message}`);
        }
    }

    renderErrorPage(error) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Erreur de chargement</h3>
                <p class="empty-state-text">${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    Recharger la page
                </button>
            </div>
        `;
    }

    renderEmptyEmailsState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title">Aucun email trouvé</h3>
                <p class="empty-state-text">
                    Utilisez le scanner pour récupérer et analyser vos emails.
                </p>
                <button class="btn btn-primary" onclick="window.pageManager.loadPage('scanner')">
                    <i class="fas fa-search"></i>
                    Aller au scanner
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state-harmonized">
                <div class="empty-state-icon-harmonized">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title-harmonized">Aucun email trouvé</h3>
                <p class="empty-state-text-harmonized">
                    ${this.searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun email dans cette catégorie'}
                </p>
                ${this.searchTerm ? `
                    <button class="btn-harmonized btn-primary" onclick="window.pageManager.clearSearch()">
                        <i class="fas fa-undo"></i>
                        <span>Effacer la recherche</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    getVisibleEmails() {
        const emails = this.getAllEmails();
        let filteredEmails = emails;
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            filteredEmails = filteredEmails.filter(email => (email.category || 'other') === this.currentCategory);
        }
        
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(email => this.matchesSearch(email, this.searchTerm));
        }
        
        return filteredEmails;
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

    calculateCategoryCounts(emails) {
        const counts = {};
        emails.forEach(email => {
            const cat = email.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }

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

    getEmailPriorityColor(email) {
        if (email.importance === 'high') return '#ef4444';
        if (email.hasAttachments) return '#f97316';
        if (email.categoryScore >= 80) return '#10b981';
        return '#3b82f6';
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

    getEmailContent(email) {
        if (email.body?.content) {
            return email.body.content;
        }
        return `<p>${email.bodyPreview || 'Aucun contenu disponible'}</p>`;
    }

    getCategoryColor(categoryId) {
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId));
        return category?.color || '#64748b';
    }

    getCategoryIcon(categoryId) {
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId));
        return category?.icon || '📌';
    }

    getCategoryName(categoryId) {
        const category = this.safeCall(() => window.categoryManager?.getCategory(categoryId));
        return category?.name || categoryId || 'Autre';
    }

    // ================================================
    // STYLES
    // ================================================
    addHarmonizedEmailStyles() {
        if (document.getElementById('harmonizedEmailStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'harmonizedEmailStyles';
        styles.textContent = `
            /* Variables CSS */
            :root {
                --btn-height: 44px;
                --btn-padding: 16px;
                --btn-font-size: 13px;
                --btn-border-radius: 10px;
                --btn-font-weight: 600;
                --card-padding: 14px;
                --card-border-radius: 12px;
                --transition-speed: 0.2s;
                --shadow-base: 0 2px 8px rgba(0, 0, 0, 0.05);
                --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
                --preselect-color: #8b5cf6;
            }
            
            /* Auth Required State */
            .auth-required-state {
                text-align: center;
                padding: 60px 30px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
                max-width: 500px;
                margin: 0 auto;
            }
            
            .auth-icon {
                font-size: 48px;
                margin-bottom: 20px;
                color: #f59e0b;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .auth-title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
            }
            
            .auth-text {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 32px;
                line-height: 1.6;
            }
            
            .auth-actions {
                display: flex;
                gap: 16px;
                justify-content: center;
                flex-wrap: wrap;
                margin-bottom: 20px;
            }
            
            .auth-debug {
                background: #f8f9fa !important;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                color: #666;
                text-align: left;
                font-family: monospace;
                line-height: 1.4;
            }
            
            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.75);
                z-index: 99999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                backdrop-filter: blur(4px);
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
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .modal-content {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .modal-footer {
                padding: 24px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            /* Form Styles */
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .form-input, .form-textarea, .form-select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.2s;
                font-family: inherit;
            }
            
            .form-input:focus, .form-textarea:focus, .form-select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .form-textarea {
                resize: vertical;
                min-height: 80px;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            
            /* Email Header */
            .email-header {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .email-field {
                margin-bottom: 12px;
                display: flex;
                gap: 8px;
            }
            
            .email-field:last-child {
                margin-bottom: 0;
            }
            
            .field-label {
                font-weight: 700;
                color: #374151;
                min-width: 60px;
                flex-shrink: 0;
            }
            
            .field-value {
                color: #1f2937;
                word-break: break-word;
            }
            
            .email-body {
                background: white;
                border: 1px solid #e5e7eb;
                padding: 20px;
                border-radius: 12px;
                max-height: 400px;
                overflow-y: auto;
                line-height: 1.6;
                color: #374151;
            }
            
            /* Main Page Styles */
            .tasks-page-modern {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                padding: 16px;
                font-size: var(--btn-font-size);
            }
            
            .explanation-text-harmonized {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: var(--card-border-radius);
                padding: 12px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #1e40af;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.5;
                position: relative;
            }
            
            .explanation-close-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                color: #3b82f6;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .explanation-close-btn:hover {
                background: rgba(59, 130, 246, 0.2);
                transform: scale(1.1);
            }
            
            /* Controls Bar */
            .controls-bar-harmonized {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: var(--card-border-radius);
                padding: 12px;
                margin-bottom: 12px;
                box-shadow: var(--shadow-base);
                min-height: calc(var(--btn-height) + 24px);
            }
            
            .search-section-harmonized {
                flex: 0 0 300px;
                height: var(--btn-height);
            }
            
            .search-box-harmonized {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
            }
            
            .search-input-harmonized {
                width: 100%;
                height: var(--btn-height);
                padding: 0 12px 0 44px;
                border: 1px solid #d1d5db;
                border-radius: var(--btn-border-radius);
                font-size: var(--btn-font-size);
                background: #f9fafb;
                transition: all var(--transition-speed) ease;
                outline: none;
            }
            
            .search-input-harmonized:focus {
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .search-icon-harmonized {
                position: absolute;
                left: 12px;
                color: #9ca3af;
                pointer-events: none;
            }
            
            .search-clear-harmonized {
                position: absolute;
                right: 8px;
                background: #ef4444;
                color: white;
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                transition: all var(--transition-speed) ease;
            }
            
            .search-clear-harmonized:hover {
                background: #dc2626;
                transform: scale(1.1);
            }
            
            /* View Modes */
            .view-modes-harmonized {
                display: flex;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: var(--btn-border-radius);
                padding: 4px;
                gap: 2px;
                height: var(--btn-height);
            }
            
            .view-mode-harmonized {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 0 var(--btn-padding);
                height: calc(var(--btn-height) - 8px);
                border: none;
                background: transparent;
                color: #6b7280;
                border-radius: calc(var(--btn-border-radius) - 2px);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                min-width: 120px;
            }
            
            .view-mode-harmonized:hover {
                background: rgba(255, 255, 255, 0.8);
                color: #374151;
            }
            
            .view-mode-harmonized.active {
                background: white;
                color: #1f2937;
                box-shadow: var(--shadow-base);
                font-weight: 700;
            }
            
            /* Action Buttons */
            .action-buttons-harmonized {
                display: flex;
                align-items: center;
                gap: 8px;
                height: var(--btn-height);
                flex-shrink: 0;
            }
            
            .btn-harmonized {
                height: var(--btn-height);
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                border-radius: var(--btn-border-radius);
                padding: 0 var(--btn-padding);
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: var(--shadow-base);
                white-space: nowrap;
            }
            
            .btn-harmonized:hover {
                background: #f9fafb;
                border-color: #6366f1;
                color: #1f2937;
                transform: translateY(-1px);
                box-shadow: var(--shadow-hover);
            }
            
            .btn-harmonized.btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            }
            
            .btn-harmonized.btn-primary:hover {
                background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
            }
            
            .btn-harmonized.btn-secondary {
                background: #f8fafc;
                color: #475569;
                border-color: #e2e8f0;
            }
            
            .btn-harmonized.btn-secondary:hover {
                background: #f1f5f9;
                color: #334155;
                border-color: #cbd5e1;
            }
            
            .btn-harmonized.btn-selection-toggle {
                background: #f0f9ff;
                color: #0369a1;
                border-color: #0ea5e9;
            }
            
            .btn-harmonized.btn-clear-selection {
                background: #f3f4f6;
                color: #6b7280;
                border: none;
                width: var(--btn-height);
                min-width: var(--btn-height);
                padding: 0;
            }
            
            .selection-info-harmonized {
                height: var(--btn-height);
                padding: 0 var(--btn-padding);
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 1px solid #93c5fd;
                border-radius: var(--btn-border-radius);
                font-size: var(--btn-font-size);
                font-weight: var(--btn-font-weight);
                color: #1e40af;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            /* Category Filters */
            .status-filters-harmonized-twolines {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
                flex-wrap: wrap;
                width: 100%;
            }
            
            .status-pill-harmonized-twolines {
                height: 60px;
                padding: 8px;
                font-size: 12px;
                font-weight: 700;
                flex: 0 1 calc(16.666% - 8px);
                min-width: 120px;
                max-width: 180px;
                border-radius: var(--btn-border-radius);
                box-shadow: var(--shadow-base);
                transition: all var(--transition-speed) ease;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: white;
                color: #374151;
                border: 1px solid #e5e7eb;
                cursor: pointer;
                position: relative;
                overflow: visible;
            }
            
            .status-pill-harmonized-twolines.preselected-category {
                border-width: 2px;
                position: relative;
            }
            
            .status-pill-harmonized-twolines.preselected-category::before {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: inherit;
                background: linear-gradient(45deg, var(--preselect-color), #a78bfa, var(--preselect-color));
                background-size: 300% 300%;
                animation: gradientShift 4s ease infinite;
                z-index: -1;
                opacity: 0.3;
            }
            
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .pill-content-twolines {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .pill-first-line-twolines {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;
                position: relative;
            }
            
            .pill-icon-twolines {
                font-size: 16px;
            }
            
            .pill-count-twolines {
                background: rgba(0, 0, 0, 0.1);
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 800;
                min-width: 18px;
                text-align: center;
            }
            
            .preselected-star {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--preselect-color);
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
                z-index: 1;
            }
            
            .pill-text-twolines {
                font-weight: 700;
                font-size: 12px;
                line-height: 1.2;
                text-align: center;
            }
            
            .status-pill-harmonized-twolines:hover {
                border-color: #3b82f6;
                background: #f0f9ff;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
            }
            
            .status-pill-harmonized-twolines.active {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border-color: #3b82f6;
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                transform: translateY(-2px);
            }
            
            .status-pill-harmonized-twolines.active .pill-count-twolines {
                background: rgba(255, 255, 255, 0.3);
                color: white;
            }
            
            /* Email Cards */
            .tasks-container-harmonized {
                background: transparent;
            }
            
            .tasks-harmonized-list {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .task-harmonized-card {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0;
                padding: var(--card-padding);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: 76px;
                max-height: 76px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .task-harmonized-card:first-child {
                border-top-left-radius: var(--card-border-radius);
                border-top-right-radius: var(--card-border-radius);
                border-top: 1px solid #e5e7eb;
            }
            
            .task-harmonized-card:last-child {
                border-bottom-left-radius: var(--card-border-radius);
                border-bottom-right-radius: var(--card-border-radius);
                border-bottom: 1px solid #e5e7eb;
            }
            
            .task-harmonized-card:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                border-color: rgba(99, 102, 241, 0.2);
                border-left: 3px solid #6366f1;
                z-index: 1;
            }
            
            .task-harmonized-card.selected {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                border-color: #3b82f6;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
                z-index: 2;
            }
            
            .task-harmonized-card.has-task {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 3px solid #22c55e;
            }
            
            .task-harmonized-card.preselected-task {
                background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
                border-left: 3px solid var(--preselect-color);
                border-color: rgba(139, 92, 246, 0.3);
            }
            
            .task-harmonized-card.preselected-task:hover {
                border-left: 4px solid var(--preselect-color);
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
                border-color: rgba(139, 92, 246, 0.4);
            }
            
            .task-harmonized-card.preselected-task.selected {
                background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
                border-left: 4px solid var(--preselect-color);
                border-color: var(--preselect-color);
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
            }
            
            .task-checkbox-harmonized {
                margin-right: 12px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 6px;
                border: 2px solid #d1d5db;
                background: white;
                transition: all var(--transition-speed) ease;
                flex-shrink: 0;
                appearance: none;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .task-checkbox-harmonized:checked {
                background: #6366f1;
                border-color: #6366f1;
            }
            
            .task-checkbox-harmonized:checked::after {
                content: '✓';
                color: white;
                font-size: 12px;
                font-weight: 700;
            }
            
            .priority-bar-harmonized {
                width: 4px;
                height: 56px;
                border-radius: 2px;
                margin-right: 12px;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .task-main-content-harmonized {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }
            
            .task-header-harmonized {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 4px;
            }
            
            .task-title-harmonized {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                margin: 0;
                line-height: 1.3;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .task-meta-harmonized {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .task-type-badge-harmonized,
            .deadline-badge-harmonized,
            .preselected-badge-harmonized {
                display: flex;
                align-items: center;
                gap: 3px;
                background: #f8fafc;
                color: #64748b;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #e2e8f0;
                white-space: nowrap;
            }
            
            .preselected-badge-harmonized {
                background: linear-gradient(135deg, var(--preselect-color) 0%, #7c3aed 100%);
                color: white !important;
                border: none !important;
                font-weight: 700 !important;
                box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
            }
            
            .task-recipient-harmonized {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }
            
            .recipient-name-harmonized {
                font-weight: 600;
                color: #374151;
            }
            
            .reply-indicator-harmonized {
                color: #dc2626;
                font-weight: 600;
                font-size: 10px;
            }
            
            .category-indicator-harmonized {
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 3px;
                transition: all 0.2s ease;
            }
            
            .task-actions-harmonized {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-left: 12px;
                flex-shrink: 0;
            }
            
            .action-btn-harmonized {
                width: 36px;
                height: 36px;
                border: 2px solid transparent;
                border-radius: var(--btn-border-radius);
                background: rgba(255, 255, 255, 0.9);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 13px;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            }
            
            .action-btn-harmonized:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .action-btn-harmonized.create-task {
                color: #3b82f6;
            }
            
            .action-btn-harmonized.create-task:hover {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
                color: #2563eb;
            }
            
            .action-btn-harmonized.view-task {
                color: #16a34a;
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            }
            
            .action-btn-harmonized.details {
                color: #8b5cf6;
            }
            
            .action-btn-harmonized.details:hover {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-color: #8b5cf6;
                color: #7c3aed;
            }
            
            /* Vue groupée */
            .tasks-grouped-harmonized {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .task-group-harmonized {
                background: transparent;
                border: none;
                border-radius: 0;
                overflow: visible;
                margin: 0;
                padding: 0;
            }
            
            .group-header-harmonized {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0;
                padding: var(--card-padding);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: 76px;
                max-height: 76px;
                border-bottom: 1px solid #e5e7eb;
                gap: 12px;
            }
            
            .task-group-harmonized:first-child .group-header-harmonized {
                border-top-left-radius: var(--card-border-radius);
                border-top-right-radius: var(--card-border-radius);
                border-top: 1px solid #e5e7eb;
            }
            
            .task-group-harmonized:last-child .group-header-harmonized:not(.expanded-header) {
                border-bottom-left-radius: var(--card-border-radius);
                border-bottom-right-radius: var(--card-border-radius);
                border-bottom: 1px solid #e5e7eb;
            }
            
            .group-header-harmonized:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                border-color: rgba(99, 102, 241, 0.2);
                border-left: 3px solid #6366f1;
                z-index: 1;
            }
            
            .task-group-harmonized.expanded .group-header-harmonized {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                border-color: #3b82f6;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
                z-index: 2;
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }
            
            .group-avatar-harmonized {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 16px;
                flex-shrink: 0;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }
            
            .group-info-harmonized {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
                height: 100%;
            }
            
            .group-name-harmonized {
                font-weight: 700;
                color: #1f2937;
                font-size: 15px;
                margin: 0;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .group-meta-harmonized {
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }
            
            .group-expand-harmonized {
                width: 36px;
                height: 36px;
                border: 2px solid transparent;
                border-radius: var(--btn-border-radius);
                background: rgba(255, 255, 255, 0.9);
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 13px;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                flex-shrink: 0;
            }
            
            .group-expand-harmonized:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                color: #374151;
            }
            
            .task-group-harmonized.expanded .group-expand-harmonized {
                transform: rotate(180deg) translateY(-1px);
                color: #3b82f6;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-color: #3b82f6;
            }
            
            .group-content-harmonized {
                background: transparent;
                margin: 0;
                padding: 0;
                display: none;
            }
            
            .task-group-harmonized.expanded .group-content-harmonized {
                display: block;
            }
            
            .group-content-harmonized .task-harmonized-card {
                border-radius: 0;
                margin: 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .group-content-harmonized .task-harmonized-card:last-child {
                border-bottom-left-radius: var(--card-border-radius);
                border-bottom-right-radius: var(--card-border-radius);
                border-bottom: 1px solid #e5e7eb;
            }
            
            /* États vides */
            .empty-state, .empty-state-harmonized {
                text-align: center;
                padding: 60px 30px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .empty-state-icon, .empty-state-icon-harmonized {
                font-size: 48px;
                margin-bottom: 20px;
                color: #d1d5db;
            }
            
            .empty-state-title, .empty-state-title-harmonized {
                font-size: 22px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 12px;
            }
            
            .empty-state-text, .empty-state-text-harmonized {
                font-size: 15px;
                margin-bottom: 24px;
                max-width: 400px;
                line-height: 1.6;
                color: #6b7280;
                font-weight: 500;
            }
            
            /* Scanner Styles */
            .scanner-authenticated, .scanner-auth-required {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                text-align: center;
            }
            
            .scanner-header h1 {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
            }
            
            .scanner-header p {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 40px;
            }
            
            .scanner-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 16px;
                border: 1px solid #e5e7eb;
            }
            
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .control-group label {
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .scanner-actions {
                text-align: center;
                margin-bottom: 40px;
                display: flex;
                gap: 16px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .btn-large {
                padding: 16px 32px;
                font-size: 16px;
                font-weight: 700;
            }
            
            .scan-results {
                margin-top: 30px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 16px;
                border: 1px solid #e5e7eb;
            }
            
            .scan-success {
                text-align: center;
                color: #059669;
            }
            
            .scan-success h3 {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
            }
            
            .scan-error {
                text-align: center;
                color: #dc2626;
            }
            
            .scan-error h3 {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
            }
            
            .result-actions {
                display: flex;
                gap: 16px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 20px;
            }
            
            .scanner-status {
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 20px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                margin-top: 30px;
                flex-wrap: wrap;
                gap: 16px;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #475569;
                font-weight: 500;
            }
            
            .status-item i {
                color: #3b82f6;
                width: 16px;
                text-align: center;
            }
            
            .auth-card {
                background: rgba(255, 255, 255, 0.95);
                padding: 40px;
                border-radius: 20px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                margin-bottom: 40px;
                backdrop-filter: blur(20px);
            }
            
            .auth-card .auth-icon {
                font-size: 64px;
                margin-bottom: 20px;
                color: #0078d4;
            }
            
            .auth-card h3 {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .auth-card p {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 32px;
                line-height: 1.6;
            }
            
            .scanner-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
                margin-top: 40px;
            }
            
            .info-card {
                background: white;
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                border: 1px solid #e5e7eb;
            }
            
            .info-card i {
                font-size: 32px;
                color: #3b82f6;
                margin-bottom: 16px;
            }
            
            .info-card h4 {
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .info-card p {
                color: #6b7280;
                line-height: 1.6;
            }
            
            /* Pages */
            .page-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .page-header h1 {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
            }
            
            .categories-grid, .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 24px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .category-card, .settings-card {
                background: white;
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                border: 1px solid #e5e7eb;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            .category-card:hover, .settings-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
            
            .category-icon {
                width: 64px;
                height: 64px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin: 0 auto 16px;
            }
            
            .category-card h3, .settings-card h3 {
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }
            
            .category-card p, .settings-card p {
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            
            .module-placeholder {
                text-align: center;
                padding: 60px 30px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 16px;
                border: 1px solid #e5e7eb;
            }
            
            .loading-spinner {
                font-size: 32px;
                color: #3b82f6;
                margin-bottom: 16px;
            }
            
            /* Buttons */
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                outline: none;
            }
            
            .btn.btn-primary {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
            }
            
            .btn.btn-primary:hover {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
            }
            
            .btn.btn-secondary {
                background: #f8fafc;
                color: #475569;
                border: 1px solid #e2e8f0;
            }
            
            .btn.btn-secondary:hover {
                background: #f1f5f9;
                color: #334155;
                border-color: #cbd5e1;
            }
            
            /* Responsive Design */
            @media (max-width: 1024px) {
                .controls-bar-harmonized {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                    padding: 16px;
                }
                
                .search-section-harmonized {
                    flex: none;
                    width: 100%;
                    order: 1;
                }
                
                .view-modes-harmonized {
                    width: 100%;
                    justify-content: space-around;
                    order: 2;
                }
                
                .action-buttons-harmonized {
                    width: 100%;
                    justify-content: center;
                    flex-wrap: wrap;
                    order: 3;
                }
                
                .status-filters-harmonized-twolines .status-pill-harmonized-twolines {
                    flex: 0 1 calc(25% - 8px);
                    min-width: 80px;
                    max-width: 140px;
                    height: 52px;
                }
            }
            
            @media (max-width: 768px) {
                .tasks-page-modern {
                    padding: 12px;
                }
                
                .status-filters-harmonized-twolines {
                    justify-content: center;
                }
                
                .status-filters-harmonized-twolines .status-pill-harmonized-twolines {
                    flex: 0 1 calc(33.333% - 8px);
                    min-width: 70px;
                    max-width: 120px;
                    height: 48px;
                }
                
                .view-mode-harmonized span,
                .btn-harmonized span {
                    display: none;
                }
                
                .action-buttons-harmonized {
                    gap: 4px;
                }
                
                .preselected-star {
                    width: 16px;
                    height: 16px;
                    font-size: 9px;
                    top: -6px;
                    right: -6px;
                }
            }
            
            @media (max-width: 480px) {
                .status-filters-harmonized-twolines .status-pill-harmonized-twolines {
                    flex: 0 1 calc(50% - 4px);
                    min-width: 60px;
                    max-width: 110px;
                    height: 44px;
                }
                
                .task-harmonized-card {
                    padding: 10px;
                    min-height: 70px;
                    max-height: 70px;
                }
                
                .task-title-harmonized {
                    font-size: 14px;
                }
                
                .task-meta-harmonized {
                    display: none;
                }
                
                .modal-container {
                    margin: 10px;
                    max-height: 95vh;
                }
                
                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    addScannerStyles() {
        if (document.getElementById('scannerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scannerStyles';
        styles.textContent = `
            .scanner-page {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .scanner-page > div {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Create global instance
if (!window.pageManager) {
    window.pageManager = new PageManager();
    
    // Bind methods to preserve context
    Object.getOwnPropertyNames(PageManager.prototype).forEach(name => {
        if (name !== 'constructor' && typeof window.pageManager[name] === 'function') {
            window.pageManager[name] = window.pageManager[name].bind(window.pageManager);
        }
    });
}

console.log('✅ PageManager v13.1 - Compatible avec systèmes existants loaded');
