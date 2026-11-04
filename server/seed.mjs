// Saga Africa — seed: users, series, chapters, comments, follows, likes, views
import crypto from "node:crypto";
import { db, run, now, GENRES } from "./db.mjs";

function hashPass(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const D = now();

function addUser(username, email, pw, bio, avatar, role = "reader") {
  return run(
    "INSERT INTO users (username,email,pass_hash,bio,avatar,role,created_at) VALUES (?,?,?,?,?,?,?)",
    username, email, hashPass(pw), bio, avatar, role, D - Math.floor(Math.random() * 1e8)
  ).id;
}

const creators = [
  ["luna-ink", "luna@tangram.app", "demo", "Créatrice de webtoons à Lyon. Je dessine des mondes où la magie cache la mélancolie.", "#7c3aed"],
  ["aurelie-matsuda", "aurelie@tangram.app", "demo", "Mangaka franco-japonaise. Encre, tradition et démons.", "#ea5427"],
  ["sacha-page", "sacha@tangram.app", "demo", "Auteur de nolovels. J'écris des histoires qui sentent le riz grillé.", "#fbd24b"],
  ["noora-vega", "noora@tangram.app", "demo", "Autrice SF & light novels. Les étoiles ont beaucoup à dire.", "#039be5"],
  ["thibault-lin", "thibault@tangram.app", "demo", "Webtooniste de Tokyo à Bordeaux. Drames urbains poétiques.", "#f97316"],
  ["yumi-k", "yumi@tangram.app", "demo", "Shonen énergique, battle royale et amitié.", "#ef4444"],
  ["iris-ebene", "iris@tangram.app", "demo", "Illustratrice, artbooks, encre et cendres.", "#374151"],
  ["kenji-os", "kenji@tangram.app", "demo", "Thriller psychologique, ombres et révélations.", "#0f766e"],
  ["camille-berard", "camille@tangram.app", "demo", "Romance douce-amère, tranches de vie.", "#db2777"],
  ["paul-encre", "paul@tangram.app", "demo", "Manga jeunesse, robots et amitié.", "#2563eb"],
  ["aissata-diallo", "aissata@tangram.app", "demo", "Cartographe du ciel, autrice de webtoons. Le Sahel est ma première muse.", "#b45309"],
];

const userIds = creators.map(([u, e, p, b, a, r]) => addUser(u, e, p, b, a, r));

// readers
const readers = [];
for (let i = 1; i <= 8; i++) {
  readers.push(addUser(`lecteur${i}`, `lecteur${i}@tangram.app`, "demo", "", ""));
}

const S = (slug, title, title_en, synopsis, synopsis_en, author, format, status, access, origin, cover_color, language, pegi, genres, tags, chapters) => {
  const id = run(
    `INSERT INTO series (slug,title,title_en,synopsis,synopsis_en,author_id,format,status,access,origin,cover_color,language,warned,warning_pegi,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    slug, title, title_en, synopsis, synopsis_en, author, format, status, access, origin, cover_color, language,
    pegi ? 1 : 0, pegi || "", D - Math.floor(Math.random() * 1e8), D - Math.floor(Math.random() * 1e6)
  ).id;
  for (const g of genres) run("INSERT INTO series_genres (series_id,genre) VALUES (?,?)", id, g);
  for (const t of tags) run("INSERT INTO tags (series_id,tag) VALUES (?,?)", id, t);
  let n = 1;
  for (const [num, chTitle, chTitleEn, pages] of chapters) {
    run(
      "INSERT INTO chapters (series_id,number,title,title_en,pages,is_publish,created_at) VALUES (?,?,?,?,?,1,?)",
      id, num, chTitle, chTitleEn, pages, D - Math.floor(Math.random() * 3e7)
    );
    n++;
  }
  return id;
};

// series data: slug, title, title_en, synopsis, synopsis_en, authorIdx, format, status, access, origin, color, lang, pegi, genres, tags, chapters [[num, titleFR, titleEN, pages]]
const series = [
  ["le-rubis-de-minuit", "Le Rubis de Minuit", "The Midnight Ruby",
    "Élise, relieuse hérétique, découvre qu'un livre scellé depuis trois siècles contient le véritable nom d'une étoile déchue. Traquée par l'Inquisition des Lumières, elle doit apprendre à relier la réalité elle-même avant que la nuit ne s'effondre.",
    "Élise, a heretical bookbinder, discovers a tome sealed for three centuries containing the true name of a fallen star. Hunted by the Inquisition of the Enlightenment, she must learn to bind reality itself before the night collapses.",
    0, "webtoon", "ongoing", "free", "original", "#7c3aed", "fr", "12+", ["Fantastique", "Romance", "Aventure"], ["Magie", "Mystère"],
    [[1, "Le livre scellé", "The Sealed Book", 64], [2, "L'Inquisition", "The Inquisition", 58], [3, "L'étoile déchue", "The Fallen Star", 71], [4, "Relieuse", "Bookbinder", 66], [5, "Réalité cousue", "Stitched Reality", 72]]],
  ["ombremonde", "Chroniques d'Ombremonde", "Chronicles of Ombremonde",
    "Dans un royaume où les ombres portent des souvenirs, la jeune archiviste Sora prend la plume d'un défun roi pour écrire la vérité que l'histoire a brûlée. Mais chaque mot qu'elle écrit fait disparaître une ombre de la ville…",
    "In a kingdom where shadows carry memories, young archivist Sora takes up a dead king's quill to write the truth history burned. But every word she writes erases one more shadow from the city…",
    1, "manga", "ongoing", "free", "original", "#ea5427", "fr", "16+", ["Drame", "Horreur", "Fantastique"], ["Seinen", "Voyage", "Mystère"],
    [[1, "La plume du roi", "The King's Quill", 22], [2, "Ombres manquantes", "Missing Shadows", 24], [3, "L'archiviste", "The Archivist", 21], [4, "Encre noire", "Black Ink", 26]]],
  ["sushi-club", "Le Sushi Club", "The Sushi Club",
    "Quatre lycéens ouvrent un club de dégustation de sushi dans une salle de classe condamnée. Entre concours de wasabi et débats philosophiques sur le riz, ils découvrent que la vraie recette, c'est l'amitié (et un peu de saumon).",
    "Four high schoolers open a sushi-tasting club in a condemned classroom. Between wasabi contests and philosophical debates about rice, they discover the real recipe is friendship (and a bit of salmon).",
    2, "nolovel", "ongoing", "free", "canvas", "#fbd24b", "fr", "", ["Comédie", "Tranche de vie", "Jeunesse"], ["École", "Shonen"],
    [[1, "Première dégustation", "First Tasting", 40], [2, "Wasabi maximum", "Maximum Wasabi", 36], [3, "Le concours du riz", "The Rice Contest", 44]]],
  ["fragments-du-ciel", "Les Fragments du Ciel", "Fragments of the Sky",
    "Après la Grande Chute, les humains vivent sur des îles flottantes reliées par des ponts de cristal. Kael, mécanicien, découvre que le ciel n'est pas vide : il est peuplé de ruines qui tombent, et quelqu'un les pousse.",
    "After the Great Fall, humans live on floating islands linked by crystal bridges. Kael, a mechanic, discovers the sky is not empty: it is full of falling ruins — and someone is pushing them.",
    3, "lightnovel", "ongoing", "free", "original", "#039be5", "fr", "12+", ["Science-fiction", "Aventure"], ["Isekai", "Robot"],
    [[1, "La Grande Chute", "The Great Fall", 30], [2, "Ponts de cristal", "Crystal Bridges", 32], [3, "Ruines", "Ruins", 34]]],
  ["tokyo-transit", "Tokyo Transit", "Tokyo Transit",
    "Minako conduit le dernier métro fantôme de Tokyo — une rame qui ne s'arrête que pour les passagers oubliés par la ville. Chaque station est une vie non vécue, et elle doit décider qui descend.",
    "Minako drives Tokyo's last ghost subway — a train that only stops for passengers forgotten by the city. Each station is an unlived life, and she must decide who gets off.",
    4, "webtoon", "ongoing", "free", "canvas", "#f97316", "fr", "16+", ["Drame", "Fantastique"], ["Seinen", "Mystère"],
    [[1, "Plateforme 4", "Platform 4", 48], [2, "Passagers oubliés", "Forgotten Passengers", 52], [3, "Terminus", "Last Stop", 55]]],
  ["sorciere-yeux-or", "La Sorcière aux Yeux d'Or", "The Golden-Eyed Witch",
    "Milo, 14 ans, entre à l'Académie des Arts Combattants avec un seul pouvoir : ses yeux changent de couleur selon l'intention de ses adversaires. Il ne peut pas frapper — mais il peut tout voir venir.",
    "Milo, 14, joins the Academy of Combat Arts with a single power: his eyes change color according to his opponents' intent. He cannot strike — but he can see everything coming.",
    5, "manga", "ongoing", "free", "original", "#ef4444", "fr", "12+", ["Action", "Aventure", "Comédie"], ["Shonen", "Combat", "École"],
    [[1, "L'Académie", "The Academy", 20], [2, "Les yeux changeants", "The Changing Eyes", 22], [3, "Tournoi", "Tournament", 24]]],
  ["encre-cendres", "Encre & Cendres", "Ink & Ashes",
    "Un artbook de l'univers Ombremonde : 48 pages de recherches, croquis et peintures où l'encre rencontre la cendre, accompagnées des notes de Sora.",
    "An artbook from the Ombremonde universe: 48 pages of research, sketches and paintings where ink meets ash, accompanied by Sora's notes.",
    6, "artbook", "completed", "paying", "canvas", "#374151", "fr", "", ["Fantastique", "Drame"], ["Seinen"],
    [[1, "Croquis & peintures", "Sketches & Paintings", 48]]],
  ["echo-etoiles", "L'Écho des Étoiles", "The Echo of the Stars",
    "Une radio pirate diffuse chaque nuit un message codé. Elio, technicien du son, comprend qu'il ne vient pas de la Terre. Il répond. Et l'écho lui répond en retour — avec la voix de son père mort.",
    "A pirate radio station broadcasts a coded message every night. Elio, a sound technician, understands it does not come from Earth. He answers. And the echo answers back — with the voice of his dead father.",
    7, "webtoon", "hiatus", "free", "canvas", "#0f766e", "fr", "16+", ["Thriller", "Science-fiction", "Drame"], ["Mystère", "Seinen"],
    [[1, "Fréquence 92.4", "Frequency 92.4", 42], [2, "L'écho", "The Echo", 47]]],
  ["papillon", "Papillon", "Papillon",
    "Léna, chirurgienne de nuit, recueille un patient qui ne saigne pas. Il s'appelle Adriel et il a des ailes de papillon tatouées qui bougent. Leurs nuits s'entremêlent entre urgence et éternité.",
    "Léna, a night surgeon, takes in a patient who does not bleed. His name is Adriel and he has butterfly-wing tattoos that move. Their nights intertwine between urgency and eternity.",
    8, "webtoon", "ongoing", "free", "canvas", "#db2777", "fr", "18+", ["Romance", "Drame", "Fantastique"], ["Shojo", "Mystère"],
    [[1, "Sans sang", "Bleeding Out", 60], [2, "Ailes", "Wings", 57], [3, "Nuit", "Night", 63], [4, "Éternité", "Eternity", 66]]],
  ["voisin-robot", "Mon Voisin Robot", "My Neighbor Robot",
    "Dans l'immeuble Pommier, le robot de maintenance Z-27 s'ennuie. Quand la petite Zoé lui demande d'être son ami, il apprend que l'amitié a des bugs — et que les bugs sont parfois les plus belles fonctions.",
    "In the Pommier building, maintenance robot Z-27 is bored. When little Zoé asks him to be her friend, he learns friendship has bugs — and that bugs are sometimes the most beautiful features.",
    9, "manga", "ongoing", "free", "canvas", "#2563eb", "fr", "", ["Jeunesse", "Comédie", "Science-fiction"], ["Robot", "Shonen"],
    [[1, "Z-27", "Z-27", 18], [2, "L'amitié a des bugs", "Friendship Has Bugs", 20]]],
  ["astres-du-sahel", "Les Astres du Sahel", "The Stars of the Sahel",
    "À Gao, la cartographe du ciel Awa découvre que les constellations ne sont pas de simples dessins : elles tracent les routes d'un empire englouti sous le sable. Chaque étoile allumée fait remonter une cité.",
    "In Gao, sky cartographer Awa discovers the constellations are not mere drawings: they map the routes of an empire swallowed by sand. Every star she lights raises a city from below.",
    10, "webtoon", "ongoing", "free", "original", "#b45309", "fr", "12+", ["Fantastique", "Aventure", "Drame"], ["Magie", "Voyage", "Mystère"],
    [[1, "Cartographe du ciel", "Sky Cartographer", 54], [2, "L'empire englouti", "The Sunken Empire", 58], [3, "Étoiles allumées", "Lighted Stars", 61]]],
];

if (process.env.TANGRAM_DEBUG_SQL) {
  console.log("debug users:", userIds.length, userIds[0], "count=", db.prepare("SELECT COUNT(*) n FROM users").get().n);
}
const seriesIds = series.map((s) => {
  const arr = [...s];
  arr[5] = userIds[arr[5]]; // creator index -> actual user id
  return S(...arr);
});
// now let me seed comments, likes, follows, views
const commentsPool = [
  "Le découpage de ce chapitre est incroyable, on sent vraiment la tension monter ! 🖤",
  "J'ai lu les trois premiers épisodes d'une traite. Quelle plume, hâte de la suite.",
  "Les planches sont magnifiques, surtout celle de la dernière case. Bravo à l'équipe !",
  "Je ne pensais pas accrocher à ce genre, mais l'univers est super bien construit.",
  "La fin du chapitre m'a scotché. Comment vais-je attendre la suite ? 😭",
  "Petit défaut : quelques dialogues un peu trop explicatifs, mais l'ambiance rattrape tout.",
  "Le twist de la page 14… j'en ai des frissons. Franchement chapeau.",
  "Je recommande à 100%. C'est le genre de série qu'on veut partager.",
  "L'écriture est fluide, le dessin expressif. Un vrai coup de cœur.",
  "Enfin une série avec un sens du rythme maîtrisé. Vivement le prochain épisode.",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let gid = 1;
for (let k = 0; k < seriesIds.length; k++) {
  const sid = seriesIds[k];
  const chs = db.prepare("SELECT id FROM chapters WHERE series_id=?").all(sid);
  const nComments = 3 + Math.floor(Math.random() * 10);
  for (let c = 0; c < nComments; c++) {
    const u = pick(readers);
    const ch = Math.random() < 0.7 ? pick(chs) : null;
    const cid = run(
      "INSERT INTO comments (series_id,chapter_id,user_id,parent_id,body,likes,created_at) VALUES (?,?,?,?,?,?,?)",
      sid, ch ? ch.id : null, u, null, pick(commentsPool), Math.floor(Math.random() * 12), D - Math.floor(Math.random() * 2e7)
    ).id;
    if (Math.random() < 0.35) {
      run(
        "INSERT INTO comments (series_id,chapter_id,user_id,parent_id,body,likes,created_at) VALUES (?,?,?,?,?,?,?)",
        sid, ch ? ch.id : null, pick(readers), cid, "Totalement d'accord !", Math.floor(Math.random() * 6), D - Math.floor(Math.random() * 2e7)
      );
    }
    gid++;
  }
  const nFollows = 20 + Math.floor(Math.random() * 180);
  for (let f = 0; f < nFollows; f++) {
    const u = Math.floor(Math.random() * 8) + 1;
    run("INSERT OR IGNORE INTO follows (series_id,user_id,created_at) VALUES (?,?,?)", sid, u, D - Math.floor(Math.random() * 3e7));
  }
  const nLikes = 10 + Math.floor(Math.random() * 120);
  for (let l = 0; l < nLikes; l++) {
    const u = Math.floor(Math.random() * 8) + 1;
    run("INSERT OR IGNORE INTO likes (series_id,user_id,created_at) VALUES (?,?,?)", sid, u, D - Math.floor(Math.random() * 3e7));
  }
  for (const ch of chs) {
    const base = 10 + Math.floor(Math.random() * 400);
    for (let day = 0; day < 14; day++) {
      const dt = new Date(D * 1000 - day * 86400e3);
      const dayStr = dt.toISOString().slice(0, 10);
      const n = Math.max(1, Math.round(base * (1 - day * 0.06) * (0.6 + Math.random() * 0.8)));
      run("INSERT OR REPLACE INTO views (series_id,chapter_id,day,n) VALUES (?,?,?,?)", sid, ch.id, dayStr, n);
    }
  }
}

// demo accounts for the UI
console.log("Seeded:", seriesIds.length, "series,", db.prepare("SELECT COUNT(*) n FROM chapters").get().n, "chapters");
console.log("Demo creators login: luna-ink / demo (etc — password 'demo' for all seed users)");
