import { redirect } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { CourseTabsNav } from "@/app/dashboard/_components/CourseTabsNav";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getCourseWithLessons } from "@/app/dashboard/_lib/api";

export default async function InstructorCourseDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAuth(["Instructor", "Content Manager", "Admin"]);

  let course;
  try {
    const res = await getCourseWithLessons(id, token);
    course = res.data;
  } catch {
    redirect("/dashboard/instructor/courses");
  }

  return (
    <DashboardShell
      title={course.title}
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/instructor" },
        { label: "কোর্সসমূহ", href: "/dashboard/instructor/courses" },
        { label: course.title },
      ]}
    >
      <div className="space-y-6">
        <CourseTabsNav basePath={`/dashboard/instructor/courses/${id}`} />
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
