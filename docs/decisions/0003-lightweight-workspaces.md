# ADR-003 — npm workspaces et deux packages

- Statut : accepté
- Date : 2026-09-05

## Décision

npm workspaces suffit au Lot 1. Seuls `@ahh/domain` et `@ahh/ui` sont créés, car les deux
applications les consomment réellement.

## Conséquence

Pas de Nx, Turbo, Lerna, Storybook, bibliothèque d’état, `application`, `data-access`, `validation`,
`database-types` ou `tenant-config` avant un besoin démontré.
