// Saga Africa — deterministic page/panel generator for the reader.
// Mirrored in src/lib/panels.ts (same algorithm) so pages are reproducible.

export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PALETTES = [
  ["#13181f", "#2a3038", "#ea5427", "#fbd24b", "#fff"],
  ["#0f172a", "#1e293b", "#039be5", "#67e8f9", "#f8fafc"],
  ["#1c1917", "#292524", "#ef4444", "#fca5a5", "#fafaf9"],
  ["#052e2b", "#134e4a", "#00dc64", "#4fff8c", "#ecfdf5"],
  ["#2e1065", "#4c1d95", "#a855f7", "#e9d5ff", "#faf5ff"],
  ["#3f1d0b", "#7c2d12", "#f97316", "#fdba74", "#fff7ed"],
];

const SHAPE_TYPES = ["mountain", "circle", "rect", "arch", "zigzag", "stripes", "building", "rays", "halo", "drop"];

export function paletteFor(seed) {
  return PALETTES[seed % PALETTES.length];
}

export function pagePanels(chapterKey, pageIdx, pageCount) {
  const seed = hashStr(`${chapterKey}#p${pageIdx}`);
  const rnd = mulberry32(seed);
  const palette = paletteFor(hashStr(chapterKey));
  const n = pageIdx === 0 ? 3 : pageIdx === pageCount - 1 ? 2 : 3 + Math.floor(rnd() * 3);
  const panels = [];
  for (let i = 0; i < n; i++) {
    const type = SHAPE_TYPES[Math.floor(rnd() * SHAPE_TYPES.length)];
    const sketch = rnd() < 0.5;
    const tone = Math.floor(rnd() * (palette.length - 2));
    panels.push({
      type,
      x: Math.round(rnd() * 18),
      y: Math.round(rnd() * 18),
      w: 18 + Math.round(rnd() * 40),
      h: 14 + Math.round(rnd() * 34),
      rot: Math.round((rnd() - 0.5) * 24),
      tone,
      ink: rnd() < 0.65,
      sketch,
      caption: rnd() < 0.22,
      speech: rnd() < 0.3 && pageIdx > 0,
    });
  }
  return { palette, panels };
}

export function chapterPages(seriesSlug, chapterNum, pageCount) {
  const key = `${seriesSlug}::${chapterNum}`;
  const pages = [];
  for (let i = 0; i < pageCount; i++) pages.push(pagePanels(key, i, pageCount));
  return { key, pages };
}

// small caption/speech text bank (bilingual)
export const CAPTIONS = {
  fr: ["Ensuite…", "Plus loin…", "Soudain…", "Et puis…", "Rien. Le silence.", "La nuit tombe.", "Quelque chose approche."],
  en: ["And then…", "Further…", "Suddenly…", "And so…", "Nothing. Silence.", "Night falls.", "Something approaches."],
};
export const SPEECH = {
  fr: ["« Il faut continuer. »", "« Tu entends ? »", "« Attends… »", "« C'est impossible. »", "« Cette fois, c'est la bonne. »"],
  en: ["“We have to keep going.”", "“Do you hear that?”", "“Wait…”", "“That's impossible.”", "“This time, it will work.”"],
};
