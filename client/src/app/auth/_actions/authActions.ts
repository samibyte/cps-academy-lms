"use server";

import { apiClient, ApiError } from "@/lib/apiClient";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { setCookie } from "@/lib/cookieUtils";
import {
  getDefaultDashboardRoute,
  isValidRedirectForRole,
  parseRole,
  UserRole,
} from "@/lib/authUtils";
import {
  ILoginPayload,
  IRegisterPayload,
  loginZodSchema,
  registerZodSchema,
} from "@/zod/auth.validation";

const API_URL = process.env.API_URL;

interface StrapiAuthResponse {
  jwt: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    // NOTE: Strapi's /api/auth/local does NOT populate role by default.
    // Always fetch role separately via /api/users/me?populate=role.
  };
}

/** Fetch and validate the authenticated user's role from Strapi. */
async function fetchRoleName(jwt: string): Promise<UserRole | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseRole(data.role?.name);
  } catch {
    return null;
  }
}

interface ActionResult {
  success: boolean;
  message: string;
  redirectPath?: string;
}

function getLoginRedirectPath(
  role: UserRole | null,
  redirectPath?: string,
): string {
  if (!role) return "/dashboard/student";
  if (redirectPath && isValidRedirectForRole(redirectPath, role)) return redirectPath;
  return getDefaultDashboardRoute(role);
}

export const registerAction = async (
  payload: IRegisterPayload,
  redirectPath?: string,
): Promise<ActionResult> => {
  // 1. Validate input (server-side — never trust the client)
  const parsed = registerZodSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    // 2. Register via Strapi's built-in endpoint
    const data = await apiClient<StrapiAuthResponse>(
      "/api/auth/local/register",
      {
        method: "POST",
        body: {
          username: parsed.data.username,
          email: parsed.data.email,
          password: parsed.data.password,
        },
      },
    );

    // 3. Fetch real role (Strapi register endpoint doesn't populate role)
    const roleName = await fetchRoleName(data.jwt);

    // 4. Store tokens + role in httpOnly cookies
    await Promise.all([
      setTokenInCookies("accessToken", data.jwt),
      setTokenInCookies("refreshToken", data.refreshToken),
      ...(roleName ? [setCookie("userRole", roleName, 60 * 60 * 24)] : []),
    ]);

    return {
      success: true,
      message: "Registration successful",
      redirectPath: redirectPath ?? "/dashboard/student",
    };
  } catch (error) {
    // ApiError carries Strapi's own message; unknown errors get a safe fallback
    const message =
      error instanceof ApiError
        ? error.message
        : "Registration failed. Please try again.";

    console.error("[registerAction]", error);

    return { success: false, message };
  }
};

export const loginAction = async (
  payload: ILoginPayload,
  redirectPath?: string,
): Promise<ActionResult> => {
  // 1. Validate input
  const parsed = loginZodSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    // 2. Authenticate with Strapi
    const data = await apiClient<StrapiAuthResponse>("/api/auth/local", {
      method: "POST",
      body: {
        identifier: parsed.data.identifier,
        password: parsed.data.password,
      },
    });

    // 3. Fetch real role — Strapi's login endpoint doesn't populate role
    const roleName = await fetchRoleName(data.jwt);

    // 4. Store tokens + role in httpOnly cookies
    const ttl = parsed.data.rememberMe
      ? 60 * 60 * 24 * 30 // 30 days
      : 60 * 60 * 24; // 1 day

    await Promise.all([
      setTokenInCookies("accessToken", data.jwt, ttl),
      setTokenInCookies("refreshToken", data.refreshToken, ttl),
      ...(roleName ? [setCookie("userRole", roleName, ttl)] : []),
    ]);

    return {
      success: true,
      message: "Login successful",
      redirectPath: getLoginRedirectPath(roleName, redirectPath),
    };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Login failed. Please try again.";

    console.error("[loginAction]", error);

    return { success: false, message };
  }
};
