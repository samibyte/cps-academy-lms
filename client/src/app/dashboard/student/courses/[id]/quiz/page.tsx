import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import QuizForm from "./_components/QuizForm";
import { getCourseWithLessons, getLessonProgresses, getMyQuizAttempts, getQuizForCourse } from "../../../_lib/api";
import { requireStudentAuth } from "../../../_lib/auth";

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id: courseId } = await params;
  const { token, me } = await requireStudentAuth();

  const courseRes = await getCourseWithLessons(courseId, token);
  const course = courseRes.data;
  if (!course) redirect("/dashboard/student/my-courses");

  const progressRes = await getLessonProgresses(courseId, token);
  const progressList = progressRes.data;

  const completedLessonDocIds = new Set(
    progressList.filter((p) => p.completed).map((p) => p.lesson?.documentId),
  );

  const lessons = course.lessons ?? [];
  const allLessonsCompleted =
    lessons.length > 0 &&
    lessons.every((lesson) => completedLessonDocIds.has(lesson.documentId));

  if (!allLessonsCompleted) {
    redirect(`/dashboard/student/courses/${courseId}`);
  }

  const quiz = await getQuizForCourse(courseId, token);
  if (!quiz) redirect(`/dashboard/student/courses/${courseId}`);

  const attemptsRes = await getMyQuizAttempts(quiz.documentId, token);
  const attempts = attemptsRes.data;

  return (
    <div className="relative p-6 sm:p-8 min-h-screen bg-grid-cyber">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full space-y-8">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        nativeButton={false}
        render={
          <Link href={`/dashboard/student/courses/${courseId}`}>
            <ChevronLeft className="size-3.5" />
            কোর্সে ফিরে যাও
          </Link>
        }
      />

      <PageHeader
        title={`${course.title} — কুইজ.exe`}
        description={quiz.description ?? quiz.title}
      />

      <QuizForm
        courseId={courseId}
        quiz={quiz}
        studentDocId={me.documentId}
        attempts={attempts}
      />
      </div>
    </div>
  );
}
