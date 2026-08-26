import "server-only";

const API_URL = process.env.API_URL!;

// Typed error so callers can inspect the status code + Strapi message
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiClientOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  cache?: RequestCache;
}

export async function apiClient<T>(
  endpoint: string,
  { body, token, cache = "no-store", headers, ...rest }: ApiClientOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    cache,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      data?.error?.message ?? data?.message ?? `API error: ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
