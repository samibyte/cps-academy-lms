import { requireAuth } from "../../_lib/auth";
import { getCoursesByInstructor } from "../../_lib/api";
import DashboardShell from "../../_components/DashboardShell";
import { CourseListClient } from "../../_components/CourseListClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function InstructorCoursesPage() {
  const { token, me } = await requireAuth(["Instructor"]);

  // Fetch courses with me.documentId
  const coursesRes = await getCoursesByInstructor(token, me.documentId);
  const courses = coursesRes.data || [];

  return (
    <DashboardShell
      title="আমার কোর্সসমূহ.h"
      description="আপনার তৈরি করা সব কোর্স ম্যানেজ করুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/instructor" },
        { label: "কোর্সসমূহ" },
      ]}
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
      <CourseListClient courses={courses} basePath="/dashboard/instructor/courses" />
    </DashboardShell>
  );
}

