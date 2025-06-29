// netlify/functions/get-supabase-config.js
// Fonction Netlify pour exposer les variables d'environnement Supabase de manière sécurisée

exports.handler = async (event, context) => {
  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Vérifier que les variables sont définies
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variables d\'environnement Supabase manquantes');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Configuration Supabase manquante',
          details: 'Vérifiez vos variables d\'environnement Netlify'
        })
      };
    }

    // Optionnel : Ajouter une validation d'origine pour plus de sécurité
    const origin = event.headers.origin || event.headers.referer;
    const allowedOrigins = [
      'https://votre-domaine.netlify.app',
      'https://emailsortpro.com', // Remplacez par votre domaine
      'http://localhost:3000', // Pour le développement local
      'http://localhost:8888', // Netlify Dev
      'http://127.0.0.1:8888'
    ];

    // En production, décommentez cette vérification :
    /*
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Origin not allowed' })
      };
    }
    */

    // Retourner la configuration
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
        'Access-Control-Allow-Methods': 'GET',
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
    console.error('Erreur dans get-supabase-config:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur serveur interne',
        message: error.message
      })
    };
  }
};
