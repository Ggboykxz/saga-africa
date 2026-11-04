"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api, type Series } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { nFmt, timeAgo } from "@/lib/format";

type Activity = { kind: string; title: string; slug: string; s_title: string; at: number };

export default function DashboardPage() {
  const { t } = useI18n();
  const [works, setWorks] = useState<Series[] | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [me, setMe] = useState<{ username: string } | null>(null);

  useEffect(() => {
    api.get<{ user: { username: string } | null }>("/api/auth/me").then((d) => setMe(d.user)).catch(() => {});
    api.get<{ works: Series[]; recentActivity: Activity[] }>("/api/dashboard").then((d) => {
      setWorks(d.works);
      setActivity(d.recentActivity);
    }).catch(() => setWorks([]));
  }, []);

  const addChapter = async (s: Series) => {
    const title = window.prompt(t("dashboard_add_chapter"));
    if (!title) return;
    const pages = Number(window.prompt("Nombre de pages (défaut 24)") || "24");
    await api.post(`/api/series/${s.slug}/chapters`, { title, pages });
    const d = await api.get<{ works: Series[]; recentActivity: Activity[] }>("/api/dashboard");
    setWorks(d.works);
    setActivity(d.recentActivity);
  };

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

      {works.length > 0 && (
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
      )}

      {works.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", marginTop: 24 }}>
          <div style={{ fontSize: 40 }}>🎨</div>
          <p className="muted">{t("dashboard_none")}</p>
          <Link href="/publish" className="btn btn-primary" style={{ marginTop: 8 }}>{t("dashboard_create")}</Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 28 }}>
          <div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
              {works.map((s, i) => (
                <div key={s.slug}>
                  <SeriesCard s={s} seed={i} />
                  <button className="btn btn-sm btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => addChapter(s)}>{t("dashboard_add_chapter")}</button>
                </div>
              ))}
            </div>
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
