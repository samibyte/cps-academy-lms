import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import type { StrapiRole } from "@/services/auth.service";

export interface DefaultAuthMe {
  id: number;
  documentId: string;
  username: string;
  fullName: string | null;
  email: string;
  role: {
    name: StrapiRole;
  };
}

/**
 * Server-only helper used at the top of protected dashboard pages.
 * - Reads the `accessToken` cookie; redirects to `/auth/login` if missing.
 * - Fetches `/api/users/me?populate=role`; redirects to `/auth/login` on failure.
 * - Verifies the user's role against `allowedRoles`.
 * - Returns `{ token, me }` for use in the page.
 */
export async function requireAuth<T = DefaultAuthMe>(
  allowedRoles: StrapiRole[]
): Promise<{ token: string; me: T }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) redirect("/auth/login");

  try {
    const me = await apiClient<T & { role: { name: StrapiRole } }>("/api/users/me?populate=role", { token });
    
    if (!allowedRoles.includes(me.role.name)) {
      redirect("/dashboard");
    }

    return { token, me };
  } catch {
    redirect("/auth/login");
  }
}
