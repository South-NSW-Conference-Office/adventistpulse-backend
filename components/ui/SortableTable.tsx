'use client';

import { useState, useMemo, ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  hideOnMobile?: boolean;
  sortFn?: (a: T, b: T) => number;
  render: (item: T) => ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  maxHeight?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
}

export function SortableTable<T>({
  data,
  columns,
  defaultSortKey,
  defaultSortDir = 'desc',
  maxHeight = '500px',
  emptyMessage = 'No data found',
  onRowClick,
  rowKey,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey || columns[0]?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      const col = columns.find(c => c.key === key);
      // Default: text columns sort asc, numeric columns sort desc
      setSortDir(col?.align === 'left' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortFn) return data;
    const list = [...data].sort(col.sortFn);
    return sortDir === 'desc' ? list.reverse() : list;
  }, [data, columns, sortKey, sortDir]);

  return (
    <div className={cn('rounded-xl border overflow-hidden', tokens.border.default)}>
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className={cn('sticky top-0 z-10', tokens.bg.card)}>
            <tr className="border-b border-gray-200 dark:border-[#2a3a50]">
              {columns.map(col => {
                const active = sortKey === col.key;
                const sortable = !!col.sortFn;
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-500 select-none',
                      alignClass,
                      col.hideOnMobile && 'hidden sm:table-cell',
                      sortable && 'cursor-pointer hover:text-[#6366F1] transition-colors',
                    )}
                    onClick={sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortable && (
                        active ? (
                          sortDir === 'asc' 
                            ? <ArrowUp className="w-3 h-3 text-[#6366F1]" />
                            : <ArrowDown className="w-3 h-3 text-[#6366F1]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 dark:text-slate-600">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map(item => (
                <tr
                  key={rowKey(item)}
                  className={cn(
                    'border-b border-gray-100 dark:border-[#2a3a50]/50 transition-colors',
                    tokens.bg.card,
                    onRowClick 
                      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#253347]' 
                      : 'hover:bg-gray-50/50 dark:hover:bg-[#253347]/50',
                  )}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5',
                        col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : '',
                        col.hideOnMobile && 'hidden sm:table-cell',
                      )}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
