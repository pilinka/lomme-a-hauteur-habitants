# Fondations d’accessibilité

La cible est RGAA 4.1.2, complétée dès le socle par les exigences AA pertinentes de WCAG 2.2.

Le Lot 1 apporte :

- ordre `header` / `main` / `footer` et lien d’évitement ;
- vraies URL, historique navigateur et `aria-current` ;
- titre de document et focus sur le titre après changement de page ;
- focus visible commun et prise en compte de `prefers-reduced-motion` ;
- champs étiquetés, aides et erreurs associées ;
- régions `status` et `alert` ;
- composant `<dialog>` natif avec fermeture Échap et retour du focus ;
- jetons dont les contrastes critiques sont testés ;
- contrat d’équivalence fonctionnelle carte/liste.

Avant toute ouverture au public, des contrôles manuels restent obligatoires : clavier complet,
NVDA/Firefox, VoiceOver/Safari, zoom 200 %, largeur 320 px, contraste renforcé, messages dynamiques,
dialogues et futur moteur cartographique.

La V3 présentait notamment une navigation sans URL, aucune vue liste équivalente, des dialogues
incomplets, des alertes bloquantes et plusieurs contrastes insuffisants. Ces accidents ne sont pas
repris comme exigences.
