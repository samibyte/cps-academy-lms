"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CourseTabsNavProps {
  basePath: string; // e.g. "/dashboard/instructor/courses/[id]"
}

export function CourseTabsNav({ basePath }: CourseTabsNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "লেসনসমূহ (Lessons)", href: `${basePath}/lessons` },
    { label: "কুইজ (Quiz)", href: `${basePath}/quiz` },
    { label: "শিক্ষার্থী অগ্রগতি (Progress)", href: `${basePath}/progress` },
  ];

  return (
    <nav className="flex gap-4 border-b border-border/40 pb-px">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
