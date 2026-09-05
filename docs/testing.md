# Stratégie de tests des Lots 1 et 2

## Pyramide

| Niveau                    | Outil                        | Preuve recherchée                                                     |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| règles pures              | Vitest                       | relecture humaine, visibilité publique                                |
| composants/routes         | Testing Library + user-event | sémantique, formulaires, navigation, paramètres                       |
| accessibilité automatique | axe-core                     | absence de violations détectées sur les fondations                    |
| navigateur                | Playwright + Axe             | routes profondes, clavier, focus, carte/liste                         |
| architecture              | scripts Node                 | pas de Supabase, package anticipé, donnée V3 ou fixture en production |
| contrats SQL              | script Node                  | migrations, RLS, Data API, motifs interdits                           |
| PostgreSQL/RLS            | SQL transactionnel           | A/B, inactivité, scopes, audit, GRANT et contraintes composites       |

Les tests frontend n’utilisent ni réseau, ni Supabase, ni contenu V3. Le test PostgreSQL utilise le
projet V4 réel, crée six identités et deux tenants manifestement synthétiques dans une transaction,
puis annule tout avec `ROLLBACK`.

## Critères bloquants

- les deux applications construisent séparément ;
- aucune soumission ne devient publique automatiquement ;
- seule une publication explicitement publiée est visible ;
- les paramètres restent identiques entre carte et liste ;
- aucun `.skip` ou `.only` ;
- seuil de couverture de 90 % sur `domain` ;
- zéro violation Axe automatisée dans les tests de composants ;
- zéro violation `serious` ou `critical` sur les routes E2E ;
- zéro vulnérabilité npm élevée ou critique ;
- zéro secret détecté dans l’arbre et, en CI, dans l’historique.
- isolation A/B bidirectionnelle et membership inactive sans droit ;
- aucune politique ni privilège client sur les trois référentiels ;
- vues Data API `security_invoker` et colonnes explicites ;
- relations croisées et mutation de `organization_id` rejetées par PostgreSQL.

## Limites honnêtes

Un résultat Axe ne prouve pas une conformité RGAA. La matrice SQL prouve les politiques et privilèges
présents au Lot 2, pas la sécurité de futurs objets métier. Les lecteurs d’écran, le branchement Auth
complet et la carte réelle appartiennent aux lots suivants.
