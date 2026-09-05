# ADR-002 — Deux applications React distinctes

- Statut : accepté
- Date : 2026-09-05

## Décision

L’expérience publique et la console professionnelle sont deux applications Vite distinctes. Elles
partagent seulement les contrats et composants communs nécessaires.

## Conséquence

Les bundles, routes, ports et futures politiques de déploiement sont indépendants. Cette séparation
n’est pas un mécanisme d’autorisation ; la protection des données relèvera du serveur et de la RLS.
