// CategoryManager.js - Version 16.1 - Correction CC et exclusion spam

class CategoryManager {
    constructor() {
        this.categories = {};
        this.isInitialized = false;
        this.debugMode = false;
        this.weightedKeywords = {};
        this.initializeCategories();
        this.initializeWeightedDetection();
        console.log('[CategoryManager] ✅ Version 16.1 - Correction CC et exclusion spam');
    }

    // ================================================
    // INITIALISATION DES CATÉGORIES
    // ================================================
    initializeCategories() {
        this.categories = {
            // PRIORITÉ MAXIMALE - MARKETING & NEWS (détecté en premier)
            marketing_news: {
                name: 'Marketing & News',
                icon: '📰',
                color: '#8b5cf6',
                description: 'Newsletters et promotions',
                priority: 100
            },
            
            // CATÉGORIE CC - PRIORITÉ ÉLEVÉE POUR INTERCEPTION
            cc: {
                name: 'En Copie',
                icon: '📋',
                color: '#64748b',
                description: 'Emails où vous êtes en copie',
                priority: 90
            },
            
            // MÊME PRIORITÉ POUR TOUTES LES AUTRES CATÉGORIES
            security: {
                name: 'Sécurité',
                icon: '🔒',
                color: '#991b1b',
                description: 'Alertes de sécurité, connexions et authentification',
                priority: 50
            },
            
            finance: {
                name: 'Finance',
                icon: '💰',
                color: '#dc2626',
                description: 'Factures et paiements',
                priority: 50
            },
            
            tasks: {
                name: 'Actions Requises',
                icon: '✅',
                color: '#ef4444',
                description: 'Tâches à faire et demandes d\'action',
                priority: 50
            },
            
            commercial: {
                name: 'Commercial',
                icon: '💼',
                color: '#059669',
                description: 'Opportunités, devis et contrats',
                priority: 50
            },
            
            meetings: {
                name: 'Réunions',
                icon: '📅',
                color: '#f59e0b',
                description: 'Invitations et demandes de réunion',
                priority: 50
            },
            
            support: {
                name: 'Support',
                icon: '🛠️',
                color: '#f59e0b',
                description: 'Tickets et assistance',
                priority: 50
            },
            
            reminders: {
                name: 'Relances',
                icon: '🔄',
                color: '#10b981',
                description: 'Rappels et suivis',
                priority: 50
            },
            
            project: {
                name: 'Projets',
                icon: '📊',
                color: '#3b82f6',
                description: 'Gestion de projet',
                priority: 50
            },
            
            hr: {
                name: 'RH',
                icon: '👥',
                color: '#10b981',
                description: 'Ressources humaines',
                priority: 50
            },
            
            internal: {
                name: 'Communication Interne',
                icon: '📢',
                color: '#0ea5e9',
                description: 'Annonces internes',
                priority: 50
            },
            
            notifications: {
                name: 'Notifications',
                icon: '🔔',
                color: '#94a3b8',
                description: 'Notifications automatiques',
                priority: 50
            }
        };
        
        this.isInitialized = true;
    }

