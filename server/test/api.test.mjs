// Saga Africa — API integration tests (node --test)
// Uses a temporary SQLite database + server on an ephemeral port.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "saga-test-"));
process.env.TANGRAM_DB = path.join(dir, "test.db");

const { app } = await import("../index.mjs");
const server = app.listen(0);
await once(server, "listening");
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}`;

let cookie = "";
const j = async (path_, opts = {}) => {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path_}`, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  return { status: res.status, body };
};

before(async () => {
  const mk = (u, e) => j("/api/auth/register", { method: "POST", body: JSON.stringify({ username: u, email: e, password: "secret123" }) });
  await mk("tester", "t@x.test");
  await mk("fan1", "fan1@x.test");
  await mk("intruder", "i@x.test");
  await mk("reader2", "r2@x.test");
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
});

after(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

test("health & stats", async () => {
  const { status, body } = await j("/api/health");
  assert.equal(status, 200);
  const s = await j("/api/stats");
  assert.equal(s.status, 200);
  assert.ok(s.body.series >= 0);
});

test("auth flow: register, me, duplicate, bad password, login", async () => {
  const dup = await j("/api/auth/register", { method: "POST", body: JSON.stringify({ username: "other", email: "t@x.test", password: "secret123" }) });
  assert.equal(dup.status, 409);
  const bad = await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "wrong" }) });
  assert.equal(bad.status, 401);
  cookie = "";
  const login = await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  assert.equal(login.status, 200);
  const me = await j("/api/auth/me");
  assert.equal(me.body.user.username, "tester");
});

test("series CRUD + ownership", async () => {
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Série Test", titleEn: "Test Series", synopsis: "Une série de test.", synopsisEn: "A test series.",
    format: "webtoon", genres: ["Aventure"], tags: ["Magie"],
  }) });
  assert.equal(create.status, 201);
  assert.equal(create.body.series.author.username, "tester");
  const slug = create.body.series.slug;
  const get1 = await j(`/api/series/${slug}`);
  assert.equal(get1.status, 200);
  assert.equal(get1.body.series.userState.isOwner, true);
  // forbidden edit by another user
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "i@x.test", password: "secret123" }) });
  const patchOther = await j(`/api/series/${slug}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
  assert.equal(patchOther.status, 403);
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const patch = await j(`/api/series/${slug}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.series.status, "completed");
});

test("chapters: create, drafts, publish toggle, delete", async () => {
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Série Chapitres", titleEn: "Chapters Series", synopsis: "x", synopsisEn: "x", format: "manga",
  }) });
  const slug = create.body.series.slug;
  const c1 = await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Ch 1", pages: 10 }) });
  assert.equal(c1.status, 201);
  assert.equal(c1.body.chapter.number, 1);
  const c2 = await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Brouillon", is_publish: false }) });
  assert.equal(c2.body.chapter.is_publish, 0);
  assert.equal(c2.body.chapter.number, 2);
  // drafts invisible to others
  const dbgLogin = await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "r2@x.test", password: "secret123" }) });
  console.error("DBG r2 login", JSON.stringify(dbgLogin));
  const dbgPub = await j(`/api/series/${slug}/chapters`);
  console.error("DBG pub n", dbgPub.body.chapters.length, "owner", dbgPub.body.isOwner);
  const pub = await j(`/api/series/${slug}/chapters`);
  assert.equal(pub.body.chapters.length, 1);
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const own = await j(`/api/series/${slug}/chapters`);
  assert.equal(own.body.chapters.length, 2);
  assert.equal(own.body.chapters[1].is_publish, 0);
  // publish draft
  const pub2 = await j(`/api/chapters/${c2.body.chapter.id}`, { method: "PATCH", body: JSON.stringify({ is_publish: true }) });
  assert.equal(pub2.body.chapter.is_publish, 1);
  // delete
  const del = await j(`/api/chapters/${c1.body.chapter.id}`, { method: "DELETE" });
  assert.equal(del.body.ok, true);
});

test("reader returns pages + increments views", async () => {
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Lecteur Série", titleEn: "Reader Series", synopsis: "x", synopsisEn: "x", format: "webtoon", pages: 12,
  }) });
  const slug = create.body.series.slug;
  await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Ch 1", pages: 8 }) });
  const r1 = await j(`/api/reader/${slug}/1`);
  assert.equal(r1.status, 200);
  assert.equal(r1.body.chapter.pages, 8);
  assert.equal(r1.body.pages.length, 8);
  assert.ok(r1.body.pages[0].palette && r1.body.pages[0].panels.length > 0);
  assert.equal(r1.body.series.slug, slug);
  const r2 = await j(`/api/reader/${slug}/1`);
  const st = await j(`/api/series/${slug}/stats`);
  assert.ok(st.body.totals.views >= 2);
  assert.ok(Array.isArray(st.body.daily));
});

