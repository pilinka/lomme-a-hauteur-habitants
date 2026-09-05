# Stratégie de migration progressive V3 → V4

## Préservé

- identité de cartographie sensible et participation habitante ;
- trois fonctions publiques : connaître, partager, comprendre ;
- relecture humaine avant publication ;
- séparation public/professionnel ;
- participation enfant anonyme et accompagnée ;
- mémoire territoriale et suite donnée légère.

## Isolé

- le code V3 au commit et au tag gelés ;
- la feuille de route historique à son emplacement d’origine, explicitement marquée non normative ;
- les médias V3 éventuellement présents localement sous `docs/v3/reference-assets/`, ignorés par
  Git et exclus de toute publication V4 ;
- l’archive technique du Lot 0, hors du dépôt applicatif ;
- toutes les fixtures synthétiques sous `tests/fixtures`.

## Abandonné

- monolithe, navigation par état, appels Supabase directs et faux contrôles de sécurité ;
- contenus de démonstration, taxonomies figées et limites géographiques approximatives ;
- faux téléversement, exports et modération incomplets ;
- versions flottantes et absence de chaîne qualité.

## Étapes ultérieures conditionnelles

1. valider le Lot 1 et ses arbitrages ;
2. créer séparément le projet Supabase V4 au Lot 2 autorisé ;
3. concevoir schéma, RLS et contrats de données avant branchement frontend ;
4. remplacer progressivement les états vides par des adaptateurs testés ;
5. constituer le corpus réel de Lomme par qualification explicite ;
6. éprouver un second territoire contrasté ;
7. n’ouvrir un déploiement qu’après tests fonctionnels, RGPD, sécurité et accessibilité.

Il n’existe aucun chemin d’import automatique depuis l’archive ou la V3. Toute reprise future sera
une décision documentée, élément par élément.
