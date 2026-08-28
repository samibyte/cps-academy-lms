import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardShellProps {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  className?: string;
}

export default function DashboardShell({
  title,
  description,
  headerAction,
  breadcrumbs,
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn("flex-1 flex flex-col h-full min-h-0 bg-background", className)}>
      {/* Page Header */}
      <header className="shrink-0 border-b border-border/40 bg-card/20 backdrop-blur-sm">
        <div className="px-6 py-5 flex items-start gap-4">
          <SidebarTrigger className="-ml-2 mt-1" />
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="size-3 opacity-50" />}
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-foreground transition-colors font-medium">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-foreground font-semibold">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            {headerAction && (
              <div className="shrink-0">{headerAction}</div>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className={cn("mx-auto max-w-7xl w-full h-full flex flex-col gap-6 p-6")}>
          {children}
        </div>
      </main>
    </div>
  );
}