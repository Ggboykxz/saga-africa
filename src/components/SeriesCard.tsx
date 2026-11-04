"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { nFmt, coverStyle } from "@/lib/format";
import type { Series } from "@/lib/api";
import { Eye, Heart, MessageCircle } from "./icons";

export function SeriesCard({ s, seed = 0 }: { s: Series; seed?: number }) {
  const { t } = useI18n();
  return (
    <Link href={`/series/${s.slug}`} className="card card-hover" style={{ display: "block" }}>
      <div style={{ position: "relative", aspectRatio: "3/4", ...coverStyle(s, seed) }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(10,12,16,0.75))" }} />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {s.origin === "original" ? (
            <span className="badge-original">Original</span>
          ) : (
            <span className="badge-canvas">Canvas</span>
          )}
          {s.access === "paying" && <span className="badge-canvas" style={{ background: "rgba(0,220,100,0.85)", color: "#06210f" }}>VIP</span>}
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", lineHeight: 1.15 }}>{s.title}</div>
          <div className="tiny" style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{s.author.username}</div>
        </div>
      </div>
      <div className="card-body" style={{ padding: "10px 12px" }}>
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="pill" style={{ padding: "3px 10px" }}>{s.formatLabel}</span>
          {s.genres.slice(0, 2).map((g) => (
            <span key={g} className="pill" style={{ padding: "3px 10px" }}>{g}</span>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8, gap: 10, fontSize: 12.5, color: "var(--fg-muted)" }}>
          <span className="row" style={{ gap: 4 }}><Eye size={14} /> {nFmt(s.stats.views)}</span>
          <span className="row" style={{ gap: 4 }}><Heart size={14} /> {nFmt(s.stats.likes)}</span>
          <span className="row" style={{ gap: 4 }}><MessageCircle size={14} /> {nFmt(s.stats.comments)}</span>
        </div>
      </div>
    </Link>
  );
}
