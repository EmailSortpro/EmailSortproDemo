# 📧 EmailSortPro - Gestionnaire d'Emails Intelligent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.3-blue.svg)](https://github.com/Emailsortpro/emailsortpro)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://emailsortpro.github.io/emailsortpro)

Application web moderne de gestion intelligente d'emails Microsoft (Outlook, Hotmail, Live) avec catégorisation automatique par IA, création de tâches et organisation par domaine.

## 🌟 Fonctionnalités

- **📊 Scanner d'emails intelligent** : Analyse vos emails Microsoft en temps réel
- **🤖 Catégorisation par IA** : 11 catégories automatiques (Urgent, Finance, Réunions, etc.)
- **✅ Création de tâches** : Transforme automatiquement vos emails en actions concrètes
- **📁 Rangement par domaine** : Organisation automatique par domaine d'expéditeur
- **🔒 100% Sécurisé** : Vos emails restent chez Microsoft, aucun stockage externe
- **💯 Open Source** : Code source complet disponible et modifiable

## 🚀 Démo en ligne

👉 **[Essayer EmailSortPro](https://emailsortpro.github.io/emailsortpro)**

> **Note**: Vous devrez configurer votre propre Client ID Azure pour utiliser l'application (guide inclus, 5 minutes)

## 📸 Captures d'écran

| Dashboard | Scanner d'emails | Gestion des tâches |
|-----------|------------------|-------------------|
| ![Dashboard](screenshots/dashboard.png) | ![Scanner](screenshots/scanner.png) | ![Tâches](screenshots/tasks.png) |

## 🛠️ Installation

### Option 1 : Utiliser GitHub Pages (Recommandé)

1. **Fork ce repository**
   - Cliquez sur le bouton "Fork" en haut à droite
   - Cela créera votre propre copie du projet

2. **Activez GitHub Pages**
   - Allez dans Settings > Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Cliquez sur Save

3. **Configurez votre Client ID Azure**
   - Suivez le [Guide de configuration Azure](AZURE-SETUP-GUIDE.md)
   - L'application inclut un assistant de configuration intégré

4. **Accédez à votre application**
   - URL: `https://votre-username.github.io/emailsortpro`

### Option 2 : Installation locale

```bash
# Cloner le repository
git clone https://github.com/Emailsortpro/emailsortpro.git
cd emailsortpro

# Copier le template de configuration
cp config.template.js config.js

# Éditer config.js avec votre Client ID Azure
# Ouvrir index.html dans votre navigateur
```

## 📋 Configuration Azure (5 minutes)

EmailSortPro nécessite un Client ID Azure gratuit pour accéder à vos emails de manière sécurisée.

### Étapes rapides :

1. **Créer une App Registration**
   - Allez sur [portal.azure.com](https://portal.azure.com)
   - App registrations > New registration
   - Name: EmailSortPro
   - Account types: Personal Microsoft accounts only

2. **Configurer les permissions**
   - API permissions > Add a permission
   - Microsoft Graph > Delegated permissions
   - Ajoutez : User.Read, Mail.Read, Mail.ReadWrite

3. **Copier votre Client ID**
   - Overview > Application (client) ID
   - Utilisez-le dans l'application

📖 **[Guide détaillé avec captures d'écran](AZURE-SETUP-GUIDE.md)**

## 🔧 Structure du projet

```
emailsortpro/
├── index.html              # Page principale
├── setup.html              # Assistant de configuration
├── auth-callback.html      # Callback d'authentification
├── config.template.js      # Template de configuration
├── styles.css              # Styles de l'application
├── app.js                  # Application principale
├── AuthService.js          # Service d'authentification
├── MailService.js          # Service de récupération d'emails
├── CategoryManager.js      # IA de catégorisation
├── TaskManager.js          # Gestionnaire de tâches
├── DomainOrganizer.js      # Module de rangement par domaine
├── startscan.js            # Module de scan d'emails
└── README.md               # Documentation
```

## 🎯 Utilisation

1. **Se connecter**
   - Cliquez sur "Scanner mes Emails"
   - Connectez-vous avec votre compte Microsoft

2. **Scanner vos emails**
   - Choisissez la période à analyser
   - Sélectionnez les dossiers (Inbox, Spam, etc.)
   - Lancez le scan

3. **Visualiser et organiser**
   - Consultez vos emails catégorisés
   - Créez des tâches depuis les emails importants
   - Rangez automatiquement par domaine

4. **Personnaliser**
   - Configurez vos catégories et mots-clés
   - Définissez les règles d'automatisation
   - Exportez/importez vos paramètres

## 🔐 Sécurité et confidentialité

- ✅ **Aucun stockage externe** : Vos emails ne quittent jamais Microsoft
- ✅ **OAuth2 sécurisé** : Authentification via Microsoft uniquement
- ✅ **Client-side only** : Tout fonctionne dans votre navigateur
- ✅ **Open source** : Code source vérifiable et auditable
- ✅ **Pas de tracking** : Aucune donnée n'est collectée

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📝 Changelog

### v2.0.3 (Dernière version)
- ✨ Ajout du rangement automatique par domaine
- 🔧 Configuration simplifiée pour GitHub Pages
- 🐛 Corrections de bugs d'authentification
- 📱 Amélioration du responsive design

### v2.0.2
- 🤖 Intégration de l'IA pour la catégorisation
- ✅ Création automatique de tâches
- 🎨 Nouvelle interface utilisateur

[Voir tous les changements](CHANGELOG.md)

## 📄 Licence

Distribué sous licence MIT. Voir [LICENSE](LICENSE) pour plus d'informations.

## 🙏 Remerciements

- [Microsoft Graph API](https://developer.microsoft.com/graph) pour l'accès aux emails
- [MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js) pour l'authentification
- [Font Awesome](https://fontawesome.com) pour les icônes
- La communauté open source

## 📞 Support

- 🐛 Issues : [GitHub Issues](https://github.com/Emailsortpro/emailsortpro/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/Emailsortpro/emailsortpro/discussions)
- 📖 Wiki : [Documentation complète](https://github.com/Emailsortpro/emailsortpro/wiki)

## 🚧 Roadmap

- [ ] Support multi-comptes
- [ ] Application mobile
- [ ] Intégration avec d'autres services email
- [ ] Mode hors-ligne
- [ ] Export PDF des rapports

---

<div align="center">
  <p>
    <strong>⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub !</strong>
  </p>
  <p>
    Fait avec ❤️ par la communauté EmailSortPro
  </p>
</div>