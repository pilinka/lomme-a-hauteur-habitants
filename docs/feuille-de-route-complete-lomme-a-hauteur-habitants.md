# Feuille de route complète — Lomme à hauteur d’habitants

> **DOCUMENT HISTORIQUE V3 — NON NORMATIF — NE DÉCRIT PAS LE LOT 1 V4**
>
> Ce document conserve les intentions et l’état du prototype V3 à titre documentaire. Les cases
> cochées, les URLs, les branchements Supabase, les comptes, les données et les déploiements qu’il
> mentionne ne constituent ni des garanties actuelles ni une spécification de la V4. Consultez
> [`README.md`](../README.md), [`docs/architecture.md`](architecture.md) et les ADR pour le socle
> V4.

Document de suivi unique pour l’application **Lomme à hauteur d’habitants**.

Cette feuille de route rassemble les choix techniques, les règles de protection, les priorités de développement et les évolutions futures de l’application.

---

## Fil directeur

```txt
Habitant → contribution → modération humaine → publication → diagnostic → archivage
```

Principe central :

```txt
Aucune contribution habitante ne doit être publiée automatiquement.
```

---

# 1. Prototype actuel — Stabiliser l’application existante

## 1.1. Socle technique

```txt
☑ Application React / Vite
☑ Carte Leaflet / React Leaflet
☑ Connexion Supabase
☑ Déploiement Netlify
☑ Variables d’environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
☑ Séparation progressive entre partie publique et espace Urbanistes
```

À garder absolument :

```txt
☐ Ne jamais exposer la clé Supabase service_role dans le frontend
☐ Ne jamais publier .env.local dans GitHub
☐ Tester localement avant déploiement lorsque c’est possible
☐ Garder des commits réguliers après chaque étape stable
```

---

## 1.2. Partie publique habitante

### Objectif

Permettre aux habitants de consulter, comprendre et contribuer sans accéder aux données internes.

### À conserver / améliorer

```txt
☑ Accueil public
☑ Carte publique
☑ Formulaire de contribution habitante
☑ Formulaire ville à hauteur d’enfants
☑ Page Protection / règles / documents
☑ Affichage public limité aux contributions publiées
☑ Mention discrète “Contribution relue avant publication”
☐ Améliorer encore la lisibilité mobile
☐ Clarifier le parcours : explorer → contribuer → modération → publication
☐ Prévoir une page ou section “Vie locale” plus explicite
```

### Règle publique

```txt
La carte publique affiche uniquement : status = published
```

Les statuts suivants restent invisibles publiquement :

```txt
pending
rejected
archived
reported
removed
```

---

## 1.3. Formulaire de contribution

### Objectif

Recueillir des contributions utiles au diagnostic tout en protégeant les personnes.

```txt
☑ Titre
☑ Quartier
☑ Type de contribution
☑ Ressenti
☑ Description courte
☑ Localisation choisie ou centre du quartier
☑ Case d’acceptation des règles avant envoi
☑ Envoi en status = pending
☐ Ajouter une alerte plus visible contre les données personnelles
☐ Ajouter une mention spécifique avant dépôt d’image
☐ Prévoir plus tard un vrai téléversement sécurisé des médias
☐ Prévoir une option “contribution issue d’un atelier accompagné”
```

### Règles à maintenir

```txt
☐ Éviter les noms complets
☐ Éviter les adresses personnelles précises
☐ Éviter les accusations nominatives
☐ Éviter les photos de personnes reconnaissables
☐ Refuser par défaut les photos d’enfants reconnaissables
☐ Privilégier dessins, phrases, poèmes et productions anonymisées pour les enfants
```

---

# 2. Espace Urbanistes / Admin

## 2.1. Accès privé

### Objectif

Faire de l’espace Urbanistes un véritable back-office, tout en gardant une entrée publique très limitée.

```txt
☑ Lien discret “Espace urbanistes” hors menu principal public
☑ Avant connexion : affichage limité au formulaire de connexion
☑ Mot de passe oublié
☑ Après connexion : accès au tableau de bord interne
☐ Améliorer le design du haut de page interne
☐ Ajouter un vrai menu interne après connexion
```

