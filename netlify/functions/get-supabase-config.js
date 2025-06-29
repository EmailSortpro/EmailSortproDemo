// netlify/functions/get-supabase-config.js
exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  console.log('🚀 Function called:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Configuration manquante',
          details: 'SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis',
          help: 'Ajoutez ces variables dans Site Settings > Environment Variables'
        })
      };
    }

    // Validation basique
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'URL Supabase invalide',
          details: 'L\'URL doit être au format https://xxx.supabase.co'
        })
      };
    }

    if (supabaseAnonKey.length < 100 || !supabaseAnonKey.startsWith('eyJ')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Clé Supabase invalide',
          details: 'La clé doit être un JWT valide'
        })
      };
    }

    console.log('✅ Configuration validated successfully');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Erreur serveur',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
