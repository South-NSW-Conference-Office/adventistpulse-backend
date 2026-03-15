'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { cn, tokens } from '@/lib/theme'

export interface DataSourceMeta {
  source: string          // e.g. "ABS Census 2021"
  type: string            // e.g. "Government dataset" | "Church self-reported" | "Sample data"
  recency: string         // e.g. "2021" | "Not yet contributed" | "Updated Mar 2026"
  notes?: string          // optional extra context
}

interface Props {
  meta: DataSourceMeta
  className?: string
}

export default function DataSourceBadge({ meta, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const isSample = meta.type.toLowerCase().includes('sample')

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors',
          isSample
            ? 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/10'
            : 'text-gray-400/70 hover:text-gray-300 hover:bg-white/5'
        )}
        title="Data source info"
      >
        <Info className="w-3 h-3" />
        <span className="hidden sm:inline">Source</span>
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 top-full mt-1 z-50 w-64 rounded-lg p-3 shadow-xl',
          'bg-[#1a2332] border',
          isSample ? 'border-amber-400/30' : 'border-white/10'
        )}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className={cn('text-xs font-semibold', tokens.text.heading)}>Data Source</span>
              {isSample && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 font-medium shrink-0">
                  Sample
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className={cn('shrink-0 w-16', tokens.text.muted)}>Source</span>
                <span className={tokens.text.body}>{meta.source}</span>
              </div>
              <div className="flex gap-2">
                <span className={cn('shrink-0 w-16', tokens.text.muted)}>Type</span>
                <span className={tokens.text.body}>{meta.type}</span>
              </div>
              <div className="flex gap-2">
                <span className={cn('shrink-0 w-16', tokens.text.muted)}>Last data</span>
                <span className={tokens.text.body}>{meta.recency}</span>
              </div>
              {meta.notes && (
                <div className={cn('pt-1 border-t text-[11px] leading-relaxed', tokens.text.muted, 'border-white/5')}>
                  {meta.notes}
                </div>
              )}
            </div>

            {isSample && (
              <div className="pt-1.5 border-t border-amber-400/20">
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  Real data unlocks when your church contributes. Contact your conference to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