Avant connexion, le public doit voir seulement :

```txt
Espace urbanistes
E-mail professionnel
Mot de passe
Se connecter
Mot de passe oublié
Message “Accès réservé aux personnes autorisées”
```

Avant connexion, le public ne doit pas voir :

```txt
les contributions en attente
les exports
les statistiques internes
la gestion des accès
les notes internes
les décisions de modération
```

---

## 2.2. Modération

### Objectif

Permettre une validation humaine claire des contributions.

```txt
☑ Onglets En attente / Publiées / Refusées / Archivées
☑ Compteurs par statut
☑ Boutons Publier / Refuser / Archiver
☑ Motif de refus ou d’archivage à consolider
☑ Retrait des contributions archivées de la carte publique
☐ Ajouter des motifs harmonisés de refus
☐ Ajouter une note interne de modération
☐ Ajouter un historique par contribution
☐ Ajouter un bouton “Voir sur la carte” après publication
☐ Recharger automatiquement la carte après publication
```

### Statuts à conserver

```txt
pending     → contribution reçue, en attente de relecture
published   → visible sur la carte publique
rejected    → refusée, invisible publiquement
archived    → retirée de l’affichage public, conservée côté interne
reported    → signalée après publication
removed     → retirée après examen
```

---

## 2.3. Exports et diagnostic

### Objectif

Faire de l’application un outil d’appui au diagnostic urbain.

```txt
☑ Aperçu diagnostic interne
☑ Répartition par quartier
☑ Répartition par ressenti
☑ Répartition par type
☑ Répartition par couche
☑ Export CSV des contributions
☐ Nettoyer les éventuels doublons de boutons export
☐ Réserver les exports aux rôles autorisés
☐ Ajouter plus tard un export PDF diagnostic
☐ Ajouter une mention “données agrégées / anonymisées” dans les exports
☐ Prévoir des limites méthodologiques dans l’export PDF
```

Export CSV attendu :

```txt
id
date_depot
quartier
couche
type
ressenti
statut
titre
description anonymisée
latitude
longitude
```

Export PDF futur :

```txt
☐ Date d’export
☐ Périmètre : Lomme
☐ Nombre total de contributions
☐ Répartition par quartier
☐ Répartition par ressenti
☐ Répartition par type
☐ Lieux les plus mentionnés
☐ Synthèse ville à hauteur d’enfants
☐ Synthèse vie locale
☐ Points de vigilance
☐ Limites méthodologiques
☐ Mention RGPD / anonymisation
```

---

# 3. Supabase Auth, profils et rôles

## 3.1. Connexion

### Objectif

Utiliser Supabase Auth pour gérer les comptes, mots de passe et sessions.

```txt
☑ Connexion e-mail / mot de passe
☑ Déconnexion
☑ Mot de passe oublié
☑ Session Supabase lue dans l’application
☐ Vérifier les URL de redirection Supabase : Netlify + localhost
```

Règle importante :

```txt
Le mot de passe reste dans Supabase Auth.
Il ne doit jamais être stocké dans la table profiles.
```

---

## 3.2. Table profiles

### Objectif

Associer à chaque compte Auth une identité et un rôle métier.

```txt
☑ Table profiles créée
☑ Rôle gestionnaire ajouté
☑ Profil gestionnaire créé pour le compte principal
☑ Lecture du profil connecté dans l’application
☑ Affichage / masquage de certains modules selon le rôle
```

Champs actuels / prévus :

```txt
id
first_name
last_name
email
role
status
created_at
updated_at
```

Champs à ajouter plus tard :

```txt
☐ avatar_url
☐ fonction
☐ service
☐ organisation
☐ last_login_at
```

---

## 3.3. Rôles internes

### Rôles à conserver

```txt
gestionnaire
admin
urbaniste
moderateur
lecteur_interne
```

### Droits attendus

