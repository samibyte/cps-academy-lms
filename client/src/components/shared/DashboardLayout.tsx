"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface DashboardUser {
  username: string;
  fullName: string | null;
  email: string;
  role: string;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  user: DashboardUser;
  brandLabel?: string;
  brandHref?: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

// ─── Sidebar nav link ────────────────────────────────────────────────────────

function SideNavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {item.label}
    </Link>
  );
}

// ─── Sidebar (shared between desktop & mobile) ────────────────────────────────

function SidebarContent({
  navItems,
  user,
  brandLabel,
  brandHref,
  logoutAction,
  onNavClick,
}: Omit<DashboardLayoutProps, "children"> & { onNavClick?: () => void }) {
  const initials = (user.fullName ?? user.username)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Link
          href={brandHref ?? "#"}
          className="flex items-center gap-2 font-bold text-foreground"
          onClick={onNavClick}
        >
          <LayoutDashboardIcon className="h-5 w-5 text-primary" />
          <span className="truncate">{brandLabel ?? "Dashboard"}</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <SideNavLink key={item.href} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border/60 p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.fullName ?? user.username}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOutIcon className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function DashboardLayout({
  navItems,
  user,
  brandLabel,
  brandHref,
  logoutAction,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sharedProps = {
    navItems,
    user,
    brandLabel,
    brandHref,
    logoutAction,
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/50 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent {...sharedProps} />
        </div>
      </aside>

      {/* ── Mobile: overlay + drawer ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border/60 bg-card shadow-xl transition-transform duration-200 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="Close sidebar"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <SidebarContent
          {...sharedProps}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-card/50 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Open sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="truncate font-semibold text-foreground">
            {brandLabel ?? "Dashboard"}
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
