// netlify/functions/get-supabase-config.js
// Fonction Netlify pour exposer les variables d'environnement Supabase de manière sécurisée

exports.handler = async (event, context) => {
  console.log('🚀 get-supabase-config called');
  console.log('Method:', event.httpMethod);
  console.log('Origin:', event.headers.origin);
  console.log('Referer:', event.headers.referer);
  
  // Headers CORS pour toutes les réponses
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine exact
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Log des variables d'environnement disponibles (sans les valeurs)
    console.log('Environment variables check:');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Récupérer les variables d'environnement
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Vérifier que les variables sont définies
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variables d\'environnement Supabase manquantes');
      console.error('Available env vars:', Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || key.includes('VITE')
      ));
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Configuration Supabase manquante',
          details: 'Variables SUPABASE_URL et SUPABASE_ANON_KEY non définies dans Netlify',
          availableEnvVars: Object.keys(process.env).filter(key => 
            key.includes('SUPABASE') || key.includes('VITE')
          ),
          help: 'Ajoutez SUPABASE_URL et SUPABASE_ANON_KEY dans les variables d\'environnement Netlify'
        })
      };
    }

    // Validation basique des valeurs
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
      console.error('❌ SUPABASE_URL invalide:', supabaseUrl.substring(0, 20) + '...');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'SUPABASE_URL invalide',
          details: 'L\'URL doit commencer par https:// et contenir supabase.co'
        })
      };
    }

    if (supabaseAnonKey.length < 100) {
      console.error('❌ SUPABASE_ANON_KEY trop courte');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'SUPABASE_ANON_KEY invalide',
          details: 'La clé anonyme semble trop courte'
        })
      };
    }

    // Validation d'origine (optionnelle en développement)
    const origin = event.headers.origin || event.headers.referer;
    const allowedOrigins = [
      'https://coruscating-dodol-f30e8d.netlify.app',
      'https://emailsortpro.com',
      'http://localhost:3000',
      'http://localhost:8888',
      'http://127.0.0.1:8888',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];

    // En développement, on peut être plus permissif
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isOriginAllowed = !origin || isDevelopment || 
      allowedOrigins.some(allowed => origin.startsWith(allowed));

    if (!isOriginAllowed) {
      console.warn('⚠️ Origin non autorisée:', origin);
      // En production, décommentez le return ci-dessous :
      /*
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Origin not allowed',
          origin: origin,
          allowedOrigins: allowedOrigins
        })
      };
      */
    }

    console.log('✅ Configuration Supabase valide, envoi de la réponse');

    // Retourner la configuration
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        debug: {
          origin: origin,
          isOriginAllowed: isOriginAllowed,
          isDevelopment: isDevelopment
        }
      })
    };

  } catch (error) {
    console.error('❌ Erreur dans get-supabase-config:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erreur serveur interne',
        message: error.message,
        timestamp: new Date().toISOString(),
        help: 'Vérifiez les logs Netlify pour plus de détails'
      })
    };
  }
};
