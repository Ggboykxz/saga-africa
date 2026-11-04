"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api, type Comment } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { Heart } from "./icons";

export function Comments({ slug, chapterId }: { slug: string; chapterId?: number }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    api.get<{ user: { username: string } | null }>("/api/auth/me").then((d) => setMe(d.user?.username ?? null)).catch(() => {});
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const refresh = () => {
    api.get<{ comments: Comment[] }>(`/api/series/${slug}/comments`).then((d) => setItems(d.comments)).catch(() => {});
  };

  const send = async () => {
    if (!body.trim()) return;
    try {
      await api.post(`/api/series/${slug}/comments`, { body, chapterId });
      setBody("");
      refresh();
    } catch (e) {
      alert(t("comments_signin"));
    }
  };

  const sendReply = async (parentId: number) => {
    if (!replyBody.trim()) return;
    await api.post(`/api/series/${slug}/comments`, { body: replyBody, parentId });
    setReplyBody("");
    setReplyTo(null);
    refresh();
  };

  const like = async (id: number) => {
    try { await api.post(`/api/comments/${id}/like`); refresh(); } catch { alert(t("comments_signin")); }
  };

  return (
    <div>
      <h3 className="title-md" style={{ marginBottom: 14 }}>{t("comments_title")} <span className="muted small">({items.length})</span></h3>

      <div className="row" style={{ alignItems: "flex-start", marginBottom: 20 }}>
        <input
          className="input grow"
          placeholder={t("comments_ph")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" onClick={send}>{t("comments_send")}</button>
      </div>

      {items.length === 0 && <p className="muted small">{t("comments_empty")}</p>}

      {items.map((c) => (
        <div key={c.id} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, marginBottom: 12 }}>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5 }}>
              {c.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.username}</div>
              <div className="tiny muted">{timeAgo(c.created_at, "fr")}</div>
            </div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 14.5 }}>{c.body}</p>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => like(c.id)}><Heart size={15} /> {c.likes}</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>{t("comments_reply")}</button>
          </div>
          {replyTo === c.id && (
            <div className="row" style={{ marginTop: 10 }}>
              <input className="input grow" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder={t("comments_ph")} />
              <button className="btn btn-primary btn-sm" onClick={() => sendReply(c.id)}>{t("comments_send")}</button>
            </div>
          )}
          {c.replies?.map((r) => (
            <div key={r.id} style={{ borderLeft: "2px solid var(--line-strong)", paddingLeft: 12, marginTop: 10 }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.username}</span>
                <span className="tiny muted">{timeAgo(r.created_at, "fr")}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>{r.body}</p>
              <button className="btn btn-sm btn-ghost" style={{ padding: "4px 10px", marginTop: 4 }} onClick={() => like(r.id)}><Heart size={14} /> {r.likes}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
