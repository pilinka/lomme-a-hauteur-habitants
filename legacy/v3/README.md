# Référence historique V3

Le code V3 n’est pas copié dans le monorepo. Il reste récupérable sans ambiguïté à :

- commit : `e8b582083fdee56d6fcd91b2bc03c06fc1e0265f` ;
- tag annoté local : `v3-frozen-2026-09-05`.

```bash
git switch --detach v3-frozen-2026-09-05
```

Le tag et la branche V4 n’ont pas pu être publiés depuis cet environnement au moment du Lot 1 :
GitHub a refusé l’écriture avec `403 Resource not accessible by integration`. Cette limite ne
modifie pas le jalon local et ne justifie aucune réactivation du backend V3.

Statut : **RÉFÉRENCE HISTORIQUE / PROTOTYPE GELÉ**. Ce code, ses comptes, ses données et ses
fixtures ne sont jamais une source d’import automatique V4.
