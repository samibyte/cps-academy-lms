import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getAllCourses } from "@/app/dashboard/_lib/api";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { CourseListClient } from "@/app/dashboard/_components/CourseListClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const { token } = await requireAuth(["Admin"]);
  const coursesRes = await getAllCourses(token);
  const courses = coursesRes.data || [];

  return (
    <DashboardShell
      title="সব কোর্সসমূহ (Oversight).h"
      description="যেকোনো কোর্স সম্পূর্ণভাবে ম্যানেজ করুন"
      breadcrumbs={[{ label: "অ্যাডমিন", href: "/dashboard/admin" }, { label: "কোর্সসমূহ" }]}
      headerAction={
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/admin/courses/new" />}
          className="gap-2 shadow-sm font-semibold"
        >
          <Plus className="size-4" />
          নতুন কোর্স তৈরি করুন
        </Button>
      }
    >
      <CourseListClient
        courses={courses}
        basePath="/dashboard/admin/courses"
        showOwner
      />
    </DashboardShell>
  );
}

