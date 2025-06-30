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
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        // Vérifier que les variables sont définies
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[get-supabase-config] Variables manquantes');
            console.error('VITE_SUPABASE_URL définie:', !!process.env.VITE_SUPABASE_URL);
            console.error('VITE_SUPABASE_ANON_KEY définie:', !!process.env.VITE_SUPABASE_ANON_KEY);
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration manquante',
                    message: 'Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans Netlify',
                    instructions: [
                        '1. Allez dans Netlify Dashboard',
                        '2. Site settings > Environment variables',
                        '3. Les variables doivent être nommées VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY',
                        '4. Redéployez le site'
                    ]
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
