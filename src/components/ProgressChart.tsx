type Attempt = { quizId: string; at: string; correct: number; total: number };

export default function ProgressChart({ attempts }: { attempts: Attempt[] }) {
  // attempts arrive newest first; chart oldest to newest
  const pts = [...attempts].reverse().map((a) => ({
    pct: a.total ? Math.round((a.correct / a.total) * 100) : 0,
    label: `${a.correct}/${a.total}`,
  }));
  if (!pts.length) return null;

  const W = 400,
    H = 150,
    L = 32,
    R = 14,
    T = 14,
    B = 26;
  const x = (i: number) =>
    pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1);
  const y = (p: number) => T + ((100 - p) * (H - T - B)) / 100;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.pct)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-md"
      role="img"
      aria-label="Quiz score percentage across attempts"
    >
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={L - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#6b7280">
            {g}%
          </text>
        </g>
      ))}
      {pts.length > 1 && (
        <path d={line} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      )}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.pct)} r="4" fill="#2563eb" />
          <text x={x(i)} y={y(p.pct) - 8} textAnchor="middle" fontSize="9" fill="#111827">
            {p.pct}%
          </text>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">
            #{i + 1} ({p.label})
          </text>
        </g>
      ))}
    </svg>
  );
}