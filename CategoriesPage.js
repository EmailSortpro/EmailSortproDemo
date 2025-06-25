// CategoriesPage.js - Version Compatible Netlify v22.0
console.log('[CategoriesPage] 🚀 Loading CategoriesPage.js v22.0 - Netlify Compatible...');

// Nettoyer toute instance précédente
if (window.categoriesPage) {
    console.log('[CategoriesPage] 🧹 Nettoyage instance précédente...');
    delete window.categoriesPage;
}

class CategoriesPageNetlify {
    constructor() {
        this.editingCategoryId = null;
        this.currentModal = null;
        this.searchTerm = '';
        this.viewMode = 'grid';
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#48DBFB', '#A29BFE', '#FD79A8'
        ];
        
        // Données de backup pour fonctionner sans dépendances
        this.backupCategories = {
            work: { name: 'Travail', icon: '💼', color: '#4ECDC4', priority: 10 },
            personal: { name: 'Personnel', icon: '👤', color: '#FF6B6B', priority: 20 },
            finance: { name: 'Finance', icon: '💰', color: '#FECA57', priority: 15 },
            shopping: { name: 'Shopping', icon: '🛒', color: '#54A0FF', priority: 25 },
            news: { name: 'Actualités', icon: '📰', color: '#A29BFE', priority: 30 }
        };
        
        this.backupEmails = this.generateBackupEmails();
        
