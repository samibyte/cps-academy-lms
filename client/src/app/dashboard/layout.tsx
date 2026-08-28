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
  console.log("userinfo", userInfo)

  if (!userInfo) {
    redirect("/auth/login");
  }

  return (
    <SidebarProvider>
      <div className="flex bg-background h-screen w-screen overflow-hidden">
        <DashboardSidebar
          role={userInfo.role}
          userName={userInfo.name}
          avatar={userInfo.avatar}
          logoutAction={logoutAction}
        />
        <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}