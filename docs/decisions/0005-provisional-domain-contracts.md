# ADR-005 — Contrats métier provisoires

- Statut : accepté pour le Lot 1, réexamen obligatoire au Lot 2
- Date : 2026-09-05

## Décision

Les distinctions Contribution/Publication, Structure/Initiative, Source/Vérification et Suite
donnée sont typées sans décrire la persistance. Les états restent des chaînes ouvertes.

## Conséquence

Les types ne génèrent ni SQL ni enum de base. `UserRef` ne contient aucun rôle ; les futures
habilitations appartiendront au modèle d’adhésion organisationnelle.
