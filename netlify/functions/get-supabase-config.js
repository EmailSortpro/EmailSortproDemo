// netlify/functions/get-supabase-config.js
// Fonction Netlify pour fournir la configuration Supabase de manière sécurisée

exports.handler = async (event, context) => {
    // Configuration CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Seulement les requêtes GET sont acceptées
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Récupérer les variables d'environnement
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        // Vérifier que les variables sont définies
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[Get Supabase Config] Variables d\'environnement manquantes');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration Supabase manquante',
                    details: 'Variables d\'environnement SUPABASE_URL et SUPABASE_ANON_KEY requises'
                })
            };
        }

        // Valider le format de l'URL
        if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
            console.error('[Get Supabase Config] URL Supabase invalide:', supabaseUrl);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'URL Supabase invalide',
                    details: 'L\'URL doit être au format https://xxxxx.supabase.co'
                })
            };
        }

        // Valider la clé anonyme
        if (supabaseAnonKey.length < 100) {
            console.error('[Get Supabase Config] Clé anonyme Supabase invalide');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Clé anonyme Supabase invalide',
                    details: 'La clé semble trop courte'
                })
            };
        }

        // Retourner la configuration
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: supabaseUrl,
                anonKey: supabaseAnonKey,
                timestamp: new Date().toISOString(),
                source: 'netlify-function'
            })
        };

    } catch (error) {
        console.error('[Get Supabase Config] Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erreur serveur interne',
                message: error.message
            })
        };
    }
};
