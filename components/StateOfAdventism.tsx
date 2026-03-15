import Link from 'next/link';
import type { EntityWithStats } from '@/types/pulse';

interface Props {
  divisions: EntityWithStats[];
  gcStats: any;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function StateOfAdventism({ divisions, gcStats }: Props) {
  const growing = divisions.filter(d => (d.latestYear?.membership?.growthRate ?? 0) > 0);
  const declining = divisions.filter(d => (d.latestYear?.membership?.growthRate ?? 0) < 0);
  const totalBaptisms = divisions.reduce((sum, d) => sum + (d.latestYear?.membership?.baptisms ?? 0), 0);

  const fastestGrowing = [...divisions]
    .filter(d => d.latestYear?.membership?.growthRate != null)
    .sort((a, b) => (b.latestYear?.membership?.growthRate ?? 0) - (a.latestYear?.membership?.growthRate ?? 0))
    .slice(0, 4);

  const fastestDeclining = [...divisions]
    .filter(d => (d.latestYear?.membership?.growthRate ?? 0) < 0)
    .sort((a, b) => (a.latestYear?.membership?.growthRate ?? 0) - (b.latestYear?.membership?.growthRate ?? 0))
    .slice(0, 4);

  const shortName = (name: string) => name.replace(/\s*(Division|Union)$/i, '');

  return (
    <div className="bg-white py-20">

      {/* Divider */}
      <div className="flex items-center gap-4 mb-16">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">State of Adventism</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Centered headline */}
      <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 text-center tracking-tight mb-4">
        The pulse of the <span className="text-teal-500">global church.</span>
      </h2>
      <p className="text-base text-gray-400 text-center max-w-xl mx-auto leading-relaxed mb-4">
        A live snapshot of Adventist growth, health, and momentum across every world division — updated with the latest available data.
      </p>
      <div className="text-center mb-16">
        <Link href="/at-risk" className="inline-flex items-center gap-1 text-sm font-semibold text-[#14b8a6] hover:underline">
          View all at-risk entities →
        </Link>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { value: fmt(gcStats?.membership), label: 'Total Members' },
          { value: fmt(totalBaptisms), label: 'Baptisms' },
          { value: `${growing.length}/${divisions.length}`, label: 'Divisions Growing' },
          { value: `${declining.length}/${divisions.length}`, label: 'Divisions Declining' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <p className="text-3xl font-extrabold tabular-nums text-gray-900 mb-2">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column: growing vs declining */}
      <div className="grid md:grid-cols-2 gap-12">

        {/* Fastest Growing */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">Fastest Growing</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="space-y-1">
            {fastestGrowing.map((div, i) => {
              const rate = div.latestYear?.membership?.growthRate ?? 0;
              const membership = div.latestYear?.membership?.ending;
              return (
                <Link key={div.code} href={`/entity/${div.code}`}>
                  <div className="flex items-center gap-4 py-3 border-b border-gray-100 group">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.08),-2px_-2px_8px_rgba(255,255,255,0.9)]">
                      <span className={`text-lg font-black ${i === 0 ? 'text-[#14b8a6]' : 'text-gray-300'}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-[#14b8a6] transition-colors truncate">{shortName(div.name)}</p>
                      <p className="text-xs text-gray-400 tabular-nums mt-0.5">{fmt(membership)} members</p>
                    </div>
                    <span className="text-sm font-bold text-green-500 tabular-nums shrink-0">+{rate.toFixed(1)}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Needs Attention */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">Needs Attention</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="space-y-1">
            {fastestDeclining.length > 0 ? fastestDeclining.map((div, i) => {
              const rate = div.latestYear?.membership?.growthRate ?? 0;
              const membership = div.latestYear?.membership?.ending;
              return (
                <Link key={div.code} href={`/entity/${div.code}`}>
                  <div className="flex items-center gap-4 py-3 border-b border-gray-100 group">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.08),-2px_-2px_8px_rgba(255,255,255,0.9)]">
                      <span className={`text-lg font-black ${i === 0 ? 'text-red-400' : 'text-gray-300'}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-red-400 transition-colors truncate">{shortName(div.name)}</p>
                      <p className="text-xs text-gray-400 tabular-nums mt-0.5">{fmt(membership)} members</p>
                    </div>
                    <span className="text-sm font-bold text-red-400 tabular-nums shrink-0">{rate.toFixed(1)}%</span>
                  </div>
                </Link>
              );
            }) : null}
          </div>

        </div>

      </div>
    </div>
  );
}