    // ================================================
    // SYSTÈME DE DÉTECTION AVEC MOTS-CLÉS ÉTENDUS
    // ================================================
    initializeWeightedDetection() {
        this.weightedKeywords = {
            // SÉCURITÉ - PATTERNS STRICTS
            security: {
                absolute: [
                    // ALERTES DE CONNEXION
                    'alerte de connexion', 'alert connexion', 'nouvelle connexion',
                    'quelqu\'un s\'est connecté', 'connexion à votre compte',
                    'activité suspecte', 'suspicious activity', 'login alert',
                    'new sign-in', 'sign in detected', 'connexion détectée',
                    'accès à votre compte', 'account accessed',
                    
                    // CODES ET AUTHENTIFICATION
                    'code de vérification', 'verification code', 'security code',
                    'two-factor', '2fa', 'authentification', 'authentication',
                    'code d\'accès unique', 'one-time password', 'otp',
                    
                    // RÉINITIALISATION
                    'password reset', 'réinitialisation mot de passe',
                    'reset your password', 'changer votre mot de passe'
                ],
                
                strong: [
                    'sécurité', 'security', 'vérification', 'verify',
                    'authentification', 'password', 'mot de passe'
                ],
                
                weak: ['compte', 'account', 'accès'],
                
                // Exclure si c'est du marketing
                exclusions: ['newsletter', 'unsubscribe', 'promotion', 'sale', 'offre']
            },
            
            // RÉUNIONS - PATTERNS STRICTS
            meetings: {
                absolute: [
                    'demande de réunion', 'meeting request', 'réunion',
                    'schedule a meeting', 'planifier une réunion',
                    'invitation réunion', 'meeting invitation',
                    'book a meeting', 'réserver une réunion',
                    'teams meeting', 'zoom meeting', 'google meet',
                    'conference call', 'rendez-vous', 'rdv',
                    'demande présentation', 'présentation prévue'
                ],
                
                strong: [
                    'meeting', 'réunion', 'schedule', 'planifier',
                    'calendar', 'calendrier', 'appointment'
                ],
                
                weak: ['présentation', 'agenda'],
                
                exclusions: ['newsletter', 'unsubscribe', 'promotion']
            },
            
            // TÂCHES - PATTERNS STRICTS (sans confusion marketing)
            tasks: {
                absolute: [
                    'action required', 'action requise', 'action needed',
                    'please complete', 'veuillez compléter', 'to do',
                    'task assigned', 'tâche assignée', 'deadline',
                    'due date', 'échéance', 'livrable',
                    'urgence', 'urgent', 'très urgent',
                    'demande explication', 'explication requise',
                    'merci de faire', 'pouvez-vous faire', 'pourriez-vous faire',
                    'action à mener', 'à faire', 'à traiter',
                    'demande d\'action', 'nécessite votre action',
                    'en attente de', 'waiting for your action',
                    'répondre avant', 'reply by', 'response needed',
                    'confirmation requise', 'approval needed'
                ],
                
                strong: [
                    'urgent', 'asap', 'priority', 'priorité',
                    'complete', 'compléter', 'action', 'faire',
                    'deadline', 'échéance', 'avant le'
                ],
                
                weak: ['demande', 'besoin', 'attente'],
                
                // Exclure les patterns marketing
                exclusions: [
                    'discount', 'promo', 'sale', 'offer', 'offre',
                    'newsletter', 'unsubscribe', 'marketing',
                    'shop now', 'buy now', 'limited time',
                    'exclusive', 'special offer', 'just for you',
                    'découvrez', 'new arrivals', 'collection'
                ]
            },
            
            // RELANCES - PATTERNS STRICTS
            reminders: {
                absolute: [
                    'reminder:', 'rappel:', 'follow up', 'relance',
                    'gentle reminder', 'rappel amical', 'following up',
                    'quick reminder', 'petit rappel', 'friendly reminder',
                    'je reviens vers vous', 'circling back',
                    'comme convenu', 'suite à notre', 'faisant suite'
                ],
                
                strong: [
                    'reminder', 'rappel', 'follow', 'relance',
                    'suite', 'convenu'
                ],
                
                weak: ['previous', 'discussed'],
                
                exclusions: ['newsletter', 'marketing', 'promotion']
            },
            
            // COMMERCIAL - PATTERNS STRICTS
            commercial: {
                absolute: [
                    'devis', 'quotation', 'proposal', 'proposition',
                    'contrat', 'contract', 'bon de commande',
                    'purchase order', 'offre commerciale',
                    'proposition commerciale', 'business proposal',
                    'opportunité commerciale', 'commercial opportunity',
                    'nouveau client', 'new customer',
                    'signature contrat', 'contract signature'
                ],
                
                strong: [
                    'client', 'customer', 'prospect', 'opportunity',
                    'commercial', 'business', 'marché', 'deal'
                ],
                
                weak: ['offre', 'négociation'],
                
                exclusions: ['newsletter', 'unsubscribe', 'marketing', 'promotion', 'sale']
            },
            
            // FINANCE - PATTERNS STRICTS
            finance: {
                absolute: [
                    'facture', 'invoice', 'payment', 'paiement',
                    'virement', 'transfer', 'remboursement',
                    'relevé bancaire', 'bank statement',
                    'déclaration fiscale', 'tax declaration',
                    'impôts', 'taxes', 'fiscal',
                    'reçu fiscal', 'tax receipt',
                    'comptabilité', 'accounting',
                    'bilan', 'balance sheet',
                    'échéance de paiement', 'payment due',
                    'rappel de paiement', 'payment reminder'
                ],
                
                strong: [
                    'montant', 'amount', 'total', 'facture',
                    'fiscal', 'bancaire', 'bank', 'finance',
                    'paiement', 'payment'
                ],
                
                weak: ['euro', 'dollar', 'prix'],
                
                exclusions: ['newsletter', 'marketing', 'promotion', 'offre spéciale']
            },
            
            // PROJETS - PATTERNS STRICTS
            project: {
                absolute: [
                    'projet xx', 'project update', 'milestone',
                    'sprint', 'livrable projet', 'gantt',
                    'avancement projet', 'project status',
                    'kickoff', 'kick off', 'lancement projet'
                ],
                
                strong: [
                    'projet', 'project', 'milestone', 'sprint',
                    'agile', 'scrum'
                ],
                
                weak: ['development', 'phase'],
                
                exclusions: ['newsletter', 'marketing']
            },
            
            // RH - PATTERNS STRICTS
            hr: {
                absolute: [
                    'bulletin de paie', 'payslip', 'contrat de travail',
                    'congés', 'leave request', 'onboarding',
                    'entretien annuel', 'performance review',
                    'recrutement', 'recruitment', 'candidature'
                ],
                
                strong: [
                    'rh', 'hr', 'salaire', 'salary',
                    'ressources humaines', 'human resources'
                ],
                
                weak: ['employee', 'staff'],
                
                exclusions: ['newsletter', 'marketing']
            },
            
            // SUPPORT - PATTERNS STRICTS
            support: {
                absolute: [
                    'ticket #', 'ticket number', 'numéro de ticket',
                    'case #', 'case number', 'incident #',
                    'problème résolu', 'issue resolved', 'ticket résolu',
                    'support ticket', 'ticket de support', 'help desk'
                ],
                
                strong: [
                    'support', 'assistance', 'help desk',
                    'technical support', 'ticket'
                ],
                
                weak: ['help', 'aide', 'issue'],
                
                exclusions: ['newsletter', 'marketing']
            },
            
            // INTERNE - PATTERNS STRICTS
            internal: {
                absolute: [
                    'all staff', 'tout le personnel', 'annonce interne',
                    'company announcement', 'memo interne',
                    'communication interne', 'internal communication',
                    'note de service', 'bulletin interne'
                ],
                
                strong: [
                    'internal', 'interne', 'company wide',
                    'personnel', 'staff'
                ],
                
                weak: ['annonce', 'announcement'],
                
                exclusions: ['newsletter', 'unsubscribe', 'marketing', 'external']
            },
            
            // NOTIFICATIONS - PATTERNS STRICTS
            notifications: {
                absolute: [
                    'do not reply', 'ne pas répondre', 'noreply@',
                    'automated message', 'notification automatique',
                    'system notification', 'notification système',
                    'ceci est un message automatique', 'this is an automated'
                ],
                
                strong: [
                    'automated', 'automatic', 'system',
                    'notification', 'automatique'
                ],
                
                weak: ['notification', 'alert'],
                
                // Exclure si c'est du marketing
                exclusions: ['unsubscribe', 'newsletter', 'marketing', 'promotion', 'sale']
            },
            
            // MARKETING & NEWS - PRIORITÉ MAXIMALE AVEC PATTERNS TRÈS STRICTS
            marketing_news: {
                absolute: [
                    // DÉSINSCRIPTION - CRITÈRE CLÉ
                    'se désinscrire', 'se desinscrire', 'désinscrire', 'desinscrire',
                    'unsubscribe', 'opt out', 'opt-out', 'désabonner', 'desabonner',
                    'gérer vos préférences', 'gérer la réception',
                    'email preferences', 'préférences email',
                    'ne plus recevoir', 'stop emails',
                    'gérer vos abonnements', 'manage subscriptions',
                    
                    // NEWSLETTERS EXPLICITES
                    'newsletter', 'mailing list', 'mailing',
                    'this email was sent to', 'you are receiving this',
                    'cet email vous est envoyé', 'vous recevez cet email',
                    
                    // MARKETING CLAIR
                    'marketing', 'campaign', 'campagne',
                    'limited offer', 'offre limitée', 'special offer',
                    'showroom', 'promotion', 'promo', 'soldes',
                    'vente privée', 'offre spéciale', 'réduction',
                    '% de réduction', '% off', 'promo code', 'code promo',
                    'flash sale', 'vente flash', 'black friday',
                    'discount', 'remise', 'prix réduit',
                    'exclusive offer', 'offre exclusive',
                    'limited time', 'temps limité',
                    
                    // ACTUALITÉS
                    'actualités', 'news update', 'weekly digest',
                    'monthly newsletter', 'hebdomadaire', 'mensuel',
                    'édition du', 'bulletin', 'flash info',
                    
                    // E-COMMERCE
                    'shop now', 'acheter maintenant', 'buy now',
                    'add to cart', 'ajouter au panier',
                    'new collection', 'nouvelle collection',
                    
                    // RÉSEAUX SOCIAUX
                    'follow us', 'suivez-nous', 'like us',
                    'on instagram', 'on facebook',
                    'recently added to their stories'
                ],
                
                strong: [
                    'promo', 'deal', 'offer', 'sale', 'discount',
                    'newsletter', 'mailing', 'campaign', 'marketing',
                    'abonné', 'subscriber', 'désinscription',
                    'exclusive', 'special', 'limited', 'new',
                    'collection', 'shop', 'store'
                ],
                
                weak: ['update', 'discover', 'new'],
                
                // Très peu d'exclusions pour capturer le maximum
                exclusions: [
                    'facture urgente', 'paiement requis',
                    'code de vérification urgent', 'security alert critical',
                    'action required immediately'
                ]
            },

            // CATÉGORIE CC - PATTERNS SIMPLES MAIS EFFICACES
            cc: {
                absolute: [
                    // Ces patterns seront détectés différemment via isInCC()
                    'copie pour information', 'for your information', 'fyi',
                    'en copie', 'in copy', 'cc:', 'courtesy copy',
                    'pour information', 'info copy'
                ],
                
                strong: [
                    'information', 'copie', 'copy'
                ],
                
                weak: ['fyi', 'info'],
                
                exclusions: []
            }
        };
    }

