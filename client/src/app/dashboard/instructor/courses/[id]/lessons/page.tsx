import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getLessonsForCourse } from "@/app/dashboard/_lib/api";
import { LessonManager } from "@/app/dashboard/_components/LessonManager";

export default async function InstructorCourseLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAuth(["Instructor", "Content Manager", "Admin"]);

  const res = await getLessonsForCourse(id, token);
  const lessons = res.data || [];

  return <LessonManager courseId={id} lessons={lessons} token={token} />;
}
