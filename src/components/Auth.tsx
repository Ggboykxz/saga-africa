"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

export default function AuthPage({ mode }: { mode: "in" | "up" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email || !password || (mode === "up" && !username)) return setError(t("error_required"));
    setBusy(true);
    try {
      if (mode === "up") await api.post("/api/auth/register", { username, email, password });
      else await api.post("/api/auth/login", { email, password });
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message === "bad_credentials" ? "Identifiants incorrects." : e.message || t("error_required"));
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, padding: "80px 20px" }}>
      <div className="card">
        <div className="card-body" style={{ padding: 32 }}>
          <h2 style={{ marginTop: 0 }}>{mode === "in" ? t("signin_title") : t("signup_title")}</h2>
          {mode === "up" && (
            <div style={{ marginBottom: 14 }}>
              <label className="label">{t("field_username")}</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="luna-ink" />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label className="label">{t("field_email")}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="label">{t("field_password")}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>}
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={submit} disabled={busy}>{busy ? "…" : t("auth_submit")}</button>
          <p className="tiny muted" style={{ textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>{t("auth_demo")}</p>
          <p style={{ textAlign: "center", marginTop: 6 }}>
            {mode === "in" ? (
              <><span className="muted small">{t("auth_no_account")}</span> <Link href="/sign-up" style={{ color: "var(--brand-soft)", fontWeight: 700 }}>{t("auth_signup")}</Link></>
            ) : (
              <><span className="muted small">{t("auth_has_account")}</span> <Link href="/sign-in" style={{ color: "var(--brand-soft)", fontWeight: 700 }}>{t("auth_signin")}</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
