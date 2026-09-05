# ADR-004 — Routes et frontière public/professionnel

- Statut : accepté
- Date : 2026-09-05

## Décision

React Router fournit de vraies URL, l’historique et des pages directement accessibles. La console
ne déclare aucun faux garde d’autorisation avant la conception du backend.

## Conséquence

Les routes de connexion et d’accès refusé caractérisent des états UX, sans prétendre protéger une
donnée. Les réécritures d’hébergement seront définies au déploiement.
