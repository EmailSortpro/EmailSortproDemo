// netlify/functions/auth-admin.js
// Version ultra-simple pour diagnostiquer le problème

exports.handler = async (event, context) => {
    console.log('🚀 Function auth-admin called!');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Pour le moment, retourner une réponse de test pour le login demo
    try {
        let body = {};
        if (event.body) {
            body = JSON.parse(event.body);
        }

        console.log('Action requested:', body.action);

        if (body.action === 'login') {
            // Simuler une authentification pour les tests
            if (body.email === 'demo@admin.com' && body.password === 'demo123') {
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
                            license_status: 'trial'
                        }
                    })
                };
            } else {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Identifiants incorrects (demo: demo@admin.com / demo123)'
                    })
                };
            }
        }

        if (body.action === 'get_domain_stats') {
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
                            admin_email: 'demo@admin.com'
                        },
                        {
                            domain: 'test-company.fr',
                            total_users: 3,
                            total_emails_scanned: 890,
                            last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                            admin_email: 'admin@test-company.fr'
                        }
                    ]
                })
            };
        }

        if (body.action === 'get_user_stats') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    users: [
                        {
                            email: 'john@demo.com',
                            name: 'John Doe',
                            domain: 'demo.com',
                            total_emails_scanned: 450,
                            total_sessions: 12,
                            first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                            last_activity: new Date().toISOString()
                        },
                        {
                            email: 'jane@demo.com',
                            name: 'Jane Smith',
                            domain: 'demo.com',
                            total_emails_scanned: 380,
                            total_sessions: 8,
                            first_seen: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                            last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                        }
                    ]
                })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Action non reconnue: ' + body.action
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Erreur serveur: ' + error.message
            })
        };
    }
};