    // ================================================
    // ANALYSE AVEC SEUIL MINIMUM REQUIS ET DÉTECTION CC
    // ================================================
    analyzeEmail(email) {
        if (!email) return { category: 'other', score: 0, confidence: 0 };
        
        // Filtrer les courriers indésirables en priorité
        if (this.isSpamEmail(email)) {
            if (this.debugMode) {
                console.log('[CategoryManager] Email spam détecté, ignoré:', email.subject);
            }
            return { category: 'spam', score: 0, confidence: 0, isSpam: true };
        }
        
        const content = this.extractCompleteContent(email);
        
        // Vérification CC AVANT toute autre analyse
        if (this.isInCC(email)) {
            if (this.debugMode) {
                console.log('[CategoryManager] Email en CC détecté:', email.subject);
            }
            
            // Vérifier si ce n'est pas du marketing malgré le CC
            const marketingCheck = this.analyzeCategory(content, this.weightedKeywords.marketing_news);
            if (marketingCheck.score >= 80) {
                if (this.debugMode) {
                    console.log('[CategoryManager] Email CC mais marketing détecté:', email.subject);
                }
                return {
                    category: 'marketing_news',
                    score: marketingCheck.total,
                    confidence: this.calculateConfidence(marketingCheck),
                    matchedPatterns: marketingCheck.matches,
                    hasAbsolute: marketingCheck.hasAbsolute,
                    originallyCC: true
                };
            }
            
            return {
                category: 'cc',
                score: 100,
                confidence: 0.95,
                matchedPatterns: [{ keyword: 'email_in_cc', type: 'detected', score: 100 }],
                hasAbsolute: true,
                isCC: true
            };
        }
        
        // Vérification spéciale pour les emails personnels
        if (this.isPersonalEmail(email)) {
            const enhancedContent = {
                ...content,
                text: content.text + ' demande action personnelle interne'
            };
            
            const allResults = this.analyzeAllCategories(enhancedContent);
            
            // Boost pour la catégorie tasks si email personnel
            if (allResults.tasks) {
                allResults.tasks.score += 50;
                allResults.tasks.confidence = Math.min(0.95, allResults.tasks.confidence + 0.2);
            }
            
            return this.selectByPriorityWithThreshold(allResults);
        }
        
        // Analyse normale pour les autres emails
        const allResults = this.analyzeAllCategories(content);
        return this.selectByPriorityWithThreshold(allResults);
    }

