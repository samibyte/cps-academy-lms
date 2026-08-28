"use server";

import { apiClient, ApiError } from "@/lib/apiClient";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { setCookie } from "@/lib/cookieUtils";
import {
  getDefaultDashboardRoute,
  isValidRedirectForRole,
  UserRole,
} from "@/lib/authUtils";
import {
  ILoginPayload,
  IRegisterPayload,
  loginZodSchema,
  registerZodSchema,
} from "@/zod/auth.validation";

interface StrapiLoginResponse {
  jwt: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: {
      id: number;
      name: string;
      type: string;
    };
  };
}

interface StrapiRegisterResponse {
  jwt: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: {
      id: number;
      name: string;
      type: string;
    };
  };
}

interface ActionResult {
  success: boolean;
  message: string;
  redirectPath?: string;
}

function getLoginRedirectPath(
  roleName: string | undefined,
  redirectPath?: string,
) {
  const role = roleName as UserRole | undefined;
  if (!role) return "/dashboard/student";

  if (redirectPath && isValidRedirectForRole(redirectPath, role)) {
    return redirectPath;
  }

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
    const data = await apiClient<StrapiRegisterResponse>(
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

    // 3. Store tokens in httpOnly cookies
    await Promise.all([
      setTokenInCookies("accessToken", data.jwt),
      setTokenInCookies("refreshToken", data.refreshToken),
      setCookie("userRole", data.user.role?.name ?? "Student", 60 * 60 * 24),
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
    const data = await apiClient<StrapiLoginResponse>("/api/auth/local", {
      method: "POST",
      body: {
        identifier: parsed.data.identifier,
        password: parsed.data.password,
      },
    });

    // 3. Store tokens in httpOnly cookies
    // 3. Store tokens in httpOnly cookies (30-day TTL when "remember me" is on)
    const ttl = parsed.data.rememberMe
      ? 60 * 60 * 24 * 30 // 30 days
      : 60 * 60 * 24; // 1 day

    await Promise.all([
      setTokenInCookies("accessToken", data.jwt, ttl),
      setTokenInCookies("refreshToken", data.refreshToken, ttl),
      setCookie("userRole", data.user.role?.name ?? "", ttl),
    ]);

    return {
      success: true,
      message: "Login successful",
      redirectPath: getLoginRedirectPath(data.user.role?.name, redirectPath),
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
