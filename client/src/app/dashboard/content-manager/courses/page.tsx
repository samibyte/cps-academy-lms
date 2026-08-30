import type { Metadata } from "next";
import { requireAuth } from "../../_lib/auth";
import { getAllCourses } from "../../_lib/api";
import DashboardShell from "../../_components/DashboardShell";
import { CourseListClient } from "../../_components/CourseListClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Content Manager Courses",
};

export default async function ContentManagerCoursesPage() {
  const { token } = await requireAuth(["Content Manager", "Admin"]);
  
  // Fetch ALL courses
  const coursesRes = await getAllCourses(token);
  const courses = coursesRes.data || [];

  return (
    <DashboardShell
      title="সব কোর্সসমূহ"
      description="প্ল্যাটফর্মের সকল কোর্স ম্যানেজ করুন"
      breadcrumbs={[{ label: "ওভারভিউ", href: "/dashboard/content-manager" }, { label: "কোর্সসমূহ" }]}
      headerAction={
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/content-manager/courses/new" />}
          className="gap-2 shadow-sm font-semibold"
        >
          <Plus className="size-4" />
          নতুন কোর্স তৈরি করুন
        </Button>
      }
    >
      <CourseListClient courses={courses} basePath="/dashboard/content-manager/courses" showOwner />
    </DashboardShell>
  );
}

