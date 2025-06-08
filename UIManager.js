// UIManager.js - Version 7.0 - CORRECTION INTERACTIONS UI

class UIManager {
    constructor() {
        console.log('[UIManager] Constructor v7.0 - UI management initialized');
        
        this.activeModals = new Set();
        this.loadingStates = new Map();
        this.toastQueue = [];
        this.isShowingToast = false;
        this.currentTheme = 'light';
        
        // Configuration des toasts
        this.toastConfig = {
            duration: {
                success: 3000,
                info: 4000,
                warning: 5000,
                error: 6000
            },
            maxToasts: 3
        };
        
        this.init();
    }

    init() {
        this.createToastContainer();
        this.setupGlobalEventListeners();
        this.setupKeyboardShortcuts();
        console.log('[UIManager] ✅ Initialized successfully');
    }

    // =====================================
    // TOAST NOTIFICATIONS - AMÉLIORÉES
    // =====================================
    showToast(message, type = 'info', duration = null) {
        if (!message) return;
        
        const toast = {
            id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message: String(message),
            type: type,
            duration: duration || this.toastConfig.duration[type] || 4000,
            timestamp: Date.now()
        };
        
        console.log(`[UIManager] Showing toast: ${toast.type} - ${toast.message}`);
        
        this.toastQueue.push(toast);
        this.processToastQueue();
    }

    processToastQueue() {
        if (this.isShowingToast || this.toastQueue.length === 0) {
            return;
        }
        
        // Limiter le nombre de toasts affichés
        const container = this.getToastContainer();
        const activeToasts = container.children.length;
        
        if (activeToasts >= this.toastConfig.maxToasts) {
            // Supprimer le plus ancien toast
            const oldestToast = container.firstElementChild;
            if (oldestToast) {
                this.removeToast(oldestToast);
            }
        }
        
        const toast = this.toastQueue.shift();
        this.displayToast(toast);
    }

