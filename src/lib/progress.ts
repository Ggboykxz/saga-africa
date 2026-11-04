// Reading progress — stored per series, per chapter (localStorage).

export type Progress = { number: number; pct: number; at: number };

type SeriesProgress = Record<string, Progress>;

function readAll(): SeriesProgress {
  try {
    return JSON.parse(localStorage.getItem("saga_progress") || "{}");
  } catch {
    return {};
  }
}

export function getProgress(seriesSlug: string): Progress | null {
  return readAll()[seriesSlug] ?? null;
}

export function setProgress(seriesSlug: string, chapterNumber: number, pct: number) {
  const all = readAll();
  all[seriesSlug] = { number: chapterNumber, pct: Math.max(0, Math.min(99, Math.round(pct))), at: Date.now() };
  try {
    localStorage.setItem("saga_progress", JSON.stringify(all));
  } catch {}
}

export function clearProgress(seriesSlug: string) {
  const all = readAll();
  delete all[seriesSlug];
  try {
    localStorage.setItem("saga_progress", JSON.stringify(all));
  } catch {}
}
