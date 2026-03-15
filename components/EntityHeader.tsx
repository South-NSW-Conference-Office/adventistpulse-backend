import Link from 'next/link';
import type { YearbookEntity } from '@/lib/yearbook';
import { LevelBadge } from './LevelBadge';
import { linkEntities, type TextSegment } from '@/lib/entity-linker';

interface EntityHeaderProps {
  name: string;
  code: string;
  level: string;
  parentCode?: string;
  parentName?: string;
  yearbook?: YearbookEntity | null;
  quickStats?: {
    membership?: number | null;
    churches?: number | null;
    year?: number;
  };
  /** All entities in the system — used for auto-linking names */
  allEntities?: { code: string; name: string; level: string }[];
  /** Direct children of this entity */
  children?: { code: string; name: string }[];
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

/** Render text segments with auto-linked entity names */
function LinkedText({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.link ? (
          <Link
            key={i}
            href={seg.link}
            className="text-[#14b8a6] hover:text-[#0d9488] dark:hover:text-[#8b5cf6] hover:underline"
          >
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export function EntityHeader({ name, code, level, parentCode, parentName, yearbook, quickStats, allEntities, children }: EntityHeaderProps) {
  // Auto-link territory text — matches country names, entity names, codes
  const territorySegments = yearbook?.territory && allEntities
    ? linkEntities(yearbook.territory, allEntities.filter(e => e.code !== code))
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{name}</h1>
        <LevelBadge level={level as any} />
      </div>

      {/* Territory — auto-linked entity/country names */}
      {yearbook?.territory && (
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 max-w-3xl">
          {territorySegments ? (
            <LinkedText segments={territorySegments} />
          ) : (
            yearbook.territory
          )}
        </p>
      )}

      {/* Children as clickable links */}
      {children && children.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-slate-400 mb-2 max-w-3xl flex flex-wrap gap-x-1">
          {children.map((child, i) => (
            <span key={child.code}>
              <Link
                href={`/entity/${child.code}`}
                className="text-[#14b8a6] hover:text-[#0d9488] dark:hover:text-[#8b5cf6] hover:underline"
              >
                {child.name}
              </Link>
              {i < children.length - 1 && <span className="text-gray-400 dark:text-slate-600">, </span>}
            </span>
          ))}
        </div>
      )}

      {/* Leadership from yearbook */}
      {yearbook?.leadership && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-xs">
          {yearbook.leadership.president && (
            <span className="text-gray-400 dark:text-slate-500">President: <span className="text-gray-700 dark:text-slate-300">{yearbook.leadership.president}</span></span>
          )}
          {yearbook.leadership.secretary && (
            <span className="text-gray-400 dark:text-slate-500">Secretary: <span className="text-gray-700 dark:text-slate-300">{yearbook.leadership.secretary}</span></span>
          )}
          {yearbook.leadership.treasurer && (
            <span className="text-gray-400 dark:text-slate-500">Treasurer: <span className="text-gray-700 dark:text-slate-300">{yearbook.leadership.treasurer}</span></span>
          )}
        </div>
      )}

      {/* Population context */}
      {yearbook?.population && (
        <p className="text-xs text-gray-500 dark:text-slate-600 mb-2">
          Territory population: {fmt(yearbook.population)} · 
          Adventist penetration: {quickStats?.membership && yearbook.population
            ? ((quickStats.membership / yearbook.population) * 100).toFixed(2) + '%'
            : '—'
          }
        </p>
      )}

    </div>
  );
}
