"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api, type Series, type Chapter } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { uploadImage } from "@/lib/upload";
import { nFmt, timeAgo, coverStyle } from "@/lib/format";
import { getProgress } from "@/lib/progress";
import { Eye, Heart, Bell, Plus, Pencil, Trash, Sparkles, Upload, Play } from "@/components/icons";

type Activity = { kind: string; title: string; slug: string; s_title: string; at: number };
type Stats = { daily: { day: string; views: number }[]; totals: Record<string, number> };

function Sparkline({ daily }: { daily: { day: string; views: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  const W = 260, H = 56;
  const pts = daily.map((d, i) => {
    const x = (i / Math.max(1, daily.length - 1)) * W;
    const y = H - 4 - (d.views / max) * (H - 10);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%" }}>
      <polyline points={`0,${H - 4} ${pts} ${W},${H - 4}`} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {daily.map((d, i) => {
        const x = (i / Math.max(1, daily.length - 1)) * W;
        const y = H - 4 - (d.views / max) * (H - 10);
        return <circle key={i} cx={x} cy={y} r="2.4" fill="#fbd24b" />;
      })}
    </svg>
  );
}

function SeriesPanel({ s, onChanged }: { s: Series; onChanged: () => void }) {
  const { t } = useI18n();
  const { push } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chapters, setChapters] = useState<(Chapter & { views?: number })[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; titleEn: string; synopsis: string; synopsisEn: string; status: Series["status"]; access: Series["access"]; warningPegi: string }>({
    title: s.title, titleEn: s.titleEn, synopsis: s.synopsis, synopsisEn: s.synopsisEn,
    status: s.status, access: s.access, warningPegi: s.warningPegi,
  });
  const [coverUrl, setCoverUrl] = useState(s.cover);
  const [busy, setBusy] = useState(false);
  const prog = getProgress(s.slug);

  const load = () => {
    api.get<Stats>(`/api/series/${s.slug}/stats`).then(setStats).catch(() => {});
    api.get<{ chapters: (Chapter & { views?: number })[] }>(`/api/series/${s.slug}/chapters`).then((d) => setChapters(d.chapters)).catch(() => {});
  };
  useEffect(load, [s.slug]);

  const addChapter = async (asDraft: boolean) => {
    const title = window.prompt(t("dashboard_add_chapter"));
    if (!title) return;
    const pages = Number(window.prompt("Nombre de pages (défaut 24)") || "24");
    await api.post(`/api/series/${s.slug}/chapters`, { title, pages, is_publish: !asDraft });
    push(asDraft ? t("toast_draft") : t("toast_published"));
    load(); onChanged();
  };

  const setChapterPublish = async (ch: Chapter, publish: boolean) => {
    await api.patch(`/api/chapters/${ch.id}`, { is_publish: publish });
    push(publish ? t("toast_published") : t("toast_draft"));
    load();
  };

  const deleteChapter = async (ch: Chapter) => {
    if (!window.confirm(t("confirm_delete_chapter"))) return;
    await api.del(`/api/chapters/${ch.id}`);
    push(t("toast_deleted"));
    load();
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.patch(`/api/series/${s.slug}`, { ...form, cover: coverUrl });
      push(t("toast_saved"));
      setEditOpen(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const onCoverFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadImage(f);
      setCoverUrl(url);
      push(t("toast_cover"));
    } catch {
      push(t("error_required"));
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-body">
        <div className="row" style={{ gap: 14 }}>
          <div style={{ width: 76, aspectRatio: "3/4", borderRadius: 10, flexShrink: 0, ...coverStyle(s, 0) }} />
          <div className="grow">
            <div className="row wrap" style={{ gap: 8 }}>
              <Link href={`/series/${s.slug}`} style={{ fontWeight: 800, fontSize: 17 }}>{s.title}</Link>
              <span className="pill">{s.formatLabel}</span>
              {s.origin === "original" && <span className="badge-original">Original</span>}
            </div>
            <div className="row wrap" style={{ marginTop: 6, gap: 12, fontSize: 13, color: "var(--fg-muted)" }}>
              <span className="row" style={{ gap: 5 }}><Eye size={14} /> {nFmt(s.stats.views)}</span>
              <span className="row" style={{ gap: 5 }}><Heart size={14} /> {nFmt(s.stats.likes)}</span>
              <span className="row" style={{ gap: 5 }}><Bell size={14} /> {nFmt(s.stats.follows)}</span>
              <span>{s.stats.chapters} {t("dashboard_chapters")}</span>
            </div>
            {stats && stats.daily.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Sparkline daily={stats.daily} />
                <div className="tiny muted">14 j — {t("dashboard_stats_views")}</div>
              </div>
            )}
            {prog && (
              <Link href={`/reader/${s.slug}/${prog.number}`} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <Play size={14} filled /> {t("library_resume")} #{prog.number}
              </Link>
            )}
          </div>
          <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setEditOpen(true)}><Pencil size={14} /> {t("edit_series")}</button>
            <button className="btn btn-sm btn-primary" onClick={() => addChapter(false)}><Plus size={14} /> {t("dashboard_add_chapter")}</button>
            <button className="btn btn-sm btn-ghost" onClick={() => addChapter(true)}><Pencil size={14} /> {t("draft")}</button>
          </div>
        </div>

        {chapters.length > 0 && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            {chapters.map((ch) => (
              <div key={ch.id} className="row-between" style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "var(--brand-soft)" }}>#{ch.number}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{ch.title} {!ch.is_publish && <span className="badge-canvas" style={{ marginLeft: 6 }}>{t("draft")}</span>}</div>
                    <div className="tiny muted">{ch.pages} pages · {ch.views != null ? `${nFmt(ch.views)} ${t("series_views")} · ` : ""}{timeAgo(ch.created_at, "fr")}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {!ch.is_publish && (
                    <Link href={`/reader/${s.slug}/${ch.number}?preview=1`} className="btn btn-sm btn-ghost">{t("preview_open")}</Link>
                  )}
                  {ch.is_publish ? (
                    <button className="btn btn-sm btn-ghost" onClick={() => setChapterPublish(ch, false)}>{t("unpublish")}</button>
                  ) : (
                    <button className="btn btn-sm btn-electron" onClick={() => setChapterPublish(ch, true)}>{t("publish_now")}</button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteChapter(ch)}><Trash size={14} /> {t("delete_chapter")}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.8)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
            <h3 className="title-md">{t("edit_series")} — {s.title}</h3>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div><label className="label">{t("publish_title_f")}</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">{t("publish_title_e")}</label><input className="input" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
              <div><label className="label">{t("publish_synopsis_f")}</label><textarea className="input" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} /></div>
              <div><label className="label">{t("publish_synopsis_e")}</label><textarea className="input" value={form.synopsisEn} onChange={(e) => setForm({ ...form, synopsisEn: e.target.value })} /></div>
              <div><label className="label">{t("publish_status")}</label>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Series["status"] })}>
                  <option value="ongoing">{t("status_ongoing")}</option>
                  <option value="hiatus">{t("status_hiatus")}</option>
                  <option value="completed">{t("status_completed")}</option>
                </select>
              </div>
              <div><label className="label">{t("publish_access")}</label>
                <select className="select" value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value as Series["access"] })}>
                  <option value="free">{t("access_free")}</option>
                  <option value="paying">{t("access_paying")}</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 80, aspectRatio: "3/4", borderRadius: 10, border: "1px solid var(--line-strong)", ...coverStyle({ cover: coverUrl }, 0) }} />
              <div>
                <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", display: "inline-flex" }}>
                  {t("cover_upload")}
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onCoverFile} />
                </label>
                <p className="tiny muted" style={{ marginTop: 6 }}>{t("cover_upload_hint")}</p>
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>{t("cancel")}</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={busy}>{busy ? "…" : t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { push } = useToast();
  const [works, setWorks] = useState<Series[] | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [me, setMe] = useState<{ username: string; bio: string; avatar: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [bioDraft, setBioDraft] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ user: { username: string; bio: string; avatar: string } | null }>("/api/auth/me").then((d) => {
      setMe(d.user);
      setBioDraft(d.user?.bio || "");
    }).catch(() => {});
    api.get<{ works: Series[]; recentActivity: Activity[] }>("/api/dashboard").then((d) => {
      setWorks(d.works);
      setActivity(d.recentActivity);
    }).catch(() => setWorks([]));
  }, [reload]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const d = await api.patch<{ user: { bio: string; avatar: string } }>("/api/auth/profile", { bio: bioDraft });
      setMe((m) => (m ? { ...m, bio: d.user.bio } : m));
      push(t("profile_saved"));
      setShowProfile(false);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadImage(f);
      const d = await api.patch<{ user: { avatar: string } }>("/api/auth/profile", { avatar: url });
      setMe((m) => (m ? { ...m, avatar: d.user.avatar } : m));
      push(t("toast_cover"));
    } catch {
      push(t("error_required"));
    }
  };

  const profileIncomplete = me && (!me.bio.trim() || !me.avatar.trim() || me.avatar.startsWith("#"));

  if (works === null) return <p className="container section">…</p>;

  if (!me) {
    return (
      <div className="container section" style={{ textAlign: "center", paddingTop: 100 }}>
        <h2 className="title-lg">{t("signin_title")}</h2>
        <Link href="/sign-in" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>{t("nav_signin")}</Link>
      </div>
    );
  }

  const totalViews = works.reduce((a, s) => a + s.stats.views, 0);
  const totalLikes = works.reduce((a, s) => a + s.stats.likes, 0);
  const totalFollows = works.reduce((a, s) => a + s.stats.follows, 0);

  return (
    <div className="container section">
      <div className="row-between wrap">
        <div>
          <h1 className="title-lg">{t("dashboard_title")}</h1>
          <p className="muted" style={{ marginTop: -8 }}>@{me.username} — {t("dashboard_sub")}</p>
        </div>
        <Link href="/publish" className="btn btn-primary">{t("dashboard_create")}</Link>
      </div>

      {profileIncomplete && (
        <div className="card" style={{ marginTop: 18, background: "linear-gradient(120deg, rgba(234,84,39,0.14), rgba(251,210,75,0.10))", borderColor: "rgba(234,84,39,0.35)" }}>
          <div className="card-body">
            {!showProfile ? (
              <div className="row-between wrap">
                <div>
                  <strong>{t("profile_complete_title")}</strong>
                  <p className="muted small" style={{ margin: "4px 0 0" }}>{t("profile_complete_sub")}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowProfile(true)}>{t("edit_profile")}</button>
              </div>
            ) : (
              <div>
                <div className="row" style={{ gap: 14, marginBottom: 12 }}>
                  <div style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", background: "var(--bg-soft)", border: "1px solid var(--line-strong)", overflow: "hidden", flexShrink: 0 }}>
                    {me?.avatar && !me.avatar.startsWith("#") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={me.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <label style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,15,20,0.55)", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                      {t("profile_avatar_label")}
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onAvatarFile} />
                    </label>
                  </div>
                  <div className="grow">
                    <label className="label">{t("profile_bio_label")}</label>
                    <textarea className="input" maxLength={400} value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} />
                  </div>
                </div>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowProfile(false)}>{t("cancel")}</button>
                  <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving ? "…" : t("save")}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, margin: "24px 0" }}>
        {[
          [totalViews, t("dashboard_stats_views")],
          [totalLikes, t("dashboard_stats_likes")],
          [totalFollows, t("dashboard_stats_follows")],
          [works.reduce((a, s) => a + s.stats.chapters, 0), t("dashboard_chapters")],
        ].map(([n, label]) => (
          <div key={label as string} className="card"><div className="card-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-display)" }}>{nFmt(n as number)}</div>
            <div className="tiny muted">{label}</div>
          </div></div>
        ))}
      </div>

      {works.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", marginTop: 24 }}>
          <Upload size={40} style={{ margin: "0 auto 12px", color: "var(--brand)" }} />
          <p className="muted">{t("dashboard_none")}</p>
          <Link href="/publish" className="btn btn-primary" style={{ marginTop: 8 }}>{t("dashboard_create")}</Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1fr)", gap: 28 }}>
          <div>
            {works.map((s) => (
              <SeriesPanel key={s.slug} s={s} onChanged={() => setReload((r) => r + 1)} />
            ))}
          </div>
          <aside className="card" style={{ alignSelf: "start" }}>
            <div className="card-body">
              <div className="eyebrow">{t("dashboard_activity")}</div>
              {activity.length === 0 && <p className="muted small">—</p>}
              {activity.map((a, i) => (
                <Link key={i} href={`/series/${a.slug}`} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 14 }}>
                    <span className="pill" style={{ padding: "2px 8px", marginRight: 8 }}>{a.kind === "chapter" ? t("dashboard_chapters") : t("series_comments")}</span>
                    {a.kind === "chapter" ? a.title : `« ${a.title.slice(0, 50)}… »`}
                  </div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{a.s_title} · {timeAgo(a.at, "fr")}</div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
