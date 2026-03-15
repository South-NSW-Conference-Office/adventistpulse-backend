'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EntityWithStats } from '@/types/pulse';

interface CompareSearchProps {
  entities: EntityWithStats[];
}

export function CompareSearch({ entities }: CompareSearchProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = query.length >= 2
    ? entities
        .filter(e =>
          !selected.includes(e.code) &&
          (e.name.toLowerCase().includes(query.toLowerCase()) ||
           e.code.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function addEntity(code: string) {
    setSelected(prev => [...prev, code]);
    setQuery('');
    setIsOpen(false);
  }

  function removeEntity(code: string) {
    setSelected(prev => prev.filter(c => c !== code));
  }

  function compare() {
    if (selected.length >= 2) {
      router.push(`/compare?entities=${selected.join(',')}`);
    }
  }

  const selectedEntities = selected.map(code => entities.find(e => e.code === code)).filter(Boolean);

  return (
    <div>
      {/* Selected entities */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedEntities.map(e => e && (
            <span
              key={e.code}
              className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-sm px-3 py-1.5 rounded-lg"
            >
              {e.name}
              <button
                onClick={() => removeEntity(e.code)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div ref={ref} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? "Search for entities to compare..." : "Add another entity..."}
          className="w-full bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#14b8a6] transition-colors"
        />

        {isOpen && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {results.map(entity => (
              <button
                key={entity.code}
                onClick={() => addEntity(entity.code)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-white text-sm font-medium">{entity.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{entity.code}</span>
                </div>
                <span className="text-xs text-slate-500 capitalize">{entity.level}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compare button */}
      {selected.length >= 2 && (
        <button
          onClick={compare}
          className="mt-4 bg-[#14b8a6] hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Compare {selected.length} Entities →
        </button>
      )}

      {selected.length === 1 && (
        <p className="mt-3 text-xs text-slate-500">Add at least one more entity to compare</p>
      )}
    </div>
  );
}
