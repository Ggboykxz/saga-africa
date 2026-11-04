# ANALYSIS-DESIGN — Passe REA « design Mangadraft »

Passe d'alignement visuel guidée par des captures REA fraîches de
mangadraft.com (navigateur headless Chromium 138, provider
`rea-playwright-browser-scenario`).

## 1. Evidence REA récoltée

- **Hero accueil** : carrousel bibliothèque **Splide** (`splide01`,
  `splide__track--loop`, `--draggable`, slides = `<a class="block asp…">`),
  prefers de bannières en boucle avec meta superposée.
- **Titre de série** (`/webtoon/mesalliance`) :
  `<h1 class="font-bold text-secondary text-outline-white … text-4xl">`
  → titre très gras, avec **contour blanc** (rendu « outliné »), suivi d'un
  suffixe discret `· webtoon scan` ; puis rangée auteur avec **avatar rond** +
  rôles.
- **CSS** : Tailwind utilities (classes `tw-*`/`font-*`/`rounded-*`),
  Quicksand via Google Fonts, tokens déjà identifiés (nuit `#13181f`,
  orangé `#ea5427`, or `#fbd24b`, bleu `#039be5`).

## 2. Application à Saga Africa

| Evidence Mangadraft | Implémentation Saga Africa |
| --- | --- |
| Carrousel de bannières (Splide) | Hero bannière-carrousel (autoplay 5 s, flèches, points) + rangées horizontales `Carousel` à flèches |
| Titre gras avec contour (`text-outline-white`) | Utilité `.text-outline` appliquée au titre de bannière |
| Suffixe `· webtoon scan` sous/sur le titre | Fiche série : `· {format} scan|original` en suffixe du titre |
| Avatar rond dans la ligne auteur | Fiche série : avatar rond réel (ou initiale) + @pseudo |
| Pilules de format/genres superposées au visuel | Pilules sur bannières + cartes (badges) |
| Rangées de cartes 3/4 avec dégradé + titre | `SeriesCard` + rangées horizontales snap |

## 3. Limites

- Le provider navigateur ne supportait pas les scènes multi-étapes (échecs
  sur `goto` successifs) → captures unitaires page par page.
- Pas de vision d'images par le modèle : tokens déduits du DOM + CSS, pas des
  screenshots.
- Aucun asset de Mangadraft n'est copié ; inspiration de structure/style
  uniquement.
