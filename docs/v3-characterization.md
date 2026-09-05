# Catalogue de caractérisation V3

Référence immuable : commit `e8b582083fdee56d6fcd91b2bc03c06fc1e0265f`. Les tests du Lot 1
caractérisent les intentions validées, pas l’implémentation V3.

| Comportement observé ou attendu                | Décision V4            | Preuve au Lot 1                    |
| ---------------------------------------------- | ---------------------- | ---------------------------------- |
| parole originale distincte de la publication   | conserver              | types et tests `domain`            |
| nouvelle proposition non publique              | conserver              | test `submitForHumanReview`        |
| publication issue d’une décision humaine       | conserver              | règle pure et texte des deux apps  |
| exploration territoriale par carte et filtres  | conserver et corriger  | routes carte/liste, paramètres URL |
| participation enfant anonyme et accompagnée    | conserver              | route et politique de fixtures     |
| séparation public/professionnel                | conserver et renforcer | deux builds indépendants           |
| récupération de compte                         | conserver comme besoin | route sans fournisseur actif       |
| navigation React par état local                | abandonner             | React Router et liens réels        |
| six contributions et quatre fiches codées      | exclure                | aucun contenu repris               |
| mélange fixtures/données distantes             | abandonner             | test d’architecture                |
| rectangles de quartiers et centres inventés    | abandonner             | aucune géométrie au Lot 1          |
| faux téléversement                             | abandonner             | aucun flux média                   |
| contrôle de rôle ou verrou de connexion client | abandonner             | aucune fausse route sécurisée      |
| accès direct Supabase et `select('*')`         | abandonner             | dépendance interdite               |
| fonctions dupliquées/incomplètes               | abandonner             | reconstruction par contrats        |
| export CSV vulnérable aux formules             | abandonner             | aucun export au Lot 1              |

## Anomalies techniques relevées

- monolithe `App.jsx` d’environ 2 275 lignes et feuille de styles d’environ 1 220 lignes ;
- client utilisant `latitude/longitude` alors que le schéma audité utilisait `lat/lon` ;
- gestion de récupération et export CSV dupliqués ;
- symboles de modération référencés mais non définis ;
- bouton de consultation des règles dépendant d’un état inexistant ;
- dépendances `latest`, absence de lint, types, tests et CI.

Ces anomalies sont documentées pour empêcher une migration mécanique. Aucun test ne doit les
ériger en oracle.
