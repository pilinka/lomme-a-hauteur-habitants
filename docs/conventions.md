# Conventions minimales

- TypeScript strict pour tout nouveau code ; pas de `any` sans justification locale.
- Interfaces métier immuables et provisoires ; aucune génération SQL depuis `domain`.
- Composants simples, sémantiques et non polymorphes au Lot 1.
- Routes et liens réels ; pas de navigation par état global.
- Un `h1` focalisable par page, titre de document mis à jour à chaque changement de route.
- Erreurs reliées aux champs ; confirmations via région de statut.
- Pas de données territoriales dans les composants ou packages partagés.
- Tests comportementaux ciblés ; pas de snapshots DOM massifs.
- Noms de fixture préfixés `fixture-`, territoire `demo-territory`, classification
  `synthetic-demo`.
- Les commentaires expliquent une contrainte ou une décision, jamais le code évident.
