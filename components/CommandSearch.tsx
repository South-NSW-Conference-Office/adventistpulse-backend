'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Entity {
  code: string;
  name: string;
  level: string;
  membership?: number;
}

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Simple fuzzy matching - contains all characters in order
  let textIndex = 0;
  for (let queryChar of normalizedQuery) {
    while (textIndex < normalizedText.length && normalizedText[textIndex] !== queryChar) {
      textIndex++;
    }
    if (textIndex >= normalizedText.length) return false;
    textIndex++;
  }
  return true;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch entities from API when search opens
  useEffect(() => {
    if (isOpen && entities.length === 0) {
      setIsLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      fetch(`${apiBase}/api/v1/entities?limit=5000`)
        .then(res => res.json())
        .then((data: any) => {
          const list: any[] = data?.data?.data ?? data?.data ?? [];
          const mapped = list.map((e: any) => ({
            code: e.code,
            name: e.name,
            level: e.level,
            membership: e.latestStats?.membership?.ending ?? e.latestYear?.membership?.ending ?? undefined,
          }));
          setEntities(mapped);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch entities:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, entities.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIdx(0);
    }
  }, [isOpen]);

  // Handle escape key and outside clicks
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClick);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Filter and group results
  const filteredEntities = query.length >= 1
    ? entities
        .filter(e => 
          fuzzyMatch(e.name, query) || 
          fuzzyMatch(e.code, query)
        )
        .slice(0, 20)
    : [];

  const groupedResults = filteredEntities.reduce((groups, entity) => {
    const level = entity.level === 'mission' ? 'conference' : entity.level;
    if (!groups[level]) groups[level] = [];
    groups[level].push(entity);
    return groups;
  }, {} as Record<string, Entity[]>);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    const totalResults = filteredEntities.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredEntities[selectedIdx]) {
      navigate(filteredEntities[selectedIdx].code);
    }
  }

  function navigate(code: string) {
    onClose();
    router.push(`/entity/${code}`);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-[15vh]">
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-[#2a3a50] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="relative border-b border-gray-200 dark:border-[#2a3a50]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search entities..."
            className="w-full bg-transparent pl-12 pr-16 py-4 text-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <kbd className="px-2 py-1 text-xs text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-[#2a3a50] border border-gray-300 dark:border-[#3a4a60] rounded">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-500">
              Loading entities...
            </div>
          ) : query.length < 1 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-500">
              <div className="mb-2">Search for any Adventist entity</div>
              <div className="text-sm text-gray-400 dark:text-slate-600">
                Type to search by name or code (e.g., "south pacific", "spd", "australia")
              </div>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-500">
              No entities found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {['division', 'union', 'conference'].map(level => {
                const levelEntities = groupedResults[level];
                if (!levelEntities?.length) return null;

                const levelLabel = level === 'division' ? 'Divisions' : 
                                level === 'union' ? 'Unions' : 'Conferences';

                return (
                  <div key={level} className="mb-1">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                      {levelLabel}
                    </div>
                    {levelEntities.map((entity, idx) => {
                      const globalIdx = filteredEntities.indexOf(entity);
                      const isSelected = globalIdx === selectedIdx;
                      
                      return (
                        <button
                          key={entity.code}
                          onClick={() => navigate(entity.code)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-[#14b8a6]/10 border-r-2 border-[#14b8a6]' 
                              : 'hover:bg-gray-50 dark:hover:bg-[#1f2b3d]/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 dark:text-white font-medium truncate">
                              {entity.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-500">
                              {entity.code}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {entity.membership && (
                              <span className="text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                                {fmt(entity.membership)} members
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded uppercase tracking-wide ${
                              level === 'division' 
                                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                                : level === 'union'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {level}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {filteredEntities.length > 0 && (
          <div className="border-t border-gray-200 dark:border-[#2a3a50] px-4 py-2 text-xs text-gray-500 dark:text-slate-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>{filteredEntities.length} results</span>
          </div>
        )}
      </div>
    </div>
  );
}