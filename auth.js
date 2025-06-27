// Gestion de l'authentification et des licences
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userLicense = null;
    }

    // Vérifier si l'utilisateur est connecté
    async checkAuth() {
        try {
            // S'assurer que Supabase est initialisé
            if (!window.supabaseClient) {
                console.error('[AuthManager] Supabase non initialisé');
                return false;
            }

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return false;

            // Récupérer les détails de l'utilisateur depuis la base de données
            const { data: userData, error } = await supabaseClient
                .from('users')
                .select(`
                    *,
                    companies (
                        id,
                        name,
                        domain
                    ),
                    licenses (
                        type,
                        status,
                        expires_at
                    )
                `)
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('Erreur lors de la récupération des données utilisateur:', error);
                return false;
            }

            this.currentUser = userData;
            this.userLicense = userData.licenses?.[0] || null;

            // Mettre à jour last_login_at
            await supabaseClient
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', userData.id);

            return true;
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            return false;
        }
    }

    // Vérifier le statut de la licence
    checkLicenseStatus() {
        if (!this.currentUser) return LICENSE_STATUS.BLOCKED;

        const licenseStatus = this.currentUser.license_status;
        const expiresAt = new Date(this.currentUser.license_expires_at);
        const now = new Date();

        // Si la licence est expirée
        if (expiresAt < now && licenseStatus !== LICENSE_STATUS.BLOCKED) {
            this.updateLicenseStatus(LICENSE_STATUS.EXPIRED);
            return LICENSE_STATUS.EXPIRED;
        }

        return licenseStatus;
    }

    // Mettre à jour le statut de la licence
    async updateLicenseStatus(status) {
        if (!this.currentUser) return;

        try {
            await supabaseClient
                .from('users')
                .update({ license_status: status })
                .eq('id', this.currentUser.id);

            this.currentUser.license_status = status;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de licence:', error);
        }
    }

    // Vérifier si l'utilisateur a accès
    hasAccess() {
        const status = this.checkLicenseStatus();
        return status === LICENSE_STATUS.ACTIVE || status === LICENSE_STATUS.TRIAL;
    }

    // Obtenir le rôle de l'utilisateur
    getUserRole() {
        return this.currentUser?.role || USER_ROLES.USER;
    }

    // Se déconnecter
    async logout() {
        try {
            await supabaseClient.auth.signOut();
            this.currentUser = null;
            this.userLicense = null;
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }
}

// Instance globale
window.authManager = new AuthManager();
