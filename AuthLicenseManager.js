// AuthLicenseManager.js - Système de licence unifié et simplifié
// Version corrigée qui ne bloque pas le démarrage

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
                console.warn('[AuthLicense] Fonction Netlify non disponible:', response.status);
                return;
            }
            
            const config = await response.json();
            if (!config.url || !config.anonKey) {
                console.warn('[AuthLicense] Configuration Supabase incomplète');
                return;
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
            console.warn('[AuthLicense] Supabase non disponible:', error.message);
            // Ne pas bloquer l'application si Supabase n'est pas disponible
            this.supabaseClient = null;
        }
    }

    // ==========================================
    // AUTHENTIFICATION
    // ==========================================
    async authenticateWithEmail(email) {
        if (!email) {
            throw new Error('Email requis');
        }

        // Si pas de Supabase, autoriser l'accès
        if (!this.supabaseClient) {
            console.log('[AuthLicense] Supabase non disponible, accès autorisé par défaut');
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
                console.warn('[AuthLicense] Licence invalide:', licenseCheck.message);
                // Ne pas afficher d'erreur bloquante, juste logger
            }

            // Authentification réussie
            this.currentUser = user;
            this.isAuthenticated = true;
            this.licenseValid = licenseCheck.valid;
            
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
            
            // En cas d'erreur, créer un utilisateur local
            const localUser = {
                email: email,
                name: email.split('@')[0],
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString()
            };
            
            this.currentUser = localUser;
            this.isAuthenticated = true;
            this.licenseValid = true;
            
            localStorage.setItem('emailsortpro_user_email', email);
            
            return {
                valid: true,
                user: localUser,
                status: 'trial',
                message: 'Compte créé localement avec essai gratuit'
            };
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
        await window.authLicenseManager.initialize();
        console.log('[AuthLicense] ✅ Initialisation terminée');
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
