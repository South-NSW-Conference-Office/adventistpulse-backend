import Link from 'next/link';
import type { OrgUnit } from '@/types/pulse';

export function Breadcrumbs({ items }: { items: OrgUnit[] }) {
  // Remove current entity (it's the page title). Keep everything else including GC.
  const ancestors = items.slice(0, -1);
  
  if (ancestors.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-400">
      {ancestors.map((item, i) => (
        <span key={item.code} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-600 mx-1">›</span>}
          <Link
            href={`/entity/${item.code}`}
            className="hover:text-white hover:text-[#6366F1] transition-colors"
          >
            {item.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}