    // ================================================
    // DÉTECTION SPAM / COURRIERS INDÉSIRABLES
    // ================================================
    isSpamEmail(email) {
        // Vérifier si l'email est dans le dossier spam/junk
        if (email.parentFolderId) {
            const folderInfo = email.parentFolderId.toLowerCase();
            if (folderInfo.includes('junk') || 
                folderInfo.includes('spam') || 
                folderInfo.includes('unwanted') ||
                folderInfo.includes('indésirable') ||
                folderInfo.includes('courrier indésirable')) {
                return true;
            }
        }
        
        // Vérifier les catégories Outlook
        if (email.categories && Array.isArray(email.categories)) {
            const hasSpamCategory = email.categories.some(cat => 
                cat.toLowerCase().includes('spam') ||
                cat.toLowerCase().includes('junk') ||
                cat.toLowerCase().includes('indésirable')
            );
            if (hasSpamCategory) return true;
        }
        
        // Vérifier l'importance/priorité (souvent les spams ont une priorité bizarre)
        if (email.importance === 'low' && email.flag?.flagStatus === 'flagged') {
            // Pattern suspect: importance faible mais marqué - souvent spam
            return this.hasSuspiciousSpamPatterns(email);
        }
        
        // Patterns de spam dans le sujet
        if (email.subject) {
            const suspiciousSubjectPatterns = [
                /\[spam\]/i,
                /\*\*\*spam\*\*\*/i,
                /urgent.{0,20}action.{0,20}required.{0,20}immediately/i,
                /you.{0,10}have.{0,10}won/i,
                /congratulations.{0,20}winner/i,
                /free.{0,10}money/i,
                /click.{0,10}here.{0,10}now/i
            ];
            
            if (suspiciousSubjectPatterns.some(pattern => pattern.test(email.subject))) {
                return true;
            }
        }
        
        return false;
    }

