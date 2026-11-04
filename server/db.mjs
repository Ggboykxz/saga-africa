// Saga Africa — SQLite data layer (node:sqlite, no native builds)
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = process.env.TANGRAM_DB || path.join(DATA_DIR, "tangram.db");
export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'reader' NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  synopsis_en TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format TEXT NOT NULL DEFAULT 'webtoon',   -- manga | webtoon | nolovel | lightnovel | artbook
  status TEXT NOT NULL DEFAULT 'ongoing',   -- ongoing | hiatus | completed
  access TEXT NOT NULL DEFAULT 'free',      -- free | paying
  origin TEXT NOT NULL DEFAULT 'canvas',    -- canvas | original
  cover TEXT NOT NULL DEFAULT '',
  cover_color TEXT NOT NULL DEFAULT '#ea5427',
  language TEXT NOT NULL DEFAULT 'fr',
  warned INT NOT NULL DEFAULT 0,
  warning_pegi TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS series_genres (
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  PRIMARY KEY (series_id, genre)
);

CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  number REAL NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  pages INT NOT NULL DEFAULT 0,
  is_publish INT NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE (series_id, number)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (series_id, user_id)
);

CREATE TABLE IF NOT EXISTS likes (
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (series_id, user_id)
);

CREATE TABLE IF NOT EXISTS views (
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (series_id, chapter_id, day)
);

CREATE TABLE IF NOT EXISTS tags (
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (series_id, tag)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_slug TEXT NOT NULL,
  text TEXT NOT NULL,
  is_read INT NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
`);

// ---- helpers ----
export function now() {
  return Math.floor(Date.now() / 1000);
}

export function rowCount(sql, ...params) {
  return db.prepare(sql).get(...params);
}

export function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

export function get(sql, ...params) {
  return db.prepare(sql).get(...params);
}

export function run(sql, ...params) {
  try {
    const r = db.prepare(sql).run(...params);
    return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
  } catch (e) {
    if (process.env.TANGRAM_DEBUG_SQL) {
      console.error("[sql]", sql, JSON.stringify(params).slice(0, 300));
    }
    throw e;
  }
}

export const GENRES = [
  "Action", "Aventure", "Comédie", "Drame", "Fantastique", "Horreur",
  "Romance", "Science-fiction", "Sport", "Tranche de vie", "Thriller", "Jeunesse",
];
export const TAGS = ["Shonen", "Seinen", "Shojo", "Magie", "Robot", "Combat", "Voyage", "Furry", "Mystère", "École", "Isekai"];
export const FORMATS = ["manga", "webtoon", "nolovel", "lightnovel", "artbook"];
export const FORMAT_LABEL = {
  manga: "Manga", webtoon: "Webtoon", nolovel: "Nolovel",
  lightnovel: "Light novel", artbook: "Artbook",
};
