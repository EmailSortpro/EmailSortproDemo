// DomainOrganizer.js - Module complet de rangement automatique des emails par domaine
// Version 2.0.0 - Module unifié avec interface intégrée

class DomainOrganizer {
    constructor() {
        // État du module
        this.isProcessing = false;
        this.existingFolders = new Map();
        this.domainAnalysis = new Map();
        this.emailsByDomain = new Map();
        this.excludedDomains = new Set();
        this.excludedEmails = new Set();
        this.progressCallback = null;
        
        // État de l'interface
        this.currentAnalysis = null;
        this.selectedActions = new Map();
        
        console.log('[DomainOrganizer] ✅ Module initialized');
    }

    // ================================================
    // MÉTHODES D'INTERFACE - GESTION DE LA PAGE
    // ================================================
    
    /**
     * Génère le HTML de la page
     */
    getPageHTML() {
        return `
            <div class="container" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
                <!-- Configuration Card -->
                <div class="card" id="configCard">
                    <h2 class="card-title">
                        <i class="fas fa-folder-tree"></i>
                        Rangement par domaine
                    </h2>
                    
                    <form id="organizeForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="startDate">Date de début</label>
                                <input type="date" id="startDate" name="startDate">
                                <span class="help-text">Laisser vide pour tous les emails</span>
                            </div>
                            
                            <div class="form-group">
                                <label for="endDate">Date de fin</label>
                                <input type="date" id="endDate" name="endDate">
                                <span class="help-text">Laisser vide pour jusqu'à aujourd'hui</span>
                            </div>
                            
                            <div class="form-group full-width">
                                <label for="excludeDomains">Domaines à exclure</label>
                                <input type="text" id="excludeDomains" placeholder="gmail.com, outlook.com">
                                <span class="help-text">Séparer par des virgules</span>
                            </div>
                            
                            <div class="form-group full-width">
                                <label for="excludeEmails">Emails à exclure</label>
                                <textarea id="excludeEmails" placeholder="contact@example.com&#10;noreply@service.com"></textarea>
                                <span class="help-text">Un email par ligne</span>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" id="analyzeBtn">
                            <i class="fas fa-search"></i>
                            Analyser les emails
                        </button>
                    </form>
                </div>

                <!-- Progress Card -->
                <div class="card" id="progressCard" style="display: none;">
                    <div class="loading">
                        <div class="spinner"></div>
                        <div id="progressText">Analyse en cours...</div>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Results Card -->
                <div class="card" id="resultsCard" style="display: none;">
                    <h2 class="card-title">
                        <i class="fas fa-chart-bar"></i>
                        Résultats de l'analyse
                    </h2>

                    <div class="stats-row">
                        <div class="stat">
                            <div class="stat-value" id="statEmails">0</div>
                            <div class="stat-label">Emails</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="statDomains">0</div>
                            <div class="stat-label">Domaines</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="statNew">0</div>
                            <div class="stat-label">Nouveaux dossiers</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="statExisting">0</div>
                            <div class="stat-label">Dossiers existants</div>
                        </div>
                    </div>

                    <div class="compact-results">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px">
                                        <input type="checkbox" id="selectAll" checked>
                                    </th>
                                    <th>Domaine</th>
                                    <th style="width: 80px">Emails</th>
                                    <th style="width: 200px">Dossier cible</th>
                                    <th style="width: 100px">Action</th>
                                </tr>
                            </thead>
                            <tbody id="resultsTableBody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>

                    <div class="action-bar">
                        <div class="checkbox-group">
                            <input type="checkbox" id="createFolders" checked>
                            <label for="createFolders">Créer les nouveaux dossiers</label>
                        </div>
                        
                        <div>
                            <button class="btn btn-secondary" onclick="window.domainOrganizer.resetForm()">
                                <i class="fas fa-redo"></i>
                                Recommencer
                            </button>
                            <button class="btn btn-primary" id="applyBtn" onclick="window.domainOrganizer.applyOrganization()">
                                <i class="fas fa-check"></i>
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Success Message -->
                <div class="status-message status-success" id="successMessage" style="display: none;">
                    <i class="fas fa-check-circle"></i>
                    <span>Rangement terminé avec succès !</span>
                </div>
            </div>

            <style>
                /* Styles spécifiques pour le rangement par domaine */
                .card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 24px;
                    margin-bottom: 16px;
                }

                .card-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #64748b;
                }

                .form-group input[type="date"],
                .form-group input[type="text"],
                .form-group textarea {
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .form-group textarea {
                    resize: vertical;
                    min-height: 60px;
                    font-family: inherit;
                }

                .help-text {
                    font-size: 11px;
                    color: #94a3b8;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #64748b;
                }

                .progress {
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 16px 0;
                }

                .progress-bar {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                }

                .stats-row {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 6px;
                }

                .stat {
                    flex: 1;
                    text-align: center;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1e293b;
                }

                .stat-label {
                    font-size: 12px;
                    color: #64748b;
                }

                .compact-results {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                }

                .results-table {
                    width: 100%;
                    font-size: 13px;
                    border-collapse: collapse;
                }

                .results-table th {
                    text-align: left;
                    padding: 8px;
                    border-bottom: 2px solid #e2e8f0;
                    font-weight: 600;
                    color: #64748b;
                    font-size: 12px;
                    text-transform: uppercase;
                    background: white;
                    position: sticky;
                    top: 0;
                }

                .results-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .domain-name {
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .email-count {
                    background: #eff6ff;
                    color: #3b82f6;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .folder-select {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 13px;
                    background: white;
                }

                .action-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .action-new {
                    background: #d1fae5;
                    color: #065f46;
                }

                .action-existing {
                    background: #e0e7ff;
                    color: #3730a3;
                }

                .action-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .checkbox-group input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }

                .status-message {
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-success {
                    background: #d1fae5;
                    color: #065f46;
                }
            </style>
        `;
    }