    hasSuspiciousSpamPatterns(email) {
        const content = this.extractCompleteContent(email);
        const spamPatterns = [
            'click here now', 'act now', 'urgent action required',
            'you have won', 'congratulations winner', 'free money',
            'limited time offer expires', 'this is not spam',
            'remove from list', 'unsubscribe here'
        ];
        
        let spamScore = 0;
        spamPatterns.forEach(pattern => {
            if (this.findInText(content.text, pattern)) {
                spamScore += 1;
            }
        });
        
        return spamScore >= 2; // 2+ patterns = probable spam
    }

    // ================================================
    // DÉTECTION EMAIL EN COPIE (CC)
    // ================================================
    isInCC(email) {
        if (!email.ccRecipients || !Array.isArray(email.ccRecipients)) {
            return false;
        }
        
        // Obtenir l'adresse email de l'utilisateur connecté
        const currentUserEmail = this.getCurrentUserEmail();
        if (!currentUserEmail) {
            // Si on ne peut pas déterminer l'utilisateur, vérifier si on a des CC
            return email.ccRecipients.length > 0;
        }
        
        // Vérifier si l'utilisateur est dans les CC
        const isInCCList = email.ccRecipients.some(recipient => {
            const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
            return recipientEmail === currentUserEmail.toLowerCase();
        });
        
        if (this.debugMode && isInCCList) {
            console.log('[CategoryManager] Utilisateur trouvé en CC:', email.subject);
        }
        
        return isInCCList;
    }

    getCurrentUserEmail() {
        // Essayer de récupérer l'email de l'utilisateur connecté
        // Méthode 1: depuis l'interface Graph API si disponible
        if (window.graphClient && window.graphClient.me) {
            try {
                // Note: ceci devrait être fait de manière asynchrone normalement
                // Pour l'instant, on utilise une méthode alternative
                const userInfo = localStorage.getItem('currentUserInfo');
                if (userInfo) {
                    const parsed = JSON.parse(userInfo);
                    return parsed.email || parsed.userPrincipalName;
                }
            } catch (e) {
                console.warn('[CategoryManager] Impossible de récupérer l\'email utilisateur depuis le cache');
            }
        }
        
        // Méthode 2: analyser les emails reçus pour déduire l'adresse
        // (cette méthode est moins fiable mais peut aider)
        try {
            const emailHistory = localStorage.getItem('recentEmails');
            if (emailHistory) {
                const emails = JSON.parse(emailHistory);
                const toAddresses = emails.flatMap(email => 
                    (email.toRecipients || []).map(r => r.emailAddress?.address)
                ).filter(Boolean);
                
                // Prendre l'adresse la plus fréquente
                const addressCounts = {};
                toAddresses.forEach(addr => {
                    addressCounts[addr] = (addressCounts[addr] || 0) + 1;
                });
                
                const mostFrequent = Object.entries(addressCounts)
                    .sort(([,a], [,b]) => b - a)[0];
                
                if (mostFrequent) {
                    return mostFrequent[0];
                }
            }
        } catch (e) {
            console.warn('[CategoryManager] Impossible de déduire l\'email utilisateur');
        }
        
        return null;
    }

