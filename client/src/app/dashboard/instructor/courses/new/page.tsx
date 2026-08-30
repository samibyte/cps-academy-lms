import { requireAuth } from "../../../_lib/auth";
import DashboardShell from "../../../_components/DashboardShell";
import { CreateCourseForm } from "../../../_components/CreateCourseForm";

export default async function InstructorCreateCoursePage() {
  await requireAuth(["Instructor"]);

  return (
    <DashboardShell
      title="নতুন কোর্স তৈরি করুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/instructor" },
        { label: "কোর্সসমূহ", href: "/dashboard/instructor/courses" },
        { label: "নতুন" },
      ]}
    >
      <CreateCourseForm
        canSelectInstructor={false}
        instructors={[]}
        redirectTo="/dashboard/instructor/courses"
      />
    </DashboardShell>
  );
}