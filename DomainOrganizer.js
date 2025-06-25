// ModernDomainOrganizer.js - Version corrigée avec gestion d'erreurs complète
// Interface compacte et optimisée - SEULE LA PAGE PLAN MODIFIÉE

class ModernDomainOrganizer {
    constructor() {
        this.isProcessing = false;
        this.currentStep = 'introduction';
        this.scanResults = null;
        this.organizationPlan = new Map();
        this.allFolders = new Map();
        this.emailsByDomain = new Map();
        this.totalEmailsScanned = 0;
        this.expandedDomains = new Set();
        
        console.log('[ModernDomainOrganizer] ✅ Initialisé');
    }

    getPageHTML() {
        return `
            <div class="modern-organizer">
                <!-- Header avec progression -->
                <div class="organizer-header">
                    <div class="progress-steps">
                        <div class="step active" data-step="introduction">
                            <div class="step-circle">💡</div>
                            <span>Guide</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step" data-step="configuration">
                            <div class="step-circle">⚙️</div>
                            <span>Config</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step" data-step="scanning">
                            <div class="step-circle">🔍</div>
                            <span>Scan</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step" data-step="plan">
                            <div class="step-circle">📋</div>
                            <span>Plan</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step" data-step="execution">
                            <div class="step-circle">⚡</div>
                            <span>Action</span>
                        </div>
                    </div>
                </div>

                <!-- Contenu principal -->
                <div class="organizer-main">
                    <div class="organizer-content">
                        <!-- Introduction compacte -->
                        <div class="step-content" id="step-introduction">
                            <div class="step-card intro-card">
                                <div class="card-header">
                                    <h2>🎯 Organisateur automatique par domaine</h2>
                                    <p>Créez automatiquement des dossiers par expéditeur (amazon.com, paypal.com...)</p>
                                </div>

                                <div class="intro-compact">
                                    <div class="process-flow">
                                        <div class="flow-step">
                                            <div class="flow-icon">⚙️</div>
                                            <span>Configuration</span>
                                        </div>
                                        <div class="flow-arrow">→</div>
                                        <div class="flow-step">
                                            <div class="flow-icon">🔍</div>
                                            <span>Analyse</span>
                                        </div>
                                        <div class="flow-arrow">→</div>
                                        <div class="flow-step">
                                            <div class="flow-icon">📋</div>
                                            <span>Édition</span>
                                        </div>
                                        <div class="flow-arrow">→</div>
                                        <div class="flow-step">
                                            <div class="flow-icon">⚡</div>
                                            <span>Exécution</span>
                                        </div>
                                    </div>

                                    <div class="example-compact">
                                        <div class="example-side">
                                            <h4>📥 Avant</h4>
                                            <div class="preview-box">
                                                <div class="preview-line">Amazon - Livraison</div>
                                                <div class="preview-line">PayPal - Paiement</div>
                                                <div class="preview-line">Amazon - Promo</div>
                                                <div class="preview-line">GitHub - Notification</div>
                                            </div>
                                        </div>
                                        <div class="example-arrow">→</div>
                                        <div class="example-side">
                                            <h4>📁 Après</h4>
                                            <div class="preview-box">
                                                <div class="preview-line">📁 amazon.com (2)</div>
                                                <div class="preview-line">📁 paypal.com (1)</div>
                                                <div class="preview-line">📁 github.com (1)</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="tips-compact">
                                        <div class="tip-item">
                                            <span class="tip-icon">🧪</span>
                                            <span><strong>Testez :</strong> Créez d'abord les dossiers seulement</span>
                                        </div>
                                        <div class="tip-item">
                                            <span class="tip-icon">📊</span>
                                            <span><strong>Seuil :</strong> 3+ emails par domaine recommandé</span>
                                        </div>
                                        <div class="tip-item">
                                            <span class="tip-icon">🚫</span>
                                            <span><strong>Exclusions :</strong> Gmail/Outlook déjà exclus</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="action-bar">
                                    <div></div>
                                    <button class="btn btn-primary btn-large" onclick="window.modernDomainOrganizer.goToStep('configuration')">
                                        <i class="fas fa-arrow-right"></i>
                                        Commencer l'organisation
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Configuration -->
                        <div class="step-content hidden" id="step-configuration">
                            <div class="step-card">
                                <div class="card-header">
                                    <h2>⚙️ Configuration</h2>
                                    <p>Paramétrez l'analyse selon vos besoins</p>
                                </div>

                                <div class="config-grid">
                                    <div class="config-group">
                                        <label>📅 Période d'analyse</label>
                                        <div class="date-row">
                                            <input type="date" id="startDate" title="Date de début">
                                            <span>→</span>
                                            <input type="date" id="endDate" title="Date de fin">
                                        </div>
                                    </div>

                                    <div class="config-group">
                                        <label>📊 Critères</label>
                                        <div class="criteria-row">
                                            <div class="input-group">
                                                <span>Min emails/domaine</span>
                                                <input type="number" id="minEmails" value="3" min="1" max="50">
                                            </div>
                                            <div class="input-group">
                                                <span>Limite scan</span>
                                                <select id="emailLimit">
                                                    <option value="0">Tous</option>
                                                    <option value="1000">1000</option>
                                                    <option value="2000">2000</option>
                                                    <option value="5000">5000</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="config-group">
                                        <label>🚫 Exclusions (optionnel)</label>
                                        <input type="text" id="excludeDomains" placeholder="domaine1.com, domaine2.com" 
                                               value="gmail.com, outlook.com, hotmail.com, hotmail.fr">
                                        <textarea id="excludeEmails" placeholder="email1@exemple.com&#10;email2@exemple.com" rows="2"></textarea>
                                    </div>
                                </div>

                                <div class="action-bar">
                                    <button class="btn btn-secondary" onclick="window.modernDomainOrganizer.goToStep('introduction')">
                                        <i class="fas fa-arrow-left"></i>
                                        Retour
                                    </button>
                                    <button class="btn btn-primary" id="startScanBtn">
                                        <i class="fas fa-search"></i>
                                        Analyser
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Scanning -->
                        <div class="step-content hidden" id="step-scanning">
                            <div class="step-card">
                                <div class="card-header">
                                    <h2>🔍 Analyse en cours</h2>
                                    <p id="scanStatus">Initialisation...</p>
                                </div>

                                <div class="scan-progress">
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" id="progressBar"></div>
                                        </div>
                                        <div class="progress-text" id="progressPercent">0%</div>
                                    </div>

                                    <div class="scan-stats">
                                        <div class="stat">
                                            <span class="stat-number" id="scannedEmails">0</span>
                                            <span class="stat-label">Emails</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="foundDomains">0</span>
                                            <span class="stat-label">Domaines</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="existingFolders">0</span>
                                            <span class="stat-label">Existants</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="newFoldersNeeded">0</span>
                                            <span class="stat-label">Nouveaux</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Plan - VERSION SIMPLIFIÉE AVEC BOUTON VISIBLE -->
                        <div class="step-content hidden" id="step-plan">
                            <div class="step-card plan-card-simple">
                                <!-- Header condensé -->
                                <div class="card-header-simple">
                                    <h2>📋 Plan d'organisation</h2>
                                </div>

                                <!-- Contenu principal -->
                                <div class="plan-content-simple">
                                    <!-- Stats + Options en ligne -->
                                    <div class="plan-top-bar">
                                        <div class="stats-simple" id="planSummary">
                                            <span><strong>16</strong> Domaines</span>
                                            <span><strong>145</strong> Emails</span>
                                            <span><strong>15</strong> Nouveaux</span>
                                        </div>
                                        <div class="options-simple">
                                            <label><input type="radio" name="executionType" value="folders-only"> 📁 Dossiers</label>
                                            <label><input type="radio" name="executionType" value="complete" checked> ⚡ Complet</label>
                                        </div>
                                        <div class="count-simple">
                                            <span id="selectedEmailsText">145 emails sélectionnés</span>
                                        </div>
                                    </div>

                                    <!-- Contrôles -->
                                    <div class="controls-simple">
                                        <button class="btn-xs" onclick="window.modernDomainOrganizer.selectAllDomains()">✅ Tout</button>
                                        <button class="btn-xs" onclick="window.modernDomainOrganizer.deselectAllDomains()">❌ Rien</button>
                                        <button class="btn-xs" onclick="window.modernDomainOrganizer.expandAllDomains()">📂 Déplier</button>
                                        <button class="btn-xs" onclick="window.modernDomainOrganizer.collapseAllDomains()">📁 Replier</button>
                                    </div>

                                    <!-- Liste des domaines avec hauteur fixe -->
                                    <div class="domains-wrapper">
                                        <div class="domains-container-simple" id="domainsContainer"></div>
                                    </div>
                                </div>

                                <!-- Boutons d'action FIXES en bas -->
                                <div class="action-bar-simple">
                                    <button class="btn btn-secondary" onclick="window.modernDomainOrganizer.goToStep('configuration')">
                                        ← Reconfigurer
                                    </button>
                                    <button class="btn btn-primary btn-execute" id="executeSelectedBtn" onclick="window.modernDomainOrganizer.executeSelectedAction()">
                                        <span id="executeButtonText">⚡ Exécuter</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Execution -->
                        <div class="step-content hidden" id="step-execution">
                            <div class="step-card">
                                <div class="card-header">
                                    <h2>⚡ <span id="executionTitle">Exécution</span></h2>
                                    <p id="executionStatus">Préparation...</p>
                                </div>

                                <div class="execution-progress">
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" id="executionProgressBar"></div>
                                        </div>
                                        <div class="progress-text" id="executionPercent">0%</div>
                                    </div>

                                    <div class="execution-stats">
                                        <div class="stat">
                                            <span class="stat-number" id="foldersCreated">0</span>
                                            <span class="stat-label">Dossiers</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="emailsMoved">0</span>
                                            <span class="stat-label">Emails</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="domainsProcessed">0</span>
                                            <span class="stat-label">Domaines</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-number" id="errorsCount">0</span>
                                            <span class="stat-label">Erreurs</span>
                                        </div>
                                    </div>

                                    <div class="execution-log" id="executionLog"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Success -->
                        <div class="step-content hidden" id="step-success">
                            <div class="step-card success-card">
                                <div class="success-content">
                                    <div class="success-icon">🎉</div>
                                    <h2 id="successTitle">Terminé !</h2>
                                    <div class="success-report" id="successReport"></div>
                                </div>

                                <div class="action-bar">
                                    <button class="btn btn-outline" onclick="window.modernDomainOrganizer.goToStep('plan')">
                                        <i class="fas fa-arrow-left"></i>
                                        Retour
                                    </button>
                                    <button class="btn btn-primary" onclick="window.modernDomainOrganizer.restart()">
                                        <i class="fas fa-redo"></i>
                                        Recommencer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal d'édition -->
                <div class="email-modal hidden" id="emailModal">
                    <div class="email-modal-content">
                        <div class="email-modal-header">
                            <h3>📧 Édition email</h3>
                            <button class="modal-close" onclick="window.modernDomainOrganizer.closeEmailModal()">×</button>
                        </div>
                        <div class="email-modal-body" id="emailModalBody"></div>
                        <div class="email-modal-footer">
                            <button class="btn btn-secondary" onclick="window.modernDomainOrganizer.closeEmailModal()">
                                Fermer
                            </button>
                            <button class="btn btn-primary" id="saveEmailBtn">
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
        .modern-organizer {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    box-sizing: border-box;
}

/* Styles pour l'arborescence hiérarchique */
.folder-separator {
    padding: 8px 24px;
    background: linear-gradient(135deg, #e5e7eb, #d1d5db);
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    border-top: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    margin: 4px 0;
}

.folder-path {
    font-size: 10px;
    color: #9ca3af;
    font-style: italic;
    display: block;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
}

.folder-option {
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
}

.folder-option:hover {
    border-left-color: #3b82f6;
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
}

.folder-option.selected {
    border-left-color: #1d4ed8;
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Indentation visuelle pour la hiérarchie */
.folder-option[style*="padding-left"] {
    position: relative;
}

.folder-option[style*="padding-left"]::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, transparent 0%, #e5e7eb 20%, #e5e7eb 80%, transparent 100%);
}
    
/* Modal de sélection de dossiers */
.folder-select-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
}

.folder-select-modal.hidden {
    display: none;
}

.folder-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}

.folder-modal-header {
    padding: 20px 24px;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    flex-shrink: 0;
}

.folder-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
}

.modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.modal-close:hover {
    background: #f3f4f6;
    color: #374151;
}

.folder-modal-body {
    flex: 1;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.folder-search-section {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafbfc;
    flex-shrink: 0;
}

.search-container {
    position: relative;
    margin-bottom: 8px;
}

.folder-search-input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
    box-sizing: border-box;
}

.folder-search-input::placeholder {
    color: #9ca3af;
}

.folder-search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #e5e7eb;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    transition: all 0.2s;
}

.search-clear:hover {
    background: #d1d5db;
    color: #374151;
}

.search-stats {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

.folder-options-section {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    min-height: 0;
}

.special-options {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
}

.folder-separator {
    padding: 8px 24px;
    background: #e5e7eb;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
}

.folder-tree {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px 0;
}

.folder-option {
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 4px solid transparent;
    display: flex;
    align-items: center;
    min-height: 44px;
}

.folder-option:hover {
    background: #f0f9ff;
    border-left-color: #bfdbfe;
}

.folder-option.selected {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    border-left-color: #3b82f6;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.folder-option.special-option {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 12px 16px;
    border-left: 4px solid transparent;
}

.folder-option.special-option:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.folder-option.special-option.selected {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.folder-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.folder-spacer {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.folder-icon {
    font-size: 16px;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.folder-details {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.folder-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.folder-path {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

.folder-count {
    font-size: 11px;
    color: #9ca3af;
    flex-shrink: 0;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 8px;
}

.custom-folder-section {
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    background: #fef3c7;
    flex-shrink: 0;
}

.custom-folder-section.hidden {
    display: none;
}

.custom-folder-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.custom-folder-input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
}

.custom-folder-name-input {
    padding: 10px 12px;
    border: 2px solid #f59e0b;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    color: #92400e;
    box-sizing: border-box;
}

.custom-folder-name-input:focus {
    outline: none;
    border-color: #d97706;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.folder-modal-footer {
    padding: 16px 24px;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    flex-shrink: 0;
}

.no-folders, .error-folders {
    padding: 40px 24px;
    text-align: center;
    color: #6b7280;
    font-style: italic;
}

.error-folders {
    color: #dc2626;
}

/* Highlight de recherche */
.folder-name mark {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* Scrollbar personnalisée */
.folder-tree::-webkit-scrollbar {
    width: 6px;
}

.folder-tree::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.folder-tree::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.folder-tree::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive pour le modal */
@media (max-width: 768px) {
    .folder-modal-content {
        max-width: 95%;
        max-height: 90vh;
        border-radius: 12px;
    }
    
    .folder-modal-header {
        padding: 16px 20px;
    }
    
    .folder-modal-header h3 {
        font-size: 16px;
    }
    
    .folder-search-section {
        padding: 12px 20px;
    }
    
    .folder-search-input {
        padding: 10px 14px 10px 36px;
        font-size: 13px;
    }
    
    .folder-option {
        padding: 10px 20px;
        min-height: 40px;
    }
    
    .folder-option.special-option {
        padding: 10px 14px;
    }
    
    .folder-name {
        font-size: 13px;
    }
    
    .folder-path {
        font-size: 11px;
    }
    
    .custom-folder-section {
        padding: 12px 20px;
    }
    
    .folder-modal-footer {
        padding: 12px 20px;
    }
}

@media (max-width: 480px) {
    .folder-modal-content {
        max-width: 98%;
        max-height: 95vh;
    }
    
    .folder-modal-header {
        padding: 12px 16px;
    }
    
    .folder-search-section {
        padding: 10px 16px;
    }
    
    .folder-option {
        padding: 8px 16px;
        min-height: 36px;
    }
    
    .folder-name {
        font-size: 12px;
    }
    
    .folder-tree {
        max-height: 250px;
    }
}
.folder-details {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.system-folder {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border-left-color: #0ea5e9 !important;
}

.system-folder .folder-name {
    font-weight: 600;
    color: #0369a1;
}

.system-badge {
    background: #0ea5e9;
    color: white;
    font-size: 8px;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.folder-count {
    font-size: 10px;
    color: #9ca3af;
    font-weight: 500;
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 8px;
    white-space: nowrap;
}

.system-folder .folder-count {
    background: #bfdbfe;
    color: #1e40af;
}

.error-folder-node {
    padding: 8px 24px;
    color: #dc2626;
    font-style: italic;
    font-size: 12px;
    background: #fef2f2;
    border-left: 3px solid #fca5a5;
}

/* Styles pour les différents types de dossiers */
.folder-option[data-folder-name*="amazon"] .folder-icon::after {
    content: "🛒";
}

.folder-option[data-folder-name*="paypal"] .folder-icon::after,
.folder-option[data-folder-name*="payment"] .folder-icon::after {
    content: "💳";
}

.folder-option[data-folder-name*="social"] .folder-icon::after,
.folder-option[data-folder-name*="facebook"] .folder-icon::after,
.folder-option[data-folder-name*="instagram"] .folder-icon::after {
    content: "👥";
}

.folder-option[data-folder-name*="news"] .folder-icon::after,
.folder-option[data-folder-name*="newsletter"] .folder-icon::after {
    content: "📰";
}

/* Amélioration de la recherche avec highlighting */
.folder-name mark {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #92400e;
    padding: 1px 3px;
    border-radius: 3px;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
}

/* Animation pour l'expansion des dossiers */
.folder-children {
    overflow: hidden;
    transition: all 0.3s ease;
    max-height: 0;
}

.folder-children:not(.hidden) {
    max-height: 2000px;
}

/* Lignes de connexion pour la hiérarchie */
.folder-option {
    position: relative;
}

.folder-option::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 50%;
    width: 1px;
    background: #e5e7eb;
    display: none;
}

.folder-children .folder-option::before {
    display: block;
}

.folder-children .folder-option:last-child::before {
    bottom: 100%;
}

/* Responsive pour l'arborescence */
@media (max-width: 768px) {
    .folder-details {
        gap: 4px;
    }
    
    .folder-name {
        font-size: 12px;
    }
    
    .folder-count {
        font-size: 9px;
        padding: 1px 3px;
    }
    
    .system-badge {
        font-size: 7px;
        padding: 1px 3px;
    }
    
    .folder-option {
        min-height: 36px;
        padding: 6px 16px;
    }
    
    .folder-icon {
        font-size: 14px;
    }
}

/* Scroll bars personnalisées pour le modal */
.folder-tree::-webkit-scrollbar {
    width: 6px;
}

.folder-tree::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.folder-tree::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.folder-tree::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* États de hover améliorés */
.folder-option:hover {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border-left-color: #3b82f6;
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.system-folder:hover {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

/* Animation d'apparition pour les résultats de recherche */
@keyframes highlightResult {
    0% { 
        background: #fef3c7;
        transform: scale(1.02);
    }
    100% { 
        background: transparent;
        transform: scale(1);
    }
}

.folder-option.search-result {
    animation: highlightResult 0.6s ease-out;
}

/* Modal de sélection de dossiers */
.folder-select-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
}

.folder-select-modal.hidden {
    display: none;
}

.folder-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 90%;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}

.folder-modal-header {
    padding: 20px 24px;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    flex-shrink: 0;
}

.folder-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
}

.folder-modal-body {
    flex: 1;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.folder-search-section {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafbfc;
    flex-shrink: 0;
}

.search-container {
    position: relative;
    margin-bottom: 8px;
}

.folder-search-input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
}

.folder-search-input::placeholder {
    color: #9ca3af;
}

.folder-search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #e5e7eb;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    transition: all 0.2s;
}

.search-clear:hover {
    background: #d1d5db;
    color: #374151;
}

.search-stats {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

.folder-options-section {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    min-height: 0;
}

.special-options {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
}

.folder-separator {
    padding: 8px 24px;
    background: #e5e7eb;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
}

.folder-tree {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
}

.folder-option {
    padding: 10px 24px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 4px solid transparent;
    display: flex;
    align-items: center;
    min-height: 44px;
}

.folder-option:hover {
    background: #f0f9ff;
    border-left-color: #bfdbfe;
}

.folder-option.selected {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    border-left-color: #3b82f6;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.folder-option.special-option {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 12px 16px;
}

.folder-option.special-option:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.folder-option.special-option.selected {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.folder-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.folder-expand {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #6b7280;
    font-size: 12px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.folder-expand:hover {
    background: #e5e7eb;
    color: #374151;
}

.folder-spacer {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.folder-icon {
    font-size: 16px;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.folder-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.folder-path {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

.folder-count {
    font-size: 11px;
    color: #9ca3af;
    flex-shrink: 0;
}

.folder-children {
    transition: all 0.2s;
}

.folder-children.hidden {
    display: none;
}

.custom-folder-section {
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    background: #fef3c7;
    flex-shrink: 0;
}

.custom-folder-section.hidden {
    display: none;
}

.custom-folder-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.custom-folder-input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
}

.custom-folder-name-input {
    padding: 10px 12px;
    border: 2px solid #f59e0b;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    color: #92400e;
}

.custom-folder-name-input:focus {
    outline: none;
    border-color: #d97706;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.folder-modal-footer {
    padding: 16px 24px;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    flex-shrink: 0;
}

.no-folders, .error-folders {
    padding: 40px 24px;
    text-align: center;
    color: #6b7280;
    font-style: italic;
}

.error-folders {
    color: #dc2626;
}

/* Highlight de recherche */
.folder-name mark {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* Responsive pour le modal */
@media (max-width: 768px) {
    .folder-modal-content {
        max-width: 95%;
        max-height: 90vh;
        border-radius: 12px;
    }
    
    .folder-modal-header {
        padding: 16px 20px;
    }
    
    .folder-modal-header h3 {
        font-size: 16px;
    }
    
    .folder-search-section {
        padding: 12px 20px;
    }
    
    .folder-search-input {
        padding: 10px 14px 10px 36px;
        font-size: 13px;
    }
    
    .folder-option {
        padding: 8px 20px;
        min-height: 40px;
    }
    
    .folder-option.special-option {
        padding: 10px 14px;
    }
    
    .folder-name {
        font-size: 13px;
    }
    
    .folder-path {
        font-size: 11px;
    }
    
    .custom-folder-section {
        padding: 12px 20px;
    }
    
    .folder-modal-footer {
        padding: 12px 20px;
    }
    
    .folder-tree {
        max-height: 300px;
    }
}

@media (max-width: 480px) {
    .folder-modal-content {
        max-width: 98%;
        max-height: 95vh;
    }
    
    .folder-modal-header {
        padding: 12px 16px;
    }
    
    .folder-search-section {
        padding: 10px 16px;
    }
    
    .folder-option {
        padding: 6px 16px;
        min-height: 36px;
    }
    
    .folder-name {
        font-size: 12px;
    }
    
    .folder-tree {
        max-height: 250px;
    }
}

.organizer-header {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    flex-shrink: 0;
}

.organizer-main {
    flex: 1;
    overflow-y: auto;
}

.progress-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 80px;
    opacity: 0.5;
    transition: opacity 0.3s;
}

.step.active, .step.completed {
    opacity: 1;
}

.step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: background 0.3s;
}

.step.active .step-circle {
    background: #3b82f6;
    color: white;
}

.step.completed .step-circle {
    background: #10b981;
    color: white;
}

.step-line {
    flex: 1;
    height: 2px;
    background: #e5e7eb;
    margin: 0 -5px;
}

.step span {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
}

.step.active span {
    color: #1f2937;
    font-weight: 600;
}

.step-content {
    animation: fadeIn 0.3s ease;
}

.step-content.hidden {
    display: none;
}

.step-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    min-height: 500px;
}

.card-header {
    text-align: center;
    margin-bottom: 24px;
}

.card-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #1f2937;
}

.card-header p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

/* VERSION SIMPLIFIÉE - BOUTON GARANTI VISIBLE */
.plan-card-simple {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    height: calc(100vh - 200px);
    max-height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Header condensé */
.card-header-simple {
    padding: 10px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
}

.card-header-simple h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #1f2937;
}

/* Contenu principal */
.plan-content-simple {
    flex: 1;
    padding: 12px 16px 0 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
}

/* Top bar avec stats + options */
.plan-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    flex-shrink: 0;
    gap: 12px;
    flex-wrap: wrap;
}

.stats-simple {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 12px;
    color: #374151;
}

.stats-simple strong {
    font-size: 14px;
    color: #1f2937;
}

.options-simple {
    display: flex;
    gap: 12px;
    align-items: center;
}

.options-simple label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #374151;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    background: white;
    border: 1px solid #d1d5db;
    transition: all 0.2s;
}

.options-simple label:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.options-simple input[type="radio"] {
    width: 12px;
    height: 12px;
}

.count-simple {
    font-size: 11px;
    color: #0369a1;
    font-weight: 500;
    white-space: nowrap;
}

/* Contrôles */
.controls-simple {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
}

.btn-xs {
    padding: 4px 8px;
    font-size: 10px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    color: #374151;
    transition: all 0.2s;
}

.btn-xs:hover {
    background: #f9fafb;
    border-color: #3b82f6;
}

/* Wrapper pour les domaines */
.domains-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.domains-container-simple {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    flex: 1;
    overflow-y: auto;
    min-height: 250px;
    max-height: 400px;
}

/* Action bar FIXE en bas */
.action-bar-simple {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 2px solid #e5e7eb;
    flex-shrink: 0;
    background: #fafbfc;
    border-radius: 0 0 12px 12px;
    position: relative;
    z-index: 10;
}

.btn-execute {
    background: #3b82f6 !important;
    color: white !important;
    padding: 10px 20px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    border: none !important;
    cursor: pointer !important;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
    transition: all 0.2s !important;
}

.btn-execute:hover {
    background: #2563eb !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
}

/* Introduction compacte */
.intro-compact {
    max-width: 900px;
    margin: 0 auto;
}

.process-flow {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.flow-step {
    text-align: center;
    min-width: 120px;
}

.flow-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.flow-step h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #1f2937;
}

.flow-step p {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
}

.flow-arrow {
    font-size: 16px;
    color: #3b82f6;
    font-weight: bold;
}

.example-compact {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
}

.example-side {
    flex: 1;
    max-width: 200px;
}

.example-side h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: #1f2937;
}

.preview-box {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
}

.preview-line {
    font-size: 12px;
    padding: 4px 0;
    color: #374151;
}

.example-arrow {
    font-size: 20px;
    color: #3b82f6;
    font-weight: bold;
}

.tips-compact {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
}

.tip-icon {
    font-size: 16px;
    flex-shrink: 0;
}

/* Configuration */
.config-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
    margin: 0 auto;
}

.config-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.config-group label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.date-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-row input {
    flex: 1;
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
}

.criteria-row {
    display: flex;
    gap: 16px;
}

.input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.input-group span {
    font-size: 12px;
    color: #6b7280;
}

.input-group input, .input-group select {
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
}

.config-group input[type="text"], .config-group textarea {
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    resize: none;
}

.config-group input:focus, .config-group select:focus, .config-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Progress */
.progress-container {
    position: relative;
    margin-bottom: 20px;
}

.progress-bar {
    width: 100%;
    height: 12px;
    background: #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    width: 0%;
    transition: width 0.4s ease;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: 600;
    color: #1f2937;
}

.scan-stats, .execution-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.stat {
    text-align: center;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.stat-number {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
}

.stat-label {
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
}

/* Plan */
.plan-summary {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    text-align: center;
    flex-shrink: 0;
}

.plan-controls {
    flex-shrink: 0;
}

.domain-item {
    border-bottom: 1px solid #f3f4f6;
}

.domain-item:last-child {
    border-bottom: none;
}

.domain-header {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.domain-header:hover {
    background: #f9fafb;
}

.domain-checkbox {
    width: 16px;
    height: 16px;
}

.domain-expand {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    color: #6b7280;
    font-size: 12px;
}

.domain-info {
    flex: 1;
    min-width: 0;
}

.domain-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
}

.domain-stats {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
}

.domain-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.folder-input {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    min-width: 120px;
}

.action-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
}

.action-new {
    background: #d1fae5;
    color: #065f46;
}

.action-existing {
    background: #e0e7ff;
    color: #3730a3;
}

.domain-content {
    display: none;
    padding: 0 16px 12px 40px;
    background: #fafbfc;
}

.domain-content.expanded {
    display: block;
}

.emails-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
}

/* NOUVEAUX STYLES POUR LES EMAILS AVEC SÉLECTEURS DE DOSSIERS */
.email-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: flex-start;
    gap: 12px;
    font-size: 12px;
    min-height: 80px;
    transition: background-color 0.2s;
}

.email-item:hover {
    background: #f9fafb;
}

.email-item:last-child {
    border-bottom: none;
}

.email-checkbox {
    width: 14px;
    height: 14px;
    margin-top: 2px;
}

.email-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.email-subject {
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    max-width: 100%;
}

.email-from {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.email-date {
    font-size: 9px;
    color: #9ca3af;
    line-height: 1.2;
    white-space: nowrap;
}

/* Styles pour les sélecteurs de dossiers d'emails */
.email-folder-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
    flex-shrink: 0;
}

.email-folder-select {
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 11px;
    background: white;
    color: #374151;
    cursor: pointer;
    width: 100%;
    transition: all 0.2s;
}

.email-folder-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.email-folder-select:hover {
    border-color: #9ca3af;
    background: #f9fafb;
}

.custom-folder-input {
    padding: 6px 8px;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    font-size: 11px;
    background: #fef3c7;
    color: #92400e;
    width: 100%;
    transition: all 0.2s;
}

.custom-folder-input:focus {
    outline: none;
    border-color: #d97706;
    box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.1);
    background: #fefce8;
}

.custom-folder-input::placeholder {
    color: #a16207;
    opacity: 0.7;
}

.email-folder-info {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 120px;
    flex-shrink: 0;
}

.custom-folder-badge {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 3px;
    transition: all 0.2s;
}

.custom-folder-badge.new {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #92400e;
    border: 1px solid #f59e0b;
    box-shadow: 0 1px 3px rgba(245, 158, 11, 0.2);
}

.custom-folder-badge.existing {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: 1px solid #3b82f6;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
}

.default-folder-badge {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 500;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    color: #6b7280;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid #d1d5db;
}

/* Animation pour les badges */
.custom-folder-badge.new::before {
    content: "✨";
    animation: sparkle 2s infinite;
}

.custom-folder-badge.existing::before {
    content: "📂";
}

.default-folder-badge::before {
    content: "📁";
}

@keyframes sparkle {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Hover effects pour les badges */
.email-item:hover .custom-folder-badge.new {
    background: linear-gradient(135deg, #fde68a, #fcd34d);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.email-item:hover .custom-folder-badge.existing {
    background: linear-gradient(135deg, #bfdbfe, #93c5fd);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.email-item:hover .default-folder-badge {
    background: linear-gradient(135deg, #e5e7eb, #d1d5db);
    transform: translateY(-1px);
}

.execution-options {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 16px;
    flex-shrink: 0;
}

.option-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
}

.option-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background 0.2s;
}

.option-label:hover {
    background: rgba(255, 255, 255, 0.7);
}

.option-label input[type="radio"] {
    width: 16px;
    height: 16px;
}

.selection-info {
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: #0369a1;
}

/* Execution */
.execution-log {
    max-height: 150px;
    overflow-y: auto;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 11px;
}

.log-entry {
    margin-bottom: 2px;
    color: #6b7280;
    line-height: 1.3;
}

.log-entry.success { color: #059669; }
.log-entry.error { color: #dc2626; }
.log-entry.info { color: #3b82f6; }

/* Success */
.success-card {
    text-align: center;
}

.success-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.success-report {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    text-align: left;
    font-size: 14px;
}

.report-section {
    margin-bottom: 12px;
}

.report-section h4 {
    margin: 0 0 8px 0;
    color: #065f46;
    font-size: 14px;
}

.report-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.report-list li {
    padding: 2px 0;
    color: #047857;
    font-size: 13px;
}

/* Modal */
.email-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.email-modal.hidden {
    display: none;
}

.email-modal-content {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.email-modal-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
}

.email-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
}

.email-modal-body {
    padding: 16px;
    max-height: 50vh;
    overflow-y: auto;
}

.email-modal-footer {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    background: #f9fafb;
}

/* Buttons */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    text-decoration: none;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
}

.btn-secondary:hover {
    background: #e5e7eb;
}

.btn-outline {
    background: transparent;
    color: #374151;
    border: 1px solid #d1d5db;
}

.btn-outline:hover {
    background: #f9fafb;
}

.btn-small {
    padding: 6px 12px;
    font-size: 12px;
}

.btn-large {
    padding: 14px 28px;
    font-size: 16px;
    font-weight: 700;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* RESPONSIVE DESIGN AMÉLIORÉ */
@media (max-width: 768px) {
    .modern-organizer {
        padding: 6px;
    }

    .organizer-header {
        padding: 8px;
        margin-bottom: 8px;
    }

    .step-card {
        padding: 12px;
        min-height: 400px;
    }

    /* Plan mobile simplifié */
    .plan-card-simple {
        height: calc(100vh - 160px);
        max-height: none;
    }

    .card-header-simple {
        padding: 8px 12px;
    }

    .card-header-simple h2 {
        font-size: 16px;
    }

    .plan-content-simple {
        padding: 8px 12px 0 12px;
        gap: 8px;
    }

    .action-bar-simple {
        padding: 10px 12px;
    }

    .plan-top-bar {
        flex-direction: column;
        gap: 8px;
        padding: 6px;
    }

    .stats-simple {
        gap: 10px;
        justify-content: space-around;
        width: 100%;
        font-size: 11px;
    }

    .stats-simple strong {
        font-size: 13px;
    }

    .options-simple {
        gap: 8px;
        justify-content: center;
    }

    .options-simple label {
        font-size: 10px;
        padding: 3px 6px;
    }

    .count-simple {
        font-size: 10px;
        text-align: center;
    }

    .controls-simple {
        gap: 4px;
    }

    .btn-xs {
        padding: 3px 6px;
        font-size: 9px;
    }

    .domains-container-simple {
        min-height: 200px;
        max-height: 300px;
    }

    .btn-execute {
        padding: 8px 16px !important;
        font-size: 12px !important;
    }

    .domain-header {
        padding: 8px 12px;
        gap: 8px;
    }

    .domain-name {
        font-size: 12px;
    }

    .domain-stats {
        font-size: 10px;
    }

    .folder-input {
        font-size: 10px;
        padding: 4px 6px;
        min-width: 80px;
    }

    .action-badge {
        font-size: 8px;
        padding: 1px 4px;
    }

    .emails-list {
        max-height: 150px;
    }

    /* EMAIL MOBILE LAYOUT */
    .email-item {
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto auto;
        gap: 8px;
        padding: 8px 12px;
        min-height: auto;
    }

    .email-checkbox {
        grid-column: 1;
        grid-row: 1;
        margin-top: 1px;
    }

    .email-info {
        grid-column: 2;
        grid-row: 1;
        gap: 2px;
    }

    .email-folder-selector {
        grid-column: 1 / -1;
        grid-row: 2;
        min-width: auto;
        margin-top: 4px;
    }

    .email-folder-info {
        grid-column: 1 / -1;
        grid-row: 3;
        min-width: auto;
        margin-top: 2px;
    }

    .email-folder-select {
        font-size: 10px;
        padding: 4px 6px;
    }

    .custom-folder-input {
        font-size: 10px;
        padding: 4px 6px;
    }

    .custom-folder-badge, .default-folder-badge {
        font-size: 8px;
        padding: 2px 6px;
    }

    .email-subject {
        font-size: 11px;
    }

    .email-from {
        font-size: 9px;
    }

    .email-date {
        font-size: 8px;
    }

    .domain-content {
        padding: 0 12px 8px 28px;
    }

    .btn {
        padding: 6px 12px;
        font-size: 12px;
    }

    .btn-large {
        padding: 8px 16px;
        font-size: 13px;
    }
}

/* TRÈS PETITS ÉCRANS */
@media (max-width: 480px) {
    .email-folder-selector {
        gap: 4px;
    }

    .email-folder-select, .custom-folder-input {
        font-size: 9px;
        padding: 3px 4px;
    }

    .custom-folder-badge, .default-folder-badge {
        font-size: 7px;
        padding: 1px 4px;
    }

    .email-info {
        gap: 1px;
    }

    .email-subject {
        font-size: 10px;
        line-height: 1.2;
    }

    .email-from {
        font-size: 8px;
    }

    .email-date {
        font-size: 7px;
    }
}

.hidden {
    display: none !important;
}

.error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px;
    border-radius: 6px;
    margin: 8px 0;
    font-size: 14px;
}

.warning-message {
    background: #fef3cd;
    border: 1px solid #fbbf24;
    color: #92400e;
    padding: 12px;
    border-radius: 6px;
    margin: 8px 0;
    font-size: 14px;
}

.info-message {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 12px;
    border-radius: 6px;
    margin: 8px 0;
    font-size: 14px;
}
            </style>
        `;
    }