    // ================================================
    // SÉLECTION PAR PRIORITÉ AVEC SEUIL MINIMUM
    // ================================================
    selectByPriorityWithThreshold(results) {
        const MIN_SCORE_THRESHOLD = 30; // Score minimum requis pour la catégorisation
        const MIN_CONFIDENCE_THRESHOLD = 0.5; // Confiance minimum requise
        
        // Trier par priorité décroissante puis par score
        const sortedResults = Object.values(results)
            .filter(r => r.score >= MIN_SCORE_THRESHOLD && r.confidence >= MIN_CONFIDENCE_THRESHOLD)
            .sort((a, b) => {
                // D'abord par priorité
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                // Ensuite par score
                return b.score - a.score;
            });
        
        if (this.debugMode) {
            console.log('[CategoryManager] Scores par catégorie (avec seuil):');
            sortedResults.forEach(r => {
                console.log(`  - ${r.category}: ${r.score}pts (priority: ${r.priority}, confidence: ${r.confidence})`);
            });
        }
        
        // Prendre le premier résultat qui passe le seuil
        const bestResult = sortedResults[0];
        
        if (bestResult) {
            return {
                category: bestResult.category,
                score: bestResult.score,
                confidence: bestResult.confidence,
                matchedPatterns: bestResult.matches,
                hasAbsolute: bestResult.hasAbsolute
            };
        }
        
        // Si aucune catégorie ne passe le seuil, retourner 'other'
        return {
            category: 'other',
            score: 0,
            confidence: 0,
            matchedPatterns: [],
            hasAbsolute: false
        };
    }

    // ================================================
    // ANALYSE DE TOUTES LES CATÉGORIES
    // ================================================
    analyzeAllCategories(content) {
        const results = {};
        
        for (const [categoryId, keywords] of Object.entries(this.weightedKeywords)) {
            const score = this.calculateScore(content, keywords, categoryId);
            
            results[categoryId] = {
                category: categoryId,
                score: score.total,
                hasAbsolute: score.hasAbsolute,
                matches: score.matches,
                confidence: this.calculateConfidence(score),
                priority: this.categories[categoryId].priority
            };
        }
        
        return results;
    }

    // ================================================
    // ANALYSE D'UNE CATÉGORIE SPÉCIFIQUE
    // ================================================
    analyzeCategory(content, keywords) {
        return this.calculateScore(content, keywords, 'single');
    }

    // ================================================
    // CALCUL DU SCORE AMÉLIORÉ AVEC VALIDATION STRICTE
    // ================================================
    calculateScore(content, keywords, categoryId) {
        let totalScore = 0;
        let hasAbsolute = false;
        const matches = [];
        const text = content.text;
        
        // Vérifier les exclusions d'abord
        if (keywords.exclusions) {
            for (const exclusion of keywords.exclusions) {
                if (this.findInText(text, exclusion)) {
                    // Pour marketing_news, les exclusions réduisent le score mais n'annulent pas
                    if (categoryId === 'marketing_news') {
                        totalScore -= 20;
                    } else {
                        // Pour les autres catégories, réduire fortement le score
                        totalScore -= 100;
                    }
                }
            }
        }
        
        // Mots absolus (100 points)
        if (keywords.absolute) {
            for (const keyword of keywords.absolute) {
                if (this.findInText(text, keyword)) {
                    totalScore += 100;
                    hasAbsolute = true;
                    matches.push({ keyword, type: 'absolute', score: 100 });
                    
                    // Bonus si le mot apparaît dans le sujet
                    if (content.subject && this.findInText(content.subject, keyword)) {
                        totalScore += 50;
                        matches.push({ keyword: keyword + ' (in subject)', type: 'bonus', score: 50 });
                    }
                }
            }
        }
        
        // Mots forts (30 points) - seulement si pas trop de mots absolus
        if (keywords.strong && matches.length < 5) {
            for (const keyword of keywords.strong) {
                if (this.findInText(text, keyword)) {
                    totalScore += 30;
                    matches.push({ keyword, type: 'strong', score: 30 });
                }
            }
        }
        
        // Mots faibles (10 points) - seulement si pas de mots absolus
        if (keywords.weak && !hasAbsolute) {
            for (const keyword of keywords.weak) {
                if (this.findInText(text, keyword)) {
                    totalScore += 10;
                    matches.push({ keyword, type: 'weak', score: 10 });
                }
            }
        }
        
        // Bonus de domaine spécifique
        if (categoryId === 'security' && 
            (content.domain.includes('microsoft') || 
             content.domain.includes('google') ||
             content.domain.includes('apple') ||
             content.domain.includes('security'))) {
            totalScore += 50;
            matches.push({ keyword: 'security_domain', type: 'domain', score: 50 });
        }
        
        if (categoryId === 'finance' && 
            (content.domain.includes('gouv.fr') || 
             content.domain.includes('impots') ||
             content.domain.includes('bank') ||
             content.domain.includes('paypal'))) {
            totalScore += 50;
            matches.push({ keyword: 'finance_domain', type: 'domain', score: 50 });
        }
        
        if (categoryId === 'marketing_news' && 
            (content.domain.includes('newsletter') ||
             content.domain.includes('mailchimp') ||
             content.domain.includes('campaign') ||
             content.domain.includes('marketing'))) {
            totalScore += 30;
            matches.push({ keyword: 'newsletter_domain', type: 'domain', score: 30 });
        }
        
        if (categoryId === 'notifications' && 
            (content.domain.includes('noreply') ||
             content.domain.includes('notification') ||
             content.domain.includes('donotreply'))) {
            totalScore += 40;
            matches.push({ keyword: 'notification_domain', type: 'domain', score: 40 });
        }
        
        return { total: Math.max(0, totalScore), hasAbsolute, matches };
    }

