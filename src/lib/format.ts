export function nFmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".", ",") + "k";
  return String(n);
}

export function dateFmt(ts: number, lang: string): string {
  return new Date(ts * 1000).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(ts: number, lang: string): string {
  const s = Math.floor(Date.now() / 1000) - ts;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 30) return dateFmt(ts, lang);
  if (d >= 1) return lang === "fr" ? `il y a ${d} j` : `${d}d ago`;
  if (h >= 1) return lang === "fr" ? `il y a ${h} h` : `${h}h ago`;
  if (m >= 1) return lang === "fr" ? `il y a ${m} min` : `${m} min ago`;
  return lang === "fr" ? "à l'instant" : "just now";
}

export function coverStyle(series: { coverColor?: string; cover?: string }, seed = 0) {
  if (series.cover) return { backgroundImage: `url(${series.cover})`, backgroundSize: "cover", backgroundPosition: "center" };
  const palettes = [
    ["#ea5427", "#fbd24b"],
    ["#039be5", "#67e8f9"],
    ["#ef4444", "#fca5a5"],
    ["#00dc64", "#4fff8c"],
    ["#a855f7", "#e9d5ff"],
    ["#f97316", "#fdba74"],
    ["#b45309", "#fcd34d"],
    ["#0f766e", "#5eead4"],
    ["#db2777", "#f9a8d4"],
    ["#2563eb", "#93c5fd"],
  ];
  const p = palettes[(seed + (series.coverColor?.length || 0)) % palettes.length];
  return {
    background: `radial-gradient(120% 120% at 20% 0%, ${p[1]}22 0%, transparent 55%), linear-gradient(150deg, ${p[0]} 0%, ${p[1]}66 130%)`,
  };
}
