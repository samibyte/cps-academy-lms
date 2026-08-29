import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export interface StudentMe {
  id: number;
  documentId: string;
  username: string;
  fullName: string | null;
  email: string;
}

/**
 * Server-only helper used at the top of every student dashboard page.
 * - Reads the `accessToken` cookie; redirects to `/auth/login` if missing.
 * - Fetches `/api/users/me`; redirects to `/auth/login` on failure.
 * - Returns `{ token, me }` for use in the page.
 *
 * This eliminates the repeated boilerplate that was copy-pasted across all
 * 5 student dashboard pages.
 */
export async function requireStudentAuth(): Promise<{ token: string; me: StudentMe }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) redirect("/auth/login");

  try {
    const me = await apiClient<StudentMe>("/api/users/me", { token });
    return { token, me };
  } catch {
    redirect("/auth/login");
  }
}
