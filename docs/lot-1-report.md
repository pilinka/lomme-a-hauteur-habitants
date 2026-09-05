# Rapport de sortie — Lot 1 V4

Date : 2026-09-05
Statut : **socle local réalisé ; clôture externe conditionnelle**

## 1. Périmètre respecté

- Option B conservée : la V4 reste destinée à un projet Supabase distinct.
- `main` et la référence V3 n’ont pas été modifiés.
- Supabase V3 n’a pas été réactivé ni consulté pendant le Lot 1.
- Aucun projet Supabase V4, schéma V4, migration, seed, site ou déploiement n’a été créé.
- Aucune donnée V3, donnée réelle de Lomme, identité professionnelle ou archive probatoire n’est
  utilisée par le runtime V4.

## 2. Réalisation

- deux applications Vite React indépendantes : `public-web` et `professional-console` ;
- branche locale `v4/lot-1-foundations` matérialisée par le commit `c033694` ;
- workspaces npm et packages effectivement utilisés : `@ahh/domain` et `@ahh/ui` ;
- contrats métier TypeScript provisoires ;
- routage public/professionnel ;
- composants accessibles, focus, messages et lien d’évitement ;
- lint, formatage, TypeScript, tests Vitest, contrôles d’architecture, contrastes et secrets ;
- CI GitHub avec actions épinglées et permissions minimales ;
- tests de caractérisation synthétiques ;
- contrôle des fixtures et de leur absence dans les bundles ;
- documentation et ADR 001 à 007.

## 3. AUTODIAGNOSTIC AVANT RED TEAM

Les risques identifiés avant confrontation étaient :

- documentation historique susceptible d’être prise pour l’état V4 ;
- médias V3 présents localement dans une arborescence non suivie ;
- localisation provisoire trop proche d’une géométrie réelle ;
- saisie libre sans rappel suffisamment proche du geste ;
- fixtures contrôlées seulement par convention ;
- absence de preuve locale d’exécution navigateur Chromium ;
- branche V4 locale non encore publiée sur le remote.

## 4. CORRECTIONS APRÈS RED TEAM

- ajout d’un bandeau explicite à la feuille de route V3 ;
- exclusion Git des médias V3 et clarification de leur statut documentaire ;
- ajout de `check-fixtures.mjs`, exécuté après build en CI ;
- ajout de contrôles de manifests et de bundles dans le contrôle d’architecture ;
- avertissement de minimisation avant la contribution ;
- refus des titres et contenus composés uniquement d’espaces ;
- réinitialisation de la saisie après vérification locale ;
- ajout du lien vers le parcours enfant accompagné ;
- description accessible externe conservée dans `TextField` ;
- couverture Axe élargie aux routes techniques principales ;
- contrats de localisation rendus opaques et explicitement provisoires.

## 5. Vérifications

Passent localement après installation des dépendances :

- formatage Prettier ;
- ESLint sans avertissement bloquant ;
- TypeScript pour les quatre workspaces ;
- contrôle d’architecture ;
- contrôle des contrastes ;
- contrôle des secrets dans l’arbre et l’historique disponible ;
- tests Vitest et couverture du domaine ;
- builds des deux applications ;
- contrôle des fixtures après build.

Les tests Playwright n’ont pas pu être validés dans cet environnement : l’installation du navigateur
Chromium a expiré côté CDN. La CI contient bien l’étape d’installation du navigateur ; le passage
réel des E2E reste donc à confirmer dans la CI ou sur une machine équipée.

Le scan historique local porte sur un clone superficiel d’un seul commit. Il ne constitue pas une
preuve exhaustive de tout l’historique distant.

## 6. Red Team — verdict

**PASS conditionnel sur le périmètre et la sécurité du socle local.**

La Red Team ne trouve aucun secret, aucune dépendance Supabase, aucune donnée V3 dans les bundles,
aucun import de fixture en production et aucun dépassement vers le Lot 2.

La clôture complète reste conditionnée par :

- passage effectif des E2E Playwright ;
- publication de la branche sur GitHub : l’environnement a refusé le `push` vers le remote non
  vérifié, car cette publication externe nécessite une autorisation distincte ; aucune tentative de
  contournement n’a été effectuée ;
- confirmation externe de l’état Supabase V3, qui reste documenté `INACTIVE` depuis la clôture du Lot 0.

## 7. Points explicitement reportés au Lot 2

- projet Supabase V4 ;
- schéma, migrations et RLS ;
- authentification et autorisation ;
- isolation multi-collectivité ;
- provenance, vérification, conservation et géoprivacy ;
- vraie carte, géocodage et médias ;
- corpus réel de Lomme ;
- déploiement et hébergement.

**Arrêt obligatoire respecté : le Lot 2 n’est pas commencé.**
