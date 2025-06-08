// UIManager.js - Gestionnaire d'interface utilisateur v6.0

class UIManager {
    constructor() {
        this.toastContainer = null;
        this.currentToasts = [];
        this.maxToasts = 5;
        
        console.log('[UIManager] Constructor v6.0 - UI management initialized');
        this.init();
    }

    init() {
        // Créer le conteneur de toasts s'il n'existe pas
        this.createToastContainer();
        
        // Initialiser les gestionnaires d'événements
        this.setupEventHandlers();
        
        console.log('[UIManager] ✅ Initialized successfully');
    }

    createToastContainer() {
        this.toastContainer = document.getElementById('toastContainer');
        
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(this.toastContainer);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        console.log(`[UIManager] Showing toast: ${type.toUpperCase()} - ${message}`);
        
        // Limiter le nombre de toasts
        if (this.currentToasts.length >= this.maxToasts) {
            this.removeOldestToast();
        }
        
        const toast = this.createToastElement(message, type);
        this.toastContainer.appendChild(toast);
        this.currentToasts.push(toast);
        
        // Animation d'entrée
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto-suppression
        const timeoutId = setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        // Permettre la fermeture manuelle
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(timeoutId);
                this.removeToast(toast);
            });
        }
        
        return toast;
    }

    createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const colors = {
            info: { bg: '#3b82f6', border: '#2563eb' },
            success: { bg: '#10b981', border: '#059669' },
            warning: { bg: '#f59e0b', border: '#d97706' },
            error: { bg: '#dc2626', border: '#b91c1c' }
        };
        
        const color = colors[type] || colors.info;
        
        toast.style.cssText = `
            background: ${color.bg};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid ${color.border};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            word-wrap: break-word;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            position: relative;
            padding-right: 45px;
        `;
        
        const icons = {
            info: '📘',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        toast.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 16px; flex-shrink: 0;">${icons[type] || icons.info}</span>
                <span style="flex: 1;">${message}</span>
            </div>
            <button class="toast-close" style="
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                opacity: 0.7;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
        `;
        
        return toast;
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        // Animation de sortie
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Retirer de la liste des toasts actifs
            const index = this.currentToasts.indexOf(toast);
            if (index > -1) {
                this.currentToasts.splice(index, 1);
            }
        }, 300);
    }

    removeOldestToast() {
        if (this.currentToasts.length > 0) {
            this.removeToast(this.currentToasts[0]);
        }
    }

    clearAllToasts() {
        console.log('[UIManager] Clearing all toasts');
        this.currentToasts.forEach(toast => this.removeToast(toast));
    }

    updateAuthStatus(user) {
        console.log('[UIManager] Updating auth status:', user ? 'authenticated' : 'not authenticated');
        
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            if (user) {
                const userName = user.displayName || user.mail || 'Utilisateur';
                authStatus.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #10b981; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-user-circle"></i> 
                            ${userName}
                        </span>
                        <button onclick="window.app.logout()" style="
                            background: none; 
                            border: 1px solid rgba(255,255,255,0.3); 
                            color: white; 
                            padding: 4px 8px; 
                            border-radius: 4px; 
                            cursor: pointer; 
                            font-size: 12px;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                            <i class="fas fa-sign-out-alt"></i> Déconnexion
                        </button>
                    </div>
                `;
            } else {
                authStatus.innerHTML = `
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-user-slash"></i> Non connecté
                    </span>
                `;
            }
        }
    }

    showLoading(message = 'Chargement...', target = null) {
        console.log('[UIManager] Showing loading:', message);
        
        const loadingId = 'loading-' + Date.now();
        const loading = document.createElement('div');
        loading.id = loadingId;
        loading.className = 'ui-loading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        
        loading.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 300px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <div style="
                    color: #333;
                    font-size: 16px;
                    font-weight: 500;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">${message}</div>
            </div>
        `;
        
        // Ajouter l'animation CSS si elle n'existe pas
        if (!document.getElementById('ui-loading-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ui-loading-styles';
            styles.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        (target || document.body).appendChild(loading);
        
        return {
            id: loadingId,
            remove: () => this.hideLoading(loadingId)
        };
    }

    hideLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 300);
        }
    }

    showModal(title, content, options = {}) {
        console.log('[UIManager] Showing modal:', title);
        
        const modal = document.createElement('div');
        modal.className = 'ui-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <div style="
                    padding: 20px 25px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <h3 style="
                        margin: 0;
                        font-size: 20px;
                        font-weight: 600;
                        color: #1f2937;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    ">${title}</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 5px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
                </div>
                <div style="padding: 25px;">
                    ${content}
                </div>
                ${options.showFooter !== false ? `
                    <div style="
                        padding: 15px 25px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    ">
                        <button class="modal-cancel" style="
                            background: #f3f4f6;
                            color: #374151;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: background 0.2s ease;
                        " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                            ${options.cancelText || 'Annuler'}
                        </button>
                        <button class="modal-confirm" style="
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: background 0.2s ease;
                        " onmouseover="this.style.background='#5a67d8'" onmouseout="this.style.background='#667eea'">
                            ${options.confirmText || 'Confirmer'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animation d'entrée
        setTimeout(() => {
            modal.style.opacity = '1';
            const modalContent = modal.querySelector('div > div');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
            }
        }, 10);
        
        // Gestionnaires d'événements
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Fermer avec Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        return {
            modal,
            close: closeModal,
            confirm: () => {
                const confirmBtn = modal.querySelector('.modal-confirm');
                return new Promise((resolve) => {
                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', () => {
                            resolve(true);
                            closeModal();
                        });
                    }
                });
            }
        };
    }

    showConfirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.showModal(title, `
                <div style="
                    font-size: 16px;
                    line-height: 1.6;
                    color: #374151;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                    ${message}
                </div>
            `, {
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler'
            });
            
            const confirmBtn = modal.modal.querySelector('.modal-confirm');
            const cancelBtn = modal.modal.querySelector('.modal-cancel');
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    resolve(true);
                    modal.close();
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    resolve(false);
                    modal.close();
                });
            }
        });
    }

    updatePageTitle(title) {
        document.title = title ? `${title} - EmailSortPro` : 'EmailSortPro - Scanner d\'Emails Intelligent';
    }

    setupEventHandlers() {
        // Gestionnaire global pour les raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / pour afficher l'aide
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
            
            // Escape pour fermer les toasts
            if (e.key === 'Escape' && this.currentToasts.length > 0) {
                this.clearAllToasts();
            }
        });
        
        console.log('[UIManager] Event handlers setup complete');
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl + /', description: 'Afficher cette aide' },
            { key: 'Escape', description: 'Fermer les notifications' },
            { key: 'Alt + 1', description: 'Aller au Dashboard' },
            { key: 'Alt + 2', description: 'Aller au Scanner' },
            { key: 'Alt + 3', description: 'Aller aux Emails' },
            { key: 'Alt + 4', description: 'Aller aux Tâches' }
        ];
        
        const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <p style="margin-bottom: 20px; color: #6b7280;">Raccourcis clavier disponibles :</p>
                <div style="display: grid; gap: 10px;">
                    ${shortcuts.map(shortcut => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                            <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #374151;">${shortcut.key}</code>
                            <span style="color: #6b7280; font-size: 14px;">${shortcut.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.showModal('Raccourcis clavier', content, { showFooter: false });
    }

    // Méthodes utilitaires pour l'interface
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Aujourd\'hui';
        } else if (diffDays === 2) {
            return 'Hier';
        } else if (diffDays <= 7) {
            return `Il y a ${diffDays - 1} jours`;
        } else {
            return d.toLocaleDateString('fr-FR');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Méthode de diagnostic
    getDebugInfo() {
        return {
            toastContainerExists: !!this.toastContainer,
            currentToastsCount: this.currentToasts.length,
            maxToasts: this.maxToasts,
            isInitialized: true,
            version: '6.0'
        };
    }
}

// Créer l'instance globale
try {
    if (!window.uiManager) {
        window.uiManager = new UIManager();
        console.log('[UIManager] ✅ Global instance created successfully');
    }
} catch (error) {
    console.error('[UIManager] ❌ Failed to create global instance:', error);
    
    // Instance de fallback très basique
    window.uiManager = {
        showToast: function(message, type, duration) {
            console.log(`[UIManager Fallback] ${type}: ${message}`);
            alert(`${type.toUpperCase()}: ${message}`);
        },
        updateAuthStatus: function(user) {
            console.log('[UIManager Fallback] Auth status updated:', !!user);
        },
        showLoading: function(message) {
            console.log('[UIManager Fallback] Loading:', message);
            return { remove: () => {} };
        },
        hideLoading: function() {
            console.log('[UIManager Fallback] Hide loading');
        },
        getDebugInfo: function() {
            return { error: 'UIManager fallback mode', version: '6.0-fallback' };
        }
    };
}

console.log('✅ UIManager v6.0 loaded with complete interface management');
