// UIManager.js - Version corrigée avec support complet des catégories v8.0

class UIManager {
    constructor() {
        this.toasts = [];
        this.loadingOverlay = null;
        this.isInitialized = false;
        this.categoryCache = new Map();
        this.init();
    }

    init() {
        try {
            // Créer les éléments UI nécessaires
            this.createToastContainer();
            this.createLoadingOverlay();
            this.isInitialized = true;
            console.log('[UIManager] ✅ Initialized with enhanced category support');
        } catch (error) {
            console.error('[UIManager] ❌ Initialization failed:', error);
        }
    }

    // =====================================
    // GESTION DES TOASTS
    // =====================================
    showToast(message, type = 'info', duration = 5000) {
        if (!this.isInitialized) {
            console.warn('[UIManager] Not initialized, showing console message:', message);
            return;
        }

        const toast = this.createToast(message, type, duration);
        const container = document.getElementById('toastContainer');
        
        if (container) {
            container.appendChild(toast);
            
            // Animation d'entrée
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
            
            // Auto-removal
            if (duration > 0) {
                setTimeout(() => {
                    this.removeToast(toast);
                }, duration);
            }
        } else {
            console.warn('[UIManager] Toast container not found, message:', message);
        }
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        toast.innerHTML = `
            <div class="toast-icon" style="color: ${colors[type]}">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter les styles si pas déjà fait
        this.ensureToastStyles();
        
        return toast;
    }

    removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
    }

    createToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    ensureToastStyles() {
        if (document.getElementById('toast-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 500px;
                border-left: 4px solid;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .toast.removing {
                opacity: 0;
                transform: translateX(100%);
            }
            
            .toast-success {
                border-left-color: #10b981;
            }
            
            .toast-error {
                border-left-color: #ef4444;
            }
            
            .toast-warning {
                border-left-color: #f59e0b;
            }
            
            .toast-info {
                border-left-color: #3b82f6;
            }
            
            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-message {
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .toast-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            @media (max-width: 768px) {
                .toast-container {
                    left: 20px;
                    right: 20px;
                    top: 20px;
                }
                
                .toast {
                    min-width: auto;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // GESTION DU LOADING OVERLAY
    // =====================================
    showLoading(message = 'Loading...') {
        if (!this.loadingOverlay) {
            this.createLoadingOverlay();
        }
        
        const messageElement = this.loadingOverlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        this.loadingOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    createLoadingOverlay() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">Loading...</div>
            `;
            document.body.appendChild(overlay);
        }
        
