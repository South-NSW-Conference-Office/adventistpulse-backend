'use client';

import { useEffect, useState, useMemo } from 'react';

interface CountryData {
  country: string;
  population: number;
  adventist_members: number;
  churches: number;
  division: string;
  ratio: number;
  presence: 'established' | 'limited' | 'minimal' | 'none';
}

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

const PRESENCE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  none:    { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500' },
  minimal: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
  limited: { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400' },
};

const PRESENCE_LABEL: Record<string, string> = {
  none: 'No presence', minimal: 'Minimal', limited: 'Limited',
};

// ── Stat number component (used in the left column) ──────────────────────────
export function UnreachedStat({
  statKey, title, desc,
}: {
  statKey: 'unreached' | 'population' | 'zero';
  title: string;
  desc: string;
}) {
  const [countries, setCountries] = useState<CountryData[]>([]);

  useEffect(() => {
    fetch('/data/country-mission-data.json')
      .then(r => r.json())
      .then(data => {
        const unreached = data.countries.filter(
          (c: CountryData) =>
            (c.presence === 'none' || c.presence === 'minimal' || c.presence === 'limited') &&
            c.population > 5000
        );
        setCountries(unreached);
      });
  }, []);

  const value = useMemo(() => {
    if (!countries.length) return '—';
    if (statKey === 'unreached') return countries.length.toString();
    if (statKey === 'population') return formatPop(countries.reduce((s, c) => s + c.population, 0));
    if (statKey === 'zero') return countries.filter(c => c.presence === 'none').length.toString();
    return '—';
  }, [countries, statKey]);

  return (
    <>
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
        <p className="text-base font-semibold text-gray-800">{title}</p>
      </div>
      <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-xs">{desc}</p>
    </>
  );
}

// ── Main card-list table ──────────────────────────────────────────────────────
export function UnreachedTable() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [filter, setFilter] = useState<'all' | 'none' | 'minimal' | 'limited'>('all');

  useEffect(() => {
    fetch('/data/country-mission-data.json')
      .then(r => r.json())
      .then(data => {
        const unreached = data.countries
          .filter((c: CountryData) =>
            (c.presence === 'none' || c.presence === 'minimal' || c.presence === 'limited') &&
            c.population > 5000
          )
          .sort((a: CountryData, b: CountryData) => b.population - a.population);
        setCountries(unreached);
      });
  }, []);

  const filtered = useMemo(() =>
    filter === 'all' ? countries : countries.filter(c => c.presence === filter),
    [countries, filter]
  );

  const noneCount    = countries.filter(c => c.presence === 'none').length;
  const minimalCount = countries.filter(c => c.presence === 'minimal').length;
  const limitedCount = countries.filter(c => c.presence === 'limited').length;

  if (!countries.length) return null;

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">

      {/* Filter pills */}
      <div className="flex gap-2 px-5 pt-5 pb-3 flex-wrap">
        {([
          ['all',     `All (${countries.length})`],
          ['none',    `No Presence (${noneCount})`],
          ['minimal', `Minimal (${minimalCount})`],
          ['limited', `Limited (${limitedCount})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === key
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Country rows */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {filtered.map((c) => {
          const p = PRESENCE_COLORS[c.presence];
          return (
            <div key={c.country} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">

              {/* Dot + country */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.country}</p>
                  <p className="text-[11px] text-gray-400">{c.division}</p>
                </div>
              </div>

              {/* Population */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900 tabular-nums">{formatPop(c.population)}</p>
                <p className="text-[11px] text-gray-400">population</p>
              </div>

              {/* Status badge */}
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${p.bg} ${p.text}`}>
                {PRESENCE_LABEL[c.presence]}
              </span>

            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 italic text-center">
          "Go ye therefore, and teach all nations" — Matthew 28:19
        </p>
      </div>
    </div>
  );
}
