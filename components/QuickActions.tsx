import Link from 'next/link';
import { ShareButtons } from './ShareButtons';
import { BarChart3, GitCompareArrows, ArrowUp } from 'lucide-react';

interface QuickActionsProps {
  entityCode: string;
  entityName: string;
  entityLevel: string;
  siblingCodes: string[];
  parentCode?: string;
}

export function QuickActions({ entityCode, entityName, entityLevel, siblingCodes, parentCode }: QuickActionsProps) {
  // Build compare URL with all siblings
  const compareCodes = [entityCode, ...siblingCodes.filter(c => c !== entityCode)].join(',');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShareButtons entityName={entityName} entityCode={entityCode} />

      {siblingCodes.length > 0 && (
        <Link
          href={`/compare?entities=${compareCodes}`}
          className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <GitCompareArrows className="w-3.5 h-3.5" /> Compare with peers
        </Link>
      )}

      {parentCode && (
        <Link
          href={`/entity/${parentCode}`}
          className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          ↑ Parent entity
        </Link>
      )}

      <Link
        href={`/rankings?level=${entityLevel}&highlight=${entityCode}`}
        className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
      >
        <BarChart3 className="w-3.5 h-3.5" /> Rankings
      </Link>
    </div>
  );
}
