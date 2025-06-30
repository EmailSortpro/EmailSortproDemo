// netlify/functions/auth-admin.js
// Version simplifiée pour tester sans dépendances externes

exports.handler = async (event, context) => {
    console.log('auth-admin function called');
    
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Gérer les requêtes OPTIONS pour CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Vérifier la méthode
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { action, email, password } = body;

        console.log('Action requested:', action);

        // Pour tester, utiliser des données demo
        if (action === 'login') {
            // Authentification demo simple
            if (email === 'demo@admin.com' && password === 'demo123') {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        session_token: 'demo-token-' + Date.now(),
                        user: {
                            id: 'demo-user-id',
                            email: 'demo@admin.com',
                            name: 'Demo Admin',
                            role: 'company_admin',
                            company_name: 'Demo Company',
                            company_domain: 'demo.com',
                            license_status: 'active'
                        }
                    })
                };
            }
            
            // Pour tout autre email/password, retourner succès en mode demo
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    session_token: 'demo-token-' + Date.now(),
                    user: {
                        id: 'user-' + Date.now(),
                        email: email,
                        name: email.split('@')[0],
                        role: 'company_admin',
                        company_name: 'Test Company',
                        company_domain: email.split('@')[1],
                        license_status: 'trial'
                    }
                })
            };
        }

        if (action === 'get_domain_stats') {
            // Données demo pour les stats de domaine
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    domains: [
                        {
                            domain: 'demo.com',
                            total_users: 5,
                            total_emails_scanned: 1250,
                            last_activity: new Date().toISOString(),
                            admin_email: 'admin@demo.com'
                        },
                        {
                            domain: 'test-company.fr',
                            total_users: 3,
                            total_emails_scanned: 890,
                            last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                            admin_email: 'admin@test-company.fr'
                        },
                        {
                            domain: email ? email.split('@')[1] : 'votre-domaine.com',
                            total_users: 8,
                            total_emails_scanned: 2150,
                            last_activity: new Date().toISOString(),
                            admin_email: email || 'admin@votre-domaine.com'
                        }
                    ]
                })
            };
        }

        if (action === 'get_user_stats') {
            // Données demo pour les stats utilisateur
            const userEmail = body.email || 'user@demo.com';
            const domain = userEmail.split('@')[1];
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    users: [
                        {
                            email: userEmail,
                            name: userEmail.split('@')[0],
                            domain: domain,
                            total_emails_scanned: 450,
                            total_sessions: 12,
                            first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                            last_activity: new Date().toISOString()
                        },
                        {
                            email: 'john@' + domain,
                            name: 'John Doe',
                            domain: domain,
                            total_emails_scanned: 380,
                            total_sessions: 8,
                            first_seen: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                            last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            email: 'jane@' + domain,
                            name: 'Jane Smith',
                            domain: domain,
                            total_emails_scanned: 520,
                            total_sessions: 15,
                            first_seen: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                            last_activity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
                        }
                    ]
                })
            };
        }

        // Action non reconnue
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Action non reconnue: ' + action
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Erreur serveur',
                error: error.message
            })
        };
    }
};
