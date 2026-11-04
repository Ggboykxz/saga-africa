"use client";

import React from "react";

export function hashStr(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES: string[][] = [
  ["#13181f", "#2a3038", "#ea5427", "#fbd24b", "#fff"],
  ["#0f172a", "#1e293b", "#039be5", "#67e8f9", "#f8fafc"],
  ["#1c1917", "#292524", "#ef4444", "#fca5a5", "#fafaf9"],
  ["#052e2b", "#134e4a", "#00dc64", "#4fff8c", "#ecfdf5"],
  ["#2e1065", "#4c1d95", "#a855f7", "#e9d5ff", "#faf5ff"],
  ["#3f1d0b", "#7c2d12", "#f97316", "#fdba74", "#fff7ed"],
];

const SHAPES = ["mountain", "circle", "rect", "arch", "zigzag", "stripes", "building", "rays", "halo", "drop"];

export type PanelSpec = {
  type: string;
  x: number; y: number; w: number; h: number; rot: number;
  tone: number; ink: boolean; sketch: boolean;
  caption: boolean; speech: boolean;
};
export type PageSpec = { palette: string[]; panels: PanelSpec[] };

export function paletteFor(seed: number): string[] {
  return PALETTES[seed % PALETTES.length];
}

export function pagePanels(chapterKey: string, pageIdx: number, pageCount: number): PageSpec {
  const seed = hashStr(`${chapterKey}#p${pageIdx}`);
  const rnd = mulberry32(seed);
  const palette = paletteFor(hashStr(chapterKey));
  const n = pageIdx === 0 ? 3 : pageIdx === pageCount - 1 ? 2 : 3 + Math.floor(rnd() * 3);
  const panels: PanelSpec[] = [];
  for (let i = 0; i < n; i++) {
    panels.push({
      type: SHAPES[Math.floor(rnd() * SHAPES.length)],
      x: Math.round(rnd() * 18),
      y: Math.round(rnd() * 18),
      w: 18 + Math.round(rnd() * 40),
      h: 14 + Math.round(rnd() * 34),
      rot: Math.round((rnd() - 0.5) * 24),
      tone: Math.floor(rnd() * (palette.length - 2)),
      ink: rnd() < 0.65,
      sketch: rnd() < 0.5,
      caption: rnd() < 0.22,
      speech: rnd() < 0.3 && pageIdx > 0,
    });
  }
  return { palette, panels };
}

const CAPTIONS = [
  "Ensuite…",
  "Plus loin…",
  "Soudain…",
  "Et puis…",
  "Rien. Le silence.",
  "La nuit tombe.",
  "Quelque chose approche.",
];
const SPEECH = ["« Il faut continuer. »", "« Tu entends ? »", "« Attends… »", "« C'est impossible. »", "« Cette fois, c'est la bonne. »"];

function Shape({ p, palette }: { p: PanelSpec; palette: string[] }) {
  const fill = p.ink ? palette[1] : palette[2 + p.tone];
  const sec = p.ink ? palette[2 + p.tone % 2] : palette[1];
  const common = {
    transform: `rotate(${p.rot}deg)`,
    transformOrigin: "50% 50%",
  };
  const opacity = p.sketch ? 0.55 : 1;
  switch (p.type) {
    case "mountain":
      return (
        <path
          d={`M ${p.x} ${p.y + p.h} L ${p.x + p.w / 2} ${p.y} L ${p.x + p.w} ${p.y + p.h} Z`}
          fill={fill} opacity={opacity} {...common}
        />
      );
    case "circle":
      return <circle cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={Math.min(p.w, p.h) / 2} fill={fill} opacity={opacity} {...common} />;
    case "rect":
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.w * 0.06} fill={fill} opacity={opacity} {...common} />;
    case "arch":
      return (
        <path
          d={`M ${p.x} ${p.y + p.h} V ${p.y + p.h * 0.55} A ${p.w / 2} ${p.h * 0.45} 0 0 1 ${p.x + p.w} ${p.y + p.h * 0.55} V ${p.y + p.h} Z`}
          fill={fill} opacity={opacity} {...common}
        />
      );
    case "zigzag":
      return (
        <path
          d={`M ${p.x} ${p.y + p.h} L ${p.x + p.w * 0.25} ${p.y} L ${p.x + p.w * 0.5} ${p.y + p.h} L ${p.x + p.w * 0.75} ${p.y} L ${p.x + p.w} ${p.y + p.h} Z`}
          fill={fill} opacity={opacity} {...common}
        />
      );
    case "stripes":
      return (
        <g opacity={opacity} {...common}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={p.x + i * (p.w / 4)} y={p.y} width={p.w / 6} height={p.h} rx={2} fill={fill} />
          ))}
        </g>
      );
    case "building":
      return (
        <g opacity={opacity} {...common}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={3} fill={fill} />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 3 }).map((__, c) => (
              <rect
                key={r + "-" + c}
                x={p.x + 4 + c * (p.w - 8) / 3}
                y={p.y + 4 + r * (p.h - 8) / 4}
                width={Math.max(2, (p.w - 12) / 4)}
                height={Math.max(2, (p.h - 12) / 6)}
                fill={sec}
              />
            ))
          )}
        </g>
      );
    case "rays":
      return (
        <g opacity={opacity} {...common}>
          {Array.from({ length: 8 }).map((_, i) => (
            <path
              key={i}
              d={`M ${p.x + p.w / 2} ${p.y + p.h / 2} L ${p.x + p.w / 2 + Math.cos((i / 8) * Math.PI * 2) * p.w} ${p.y + p.h / 2 + Math.sin((i / 8) * Math.PI * 2) * p.h}`}
              stroke={fill} strokeWidth={p.w * 0.03} strokeLinecap="round"
            />
          ))}
        </g>
      );
    case "halo":
      return (
        <g opacity={opacity} {...common}>
          <circle cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={Math.min(p.w, p.h) / 2} fill="none" stroke={fill} strokeWidth={p.w * 0.05} />
          <circle cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={Math.min(p.w, p.h) / 4} fill={fill} />
        </g>
      );
    default: // drop
      return (
        <path
          d={`M ${p.x + p.w / 2} ${p.y} Q ${p.x + p.w} ${p.y + p.h * 0.6} ${p.x + p.w / 2} ${p.y + p.h} Q ${p.x} ${p.y + p.h * 0.6} ${p.x + p.w / 2} ${p.y} Z`}
          fill={fill} opacity={opacity} {...common}
        />
      );
  }
}

