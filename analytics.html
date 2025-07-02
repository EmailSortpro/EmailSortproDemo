<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics - EmailSortPro</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f8fafc;
            line-height: 1.6;
        }

        /* Styles pour la page de connexion */
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
        }

        .auth-card {
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }

        .auth-logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 2rem;
            color: white;
        }

        .auth-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .auth-subtitle {
            color: #6b7280;
            margin-bottom: 32px;
        }

        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .auth-input {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s ease;
        }

        .auth-input:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .auth-button {
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .auth-button:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }

        .auth-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
        }

        .auth-error {
            background: #fef2f2;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.875rem;
            margin-top: 16px;
        }

        .auth-success {
            background: #dcfce7;
            color: #16a34a;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.875rem;
            margin-top: 16px;
        }

        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #ffffff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        /* Styles existants pour la page analytics */
        .analytics-standalone {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
            display: none;
        }

        .analytics-standalone.authenticated {
            display: block;
        }

        .page-header {
            text-align: center;
            margin-bottom: 48px;
            padding: 40px 0;
            background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
            color: white;
            border-radius: 16px;
            margin: 0 0 48px 0;
            position: relative;
        }

        .page-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
        }

        .page-header p {
            font-size: 1.25rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.5;
        }

        .user-info-header {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.875rem;
        }

        .user-info-header .user-email {
            font-weight: 600;
            color: #1f2937;
        }

        .user-info-header .user-role {
            background: #f3e8ff;
            color: #7c3aed;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .logout-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .logout-btn:hover {
            background: #dc2626;
        }

        .back-to-app {
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            color: #4F46E5;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            z-index: 1000;
        }

        .back-to-app:hover {
            background: #f8fafc;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .real-time-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #dcfce7;
            color: #16a34a;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            margin-left: 16px;
        }

        .real-time-dot {
            width: 8px;
            height: 8px;
            background: #16a34a;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Tabs Navigation */
        .tabs-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 32px;
            overflow: hidden;
        }

        .tabs-nav {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
        }

        .tab-button {
            flex: 1;
            padding: 16px 24px;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 600;
            color: #64748b;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .tab-button.active {
            color: #4F46E5;
            background: #f8fafc;
            border-bottom: 2px solid #4F46E5;
        }

        .tab-button:hover:not(.active) {
            background: #f8fafc;
            color: #475569;
        }

        .tab-content {
            display: none;
            padding: 24px;
        }

        .tab-content.active {
            display: block;
        }

        /* Summary Cards */
        .analytics-summary {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #cbd5e1;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .summary-item {
            text-align: center;
            padding: 16px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .summary-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
            font-size: 1.25rem;
        }

        .summary-icon.users { background: #dbeafe; color: #1d4ed8; }
        .summary-icon.scans { background: #dcfce7; color: #16a34a; }
        .summary-icon.errors { background: #fef2f2; color: #dc2626; }
        .summary-icon.activity { background: #fef3c7; color: #d97706; }
        .summary-icon.licenses { background: #f3e8ff; color: #7c3aed; }

        .summary-number {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .summary-label {
            font-size: 0.875rem;
            color: #64748b;
            font-weight: 500;
        }

        /* Users Management */
        .users-controls {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 250px;
            position: relative;
        }

        .search-box input {
            width: 100%;
            padding: 12px 16px 12px 40px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
        }

        .search-box input:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .search-box i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
        }

        .filter-select {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-size: 0.875rem;
            cursor: pointer;
            min-width: 150px;
        }

        .filter-select:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .refresh-btn {
            padding: 12px 20px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .refresh-btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }

        /* Users Table */
        .users-table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .users-table {
            width: 100%;
            border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
            padding: 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        .users-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .users-table tbody tr:hover {
            background: #f8fafc;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4F46E5, #6366F1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
        }

        .user-details h4 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 2px;
        }

        .user-details p {
            font-size: 0.875rem;
            color: #64748b;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-badge.active {
            background: #dcfce7;
            color: #16a34a;
        }

        .status-badge.trial {
            background: #fef3c7;
            color: #d97706;
        }

        .status-badge.expired {
            background: #fef2f2;
            color: #dc2626;
        }

        .status-badge.blocked {
            background: #f3f4f6;
            color: #6b7280;
        }

        .license-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .license-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .license-badge.active {
            background: #dcfce7;
            color: #16a34a;
        }

        .license-badge.expired {
            background: #fef2f2;
            color: #dc2626;
        }

        .license-badge.trial {
            background: #fef3c7;
            color: #d97706;
        }

        .actions-cell {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .action-btn.edit {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .action-btn.license {
            background: #f3e8ff;
            color: #7c3aed;
        }

        .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* User Details Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            backdrop-filter: blur(4px);
        }

        .modal-overlay.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
        }

        .modal-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            font-size: 1.25rem;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }

        .modal-close:hover {
            background: #f3f4f6;
            color: #374151;
        }

        .modal-body {
            padding: 24px;
        }

        .detail-group {
            margin-bottom: 24px;
        }

        .detail-group h4 {
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .detail-item {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #4F46E5;
        }

        .detail-item label {
            font-size: 0.75rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            margin-bottom: 4px;
            display: block;
        }

        .detail-item value {
            font-weight: 600;
            color: #1f2937;
        }

        /* License Management */
        .license-management {
            padding: 24px;
        }

        .license-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }

        .license-header h2 {
            font-size: 1.5rem;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .add-user-form {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .add-user-form input {
            flex: 1;
            padding: 10px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
        }

        .add-user-form button {
            padding: 10px 20px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }

        .add-user-form button:hover {
            background: #059669;
        }

        .license-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .license-stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }

        .license-stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #4F46E5;
            margin-bottom: 4px;
        }

        .license-stat-label {
            font-size: 0.875rem;
            color: #64748b;
        }

        .license-users-table {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .license-users-table table {
            width: 100%;
            border-collapse: collapse;
        }

        .license-users-table th {
            background: #f8fafc;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 0.875rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .license-users-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
        }

        .license-users-table tr:hover {
            background: #f8fafc;
        }

        .user-email {
            font-weight: 500;
            color: #1f2937;
        }

        .license-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .license-status.active {
            background: #dcfce7;
            color: #16a34a;
        }

        .license-status.trial {
            background: #fef3c7;
            color: #d97706;
        }

        .license-status.expired {
            background: #fef2f2;
            color: #dc2626;
        }

        .license-status.blocked {
            background: #f3f4f6;
            color: #6b7280;
        }

        .license-actions {
            display: flex;
            gap: 8px;
        }

        .license-action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .license-action-btn.activate {
            background: #dcfce7;
            color: #16a34a;
        }

        .license-action-btn.block {
            background: #fef2f2;
            color: #dc2626;
        }

        .license-action-btn.extend {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .license-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .company-info {
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 24px;
            border-left: 4px solid #4F46E5;
        }

        .company-info h3 {
            font-size: 1.125rem;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .company-info p {
            color: #64748b;
            font-size: 0.875rem;
        }

        .no-permissions {
            text-align: center;
            padding: 60px;
            color: #64748b;
        }

        .no-permissions i {
            font-size: 4rem;
            color: #d1d5db;
            margin-bottom: 16px;
        }

        /* Loading & Error States */
        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            flex-direction: column;
            gap: 20px;
        }

        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #4F46E5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            color: #64748b;
            font-size: 1.125rem;
            font-weight: 500;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }

        .empty-state i {
            font-size: 4rem;
            margin-bottom: 16px;
            color: #d1d5db;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .last-updated {
            text-align: center;
            margin-top: 32px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            color: #64748b;
            font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .analytics-standalone {
                padding: 20px 16px;
            }

            .page-header {
                padding: 32px 20px;
            }

            .page-header h1 {
                font-size: 2rem;
                flex-direction: column;
                gap: 12px;
            }

            .tabs-nav {
                flex-direction: column;
            }

            .tab-button {
                justify-content: flex-start;
                padding: 12px 16px;
            }

            .users-controls {
                flex-direction: column;
                align-items: stretch;
            }

            .search-box {
                min-width: auto;
            }

            .users-table-container {
                overflow-x: auto;
            }

            .users-table {
                min-width: 700px;
            }

            .modal {
                width: 95%;
                margin: 20px;
            }

            .detail-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Page de connexion -->
    <div class="auth-container" id="authContainer">
        <div class="auth-card">
            <div class="auth-logo">
                <i class="fas fa-chart-line"></i>
            </div>
            <h1 class="auth-title">Analytics EmailSortPro</h1>
            <p class="auth-subtitle">Connectez-vous pour accéder aux analytics</p>
            
            <form class="auth-form" id="authForm">
                <input 
                    type="email" 
                    class="auth-input" 
                    id="authEmail" 
                    placeholder="Votre adresse email"
                    required
                    autocomplete="email"
                >
                <button type="submit" class="auth-button" id="authButton">
                    <span id="authButtonText">Se connecter</span>
                    <div class="loading-spinner" id="authSpinner" style="display: none;"></div>
                </button>
            </form>
            
            <div id="authMessage"></div>
        </div>
    </div>

    <!-- Page Analytics (cachée par défaut) -->
    <div class="analytics-standalone" id="analyticsContainer">
        <a href="./index.html" class="back-to-app">
            <i class="fas fa-arrow-left"></i>
            Retour à l'application
        </a>

        <div class="page-header">
            <div class="user-info-header">
                <span class="user-email" id="currentUserEmail">-</span>
                <span class="user-role" id="currentUserRole">-</span>
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </button>
            </div>
            
            <h1>
                <i class="fas fa-chart-line"></i>
                Analytics EmailSortPro
            </h1>
            <p>
                Tableau de bord complet pour analyser l'utilisation et gérer les utilisateurs
            </p>
            <div class="real-time-indicator">
                <div class="real-time-dot"></div>
                Données en temps réel
            </div>
        </div>

        <div class="analytics-summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-icon users">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="summary-number" id="summaryUsers">-</div>
                    <div class="summary-label">Utilisateurs actifs</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon scans">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="summary-number" id="summaryScans">-</div>
                    <div class="summary-label">Scans effectués</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon errors">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="summary-number" id="summaryErrors">-</div>
                    <div class="summary-label">Erreurs détectées</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon licenses">
                        <i class="fas fa-key"></i>
                    </div>
                    <div class="summary-number" id="summaryLicenses">-</div>
                    <div class="summary-label">Licences actives</div>
                </div>
            </div>
        </div>

        <div class="tabs-container">
            <div class="tabs-nav">
                <button class="tab-button active" onclick="switchTab('overview')">
                    <i class="fas fa-chart-bar"></i>
                    Vue d'ensemble
                </button>
                <button class="tab-button" onclick="switchTab('users')">
                    <i class="fas fa-users"></i>
                    Gestion utilisateurs
                </button>
                <button class="tab-button" onclick="switchTab('licenses')">
                    <i class="fas fa-key"></i>
                    Gestion licences
                </button>
            </div>

            <!-- Overview Tab -->
            <div class="tab-content active" id="overviewTab">
                <div id="loadingContainer" class="loading-container">
                    <div class="spinner"></div>
                    <div class="loading-text">Chargement des analytics...</div>
                </div>
                <div id="analyticsContent"></div>
            </div>

            <!-- Users Tab -->
            <div class="tab-content" id="usersTab">
                <div class="users-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Rechercher un utilisateur..." id="userSearch">
                    </div>
                    <select class="filter-select" id="statusFilter">
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="trial">En essai</option>
                        <option value="expired">Expirés</option>
                        <option value="blocked">Bloqués</option>
                    </select>
                    <select class="filter-select" id="companyFilter">
                        <option value="">Toutes les sociétés</option>
                    </select>
                    <button class="refresh-btn" onclick="refreshUsers()">
                        <i class="fas fa-sync-alt"></i>
                        Actualiser
                    </button>
                </div>

                <div class="users-table-container">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Société</th>
                                <th>Statut</th>
                                <th>Dernière connexion</th>
                                <th>Connexions</th>
                                <th>Rôle</th>
                                <th>Licence</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <!-- Users will be loaded here -->
                        </tbody>
                    </table>
                </div>

                <div id="usersEmptyState" class="empty-state" style="display: none;">
                    <i class="fas fa-users"></i>
                    <h3>Aucun utilisateur trouvé</h3>
                    <p>Essayez de modifier vos filtres de recherche</p>
                </div>
            </div>

            <!-- Licenses Tab -->
            <div class="tab-content" id="licensesTab">
                <div id="licenseManagement" class="license-management">
                    <!-- Le contenu sera généré dynamiquement -->
                </div>
            </div>
        </div>

        <div class="last-updated">
            <i class="fas fa-clock"></i>
            Dernière mise à jour : <span id="lastUpdated">-</span>
        </div>
    </div>

    <!-- User Details Modal -->
    <div class="modal-overlay" id="userModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Détails utilisateur</h3>
                <button class="modal-close" onclick="closeUserModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- User details will be loaded here -->
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let analyticsManager = null;
        let analyticsModule = null;
        let licenseService = null;
        let supabaseClient = null;
        let currentUsers = [];
        let filteredUsers = [];
        let currentTab = 'overview';
        let authenticatedUser = null;

        // Gestion de l'authentification
        async function handleAuthentication(event) {
            event.preventDefault();
            
            const email = document.getElementById('authEmail').value.trim();
            const button = document.getElementById('authButton');
            const buttonText = document.getElementById('authButtonText');
            const spinner = document.getElementById('authSpinner');
            const messageDiv = document.getElementById('authMessage');
            
            if (!email || !email.includes('@')) {
                showAuthMessage('Veuillez entrer une adresse email valide', 'error');
                return;
            }
            
            // Afficher le spinner
            button.disabled = true;
            buttonText.style.display = 'none';
            spinner.style.display = 'block';
            messageDiv.innerHTML = '';
            
            try {
                // Initialiser le service de licence
                if (!licenseService) {
                    await loadLicenseService();
                }
                
                // Initialiser Supabase AVANT l'authentification
                await initializeSupabase();
                
                // Authentifier avec l'email
                const result = await licenseService.authenticateWithEmail(email);
                
                if (result.valid) {
                    // Vérifier si l'utilisateur a des droits d'admin
                    if (result.user.role === 'company_admin' || result.user.role === 'super_admin') {
                        authenticatedUser = result.user;
                        
                        // Définir l'utilisateur actuel pour le service
                        licenseService.currentUser = authenticatedUser;
                        
                        showAuthMessage('Connexion réussie !', 'success');
                        
                        // Attendre un peu avant de basculer
                        setTimeout(() => {
                            showAnalytics();
                        }, 1000);
                    } else {
                        showAuthMessage('Accès refusé. Seuls les administrateurs peuvent accéder aux analytics.', 'error');
                    }
                } else {
                    showAuthMessage(result.message || 'Email non autorisé', 'error');
                }
                
            } catch (error) {
                console.error('[Auth] Error:', error);
                showAuthMessage('Erreur de connexion. Veuillez réessayer.', 'error');
            } finally {
                // Réactiver le bouton
                button.disabled = false;
                buttonText.style.display = 'block';
                spinner.style.display = 'none';
            }
        }

        function showAuthMessage(message, type) {
            const messageDiv = document.getElementById('authMessage');
            messageDiv.className = type === 'error' ? 'auth-error' : 'auth-success';
            messageDiv.textContent = message;
        }

        function showAnalytics() {
            // Cacher la page de connexion
            document.getElementById('authContainer').style.display = 'none';
            
            // Afficher la page analytics
            document.getElementById('analyticsContainer').classList.add('authenticated');
            
            // Mettre à jour les infos utilisateur
            document.getElementById('currentUserEmail').textContent = authenticatedUser.email;
            document.getElementById('currentUserRole').textContent = authenticatedUser.role.replace('_', ' ');
            
            // Charger les données
            loadAnalytics();
            updateLastUpdated();
            
            // Sauvegarder la session
            sessionStorage.setItem('analyticsAuth', JSON.stringify({
                email: authenticatedUser.email,
                role: authenticatedUser.role,
                timestamp: Date.now()
            }));
        }

        function logout() {
            // Effacer la session
            sessionStorage.removeItem('analyticsAuth');
            
            // Réinitialiser
            authenticatedUser = null;
            currentUsers = [];
            filteredUsers = [];
            
            // Retourner à la page de connexion
            document.getElementById('analyticsContainer').classList.remove('authenticated');
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('authEmail').value = '';
            document.getElementById('authMessage').innerHTML = '';
        }

        // Vérifier la session au chargement
        async function checkSession() {
            const session = sessionStorage.getItem('analyticsAuth');
            
            if (session) {
                try {
                    const data = JSON.parse(session);
                    
                    // Vérifier que la session n'est pas trop vieille (24h)
                    if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                        // Initialiser d'abord
                        if (!licenseService) {
                            await loadLicenseService();
                        }
                        
                        await initializeSupabase();
                        
                        // Recharger l'utilisateur
                        const result = await licenseService.authenticateWithEmail(data.email);
                        
                        if (result.valid && (result.user.role === 'company_admin' || result.user.role === 'super_admin')) {
                            authenticatedUser = result.user;
                            licenseService.currentUser = authenticatedUser;
                            showAnalytics();
                            return;
                        }
                    }
                } catch (error) {
                    console.error('[Session] Error:', error);
                }
                
                // Session invalide
                sessionStorage.removeItem('analyticsAuth');
            }
        }

        // Charger le service de licence
        async function loadLicenseService() {
            // Charger la configuration Supabase d'abord
            const configScript = document.createElement('script');
            configScript.src = './config-supabase.js';
            await new Promise((resolve, reject) => {
                configScript.onload = resolve;
                configScript.onerror = reject;
                document.head.appendChild(configScript);
            });
            
            // Charger le service de licence
            const licenseScript = document.createElement('script');
            licenseScript.src = './LicenceService.js';
            await new Promise((resolve, reject) => {
                licenseScript.onload = resolve;
                licenseScript.onerror = reject;
                document.head.appendChild(licenseScript);
            });
            
            licenseService = window.licenseService;
        }

        // Tab management
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');

            currentTab = tabName;

            // Load content based on tab
            if (tabName === 'users') {
                loadUsers();
            } else if (tabName === 'licenses') {
                loadLicenseManagement();
            }
        }

        // Users management - avec filtrage selon les permissions
        async function loadUsers() {
            try {
                console.log('[Analytics] Loading users with permissions check...');
                
                // Vérifier que Supabase est initialisé
                if (!supabaseClient) {
                    console.log('[Analytics] Supabase not ready, initializing...');
                    await initializeSupabase();
                }
                
                // Construire la requête avec les bonnes colonnes
                let query = supabaseClient
                    .from('users')
                    .select(`
                        id,
                        email,
                        name,
                        role,
                        license_status,
                        license_expires_at,
                        company_id,
                        first_login_at,
                        last_login_at,
                        login_count,
                        created_at,
                        updated_at,
                        company:companies(id, name, domain)
                    `)
                    .order('created_at', { ascending: false });
                
                // Si l'utilisateur est un admin de société, filtrer par sa société
                if (authenticatedUser && authenticatedUser.role === 'company_admin' && authenticatedUser.company_id) {
                    console.log('[Analytics] Filtering by company:', authenticatedUser.company_id);
                    query = query.eq('company_id', authenticatedUser.company_id);
                }
                // Si super admin, pas de filtre
                
                const { data: users, error } = await query;

                if (error) {
                    console.error('[Analytics] Error loading users:', error);
                    currentUsers = [];
                } else {
                    console.log('[Analytics] Loaded users:', users?.length || 0);
                    currentUsers = users || [];
                }
                
                // Charger aussi les stats analytics si disponibles
                await loadUserStats();
                
                populateCompanyFilter();
                filterUsers();
                updateSummaryFromRealData();
                
            } catch (error) {
                console.error('[Analytics] Failed to load users:', error);
                currentUsers = [];
                filterUsers();
            }
        }

        // Charger les statistiques des utilisateurs
        async function loadUserStats() {
            if (!supabaseClient) return;
            
            try {
                let query = supabaseClient
                    .from('user_email_stats')
                    .select('*');
                
                // Filtrer par domaine si admin de société
                if (authenticatedUser && authenticatedUser.role === 'company_admin' && authenticatedUser.company_id) {
                    // Récupérer le domaine de la société
                    const { data: company } = await supabaseClient
                        .from('companies')
                        .select('domain')
                        .eq('id', authenticatedUser.company_id)
                        .single();
                    
                    if (company && company.domain) {
                        query = query.eq('domain', company.domain);
                    }
                }
                
                const { data: stats, error } = await query;

                if (!error && stats) {
                    // Fusionner les stats avec les utilisateurs
                    currentUsers = currentUsers.map(user => {
                        const userStats = stats.find(s => s.email === user.email);
                        return {
                            ...user,
                            total_scans: userStats?.total_emails_scanned || 0,
                            total_sessions: userStats?.total_sessions || 0,
                            total_errors: userStats?.total_errors || 0
                        };
                    });
                }
            } catch (error) {
                console.error('[Analytics] Error loading user stats:', error);
            }
        }

        // Mettre à jour le résumé avec les vraies données
        function updateSummaryFromRealData() {
            // Utilisateurs actifs
            const activeUsers = currentUsers.filter(u => 
                u.license_status === 'active' || u.license_status === 'trial'
            ).length;
            document.getElementById('summaryUsers').textContent = activeUsers;
            
            // Total des scans
            const totalScans = currentUsers.reduce((sum, user) => 
                sum + (user.total_scans || 0), 0
            );
            document.getElementById('summaryScans').textContent = totalScans.toLocaleString();

            // Total des erreurs
            const totalErrors = currentUsers.reduce((sum, user) => 
                sum + (user.total_errors || 0), 0
            );
            document.getElementById('summaryErrors').textContent = totalErrors;

            // Licences actives
            const activeLicenses = currentUsers.filter(u => 
                u.license_status === 'active'
            ).length;
            document.getElementById('summaryLicenses').textContent = activeLicenses;
        }

        // Initialiser Supabase
        async function initializeSupabase() {
            if (supabaseClient) {
                console.log('[Analytics] Supabase already initialized');
                return;
            }

            if (!window.supabaseConfig) {
                console.error('[Analytics] Supabase config not loaded');
                return;
            }

            if (!window.supabase) {
                // Charger la librairie Supabase
                await loadSupabaseLibrary();
            }

            await window.initializeSupabaseConfig();
            const config = window.supabaseConfig.getConfig();
            
            supabaseClient = window.supabase.createClient(
                config.url,
                config.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: false,
                        detectSessionInUrl: false
                    }
                }
            );
            
            console.log('[Analytics] Supabase client initialized');
        }

        // Charger la librairie Supabase
        function loadSupabaseLibrary() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        function populateCompanyFilter() {
            const companies = [...new Set(currentUsers.map(user => 
                user.company?.name || user.domain || 'Sans société'
            ))];
            const filter = document.getElementById('companyFilter');
            
            // Clear existing options except first one
            filter.innerHTML = '<option value="">Toutes les sociétés</option>';
            
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company;
                option.textContent = company;
                filter.appendChild(option);
            });
        }

        function filterUsers() {
            const searchTerm = document.getElementById('userSearch').value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;
            const companyFilter = document.getElementById('companyFilter').value;

            filteredUsers = currentUsers.filter(user => {
                const userName = user.name || user.email.split('@')[0];
                const companyName = user.company?.name || user.domain || 'Sans société';
                
                const matchesSearch = userName.toLowerCase().includes(searchTerm) || 
                                    user.email.toLowerCase().includes(searchTerm) ||
                                    companyName.toLowerCase().includes(searchTerm);
                
                const matchesStatus = !statusFilter || user.license_status === statusFilter;
                const matchesCompany = !companyFilter || companyName === companyFilter;

                return matchesSearch && matchesStatus && matchesCompany;
            });

            renderUsersTable();
        }

        function renderUsersTable() {
            const tbody = document.getElementById('usersTableBody');
            const emptyState = document.getElementById('usersEmptyState');

            if (filteredUsers.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            tbody.innerHTML = filteredUsers.map(user => {
                const userName = user.name || user.email.split('@')[0];
                const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const companyName = user.company?.name || user.domain || 'Sans société';
                
                // Déterminer le statut de licence
                const licenseClass = user.license_status === 'active' ? 'active' : 
                                   user.license_status === 'expired' ? 'expired' : 
                                   user.license_status === 'blocked' ? 'blocked' :
                                   'trial';

                // Déterminer si l'utilisateur est actif
                const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
                const isActive = lastLogin && (new Date() - lastLogin) < 7 * 24 * 60 * 60 * 1000; // 7 jours

                return `
                    <tr>
                        <td>
                            <div class="user-info">
                                <div class="user-avatar">${initials}</div>
                                <div class="user-details">
                                    <h4>${userName}</h4>
                                    <p>${user.email}</p>
                                </div>
                            </div>
                        </td>
                        <td>${companyName}</td>
                        <td><span class="status-badge ${licenseClass}">${user.license_status || 'trial'}</span></td>
                        <td>${formatLastLogin(lastLogin)}</td>
                        <td>${user.login_count || 0}</td>
                        <td>${user.role || 'user'}</td>
                        <td>
                            <div class="license-info">
                                <span class="license-badge ${licenseClass}">
                                    ${user.license_expires_at ? calculateDaysRemaining(new Date(user.license_expires_at)) : 'Illimitée'}
                                </span>
                            </div>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button class="action-btn edit" onclick="viewUserDetails('${user.id}')">
                                    <i class="fas fa-eye"></i> Voir
                                </button>
                                <button class="action-btn license" onclick="manageLicense('${user.id}')">
                                    <i class="fas fa-key"></i> Licence
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function formatLastLogin(date) {
            if (!date) return 'Jamais';
            
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 60) {
                return `Il y a ${minutes} min`;
            } else if (hours < 24) {
                return `Il y a ${hours}h`;
            } else if (days < 7) {
                return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
            } else {
                return date.toLocaleDateString('fr-FR');
            }
        }

        function viewUserDetails(userId) {
            const user = currentUsers.find(u => u.id === userId);
            if (!user) return;

            const userName = user.name || user.email.split('@')[0];
            document.getElementById('modalTitle').textContent = `Détails - ${userName}`;
            
            const modalBody = document.getElementById('modalBody');
            modalBody.innerHTML = `
                <div class="detail-group">
                    <h4><i class="fas fa-user"></i> Informations générales</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Nom complet</label>
                            <value>${userName}</value>
                        </div>
                        <div class="detail-item">
                            <label>Email</label>
                            <value>${user.email}</value>
                        </div>
                        <div class="detail-item">
                            <label>Société</label>
                            <value>${user.company?.name || user.domain || 'Non définie'}</value>
                        </div>
                        <div class="detail-item">
                            <label>Rôle</label>
                            <value>${user.role || 'user'}</value>
                        </div>
                    </div>
                </div>

                <div class="detail-group">
                    <h4><i class="fas fa-chart-line"></i> Statistiques d'utilisation</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Première connexion</label>
                            <value>${user.first_login_at ? new Date(user.first_login_at).toLocaleString('fr-FR') : 'N/A'}</value>
                        </div>
                        <div class="detail-item">
                            <label>Dernière connexion</label>
                            <value>${user.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-FR') : 'Jamais'}</value>
                        </div>
                        <div class="detail-item">
                            <label>Nombre de connexions</label>
                            <value>${user.login_count || 0}</value>
                        </div>
                        <div class="detail-item">
                            <label>Scans effectués</label>
                            <value>${user.total_scans || 0}</value>
                        </div>
                    </div>
                </div>

                <div class="detail-group">
                    <h4><i class="fas fa-key"></i> Informations licence</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Statut de licence</label>
                            <value><span class="license-badge ${user.license_status}">${user.license_status || 'trial'}</span></value>
                        </div>
                        <div class="detail-item">
                            <label>Date de création</label>
                            <value>${new Date(user.created_at).toLocaleDateString('fr-FR')}</value>
                        </div>
                        <div class="detail-item">
                            <label>Date d'expiration</label>
                            <value>${user.license_expires_at ? new Date(user.license_expires_at).toLocaleDateString('fr-FR') : 'N/A'}</value>
                        </div>
                        <div class="detail-item">
                            <label>Statut</label>
                            <value>${user.license_expires_at ? calculateDaysRemaining(new Date(user.license_expires_at)) : 'Illimitée'}</value>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('userModal').classList.add('active');
        }

        function calculateDaysRemaining(expirationDate) {
            const now = new Date();
            const diff = expirationDate - now;
            const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
            
            if (days < 0) {
                return `Expirée depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
            } else if (days === 0) {
                return 'Expire aujourd\'hui';
            } else {
                return `${days} jour${days > 1 ? 's' : ''}`;
            }
        }

        function closeUserModal() {
            document.getElementById('userModal').classList.remove('active');
        }

        function manageLicense(userId) {
            const user = currentUsers.find(u => u.id === userId);
            if (!user) return;

            // Pour l'instant, basculer vers l'onglet licences
            switchTab('licenses');
        }

        async function refreshUsers() {
            console.log('Refreshing users data...');
            await loadUsers();
            updateLastUpdated();
        }

        // License Management Functions - avec permissions
        async function loadLicenseManagement() {
            const container = document.getElementById('licenseManagement');
            
            if (!window.licenseService || !authenticatedUser) {
                container.innerHTML = `
                    <div class="no-permissions">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Service non disponible</h3>
                        <p>Veuillez vous reconnecter</p>
                    </div>
                `;
                return;
            }

            // Vérifier que Supabase est initialisé
            if (!supabaseClient) {
                await initializeSupabase();
            }

            let companyUsers = [];
            
            try {
                // Charger les utilisateurs selon les permissions
                if (authenticatedUser.role === 'super_admin') {
                    // Super admin voit tous les utilisateurs
                    const { data, error } = await supabaseClient
                        .from('users')
                        .select(`
                            *,
                            company:companies(name)
                        `)
                        .order('created_at', { ascending: false });
                    
                    if (error) {
                        console.error('[Analytics] Error loading all users:', error);
                    } else {
                        companyUsers = data || [];
                    }
                } else if (authenticatedUser.role === 'company_admin' && authenticatedUser.company_id) {
                    // Admin de société voit seulement ses utilisateurs
                    const { data, error } = await supabaseClient
                        .from('users')
                        .select(`
                            *,
                            company:companies(name)
                        `)
                        .eq('company_id', authenticatedUser.company_id)
                        .order('created_at', { ascending: false });
                    
                    if (error) {
                        console.error('[Analytics] Error loading company users:', error);
                    } else {
                        companyUsers = data || [];
                    }
                }
            } catch (error) {
                console.error('[Analytics] Failed to load users for license management:', error);
            }

            // Calculer les statistiques
            const stats = {
                total: companyUsers.length,
                active: companyUsers.filter(u => u.license_status === 'active').length,
                trial: companyUsers.filter(u => u.license_status === 'trial').length,
                expired: companyUsers.filter(u => u.license_status === 'expired').length
            };

            container.innerHTML = `
                <div class="license-header">
                    <h2>
                        <i class="fas fa-key"></i>
                        Gestion des licences
                    </h2>
                    <button class="refresh-btn" onclick="loadLicenseManagement()">
                        <i class="fas fa-sync-alt"></i> Actualiser
                    </button>
                </div>

                ${authenticatedUser.company_id && companyUsers.length > 0 && companyUsers[0].company ? `
                    <div class="company-info">
                        <h3>${companyUsers[0].company.name}</h3>
                        <p>Administrateur : ${authenticatedUser.name || authenticatedUser.email}</p>
                    </div>
                ` : ''}

                <div class="license-stats">
                    <div class="license-stat-card">
                        <div class="license-stat-value">${stats.total}</div>
                        <div class="license-stat-label">Utilisateurs total</div>
                    </div>
                    <div class="license-stat-card">
                        <div class="license-stat-value">${stats.active}</div>
                        <div class="license-stat-label">Licences actives</div>
                    </div>
                    <div class="license-stat-card">
                        <div class="license-stat-value">${stats.trial}</div>
                        <div class="license-stat-label">Essais gratuits</div>
                    </div>
                    <div class="license-stat-card">
                        <div class="license-stat-value">${stats.expired}</div>
                        <div class="license-stat-label">Licences expirées</div>
                    </div>
                </div>

                <div class="add-user-form">
                    <input type="email" id="newUserEmail" placeholder="Email du nouvel utilisateur">
                    <button onclick="addNewUser()">
                        <i class="fas fa-user-plus"></i> Ajouter un utilisateur
                    </button>
                </div>

                <div class="license-users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Email</th>
                                <th>Statut</th>
                                <th>Expiration</th>
                                <th>Dernière connexion</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companyUsers.map(user => `
                                <tr>
                                    <td>${user.name || 'Non défini'}</td>
                                    <td class="user-email">${user.email}</td>
                                    <td>
                                        <span class="license-status ${user.license_status}">
                                            ${user.license_status}
                                        </span>
                                    </td>
                                    <td>${user.license_expires_at ? new Date(user.license_expires_at).toLocaleDateString('fr-FR') : 'N/A'}</td>
                                    <td>${user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                                    <td>
                                        <div class="license-actions">
                                            ${user.license_status !== 'active' ? `
                                                <button class="license-action-btn activate" 
                                                        onclick="updateUserStatus('${user.id}', 'active')">
                                                    Activer
                                                </button>
                                            ` : ''}
                                            ${user.license_status === 'active' ? `
                                                <button class="license-action-btn block" 
                                                        onclick="updateUserStatus('${user.id}', 'blocked')">
                                                    Bloquer
                                                </button>
                                            ` : ''}
                                            <button class="license-action-btn extend" 
                                                    onclick="extendLicense('${user.id}')">
                                                +30 jours
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Fonction pour ajouter un utilisateur
        async function addNewUser() {
            const emailInput = document.getElementById('newUserEmail');
            const email = emailInput.value.trim();

            if (!email || !email.includes('@')) {
                alert('Veuillez entrer une adresse email valide');
                return;
            }

            try {
                // Initialiser le service de licence s'il n'est pas déjà prêt
                if (!window.licenseService.initialized) {
                    await window.licenseService.initialize();
                }

                // Définir l'utilisateur actuel pour le service
                window.licenseService.currentUser = authenticatedUser;

                const result = await window.licenseService.addUserToCompany(email);
                
                if (result.success) {
                    emailInput.value = '';
                    await loadLicenseManagement();
                    alert('Utilisateur ajouté avec succès');
                } else {
                    alert('Erreur : ' + result.error);
                }
            } catch (error) {
                console.error('[Analytics] Error adding user:', error);
                alert('Erreur lors de l\'ajout de l\'utilisateur');
            }
        }

        // Fonction pour mettre à jour le statut
        async function updateUserStatus(userId, newStatus) {
            try {
                // Initialiser le service de licence s'il n'est pas déjà prêt
                if (!window.licenseService.initialized) {
                    await window.licenseService.initialize();
                }

                // Définir l'utilisateur actuel pour le service
                window.licenseService.currentUser = authenticatedUser;

                const result = await window.licenseService.updateUserLicense(userId, newStatus);
                
                if (result.success) {
                    await loadLicenseManagement();
                    alert('Statut mis à jour avec succès');
                } else {
                    alert('Erreur : ' + result.error);
                }
            } catch (error) {
                console.error('[Analytics] Error updating status:', error);
                alert('Erreur lors de la mise à jour du statut');
            }
        }

        // Fonction pour étendre la licence
        async function extendLicense(userId) {
            try {
                const newExpiry = new Date();
                newExpiry.setDate(newExpiry.getDate() + 30);
                
                // Initialiser le service de licence s'il n'est pas déjà prêt
                if (!window.licenseService.initialized) {
                    await window.licenseService.initialize();
                }

                // Définir l'utilisateur actuel pour le service
                window.licenseService.currentUser = authenticatedUser;

                const result = await window.licenseService.updateUserLicense(userId, 'active', newExpiry);
                
                if (result.success) {
                    await loadLicenseManagement();
                    alert('Licence étendue de 30 jours');
                } else {
                    alert('Erreur : ' + result.error);
                }
            } catch (error) {
                console.error('[Analytics] Error extending license:', error);
                alert('Erreur lors de l\'extension de la licence');
            }
        }

        // Analytics loading (existing functionality)
        async function loadAnalyticsScript() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = './analytics.js';
                script.onload = () => {
                    console.log('[Analytics Page] Analytics script loaded successfully');
                    resolve();
                };
                script.onerror = () => {
                    console.error('[Analytics Page] Failed to load analytics script');
                    reject(new Error('Failed to load analytics.js'));
                };
                document.head.appendChild(script);
            });
        }

        async function loadAnalytics() {
            try {
                console.log('[Analytics Page] Starting analytics load...');
                
                if (!window.analyticsManager || !window.analyticsModule) {
                    console.log('[Analytics Page] Loading analytics script...');
                    await loadAnalyticsScript();
                    
                    let attempts = 0;
                    while ((!window.analyticsManager || !window.analyticsModule) && attempts < 10) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                }

                analyticsManager = window.analyticsManager;
                analyticsModule = window.analyticsModule;

                const data = analyticsManager ? analyticsManager.getAnalyticsData() : {};

                const analyticsContent = document.getElementById('analyticsContent');
                const pageContent = document.createElement('div');
                pageContent.id = 'pageContent';
                analyticsContent.innerHTML = '';
                analyticsContent.appendChild(pageContent);

                if (analyticsModule) {
                    analyticsModule.render();
                }

                document.getElementById('loadingContainer').style.display = 'none';
                updateLastUpdated();

                console.log('[Analytics Page] ✅ Analytics loaded successfully');

            } catch (error) {
                console.error('[Analytics Page] ❌ Error loading analytics:', error);
                document.getElementById('loadingContainer').innerHTML = `
                    <div style="text-align: center; color: #dc2626;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 16px;"></i>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger les données analytics</p>
                    </div>
                `;
            }
        }

        function updateLastUpdated() {
            const now = new Date();
            document.getElementById('lastUpdated').textContent = now.toLocaleString('fr-FR');
        }

        // Event listeners
        document.getElementById('authForm').addEventListener('submit', handleAuthentication);
        document.getElementById('userSearch').addEventListener('input', filterUsers);
        document.getElementById('statusFilter').addEventListener('change', filterUsers);
        document.getElementById('companyFilter').addEventListener('change', filterUsers);

        // Close modal when clicking outside
        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') {
                closeUserModal();
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('[Analytics Page] DOM loaded, initializing with authentication...');
            
            // Vérifier la session existante
            await checkSession();
        });

        // Debug function
        window.debugAnalytics = function() {
            console.log('=== ANALYTICS PAGE DEBUG ===');
            console.log('Authenticated user:', authenticatedUser);
            console.log('Current tab:', currentTab);
            console.log('Current users:', currentUsers);
            console.log('Filtered users:', filteredUsers);
            console.log('Analytics manager:', analyticsManager);
            console.log('Analytics module:', analyticsModule);
            console.log('License service:', licenseService);
            console.log('Supabase client:', supabaseClient);
            
            return {
                authenticated: !!authenticatedUser,
                userRole: authenticatedUser?.role,
                currentTab,
                usersCount: currentUsers.length,
                filteredCount: filteredUsers.length,
                analyticsManager: !!analyticsManager,
                analyticsModule: !!analyticsModule,
                licenseService: !!licenseService,
                supabaseClient: !!supabaseClient,
                realData: currentUsers.length > 0
            };
        };

        console.log('[Analytics Page] ✅ Analytics page with authentication and permissions initialized');
        console.log('[Analytics Page] Use debugAnalytics() for debug information');
    </script>
</body>
</html>
