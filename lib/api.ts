const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

/**
 * Normalise entity shapes from the API.
 * Bem's backend returns `latestStats` but the frontend types expect `latestYear`.
 * We remap here so all downstream code just uses `latestYear`.
 */
function normaliseEntity(e: Record<string, unknown>): Record<string, unknown> {
  if (e && typeof e === 'object' && 'latestStats' in e && !('latestYear' in e)) {
    return { ...e, latestYear: e.latestStats }
  }
  return e
}

function normalise<T>(data: T): T {
  if (Array.isArray(data)) return data.map(item => normaliseEntity(item as Record<string, unknown>)) as T
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    // Paginated list: { data: [...], total, page, limit }
    if (Array.isArray(obj.data)) return { ...obj, data: obj.data.map(item => normaliseEntity(item as Record<string, unknown>)) } as T
    return normaliseEntity(obj) as T
  }
  return data
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? err.message ?? `API error ${res.status}`)
  }
  const json = await res.json()
  // Unwrap { success, data } envelope from backend, then normalise entity shapes
  const unwrapped = json?.data !== undefined ? json.data : json
  return normalise(unwrapped) as T
}

// For paginated responses that return { data: [], total, page, limit }
export async function apiFetchList<T>(path: string, options?: RequestInit): Promise<T[]> {
  const result = await apiFetch<{ data: T[] } | T[]>(path, options)
  return Array.isArray(result) ? result : (result as { data: T[] }).data ?? []
}
