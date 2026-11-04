"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { api, type Me } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { Bell, LogOut, Globe, Sun, Moon, Menu, X } from "./icons";

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

type Notif = { id: number; series_slug: string; text: string; created_at: number; is_read: number };

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [sugg, setSugg] = useState<{ series: Array<{ slug: string; title: string; formatLabel: string }>; users: Array<{ username: string }> }>({ series: [], users: [] });
  const [suggOpen, setSuggOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const term = q.trim();
      if (term.length >= 2) {
        api.get(`/api/search?q=${encodeURIComponent(term)}`).then((d: any) => {
          setSugg({ series: d.series.slice(0, 5), users: d.users.slice(0, 3) });
          setSuggOpen(true);
        }).catch(() => {});
      } else {
        setSuggOpen(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    api.get<{ user: Me }>("/api/auth/me").then((d) => setMe(d.user)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!me) { setUnread(0); return; }
    let alive = true;
    const tick = () =>
      api.get<{ unread: number; items: Notif[] }>("/api/notifications")
        .then((d) => { if (!alive) return; setUnread(d.unread); setNotifs(d.items); })
        .catch(() => {});
    tick();
    const iv = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [me]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openBell = async () => {
    setBellOpen((o) => !o);
    if (!bellOpen && unread > 0) {
      await api.post("/api/notifications/read-all");
      setUnread(0);
    }
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setMe(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/catalog?q=${encodeURIComponent(q.trim())}`);
  };

  const navLinks = (
    <>
      <Link href="/catalog" className="btn btn-sm btn-ghost">{t("nav_explore")}</Link>
      <Link href="/creators" className="btn btn-sm btn-ghost">{t("nav_creators")}</Link>
      <Link href="/publish" className="btn btn-sm btn-primary">{t("nav_publish")}</Link>
    </>
  );

  const authArea = me ? (
    <>
      <Link href="/library" className="btn btn-sm btn-ghost">{t("nav_library")}</Link>
      <Link href="/dashboard" className="btn btn-sm btn-ghost">{t("nav_dashboard")}</Link>
      <button className="btn btn-sm btn-ghost btn-icon" onClick={logout} title={t("nav_logout")} aria-label={t("nav_logout")}>
        <LogOut size={16} />
      </button>
    </>
  ) : (
    <>
      <Link href="/sign-in" className="btn btn-sm btn-ghost">{t("nav_signin")}</Link>
      <Link href="/sign-up" className="btn btn-sm btn-electron">{t("nav_signup")}</Link>
    </>
  );

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--glass)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
        <div className="container row-between" style={{ height: 60 }}>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/" className="row" style={{ gap: 9, fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display)" }}>
              <Logo /> {t("brand")}
            </Link>
            <nav className="row nav-links" style={{ gap: 4, marginLeft: 8 }}>{navLinks}</nav>
          </div>

          <div ref={searchRef} style={{ position: "relative", display: "flex", flex: 1, maxWidth: 340, margin: "0 12px", minWidth: 0 }}>
            <form className="row grow nav-search" style={{ width: "100%" }} onSubmit={submitSearch}>
              <input className="input" style={{ borderRadius: 999, paddingLeft: 16 }} placeholder={t("search_ph")} value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            {suggOpen && q.trim().length >= 2 && (
              <div style={{ position: "absolute", top: 44, left: 0, right: 0, background: "var(--bg-elev)", border: "1px solid var(--line-strong)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-3)", zIndex: 60, overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
                {sugg.series.length === 0 && sugg.users.length === 0 && <p className="small muted" style={{ padding: 14 }}>…</p>}
                {sugg.series.map((s) => (
                  <Link key={s.slug} href={`/series/${s.slug}`} onClick={() => setSuggOpen(false)} style={{ display: "block", padding: "9px 14px", borderBottom: "1px solid var(--line)", fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{s.title}</span> <span className="pill" style={{ padding: "2px 8px", marginLeft: 8 }}>{s.formatLabel}</span>
                  </Link>
                ))}
                {sugg.users.map((u) => (
                  <Link key={u.username} href={`/u/${u.username}`} onClick={() => setSuggOpen(false)} style={{ display: "block", padding: "9px 14px", borderBottom: "1px solid var(--line)", fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>@{u.username}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setLang(lang === "fr" ? "en" : "fr")} title="Language / Langue">
              <Globe size={15} /> {lang === "fr" ? "EN" : "FR"}
            </button>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={toggleTheme} title={theme === "dark" ? "Mode clair" : "Mode sombre"} aria-label="Theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {me && (
              <div ref={bellRef} style={{ position: "relative" }}>
                <button className="btn btn-sm btn-ghost btn-icon" onClick={openBell} aria-label={t("notif_title")}>
                  <Bell size={17} />
                  {unread > 0 && (
                    <span style={{ position: "absolute", top: -2, right: -2, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999, background: "var(--brand)", color: "#240a00", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div style={{ position: "absolute", right: 0, top: 40, width: 300, background: "var(--bg-elev)", border: "1px solid var(--line-strong)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-3)", overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", fontWeight: 800, fontSize: 14 }}>{t("notif_title")}</div>
                    {notifs.length === 0 ? (
                      <p className="small muted" style={{ padding: 16 }}>{t("notif_empty")}</p>
                    ) : (
                      notifs.map((n) => (
                        <Link key={n.id} href={`/series/${n.series_slug}`} onClick={() => setBellOpen(false)} style={{ display: "block", padding: "10px 14px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                          {n.text} <span style={{ color: "var(--brand-soft)" }}>{t("notif_commented")}</span>
                          <div className="tiny muted">{timeAgo(n.created_at, lang)}</div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="row nav-auth" style={{ gap: 6 }}>{authArea}</div>
            <button className="btn btn-sm btn-ghost btn-icon nav-burger" style={{ display: "none" }} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {navLinks}
        {authArea}
      </div>
    </>
  );
}
