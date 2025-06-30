// netlify/functions/auth-admin.js
// Fonction Netlify pour authentification et gestion des administrateurs

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration Supabase (utilise les variables d'environnement)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utilise la clé service pour l'admin
const jwtSecret = process.env.JWT_SECRET || 'votre-secret-jwt-super-secure';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
    // Configuration CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Seulement les requêtes POST sont acceptées
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { action } = body;

        console.log('[Auth Admin] Action:', action);

        switch (action) {
            case 'login':
                return await handleLogin(body, headers);
                
            case 'create_admin':
                return await handleCreateAdmin(body, headers);
                
            case 'get_domain_stats':
                return await handleGetDomainStats(body, headers);
                
            case 'get_user_stats':
                return await handleGetUserStats(body, headers);
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Action non reconnue' 
                    })
                };
        }

    } catch (error) {
        console.error('[Auth Admin] Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erreur serveur interne',
                error: error.message 
            })
        };
    }
};

// === GESTION DE L'AUTHENTIFICATION ===

async function handleLogin(body, headers) {
    const { email, password } = body;

    if (!email || !password) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Email et mot de passe requis'
            })
        };
    }

    try {
        // Rechercher l'utilisateur dans la base
        const { data: user, error: userError } = await supabase
            .from('users')
            .select(`
                *,
                company:companies(*)
            `)
            .eq('email', email.toLowerCase())
            .single();

        if (userError || !user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Utilisateur non trouvé'
                })
            };
        }

        // Vérifier le mot de passe (si défini)
        if (user.password_hash) {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Mot de passe incorrect'
                    })
                };
            }
        } else {
            // Première connexion - créer le hash du mot de passe
            const hashedPassword = await bcrypt.hash(password, 12);
            await supabase
                .from('users')
                .update({ 
                    password_hash: hashedPassword,
                    first_login_at: new Date().toISOString(),
                    login_count: (user.login_count || 0) + 1,
                    last_login_at: new Date().toISOString()
                })
                .eq('id', user.id);
        }

        // Vérifier les permissions admin
        if (user.role !== 'company_admin' && user.role !== 'super_admin') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Accès refusé - Droits administrateur requis'
                })
            };
        }

        // Vérifier le statut de la licence
        if (user.license_status === 'blocked') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Compte bloqué - Contactez le support'
                })
            };
        }

        // Créer un token de session
        const sessionToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                companyId: user.company_id
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        // Enregistrer la session
        await supabase
            .from('user_sessions')
            .insert({
                user_id: user.id,
                session_token: sessionToken,
                ip_address: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
                user_agent: event.headers['user-agent'],
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

        // Mettre à jour les stats de connexion
        await supabase
            .from('users')
            .update({
                last_login_at: new Date().toISOString(),
                login_count: (user.login_count || 0) + 1
            })
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
        console.error('[Auth Admin] Erreur login:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Erreur lors de l\'authentification'
            })
        };
    }
}

// === CRÉATION D'ADMINISTRATEUR ===

async function handleCreateAdmin(body, headers) {
    const { email, name, password, companyName } = body;

    if (!email || !name || !password || !companyName) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Tous les champs sont requis'
            })
        };
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Un utilisateur avec cet email existe déjà'
                })
            };
        }

        // Créer ou récupérer la société
        const domain = email.split('@')[1];
        let { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('domain', domain)
            .single();

        if (companyError || !company) {
            // Créer la société
            const { data: newCompany, error: createCompanyError } = await supabase
                .from('companies')
                .insert({
                    name: companyName,
                    domain: domain
                })
                .select()
                .single();

            if (createCompanyError) {
                throw createCompanyError;
            }
            company = newCompany;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // Créer l'utilisateur admin
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                email: email.toLowerCase(),
                name: name,
                password_hash: hashedPassword,
                role: 'company_admin',
                license_status: 'trial',
                license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                company_id: company.id,
                first_login_at: new Date().toISOString(),
                login_count: 1
            })
            .select()
            .single();

        if (userError) {
            throw userError;
        }

        // Créer une licence trial
        await supabase
            .from('licenses')
            .insert({
                company_id: company.id,
                user_id: newUser.id,
                type: 'trial',
                seats: 5,
                used_seats: 1,
                status: 'active',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Compte administrateur créé avec succès',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    company_name: company.name
                }
            })
        };

    } catch (error) {
        console.error('[Auth Admin] Erreur création admin:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Erreur lors de la création du compte'
            })
        };
    }
}

// === STATISTIQUES PAR DOMAINE ===

async function handleGetDomainStats(body, headers) {
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuth(headers);
        if (!authResult.success) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify(authResult)
            };
        }

        // Récupérer les statistiques par domaine
        const { data: domainStats, error } = await supabase
            .from('domain_usage')
            .select(`
                *,
                company:companies(name)
            `)
            .order('total_emails_scanned', { ascending: false });

        if (error) {
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                domains: domainStats || []
            })
        };

    } catch (error) {
        console.error('[Auth Admin] Erreur domain stats:', error);
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

// === STATISTIQUES PAR UTILISATEUR ===

async function handleGetUserStats(body, headers) {
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuth(headers);
        if (!authResult.success) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify(authResult)
            };
        }

        // Récupérer les statistiques par utilisateur
        const { data: userStats, error } = await supabase
            .from('user_email_stats')
            .select('*')
            .order('total_emails_scanned', { ascending: false });

        if (error) {
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                users: userStats || []
            })
        };

    } catch (error) {
        console.error('[Auth Admin] Erreur user stats:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Erreur lors de la récupération des statistiques utilisateur'
            })
        };
    }
}

// === VÉRIFICATION D'AUTHENTIFICATION ===

async function verifyAuth(headers) {
    try {
        const authHeader = headers.authorization || headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                success: false,
                message: 'Token d\'authentification manquant'
            };
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);

        // Vérifier que la session existe et est active
        const { data: session, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('session_token', token)
            .eq('is_active', true)
            .single();

        if (error || !session) {
            return {
                success: false,
                message: 'Session invalide ou expirée'
            };
        }

        // Vérifier l'expiration
        if (new Date(session.expires_at) < new Date()) {
            await supabase
                .from('user_sessions')
                .update({ is_active: false })
                .eq('id', session.id);

            return {
                success: false,
                message: 'Session expirée'
            };
        }

        return {
            success: true,
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

    } catch (error) {
        console.error('[Auth Admin] Erreur vérification auth:', error);
        return {
            success: false,
            message: 'Token invalide'
        };
    }
}
