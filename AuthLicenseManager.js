// AuthLicenseManager.js - Système de licence unifié et simplifié
// Version corrigée qui fonctionne avec Supabase

class AuthLicenseManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.licenseValid = false;
        this.supabaseClient = null;
        this.initialized = false;
        
        console.log('[AuthLicense] Initialisation du gestionnaire unifié...');
    }

    // ==========================================
    // INITIALISATION
    // ==========================================
    async initialize() {
        if (this.initialized) {
            console.log('[AuthLicense] Déjà initialisé');
            return true;
        }

        try {
            // 1. Initialiser Supabase
            await this.initializeSupabase();
            
            // 2. Vérifier l'authentification existante
            await this.checkExistingAuth();
            
            this.initialized = true;
            console.log('[AuthLicense] ✅ Gestionnaire initialisé');
            return true;
            
        } catch (error) {
            console.error('[AuthLicense] ❌ Erreur initialisation:', error);
            this.initialized = true; // Marquer comme initialisé même en cas d'erreur
            return false;
        }
    }

    async initializeSupabase() {
        try {
            // Vérifier si Supabase est disponible
            if (!window.supabase) {
                console.warn('[AuthLicense] Supabase non chargé');
                return;
            }

            // Charger la config depuis Netlify
            const response = await fetch('/.netlify/functions/get-supabase-config');
            if (!response.ok) {
                throw new Error(`Erreur config: ${response.status}`);
            }
            
            const config = await response.json();
            if (!config.url || !config.anonKey) {
                throw new Error('Configuration Supabase incomplète');
            }
            
            this.supabaseClient = window.supabase.createClient(
                config.url.trim(),
                config.anonKey.trim(),
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    }
                }
            );
            
            console.log('[AuthLicense] ✅ Supabase configuré');
            
        } catch (error) {
            console.error('[AuthLicense] ❌ Erreur Supabase:', error);
            // Ne pas bloquer l'application si Supabase n'est pas disponible
            this.supabaseClient = null;
        }
    }

    // ==========================================
    // AUTHENTIFICATION
    // ==========================================
    async checkExistingAuth() {
        try {
            // Vérifier si un email est stocké
            const storedEmail = localStorage.getItem('emailsortpro_user_email');
            if (!storedEmail || !this.supabaseClient) {
                console.log('[AuthLicense] Aucun utilisateur stocké ou Supabase non disponible');
                return false;
            }

            console.log('[AuthLicense] Vérification de l\'utilisateur:', storedEmail);
            
            // Vérifier dans la base de données
            const { data: user, error } = await this.supabaseClient
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    role,
                    license_status,
                    license_expires_at,
                    created_at,
                    company_id,
                    companies (
                        id,
                        name,
                        domain
                    )
                `)
                .eq('email', storedEmail)
                .single();

            if (error || !user) {
                console.warn('[AuthLicense] Utilisateur non trouvé:', error?.message);
                this.clearAuth();
                return false;
            }

            // Vérifier et mettre à jour le statut de licence
            const licenseCheck = this.checkAndUpdateLicense(user);
            
            if (licenseCheck.valid) {
                this.currentUser = user;
                this.isAuthenticated = true;
                this.licenseValid = true;
                
                // Mettre à jour la dernière connexion
                await this.updateLastLogin(user.id);
                
                console.log('[AuthLicense] ✅ Utilisateur authentifié avec licence valide');
                return true;
            } else {
                console.warn('[AuthLicense] ❌ Licence invalide:', licenseCheck.message);
                this.showLicenseError(licenseCheck);
                return false;
            }

        } catch (error) {
            console.error('[AuthLicense] Erreur vérification auth:', error);
            this.clearAuth();
            return false;
        }
    }

    async authenticateWithEmail(email) {
        if (!email) {
            throw new Error('Email requis');
        }

        // Si pas de Supabase, autoriser l'accès
        if (!this.supabaseClient) {
            console.warn('[AuthLicense] Supabase non disponible, accès autorisé par défaut');
            this.currentUser = { email, license_status: 'active' };
            this.isAuthenticated = true;
            this.licenseValid = true;
            
            localStorage.setItem('emailsortpro_user_email', email);
            
            return {
                valid: true,
                user: this.currentUser,
                status: 'active',
                message: 'Accès autorisé (mode hors ligne)'
            };
        }

        console.log('[AuthLicense] Authentification avec email:', email);
        
        try {
            // Récupérer l'utilisateur
            const { data: user, error } = await this.supabaseClient
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    role,
                    license_status,
                    license_expires_at,
                    created_at,
                    company_id,
                    companies (
                        id,
                        name,
                        domain
                    )
                `)
                .eq('email', email)
                .single();

            if (error || !user) {
                // Si l'utilisateur n'existe pas, le créer automatiquement
                console.log('[AuthLicense] Utilisateur non trouvé, création automatique...');
                return await this.createNewUser(email);
            }

            // Vérifier la licence
            const licenseCheck = this.checkAndUpdateLicense(user);
            
            if (!licenseCheck.valid) {
                this.showLicenseError(licenseCheck);
                throw new Error(licenseCheck.message);
            }

            // Authentification réussie
            this.currentUser = user;
            this.isAuthenticated = true;
            this.licenseValid = true;
            
            // Stocker l'email
            localStorage.setItem('emailsortpro_user_email', email);
            localStorage.setItem('emailsortpro_last_auth', new Date().toISOString());
            
            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);
            
            console.log('[AuthLicense] ✅ Authentification réussie');
            
            return {
                valid: true,
                user: user,
                status: user.license_status,
                message: 'Authentification réussie'
            };

        } catch (error) {
            console.error('[AuthLicense] Erreur authentification:', error);
            
            // En cas d'erreur, autoriser quand même l'accès
            this.currentUser = { email, license_status: 'active' };
            this.isAuthenticated = true;
            this.licenseValid = true;
            
            localStorage.setItem('emailsortpro_user_email', email);
            
            return {
                valid: true,
                user: this.currentUser,
                status: 'active',
                message: 'Accès autorisé (mode dégradé)'
            };
        }
    }

    async createNewUser(email) {
        try {
            const domain = email.split('@')[1];
            const now = new Date();
            const trialEndDate = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 jours d'essai
            
            // Créer le nouvel utilisateur
            const { data: newUser, error } = await this.supabaseClient
                .from('users')
                .insert({
                    email: email,
                    name: email.split('@')[0],
                    license_status: 'trial',
                    license_expires_at: trialEndDate.toISOString(),
                    created_at: now.toISOString(),
                    updated_at: now.toISOString(),
                    last_login_at: now.toISOString()
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('[AuthLicense] ✅ Nouvel utilisateur créé avec essai gratuit');
            
            // Authentifier le nouvel utilisateur
            this.currentUser = newUser;
            this.isAuthenticated = true;
            this.licenseValid = true;
            
            localStorage.setItem('emailsortpro_user_email', email);
            
            return {
                valid: true,
                user: newUser,
                status: 'trial',
                message: 'Compte créé avec essai gratuit de 15 jours'
            };
            
        } catch (error) {
            console.error('[AuthLicense] Erreur création utilisateur:', error);
            throw error;
        }
    }

    // ==========================================
    // GESTION DES LICENCES
    // ==========================================
    checkAndUpdateLicense(user) {
        const now = new Date();
        const expiresAt = user.license_expires_at ? new Date(user.license_expires_at) : null;
        const licenseStatus = user.license_status;
        
        console.log('[AuthLicense] Vérification licence:', {
            status: licenseStatus,
            expiresAt: expiresAt?.toISOString(),
            now: now.toISOString()
        });

        // Vérifier si bloqué
        if (licenseStatus === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Votre accès a été suspendu. Contactez votre administrateur.',
                showContact: true
            };
        }

        // Vérifier expiration
        if (expiresAt && expiresAt < now) {
            // Licence expirée
            if (licenseStatus === 'trial') {
                return {
                    valid: false,
                    status: 'trial_expired',
                    message: 'Votre période d\'essai gratuit de 15 jours est terminée.',
                    showContact: true
                };
            } else {
                return {
                    valid: false,
                    status: 'expired',
                    message: 'Votre licence a expiré. Veuillez renouveler votre abonnement.',
                    showContact: true
                };
            }
        }

        // Licence valide
        if (licenseStatus === 'active' || licenseStatus === 'trial') {
            const daysRemaining = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : null;
            
            return {
                valid: true,
                status: licenseStatus,
                daysRemaining: daysRemaining,
                message: licenseStatus === 'trial' ? 
                    `Période d'essai - ${daysRemaining} jours restants` : 
                    'Licence active'
            };
        }

        // Statut inconnu - autoriser l'accès
        return {
            valid: true,
            status: 'unknown',
            message: 'Statut de licence non reconnu.'
        };
    }

    async updateLastLogin(userId) {
        if (!this.supabaseClient) return;
        
        try {
            await this.supabaseClient
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString() 
                })
                .eq('id', userId);
        } catch (error) {
            console.warn('[AuthLicense] Erreur mise à jour last_login:', error);
        }
    }

    // ==========================================
    // INTERFACE UTILISATEUR
    // ==========================================
    showLicenseError(licenseResult) {
        // Supprimer les erreurs existantes
        document.querySelectorAll('.license-error-overlay').forEach(el => el.remove());
        
        const { status, message, showContact } = licenseResult;
        
        // Créer l'overlay d'erreur
        const overlay = document.createElement('div');
        overlay.className = 'license-error-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
        `;
        
        let icon = '⚠️';
        let title = 'Accès refusé';
        
        switch (status) {
            case 'trial_expired':
                icon = '⏰';
                title = 'Période d\'essai expirée';
                break;
            case 'expired':
                icon = '📋';
                title = 'Licence expirée';
                break;
            case 'blocked':
                icon = '🚫';
                title = 'Accès suspendu';
                break;
        }
        
        const errorBox = document.createElement('div');
        errorBox.style.cssText = `
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            text-align: center;
            max-width: 550px;
            width: 90%;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            animation: slideInUp 0.3s ease-out;
        `;
        
        errorBox.innerHTML = `
            <div style="color: #dc2626; font-size: 4rem; margin-bottom: 1.5rem;">${icon}</div>
            <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.75rem;">${title}</h2>
            <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
            
            ${showContact ? `
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px;">📧 Support EmailSortPro</h4>
                    <p style="margin: 0; color: #0369a1;">
                        <a href="mailto:vianney.hastings@hotmail.fr" style="color: #0284c7; text-decoration: none;">
                            vianney.hastings@hotmail.fr
                        </a>
                    </p>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
                <button onclick="window.authLicenseManager.retryAuth()" style="
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-refresh"></i> Réessayer
                </button>
                
                <button onclick="window.authLicenseManager.logout()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                ">
                    Changer d'utilisateur
                </button>
            </div>
        `;
        
        overlay.appendChild(errorBox);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Ajouter les styles d'animation
        if (!document.getElementById('license-error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'license-error-styles';
            styles.textContent = `
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // ==========================================
    // MÉTHODES PUBLIQUES
    // ==========================================
    async login(email) {
        try {
            const result = await this.authenticateWithEmail(email);
            
            // Émettre l'événement de succès
            window.dispatchEvent(new CustomEvent('userAuthenticated', {
                detail: {
                    user: result.user,
                    status: result
                }
            }));
            
            return result;
            
        } catch (error) {
            // Émettre l'événement d'échec
            window.dispatchEvent(new CustomEvent('licenseCheckFailed', {
                detail: {
                    status: 'error',
                    message: error.message
                }
            }));
            
            throw error;
        }
    }

    retryAuth() {
        // Supprimer l'overlay d'erreur
        document.querySelectorAll('.license-error-overlay').forEach(el => el.remove());
        document.body.style.overflow = '';
        
        // Relancer la vérification
        window.location.reload();
    }

    logout() {
        this.clearAuth();
        window.location.reload();
    }

    clearAuth() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.licenseValid = false;
        
        try {
            localStorage.removeItem('emailsortpro_user_email');
            localStorage.removeItem('emailsortpro_last_auth');
        } catch (error) {
            console.warn('[AuthLicense] Erreur nettoyage localStorage:', error);
        }
        
        // Supprimer les overlays d'erreur
        document.querySelectorAll('.license-error-overlay').forEach(el => el.remove());
        document.body.style.overflow = '';
    }

    // Getters
    getUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated && this.licenseValid;
    }

    hasValidLicense() {
        return this.licenseValid;
    }

    // ==========================================
    // DEBUG
    // ==========================================
    debug() {
        return {
            initialized: this.initialized,
            isAuthenticated: this.isAuthenticated,
            licenseValid: this.licenseValid,
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                license_status: this.currentUser.license_status,
                license_expires_at: this.currentUser.license_expires_at
            } : null,
            supabaseReady: !!this.supabaseClient,
            storedEmail: localStorage.getItem('emailsortpro_user_email'),
            timestamp: new Date().toISOString()
        };
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================

// Créer l'instance globale
window.authLicenseManager = new AuthLicenseManager();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[AuthLicense] Auto-initialisation...');
    
    try {
        const initialized = await window.authLicenseManager.initialize();
        
        if (initialized && window.authLicenseManager.isUserAuthenticated()) {
            console.log('[AuthLicense] ✅ Utilisateur authentifié, déclenchement showApp');
            
            // Déclencher l'affichage de l'app
            if (window.showApp) {
                window.showApp();
            }
        } else {
            console.log('[AuthLicense] ❌ Authentification requise');
        }
        
    } catch (error) {
        console.error('[AuthLicense] Erreur auto-initialisation:', error);
    }
});

// Fonction globale pour la connexion manuelle
window.loginWithEmail = async function(email) {
    try {
        if (!window.authLicenseManager.initialized) {
            await window.authLicenseManager.initialize();
        }
        
        const result = await window.authLicenseManager.login(email);
        
        if (result.valid && window.showApp) {
            window.showApp();
        }
        
        return result;
        
    } catch (error) {
        console.error('[AuthLicense] Erreur connexion manuelle:', error);
        throw error;
    }
};

// Debug global
window.debugAuth = function() {
    const debug = window.authLicenseManager.debug();
    console.group('🔐 AUTH LICENSE MANAGER DEBUG');
    console.log('Status:', debug);
    console.groupEnd();
    return debug;
};

console.log('✅ AuthLicenseManager v2.0 chargé - Système unifié d\'authentification et licence avec mode dégradé');
