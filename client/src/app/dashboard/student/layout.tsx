import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

interface Me {
  role: { name: string };
}

/**
 * Student sub-layout — only enforces role-level access control.
 * The shared `dashboard/layout.tsx` already provides the sidebar + UI shell.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) redirect("/auth/login");

  let isStudent = false;
  try {
    const me = await apiClient<Me>("/api/users/me?populate=role", { token });
    isStudent = me.role.name === "Student";
  } catch {
    redirect("/auth/login");
  }

  if (!isStudent) {
    redirect("/dashboard?error=forbidden");
  }

  return <>{children}</>;
}