    // ================================================
    // DÉTECTION EMAIL PERSONNEL
    // ================================================
    isPersonalEmail(email) {
        if (!email.from?.emailAddress?.address) return false;
        
        const fromEmail = email.from.emailAddress.address.toLowerCase();
        const toEmails = (email.toRecipients || [])
            .map(r => r.emailAddress?.address?.toLowerCase())
            .filter(Boolean);
        
        // Vérifier si l'expéditeur s'envoie à lui-même
        return toEmails.includes(fromEmail);
    }

    // ================================================
    // EXTRACTION DU CONTENU AMÉLIORÉE
    // ================================================
    extractCompleteContent(email) {
        let allText = '';
        let subject = '';
        
        // Sujet (très important - répété pour augmenter le poids)
        if (email.subject) {
            subject = email.subject;
            allText += (email.subject + ' ').repeat(5);
        }
        
        // Expéditeur
        if (email.from?.emailAddress?.address) {
            allText += email.from.emailAddress.address + ' ';
        }
        if (email.from?.emailAddress?.name) {
            allText += email.from.emailAddress.name + ' ';
        }
        
        // Destinataires principaux
        if (email.toRecipients && Array.isArray(email.toRecipients)) {
            email.toRecipients.forEach(recipient => {
                if (recipient.emailAddress?.address) {
                    allText += recipient.emailAddress.address + ' ';
                }
                if (recipient.emailAddress?.name) {
                    allText += recipient.emailAddress.name + ' ';
                }
            });
        }
        
        // Destinataires en copie (CC)
        if (email.ccRecipients && Array.isArray(email.ccRecipients)) {
            email.ccRecipients.forEach(recipient => {
                if (recipient.emailAddress?.address) {
                    allText += recipient.emailAddress.address + ' ';
                }
                if (recipient.emailAddress?.name) {
                    allText += recipient.emailAddress.name + ' ';
                }
            });
        }
        
        // Corps
        if (email.bodyPreview) {
            allText += email.bodyPreview + ' ';
        }
        if (email.body?.content) {
            allText += this.cleanHtml(email.body.content) + ' ';
        }
        
        return {
            text: allText.toLowerCase().trim(),
            subject: subject.toLowerCase(),
            domain: this.extractDomain(email.from?.emailAddress?.address),
            hasHtml: !!(email.body?.content && email.body.content.includes('<')),
            length: allText.length
        };
    }

