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
    // Vérifier si déjà initialisé
    if (window.supabaseClient) {
        console.log('[Config] Supabase déjà initialisé');
        return true;
    }
    
    try {
        // Dans un contexte Netlify, les variables VITE_ sont exposées côté client lors du build
        // Si elles ne sont pas disponibles, on fait un appel à une fonction serverless
        
        // Essayer différentes méthodes pour récupérer les variables
        // 1. Variables dans window.__env__ (Netlify)
        if (window.__env__?.VITE_SUPABASE_URL) {
            SUPABASE_URL = window.__env__.VITE_SUPABASE_URL;
            SUPABASE_ANON_KEY = window.__env__.VITE_SUPABASE_ANON_KEY;
            console.log('[Config] Variables trouvées dans window.__env__');
        } 
        // 2. Variables injectées dans window
        else if (window.env?.VITE_SUPABASE_URL) {
            SUPABASE_URL = window.env.VITE_SUPABASE_URL;
            SUPABASE_ANON_KEY = window.env.VITE_SUPABASE_ANON_KEY;
            console.log('[Config] Variables trouvées dans window.env');
        }
        // 3. Variables directement dans window
        else if (window.VITE_SUPABASE_URL) {
            SUPABASE_URL = window.VITE_SUPABASE_URL;
            SUPABASE_ANON_KEY = window.VITE_SUPABASE_ANON_KEY;
            console.log('[Config] Variables trouvées dans window');
        }
        // 4. Recherche dans le HTML (Netlify injecte parfois les variables dans des scripts)
        else {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.textContent && script.textContent.includes('VITE_SUPABASE_URL')) {
                    console.log('[Config] Recherche des variables dans les scripts...');
                    // Les variables peuvent être injectées comme: window.VITE_SUPABASE_URL = "..."
                    break;
                }
            }
            
            // Si toujours pas trouvé
            if (!SUPABASE_URL) {
                console.warn('[Config] Variables VITE non trouvées - Mode test avec valeurs par défaut');
                console.log('[Config] Variables disponibles:', Object.keys(window).filter(k => k.includes('VITE')));
                
                // En mode test/développement, utiliser des valeurs par défaut
                if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app')) {
                    console.warn('[Config] Utilisation de valeurs de test - Configurez vos variables sur Netlify');
                    // Ces valeurs ne fonctionneront pas pour la vraie connexion
                    // mais permettent à la page de se charger
                    SUPABASE_URL = 'https://placeholder.supabase.co';
                    SUPABASE_ANON_KEY = 'placeholder-key';
                } else {
                    throw new Error('Variables Supabase non configurées. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Netlify.');
                }
            }
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
