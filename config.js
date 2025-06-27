// Configuration Supabase avec récupération automatique depuis Netlify
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
let supabase = null;

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

// Fonction pour récupérer la configuration depuis les variables d'environnement Netlify
async function initializeSupabase() {
    try {
        // Dans un contexte Netlify, les variables VITE_ sont exposées côté client lors du build
        // Si elles ne sont pas disponibles, on fait un appel à une fonction serverless
        
        if (window.VITE_SUPABASE_URL && window.VITE_SUPABASE_ANON_KEY) {
            // Variables disponibles directement (injectées lors du build)
            SUPABASE_URL = window.VITE_SUPABASE_URL;
            SUPABASE_ANON_KEY = window.VITE_SUPABASE_ANON_KEY;
        } else {
            // En mode test, utiliser des valeurs par défaut
            console.warn('[Config] Variables VITE non trouvées - Mode test activé');
            // Vous pouvez mettre des valeurs de test ici si nécessaire
            SUPABASE_URL = 'https://test.supabase.co';
            SUPABASE_ANON_KEY = 'test-key';
        }

        // Vérifier que les variables sont bien définies
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Variables Supabase non définies');
        }

        // Initialisation du client Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Export global
        window.supabaseClient = supabase;
        window.LICENSE_STATUS = LICENSE_STATUS;
        window.USER_ROLES = USER_ROLES;
        
        console.log('[Config] Supabase initialisé avec succès');
        return true;
        
    } catch (error) {
        console.error('[Config] Erreur lors de l\'initialisation:', error);
        
        // En développement local, utiliser des variables par défaut si disponibles
        if (window.location.hostname === 'localhost') {
            console.warn('[Config] Mode développement - Vérifiez vos variables d\'environnement');
        }
        
        return false;
    }
}

// Handler pour la fonction Netlify (à ajouter dans netlify/functions/get-supabase-config.js)
// Cette fonction n'est utilisée que si les variables VITE_ ne sont pas disponibles
const netlifyFunctionCode = `
exports.handler = async (event, context) => {
    // Vérification basique de sécurité
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { accessKey } = JSON.parse(event.body);
        
        if (accessKey !== 'analytics-dashboard-2025') {
            return { statusCode: 401, body: 'Unauthorized' };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                url: process.env.VITE_SUPABASE_URL,
                anonKey: process.env.VITE_SUPABASE_ANON_KEY
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
`;

// Auto-initialisation au chargement
window.addEventListener('DOMContentLoaded', initializeSupabase);
