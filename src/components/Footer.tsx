"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Navbar";
import { Twitter, Instagram, Discord } from "./icons";

export function Footer() {
  const { t } = useI18n();
  const genres = ["Action", "Aventure", "Romance", "Drame", "Fantastique", "Thriller", "Comédie", "Horreur"];
  const formats = ["manga", "webtoon", "nolovel", "lightnovel", "artbook"];
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40, background: "var(--ink-950)" }}>
      <div className="container" style={{ padding: "48px 20px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
          <div>
            <div className="row" style={{ gap: 9, fontWeight: 800, fontSize: 18 }}>
              <Logo /> {t("brand")}
            </div>
            <p className="muted small" style={{ marginTop: 10, maxWidth: 280 }}>{t("tagline")}</p>
            <div className="row" style={{ marginTop: 14, gap: 8 }}>
              <span className="pill" style={{ cursor: "default" }} title="X"><Twitter size={15} /></span>
              <span className="pill" style={{ cursor: "default" }} title="Instagram"><Instagram size={15} /></span>
              <span className="pill" style={{ cursor: "default" }} title="Discord"><Discord size={15} /></span>
            </div>
          </div>

          <div>
            <div className="eyebrow">{t("footer_platform")}</div>
            {formats.map((f) => (
              <div key={f}><Link className="muted small" href={`/catalog?format=${f}`}>{t(`format_${f}`)}</Link></div>
            ))}
            <div><Link className="muted small" href="/catalog">{t("catalog_title")}</Link></div>
          </div>

          <div>
            <div className="eyebrow">{t("footer_for_creators")}</div>
            <div><Link className="muted small" href="/publish">{t("nav_publish")}</Link></div>
            <div><Link className="muted small" href="/dashboard">{t("dashboard_title")}</Link></div>
            <div><Link className="muted small" href="/creators">{t("nav_creators")}</Link></div>
          </div>

          <div>
            <div className="eyebrow">{t("home_genres")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {genres.map((g) => (
                <Link key={g} className="pill" style={{ cursor: "pointer" }} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</Link>
              ))}
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div className="row-between wrap">
          <span className="tiny muted">{t("footer_rights")}</span>
          <div className="row">
            <Link className="tiny muted" href="/terms">CGU</Link>
            <span className="tiny muted">·</span>
            <Link className="tiny muted" href="/privacy">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
