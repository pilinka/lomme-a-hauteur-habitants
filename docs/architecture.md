# Architecture du Lot 1

## Décision

Le dépôt devient un monorepo npm workspaces léger : deux applications indépendantes et deux
paquets partagés effectivement consommés. Cette séparation protège les trajectoires publiques et
professionnelles sans prétendre assurer une autorisation serveur.

```text
apps/
  public-web/               expérience publique
  professional-console/     coque professionnelle distincte
packages/
  domain/                   types provisoires et règles pures
  ui/                       jetons et composants accessibles
tests/
  e2e/                      parcours inter-applications en navigateur
  fixtures/                 données exclusivement synthétiques de test
```

`application`, `data-access`, `validation`, `database-types`, `tenant-config`, `supabase/` et les
migrations sont volontairement absents. Ils ne seront introduits qu’après validation de leurs
contrats au Lot 2.

## Frontières

| Élément                | Responsabilité au Lot 1                                        | Interdit au Lot 1                          |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `public-web`           | routes publiques, navigation, états vides, contrat carte/liste | corpus, vraie carte, stockage, publication |
| `professional-console` | routes techniques, coque vide, séparation de bundle            | comptes, rôles, modération opérationnelle  |
| `domain`               | distinctions conceptuelles et règles de publication pures      | SQL, statuts définitifs, tenant, droits    |
| `ui`                   | jetons, focus, champs, messages, dialogue, shell               | logique métier ou dépendance Supabase      |

Les deux builds sont indépendants. Aucun import n’est permis entre les deux applications. Les deux
peuvent dépendre de `domain` et `ui`, jamais l’inverse.

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

## Choix reportés

- projet Supabase V4, schéma, RLS et isolation multi-tenant ;
- modèle d’adhésion et d’habilitation ;
- fournisseur de carte, géométries et géocodage ;
- workflow complet de qualification et de modération ;
- stockage média, droits et journalisation ;
- hébergement et topologie de déploiement.
