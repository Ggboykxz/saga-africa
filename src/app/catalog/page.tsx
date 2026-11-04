"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api, type Series } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { SkeletonGrid } from "@/components/Skeleton";
import { nFmt, coverStyle } from "@/lib/format";

const SORTS = ["trending", "popular", "likes", "new", "title"] as const;
const FORMATS = ["", "manga", "webtoon", "nolovel", "lightnovel", "artbook"] as const;

function CatalogInner() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState(sp.get("format") || "");
  const [genre, setGenre] = useState(sp.get("genre") || "");
  const [q, setQ] = useState(sp.get("q") || "");
  const [sort, setSort] = useState<string>(sp.get("sort") || "trending");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (format) params.set("format", format);
    if (genre) params.set("genre", genre);
    if (q) params.set("q", q);
    if (origin) params.set("origin", origin);
    params.set("sort", sort);
    api.get<{ series: Series[] }>(`/api/series?${params.toString()}`)
      .then((d) => setSeries(d.series))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [format, genre, q, sort, origin]);

  return (
    <div className="container section">
      <RankingPanel />
      <h1 className="title-lg">{t("catalog_title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("catalog_sub")}</p>

      {/* formats tabs */}
      <div className="row wrap" style={{ margin: "22px 0 10px", gap: 8 }}>
        {FORMATS.map((f) => (
          <button key={f || "all"} className={`pill ${format === f ? "pill-active" : ""}`} onClick={() => setFormat(f)}>
            {f ? t(`format_${f}`) : t("catalog_all")}
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="row wrap" style={{ marginBottom: 24, gap: 10 }}>
        <input className="input" style={{ maxWidth: 260, borderRadius: 999 }} placeholder={t("search_ph")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ maxWidth: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s} value={s}>{t(`sort_${s}`)}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 150 }} value={origin} onChange={(e) => setOrigin(e.target.value)}>
          <option value="">{t("catalog_all")}</option>
          <option value="original">{t("origin_original")}</option>
          <option value="canvas">{t("origin_canvas")}</option>
        </select>
        {(format || genre || q || origin) && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setFormat(""); setGenre(""); setQ(""); setOrigin(""); }}>
            ✕ {t("clear_filters")}
          </button>
        )}
      </div>

      <div className="tiny muted" style={{ marginBottom: 10 }}>
        {!loading && `${series.length} ${t("results_count")}`}
      </div>

      {loading ? (
        <SkeletonGrid n={12} />
      ) : series.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🫥</div>
          <p className="muted">Aucune série ne correspond à ces filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cards">
          {series.map((s, i) => <SeriesCard key={s.slug} s={s} seed={i} />)}
        </div>
      )}
    </div>
  );
}

function RankingPanel() {
  const { t } = useI18n();
  const [tab, setTab] = useState("trending");
  const [genre, setGenre] = useState("");
  const [rows, setRows] = useState<Array<Series & { rank: number; delta: number | null }>>([]);
  const genreOptions = ["", "Action", "Aventure", "Romance", "Drame", "Fantastique", "Thriller", "Comédie", "Horreur", "Science-fiction"];

  useEffect(() => {
    const params = new URLSearchParams({ tab });
    if (genre) params.set("genre", genre);
    api.get<{ series: Array<Series & { rank: number; delta: number | null }> }>(`/api/ranking?${params.toString()}`)
      .then((d) => setRows(d.series.slice(0, 10)))
      .catch(() => setRows([]));
  }, [tab, genre]);

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <div className="card-body">
        <div className="row-between wrap" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">{t("ranking_title")}</div>
            <p className="muted small" style={{ margin: 0 }}>{t("ranking_sub")}</p>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {(["trending", "popular"] as const).map((tb) => (
              <button key={tb} className={`pill ${tab === tb ? "pill-active" : ""}`} onClick={() => setTab(tb)}>
                {t(`rank_${tb}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {genreOptions.map((g) => (
            <button key={g || "all"} className={`pill ${genre === g ? "pill-active" : ""}`} onClick={() => setGenre(g)}>
              {g || t("catalog_all")}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="muted small">…</p>
        ) : (
          rows.map((r) => (
            <Link key={r.slug} href={`/series/${r.slug}`} className="row" style={{ gap: 12, padding: "9px 4px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 34, fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 18, color: r.rank <= 3 ? "var(--brand)" : "var(--fg-muted)", textAlign: "center" }}>
                {r.rank}
              </span>
              <span style={{ width: 34, height: 46, borderRadius: 6, flexShrink: 0, ...coverStyle(r, r.rank) }} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                <div className="row" style={{ gap: 6, marginTop: 2 }}>
                  <span className="pill" style={{ padding: "2px 8px" }}>{r.formatLabel}</span>
                  {r.genres.slice(0, 1).map((g) => <span key={g} className="pill" style={{ padding: "2px 8px" }}>{g}</span>)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{nFmt(r.stats.views7)}</div>
                <div className="tiny muted">{t("rank_views7")}</div>
              </div>
              {r.delta !== null && r.delta !== undefined ? (
                <span className={`pill ${r.delta >= 0 ? "pill-electron" : ""}`} style={{ padding: "3px 9px" }}>
                  {r.delta >= 0 ? "Haut " : "Bas "}{Math.abs(r.delta)}%
                </span>
              ) : (
                <span className="pill" style={{ padding: "3px 9px" }}>{t("rank_delta_new")}</span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<p className="container">…</p>}>
      <CatalogInner />
    </Suspense>
  );
}
