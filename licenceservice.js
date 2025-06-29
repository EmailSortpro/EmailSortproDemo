// Corrections pour LicenseService.js - Adaptées au schéma existant

// 1. Modifier la fonction createNewUser pour correspondre au schéma
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

    // Si email personnel et pas de société, créer une société individuelle
    let companyId = company?.id;
    if (isPersonalEmail && !company) {
        const newCompany = await this.createPersonalCompany(email);
        companyId = newCompany.id;
    }

    const newUser = {
        email: email.toLowerCase(),
        name: name,
        company_id: companyId,
        role: isPersonalEmail ? 'company_admin' : 'user', // Adapté au schéma
        license_status: 'trial',
        license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        first_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
        .from('users')
        .insert([newUser])
        .select(`
            *,
            company:companies(*)
        `)
        .single();

    if (error) throw error;

    // Créer une licence trial si société créée
    if (companyId && isPersonalEmail) {
        await this.createTrialLicense(data.id, companyId);
    }

    return data;
}

// 2. Modifier createPersonalCompany pour correspondre au schéma
async createPersonalCompany(email) {
    const companyName = `Personnel - ${email}`;
    
    const { data: company, error } = await this.supabase
        .from('companies')
        .insert([{
            name: companyName,
            domain: email, // Utiliser l'email comme domaine unique
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('[LicenseService] Erreur création société:', error);
        throw error;
    }

    return company;
}

// 3. Modifier evaluateLicenseStatus pour utiliser les bonnes valeurs enum
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

    // Vérifier le statut (adapté au schéma)
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

// 4. Vérifier si l'utilisateur est admin (adapté au schéma)
isAdmin() {
    return this.currentUser?.role === 'company_admin' || this.currentUser?.role === 'super_admin';
}

// 5. Fonction d'authentification simplifiée pour utiliser create_user_profile
async authenticateDirectly(email) {
    if (!this.initialized) await this.initialize();
    
    try {
        const cleanEmail = email.toLowerCase().trim();
        const domain = cleanEmail.split('@')[1];
        const name = cleanEmail.split('@')[0];
        
        // Appeler la fonction create_user_profile de la base
        const { data, error } = await this.supabase.rpc('create_user_profile', {
            user_email: cleanEmail,
            user_name: name,
            company_domain: domain
        });

        if (error) throw error;

        if (data.success) {
            // Récupérer les infos utilisateur complètes
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    company:companies(*)
                `)
                .eq('email', cleanEmail)
                .single();

            if (userError) throw userError;

            // Stocker l'utilisateur
            this.currentUser = userData;
            
            // Stocker l'email temporairement
            localStorage.setItem('emailsortpro_user_email', cleanEmail);
            
            // Évaluer le statut de licence
            const licenseStatus = this.evaluateLicenseStatus(userData);
            
            // Récupérer les licences
            const { data: licenses } = await this.supabase
                .from('licenses')
                .select('*')
                .or(`company_id.eq.${userData.company_id},user_id.eq.${userData.id}`)
                .eq('status', 'active');

            // Tracker la connexion
            await this.trackAnalyticsEvent('user_login', {
                email: cleanEmail,
                timestamp: new Date().toISOString(),
                source: 'direct_auth'
            });

            return {
                valid: licenseStatus.valid,
                status: licenseStatus.status,
                user: userData,
                licenses: licenses || [],
                message: licenseStatus.message,
                daysRemaining: licenseStatus.daysRemaining
            };
            
        } else {
            throw new Error(data.error || 'Erreur création profil');
        }

    } catch (error) {
        console.error('[LicenseService] Erreur authentification directe:', error);
        return {
            valid: false,
            error: error.message,
            status: 'error'
        };
    }
}
