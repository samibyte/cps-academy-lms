import { NextRequest, NextResponse } from "next/server";
import {
  isAuthRoute,
  getDefaultDashboardRoute,
  getRouteOwner,
  type UserRole,
} from "./lib/authUtils";

//Constants

const API_URL = process.env.API_URL;

const VALID_ROLES = new Set<UserRole>([
  "Admin",
  "Instructor",
  "Content Manager",
  "Student",
]);

/** Cast a raw role string to UserRole if it is one of the known values. */
function parseRole(raw: string | null | undefined): UserRole | null {
  const trimmed = raw?.trim();
  return VALID_ROLES.has(trimmed as UserRole) ? (trimmed as UserRole) : null;
}

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const USER_ROLE_COOKIE = "userRole";

const PROTECTED_ROUTE_PREFIXES = ["/dashboard"];

/** Preemptively refresh the access token when it expires within this window. */
const TOKEN_REFRESH_WINDOW_SECONDS = Number(
  process.env.TOKEN_REFRESH_WINDOW_SECONDS,
);

/** TTL for the refresh-token cookie (30 days). */
const REFRESH_TOKEN_MAX_AGE = Number(process.env.REFRESH_TOKEN_MAX_AGE);

/** Fallback TTL for the access-token cookie when `exp` is unreadable. */
const ACCESS_TOKEN_FALLBACK_MAX_AGE = Number(
  process.env.ACCESS_TOKEN_FALLBACK_MAX_AGE,
);

// Types

interface RefreshResponse {
  jwt: string;
  refreshToken: string;
}

/**
 * NOTE: Strapi 5 JWTs do NOT embed the user's role.
 * The `role` must always be fetched from `/api/users/me?populate=role`.
 */
interface JwtPayload {
  exp?: number;
}

//JWT Helpers

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

/**
 * Returns true if the token is expired or will expire within `windowSeconds`.
 * Pass `0` for a strict expiry check (no refresh buffer).
 */
function needsTokenRefresh(
  token: string,
  windowSeconds = TOKEN_REFRESH_WINDOW_SECONDS,
): boolean {
  const exp = getJwtExpiry(token);
  return !exp || exp <= Math.floor(Date.now() / 1000) + windowSeconds;
}

//Route Helpers

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Returns true if `role` is authorised to access `pathname`.
 * Admin always passes; other roles must match the route's designated owner.
 */
function isRoleAllowed(pathname: string, role: UserRole | null): boolean {
  const routeOwner = getRouteOwner(pathname);

  if (!routeOwner) return true;
  if (!role) return false;

  return role === "Admin" || role === routeOwner;
}

function getSafeRedirectPath(request: NextRequest): string {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

// Response Helpers
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", getSafeRedirectPath(request));
  return NextResponse.redirect(loginUrl);
}

function redirectTo403(
  request: NextRequest,
  role: UserRole | null = null,
): NextResponse {
  const dest = role ? getDefaultDashboardRoute(role) : "/";
  const redirectUrl = new URL(dest, request.url);
  redirectUrl.searchParams.set("error", "forbidden");
  return NextResponse.redirect(redirectUrl);
}

/** Compute the accessToken cookie maxAge from the JWT `exp` claim. */
function getAccessTokenMaxAge(jwt: string): number {
  const exp = getJwtExpiry(jwt);
  return exp
    ? Math.max(exp - Math.floor(Date.now() / 1000), 0)
    : ACCESS_TOKEN_FALLBACK_MAX_AGE;
}

const isProduction = process.env.NODE_ENV === "production";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

/** Atomically set both auth cookies and optionally the userRole cookie. */
function setAuthCookies(
  response: NextResponse,
  jwt: string,
  refreshToken: string,
  role?: string,
): void {
  const accessMaxAge = getAccessTokenMaxAge(jwt);

  response.cookies.set(ACCESS_TOKEN_COOKIE, jwt, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: accessMaxAge,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  if (role) {
    // userRole must not outlive the access token — role changes take effect
    // on the next refresh, not after the 30-day refresh-token window.
    response.cookies.set(USER_ROLE_COOKIE, role, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });
  }
}

/** Delete all auth cookies (used on refresh failure). */
function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(USER_ROLE_COOKIE);
}

/**
 * Write the userRole cookie onto a response only when it isn't already cached
 * in the request. Keeps the maxAge in sync with the current access token.
 */
function cacheRoleCookie(
  request: NextRequest,
  response: NextResponse,
  role: UserRole,
  accessToken: string,
): void {
  if (request.cookies.get(USER_ROLE_COOKIE)?.value) return;
  response.cookies.set(USER_ROLE_COOKIE, role, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: getAccessTokenMaxAge(accessToken),
  });
}

