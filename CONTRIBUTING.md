# Guide de Contribution

Merci de votre intérêt pour contribuer à EmailSortPro ! 🎉

## Comment contribuer

### 1. Fork et Clone

```bash
# Fork le projet sur GitHub
# Puis clone votre fork
git clone https://github.com/votre-username/emailsortpro.git
cd emailsortpro
```

### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 3. Configuration locale

```bash
# Copier le template de configuration
cp config.template.js config.js

# Éditer config.js avec votre Client ID Azure
# Tester localement en ouvrant index.html
```

### 4. Faire vos modifications

- Respectez le style de code existant
- Ajoutez des commentaires pour le code complexe
- Testez vos modifications

### 5. Commit et Push

```bash
git add .
git commit -m "feat: Description de la fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

### 6. Pull Request

- Ouvrez une PR depuis votre fork
- Décrivez clairement vos changements
- Référencez les issues liées

## Standards de code

### JavaScript
- Utilisez ES6+
- Commentez les fonctions complexes
- Évitez les variables globales

### CSS
- Utilisez des classes sémantiques
- Mobile-first approach
- Variables CSS pour les couleurs

### Commits
Suivez la convention [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

## Tests

Avant de soumettre une PR :
1. Testez sur Chrome, Firefox, Edge
2. Vérifiez le responsive design
3. Testez avec différents comptes Microsoft
4. Vérifiez la console pour les erreurs

## Signaler des bugs

Utilisez les [GitHub Issues](https://github.com/Emailsortpro/emailsortpro/issues) avec :
- Description claire du problème
- Étapes pour reproduire
- Comportement attendu vs actuel
- Screenshots si applicable
- Navigateur et OS utilisés

## Demander des fonctionnalités

Ouvrez une issue avec le label `enhancement` :
- Décrivez la fonctionnalité
- Expliquez pourquoi elle serait utile
- Proposez une implémentation si possible

## Questions ?

- Ouvrez une issue avec le label `question`

Merci de contribuer ! 🙏