    // Méthodes principales avec gestion d'erreurs renforcée
    async initializePage() {
        try {
            console.log('[ModernDomainOrganizer] Initialisation...');
            
            if (!window.authService?.isAuthenticated()) {
                this.showError('Veuillez vous connecter pour continuer');
                return false;
            }

            this.setupEventListeners();
            this.setDefaultDates();
            
            return true;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur initialisation:', error);
            this.showError('Erreur lors de l\'initialisation: ' + error.message);
            return false;
        }
    }

    setupEventListeners() {
        try {
            // Event listeners pour les boutons principaux
            const startBtn = document.getElementById('startScanBtn');
            const executeBtn = document.getElementById('executeSelectedBtn');
            const saveBtn = document.getElementById('saveEmailBtn');
            
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startAnalysis());
                console.log('[ModernDomainOrganizer] ✅ Event listener startScanBtn ajouté');
            }
            
            if (executeBtn) {
                executeBtn.addEventListener('click', () => this.executeSelectedAction());
                console.log('[ModernDomainOrganizer] ✅ Event listener executeSelectedBtn ajouté');
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveEmailChanges());
                console.log('[ModernDomainOrganizer] ✅ Event listener saveEmailBtn ajouté');
            }
            
            // Event listeners pour les types d'exécution
            document.querySelectorAll('input[name="executionType"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    console.log('[ModernDomainOrganizer] Type d\'exécution changé:', radio.value);
                    this.updateExecutionButton();
                });
            });
            
            console.log('[ModernDomainOrganizer] ✅ Tous les event listeners configurés');
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur setup listeners:', error);
        }
    }

    setDefaultDates() {
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            
            if (startDate) startDate.valueAsDate = thirtyDaysAgo;
            if (endDate) endDate.valueAsDate = today;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur dates par défaut:', error);
        }
    }

    goToStep(stepName) {
        try {
            document.querySelectorAll('.step-content').forEach(content => {
                content.classList.add('hidden');
            });

            const stepElement = document.getElementById(`step-${stepName}`);
            if (stepElement) {
                stepElement.classList.remove('hidden');
                this.updateStepProgress(stepName);
                this.currentStep = stepName;
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur navigation:', error);
        }
    }

    updateStepProgress(currentStep) {
        try {
            const steps = ['introduction', 'configuration', 'scanning', 'plan', 'execution'];
            const currentIndex = steps.indexOf(currentStep);

            document.querySelectorAll('.step').forEach((step, index) => {
                step.classList.remove('active', 'completed');
                
                if (index < currentIndex) {
                    step.classList.add('completed');
                } else if (index === currentIndex) {
                    step.classList.add('active');
                }
            });
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour progression:', error);
        }
    }

    updateExecutionButton() {
        try {
            const executionType = document.querySelector('input[name="executionType"]:checked')?.value;
            const buttonText = document.getElementById('executeButtonText');
            
            if (buttonText) {
                if (executionType === 'folders-only') {
                    buttonText.textContent = 'Créer dossiers';
                } else {
                    buttonText.textContent = 'Exécution complète';
                }
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour bouton:', error);
        }
    }

    executeSelectedAction() {
        try {
            const executionType = document.querySelector('input[name="executionType"]:checked')?.value;
            
            if (executionType === 'folders-only') {
                this.createFoldersOnly();
            } else {
                this.executeOrganization();
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur action sélectionnée:', error);
            this.showError('Erreur lors de l\'exécution: ' + error.message);
        }
    }

    // Analyse avec gestion d'erreurs
    async startAnalysis() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.clearErrors();
            this.goToStep('scanning');
            
            const config = this.getConfigurationFromForm();
            if (!this.validateConfiguration(config)) {
                this.goToStep('configuration');
                return;
            }
            
            console.log('[ModernDomainOrganizer] Configuration:', config);
            
            // Reset
            this.emailsByDomain.clear();
            this.allFolders.clear();
            this.organizationPlan.clear();
            this.expandedDomains.clear();
            
            // Étapes avec gestion d'erreurs
            await this.executeWithProgress([
                { percent: 5, message: 'Chargement des dossiers...', action: () => this.loadAllFolders() },
                { percent: 20, message: 'Scan des emails...', action: () => this.scanEmails(config) },
                { percent: 70, message: 'Analyse des domaines...', action: (emails) => this.analyzeDomains(emails, config) },
                { percent: 90, message: 'Création du plan...', action: () => this.createOrganizationPlan() },
                { percent: 100, message: 'Terminé !', action: () => this.showOrganizationPlan() }
            ]);
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur analyse:', error);
            this.showError('Erreur lors de l\'analyse: ' + error.message);
            this.goToStep('configuration');
        } finally {
            this.isProcessing = false;
        }
    }

    async executeWithProgress(steps) {
        let result = null;
        
        for (const step of steps) {
            try {
                this.updateProgress(step.percent, step.message);
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (step.action) {
                    result = await step.action(result);
                }
            } catch (error) {
                throw new Error(`${step.message} - ${error.message}`);
            }
        }
        
        return result;
    }

    validateConfiguration(config) {
        try {
            if (!config.startDate || !config.endDate) {
                this.showError('Veuillez sélectionner une période valide');
                return false;
            }
            
            const startDate = new Date(config.startDate);
            const endDate = new Date(config.endDate);
            
            if (startDate >= endDate) {
                this.showError('La date de début doit être antérieure à la date de fin');
                return false;
            }
            
            if (config.minEmails < 1 || config.minEmails > 100) {
                this.showError('Le nombre minimum d\'emails doit être entre 1 et 100');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur validation:', error);
            this.showError('Configuration invalide: ' + error.message);
            return false;
        }
    }

    getConfigurationFromForm() {
        try {
            const startDate = document.getElementById('startDate')?.value || '';
            const endDate = document.getElementById('endDate')?.value || '';
            const minEmails = parseInt(document.getElementById('minEmails')?.value) || 3;
            const emailLimit = parseInt(document.getElementById('emailLimit')?.value) || 0;
            
            const excludeDomains = (document.getElementById('excludeDomains')?.value || '')
                .split(',')
                .map(d => d.trim())
                .filter(d => d);
            
            const excludeEmails = (document.getElementById('excludeEmails')?.value || '')
                .split('\n')
                .map(e => e.trim())
                .filter(e => e);

            return { startDate, endDate, minEmails, emailLimit, excludeDomains, excludeEmails };
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur lecture config:', error);
            throw new Error('Impossible de lire la configuration');
        }
    }
async loadAllFolders() {
    try {
        console.log('[ModernDomainOrganizer] 🚀 Chargement COMPLET de tous les dossiers...');
        
        if (!window.authService?.isAuthenticated()) {
            throw new Error('Non authentifié');
        }
        
        const accessToken = await window.authService.getAccessToken();
        this.allFolders.clear();
        
        // Charger d'abord tous les dossiers racine avec pagination
        await this.loadAllRootFolders(accessToken);
        
        // Puis charger récursivement les sous-dossiers pour chaque dossier racine
        const rootFolders = Array.from(this.allFolders.values()).filter(f => !f.parentFolderId);
        
        for (const rootFolder of rootFolders) {
            if (rootFolder.childFolderCount > 0) {
                await this.loadFoldersRecursively(accessToken, rootFolder.id, 1);
            }
        }
        
        console.log(`[ModernDomainOrganizer] 🎉 Total chargé: ${this.allFolders.size} dossiers`);
        this.updateStat('existingFolders', this.allFolders.size);
        
        return Array.from(this.allFolders.values());
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur chargement dossiers:', error);
        throw new Error('Impossible de charger les dossiers: ' + error.message);
    }
}

// Nouvelle fonction pour charger tous les dossiers racine avec pagination
async loadAllRootFolders(accessToken) {
    try {
        let hasMore = true;
        let nextLink = 'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100';
        let totalLoaded = 0;
        
        while (hasMore) {
            console.log(`[ModernDomainOrganizer] 📁 Chargement des dossiers racine (page ${Math.floor(totalLoaded / 100) + 1})...`);
            
            const response = await fetch(nextLink, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ModernDomainOrganizer] ❌ Erreur API:', errorText);
                break;
            }
            
            const data = await response.json();
            
            // Ajouter tous les dossiers de cette page
            for (const folder of data.value) {
                const folderKey = folder.displayName.toLowerCase().trim();
                
                // Éviter les doublons en utilisant l'ID comme clé de sécurité
                const uniqueKey = this.allFolders.has(folderKey) 
                    ? `${folderKey}_${folder.id.slice(-8)}`
                    : folderKey;
                
                this.allFolders.set(uniqueKey, {
                    id: folder.id,
                    displayName: folder.displayName,
                    totalItemCount: folder.totalItemCount || 0,
                    parentFolderId: null, // Les dossiers racine n'ont pas de parent
                    childFolderCount: folder.childFolderCount || 0,
                    wellKnownName: folder.wellKnownName,
                    depth: 0,
                    fullPath: folder.displayName
                });
                
                totalLoaded++;
                console.log(`[ModernDomainOrganizer] ➕ Ajouté: "${folder.displayName}" (racine)`);
            }
            
            // Vérifier s'il y a plus de pages
            if (data['@odata.nextLink']) {
                nextLink = data['@odata.nextLink'];
                // Petite pause pour éviter le rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                hasMore = false;
            }
        }
        
        console.log(`[ModernDomainOrganizer] ✅ ${totalLoaded} dossiers racine chargés`);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur chargement dossiers racine:', error);
        throw error;
    }
}

async loadFoldersRecursively(accessToken, parentId = null, depth = 0) {
    try {
        if (depth > 10) {
            console.warn('[ModernDomainOrganizer] ⚠️ Profondeur maximale atteinte, arrêt récursion');
            return;
        }
        
        const url = parentId 
            ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`
            : 'https://graph.microsoft.com/v1.0/me/mailFolders';
        
        console.log(`[ModernDomainOrganizer] 📁 Chargement niveau ${depth}:`, parentId || 'racine');
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ModernDomainOrganizer] ❌ Erreur API:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log(`[ModernDomainOrganizer] ✅ ${data.value.length} dossiers trouvés au niveau ${depth}`);
        
        // Ajouter tous les dossiers de ce niveau
        for (const folder of data.value) {
            const folderKey = folder.displayName.toLowerCase().trim();
            
            // Éviter les doublons en utilisant l'ID comme clé de sécurité
            const uniqueKey = this.allFolders.has(folderKey) 
                ? `${folderKey}_${folder.id.slice(-8)}`
                : folderKey;
            
            this.allFolders.set(uniqueKey, {
                id: folder.id,
                displayName: folder.displayName,
                totalItemCount: folder.totalItemCount || 0,
                parentFolderId: parentId, // Utiliser parentId au lieu de folder.parentFolderId
                childFolderCount: folder.childFolderCount || 0,
                wellKnownName: folder.wellKnownName,
                depth: depth,
                fullPath: this.buildFolderPath(folder.displayName, parentId)
            });
            
            console.log(`[ModernDomainOrganizer] ➕ Ajouté: "${folder.displayName}" (niveau ${depth}, parent: ${parentId || 'racine'})`);
            
            // Charger récursivement les sous-dossiers si ils existent
            if (folder.childFolderCount > 0) {
                console.log(`[ModernDomainOrganizer] 📂 Chargement ${folder.childFolderCount} sous-dossiers de "${folder.displayName}"`);
                await this.loadFoldersRecursively(accessToken, folder.id, depth + 1);
                
                // Petite pause pour éviter le rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
    } catch (error) {
        console.error(`[ModernDomainOrganizer] ❌ Erreur chargement niveau ${depth}:`, error);
    }
}
buildFolderPath(folderName, parentId) {
    try {
        if (!parentId) {
            return folderName;
        }
        
        // Trouver le parent dans les dossiers déjà chargés par ID
        const parent = Array.from(this.allFolders.values()).find(f => f.id === parentId);
        if (parent) {
            return `${parent.fullPath || parent.displayName} > ${folderName}`;
        }
        
        return folderName;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur construction chemin:', error);
        return folderName;
    }
}

// Fonction helper pour compter tous les enfants
countAllChildren(folder) {
    let count = folder.children ? folder.children.length : 0;
    if (folder.children) {
        folder.children.forEach(child => {
            count += this.countAllChildren(child);
        });
    }
    return count;
}
buildFolderPath(folderName, parentId) {
    try {
        if (!parentId) {
            return folderName;
        }
        
        // Trouver le parent dans les dossiers déjà chargés
        const parent = Array.from(this.allFolders.values()).find(f => f.id === parentId);
        if (parent) {
            return `${parent.fullPath || parent.displayName} > ${folderName}`;
        }
        
        return folderName;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur construction chemin:', error);
        return folderName;
    }
}
addFolderToCache(folder) {
    try {
        if (!folder || !folder.id || !folder.displayName) {
            console.warn('[ModernDomainOrganizer] ⚠️ Dossier invalide ignoré:', folder);
            return;
        }
        
        const folderKey = folder.displayName.toLowerCase().trim();
        
        // Éviter les doublons
        if (this.allFolders.has(folderKey)) {
            const existing = this.allFolders.get(folderKey);
            if (existing.id === folder.id) {
                return; // Déjà ajouté
            }
            // Si IDs différents, utiliser un nom unique
            const uniqueKey = `${folderKey}_${folder.id.slice(-8)}`;
            this.allFolders.set(uniqueKey, {
                id: folder.id,
                displayName: folder.displayName,
                totalItemCount: folder.totalItemCount || 0,
                parentFolderId: folder.parentFolderId,
                wellKnownName: folder.wellKnownName,
                childFolderCount: folder.childFolderCount || 0
            });
            console.log(`[ModernDomainOrganizer] 📁 Dossier ajouté avec clé unique: "${folder.displayName}" -> ${uniqueKey}`);
        } else {
            this.allFolders.set(folderKey, {
                id: folder.id,
                displayName: folder.displayName,
                totalItemCount: folder.totalItemCount || 0,
                parentFolderId: folder.parentFolderId,
                wellKnownName: folder.wellKnownName,
                childFolderCount: folder.childFolderCount || 0
            });
            console.log(`[ModernDomainOrganizer] 📁 Dossier ajouté: "${folder.displayName}"`);
        }
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur ajout dossier au cache:', error);
    }
}
    async scanEmails(config) {
        try {
            console.log('[ModernDomainOrganizer] Scan des emails...');
            
            if (!window.mailService) {
                throw new Error('Service mail non disponible');
            }
            
            const scanLimit = config.emailLimit === 0 ? 10000 : config.emailLimit;
            
            const options = {
                top: Math.min(scanLimit, 10000), // Limitation de sécurité
                orderBy: 'receivedDateTime desc'
            };

            if (config.startDate) options.startDate = config.startDate;
            if (config.endDate) options.endDate = config.endDate;

            const emails = await window.mailService.getEmailsFromFolder('inbox', options);
            
            if (!Array.isArray(emails)) {
                throw new Error('Format d\'emails invalide');
            }
            
            console.log(`[ModernDomainOrganizer] ${emails.length} emails récupérés`);
            this.updateStat('scannedEmails', emails.length);
            
            return emails;
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur scan emails:', error);
            throw new Error('Impossible de scanner les emails: ' + error.message);
        }
    }

    async analyzeDomains(emails, config) {
        try {
            const domainCounts = new Map();
            
            console.log(`[ModernDomainOrganizer] Analyse de ${emails.length} emails...`);
            
            for (const email of emails) {
                try {
                    const domain = this.extractDomain(email);
                    if (!domain) continue;
                    
                    if (this.shouldExcludeDomain(domain, config.excludeDomains)) continue;
                    if (this.shouldExcludeEmail(email, config.excludeEmails)) continue;
                    
                    if (!domainCounts.has(domain)) {
                        domainCounts.set(domain, {
                            count: 0,
                            emails: []
                        });
                    }
                    
                    const domainData = domainCounts.get(domain);
                    domainData.count++;
                    domainData.emails.push(email);
                } catch (emailError) {
                    console.warn('[ModernDomainOrganizer] Erreur traitement email:', emailError);
                    // Continue avec l'email suivant
                }
            }

            // Filtrer par seuil minimum
            domainCounts.forEach((data, domain) => {
                if (data.count >= config.minEmails) {
                    this.emailsByDomain.set(domain, data);
                }
            });

            console.log(`[ModernDomainOrganizer] ${this.emailsByDomain.size} domaines valides trouvés`);
            this.updateStat('foundDomains', this.emailsByDomain.size);
            
            if (this.emailsByDomain.size === 0) {
                throw new Error('Aucun domaine trouvé avec le seuil configuré');
            }
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur analyse domaines:', error);
            throw new Error('Erreur lors de l\'analyse des domaines: ' + error.message);
        }
    }

    createOrganizationPlan() {
        try {
            this.organizationPlan.clear();
            
            let newFoldersCount = 0;
            
            this.emailsByDomain.forEach((data, domain) => {
                try {
                    const existingFolder = this.findExistingFolder(domain);
                    
                    if (existingFolder) {
                        console.log(`[ModernDomainOrganizer] ✅ Dossier existant trouvé pour ${domain}: ${existingFolder.displayName}`);
                        this.organizationPlan.set(domain, {
                            domain,
                            action: 'use-existing',
                            targetFolder: existingFolder.displayName,
                            targetFolderId: existingFolder.id,
                            emailCount: data.count,
                            emails: data.emails,
                            selected: true
                        });
                    } else {
                        console.log(`[ModernDomainOrganizer] 📁 Nouveau dossier nécessaire pour ${domain}`);
                        this.organizationPlan.set(domain, {
                            domain,
                            action: 'create-new',
                            targetFolder: domain,
                            targetFolderId: null,
                            emailCount: data.count,
                            emails: data.emails,
                            selected: true
                        });
                        newFoldersCount++;
                    }
                } catch (domainError) {
                    console.warn(`[ModernDomainOrganizer] Erreur plan pour ${domain}:`, domainError);
                }
            });

            this.updateStat('newFoldersNeeded', newFoldersCount);
            console.log(`[ModernDomainOrganizer] Plan créé: ${this.organizationPlan.size} domaines, ${newFoldersCount} nouveaux dossiers`);
            
            if (this.organizationPlan.size === 0) {
                throw new Error('Aucun plan d\'organisation créé');
            }
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur création plan:', error);
            throw new Error('Erreur lors de la création du plan: ' + error.message);
        }
    }

    showOrganizationPlan() {
        try {
            this.goToStep('plan');
            
            const summary = document.getElementById('planSummary');
            const container = document.getElementById('domainsContainer');
            
            if (!summary || !container) {
                throw new Error('Éléments d\'interface manquants');
            }
            
            this.displayPlanSummary(summary);
            this.displayDomainsWithEmails(container);
            this.updateTotalEmailsCount();
            this.updateExecutionButton();
            
            // Réattacher les event listeners après affichage
            setTimeout(() => {
                this.setupEventListeners();
            }, 100);
            
            console.log('[ModernDomainOrganizer] ✅ Plan d\'organisation affiché avec boutons');
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage plan:', error);
            this.showError('Erreur lors de l\'affichage du plan: ' + error.message);
        }
    }

    displayPlanSummary(summary) {
        try {
            const totalEmails = Array.from(this.organizationPlan.values())
                .reduce((sum, plan) => sum + plan.emailCount, 0);
            
            const newFolders = Array.from(this.organizationPlan.values())
                .filter(plan => plan.action === 'create-new');
            
            const existingFolders = Array.from(this.organizationPlan.values())
                .filter(plan => plan.action === 'use-existing');

            summary.innerHTML = `
                <span><strong>${this.organizationPlan.size}</strong> Domaines</span>
                <span><strong>${totalEmails.toLocaleString()}</strong> Emails</span>
                <span><strong>${newFolders.length}</strong> Nouveaux</span>
                <span><strong>${existingFolders.length}</strong> Existants</span>
            `;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage résumé:', error);
        }
    }

    displayDomainsWithEmails(container) {
        try {
            container.innerHTML = '';
            
            const sortedDomains = Array.from(this.organizationPlan.entries())
                .sort((a, b) => b[1].emailCount - a[1].emailCount);

            sortedDomains.forEach(([domain, plan]) => {
                try {
                    const domainElement = this.createDomainElement(domain, plan);
                    container.appendChild(domainElement);
                } catch (elementError) {
                    console.warn(`[ModernDomainOrganizer] Erreur élément ${domain}:`, elementError);
                }
            });
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage domaines:', error);
        }
    }

createDomainElement(domain, plan) {
    try {
        const div = document.createElement('div');
        div.className = 'domain-item';
        div.dataset.domain = domain;
        
        const isExpanded = this.expandedDomains.has(domain);
        if (isExpanded) {
            div.classList.add('expanded');
        }

        const safeSubject = (email) => {
            try {
                return email.subject || '(Sans sujet)';
            } catch {
                return '(Erreur)';
            }
        };

        const safeFrom = (email) => {
            try {
                return email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Inconnu';
            } catch {
                return 'Inconnu';
            }
        };

        const safeDate = (email) => {
            try {
                return new Date(email.receivedDateTime).toLocaleDateString();
            } catch {
                return 'Date inconnue';
            }
        };

        div.innerHTML = `
            <div class="domain-header" onclick="window.modernDomainOrganizer.toggleDomain('${domain}')">
                <input type="checkbox" class="domain-checkbox" ${plan.selected ? 'checked' : ''} 
                       onclick="event.stopPropagation(); window.modernDomainOrganizer.toggleDomainSelection('${domain}')" 
                       data-domain="${domain}">
                
                <button class="domain-expand">
                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                </button>
                
                <div class="domain-info">
                    <div class="domain-name">📧 ${domain}</div>
                    <div class="domain-stats">
                        ${plan.emailCount} emails • ${plan.emails.filter(e => e.selected !== false).length} sélectionnés
                    </div>
                </div>
                
                <div class="domain-actions" onclick="event.stopPropagation()">
                    <input type="text" class="folder-input" value="${plan.targetFolder}" 
                           placeholder="Nom du dossier" data-domain="${domain}"
                           onchange="window.modernDomainOrganizer.updateFolderName('${domain}', this.value)">
                    
                    <span class="action-badge ${plan.action === 'create-new' ? 'action-new' : 'action-existing'}">
                        ${plan.action === 'create-new' ? 'Nouveau' : 'Existant'}
                    </span>
                </div>
            </div>
            
            <div class="domain-content ${isExpanded ? 'expanded' : ''}">
                <div class="emails-list">
                    ${plan.emails.map((email) => {
                        const currentFolder = email.customFolder || plan.targetFolder;
                        const emailId = email.id.replace(/[^a-zA-Z0-9]/g, '_'); // ID sécurisé pour HTML
                        
                        return `
                            <div class="email-item" data-email-id="${email.id}">
                                <input type="checkbox" class="email-checkbox" ${email.selected !== false ? 'checked' : ''} 
                                       onchange="window.modernDomainOrganizer.toggleEmailSelection('${domain}', '${email.id}')"
                                       data-domain="${domain}" data-email-id="${email.id}">
                                
                                <div class="email-info">
                                    <div class="email-subject" title="${safeSubject(email)}">
                                        ${safeSubject(email)}
                                    </div>
                                    <div class="email-from">De: ${safeFrom(email)}</div>
                                    <div class="email-date">${safeDate(email)}</div>
                                </div>
                                
                                <div class="email-folder-selector">
                                    <select class="email-folder-select" 
                                            data-email-id="${email.id}" 
                                            data-domain="${domain}"
                                            onchange="window.modernDomainOrganizer.updateEmailFolder('${domain}', '${email.id}', this.value)"
                                            onclick="event.stopPropagation()">
                                        <option value="_default" ${!email.customFolder ? 'selected' : ''}>
                                            📁 ${plan.targetFolder} (défaut)
                                        </option>
                                        <option value="_advanced">
                                            🔍 Sélectionner un dossier...
                                        </option>
                                        <option value="_new_folder" ${email.customFolder && !this.findExistingFolderByName(email.customFolder) ? 'selected' : ''}>
                                            ✨ Nouveau dossier...
                                        </option>
                                    </select>
                                    
                                    ${email.customFolder && !this.findExistingFolderByName(email.customFolder) ? `
                                        <input type="text" 
                                               class="custom-folder-input" 
                                               value="${email.customFolder}"
                                               placeholder="Nom du dossier personnalisé"
                                               data-email-id="${email.id}"
                                               data-domain="${domain}"
                                               onchange="window.modernDomainOrganizer.updateEmailCustomFolder('${domain}', '${email.id}', this.value)"
                                               onclick="event.stopPropagation()">
                                    ` : ''}
                                </div>
                                
                                <div class="email-folder-info">
                                    ${email.customFolder ? `
                                        <span class="custom-folder-badge ${this.findExistingFolderByName(email.customFolder) ? 'existing' : 'new'}">
                                            ${this.findExistingFolderByName(email.customFolder) ? '📂' : '✨'} ${email.customFolder}
                                        </span>
                                    ` : `
                                        <span class="default-folder-badge">📁 ${plan.targetFolder}</span>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        return div;
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur création élément domaine:', error);
        
        // Élément de fallback en cas d'erreur
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'domain-item error';
        fallbackDiv.innerHTML = `
            <div class="domain-header">
                <div class="domain-info">
                    <div class="domain-name">❌ ${domain}</div>
                    <div class="domain-stats">Erreur d'affichage</div>
                </div>
            </div>
        `;
        return fallbackDiv;
    }
}
generateFolderOptions() {
    try {
        const folders = Array.from(this.allFolders.values())
            .filter(folder => {
                // Inclure tous les dossiers sauf certains dossiers système critiques
                const criticalFolders = ['deleteditems', 'outbox'];
                return !criticalFolders.includes(folder.displayName.toLowerCase());
            })
            .sort((a, b) => {
                // Trier par hiérarchie puis par nom
                const aDepth = this.getFolderDepth(folder.parentFolderId);
                const bDepth = this.getFolderDepth(folder.parentFolderId);
                
                if (aDepth !== bDepth) {
                    return aDepth - bDepth;
                }
                
                return a.displayName.localeCompare(b.displayName);
            });
        
        return folders;
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur génération options dossiers:', error);
        return [];
    }
}

getFolderDepth(parentFolderId) {
    let depth = 0;
    let currentId = parentFolderId;
    
    while (currentId) {
        depth++;
        const parentFolder = Array.from(this.allFolders.values()).find(f => f.id === currentId);
        currentId = parentFolder?.parentFolderId;
        
        // Éviter les boucles infinies
        if (depth > 10) break;
    }
    
    return depth;
}
buildFolderHierarchy() {
    try {
        console.log('[ModernDomainOrganizer] 🌳 Construction de la hiérarchie complète des dossiers...');
        
        const folders = Array.from(this.allFolders.values());
        const folderMap = new Map();
        const rootFolders = new Map();
        
        console.log(`[ModernDomainOrganizer] 📊 Total de dossiers à organiser: ${folders.length}`);
        
        // Debug: afficher quelques dossiers pour vérifier leur structure
        if (folders.length > 0) {
            console.log('[ModernDomainOrganizer] 🔍 Exemple de structure de dossier:', folders[0]);
        }
        
        // Première passe : créer tous les nœuds avec une Map par ID
        folders.forEach(folder => {
            folderMap.set(folder.id, {
                ...folder,
                children: [],
                level: 0,
                path: folder.fullPath || folder.displayName
            });
        });
        
        // Deuxième passe : construire la hiérarchie
        folders.forEach(folder => {
            const folderNode = folderMap.get(folder.id);
            
            if (!folder.parentFolderId || folder.parentFolderId === null) {
                // Dossier racine
                rootFolders.set(folder.id, folderNode);
                console.log(`[ModernDomainOrganizer] 🌳 Racine: "${folder.displayName}" (ID: ${folder.id})`);
            } else {
                // Dossier enfant - chercher le parent par ID
                const parent = folderMap.get(folder.parentFolderId);
                if (parent) {
                    parent.children.push(folderNode);
                    folderNode.level = parent.level + 1;
                    folderNode.path = `${parent.path} > ${folder.displayName}`;
                    console.log(`[ModernDomainOrganizer] 📁 Enfant: "${folder.displayName}" -> Parent: "${parent.displayName}"`);
                } else {
                    // Parent non trouvé, traiter comme racine
                    rootFolders.set(folder.id, folderNode);
                    console.warn(`[ModernDomainOrganizer] ⚠️ Orphelin (parent ${folder.parentFolderId} non trouvé): "${folder.displayName}"`);
                }
            }
        });
        
        // Trier les dossiers racine et leurs enfants
        this.sortFolderHierarchy(rootFolders);
        
        console.log(`[ModernDomainOrganizer] ✅ Hiérarchie construite: ${rootFolders.size} racines, ${folders.length} total`);
        
        // Log détaillé de la structure
        let totalWithChildren = 0;
        rootFolders.forEach(root => {
            const childCount = this.countAllChildren(root);
            if (childCount > 0) {
                totalWithChildren++;
                console.log(`[ModernDomainOrganizer] 📂 "${root.displayName}": ${childCount} enfants`);
            }
        });
        console.log(`[ModernDomainOrganizer] 📊 ${totalWithChildren} dossiers ont des sous-dossiers`);
        
        return rootFolders;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur construction hiérarchie:', error);
        return new Map();
    }
}

// Fonction helper pour compter tous les enfants
countAllChildren(folder) {
    let count = folder.children ? folder.children.length : 0;
    if (folder.children) {
        folder.children.forEach(child => {
            count += this.countAllChildren(child);
        });
    }
    return count;
}

sortFolderHierarchy(rootFolders) {
    try {
        // Convertir la Map en Array pour le tri
        const sortedRoots = Array.from(rootFolders.values()).sort((a, b) => {
            // Prioriser les dossiers système
            const systemOrder = {
                'inbox': 0, 'boîte de réception': 0,
                'sentitems': 1, 'éléments envoyés': 1, 'sent items': 1,
                'drafts': 2, 'brouillons': 2,
                'deleteditems': 3, 'éléments supprimés': 3, 'deleted items': 3,
                'junkemail': 4, 'courrier indésirable': 4, 'junk email': 4,
                'archive': 5, 'archives': 5,
                'outbox': 6,
                'notes': 7
            };
            
            const aName = a.wellKnownName?.toLowerCase() || a.displayName.toLowerCase();
            const bName = b.wellKnownName?.toLowerCase() || b.displayName.toLowerCase();
            
            const aOrder = systemOrder[aName] ?? 100;
            const bOrder = systemOrder[bName] ?? 100;
            
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            
            return a.displayName.localeCompare(b.displayName);
        });
        
        // Reconstruire la Map triée
        rootFolders.clear();
        sortedRoots.forEach(folder => {
            rootFolders.set(folder.id, folder);
            // Trier récursivement les enfants
            this.sortChildren(folder);
        });
        
        console.log(`[ModernDomainOrganizer] ✅ Hiérarchie triée: ${rootFolders.size} dossiers racine`);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur tri hiérarchie:', error);
    }
}
sortChildren(folder) {
    if (folder.children && folder.children.length > 0) {
        folder.children.sort((a, b) => a.displayName.localeCompare(b.displayName));
        folder.children.forEach(child => this.sortChildren(child));
    }
}

// Fonction utilitaire pour obtenir le chemin complet d'un dossier
getFolderPath(folderId) {
    try {
        const folder = Array.from(this.allFolders.values()).find(f => f.id === folderId);
        if (!folder) return 'Inconnu';
        
        if (!folder.parentFolderId) {
            return folder.displayName;
        }
        
        const parentPath = this.getFolderPath(folder.parentFolderId);
        return `${parentPath} > ${folder.displayName}`;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur calcul chemin dossier:', error);
        return 'Erreur';
    }
}

// Fonction pour rechercher un dossier par ID
findFolderById(folderId) {
    try {
        return Array.from(this.allFolders.values()).find(f => f.id === folderId) || null;
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur recherche dossier par ID:', error);
        return null;
    }
}

// Fonction pour obtenir tous les dossiers d'un niveau donné
getFoldersByLevel(level = 0) {
    try {
        const hierarchy = this.buildFolderHierarchy();
        const foldersAtLevel = [];
        
        const collectByLevel = (folder, currentLevel) => {
            if (currentLevel === level) {
                foldersAtLevel.push(folder);
            }
            
            if (folder.children) {
                folder.children.forEach(child => {
                    collectByLevel(child, currentLevel + 1);
                });
            }
        };
        
        hierarchy.forEach(rootFolder => {
            collectByLevel(rootFolder, 0);
        });
        
        return foldersAtLevel;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur récupération dossiers par niveau:', error);
        return [];
    }
}
findFolderInHierarchy(hierarchy, folderId) {
    for (const folder of hierarchy.values()) {
        if (folder.id === folderId) return folder;
        
        const found = this.searchInChildren(folder.children, folderId);
        if (found) return found;
    }
    return null;
}

createFolderSelectModal(domain, emailId, currentFolder) {
    try {
        console.log(`[ModernDomainOrganizer] 🎯 Création modal pour: domain=${domain}, emailId=${emailId}, currentFolder=${currentFolder}`);
        
        // Supprimer le modal existant s'il y en a un
        const existingModal = document.getElementById('folderSelectModal');
        if (existingModal) {
            existingModal.remove();
            console.log('[ModernDomainOrganizer] 🗑️ Modal existant supprimé');
        }
        
        // Créer le nouveau modal
        const modal = document.createElement('div');
        modal.id = 'folderSelectModal';
        modal.className = 'folder-select-modal';
        
        const folders = Array.from(this.allFolders.values());
        console.log(`[ModernDomainOrganizer] 📁 ${folders.length} dossiers disponibles`);
        
        // Construire la hiérarchie complète
        const hierarchy = this.buildFolderHierarchy();
        
        modal.innerHTML = `
            <div class="folder-modal-content">
                <div class="folder-modal-header">
                    <h3>📁 Sélectionner un dossier</h3>
                    <button class="modal-close" onclick="window.modernDomainOrganizer.closeFolderModal()">×</button>
                </div>
                
                <div class="folder-modal-body">
                    <div class="folder-search-section">
                        <div class="search-container">
                            <input type="text" 
                                   id="folderSearchInput" 
                                   placeholder="🔍 Rechercher un dossier..." 
                                   class="folder-search-input">
                            <button class="search-clear" onclick="window.modernDomainOrganizer.clearFolderSearch()">×</button>
                        </div>
                        
                        <div class="search-stats" id="searchStats">
                            ${folders.length} dossiers disponibles
                        </div>
                    </div>
                    
                    <div class="folder-options-section">
                        <div class="special-options">
                            <div class="folder-option special-option" data-action="default" onclick="window.modernDomainOrganizer.selectFolderOption(this)">
                                <div class="folder-content">
                                    <span class="folder-icon">📁</span>
                                    <div class="folder-details">
                                        <span class="folder-name">Utiliser le dossier par défaut</span>
                                        <span class="folder-path">${this.organizationPlan.get(domain)?.targetFolder || domain}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="folder-option special-option" data-action="new" onclick="window.modernDomainOrganizer.selectFolderOption(this)">
                                <div class="folder-content">
                                    <span class="folder-icon">✨</span>
                                    <div class="folder-details">
                                        <span class="folder-name">Créer un nouveau dossier</span>
                                        <span class="folder-path">Saisir un nom personnalisé</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="folder-separator">
                            <span>Dossiers existants</span>
                        </div>
                        
                        <div class="folder-tree" id="folderTree">
                            ${this.generateHierarchicalFolderTree(hierarchy, currentFolder)}
                        </div>
                    </div>
                    
                    <div class="custom-folder-section hidden" id="customFolderSection">
                        <div class="custom-folder-input-group">
                            <label>Nom du nouveau dossier :</label>
                            <input type="text" 
                                   id="customFolderNameInput" 
                                   placeholder="Saisir le nom du dossier..."
                                   class="custom-folder-name-input">
                        </div>
                    </div>
                </div>
                
                <div class="folder-modal-footer">
                    <button class="btn btn-secondary" onclick="window.modernDomainOrganizer.closeFolderModal()">
                        Annuler
                    </button>
                    <button class="btn btn-primary" id="confirmFolderBtn" onclick="window.modernDomainOrganizer.confirmFolderSelection('${domain}', '${emailId}')">
                        Confirmer
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter le modal au DOM
        document.body.appendChild(modal);
        console.log('[ModernDomainOrganizer] 📦 Modal ajouté au DOM');
        
        // Afficher le modal
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        console.log('[ModernDomainOrganizer] ✅ Modal affiché');
        
        // Configurer les event listeners après un délai
        setTimeout(() => {
            this.setupFolderModalEvents(domain, emailId);
        }, 100);
        
        // Focus sur la recherche
        setTimeout(() => {
            const searchInput = document.getElementById('folderSearchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }, 200);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur création modal dossier:', error);
        this.showError('Erreur lors de l\'ouverture du sélecteur de dossier');
    }
}

generateHierarchicalFolderTree(hierarchy, currentFolder) {
    try {
        console.log('[ModernDomainOrganizer] 🎨 Génération de l\'arbre hiérarchique complet');
        
        if (!hierarchy || hierarchy.size === 0) {
            return '<div class="no-folders">Aucun dossier trouvé</div>';
        }
        
        let html = '';
        
        // Parcourir tous les dossiers racine
        hierarchy.forEach(rootFolder => {
            html += this.generateFolderNodeHTML(rootFolder, currentFolder, 0);
        });
        
        console.log(`[ModernDomainOrganizer] ✅ Arbre hiérarchique généré avec ${hierarchy.size} dossiers racine`);
        return html;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur génération arbre:', error);
        return '<div class="error-folders">Erreur lors du chargement des dossiers</div>';
    }
}
generateSimpleFolderList(folders, currentFolder) {
    try {
        console.log('[ModernDomainOrganizer] 🎨 Génération liste hiérarchique des dossiers');
        
        if (!folders || folders.length === 0) {
            return '<div class="no-folders">Aucun dossier trouvé</div>';
        }
        
        let html = '';
        
        // Grouper les dossiers par niveau de profondeur
        const foldersByDepth = new Map();
        folders.forEach(folder => {
            const depth = folder.depth || 0;
            if (!foldersByDepth.has(depth)) {
                foldersByDepth.set(depth, []);
            }
            foldersByDepth.get(depth).push(folder);
        });
        
        // Trier chaque niveau
        foldersByDepth.forEach((levelFolders, depth) => {
            levelFolders.sort((a, b) => {
                // Prioriser les dossiers système au niveau 0
                if (depth === 0) {
                    const systemOrder = {
                        'Boîte de réception': 0, 'Inbox': 0,
                        'Éléments envoyés': 1, 'Sent Items': 1,
                        'Brouillons': 2, 'Drafts': 2,
                        'Éléments supprimés': 3, 'Deleted Items': 3,
                        'Courrier indésirable': 4, 'Junk Email': 4
                    };
                    
                    const aOrder = systemOrder[a.displayName] ?? 100;
                    const bOrder = systemOrder[b.displayName] ?? 100;
                    
                    if (aOrder !== bOrder) {
                        return aOrder - bOrder;
                    }
                }
                
                return a.displayName.localeCompare(b.displayName);
            });
        });
        
        // Générer le HTML niveau par niveau
        const maxDepth = Math.max(...foldersByDepth.keys());
        for (let depth = 0; depth <= maxDepth; depth++) {
            const levelFolders = foldersByDepth.get(depth) || [];
            
            if (depth > 0 && levelFolders.length > 0) {
                html += `<div class="folder-separator">Niveau ${depth}</div>`;
            }
            
            levelFolders.forEach(folder => {
                const isSelected = currentFolder === folder.displayName;
                const folderIcon = this.getFolderIcon(folder.displayName);
                const itemCount = folder.totalItemCount > 0 ? `(${folder.totalItemCount})` : '';
                const indent = depth * 20;
                
                // Indicateur de sous-dossiers
                const hasChildren = folder.childFolderCount > 0;
                const childrenIndicator = hasChildren ? ' 📂' : '';
                
                html += `
                    <div class="folder-option ${isSelected ? 'selected' : ''}" 
                         data-folder-id="${folder.id}" 
                         data-folder-name="${folder.displayName}"
                         data-folder-path="${folder.fullPath || folder.displayName}"
                         title="${folder.fullPath || folder.displayName}"
                         style="padding-left: ${indent + 12}px"
                         onclick="window.modernDomainOrganizer.selectFolderOption(this)">
                        
                        <div class="folder-content">
                            <span class="folder-spacer" style="width: ${Math.max(0, indent)}px"></span>
                            <span class="folder-icon">${folderIcon}</span>
                            
                            <div class="folder-details">
                                <span class="folder-name">${folder.displayName}${childrenIndicator}</span>
                                ${folder.fullPath && folder.fullPath !== folder.displayName ? 
                                    `<span class="folder-path">${folder.fullPath}</span>` : ''}
                                ${itemCount ? `<span class="folder-count">${itemCount}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        console.log(`[ModernDomainOrganizer] ✅ Liste hiérarchique générée: ${folders.length} dossiers sur ${maxDepth + 1} niveaux`);
        return html;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur génération liste hiérarchique:', error);
        return '<div class="error-folders">Erreur lors du chargement de l\'arborescence des dossiers</div>';
    }
}
selectFolderOption(optionElement) {
    try {
        console.log('[ModernDomainOrganizer] 🎯 Option sélectionnée:', optionElement.dataset);
        
        // Désélectionner toutes les autres options
        document.querySelectorAll('.folder-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Sélectionner l'option cliquée
        optionElement.classList.add('selected');
        
        const action = optionElement.dataset.action;
        const folderId = optionElement.dataset.folderId;
        const folderName = optionElement.dataset.folderName;
        
        console.log('[ModernDomainOrganizer] 💾 Données sélection:', { action, folderId, folderName });
        
        // Gérer les options spéciales
        const customSection = document.getElementById('customFolderSection');
        if (action === 'new') {
            if (customSection) {
                customSection.classList.remove('hidden');
                const input = document.getElementById('customFolderNameInput');
                if (input) {
                    input.focus();
                    input.value = '';
                }
            }
        } else {
            if (customSection) {
                customSection.classList.add('hidden');
            }
        }
        
        // Stocker la sélection
        this.selectedFolderData = {
            action: action || 'existing',
            folderId: folderId,
            folderName: folderName
        };
        
        console.log('[ModernDomainOrganizer] ✅ Sélection stockée:', this.selectedFolderData);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur sélection option:', error);
    }
}

generateFolderTreeHTML(hierarchy, flatFolders, currentFolder) {
    try {
        console.log('[ModernDomainOrganizer] 🎨 Génération de l\'arbre HTML...');
        
        let html = '';
        const rootFolders = Array.from(hierarchy.values());
        
        if (rootFolders.length === 0) {
            console.warn('[ModernDomainOrganizer] ⚠️ Aucun dossier racine trouvé');
            return '<div class="no-folders">Aucun dossier trouvé</div>';
        }
        
        // Générer l'arbre hiérarchique
        rootFolders.forEach(rootFolder => {
            html += this.generateFolderNodeHTML(rootFolder, currentFolder, 0);
        });
        
        console.log(`[ModernDomainOrganizer] ✅ Arbre HTML généré pour ${rootFolders.length} dossiers racine`);
        return html;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur génération arbre HTML:', error);
        return '<div class="error-folders">Erreur lors du chargement de l\'arborescence des dossiers</div>';
    }
}

generateFolderNodeHTML(folder, currentFolder, level) {
    try {
        const isSelected = currentFolder === folder.displayName;
        const hasChildren = folder.children && folder.children.length > 0;
        const indent = level * 20;
        
        // Icône selon le type de dossier
        const folderIcon = this.getFolderIcon(folder.displayName, folder.wellKnownName);
        
        // Classe CSS selon le type
        let nodeClass = 'folder-option';
        if (folder.wellKnownName) {
            nodeClass += ' system-folder';
        }
        if (isSelected) {
            nodeClass += ' selected';
        }
        
        // Badge de nombre d'éléments
        const itemCountBadge = folder.totalItemCount > 0 ? 
            `<span class="folder-count">(${folder.totalItemCount})</span>` : '';
        
        // Chemin complet pour l'info-bulle
        const folderPath = folder.path || folder.displayName;
        
        let html = `
            <div class="${nodeClass}" 
                 data-folder-id="${folder.id}" 
                 data-folder-name="${folder.displayName}"
                 data-folder-path="${folderPath}"
                 style="padding-left: ${indent + 12}px"
                 title="${folderPath}"
                 onclick="window.modernDomainOrganizer.selectFolderOption(this)">
                
                <div class="folder-content">
                    ${hasChildren ? `
                        <button class="folder-expand" onclick="event.stopPropagation(); window.modernDomainOrganizer.toggleFolderNode('${folder.id}')">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    ` : '<span class="folder-spacer"></span>'}
                    
                    <span class="folder-icon">${folderIcon}</span>
                    
                    <div class="folder-details">
                        <span class="folder-name">${folder.displayName}</span>
                        ${folder.wellKnownName ? '<span class="system-badge">Système</span>' : ''}
                        ${itemCountBadge}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter les enfants (masqués par défaut)
        if (hasChildren) {
            html += `<div class="folder-children hidden" id="children-${folder.id}">`;
            folder.children.forEach(child => {
                html += this.generateFolderNodeHTML(child, currentFolder, level + 1);
            });
            html += '</div>';
        }
        
        return html;
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur génération noeud:', error);
        return `<div class="error-folder-node">Erreur: ${folder?.displayName || 'Dossier inconnu'}</div>`;
    }
}

getFolderIcon(folderName, wellKnownName) {
    try {
        // Icônes basées sur le nom bien connu en priorité
        if (wellKnownName) {
            switch (wellKnownName.toLowerCase()) {
                case 'inbox': return '📥';
                case 'sentitems': return '📤';
                case 'drafts': return '📝';
                case 'deleteditems': return '🗑️';
                case 'junkemail': return '🚫';
                case 'outbox': return '📮';
                case 'archive': return '📦';
                case 'notes': return '📓';
                case 'tasks': return '✓';
                case 'calendar': return '📅';
                case 'contacts': return '👥';
                default: return '📁';
            }
        }
        
        // Icônes basées sur le nom du dossier
        const name = folderName.toLowerCase();
        
        // Français
        if (name.includes('boîte de réception') || name.includes('réception')) return '📥';
        if (name.includes('envoyé') || name.includes('éléments envoyés')) return '📤';
        if (name.includes('brouillon')) return '📝';
        if (name.includes('supprimé') || name.includes('corbeille')) return '🗑️';
        if (name.includes('indésirable') || name.includes('spam')) return '🚫';
        if (name.includes('archive')) return '📦';
        if (name.includes('important')) return '⭐';
        if (name.includes('notes')) return '📓';
        
        // Anglais
        if (name.includes('inbox')) return '📥';
        if (name.includes('sent')) return '📤';
        if (name.includes('draft')) return '📝';
        if (name.includes('deleted') || name.includes('trash')) return '🗑️';
        if (name.includes('junk') || name.includes('spam')) return '🚫';
        if (name.includes('archive')) return '📦';
        if (name.includes('important')) return '⭐';
        
        // Dossiers personnalisés basés sur le contenu
        if (name.includes('amazon')) return '🛒';
        if (name.includes('paypal') || name.includes('payment')) return '💳';
        if (name.includes('social') || name.includes('facebook') || name.includes('twitter')) return '👥';
        if (name.includes('news') || name.includes('newsletter')) return '📰';
        if (name.includes('work') || name.includes('travail')) return '💼';
        if (name.includes('travel') || name.includes('voyage')) return '✈️';
        if (name.includes('bank') || name.includes('banque')) return '🏦';
        if (name.includes('health') || name.includes('santé')) return '🏥';
        if (name.includes('education') || name.includes('école')) return '🎓';
        if (name.includes('project') || name.includes('projet')) return '📊';
        if (name.includes('personal') || name.includes('personnel')) return '👤';
        if (name.includes('family') || name.includes('famille')) return '👨‍👩‍👧‍👦';
        if (name.includes('finance')) return '💰';
        if (name.includes('urgent')) return '🚨';
        if (name.includes('meeting') || name.includes('réunion')) return '👥';
        if (name.includes('invoice') || name.includes('facture')) return '🧾';
        if (name.includes('receipt') || name.includes('reçu')) return '🧾';
        if (name.includes('order') || name.includes('commande')) return '📦';
        if (name.includes('subscription') || name.includes('abonnement')) return '🔄';
        
        return '📁';
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur détermination icône:', error);
        return '📁';
    }
}

getFolderIcon(folderName) {
    try {
        const name = folderName.toLowerCase();
        
        // Français
        if (name.includes('boîte de réception') || name.includes('réception')) return '📥';
        if (name.includes('envoyé') || name.includes('éléments envoyés')) return '📤';
        if (name.includes('brouillon')) return '📝';
        if (name.includes('supprimé') || name.includes('corbeille')) return '🗑️';
        if (name.includes('indésirable') || name.includes('spam')) return '🚫';
        if (name.includes('archive')) return '📦';
        if (name.includes('important')) return '⭐';
        
        // Anglais
        if (name.includes('inbox')) return '📥';
        if (name.includes('sent')) return '📤';
        if (name.includes('draft')) return '📝';
        if (name.includes('deleted') || name.includes('trash')) return '🗑️';
        if (name.includes('junk')) return '🚫';
        
        // Dossiers personnalisés
        if (name.includes('amazon')) return '🛒';
        if (name.includes('paypal') || name.includes('payment')) return '💳';
        if (name.includes('social') || name.includes('facebook') || name.includes('instagram')) return '👥';
        if (name.includes('news') || name.includes('newsletter')) return '📰';
        if (name.includes('work') || name.includes('travail')) return '💼';
        if (name.includes('bank') || name.includes('banque')) return '🏦';
        
        return '📁';
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur détermination icône:', error);
        return '📁';
    }
}
setupFolderModalEvents(domain, emailId) {
    try {
        console.log('[ModernDomainOrganizer] 🔧 Configuration événements modal');
        
        // Gestion de la recherche
        const searchInput = document.getElementById('folderSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFolders(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.selectFirstVisibleFolder();
                }
                
                if (e.key === 'Escape') {
                    this.closeFolderModal();
                }
            });
            console.log('[ModernDomainOrganizer] ✅ Événements recherche configurés');
        }
        
        // Gestion du champ de saisie personnalisé
        const customInput = document.getElementById('customFolderNameInput');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                if (this.selectedFolderData && this.selectedFolderData.action === 'new') {
                    this.selectedFolderData.folderName = e.target.value;
                }
            });
            
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmFolderSelection(domain, emailId);
                }
            });
            console.log('[ModernDomainOrganizer] ✅ Événements input personnalisé configurés');
        }
        
        // Fermeture sur Escape
        this.modalKeydownHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('folderSelectModal');
                if (modal && modal.style.display === 'flex') {
                    this.closeFolderModal();
                }
            }
        };
        
        document.addEventListener('keydown', this.modalKeydownHandler);
        console.log('[ModernDomainOrganizer] ✅ Événements clavier configurés');
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur setup événements modal:', error);
    }
}

