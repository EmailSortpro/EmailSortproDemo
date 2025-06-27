// Configuration Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration des états de licence
const LICENSE_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    BLOCKED: 'blocked'
};

// Configuration des rôles
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user'
};

// Export pour utilisation dans d'autres fichiers
window.supabaseClient = supabase;
window.LICENSE_STATUS = LICENSE_STATUS;
window.USER_ROLES = USER_ROLES;
