# ANALYSIS — Comment Saga Africa a été re-conçue

Ce document retrace la reconstitution (REA) des trois plateformes de référence
et les décisions produit qui ont mené à Saga Africa. Tout le contenu final
(textes, séries, personnages) est original et fictif.

## 1. Méthodologie REA

Outils utilisés (providers `rea-playwright-browser-scenario`, `rea-web`):

- `capture_browser_scenario` — lancement Chromium headless, navigation sur les
  pages clés, captures screenshot + DOM + événements réseau/console.
- `analyze_web_bundle` / extraction des feuilles de style (tokens).
- `webfetch` pour les pages server-rendered (catalogue, classement, fiche).
- Analyse des palettes CSS (fréquence des hex) et des `font-family`.

Limites : la lecture d'images n'était pas disponible (modèle sans vision),
l'analyse s'est donc appuyée sur le DOM, les CSS et les structures JSON.

## 2. Mangadraft.com (FR — lecture + création + communauté)

**Structure d'accueil** : header (logo, Découvrir, Originals, Neoville,
Communauté, Publier, connexion) → carrousel de bannières → « Originals »
(exclusives, badges, délais) → Tendances du jour (onglets Tendance/Nouveautés)
→ Incontournables → fil de commentaires de la communauté (avatar, auteur,
série, likes) → Découvrir par genres → posts des auteurs → footer riche
(catalogues par format, tags, genres).

**Catalogue `/catalog`** : titre « Que souhaites-tu découvrir ? », tri (J'aime,
Commentaires, Vues, Nom), formats (manga/webtoon/nolovel/lightnovel/artbook),
filtres langue, accès (18+, payant), stats de séries.

**Fiche série** : bannière 1280×450, avatar, titre + format (« webtoon scan »),
créé par (rôle : Scénariste / Dessinateur / Coloriste), drapeau langue, badges
(série, original, payant), genres, statut + MAJ, carte « Booste la visibilité »
(200k lecteurs), stats (j'aime, vues, coms), avertissements PEGI, équipe,
abonnés (avatars), autres projets de l'auteur.

**Lecteur** : `#1 Tome 1 — Chapitre 1`, sens de lecture (droite → gauche),
« Glissez les pages de la gauche vers la droite », avertissements avant entrée,
commentaires par chapitre (`/reader/{slug}/{id}/comments`).

**Tokens** : fond nuit `#13181f`/`#2a3038`, accent orangé `#ea5427`, or
`#fbd24b`, bleu `#039be5` ; police Quicksand ; rayons pill (9999px), cartes
~1rem ; mode sombre par défaut avec bascule.

## 3. Plumics.com (EN — plateforme créateurs)

SPA Vue (chunks CSS nommés par route) : `home`, `discover`, `explore`,
`search`, `project-show`, `project-edit`, `project-admin`, `new-project`,
`project-stats`, `chapter-edit`, `reader-chapter`, `new-artwork`, `profile-index`,
`profile-reviews`, `user-library`, `creator-dashboard`, `creators101`,
`contest`, `post`, `terms`.

Méta : « publish your mangas, comics, webtoons or light novels, monetize and
shine as a Creator. Connect with publishers, writers and fans. »

Palette minimale (#fff / #1e1e1e), Roboto, icônes Material Design Icons.

## 4. WEBTOON France (fr — lecture grand public)

**Home** : séries tendances & populaires (double onglet), classement 1–10 avec
delta (« Haut20 »/« Bas6 »), catégories par genre (Drama, Fantastique,
Comédie, Action, Tranche de vie, Romance, Superhéros, Thriller), ORIGINALS
nouveautés, programme Hebdo (Lun→Dim, abonnés comptés), Canvas (auteurs
indépendants), footer « Téléchargez l'app ».

**Classement `/ranking/trending`** : rang, poster, badge NOUVEAU, tendance,
genre, vues formatées (2,7M).

**Tokens** : vert marque `#00dc64` (et `#03aa5a`/`#4fff8c`), gris multiples
(`#3c3c3c`, `#8c8c8c`…), bleu lien `#3b6cef`, violet `#d216e9` ; fontes
« volte » (UI) et « kanit » (display) ; rayons 4–24px.

## 5. Synthèse produit (Saga Africa)

Fusion assumée des trois modèles :

1. **Lecteur** (WEBTOON + Mangadraft) : catalogue filtrable, classements
   tendance/populaire, fiche série riche, lecteur webtoon vertical + manga RTL,
   avertissements PEGI, commentaires par chapitre.
2. **Créateur** (Plumics + Mangadraft) : publication de séries, studio
   (dashboard) avec stats et activité, ajout de chapitres, profils publics,
   parcours « Devenir créateur ».
3. **Communauté** (Mangadraft) : likes, abonnements, commentaires imbriqués,
   fil de la communauté sur l'accueil, badges Original/Canvas.

**Positionnement** bilingue FR/EN avec ancrage « les sagas africaines et
francophones » : séries originales de démo (dont *Les Astres du Sahel*, Gao).

## 6. Décisions techniques

- **Stack** : Next.js 15 (App Router) + React 19 + TypeScript strict (front),
  Express + SQLite via `node:sqlite` (back). Pas de framework CSS : design
  system maison en CSS variables (tokens issus de l'analyse).
- **Art du lecteur** : planches générées de façon déterministe (PRNG seedé par
  `série#chapitre#page`) côté serveur, rendues en SVG — aucune dépendance
  d'assets externes, reproduisible.
- **i18n** : dictionnaires FR/EN côté client (`src/lib/i18n.tsx`), bascule
  instantanée, persistance localStorage, défaut selon langue navigateur.
- **Auth** : sessions serveur (cookie HttpOnly), scrypt — pas de JWT client.
- **Zéro seed en dur dans le front** : tout vient de l'API.
