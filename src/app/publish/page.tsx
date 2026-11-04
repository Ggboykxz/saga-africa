"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

const GENRES = [
  "Action", "Aventure", "Comédie", "Drame", "Fantastique", "Horreur",
  "Romance", "Science-fiction", "Sport", "Tranche de vie", "Thriller", "Jeunesse",
];

const FORMATS = ["manga", "webtoon", "nolovel", "lightnovel", "artbook"];
const COLORS = ["#ea5427", "#039be5", "#ef4444", "#00dc64", "#a855f7", "#f97316", "#b45309", "#db2777", "#2563eb", "#0f766e"];
const TAGS = ["Shonen", "Seinen", "Shojo", "Magie", "Robot", "Combat", "Voyage", "Furry", "Mystère", "École", "Isekai"];

export default function PublishPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", titleEn: "", synopsis: "", synopsisEn: "",
    format: "webtoon", status: "ongoing", access: "free", origin: "canvas",
    coverColor: COLORS[0], language: "fr", warned: false, warningPegi: "",
    genres: [] as string[], tags: [] as string[],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "genres" | "tags", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const submit = async () => {
    setError("");
    if (!form.title || !form.titleEn || !form.synopsis || !form.synopsisEn) return setError(t("error_required"));
    setBusy(true);
    try {
      const d = await api.post<{ series: { slug: string } }>("/api/series", form);
      router.push(`/series/${d.series.slug}?fresh=1`);
    } catch (e: any) {
      setError(e.message === "unauthorized" ? t("comments_signin") : (e.message || t("error_required")));
      setBusy(false);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 780 }}>
      <h1 className="title-lg">{t("publish_title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("publish_sub")}</p>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <div><label className="label">{t("publish_title_f")}</label><input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><label className="label">{t("publish_title_e")}</label><input className="input" value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} /></div>
        <div><label className="label">{t("publish_synopsis_f")}</label><textarea className="input" value={form.synopsis} onChange={(e) => set("synopsis", e.target.value)} /></div>
        <div><label className="label">{t("publish_synopsis_e")}</label><textarea className="input" value={form.synopsisEn} onChange={(e) => set("synopsisEn", e.target.value)} /></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 16 }}>
        <div>
          <label className="label">{t("publish_format")}</label>
          <select className="select" value={form.format} onChange={(e) => set("format", e.target.value)}>
            {FORMATS.map((f) => <option key={f} value={f}>{t(`format_${f}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("publish_status")}</label>
          <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ongoing">{t("status_ongoing")}</option>
            <option value="hiatus">{t("status_hiatus")}</option>
            <option value="completed">{t("status_completed")}</option>
          </select>
        </div>
        <div>
          <label className="label">{t("publish_access")}</label>
          <select className="select" value={form.access} onChange={(e) => set("access", e.target.value)}>
            <option value="free">{t("access_free")}</option>
            <option value="paying">{t("access_paying")}</option>
          </select>
        </div>
        <div>
          <label className="label">{t("publish_origin")}</label>
          <select className="select" value={form.origin} onChange={(e) => set("origin", e.target.value)}>
            <option value="canvas">{t("origin_canvas")}</option>
            <option value="original">{t("origin_original")}</option>
          </select>
        </div>
        <div>
          <label className="label">{t("publish_color")}</label>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("coverColor", c)}
                style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.coverColor === c ? "3px solid #fff" : "1px solid var(--line-strong)", cursor: "pointer" }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label className="label">{t("publish_genres")}</label>
        <div className="chip-row">{GENRES.map((g) => (
          <button key={g} type="button" className={`pill ${form.genres.includes(g) ? "pill-active" : ""}`} onClick={() => toggle("genres", g)}>{g}</button>
        ))}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="label">{t("publish_tags")}</label>
        <div className="chip-row">{TAGS.map((g) => (
          <button key={g} type="button" className={`pill ${form.tags.includes(g) ? "pill-active" : ""}`} onClick={() => toggle("tags", g)}>#{g}</button>
        ))}</div>
      </div>

      <label className="row" style={{ marginTop: 20, gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={form.warned} onChange={(e) => set("warned", e.target.checked)} />
        <span>{t("publish_warn")}</span>
        {form.warned && <input className="input" style={{ maxWidth: 140 }} placeholder="PEGI 16" value={form.warningPegi} onChange={(e) => set("warningPegi", e.target.value)} />}
      </label>

      {error && <p style={{ color: "var(--danger)", marginTop: 14 }}>{error}</p>}

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>{busy ? "…" : t("publish_submit")}</button>
      </div>
    </div>
  );
}
