export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8788";

export type Series = {
  id: number;
  slug: string;
  title: string;
  titleEn: string;
  synopsis: string;
  synopsisEn: string;
  format: "manga" | "webtoon" | "nolovel" | "lightnovel" | "artbook";
  formatLabel: string;
  status: "ongoing" | "hiatus" | "completed";
  access: "free" | "paying";
  origin: "canvas" | "original";
  cover: string;
  coverColor: string;
  language: string;
  warned: boolean;
  warningPegi: string;
  createdAt: number;
  updatedAt: number;
  genres: string[];
  tags: string[];
  stats: { likes: number; follows: number; comments: number; chapters: number; views: number; views7: number };
  author: { username: string; avatar: string };
  userState: { liked: boolean; followed: boolean; isOwner: boolean };
};

export type Chapter = {
  id: number;
  series_id: number;
  number: number;
  title: string;
  title_en: string;
  pages: number;
  created_at: number;
  is_publish?: number;
  views?: number;
};

export type Comment = {
  id: number;
  series_id: number;
  chapter_id: number | null;
  user_id: number;
  parent_id: number | null;
  body: string;
  likes: number;
  created_at: number;
  username: string;
  avatar: string;
  replies?: Comment[];
};

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try { const d = await res.json(); msg = d.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${API}${path}`, { credentials: "include" }).then((r) => j<T>(r));
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then((r) => j<T>(r));
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => j<T>(r));
  },
  del<T>(path: string): Promise<T> {
    return fetch(`${API}${path}`, { method: "DELETE", credentials: "include" }).then((r) => j<T>(r));
  },
};

export type Me = { id: number; username: string; email: string; avatar: string; bio: string; role: string } | null;
