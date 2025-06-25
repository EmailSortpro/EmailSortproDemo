// EmailDeduplicationManager.js - Version 2.0 - MODULE DE DÉDUPLICATION CORRIGÉ
console.log('[EmailDeduplicationManager] 🚀 Création nouvelle instance v2.0...');

class EmailDeduplicationManager {
    constructor() {
        this.duplicateGroups = new Map();
        this.conversationThreads = new Map();
        this.emailIndex = new Map();
        this.stats = {
            totalEmails: 0,
            duplicatesFound: 0,
            conversationsFound: 0,
            spaceReclaimed: 0
        };
        
        console.log('[EmailDeduplicationManager] ✅ Module initialisé v2.0');
    }

    // ================================================
    // MÉTHODES PRINCIPALES
    // ================================================
    
    analyzeDuplicates(emails) {
        if (!Array.isArray(emails)) {
            console.warn('[EmailDeduplicationManager] emails doit être un tableau');
            return { duplicateGroups: new Map(), stats: this.stats };
        }

        console.log(`[EmailDeduplicationManager] 🔍 Analyse de ${emails.length} emails...`);
        
        this.reset();
        this.stats.totalEmails = emails.length;
        
        // Indexer tous les emails
        emails.forEach(email => {
            this.indexEmail(email);
        });
        
        // Identifier les doublons
        this.findDuplicates();
        
        // Identifier les conversations
        this.findConversations();
        
        console.log('[EmailDeduplicationManager] ✅ Analyse terminée:', this.stats);
        
        return {
            duplicateGroups: this.duplicateGroups,
            conversationThreads: this.conversationThreads,
            stats: this.stats
        };
    }

    indexEmail(email) {
        if (!email || !email.id) return;
        
        // Créer une clé de déduplication
        const dedupKey = this.createDedupKey(email);
        
        if (!this.emailIndex.has(dedupKey)) {
            this.emailIndex.set(dedupKey, []);
        }
        
        this.emailIndex.get(dedupKey).push(email);
    }

    createDedupKey(email) {
        // Clé basée sur: expéditeur + sujet normalisé + date approximative
        const sender = email.from?.emailAddress?.address || 'unknown';
        const subject = this.normalizeSubject(email.subject || '');
        const date = email.receivedDateTime ? 
            new Date(email.receivedDateTime).toISOString().split('T')[0] : 
            'unknown';
        
        return `${sender}|${subject}|${date}`;
    }

