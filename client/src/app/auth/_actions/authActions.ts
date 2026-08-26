"use server";

import { apiClient, ApiError } from "@/lib/apiClient";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { IRegisterPayload, registerZodSchema } from "@/zod/auth.validation";

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
