"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ChevronRight,
  User,
  Users,
  FileText,
  PlusCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Logo from "@/components/shared/ui/logo";
import type { StrapiRole } from "@/services/auth.service";

// Types

interface DashboardSidebarProps {
  role: StrapiRole;
  userName: string;
  avatar?: string | null;
  logoutAction: () => Promise<void>;
}

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Role-based nav configs

const STUDENT_LINKS: NavLink[] = [
  { href: "/dashboard/student", label: "ওভারভিউ", icon: LayoutDashboard },
  {
    href: "/dashboard/student/my-courses",
    label: "আমার কোর্সসমূহ",
    icon: BookOpen,
  },
];

const INSTRUCTOR_LINKS: NavLink[] = [
  { href: "/dashboard/instructor", label: "ওভারভিউ", icon: LayoutDashboard },
  {
    href: "/dashboard/instructor/courses",
    label: "আমার কোর্সসমূহ",
    icon: BookOpen,
  },
  {
    href: "/dashboard/instructor/courses/new",
    label: "কোর্স তৈরি",
    icon: PlusCircle,
  },
];

const CONTENT_MANAGER_LINKS: NavLink[] = [
  {
    href: "/dashboard/content-manager",
    label: "ওভারভিউ",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/content-manager/courses",
    label: "সব কোর্সসমূহ",
    icon: BookOpen,
  },
  { href: "/dashboard/content-manager/blog", label: "ব্লগ", icon: FileText },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/dashboard/admin", label: "ওভারভিউ", icon: LayoutDashboard },
  { href: "/dashboard/admin/courses", label: "সব কোর্সসমূহ", icon: BookOpen },
  { href: "/dashboard/admin/users", label: "ব্যবহারকারী", icon: Users },
  { href: "/dashboard/admin/blog", label: "ব্লগ", icon: FileText },
];

function getNavLinks(role: StrapiRole): NavLink[] {
  switch (role) {
    case "Student":
      return STUDENT_LINKS;
    case "Instructor":
      return INSTRUCTOR_LINKS;
    case "Content Manager":
      return CONTENT_MANAGER_LINKS;
    case "Admin":
      return ADMIN_LINKS;
    default:
      return [];
  }
}

/** Prefix of the role's root dashboard path — used for active-link heuristics */
function getRoleRootPath(role: StrapiRole): string {
  switch (role) {
    case "Student":
      return "/dashboard/student";
    case "Instructor":
      return "/dashboard/instructor";
    case "Content Manager":
      return "/dashboard/content-manager";
    case "Admin":
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}

// Role badge label + icon

function RoleTag({ role }: { role: StrapiRole }) {
  const isAdmin = role === "Admin";
  const getRoleLabel = (r: StrapiRole) => {
    switch (r) {
      case "Student":
        return "শিক্ষার্থী";
      case "Instructor":
        return "ইনস্ট্রাক্টর";
      case "Content Manager":
        return "কন্টেন্ট ম্যানেজার";
      case "Admin":
        return "অ্যাডমিন";
      default:
        return r;
    }
  };

  return (
    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary">
      {isAdmin && <ShieldCheck className="size-3" />}
      {getRoleLabel(role)}
    </span>
  );
}

//Main component

export default function DashboardSidebar({
  role,
  userName,
  avatar,
  logoutAction,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const links = getNavLinks(role);
  const roleRoot = getRoleRootPath(role);
  const exactActiveHref = links.find((link) => link.href === pathname)?.href;

  return (
    <Sidebar className="border-r border-border/40 bg-card/60 backdrop-blur-xl">
      {/* Header — Logo */}
      <SidebarHeader className="flex h-16 shrink-0 flex-row items-center px-4 border-b border-border/40">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Logo />
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-4">
        {/* Main Links */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            মেনু
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {links.map((link) => {
                const isExact = pathname === link.href;
                // Only use prefix matching for non-root links to avoid
                // the root overview always being active
                const isPrefix =
                  link.href !== roleRoot &&
                  pathname.startsWith(link.href + "/");
                const isActive = isExact || (!exactActiveHref && isPrefix);

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={link.href} />}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 h-10",
                        isActive
                          ? "bg-primary text-primary-foreground data-active:bg-primary data-active:text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                          : "text-muted-foreground  hover:shadow-sm hover:shadow-primary/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon
                          className={cn(
                            "size-4",
                            isActive
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="font-medium">{link.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="size-3.5 opacity-60" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Links */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            অ্যাকাউন্ট
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Profile link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard/profile" />}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground h-10"
                >
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="font-medium">আমার প্রোফাইল</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Logout — calls server action via form */}
              <SidebarMenuItem>
                <form action={logoutAction} className="w-full">
                  <SidebarMenuButton
                    type="submit"
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500 h-10 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="size-4 text-muted-foreground group-hover:text-rose-500" />
                      <span className="font-medium">বিদায় নিন (লগআউট)</span>
                    </div>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — User Profile Card */}
      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 bg-muted/40 border border-border/30">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 overflow-hidden">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={userName}
                className="size-full rounded-lg object-cover"
              />
            ) : (
              <span className="font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">
              {userName}
            </span>
            <RoleTag role={role} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
