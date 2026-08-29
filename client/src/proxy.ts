import { NextRequest, NextResponse } from "next/server";
import {
  isAuthRoute,
  getDefaultDashboardRoute,
  getRouteOwner,
  type UserRole,
} from "./lib/authUtils";

// ─── Constants

const API_URL = process.env.API_URL;

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const PROTECTED_ROUTE_PREFIXES = ["/dashboard"];

/** Preemptively refresh the access token when it expires within this window. */
const TOKEN_REFRESH_WINDOW_SECONDS = Number(process.env.TOKEN_REFRESH_WINDOW_SECONDS!);

/** TTL for the refresh-token cookie (30 days). */
const REFRESH_TOKEN_MAX_AGE = Number(process.env.REFRESH_TOKEN_MAX_AGE!);

/** Fallback TTL for the access-token cookie when `exp` is unreadable. */
const ACCESS_TOKEN_FALLBACK_MAX_AGE = Number(process.env.ACCESS_TOKEN_FALLBACK_MAX_AGE!);

// ─── Types

interface RefreshResponse {
  jwt: string;
  refreshToken: string;
}

interface JwtPayload {
  exp?: number;
  id?: number;
  role?: { name?: string };
}

// ─── JWT Helpers

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

function getJwtExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

function isTokenExpired(token: string): boolean {
  const exp = getJwtExpiry(token);
  return !exp || exp < Math.floor(Date.now() / 1000);
}

function needsTokenRefresh(token: string): boolean {
  const exp = getJwtExpiry(token);
  return (
    !exp || exp <= Math.floor(Date.now() / 1000) + TOKEN_REFRESH_WINDOW_SECONDS
  );
}

// ─── Route Helpers

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Checks if the user's role is authorised for the given route.
 * Uses `getRouteOwner` from authUtils — if the route belongs to a specific
 * role and the user's role doesn't match, access is denied.
 * Admin always has access to every role-gated route.
 */
function isRoleAllowed(pathname: string, role: UserRole | null): boolean {
  const routeOwner = getRouteOwner(pathname);
  if (!routeOwner) return true;

  if (!role) return false;
  if (role === "Admin") return true;

  return role === routeOwner;
}

function getSafeRedirectPath(request: NextRequest): string {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  // Prevent open redirects — must start with a single slash
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

// ─── Response Helpers

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", getSafeRedirectPath(request));
  return NextResponse.redirect(loginUrl);
}

function redirectTo403(request: NextRequest, role: UserRole | null = null): NextResponse {
  const dest = role ? getDefaultDashboardRoute(role) : "/";
  const redirectUrl = new URL(dest, request.url);
  redirectUrl.searchParams.set("error", "forbidden");
  return NextResponse.redirect(redirectUrl);
}

/** Compute the accessToken cookie maxAge from the JWT `exp` claim. */
function getAccessTokenMaxAge(jwt: string): number {
  const exp = getJwtExpiry(jwt);
  if (!exp) return ACCESS_TOKEN_FALLBACK_MAX_AGE;
  return Math.max(exp - Math.floor(Date.now() / 1000), 0);
}

