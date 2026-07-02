"use client";

// Gráficos SVG leves, sem dependências externas.

export interface Point {
  x: number;
  y: number;
  label?: string;
}

// Gráfico de linha simples (peso, massa magra ao longo do tempo).
export function LineChart({
  series,
  height = 160,
  yUnit = "",
}: {
  series: { name: string; color: string; points: Point[] }[];
  height?: number;
  yUnit?: string;
}) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Sem dados ainda.</p>;
  }
  const w = 320;
  const padL = 34;
  const padB = 18;
  const padT = 8;
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;
  const rangeX = maxX - minX || 1;

  const sx = (x: number) => padL + ((x - minX) / rangeX) * (w - padL - 6);
  const sy = (y: number) => padT + (1 - (y - minY) / rangeY) * (height - padT - padB);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img">
        {/* eixo Y: min / max */}
        {[maxY, minY].map((v, i) => (
          <g key={i}>
            <text x={2} y={sy(v) + 3} className="fill-slate-400 text-[9px]">
              {round(v)}
            </text>
            <line
              x1={padL}
              x2={w}
              y1={sy(v)}
              y2={sy(v)}
              className="stroke-slate-100"
              strokeWidth={1}
            />
          </g>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            />
            {s.points.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name} {yUnit}
          </span>
        ))}
      </div>
    </div>
  );
}

// Dispersão intensidade (0–3) × dias desde a dose — padrão pós-titulação.
export function ScatterChart({
  points,
  color = "#0d9488",
  height = 150,
}: {
  points: Point[];
  color?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Sem registros com dose associada ainda.
      </p>
    );
  }
  const w = 320;
  const padL = 24;
  const padB = 22;
  const maxX = Math.max(6, ...points.map((p) => p.x));
  const sx = (x: number) => padL + (x / maxX) * (w - padL - 8);
  const sy = (y: number) => 8 + (1 - y / 3) * (height - 8 - padB);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img">
        {[0, 1, 2, 3].map((y) => (
          <g key={y}>
            <line x1={padL} x2={w} y1={sy(y)} y2={sy(y)} className="stroke-slate-100" strokeWidth={1} />
            <text x={2} y={sy(y) + 3} className="fill-slate-400 text-[9px]">
              {y}
            </text>
          </g>
        ))}
        {Array.from({ length: maxX + 1 }, (_, d) => (
          <text key={d} x={sx(d)} y={height - 6} className="fill-slate-400 text-[8px]" textAnchor="middle">
            {d}
          </text>
        ))}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={color} fillOpacity={0.6} />
        ))}
      </svg>
      <p className="mt-1 text-center text-[10px] text-slate-400">dias desde a dose →</p>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
