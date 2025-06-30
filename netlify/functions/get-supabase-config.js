// netlify/functions/get-supabase-config.js
// Fonction pour fournir la configuration Supabase de manière sécurisée

exports.handler = async (event, context) => {
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Gérer les requêtes OPTIONS pour CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Vérifier la méthode
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Récupérer les variables d'environnement (avec préfixe VITE_)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        // Debug - afficher ce qui est disponible
        console.log('[get-supabase-config] Variables disponibles:');
        console.log('VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
        console.log('VITE_SUPABASE_ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);

        // Vérifier que les variables sont définies
        if (!supabaseUrl || !supabaseAnonKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration manquante',
                    message: 'Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans Netlify',
                    debug: {
                        hasViteUrl: !!process.env.VITE_SUPABASE_URL,
                        hasViteKey: !!process.env.VITE_SUPABASE_ANON_KEY
                    }
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
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('[get-supabase-config] Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erreur serveur',
                message: error.message
            })
        };
    }
};
