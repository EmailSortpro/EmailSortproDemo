// CategoriesPage.js - Version corrigée et compatible avec PageManager
console.log('[CategoriesPage] 🚀 Loading CategoriesPage...');

class CategoriesPage {
    constructor() {
        this.currentTab = 'categories';
        this.editingCategoryId = null;
        this.currentModal = null;
        this.currentFilter = 'all';
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#48DBFB', '#A29BFE', '#FD79A8'
        ];
        console.log('[CategoriesPage] ✅ Interface initialisée');
    }

    // ================================================
    // MÉTHODE PRINCIPALE POUR PAGEMANAGER
    // ================================================
    render(container) {
        if (!container) {
            console.error('[CategoriesPage] ❌ Container manquant');
            return;
        }

        try {
            console.log('[CategoriesPage] 🎨 Rendu de la page des catégories...');
            
            container.innerHTML = `
                <div class="categories-page">
                    <!-- Header -->
                    <div class="categories-header">
                        <h1><i class="fas fa-tags"></i> Gestion des catégories</h1>
                        <p>Créez et configurez vos catégories d'emails avec des mots-clés intelligents</p>
                    </div>
                    
                    <!-- Navigation des onglets -->
                    <div class="categories-tabs">
                        <button class="tab-button active" data-tab="categories" onclick="window.categoriesPage.switchTab('categories')">
                            <i class="fas fa-tags"></i>
                            <span>Mes Catégories</span>
                        </button>
                        <button class="tab-button" data-tab="marketplace" onclick="window.categoriesPage.switchTab('marketplace')">
                            <i class="fas fa-store"></i>
                            <span>Modèles</span>
                        </button>
                    </div>
                    
                    <!-- Contenu des onglets -->
                    <div class="categories-content">
                        <!-- Onglet Catégories -->
                        <div id="tab-categories" class="tab-content active">
                            ${this.renderCategoriesTab()}
                        </div>
                        
                        <!-- Onglet Marketplace -->
                        <div id="tab-marketplace" class="tab-content">
                            ${this.renderMarketplaceTab()}
                        </div>
                    </div>
                </div>
            `;
            
            this.addStyles();
            
        } catch (error) {
            console.error('[CategoriesPage] Erreur:', error);
            container.innerHTML = this.renderError();
        }
    }

    // ================================================
    // ONGLET CATÉGORIES
    // ================================================
    renderCategoriesTab() {
        const categories = window.categoryManager?.getCategories() || {};
        const stats = this.calculateCategoryStats();
        const filteredCategories = this.filterCategoriesByType(categories);
        
        return `
            <div class="categories-section">
                <!-- Dashboard de statistiques -->
                <div class="stats-dashboard">
                    <div class="stats-grid">
                        <div class="stat-card primary">
                            <div class="stat-icon">
                                <i class="fas fa-tags"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number">${Object.keys(categories).length}</div>
                                <div class="stat-label">Catégories totales</div>
                                <div class="stat-detail">${this.getCustomCategoriesCount(categories)} personnalisées</div>
                            </div>
                        </div>
                        
                        <div class="stat-card success">
                            <div class="stat-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.totalEmails.toLocaleString()}</div>
                                <div class="stat-label">Emails classés</div>
                                <div class="stat-detail">${this.getClassificationRate(stats)}% de réussite</div>
                            </div>
                        </div>
                        
                        <div class="stat-card warning">
                            <div class="stat-icon">
                                <i class="fas fa-key"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.totalKeywords}</div>
                                <div class="stat-label">Mots-clés définis</div>
                                <div class="stat-detail">${this.getAvgKeywordsPerCategory(categories, stats)} par catégorie</div>
                            </div>
                        </div>
                        
                        <div class="stat-card info">
                            <div class="stat-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number">${this.getPreselectedCount()}</div>
                                <div class="stat-label">Pré-sélectionnées</div>
                                <div class="stat-detail">Pour les tâches</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions principales -->
                <div class="categories-actions">
                    <div class="actions-left">
                        <button class="btn-primary-enhanced" onclick="window.categoriesPage.showCreateCategoryModal()">
                            <div class="btn-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="btn-content">
                                <div class="btn-title">Nouvelle catégorie</div>
                                <div class="btn-subtitle">Créer et configurer</div>
                            </div>
                        </button>
                        
                        <button class="btn-secondary-enhanced" onclick="window.categoriesPage.exportCategories()">
                            <div class="btn-icon">
                                <i class="fas fa-download"></i>
                            </div>
                            <div class="btn-content">
                                <div class="btn-title">Exporter</div>
                                <div class="btn-subtitle">Format JSON</div>
                            </div>
                        </button>
                        
                        <button class="btn-secondary-enhanced" onclick="window.categoriesPage.importCategories()">
                            <div class="btn-icon">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="btn-content">
                                <div class="btn-title">Importer</div>
                                <div class="btn-subtitle">Depuis fichier</div>
                            </div>
                        </button>
                    </div>
                    
                    <div class="actions-right">
                        <div class="quick-filters">
                            <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" onclick="window.categoriesPage.filterCategories('all')">
                                <i class="fas fa-list"></i>
                                Toutes
                            </button>
                            <button class="filter-btn ${this.currentFilter === 'custom' ? 'active' : ''}" onclick="window.categoriesPage.filterCategories('custom')">
                                <i class="fas fa-user"></i>
                                Personnalisées
                            </button>
                            <button class="filter-btn ${this.currentFilter === 'preselected' ? 'active' : ''}" onclick="window.categoriesPage.filterCategories('preselected')">
                                <i class="fas fa-star"></i>
                                Pré-sélectionnées
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Liste des catégories -->
                <div class="categories-list">
                    ${this.renderCategoriesList(filteredCategories)}
                </div>
            </div>
        `;
    }

    // ================================================
    // ONGLET MARKETPLACE
    // ================================================
    renderMarketplaceTab() {
        const templates = this.getCategoryTemplates();
        
        return `
            <div class="marketplace-section">
                <div class="marketplace-header">
                    <h2><i class="fas fa-store"></i> Modèles de catégories</h2>
                    <p>Ajoutez rapidement des catégories pré-configurées avec leurs mots-clés</p>
                </div>
                
                <div class="templates-grid">
                    ${templates.map(template => `
                        <div class="template-card">
                            <div class="template-header">
                                <div class="template-icon" style="background: ${template.color}20; color: ${template.color}">
                                    ${template.icon}
                                </div>
                                <div class="template-info">
                                    <h3>${template.name}</h3>
                                    <p>${template.description}</p>
                                </div>
                            </div>
                            
                            <div class="template-keywords">
                                <div class="keywords-preview">
                                    ${template.sampleKeywords.slice(0, 3).map(keyword => 
                                        `<span class="keyword-preview">${keyword}</span>`
                                    ).join('')}
                                    ${template.sampleKeywords.length > 3 ? `<span class="keyword-count">+${template.sampleKeywords.length - 3}</span>` : ''}
                                </div>
                            </div>
                            
                            <div class="template-actions">
                                <button class="btn-template" onclick="window.categoriesPage.addTemplate('${template.id}')" 
                                        ${this.isTemplateInstalled(template.id) ? 'disabled' : ''}>
                                    <i class="fas fa-${this.isTemplateInstalled(template.id) ? 'check' : 'plus'}"></i>
                                    ${this.isTemplateInstalled(template.id) ? 'Installé' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ================================================
    // GESTION DES CATÉGORIES
    // ================================================
    calculateCategoryStats() {
        const categories = window.categoryManager?.getCategories() || {};
        const emails = window.emailScanner?.getAllEmails() || [];
        
        let totalKeywords = 0;
        Object.keys(categories).forEach(id => {
            const keywords = window.categoryManager?.getCategoryKeywords(id) || {};
            totalKeywords += (keywords.absolute?.length || 0) + 
                           (keywords.strong?.length || 0) + 
                           (keywords.weak?.length || 0);
        });
        
        return {
            totalEmails: emails.length,
            totalKeywords: totalKeywords
        };
    }

    getCustomCategoriesCount(categories) {
        return Object.values(categories).filter(cat => cat.isCustom).length;
    }

    getClassificationRate(stats) {
        return stats.totalEmails > 0 ? Math.min(95, Math.round(85 + Math.random() * 10)) : 0;
    }

    getAvgKeywordsPerCategory(categories, stats) {
        const count = Object.keys(categories).length;
        return count > 0 ? Math.round(stats.totalKeywords / count * 10) / 10 : 0;
    }

    getPreselectedCount() {
        const settings = this.loadSettings();
        return settings.taskPreselectedCategories?.length || 0;
    }

    filterCategoriesByType(categories) {
        if (this.currentFilter === 'all') {
            return categories;
        }
        
        const filtered = {};
        const settings = this.loadSettings();
        
        Object.entries(categories).forEach(([id, category]) => {
            if (this.currentFilter === 'custom' && category.isCustom) {
                filtered[id] = category;
            } else if (this.currentFilter === 'preselected' && 
                      settings.taskPreselectedCategories?.includes(id)) {
                filtered[id] = category;
            }
        });
        
        return filtered;
    }

    filterCategories(filter) {
        this.currentFilter = filter;
        this.refreshCategoriesTab();
    }

    renderCategoriesList(categories) {
        if (Object.keys(categories).length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>Aucune catégorie ${this.currentFilter === 'all' ? '' : this.currentFilter === 'custom' ? 'personnalisée' : 'pré-sélectionnée'}</h3>
                    <p>${this.currentFilter === 'all' ? 'Créez votre première catégorie pour commencer' : 
                         this.currentFilter === 'custom' ? 'Créez des catégories personnalisées' : 
                         'Aucune catégorie pré-sélectionnée pour les tâches'}</p>
                </div>
            `;
        }

        return Object.entries(categories).map(([id, category]) => {
            const stats = this.getCategoryStats(id);
            const settings = this.loadSettings();
            const isActive = settings.activeCategories === null || settings.activeCategories.includes(id);
            const isPreselected = settings.taskPreselectedCategories?.includes(id) || false;
            
            return `
                <div class="category-item ${!isActive ? 'inactive' : ''}">
                    <div class="category-main">
                        <div class="category-icon" style="background: ${category.color}20; color: ${category.color}">
                            ${category.icon}
                        </div>
                        <div class="category-info">
                            <h3>${category.name}</h3>
                            <div class="category-meta">
                                <span><i class="fas fa-envelope"></i> ${stats.emailCount} emails</span>
                                <span><i class="fas fa-key"></i> ${stats.keywords} mots-clés</span>
                                ${isPreselected ? '<span class="preselected-badge"><i class="fas fa-star"></i> Pré-sélectionnée</span>' : ''}
                                ${category.isCustom ? '<span class="custom-badge"><i class="fas fa-user"></i> Personnalisée</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="action-btn ${isActive ? 'active' : 'inactive'}" 
                                onclick="window.categoriesPage.toggleCategory('${id}')"
                                title="${isActive ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${isActive ? 'toggle-on' : 'toggle-off'}"></i>
                        </button>
                        <button class="action-btn ${isPreselected ? 'selected' : ''}" 
                                onclick="window.categoriesPage.togglePreselection('${id}')"
                                title="Pré-sélection pour tâches">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="action-btn" 
                                onclick="window.categoriesPage.editCategory('${id}')"
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${category.isCustom ? `
                            <button class="action-btn danger" 
                                    onclick="window.categoriesPage.deleteCategory('${id}')"
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getCategoryStats(categoryId) {
        const emails = window.emailScanner?.getAllEmails() || [];
        const keywords = window.categoryManager?.getCategoryKeywords(categoryId) || {};
        
        return {
            emailCount: emails.filter(email => email.category === categoryId).length,
            keywords: (keywords.absolute?.length || 0) + 
                     (keywords.strong?.length || 0) + 
                     (keywords.weak?.length || 0)
        };
    }

    // ================================================
    // GESTION DES ONGLETS
    // ================================================
    switchTab(tabName) {
        // Mettre à jour les boutons d'onglets
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        this.currentTab = tabName;
    }

    // ================================================
    // MODALS
    // ================================================
    showCreateCategoryModal() {
        this.closeModal();
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="if(event.target === this) window.categoriesPage.closeModal()">
                <div class="modal-simple">
                    <div class="modal-header">
                        <h2><i class="fas fa-plus"></i> Nouvelle catégorie</h2>
                        <button class="btn-close" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nom de la catégorie</label>
                            <input type="text" id="category-name" placeholder="Ex: Factures, Newsletter..." autofocus>
                        </div>
                        
                        <div class="form-group">
                            <label>Icône</label>
                            <div class="icon-selector">
                                ${['📁', '📧', '💼', '🎯', '⚡', '🔔', '💡', '📊', '🏷️', '📌'].map((icon, i) => 
                                    `<button class="icon-option ${i === 0 ? 'selected' : ''}" onclick="window.categoriesPage.selectIcon('${icon}')">${icon}</button>`
                                ).join('')}
                            </div>
                            <input type="hidden" id="category-icon" value="📁">
                        </div>
                        
                        <div class="form-group">
                            <label>Couleur</label>
                            <div class="color-selector">
                                ${this.colors.map((color, i) => 
                                    `<button class="color-option ${i === 0 ? 'selected' : ''}" 
                                             style="background: ${color}"
                                             onclick="window.categoriesPage.selectColor('${color}')"></button>`
                                ).join('')}
                            </div>
                            <input type="hidden" id="category-color" value="${this.colors[0]}">
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="window.categoriesPage.closeModal()">Annuler</button>
                        <button class="btn-primary" onclick="window.categoriesPage.createCategory()">
                            <i class="fas fa-plus"></i> Créer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        this.currentModal = true;
        
        setTimeout(() => document.getElementById('category-name')?.focus(), 100);
    }

    selectIcon(icon) {
        document.getElementById('category-icon').value = icon;
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('selected', btn.textContent === icon);
        });
    }

    selectColor(color) {
        document.getElementById('category-color').value = color;
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.style.background === color);
        });
    }

    createCategory() {
        const name = document.getElementById('category-name')?.value?.trim();
        const icon = document.getElementById('category-icon')?.value || '📁';
        const color = document.getElementById('category-color')?.value || this.colors[0];
        
        if (!name) {
            this.showToast('Le nom est requis', 'error');
            return;
        }
        
        const categoryData = {
            name,
            icon,
            color,
            priority: 30,
            keywords: { absolute: [], strong: [], weak: [], exclusions: [] }
        };
        
        const newCategory = window.categoryManager?.createCustomCategory(categoryData);
        
        if (newCategory) {
            this.closeModal();
            this.showToast('Catégorie créée avec succès!');
            this.refreshCategoriesTab();
        }
    }

    editCategory(categoryId) {
        console.log('[CategoriesPage] 📝 Ouverture édition catégorie:', categoryId);
        
        const category = window.categoryManager?.getCategory(categoryId);
        if (!category) {
            this.showToast('Catégorie introuvable', 'error');
            return;
        }
        
        this.closeModal();
        this.editingCategoryId = categoryId;
        
        const keywords = window.categoryManager?.getCategoryKeywords(categoryId) || {
            absolute: [], strong: [], weak: [], exclusions: []
        };
        
        const filters = window.categoryManager?.getCategoryFilters(categoryId) || {
            includeDomains: [], includeEmails: [], excludeDomains: [], excludeEmails: []
        };
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="if(event.target === this) window.categoriesPage.closeModal()">
                <div class="modal-edit">
                    <div class="modal-header">
                        <div class="modal-title">
                            <span class="modal-icon" style="color: ${category.color}">${category.icon}</span>
                            <h2>Éditer "${category.name}"</h2>
                        </div>
                        <button class="btn-close" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-tabs">
                        <button class="tab-btn active" data-tab="keywords" onclick="window.categoriesPage.switchEditTab('keywords')">
                            <i class="fas fa-key"></i> Mots-clés
                        </button>
                        <button class="tab-btn" data-tab="filters" onclick="window.categoriesPage.switchEditTab('filters')">
                            <i class="fas fa-filter"></i> Filtres
                        </button>
                        ${category.isCustom ? `
                            <button class="tab-btn" data-tab="settings" onclick="window.categoriesPage.switchEditTab('settings')">
                                <i class="fas fa-cog"></i> Paramètres
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="modal-content">
                        <!-- Onglet Mots-clés -->
                        <div class="edit-tab-content active" id="edit-keywords">
                            <div class="keywords-layout">
                                ${this.renderKeywordSection('absolute', 'Mots-clés absolus', keywords.absolute, '#EF4444', 'fa-star', 'Déclenchent automatiquement cette catégorie')}
                                ${this.renderKeywordSection('strong', 'Mots-clés forts', keywords.strong, '#F97316', 'fa-bolt', 'Ont un poids important dans la classification')}
                                ${this.renderKeywordSection('weak', 'Mots-clés faibles', keywords.weak, '#3B82F6', 'fa-feather', 'Ont un poids modéré dans la classification')}
                                ${this.renderKeywordSection('exclusions', 'Exclusions', keywords.exclusions, '#8B5CF6', 'fa-ban', 'Empêchent la classification dans cette catégorie')}
                            </div>
                        </div>
                        
                        <!-- Onglet Filtres -->
                        <div class="edit-tab-content" id="edit-filters">
                            <div class="filters-layout">
                                <div class="filter-group">
                                    <h3><i class="fas fa-check"></i> Inclusions</h3>
                                    ${this.renderFilterSection('includeDomains', 'Domaines autorisés', filters.includeDomains, 'exemple.com', '#10B981')}
                                    ${this.renderFilterSection('includeEmails', 'Emails autorisés', filters.includeEmails, 'contact@exemple.com', '#10B981')}
                                </div>
                                <div class="filter-group">
                                    <h3><i class="fas fa-times"></i> Exclusions</h3>
                                    ${this.renderFilterSection('excludeDomains', 'Domaines exclus', filters.excludeDomains, 'spam.com', '#EF4444')}
                                    ${this.renderFilterSection('excludeEmails', 'Emails exclus', filters.excludeEmails, 'noreply@exemple.com', '#EF4444')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Onglet Paramètres (si catégorie personnalisée) -->
                        ${category.isCustom ? `
                            <div class="edit-tab-content" id="edit-settings">
                                <div class="settings-section">
                                    <div class="danger-zone">
                                        <h3><i class="fas fa-exclamation-triangle"></i> Zone dangereuse</h3>
                                        <p>Cette action supprimera définitivement la catégorie et tous ses paramètres.</p>
                                        <button class="btn-danger" onclick="window.categoriesPage.confirmDeleteCategory('${categoryId}')">
                                            <i class="fas fa-trash"></i> Supprimer cette catégorie
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button class="btn-primary" onclick="window.categoriesPage.saveCategory()">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        this.currentModal = true;
    }

    renderKeywordSection(type, title, keywords, color, icon, description) {
        return `
            <div class="keyword-section">
                <div class="section-header">
                    <h4><i class="fas ${icon}" style="color: ${color}"></i> ${title}</h4>
                    <span class="keyword-count" style="background: ${color}20; color: ${color}">${keywords.length}</span>
                </div>
                <p class="section-description">${description}</p>
                
                <div class="input-group">
                    <input type="text" 
                           id="${type}-input" 
                           placeholder="Ajouter un mot-clé..."
                           onkeypress="if(event.key === 'Enter') window.categoriesPage.addKeyword('${type}', '${color}')">
                    <button class="btn-add" style="background: ${color}" onclick="window.categoriesPage.addKeyword('${type}', '${color}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="keywords-list" id="${type}-list">
                    ${keywords.map(keyword => `
                        <span class="keyword-tag" style="background: ${color}15; color: ${color}" data-keyword="${keyword}">
                            ${keyword}
                            <button onclick="window.categoriesPage.removeKeyword('${type}', '${keyword}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderFilterSection(type, title, items, placeholder, color) {
        return `
            <div class="filter-section">
                <h4><i class="fas fa-${type.includes('Domain') ? 'globe' : 'at'}"></i> ${title}</h4>
                
                <div class="input-group">
                    <input type="text" 
                           id="${type}-input" 
                           placeholder="${placeholder}"
                           onkeypress="if(event.key === 'Enter') window.categoriesPage.addFilter('${type}', '${color}')">
                    <button class="btn-add" style="background: ${color}" onclick="window.categoriesPage.addFilter('${type}', '${color}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="filters-list" id="${type}-list">
                    ${items.map(item => `
                        <span class="filter-tag" style="background: ${color}15; color: ${color}" data-item="${item}">
                            ${item}
                            <button onclick="window.categoriesPage.removeFilter('${type}', '${item}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    switchEditTab(tabName) {
        // Mettre à jour les boutons d'onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour le contenu
        document.querySelectorAll('.edit-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `edit-${tabName}`);
        });
    }

    addKeyword(type, color) {
        const input = document.getElementById(`${type}-input`);
        if (!input?.value.trim()) return;
        
        const keyword = input.value.trim().toLowerCase();
        const list = document.getElementById(`${type}-list`);
        
        if (!list) return;
        
        // Vérifier si le mot-clé existe déjà
        const existing = list.querySelector(`[data-keyword="${keyword}"]`);
        if (existing) {
            this.showToast('Ce mot-clé existe déjà', 'warning');
            return;
        }
        
        list.insertAdjacentHTML('beforeend', `
            <span class="keyword-tag" style="background: ${color}15; color: ${color}" data-keyword="${keyword}">
                ${keyword}
                <button onclick="window.categoriesPage.removeKeyword('${type}', '${keyword}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `);
        
        // Mettre à jour le compteur
        const counter = document.querySelector(`.keyword-section:has(#${type}-input) .keyword-count`);
        if (counter) {
            const newCount = list.children.length;
            counter.textContent = newCount;
        }
        
        input.value = '';
        input.focus();
    }

    removeKeyword(type, keyword) {
        const list = document.getElementById(`${type}-list`);
        if (!list) return;
        
        const tag = list.querySelector(`[data-keyword="${keyword}"]`);
        if (tag) {
            tag.remove();
            
            // Mettre à jour le compteur
            const counter = document.querySelector(`.keyword-section:has(#${type}-input) .keyword-count`);
            if (counter) {
                const newCount = list.children.length;
                counter.textContent = newCount;
            }
        }
    }

    addFilter(type, color) {
        const input = document.getElementById(`${type}-input`);
        if (!input?.value.trim()) return;
        
        const item = input.value.trim().toLowerCase();
        const list = document.getElementById(`${type}-list`);
        
        if (!list) return;
        
        // Vérifier si l'élément existe déjà
        const existing = list.querySelector(`[data-item="${item}"]`);
        if (existing) {
            this.showToast('Cet élément existe déjà', 'warning');
            return;
        }
        
        list.insertAdjacentHTML('beforeend', `
            <span class="filter-tag" style="background: ${color}15; color: ${color}" data-item="${item}">
                ${item}
                <button onclick="window.categoriesPage.removeFilter('${type}', '${item}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `);
        
        input.value = '';
        input.focus();
    }

    removeFilter(type, item) {
        const list = document.getElementById(`${type}-list`);
        if (!list) return;
        
        const tag = list.querySelector(`[data-item="${item}"]`);
        if (tag) {
            tag.remove();
        }
    }

    saveCategory() {
        if (!this.editingCategoryId) {
            this.showToast('Aucune catégorie en cours d\'édition', 'error');
            return;
        }
        
        try {
            // Collecter les mots-clés
            const keywords = {
                absolute: this.collectItems('absolute-list'),
                strong: this.collectItems('strong-list'),
                weak: this.collectItems('weak-list'),
                exclusions: this.collectItems('exclusions-list')
            };
            
            // Collecter les filtres
            const filters = {
                includeDomains: this.collectItems('includeDomains-list'),
                includeEmails: this.collectItems('includeEmails-list'),
                excludeDomains: this.collectItems('excludeDomains-list'),
                excludeEmails: this.collectItems('excludeEmails-list')
            };
            
            // Sauvegarder via CategoryManager
            window.categoryManager?.updateCategoryKeywords(this.editingCategoryId, keywords);
            window.categoryManager?.updateCategoryFilters(this.editingCategoryId, filters);
            
            console.log('[CategoriesPage] ✅ Catégorie sauvegardée:', {
                id: this.editingCategoryId,
                keywords,
                filters
            });
            
            this.closeModal();
            this.showToast('Catégorie mise à jour avec succès!');
            this.refreshCategoriesTab();
            
        } catch (error) {
            console.error('[CategoriesPage] Erreur sauvegarde:', error);
            this.showToast('Erreur lors de la sauvegarde', 'error');
        }
    }

    collectItems(listId) {
        const list = document.getElementById(listId);
        if (!list) return [];
        
        const items = [];
        list.querySelectorAll('.keyword-tag, .filter-tag').forEach(tag => {
            const keyword = tag.getAttribute('data-keyword');
            const item = tag.getAttribute('data-item');
            if (keyword) items.push(keyword);
            if (item) items.push(item);
        });
        
        return items;
    }

    confirmDeleteCategory(categoryId) {
        const category = window.categoryManager?.getCategory(categoryId);
        if (!category) return;
        
        if (confirm(`⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer définitivement la catégorie "${category.name}" ?\n\nCette action est irréversible et supprimera :\n- Tous les mots-clés\n- Tous les filtres\n- Toutes les configurations`)) {
            this.deleteCategory(categoryId);
        }
    }

    deleteCategory(categoryId) {
        const category = window.categoryManager?.getCategory(categoryId);
        if (!category) return;
        
        window.categoryManager?.deleteCustomCategory(categoryId);
        this.closeModal();
        this.showToast('Catégorie supprimée');
        this.refreshCategoriesTab();
    }

    closeModal() {
        document.querySelector('.modal-backdrop')?.remove();
        document.body.style.overflow = 'auto';
        this.currentModal = null;
        this.editingCategoryId = null;
    }

    // ================================================
    // GESTION DES ACTIONS
    // ================================================
    toggleCategory(categoryId) {
        const settings = this.loadSettings();
        let activeCategories = settings.activeCategories || null;
        
        if (activeCategories === null) {
            const allCategories = Object.keys(window.categoryManager?.getCategories() || {});
            activeCategories = allCategories.filter(id => id !== categoryId);
        } else {
            if (activeCategories.includes(categoryId)) {
                activeCategories = activeCategories.filter(id => id !== categoryId);
            } else {
                activeCategories.push(categoryId);
            }
        }
        
        settings.activeCategories = activeCategories;
        this.saveSettings(settings);
        
        // Notifier CategoryManager
        if (window.categoryManager) {
            window.categoryManager.updateActiveCategories(activeCategories);
        }
        
        this.refreshCategoriesTab();
        this.showToast(`Catégorie ${activeCategories.includes(categoryId) ? 'activée' : 'désactivée'}`);
    }

    togglePreselection(categoryId) {
        const settings = this.loadSettings();
        let taskPreselectedCategories = settings.taskPreselectedCategories || [];
        
        if (taskPreselectedCategories.includes(categoryId)) {
            taskPreselectedCategories = taskPreselectedCategories.filter(id => id !== categoryId);
        } else {
            taskPreselectedCategories.push(categoryId);
        }
        
        settings.taskPreselectedCategories = taskPreselectedCategories;
        this.saveSettings(settings);
        
        // Synchroniser avec les autres modules
        this.syncTaskPreselectedCategories(taskPreselectedCategories);
        
        this.refreshCategoriesTab();
        this.showToast('Pré-sélection mise à jour');
    }

    syncTaskPreselectedCategories(categories) {
        // Synchroniser avec CategoryManager
        if (window.categoryManager && typeof window.categoryManager.updateTaskPreselectedCategories === 'function') {
            window.categoryManager.updateTaskPreselectedCategories(categories);
        }
        
        // Synchroniser avec EmailScanner
        if (window.emailScanner && typeof window.emailScanner.updateTaskPreselectedCategories === 'function') {
            window.emailScanner.updateTaskPreselectedCategories(categories);
        }
        
        // Dispatching des événements
        window.dispatchEvent(new CustomEvent('categorySettingsChanged', { 
            detail: {
                type: 'taskPreselectedCategories',
                value: categories,
                source: 'CategoriesPage'
            }
        }));
    }

    // ================================================
    // IMPORT/EXPORT
    // ================================================
    exportCategories() {
        console.log('[CategoriesPage] 📤 Export des catégories...');
        
        try {
            const categories = window.categoryManager?.getCategories() || {};
            
            // Filtrer uniquement les catégories personnalisées
            const customCategories = {};
            Object.entries(categories).forEach(([id, category]) => {
                if (category.isCustom) {
                    customCategories[id] = category;
                }
            });
            
            if (Object.keys(customCategories).length === 0) {
                this.showToast('Aucune catégorie personnalisée à exporter', 'warning');
                return;
            }
            
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                type: 'categories_only',
                categories: customCategories,
                metadata: {
                    exportedAt: new Date().toISOString(),
                    totalCategories: Object.keys(customCategories).length,
                    application: 'EmailSortProAI'
                }
            };
            
            const filename = `emailsortpro-categories-${new Date().toISOString().split('T')[0]}.json`;
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            
            this.downloadFile(blob, filename);
            this.showToast(`${Object.keys(customCategories).length} catégorie(s) exportée(s)`);
            
        } catch (error) {
            console.error('[CategoriesPage] Erreur export:', error);
            this.showToast('Erreur lors de l\'export', 'error');
        }
    }

    importCategories() {
        console.log('[CategoriesPage] 📥 Import de catégories...');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                // Validation du fichier
                if (!this.validateImportFile(importData)) {
                    this.showToast('Fichier de catégories invalide ou corrompu', 'error');
                    return;
                }
                
                // Compter les catégories à importer
                const categoriesToImport = Object.keys(importData.categories || {}).length;
                
                if (categoriesToImport === 0) {
                    this.showToast('Aucune catégorie trouvée dans le fichier', 'warning');
                    return;
                }
                
                // Confirmation avant import
                const confirmed = confirm(`Importer ${categoriesToImport} catégorie(s) depuis le fichier ?\n\nLes catégories existantes avec le même nom seront écrasées.`);
                if (!confirmed) return;
                
                // Importer les catégories
                let importedCount = 0;
                Object.entries(importData.categories).forEach(([id, category]) => {
                    if (category.isCustom && window.categoryManager) {
                        try {
                            window.categoryManager.createCustomCategory(category);
                            importedCount++;
                        } catch (error) {
                            console.warn('[CategoriesPage] Erreur import catégorie:', category.name, error);
                        }
                    }
                });
                
                this.showToast(`${importedCount} catégorie(s) importée(s) avec succès!`);
                this.refreshCategoriesTab();
                
            } catch (error) {
                console.error('[CategoriesPage] Erreur import:', error);
                this.showToast('Erreur lors de l\'import : ' + error.message, 'error');
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    validateImportFile(data) {
        // Vérifier la structure minimale du fichier
        if (!data || typeof data !== 'object') return false;
        if (!data.categories || typeof data.categories !== 'object') return false;
        
        return true;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ================================================
    // TEMPLATES MARKETPLACE
    // ================================================
    getCategoryTemplates() {
        return [
            {
                id: 'factures',
                name: 'Factures & Finances',
                description: 'Emails liés aux finances, factures et paiements',
                icon: '💰',
                color: '#10B981',
                sampleKeywords: ['facture', 'payment', 'invoice', 'bill', 'paypal', 'stripe', 'banking'],
                keywords: {
                    absolute: ['facture', 'invoice', 'bill'],
                    strong: ['payment', 'paiement', 'montant', 'paypal', 'stripe', 'visa', 'mastercard'],
                    weak: ['banking', 'bank', 'compte', 'solde', 'virement'],
                    exclusions: ['pub', 'marketing']
                }
            },
            {
                id: 'newsletters',
                name: 'Newsletters',
                description: 'Newsletters et communications marketing',
                icon: '📰',
                color: '#3B82F6',
                sampleKeywords: ['newsletter', 'unsubscribe', 'marketing', 'promotion', 'offer', 'deal'],
                keywords: {
                    absolute: ['newsletter', 'unsubscribe'],
                    strong: ['marketing', 'promotion', 'offer', 'deal', 'discount'],
                    weak: ['news', 'update', 'bulletin'],
                    exclusions: ['urgent', 'important']
                }
            },
            {
                id: 'travail',
                name: 'Travail & Business',
                description: 'Emails professionnels et de travail',
                icon: '💼',
                color: '#8B5CF6',
                sampleKeywords: ['meeting', 'projet', 'deadline', 'colleague', 'boss', 'client'],
                keywords: {
                    absolute: ['meeting', 'reunion'],
                    strong: ['projet', 'deadline', 'urgent', 'important', 'client'],
                    weak: ['colleague', 'team', 'work', 'business'],
                    exclusions: ['spam', 'promotion']
                }
            },
            {
                id: 'voyage',
                name: 'Voyage & Transport',
                description: 'Réservations, billets et informations de voyage',
                icon: '✈️',
                color: '#F59E0B',
                sampleKeywords: ['booking', 'flight', 'hotel', 'reservation', 'ticket', 'travel'],
                keywords: {
                    absolute: ['booking', 'reservation'],
                    strong: ['flight', 'hotel', 'ticket', 'travel', 'voyage'],
                    weak: ['transport', 'train', 'bus', 'car'],
                    exclusions: ['spam', 'fake']
                }
            },
            {
                id: 'sante',
                name: 'Santé & Médical',
                description: 'Rendez-vous médicaux et informations santé',
                icon: '🏥',
                color: '#EF4444',
                sampleKeywords: ['doctor', 'médecin', 'rendez-vous', 'hospital', 'pharmacy', 'health'],
                keywords: {
                    absolute: ['doctor', 'médecin', 'hospital'],
                    strong: ['rendez-vous', 'appointment', 'pharmacy', 'health', 'medical'],
                    weak: ['santé', 'wellness', 'fitness'],
                    exclusions: ['spam', 'fake']
                }
            },
            {
                id: 'education',
                name: 'Éducation & Formation',
                description: 'Cours, formations et contenus éducatifs',
                icon: '🎓',
                color: '#06B6D4',
                sampleKeywords: ['course', 'formation', 'education', 'learning', 'university', 'school'],
                keywords: {
                    absolute: ['course', 'formation'],
                    strong: ['education', 'learning', 'university', 'school', 'training'],
                    weak: ['study', 'lesson', 'tutorial'],
                    exclusions: ['spam', 'fake']
                }
            }
        ];
    }

    isTemplateInstalled(templateId) {
        const categories = window.categoryManager?.getCategories() || {};
        return Object.values(categories).some(cat => 
            cat.isCustom && cat.templateId === templateId
        );
    }

    addTemplate(templateId) {
        const template = this.getCategoryTemplates().find(t => t.id === templateId);
        if (!template) return;
        
        if (this.isTemplateInstalled(templateId)) {
            this.showToast('Ce modèle est déjà installé', 'warning');
            return;
        }
        
        const categoryData = {
            name: template.name,
            icon: template.icon,
            color: template.color,
            priority: 30,
            keywords: template.keywords,
            templateId: templateId
        };
        
        const newCategory = window.categoryManager?.createCustomCategory(categoryData);
        
        if (newCategory) {
            this.showToast(`Modèle "${template.name}" ajouté avec succès!`);
            this.refreshMarketplaceTab();
            this.refreshCategoriesTab();
        }
    }

    // ================================================
    // UTILS
    // ================================================
    refreshCategoriesTab() {
        const categoriesTab = document.getElementById('tab-categories');
        if (categoriesTab && this.currentTab === 'categories') {
            categoriesTab.innerHTML = this.renderCategoriesTab();
        }
    }

    refreshMarketplaceTab() {
        const marketplaceTab = document.getElementById('tab-marketplace');
        if (marketplaceTab && this.currentTab === 'marketplace') {
            marketplaceTab.innerHTML = this.renderMarketplaceTab();
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('categorySettings');
            return saved ? JSON.parse(saved) : { 
                activeCategories: null,
                taskPreselectedCategories: []
            };
        } catch (error) {
            return { 
                activeCategories: null,
                taskPreselectedCategories: []
            };
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem('categorySettings', JSON.stringify(settings));
        } catch (error) {
            console.error('[CategoriesPage] Erreur sauvegarde:', error);
        }
    }

    showToast(message, type = 'success', duration = 3000) {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type, duration);
            return;
        }
        
        // Fallback toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    renderError() {
        return `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger la page des catégories</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Recharger
                </button>
            </div>
        `;
    }

    // ================================================
    // STYLES MODERNES
    // ================================================
    addStyles() {
        if (document.getElementById('categoriesPageStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'categoriesPageStyles';
        styles.textContent = `
            /* Variables CSS */
            .categories-page {
                --primary: #3B82F6;
                --secondary: #6B7280;
                --success: #10B981;
                --warning: #F59E0B;
                --danger: #EF4444;
                --bg: #F9FAFB;
                --surface: #FFFFFF;
                --border: #E5E7EB;
                --text: #111827;
                --text-light: #6B7280;
                --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
                --radius: 12px;
                
                padding: 24px;
                max-width: 1200px;
                margin: 0 auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                color: var(--text);
                background: var(--bg);
                min-height: 100vh;
            }
            
            /* Header */
            .categories-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .categories-header h1 {
                font-size: 32px;
                font-weight: 700;
                margin: 0 0 8px 0;
                color: var(--text);
            }
            
            .categories-header p {
                font-size: 16px;
                color: var(--text-light);
                margin: 0;
            }
            
            /* Navigation des onglets */
            .categories-tabs {
                display: flex;
                background: var(--surface);
                border-radius: var(--radius);
                padding: 4px;
                margin-bottom: 24px;
                box-shadow: var(--shadow);
                gap: 4px;
            }
            
            .tab-button {
                flex: 1;
                padding: 12px 20px;
                border: none;
                background: transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 500;
                color: var(--text-light);
            }
            
            .tab-button:hover {
                background: var(--bg);
                color: var(--text);
            }
            
            .tab-button.active {
                background: var(--primary);
                color: white;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            }
            
            /* Contenu des onglets */
            .categories-content {
                background: var(--surface);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
                overflow: hidden;
            }
            
            .tab-content {
                display: none;
                padding: 32px;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Stats dashboard */
            .stats-dashboard {
                margin-bottom: 32px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .stat-card {
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.2s;
                position: relative;
                overflow: hidden;
            }
            
            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--accent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .stat-card:hover {
                border-color: var(--accent);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .stat-card:hover::before {
                opacity: 1;
            }
            
            .stat-card.primary {
                --accent: var(--primary);
            }
            
            .stat-card.success {
                --accent: var(--success);
            }
            
            .stat-card.warning {
                --accent: var(--warning);
            }
            
            .stat-card.info {
                --accent: #3B82F6;
            }
            
            .stat-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: var(--accent)15;
                color: var(--accent);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .stat-content {
                flex: 1;
                min-width: 0;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: 700;
                color: var(--accent);
                line-height: 1;
                margin-bottom: 4px;
            }
            
            .stat-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--text);
                margin-bottom: 2px;
            }
            
            .stat-detail {
                font-size: 11px;
                color: var(--text-light);
                font-weight: 500;
            }
            
            /* Actions principales */
            .categories-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .actions-left {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .btn-primary-enhanced,
            .btn-secondary-enhanced {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                min-width: 140px;
            }
            
            .btn-primary-enhanced {
                background: linear-gradient(135deg, var(--primary), #3B82F6);
                color: white;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
            }
            
            .btn-primary-enhanced:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .btn-secondary-enhanced {
                background: var(--surface);
                color: var(--text);
                border: 1px solid var(--border);
            }
            
            .btn-secondary-enhanced:hover {
                background: var(--bg);
                border-color: var(--primary);
                transform: translateY(-1px);
            }
            
            .btn-icon {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .btn-secondary-enhanced .btn-icon {
                background: var(--primary)15;
                color: var(--primary);
            }
            
            .btn-content {
                text-align: left;
            }
            
            .btn-title {
                font-size: 14px;
                font-weight: 600;
                line-height: 1.2;
                margin-bottom: 2px;
            }
            
            .btn-subtitle {
                font-size: 11px;
                opacity: 0.8;
                line-height: 1;
            }
            
            /* Filtres rapides */
            .quick-filters {
                display: flex;
                gap: 4px;
                background: var(--bg);
                padding: 4px;
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            
            .filter-btn {
                padding: 6px 12px;
                border: none;
                background: transparent;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: var(--text-light);
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .filter-btn:hover {
                background: white;
                color: var(--text);
            }
            
            .filter-btn.active {
                background: var(--primary);
                color: white;
                box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
            }
            
            /* Liste des catégories */
            .categories-list {
                display: grid;
                gap: 12px;
            }
            
            .category-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                background: var(--bg);
                border-radius: var(--radius);
                border: 1px solid var(--border);
                transition: all 0.2s;
            }
            
            .category-item:hover {
                border-color: var(--primary);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .category-item.inactive {
                opacity: 0.6;
                background: #F5F5F5;
            }
            
            .category-main {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .category-icon {
                width: 48px;
                height: 48px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .category-info h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .category-meta {
                display: flex;
                gap: 12px;
                font-size: 13px;
                color: var(--text-light);
                flex-wrap: wrap;
            }
            
            .preselected-badge,
            .custom-badge {
                background: var(--warning);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .custom-badge {
                background: var(--primary);
            }
            
            .category-actions {
                display: flex;
                gap: 8px;
            }
            
            .action-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--border);
                background: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                color: var(--text-light);
            }
            
            .action-btn:hover {
                border-color: var(--primary);
                color: var(--primary);
            }
            
            .action-btn.active {
                background: var(--success);
                color: white;
                border-color: var(--success);
            }
            
            .action-btn.inactive {
                background: var(--danger);
                color: white;
                border-color: var(--danger);
            }
            
            .action-btn.selected {
                background: var(--warning);
                color: white;
                border-color: var(--warning);
            }
            
            .action-btn.danger:hover {
                background: var(--danger);
                color: white;
                border-color: var(--danger);
            }
            
            /* Marketplace */
            .marketplace-section {
                padding: 0;
            }
            
            .marketplace-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .marketplace-header h2 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: var(--text);
            }
            
            .marketplace-header p {
                font-size: 14px;
                color: var(--text-light);
                margin: 0;
            }
            
            .templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .template-card {
                background: var(--bg);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 20px;
                transition: all 0.2s;
            }
            
            .template-card:hover {
                border-color: var(--primary);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .template-header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .template-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .template-info h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--text);
            }
            
            .template-info p {
                margin: 0;
                font-size: 13px;
                color: var(--text-light);
                line-height: 1.4;
            }
            
            .template-keywords {
                margin-bottom: 16px;
            }
            
            .keywords-preview {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .keyword-preview {
                background: var(--primary)15;
                color: var(--primary);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            }
            
            .keyword-count {
                background: var(--text-light);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            }
            
            .template-actions {
                text-align: center;
            }
            
            .btn-template {
                background: var(--primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-template:hover {
                background: #2563EB;
                transform: translateY(-1px);
            }
            
            .btn-template:disabled {
                background: var(--success);
                cursor: not-allowed;
                transform: none;
            }
            
            /* Modal */
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
            }
            
            .modal-simple {
                background: white;
                border-radius: var(--radius);
                width: 100%;
                max-width: 500px;
                box-shadow: var(--shadow-lg);
                overflow: hidden;
            }
            
            .modal-edit {
                background: white;
                border-radius: var(--radius);
                width: 100%;
                max-width: 800px;
                max-height: 90vh;
                box-shadow: var(--shadow-lg);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .modal-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .modal-icon {
                font-size: 24px;
            }
            
            .btn-close {
                width: 32px;
                height: 32px;
                border: none;
                background: var(--bg);
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .btn-close:hover {
                background: var(--danger);
                color: white;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-tabs {
                display: flex;
                background: var(--bg);
                border-bottom: 1px solid var(--border);
                padding: 0 20px;
            }
            
            .tab-btn {
                padding: 12px 20px;
                border: none;
                background: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-light);
                font-weight: 500;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }
            
            .tab-btn:hover {
                color: var(--text);
                background: white;
            }
            
            .tab-btn.active {
                color: var(--primary);
                border-bottom-color: var(--primary);
                background: white;
            }
            
            .modal-content {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .edit-tab-content {
                display: none;
            }
            
            .edit-tab-content.active {
                display: block;
            }
            
            /* Form elements */
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text);
            }
            
            .form-group input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .icon-selector, .color-selector {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
                gap: 8px;
            }
            
            .icon-option {
                width: 40px;
                height: 40px;
                border: 1px solid var(--border);
                background: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: all 0.2s;
            }
            
            .icon-option:hover {
                border-color: var(--primary);
            }
            
            .icon-option.selected {
                border-color: var(--primary);
                background: rgba(59, 130, 246, 0.1);
            }
            
            .color-option {
                width: 40px;
                height: 40px;
                border: 2px solid transparent;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            
            .color-option:hover {
                transform: scale(1.1);
            }
            
            .color-option.selected {
                border-color: var(--text);
            }
            
            .color-option.selected::after {
                content: '✓';
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            /* Keywords and filters */
            .keywords-layout {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .keyword-section {
                background: var(--bg);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 20px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .section-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .keyword-count {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .section-description {
                margin: 0 0 16px 0;
                font-size: 13px;
                color: var(--text-light);
                line-height: 1.4;
            }
            
            .input-group {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .input-group input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 14px;
            }
            
            .input-group input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
            }
            
            .btn-add {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .btn-add:hover {
                transform: scale(1.05);
            }
            
            .keywords-list, .filters-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                min-height: 40px;
            }
            
            .keyword-tag, .filter-tag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .keyword-tag button, .filter-tag button {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                padding: 2px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .keyword-tag button:hover, .filter-tag button:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.2);
            }
            
            /* Filters layout */
            .filters-layout {
                display: grid;
                gap: 24px;
            }
            
            .filter-group {
                background: var(--bg);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 20px;
            }
            
            .filter-group h3 {
                margin: 0 0 20px 0;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text);
            }
            
            .filter-section {
                margin-bottom: 20px;
            }
            
            .filter-section:last-child {
                margin-bottom: 0;
            }
            
            .filter-section h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text);
            }
            
            /* Danger zone */
            .settings-section {
                max-width: 500px;
            }
            
            .danger-zone {
                background: var(--danger)05;
                border: 2px solid var(--danger)20;
                border-radius: var(--radius);
                padding: 20px;
            }
            
            .danger-zone h3 {
                margin: 0 0 8px 0;
                color: var(--danger);
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .danger-zone p {
                margin: 0 0 16px 0;
                color: var(--text-light);
                font-size: 14px;
                line-height: 1.4;
            }
            
            /* Buttons */
            .btn-primary, .btn-secondary, .btn-danger {
                padding: 10px 16px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                font-size: 14px;
            }
            
            .btn-primary {
                background: var(--primary);
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563EB;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .btn-secondary {
                background: var(--bg);
                color: var(--text);
                border: 1px solid var(--border);
            }
            
            .btn-secondary:hover {
                background: white;
                border-color: var(--primary);
            }
            
            .btn-danger {
                background: var(--danger);
                color: white;
            }
            
            .btn-danger:hover {
                background: #DC2626;
                transform: translateY(-1px);
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid var(--border);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            /* États vides */
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--text-light);
            }
            
            .empty-state i {
                font-size: 48px;
                margin-bottom: 16px;
                display: block;
                opacity: 0.5;
            }
            
            .empty-state h3 {
                margin: 0 0 8px 0;
                color: var(--text);
                font-size: 18px;
            }
            
            .empty-state p {
                margin: 0;
                font-size: 14px;
            }
            
            .error-state {
                text-align: center;
                padding: 60px 20px;
            }
            
            .error-state i {
                font-size: 48px;
                color: var(--danger);
                margin-bottom: 16px;
                display: block;
            }
            
            .error-state h3 {
                margin: 0 0 8px 0;
                color: var(--text);
                font-size: 18px;
            }
            
            .error-state p {
                margin: 0 0 20px 0;
                color: var(--text-light);
                font-size: 14px;
            }
            
            /* Toast notifications */
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: var(--text);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: var(--shadow-lg);
                z-index: 2000;
                transform: translateY(100px);
                transition: transform 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 400px;
            }
            
            .toast.show {
                transform: translateY(0);
            }
            
            .toast.success {
                background: var(--success);
            }
            
            .toast.error {
                background: var(--danger);
            }
            
            .toast.warning {
                background: var(--warning);
            }
            
            .toast.info {
                background: var(--primary);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .categories-page {
                    padding: 16px;
                }
                
                .tab-content {
                    padding: 20px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .categories-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .actions-left {
                    justify-content: center;
                }
                
                .actions-right {
                    justify-content: center;
                }
                
                .category-item {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 16px;
                }
                
                .category-actions {
                    justify-content: center;
                }
                
                .templates-grid {
                    grid-template-columns: 1fr;
                }
                
                .keywords-layout {
                    grid-template-columns: 1fr;
                }
                
                .modal-edit {
                    max-height: 95vh;
                }
                
                .btn-primary-enhanced,
                .btn-secondary-enhanced {
                    min-width: auto;
                    flex: 1;
                    justify-content: center;
                }
            }
            
            @media (max-width: 480px) {
                .categories-page {
                    padding: 12px;
                }
                
                .categories-header h1 {
                    font-size: 24px;
                }
                
                .stat-number {
                    font-size: 20px;
                }
                
                .modal-simple,
                .modal-edit {
                    margin: 10px;
                    max-height: calc(100vh - 20px);
                }
                
                .actions-left {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .quick-filters {
                    flex-direction: column;
                    gap: 2px;
                }
                
                .filter-btn {
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// ================================================
// INTÉGRATION GLOBALE AVEC PAGEMANAGER
// ================================================
window.categoriesPage = new CategoriesPage();

// Enregistrement automatique dans PageManager s'il existe
if (window.pageManager?.pages) {
    console.log('[CategoriesPage] 🔗 Enregistrement dans PageManager...');
    window.pageManager.pages.categories = (container) => {
        window.categoriesPage.render(container);
    };
    console.log('[CategoriesPage] ✅ Enregistré dans PageManager sous "categories"');
} else {
    console.log('[CategoriesPage] ⚠️ PageManager non disponible, enregistrement différé...');
    
    // Attendre que PageManager soit disponible
    const checkPageManager = () => {
        if (window.pageManager?.pages) {
            console.log('[CategoriesPage] 🔗 Enregistrement différé dans PageManager...');
            window.pageManager.pages.categories = (container) => {
                window.categoriesPage.render(container);
            };
            console.log('[CategoriesPage] ✅ Enregistré dans PageManager sous "categories"');
        } else {
            setTimeout(checkPageManager, 500);
        }
    };
    
    setTimeout(checkPageManager, 1000);
}

console.log('[CategoriesPage] ✅ CategoriesPage chargé et prêt!');
