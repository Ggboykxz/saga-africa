"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, type Series } from "@/lib/api";
import { SeriesCard } from "@/components/SeriesCard";
import { nFmt, dateFmt } from "@/lib/format";

export default function ProfilePage() {
  const { username } = useParams() as { username: string };
  const { t, lang } = useI18n();
  const [data, setData] = useState<{ user: any; works: Series[]; totalViews: number; totalLikes: number } | null>(null);

  useEffect(() => {
    api.get<{ user: any; works: Series[]; totalViews: number; totalLikes: number }>(`/api/u/${username}`)
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, [username]);

  if (!data) return <p className="container section">…</p>;
  const { user, works } = data;

  return (
    <div className="container section">
      <div className="row" style={{ gap: 20 }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--grad-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, color: "#240a00" }}>
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="grow">
          <h1 style={{ margin: 0 }}>{user.username}</h1>
          <p className="muted" style={{ margin: "4px 0" }}>{user.bio || "—"}</p>
          <div className="row wrap" style={{ gap: 14, marginTop: 6, fontSize: 14, color: "var(--fg-muted)" }}>
            <span>{t("series_chapters")} {works.length}</span>
            <span>👁 {nFmt(data.totalViews)}</span>
            <span>❤️ {nFmt(data.totalLikes)}</span>
            <span>{t("profile_joined")} {dateFmt(user.created_at, lang)}</span>
          </div>
        </div>
      </div>

      <hr className="divider" />
      <h3 className="title-md">{t("profile_works")}</h3>
      {works.length === 0 ? (
        <p className="muted">{t("profile_no_works")}</p>
      ) : (
        <div className="grid grid-cards">
          {works.map((s, i) => <SeriesCard key={s.slug} s={s} seed={i} />)}
        </div>
      )}
    </div>
  );
}