    // ================================================
    // NETTOYAGE HTML
    // ================================================
    cleanHtml(html) {
        if (!html) return '';
        
        return html
            .replace(/<a[^>]*>(.*?)<\/a>/gi, ' $1 ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&[^;]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ================================================
    // EXTRACTION DOMAINE
    // ================================================
    extractDomain(email) {
        if (!email || !email.includes('@')) return 'unknown';
        return email.split('@')[1]?.toLowerCase() || 'unknown';
    }

    // ================================================
    // RECHERCHE DE TEXTE AMÉLIORÉE
    // ================================================
    findInText(text, keyword) {
        if (!text || !keyword) return false;
        
        // Normaliser le texte et le mot-clé
        const normalizedText = text.toLowerCase()
            .replace(/[éèêë]/g, 'e')
            .replace(/[àâä]/g, 'a')
            .replace(/[ùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[îï]/g, 'i')
            .replace(/[ôö]/g, 'o')
            .replace(/'/g, '\'')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ');
        
        const normalizedKeyword = keyword.toLowerCase()
            .replace(/[éèêë]/g, 'e')
            .replace(/[àâä]/g, 'a')
            .replace(/[ùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[îï]/g, 'i')
            .replace(/[ôö]/g, 'o')
            .replace(/'/g, '\'')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ');
        
        // Recherche directe
        if (normalizedText.includes(normalizedKeyword)) {
            return true;
        }
        
        // Pour les mots simples, vérifier s'ils sont présents comme mot complet
        if (!normalizedKeyword.includes(' ')) {
            const wordBoundaryPattern = `\\b${this.escapeRegex(normalizedKeyword)}\\b`;
            try {
                const regex = new RegExp(wordBoundaryPattern, 'i');
                if (regex.test(normalizedText)) {
                    return true;
                }
            } catch (e) {
                // Continuer si regex échoue
            }
        }
        
        // Recherche avec espaces flexibles pour les phrases
        if (normalizedKeyword.includes(' ')) {
            const flexiblePattern = normalizedKeyword
                .split(' ')
                .filter(word => word.length > 0)
                .map(word => this.escapeRegex(word))
                .join('\\s+');
            try {
                const regex = new RegExp(flexiblePattern, 'i');
                return regex.test(normalizedText);
            } catch (e) {
                return false;
            }
        }
        
        return false;
    }

    // ================================================
    // CALCUL DE CONFIANCE AJUSTÉ
    // ================================================
    calculateConfidence(score) {
        if (score.hasAbsolute) return 0.95;
        if (score.total >= 200) return 0.90;
        if (score.total >= 150) return 0.85;
        if (score.total >= 100) return 0.80;
        if (score.total >= 80) return 0.75;
        if (score.total >= 60) return 0.70;
        if (score.total >= 40) return 0.60;
        if (score.total >= 30) return 0.55;
        return 0.40;
    }

    // ================================================
    // MÉTHODES PUBLIQUES
    // ================================================
    getCategories() {
        return this.categories;
    }
    
    getCategory(categoryId) {
        if (categoryId === 'all') {
            return { id: 'all', name: 'Tous', icon: '📧', color: '#1e293b' };
        }
        if (categoryId === 'other') {
            return { id: 'other', name: 'Non classé', icon: '❓', color: '#64748b' };
        }
        if (categoryId === 'spam') {
            return { id: 'spam', name: 'Spam', icon: '🚫', color: '#dc2626' };
        }
        return this.categories[categoryId] || null;
    }
    
    getCategoryStats() {
        const stats = {
            totalCategories: Object.keys(this.categories).length,
            totalKeywords: 0,
            absoluteKeywords: 0,
            strongKeywords: 0,
            weakKeywords: 0
        };
        
        for (const keywords of Object.values(this.weightedKeywords)) {
            if (keywords.absolute) stats.absoluteKeywords += keywords.absolute.length;
            if (keywords.strong) stats.strongKeywords += keywords.strong.length;
            if (keywords.weak) stats.weakKeywords += keywords.weak.length;
        }
        
        stats.totalKeywords = stats.absoluteKeywords + stats.strongKeywords + stats.weakKeywords;
        return stats;
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    // ================================================
    // MÉTHODE UTILITAIRE POUR ÉCHAPPER LES REGEX
    // ================================================
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // ================================================
    // MÉTHODE DE TEST AMÉLIORÉE
    // ================================================
    testEmail(subject, expectedCategory = null) {
        const testEmail = {
            subject: subject,
            body: { content: 'Test content' },
            from: { emailAddress: { address: 'test@example.com' } },
            toRecipients: [{ emailAddress: { address: 'user@example.com' } }]
        };
        
        const result = this.analyzeEmail(testEmail);
        
        console.log('\n[CategoryManager] TEST RESULT:');
        console.log(`Subject: "${subject}"`);
        console.log(`Category: ${result.category} (expected: ${expectedCategory || 'any'})`);
        console.log(`Score: ${result.score}pts`);
        console.log(`Confidence: ${Math.round(result.confidence * 100)}%`);
        console.log(`Matches:`, result.matchedPatterns);
        
        if (expectedCategory && result.category !== expectedCategory) {
            console.log(`❌ FAILED - Expected ${expectedCategory}, got ${result.category}`);
        } else {
            console.log('✅ SUCCESS');
        }
        
        return result;
    }

    // ================================================
    // MÉTHODE POUR METTRE À JOUR L'EMAIL UTILISATEUR
    // ================================================
    setCurrentUserEmail(email) {
        if (email) {
            localStorage.setItem('currentUserInfo', JSON.stringify({ email: email }));
            if (this.debugMode) {
                console.log('[CategoryManager] Email utilisateur défini:', email);
            }
        }
    }
}

// Créer l'instance globale
window.categoryManager = new CategoryManager();

console.log('✅ CategoryManager v16.1 loaded - Correction CC et exclusion spam');
