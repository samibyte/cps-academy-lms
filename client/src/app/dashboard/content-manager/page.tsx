import type { Metadata } from "next";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getAllCourses } from "@/app/dashboard/_lib/api";
import type { Course } from "@/app/dashboard/_lib/types";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { CourseTable } from "@/app/dashboard/_components/CourseTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Content Manager Dashboard",
};

export default async function ContentManagerOverviewPage() {
  const { token } = await requireAuth(["Content Manager", "Admin"]);

  let courses: Course[] = [];
  try {
    const coursesRes = await getAllCourses(token);
    courses = coursesRes.data ?? [];
  } catch (err) {
    console.error("[cm-overview] Failed to fetch courses", err);
  }

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => !!c.publishedAt).length;
  const draftCourses = totalCourses - publishedCourses;

  return (
    <DashboardShell
      title="কন্টেন্ট ম্যানেজার ওভারভিউ"
      description="প্ল্যাটফর্মের কনটেন্টের সারসংক্ষেপ"
      breadcrumbs={[{ label: "কন্টেন্ট ম্যানেজার" }]}
      headerAction={
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/content-manager/courses" />}
          className="gap-2 shadow-sm font-semibold"
        >
          <BookOpen className="size-4" />
          সব কোর্স
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="মোট কোর্স" value={totalCourses} icon={BookOpen} />
        <StatCard
          label="প্রকাশিত কোর্স"
          value={publishedCourses}
          icon={BookOpen}
        />
        <StatCard label="খসড়া কোর্স" value={draftCourses} icon={FileText} />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          সাম্প্রতিক কোর্সসমূহ
        </h2>
        <CourseTable
          courses={courses.slice(0, 10)}
          basePath="/dashboard/content-manager/courses"
          showOwner
        />
      </div>
    </DashboardShell>
  );
}
