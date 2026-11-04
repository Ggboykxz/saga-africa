import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8788";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/api/series/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const d = await res.json();
    const s = d?.series;
    if (!s) return {};
    return {
      title: `${s.title} — Saga Africa`,
      description: (s.synopsis || "").slice(0, 160),
      openGraph: {
        title: s.title,
        description: (s.synopsis || "").slice(0, 160),
        type: "website",
        siteName: "Saga Africa",
      },
    };
  } catch {
    return {};
  }
}

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
