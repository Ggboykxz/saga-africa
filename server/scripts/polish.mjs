// Saga Africa — one-off data polish: remove manual test artifacts, seed demo notifications.
import { db, run, now } from "../db.mjs";

// 1) cleanup test series (created via curl during dev)
const testSeries = db.prepare("SELECT id, slug FROM series WHERE slug LIKE 'test-%' OR slug='test-saga'").all();
for (const s of testSeries) {
  db.prepare("DELETE FROM views WHERE series_id=?").run(s.id);
  db.prepare("DELETE FROM comments WHERE series_id=?").run(s.id);
  db.prepare("DELETE FROM series WHERE id=?").run(s.id);
  console.log("removed test series:", s.slug);
}

// 2) notifications demo (unread for creators)
const note = (username, slug, text, read = 0) => {
  const u = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!u) return;
  run("INSERT INTO notifications (user_id,series_slug,text,is_read,created_at) VALUES (?,?,?,?,?)",
    u.id, slug, text, read, now() - Math.floor(Math.random() * 5 * 86400));
};
note("luna-ink", "le-rubis-de-minuit", "lecteur3 a commenté votre série.");
note("luna-ink", "le-rubis-de-minuit", "lecteur1 a commenté votre série.", 1);
note("aurelie-matsuda", "ombremonde", "lecteur5 a commenté votre série.");
note("noora-vega", "fragments-du-ciel", "lecteur2 a commenté votre série.", 1);
note("aissata-diallo", "astres-du-sahel", "lecteur7 a commenté votre série.");
console.log("demo notifications seeded");
