# Sécurité et données de test

## Garanties du Lot 1

- aucune dépendance, URL ou clé Supabase ;
- aucune transmission ni persistance de donnée personnelle par le socle ; les champs de démonstration
  peuvent toutefois recevoir une saisie locale et affichée temporairement, qui doit rester minimale ;
- aucune reprise de compte ou session V3 ;
- `.env*` ignoré, sauf `.env.example` sans secret ;
- versions exactes et lockfile unique ;
- CI avec permissions `contents: read`, checkout sans identifiants persistants et actions épinglées ;
- détection de formes de secrets sans afficher leur valeur ;
- audit npm bloqué au niveau élevé ;
- Dependabot hebdomadaire ;
- fixtures synthétiques identifiables et interdites en production.

Le script de détection locale est un garde-fou ciblé, pas un substitut à GitHub Secret Scanning,
Push Protection ou un scanner spécialisé. Ces protections de dépôt doivent être activées par le
propriétaire si elles sont disponibles.

## Menaces V3 explicitement non migrées

- rôle et limitation de tentatives contrôlés uniquement dans React ;
- requêtes `select('*')` et mises à jour directes depuis l’interface ;
- mélange automatique fixtures/base ;
- faux téléversement ;
- export CSV sans neutralisation des formules ;
- dépendances non figées et absence de CI.

La séparation des bundles public/professionnel améliore l’exposition du code, mais ne fournit
aucune autorisation. Les politiques serveur et RLS seront conçues et testées au Lot 2.

## Registre pour les lots suivants

- CSP, HSTS, Referrer-Policy et Permissions-Policy au déploiement ;
- vie privée des fournisseurs de carte et géocodage ;
- matrice RLS entre organisations ;
- journalisation sans données sensibles ;
- stockage média et droits ;
- CodeQL et règles de protection de branche.
