import type { Metadata } from "next";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getCoursesByInstructor } from "@/app/dashboard/_lib/api";
import type { Course } from "@/app/dashboard/_lib/types";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { CourseTable } from "@/app/dashboard/_components/CourseTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
};

export default async function InstructorOverviewPage() {
  const { token, me } = await requireAuth(["Instructor"]);

  let courses: Course[] = [];
  try {
    const coursesRes = await getCoursesByInstructor(token, me.documentId);
    courses = coursesRes.data ?? [];
  } catch (err) {
    console.error("[instructor-overview] Failed to fetch courses", err);
  }

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => !!c.publishedAt).length;
  const draftCourses = totalCourses - publishedCourses;

  return (
    <DashboardShell
      title="ইনস্ট্রাক্টর ওভারভিউ"
      description="আপনার কোর্স ও কনটেন্টের সারসংক্ষেপ"
      breadcrumbs={[{ label: "ইনস্ট্রাক্টর" }]}
      headerAction={
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/instructor/courses/new" />}
          className="gap-2 shadow-sm font-semibold"
        >
          <Plus className="size-4" />
          নতুন কোর্স তৈরি করুন
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
        <StatCard label="খসড়া কোর্স" value={draftCourses} icon={BookOpen} />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          সাম্প্রতিক কোর্সসমূহ
        </h2>
        <CourseTable
          courses={courses.slice(0, 10)}
          basePath="/dashboard/instructor/courses"
        />
      </div>
    </DashboardShell>
  );
}
