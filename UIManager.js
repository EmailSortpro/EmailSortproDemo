// UIManager.js - Gestionnaire d'interface CORRIGÉ v7.2

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.realModeOnly = true;
        this.loadingStates = new Map();
        this.toastQueue = [];
        this.maxToasts = 3;
        
        console.log('[UIManager] Constructor v7.2 - REAL MODE ONLY');
        this.init();
    }

    init() {
        try {
            this.createToastContainer();
            this.createLoadingIndicators();
            this.isInitialized = true;
            console.log('[UIManager] ✅ Initialized successfully (Real mode only)');
        } catch (error) {
            console.error('[UIManager] Initialization error:', error);
        }
    }

    createToastContainer() {
        if (document.getElementById('toast-container')) return;
        
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.innerHTML = '';
        
        document.body.appendChild(container);
    }

    createLoadingIndicators() {
        const styles = `
            <style id="ui-manager-styles">
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                }
                
                .toast {
                    background: white;
                    border-radius: 8px;
                    padding: 16px 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-left: 4px solid #667eea;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transform: translateX(420px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .toast.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .toast.success {
                    border-left-color: #10b981;
                    background: #f0fdf4;
                }
                
                .toast.error {
                    border-left-color: #ef4444;
                    background: #fef2f2;
                }
                
                .toast.warning {
                    border-left-color: #f59e0b;
                    background: #fffbeb;
                }
                
                .toast.info {
                    border-left-color: #3b82f6;
                    background: #eff6ff;
                }
                
                .toast-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                }
                
                .toast.success .toast-icon {
                    color: #10b981;
                }
                
                .toast.error .toast-icon {
                    color: #ef4444;
                }
                
                .toast.warning .toast-icon {
                    color: #f59e0b;
                }
                
                .toast.info .toast-icon {
                    color: #3b82f6;
                }
                
                .toast-content {
                    flex: 1;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    padding: 0;
                    color: #6b7280;
                }
                
                .toast-close:hover {
                    opacity: 1;
                }
                
                .loading-indicator {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 10px;
                    display: none;
                    align-items: center;
                    gap: 15px;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .loading-indicator.show {
                    display: flex;
                }
                
                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-text {
                    font-size: 14px;
                    font-weight: 500;
                }
                
                @media (max-width: 768px) {
                    .toast-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                    
                    .toast {
                        transform: translateY(-100px);
                    }
                    
                    .toast.show {
                        transform: translateY(0);
                    }
                }
            </style>
        `;
        
        const existingStyles = document.getElementById('ui-manager-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    showLoading(message = 'Chargement...', key = 'global') {
        console.log('[UIManager] Showing loading:', message);
        
        this.loadingStates.set(key, { message, timestamp: Date.now() });
        
        let loadingEl = document.getElementById('loading-indicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loading-indicator';
            loadingEl.className = 'loading-indicator';
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        loadingEl.classList.add('show');
        
        // Auto-hide après 30 secondes
        setTimeout(() => {
            this.hideLoading(key);
        }, 30000);
    }

    hideLoading(key = 'global') {
        console.log('[UIManager] Hiding loading for:', key);
        
        this.loadingStates.delete(key);
        
        if (this.loadingStates.size === 0) {
            const loadingEl = document.getElementById('loading-indicator');
            if (loadingEl) {
                loadingEl.classList.remove('show');
            }
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        console.log('[UIManager] Showing toast:', { message, type, duration });
        
        if (message.toLowerCase().includes('demo') || message.toLowerCase().includes('démonstration')) {
            console.warn('[UIManager] Skipping demo toast message');
            return;
        }
        
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('[UIManager] Toast container not found');
            return;
        }
        
        const existingToasts = container.children;
        if (existingToasts.length >= this.maxToasts) {
            existingToasts[0].remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentElement) {
                            toast.remove();
                        }
                    }, 300);
                }
            }, duration);
        }
    }

    // CORRECTION: Mise à jour du statut d'authentification avec gestion des cas undefined
    updateAuthStatus(user) {
        console.log('[UIManager] Updating auth status for:', user);
        
        const authStatusEl = document.getElementById('authStatus');
        if (!authStatusEl) {
            console.warn('[UIManager] authStatus element not found');
            return;
        }
        
        // Si pas d'utilisateur, utiliser les variables globales comme fallback
        if (!user) {
            user = window.currentUser || null;
        }
        
        if (user) {
            const displayName = user.displayName || user.name || user.mail || user.email || 'Utilisateur';
            const email = user.mail || user.userPrincipalName || user.email || '';
            const initials = this.getInitials(displayName);
            const provider = user.provider || (email.includes('@gmail.com') ? 'google' : 'microsoft');
            const providerText = provider === 'google' ? 'Gmail' : 'Outlook';
            
            // Récupérer le statut de licence
            let licenseInfo = '';
            if (window.licenseStatus) {
                const { status, daysRemaining } = window.licenseStatus;
                if (status === 'trial' && daysRemaining <= 7) {
                    licenseInfo = `<span style="color: #fbbf24; margin-left: 8px; font-size: 11px;">⏳ ${daysRemaining}j restants</span>`;
                }
            }
            
            authStatusEl.innerHTML = `
                <div class="user-info">
                    <div class="user-details">
                        <div class="user-name">${displayName}${licenseInfo}</div>
                        <div class="user-email">${email} (${providerText})</div>
                    </div>
                    <div class="user-avatar">${initials}</div>
                    <button class="logout-button" onclick="window.handleLogout()">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            `;
        } else {
            authStatusEl.innerHTML = `
                <span style="opacity: 0.8;">Non connecté</span>
            `;
        }
    }

    getInitials(name) {
        if (!name) return '?';
        
        const parts = name.split(/[\s@._-]+/).filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    }

    showModal(title, content, actions = []) {
        console.log('[UIManager] Showing modal:', title);
        
        if (content.toLowerCase().includes('demo') || content.toLowerCase().includes('démonstration')) {
            console.warn('[UIManager] Blocking demo content in modal');
            content = 'Contenu de démonstration bloqué. Utilisez vos données réelles.';
        }
        
        const existingModal = document.getElementById('ui-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'modal-overlay';
        
        const actionsHTML = actions.map(action => 
            `<button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick || ''}">${action.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal-actions">
                        ${actionsHTML}
                    </div>
                ` : ''}
            </div>
        `;
        
        if (!document.getElementById('modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'modal-styles';
            modalStyles.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .modal-overlay.show {
                    opacity: 1;
                }
                
                .modal-container {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .modal-overlay.show .modal-container {
                    transform: scale(1);
                }
                
                .modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1f2937;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 4px;
                    border-radius: 4px;
                    transition: color 0.2s;
                }
                
                .modal-close:hover {
                    color: #374151;
                }
                
                .modal-content {
                    padding: 24px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .modal-actions {
                    padding: 16px 24px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5a67d8;
                }
                
                .btn-secondary {
                    background: #e5e7eb;
                    color: #374151;
                }
                
                .btn-secondary:hover {
                    background: #d1d5db;
                }
            `;
            document.head.appendChild(modalStyles);
        }
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    hideModal() {
        const modal = document.getElementById('ui-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.remove();
                }
            }, 300);
        }
    }

    showConfirmation(message, onConfirm, onCancel = null) {
        if (message.toLowerCase().includes('demo') || message.toLowerCase().includes('démonstration')) {
            console.warn('[UIManager] Blocking demo confirmation message');
            message = 'Action sur données réelles. Êtes-vous sûr ?';
        }
        
        this.showModal('Confirmation', `<p>${message}</p>`, [
            {
                text: 'Annuler',
                class: 'btn-secondary',
                onclick: `window.uiManager.hideModal(); ${onCancel ? `(${onCancel})()` : ''}`
            },
            {
                text: 'Confirmer',
                class: 'btn-primary',
                onclick: `window.uiManager.hideModal(); (${onConfirm})()`
            }
        ]);
    }

    updateProgress(percent, message = '') {
        console.log('[UIManager] Progress update:', percent + '%', message);
        
        const progressEl = document.querySelector('.scan-progress-bar');
        const textEl = document.querySelector('.scan-progress-text');
        
        if (progressEl) {
            progressEl.style.width = `${percent}%`;
        }
        
        if (textEl && message) {
            textEl.textContent = message;
        }
    }

    showNotification(title, message, type = 'info') {
        if (message.toLowerCase().includes('demo') || title.toLowerCase().includes('demo')) {
            console.warn('[UIManager] Blocking demo notification');
            return;
        }
        
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body: message,
                            icon: '/favicon.ico'
                        });
                    }
                });
            }
        }
        
        this.showToast(`${title}: ${message}`, type);
    }

    handleError(error, context = 'Application') {
        console.error(`[UIManager] Error in ${context}:`, error);
        
        let userMessage = 'Une erreur est survenue';
        
        if (error.message) {
            if (error.message.includes('demo')) {
                userMessage = 'Erreur avec données de démonstration. Utilisez vos données réelles.';
            } else if (error.message.includes('auth')) {
                userMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
            } else if (error.message.includes('network')) {
                userMessage = 'Erreur réseau. Vérifiez votre connexion.';
            } else {
                userMessage = error.message;
            }
        }
        
        this.showToast(userMessage, 'error');
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            realModeOnly: this.realModeOnly,
            activeLoadings: Array.from(this.loadingStates.keys()),
            toastCount: document.querySelectorAll('.toast').length,
            hasModal: !!document.getElementById('ui-modal')
        };
    }
}

// Créer l'instance globale
try {
    window.uiManager = new UIManager();
    console.log('[UIManager] ✅ Global instance created successfully');
} catch (error) {
    console.error('[UIManager] ❌ Failed to create global instance:', error);
    
    // Instance de fallback
    window.uiManager = {
        showToast: (message, type) => console.log('[UIManager Fallback] Toast:', message, type),
        showLoading: (message) => console.log('[UIManager Fallback] Loading:', message),
        hideLoading: () => console.log('[UIManager Fallback] Hide loading'),
        updateAuthStatus: (user) => console.log('[UIManager Fallback] Auth status:', user),
        showModal: (title, content) => console.log('[UIManager Fallback] Modal:', title),
        hideModal: () => console.log('[UIManager Fallback] Hide modal'),
        getStatus: () => ({ error: 'UIManager failed to initialize: ' + error.message })
    };
}

console.log('✅ UIManager v7.2 loaded - NO DEMO CONTENT ALLOWED');
