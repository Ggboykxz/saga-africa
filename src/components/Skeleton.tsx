"use client";

export function SkeletonCard() {
  return <div className="card"><div className="skl skl-card" style={{ borderRadius: 0 }} /></div>;
}

export function SkeletonRow() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="skl" style={{ height: 16, width: "60%", marginBottom: 10 }} />
      <div className="skl" style={{ height: 12, width: "40%" }} />
    </div>
  );
}

export function SkeletonGrid({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cards">
      {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
