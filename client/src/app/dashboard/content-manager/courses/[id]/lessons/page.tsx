import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getLessonsForCourse } from "@/app/dashboard/_lib/api";
import { LessonManager } from "@/app/dashboard/_components/LessonManager";

export default async function CMCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await requireAuth(["Content Manager", "Admin"]);
  const res = await getLessonsForCourse(id, token);
  return <LessonManager courseId={id} lessons={res.data || []} token={token} />;
}