// Token Refresh

async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResponse | null> {
  if (!API_URL) {
    console.error("[proxy:refresh] API_URL is not set — refresh aborted.");
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "n/a");
      console.error(`[proxy:refresh] Non-ok response (${res.status}):`, body);
      return null;
    }

    const data = (await res.json()) as RefreshResponse;

    if (!data.jwt || !data.refreshToken) {
      console.error(
        "[proxy:refresh] Unexpected response shape — expected { jwt, refreshToken }, got:",
        data,
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error("[proxy:refresh] Fetch threw:", error);
    return null;
  }
}

/**
 * Rebuild the request `cookie` header with fresh tokens so downstream
 * Server Components / Route Handlers see the updated values.
 */
function buildRefreshedHeaders(
  request: NextRequest,
  refreshed: RefreshResponse,
  role?: UserRole,
): Headers {
  const headers = new Headers(request.headers);

  const AUTH_COOKIES = new Set([
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    USER_ROLE_COOKIE,
  ]);

  const cookieParts = request.cookies
    .getAll()
    .filter((c) => !AUTH_COOKIES.has(c.name))
    .map((c) => `${c.name}=${c.value}`);

  cookieParts.push(`${ACCESS_TOKEN_COOKIE}=${refreshed.jwt}`);
  cookieParts.push(`${REFRESH_TOKEN_COOKIE}=${refreshed.refreshToken}`);
  if (role) cookieParts.push(`${USER_ROLE_COOKIE}=${role}`);

  headers.set("cookie", cookieParts.join("; "));
  return headers;
}

// Role Resolution
/** Resolve the user's role — cookie cache first, then Strapi API. */
async function getUserRole(
  request: NextRequest,
  token: string,
): Promise<UserRole | null> {
  const cached = parseRole(request.cookies.get(USER_ROLE_COOKIE)?.value);
  if (cached) return cached;

  if (!API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return parseRole(data.role?.name);
    }
  } catch (error) {
    console.error("[proxy:getUserRole] Strapi query threw:", error);
  }

  return null;
}

// Protected Route Handler
/**
 * Handle navigation to /dashboard (with or without trailing slash):
 * redirect to the role's default sub-route.
 */
function isDashboardRoot(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

async function handleProtectedRoute(
  request: NextRequest,
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Path 1: Valid, non-expiring access token
  if (accessToken && !needsTokenRefresh(accessToken)) {
    const role = await getUserRole(request, accessToken);

    if (isDashboardRoot(pathname)) {
      const dest = role ? getDefaultDashboardRoute(role) : null;
      if (!dest) return redirectTo403(request, role);

      const destUrl = new URL(dest, request.url);
      destUrl.search = request.nextUrl.search;
      const response = NextResponse.redirect(destUrl);
      if (role) cacheRoleCookie(request, response, role, accessToken);
      return response;
    }

    if (!isRoleAllowed(pathname, role)) return redirectTo403(request, role);

    const response = NextResponse.next();
    if (role) cacheRoleCookie(request, response, role, accessToken);
    return response;
  }

  // ── Path 2: Attempt silent token refresh
  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);

    if (!refreshed) {
      const response = redirectToLogin(request);
      clearAuthCookies(response);
      return response;
    }

    const role = await getUserRole(request, refreshed.jwt);

    if (isDashboardRoot(pathname)) {
      const dest = role ? getDefaultDashboardRoute(role) : null;
      if (!dest) return redirectTo403(request, role);

      const destUrl = new URL(dest, request.url);
      destUrl.search = request.nextUrl.search;
      const response = NextResponse.redirect(destUrl);
      setAuthCookies(
        response,
        refreshed.jwt,
        refreshed.refreshToken,
        role ?? undefined,
      );
      return response;
    }

    if (!isRoleAllowed(pathname, role)) return redirectTo403(request, role);

    const response = NextResponse.next({
      request: {
        headers: buildRefreshedHeaders(request, refreshed, role ?? undefined),
      },
    });
    setAuthCookies(
      response,
      refreshed.jwt,
      refreshed.refreshToken,
      role ?? undefined,
    );
    return response;
  }

  // ── Path 3: No tokens at all
  return redirectToLogin(request);
}

// Main Proxy

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (isProtectedRoute(pathname)) {
    return handleProtectedRoute(request, accessToken, refreshToken);
  }

  // Redirect already-authenticated users away from auth pages.
  // windowSeconds=0 → strict expiry check, no preemptive refresh buffer.
  if (
    isAuthRoute(pathname) &&
    accessToken &&
    !needsTokenRefresh(accessToken, 0)
  ) {
    const role = await getUserRole(request, accessToken);
    const dest = role ? getDefaultDashboardRoute(role) : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}
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
