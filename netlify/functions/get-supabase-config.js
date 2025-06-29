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
    // ✅ CORRECTION: Essayer les deux formats de variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV,
      // Debug: afficher les premiers caractères pour vérifier
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
      keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Configuration manquante',
          details: 'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis',
          help: 'Vérifiez que ces variables sont bien configurées dans Site Settings > Environment Variables',
          debug: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            availableVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
          }
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
          details: 'L\'URL doit être au format https://xxx.supabase.co',
          received: supabaseUrl.substring(0, 50) + '...'
        })
      };
    }
    
    if (supabaseAnonKey.length < 100 || !supabaseAnonKey.startsWith('eyJ')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Clé Supabase invalide',
          details: 'La clé doit être un JWT valide (commence par eyJ)',
          keyLength: supabaseAnonKey.length,
          keyStart: supabaseAnonKey.substring(0, 10)
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
        environment: process.env.NODE_ENV || 'production',
        success: true
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
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
