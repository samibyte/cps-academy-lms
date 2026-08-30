import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getStudentProgressForCourse, getCourseWithLessons } from "@/app/dashboard/_lib/api";
import { StudentProgressTable } from "@/app/dashboard/_components/StudentProgressTable";

export default async function CMCourseProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await requireAuth(["Content Manager", "Admin"]);
  const [{ enrollments, progress }, courseRes] = await Promise.all([
    getStudentProgressForCourse(id, token),
    getCourseWithLessons(id, token),
  ]);
  const totalLessons = courseRes.data.lessons?.length || 0;
  return <StudentProgressTable enrollments={enrollments} progress={progress} totalLessons={totalLessons} />;
}
