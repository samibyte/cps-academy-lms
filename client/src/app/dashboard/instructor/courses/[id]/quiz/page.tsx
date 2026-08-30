import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getQuizForCourseAdmin, getCourseWithLessons } from "@/app/dashboard/_lib/api";
import { QuizManager } from "@/app/dashboard/_components/QuizManager";

export default async function InstructorCourseQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token } = await requireAuth(["Instructor", "Content Manager", "Admin"]);

  const [quiz, courseRes] = await Promise.all([
    getQuizForCourseAdmin(id, token),
    getCourseWithLessons(id, token),
  ]);

  return <QuizManager courseId={id} courseTitle={courseRes.data.title} quiz={quiz} token={token} />;
}
