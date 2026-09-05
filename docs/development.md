# Développement reproductible

## Outils figés

`.nvmrc`, `packageManager`, `engines`, `.npmrc` et le lockfile imposent les versions exécutées. Les
dépendances directes sont exactes : aucun `latest`, caret ou tilde.

Installation de référence :

```bash
nvm use
npm ci
```

`npm install` n’est utilisé que pour une évolution volontaire du lockfile, relue dans une pull
request. Les deux applications ont des ports et des sorties `dist/` distincts.

## Commandes

| Commande                     | Finalité                              |
| ---------------------------- | ------------------------------------- |
| `npm run dev:public`         | application publique sur le port 5173 |
| `npm run dev:professional`   | console sur le port 5174              |
| `npm run build:public`       | build public seul                     |
| `npm run build:professional` | build professionnel seul              |
| `npm run build`              | tous les workspaces                   |
| `npm test`                   | tests unitaires et composants         |
| `npm run test:e2e`           | routes, clavier et Axe dans Chromium  |

## Règles de contribution

1. partir de la branche V4, jamais de `main` V3 ;
2. ne jamais connecter un test au backend V3 ;
3. ne créer un package partagé qu’après deux usages réels ;
4. documenter toute décision structurante par ADR ;
5. utiliser uniquement les fixtures synthétiques explicitement classées ;
6. exécuter les mêmes contrôles localement et dans la CI ;
7. ne jamais ajouter de fichier `.env` réel ou de secret côté client.

Les règles d’hébergement pour les routes profondes seront définies avec la cible de déploiement ;
aucun déploiement n’est autorisé dans ce lot.
