'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProjectionResult, ScenarioContext, CriticalMilestone } from '@/lib/projections';
import { AlertTriangle } from 'lucide-react'

interface Props {
  projections: ProjectionResult;
  entityName: string;
  entityCode: string;
  currentMembership: number;
  latestYear: number;
}

type Horizon = '5' | '20' | '50';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatRate(r: number): string {
  return (r >= 0 ? '+' : '') + (r * 100).toFixed(1) + '%';
}

function ScenarioCard({ scenario, color, dotClass }: { scenario: ScenarioContext; color: string; dotClass: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-3 ${color}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
            <span className="text-xs font-medium text-gray-900 dark:text-slate-200">{scenario.label}</span>
            <span className="text-xs text-slate-500">{formatRate(scenario.rate)}/yr</span>
          </div>
          <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{scenario.description}</p>
      </button>
      {expanded && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-[#2a3a50]">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">What would need to happen</p>
          <ul className="space-y-1">
            {scenario.actions.map((action, i) => (
              <li key={i} className="text-[11px] text-slate-400 flex gap-1.5">
                <span className="text-slate-600 mt-0.5">›</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProjectionsChart({ projections, entityName, entityCode, currentMembership, latestYear }: Props) {
  const [horizon, setHorizon] = useState<Horizon>('20');
  const { points5, points20, points50, extinctionYear, milestones, scenarios, insights, currentRate } = projections;

  const points = horizon === '5' ? points5 : horizon === '20' ? points20 : points50;
  if (points.length === 0) return null;

  // SVG dimensions
  const W = 600, H = 260, PL = 55, PR = 40, PT = 20, PB = 30;
  const cW = W - PL - PR, cH = H - PT - PB;

  const allVals = [currentMembership, ...points.flatMap(p => [p.current, p.moderate, p.revival])];
  const maxV = Math.max(...allVals) * 1.1;
  const minV = Math.max(0, Math.min(...allVals) * 0.9);
  const range = maxV - minV || 1;

  const x = (i: number) => PL + (i / points.length) * cW;
  const y = (v: number) => PT + cH - ((v - minV) / range) * cH;

  const makePath = (getter: (p: typeof points[0]) => number) =>
    `M ${PL} ${y(currentMembership)} ` + points.map((p, i) => `L ${x(i + 1)} ${y(getter(p))}`).join(' ');

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => minV + (range / yTicks) * i);
  const xStep = Math.max(1, Math.floor(points.length / 5));

  const endCurrent = points[points.length - 1].current;
  const endModerate = points[points.length - 1].moderate;
  const endRevival = points[points.length - 1].revival;

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-slate-500">Membership Projections</h2>
          {milestones.length > 0 && (
            <p className="text-xs text-red-400 mt-1">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" />{milestones[0].label} by {milestones[0].year} ({milestones[0].yearsFromNow} years)
            </p>
          )}
        </div>
        <div className="flex bg-[#F8F9FA] dark:bg-[#1a2332] border border-gray-200 dark:border-[#2a3a50] rounded-lg overflow-hidden">
          {(['5', '20', '50'] as Horizon[]).map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                horizon === h ? 'bg-[#14b8a6]/20 text-[#14b8a6]' : 'text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              {h}yr
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '260px' }}>
        {/* Grid */}
        {yLabels.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="#2a3a50" strokeWidth="0.5" />
            <text x={PL - 5} y={y(v) + 3} textAnchor="end" fill="#64748b" fontSize="9">{formatNum(Math.round(v))}</text>
          </g>
        ))}

        {/* X labels */}
        {points.filter((_, i) => i % xStep === 0 || i === points.length - 1).map((p) => {
          const idx = points.indexOf(p);
          return <text key={idx} x={x(idx + 1)} y={H - 5} textAnchor="middle" fill="#64748b" fontSize="9">{p.year}</text>;
        })}

        {/* Revival band fill */}
        <path
          d={`M ${PL} ${y(currentMembership)} ${points.map((p, i) => `L ${x(i + 1)} ${y(p.revival)}`).join(' ')} L ${x(points.length)} ${y(endCurrent)} ${[...points].reverse().map((p, i) => `L ${x(points.length - i)} ${y(p.current)}`).join(' ')} Z`}
          fill="#10b981" fillOpacity="0.04"
        />

        {/* Lines */}
        <path d={makePath(p => p.current)} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray={currentRate < 0 ? '6,3' : 'none'} />
        <path d={makePath(p => p.moderate)} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
        <path d={makePath(p => p.revival)} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" />

        {/* Today dot */}
        <circle cx={PL} cy={y(currentMembership)} r="4" fill="#14b8a6" />

        {/* End labels */}
        <text x={W - PR + 3} y={y(endCurrent) + 3} fill="#ef4444" fontSize="8" fontWeight="600">{formatNum(endCurrent)}</text>
        <text x={W - PR + 3} y={y(endModerate) + 3} fill="#f59e0b" fontSize="8" fontWeight="600">{formatNum(endModerate)}</text>
        <text x={W - PR + 3} y={y(endRevival) + 3} fill="#10b981" fontSize="8" fontWeight="600">{formatNum(endRevival)}</text>
      </svg>

      {/* Critical milestones timeline */}
      {milestones.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#2a3a50]">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Critical Milestones at Current Trajectory</h3>
          <div className="space-y-1.5">
            {milestones.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-red-400 font-mono w-10 text-right">{m.year}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">{m.label}</span>
                <span className="text-slate-600 text-[10px]">({m.yearsFromNow}yr)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario cards — the "somewhere to go" */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <ScenarioCard scenario={scenarios.current} color="border-red-500/30 bg-red-500/5" dotClass="bg-red-500" />
        <ScenarioCard scenario={scenarios.moderate} color="border-yellow-500/30 bg-yellow-500/5" dotClass="bg-yellow-500" />
        <ScenarioCard scenario={scenarios.revival} color="border-emerald-500/30 bg-emerald-500/5" dotClass="bg-emerald-500" />
      </div>

      {/* Deep-link to Vital Signs */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#2a3a50] flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-1">
          {insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-[11px] text-slate-400">{insight}</p>
          ))}
        </div>
        <Link
          href={`/vital-signs/${entityCode}`}
          className="text-xs text-[#14b8a6] hover:text-[#8b5cf6] transition-colors whitespace-nowrap flex items-center gap-1"
        >
          Read full analysis in Vital Signs <span>→</span>
        </Link>
      </div>
    </div>
  );
}
