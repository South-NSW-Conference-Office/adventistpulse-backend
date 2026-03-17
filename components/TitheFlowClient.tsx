'use client';

import { useState } from 'react';
import { tokens, cn } from '@/lib/theme';
import { Info } from 'lucide-react';

interface Division {
  code: string;
  name: string;
  conference_retention_pct: number;
  union_pct: number;
  division_pct: number;
  gc_pct: number;
  retirement_pct: number;
  special_assistance_fund_pct?: number;
  special_funds?: string;
  source?: string;
  confidence?: string;
  notes?: string;
}

interface Props {
  divisions: Division[];
  gcPlan?: {
    description: string;
    nad_sends_to_gc_pct: number;
  };
}

const FLOW_SEGMENTS = [
  { key: 'conference_retention_pct', label: 'Conference', color: '#6366F1', desc: 'Stays at your local conference for ministry operations, pastoral salaries, and local programs.' },
  { key: 'union_pct',               label: 'Union',      color: '#818CF8', desc: 'Flows up to the Union Conference for coordination across multiple conferences in a region.' },
  { key: 'division_pct',            label: 'Division',   color: '#A5B4FC', desc: 'Supports the Division office (e.g. SPD, NAD) covering a large geographic territory.' },
  { key: 'gc_pct',                  label: 'GC',         color: '#C7D2FE', desc: 'Reaches the General Conference for global mission, publishing, health, and education.' },
  { key: 'retirement_pct',          label: 'Retirement', color: '#E0E7FF', desc: 'Funds denominational retirement and pension plans for workers.' },
];

export function TitheFlowClient({ divisions, gcPlan }: Props) {
  const [selected, setSelected] = useState<string>(divisions[0]?.code || '');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const div = divisions.find(d => d.code === selected) || divisions[0];

  if (!div) return null;

  const segments = FLOW_SEGMENTS.map(s => ({
    ...s,
    pct: (div as any)[s.key] as number || 0,
  })).filter(s => s.pct > 0);

  return (
    <div className="space-y-8">
      {/* Division selector */}
      <div className="flex flex-wrap gap-2">
        {divisions.map(d => (
          <button
            key={d.code}
            onClick={() => setSelected(d.code)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              selected === d.code
                ? 'bg-[#6366F1] text-white border-[#6366F1]'
                : cn('hover:border-[#6366F1]/50', tokens.bg.card, tokens.border.default, tokens.text.body)
            )}
          >
            {d.code}
          </button>
        ))}
      </div>

      {/* Division name + confidence */}
      <div>
        <h2 className={cn('text-xl font-bold', tokens.text.heading)}>{div.name}</h2>
        {div.confidence && (
          <span className={cn('text-xs mt-1', tokens.text.muted)}>
            Data confidence: {div.confidence}
          </span>
        )}
      </div>

      {/* Flow bar */}
      <div>
        <p className={cn('text-sm font-medium mb-3', tokens.text.muted)}>For every $100 of tithe:</p>
        <div className="flex rounded-xl overflow-hidden h-14 w-full">
          {segments.map(seg => (
            <div
              key={seg.key}
              className="flex items-center justify-center cursor-pointer transition-all"
              style={{
                width: `${seg.pct}%`,
                backgroundColor: seg.color,
                opacity: hoveredSegment && hoveredSegment !== seg.key ? 0.5 : 1,
              }}
              onMouseEnter={() => setHoveredSegment(seg.key)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {seg.pct >= 8 && (
                <span className="text-xs font-bold text-[#312E81]">
                  ${seg.pct.toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {segments.map(seg => (
            <div
              key={seg.key}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredSegment(seg.key)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className={cn('text-sm', hoveredSegment === seg.key ? 'font-semibold' : '', tokens.text.body)}>
                {seg.label}: <strong>${seg.pct.toFixed(1)}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover description */}
      {hoveredSegment && (
        <div className={cn('rounded-xl p-4 border text-sm flex gap-3', tokens.bg.card, tokens.border.default)}>
          <Info className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
          <p className={tokens.text.body}>
            {FLOW_SEGMENTS.find(s => s.key === hoveredSegment)?.desc}
          </p>
        </div>
      )}

      {/* Breakdown cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={cn('rounded-xl p-5 border', tokens.bg.card, tokens.border.default)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className={cn('text-xs font-bold uppercase tracking-wider', tokens.text.muted)}>{seg.label}</span>
            </div>
            <div className="text-3xl font-extrabold text-[#6366F1] mb-1">${seg.pct.toFixed(1)}</div>
            <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>{seg.desc}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {div.special_funds && (
        <div className={cn('rounded-xl p-5 border text-sm', tokens.bg.card, tokens.border.default)}>
          <p className={cn('font-semibold mb-1', tokens.text.heading)}>Additional Notes</p>
          <p className={tokens.text.body}>{div.special_funds}</p>
        </div>
      )}

      {div.notes && (
        <div className={cn('rounded-xl p-5 border text-sm', tokens.bg.card, tokens.border.default)}>
          <p className={cn('font-semibold mb-1', tokens.text.heading)}>Methodology</p>
          <p className={tokens.text.body}>{div.notes}</p>
        </div>
      )}

      {/* GC Parity Plan */}
      {gcPlan && (
        <div className={cn('rounded-xl p-5 border', tokens.bg.card, tokens.border.default)}>
          <p className={cn('font-bold mb-2', tokens.text.heading)}>About the GC Tithe Parity Plan</p>
          <p className={cn('text-sm', tokens.text.body)}>{gcPlan.description}</p>
        </div>
      )}
    </div>
  );
}