/** Atomically set both auth cookies on any NextResponse. */
function setAuthCookies(
  response: NextResponse,
  jwt: string,
  refreshToken: string,
  role?: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, jwt, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: getAccessTokenMaxAge(jwt),
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  if (role) {
    response.cookies.set("userRole", role, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}

/** Delete both auth cookies (used on refresh failure). */
function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete("userRole");
}

// Token Refresh

async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResponse | null> {
  if (!API_URL) {
    console.error("[proxy:refresh] API_URL is not set — refresh aborted.");
    return null;
  }

  const url = `${API_URL}/api/auth/refresh`;
  console.log("[proxy:refresh] → POST", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    console.log("[proxy:refresh] ← status:", res.status);

    if (!res.ok) {
      const body = await res.text().catch(() => "n/a");
      console.error(`[proxy:refresh] Non-ok response (${res.status}):`, body);
      return null;
    }

    const data = (await res.json()) as RefreshResponse;
    console.log("[proxy:refresh] Response keys:", Object.keys(data));

    if (!data.jwt || !data.refreshToken) {
      console.error(
        "[proxy:refresh] Unexpected response shape — expected { jwt, refreshToken }, got:",
        data,
      );
      return null;
    }

    console.log("[proxy:refresh] ✓ Refresh successful");
    return data;
  } catch (error) {
    console.error("[proxy:refresh] Fetch threw:", error);
    return null;
  }
}

/**
 * After a successful refresh, rebuild the request `cookie` header so that
 * downstream Server Components / Route Handlers see the fresh tokens.
 */
function buildRefreshedHeaders(
  request: NextRequest,
  refreshedData: RefreshResponse,
): Headers {
  const headers = new Headers(request.headers);

  const cookieParts: string[] = [];
  for (const c of request.cookies.getAll()) {
    if (c.name !== ACCESS_TOKEN_COOKIE && c.name !== REFRESH_TOKEN_COOKIE) {
      cookieParts.push(`${c.name}=${c.value}`);
    }
  }
  cookieParts.push(`${ACCESS_TOKEN_COOKIE}=${refreshedData.jwt}`);
  cookieParts.push(`${REFRESH_TOKEN_COOKIE}=${refreshedData.refreshToken}`);

  headers.set("cookie", cookieParts.join("; "));
  return headers;
}

/** Get the user's role from raw cookie or query from API if missing. */
async function getUserRole(
  request: NextRequest,
  token: string,
): Promise<UserRole | null> {
  const cookieRole = request.cookies.get("userRole")?.value as UserRole | undefined;
  if (cookieRole) return cookieRole;

  if (!API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return (data.role?.name as UserRole) ?? null;
    }
  } catch (error) {
    console.error("[proxy:getUserRole] Fallback query threw error:", error);
  }
  return null;
}

// ─── Main Proxy

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  console.log(accessToken, "acessteoken");
  console.log(refreshToken, "refreshtoken");
  // ── Protected routes
  if (isProtectedRoute(pathname)) {
    // 1. Valid, non-expiring access token → fast path
    if (accessToken && !needsTokenRefresh(accessToken)) {
      const role = await getUserRole(request, accessToken);

      if (pathname === "/dashboard") {
        const dest = role ? getDefaultDashboardRoute(role) : null;
        if (dest) {
          const destUrl = new URL(dest, request.url);
          destUrl.search = request.nextUrl.search;
          return NextResponse.redirect(destUrl);
        }
        return redirectTo403(request, role);
      }

      if (!isRoleAllowed(pathname, role)) return redirectTo403(request, role);

      // If cookie was missing but we successfully fetched the role, write it back to Cache it
      const cookieRole = request.cookies.get("userRole")?.value;
      if (!cookieRole && role) {
        const response = NextResponse.next();
        const isProduction = process.env.NODE_ENV === "production";
        response.cookies.set("userRole", role, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
        return response;
      }

      return NextResponse.next();
    }

    // 2. Attempt silent token refresh
    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);

      if (refreshed) {
        const role = await getUserRole(request, refreshed.jwt);

        // Handle /dashboard redirect with fresh cookies
        if (pathname === "/dashboard") {
          const dest = role ? getDefaultDashboardRoute(role) : null;
          if (!dest) return redirectTo403(request, role);

          const destUrl = new URL(dest, request.url);
          destUrl.search = request.nextUrl.search;
          const response = NextResponse.redirect(destUrl);
          setAuthCookies(response, refreshed.jwt, refreshed.refreshToken, role ?? undefined);
          return response;
        }

        // Role gate check with refreshed token
        if (!isRoleAllowed(pathname, role)) {
          return redirectTo403(request, role);
        }

        // Continue to the route with refreshed headers + cookies
        const response = NextResponse.next({
          request: { headers: buildRefreshedHeaders(request, refreshed) },
        });
        setAuthCookies(response, refreshed.jwt, refreshed.refreshToken, role ?? undefined);
        return response;
      }

      // Refresh failed — clear stale cookies and redirect to login
      const response = redirectToLogin(request);
      clearAuthCookies(response);
      return response;
    }

    // 3. No tokens at all → login
    return redirectToLogin(request);
  }

  // ── Auth routes
  // Redirect already-authenticated users away from auth pages
  if (isAuthRoute(pathname) && accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Config 

export const config = {
  matcher: [
    /*
     * Run for all application routes. Excludes:
     * - API routes (/api)
     * - Next.js internals (_next/static, _next/image)
     * - Static assets (files with extensions)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
