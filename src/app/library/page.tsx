"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api, type Series } from "@/lib/api";
import { getProgress } from "@/lib/progress";
import { nFmt, coverStyle } from "@/lib/format";
import { Play, Eye } from "@/components/icons";

export default function LibraryPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<{ username: string } | null>(null);
  const [series, setSeries] = useState<Series[] | null>(null);
  const [format, setFormat] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get<{ user: { username: string } | null }>("/api/auth/me").then((d) => setMe(d.user)).catch(() => {});
    api.get<{ series: Series[] }>("/api/library").then((d) => setSeries(d.series)).catch(() => setSeries([]));
  }, []);

  if (series === null) return <p className="container section">…</p>;

  if (!me) {
    return (
      <div className="container section" style={{ textAlign: "center", paddingTop: 100 }}>
        <h2 className="title-lg">{t("signin_title")}</h2>
        <Link href="/sign-in" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>{t("nav_signin")}</Link>
      </div>
    );
  }

  const formats = ["", "manga", "webtoon", "nolovel", "lightnovel", "artbook"];
  const statuses = ["", "ongoing", "hiatus", "completed"];
  const filtered = series.filter((s) => (!format || s.format === format) && (!status || s.status === status));

  return (
    <div className="container section">
      <h1 className="title-lg">{t("library_title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("library_sub")}</p>

      <div className="row wrap" style={{ margin: "18px 0 4px", gap: 8 }}>
        {formats.map((f) => (
          <button key={f || "all"} className={`pill ${format === f ? "pill-active" : ""}`} onClick={() => setFormat(f)}>
            {f ? t(`format_${f}`) : t("catalog_all")}
          </button>
        ))}
      </div>
      <div className="row wrap" style={{ marginBottom: 12, gap: 8 }}>
        {statuses.map((st) => (
          <button key={st || "all"} className={`pill ${status === st ? "pill-active" : ""}`} onClick={() => setStatus(st)}>
            {st ? t(`status_${st}`) : t("catalog_all")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", marginTop: 24 }}>
          <p className="muted">{t("library_empty")}</p>
          <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 8 }}>{t("home_hero_cta")}</Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
          {filtered.map((s, i) => {
            const prog = getProgress(s.slug);
            const resumeChapter = prog && s.stats.chapters >= 1 ? prog.number : null;
            return (
              <div key={s.slug} className="card card-hover">
                <Link href={`/series/${s.slug}`} style={{ display: "block", position: "relative", aspectRatio: "16/9", ...coverStyle(s, i) }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(10,12,16,0.8))" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, color: "#fff", fontWeight: 800, fontFamily: "var(--font-display)" }}>{s.title}</div>
                </Link>
                <div className="card-body" style={{ padding: "12px 14px" }}>
                  <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
                    <span className="pill" style={{ padding: "3px 9px" }}>{s.formatLabel}</span>
                    <span className="pill" style={{ padding: "3px 9px", display: "inline-flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {nFmt(s.stats.views)}</span>
                  </div>
                  {resumeChapter ? (
                    <Link href={`/reader/${s.slug}/${resumeChapter}`} className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                      <Play size={14} filled /> {t("library_resume")} #{resumeChapter}
                    </Link>
                  ) : (
                    <Link href={`/series/${s.slug}`} className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
                      {t("library_go")}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
