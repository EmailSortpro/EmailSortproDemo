// LicenseService.js - Service de gestion des licences simplifié

class LicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.licenseCache = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Vérifier la configuration
            if (!window.supabaseConfig) {
                throw new Error('Configuration Supabase manquante');
            }

            const config = window.supabaseConfig.getConfig();
            if (!config) {
                throw new Error('Configuration Supabase invalide');
            }

            // Charger Supabase client
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseClient();
            }

            // Initialiser le client
            this.supabase = window.supabase.createClient(config.url, config.anonKey, config.auth);
            this.initialized = true;

            console.log('[LicenseService] ✅ Initialisé');
            return true;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur initialisation:', error);
            return false;
        }
    }

    async loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Impossible de charger Supabase'));
            document.head.appendChild(script);
        });
    }

    // Vérifier la licence d'un utilisateur
    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        if (!this.supabase) return { valid: false, error: 'Service non initialisé' };

        try {
            // Vérifier d'abord dans le cache
            if (this.licenseCache && this.licenseCache.email === email) {
                const cacheAge = Date.now() - this.licenseCache.timestamp;
                if (cacheAge < 5 * 60 * 1000) { // Cache de 5 minutes
                    return this.licenseCache.result;
                }
            }

            // Rechercher ou créer l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select('*, company:companies(*)')
                .eq('email', email.toLowerCase())
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas, le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);

            // Vérifier le statut de la licence
            const licenseStatus = this.evaluateLicenseStatus(user);

            // Mettre en cache
            this.licenseCache = {
                email: email,
                timestamp: Date.now(),
                result: {
                    valid: licenseStatus.valid,
                    status: licenseStatus.status,
                    user: user,
                    message: licenseStatus.message,
                    daysRemaining: licenseStatus.daysRemaining
                }
            };

            this.currentUser = user;
            return this.licenseCache.result;

        } catch (error) {
            console.error('[LicenseService] Erreur vérification licence:', error);
            return {
                valid: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    // Créer un nouvel utilisateur
    async createNewUser(email) {
        const domain = email.split('@')[1];
        const name = email.split('@')[0];

        // Vérifier si c'est un domaine d'entreprise existant
        const { data: company } = await this.supabase
            .from('companies')
            .select('*')
            .eq('domain', domain)
            .single();

        const isPersonalEmail = this.isPersonalEmailDomain(domain);

        const newUser = {
            email: email.toLowerCase(),
            name: name,
            company_id: company?.id || null,
            role: isPersonalEmail ? 'admin' : 'user', // Admin si email personnel
            license_status: 'trial',
            license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            first_login_at: new Date()
        };

        const { data, error } = await this.supabase
            .from('users')
            .insert([newUser])
            .select('*, company:companies(*)')
            .single();

        if (error) throw error;

        // Si email personnel et pas de société, créer une société individuelle
        if (isPersonalEmail && !company) {
            await this.createPersonalCompany(data.id, email);
        }

        return data;
    }

    // Créer une société pour un particulier
    async createPersonalCompany(userId, email) {
        const companyName = `Personnel - ${email}`;
        
        const { data: company, error: companyError } = await this.supabase
            .from('companies')
            .insert([{
                name: companyName,
                domain: email // Utiliser l'email comme domaine unique
            }])
            .select()
            .single();

        if (companyError) {
            console.error('[LicenseService] Erreur création société:', companyError);
            return;
        }

        // Mettre à jour l'utilisateur avec la société
        await this.supabase
            .from('users')
            .update({ 
                company_id: company.id,
                role: 'admin' // Admin de sa propre société
            })
            .eq('id', userId);

        // Créer une licence trial
        await this.supabase
            .from('licenses')
            .insert([{
                company_id: company.id,
                user_id: userId,
                type: 'trial',
                seats: 1,
                used_seats: 1,
                status: 'active',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }]);
    }

    // Évaluer le statut de la licence
    evaluateLicenseStatus(user) {
        // Vérifier si bloqué
        if (user.license_status === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Accès bloqué. Veuillez contacter votre administrateur.'
            };
        }

        // Vérifier l'expiration
        const expiresAt = new Date(user.license_expires_at);
        const now = new Date();

        if (expiresAt < now) {
            return {
                valid: false,
                status: 'expired',
                message: 'Votre licence a expiré. Veuillez la renouveler.'
            };
        }

        // Vérifier le statut
        if (user.license_status === 'active' || user.license_status === 'trial') {
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            return {
                valid: true,
                status: user.license_status,
                message: user.license_status === 'trial' 
                    ? `Période d'essai - ${daysRemaining} jours restants`
                    : 'Licence active',
                daysRemaining: daysRemaining
            };
        }

        return {
            valid: false,
            status: 'invalid',
            message: 'Statut de licence invalide'
        };
    }

    // Mettre à jour la dernière connexion
    async updateLastLogin(userId) {
        try {
            await this.supabase
                .from('users')
                .update({ last_login_at: new Date() })
                .eq('id', userId);
        } catch (error) {
            console.warn('[LicenseService] Erreur mise à jour login:', error);
        }
    }

    // Vérifier si c'est un domaine email personnel
    isPersonalEmailDomain(domain) {
        const personalDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
            'live.com', 'aol.com', 'icloud.com', 'mail.com',
            'protonmail.com', 'yandex.com', 'zoho.com', 'gmx.com',
            'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net'
        ];
        
        return personalDomains.includes(domain.toLowerCase());
    }

    // Obtenir les infos utilisateur actuelles
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est admin
    isAdmin() {
        return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
    }

    // Vérifier si l'utilisateur est super admin
    isSuperAdmin() {
        return this.currentUser?.role === 'super_admin';
    }

    // Invalider le cache
    invalidateCache() {
        this.licenseCache = null;
    }

    // === MÉTHODES ADMIN ===

    // Obtenir tous les utilisateurs de la société
    async getCompanyUsers() {
        if (!this.currentUser?.company_id) return [];
        if (!this.isAdmin()) return [];

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('company_id', this.currentUser.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[LicenseService] Erreur récupération utilisateurs:', error);
            return [];
        }
    }

    // Mettre à jour le statut d'un utilisateur
    async updateUserLicense(userId, status, expiresAt = null) {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            const updateData = {
                license_status: status,
                updated_at: new Date()
            };

            if (expiresAt) {
                updateData.license_expires_at = expiresAt;
            }

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .eq('company_id', this.currentUser.company_id); // Sécurité: même société

            if (error) throw error;

            // Invalider le cache
            this.invalidateCache();

            return { success: true };
        } catch (error) {
            console.error('[LicenseService] Erreur mise à jour licence:', error);
            return { success: false, error: error.message };
        }
    }

    // Ajouter un utilisateur à la société
    async addUserToCompany(email) {
        if (!this.isAdmin()) {
            throw new Error('Droits insuffisants');
        }

        try {
            // Vérifier si l'utilisateur existe
            let { data: existingUser } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (existingUser && existingUser.company_id) {
                throw new Error('Cet utilisateur appartient déjà à une société');
            }

            if (existingUser) {
                // Mettre à jour l'utilisateur existant
                const { error } = await this.supabase
                    .from('users')
                    .update({
                        company_id: this.currentUser.company_id,
                        license_status: 'active',
                        updated_at: new Date()
                    })
                    .eq('id', existingUser.id);

                if (error) throw error;
            } else {
                // Créer un nouvel utilisateur
                const { error } = await this.supabase
                    .from('users')
                    .insert([{
                        email: email.toLowerCase(),
                        name: email.split('@')[0],
                        company_id: this.currentUser.company_id,
                        role: 'user',
                        license_status: 'active'
                    }]);

                if (error) throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('[LicenseService] Erreur ajout utilisateur:', error);
            return { success: false, error: error.message };
        }
    }

    // === MÉTHODES ANALYTICS ===

    // Enregistrer un événement analytics
    async trackEvent(eventType, eventData = {}) {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('analytics_events')
                .insert([{
                    user_id: this.currentUser.id,
                    event_type: eventType,
                    event_data: {
                        ...eventData,
                        email: this.currentUser.email,
                        company_id: this.currentUser.company_id
                    }
                }]);
        } catch (error) {
            console.warn('[LicenseService] Erreur tracking:', error);
        }
    }
}

// Créer l'instance globale
window.licenseService = new LicenseService();

console.log('✅ LicenseService chargé');
