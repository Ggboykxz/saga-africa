"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { PageArt, type PageSpec } from "@/components/panels";
import { Comments } from "@/components/Comments";
import { getProgress, setProgress } from "@/lib/progress";
import { BookOpen, Sparkles, ArrowLeft, ChevronLeft, ChevronRight, SearchIcon, Play, Sun, Moon } from "@/components/icons";

const MemoPageArt = memo(PageArt);

type ReaderData = {
  preview?: boolean;
  series: { slug: string; title: string; titleEn: string; format: string; coverColor: string; cover: string; author: { username: string; avatar: string } };
  chapter: { id: number; number: number; title: string; titleEn: string; pages: number; key: string };
  pages: PageSpec[];
  nav: { next: number | null; prev: number | null };
};

export default function ReaderPage() {
  const { slug, chapter } = useParams() as { slug: string; chapter: string };
  const { t, lang } = useI18n();
  const [data, setData] = useState<ReaderData | null>(null);
  const [hint, setHint] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);
  const [progress, setProgressPct] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [paper, setPaper] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollTick = useRef(0);
  const restored = useRef(false);

  useEffect(() => {
    try {
      setPaper(localStorage.getItem("saga_reader_paper") === "1");
    } catch {}
  }, []);

  const togglePaper = () => {
    setPaper((p) => {
      const next = !p;
      try { localStorage.setItem("saga_reader_paper", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  useEffect(() => {
    setData(null);
    setPageIdx(0);
    setProgressPct(0);
    restored.current = false;
    api.get<ReaderData>(`/api/reader/${slug}/${chapter}`).then(setData).catch(() => {});
  }, [slug, chapter]);

  // webtoon scroll tracking + restore
  useEffect(() => {
    const el = pageRef.current;
    if (!el || !data || data.series.format === "manga") return;
    if (!restored.current) {
      restored.current = true;
      const saved = getProgress(data.series.slug);
      if (saved && saved.number === data.chapter.number && saved.pct > 3) {
        const max = el.scrollHeight - el.clientHeight;
        el.scrollTop = (saved.pct / 100) * max;
      }
    }
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setProgressPct(Math.round(pct));
      const now = Date.now();
      if (now - scrollTick.current > 1500) {
        scrollTick.current = now;
        setProgress(data.series.slug, data.chapter.number, pct);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [data]);

  const go = useCallback((dir: 1 | -1) => {
    setPageIdx((i) => {
      const next = Math.max(0, Math.min((data?.pages.length || 1) - 1, i + dir));
      if (data) setProgress(data.series.slug, data.chapter.number, (next / Math.max(1, data.pages.length - 1)) * 100);
      return next;
    });
  }, [data]);

  useEffect(() => {
    if (!data || data.series.format !== "manga") return;
    const saved = getProgress(data.series.slug);
    if (saved && saved.number === data.chapter.number && saved.pct > 0) {
      setPageIdx(Math.round((saved.pct / 100) * (data.pages.length - 1)));
    }
  }, [data]);

  useEffect(() => {
    if (!data || data.series.format !== "manga") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
      if (e.key === "Home") setPageIdx(0);
      if (e.key === "End") setPageIdx((data.pages.length || 1) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, go]);

  if (!data) return <p className="container section">…</p>;

  const title = lang === "fr" ? data.chapter.title : data.chapter.titleEn;
  const seriesTitle = lang === "fr" ? data.series.title : data.series.titleEn;
  const isManga = data.series.format === "manga";
  const pageCount = data.pages.length;

  return (
    <>
      {/* top bar */}
      <div style={{ position: "sticky", top: 60, zIndex: 40, background: "var(--glass-strong)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div className="container row-between" style={{ height: 52, gap: 8 }}>
          <Link href={`/series/${data.series.slug}`} className="row" style={{ gap: 8, fontSize: 14, fontWeight: 700, minWidth: 0 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16} /></span>
            <span style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seriesTitle}</span>
            <span className="muted" style={{ fontWeight: 400 }}>· #{data.chapter.number} {title}</span>
            {data.preview && <span className="badge-canvas" style={{ background: "var(--brand)", color: "#240a00" }}>{t("preview_badge")}</span>}
          </Link>
          <div className="row" style={{ gap: 8 }}>
            <button className={`btn btn-sm ${paper ? "btn-primary" : "btn-ghost"}`} onClick={togglePaper} title={paper ? t("reader_theme_ink") : t("reader_theme_paper")}>
              {paper ? <Moon size={15} /> : <Sun size={15} />} {paper ? t("reader_theme_ink") : t("reader_theme_paper")}
            </button>
            {!isManga && (
              <button className={`btn btn-sm ${zoom ? "btn-primary" : "btn-ghost"}`} onClick={() => setZoom(!zoom)} title={t("zoom")}>
                <SearchIcon size={15} /> {zoom ? t("reader_zoom_on") : t("reader_zoom_off")}
              </button>
            )}
            {data.nav.prev && <Link href={`/reader/${slug}/${data.nav.prev}`} className="btn btn-sm btn-ghost">{t("reader_first")}</Link>}
            {data.nav.next && <Link href={`/reader/${slug}/${data.nav.next}`} className="btn btn-sm btn-primary">{t("reader_last")}</Link>}
          </div>
        </div>
        {!isManga && (
          <div style={{ height: 3, background: "var(--bg-soft)" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--grad-brand)", transition: "width 0.15s" }} />
          </div>
        )}
      </div>

      {/* direction hint */}
      {isManga && hint && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.85)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", padding: 28, textAlign: "center" }}>
            <BookOpen size={40} style={{ margin: "0 auto 8px", color: "var(--brand)" }} />
            <h3 className="title-md">Sens japonais</h3>
            <p className="muted">{t("reader_direction")}</p>
            <p className="muted small">{t("reader_swipe")}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setHint(false)}>{t("warning_continue")}</button>
          </div>
        </div>
      )}

      {isManga ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 60px", background: paper ? "#e9e3da" : undefined }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-3)", border: "1px solid var(--line)", maxWidth: "94vw" }}>
            <div style={{ display: "flex", transform: `translateX(${-pageIdx * 100}%)`, transition: "transform 0.3s ease" }}>
              {data.pages.map((p, i) => (
                <div key={i} style={{ minWidth: "100%" }}>
                  <MemoPageArt page={p} width={720} />
                </div>
              ))}
            </div>
            <button onClick={() => go(-1)} aria-label={t("reader_prev")} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", background: "transparent", border: 0, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: pageIdx === 0 ? 0.2 : 1 }}>
              <ChevronRight size={40} />
            </button>
            <button onClick={() => go(1)} aria-label={t("reader_next")} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", background: "transparent", border: 0, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: pageIdx === pageCount - 1 ? 0.2 : 1 }}>
              <ChevronLeft size={40} />
            </button>
          </div>
          <div className="tiny muted" style={{ marginTop: 14 }}>{pageIdx + 1} / {pageCount}</div>
        </div>
      ) : (
        <div
          ref={pageRef}
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 0",
            background: paper ? "#ece6dc" : "var(--bg)",
            ...(zoom ? { zoom: 1.35, overflowX: "auto", margin: "0 8vw" } : {}),
          }}
        >
          {data.pages.map((p, i) => (
            <div key={i} style={{ marginBottom: 14, borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-2)", width: "min(720px, 94vw)" }}>
              <MemoPageArt page={p} />
            </div>
          ))}
        </div>
      )}

      {/* floating mobile nav */}
      <div className="reader-float">
        {data.nav.prev && <Link href={`/reader/${slug}/${data.nav.prev}`} className="btn btn-sm btn-ghost">{t("reader_first")}</Link>}
        <Link href={`/series/${data.series.slug}`} className="btn btn-sm btn-ghost">{t("reader_back")}</Link>
        {data.nav.next && <Link href={`/reader/${slug}/${data.nav.next}`} className="btn btn-sm btn-primary">{t("reader_last")}</Link>}
      </div>

      {/* end of chapter */}
      <div className="container" style={{ paddingTop: 40, maxWidth: 760 }}>
        <div className="card" style={{ textAlign: "center", padding: "36px 24px" }}>
          <Sparkles size={40} style={{ margin: "0 auto 8px", color: "var(--brand)" }} />
          <h3 className="title-md">{t("reader_end")}</h3>
          <p className="muted">{t("reader_end_sub")}</p>
          <div className="row wrap" style={{ justifyContent: "center", marginTop: 14 }}>
            <Link href={`/series/${data.series.slug}`} className="btn btn-ghost">{t("reader_back")}</Link>
            {data.nav.next && <Link href={`/reader/${slug}/${data.nav.next}`} className="btn btn-primary">{t("reader_last")}</Link>}
          </div>
        </div>
        <div style={{ marginTop: 28 }}>
          <Comments slug={data.series.slug} chapterId={data.chapter.id} />
        </div>
      </div>
    </>
  );
}
