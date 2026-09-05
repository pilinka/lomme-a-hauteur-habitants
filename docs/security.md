# Sécurité et données de test

## Garanties des Lots 1 et 2

- aucun secret Supabase versionné ; seules les variables vides d’URL et de clé publiable sont
  documentées dans `.env.example` ;
- aucune `service_role` dans le navigateur ;
- isolation serveur par membership active, rôle, permission et scope territorial ;
- contraintes composites contre les relations inter-tenant ;
- schémas internes hors de la surface PostgREST, limitée à `api` ;
- RLS active sur toutes les tables du Lot 2 ; référentiels sans politique ni privilège client ;
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

La séparation des bundles public/professionnel n’est jamais utilisée comme autorisation. Les
politiques serveur et RLS du Lot 2 ont été testées dans PostgreSQL avec des tenants A/B synthétiques
et un `ROLLBACK` final.

## Fonction d’autorisation

`private.has_permission` est `SECURITY DEFINER`, stable, à résultat booléen, avec `search_path`
fermé. `PUBLIC` et `anon` n’ont aucun droit d’exécution ; `authenticated` seul peut l’appeler. La
fonction vérifie explicitement la clé de permission demandée. Cette dernière condition a été ajoutée
après qu’un test négatif a détecté une élévation de privilèges lors de la clôture.

## Registre pour les lots suivants

- CSP, HSTS, Referrer-Policy et Permissions-Policy au déploiement ;
- vie privée des fournisseurs de carte et géocodage ;
- journalisation sans données sensibles ;
- stockage média et droits ;
- CodeQL et règles de protection de branche.
