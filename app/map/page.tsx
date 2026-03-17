'use client'

import nextDynamic from 'next/dynamic'
import { useState } from 'react'
import { cn, tokens } from '@/lib/theme'
import { Map, Share2 } from 'lucide-react'

const ChurchHeatMap = nextDynamic(() => import('@/components/maps/ChurchHeatMap'), { ssr: false })
const DenomGraph = nextDynamic(() => import('@/components/maps/DenomGraph'), { ssr: false })

type Tab = 'heatmap' | 'network'

export default function MapPage() {
  const [tab, setTab] = useState<Tab>('heatmap')

  return (
    <div className={cn('flex flex-col', tokens.bg.page)} style={{ height: 'calc(100vh - 100px)' }}>
      {/* Header bar */}
      <div className={cn(
        'flex items-center justify-between px-6 py-3 border-b shrink-0',
        tokens.bg.card, tokens.border.default
      )}>
        <div>
          <h1 className={cn('text-lg font-bold', tokens.text.heading)}>
            Global Church Intelligence
          </h1>
          <p className={cn('text-xs', tokens.text.muted)}>
            Adventist churches mapped across Australia
          </p>
        </div>

        {/* Tabs */}
        <div className={cn('flex rounded-lg p-0.5 gap-0.5', tokens.bg.cardAlt)}>
          {([
            { id: 'heatmap', label: 'Heat Map', icon: Map },
            { id: 'network', label: 'Network', icon: Share2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                tab === id
                  ? cn(tokens.bg.card, tokens.text.heading, 'shadow-sm')
                  : cn(tokens.text.muted, 'hover:text-white')
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area — fills remaining height */}
      <div className="flex-1 relative overflow-hidden">
        <div className={cn('absolute inset-0 transition-opacity duration-200', tab === 'heatmap' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <ChurchHeatMap className="w-full h-full" />
        </div>
        <div className={cn('absolute inset-0 transition-opacity duration-200', tab === 'network' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <DenomGraph className="w-full h-full" />
        </div>
      </div>
    </div>
  )
}
