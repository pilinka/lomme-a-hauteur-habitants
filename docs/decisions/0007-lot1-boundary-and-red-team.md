# ADR-007 — Frontières du Lot 1 après autodiagnostic et Red Team

- Statut : accepté pour le Lot 1, réexamen obligatoire au Lot 2
- Date : 2026-09-05

## Contexte

Le prototype V3, son archive probatoire et les premières fondations V4 coexistent dans le même
espace de travail. Le Lot 1 doit fournir un socle exécutable sans transformer l’archive en source
de données ni figer prématurément le modèle métier.

## Problème

Une documentation historique ou une fixture synthétique pourrait être prise pour une donnée réelle.
Une saisie locale pourrait aussi être interprétée comme un traitement distant alors qu’elle n’est
ni transmise ni persistée.

## Options étudiées

1. conserver les médias et la feuille de route V3 comme éléments actifs du nouveau socle ;
2. les publier dans les bundles V4 ;
3. les conserver comme références documentaires explicitement séparées et ignorer les médias V3 dans
   la branche V4.

## Décision

L’option 3 est retenue. Les applications V4 ne contiennent aucune donnée territoriale, aucun média
V3, aucune connexion Supabase et aucune fixture de test. Les fixtures sont contrôlées par script et
les bundles sont inspectés après build. La contribution de démonstration affiche un avertissement de
minimisation, refuse les champs vides après nettoyage et réinitialise le formulaire après vérification.

## Justification

Cette frontière protège la distinction entre démonstrateur, archive historique et futur corpus réel
de Lomme. Elle maintient les invariants utiles sans faire croire que le Lot 1 dispose déjà d’un
backend, d’une authentification, d’une carte ou de données habitantes.

## Conséquences

- la feuille de route V3 porte un bandeau non normatif ;
- les médias V3 sont ignorés par Git et ne sont pas publiés dans la V4 ;
- les coordonnées sont remplacées par une référence de localisation opaque et provisoire ;
- le modèle multi-collectivité, la géoprivacy, la provenance et la conservation restent au Lot 2 ;
- une authentification réelle et une RLS restent indispensables avant toute donnée professionnelle.

## Révision

Le Lot 2 doit réexaminer les contrats de localisation, l’isolation organisationnelle, la provenance,
les rôles, la conservation et les conditions d’utilisation de tout média territorial.
