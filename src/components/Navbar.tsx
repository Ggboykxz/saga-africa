"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api, type Me } from "@/lib/api";

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="14" fill="url(#lg)" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ea5427" />
          <stop offset="100%" stopColor="#fbd24b" />
        </linearGradient>
      </defs>
      <path d="M14 34 L14 14 L34 34 L34 14" stroke="#13181f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="4.5" fill="#13181f" />
    </svg>
  );
}

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get<{ user: Me }>("/api/auth/me").then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const logout = async () => {
    await api.post("/api/auth/logout");
    setMe(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(19,24,31,0.86)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
      <div className="container row-between" style={{ height: 60 }}>
        <div className="row" style={{ gap: 10 }}>
          <Link href="/" className="row" style={{ gap: 9, fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display)" }}>
            <Logo /> {t("brand")}
          </Link>
          <nav className="row" style={{ gap: 4, marginLeft: 8, display: "flex" }}>
            <Link href="/catalog" className="btn btn-sm btn-ghost">{t("nav_explore")}</Link>
            <Link href="/creators" className="btn btn-sm btn-ghost">{t("nav_creators")}</Link>
            <Link href="/publish" className="btn btn-sm btn-primary">{t("nav_publish")}</Link>
          </nav>
        </div>

        <form
          className="row grow"
          style={{ maxWidth: 340, margin: "0 12px" }}
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/catalog?q=${encodeURIComponent(q.trim())}`); }}
        >
          <input className="input" style={{ borderRadius: 999, paddingLeft: 16 }} placeholder={t("search_ph")} value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <div className="row" style={{ gap: 6 }}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            title="Language / Langue"
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          {me ? (
            <>
              <Link href="/dashboard" className="btn btn-sm btn-ghost">{t("nav_dashboard")}</Link>
              <button className="btn btn-sm btn-ghost btn-icon" onClick={logout} title={t("nav_logout")} aria-label={t("nav_logout")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-sm btn-ghost">{t("nav_signin")}</Link>
              <Link href="/sign-up" className="btn btn-sm btn-electron">{t("nav_signup")}</Link>
            </>
          )}
          <button className="btn btn-sm btn-ghost btn-icon" style={{ display: "none" }} onClick={() => setOpen(!open)}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