    /**
     * Initialise la page et les event listeners
     */
    async initializePage() {
        console.log('[DomainOrganizer] Initializing page...');
        
        // Vérifier l'authentification
        if (!window.authService?.isAuthenticated()) {
            window.uiManager?.showToast('Veuillez vous connecter pour utiliser cette fonctionnalité', 'warning');
            return false;
        }
        
        // Configurer les event listeners
        this.setupEventListeners();
        
        // Définir les dates par défaut
        this.setDefaultDates();
        
        return true;
    }

    /**
     * Configure les event listeners
     */
    setupEventListeners() {
        // Formulaire principal
        const form = document.getElementById('organizeForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.handleSelectAll(e));
        }
    }

    /**
     * Définit les dates par défaut
     */
    setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.valueAsDate = thirtyDaysAgo;
        if (endDateInput) endDateInput.valueAsDate = today;
    }

    /**
     * Gère la soumission du formulaire
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        const formData = this.getFormData();
        await this.startAnalysis(formData);
    }

    /**
     * Récupère les données du formulaire
     */
    getFormData() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const excludeDomains = document.getElementById('excludeDomains').value
            .split(',')
            .map(d => d.trim())
            .filter(d => d);
        const excludeEmails = document.getElementById('excludeEmails').value
            .split('\n')
            .map(e => e.trim())
            .filter(e => e);
        
        return { startDate, endDate, excludeDomains, excludeEmails };
    }

    /**
     * Lance l'analyse
     */
    async startAnalysis(formData) {
        try {
            this.isProcessing = true;
            this.showProgress();
            
            // Configurer le module SANS callback qui cause la boucle infinie
            this.configure({
                excludeDomains: formData.excludeDomains,
                excludeEmails: formData.excludeEmails,
                onProgress: (progress) => {
                    // Mise à jour directe sans appeler updateProgress qui rappelle le callback
                    const progressBar = document.getElementById('progressBar');
                    const progressText = document.getElementById('progressText');
                    
                    if (progressBar) progressBar.style.width = `${progress.percent}%`;
                    if (progressText) progressText.textContent = progress.message || 'Analyse en cours...';
                }
            });
            
            // Lancer l'analyse
            const results = await this.analyzeEmails({
                startDate: formData.startDate,
                endDate: formData.endDate,
                folders: ['inbox']
            });
            
            this.currentAnalysis = results;
            this.showResults(results);
            
        } catch (error) {
            console.error('[DomainOrganizer] Analysis error:', error);
            window.uiManager?.showToast(`Erreur: ${error.message}`, 'error');
            this.resetForm();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Affiche la progression
     */
    showProgress() {
        document.getElementById('configCard').style.display = 'none';
        document.getElementById('progressCard').style.display = 'block';
        document.getElementById('resultsCard').style.display = 'none';
    }

    /**
     * Met à jour la progression
     */
    updateProgress(progress) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) progressBar.style.width = `${progress.percent}%`;
        if (progressText) progressText.textContent = progress.message || 'Analyse en cours...';
        
        if (this.progressCallback) {
            this.progressCallback(progress);
        }
    }

    /**
     * Affiche les résultats
     */
    showResults(results) {
        // Mettre à jour les statistiques
        document.getElementById('statEmails').textContent = results.totalEmails;
        document.getElementById('statDomains').textContent = results.totalDomains;
        document.getElementById('statNew').textContent = results.domainsToCreate;
        document.getElementById('statExisting').textContent = results.domainsWithExisting;
        
        // Afficher le tableau
        this.displayDomainsTable(results.domains);
        
        // Préparer les actions
        this.prepareActions();
        
        // Afficher les résultats
        document.getElementById('progressCard').style.display = 'none';
        document.getElementById('resultsCard').style.display = 'block';
    }

    /**
     * Affiche le tableau des domaines
     */
    displayDomainsTable(domains) {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        domains.forEach((domain, index) => {
            const row = this.createDomainRow(domain, index);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de domaine
     */
    createDomainRow(domainData, index) {
        const row = document.createElement('tr');
        row.dataset.domain = domainData.domain;
        
        const isNewFolder = domainData.action === 'create-new';
        const existingFolders = Array.from(this.existingFolders.values());
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="domain-checkbox" data-domain="${domainData.domain}" checked>
            </td>
            <td>
                <div class="domain-name">
                    <i class="fas fa-at" style="color: #94a3b8; font-size: 12px;"></i>
                    ${domainData.domain}
                </div>
            </td>
            <td>
                <span class="email-count">${domainData.count}</span>
            </td>
            <td>
                ${isNewFolder ? 
                    `<input type="text" class="folder-select" value="${domainData.suggestedFolder}" 
                            data-domain="${domainData.domain}" style="width: 100%; font-size: 13px;">` :
                    this.createFolderSelect(domainData, existingFolders)
                }
            </td>
            <td>
                <span class="action-badge ${isNewFolder ? 'action-new' : 'action-existing'}">
                    ${isNewFolder ? 'Nouveau dossier' : 'Dossier existant'}
                </span>
            </td>
        `;
        
        // Event listeners
        const checkbox = row.querySelector('.domain-checkbox');
        checkbox.addEventListener('change', (e) => this.handleDomainToggle(e));
        
        const folderInput = row.querySelector('.folder-select, input[type="text"]');
        if (folderInput) {
            folderInput.addEventListener('change', (e) => this.handleFolderChange(e));
        }
        
        return row;
    }

    /**
     * Crée un select de dossiers
     */
    createFolderSelect(domainData, existingFolders) {
        const options = existingFolders.map(folder => 
            `<option value="${folder.id}" ${folder.displayName === domainData.suggestedFolder ? 'selected' : ''}>
                ${folder.displayName}
            </option>`
        ).join('');
        
        return `<select class="folder-select" data-domain="${domainData.domain}">${options}</select>`;
    }

    /**
     * Gère le toggle d'un domaine
     */
    handleDomainToggle(event) {
        const domain = event.target.dataset.domain;
        const isChecked = event.target.checked;
        
        if (this.selectedActions.has(domain)) {
            this.selectedActions.get(domain).selected = isChecked;
        }
    }

    /**
     * Gère le changement de dossier
     */
    handleFolderChange(event) {
        const domain = event.target.dataset.domain;
        const value = event.target.value;
        
        if (!this.selectedActions.has(domain)) return;
        
        const action = this.selectedActions.get(domain);
        
        if (event.target.tagName === 'INPUT') {
            action.targetFolder = value;
            action.action = 'create-new';
        } else {
            const selectedOption = event.target.options[event.target.selectedIndex];
            action.targetFolder = selectedOption.text;
            action.existingFolderId = value;
            action.action = 'move-existing';
        }
    }

    /**
     * Gère le select all
     */
    handleSelectAll(event) {
        const isChecked = event.target.checked;
        document.querySelectorAll('.domain-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            this.handleDomainToggle({ target: checkbox });
        });
    }

    /**
     * Prépare les actions
     */
    prepareActions() {
        this.selectedActions.clear();
        const actions = this.getPreparedActions();
        actions.forEach((action, domain) => {
            this.selectedActions.set(domain, action);
        });
    }

    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        document.getElementById('configCard').style.display = 'block';
        document.getElementById('progressCard').style.display = 'none';
        document.getElementById('resultsCard').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
        document.getElementById('organizeForm')?.reset();
        
        this.setDefaultDates();
        this.currentAnalysis = null;
        this.selectedActions.clear();
        this.isProcessing = false;
    }

    // ================================================
    // CONFIGURATION ET INITIALISATION
    // ================================================
    
    configure(options = {}) {
        const {
            excludeDomains = [],
            excludeEmails = [],
            onProgress = null,
            createFolders = true,
            maxEmailsPerBatch = 50
        } = options;

        this.excludedDomains = new Set(excludeDomains.map(d => d.toLowerCase()));
        this.excludedEmails = new Set(excludeEmails.map(e => e.toLowerCase()));
        this.progressCallback = onProgress;
        this.createFolders = createFolders;
        this.maxEmailsPerBatch = maxEmailsPerBatch;
    }

    // ================================================
    // ANALYSE DES EMAILS
    // ================================================
    
    async analyzeEmails(filters = {}) {
        console.log('[DomainOrganizer] Starting analysis...');
        
        try {
            this.isProcessing = true;
            this.resetAnalysis();
            
            await this.loadExistingFolders();
            this.updateProgress({ percent: 10, message: 'Chargement des dossiers...' });
            
            const emails = await this.fetchEmails(filters);
            this.updateProgress({ percent: 30, message: `${emails.length} emails récupérés` });
            
            await this.analyzeDomains(emails);
            this.updateProgress({ percent: 60, message: 'Analyse des domaines terminée' });
            
            const results = this.finalizeAnalysis();
            this.updateProgress({ percent: 100, message: 'Analyse terminée' });
            
            return results;
            
        } catch (error) {
            console.error('[DomainOrganizer] Analysis failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    async loadExistingFolders() {
        try {
            const folders = await window.mailService.getFolders();
            this.existingFolders.clear();
            
            folders.forEach(folder => {
                this.existingFolders.set(folder.displayName.toLowerCase(), {
                    id: folder.id,
                    displayName: folder.displayName,
                    totalItemCount: folder.totalItemCount || 0
                });
            });
            
            console.log(`[DomainOrganizer] Loaded ${this.existingFolders.size} folders`);
        } catch (error) {
            console.error('[DomainOrganizer] Error loading folders:', error);
            throw error;
        }
    }

    async fetchEmails(filters) {
        const { startDate, endDate, folders = ['inbox'] } = filters;
        const allEmails = [];
        
        for (const folder of folders) {
            try {
                const options = {
                    top: 1000,
                    orderBy: 'receivedDateTime desc'
                };
                
                if (startDate) options.startDate = startDate;
                if (endDate) options.endDate = endDate;
                
                const emails = await window.mailService.getEmailsFromFolder(folder, options);
                allEmails.push(...emails);
                
                console.log(`[DomainOrganizer] Fetched ${emails.length} emails from ${folder}`);
            } catch (error) {
                console.warn(`[DomainOrganizer] Error fetching from ${folder}:`, error);
            }
        }
        
        return allEmails;
    }

    async analyzeDomains(emails) {
        this.domainAnalysis.clear();
        this.emailsByDomain.clear();
        
        for (const email of emails) {
            const domain = this.extractDomain(email);
            if (!domain || this.shouldExclude(domain, email)) continue;
            
            if (!this.emailsByDomain.has(domain)) {
                this.emailsByDomain.set(domain, []);
            }
            this.emailsByDomain.get(domain).push(email);
            
            if (!this.domainAnalysis.has(domain)) {
                this.domainAnalysis.set(domain, {
                    domain: domain,
                    count: 0,
                    samples: [],
                    existingFolder: null,
                    suggestedFolder: null,
                    action: 'none'
                });
            }
            
            const analysis = this.domainAnalysis.get(domain);
            analysis.count++;
            
            if (analysis.samples.length < 3) {
                analysis.samples.push({
                    subject: email.subject,
                    from: email.from?.emailAddress?.name || email.from?.emailAddress?.address
                });
            }
        }
        
        this.domainAnalysis.forEach((analysis, domain) => {
            this.determineDomainAction(domain, analysis);
        });
    }

    determineDomainAction(domain, analysis) {
        const existingFolder = this.findExistingFolder(domain);
        
        if (existingFolder) {
            analysis.existingFolder = existingFolder;
            analysis.suggestedFolder = existingFolder.displayName;
            analysis.action = 'move-existing';
        } else {
            analysis.suggestedFolder = domain;
            analysis.action = 'create-new';
        }
    }

    findExistingFolder(domain) {
        if (this.existingFolders.has(domain)) {
            return this.existingFolders.get(domain);
        }
        
        const domainParts = domain.split('.');
        if (domainParts.length > 1) {
            const mainDomain = domainParts[0];
            if (this.existingFolders.has(mainDomain)) {
                return this.existingFolders.get(mainDomain);
            }
        }
        
        return null;
    }

    // ================================================
    // EXÉCUTION DES ACTIONS
    // ================================================
    
    async applyOrganization() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
            const actionsToApply = new Map();
            this.selectedActions.forEach((action, domain) => {
                if (action.selected) {
                    actionsToApply.set(domain, action);
                }
            });
            
            if (actionsToApply.size === 0) {
                window.uiManager?.showToast('Aucune action sélectionnée', 'warning');
                return;
            }
            
            const applyBtn = document.getElementById('applyBtn');
            if (applyBtn) {
                applyBtn.disabled = true;
                applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Application...';
            }
            
            const createFolders = document.getElementById('createFolders')?.checked ?? true;
            this.configure({ createFolders });
            
            const results = await this.executeOrganization(actionsToApply);
            this.showSuccess(results);
            
        } catch (error) {
            console.error('[DomainOrganizer] Apply error:', error);
            window.uiManager?.showToast(`Erreur: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            const applyBtn = document.getElementById('applyBtn');
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = '<i class="fas fa-check"></i> Appliquer';
            }
        }
    }

    async executeOrganization(domainActions) {
        const results = {
            success: 0,
            failed: 0,
            foldersCreated: 0,
            emailsMoved: 0,
            errors: []
        };
        
        let progress = 0;
        const totalDomains = domainActions.size;
        
        for (const [domain, action] of domainActions) {
            try {
                this.updateProgress({
                    percent: Math.round((progress / totalDomains) * 100),
                    message: `Traitement de ${domain}...`
                });
                
                const result = await this.processDomain(domain, action);
                
                if (result.success) {
                    results.success++;
                    results.emailsMoved += result.emailsMoved;
                    if (result.folderCreated) results.foldersCreated++;
                } else {
                    results.failed++;
                    results.errors.push({ domain, error: result.error });
                }
                
            } catch (error) {
                results.failed++;
                results.errors.push({ domain, error: error.message });
            }
            
            progress++;
        }
        
        return results;
    }

    async processDomain(domain, action) {
        const emails = this.emailsByDomain.get(domain) || [];
        const result = { success: false, emailsMoved: 0, folderCreated: false, error: null };
        
        if (emails.length === 0) {
            result.success = true;
            return result;
        }
        
        try {
            let targetFolderId;
            
            if (action.action === 'create-new' && this.createFolders) {
                const newFolder = await this.createFolder(action.targetFolder);
                targetFolderId = newFolder.id;
                result.folderCreated = true;
            } else if (action.existingFolderId) {
                targetFolderId = action.existingFolderId;
            } else {
                throw new Error('No target folder specified');
            }
            
            const batches = this.createBatches(emails, this.maxEmailsPerBatch);
            for (const batch of batches) {
                await this.moveEmailBatch(batch, targetFolderId);
                result.emailsMoved += batch.length;
            }
            
            result.success = true;
        } catch (error) {
            result.error = error.message;
        }
        
        return result;
    }

    async createFolder(folderName) {
        const accessToken = await window.authService.getAccessToken();
        
        const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ displayName: folderName })
        });
        
        if (!response.ok) throw new Error(`Failed to create folder: ${response.statusText}`);
        
        return await response.json();
    }

    async moveEmailBatch(emails, targetFolderId) {
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
        
        if (!response.ok) throw new Error(`Batch move failed: ${response.statusText}`);
        
        return await response.json();
    }

    showSuccess(results) {
        document.getElementById('resultsCard').style.display = 'none';
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            let message = `<i class="fas fa-check-circle"></i> `;
            if (results.emailsMoved > 0) {
                message += `<strong>${results.emailsMoved} emails</strong> rangés`;
            }
            if (results.foldersCreated > 0) {
                message += ` et <strong>${results.foldersCreated} dossiers</strong> créés`;
            }
            message += ' avec succès !';
            
            successMessage.innerHTML = message;
            successMessage.style.display = 'flex';
        }
        
        setTimeout(() => this.resetForm(), 3000);
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
    
    extractDomain(email) {
        try {
            if (!email.from?.emailAddress?.address) return null;
            const emailAddress = email.from.emailAddress.address.toLowerCase();
            return emailAddress.split('@')[1] || null;
        } catch (error) {
            return null;
        }
    }

    shouldExclude(domain, email) {
        if (this.excludedDomains.has(domain.toLowerCase())) return true;
        
        const emailAddress = email.from?.emailAddress?.address?.toLowerCase();
        if (emailAddress && this.excludedEmails.has(emailAddress)) return true;
        
        return false;
    }

    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    resetAnalysis() {
        this.domainAnalysis.clear();
        this.emailsByDomain.clear();
    }

    finalizeAnalysis() {
        const results = {
            totalEmails: 0,
            totalDomains: this.domainAnalysis.size,
            domainsToCreate: 0,
            domainsWithExisting: 0,
            domains: []
        };
        
        this.domainAnalysis.forEach((analysis, domain) => {
            results.totalEmails += analysis.count;
            
            if (analysis.action === 'create-new') results.domainsToCreate++;
            else if (analysis.action === 'move-existing') results.domainsWithExisting++;
            
            results.domains.push({
                domain: domain,
                count: analysis.count,
                samples: analysis.samples,
                action: analysis.action,
                existingFolder: analysis.existingFolder,
                suggestedFolder: analysis.suggestedFolder
            });
        });
        
        results.domains.sort((a, b) => b.count - a.count);
        return results;
    }

    getPreparedActions() {
        const actions = new Map();
        
        this.domainAnalysis.forEach((analysis, domain) => {
            if (analysis.count > 0) {
                actions.set(domain, {
                    domain: domain,
                    action: analysis.action,
                    targetFolder: analysis.suggestedFolder,
                    existingFolderId: analysis.existingFolder?.id,
                    emailCount: analysis.count,
                    selected: true
                });
            }
        });
        
        return actions;
    }
}

