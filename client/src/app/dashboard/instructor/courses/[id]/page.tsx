import { redirect } from "next/navigation";

export default async function InstructorCourseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/instructor/courses/${id}/lessons`);
}
