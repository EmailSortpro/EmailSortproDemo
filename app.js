// app.js - Application EmailSortPro avec LicenseService intégré
// Version 5.1 - Corrigée avec service de licence intégré

// =====================================
// SERVICE DE LICENCE INTÉGRÉ
// =====================================
class IntegratedLicenseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.licenseCache = null;
        this.initialized = false;
        this.userCache = new Map();
        this.companyCache = new Map();
        this.tablesExist = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('[LicenseService] Initialisation...');
            
            // Vérifier la disponibilité de Supabase
            if (!window.supabase) {
                console.warn('[LicenseService] Supabase non disponible');
                return false;
            }

            // Configuration Supabase
            const SUPABASE_URL = 'https://oxyiamruvyliueecpaam.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlhbXJ1dnlsaXVlZWNwYWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDM0MTgsImV4cCI6MjA2NTk3OTQxOH0.Wy_jbUB7D5Bly-rZB6oc2bXUHzZQ8MivDL4vdM1jcE0';

            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Vérifier si les tables existent
            await this.checkTablesExistence();
            
            this.initialized = true;
            console.log('[LicenseService] ✅ Initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur initialisation:', error);
            this.initialized = false;
            this.tablesExist = false;
            return false;
        }
    }

    async checkTablesExistence() {
        try {
            const requiredTables = ['users', 'companies'];
            const results = {};

            for (const table of requiredTables) {
                try {
                    const { error } = await this.supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true })
                        .limit(0);

                    results[table] = !error;
                    
                    if (error) {
                        console.warn(`[LicenseService] ⚠️ Table '${table}' non accessible:`, error.message);
                    } else {
                        console.log(`[LicenseService] ✅ Table '${table}' accessible`);
                    }
                } catch (error) {
                    results[table] = false;
                    console.warn(`[LicenseService] ❌ Erreur vérification table '${table}':`, error.message);
                }
            }

            this.tablesExist = Object.values(results).every(exists => exists);
            return { allExist: this.tablesExist, tables: results };
        } catch (error) {
            console.warn('[LicenseService] ⚠️ Impossible de vérifier les tables:', error.message);
            this.tablesExist = false;
            return { allExist: false, tables: {} };
        }
    }

    async checkUserLicense(email) {
        if (!this.initialized) await this.initialize();
        
        if (!this.tablesExist) {
            console.log('[LicenseService] Tables non disponibles - mode permissif');
            return {
                valid: true,
                status: 'no_license_check',
                message: 'Accès autorisé (vérification de licence désactivée)',
                user: { email: email, role: 'user' }
            };
        }

        try {
            // Vérifier dans le cache
            if (this.licenseCache && this.licenseCache.email === email) {
                const cacheAge = Date.now() - this.licenseCache.timestamp;
                if (cacheAge < 2 * 60 * 1000) {
                    return this.licenseCache.result;
                }
            }

            // Rechercher l'utilisateur
            let { data: user, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error && error.code === 'PGRST116') {
                // Utilisateur n'existe pas - le créer
                user = await this.createNewUser(email);
            } else if (error) {
                throw error;
            }

            // Récupérer la société si nécessaire
            if (user && user.company_id) {
                const { data: company } = await this.supabase
                    .from('companies')
                    .select('*')
                    .eq('id', user.company_id)
                    .single();
                
                user.company = company;
            }

            // Mettre à jour la dernière connexion
            await this.updateLastLogin(user.id);

            // Évaluer le statut de la licence
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
            window.currentUser = user;
            
            return this.licenseCache.result;

        } catch (error) {
            console.error('[LicenseService] Erreur vérification licence:', error);
            
            // Mode permissif en cas d'erreur
            return {
                valid: true,
                status: 'error_fallback',
                message: 'Accès autorisé (erreur de vérification)',
                user: { email: email, role: 'user' },
                error: error.message
            };
        }
    }

    async createNewUser(email) {
        try {
            const domain = email.split('@')[1];
            const company = await this.getOrCreateCompany(domain);

            const role = email.toLowerCase() === 'vianney.hastings@hotmail.fr' ? 'company_admin' : 'user';

            const newUserData = {
                email: email.toLowerCase(),
                name: email.split('@')[0],
                role: role,
                license_status: 'active',
                license_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_login_at: new Date().toISOString()
            };

            if (company && company.id) {
                newUserData.company_id = company.id;
            }

            const { data: newUser, error } = await this.supabase
                .from('users')
                .insert([newUserData])
                .select('*')
                .single();

            if (error) throw error;

            newUser.company = company;
            console.log(`[LicenseService] ✅ Utilisateur créé: ${email} (${role})`);
            return newUser;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur création utilisateur:', error);
            throw error;
        }
    }

    async getOrCreateCompany(domain) {
        try {
            let { data: company, error } = await this.supabase
                .from('companies')
                .select('*')
                .eq('domain', domain)
                .single();

            if (error && error.code === 'PGRST116') {
                const { data: newCompany, error: createError } = await this.supabase
                    .from('companies')
                    .insert([
                        {
                            name: `Société ${domain}`,
                            domain: domain
                        }
                    ])
                    .select('*')
                    .single();

                if (createError) throw createError;
                company = newCompany;
                console.log(`[LicenseService] ✅ Société créée: ${company.name}`);
            } else if (error) {
                console.warn('[LicenseService] ⚠️ Erreur recherche société:', error);
                return null;
            }

            return company;
        } catch (error) {
            console.error('[LicenseService] ❌ Erreur gestion société:', error);
            return null;
        }
    }

    evaluateLicenseStatus(user) {
        if (user.license_status === 'blocked') {
            return {
                valid: false,
                status: 'blocked',
                message: 'Accès bloqué. Veuillez contacter votre administrateur.'
            };
        }

        if (user.license_status === 'active' || user.license_status === 'trial') {
            return {
                valid: true,
                status: user.license_status,
                message: user.license_status === 'trial' ? 'Période d\'essai' : 'Licence active',
                daysRemaining: 30
            };
        }

        return {
            valid: false,
            status: 'invalid',
            message: 'Statut de licence invalide'
        };
    }

    async updateLastLogin(userId) {
        if (!this.tablesExist) return;
        
        try {
            await this.supabase
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.warn('[LicenseService] Erreur mise à jour login:', error);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && ['company_admin', 'super_admin'].includes(this.currentUser.role);
    }

    hasAccess() {
        return this.currentUser && ['active', 'trial'].includes(this.currentUser.license_status);
    }
}

