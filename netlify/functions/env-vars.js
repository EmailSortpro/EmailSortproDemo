// netlify/functions/env-vars.js
// Cette fonction donne les clés Supabase au site web

exports.handler = async (event, context) => {
  // Récupérer les clés depuis les variables d'environnement Netlify
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Vérifier qu'on a bien les clés
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Variables manquantes sur Netlify',
        help: 'Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Netlify'
      })
    };
  }

  // Créer le code JavaScript qui sera exécuté sur le site
  const jsCode = `
    window.NETLIFY_ENV = {
      VITE_SUPABASE_URL: "${supabaseUrl}",
      VITE_SUPABASE_ANON_KEY: "${supabaseAnonKey}"
    };
    console.log('✅ Variables Netlify chargées');
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    },
    body: jsCode
  };
};
