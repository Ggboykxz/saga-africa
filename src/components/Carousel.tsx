"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "./icons";

export function Carousel({ children, label }: { children: ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={ref}
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 14,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 8,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="carousel"
      >
        {children}
      </div>
      <button
        onClick={() => scrollBy(-1)}
        aria-label={label ? `${label} — précédent` : "Précédent"}
        className="btn btn-sm btn-ghost btn-icon"
        style={{ position: "absolute", left: -6, top: "42%", zIndex: 3, background: "var(--bg-elev)", boxShadow: "var(--shadow-2)" }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label={label ? `${label} — suivant` : "Suivant"}
        className="btn btn-sm btn-ghost btn-icon"
        style={{ position: "absolute", right: -6, top: "42%", zIndex: 3, background: "var(--bg-elev)", boxShadow: "var(--shadow-2)" }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
