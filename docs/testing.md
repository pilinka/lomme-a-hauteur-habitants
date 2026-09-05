# Stratégie de tests du Lot 1

## Pyramide

| Niveau                    | Outil                        | Preuve recherchée                                                     |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| règles pures              | Vitest                       | relecture humaine, visibilité publique                                |
| composants/routes         | Testing Library + user-event | sémantique, formulaires, navigation, paramètres                       |
| accessibilité automatique | axe-core                     | absence de violations détectées sur les fondations                    |
| navigateur                | Playwright + Axe             | routes profondes, clavier, focus, carte/liste                         |
| architecture              | scripts Node                 | pas de Supabase, package anticipé, donnée V3 ou fixture en production |

Les tests n’utilisent ni réseau, ni Supabase, ni contenu V3. Les fixtures sont synthétiques,
marquées `synthetic-demo` et ne sont importables que depuis les tests.

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

## Limites honnêtes

Un test frontend ne prouve ni autorisation serveur ni isolation multi-tenant. Un résultat Axe ne
prouve pas une conformité RGAA. La matrice RLS, les tests croisés entre organisations, les lecteurs
d’écran et la carte réelle appartiennent aux lots suivants.
