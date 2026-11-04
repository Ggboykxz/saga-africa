"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, type Series } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { SkeletonGrid } from "@/components/Skeleton";

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

export default function CatalogPage() {
  return (
    <Suspense fallback={<p className="container">…</p>}>
      <CatalogInner />
    </Suspense>
  );
}
