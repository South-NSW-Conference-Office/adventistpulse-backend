import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL
    const [entitiesRes, churchesRes] = await Promise.all([
      fetch(`${API}/api/v1/entities?limit=1`, { next: { revalidate: 3600 } }),
      fetch(`${API}/api/v1/entities?level=church&limit=1`, { next: { revalidate: 3600 } }),
    ])
    const entities = await entitiesRes.json()
    const churches = await churchesRes.json()

    return NextResponse.json({
      entities: entities?.data?.total ?? 116,
      churches: churches?.data?.total ?? 615,
    })
  } catch {
    return NextResponse.json({ entities: 116, churches: 615 })
  }
}
