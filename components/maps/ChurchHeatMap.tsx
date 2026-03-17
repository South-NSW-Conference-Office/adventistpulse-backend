'use client'

// NOTE: Must be dynamically imported with ssr: false:
// const ChurchHeatMap = dynamic(() => import('@/components/maps/ChurchHeatMap'), { ssr: false })

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useRouter } from 'next/navigation'
import { cn, tokens } from '@/lib/theme'
import 'leaflet/dist/leaflet.css'

interface RawChurch {
  name: string
  conference?: string
  conferenceName?: string
  lat: number
  lng: number
  membership?: number
}

function nameToSlug(name: string): string {
  return name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function HeatLayer({ churches }: { churches: RawChurch[] }) {
  const map = useMap()
  useEffect(() => {
    if (!churches.length || typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('leaflet.heat')
    const points = churches.map(c => [
      c.lat, c.lng,
      Math.min((c.membership || 80) / 400, 1.0),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heat = (L as any).heatLayer(points, {
      radius: 35, blur: 28, maxZoom: 12,
      gradient: { 0.2: '#1e3a5f', 0.4: '#312e81', 0.7: '#4f46e5', 0.9: '#818cf8', 1.0: '#e0e7ff' },
    }).addTo(map)
    return () => { map.removeLayer(heat) }
  }, [map, churches])
  return null
}

interface Props { className?: string }

export default function ChurchHeatMap({ className }: Props) {
  const router = useRouter()
  const [churches, setChurches] = useState<RawChurch[]>([])

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${apiBase}/api/v1/entities?level=church&limit=2000`)
      .then(r => r.json())
      .then(d => {
        // API returns { success, data: { data: [...], total } }
        const raw: any[] = d?.data?.data ?? d?.data ?? d ?? [];
        const churches = raw
          .filter((c: any) => (c.lat && c.lng) || c.location?.coordinates?.length)
          .map((c: any) => ({
            name: c.name ?? '',
            conference: c.parentCode ?? '',
            conferenceName: c.conferenceName ?? '',
            lat: c.lat ?? c.location?.coordinates?.[1],
            lng: c.lng ?? c.location?.coordinates?.[0],
            membership: c.latestStats?.membership?.ending ?? undefined,
          }));
        setChurches(churches);
      })
      .catch(() => {})
  }, [])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <MapContainer
        center={[-25.5, 134.0]} zoom={4}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd" maxZoom={19}
        />
        {churches.length > 0 && <HeatLayer churches={churches} />}
        {churches.map((c, i) => (
          <CircleMarker
            key={i}
            center={[c.lat, c.lng]}
            radius={4}
            pathOptions={{ color: '#6366F1', fillColor: '#818cf8', fillOpacity: 0.85, weight: 1 }}
            eventHandlers={{ click: () => router.push(`/church/${nameToSlug(c.name)}`) }}
          >
            <Popup>
              <div className="text-sm font-semibold">{c.name}</div>
              {c.conferenceName && <div className="text-xs text-gray-500">{c.conferenceName}</div>}
              <div className="text-xs text-indigo-500 mt-1 cursor-pointer"
                onClick={() => router.push(`/church/${nameToSlug(c.name)}`)}>
                View profile →
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className={cn(
        'absolute bottom-6 left-4 z-[1000] px-3 py-1.5 rounded-full text-xs font-medium',
        'bg-black/70 backdrop-blur-sm border border-white/10',
        tokens.text.muted
      )}>
        {churches.length} churches mapped
      </div>

      <div className={cn(
        'absolute top-4 left-4 z-[1000] px-4 py-2 rounded-lg text-xs',
        'bg-black/70 backdrop-blur-sm border border-white/10',
        tokens.text.muted
      )}>
        <div className="font-semibold text-white mb-1">Australia</div>
        <div>Click any church to view profile</div>
      </div>
    </div>
  )
}
