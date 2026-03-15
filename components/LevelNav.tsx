import Link from 'next/link';
import type { EntityLevel } from '@/types/pulse';

const LEVELS: { value: EntityLevel; label: string }[] = [
  { value: 'division', label: 'Divisions' },
  { value: 'union', label: 'Unions' },
  { value: 'conference', label: 'Conferences' },
];

interface LevelNavProps {
  currentLevel: EntityLevel;
  currentMetric: string;
}

export function LevelNav({ currentLevel, currentMetric }: LevelNavProps) {
  return (
    <div className="flex gap-1 bg-white dark:bg-[#1f2b3d] rounded-lg p-1 w-fit border border-gray-200 dark:border-transparent">
      {LEVELS.map(({ value, label }) => (
        <Link
          key={value}
          href={`/rankings?level=${value}&metric=${currentMetric}`}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            value === currentLevel
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
