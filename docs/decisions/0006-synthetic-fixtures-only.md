# ADR-006 — Fixtures exclusivement synthétiques

- Statut : accepté
- Date : 2026-09-05

## Décision

Les tests utilisent des scénarios inventés, explicitement classés `synthetic-demo`. Aucune ligne,
adresse, personne, structure, coordonnée ou formulation V3 n’est reprise.

## Conséquence

Les fixtures restent sous `tests/fixtures`, sont interdites dans les points d’entrée de production
et ne pourront jamais devenir un seed de production. L’archive V3 n’est pas une source d’import.
