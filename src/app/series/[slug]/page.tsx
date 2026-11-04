"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, type Series, type Chapter } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { Comments } from "@/components/Comments";
import { SkeletonGrid, SkeletonRow } from "@/components/Skeleton";
import { useToast } from "@/lib/toast";
import { nFmt, dateFmt, coverStyle } from "@/lib/format";
import { getProgress } from "@/lib/progress";
import { Eye, Heart, MessageCircle, Bell, Play, AlertTriangle, Globe, Calendar, Check, Plus } from "@/components/icons";

export default function SeriesPage() {
  const { slug } = useParams() as { slug: string };
  const { t, lang } = useI18n();
  const { push } = useToast();
  const [s, setS] = useState<Series | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [otherWorks, setOtherWorks] = useState<Series[]>([]);
  const [showWarn, setShowWarn] = useState(false);
  const [me, setMe] = useState<{ username: string } | null>(null);

  useEffect(() => {
    api.get<{ series: Series }>(`/api/series/${slug}`).then((d) => {
      setS(d.series);
      if (d.series.warned) {
        try {
          if (!localStorage.getItem(`saga_warn_${d.series.slug}`)) setShowWarn(true);
        } catch {}
      }
    }).catch(() => {});
    api.get<{ chapters: Chapter[] }>(`/api/series/${slug}/chapters`).then((d) => setChapters(d.chapters)).catch(() => {});
    api.get<{ user: { username: string } | null }>("/api/auth/me").then((d) => setMe(d.user)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (s) {
      api.get<{ works: Series[] }>(`/api/u/${s.author.username}`).then((d) => setOtherWorks(d.works.filter((w) => w.slug !== s.slug).slice(0, 4))).catch(() => {});
    }
  }, [s]);

  if (!s) {
    return (
      <div className="container section">
        <div className="skl" style={{ height: 220, borderRadius: "var(--r-lg)" }} />
        <div style={{ marginTop: -70, display: "flex", gap: 20, position: "relative" }}>
          <div className="skl" style={{ width: 180, aspectRatio: "3/4", borderRadius: "var(--r-lg)", border: "3px solid var(--bg-elev)" }} />
          <div style={{ flex: 1 }}>
            <div className="skl" style={{ height: 26, width: "50%", marginBottom: 12 }} />
            <div className="skl" style={{ height: 14, width: "80%" }} />
            <div className="skl" style={{ height: 14, width: "65%", marginTop: 8 }} />
          </div>
        </div>
        <div style={{ marginTop: 36 }}>
          <SkeletonGrid n={4} />
        </div>
      </div>
    );
  }
  const title = lang === "fr" ? s.title : s.titleEn;
  const synopsis = lang === "fr" ? s.synopsis : s.synopsisEn;
  const saved = getProgress(s.slug);
  const continueChapter = saved && chapters.some((c) => c.number === saved.number) ? saved.number : null;

  const toggle = async (kind: "like" | "follow") => {
    if (!me) return alert(t("comments_signin"));
    const d = await api.post<{ liked?: boolean; followed?: boolean }>(`/api/series/${s.slug}/${kind}`);
    setS({ ...s, userState: {
      ...s.userState,
      liked: kind === "like" ? !!d.liked : s.userState.liked,
      followed: kind === "follow" ? !!d.followed : s.userState.followed,
    } });
    if (kind === "like") push(d.liked ? t("toast_liked") : t("toast_unliked"));
    else push(d.followed ? t("toast_followed") : t("toast_unfollowed"));
  };

  const acceptWarn = () => {
    try { localStorage.setItem(`saga_warn_${s.slug}`, "1"); } catch {}
    setShowWarn(false);
  };

  return (
    <>
      {/* banner */}
      <div style={{ height: 220, position: "relative", ...coverStyle(s, 0) }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,15,20,0.2), var(--bg))" }} />
      </div>

      <div className="container" style={{ marginTop: -90, position: "relative" }}>
        <div className="row" style={{ alignItems: "flex-end", gap: 20 }}>
          <div style={{ width: 180, aspectRatio: "3/4", borderRadius: "var(--r-lg)", border: "3px solid var(--bg-elev)", boxShadow: "var(--shadow-3)", ...coverStyle(s, 0) }} />
          <div className="grow">
            <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
              {s.origin === "original" ? <span className="badge-original">Original</span> : <span className="badge-canvas">Canvas</span>}
              {s.access === "paying" && <span className="pill pill-electron">VIP</span>}
              <span className="pill">{t(`status_${s.status}`)}</span>
              <span className="pill">{s.formatLabel}</span>
              {s.genres.map((g) => <span key={g} className="pill">{g}</span>)}
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 40px)" }}>{title}</h1>
            <div className="row wrap" style={{ marginTop: 8, gap: 14, color: "var(--fg-muted)", fontSize: 14 }}>
              <Link href={`/u/${s.author.username}`} className="row" style={{ gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {s.author.username.slice(0, 1).toUpperCase()}
                </span>
                <span style={{ fontWeight: 700, color: "var(--fg)" }}>{s.author.username}</span>
              </Link>
              <span>{t("series_chapters")} {s.stats.chapters}</span>
              <span className="row" style={{ gap: 5 }}><Eye size={15} /> {nFmt(s.stats.views)}</span>
              <span className="row" style={{ gap: 5 }}><Heart size={15} /> {nFmt(s.stats.likes)}</span>
              <span className="row" style={{ gap: 5 }}><MessageCircle size={15} /> {nFmt(s.stats.comments)}</span>
              <span className="row" style={{ gap: 5 }}><Bell size={15} /> {nFmt(s.stats.follows)}</span>
              <span className="tiny muted">{dateFmt(s.createdAt, lang)}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {chapters.length > 0 && (
              continueChapter ? (
                <Link href={`/reader/${s.slug}/${continueChapter}`} className="btn btn-primary btn-lg">
                  <Play size={18} filled /> {t("continue_reading_cta")} #{continueChapter}
                </Link>
              ) : (
                <Link href={`/reader/${s.slug}/${chapters[0].number}`} className="btn btn-primary btn-lg"><Play size={18} filled /> {t("read_now")}</Link>
              )
            )}
            <button className={`btn btn-lg ${s.userState.followed ? "btn-electron" : "btn-ghost"}`} onClick={() => toggle("follow")}>
              {s.userState.followed ? (
                <><Check size={18} /> {t("following")}</>
              ) : (
                <><Plus size={18} /> {t("follow")}</>
              )}
            </button>
            <button className="btn btn-lg btn-ghost" onClick={() => toggle("like")}>
              <Heart size={18} filled={s.userState.liked} /> {s.userState.liked ? t("liked") : t("like")}
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1fr)", gap: 32, marginTop: 36 }}>
          <div>
            <h3 className="title-md">{t("synopsis")}</h3>
            <p style={{ color: "var(--fg-muted)", fontSize: 15.5 }}>{synopsis}</p>

            <hr className="divider" />
            <h3 className="title-md">{t("chapters")}</h3>
            {chapters.length === 0 && <p className="muted small">Aucun chapitre encore.</p>}
            {chapters.map((c) => (
              <Link
                key={c.id}
                href={`/reader/${s.slug}/${c.number}`}
                className="card card-hover"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", marginBottom: 8 }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--brand-soft)" }}>
                  #{c.number}
                </span>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{lang === "fr" ? c.title : c.title_en}</div>
                  <div className="tiny muted">{c.pages} pages · {c.views != null ? `${nFmt(c.views)} ${t("series_views")} · ` : ""}{dateFmt(c.created_at, lang)}</div>
                </div>
                <span className="btn btn-sm btn-ghost" style={{ pointerEvents: "none" }}><Play size={14} filled /></span>
              </Link>
            ))}
            <hr className="divider" />
            <Comments slug={s.slug} />
          </div>

          <aside>
            <div className="card">
              <div className="card-body">
                <div className="eyebrow">{t("author")}</div>
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                    {s.author.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <Link href={`/u/${s.author.username}`} style={{ fontWeight: 800, fontSize: 16 }}>{s.author.username}</Link>
                    <div className="tiny muted">@{s.author.username}</div>
                  </div>
                </div>
                {s.tags.length > 0 && (
                  <>
                    <hr className="divider" style={{ margin: "16px 0" }} />
                    <div className="chip-row">{s.tags.map((tag) => <span key={tag} className="pill">#{tag}</span>)}</div>
                  </>
                )}
                <hr className="divider" style={{ margin: "16px 0" }} />
                <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={14} /> {s.language === "fr" ? "Français" : "English"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> {t("profile_joined")} {dateFmt(s.createdAt, lang)}</div>
                  {s.warned && <div style={{ color: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {t("warning_pegi")} {s.warningPegi || ""}</div>}
                </div>
              </div>
            </div>

            {otherWorks.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 className="title-md" style={{ fontSize: 17 }}>{t("profile_works")} — {s.author.username}</h4>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {otherWorks.map((w, i) => <SeriesCard key={w.slug} s={w} seed={i} />)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* warnings gate */}
      {showWarn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.8)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 460, width: "100%", padding: 32, textAlign: "center" }}>
            <AlertTriangle size={42} style={{ margin: "0 auto 8px", color: "var(--brand)" }} />
            <h3 className="title-md">{t("warning_pegi")}</h3>
            <p className="muted">« {title} » contient des avertissements : <strong>{s.warningPegi || "18+"}</strong></p>
            <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setShowWarn(false)}>{t("warning_cancel")}</button>
              <button className="btn btn-primary" onClick={acceptWarn}>{t("warning_continue")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