// =====================================
// APPLICATION PRINCIPALE
// =====================================
class App {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.licenseUser = null;
        this.hasValidLicense = false;
        this.isInitializing = false;
        this.currentPage = 'dashboard';
        this.isNetlifyEnv = window.location.hostname.includes('netlify.app');
        
        console.log('[App] Constructor - EmailSortPro v5.1...');
        console.log('[App] Environment:', this.isNetlifyEnv ? 'Netlify' : 'Local');
        
        // Créer le service de licence intégré
        this.licenseService = new IntegratedLicenseService();
        window.licenseService = this.licenseService;
        
        // Initialiser Analytics de manière sûre
        this.initializeAnalyticsSafe();
    }

    initializeAnalyticsSafe() {
        try {
            if (window.analyticsManager) {
                console.log('[App] Analytics manager found');
            } else {
                console.log('[App] Analytics manager not available yet');
            }
        } catch (error) {
            console.warn('[App] Analytics initialization error:', error);
        }
    }

    async init() {
        if (this.isInitializing) {
            console.log('[App] Already initializing, skipping...');
            return;
        }
        
        this.isInitializing = true;
        console.log('[App] Starting initialization...');
        
        try {
            // 1. Vérifier les prérequis de base
            if (!this.checkBasicRequirements()) {
                throw new Error('Basic requirements not met');
            }

            // 2. Initialiser le service de licence intégré
            await this.licenseService.initialize();

            // 3. Initialiser les services d'authentification
            await this.initializeAuthServices();
            
            // 4. Initialiser les modules critiques
            await this.initializeCriticalModules();
            
            // 5. Vérifier l'état d'authentification
            await this.checkAuthenticationStatus();
            
            console.log('[App] ✅ Initialization complete');
            
        } catch (error) {
            console.error('[App] Initialization error:', error);
            this.handleInitError(error);
        } finally {
            this.isInitializing = false;
            this.setupEventListeners();
        }
    }

    checkBasicRequirements() {
        console.log('[App] Checking basic requirements...');
        
        if (typeof msal === 'undefined') {
            console.error('[App] MSAL library not loaded');
            this.showError('Bibliothèque d\'authentification Microsoft non chargée');
            return false;
        }

        if (!window.AppConfig) {
            console.error('[App] Configuration not loaded');
            this.showError('Configuration non chargée');
            return false;
        }

        if (!window.authService && !window.googleAuthService) {
            console.error('[App] No authentication service available');
            this.showError('Aucun service d\'authentification disponible');
            return false;
        }

        console.log('[App] ✅ Basic requirements OK');
        return true;
    }

    async initializeAuthServices() {
        console.log('[App] Initializing auth services...');
        
        const promises = [];
        
        if (window.authService) {
            promises.push(
                window.authService.initialize()
                    .then(() => {
                        console.log('[App] ✅ Microsoft auth initialized');
                        return 'microsoft';
                    })
                    .catch(error => {
                        console.warn('[App] Microsoft auth failed:', error);
                        return null;
                    })
            );
        }
        
        if (window.googleAuthService) {
            promises.push(
                window.googleAuthService.initialize()
                    .then(() => {
                        console.log('[App] ✅ Google auth initialized');
                        return 'google';
                    })
                    .catch(error => {
                        console.warn('[App] Google auth failed:', error);
                        return null;
                    })
            );
        }
        
        const results = await Promise.allSettled(promises);
        const successfulServices = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
        
        if (successfulServices.length === 0) {
            throw new Error('No authentication service could be initialized');
        }
        
        console.log('[App] Auth services ready:', successfulServices);
    }

    async checkAuthenticationStatus() {
        console.log('[App] Checking authentication status...');
        
        // Vérifier Google callback d'abord
        if (await this.handleGoogleCallback()) {
            return;
        }
        
        // Vérifier Microsoft
        if (window.authService && window.authService.isAuthenticated()) {
            const account = window.authService.getAccount();
            if (account) {
                try {
                    this.user = await window.authService.getUserInfo();
                    this.user.provider = 'microsoft';
                    this.isAuthenticated = true;
                    this.activeProvider = 'microsoft';
                    
                    // Vérifier la licence
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) return;
                    
                    console.log('[App] ✅ Microsoft user authenticated');
                    this.showApp();
                    return;
                } catch (error) {
                    console.error('[App] Microsoft auth error:', error);
                    await window.authService.reset();
                }
            }
        }
        
        // Vérifier Google
        if (window.googleAuthService && window.googleAuthService.isAuthenticated()) {
            const account = window.googleAuthService.getAccount();
            if (account) {
                try {
                    this.user = await window.googleAuthService.getUserInfo();
                    this.user.provider = 'google';
                    this.isAuthenticated = true;
                    this.activeProvider = 'google';
                    
                    // Vérifier la licence
                    const licenseValid = await this.verifyUserLicense();
                    if (!licenseValid) return;
                    
                    console.log('[App] ✅ Google user authenticated');
                    this.showApp();
                    return;
                } catch (error) {
                    console.error('[App] Google auth error:', error);
                    await window.googleAuthService.reset();
                }
            }
        }
        
        // Pas d'authentification
        console.log('[App] No authentication found');
        this.showLogin();
    }

    async verifyUserLicense() {
        try {
            const userEmail = this.user.email || this.user.mail || this.user.userPrincipalName;
            if (!userEmail) {
                console.error('[App] No user email found');
                return true; // Ne pas bloquer si pas d'email
            }
            
            console.log('[App] Checking license for:', userEmail);
            const result = await this.licenseService.checkUserLicense(userEmail);
            
            // Si nouvel utilisateur, lancer l'onboarding
            if (result.error && result.error.includes('PGRST116')) {
                console.log('[App] New user detected');
                return await this.startOnboarding(userEmail);
            }
            
            // Si licence invalide et pas en mode permissif
            if (!result.valid && result.status !== 'no_license_check' && result.status !== 'error_fallback') {
                console.warn('[App] Invalid license:', result.message);
                this.showLicenseError(result.message || 'Licence invalide');
                setTimeout(() => this.logout(), 10000);
                return false;
            }
            
            // Licence valide ou mode permissif
            this.licenseUser = result.user;
            this.hasValidLicense = true;
            console.log('[App] ✅ License valid or permissive mode');
            return true;
            
        } catch (error) {
            console.error('[App] License check error:', error);
            // Ne pas bloquer en cas d'erreur
            return true;
        }
    }

    async startOnboarding(email) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; text-align: center;">
                    <h2 style="margin-bottom: 1rem;">Bienvenue sur EmailSortPro !</h2>
                    <p style="margin-bottom: 2rem;">Première connexion détectée. Choisissez votre type de compte :</p>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                        <button id="btn-personal" style="
                            flex: 1;
                            padding: 1rem;
                            border: 1px solid #ddd;
                            background: #f8f9fa;
                            border-radius: 8px;
                            cursor: pointer;
                        ">
                            <div style="font-size: 2rem;">👤</div>
                            <div>Personnel</div>
                        </button>
                        <button id="btn-pro" style="
                            flex: 1;
                            padding: 1rem;
                            border: 1px solid #ddd;
                            background: #f8f9fa;
                            border-radius: 8px;
                            cursor: pointer;
                        ">
                            <div style="font-size: 2rem;">🏢</div>
                            <div>Professionnel</div>
                        </button>
                    </div>
                    
                    <div id="company-section" style="display: none;">
                        <input type="text" id="company-name" placeholder="Nom de votre société" style="
                            width: 100%;
                            padding: 0.5rem;
                            margin-bottom: 1rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                        ">
                        <button id="btn-create" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 0.5rem 2rem;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Créer le compte</button>
                    </div>
                    
                    <div id="loading" style="display: none;">
                        <p>Création du compte...</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Gestion des clics
            modal.querySelector('#btn-personal').onclick = async () => {
                modal.querySelector('#loading').style.display = 'block';
                const success = await this.createUser(email, 'personal');
                modal.remove();
                resolve(success);
            };
            
            modal.querySelector('#btn-pro').onclick = () => {
                modal.querySelector('#company-section').style.display = 'block';
            };
            
            modal.querySelector('#btn-create').onclick = async () => {
                const companyName = modal.querySelector('#company-name').value.trim();
                if (!companyName) {
                    alert('Veuillez entrer le nom de votre société');
                    return;
                }
                modal.querySelector('#loading').style.display = 'block';
                const success = await this.createUser(email, 'pro', companyName);
                modal.remove();
                resolve(success);
            };
        });
    }

    async createUser(email, type, companyName = null) {
        try {
            // Utiliser le service de licence pour la création
            const result = await this.licenseService.checkUserLicense(email);
            
            if (result.valid || result.status === 'no_license_check' || result.status === 'error_fallback') {
                this.licenseUser = result.user;
                this.hasValidLicense = true;
                this.showWelcomeMessage();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[App] User creation error:', error);
            return true; // Ne pas bloquer
        }
    }

    showWelcomeMessage() {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        toast.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">Bienvenue !</h3>
            <p style="margin: 0;">Connexion réussie à EmailSortPro.</p>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    async loginMicrosoft() {
        try {
            this.showLoading('Connexion à Microsoft...');
            
            if (!window.authService) {
                throw new Error('Service Microsoft non disponible');
            }
            
            await window.authService.login();
            
        } catch (error) {
            console.error('[App] Microsoft login error:', error);
            this.hideLoading();
            this.showToast('Erreur de connexion Microsoft', 'error');
        }
    }

    async loginGoogle() {
        try {
            this.showLoading('Connexion à Google...');
            
            if (!window.googleAuthService) {
                throw new Error('Service Google non disponible');
            }
            
            await window.googleAuthService.login();
            
        } catch (error) {
            console.error('[App] Google login error:', error);
            this.hideLoading();
            this.showToast('Erreur de connexion Google', 'error');
        }
    }

    async logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            this.showLoading('Déconnexion...');
            
            try {
                if (this.activeProvider === 'microsoft' && window.authService) {
                    await window.authService.logout();
                } else if (this.activeProvider === 'google' && window.googleAuthService) {
                    await window.googleAuthService.logout();
                }
            } catch (error) {
                console.error('[App] Logout error:', error);
            }
            
            this.cleanup();
            window.location.reload();
        }
    }

    showApp() {
        console.log('[App] Showing application...');
        
        this.hideLoading();
        
        // Masquer la page de login
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'none';
        
        // Afficher l'app
        document.body.classList.remove('login-mode');
        document.body.classList.add('app-active');
        
        // Afficher les éléments
        ['app-header', 'app-nav'].forEach(className => {
            const element = document.querySelector(`.${className}`);
            if (element) {
                element.style.display = 'block';
                element.style.opacity = '1';
            }
        });
        
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.style.display = 'block';
            pageContent.style.opacity = '1';
        }
        
        // Mettre à jour l'UI
        if (window.uiManager) {
            window.uiManager.updateAuthStatus(this.user);
        }
        
        // Charger le dashboard
        this.loadDashboard();
    }

    showLogin() {
        console.log('[App] Showing login page');
        
        document.body.classList.add('login-mode');
        document.body.classList.remove('app-active');
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.style.display = 'flex';
        
        this.hideLoading();
    }

    loadDashboard() {
        this.currentPage = 'dashboard';
        
        if (window.dashboardModule && typeof window.dashboardModule.render === 'function') {
            try {
                window.dashboardModule.render();
            } catch (error) {
                console.error('[App] Dashboard render error:', error);
                this.showDashboardFallback();
            }
        } else {
            this.showDashboardFallback();
        }
    }

    showDashboardFallback() {
        const pageContent = document.getElementById('pageContent');
        if (!pageContent) return;
        
        pageContent.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h1>Tableau de bord</h1>
                <p>Bienvenue dans EmailSortPro</p>
                <div style="margin-top: 2rem;">
                    <p>Connecté via ${this.activeProvider === 'microsoft' ? 'Microsoft' : 'Google'}</p>
                    <p>${this.user?.displayName || this.user?.name || this.user?.email || 'Utilisateur'}</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        console.error('[App] Error:', message);
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #dc3545;">Erreur</h1>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 1rem;
                        padding: 0.5rem 2rem;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Recharger</button>
                </div>
            `;
            loginPage.style.display = 'flex';
        }
        
        this.hideLoading();
    }

    showLicenseError(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px;">
                <h2 style="color: #dc3545;">Erreur de Licence</h2>
                <p>${message}</p>
                <p style="margin-top: 1rem;">Contactez votre administrateur : support@emailsortpro.com</p>
                <p style="font-size: 0.9rem; color: #666;">Déconnexion automatique dans 10 secondes...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    showLoading(message = 'Chargement...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('.login-loading-text');
            if (text) text.textContent = message;
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
        } else {
            alert(message);
        }
    }

    cleanup() {
        this.user = null;
        this.isAuthenticated = false;
        this.activeProvider = null;
        this.licenseUser = null;
        this.hasValidLicense = false;
        
        // Nettoyer le localStorage sélectivement
        ['google_token', 'msal', 'license'].forEach(key => {
            Object.keys(localStorage).forEach(storageKey => {
                if (storageKey.includes(key)) {
                    localStorage.removeItem(storageKey);
                }
            });
        });
        
        sessionStorage.clear();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page && window.pageManager) {
                    window.pageManager.loadPage(page);
                }
            });
        });
    }

    async initializeCriticalModules() {
        console.log('[App] Initializing critical modules...');
        
        // Créer des fallbacks pour les modules manquants
        if (!window.mailService) {
            window.mailService = {
                getEmails: async () => [],
                getFolders: async () => [],
                getEmailCount: async () => 0
            };
        }
        
        if (!window.pageManager) {
            window.pageManager = {
                loadPage: (page) => {
                    console.log(`[PageManager] Loading page: ${page}`);
                    const pageContent = document.getElementById('pageContent');
                    if (pageContent) {
                        pageContent.innerHTML = `<div style="padding: 2rem;"><h1>${page}</h1><p>Page en construction</p></div>`;
                    }
                }
            };
        }
        
        console.log('[App] Critical modules ready');
    }

    async handleGoogleCallback() {
        const callbackData = sessionStorage.getItem('google_callback_data');
        if (!callbackData) return false;
        
        try {
            const data = JSON.parse(callbackData);
            sessionStorage.removeItem('google_callback_data');
            
            const urlParams = new URLSearchParams();
            urlParams.set('code', data.code);
            urlParams.set('state', data.state);
            
            const success = await window.googleAuthService.handleOAuthCallback(urlParams);
            
            if (success) {
                this.user = await window.googleAuthService.getUserInfo();
                this.user.provider = 'google';
                this.isAuthenticated = true;
                this.activeProvider = 'google';
                
                const licenseValid = await this.verifyUserLicense();
                if (!licenseValid) return false;
                
                this.showApp();
                return true;
            }
        } catch (error) {
            console.error('[App] Google callback error:', error);
        }
        
        return false;
    }

    handleInitError(error) {
        console.error('[App] Init error:', error);
        
        if (error.message.includes('authentication')) {
            this.showError('Erreur d\'authentification. Veuillez recharger la page.');
        } else if (error.message.includes('configuration')) {
            this.showError('Erreur de configuration. Veuillez vérifier les paramètres.');
        } else {
            this.showError('Erreur de chargement de l\'application.');
        }
    }
}

// =====================================
// FONCTIONS GLOBALES DE DIAGNOSTIC
// =====================================
window.diagnoseApp = function() {
    console.group('🔍 DIAGNOSTIC');
    
    const diag = {
        app: window.app ? {
            isAuthenticated: window.app.isAuthenticated,
            activeProvider: window.app.activeProvider,
            hasLicense: window.app.hasValidLicense,
            user: window.app.user?.email || 'none'
        } : 'App not initialized',
        
        licenseService: window.licenseService ? {
            initialized: window.licenseService.initialized,
            tablesExist: window.licenseService.tablesExist,
            currentUser: window.licenseService.currentUser?.email || 'none'
        } : 'License service not available',
        
        services: {
            microsoft: !!window.authService,
            google: !!window.googleAuthService,
            analytics: !!window.analyticsManager,
            mail: !!window.mailService,
            page: !!window.pageManager
        },
        
        environment: {
            netlify: window.location.hostname.includes('netlify.app'),
            domain: window.location.hostname,
            supabase: !!window.supabase
        }
    };
    
    console.log('Diagnostic:', diag);
    console.groupEnd();
    
    return diag;
};

window.emergencyReset = function() {
    console.log('[Emergency] Reset triggered');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
};

window.testLicenseService = async function(email = 'test@example.com') {
    if (!window.licenseService) {
        console.error('License service not available');
        return;
    }
    
    console.group('🧪 TEST LICENSE SERVICE');
    try {
        const result = await window.licenseService.checkUserLicense(email);
        console.log('Test result:', result);
        console.log('Service status:', {
            initialized: window.licenseService.initialized,
            tablesExist: window.licenseService.tablesExist
        });
    } catch (error) {
        console.error('Test error:', error);
    }
    console.groupEnd();
};

// =====================================
// INITIALISATION
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded');
    
    try {
        // Créer l'instance de l'app avec service de licence intégré
        window.app = new App();
        
        // Attendre que les services de base soient prêts
        setTimeout(() => {
            const requiredServices = ['uiManager'];
            const hasRequired = requiredServices.every(s => window[s]);
            const hasAuth = window.authService || window.googleAuthService;
            
            if (hasRequired && hasAuth) {
                console.log('[App] Services ready, initializing...');
                window.app.init();
            } else {
                console.log('[App] Services status:', {
                    uiManager: !!window.uiManager,
                    authService: !!window.authService,
                    googleAuthService: !!window.googleAuthService
                });
                
                // Essayer d'initialiser même si certains services manquent
                console.warn('[App] Some services missing, trying to initialize anyway...');
                window.app.init();
            }
        }, 500);
        
    } catch (error) {
        console.error('[App] Critical error:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="text-align: center;">
                    <h1>Erreur Critique</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Recharger</button>
                    <br><br>
                    <button onclick="window.emergencyReset()">Reset d'urgence</button>
                </div>
            </div>
        `;
    }
});

console.log('✅ EmailSortPro App v5.1 loaded with integrated LicenseService');
console.log('🔧 Commands: diagnoseApp(), emergencyReset(), testLicenseService(email)');