```txt
gestionnaire
→ gestion des accès
→ modération
→ exports
→ diagnostic
→ suivi général

admin
→ accès large
→ paramétrage
→ modération
→ exports
→ suivi général

urbaniste
→ lecture des contributions
→ diagnostic
→ exports autorisés
→ pas de gestion des accès
→ pas de publication/refus/archivage

moderateur
→ lecture des contributions
→ publication
→ refus
→ archivage
→ pas de gestion des accès
→ pas d’export si réservé

lecteur_interne
→ consultation limitée
→ pas de modération
→ pas d’export
→ pas de gestion des accès
```

### Variables de droits dans le code

```txt
☑ canManageAccess
☑ canModerate
☑ canExport
☑ canViewDiagnostic
☐ Tester chaque rôle avec un compte distinct
☐ Renforcer les règles RLS côté Supabase
```

---

# 4. Gestion professionnelle des utilisateurs internes

## 4.1. Objectif

Permettre à une collectivité d’ajouter, modifier ou désactiver les profils internes directement depuis l’application, sans accéder au code, à GitHub ou à l’interface Supabase.

## 4.2. Parcours cible

```txt
Gestionnaire des accès connecté
→ Gestion des accès internes
→ Ajouter un utilisateur
→ Saisir prénom, nom, e-mail professionnel, rôle
→ Envoyer une invitation
→ L’agent reçoit un lien pour définir son mot de passe
→ À la connexion, l’agent voit uniquement les modules liés à son rôle
```

## 4.3. Fonctionnalités à prévoir

```txt
☐ Bouton “Ajouter un utilisateur” visible seulement pour gestionnaire/admin
☐ Formulaire interne : prénom, nom, e-mail professionnel, rôle, statut
☐ Liste des utilisateurs internes
☐ Modification du rôle par le gestionnaire
☐ Désactivation d’un compte
☐ Historique des modifications de droits
☐ Envoi d’une invitation par e-mail
☐ Réinitialisation du mot de passe par invitation
```

## 4.4. Fonction serveur obligatoire

La création de comptes ne doit pas se faire directement depuis React.

À prévoir :

```txt
☐ Supabase Edge Function
ou
☐ Netlify Function
```

La fonction serveur doit :

```txt
☐ vérifier que la personne connectée est gestionnaire ou admin
☐ créer le compte dans Supabase Auth
☐ créer ou mettre à jour la ligne profiles
☐ envoyer ou déclencher un lien d’invitation
☐ journaliser l’action
```

Règles de sécurité :

```txt
☐ Ne jamais exposer la service_role key dans le navigateur
☐ Ne jamais créer les comptes Auth directement depuis le frontend React
☐ Ne jamais stocker les mots de passe dans profiles
☐ Journaliser les créations, modifications et désactivations de comptes
```

---

# 5. Profil connecté et espace Mon compte

## 5.1. Objectif

Rendre l’espace Urbanistes/Admin plus professionnel en affichant clairement l’identité de la personne connectée.

## 5.2. Affichage du profil connecté

```txt
☑ Lire le profil connecté depuis Supabase profiles
☑ Afficher le prénom, le nom et le rôle dans l’espace Urbanistes
☐ Déplacer l’affichage du profil en haut à droite de l’interface interne
☐ Ajouter une pastille avec les initiales
☐ Prévoir une photo de profil optionnelle
☐ Ajouter un menu utilisateur
☐ Ajouter une entrée “Mon compte”
☐ Ajouter une entrée “Se déconnecter”
```

Affichage cible :

```txt
Initiales ou avatar
Prénom Nom
Rôle
Menu : Mon compte / Se déconnecter
```

## 5.3. Espace Mon compte

```txt
☐ Créer une page ou un panneau “Mon compte”
☐ Afficher prénom
☐ Afficher nom
☐ Afficher e-mail
☐ Afficher rôle
☐ Afficher statut du compte
☐ Afficher date d’ajout si disponible
☐ Afficher service ou fonction si ajouté plus tard
☐ Permettre la consultation des informations
☐ Permettre plus tard la modification de certaines informations personnelles
☐ Interdire à l’utilisateur de modifier lui-même son rôle
☐ Réserver les changements de rôle au gestionnaire/admin
```
---