export function PageArt({ page, width = 720 }: { page: PageSpec; width?: number }) {
  const palette = page.palette;
  const [bg1, bg2] = palette;
  const caption = page.panels.find((p) => p.caption);
  const speech = page.panels.find((p) => p.speech);
  return (
    <svg viewBox="0 0 800 1200" width={width} height={width * 1.5} role="img" aria-label="planche de bande dessinée">
      <defs>
        <linearGradient id="pagebg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
      </defs>
      <rect width="800" height="1200" fill="url(#pagebg)" />
      <g>
        {page.panels.map((p, i) => (
          <Shape key={i} p={p} palette={palette} />
        ))}
      </g>
      {caption && (
        <g>
          <rect x="40" y="34" width="720" height="64" rx="14" fill={palette[1]} opacity="0.82" />
          <text x="400" y="74" textAnchor="middle" fontSize="26" fontWeight="600" fill={palette[4]} fontFamily="Quicksand, sans-serif">
            {CAPTIONS[Math.abs(hashStr(`${caption.x}${caption.y}`)) % CAPTIONS.length]}
          </text>
        </g>
      )}
      {speech && (
        <g>
          <circle cx="620" cy="1030" r="150" fill={palette[4]} opacity="0.92" />
          <circle cx="640" cy="1160" r="34" fill={palette[4]} opacity="0.92" />
          <circle cx="660" cy="1200" r="14" fill={palette[4]} opacity="0.92" />
          <text x="620" y="1010" textAnchor="middle" fontSize="30" fontWeight="600" fill={palette[1]} fontFamily="Quicksand, sans-serif">
            {SPEECH[Math.abs(hashStr(`${speech.x}${speech.y}`)) % SPEECH.length]}
          </text>
        </g>
      )}
    </svg>
  );
}
