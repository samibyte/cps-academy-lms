import type { Metadata } from "next";
import { requireAuth } from "../../../_lib/auth";
import { getInstructors } from "../../../_lib/api";
import DashboardShell from "../../../_components/DashboardShell";
import { CreateCourseForm } from "../../../_components/CreateCourseForm";

export const metadata: Metadata = {
  title: "New Course",
};

export default async function ContentManagerCreateCoursePage() {
  const { token } = await requireAuth(["Content Manager", "Admin"]);
  const instructors = await getInstructors(token);

  return (
    <DashboardShell
      title="নতুন কোর্স তৈরি করুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/content-manager" },
        { label: "কোর্সসমূহ", href: "/dashboard/content-manager/courses" },
        { label: "নতুন" },
      ]}
    >
      <CreateCourseForm
        canSelectInstructor
        instructors={instructors}
        redirectTo="/dashboard/content-manager/courses"
      />
    </DashboardShell>
  );
}