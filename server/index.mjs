// Saga Africa — API server (Express + SQLite)
import express from "express";
import crypto from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, run, all, get, now, FORMATS, FORMAT_LABEL } from "./db.mjs";
import { chapterPages } from "./panels.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8788);
const app = express();

// CORS (local dev: frontend on :3000, API on :8788)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "8mb" }));

// ---- minimal middleware ----
function cookies(req) {
  const out = {};
  const h = req.headers.cookie || "";
  for (const part of h.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function currentUser(req) {
  const token = cookies(req).saga_session;
  if (!token) return null;
  return get(
    `SELECT u.id, u.username, u.email, u.bio, u.avatar, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`, token
  );
}

const requireAuth = (req, res, next) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "unauthorized" });
  req.user = u;
  next();
};

function setSession(res, userId) {
  const token = crypto.randomBytes(24).toString("hex");
  run("INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)", token, userId, now());
  res.setHeader("Set-Cookie", `saga_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return token;
}

// ---- helpers ----
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "serie";
}

function seriesStats(sid) {
  const views = get("SELECT COALESCE(SUM(n),0) n FROM views WHERE series_id=?", sid).n;
  const views7 = get(
    "SELECT COALESCE(SUM(n),0) n FROM views WHERE series_id=? AND day >= date('now','-7 days')", sid
  ).n;
  const likes = get("SELECT COUNT(*) n FROM likes WHERE series_id=?", sid).n;
  const follows = get("SELECT COUNT(*) n FROM follows WHERE series_id=?", sid).n;
  const comments = get("SELECT COUNT(*) n FROM comments WHERE series_id=?", sid).n;
  const chapters = get("SELECT COUNT(*) n FROM chapters WHERE series_id=?", sid).n;
  return { views, views7, likes, follows, comments, chapters };
}

const SERIES_SELECT = `
  SELECT s.*,
    (SELECT COUNT(*) FROM likes l WHERE l.series_id = s.id) AS likes,
    (SELECT COUNT(*) FROM follows f WHERE f.series_id = s.id) AS follows,
    (SELECT COUNT(*) FROM comments c WHERE c.series_id = s.id) AS comments,
    (SELECT COUNT(*) FROM chapters ch WHERE ch.series_id = s.id) AS chapters,
    (SELECT COALESCE(SUM(n),0) FROM views v WHERE v.series_id = s.id) AS views,
    (SELECT COALESCE(SUM(n),0) FROM views v WHERE v.series_id = s.id AND v.day >= date('now','-7 days')) AS views7,
    u.username AS author_username, u.avatar AS author_avatar
  FROM series s JOIN users u ON u.id = s.author_id`;

function seriesRow(row, user) {
  if (!row) return null;
  const g = all("SELECT genre FROM series_genres WHERE series_id=? ORDER BY genre", row.id).map((r) => r.genre);
  const tags = all("SELECT tag FROM tags WHERE series_id=? ORDER BY tag", row.id).map((r) => r.tag);
  return {
    id: row.id, slug: row.slug, title: row.title, titleEn: row.title_en,
    synopsis: row.synopsis, synopsisEn: row.synopsis_en,
    format: row.format, formatLabel: FORMAT_LABEL[row.format] || row.format,
    status: row.status, access: row.access, origin: row.origin,
    cover: row.cover, coverColor: row.cover_color, language: row.language,
    warned: !!row.warned, warningPegi: row.warning_pegi,
    createdAt: row.created_at, updatedAt: row.updated_at,
    genres: g, tags,
    stats: { likes: row.likes, follows: row.follows, comments: row.comments, chapters: row.chapters, views: row.views, views7: row.views7 },
    author: { username: row.author_username, avatar: row.author_avatar },
    userState: user ? {
      liked: !!get("SELECT 1 x FROM likes WHERE series_id=? AND user_id=?", row.id, user.id),
      followed: !!get("SELECT 1 x FROM follows WHERE series_id=? AND user_id=?", row.id, user.id),
      isOwner: row.author_id === user.id,
    } : { liked: false, followed: false, isOwner: false },
  };
}

// ---- auth ----
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: "missing_fields" });
  if (username.length < 3 || username.length > 24 || !/^[a-z0-9_-]+$/i.test(username))
    return res.status(400).json({ error: "bad_username" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "bad_email" });
  if (password.length < 6) return res.status(400).json({ error: "short_password" });
  if (get("SELECT 1 x FROM users WHERE email=?", email)) return res.status(409).json({ error: "email_taken" });
  if (get("SELECT 1 x FROM users WHERE username=?", username)) return res.status(409).json({ error: "username_taken" });
  const salt = crypto.randomBytes(16).toString("hex");
  const passHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
  const id = run("INSERT INTO users (username,email,pass_hash,created_at) VALUES (?,?,?,?)", username, email, passHash, now()).id;
  setSession(res, id);
  res.json({ user: { id, username, email, avatar: "", bio: "" } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = get("SELECT * FROM users WHERE email=?", email);
  if (!u) return res.status(401).json({ error: "bad_credentials" });
  const [salt, hash] = u.pass_hash.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  if (hash !== test) return res.status(401).json({ error: "bad_credentials" });
  setSession(res, u.id);
  res.json({ user: { id: u.id, username: u.username, email: u.email, avatar: u.avatar, bio: u.bio } });
});

app.post("/api/auth/logout", (req, res) => {
  const token = cookies(req).saga_session;
  if (token) run("DELETE FROM sessions WHERE token=?", token);
  res.setHeader("Set-Cookie", "saga_session=; Path=/; HttpOnly; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const u = currentUser(req);
  res.json({ user: u ? { id: u.id, username: u.username, email: u.email, avatar: u.avatar, bio: u.bio, role: u.role } : null });
});

// ---- stats & search ----
app.get("/api/stats", (req, res) => {
  const byFormat = {};
  for (const f of FORMATS) {
    byFormat[f] = get("SELECT COUNT(*) n FROM series WHERE format=?", f).n;
  }
  res.json({
    series: db.prepare("SELECT COUNT(*) n FROM series").get().n,
    chapters: db.prepare("SELECT COUNT(*) n FROM chapters").get().n,
    comments: db.prepare("SELECT COUNT(*) n FROM comments").get().n,
    users: db.prepare("SELECT COUNT(*) n FROM users").get().n,
    byFormat,
  });
});

app.get("/api/series", (req, res) => {
  const { format, genre, tag, sort = "new", q, access, origin, lang } = req.query;
  const where = [];
  const params = [];
  if (format && FORMATS.includes(format)) { where.push("s.format = ?"); params.push(format); }
  if (genre) { where.push("EXISTS (SELECT 1 FROM series_genres g WHERE g.series_id=s.id AND g.genre=?)"); params.push(genre); }
  if (tag) { where.push("EXISTS (SELECT 1 FROM tags t WHERE t.series_id=s.id AND t.tag=?)"); params.push(tag); }
  if (access) { where.push("s.access = ?"); params.push(access); }
  if (origin) { where.push("s.origin = ?"); params.push(origin); }
  if (lang) { where.push("s.language = ?"); params.push(lang); }
  if (q) { where.push("(s.title LIKE ? OR s.title_en LIKE ? OR s.synopsis LIKE ? OR s.synopsis_en LIKE ?)"); const like = `%${q}%`; params.push(like, like, like, like); }
  const order = {
    likes: "likes DESC", comments: "comments DESC", views: "views DESC", new: "s.updated_at DESC", title: "s.title ASC",
  }[sort] || "s.updated_at DESC";
  const rows = all(`${SERIES_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} LIMIT 120`, ...params);
  res.json({ series: rows.map((r) => seriesRow(r, currentUser(req))) });
});

app.get("/api/leaderboard", (req, res) => {
  const tab = req.query.tab || "trending";
  const rows = all(`${SERIES_SELECT} ORDER BY ${tab === "trending" ? "views7 DESC" : tab === "popular" ? "views DESC" : tab === "new" ? "s.created_at DESC" : "views DESC"} LIMIT 24`);
  res.json({ series: rows.map((r) => seriesRow(r, currentUser(req))) });
});

app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ series: [], users: [] });
  const like = `%${q}%`;
  const series = all(`${SERIES_SELECT} WHERE s.title LIKE ? OR s.title_en LIKE ? OR s.synopsis LIKE ? OR s.synopsis_en LIKE ? LIMIT 12`, like, like, like, like)
    .map((r) => seriesRow(r, currentUser(req)));
  const users = all("SELECT id,username,avatar,bio FROM users WHERE username LIKE ? LIMIT 8", like);
  res.json({ series, users });
});

app.get("/api/comments/latest", (req, res) => {
  const rows = all(
    `SELECT cm.id, cm.body, cm.likes, cm.created_at, cm.series_id,
            u.username, u.avatar, s.title, s.slug, s.cover_color, s.format
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     JOIN series s ON s.id = cm.series_id
     WHERE cm.parent_id IS NULL
     ORDER BY cm.created_at DESC LIMIT 8`
  );
  res.json({ comments: rows });
});

// ---- series ----
app.get("/api/series/:slug", (req, res) => {
  const row = get(`${SERIES_SELECT} WHERE s.slug=?`, req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json({ series: seriesRow(row, currentUser(req)) });
});

app.post("/api/series", requireAuth, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.titleEn || !b.synopsis || !b.synopsisEn) return res.status(400).json({ error: "missing_fields" });
  if (!FORMATS.includes(b.format)) return res.status(400).json({ error: "bad_format" });
  let slug = slugify(b.slug || b.title);
  if (get("SELECT 1 x FROM series WHERE slug=?", slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const id = run(
    `INSERT INTO series (slug,title,title_en,synopsis,synopsis_en,author_id,format,status,access,origin,cover_color,language,warned,warning_pegi,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    slug, b.title, b.titleEn, b.synopsis, b.synopsisEn, req.user.id,
    b.format, b.status || "ongoing", b.access || "free", b.origin || "canvas",
    b.coverColor || "#ea5427", b.language || "fr", b.warned ? 1 : 0, b.warningPegi || "", now(), now()
  ).id;
  for (const g of b.genres || []) run("INSERT INTO series_genres (series_id,genre) VALUES (?,?)", id, g);
  for (const t of b.tags || []) run("INSERT INTO tags (series_id,tag) VALUES (?,?)", id, t);
  const row = get(`${SERIES_SELECT} WHERE s.id=?`, id);
  res.status(201).json({ series: seriesRow(row, req.user) });
});

