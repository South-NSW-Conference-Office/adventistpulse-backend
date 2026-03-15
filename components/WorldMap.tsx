'use client';

/**
 * Harvest Map — World map with divisions coloured by growth rate.
 * Uses simplified SVG paths for the 13 division territories.
 * Green = growing, Red = declining, intensity shows magnitude.
 */

import { useRouter } from 'next/navigation';

interface DivisionMapData {
  code: string;
  name: string;
  growthRate: number | null;
  membership: number | null;
  // Approximate center coordinates for label placement (percentage of viewBox)
  cx: number;
  cy: number;
}

function growthColor(rate: number | null): string {
  if (rate === null) return '#1e293b';
  if (rate > 5) return '#059669';   // strong green
  if (rate > 2) return '#10b981';   // green
  if (rate > 0) return '#6ee7b7';   // light green
  if (rate > -1) return '#fbbf24';  // amber
  if (rate > -3) return '#f87171';  // red
  return '#dc2626';                  // strong red
}

function fmt(n: number | null): string {
  if (n === null) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

// Division approximate positions on world map (% of 1000x500 viewBox)
const DIVISION_POSITIONS: Record<string, { cx: number; cy: number }> = {
  NAD: { cx: 180, cy: 170 },
  IAD: { cx: 230, cy: 270 },
  SAD: { cx: 310, cy: 350 },
  EUD: { cx: 490, cy: 150 },
  TED: { cx: 530, cy: 110 },
  ECD: { cx: 560, cy: 280 },
  ESD: { cx: 600, cy: 140 },
  WAD: { cx: 470, cy: 260 },
  SID: { cx: 540, cy: 370 },
  SUD: { cx: 680, cy: 220 },
  NSD: { cx: 770, cy: 180 },
  SSD: { cx: 770, cy: 290 },
  SPD: { cx: 830, cy: 380 },
};

export function WorldMap({ divisions }: { divisions: DivisionMapData[] }) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 uppercase tracking-wider">Harvest Map</h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Growing</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Stagnant</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-red-500 inline-block" /> Declining</span>
        </div>
      </div>

      <svg viewBox="0 0 1000 500" className="w-full h-auto">
        {/* Simplified world outline */}
        <rect x="0" y="0" width="1000" height="500" fill="#020617" rx="8" />
        
        {/* Grid lines */}
        {[100, 200, 300, 400].map(y => (
          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#0f172a" strokeWidth="0.5" />
        ))}
        {[200, 400, 600, 800].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#0f172a" strokeWidth="0.5" />
        ))}

        {/* Equator */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

        {/* Division bubbles */}
        {divisions.map(div => {
          const pos = DIVISION_POSITIONS[div.code];
          if (!pos) return null;
          
          // Bubble size based on membership
          const maxMem = Math.max(...divisions.map(d => d.membership || 0));
          const radius = 15 + (div.membership || 0) / maxMem * 35;
          const color = growthColor(div.growthRate);

          return (
            <g
              key={div.code}
              className="cursor-pointer"
              onClick={() => router.push(`/entity/${div.code}`)}
            >
              {/* Glow */}
              <circle cx={pos.cx} cy={pos.cy} r={radius + 4} fill={color} opacity="0.15" />
              {/* Main bubble */}
              <circle cx={pos.cx} cy={pos.cy} r={radius} fill={color} opacity="0.6" stroke={color} strokeWidth="1.5" />
              {/* Code label */}
              <text x={pos.cx} y={pos.cy - 6} textAnchor="middle" className="fill-white text-[11px] font-bold" style={{ pointerEvents: 'none' }}>
                {div.code}
              </text>
              {/* Membership */}
              <text x={pos.cx} y={pos.cy + 8} textAnchor="middle" className="fill-white/70 text-[9px]" style={{ pointerEvents: 'none' }}>
                {fmt(div.membership)}
              </text>
              {/* Growth rate */}
              <text x={pos.cx} y={pos.cy + 20} textAnchor="middle" className="fill-white/50 text-[8px]" style={{ pointerEvents: 'none' }}>
                {div.growthRate !== null ? `${div.growthRate > 0 ? '+' : ''}${div.growthRate.toFixed(1)}%` : ''}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-slate-600 mt-2 text-center">Click any division to explore. Bubble size = membership. Color = growth rate.</p>
    </div>
  );
}