    displayToast(toast) {
        this.isShowingToast = true;
        
        const container = this.getToastContainer();
        
        const toastElement = document.createElement('div');
        toastElement.id = toast.id;
        toastElement.className = `toast toast-${toast.type}`;
        toastElement.setAttribute('data-timestamp', toast.timestamp);
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toastElement.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="${iconMap[toast.type] || iconMap.info}"></i>
                </div>
                <div class="toast-message">${this.escapeHtml(toast.message)}</div>
                <button class="toast-close" onclick="window.uiManager.removeToast(this.closest('.toast'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="animation-duration: ${toast.duration}ms;"></div>
            </div>
        `;
        
        // Ajouter au container
        container.appendChild(toastElement);
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            toastElement.classList.add('toast-show');
        });
        
        // Auto-suppression
        setTimeout(() => {
            this.removeToast(toastElement);
        }, toast.duration);
        
        // Permettre le traitement du prochain toast
        setTimeout(() => {
            this.isShowingToast = false;
            this.processToastQueue();
        }, 100);
    }

    removeToast(toastElement) {
        if (!toastElement || !toastElement.parentNode) return;
        
        toastElement.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }

    getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = this.createToastContainer();
        }
        return container;
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        
        this.addToastStyles();
        return container;
    }

    // =====================================
    // LOADING STATES - OPTIMISÉS
    // =====================================
    showLoading(message = 'Chargement...', target = 'global') {
        console.log(`[UIManager] Showing loading: ${message}`);
        
        this.loadingStates.set(target, {
            message: message,
            timestamp: Date.now()
        });
        
        if (target === 'global') {
            this.showGlobalLoading(message);
        } else {
            this.showLocalLoading(target, message);
        }
    }

    hideLoading(target = 'global') {
        console.log(`[UIManager] Hiding loading for: ${target}`);
        
        this.loadingStates.delete(target);
        
        if (target === 'global') {
            this.hideGlobalLoading();
        } else {
            this.hideLocalLoading(target);
        }
    }

    showGlobalLoading(message) {
        let overlay = document.getElementById('global-loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.className = 'loading-overlay global-loading';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <div class="loading-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        overlay.classList.add('active');
        this.addLoadingStyles();
    }

    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode && !overlay.classList.contains('active')) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    showLocalLoading(target, message) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;
        
        // Créer ou mettre à jour l'overlay local
        let overlay = element.querySelector('.local-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay local-loading-overlay';
            element.style.position = 'relative';
            element.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner small"></div>
                </div>
                <div class="loading-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        overlay.classList.add('active');
    }

    hideLocalLoading(target) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;
        
        const overlay = element.querySelector('.local-loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode && !overlay.classList.contains('active')) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // =====================================
    // MODALS - SIMPLIFIÉS
    // =====================================
    showModal(options = {}) {
        const modal = this.createModal(options);
        this.activeModals.add(modal.id);
        document.body.appendChild(modal);
        
        // Animation d'ouverture
        requestAnimationFrame(() => {
            modal.classList.add('modal-show');
        });
        
        // Gestion de l'ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal(modal.id);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        return modal.id;
    }

    createModal(options) {
        const {
            id = `modal-${Date.now()}`,
            title = 'Modal',
            content = '',
            size = 'medium',
            closable = true,
            actions = []
        } = options;
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal modal-${size}`;
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.uiManager.hideModal('${id}')"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                    ${closable ? `
                        <button class="modal-close" onclick="window.uiManager.hideModal('${id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal-footer">
                        ${actions.map(action => `
                            <button class="btn ${action.class || 'btn-secondary'}" 
                                    onclick="${action.onclick || ''}">
                                ${action.text || 'Action'}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        this.addModalStyles();
        return modal;
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.add('modal-hide');
        this.activeModals.delete(modalId);
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    hideAllModals() {
        this.activeModals.forEach(modalId => {
            this.hideModal(modalId);
        });
    }

    // =====================================
    // AUTH STATUS - SIMPLIFIÉ
    // =====================================
    updateAuthStatus(status, userInfo = null) {
        console.log(`[UIManager] Updating auth status: ${status}`);
        
        const authStatusElement = document.getElementById('authStatus');
        if (!authStatusElement) return;
        
        switch (status) {
            case 'authenticated':
                const displayName = userInfo?.displayName || userInfo?.name || 'Utilisateur';
                authStatusElement.innerHTML = `
                    <div class="auth-user">
                        <div class="user-avatar">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(displayName)}</div>
                            <div class="user-status">Connecté</div>
                        </div>
                        <button class="btn-logout" onclick="window.app?.logout()" title="Déconnexion">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                `;
                break;
                
            case 'authenticating':
                authStatusElement.innerHTML = `
                    <div class="auth-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Connexion...</span>
                    </div>
                `;
                break;
                
            case 'error':
                authStatusElement.innerHTML = `
                    <div class="auth-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Erreur de connexion</span>
                    </div>
                `;
                break;
                
            default:
                authStatusElement.innerHTML = `
                    <div class="auth-disconnected">
                        <span class="text-muted">Non connecté</span>
                    </div>
                `;
        }
        
        this.addAuthStyles();
    }

    // =====================================
    // EVENT LISTENERS
    // =====================================
    setupGlobalEventListeners() {
        // Gestion des erreurs JavaScript globales
        window.addEventListener('error', (event) => {
            console.error('[UIManager] Global error:', event.error);
            this.showToast('Une erreur inattendue s\'est produite', 'error');
        });
        
        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[UIManager] Unhandled promise rejection:', event.reason);
            this.showToast('Erreur de traitement', 'error');
        });
        
        // Gestion de la connectivité
        window.addEventListener('online', () => {
            this.showToast('Connexion Internet rétablie', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Connexion Internet perdue', 'warning');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC pour fermer les modales
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                const lastModal = Array.from(this.activeModals).pop();
                this.hideModal(lastModal);
            }
            
            // Ctrl+/ pour l'aide (si implémentée)
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.showHelpModal();
            }
        });
    }

    showHelpModal() {
        this.showModal({
            title: 'Raccourcis clavier',
            content: `
                <div class="help-content">
                    <div class="help-section">
                        <h4>Navigation</h4>
                        <ul>
                            <li><kbd>Échap</kbd> - Fermer les modales</li>
                            <li><kbd>Ctrl</kbd> + <kbd>/</kbd> - Afficher cette aide</li>
                        </ul>
                    </div>
                </div>
            `,
            size: 'small',
            actions: [
                {
                    text: 'Fermer',
                    class: 'btn-primary',
                    onclick: `window.uiManager.hideModal(this.closest('.modal').id)`
                }
            ]
        });
    }

    // =====================================
    // UTILITY METHODS
    // =====================================
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =====================================
    // STYLES - OPTIMISÉS
    // =====================================
    addToastStyles() {
        if (document.getElementById('toast-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }
            
            .toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 320px;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
                overflow: hidden;
                position: relative;
            }
            
            .toast.toast-show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .toast.toast-hide {
                opacity: 0;
                transform: translateX(100%);
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }
            
            .toast-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .toast-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: #374151;
            }
            
            .toast-close {
                background: none;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ca3af;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .toast-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(0,0,0,0.1);
            }
            
            .toast-progress-bar {
                height: 100%;
                background: currentColor;
                animation: toast-progress linear forwards;
                transform-origin: left;
            }
            
            @keyframes toast-progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
            
            /* Types de toast */
            .toast-success { border-left: 4px solid #10b981; }
            .toast-success .toast-icon { color: #10b981; }
            .toast-success .toast-progress-bar { background: #10b981; }
            
            .toast-error { border-left: 4px solid #ef4444; }
            .toast-error .toast-icon { color: #ef4444; }
            .toast-error .toast-progress-bar { background: #ef4444; }
            
            .toast-warning { border-left: 4px solid #f59e0b; }
            .toast-warning .toast-icon { color: #f59e0b; }
            .toast-warning .toast-progress-bar { background: #f59e0b; }
            
            .toast-info { border-left: 4px solid #3b82f6; }
            .toast-info .toast-icon { color: #3b82f6; }
            .toast-info .toast-progress-bar { background: #3b82f6; }
            
            /* Responsive */
            @media (max-width: 640px) {
                .toast-container {
                    left: 20px;
                    right: 20px;
                    top: 80px;
                }
                
                .toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    addLoadingStyles() {
        if (document.getElementById('loading-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9998;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .loading-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .loading-overlay.global-loading {
                position: fixed;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 9999;
            }
            
            .loading-content {
                text-align: center;
                color: #374151;
            }
            
            .global-loading .loading-content {
                color: white;
            }
            
            .loading-spinner {
                margin-bottom: 16px;
            }
            
            .spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(59, 130, 246, 0.2);
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .spinner.small {
                width: 32px;
                height: 32px;
                border-width: 3px;
            }
            
            .global-loading .spinner {
                border-color: rgba(255, 255, 255, 0.2);
                border-top-color: white;
            }
            
            .loading-message {
                font-size: 16px;
                font-weight: 500;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }

    addModalStyles() {
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
                z-index: 9997;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .modal.modal-show {
                opacity: 1;
                visibility: visible;
            }
            
            .modal.modal-hide {
                opacity: 0;
                visibility: hidden;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .modal-dialog {
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                position: relative;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .modal.modal-show .modal-dialog {
                transform: scale(1);
            }
            
            .modal-small .modal-dialog { max-width: 400px; }
            .modal-medium .modal-dialog { max-width: 600px; }
            .modal-large .modal-dialog { max-width: 800px; }
            .modal-xl .modal-dialog { max-width: 1200px; }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .modal-title {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
            }
            
            .modal-close {
                background: none;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ca3af;
                transition: all 0.2s ease;
            }
            
            .modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .modal-body {
                padding: 24px;
                overflow-y: auto;
                max-height: calc(90vh - 200px);
            }
            
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 24px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }
        `;
        document.head.appendChild(styles);
    }

    addAuthStyles() {
        if (document.getElementById('auth-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'auth-styles';
        styles.textContent = `
            .auth-user {
                display: flex;
                align-items: center;
                gap: 12px;
                color: white;
            }
            
            .user-avatar {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
            }
            
            .user-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .user-name {
                font-weight: 600;
                font-size: 14px;
            }
            
            .user-status {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .btn-logout {
                background: rgba(255, 255, 255, 0.1);
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
            
            .btn-logout:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .auth-loading {
                display: flex;
                align-items: center;
                gap: 8px;
                color: white;
                font-size: 14px;
            }
            
            .auth-error {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fbbf24;
                font-size: 14px;
            }
            
            .auth-disconnected {
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
            }
            
            .text-muted {
                opacity: 0.7;
            }
            
            @media (max-width: 768px) {
                .user-info {
                    display: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Create global instance
window.uiManager = new UIManager();

// Bind methods to preserve context
Object.getOwnPropertyNames(UIManager.prototype).forEach(name => {
    if (name !== 'constructor' && typeof window.uiManager[name] === 'function') {
        window.uiManager[name] = window.uiManager[name].bind(window.uiManager);
    }
});

console.log('✅ UIManager v7.0 loaded - Correction interactions UI');
