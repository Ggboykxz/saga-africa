"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Series } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { SkeletonGrid } from "@/components/Skeleton";
import { nFmt, timeAgo, coverStyle } from "@/lib/format";

function SectionHead({ k, sub }: { k: string; sub?: string }) {
  const { t } = useI18n();
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="eyebrow">{k.toUpperCase()}</div>
      <h2 className="title-md">{t(k)}</h2>
      {sub && <p className="muted small" style={{ margin: 0 }}>{t(sub)}</p>}
    </div>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const [trending, setTrending] = useState<Series[]>([]);
  const [popular, setPopular] = useState<Series[]>([]);
  const [originals, setOriginals] = useState<Series[]>([]);
  const [fresh, setFresh] = useState<Series[]>([]);
  const [latestComments, setLatestComments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get<{ series: Series[] }>("/api/leaderboard?tab=trending").then((d) => setTrending(d.series)).catch(() => {});
    api.get<{ series: Series[] }>("/api/leaderboard?tab=popular").then((d) => setPopular(d.series.slice(0, 6))).catch(() => {});
    api.get<{ series: Series[] }>("/api/series?origin=original&sort=new").then((d) => setOriginals(d.series.slice(0, 6))).catch(() => {});
    api.get<{ series: Series[] }>("/api/series?sort=new").then((d) => setFresh(d.series.slice(0, 8))).catch(() => {});
    api.get<{ comments: any[] }>("/api/comments/latest").then((d) => setLatestComments(d.comments)).catch(() => {});
    api.get<{ series: number; chapters: number; users: number }>("/api/stats").then(setStats).catch(() => {});
  }, []);

  const genres = ["Action", "Aventure", "Romance", "Drame", "Fantastique", "Thriller", "Comédie", "Horreur", "Science-fiction", "Jeunesse"];

  return (
    <>
      {/* HERO */}
      <section style={{ background: "var(--grad-night)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 80% at 80% 10%, rgba(234,84,39,0.28) 0%, transparent 60%), radial-gradient(50% 60% at 10% 90%, rgba(0,220,100,0.16) 0%, transparent 55%)" }} />
        <div className="container" style={{ position: "relative", padding: "76px 20px 64px", maxWidth: 1080, textAlign: "center" }}>
          <div className="row" style={{ justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <span className="pill pill-brand">Manga · Webtoon · Nolovel · Light novel</span>
            <span className="pill pill-electron">Gratuit</span>
          </div>
          <h1 className="title-xl" style={{ fontWeight: 800 }}>{t("home_hero_title")}</h1>
          <p className="muted" style={{ fontSize: 18, maxWidth: 640, margin: "0 auto 28px" }}>{t("home_hero_sub")}</p>
          <div className="row wrap" style={{ justifyContent: "center", gap: 12 }}>
            <Link href="/catalog" className="btn btn-primary btn-lg">{t("home_hero_cta")}</Link>
            <Link href="/publish" className="btn btn-ghost btn-lg">{t("home_hero_cta2")}</Link>
          </div>
          {stats && (
            <div className="row wrap" style={{ justifyContent: "center", gap: 28, marginTop: 40 }}>
              {[
                [stats.series, "séries"],
                [stats.chapters, "chapitres"],
                [stats.users, "créateurs & lecteurs"],
                [stats.comments, "commentaires"],
              ].map(([n, label]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)" }}>{nFmt(n as number)}</div>
                  <div className="tiny muted">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TRENDING */}
      <section className="section-tight container">
        <SectionHead k="home_trending" />
        {trending.length === 0 ? (
          <SkeletonGrid n={8} />
        ) : (
          <div className="grid grid-cards">
            {trending.slice(0, 8).map((s, i) => (
              <div key={s.slug} style={{ position: "relative" }}>
                <span style={{ position: "absolute", top: -8, left: -6, zIndex: 2, width: 34, height: 34, borderRadius: "50%", background: i < 3 ? "var(--grad-brand)" : "var(--bg-soft)", color: i < 3 ? "#240a00" : "var(--fg-muted)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg)" }}>
                  {i + 1}
                </span>
                <SeriesCard s={s} seed={i} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* POPULAR */}
      <section className="section container" style={{ paddingTop: 24 }}>
        <SectionHead k="home_popular" />
        {popular.length === 0 ? (
          <SkeletonGrid n={6} />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {popular.map((s, i) => (
              <Link key={s.slug} href={`/series/${s.slug}`} className="card card-hover" style={{ display: "block", aspectRatio: "3/4", position: "relative", ...coverStyle(s, i) }}>
                <span className="badge-canvas" style={{ position: "absolute", top: 10, left: 10, background: "rgba(12,15,20,0.7)", color: "#fff" }}>
                  👁 {nFmt(s.stats.views)}
                </span>
                <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, color: "#fff", fontWeight: 800, fontFamily: "var(--font-display)" }}>{s.title}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ORIGINALS */}
      <section className="section container" style={{ paddingTop: 24 }}>
        <SectionHead k="home_originals" sub="home_originals_sub" />
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {originals.map((s, i) => (
            <Link key={s.slug} href={`/series/${s.slug}`} className="card card-hover" style={{ display: "block", aspectRatio: "3/4", position: "relative", ...coverStyle(s, i) }}>
              <span className="badge-original" style={{ position: "absolute", top: 10, left: 10 }}>Original</span>
              <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, color: "#fff", fontWeight: 800, fontFamily: "var(--font-display)" }}>{s.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* GENRES */}
      <section className="section-tight container">
        <SectionHead k="home_genres" />
        <div className="chip-row">
          {genres.map((g) => (
            <Link key={g} className="pill" href={`/catalog?genre=${encodeURIComponent(g)}`} style={{ fontSize: 14, padding: "8px 16px" }}>{g}</Link>
          ))}
        </div>
      </section>

      {/* FRESH */}
      <section className="section container">
        <SectionHead k="home_fresh" />
        {fresh.length === 0 ? (
          <SkeletonGrid n={8} />
        ) : (
          <div className="grid grid-cards">
            {fresh.map((s, i) => <SeriesCard key={s.slug} s={s} seed={i + 3} />)}
          </div>
        )}
      </section>

      {/* COMMUNITY */}
      <section className="section container">
        <SectionHead k="home_community" />
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {latestComments.map((c) => (
            <Link key={c.id} href={`/series/${c.slug}`} className="card card-hover" style={{ display: "block" }}>
              <div className="card-body">
                <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-soft)", border: "1px solid var(--line-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                    {c.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.username}</div>
                    <div className="tiny muted">{t("series_comments")} · {timeAgo(c.created_at, "fr")}</div>
                  </div>
                </div>
                <p className="small" style={{ margin: "0 0 10px", color: "var(--fg-muted)" }}>« {c.body.slice(0, 120)}{c.body.length > 120 ? "…" : ""} »</p>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ width: 44, height: 20, borderRadius: 4, ...coverStyle({ coverColor: c.cover_color }, 0), backgroundSize: "cover" }} />
                  <span className="small" style={{ fontWeight: 700 }}>{c.title}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* JOIN */}
      <section className="container section">
        <div className="card" style={{ background: "var(--grad-brand)", padding: 40, textAlign: "center", color: "#240a00", border: "none" }}>
          <h2 className="title-lg" style={{ color: "#240a00" }}>{t("home_join")}</h2>
          <p style={{ fontSize: 16, maxWidth: 560, margin: "0 auto 22px", color: "#4a1700" }}>{t("home_join_sub")}</p>
          <Link href="/publish" className="btn" style={{ background: "#13181f", color: "#fff", fontSize: 16, padding: "14px 28px" }}>{t("home_join_cta")}</Link>
        </div>
      </section>
    </>
  );
}
