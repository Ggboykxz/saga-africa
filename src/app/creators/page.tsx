"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { BookOpen, Upload, Trophy } from "@/components/icons";

export default function CreatorsPage() {
  const { t } = useI18n();
  const steps = [
    [BookOpen, "home_read", "home_read_sub"],
    [Upload, "home_publish", "home_publish_sub"],
    [Trophy, "home_monetize", "home_monetize_sub"],
  ];
  return (
    <div className="container section">
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
        <div className="eyebrow">{t("nav_creators")}</div>
        <h1 className="title-lg">{t("home_join")}</h1>
        <p className="muted">{t("home_join_sub")}</p>
        <Link href="/publish" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>{t("home_join_cta")}</Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {steps.map(([Ico, k, sub]) => (
          <div key={k as string} className="card"><div className="card-body" style={{ padding: 28, textAlign: "center" }}>
            <Ico size={44} style={{ margin: "0 auto 10px", color: "var(--brand)" }} />
            <h3 className="title-md">{t(k as string)}</h3>
            <p className="muted small">{t(sub as string)}</p>
          </div></div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 40, padding: 32 }}>
        <h3 className="title-md">Comment ça marche</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 14 }}>
          {[
            ["1.", "Créez votre série — titre FR/EN, format, synopsis, genres."],
            ["2.", "Publiez des chapitres depuis votre studio."],
            ["3.", "Suivez vues, j'aime et abonnés en temps réel."],
            ["4.", "Évoluez vers Original ou Payant quand votre communauté grandit."],
          ].map(([n, txt]) => (
            <div key={n}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--grad-brand)", color: "#240a00", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
              <p className="small muted" style={{ marginTop: 8 }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
