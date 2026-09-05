# Inventaire technique initial

## V3 gelée

- React/Vite JavaScript, composant central de plus de 2 200 lignes ;
- Leaflet/React-Leaflet et client Supabase dans le bundle unique ;
- aucun TypeScript, routeur, lint, test ou CI ;
- dépendances flottantes ;
- données de démonstration mêlées au chargement distant.

## Socle Lot 1

- Node et npm figés ;
- npm workspaces et un lockfile ;
- React, React DOM, React Router et Vite ;
- TypeScript strict, ESLint avec règles d’accessibilité et Prettier ;
- Vitest, Testing Library, axe-core, Playwright ;
- scripts de frontières architecturales, contraste et secrets ;
- CI GitHub Actions et Dependabot ;
- aucune dépendance cartographique ou Supabase tant que l’usage n’est pas autorisé.
