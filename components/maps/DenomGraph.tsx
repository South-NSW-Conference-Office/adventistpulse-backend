'use client'

// NOTE: Must be dynamically imported with ssr: false:
// const DenomGraph = dynamic(() => import('@/components/maps/DenomGraph'), { ssr: false })

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn, tokens } from '@/lib/theme'

interface GraphNode {
  id: string
  name: string
  type: 'root' | 'conference' | 'church'
  code?: string
  val: number
  color: string
}

interface GraphLink {
  source: string
  target: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

function nameToSlug(name: string): string {
  return name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const CONF_COLORS: Record<string, string> = {
  SNSW: '#14b8a6', NNSW: '#8b5cf6', NSD: '#0ea5e9',
  VIC: '#10b981', SA: '#f59e0b', QLD: '#ef4444',
  WA: '#ec4899', TAS: '#14b8a6',
}

interface Props { className?: string }

export default function DenomGraph({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<unknown>(null)
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [nodeCount, setNodeCount] = useState(0)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; type: string } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const buildGraph = async () => {
      const res = await fetch('/data/au-church-directory.json')
      const dir = await res.json()

      const nodes: GraphNode[] = []
      const links: GraphLink[] = []

      // Root SPD node
      nodes.push({ id: 'SPD', name: 'South Pacific Division', type: 'root', val: 30, color: '#f59e0b' })

      // Conference nodes + church nodes
      for (const conf of dir.conferences) {
        const confId = conf.code || conf.conference
        const confColor = CONF_COLORS[confId] || '#14b8a6'
        nodes.push({
          id: confId,
          name: conf.conference,
          type: 'conference',
          code: confId,
          val: 14,
          color: confColor,
        })
        links.push({ source: 'SPD', target: confId })

        for (const church of conf.churches) {
          const slug = nameToSlug(church.name)
          const churchId = `${confId}:${slug}`
          nodes.push({
            id: churchId,
            name: church.name,
            type: 'church',
            code: slug,
            val: 3,
            color: confColor + '99',
          })
          links.push({ source: confId, target: churchId })
        }
      }

      setNodeCount(nodes.length)

      // Dynamically import react-force-graph-2d (client only)
      const ForceGraph2D = (await import('react-force-graph-2d')).default

      // We'll render via a div, not React (to avoid SSR issues with canvas)
      // Actually let's use React rendering approach with ref
      const { createRoot } = await import('react-dom/client')

      if (!containerRef.current) return

      // Clear any existing content
      containerRef.current.innerHTML = ''
      const mountEl = document.createElement('div')
      mountEl.style.width = '100%'
      mountEl.style.height = '100%'
      containerRef.current.appendChild(mountEl)

      const root = createRoot(mountEl)
      const w = containerRef.current.offsetWidth
      const h = containerRef.current.offsetHeight

      root.render(
        <ForceGraph2D
          graphData={{ nodes, links } as GraphData}
          width={w}
          height={h}
          backgroundColor="#0f172a"
          nodeLabel="name"
          nodeColor={(n: unknown) => (n as GraphNode).color}
          nodeVal={(n: unknown) => (n as GraphNode).val}
          linkColor={() => 'rgba(99,102,241,0.25)'}
          linkWidth={0.5}
          nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const n = node as GraphNode & { x: number; y: number }
            const radius = Math.sqrt((n.val || 3)) * 1.8
            ctx.beginPath()
            ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
            ctx.fillStyle = n.color
            ctx.fill()
            if (n.type !== 'church' || globalScale > 4) {
              const label = n.type === 'root' ? n.name :
                n.type === 'conference' ? n.name.replace(' Conference', '') :
                n.name.replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church)$/i, '')
              const fontSize = n.type === 'root' ? 5 : n.type === 'conference' ? 4 : 2.5
              ctx.font = `${fontSize}px Inter, sans-serif`
              ctx.fillStyle = n.type === 'root' ? '#fef3c7' : n.type === 'conference' ? '#e0e7ff' : '#cbd5e1'
              ctx.textAlign = 'center'
              ctx.fillText(label, n.x, n.y + radius + fontSize + 1)
            }
          }}
          onNodeClick={(node: unknown) => {
            const n = node as GraphNode
            if (n.type === 'church' && n.code) router.push(`/church/${n.code}`)
            else if (n.type === 'conference' && n.code) router.push(`/entity/${n.code.toLowerCase()}`)
          }}
          onNodeHover={(node: unknown) => {
            document.body.style.cursor = node ? 'pointer' : 'default'
          }}
          cooldownTicks={150}
          onEngineStop={() => setLoaded(true)}
        />
      )
    }

    buildGraph().catch(console.error)

    return () => {
      document.body.style.cursor = 'default'
    }
  }, [router])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0f172a' }} />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]">
          <div className={cn('text-sm', tokens.text.muted)}>Building network graph…</div>
        </div>
      )}

      <div className={cn(
        'absolute top-4 left-4 z-10 px-4 py-2 rounded-lg text-xs pointer-events-none',
        'bg-black/70 backdrop-blur-sm border border-white/10',
      )}>
        <div className="font-semibold text-white mb-1">Denominational Network</div>
        <div className={tokens.text.muted}>{nodeCount} entities • SPD → Conferences → Churches</div>
        <div className={cn('mt-1', tokens.text.muted)}>Click any node to navigate</div>
      </div>

      {/* Legend */}
      <div className={cn(
        'absolute bottom-6 left-4 z-10 px-3 py-2 rounded-lg text-xs space-y-1',
        'bg-black/70 backdrop-blur-sm border border-white/10',
      )}>
        {[['#f59e0b', 'Division'], ['#14b8a6', 'Conference'], ['#14b8a699', 'Church']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className={tokens.text.muted}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
