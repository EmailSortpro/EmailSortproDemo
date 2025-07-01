// LicenseService.js - Version minimale pour débogage
console.log('[LicenseService] 🚀 Chargement du fichier...');

// Créer immédiatement un service minimal
window.licenseService = {
    initialized: true,
    
    async authenticateWithEmail(email) {
        console.log('[LicenseService] Authenticating:', email);
        
        // Retourner une licence d'essai par défaut
        const user = {
            id: 'debug_' + Date.now(),
            email: email,
            name: email.split('@')[0],
            role: 'user',
            license_status: 'trial',
            license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            company: {
                id: 'debug_company',
                name: 'Debug Company',
                domain: email.split('@')[1]
            }
        };
        
        return {
            valid: true,
            status: 'trial',
            user: user,
            message: 'Période d\'essai - 15 jours restants (Mode debug)',
            daysRemaining: 15
        };
    },
    
    async debug() {
        return {
            version: 'minimal',
            initialized: true,
            mode: 'debug'
        };
    },
    
    getCurrentUser() {
        return null;
    },
    
    isAdmin() {
        return false;
    },
    
    async logout() {
        console.log('[LicenseService] Logout');
    }
};

console.log('[LicenseService] ✅ Service minimal créé');

// Marquer comme prêt
window.licenseServiceReady = true;

// Émettre l'événement
setTimeout(() => {
    window.dispatchEvent(new CustomEvent('licenseServiceReady', {
        detail: { service: window.licenseService }
    }));
    console.log('[LicenseService] ✅ Event émis');
}, 100);