# 6. Journal de modération et traçabilité

## 6.1. Objectif

Savoir qui a pris quelle décision, quand, et pourquoi.

```txt id="p7v80t"
☐ Créer une table moderation_logs
☐ Enregistrer contribution_id
☐ Enregistrer ancien statut
☐ Enregistrer nouveau statut
☐ Enregistrer moderator_id
☐ Enregistrer motif
☐ Enregistrer date
☐ Afficher l’historique dans l’espace Urbanistes
☐ Protéger les logs : lecture admin/gestionnaire seulement ou profils autorisés
☐ Prévoir un export interne des logs
```

## 6.2. Décisions à journaliser

```txt id="gmf57u"
publication
refus
archivage
republication
retrait après signalement
modification de motif
```

---

# 7. Données sensibles, autorisations et demandes de retrait

## 7.1. Objectif

Séparer les contributions publiques des informations sensibles ou internes.

Tables futures :

```txt id="fzyozh"
contribution_private
authorizations
withdrawal_requests
```

## 7.2. Données privées possibles

```txt id="l8k6vz"
☐ contact_email
☐ consent_version
☐ consent_accepted_at
☐ internal_note
☐ withdrawal_request
☐ droit à l’image
☐ autorisation parentale
☐ demande de correction
☐ demande de suppression
```

## 7.3. Règles

```txt id="q2xf8d"
☐ Ne jamais afficher les contacts dans la partie publique
☐ Ne jamais afficher les notes internes publiquement
☐ Ne jamais afficher les autorisations publiquement
☐ Réserver ces données aux rôles autorisés
☐ Prévoir une procédure de retrait rapide
```

---

# 8. Vie locale : associations, événements, lieux ressources

## 8.1. Objectif

Rendre la couche Vie locale administrable sans modifier le code.

```txt id="gv60lb"
☐ Créer une table Supabase vie_locale
☐ Ajouter un formulaire admin “Ajouter une association”
☐ Ajouter un formulaire admin “Ajouter un événement”
☐ Ajouter une date de début et de fin pour les événements
☐ Ajouter une catégorie : culture, sport, solidarité, jeunesse, alimentation, nature, santé, vie associative
☐ Afficher uniquement les éléments published sur la carte publique
☐ Archiver automatiquement les événements passés
☐ Ajouter une source ou un lien de vérification
```

Critère de réussite :

```txt id="obokpi"
La ville ou un modérateur autorisé peut ajouter un événement sans modifier le code.
```

---

# 9. Archivage intelligent

## 9.1. Archivage au cas par cas

```txt id="klsixp"
☑ Archiver une contribution publiée
☑ Retirer une contribution archived de la carte publique
☑ Garder archived visible côté interne
☐ Ajouter archive_reason
☐ Ajouter archived_at
☐ Ajouter moderator_id
☐ Ajouter une option Republier
```

## 9.2. Archivage par durée

```txt id="p5g8cx"
☐ Ajouter expires_at
☐ Définir des durées par type : événement, contribution enfant, idée, témoignage
☐ Filtre “à archiver bientôt”
☐ Bouton “Archiver les contenus expirés”
☐ Automatisation future
```

---

# 10. Cartographie et quartiers

## 10.1. Objectif

Améliorer la crédibilité cartographique pour une collectivité.

```txt id="df6u17"
☑ Carte Leaflet
☑ Couches habitants / enfants / vie locale / idées
☑ Zoom par quartier
☑ Zones de zoom provisoires
☐ Remplacer les rectangles ou zones provisoires par de vrais contours de quartiers
☐ Utiliser un GeoJSON officiel si disponible
☐ Ajouter une légende plus claire
☐ Ajouter un bouton “Toute la ville” plus visible
☐ Améliorer l’affichage mobile de la carte
☐ Ajouter une couche “Contributions enfants” plus maîtrisée
☐ Ajouter une couche “Vie locale” connectée à Supabase
```

