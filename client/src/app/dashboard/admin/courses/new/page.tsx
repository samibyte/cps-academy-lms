import { requireAuth } from "../../../_lib/auth";
import { getInstructors } from "../../../_lib/api";
import DashboardShell from "../../../_components/DashboardShell";
import { CreateCourseForm } from "../../../_components/CreateCourseForm";

export default async function AdminCreateCoursePage() {
  const { token } = await requireAuth(["Admin"]);
  const instructors = await getInstructors(token);

  return (
    <DashboardShell
      title="নতুন কোর্স তৈরি করুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/admin" },
        { label: "কোর্সসমূহ", href: "/dashboard/admin/courses" },
        { label: "নতুন" },
      ]}
    >
      <CreateCourseForm
        canSelectInstructor
        instructors={instructors}
        redirectTo="/dashboard/admin/courses"
      />
    </DashboardShell>
  );
}