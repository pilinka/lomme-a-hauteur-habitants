# À hauteur d’habitants V4 — Lot 1

Socle logiciel minimal de la V4 : deux applications React/TypeScript séparées, des contrats métier
provisoires, un système d’interface accessible et une chaîne de qualité reproductible.

Ce lot ne contient **ni projet Supabase V4, ni schéma SQL, ni migration de données, ni
authentification, ni déploiement**. Les contenus V3 et les données de démonstration ne sont pas
repris.

La feuille de route historique V3 (`docs/feuille-de-route-complete-lomme-a-hauteur-habitants.md`)
est conservée comme document non normatif. Elle ne décrit pas l’état du Lot 1 et ne doit pas être
utilisée comme spécification V4. Les médias V3 restent hors de cette branche et ne sont ni suivis
ni publiés dans le socle V4.

## Prérequis et démarrage

- Node.js `24.19.0` ;
- npm `11.9.0` ;
- installation exacte par `npm ci`.

```bash
npm ci
npm run dev:public
```

Dans un autre terminal :

```bash
npm run dev:professional
```

- application publique : `http://localhost:5173` ;
- console professionnelle : `http://localhost:5174`.

## Vérifications

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:architecture
npm run test:contrast
npm run security:secrets
npm test -- --coverage
npm run build
npm run test:e2e
npm audit --audit-level=high
```

La documentation de travail se trouve dans [`docs/`](docs/architecture.md). Le code historique V3
reste récupérable au commit `e8b582083fdee56d6fcd91b2bc03c06fc1e0265f` et au tag local annoté
`v3-frozen-2026-09-05` ; voir [`legacy/v3/README.md`](legacy/v3/README.md).
