// netlify/functions/get-supabase-config.js
// Fonction pour fournir la configuration Supabase de manière sécurisée avec validation

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
        
        // Debug - afficher ce qui est disponible (sans exposer les valeurs complètes)
        console.log('[get-supabase-config] Configuration check:');
        console.log('VITE_SUPABASE_URL exists:', !!supabaseUrl);
        console.log('VITE_SUPABASE_URL length:', supabaseUrl ? supabaseUrl.length : 0);
        console.log('VITE_SUPABASE_URL starts with https:', supabaseUrl ? supabaseUrl.startsWith('https://') : false);
        console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
        console.log('VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
        
        // Vérifier que les variables sont définies
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[get-supabase-config] Variables manquantes');
            
            // Lister toutes les variables d'environnement disponibles (sans les valeurs)
            const availableEnvVars = Object.keys(process.env)
                .filter(key => key.includes('SUPABASE') || key.includes('VITE'))
                .map(key => `${key} (length: ${process.env[key] ? process.env[key].length : 0})`);
            
            console.log('[get-supabase-config] Variables d\'environnement Supabase/Vite disponibles:', availableEnvVars);
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration manquante',
                    message: 'Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans Netlify',
                    debug: {
                        hasViteUrl: !!supabaseUrl,
                        hasViteKey: !!supabaseAnonKey,
                        availableVars: availableEnvVars
                    }
                })
            };
        }
        
        // Validation basique de l'URL
        if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
            console.error('[get-supabase-config] URL Supabase invalide');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration invalide',
                    message: 'L\'URL Supabase semble invalide',
                    debug: {
                        urlStartsWithHttps: supabaseUrl.startsWith('https://'),
                        urlContainsSupabase: supabaseUrl.includes('supabase.co'),
                        urlLength: supabaseUrl.length
                    }
                })
            };
        }
        
        // Validation basique de la clé
        if (supabaseAnonKey.length < 100) {
            console.error('[get-supabase-config] Clé Supabase trop courte');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration invalide',
                    message: 'La clé Supabase semble invalide (trop courte)',
                    debug: {
                        keyLength: supabaseAnonKey.length,
                        expectedMinLength: 100
                    }
                })
            };
        }
        
        // Nettoyer les éventuels espaces ou retours à la ligne
        const cleanUrl = supabaseUrl.trim();
        const cleanKey = supabaseAnonKey.trim();
        
        console.log('[get-supabase-config] Configuration validée et nettoyée');
        console.log('[get-supabase-config] URL (masked):', cleanUrl.substring(0, 30) + '...');
        console.log('[get-supabase-config] Key first 20 chars:', cleanKey.substring(0, 20) + '...');
        console.log('[get-supabase-config] Key last 10 chars:', '...' + cleanKey.substring(cleanKey.length - 10));
        
        // Retourner la configuration nettoyée
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: cleanUrl,
                anonKey: cleanKey,
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
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
