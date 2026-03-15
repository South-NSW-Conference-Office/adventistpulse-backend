'use client'

import { useState } from 'react'
import { cn, tokens } from '@/lib/theme'
import { Map, Network } from 'lucide-react'

interface MapTabsProps {
  heatMap: React.ReactNode
  network: React.ReactNode
}

export default function MapTabs({ heatMap, network }: MapTabsProps) {
  const [active, setActive] = useState<'heat' | 'network'>('heat')

  return (
    <div className="flex flex-col flex-1">
      {/* Tab bar */}
      <div className={cn('flex gap-1 px-6 py-3 border-b border-white/5')}>
        <button
          onClick={() => setActive('heat')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            active === 'heat'
              ? 'bg-indigo-600 text-white'
              : cn('text-gray-400 hover:text-white', tokens.bg.card)
          )}
        >
          <Map className="w-4 h-4" />
          Heat Map
        </button>
        <button
          onClick={() => setActive('network')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            active === 'network'
              ? 'bg-indigo-600 text-white'
              : cn('text-gray-400 hover:text-white', tokens.bg.card)
          )}
        >
          <Network className="w-4 h-4" />
          Network Graph
        </button>
      </div>

      {/* Map area */}
      <div className="relative flex-1" style={{ height: 'calc(100vh - 180px)' }}>
        <div className={cn('absolute inset-0', active === 'heat' ? 'block' : 'hidden')}>
          {heatMap}
        </div>
        <div className={cn('absolute inset-0', active === 'network' ? 'block' : 'hidden')}>
          {network}
        </div>
      </div>
    </div>
  )
}
