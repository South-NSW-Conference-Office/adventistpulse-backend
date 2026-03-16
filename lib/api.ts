const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

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
  // Unwrap { success, data } envelope from backend
  return (json?.data !== undefined ? json.data : json) as T
}

// For paginated responses that return { data: [], total, page, limit }
export async function apiFetchList<T>(path: string, options?: RequestInit): Promise<T[]> {
  const result = await apiFetch<{ data: T[] } | T[]>(path, options)
  return Array.isArray(result) ? result : (result as { data: T[] }).data ?? []
}