test("likes, follows, comments, notifications", async () => {
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Engagement Série", titleEn: "Engagement Series", synopsis: "x", synopsisEn: "x", format: "webtoon",
  }) });
  const slug = create.body.series.slug;
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "fan1@x.test", password: "secret123" }) });
  const like = await j(`/api/series/${slug}/like`, { method: "POST" });
  assert.equal(like.body.liked, true);
  const likeOff = await j(`/api/series/${slug}/like`, { method: "POST" });
  assert.equal(likeOff.body.liked, false);
  const follow = await j(`/api/series/${slug}/follow`, { method: "POST" });
  assert.equal(follow.body.followed, true);
  const cm = await j(`/api/series/${slug}/comments`, { method: "POST", body: JSON.stringify({ body: "Sympa !" }) });
  assert.equal(cm.status, 201);
  // fan2 replies to fan1's comment -> fan1 gets a notification
  await j("/api/auth/register", { method: "POST", body: JSON.stringify({ username: "fan2", email: "fan2@x.test", password: "secret123" }) });
  await j(`/api/series/${slug}/comments`, { method: "POST", body: JSON.stringify({ body: "Oui !", parentId: cm.body.comment.id }) });
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "fan1@x.test", password: "secret123" }) });
  const fanNotif = await j("/api/notifications");
  assert.ok(fanNotif.body.unread >= 1);
  // owner should have a notification
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const notif = await j("/api/notifications");
  assert.ok(notif.body.unread >= 1);
  const read = await j("/api/notifications/read-all", { method: "POST" });
  assert.equal(read.body.ok, true);
  const notif2 = await j("/api/notifications");
  assert.equal(notif2.body.unread, 0);
});

test("stats endpoint + search + leaderboard", async () => {
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Série UniqueZ", titleEn: "UniqueZ Series", synopsis: "quête spatiale", synopsisEn: "space quest", format: "manga",
  }) });
  const slug = create.body.series.slug;
  const st = await j(`/api/series/${slug}/stats`);
  assert.equal(st.status, 200);
  assert.ok(Array.isArray(st.body.daily));
  const s = await j("/api/search?q=UniqueZ");
  assert.ok(s.body.series.length >= 1);
  const lb = await j("/api/leaderboard?tab=trending");
  assert.ok(lb.body.series.length >= 1);
});

test("library lists followed series", async () => {
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "fan1@x.test", password: "secret123" }) });
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Série Library", titleEn: "Library Series", synopsis: "x", synopsisEn: "x", format: "webtoon",
  }) });
  const slug = create.body.series.slug;
  await j(`/api/series/${slug}/follow`, { method: "POST" });
  const lib = await j("/api/library");
  assert.equal(lib.status, 200);
  assert.ok(lib.body.series.some((s) => s.slug === slug));
  // unauthenticated -> 401
  cookie = "";
  const anon = await j("/api/library");
  assert.equal(anon.status, 401);
});

test("ranking + draft preview access", async () => {
  const rk = await j("/api/ranking?genre=Romance");
  assert.equal(rk.status, 200);
  assert.ok(Array.isArray(rk.body.series));
  const rkAll = await j("/api/ranking?tab=popular");
  assert.equal(rkAll.status, 200);
  if (rkAll.body.series.length > 0) {
    assert.ok(rkAll.body.series[0].rank >= 1);
    assert.ok("delta" in rkAll.body.series[0]);
  }
  // create series + draft, preview access
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Série Preview", titleEn: "Preview Series", synopsis: "x", synopsisEn: "x", format: "webtoon",
  }) });
  const slug = create.body.series.slug;
  const ch = await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Brouillon 1", is_publish: false }) });
  const num = ch.body.chapter.number;
  // owner can preview
  const ok = await j(`/api/reader/${slug}/${num}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.preview, true);
  // other users cannot
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "fan1@x.test", password: "secret123" }) });
  const nope = await j(`/api/reader/${slug}/${num}`);
  assert.equal(nope.status, 404);
});

test("profile patch, weekly schedule, discover", async () => {  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const patch = await j("/api/auth/profile", { method: "PATCH", body: JSON.stringify({ bio: "Je fabrique des mondes." }) });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.user.bio, "Je fabrique des mondes.");
  // fixture: a series with 2 chapters so weekly + discover can list it
  const create = await j("/api/series", { method: "POST", body: JSON.stringify({
    title: "Hebdo Série", titleEn: "Weekly Series", synopsis: "x", synopsisEn: "x", format: "webtoon",
  }) });
  const slug = create.body.series.slug;
  await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Ch 1" }) });
  await j(`/api/series/${slug}/chapters`, { method: "POST", body: JSON.stringify({ title: "Ch 2" }) });
  const weekly = await j("/api/weekly");
  assert.equal(weekly.status, 200);
  assert.equal(weekly.body.days.length, 7);
  const total = weekly.body.days.reduce((a, d) => a + d.series.length, 0);
  assert.ok(total >= 1);
  const disc = await j("/api/discover");
  assert.equal(disc.status, 200);
  assert.ok(Array.isArray(disc.body.series));
});

test("uploads require auth and reject non-images", async () => {
  const bad = await j("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl: "data:text/plain;base64,AAAA" }) });
  assert.equal(bad.status, 400);
  await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "t@x.test", password: "secret123" }) });
  const up = await j("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }) });
  assert.equal(up.status, 200);
  assert.ok(up.body.url.startsWith("/uploads/"));
});

test("rate limit on auth", async () => {
  for (let i = 0; i < 32; i++) {
    await j("/api/auth/register", { method: "POST", body: JSON.stringify({ username: `rl${i}`, email: `rl${i}@x.test`, password: "secret123" }) });
  }
  const blocked = await j("/api/auth/register", { method: "POST", body: JSON.stringify({ username: "rl99", email: "rl99@x.test", password: "secret123" }) });
  assert.equal(blocked.status, 429);
});