        this.loadingOverlay = overlay;
        this.ensureLoadingStyles();
        return overlay;
    }

    ensureLoadingStyles() {
        if (document.getElementById('loading-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid #e5e7eb;
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            
            .loading-message {
                font-size: 16px;
                font-weight: 600;
                color: #374151;
                text-align: center;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // GESTION DE L'AUTHENTIFICATION
    // =====================================
    updateAuthStatus(user) {
        const authStatus = document.getElementById('authStatus');
        if (!authStatus) return;

        if (user) {
            const initials = this.getUserInitials(user.displayName || user.mail || 'U');
            authStatus.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-details">
                        <div class="user-name">${user.displayName || 'Unknown User'}</div>
                        <div class="user-email">${user.mail || user.userPrincipalName || ''}</div>
                    </div>
                    <button class="logout-btn" onclick="window.app?.logout()" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            authStatus.innerHTML = `
                <span class="auth-status-text">
                    <i class="fas fa-user-slash"></i>
                    Not authenticated
                </span>
            `;
        }
        
        this.ensureAuthStyles();
    }

    getUserInitials(name) {
        if (!name) return 'U';
        
        const words = name.split(' ').filter(word => word.length > 0);
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    }

    ensureAuthStyles() {
        if (document.getElementById('auth-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'auth-styles';
        styles.textContent = `
            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .user-avatar {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .user-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .user-name {
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
                line-height: 1.2;
            }
            
            .user-email {
                font-size: 12px;
                color: #6b7280;
                line-height: 1.2;
            }
            
            .logout-btn {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: #ef4444;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .logout-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                transform: scale(1.05);
            }
            
            .auth-status-text {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #6b7280;
                font-size: 14px;
                font-weight: 500;
                padding: 8px 12px;
                border-radius: 8px;
                background: rgba(107, 114, 128, 0.1);
            }
            
            @media (max-width: 768px) {
                .user-details {
                    display: none;
                }
                
                .user-info {
                    gap: 8px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // CRÉATION DE CARTES DE STATISTIQUES
    // =====================================
    createStatCard({ icon, label, value, color, description, onClick }) {
        const cardId = `stat-card-${Math.random().toString(36).substr(2, 9)}`;
        const clickHandler = onClick ? `onclick="${onClick}"` : '';
        const clickableClass = onClick ? 'clickable' : '';
        
        return `
            <div class="stat-card ${clickableClass}" id="${cardId}" ${clickHandler}>
                <div class="stat-icon" style="color: ${color}">
                    <i class="${icon}"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value" style="color: ${color}">${value}</div>
                    <div class="stat-label">${label}</div>
                    ${description ? `<div class="stat-description">${description}</div>` : ''}
                </div>
            </div>
        `;
    }

    // =====================================
    // CRÉATION DE PILLS DE CATÉGORIES AMÉLIORÉES
    // =====================================
    createCategoryPillCompact(categoryId, count, isActive = false) {
        // Obtenir les informations de la catégorie
        const categoryInfo = this.getCategoryInfo(categoryId);
        if (!categoryInfo) {
            console.warn(`[UIManager] Category info not found for: ${categoryId}`);
            return '';
        }
        
        const activeClass = isActive ? 'active' : '';
        
        return `
            <button class="category-pill-compact ${activeClass}" 
                    data-category="${categoryId}"
                    style="--cat-color: ${categoryInfo.color}"
                    title="${categoryInfo.description || categoryInfo.name}">
                <span class="pill-icon">${categoryInfo.icon}</span>
                <span class="pill-name">${categoryInfo.name}</span>
                <span class="pill-count">${count}</span>
            </button>
        `;
    }

    // =====================================
    // GESTION DES INFORMATIONS DE CATÉGORIE
    // =====================================
    getCategoryInfo(categoryId) {
        // Vérifier le cache d'abord
        if (this.categoryCache.has(categoryId)) {
            return this.categoryCache.get(categoryId);
        }
        
        let categoryInfo = null;
        
        // Catégories spéciales
        if (categoryId === 'all') {
            categoryInfo = {
                id: 'all',
                name: 'Tous',
                icon: '📧',
                color: '#5B21B6',
                description: 'Tous les emails'
            };
        } else if (categoryId === 'other') {
            categoryInfo = {
                id: 'other',
                name: 'Autre',
                icon: '📌',
                color: '#6B7280',
                description: 'Emails non catégorisés'
            };
        } else {
            // Essayer d'obtenir depuis CategoryManager
            if (window.categoryManager && window.categoryManager.getCategory) {
                const category = window.categoryManager.getCategory(categoryId);
                if (category) {
                    categoryInfo = {
                        id: categoryId,
                        name: category.name,
                        icon: category.icon,
                        color: category.color,
                        description: category.description
                    };
                }
            }
            
            // Fallback si CategoryManager n'est pas disponible
            if (!categoryInfo) {
                const fallbackCategories = {
                    newsletters: { name: 'Newsletters', icon: '📰', color: '#3b82f6' },
                    marketing: { name: 'Marketing', icon: '📢', color: '#8b5cf6' },
                    finance: { name: 'Finance', icon: '💰', color: '#dc2626' },
                    security: { name: 'Sécurité', icon: '🔒', color: '#ef4444' },
                    notifications: { name: 'Notifications', icon: '🔔', color: '#f59e0b' },
                    commercial: { name: 'Commercial', icon: '💼', color: '#059669' },
                    education: { name: 'Formation', icon: '📚', color: '#f97316' },
                    personal: { name: 'RH/Personnel', icon: '👥', color: '#10b981' },
                    shopping: { name: 'Shopping', icon: '🛒', color: '#7c3aed' },
                    travel: { name: 'Voyage', icon: '✈️', color: '#0ea5e9' },
                    social: { name: 'Social', icon: '👥', color: '#ec4899' }
                };
                
                const fallback = fallbackCategories[categoryId];
                if (fallback) {
                    categoryInfo = {
                        id: categoryId,
                        name: fallback.name,
                        icon: fallback.icon,
                        color: fallback.color,
                        description: `Catégorie ${fallback.name}`
                    };
                }
            }
        }
        
        // Fallback final
        if (!categoryInfo) {
            categoryInfo = {
                id: categoryId,
                name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                icon: '📂',
                color: '#6B7280',
                description: `Catégorie ${categoryId}`
            };
        }
        
        // Mettre en cache
        this.categoryCache.set(categoryId, categoryInfo);
        
        return categoryInfo;
    }

    // =====================================
    // CRÉATION DE CARTES D'ACTION
    // =====================================
    createActionCard({ icon, title, description, onClick, primary = false, color }) {
        const cardClass = primary ? 'action-card primary' : 'action-card';
        const style = color ? `style="--card-color: ${color}"` : '';
        
        return `
            <div class="${cardClass}" onclick="${onClick}" ${style}>
                <div class="action-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="action-content">
                    <h3 class="action-title">${title}</h3>
                    <p class="action-description">${description}</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }

    // =====================================
    // CRÉATION DE MODALES
    // =====================================
    createModal({ id, title, content, actions, size = 'medium' }) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal modal-${size}`;
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="window.uiManager.closeModal('${id}')"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="window.uiManager.closeModal('${id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions ? `
                    <div class="modal-footer">
                        ${actions}
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.ensureModalStyles();
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        return modal;
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.parentElement.removeChild(modal);
                }
            }, 300);
        }
    }

    ensureModalStyles() {
        if (document.getElementById('modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .modal.show {
                opacity: 1;
                visibility: visible;
            }
            
            .modal.closing {
                opacity: 0;
                visibility: hidden;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .modal-container {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .modal.show .modal-container {
                transform: scale(1);
            }
            
            .modal-small .modal-container {
                max-width: 400px;
                width: 100%;
            }
            
            .modal-medium .modal-container {
                max-width: 600px;
                width: 100%;
            }
            
            .modal-large .modal-container {
                max-width: 900px;
                width: 100%;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .modal-title {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
            }
            
            .modal-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            .modal-body {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .modal-footer {
                padding: 20px 24px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // STYLES GÉNÉRAUX POUR LES COMPOSANTS
    // =====================================
    ensureComponentStyles() {
        if (document.getElementById('ui-component-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ui-component-styles';
        styles.textContent = `
            /* Stat Cards */
            .stat-card {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
                border: 1px solid #f3f4f6;
            }
            
            .stat-card.clickable {
                cursor: pointer;
            }
            
            .stat-card.clickable:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            
            .stat-icon {
                font-size: 32px;
                width: 64px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(59, 130, 246, 0.1);
                border-radius: 12px;
            }
            
            .stat-content {
                flex: 1;
            }
            
            .stat-value {
                font-size: 32px;
                font-weight: 700;
                line-height: 1.2;
                margin-bottom: 4px;
            }
            
            .stat-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .stat-description {
                font-size: 12px;
                color: #9ca3af;
                margin-top: 4px;
            }
            
            /* Category Pills */
            .category-pill-compact {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: #f8fafc;
                border: 2px solid transparent;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                min-height: 40px;
            }
            
            .category-pill-compact:hover {
                background: white;
                border-color: var(--cat-color, #3b82f6);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .category-pill-compact.active {
                background: var(--cat-color, #3b82f6);
                color: white;
                border-color: var(--cat-color, #3b82f6);
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
            
            .pill-icon {
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .pill-name {
                font-weight: 600;
            }
            
            .pill-count {
                background: rgba(255, 255, 255, 0.9);
                color: var(--cat-color, #3b82f6);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
                min-width: 20px;
                text-align: center;
            }
            
            .category-pill-compact.active .pill-count {
                background: rgba(255, 255, 255, 0.25);
                color: white;
            }
            
            /* Action Cards */
            .action-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 20px;
                position: relative;
                overflow: hidden;
            }
            
            .action-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border-color: var(--card-color, #3b82f6);
            }
            
            .action-card.primary {
                background: linear-gradient(135deg, var(--card-color, #3b82f6) 0%, #2563eb 100%);
                color: white;
                border-color: var(--card-color, #3b82f6);
            }
            
            .action-icon {
                font-size: 32px;
                width: 64px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                flex-shrink: 0;
            }
            
            .action-card:not(.primary) .action-icon {
                background: rgba(59, 130, 246, 0.1);
                color: var(--card-color, #3b82f6);
            }
            
            .action-content {
                flex: 1;
            }
            
            .action-title {
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 8px 0;
                line-height: 1.3;
            }
            
            .action-description {
                font-size: 14px;
                opacity: 0.8;
                margin: 0;
                line-height: 1.4;
            }
            
            .action-arrow {
                font-size: 20px;
                opacity: 0.6;
                transition: all 0.3s ease;
            }
            
            .action-card:hover .action-arrow {
                opacity: 1;
                transform: translateX(4px);
            }
            
            /* Grid System */
            .grid {
                display: grid;
                gap: 20px;
            }
            
            .grid-2 {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }
            
            .grid-3 {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
            
            .grid-4 {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
            
            @media (max-width: 768px) {
                .grid-2,
                .grid-3,
                .grid-4 {
                    grid-template-columns: 1fr;
                }
                
                .stat-card {
                    padding: 16px;
                    gap: 12px;
                }
                
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    font-size: 24px;
                }
                
                .stat-value {
                    font-size: 24px;
                }
                
                .action-card {
                    padding: 16px;
                    gap: 12px;
                }
                
                .action-icon {
                    width: 48px;
                    height: 48px;
                    font-size: 24px;
                }
                
                .category-pill-compact {
                    padding: 6px 12px;
                    font-size: 13px;
                    min-height: 36px;
                }
                
                .pill-icon {
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =====================================
    // MÉTHODES UTILITAIRES
    // =====================================
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    formatDate(date) {
        if (!date) return 'Unknown';
        
        const now = new Date();
        const inputDate = new Date(date);
        const diff = now - inputDate;
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h ago`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}d ago`;
        } else {
            return inputDate.toLocaleDateString();
        }
    }

    // =====================================
    // INITIALISATION FINALE
    // =====================================
    ensureAllStyles() {
        this.ensureToastStyles();
        this.ensureLoadingStyles();
        this.ensureAuthStyles();
        this.ensureModalStyles();
        this.ensureComponentStyles();
    }

    // =====================================
    // MÉTHODES DE DEBUG
    // =====================================
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            toastsCount: this.toasts.length,
            categoryCache: this.categoryCache.size,
            loadingVisible: this.loadingOverlay?.classList.contains('show') || false,
            stylesLoaded: {
                toast: !!document.getElementById('toast-styles'),
                loading: !!document.getElementById('loading-styles'),
                auth: !!document.getElementById('auth-styles'),
                modal: !!document.getElementById('modal-styles'),
                components: !!document.getElementById('ui-component-styles')
            }
        };
    }

    clearCache() {
        this.categoryCache.clear();
        console.log('[UIManager] Cache cleared');
    }
}

// Créer l'instance globale
try {
    window.uiManager = new UIManager();
    
    // S'assurer que tous les styles sont chargés
    window.uiManager.ensureAllStyles();
    
    console.log('[UIManager] ✅ Global instance created successfully with enhanced category support');
} catch (error) {
    console.error('[UIManager] ❌ Failed to create global instance:', error);
    
    // Instance de fallback
    window.uiManager = {
        showToast: (message, type) => console.log(`[Toast] ${type}: ${message}`),
        showLoading: (message) => console.log(`[Loading] ${message}`),
        hideLoading: () => console.log('[Loading] Hidden'),
        updateAuthStatus: () => {},
        createStatCard: () => '<div>Stat card unavailable</div>',
        createCategoryPillCompact: () => '<div>Category pill unavailable</div>',
        getCategoryInfo: (id) => ({ id, name: id, icon: '📂', color: '#6B7280' }),
        getDebugInfo: () => ({ error: 'UIManager failed to create' })
    };
}

console.log('✅ UIManager loaded with enhanced error handling and category support v8.0');