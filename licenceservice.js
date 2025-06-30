// Ajoutez cette méthode dans la classe App, juste après waitForLicenseService()

createEmergencyLicenseService() {
    if (window.licenseService) {
        console.log('[App] LicenseService already exists, skipping emergency creation');
        return;
    }
    
    console.log('[App] 🚨 Creating emergency LicenseService...');
    
    window.licenseService = {
        initialized: true,
        isFallback: true,
        isEmergency: true,
        currentUser: null,
        autoAuthInProgress: false,
        
        async initialize() {
            console.log('[EmergencyLicenseService] Initialize called');
            return true;
        },
        
        async authenticateWithEmail(email) {
            console.log('[EmergencyLicenseService] Authenticating:', email);
            
            const cleanEmail = email.toLowerCase().trim();
            const domain = cleanEmail.split('@')[1];
            const name = cleanEmail.split('@')[0];
            
            const user = {
                id: Date.now(),
                email: cleanEmail,
                name: name,
                role: 'user',
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                company: {
                    id: Date.now() + 1,
                    name: domain,
                    domain: domain
                },
                company_id: Date.now() + 1,
                created_at: new Date().toISOString(),
                first_login_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            };
            
            this.currentUser = user;
            window.currentUser = user;
            window.licenseStatus = { 
                status: 'trial', 
                valid: true, 
                daysRemaining: 15,
                message: 'Période d\'essai - 15 jours restants (Mode démonstration)'
            };
            
            // Émettre l'événement d'authentification
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('userAuthenticated', {
                    detail: { 
                        user: user, 
                        status: {
                            valid: true,
                            status: 'trial',
                            daysRemaining: 15,
                            message: 'Période d\'essai - 15 jours restants (Mode démonstration)'
                        }
                    }
                }));
            }, 100);
            
            console.log('[EmergencyLicenseService] ✅ User authenticated:', cleanEmail);
            
            return {
                valid: true,
                status: 'trial',
                user: user,
                daysRemaining: 15,
                message: 'Période d\'essai - 15 jours restants (Mode démonstration)',
                fallback: true
            };
        },
        
        getCurrentUser() { 
            return this.currentUser; 
        },
        
        isAdmin() { 
            return true; 
        },
        
        async logout() { 
            console.log('[EmergencyLicenseService] Logout called');
            this.currentUser = null; 
            window.currentUser = null;
            window.licenseStatus = null;
        },
        
        async trackAnalyticsEvent(eventType, eventData) {
            console.log('[EmergencyLicenseService] Analytics event (simulated):', eventType, eventData);
        },
        
        async debug() {
            return {
                initialized: true,
                fallbackMode: true,
                isEmergency: true,
                hasSupabase: false,
                currentUser: this.currentUser,
                message: 'Service d\'urgence activé - Mode démonstration'
            };
        }
    };
    
    // Marquer comme prêt
    window.licenseServiceReady = true;
    
    // Émettre l'événement de disponibilité
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('licenseServiceReady', {
            detail: { service: window.licenseService }
        }));
    }, 50);
    
    console.log('[App] ✅ Emergency LicenseService created and ready');
}
