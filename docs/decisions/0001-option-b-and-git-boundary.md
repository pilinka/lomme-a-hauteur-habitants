# ADR-001 — Option B et frontière Git

- Statut : accepté
- Date : 2026-09-05

## Décision

La V4 sera construite sur une branche dédiée depuis le commit V3 gelé. `main` reste la référence
V3 ; le code historique est retrouvé par commit/tag et n’est pas copié dans un dossier source. Un
projet Supabase V4 séparé pourra être créé uniquement après autorisation du Lot 2.

## Conséquence

Aucune transformation en place du backend, aucune reprise automatique de donnée ou de compte et
aucun test connecté à la V3. La publication de la branche distante requiert un droit GitHub
`contents: write`, absent de l’intégration actuelle.