---

# 11. Protection, conformité et documents

## 11.1. Documents intégrés

```txt id="fdajl4"
☑ Politique de confidentialité
☑ Charte d’usage et de modération
☑ Charte d’usage de l’intelligence artificielle
☑ Page Protection
☑ Lecture intégrée des PDF
☑ Téléchargement des documents
```

## 11.2. À faire avant usage officiel

```txt id="acrhg7"
☐ Compléter responsable de traitement
☐ Compléter contact données personnelles
☐ Compléter contact DPO
☐ Faire relire par juriste / DPO
☐ Valider bases légales
☐ Auditer cookies et traceurs
☐ Prévoir formulaire autorisation parentale
☐ Prévoir procédure de retrait
☐ Documenter Netlify, GitHub, Supabase et fournisseur cartographique
```

---

# 12. Usage éventuel de l’intelligence artificielle

## 12.1. Principe

```txt id="mz4l4t"
L’IA assiste. L’humain décide.
```

## 12.2. Usages possibles

```txt id="fp9gvl"
☐ Classement thématique
☐ Détection de doublons
☐ Reformulation
☐ Aide à l’anonymisation
☐ Synthèse par quartier
☐ Synthèse par thème
☐ Préparation d’un diagnostic
```

## 12.3. Usages interdits

```txt id="b5vjao"
☐ Publication automatique
☐ Refus automatique
☐ Priorisation automatique sensible
☐ Notation des habitants
☐ Profilage individuel
☐ Reconnaissance faciale
☐ Identification d’enfants
☐ Qualification automatique d’un quartier comme dangereux
```

---

# 13. Sécurité Supabase et RLS

## 13.1. Objectif

Renforcer la sécurité au-delà du simple masquage côté React.

```txt id="tvo9pq"
☐ Vérifier RLS sur contributions
☐ Public : lecture uniquement published
☐ Authentifiés autorisés : lecture des statuts internes selon rôle
☐ Modérateurs : update status selon rôle
☐ Gestionnaire/admin : lecture profiles autorisée
☐ Urbaniste/modérateur/lecteur : lecture limitée profiles
☐ Protéger contribution_private
☐ Protéger authorizations
☐ Protéger moderation_logs
```

Rappel :

```txt id="aj6xfz"
Masquer un bouton dans React améliore l’interface.
Les vraies restrictions doivent aussi exister côté Supabase.
```

---

# 14. Tests

## 14.1. Tests de rôle

```txt id="k3f8xx"
☑ Tester compte gestionnaire
☐ Tester compte admin
☐ Tester compte urbaniste
☐ Tester compte moderateur
☐ Tester compte lecteur_interne
```

À vérifier :

```txt id="ulokh4"
gestionnaire → voit tout
admin → accès large
urbaniste → diagnostic + exports, sans gestion des accès ni modération
moderateur → modération, sans gestion des accès ni exports
lecteur_interne → consultation limitée uniquement
```

## 14.2. Tests fonctionnels

```txt id="ifzj8i"
☐ Ajouter une contribution habitante
☐ Vérifier qu’elle arrive en pending
☐ Vérifier qu’elle est invisible publiquement
☐ Publier la contribution
☐ Vérifier qu’elle apparaît sur la carte publique
☐ Refuser une contribution
☐ Vérifier qu’elle reste invisible publiquement
☐ Archiver une contribution publiée
☐ Vérifier qu’elle disparaît de la carte publique
☐ Exporter un CSV
☐ Tester mot de passe oublié
☐ Tester Netlify
☐ Tester mobile
```
---

# 15. Version démonstration collectivité

## Objectif

Présenter un prototype crédible à une commune, une collectivité, un service urbanisme ou une structure de participation.

Priorités :

```txt id="c5avwe"
☐ Interface publique claire
☐ Espace Urbanistes propre
☐ Rôles visibles et cohérents
☐ Gestion des accès réservée
☐ Contributions modérées
☐ Exports CSV
☐ Documents de confiance intégrés
☐ Carte lisible
☐ Parcours habitant compréhensible en moins de 30 secondes
```

