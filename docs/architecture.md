# Architecture des Lots 1 et 2

## Décision

Le dépôt reste un monorepo npm workspaces léger : deux applications indépendantes et cinq paquets
partagés à responsabilité unique. Le Lot 2 ajoute une autorisation serveur Supabase testée sans
connecter encore les interfaces aux données.

```text
apps/
  public-web/               expérience publique
  professional-console/     coque professionnelle distincte
packages/
  domain/                   types provisoires et règles pures
  ui/                       jetons et composants accessibles
  application/              cas d’usage et ports indépendants du transport
  data-access/              adaptateurs vers les projections Data API
  database-types/           contrat maintenu des seules vues api
supabase/
  migrations/               construction reproductible du socle V4
  tests/                    matrice RLS transactionnelle et annulée
tests/
  e2e/                      parcours inter-applications en navigateur
  fixtures/                 données exclusivement synthétiques de test
```

`validation` et `tenant-config` restent volontairement absents : aucun besoin concret du Lot 2 ne
justifie encore ces packages.

## Frontières

| Élément                | Responsabilité au Lot 1                                        | Interdit au Lot 1                          |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `public-web`           | routes publiques, navigation, états vides, contrat carte/liste | corpus, vraie carte, stockage, publication |
| `professional-console` | routes techniques, coque vide, séparation de bundle            | comptes, rôles, modération opérationnelle  |
| `domain`               | distinctions conceptuelles et règles de publication pures      | SQL, statuts définitifs, tenant, droits    |
| `ui`                   | jetons, focus, champs, messages, dialogue, shell               | logique métier ou dépendance Supabase      |
| `application`          | cas d’usage et ports de repository                             | SQL, client Supabase, React                |
| `data-access`          | traduction des vues `api` vers les ports applicatifs           | composants, secrets, schémas internes      |
| `database-types`       | types des quatre projections exposées                          | tables `core`, `audit`, `reference`        |

Les deux builds sont indépendants. Aucun import n’est permis entre les deux applications. Les deux
peuvent dépendre de `domain` et `ui`, jamais l’inverse.

## Frontière PostgreSQL et Data API

- `core` contient organisations, territoires, memberships, rôles attribués et scopes ;
- `reference` contient les rôles et permissions contrôlés, sans accès client ;
- `private` contient la seule fonction d’autorisation `SECURITY DEFINER` ;
- `audit` contient un journal minimal, tenanté et en lecture DPO seulement ;
- `api` contient quatre vues `security_invoker` à colonnes explicites ;
- PostgREST est configuré avec `pgrst.db_schemas=api` ; le schéma `public` est retiré de la surface
  client.

Toute relation tenantée porte une frontière `organization_id`, renforcée par des clés composites et
des déclencheurs d’immutabilité. Une permission est calculée à partir de `auth.uid()`, d’une
membership active, du rôle, de la permission demandée et, si nécessaire, du scope territorial.

## Routes techniques

### Public

- `/` : les trois fonctions du produit ;
- `/explorer/carte` et `/explorer/liste` : contrat d’exploration équivalente ;
- `/contribuer` : caractérisation locale du passage en relecture humaine ;
- `/participation-enfants` : principe anonyme et accompagné ;
- `/evolutions` : mémoire et suite donnée légère ;
- `/protection` et `*`.

### Professionnel

- `/` : coque explicitement sans donnée ;
- `/connexion` et `/recuperation` : besoins de navigation, sans fournisseur d’identité ;
- `/contributions` et `/qualite` : emplacements techniques ;
- `/acces-refuse` et `*`.

## Architecture carte/liste

Le Lot 1 ne choisit ni moteur cartographique ni fournisseur de tuiles. Il fixe les contrats :

1. paramètres de filtre sérialisés dans l’URL ;
2. une seule requête logique devra produire un ensemble d’identifiants ;
3. carte et liste présenteront ce même ensemble, les mêmes sélections et les mêmes actions ;
4. le changement de vue conserve filtres et recherche ;
5. la liste restera utilisable sans téléchargement du moteur cartographique ;
6. aucune localisation ne sera inventée à partir du centre d’un quartier.

La carte conservera sa primauté expressive. La liste est une vue publique équivalente, pas un
annuaire autonome.

## Contrats métier provisoires

`packages/domain` nomme Organisation, Territoire, Utilisateur, Contribution, Publication,
Structure, Initiative, Source, Vérification et Suite donnée. Ces interfaces sont marquées
`@experimental`. Elles ne définissent aucune table, cardinalité, permission, géométrie ou taxonomie
définitive.

Les invariants déjà validés sont testés :

- la parole originale et sa publication publique sont distinctes ;
- toute soumission passe en `pending-review` et en relecture humaine ;
- seule une publication explicitement `published` est visible publiquement.

## Choix reportés après le Lot 2

- branchement Auth et Data API dans les points de composition des applications ;
- invitations professionnelles et MFA/step-up ;
- fournisseur de carte, géométries et géocodage ;
- workflow complet de qualification et de modération ;
- stockage média, droits et journalisation ;
- hébergement et topologie de déploiement.
