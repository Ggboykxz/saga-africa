import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8788";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/catalog`, lastModified: new Date() },
    { url: `${BASE}/creators`, lastModified: new Date() },
    { url: `${BASE}/publish`, lastModified: new Date() },
    { url: `${BASE}/sign-in`, lastModified: new Date() },
    { url: `${BASE}/terms`, lastModified: new Date() },
    { url: `${BASE}/privacy`, lastModified: new Date() },
  ];
  try {
    const res = await fetch(`${API}/api/series?sort=views&limit=200`, { next: { revalidate: 3600 } });
    const d = await res.json();
    const series = (d?.series || []).map((s: { slug: string; updatedAt: number }) => ({
      url: `${BASE}/series/${s.slug}`,
      lastModified: new Date(s.updatedAt * 1000),
    }));
    return [...staticRoutes, ...series];
  } catch {
    return staticRoutes;
  }
}