## Démonstration à préparer

```txt id="2t2fih"
☐ Montrer le parcours habitant : contribuer → attendre la modération
☐ Montrer le parcours modérateur : relire → publier / refuser / archiver
☐ Montrer le parcours urbaniste : analyser → filtrer → exporter
☐ Montrer le parcours gestionnaire : consulter les accès internes
☐ Montrer la séparation public / privé
☐ Montrer que les données sensibles restent invisibles publiquement
☐ Montrer la page Protection et les documents de référence
```

---

# 16. Version professionnelle / commercialisable

## Objectif

Transformer le prototype en outil réutilisable par plusieurs collectivités.

À prévoir :

```txt id="fl5ncn"
☐ Multi-collectivités / multi-territoires
☐ Paramétrage du nom de la ville
☐ Paramétrage des quartiers
☐ Gestion complète des utilisateurs depuis l’application
☐ Invitation e-mail sécurisée
☐ Fonctions serveur pour les opérations sensibles
☐ Exports PDF professionnels
☐ Tableau de bord avancé
☐ Archivage automatisé
☐ RLS complète
☐ Journalisation complète
☐ Documentation utilisateur
☐ Documentation administrateur
☐ Modèle économique
☐ Maintenance et support
```

## Points de vigilance avant commercialisation

```txt id="b1qsnf"
☐ Audit juridique RGPD
☐ Audit sécurité Supabase / Netlify
☐ Contrat de sous-traitance ou conditions d’utilisation
☐ Clarification du responsable de traitement
☐ Clarification de l’hébergement des données
☐ Sauvegarde et réversibilité des données
☐ Procédure de suppression des données
☐ Support utilisateur
☐ Documentation pour les collectivités
```

---

# 17. Ordre recommandé des prochaines étapes

```txt id="lsxvrm"
1. Stabiliser l’espace Urbanistes actuel
2. Finaliser les droits selon les rôles
3. Tester un compte urbaniste, moderateur et lecteur_interne
4. Ajouter le profil connecté en haut à droite
5. Créer l’espace Mon compte
6. Ajouter le journal de modération
7. Renforcer les règles RLS Supabase
8. Connecter la Vie locale à Supabase
9. Ajouter l’export PDF diagnostic
10. Préparer la création d’utilisateurs depuis l’application via fonction serveur
```

---

# 18. État actuel synthétique

## Fait

```txt id="jxsvvv"
☑ Prototype fonctionnel
☑ Carte publique
☑ Contributions en pending
☑ Modération humaine
☑ Espace urbanistes connecté
☑ Supabase Auth
☑ Table profiles
☑ Rôle gestionnaire
☑ Gestion des accès réservée au gestionnaire/admin
☑ Déploiement Netlify fonctionnel
☑ Documents de protection intégrés
☑ Feuille de route globale créée
```

## En cours

```txt id="3w3xfr"
☐ Tests complets par rôle
☐ Clarification définitive des droits
☐ Nettoyage de l’espace Urbanistes
☐ Amélioration de l’affichage du profil connecté
```

## À faire plus tard

```txt id="18n93f"
☐ Mon compte
☐ Journal de modération
☐ Ajout d’utilisateurs depuis l’application
☐ RLS complète
☐ Export PDF
☐ Vie locale administrable
☐ Interface multi-collectivités
```

---

# 19. Résumé stratégique

L’application doit rester fidèle à son principe initial :

```txt id="jpu354"
Une carte sensible participative, lisible par les habitants,
mais administrée avec rigueur par les professionnels.
```

La valeur de l’outil repose sur quatre piliers :

```txt id="36itjc"
1. Confiance habitante
2. Modération humaine
3. Diagnostic territorial exploitable
4. Gouvernance claire des accès internes
```

La trajectoire de développement doit garder cet ordre :

```txt id="y20peb"
protéger → modérer → analyser → transmettre → professionnaliser
```