// Créer l'instance globale
window.domainOrganizer = new DomainOrganizer();
console.log('[DomainOrganizer] ✅ Module chargé - Gestion autonome');

// ================================================
// GESTION AUTONOME - Sans PageManager
// ================================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DomainOrganizer] Initialisation autonome...');
    
    // Écouter directement les clics sur le bouton "Ranger" avec une priorité élevée
    document.addEventListener('click', function(e) {
        const rangerButton = e.target.closest('[data-page="ranger"]');
        if (!rangerButton) return;
        
        // IMPORTANT : Empêcher TOUS les autres handlers
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Empêche les autres listeners sur le même élément
        
        console.log('[DomainOrganizer] Bouton Ranger cliqué - Gestion exclusive');
        
        // Vérifier l'authentification
        if (!window.authService?.isAuthenticated()) {
            window.uiManager?.showToast('Veuillez vous connecter pour utiliser cette fonctionnalité', 'warning');
            return;
        }
        
        // Afficher directement l'interface
        window.domainOrganizer.showPage();
        
        // Retourner false pour bloquer complètement la propagation
        return false;
    }, true); // true = capture phase, s'exécute avant les autres listeners
});

// Alternative : Remplacer le comportement du bouton au chargement
window.addEventListener('load', function() {
    const rangerButton = document.querySelector('[data-page="ranger"]');
    if (rangerButton) {
        // Cloner le bouton pour supprimer tous les event listeners existants
        const newButton = rangerButton.cloneNode(true);
        rangerButton.parentNode.replaceChild(newButton, rangerButton);
        
        // Ajouter notre propre listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[DomainOrganizer] Clic direct sur Ranger');
            
            if (!window.authService?.isAuthenticated()) {
                window.uiManager?.showToast('Veuillez vous connecter', 'warning');
                return;
            }
            
            window.domainOrganizer.showPage();
        });
        
        console.log('[DomainOrganizer] ✅ Bouton Ranger reconfiguré pour gestion directe');
    }
});

// Méthode pour afficher la page directement
window.domainOrganizer.showPage = function() {
    console.log('[DomainOrganizer] Affichage de la page de rangement...');
    
    // Cacher la page de login
    const loginPage = document.getElementById('loginPage');
    if (loginPage) loginPage.style.display = 'none';
    
    // Récupérer le conteneur principal
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) {
        console.error('[DomainOrganizer] Element pageContent non trouvé');
        return;
    }
    
    // Afficher le conteneur
    pageContent.style.display = 'block';
    
    // Injecter notre HTML
    pageContent.innerHTML = this.getPageHTML();
    
    // Initialiser la page
    this.initializePage();
    
    // Mettre à jour la navigation active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const rangerButton = document.querySelector('[data-page="ranger"]');
    if (rangerButton) {
        rangerButton.classList.add('active');
    }
    
    // Afficher la navigation si cachée
    const mainNav = document.getElementById('mainNav');
    if (mainNav) mainNav.style.display = 'flex';
    
    console.log('[DomainOrganizer] ✅ Page affichée avec succès');
};

// Exposer une méthode globale pour l'appel direct
window.showDomainOrganizer = function() {
    window.domainOrganizer.showPage();
};