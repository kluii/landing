# Klui site — dossier de specs

Ce dossier contient les fichiers à déposer dans le repo `klui-site` (landing + docs + changelog + pages légales). Rien ici ne concerne l'app : elle a son propre repo et son propre prompt.

## Où copier quoi

```
klui-site/
├── PROMPT.md                  ← à la racine. Le prompt à donner à l'agent.
├── ROADMAP.md                 ← à la racine
├── DESIGN.md                  ← à la racine
├── AGENTS.md                  ← à la racine (lu en premier)
├── assets/
│   ├── light-logo.png         ← ton fichier (encre blanche → fond sombre)
│   └── dark-logo.png          ← ton fichier (encre noire #0C0C0C → fond clair, print)
└── docs/
    ├── decisions.md           ← registre des décisions verrouillées
    ├── content.md             ← voix, copie verrouillée, politique des chiffres
    ├── architecture.md
    ├── docs-sync.md           ← comment les docs de l'app deviennent celles du site
    ├── seo.md
    ├── deploy.md
    ├── legal.md
    ├── analytics.md
    ├── testing.md
    ├── adr/0000-template.md
    ├── verify/_TEMPLATE.md
    └── features/
        ├── landing.md
        ├── documentation-site.md
        ├── changelog.md
        └── demo-board.md
```

Ne renomme pas les fichiers : les documents se citent par chemin, et l'agent suit cet ordre de lecture.

DESIGN.md commence par un tableau **kept / changed / refused** face à la référence Midday : c'est la page à lire en premier si tu veux vetoter la direction en une minute plutôt qu'après un build.

## Ordre de lecture pour l'agent

1. `AGENTS.md`
2. `PROMPT.md`
3. `ROADMAP.md`
4. `DESIGN.md`
5. `docs/decisions.md`
6. `docs/content.md` (voix + chiffres)
7. `docs/architecture.md` → `docs-sync.md` → `seo.md` → `deploy.md` → `legal.md` → `analytics.md` → `testing.md`
8. `docs/features/<la feature de la tâche>`

## Les cinq décisions structurantes

- **Broadsheet sur graphite.** Un seul jeu de tokens, pas de toggle, aucun accent de marque. Titres en serif (Newsreader 400), corps en Inter avec interlettrage positif, faits en mono, contrôles en pilules, et **une seule plaque papier** qui porte le produit — c'est l'inversion du cadre sombre de Midday. La couleur n'apparaît que dans l'illustration (les chips de tags de l'app).
- **Pas de framework client.** Astro statique, deux îlots JS (copier, menu mobile). La landing doit rester sous 15 Ko de JS ; un composant React pour un bouton serait une régression mesurable.
- **Une seule source pour les docs.** `scripts/sync-docs.mjs` copie les docs de l'app au tag de release, réécrit les liens, stampe la version. Personne n'édite une page générée dans le repo du site : `--check` échoue en CI.
- **Chaque chiffre a une source.** `src/data/claims.ts` donne la valeur, le chemin dans l'app et la version vérifiée ; le build de release échoue si un chiffre ne correspond plus à l'artefact synchronisé. Un nombre sans source est une rumeur.
- **Aucune preuve sociale inventée, aucun prix.** Pas de témoignages, pas de mur de logos, pas de page tarifs tant qu'il n'y a pas d'offre hébergée. Le CTA principal, c'est l'auto-hébergement.

## Deux pièges d'assets

`light-logo.png` = encre **blanche**, donc à poser sur le fond sombre (nav, footer, OG). `dark-logo.png` = encre **noire**, réservé au print et aux contextes clairs. Le nom du fichier décrit l'encre, pas le thème — c'est écrit dans `DESIGN.md` §15.

Tailles : 24 px nav, 32 px footer, 40 px OG, 48 px 404. Jamais sous 20, jamais au-dessus de 64. Le favicon n'est pas le wordmark (illisible à 16 px) : c'est un « K » en Inter 600 sur un carré `#0C0C0C` arrondi à 4 px.

## Avant de lancer l'agent

1. Vérifie que `assets/` contient les deux PNG et que le repo est vide par ailleurs.
2. Commit ce dossier sur `dev`, pas `main`.
3. Donne-lui `PROMPT.md`, pas ce README.
4. Exige `docs/verify/l0.md` avant L1 : c'est là qu'on voit si la CI a réellement tourné.
5. Le build échouera tant que `../klui` n'existe pas à côté : c'est voulu, le site ne publie pas de docs inventées.

## Ce que ce dossier ne contient pas

- L'app, son API, son MCP, ses migrations : repo `klui`.
- Les tarifs de l'offre hébergée : décision produit.
- Les vraies valeurs légales (`{{OPERATOR}}`, `{{CONTACT}}`, `{{HOSTING_REGION}}`) : item ouvert O-02. Tant qu'elles manquent, le build de production échoue — et c'est le comportement correct.
- Le contenu des docs v1 gelées : item ouvert O-04. Sans archive, le switcher n'affiche que v2 et le dit.
