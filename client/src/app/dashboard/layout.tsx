import { redirect } from "next/navigation";
import { getUserInfo } from "@/services/auth.service";
import { deleteCookie } from "@/lib/cookieUtils";
import DashboardSidebar from "./_components/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

async function logoutAction() {
  "use server";
  await deleteCookie("accessToken");
  await deleteCookie("refreshToken");
  await deleteCookie("userRole");
  redirect("/auth/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = await getUserInfo();

  if (!userInfo) {
    redirect("/auth/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <DashboardSidebar
          role={userInfo.role}
          userName={userInfo.name}
          avatar={userInfo.avatar}
          logoutAction={logoutAction}
        />
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