        console.log('[CategoriesPage] 🎨 Interface moderne v22.0 initialisée pour Netlify');
    }

    // ================================================
    // DONNÉES DE BACKUP POUR FONCTIONNER SANS DÉPENDANCES
    // ================================================
    generateBackupEmails() {
        const categories = ['work', 'personal', 'finance', 'shopping', 'news', 'other'];
        const emails = [];
        
        // Générer des emails de démonstration
        for (let i = 0; i < 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            emails.push({
                id: `email_${i}`,
                subject: this.getRandomSubject(category),
                from: {
                    emailAddress: {
                        name: this.getRandomSender(category),
                        address: this.getRandomEmail(category)
                    }
                },
                receivedDateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                category: category === 'other' ? null : category
            });
        }
        
        return emails;
    }
    
    getRandomSubject(category) {
        const subjects = {
            work: ['Réunion équipe', 'Rapport mensuel', 'Nouveau projet', 'Présentation client'],
            personal: ['Invitation anniversaire', 'Photos vacances', 'Nouvelles famille', 'Planning weekend'],
            finance: ['Relevé bancaire', 'Facture électricité', 'Assurance auto', 'Déclaration impôts'],
            shopping: ['Commande expédiée', 'Promotion spéciale', 'Nouvelle collection', 'Code promo'],
            news: ['Actualités tech', 'Breaking news', 'Newsletter hebdo', 'Tendances marché'],
            other: ['Sans objet', 'Divers', 'Information', 'Notification']
        };
        const categorySubjects = subjects[category] || subjects.other;
        return categorySubjects[Math.floor(Math.random() * categorySubjects.length)];
    }
    
    getRandomSender(category) {
        const senders = {
            work: ['Jean Dupont', 'Marie Martin', 'Équipe RH', 'Direction'],
            personal: ['Famille', 'Ami(e)', 'Voisin', 'Club sport'],
            finance: ['Banque', 'EDF', 'Assurance', 'Service impôts'],
            shopping: ['Amazon', 'Cdiscount', 'Zara', 'Fnac'],
            news: ['Le Monde', 'TechCrunch', 'Newsletter', 'Blog Tech'],
            other: ['Expéditeur', 'Service', 'Contact', 'Notification']
        };
        const categorySenders = senders[category] || senders.other;
        return categorySenders[Math.floor(Math.random() * categorySenders.length)];
    }
    
    getRandomEmail(category) {
        const domains = {
            work: ['entreprise.com', 'societe.fr', 'business.com'],
            personal: ['gmail.com', 'outlook.com', 'yahoo.fr'],
            finance: ['banque.fr', 'edf.fr', 'impots.gouv.fr'],
            shopping: ['amazon.fr', 'cdiscount.com', 'zara.com'],
            news: ['lemonde.fr', 'techcrunch.com', 'newsletter.com'],
            other: ['service.com', 'contact.fr', 'noreply.com']
        };
        const categoryDomains = domains[category] || domains.other;
        const domain = categoryDomains[Math.floor(Math.random() * categoryDomains.length)];
        return `contact@${domain}`;
    }

    // ================================================
    // MÉTHODES DE BACKUP POUR REMPLACER LES DÉPENDANCES
    // ================================================
    getCategories() {
        // Utiliser window.categoryManager si disponible, sinon backup
        if (window.categoryManager && typeof window.categoryManager.getCategories === 'function') {
            return window.categoryManager.getCategories();
        }
        return this.backupCategories;
    }
    
    getAllEmails() {
        // Utiliser window.emailScanner si disponible, sinon backup
        if (window.emailScanner && typeof window.emailScanner.getAllEmails === 'function') {
            return window.emailScanner.getAllEmails();
        }
        return this.backupEmails;
    }
    
    getCategoryManager() {
        return window.categoryManager || {
            getCategories: () => this.backupCategories,
            getCategory: (id) => this.backupCategories[id],
            getCategoryKeywords: (id) => ({
                absolute: [], strong: [], weak: [], exclusions: []
            }),
            getCategoryFilters: (id) => ({
                includeDomains: [], includeEmails: [], excludeDomains: [], excludeEmails: []
            }),
            updateActiveCategories: (categories) => {
                console.log('[CategoriesPage] Backup: updateActiveCategories called');
            }
        };
    }

    // ================================================
    // RENDU PRINCIPAL - AVEC INTÉGRATION CORRECTE
    // ================================================
    render(container) {
        if (!container) {
            console.error('[CategoriesPage] ❌ Container manquant');
            return;
        }

        try {
            const categories = this.getCategories();
            const settings = this.loadSettings();
            
            console.log('[CategoriesPage] 📊 Rendu avec:', {
                categoriesCount: Object.keys(categories).length,
                hasEmailScanner: !!window.emailScanner,
                hasCategoryManager: !!window.categoryManager
            });
            
            container.innerHTML = `
                <div class="categories-modern">
                    <!-- Header vibrant -->
                    <div class="header-modern">
                        <div class="header-content">
                            <h1>Catégories <span class="emoji">✨</span></h1>
                            <p class="subtitle">Organisez vos emails avec style</p>
                        </div>
                        <button class="btn-create" onclick="window.categoriesPage.showCreateModal()">
                            <i class="fas fa-plus"></i>
                            <span>Créer</span>
                        </button>
                    </div>
                    
                    <!-- Stats colorées -->
                    <div class="stats-bar">
                        <div class="stat-card" style="--accent: #FF6B6B">
                            <div class="stat-value">${Object.keys(categories).length}</div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat-card" style="--accent: #4ECDC4">
                            <div class="stat-value">${this.getActiveCount(categories, settings.activeCategories)}</div>
                            <div class="stat-label">Actives</div>
                        </div>
                        <div class="stat-card" style="--accent: #45B7D1">
                            <div class="stat-value">${this.getTotalKeywords(categories)}</div>
                            <div class="stat-label">Mots-clés</div>
                        </div>
                        <div class="search-modern">
                            <i class="fas fa-search"></i>
                            <input type="text" 
                                   placeholder="Rechercher..." 
                                   onkeyup="window.categoriesPage.handleSearch(this.value)">
                        </div>
                    </div>
                    
                    <!-- Grille de catégories -->
                    <div class="categories-grid" id="categories-container">
                        ${this.renderCategories(categories, settings.activeCategories)}
                    </div>
                </div>
            `;
            
            this.addStyles();
            
        } catch (error) {
            console.error('[CategoriesPage] Erreur rendu:', error);
            container.innerHTML = this.renderError();
        }
    }

    // Rendu pour la page Settings/Paramètres
    renderSettings(container) {
        if (!container) {
            console.error('[CategoriesPage] ❌ Container manquant pour settings');
            return;
        }
        
        // Simplement appeler render() qui gère déjà tout
        this.render(container);
    }

    // ================================================
    // RENDU DES CATÉGORIES AVEC BACKUP
    // ================================================
    renderCategories(categories, activeCategories) {
        const filtered = this.filterCategories(categories);
        
        console.log('[CategoriesPage] 🏷️ Rendu des catégories:', {
            total: Object.keys(categories).length,
            filtered: Object.keys(filtered).length,
            searchTerm: this.searchTerm
        });
        
        if (Object.keys(filtered).length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>Aucune catégorie trouvée</p>
                    ${this.searchTerm ? `
                        <button class="btn-modern secondary" onclick="window.categoriesPage.handleSearch('')">
                            Effacer la recherche
                        </button>
                    ` : ''}
                </div>
            `;
        }
        
        // Calculer les statistiques pour chaque catégorie
        const emailStats = this.calculateEmailStats();
        console.log('[CategoriesPage] 📊 Statistiques emails:', emailStats);
        
        // Rendu des cartes de catégories
        const categoryCards = Object.entries(filtered)
            .map(([id, category]) => this.renderCategoryCard(id, category, activeCategories, emailStats[id] || 0))
            .join('');
        
        // Ajouter la catégorie "Autre" si elle a des emails
        const otherCount = emailStats.other || 0;
        let otherCard = '';
        
        if (otherCount > 0 && !filtered.other) {
            console.log(`[CategoriesPage] 📌 Ajout carte "Autre" avec ${otherCount} emails`);
            
            const isActive = activeCategories === null || activeCategories.includes('other');
            const settings = this.loadSettings();
            const isPreselected = settings.taskPreselectedCategories?.includes('other') || false;
            
            otherCard = `
                <div class="category-card ${!isActive ? 'inactive' : ''}" 
                     data-id="other"
                     style="--cat-color: #64748b"
                     onclick="window.categoriesPage.showOtherCategoryInfo()">
                    
                    <div class="card-header">
                        <div class="cat-emoji">📌</div>
                        <div class="cat-info">
                            <div class="cat-name">Autre</div>
                            <div class="cat-meta">
                                <span class="meta-count">${otherCount}</span>
                                <span class="meta-description">Non catégorisé</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="btn-minimal ${isActive ? 'on' : 'off'}" 
                                onclick="window.categoriesPage.toggleOtherCategory()"
                                title="Les emails 'Autre' sont toujours visibles">
                            ${isActive ? 'ON' : 'OFF'}
                        </button>
                        <button class="btn-minimal task ${isPreselected ? 'selected' : ''}" 
                                onclick="window.categoriesPage.togglePreselection('other')"
                                title="${isPreselected ? 'Tâches pré-cochées' : 'Tâches non cochées'}">
                            <i class="fas fa-${isPreselected ? 'check-square' : 'square'}"></i>
                        </button>
                        <button class="btn-minimal config" 
                                onclick="window.categoriesPage.showOtherCategoryInfo()"
                                title="Informations sur la catégorie Autre">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        return categoryCards + otherCard;
    }

    calculateEmailStats() {
        const emails = this.getAllEmails();
        const stats = {};
        
        console.log('[CategoriesPage] 📊 Calcul statistiques emails sur', emails.length, 'emails');
        
        emails.forEach((email, index) => {
            const cat = email.category;
            
            // Debug pour les premiers emails
            if (index < 5) {
                console.log(`[CategoriesPage] 🔍 Email ${index} stats:`, {
                    subject: email.subject?.substring(0, 30),
                    category: cat,
                    categoryType: typeof cat
                });
            }
            
            // Traiter tous les cas explicitement
            if (cat === null || cat === undefined || cat === '') {
                // Emails sans catégorie -> les forcer à "other"
                stats.other = (stats.other || 0) + 1;
            } else {
                // Tous les autres emails (y compris ceux déjà marqués "other")
                stats[cat] = (stats[cat] || 0) + 1;
            }
        });
        
        console.log('[CategoriesPage] 📊 Statistiques calculées:', {
            totalCategories: Object.keys(stats).length,
            categories: stats,
            totalEmails: emails.length,
            otherCount: stats.other || 0
        });
        
        return stats;
    }

    showOtherCategoryInfo() {
        console.log('[CategoriesPage] ℹ️ Affichage infos catégorie "Autre"');
        
        const emails = this.getAllEmails();
        const otherEmails = emails.filter(email => {
            const cat = email.category;
            return !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
        });
        
        this.closeModal();
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="if(event.target === this) window.categoriesPage.closeModal()">
                <div class="modal-modern">
                    <div class="modal-header">
                        <div class="modal-title">
                            <span class="modal-icon">📌</span>
                            <h2>Catégorie "Autre"</h2>
                        </div>
                        <button class="btn-close" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="tab-panel active">
                            <div style="padding: 20px;">
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                                    <h3 style="margin: 0 0 12px 0; color: #475569;">
                                        <i class="fas fa-info-circle"></i> À propos de cette catégorie
                                    </h3>
                                    <p style="margin: 0; color: #64748b; line-height: 1.5;">
                                        La catégorie "Autre" contient tous les emails qui n'ont pas pu être automatiquement classés 
                                        dans une catégorie spécifique. Cela peut arriver pour des emails très courts, 
                                        inhabituels ou provenant de nouvelles sources.
                                    </p>
                                </div>
                                
                                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                                    <h4 style="margin: 0 0 16px 0; color: #374151;">
                                        📊 Statistiques (${otherEmails.length} emails)
                                    </h4>
                                    
                                    ${otherEmails.length > 0 ? `
                                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                                            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; text-align: center;">
                                                <div style="font-size: 24px; font-weight: 700; color: #0369a1;">${otherEmails.length}</div>
                                                <div style="font-size: 12px; color: #075985;">Total emails</div>
                                            </div>
                                            <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center;">
                                                <div style="font-size: 24px; font-weight: 700; color: #16a34a;">${new Set(otherEmails.map(e => e.from?.emailAddress?.address?.split('@')[1])).size}</div>
                                                <div style="font-size: 12px; color: #15803d;">Domaines uniques</div>
                                            </div>
                                        </div>
                                        
                                        <h5 style="margin: 0 0 12px 0; color: #374151;">Échantillon d'emails :</h5>
                                        <div style="max-height: 200px; overflow-y: auto;">
                                            ${otherEmails.slice(0, 10).map(email => `
                                                <div style="padding: 8px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                                    <div style="flex: 1; min-width: 0;">
                                                        <div style="font-weight: 600; font-size: 13px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                            ${email.subject || 'Sans sujet'}
                                                        </div>
                                                        <div style="font-size: 11px; color: #6b7280;">
                                                            ${email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu'}
                                                        </div>
                                                    </div>
                                                    <div style="font-size: 10px; color: #9ca3af; white-space: nowrap; margin-left: 8px;">
                                                        ${new Date(email.receivedDateTime).toLocaleDateString('fr-FR')}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : `
                                        <div style="text-align: center; padding: 40px; color: #6b7280;">
                                            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                                            <p>Aucun email non catégorisé !</p>
                                            <p style="font-size: 14px;">Tous vos emails ont été correctement classés.</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-modern secondary" onclick="window.categoriesPage.closeModal()">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        this.currentModal = true;
    }

    toggleOtherCategory() {
        console.log('[CategoriesPage] 🔄 Toggle catégorie "Autre"');
        this.showToast('ℹ️ La catégorie "Autre" est toujours visible', 'info');
    }

    renderCategoryCard(id, category, activeCategories, emailCount = 0) {
        const isActive = activeCategories === null || activeCategories.includes(id);
        const stats = this.getCategoryStats(id);
        const settings = this.loadSettings();
        const isPreselected = settings.taskPreselectedCategories?.includes(id) || false;
        
        return `
            <div class="category-card ${!isActive ? 'inactive' : ''}" 
                 data-id="${id}"
                 style="--cat-color: ${category.color}"
                 onclick="window.categoriesPage.openModal('${id}')">
                
                <div class="card-header">
                    <div class="cat-emoji">${category.icon}</div>
                    <div class="cat-info">
                        <div class="cat-name">${category.name}</div>
                        <div class="cat-meta">
                            <span class="meta-count">${emailCount}</span>
                            ${stats.absolute > 0 ? `<span class="meta-star">★ ${stats.absolute}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="btn-minimal ${isActive ? 'on' : 'off'}" 
                            onclick="window.categoriesPage.toggleCategory('${id}')">
                        ${isActive ? 'ON' : 'OFF'}
                    </button>
                    <button class="btn-minimal task ${isPreselected ? 'selected' : ''}" 
                            onclick="window.categoriesPage.togglePreselection('${id}')"
                            title="${isPreselected ? 'Tâches pré-cochées' : 'Tâches non cochées'}">
                        <i class="fas fa-${isPreselected ? 'check-square' : 'square'}"></i>
                    </button>
                    <button class="btn-minimal config" 
                            onclick="window.categoriesPage.openModal('${id}')">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // ================================================
    // GESTION DES CATÉGORIES ACTIVÉES/DÉSACTIVÉES
    // ================================================
    toggleCategory(categoryId) {
        const settings = this.loadSettings();
        let activeCategories = settings.activeCategories || null;
        
        if (activeCategories === null) {
            const allCategories = Object.keys(this.getCategories());
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
        
        // Notifier CategoryManager si disponible
        const categoryManager = this.getCategoryManager();
        if (categoryManager && typeof categoryManager.updateActiveCategories === 'function') {
            categoryManager.updateActiveCategories(activeCategories);
        }
        
        this.updateCategoriesDisplay();
        this.showToast('État de la catégorie mis à jour');
    }

    // ================================================
    // GESTION DE LA PRÉ-SÉLECTION POUR TÂCHES
    // ================================================
    togglePreselection(categoryId) {
        console.log('[CategoriesPage] 🔄 Toggle pré-sélection pour:', categoryId);
        
        const settings = this.loadSettings();
        let taskPreselectedCategories = settings.taskPreselectedCategories || [];
        
        const isPreselected = taskPreselectedCategories.includes(categoryId);
        
        if (isPreselected) {
            taskPreselectedCategories = taskPreselectedCategories.filter(id => id !== categoryId);
            console.log('[CategoriesPage] ➖ Retrait pré-sélection:', categoryId);
        } else {
            taskPreselectedCategories.push(categoryId);
            console.log('[CategoriesPage] ➕ Ajout pré-sélection:', categoryId);
        }
        
        // Sauvegarder dans les settings
        settings.taskPreselectedCategories = taskPreselectedCategories;
        this.saveSettings(settings);
        
        // Synchronisation avec autres modules si disponibles
        this.syncTaskPreselectedCategories(taskPreselectedCategories);
        
        // Mettre à jour l'affichage
        this.updateCategoriesDisplay();
        
        // Toast avec icône appropriée
        const categories = this.getCategories();
        const category = categories[categoryId];
        const message = isPreselected ? 
            `☐ ${category?.name || categoryId} - Pré-sélection désactivée` : 
            `☑️ ${category?.name || categoryId} - Pré-sélection activée`;
        this.showToast(message);
    }

    // ================================================
    // SYNCHRONISATION AVEC AUTRES MODULES
    // ================================================
    syncTaskPreselectedCategories(categories) {
        console.log('[CategoriesPage] 🔄 === SYNCHRONISATION GLOBALE ===');
        console.log('[CategoriesPage] 📋 Catégories à synchroniser:', categories);
        
        // Essayer de synchroniser avec tous les modules disponibles
        const modules = [
            { name: 'CategoryManager', obj: window.categoryManager, method: 'updateTaskPreselectedCategories' },
            { name: 'EmailScanner', obj: window.emailScanner, method: 'updateTaskPreselectedCategories' },
            { name: 'PageManager', obj: window.pageManager, method: 'updateSettings' },
            { name: 'MinimalScanModule', obj: window.minimalScanModule, method: 'updateSettings' },
            { name: 'AITaskAnalyzer', obj: window.aiTaskAnalyzer, method: 'updatePreselectedCategories' }
        ];
        
        modules.forEach(module => {
            if (module.obj && typeof module.obj[module.method] === 'function') {
                try {
                    if (module.method === 'updateSettings') {
                        module.obj[module.method]({ taskPreselectedCategories: categories });
                    } else {
                        module.obj[module.method](categories);
                    }
                    console.log(`[CategoriesPage] ✅ ${module.name} synchronisé`);
                } catch (error) {
                    console.warn(`[CategoriesPage] ⚠️ Erreur sync ${module.name}:`, error);
                }
            }
        });
        
        // Dispatcher des événements
        this.dispatchSettingsChanged({
            type: 'taskPreselectedCategories',
            value: categories,
            settings: this.loadSettings()
        });
        
        console.log('[CategoriesPage] ✅ Synchronisation terminée');
    }

    dispatchSettingsChanged(detail) {
        try {
            const events = ['categorySettingsChanged', 'settingsChanged'];
            events.forEach(eventName => {
                window.dispatchEvent(new CustomEvent(eventName, { 
                    detail: {
                        ...detail,
                        source: 'CategoriesPage',
                        timestamp: Date.now()
                    }
                }));
            });
            console.log('[CategoriesPage] 📨 Événements dispatched');
        } catch (error) {
            console.error('[CategoriesPage] Erreur dispatch événements:', error);
        }
    }

    getTaskPreselectedCategories() {
        const settings = this.loadSettings();
        return settings.taskPreselectedCategories || [];
    }

    // ================================================
    // MODAL MODERNE
    // ================================================
    openModal(categoryId) {
        const categories = this.getCategories();
        const category = categories[categoryId];
        if (!category) {
            console.warn('[CategoriesPage] Catégorie non trouvée:', categoryId);
            return;
        }
        
        this.closeModal();
        this.editingCategoryId = categoryId;
        
        // Utiliser des données par défaut si les méthodes ne sont pas disponibles
        const categoryManager = this.getCategoryManager();
        const keywords = (categoryManager.getCategoryKeywords && categoryManager.getCategoryKeywords(categoryId)) || {
            absolute: [], strong: [], weak: [], exclusions: []
        };
        
        const filters = (categoryManager.getCategoryFilters && categoryManager.getCategoryFilters(categoryId)) || {
            includeDomains: [], includeEmails: [], excludeDomains: [], excludeEmails: []
        };
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="if(event.target === this) window.categoriesPage.closeModal()">
                <div class="modal-modern">
                    <div class="modal-header">
                        <div class="modal-title">
                            <span class="modal-icon">${category.icon}</span>
                            <h2>${category.name}</h2>
                        </div>
                        <button class="btn-close" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="tabs-modern">
                        <button class="tab active" data-tab="keywords" onclick="window.categoriesPage.switchTab('keywords')">
                            <i class="fas fa-key"></i> Mots-clés
                        </button>
                        <button class="tab" data-tab="filters" onclick="window.categoriesPage.switchTab('filters')">
                            <i class="fas fa-filter"></i> Filtres
                        </button>
                        ${category.isCustom ? `
                            <button class="tab" data-tab="settings" onclick="window.categoriesPage.switchTab('settings')">
                                <i class="fas fa-cog"></i> Paramètres
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="modal-content">
                        <div class="tab-panel active" id="tab-keywords">
                            ${this.renderKeywordsTab(keywords)}
                        </div>
                        
                        <div class="tab-panel" id="tab-filters">
                            ${this.renderFiltersTab(filters)}
                        </div>
                        
                        ${category.isCustom ? `
                            <div class="tab-panel" id="tab-settings">
                                <div class="settings-content">
                                    <div class="danger-zone">
                                        <h4><i class="fas fa-exclamation-triangle"></i> Zone dangereuse</h4>
                                        <p>Cette action est irréversible</p>
                                        <button class="btn-danger" onclick="window.categoriesPage.deleteCategory('${categoryId}')">
                                            <i class="fas fa-trash"></i> Supprimer la catégorie
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-modern secondary" onclick="window.categoriesPage.closeModal()">
                            Annuler
                        </button>
                        <button class="btn-modern primary" onclick="window.categoriesPage.save()">
                            <i class="fas fa-check"></i> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        this.currentModal = true;
    }

    renderKeywordsTab(keywords) {
        return `
            <div class="keywords-layout">
                <div class="keywords-grid">
                    ${this.renderKeywordBox('absolute', 'Mots-clés absolus', keywords.absolute, '#FF6B6B', 'fa-star', 'Déclenchent toujours la catégorie')}
                    ${this.renderKeywordBox('strong', 'Mots-clés forts', keywords.strong, '#FECA57', 'fa-bolt', 'Poids élevé dans la détection')}
                    ${this.renderKeywordBox('weak', 'Mots-clés faibles', keywords.weak, '#54A0FF', 'fa-feather', 'Poids modéré dans la détection')}
                    ${this.renderKeywordBox('exclusions', 'Exclusions', keywords.exclusions, '#A29BFE', 'fa-ban', 'Empêchent la détection')}
                </div>
            </div>
        `;
    }

    renderKeywordBox(type, title, keywords, color, icon, description) {
        return `
            <div class="keyword-box">
                <div class="box-header">
                    <h4><i class="fas ${icon}"></i> ${title}</h4>
                    <span class="box-count" style="background: ${color}20; color: ${color}">${keywords.length}</span>
                </div>
                <p class="box-description">${description}</p>
                <div class="input-modern">
                    <input type="text" id="${type}-input" placeholder="Ajouter un mot-clé..." 
                           onkeypress="if(event.key === 'Enter') window.categoriesPage.addKeyword('${type}', '${color}')">
                    <button style="background: ${color}" onclick="window.categoriesPage.addKeyword('${type}', '${color}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="tags" id="${type}-items">
                    ${keywords.map(k => `
                        <span class="tag" style="background: ${color}15; color: ${color}">
                            ${k}
                            <button onclick="window.categoriesPage.removeItem('${type}', '${k}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderFiltersTab(filters) {
        return `
            <div class="filters-layout">
                <div class="filter-section">
                    <h3>Filtres d'inclusion</h3>
                    
                    <div class="filter-box">
                        <h4><i class="fas fa-globe"></i> Domaines autorisés</h4>
                        <p class="filter-hint">Accepter uniquement les emails de ces domaines</p>
                        <div class="input-modern">
                            <input type="text" id="include-domain" placeholder="exemple.com">
                            <button onclick="window.categoriesPage.addFilter('includeDomains')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="tags" id="includeDomains-items">
                            ${filters.includeDomains.map(d => `
                                <span class="tag filter-tag">
                                    <i class="fas fa-globe"></i>
                                    ${d}
                                    <button onclick="window.categoriesPage.removeItem('includeDomains', '${d}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-box">
                        <h4><i class="fas fa-at"></i> Emails autorisés</h4>
                        <p class="filter-hint">Accepter uniquement les emails de ces adresses</p>
                        <div class="input-modern">
                            <input type="text" id="include-email" placeholder="contact@exemple.com">
                            <button onclick="window.categoriesPage.addFilter('includeEmails')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="tags" id="includeEmails-items">
                            ${filters.includeEmails.map(e => `
                                <span class="tag filter-tag">
                                    <i class="fas fa-at"></i>
                                    ${e}
                                    <button onclick="window.categoriesPage.removeItem('includeEmails', '${e}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="filter-section">
                    <h3>Filtres d'exclusion</h3>
                    
                    <div class="filter-box">
                        <h4><i class="fas fa-ban"></i> Domaines exclus</h4>
                        <p class="filter-hint">Ignorer les emails de ces domaines</p>
                        <div class="input-modern">
                            <input type="text" id="exclude-domain" placeholder="spam.com">
                            <button onclick="window.categoriesPage.addFilter('excludeDomains')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="tags" id="excludeDomains-items">
                            ${filters.excludeDomains.map(d => `
                                <span class="tag exclude-tag">
                                    <i class="fas fa-ban"></i>
                                    ${d}
                                    <button onclick="window.categoriesPage.removeItem('excludeDomains', '${d}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-box">
                        <h4><i class="fas fa-user-slash"></i> Emails exclus</h4>
                        <p class="filter-hint">Ignorer les emails de ces adresses</p>
                        <div class="input-modern">
                            <input type="text" id="exclude-email" placeholder="noreply@exemple.com">
                            <button onclick="window.categoriesPage.addFilter('excludeEmails')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="tags" id="excludeEmails-items">
                            ${filters.excludeEmails.map(e => `
                                <span class="tag exclude-tag">
                                    <i class="fas fa-user-slash"></i>
                                    ${e}
                                    <button onclick="window.categoriesPage.removeItem('excludeEmails', '${e}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ================================================
    // MODAL DE CRÉATION
    // ================================================
    showCreateModal() {
        this.closeModal();
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="if(event.target === this) window.categoriesPage.closeModal()">
                <div class="modal-modern modal-create">
                    <div class="create-header">
                        <h2>Nouvelle catégorie ✨</h2>
                        <button class="btn-close" onclick="window.categoriesPage.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="create-content">
                        <input type="text" 
                               id="new-name" 
                               class="input-name" 
                               placeholder="Nom de la catégorie" 
                               autofocus>
                        
                        <div class="emoji-picker">
                            <label>Choisir une icône</label>
                            <div class="emoji-grid">
                                ${['📁', '📧', '💼', '🎯', '⚡', '🔔', '💡', '📊', '🏷️', '📌', '🌟', '🚀', '💎', '🎨', '🔥'].map(emoji => 
                                    `<button class="emoji-option ${emoji === '📁' ? 'selected' : ''}" 
                                             onclick="window.categoriesPage.selectIcon('${emoji}')">${emoji}</button>`
                                ).join('')}
                            </div>
                            <input type="hidden" id="new-icon" value="📁">
                        </div>
                        
                        <div class="color-selector">
                            <label>Couleur de la catégorie</label>
                            <div class="color-grid">
                                ${this.colors.map((color, i) => 
                                    `<button class="color-option ${i === 0 ? 'selected' : ''}" 
                                             style="background: ${color}"
                                             onclick="window.categoriesPage.selectColor('${color}')"></button>`
                                ).join('')}
                            </div>
                            <input type="hidden" id="new-color" value="${this.colors[0]}">
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-modern secondary" onclick="window.categoriesPage.closeModal()">
                            Annuler
                        </button>
                        <button class="btn-modern primary" onclick="window.categoriesPage.createCategory()">
                            <i class="fas fa-sparkles"></i> Créer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        this.currentModal = true;
        
        setTimeout(() => document.getElementById('new-name')?.focus(), 100);
    }

    // ================================================
    // ACTIONS DES MODALES
    // ================================================
    handleSearch(term) {
        this.searchTerm = term.toLowerCase();
        this.updateCategoriesDisplay();
    }

    filterCategories(categories) {
        if (!this.searchTerm) return categories;
        
        const filtered = {};
        Object.entries(categories).forEach(([id, category]) => {
            if (category.name.toLowerCase().includes(this.searchTerm)) {
                filtered[id] = category;
            }
        });
        return filtered;
    }

    updateCategoriesDisplay() {
        const container = document.getElementById('categories-container');
        if (!container) return;
        
        const categories = this.getCategories();
        const settings = this.loadSettings();
        
        container.innerHTML = this.renderCategories(categories, settings.activeCategories);
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabName}`);
        });
    }

    selectIcon(icon) {
        document.getElementById('new-icon').value = icon;
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.classList.toggle('selected', btn.textContent === icon);
        });
    }

    selectColor(color) {
        document.getElementById('new-color').value = color;
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.style.background === color);
        });
    }

    addKeyword(type, color) {
        const input = document.getElementById(`${type}-input`);
        if (!input?.value.trim()) return;
        
        const value = input.value.trim().toLowerCase();
        const container = document.getElementById(`${type}-items`);
        
        if (!container) return;
        
        container.insertAdjacentHTML('beforeend', `
            <span class="tag" style="background: ${color}15; color: ${color}">
                ${value}
                <button onclick="window.categoriesPage.removeItem('${type}', '${value}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `);
        
        input.value = '';
        input.focus();
    }

    addFilter(type) {
        const inputMap = {
            'includeDomains': 'include-domain',
            'includeEmails': 'include-email',
            'excludeDomains': 'exclude-domain',
            'excludeEmails': 'exclude-email'
        };
        
        const input = document.getElementById(inputMap[type]);
        if (!input?.value.trim()) return;
        
        const value = input.value.trim().toLowerCase();
        const container = document.getElementById(`${type}-items`);
        
        if (!container) return;
        
        const isExclude = type.includes('exclude');
        const icon = type.includes('Domain') ? 
            (isExclude ? 'ban' : 'globe') : 
            (isExclude ? 'user-slash' : 'at');
        
        container.insertAdjacentHTML('beforeend', `
            <span class="tag ${isExclude ? 'exclude-tag' : 'filter-tag'}">
                <i class="fas fa-${icon}"></i>
                ${value}
                <button onclick="window.categoriesPage.removeItem('${type}', '${value}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `);
        
        input.value = '';
        input.focus();
    }

    removeItem(type, value) {
        const container = document.getElementById(`${type}-items`);
        if (!container) return;
        
        const tags = container.querySelectorAll('.tag');
        tags.forEach(tag => {
            const text = tag.textContent.trim().replace(/×$/, '').trim();
            if (text === value || text.includes(value)) {
                tag.remove();
            }
        });
    }

    createCategory() {
        const name = document.getElementById('new-name')?.value?.trim();
        const icon = document.getElementById('new-icon')?.value || '📁';
        const color = document.getElementById('new-color')?.value || this.colors[0];
        
        if (!name) {
            this.showToast('⚠️ Nom requis', 'warning');
            return;
        }
        
        // Essayer avec categoryManager s'il existe, sinon ajouter localement
        const categoryManager = this.getCategoryManager();
        
        if (categoryManager && typeof categoryManager.createCustomCategory === 'function') {
            const categoryData = {
                name,
                icon,
                color,
                priority: 30,
                keywords: { absolute: [], strong: [], weak: [], exclusions: [] }
            };
            
            const newCategory = categoryManager.createCustomCategory(categoryData);
            
            if (newCategory) {
                this.closeModal();
                this.showToast('✅ Catégorie créée avec succès!');
                this.refreshPage();
                
                setTimeout(() => this.openModal(newCategory.id), 300);
                return;
            }
        }
        
        // Fallback: ajouter à nos données de backup
        const newId = 'custom_' + Date.now();
        this.backupCategories[newId] = {
            name,
            icon,
            color,
            priority: 30,
            isCustom: true
        };
        
        this.closeModal();
        this.showToast('✅ Catégorie créée avec succès!');
        this.refreshPage();
    }

    save() {
        if (!this.editingCategoryId) return;
        
        try {
            const getItems = (containerId) => {
                const container = document.getElementById(containerId);
                if (!container) return [];
                return Array.from(container.querySelectorAll('.tag')).map(tag => {
                    const text = tag.textContent.trim();
                    return text.replace(/×$/, '').replace(/^[^\s]+\s/, '').trim();
                });
            };
            
            const keywords = {
                absolute: getItems('absolute-items'),
                strong: getItems('strong-items'),
                weak: getItems('weak-items'),
                exclusions: getItems('exclusions-items')
            };
            
            const filters = {
                includeDomains: getItems('includeDomains-items'),
                includeEmails: getItems('includeEmails-items'),
                excludeDomains: getItems('excludeDomains-items'),
                excludeEmails: getItems('excludeEmails-items')
            };
            
            const categoryManager = this.getCategoryManager();
            
            // Essayer de sauvegarder avec categoryManager si disponible
            if (categoryManager.updateCategoryKeywords && categoryManager.updateCategoryFilters) {
                categoryManager.updateCategoryKeywords(this.editingCategoryId, keywords);
                categoryManager.updateCategoryFilters(this.editingCategoryId, filters);
            }
            
            this.closeModal();
            this.showToast('💾 Modifications enregistrées!');
            this.refreshPage();
            
        } catch (error) {
            console.error('[CategoriesPage] Erreur sauvegarde:', error);
            this.showToast('❌ Erreur lors de la sauvegarde', 'error');
        }
    }

    deleteCategory(categoryId) {
        const categories = this.getCategories();
        const category = categories[categoryId];
        if (!category) return;
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${category.name}" ?`)) {
            const categoryManager = this.getCategoryManager();
            
            if (categoryManager && typeof categoryManager.deleteCustomCategory === 'function') {
                categoryManager.deleteCustomCategory(categoryId);
            } else {
                // Fallback: supprimer de nos données de backup
                delete this.backupCategories[categoryId];
            }
            
            this.closeModal();
            this.showToast('🗑️ Catégorie supprimée');
            this.refreshPage();
        }
    }

    closeModal() {
        document.querySelector('.modal-backdrop')?.remove();
        document.body.style.overflow = 'auto';
        this.currentModal = null;
        this.editingCategoryId = null;
    }

    refreshPage() {
        const container = document.querySelector('.settings-container') || 
                        document.querySelector('.main-content') ||
                        document.querySelector('.content') ||
                        document.getElementById('pageContent');
        if (container) {
            this.render(container);
        }
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
    getCategoryStats(categoryId) {
        if (categoryId === 'other') {
            const emails = this.getAllEmails();
            const otherEmails = emails.filter(email => {
                const cat = email.category;
                return !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
            });
            
            return {
                keywords: 0,
                absolute: 0,
                emailCount: otherEmails.length
            };
        }
        
        const categoryManager = this.getCategoryManager();
        const keywords = (categoryManager.getCategoryKeywords && categoryManager.getCategoryKeywords(categoryId)) || {
            absolute: [], strong: [], weak: [], exclusions: []
        };
        
        return {
            keywords: keywords.absolute.length + keywords.strong.length + 
                     keywords.weak.length + keywords.exclusions.length,
            absolute: keywords.absolute.length,
            emailCount: this.getCategoryEmailCount(categoryId)
        };
    }

    getCategoryEmailCount(categoryId) {
        const emails = this.getAllEmails();
        
        if (categoryId === 'other') {
            return emails.filter(email => {
                const cat = email.category;
                return !cat || cat === 'other' || cat === null || cat === undefined || cat === '';
            }).length;
        }
        
        return emails.filter(email => email.category === categoryId).length;
    }

    getActiveCount(categories, activeCategories) {
        if (!activeCategories) {
            const allCategoriesCount = Object.keys(categories).length;
            const hasOtherEmails = this.getCategoryEmailCount('other') > 0;
            return allCategoriesCount + (hasOtherEmails ? 1 : 0);
        }
        
        const activeCategoriesCount = activeCategories.filter(id => categories[id]).length;
        const otherIsActive = activeCategories.includes('other');
        const hasOtherEmails = this.getCategoryEmailCount('other') > 0;
        
        return activeCategoriesCount + (otherIsActive && hasOtherEmails ? 1 : 0);
    }

    getTotalKeywords(categories) {
        let total = 0;
        Object.keys(categories).forEach(id => {
            if (id !== 'other') {
                const stats = this.getCategoryStats(id);
                total += stats.keywords;
            }
        });
        return total;
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
            console.error('[CategoriesPage] Erreur sauvegarde settings:', error);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-modern ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    renderError() {
        return `
            <div class="error-state">
                <div class="error-icon">😵</div>
                <h3>Oups! Une erreur est survenue</h3>
                <p>Mode démonstration avec données d'exemple</p>
                <button class="btn-modern primary" onclick="window.categoriesPage.refreshPage()">
                    <i class="fas fa-redo"></i> Recharger
                </button>
            </div>
        `;
    }

    // ================================================
    // STYLES MODERNES
    // ================================================
    addStyles() {
        if (document.getElementById('categoriesModernStylesNetlify')) return;
        
        const styles = document.createElement('style');
        styles.id = 'categoriesModernStylesNetlify';
        styles.textContent = `
            /* Base et variables */
            .categories-modern {
                --primary: #6366F1;
                --secondary: #EC4899;
                --success: #10B981;
                --warning: #F59E0B;
                --danger: #EF4444;
                --bg: #F9FAFB;
                --surface: #FFFFFF;
                --text: #111827;
                --text-secondary: #6B7280;
                --border: #E5E7EB;
                --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
                
                padding: 24px;
                min-height: 100vh;
                background: var(--bg);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
                color: var(--text);
            }
            
            /* Header moderne */
            .header-modern {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
                padding: 0 8px;
            }
            
            .header-content h1 {
                font-size: 32px;
                font-weight: 700;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .emoji {
                font-size: 28px;
            }
            
            .subtitle {
                font-size: 16px;
                color: var(--text-secondary);
                margin: 4px 0 0 0;
            }
            
            .btn-create {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            }
            
            .btn-create:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            }
            
            /* Stats bar */
            .stats-bar {
                display: grid;
                grid-template-columns: repeat(3, 120px) 1fr;
                gap: 16px;
                margin-bottom: 24px;
                padding: 0 8px;
            }
            
            .stat-card {
                background: var(--surface);
                border-radius: 16px;
                padding: 16px;
                text-align: center;
                border: 2px solid transparent;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
            }
            
            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
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
            
            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: var(--accent);
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            
            /* Recherche moderne */
            .search-modern {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .search-modern i {
                position: absolute;
                left: 16px;
                color: var(--text-secondary);
                pointer-events: none;
            }
            
            .search-modern input {
                width: 100%;
                padding: 14px 16px 14px 44px;
                border: 2px solid var(--border);
                border-radius: 12px;
                font-size: 15px;
                background: var(--surface);
                transition: all 0.3s;
            }
            
            .search-modern input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            /* Grille de catégories avec colonnes fixes */
            .categories-grid {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 10px;
                padding: 0;
            }
            
            /* Carte de catégorie avec hauteur minimale */
            .category-card {
                background: var(--surface);
                border-radius: 10px;
                padding: 12px;
                border: 1px solid var(--border);
                transition: all 0.2s;
                cursor: pointer;
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: 100%;
                box-sizing: border-box;
                min-height: 120px;
            }
            
            .category-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                border-color: var(--cat-color);
            }
            
            .category-card.inactive {
                opacity: 0.6;
                background: #F5F5F5;
            }
            
            .card-header {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            }
            
            .cat-emoji {
                font-size: 24px;
                width: 40px;
                height: 40px;
                background: var(--cat-color)15;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .cat-info {
                flex: 1;
                min-width: 0;
                overflow: hidden;
            }
            
            .cat-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text);
                line-height: 1.3;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                max-height: 2.6em;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .cat-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
            }
            
            .meta-count {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .meta-star {
                font-size: 12px;
                color: #F59E0B;
                font-weight: 600;
            }
            
            .meta-description {
                font-size: 11px;
                color: var(--text-secondary);
                opacity: 0.8;
            }
            
            .card-actions {
                display: grid;
                grid-template-columns: repeat(3, 32px);
                gap: 3px;
                justify-content: start;
                margin-top: auto;
            }
            
            /* Boutons minimalistes uniformes */
            .btn-minimal {
                width: 32px;
                height: 32px;
                padding: 0;
                border: 1px solid #E5E7EB;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .btn-minimal:hover {
                transform: scale(1.05);
            }
            
            /* Bouton ON/OFF */
            .btn-minimal.on {
                background: #10B981;
                color: white;
                border-color: #10B981;
            }
            
            .btn-minimal.off {
                background: #EF4444;
                color: white;
                border-color: #EF4444;
            }
            
            /* Bouton tâche */
            .btn-minimal.task {
                color: #9CA3AF;
            }
            
            .btn-minimal.task.selected {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
            
            .btn-minimal.task:not(.selected):hover {
                color: var(--primary);
                border-color: var(--primary);
            }
            
            /* Bouton config */
            .btn-minimal.config {
                color: #6B7280;
            }
            
            .btn-minimal.config:hover {
                color: var(--text);
                border-color: var(--text);
            }
            
            /* Modal moderne */
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-modern {
                background: #FFFFFF;
                border-radius: 24px;
                width: 100%;
                max-width: 900px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
                animation: slideUp 0.3s;
                border: 2px solid var(--border);
                overflow: hidden;
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .modal-create {
                max-width: 480px;
            }
            
            /* Modal header */
            .modal-header,
            .create-header {
                padding: 28px;
                border-bottom: 2px solid #D1D5DB;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #FFFFFF;
                border-radius: 24px 24px 0 0;
            }
            
            .modal-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .modal-icon {
                font-size: 32px;
            }
            
            .modal-header h2,
            .create-header h2 {
                font-size: 24px;
                font-weight: 700;
                margin: 0;
            }
            
            .btn-close {
                width: 40px;
                height: 40px;
                border: none;
                background: var(--bg);
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .btn-close:hover {
                background: var(--danger)10;
                color: var(--danger);
            }
            
            /* Tabs modernes */
            .tabs-modern {
                display: flex;
                padding: 0 28px;
                gap: 32px;
                border-bottom: 2px solid #D1D5DB;
                background: #FFFFFF;
            }
            
            .tab {
                padding: 16px 0;
                border: none;
                background: none;
                font-size: 15px;
                font-weight: 600;
                color: var(--text-secondary);
                cursor: pointer;
                position: relative;
                transition: color 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .tab:hover {
                color: var(--text);
            }
            
            .tab.active {
                color: var(--primary);
            }
            
            .tab.active::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--primary);
                border-radius: 3px 3px 0 0;
            }
            
            /* Contenu modal */
            .modal-content {
                padding: 0;
                overflow-y: auto;
                flex: 1;
                background: #E8EAED;
                position: relative;
            }
            
            .create-content {
                padding: 28px;
                overflow-y: auto;
                flex: 1;
                background: #FFFFFF;
            }
            
            /* Tab panel */
            .tab-panel {
                display: none;
                background: #E8EAED;
                min-height: 400px;
                padding: 24px;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            /* Layout mots-clés */
            .keywords-layout {
                padding: 20px 0;
            }
            
            .keywords-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
            }
            
            .keyword-box {
                background: #FFFFFF;
                border: 2px solid var(--border);
                border-radius: 16px;
                padding: 24px;
                transition: all 0.3s;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .keyword-box:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
            
            .box-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .box-header h4 {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .box-count {
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .box-description {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0 0 16px 0;
                line-height: 1.4;
            }
            
            /* Input moderne */
            .input-modern {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .input-modern input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid var(--border);
                border-radius: 10px;
                font-size: 15px;
                transition: all 0.3s;
            }
            
            .input-modern input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .input-modern button {
                width: 44px;
                height: 44px;
                border: none;
                border-radius: 10px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .input-modern button:hover {
                transform: scale(1.1);
            }
            
            /* Tags */
            .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                min-height: 40px;
                background: #FAFBFC;
                padding: 8px;
                border-radius: 8px;
                border: 1px solid #E5E7EB;
            }
            
            .tag {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 15px;
                font-weight: 500;
                transition: all 0.3s;
            }
            
            .tag button {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.6;
                transition: opacity 0.3s;
                font-size: 10px;
            }
            
            .tag button:hover {
                opacity: 1;
            }
            
            .filter-tag {
                background: var(--primary)10;
                color: var(--primary);
            }
            
            .exclude-tag {
                background: var(--danger)10;
                color: var(--danger);
            }
            
            /* Layout filtres */
            .filters-layout {
                display: grid;
                gap: 32px;
            }
            
            .filter-section {
                background: #FFFFFF;
                border: 1px solid var(--border);
                border-radius: 20px;
                padding: 28px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .filter-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 20px 0;
                color: var(--text);
            }
            
            .filter-box {
                margin-bottom: 24px;
            }
            
            .filter-box:last-child {
                margin-bottom: 0;
            }
            
            .filter-box h4 {
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .filter-hint {
                font-size: 13px;
                color: var(--text-secondary);
                margin: 0 0 16px 0;
            }
            
            /* Paramètres */
            .settings-content {
                padding: 20px 0;
            }
            
            .danger-zone {
                background: var(--danger)10;
                border: 2px solid var(--danger)20;
                border-radius: 16px;
                padding: 24px;
            }
            
            .danger-zone h4 {
                font-size: 16px;
                font-weight: 600;
                color: var(--danger);
                margin: 0 0 8px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .danger-zone p {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0 0 16px 0;
            }
            
            .btn-danger {
                width: 100%;
                padding: 12px;
                background: var(--danger);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .btn-danger:hover {
                background: #DC2626;
                transform: scale(1.02);
            }
            
            /* Footer modal */
            .modal-footer {
                padding: 24px 28px;
                border-top: 2px solid #D1D5DB;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                background: #FFFFFF;
                border-radius: 0 0 24px 24px;
            }
            
            /* Boutons modernes */
            .btn-modern {
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-modern.primary {
                background: var(--primary);
                color: white;
            }
            
            .btn-modern.primary:hover {
                background: #5558E3;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .btn-modern.secondary {
                background: var(--bg);
                color: var(--text-secondary);
                border: 2px solid var(--border);
            }
            
            .btn-modern.secondary:hover {
                background: var(--surface);
                border-color: var(--text-secondary);
            }
            
            /* Création de catégorie */
            .input-name {
                width: 100%;
                padding: 16px 20px;
                border: 2px solid var(--border);
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 24px;
                transition: all 0.3s;
                box-sizing: border-box;
            }
            
            .input-name:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .emoji-picker,
            .color-selector {
                margin-bottom: 24px;
            }
            
            .emoji-picker label,
            .color-selector label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 12px;
            }
            
            .emoji-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
                gap: 8px;
            }
            
            .emoji-option {
                width: 48px;
                height: 48px;
                border: 2px solid var(--border);
                background: var(--surface);
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s;
            }
            
            .emoji-option:hover {
                border-color: var(--primary);
                transform: scale(1.1);
            }
            
            .emoji-option.selected {
                border-color: var(--primary);
                background: var(--primary)10;
            }
            
            .color-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                gap: 8px;
            }
            
            .color-option {
                width: 40px;
                height: 40px;
                border: 3px solid transparent;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
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
            
            /* États vides */
            .empty-state,
            .error-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 80px 20px;
            }
            
            .empty-icon,
            .error-icon {
                font-size: 64px;
                margin-bottom: 16px;
                display: block;
            }
            
            .empty-state p,
            .error-state h3 {
                font-size: 18px;
                color: var(--text-secondary);
                margin: 0;
            }
            
            .error-state h3 {
                color: var(--text);
                margin-bottom: 16px;
            }
            
            .error-state p {
                font-size: 14px;
                margin-bottom: 16px;
            }
            
            /* Toast moderne */
            .toast-modern {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--text);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                transition: transform 0.3s;
                z-index: 2000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .toast-modern.show {
                transform: translateX(-50%) translateY(0);
            }
            
            .toast-modern.warning {
                background: var(--warning);
            }
            
            .toast-modern.error {
                background: var(--danger);
            }
            
            .toast-modern.info {
                background: var(--primary);
            }
            
            /* Responsive avec colonnes fixes */
            @media (max-width: 1200px) {
                .categories-grid {
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }
            }
            
            @media (max-width: 768px) {
                .categories-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }
                
                .stats-bar {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .search-modern {
                    grid-column: 1 / -1;
                }
                
                .keywords-grid {
                    grid-template-columns: 1fr;
                }
                
                .modal-modern {
                    max-height: 95vh;
                }
                
                .header-content h1 {
                    font-size: 24px;
                }
                
                .cat-name {
                    font-size: 14px;
                }
                
                .btn-minimal {
                    font-size: 10px;
                }
            }
            
            /* Animations supplémentaires */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .category-card:active {
                animation: pulse 0.3s;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// ================================================
// INTÉGRATION GLOBALE POUR NETLIFY
// ================================================

// Créer l'instance principale
window.categoriesPage = new CategoriesPageNetlify();

// Intégration avec PageManager si disponible
if (window.pageManager?.pages) {
    // Pour la page settings/paramètres
    window.pageManager.pages.settings = (container) => {
        console.log('[CategoriesPage] 📄 Chargement page settings via PageManager');
        window.categoriesPage.render(container);
    };
    
    // Pour la page categories si elle existe
    window.pageManager.pages.categories = (container) => {
        console.log('[CategoriesPage] 📄 Chargement page categories via PageManager');
        window.categoriesPage.render(container);
    };
}

// Fonction d'initialisation pour démarrage automatique
function initializeCategoriesPage() {
    console.log('[CategoriesPage] 🎯 Initialisation automatique...');
    
    // Chercher un container dans la page
    const possibleContainers = [
        '#pageContent',
        '.main-content', 
        '.content',
        '.settings-container',
        '.app-content',
        '#app',
        'main'
    ];
    
    let container = null;
    for (const selector of possibleContainers) {
        container = document.querySelector(selector);
        if (container) {
            console.log(`[CategoriesPage] 📦 Container trouvé: ${selector}`);
            break;
        }
    }
    
    if (container) {
        window.categoriesPage.render(container);
        console.log('[CategoriesPage] ✅ Rendu automatique réussi');
    } else {
        console.warn('[CategoriesPage] ⚠️ Aucun container trouvé pour le rendu automatique');
        console.log('[CategoriesPage] 💡 Essayez: window.categoriesPage.render(document.body)');
    }
}

// Initialisation différée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCategoriesPage);
} else {
    // Si le DOM est déjà chargé, essayer l'initialisation avec un délai
    setTimeout(initializeCategoriesPage, 100);
}

console.log('[CategoriesPage] ✅ CategoriesPage v22.0 chargée - Compatible Netlify!');
console.log('[CategoriesPage] 🎯 Pour un rendu manuel: window.categoriesPage.render(container)');