handleModalKeydown(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('folderSelectModal');
        if (modal && !modal.classList.contains('hidden')) {
            this.closeFolderModal();
        }
    }
}

showCustomFolderInput() {
    try {
        const section = document.getElementById('customFolderSection');
        const input = document.getElementById('customFolderNameInput');
        
        if (section) {
            section.classList.remove('hidden');
            if (input) {
                input.focus();
                input.value = '';
            }
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur affichage input personnalisé:', error);
    }
}

filterFolders(searchTerm) {
    try {
        const term = searchTerm.toLowerCase().trim();
        const allFolderOptions = document.querySelectorAll('.folder-option:not(.special-option)');
        const stats = document.getElementById('searchStats');
        
        let visibleCount = 0;
        const matchedFolders = new Set();
        
        // Première passe : identifier tous les dossiers qui correspondent
        allFolderOptions.forEach(option => {
            const folderName = option.dataset.folderName?.toLowerCase() || '';
            const folderPath = option.dataset.folderPath?.toLowerCase() || '';
            const folderId = option.dataset.folderId;
            
            const isMatch = !term || 
                           folderName.includes(term) || 
                           folderPath.includes(term);
            
            if (isMatch) {
                matchedFolders.add(folderId);
                visibleCount++;
            }
        });
        
        // Deuxième passe : afficher/masquer et gérer la hiérarchie
        allFolderOptions.forEach(option => {
            const folderId = option.dataset.folderId;
            const isMatch = matchedFolders.has(folderId);
            
            if (isMatch || !term) {
                option.style.display = 'flex';
                
                // Highlight du terme recherché
                if (term && isMatch) {
                    this.highlightSearchTerm(option, term);
                } else {
                    this.removeHighlight(option);
                }
                
                // S'assurer que les parents sont visibles
                if (term && isMatch) {
                    this.showParentFolders(option);
                }
            } else {
                option.style.display = 'none';
                this.removeHighlight(option);
            }
        });
        
        // Si recherche active, déplier automatiquement les résultats
        if (term) {
            this.expandMatchedFolders(matchedFolders);
        }
        
        // Mettre à jour les statistiques
        if (stats) {
            if (term) {
                stats.textContent = `${visibleCount} dossier(s) trouvé(s) pour "${term}"`;
            } else {
                stats.textContent = `${allFolderOptions.length} dossiers disponibles`;
            }
        }
        
        console.log(`[ModernDomainOrganizer] 🔍 Recherche "${term}": ${visibleCount}/${allFolderOptions.length} visibles`);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur filtrage:', error);
    }
}
expandMatchedFolders(matchedFolders) {
    try {
        matchedFolders.forEach(folderId => {
            const childrenContainer = document.getElementById(`children-${folderId}`);
            if (childrenContainer && childrenContainer.classList.contains('hidden')) {
                const parentOption = childrenContainer.previousElementSibling;
                const expandBtn = parentOption?.querySelector('.folder-expand i');
                
                childrenContainer.classList.remove('hidden');
                if (expandBtn) {
                    expandBtn.className = 'fas fa-chevron-down';
                }
            }
        });
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur expansion dossiers:', error);
    }
}

highlightSearchTerm(option, term) {
    try {
        const nameElement = option.querySelector('.folder-name');
        if (!nameElement) return;
        
        const originalText = nameElement.dataset.originalText || nameElement.textContent;
        nameElement.dataset.originalText = originalText;
        
        const regex = new RegExp(`(${term})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark>$1</mark>');
        nameElement.innerHTML = highlightedText;
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur highlight:', error);
    }
}

removeHighlight(option) {
    try {
        const nameElement = option.querySelector('.folder-name');
        if (!nameElement) return;
        
        const originalText = nameElement.dataset.originalText;
        if (originalText) {
            nameElement.textContent = originalText;
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur suppression highlight:', error);
    }
}

showParentFolders(option) {
    try {
        let currentElement = option.parentElement;
        
        while (currentElement) {
            // Si c'est un conteneur d'enfants, l'afficher
            if (currentElement.classList.contains('folder-children')) {
                currentElement.classList.remove('hidden');
                
                // Mettre à jour le bouton d'expansion du parent
                const parentOption = currentElement.previousElementSibling;
                if (parentOption && parentOption.classList.contains('folder-option')) {
                    parentOption.style.display = 'flex';
                    const expandBtn = parentOption.querySelector('.folder-expand i');
                    if (expandBtn) {
                        expandBtn.className = 'fas fa-chevron-down';
                    }
                }
            }
            
            currentElement = currentElement.parentElement;
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur affichage parents:', error);
    }
}
expandAllVisibleFolders() {
    try {
        const visibleFolders = document.querySelectorAll('.folder-option:not([style*="display: none"])');
        
        visibleFolders.forEach(folder => {
            const childrenContainer = folder.nextElementSibling;
            if (childrenContainer && childrenContainer.classList.contains('folder-children')) {
                childrenContainer.classList.remove('hidden');
                childrenContainer.style.display = 'block';
                
                const expandBtn = folder.querySelector('.folder-expand i');
                if (expandBtn) {
                    expandBtn.className = 'fas fa-chevron-down';
                }
            }
        });
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur expansion dossiers:', error);
    }
}

clearFolderSearch() {
    try {
        const searchInput = document.getElementById('folderSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.filterFolders('');
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur clear recherche:', error);
    }
}

selectFirstVisibleFolder() {
    try {
        const firstVisible = document.querySelector('.folder-option:not(.special-option):not([style*="display: none"])');
        if (firstVisible) {
            firstVisible.click();
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur sélection premier dossier:', error);
    }
}

toggleFolderNode(folderId) {
    try {
        console.log(`[ModernDomainOrganizer] 🔄 Toggle nœud: ${folderId}`);
        
        const childrenContainer = document.getElementById(`children-${folderId}`);
        const expandBtn = event?.target?.closest('.folder-expand')?.querySelector('i') ||
                         document.querySelector(`[onclick*="${folderId}"] i`);
        
        if (childrenContainer) {
            const isHidden = childrenContainer.classList.contains('hidden');
            
            if (isHidden) {
                childrenContainer.classList.remove('hidden');
                if (expandBtn) expandBtn.className = 'fas fa-chevron-down';
                console.log(`[ModernDomainOrganizer] 📂 Nœud déplié: ${folderId}`);
            } else {
                childrenContainer.classList.add('hidden');
                if (expandBtn) expandBtn.className = 'fas fa-chevron-right';
                console.log(`[ModernDomainOrganizer] 📁 Nœud replié: ${folderId}`);
            }
        }
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur toggle nœud:', error);
    }
}

confirmFolderSelection(domain, emailId) {
    try {
        console.log('[ModernDomainOrganizer] ✅ Confirmation sélection pour:', emailId, this.selectedFolderData);
        
        if (!this.selectedFolderData) {
            this.showWarning('Veuillez sélectionner un dossier');
            return;
        }
        
        const { action, folderId, folderName } = this.selectedFolderData;
        
        // Validation pour nouveau dossier
        if (action === 'new') {
            const customName = document.getElementById('customFolderNameInput')?.value?.trim();
            if (!customName) {
                this.showWarning('Veuillez saisir un nom pour le nouveau dossier');
                return;
            }
            this.selectedFolderData.folderName = customName;
        }
        
        // Appliquer la sélection
        this.applyFolderSelection(domain, emailId, this.selectedFolderData);
        
        // Fermer le modal
        this.closeFolderModal();
        
        console.log('[ModernDomainOrganizer] ✅ Sélection confirmée et appliquée');
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur confirmation sélection:', error);
        this.showError('Erreur lors de la confirmation de la sélection');
    }
}
applyFolderSelection(domain, emailId, folderData) {
    try {
        const plan = this.organizationPlan.get(domain);
        if (!plan) {
            console.error('[ModernDomainOrganizer] Plan non trouvé pour:', domain);
            return;
        }
        
        const email = plan.emails.find(e => e.id === emailId);
        if (!email) {
            console.error('[ModernDomainOrganizer] Email non trouvé:', emailId);
            return;
        }
        
        console.log('[ModernDomainOrganizer] 📝 Application sélection:', folderData);
        
        // Réinitialiser les propriétés personnalisées
        delete email.customFolder;
        delete email.customFolderId;
        
        switch (folderData.action) {
            case 'default':
                // Utiliser le dossier par défaut - rien à faire
                console.log('[ModernDomainOrganizer] 📁 Utilisation dossier par défaut');
                break;
                
            case 'new':
                // Nouveau dossier personnalisé
                email.customFolder = folderData.folderName;
                email.customFolderId = null;
                console.log('[ModernDomainOrganizer] ✨ Nouveau dossier:', folderData.folderName);
                break;
                
            case 'existing':
                // Dossier existant
                email.customFolder = folderData.folderName;
                email.customFolderId = folderData.folderId;
                console.log('[ModernDomainOrganizer] 📂 Dossier existant:', folderData.folderName);
                break;
        }
        
        // Mettre à jour l'affichage
        this.updateEmailFolderDisplay(domain, emailId);
        this.updateTotalEmailsCount();
        
        console.log('[ModernDomainOrganizer] ✅ Sélection appliquée avec succès');
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur application sélection:', error);
    }
}
closeFolderModal() {
    try {
        console.log('[ModernDomainOrganizer] 🚪 Fermeture modal dossier');
        
        const modal = document.getElementById('folderSelectModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            
            // Supprimer le modal du DOM après un délai
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        }
        
        // Nettoyer les données de sélection
        this.selectedFolderData = null;
        
        // Supprimer le listener de clavier
        if (this.modalKeydownHandler) {
            document.removeEventListener('keydown', this.modalKeydownHandler);
            this.modalKeydownHandler = null;
        }
        
        console.log('[ModernDomainOrganizer] ✅ Modal fermé et nettoyé');
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] ❌ Erreur fermeture modal:', error);
    }
}
updateEmailFolder(domain, emailId, selectedValue) {
    try {
        console.log(`[ModernDomainOrganizer] 🎯 updateEmailFolder appelée: domain=${domain}, emailId=${emailId}, value=${selectedValue}`);
        
        if (selectedValue === '_advanced') {
            // Ouvrir le modal de sélection avancée
            console.log(`[ModernDomainOrganizer] 📁 Ouverture modal avancé pour email: ${emailId}`);
            const plan = this.organizationPlan.get(domain);
            const email = plan?.emails.find(e => e.id === emailId);
            const currentFolder = email?.customFolder || plan?.targetFolder;
            
            this.createFolderSelectModal(domain, emailId, currentFolder);
            return;
        }
        
        // Traitement normal pour les autres valeurs
        const plan = this.organizationPlan.get(domain);
        if (!plan) {
            console.error('[ModernDomainOrganizer] Plan non trouvé pour le domaine:', domain);
            return;
        }
        
        const email = plan.emails.find(e => e.id === emailId);
        if (!email) {
            console.error('[ModernDomainOrganizer] Email non trouvé:', emailId);
            return;
        }
        
        console.log(`[ModernDomainOrganizer] Mise à jour dossier pour email ${emailId}:`, selectedValue);
        
        // Réinitialiser les propriétés personnalisées
        delete email.customFolder;
        delete email.customFolderId;
        
        if (selectedValue === '_default') {
            // Utiliser le dossier par défaut du domaine
            console.log(`[ModernDomainOrganizer] Email ${emailId} utilise le dossier par défaut: ${plan.targetFolder}`);
            
        } else if (selectedValue === '_new_folder') {
            // Nouveau dossier personnalisé
            email.customFolder = `${domain}_custom`;
            email.customFolderId = null;
            console.log(`[ModernDomainOrganizer] Email ${emailId} utilise un nouveau dossier personnalisé`);
            
        } else {
            // Dossier existant sélectionné
            const selectedFolder = this.allFolders.get(selectedValue) || 
                                   Array.from(this.allFolders.values()).find(f => f.id === selectedValue);
            
            if (selectedFolder) {
                email.customFolder = selectedFolder.displayName;
                email.customFolderId = selectedFolder.id;
                console.log(`[ModernDomainOrganizer] Email ${emailId} utilise le dossier existant: ${selectedFolder.displayName}`);
            }
        }
        
        // Mettre à jour l'affichage
        this.updateEmailFolderDisplay(domain, emailId);
        
        // Recalculer les statistiques
        this.updateTotalEmailsCount();
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur mise à jour dossier email:', error);
        this.showError('Erreur lors de la mise à jour du dossier de l\'email');
    }
}

hideCustomFolderInput() {
    try {
        const section = document.getElementById('customFolderSection');
        if (section) {
            section.classList.add('hidden');
        }
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur masquage input personnalisé:', error);
    }
}

searchInChildren(children, folderId) {
    for (const child of children) {
        if (child.id === folderId) return child;
        
        const found = this.searchInChildren(child.children, folderId);
        if (found) return found;
    }
    return null;
}



updateEmailCustomFolder(domain, emailId, folderName) {
    try {
        if (!folderName || folderName.trim() === '') {
            this.showWarning('Le nom du dossier ne peut pas être vide');
            return;
        }
        
        const plan = this.organizationPlan.get(domain);
        if (!plan) return;
        
        const email = plan.emails.find(e => e.id === emailId);
        if (!email) return;
        
        const trimmedName = folderName.trim();
        email.customFolder = trimmedName;
        
        console.log(`[ModernDomainOrganizer] Nom dossier personnalisé pour ${emailId}: "${trimmedName}"`);
        
        // Vérifier si le dossier existe
        const existingFolder = this.findExistingFolderByName(trimmedName);
        if (existingFolder) {
            email.customFolderId = existingFolder.id;
            console.log(`[ModernDomainOrganizer] Dossier existant trouvé: ${existingFolder.displayName}`);
        } else {
            email.customFolderId = null;
            console.log(`[ModernDomainOrganizer] Nouveau dossier sera créé: ${trimmedName}`);
        }
        
        // Mettre à jour l'affichage
        this.updateEmailFolderDisplay(domain, emailId);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur mise à jour dossier personnalisé:', error);
        this.showError('Erreur lors de la mise à jour du nom de dossier personnalisé');
    }
}

updateEmailFolderDisplay(domain, emailId) {
    try {
        const plan = this.organizationPlan.get(domain);
        if (!plan) return;
        
        const email = plan.emails.find(e => e.id === emailId);
        if (!email) return;
        
        const emailElement = document.querySelector(`[data-email-id="${emailId}"]`);
        if (!emailElement) return;
        
        // Mettre à jour le badge d'information sur le dossier
        const folderInfo = emailElement.querySelector('.email-folder-info');
        if (folderInfo) {
            if (email.customFolder) {
                const isExisting = this.findExistingFolderByName(email.customFolder);
                folderInfo.innerHTML = `
                    <span class="custom-folder-badge ${isExisting ? 'existing' : 'new'}">
                        ${isExisting ? '📂' : '✨'} ${email.customFolder}
                    </span>
                `;
            } else {
                folderInfo.innerHTML = `
                    <span class="default-folder-badge">📁 ${plan.targetFolder}</span>
                `;
            }
        }
        
        // Mettre à jour l'affichage du champ de saisie personnalisé
        const customInput = emailElement.querySelector('.custom-folder-input');
        if (customInput) {
            if (email.customFolder && !this.findExistingFolderByName(email.customFolder)) {
                customInput.style.display = 'block';
                customInput.value = email.customFolder;
            } else {
                customInput.style.display = 'none';
            }
        }
        
        // Mettre à jour le select
        const select = emailElement.querySelector('.email-folder-select');
        if (select) {
            if (!email.customFolder) {
                select.value = '_default';
            } else if (email.customFolderId) {
                select.value = email.customFolderId;
            } else {
                select.value = '_new_folder';
            }
        }
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur mise à jour affichage dossier email:', error);
    }
}
    // Gestion des interactions avec protection d'erreurs
    toggleDomain(domain) {
        try {
            if (this.expandedDomains.has(domain)) {
                this.expandedDomains.delete(domain);
            } else {
                this.expandedDomains.add(domain);
            }
            
            const domainElement = document.querySelector(`[data-domain="${domain}"]`);
            if (domainElement) {
                const content = domainElement.querySelector('.domain-content');
                const icon = domainElement.querySelector('.domain-expand i');
                
                if (this.expandedDomains.has(domain)) {
                    domainElement.classList.add('expanded');
                    if (content) content.classList.add('expanded');
                    if (icon) icon.className = 'fas fa-chevron-down';
                } else {
                    domainElement.classList.remove('expanded');
                    if (content) content.classList.remove('expanded');
                    if (icon) icon.className = 'fas fa-chevron-right';
                }
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur toggle domaine:', error);
        }
    }

    toggleDomainSelection(domain) {
        try {
            const plan = this.organizationPlan.get(domain);
            if (plan) {
                plan.selected = !plan.selected;
                
                plan.emails.forEach(email => {
                    email.selected = plan.selected;
                });
                
                this.updateDomainDisplay(domain);
                this.updateTotalEmailsCount();
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur sélection domaine:', error);
        }
    }

    toggleEmailSelection(domain, emailId) {
        try {
            const plan = this.organizationPlan.get(domain);
            if (plan) {
                const email = plan.emails.find(e => e.id === emailId);
                if (email) {
                    email.selected = !email.selected;
                    
                    const selectedEmails = plan.emails.filter(e => e.selected !== false).length;
                    plan.selected = selectedEmails > 0;
                    
                    this.updateDomainDisplay(domain);
                    this.updateTotalEmailsCount();
                }
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur sélection email:', error);
        }
    }

    updateFolderName(domain, newName) {
        try {
            if (!newName || newName.trim() === '') {
                this.showWarning('Le nom du dossier ne peut pas être vide');
                return;
            }
            
            const plan = this.organizationPlan.get(domain);
            if (plan) {
                const trimmedName = newName.trim();
                plan.targetFolder = trimmedName;
                
                console.log(`[ModernDomainOrganizer] 🔄 Mise à jour nom dossier pour ${domain}: "${trimmedName}"`);
                
                const existingFolder = this.findExistingFolderByName(trimmedName);
                if (existingFolder) {
                    console.log(`[ModernDomainOrganizer] ✅ Dossier existant trouvé: "${existingFolder.displayName}"`);
                    plan.action = 'use-existing';
                    plan.targetFolderId = existingFolder.id;
                } else {
                    console.log(`[ModernDomainOrganizer] 📁 Nouveau dossier sera créé: "${trimmedName}"`);
                    plan.action = 'create-new';
                    plan.targetFolderId = null;
                }
                
                const domainElement = document.querySelector(`[data-domain="${domain}"]`);
                if (domainElement) {
                    const badge = domainElement.querySelector('.action-badge');
                    if (badge) {
                        badge.className = `action-badge ${plan.action === 'create-new' ? 'action-new' : 'action-existing'}`;
                        badge.textContent = plan.action === 'create-new' ? 'Nouveau' : 'Existant';
                    }
                }
                
                this.displayPlanSummary(document.getElementById('planSummary'));
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour nom dossier:', error);
            this.showError('Erreur lors de la mise à jour du nom de dossier');
        }
    }

    updateDomainDisplay(domain) {
        try {
            const plan = this.organizationPlan.get(domain);
            if (!plan) return;
            
            const domainElement = document.querySelector(`[data-domain="${domain}"]`);
            if (domainElement) {
                const domainCheckbox = domainElement.querySelector('.domain-checkbox');
                if (domainCheckbox) domainCheckbox.checked = plan.selected;
                
                const selectedEmails = plan.emails.filter(e => e.selected !== false).length;
                const statsElement = domainElement.querySelector('.domain-stats');
                if (statsElement) {
                    statsElement.textContent = `${plan.emailCount} emails • ${selectedEmails} sélectionnés`;
                }
                
                plan.emails.forEach(email => {
                    const emailCheckbox = domainElement.querySelector(`[data-email-id="${email.id}"]`);
                    if (emailCheckbox) {
                        emailCheckbox.checked = email.selected !== false;
                    }
                });
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour affichage domaine:', error);
        }
    }

    updateTotalEmailsCount() {
        try {
            const totalSelected = Array.from(this.organizationPlan.values())
                .reduce((sum, plan) => {
                    if (plan.selected) {
                        return sum + plan.emails.filter(e => e.selected !== false).length;
                    }
                    return sum;
                }, 0);
            
            const element = document.getElementById('selectedEmailsText');
            if (element) {
                element.textContent = `${totalSelected.toLocaleString()} emails sélectionnés`;
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour total:', error);
        }
    }

    // Contrôles globaux
    expandAllDomains() {
        try {
            this.organizationPlan.forEach((plan, domain) => {
                this.expandedDomains.add(domain);
            });
            this.showOrganizationPlan();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur déplier tout:', error);
        }
    }

    collapseAllDomains() {
        try {
            this.expandedDomains.clear();
            this.showOrganizationPlan();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur replier tout:', error);
        }
    }

    selectAllDomains() {
        try {
            this.organizationPlan.forEach((plan, domain) => {
                plan.selected = true;
                plan.emails.forEach(email => {
                    email.selected = true;
                });
                this.updateDomainDisplay(domain);
            });
            this.updateTotalEmailsCount();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur sélectionner tout:', error);
        }
    }

    deselectAllDomains() {
        try {
            this.organizationPlan.forEach((plan, domain) => {
                plan.selected = false;
                plan.emails.forEach(email => {
                    email.selected = false;
                });
                this.updateDomainDisplay(domain);
            });
            this.updateTotalEmailsCount();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur désélectionner tout:', error);
        }
    }

    // Création des dossiers seulement
    async createFoldersOnly() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.clearErrors();
            
            const selectedDomains = Array.from(this.organizationPlan.values()).filter(p => p.selected);
            const newFolders = selectedDomains.filter(p => p.action === 'create-new');
            
            if (newFolders.length === 0) {
                this.showWarning('Aucun nouveau dossier à créer');
                return;
            }
            
            this.goToStep('execution');
            document.getElementById('executionTitle').textContent = 'Création des dossiers';
            
            const results = {
                foldersCreated: 0,
                emailsMoved: 0,
                domainsProcessed: 0,
                errorsCount: 0,
                errors: [],
                createdFolders: []
            };
            
            this.addExecutionLog('📁 Début de la création des dossiers', 'info');
            
            const totalFolders = newFolders.length;
            let processed = 0;
            
            for (const plan of newFolders) {
                try {
                    this.updateExecutionProgress(
                        (processed / totalFolders) * 100,
                        `Création du dossier "${plan.targetFolder}"...`
                    );
                    
                    this.addExecutionLog(`📁 Création du dossier "${plan.targetFolder}"`, 'info');
                    await this.createFolder(plan.targetFolder);
                    
                    results.foldersCreated++;
                    results.createdFolders.push(plan.targetFolder);
                    this.updateExecutionStat('foldersCreated', results.foldersCreated);
                    
                    // Pause pour éviter les rate limits
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                } catch (error) {
                    console.error(`[ModernDomainOrganizer] Erreur création ${plan.targetFolder}:`, error);
                    this.addExecutionLog(`❌ Erreur pour "${plan.targetFolder}": ${error.message}`, 'error');
                    results.errors.push({ folder: plan.targetFolder, error: error.message });
                    results.errorsCount++;
                    this.updateExecutionStat('errorsCount', results.errorsCount);
                }
                
                processed++;
            }
            
            this.updateExecutionProgress(100, 'Création terminée !');
            this.addExecutionLog('✅ Création des dossiers terminée', 'success');
            
            // Recharger les dossiers
            try {
                await this.loadAllFolders();
                this.addExecutionLog('🔄 Liste des dossiers mise à jour', 'info');
            } catch (reloadError) {
                console.warn('[ModernDomainOrganizer] Erreur rechargement dossiers:', reloadError);
            }
            
            setTimeout(() => {
                document.getElementById('successTitle').textContent = 'Dossiers créés !';
                this.showFinalReport(results);
            }, 1000);
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur création dossiers:', error);
            this.addExecutionLog(`❌ Erreur critique: ${error.message}`, 'error');
            this.showError('Erreur lors de la création des dossiers: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

async executeOrganization() {
    if (this.isProcessing) return;
    
    try {
        this.isProcessing = true;
        this.clearErrors();
        
        const selectedEmails = Array.from(this.organizationPlan.values())
            .reduce((sum, plan) => {
                if (plan.selected) {
                    return sum + plan.emails.filter(e => e.selected !== false).length;
                }
                return sum;
            }, 0);
        
        if (selectedEmails === 0) {
            this.showWarning('Aucun email sélectionné à organiser');
            return;
        }
        
        this.goToStep('execution');
        document.getElementById('executionTitle').textContent = 'Organisation complète';
        
        const results = {
            foldersCreated: 0,
            emailsMoved: 0,
            domainsProcessed: 0,
            errorsCount: 0,
            errors: [],
            createdFolders: [],
            processedDomains: []
        };
        
        this.addExecutionLog('🚀 Début de l\'organisation complète', 'info');
        
        const folderActions = new Map();
        
        // Préparation des actions avec support des dossiers personnalisés
        this.organizationPlan.forEach((plan, domain) => {
            if (!plan.selected) return;
            
            plan.emails.forEach(email => {
                if (email.selected === false) return;
                
                let targetFolder, targetFolderId, action;
                
                // Vérifier si l'email a un dossier personnalisé
                if (email.customFolder) {
                    targetFolder = email.customFolder;
                    targetFolderId = email.customFolderId;
                    action = targetFolderId ? 'use-existing' : 'create-new';
                    console.log(`[ModernDomainOrganizer] Email ${email.id} -> dossier personnalisé: ${targetFolder}`);
                } else {
                    // Utiliser le dossier par défaut du domaine
                    targetFolder = plan.targetFolder;
                    targetFolderId = plan.targetFolderId;
                    action = plan.action;
                    console.log(`[ModernDomainOrganizer] Email ${email.id} -> dossier par défaut: ${targetFolder}`);
                }
                
                if (!folderActions.has(targetFolder)) {
                    folderActions.set(targetFolder, {
                        targetFolder,
                        targetFolderId,
                        action,
                        emails: []
                    });
                }
                
                folderActions.get(targetFolder).emails.push(email);
            });
        });
        
        console.log(`[ModernDomainOrganizer] ${folderActions.size} dossiers distincts à traiter`);
        this.addExecutionLog(`📊 ${folderActions.size} dossiers distincts identifiés`, 'info');
        
        const totalFolders = folderActions.size;
        let processed = 0;
        
        // Traitement de chaque dossier
        for (const [folderName, folderData] of folderActions) {
            try {
                this.updateExecutionProgress(
                    (processed / totalFolders) * 100,
                    `Traitement du dossier "${folderName}"...`
                );
                
                let targetFolderId = folderData.targetFolderId;
                
                // Création du dossier si nécessaire
                if (folderData.action === 'create-new') {
                    this.addExecutionLog(`📁 Création du dossier "${folderName}"`, 'info');
                    const newFolder = await this.createFolder(folderName);
                    targetFolderId = newFolder.id;
                    results.foldersCreated++;
                    results.createdFolders.push(folderName);
                    this.updateExecutionStat('foldersCreated', results.foldersCreated);
                    
                    // Mettre à jour les emails qui utilisent ce nouveau dossier
                    folderData.emails.forEach(email => {
                        if (email.customFolder === folderName && !email.customFolderId) {
                            email.customFolderId = newFolder.id;
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    this.addExecutionLog(`📁 Utilisation du dossier existant "${folderName}"`, 'info');
                }
                
                // Déplacement des emails par lots
                const batchSize = 10;
                let moved = 0;
                
                for (let i = 0; i < folderData.emails.length; i += batchSize) {
                    const batch = folderData.emails.slice(i, i + batchSize);
                    
                    this.addExecutionLog(`📧 Déplacement de ${batch.length} emails vers "${folderName}"`, 'info');
                    await this.moveEmailBatch(batch, targetFolderId);
                    moved += batch.length;
                    results.emailsMoved += batch.length;
                    
                    this.updateExecutionStat('emailsMoved', results.emailsMoved);
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                this.addExecutionLog(`✅ ${moved} emails déplacés vers "${folderName}"`, 'success');
                
            } catch (error) {
                console.error(`[ModernDomainOrganizer] Erreur ${folderName}:`, error);
                this.addExecutionLog(`❌ Erreur pour "${folderName}": ${error.message}`, 'error');
                results.errors.push({ folder: folderName, error: error.message });
                results.errorsCount++;
                this.updateExecutionStat('errorsCount', results.errorsCount);
            }
            
            processed++;
        }
        
        // Comptage des domaines traités
        this.organizationPlan.forEach((plan, domain) => {
            if (plan.selected && plan.emails.some(e => e.selected !== false)) {
                results.domainsProcessed++;
                const emailsProcessed = plan.emails.filter(e => e.selected !== false).length;
                results.processedDomains.push(`${domain} (${emailsProcessed} emails)`);
            }
        });
        
        this.updateExecutionStat('domainsProcessed', results.domainsProcessed);
        
        this.updateExecutionProgress(100, 'Organisation terminée !');
        this.addExecutionLog('🎉 Organisation terminée avec succès !', 'success');
        
        // Recharger les dossiers pour mettre à jour la liste
        try {
            await this.loadAllFolders();
            this.addExecutionLog('🔄 Liste des dossiers mise à jour', 'info');
        } catch (reloadError) {
            console.warn('[ModernDomainOrganizer] Erreur rechargement dossiers:', reloadError);
        }
        
        setTimeout(() => {
            document.getElementById('successTitle').textContent = 'Organisation terminée !';
            this.showFinalReport(results);
        }, 1000);
        
    } catch (error) {
        console.error('[ModernDomainOrganizer] Erreur organisation:', error);
        this.addExecutionLog(`❌ Erreur critique: ${error.message}`, 'error');
        this.showError('Erreur lors de l\'organisation: ' + error.message);
    } finally {
        this.isProcessing = false;
    }
}

    async createFolder(folderName) {
        try {
            if (!window.authService?.isAuthenticated()) {
                throw new Error('Non authentifié');
            }
            
            // Vérification avant création
            console.log(`[ModernDomainOrganizer] 🔍 Vérification existence du dossier: "${folderName}"`);
            
            // Recharger la liste des dossiers pour s'assurer qu'elle est à jour
            await this.loadAllFolders();
            
            // Vérifier si le dossier existe déjà
            const existingFolder = this.findExistingFolderByName(folderName);
            if (existingFolder) {
                console.log(`[ModernDomainOrganizer] ✅ Dossier existe déjà: "${existingFolder.displayName}" (ID: ${existingFolder.id})`);
                return existingFolder;
            }
            
            console.log(`[ModernDomainOrganizer] 📁 Création du nouveau dossier: "${folderName}"`);
            
            const accessToken = await window.authService.getAccessToken();
            
            const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ displayName: folderName })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Gestion spécifique de l'erreur "dossier existe déjà"
                if (response.status === 409 && errorData.error?.code === 'ErrorFolderExists') {
                    console.log(`[ModernDomainOrganizer] ⚠️ Le dossier "${folderName}" existe déjà selon l'API`);
                    
                    // Recharger et chercher le dossier existant
                    await this.loadAllFolders();
                    const foundFolder = this.findExistingFolderByName(folderName);
                    
                    if (foundFolder) {
                        console.log(`[ModernDomainOrganizer] ✅ Dossier existant trouvé après rechargement: "${foundFolder.displayName}"`);
                        return foundFolder;
                    } else {
                        // Créer un nom alternatif si on ne trouve toujours pas le dossier
                        const alternativeName = `${folderName}_${Date.now()}`;
                        console.log(`[ModernDomainOrganizer] 🔄 Tentative avec nom alternatif: "${alternativeName}"`);
                        
                        const retryResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ displayName: alternativeName })
                        });
                        
                        if (retryResponse.ok) {
                            const result = await retryResponse.json();
                            console.log(`[ModernDomainOrganizer] ✅ Dossier créé avec nom alternatif: "${result.displayName}"`);
                            return result;
                        }
                    }
                }
                
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`[ModernDomainOrganizer] ✅ Nouveau dossier créé: "${result.displayName}" (ID: ${result.id})`);
            
            // Ajouter le nouveau dossier à notre cache
            this.allFolders.set(result.displayName.toLowerCase().trim(), {
                id: result.id,
                displayName: result.displayName,
                totalItemCount: 0,
                parentFolderId: result.parentFolderId
            });
            
            return result;
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur création dossier:', error);
            throw new Error(`Impossible de créer le dossier "${folderName}": ${error.message}`);
        }
    }

    async moveEmailBatch(emails, targetFolderId) {
        try {
            if (!window.authService?.isAuthenticated()) {
                throw new Error('Non authentifié');
            }
            
            const accessToken = await window.authService.getAccessToken();
            
            const batchRequests = emails.map((email, index) => ({
                id: index.toString(),
                method: 'POST',
                url: `/me/messages/${email.id}/move`,
                body: { destinationId: targetFolderId },
                headers: { 'Content-Type': 'application/json' }
            }));
            
            const response = await fetch('https://graph.microsoft.com/v1.0/$batch', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requests: batchRequests })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            // Vérifier les erreurs dans la réponse batch
            if (result.responses) {
                const errors = result.responses.filter(r => r.status >= 400);
                if (errors.length > 0) {
                    console.warn('[ModernDomainOrganizer] Erreurs batch:', errors);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur déplacement batch:', error);
            throw new Error(`Erreur lors du déplacement: ${error.message}`);
        }
    }

    showFinalReport(results) {
        try {
            this.goToStep('success');
            
            const report = document.getElementById('successReport');
            if (!report) return;
            
            let reportHTML = '<div class="report-section">';
            reportHTML += '<h4>📊 Résumé</h4>';
            reportHTML += '<ul class="report-list">';
            reportHTML += `<li>Emails déplacés: <strong>${results.emailsMoved.toLocaleString()}</strong></li>`;
            reportHTML += `<li>Domaines traités: <strong>${results.domainsProcessed}</strong></li>`;
            reportHTML += `<li>Dossiers créés: <strong>${results.foldersCreated}</strong></li>`;
            if (results.errorsCount > 0) {
                reportHTML += `<li>Erreurs: <strong>${results.errorsCount}</strong></li>`;
            }
            reportHTML += '</ul></div>';
            
            if (results.createdFolders.length > 0) {
                reportHTML += '<div class="report-section">';
                reportHTML += '<h4>✨ Nouveaux dossiers</h4>';
                reportHTML += '<ul class="report-list">';
                results.createdFolders.slice(0, 10).forEach(folder => {
                    reportHTML += `<li>📁 ${folder}</li>`;
                });
                if (results.createdFolders.length > 10) {
                    reportHTML += `<li><em>... et ${results.createdFolders.length - 10} autres</em></li>`;
                }
                reportHTML += '</ul></div>';
            }
            
            if (results.errors.length > 0) {
                reportHTML += '<div class="report-section">';
                reportHTML += '<h4>⚠️ Erreurs</h4>';
                reportHTML += '<ul class="report-list">';
                results.errors.slice(0, 5).forEach(error => {
                    reportHTML += `<li style="color: #dc2626;">${error.folder}: ${error.error}</li>`;
                });
                if (results.errors.length > 5) {
                    reportHTML += `<li><em>... et ${results.errors.length - 5} autres erreurs</em></li>`;
                }
                reportHTML += '</ul></div>';
            }
            
            report.innerHTML = reportHTML;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur rapport final:', error);
        }
    }

    // Utilitaires avec gestion d'erreurs
    updateProgress(percent, message) {
        try {
            const progressFill = document.getElementById('progressBar');
            const progressText = document.getElementById('progressPercent');
            const status = document.getElementById('scanStatus');

            if (progressFill) progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
            if (progressText) progressText.textContent = `${Math.round(percent)}%`;
            if (status) status.textContent = message || 'En cours...';
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour progress:', error);
        }
    }

    updateStat(statId, value) {
        try {
            const element = document.getElementById(statId);
            if (element) {
                element.textContent = (value || 0).toLocaleString();
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour stat:', error);
        }
    }

    updateExecutionProgress(percent, message) {
        try {
            const progressFill = document.getElementById('executionProgressBar');
            const progressText = document.getElementById('executionPercent');
            const status = document.getElementById('executionStatus');

            if (progressFill) progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
            if (progressText) progressText.textContent = `${Math.round(percent)}%`;
            if (status) status.textContent = message || 'En cours...';
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour execution progress:', error);
        }
    }

    updateExecutionStat(statId, value) {
        try {
            const element = document.getElementById(statId);
            if (element) {
                element.textContent = (value || 0).toLocaleString();
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur mise à jour execution stat:', error);
        }
    }

    addExecutionLog(message, type = 'info') {
        try {
            const log = document.getElementById('executionLog');
            if (!log) return;
            
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
            
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
            
            // Limiter le nombre d'entrées pour éviter la surcharge
            const entries = log.querySelectorAll('.log-entry');
            if (entries.length > 100) {
                entries[0].remove();
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur ajout log:', error);
        }
    }

    // Gestion des erreurs et messages
    showError(message) {
        try {
            console.error('[ModernDomainOrganizer] Erreur:', message);
            this.showMessage(message, 'error');
            
            if (window.uiManager?.showToast) {
                window.uiManager.showToast(message, 'error');
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage erreur:', error);
        }
    }

    showWarning(message) {
        try {
            console.warn('[ModernDomainOrganizer] Avertissement:', message);
            this.showMessage(message, 'warning');
            
            if (window.uiManager?.showToast) {
                window.uiManager.showToast(message, 'warning');
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage warning:', error);
        }
    }

    showMessage(message, type) {
        try {
            this.clearErrors();
            
            const currentCard = document.querySelector('.step-content:not(.hidden) .step-card');
            if (!currentCard) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `${type}-message`;
            messageDiv.textContent = message;
            
            currentCard.insertBefore(messageDiv, currentCard.firstChild);
            
            // Auto-suppression après 5 secondes
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage message:', error);
        }
    }

    clearErrors() {
        try {
            document.querySelectorAll('.error-message, .warning-message, .info-message').forEach(el => {
                el.remove();
            });
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur clear errors:', error);
        }
    }

    // Extraction et validation des données
    extractDomain(email) {
        try {
            const address = email?.from?.emailAddress?.address;
            if (!address || typeof address !== 'string') return null;
            
            const parts = address.toLowerCase().split('@');
            return parts.length === 2 ? parts[1] : null;
        } catch (error) {
            return null;
        }
    }

    shouldExcludeDomain(domain, excludedDomains) {
        try {
            if (!domain || !Array.isArray(excludedDomains)) return false;
            
            return excludedDomains.some(excluded => {
                try {
                    return domain.toLowerCase().includes(excluded.toLowerCase());
                } catch {
                    return false;
                }
            });
        } catch (error) {
            return false;
        }
    }

    shouldExcludeEmail(email, excludedEmails) {
        try {
            const address = email?.from?.emailAddress?.address?.toLowerCase();
            if (!address || !Array.isArray(excludedEmails)) return false;
            
            return excludedEmails.some(excluded => {
                try {
                    return address.includes(excluded.toLowerCase());
                } catch {
                    return false;
                }
            });
        } catch (error) {
            return false;
        }
    }

    findExistingFolder(domain) {
        try {
            if (!domain) return null;
            
            const domainLower = domain.toLowerCase().trim();
            console.log(`[ModernDomainOrganizer] 🔍 Recherche dossier pour: "${domainLower}"`);
            
            // 1. Recherche exacte
            const exactMatch = this.allFolders.get(domainLower);
            if (exactMatch) {
                console.log(`[ModernDomainOrganizer] ✅ Correspondance exacte: "${exactMatch.displayName}"`);
                return exactMatch;
            }
            
            // 2. Recherche par partie principale du domaine
            const domainParts = domainLower.split('.');
            if (domainParts.length > 1) {
                const mainDomain = domainParts[0];
                const mainMatch = this.allFolders.get(mainDomain);
                if (mainMatch) {
                    console.log(`[ModernDomainOrganizer] ✅ Correspondance partielle: "${mainMatch.displayName}" pour ${mainDomain}`);
                    return mainMatch;
                }
            }
            
            // 3. Recherche inversée (nom de dossier contient le domaine)
            for (const [folderKey, folder] of this.allFolders) {
                if (folderKey.includes(domainLower)) {
                    console.log(`[ModernDomainOrganizer] ✅ Correspondance contient: "${folder.displayName}"`);
                    return folder;
                }
            }
            
            // 4. Recherche approximative (domaine contient nom de dossier)
            for (const [folderKey, folder] of this.allFolders) {
                if (domainLower.includes(folderKey) && folderKey.length > 3) { // Éviter les matches trop courts
                    console.log(`[ModernDomainOrganizer] ✅ Correspondance approximative: "${folder.displayName}"`);
                    return folder;
                }
            }
            
            console.log(`[ModernDomainOrganizer] ❌ Aucun dossier trouvé pour: "${domainLower}"`);
            return null;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur recherche dossier:', error);
            return null;
        }
    }

    findExistingFolderByName(name) {
        try {
            if (!name) return null;
            
            const nameLower = name.toLowerCase().trim();
            console.log(`[ModernDomainOrganizer] 🔍 Recherche dossier par nom: "${nameLower}"`);
            
            // Recherche exacte par nom
            for (const folder of this.allFolders.values()) {
                if (folder.displayName.toLowerCase().trim() === nameLower) {
                    console.log(`[ModernDomainOrganizer] ✅ Dossier trouvé par nom: "${folder.displayName}"`);
                    return folder;
                }
            }
            
            console.log(`[ModernDomainOrganizer] ❌ Aucun dossier trouvé pour le nom: "${nameLower}"`);
            return null;
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur recherche dossier par nom:', error);
            return null;
        }
    }

    // Modal management
    closeEmailModal() {
        try {
            const modal = document.getElementById('emailModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur fermeture modal:', error);
        }
    }

    saveEmailChanges() {
        try {
            // Placeholder pour l'édition d'emails (fonctionnalité avancée)
            this.closeEmailModal();
            this.showMessage('Fonctionnalité d\'édition en développement', 'info');
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur sauvegarde email:', error);
        }
    }

    restart() {
        try {
            this.currentStep = 'introduction';
            this.scanResults = null;
            this.organizationPlan.clear();
            this.emailsByDomain.clear();
            this.expandedDomains.clear();
            this.totalEmailsScanned = 0;
            this.isProcessing = false;
            
            this.clearErrors();
            this.goToStep('introduction');
            this.setDefaultDates();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur restart:', error);
        }
    }

    // Interface publique
    showPage() {
        try {
            console.log('[ModernDomainOrganizer] Affichage de la page...');
            
            if (!window.authService?.isAuthenticated()) {
                this.showError('Veuillez vous connecter pour continuer');
                return;
            }
            
            const loginPage = document.getElementById('loginPage');
            if (loginPage) loginPage.style.display = 'none';
            
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                pageContent.style.display = 'block';
                pageContent.innerHTML = this.getPageHTML();
            }
            
            this.initializePage();
            
            // Mise à jour de la navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const rangerButton = document.querySelector('[data-page="ranger"]');
            if (rangerButton) rangerButton.classList.add('active');
            
            console.log('[ModernDomainOrganizer] ✅ Page affichée');
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur affichage page:', error);
            this.showError('Erreur lors de l\'affichage de la page: ' + error.message);
        }
    }
}

// Initialisation avec gestion d'erreurs
try {
    window.modernDomainOrganizer = new ModernDomainOrganizer();
    
    // Gestion autonome des événements
    document.addEventListener('DOMContentLoaded', function() {
        try {
            document.addEventListener('click', function(e) {
                const rangerButton = e.target.closest('[data-page="ranger"]');
                if (!rangerButton) return;
                
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                window.modernDomainOrganizer.showPage();
                return false;
            }, true);
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur setup événements:', error);
        }
    });
    
    // Fonction globale d'accès
    window.showModernDomainOrganizer = function() {
        try {
            window.modernDomainOrganizer.showPage();
        } catch (error) {
            console.error('[ModernDomainOrganizer] Erreur fonction globale:', error);
        }
    };
    
    console.log('[ModernDomainOrganizer] ✅ Module chargé avec gestion d\'erreurs complète');
    
} catch (error) {
    console.error('[ModernDomainOrganizer] ❌ Erreur fatale lors du chargement:', error);
}
