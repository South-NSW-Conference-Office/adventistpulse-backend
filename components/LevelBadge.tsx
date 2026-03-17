import type { EntityLevel } from '@/types/pulse';

const LEVEL_CONFIG: Record<EntityLevel, { label: string; color: string }> = {
  gc: { label: 'GC', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  division: { label: 'Division', color: 'bg-[#6366F1]/20 text-[#8b5cf6] border-[#6366F1]/30' },
  union: { label: 'Union', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  conference: { label: 'Conference', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  mission: { label: 'Mission', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  church: { label: 'Church', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  field: { label: 'Field', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  section: { label: 'Section', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  field_station: { label: 'Field Station', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
};

interface LevelBadgeProps {
  level: EntityLevel;
  size?: 'sm' | 'md';
}

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.conference;
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wider ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