app.patch("/api/series/:slug", requireAuth, (req, res) => {
  const row = get("SELECT * FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.author_id !== req.user.id) return res.status(403).json({ error: "forbidden" });
  const b = req.body || {};
  const sets = [];
  const params = [];
  for (const k of ["title", "title_en", "synopsis", "synopsis_en", "status", "access", "origin", "cover_color", "language", "warning_pegi"]) {
    if (b[k] !== undefined) { sets.push(`s.${k} = ?`); params.push(b[k]); }
  }
  if (b.warned !== undefined) { sets.push("s.warned = ?"); params.push(b.warned ? 1 : 0); }
  sets.push("s.updated_at = ?"); params.push(now());
  params.push(row.id);
  db.prepare(`UPDATE series s SET ${sets.join(", ")} WHERE s.id = ?`).run(...params);
  if (b.genres) {
    db.prepare("DELETE FROM series_genres WHERE series_id=?").run(row.id);
    for (const g of b.genres) run("INSERT INTO series_genres (series_id,genre) VALUES (?,?)", row.id, g);
  }
  if (b.tags) {
    db.prepare("DELETE FROM tags WHERE series_id=?").run(row.id);
    for (const t of b.tags) run("INSERT INTO tags (series_id,tag) VALUES (?,?)", row.id, t);
  }
  const r2 = get(`${SERIES_SELECT} WHERE s.id=?`, row.id);
  res.json({ series: seriesRow(r2, req.user) });
});

app.post("/api/series/:slug/follow", requireAuth, (req, res) => {
  const row = get("SELECT id FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  const exists = get("SELECT 1 x FROM follows WHERE series_id=? AND user_id=?", row.id, req.user.id);
  if (exists) run("DELETE FROM follows WHERE series_id=? AND user_id=?", row.id, req.user.id);
  else run("INSERT INTO follows (series_id,user_id,created_at) VALUES (?,?,?)", row.id, req.user.id, now());
  res.json({ followed: !exists });
});

app.post("/api/series/:slug/like", requireAuth, (req, res) => {
  const row = get("SELECT id FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  const exists = get("SELECT 1 x FROM likes WHERE series_id=? AND user_id=?", row.id, req.user.id);
  if (exists) run("DELETE FROM likes WHERE series_id=? AND user_id=?", row.id, req.user.id);
  else run("INSERT INTO likes (series_id,user_id,created_at) VALUES (?,?,?)", row.id, req.user.id, now());
  res.json({ liked: !exists });
});

// ---- chapters ----
app.get("/api/series/:slug/chapters", (req, res) => {
  const row = get("SELECT id FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  const chapters = all(
    `SELECT c.*, (SELECT COALESCE(SUM(n),0) FROM views v WHERE v.chapter_id=c.id) AS views,
            (SELECT COUNT(*) FROM comments cm WHERE cm.chapter_id=c.id) AS comments
     FROM chapters c WHERE c.series_id=? AND c.is_publish=1 ORDER BY c.number`, row.id
  );
  res.json({ chapters });
});

app.post("/api/series/:slug/chapters", requireAuth, (req, res) => {
  const row = get("SELECT * FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.author_id !== req.user.id) return res.status(403).json({ error: "forbidden" });
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ error: "missing_fields" });
  const num = b.number ?? get("SELECT COALESCE(MAX(number),0)+1 AS n FROM chapters WHERE series_id=?", row.id).n;
  const pages = Math.max(4, Math.min(200, Number(b.pages) || 24));
  const id = run(
    "INSERT INTO chapters (series_id,number,title,title_en,pages,is_publish,created_at) VALUES (?,?,?,?,?,1,?)",
    row.id, num, b.title, b.titleEn || b.title, pages, now()
  ).id;
  run("UPDATE series SET updated_at=? WHERE id=?", now(), row.id);
  res.status(201).json({ chapter: { id, number: num, title: b.title, pages } });
});

// ---- reader ----
app.get("/api/reader/:slug/:number", (req, res) => {
  const num = Number(req.params.number);
  const row = get(
    `SELECT s.*, c.id AS chapter_id, c.title, c.title_en, c.pages, c.number,
            u.username AS author_username, u.avatar AS author_avatar
     FROM series s JOIN chapters c ON c.series_id = s.id
     JOIN users u ON u.id = s.author_id
     WHERE s.slug=? AND c.number=? AND c.is_publish=1`, req.params.slug, num
  );
  if (!row) return res.status(404).json({ error: "not_found" });
  run("INSERT INTO views (series_id,chapter_id,day,n) VALUES (?,?,?,1) ON CONFLICT(series_id,chapter_id,day) DO UPDATE SET n = n + 1",
    row.id, row.chapter_id, new Date().toISOString().slice(0, 10));
  const { key, pages } = chapterPages(row.slug, row.number, row.pages);
  const nextC = get("SELECT number FROM chapters WHERE series_id=? AND number>? AND is_publish=1 ORDER BY number LIMIT 1", row.id, num);
  const prevC = get("SELECT number FROM chapters WHERE series_id=? AND number<? AND is_publish=1 ORDER BY number DESC LIMIT 1", row.id, num);
  res.json({
    series: { slug: row.slug, title: row.title, titleEn: row.title_en, format: row.format, coverColor: row.cover_color, cover: row.cover, author: { username: row.author_username, avatar: row.author_avatar } },
    chapter: { id: row.chapter_id, number: row.number, title: row.title, titleEn: row.title_en, pages: row.pages, key },
    pages,
    nav: { next: nextC ? nextC.number : null, prev: prevC ? prevC.number : null },
  });
});

// ---- comments ----
app.get("/api/series/:slug/comments", (req, res) => {
  const row = get("SELECT id FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  const rows = all(
    `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON u.id=c.user_id
     WHERE c.series_id=? AND c.parent_id IS NULL ORDER BY c.likes DESC, c.created_at DESC LIMIT 80`, row.id
  );
  const list = rows.map((c) => {
    const replies = all(
      `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON u.id=c.user_id
       WHERE c.parent_id=? ORDER BY c.created_at LIMIT 12`, c.id
    );
    return { ...c, replies };
  });
  res.json({ comments: list });
});

app.post("/api/series/:slug/comments", requireAuth, (req, res) => {
  const row = get("SELECT id FROM series WHERE slug=?", req.params.slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  const b = req.body || {};
  const body = (b.body || "").trim().slice(0, 2000);
  if (!body) return res.status(400).json({ error: "empty" });
  const id = run(
    "INSERT INTO comments (series_id,chapter_id,user_id,parent_id,body,created_at) VALUES (?,?,?,?,?,?)",
    row.id, b.chapterId || null, req.user.id, b.parentId || null, body, now()
  ).id;
  const c = get(`SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`, id);
  res.status(201).json({ comment: c });
});

app.post("/api/comments/:id/like", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const exists = get("SELECT 1 x FROM comment_likes WHERE comment_id=? AND user_id=?", id, req.user.id);
  if (exists) {
    run("DELETE FROM comment_likes WHERE comment_id=? AND user_id=?", id, req.user.id);
    run("UPDATE comments SET likes = MAX(0, likes-1) WHERE id=?", id);
  } else {
    run("INSERT INTO comment_likes (comment_id,user_id) VALUES (?,?)", id, req.user.id);
    run("UPDATE comments SET likes = likes+1 WHERE id=?", id);
  }
  res.json({ liked: !exists });
});

// ---- profiles / dashboard ----
app.get("/api/u/:username", (req, res) => {
  const u = get("SELECT id,username,avatar,bio,role,created_at FROM users WHERE username=?", req.params.username);
  if (!u) return res.status(404).json({ error: "not_found" });
  const works = all(`${SERIES_SELECT} WHERE s.author_id=? ORDER BY s.updated_at DESC`, u.id).map((r) => seriesRow(r, currentUser(req)));
  const totalViews = works.reduce((a, s) => a + s.stats.views, 0);
  const totalLikes = works.reduce((a, s) => a + s.stats.likes, 0);
  res.json({ user: u, works, totalViews, totalLikes });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const works = all(`${SERIES_SELECT} WHERE s.author_id=? ORDER BY s.updated_at DESC`, req.user.id).map((r) => seriesRow(r, req.user));
  const recentActivity = all(
    `SELECT 'chapter' AS kind, c.title, s.slug, s.title AS s_title, c.created_at AS at
     FROM chapters c JOIN series s ON s.id=c.series_id WHERE s.author_id=? ORDER BY c.created_at DESC LIMIT 6`,
    req.user.id
  ).concat(
    all(
      `SELECT 'comment' AS kind, cm.body AS title, s.slug, s.title AS s_title, cm.created_at AS at
       FROM comments cm JOIN series s ON s.id=cm.series_id
       WHERE s.author_id=? AND cm.user_id != ? ORDER BY cm.created_at DESC LIMIT 6`, req.user.id, req.user.id
    )
  ).sort((a, b) => b.at - a.at).slice(0, 10);
  res.json({ works, recentActivity });
});

// ---- upload (avatars / covers, base64 -> file) ----
const UPLOAD_DIR = path.join(__dirname, "data", "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });
app.post("/api/upload", requireAuth, (req, res) => {
  const { dataUrl } = req.body || {};
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return res.status(400).json({ error: "bad_image" });
  const m = dataUrl.match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: "bad_image" });
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const name = `${req.user.id}-${Date.now()}.${ext}`;
  const file = path.join(UPLOAD_DIR, name);
  writeFileSync(file, Buffer.from(m[2], "base64"));
  res.json({ url: `/uploads/${name}` });
});

// static uploads
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: "not_found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

app.listen(PORT, () => {
  console.log(`Saga Africa API on http://localhost:${PORT}/api`);
});
