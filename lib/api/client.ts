/**
 * Base API client — thin fetch wrapper.
 * No business logic. Just HTTP plumbing.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields?: Record<string, string[]>  // validation field errors
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  accessToken?: string;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { accessToken, headers: extraHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (!API_BASE) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured.", 0, "CONFIG_ERROR");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include", // send httpOnly refresh_token cookie
      headers,
      ...rest,
    });
  } catch {
    // fetch() itself threw — network down, DNS failure, CORS preflight blocked, etc.
    throw new ApiError(
      "Network error — check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    let code: string | undefined;
    let fields: Record<string, string[]> | undefined;
    try {
      const body = await res.json();
      code    = body?.error?.code;
      fields  = body?.error?.fields;

      // For VALIDATION_ERROR, prefer the first field-level message over the generic "Validation failed"
      if (code === "VALIDATION_ERROR" && fields) {
        const firstField = Object.values(fields)[0];
        message = firstField?.[0] ?? body?.error?.message ?? message;
      } else {
        message = body?.error?.message ?? body?.message ?? message;
      }
    } catch {
      // ignore parse failure — keep default message
    }
    throw new ApiError(message, res.status, code, fields);
  }

  // 204 No Content — return empty object cast to T
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}
