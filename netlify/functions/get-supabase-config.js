// netlify/functions/get-supabase-config.js
// Fonction Netlify sécurisée pour exposer les variables Supabase

exports.handler = async (event, context) => {
  // Headers CORS pour toutes les réponses
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  // Log de démarrage
  console.log('🚀 get-supabase-config called');
  console.log('Method:', event.httpMethod);
  console.log('Origin:', event.headers.origin || 'none');
  console.log('User-Agent:', event.headers['user-agent']?.substring(0, 50) || 'none');

  // Gérer les requêtes OPTIONS (preflight CORS)
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'GET') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        allowed: ['GET', 'OPTIONS']
      })
    };
  }

  try {
    // Log des variables d'environnement disponibles (sans valeurs sensibles)
    console.log('🔍 Checking environment variables...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    
    // Essayer différentes variantes de noms de variables
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.VITE_SUPABASE_URL || 
                       process.env.REACT_APP_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
                       
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 
                           process.env.VITE_SUPABASE_ANON_KEY || 
                           process.env.REACT_APP_SUPABASE_ANON_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Diagnostic des variables trouvées
    if (supabaseUrl) {
      console.log('✅ URL found, length:', supabaseUrl.length);
      console.log('✅ URL starts with https:', supabaseUrl.startsWith('https://'));
      console.log('✅ URL contains supabase:', supabaseUrl.includes('supabase'));
    } else {
      console.log('❌ No SUPABASE_URL found');
    }

    if (supabaseAnonKey) {
      console.log('✅ Key found, length:', supabaseAnonKey.length);
      console.log('✅ Key starts with eyJ:', supabaseAnonKey.startsWith('eyJ'));
    } else {
      console.log('❌ No SUPABASE_ANON_KEY found');
    }

    // Vérifier que les variables sont définies
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables');
      
      // Lister toutes les variables d'environnement qui contiennent "SUPABASE"
      const supabaseVars = Object.keys(process.env).filter(key => 
        key.toUpperCase().includes('SUPABASE')
      );
      
      console.log('Available SUPABASE vars:', supabaseVars);
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Configuration Supabase manquante',
          details: 'Les variables SUPABASE_URL et SUPABASE_ANON_KEY ne sont pas définies',
          help: 'Ajoutez ces variables dans les paramètres d\'environnement de votre site Netlify',
          availableVars: supabaseVars,
          required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
          timestamp: new Date().toISOString()
        })
      };
    }

    // Validation de base des valeurs
    const validationErrors = [];
    
    if (!supabaseUrl.startsWith('https://')) {
      validationErrors.push('SUPABASE_URL doit commencer par https://');
    }
    
    if (!supabaseUrl.includes('supabase.co')) {
      validationErrors.push('SUPABASE_URL doit contenir supabase.co');
    }
    
    if (supabaseUrl.length < 30) {
      validationErrors.push('SUPABASE_URL semble trop courte');
    }
    
    if (supabaseAnonKey.length < 100) {
      validationErrors.push('SUPABASE_ANON_KEY semble trop courte');
    }
    
    if (!supabaseAnonKey.startsWith('eyJ')) {
      validationErrors.push('SUPABASE_ANON_KEY doit être un JWT (commencer par eyJ)');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Variables Supabase invalides',
          validationErrors: validationErrors,
          help: 'Vérifiez les valeurs de vos variables d\'environnement Netlify'
        })
      };
    }

    // Validation d'origine (optionnelle en développement)
    const origin = event.headers.origin || event.headers.referer;
    const allowedOrigins = [
      'https://coruscating-dodol-f30e8d.netlify.app',
      'https://emailsortpro.com',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8888',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8888'
    ];

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isOriginAllowed = !origin || isDevelopment || 
      allowedOrigins.some(allowed => origin.startsWith(allowed));

    if (!isOriginAllowed) {
      console.warn('⚠️ Origin non autorisée:', origin);
      // En production, vous pouvez décommenter le return ci-dessous
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

    console.log('✅ Validation passed, returning configuration');

    // Retourner la configuration sécurisée
    const response = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      version: '1.0.0'
    };

    console.log('✅ Configuration sent successfully');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
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
        help: 'Consultez les logs Netlify pour plus de détails'
      })
    };
  }
};
