// netlify/functions/get-supabase-config.js
// Fonction Netlify pour récupérer la configuration Supabase de manière sécurisée

exports.handler = async (event, context) => {
    // Vérifier la méthode HTTP
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Récupérer les variables d'environnement
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        
        // Vérifier que les variables sont définies
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[Netlify Function] Missing environment variables');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Configuration not available',
                    message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify environment variables'
                })
            };
        }
        
        // Retourner la configuration
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: JSON.stringify({
                url: supabaseUrl,
                anonKey: supabaseAnonKey,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('[Netlify Function] Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
