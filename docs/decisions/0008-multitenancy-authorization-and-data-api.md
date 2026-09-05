# ADR-008 — Multi-collectivité, autorisation et surface Data API

- Statut : accepté pour le Lot 2
- Date : 2026-09-05

## Problème

Ajouter `organization_id` ne suffit pas à empêcher une fuite entre collectivités. La frontière doit
rester valable face aux lectures, écritures, memberships inactives, relations croisées et fonctions
privilégiées.

## Hypothèse

Une combinaison minimale de `GRANT`, RLS, contraintes composites et fonction d’autorisation unique
est plus auditable qu’une multiplication de politiques et de rôles applicatifs rigides.

## Options

1. sécurité gérée par le frontend et filtres `organization_id` ;
2. tables internes directement exposées avec RLS seule ;
3. schémas internes, privilèges minimaux, RLS, contraintes composites et vues `api` dédiées.

## Avis contradictoires

L’exposition directe simplifie les requêtes et la génération de types. Elle augmente toutefois la
surface Data API et rend chaque nouvelle colonne immédiatement sensible. Une fonction
`SECURITY DEFINER` concentre le risque, mais permet une règle unique testable si son exécution, son
`search_path` et son résultat restent strictement bornés.

## Décision

L’option 3 est retenue. `private.has_permission` vérifie l’utilisateur Auth, l’organisation active,
la membership active, le rôle actif, la permission exacte et le scope. Les tables tenantées sont en
RLS forcée. Les référentiels ont la RLS activée mais aucune politique ni aucun privilège client.
PostgREST expose uniquement `api`, composé de quatre vues `security_invoker`.

## Justification

Cette conception place la décision côté serveur, empêche les références inter-tenant au niveau des
clés et maintient une surface de données explicite. Elle autorise la double appartenance uniquement
par memberships distinctes.

## Tests de décision

`supabase/tests/lot2_rls.sql` vérifie anon, A/B, administrateur, DPO, membership inactive, double
appartenance, scope territorial, `GRANT`, fonction privilégiée, clés composites et immutabilité. Les
données synthétiques sont annulées. Ces tests ont détecté puis fait corriger deux défauts : création
de territoire impossible et clé de permission non comparée.

## Limites

Le Lot 2 ne crée aucun compte réel, aucune contribution, aucune donnée de Lomme et aucun flux MFA.
Chaque futur objet métier devra recevoir ses propres politiques et tests négatifs.
