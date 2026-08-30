import "server-only";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL!;
console.log(API_URL, "API_URL");

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
    if (res.status === 401) {
      try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (refreshToken) {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
            cache: "no-store",
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.jwt) {
              const retryRes = await fetch(`${API_URL}${endpoint}`, {
                ...rest,
                cache,
                headers: {
                  ...headers,
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${refreshData.jwt}`,
                },
                ...(body !== undefined && { body: JSON.stringify(body) }),
              });

              if (retryRes.ok) {
                try {
                  const maxAge = refreshData.jwt
                    ? JSON.parse(atob(refreshData.jwt.split(".")[1])).exp -
                      Math.floor(Date.now() / 1000)
                    : 24 * 60 * 60;

                  cookieStore.set("accessToken", refreshData.jwt, {
                    path: "/",
                    httpOnly: true,
                    maxAge,
                  });
                  if (refreshData.refreshToken) {
                    cookieStore.set("refreshToken", refreshData.refreshToken, {
                      path: "/",
                      httpOnly: true,
                      maxAge: 60 * 60 * 24 * 30,
                    });
                  }
                } catch (e) {
                  // Ignore "Cookies can only be modified in a Server Action or Route Handler" error
                }
                const retryText = await retryRes.text();
                return (retryText ? JSON.parse(retryText) : {}) as T;
              }
            }
          }
        }
      } catch (e) {
        // Fall back to throw ApiError if anything goes wrong during retry
      }
    }

    const data = await res.json().catch(() => null);
    const message =
      data?.error?.message ?? data?.message ?? `API error: ${res.status}`;
    throw new ApiError(res.status, message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}