    normalizeSubject(subject) {
        // Retirer les préfixes RE:, FW:, etc.
        return subject
            .toLowerCase()
            .replace(/^(re:|fw:|fwd:|tr:|rép:|réf:)\s*/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    findDuplicates() {
        this.emailIndex.forEach((emails, key) => {
            if (emails.length > 1) {
                // Trier par date pour garder le plus récent
                emails.sort((a, b) => 
                    new Date(b.receivedDateTime) - new Date(a.receivedDateTime)
                );
                
                this.duplicateGroups.set(key, {
                    original: emails[0],
                    duplicates: emails.slice(1),
                    count: emails.length,
                    spaceWasted: this.calculateSpaceWasted(emails.slice(1))
                });
                
                this.stats.duplicatesFound += emails.length - 1;
            }
        });
    }

    findConversations() {
        // Grouper par sujet normalisé
        const subjectGroups = new Map();
        
        this.emailIndex.forEach((emails) => {
            emails.forEach(email => {
                const normalizedSubject = this.normalizeSubject(email.subject || '');
                
                if (!subjectGroups.has(normalizedSubject)) {
                    subjectGroups.set(normalizedSubject, []);
                }
                
                subjectGroups.get(normalizedSubject).push(email);
            });
        });
        
        // Identifier les conversations (plus de 2 emails avec le même sujet)
        subjectGroups.forEach((emails, subject) => {
            if (emails.length > 2) {
                // Trier par date
                emails.sort((a, b) => 
                    new Date(a.receivedDateTime) - new Date(b.receivedDateTime)
                );
                
                this.conversationThreads.set(subject, {
                    subject: emails[0].subject || subject,
                    emails: emails,
                    participants: this.extractParticipants(emails),
                    count: emails.length,
                    dateRange: {
                        start: emails[0].receivedDateTime,
                        end: emails[emails.length - 1].receivedDateTime
                    }
                });
                
                this.stats.conversationsFound++;
            }
        });
    }

    extractParticipants(emails) {
        const participants = new Set();
        
        emails.forEach(email => {
            if (email.from?.emailAddress?.address) {
                participants.add(email.from.emailAddress.address);
            }
            
            if (email.toRecipients) {
                email.toRecipients.forEach(recipient => {
                    if (recipient.emailAddress?.address) {
                        participants.add(recipient.emailAddress.address);
                    }
                });
            }
        });
        
        return Array.from(participants);
    }

    calculateSpaceWasted(duplicates) {
        let totalSize = 0;
        
        duplicates.forEach(email => {
            // Estimation approximative de la taille
            const subjectSize = (email.subject || '').length;
            const bodySize = (email.bodyPreview || '').length * 10; // Estimation
            const attachmentsSize = email.hasAttachments ? 500000 : 0; // 500KB par défaut
            
            totalSize += subjectSize + bodySize + attachmentsSize;
        });
        
        this.stats.spaceReclaimed += totalSize;
        return totalSize;
    }

    // ================================================
    // ACTIONS SUR LES DOUBLONS
    // ================================================
    
    async removeDuplicates(duplicateGroups) {
        console.log('[EmailDeduplicationManager] 🗑️ Suppression des doublons...');
        
        const toDelete = [];
        
        duplicateGroups.forEach(group => {
            toDelete.push(...group.duplicates.map(d => d.id));
        });
        
        if (toDelete.length > 0) {
            console.log(`[EmailDeduplicationManager] Suppression de ${toDelete.length} doublons`);
            
            // Appeler EmailScanner pour supprimer
            if (window.emailScanner?.performBatchAction) {
                await window.emailScanner.performBatchAction(toDelete, 'delete');
            }
            
            return toDelete.length;
        }
        
        return 0;
    }

    // ================================================
    // MÉTHODES D'ANALYSE
    // ================================================
    
    getSummary() {
        return {
            ...this.stats,
            duplicateGroups: this.duplicateGroups.size,
            conversations: this.conversationThreads.size,
            potentialSavings: this.formatBytes(this.stats.spaceReclaimed)
        };
    }

    getDuplicatesForEmail(emailId) {
        for (const [key, group] of this.duplicateGroups) {
            if (group.original.id === emailId || 
                group.duplicates.some(d => d.id === emailId)) {
                return group;
            }
        }
        return null;
    }

    getConversationForEmail(emailId) {
        for (const [subject, thread] of this.conversationThreads) {
            if (thread.emails.some(e => e.id === emailId)) {
                return thread;
            }
        }
        return null;
    }

    // ================================================
    // UTILITAIRES
    // ================================================
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    reset() {
        this.duplicateGroups.clear();
        this.conversationThreads.clear();
        this.emailIndex.clear();
        this.stats = {
            totalEmails: 0,
            duplicatesFound: 0,
            conversationsFound: 0,
            spaceReclaimed: 0
        };
    }

    // ================================================
    // EXPORT DES RÉSULTATS
    // ================================================
    
    exportAnalysis() {
        const analysis = {
            summary: this.getSummary(),
            duplicates: [],
            conversations: []
        };
        
        // Exporter les groupes de doublons
        this.duplicateGroups.forEach((group, key) => {
            analysis.duplicates.push({
                key,
                original: {
                    id: group.original.id,
                    subject: group.original.subject,
                    from: group.original.from?.emailAddress?.address,
                    date: group.original.receivedDateTime
                },
                duplicatesCount: group.count - 1,
                spaceWasted: this.formatBytes(group.spaceWasted)
            });
        });
        
        // Exporter les conversations
        this.conversationThreads.forEach((thread, subject) => {
            analysis.conversations.push({
                subject: thread.subject,
                emailsCount: thread.count,
                participants: thread.participants,
                dateRange: thread.dateRange
            });
        });
        
        return analysis;
    }
}

// ================================================
// FONCTION D'INTÉGRATION GLOBALE
// ================================================
window.integrateEmailDeduplication = function() {
    console.log('[Integration] 🔗 Intégration de la déduplication...');
    
    // Vérifier que EmailScanner existe
    if (!window.emailScanner) {
        console.warn('[Integration] EmailScanner non disponible, report de l\'intégration...');
        setTimeout(() => window.integrateEmailDeduplication(), 1000);
        return;
    }
    
    // Ajouter la méthode de déduplication à EmailScanner si elle n'existe pas
    if (!window.emailScanner.analyzeForDuplicates) {
        window.emailScanner.analyzeForDuplicates = function() {
            const emails = this.getAllEmails();
            return window.emailDeduplicationManager.analyzeDuplicates(emails);
        };
    }
    
    // Ajouter la méthode de suppression des doublons si elle n'existe pas
    if (!window.emailScanner.removeDuplicateEmails) {
        window.emailScanner.removeDuplicateEmails = async function() {
            const analysis = this.analyzeForDuplicates();
            if (analysis.duplicateGroups.size > 0) {
                return await window.emailDeduplicationManager.removeDuplicates(analysis.duplicateGroups);
            }
            return 0;
        };
    }
    
    console.log('[Integration] ✅ Déduplication intégrée avec succès');
};

// ================================================
// INITIALISATION
// ================================================
if (window.emailDeduplicationManager) {
    console.log('[EmailDeduplicationManager] 🔄 Nettoyage ancienne instance...');
    delete window.emailDeduplicationManager;
}

window.emailDeduplicationManager = new EmailDeduplicationManager();

// Intégrer après un court délai pour s'assurer que EmailScanner est prêt
setTimeout(() => {
    try {
        window.integrateEmailDeduplication();
    } catch (error) {
        console.error('[EmailDeduplicationManager] Erreur intégration:', error);
    }
}, 100);

console.log('✅ EmailDeduplicationManager v2.0 loaded - Module de gestion des doublons');
