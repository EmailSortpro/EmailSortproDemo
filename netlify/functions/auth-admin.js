// netlify/functions/auth-admin.js
// Fonction d'authentification pour l'interface analytics

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialiser Supabase avec la clé service
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
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
        const { action, email, password, name, companyName } = JSON.parse(event.body);

        switch (action) {
            case 'login':
                return await handleLogin(email, password, headers);
            
            case 'create_admin':
                return await handleCreateAdmin(email, password, name, companyName, headers);
            
            case 'get_domain_stats':
                return await getDomainStats(event.headers.authorization, headers);
            
            case 'get_user_stats':
                return await getUserStats(event.headers.authorization, headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Action non reconnue' })
                };
        }
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur', details: error.message })
        };
    }
};

// Gérer la connexion
async function handleLogin(email, password, headers) {
    try {
        // Récupérer l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*, company:companies(*)')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email ou mot de passe incorrect' 
                })
            };
        }

        // Vérifier le rôle
        if (user.role !== 'company_admin' && user.role !== 'super_admin') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Accès non autorisé. Rôle administrateur requis.' 
                })
            };
        }

        // Vérifier le mot de passe
        if (!user.password_hash) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Compte non configuré. Veuillez créer un mot de passe.' 
                })
            };
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email ou mot de passe incorrect' 
                })
            };
        }

        // Créer un token de session
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mettre à jour last_login
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                session_token: sessionToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    company_name: user.company?.name,
                    company_domain: user.company?.domain,
                    license_status: user.license_status
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erreur lors de la connexion' 
            })
        };
    }
}

// Créer un compte administrateur
async function handleCreateAdmin(email, password, name, companyName, headers) {
    try {
        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, password_hash')
            .eq('email', email)
            .single();

        if (existingUser && existingUser.password_hash) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Un compte existe déjà avec cet email' 
                })
            };
        }

        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        if (existingUser) {
            // Mettre à jour l'utilisateur existant
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    name: name,
                    password_hash: passwordHash,
                    role: 'company_admin',
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingUser.id);

            if (updateError) throw updateError;

            // Mettre à jour le nom de la société si nécessaire
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('domain', email.split('@')[1])
                .single();

            if (company) {
                await supabase
                    .from('companies')
                    .update({ name: companyName })
                    .eq('id', company.id);
            }
        } else {
            // Créer un nouvel utilisateur
            const domain = email.split('@')[1];
            
            // Créer ou récupérer la société
            let companyId;
            const { data: existingCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('domain', domain)
                .single();

            if (existingCompany) {
                companyId = existingCompany.id;
                // Mettre à jour le nom
                await supabase
                    .from('companies')
                    .update({ name: companyName })
                    .eq('id', companyId);
            } else {
                const { data: newCompany, error: companyError } = await supabase
                    .from('companies')
                    .insert([{
                        name: companyName,
                        domain: domain,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (companyError) throw companyError;
                companyId = newCompany.id;
            }

            // Créer l'utilisateur
            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    email: email,
                    name: name,
                    password_hash: passwordHash,
                    role: 'company_admin',
                    company_id: companyId,
                    license_status: 'trial',
                    license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (userError) throw userError;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Compte administrateur créé avec succès'
            })
        };
    } catch (error) {
        console.error('Create admin error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erreur lors de la création du compte',
                details: error.message
            })
        };
    }
}

// Récupérer les statistiques par domaine
async function getDomainStats(authorization, headers) {
    try {
        // Vérifier l'autorisation (simple vérification du token)
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Autorisation requise' 
                })
            };
        }

        // Récupérer les stats depuis analytics_events
        const { data: events, error } = await supabase
            .from('analytics_events')
            .select('user_email, user_domain, event_type, event_data, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculer les stats par domaine
        const domainStats = {};
        
        events?.forEach(event => {
            const domain = event.user_domain || 'unknown';
            
            if (!domainStats[domain]) {
                domainStats[domain] = {
                    domain: domain,
                    users: new Set(),
                    total_emails_scanned: 0,
                    last_activity: event.created_at,
                    admin_email: null
                };
            }
            
            if (event.user_email) {
                domainStats[domain].users.add(event.user_email);
            }
            
            if (event.event_type === 'email_scan' && event.event_data?.emailCount) {
                domainStats[domain].total_emails_scanned += event.event_data.emailCount;
            }
        });

        // Récupérer les admins
        const { data: admins } = await supabase
            .from('users')
            .select('email, company:companies(domain)')
            .in('role', ['company_admin', 'super_admin']);

        // Associer les admins aux domaines
        const domains = Object.values(domainStats).map(stats => {
            const admin = admins?.find(a => a.company?.domain === stats.domain);
            return {
                domain: stats.domain,
                total_users: stats.users.size,
                total_emails_scanned: stats.total_emails_scanned,
                last_activity: stats.last_activity,
                admin_email: admin?.email || 'N/A'
            };
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                domains: domains
            })
        };
    } catch (error) {
        console.error('Get domain stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erreur lors de la récupération des statistiques' 
            })
        };
    }
}

// Récupérer les statistiques par utilisateur
async function getUserStats(authorization, headers) {
    try {
        // Vérifier l'autorisation
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Autorisation requise' 
                })
            };
        }

        // Récupérer les événements
        const { data: events, error } = await supabase
            .from('analytics_events')
            .select('user_email, user_name, user_domain, session_id, event_type, event_data, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculer les stats par utilisateur
        const userStats = {};
        
        events?.forEach(event => {
            if (!event.user_email) return;
            
            if (!userStats[event.user_email]) {
                userStats[event.user_email] = {
                    email: event.user_email,
                    name: event.user_name || 'N/A',
                    domain: event.user_domain || 'unknown',
                    sessions: new Set(),
                    total_emails_scanned: 0,
                    first_seen: event.created_at,
                    last_activity: event.created_at
                };
            }
            
            if (event.session_id) {
                userStats[event.user_email].sessions.add(event.session_id);
            }
            
            if (event.event_type === 'email_scan' && event.event_data?.emailCount) {
                userStats[event.user_email].total_emails_scanned += event.event_data.emailCount;
            }
            
            // Mettre à jour first_seen et last_activity
            if (new Date(event.created_at) < new Date(userStats[event.user_email].first_seen)) {
                userStats[event.user_email].first_seen = event.created_at;
            }
            if (new Date(event.created_at) > new Date(userStats[event.user_email].last_activity)) {
                userStats[event.user_email].last_activity = event.created_at;
            }
        });

        // Convertir en tableau
        const users = Object.values(userStats).map(stats => ({
            email: stats.email,
            name: stats.name,
            domain: stats.domain,
            total_sessions: stats.sessions.size,
            total_emails_scanned: stats.total_emails_scanned,
            first_seen: stats.first_seen,
            last_activity: stats.last_activity
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                users: users
            })
        };
    } catch (error) {
        console.error('Get user stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erreur lors de la récupération des statistiques' 
            })
        };
    }
}
