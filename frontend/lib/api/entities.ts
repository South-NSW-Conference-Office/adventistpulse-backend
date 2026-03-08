const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'

export interface EntityOption {
  _id:   string;
  name:  string;
  code:  string;
  level: string;
}

export async function getDivisions(): Promise<EntityOption[]> {
  const res = await fetch(`${BASE}/api/v1/entities/divisions`)
  if (!res.ok) throw new Error('Failed to fetch divisions')
  const body = await res.json()
  return body.data
}

export async function getEntityChildren(code: string): Promise<EntityOption[]> {
  const res = await fetch(`${BASE}/api/v1/entities/${code}/children`)
  if (!res.ok) throw new Error('Failed to fetch children')
  const body = await res.json()
  return body.data
}
