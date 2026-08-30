import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { CourseTabsNav } from "@/app/dashboard/_components/CourseTabsNav";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getCourseWithLessons } from "@/app/dashboard/_lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { token } = await requireAuth(["Admin"]);

  try {
    const res = await getCourseWithLessons(id, token);
    return { title: res.data.title };
  } catch {
    return { title: "Course" };
  }
}

export default async function AdminCourseDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAuth(["Admin"]);

  let course;
  try {
    const res = await getCourseWithLessons(id, token);
    course = res.data;
  } catch {
    redirect("/dashboard/admin/courses");
  }

  return (
    <DashboardShell
      title={course.title}
      breadcrumbs={[
        { label: "অ্যাডমিন", href: "/dashboard/admin" },
        { label: "কোর্সসমূহ", href: "/dashboard/admin/courses" },
        { label: course.title },
      ]}
    >
      <div className="space-y-6">
        <CourseTabsNav basePath={`/dashboard/admin/courses/${id}`} />
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
