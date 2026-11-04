# Saga Africa

Une plateforme de **lecture et de création** de mangas, webtoons, nolovels,
light novels et artbooks — refaite de zéro, en s'inspirant de
✔mangadraft.com**, **plumics.com** et **webtoons.com/fr** (analyse REA dans
[`ANALYSIS.md`](./ANALYSIS.md)).

> ⚠️ **Non affiliée.** Saga Africa est une démonstration fan/éducative. Les
> idées de produit et l'esthétique s'inspirent de plateformes publiques ; tous
> les titres, personnages, auteurs et textes sont fictifs et originaux.

## Ce qu'il y a dedans

**Frontend — Next.js 15 (App Router) + React 19 + TypeScript strict, bilingue FR/EN** (bascule instantanée).

| Route | Page |
| --- | --- |
| `/` | Accueil : hero, statistiques, tendances, Originals, genres, nouveautés, fil communauté |
| `/catalog` | Catalogue filtrable (format, genre, origine, tri, recherche) + **Classements** (tendance/populaire × genre, delta de progression) |
| `/series/[slug]` | Fiche série : bannière, synopsis, équipe, stats, chapitres, abonnement, j'aime, commentaires, plafond PEGI |
| `/reader/[slug]/[chapter]` | **Lecteur double mode** : webtoon vertical (scroll + progrès) / manga droite-à-gauche (clavier, pages) — **aperçu des brouillons par l'auteur** |
| `/publish` | Assistant de création de série (titre FR/EN, synopsis, format, genres, tags, couleur d'univers, PEGI, **upload de couverture**) |
| `/dashboard` | Studio créateur : stats agrégées + **sparklines 14 j**, **gestion de chapitres (brouillons, publication, suppression)**, **édition de série + couverture**, activité récente |
| `/u/[username]` | Profil public d'auteur + ses séries |
| `/creators` | Page « Devenir créateur » (lecture / publication / monétisation) |
| `/sign-in` · `/sign-up` | Auth (sessions) |
| `/terms` · `/privacy` | Légal |
| — (navbar) | **Notifications** en temps réel (cloche, compteur non-lu) |
| — (lecteur) | **Progression sauvegardée** (reprise), **zoom** webtoon, barre de navigation mobile flottante |
| — (accueil) | **À découvrir** (séries sous-exposées) + **Programme Hebdo** (Lun→Dim, data-driven) |

**Backend — Express + SQLite (`node:sqlite`, aucune compilation native), port 8788.**

- Auth : inscription/connexion, mots de passe scrypt, sessions, cookie HttpOnly, **rate-limit isolé par famille de routes**
- Séries : CRUD, genres/tags, formats (manga, webtoon, nolovel, lightnovel, artbook), accès gratuit/payant, origin/canvas, **couverture uploadée**
- Chapitres : numérotation auto, **brouillons/dépublikation/suppression**, génération déterministe des planches (SVG)
- Engagement : j'aime, abonnements, commentaires + réponses + likes, **notifications au créateur**
- Statistiques : vues (7 jours / total / **14 jours par jour**), classements (tendance, populaire, nouveau)
- Recherche série + auteurs, leaderboards, flux des derniers commentaires
- Upload (avatar/cover) en base64 → fichiers locaux
- CORS local

**Tests** : `npm test` → 9 tests d'intégration API (auth, CRUD, brouillons, lecteur, engagement, notifications, stats, upload, rate-limit) sur base temporaire.

## Lancer

```sh
npm install
npm run seed      # crée server/data/tangram.db + données de démo
npm run server    # API sur http://localhost:8788/api
npm run dev       # web sur http://localhost:3000
```

Comptes démo (mot de passe `demo`) :

- Créateur : `luna-ink@tangram.app` (séries, dashboard, chapitres)
- Lecteur : `lecteur1@tangram.app` (likes, abonnements, commentaires)

## Design

Système de design maison, inspiré des 3 références :

- Nuit encre `#13181f` + orangé `#ea5427` (Mangadraft), vert « électron » `#00dc64` (WEBTOON), palettes d'univers par série
- Typographie : Quicksand (display) + système (corps)
- Cartes arrondies, pilules, badges Original/Canvas, warnings PEGI

Les « planches » du lecteur sont générées côté serveur (JSON déterministe) puis
rendues en SVG côté client — aucune image externe n'est utilisée.

## Notes

- Les pages `/series`, `/reader`, `/dashboard` sont 100 % pilotées par l'API :
  si le backend ne tourne pas, elles affichent un état vide.
- Le lecteur manga affiche un rappel « sens japonais » au premier lancement.
- Valable pour du local/dev : la base vit dans `server/data/` (WAL).
