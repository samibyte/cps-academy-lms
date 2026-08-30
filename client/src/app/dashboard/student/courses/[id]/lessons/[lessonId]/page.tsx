import { redirect } from "next/navigation";
import { getCourseWithLessons, getLesson, getLessonProgresses, touchEnrollmentLastAccessed } from "../../../../_lib/api";
import { requireStudentAuth } from "../../../../_lib/auth";
import LessonClientView from "./_components/LessonClientView";

interface LessonPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id: courseId, lessonId } = await params;
  const { token, me } = await requireStudentAuth();

  // Update lastAccessedAt in background (non-blocking)
  touchEnrollmentLastAccessed(courseId, me.documentId, token).catch(() => {});

  // Fetch the target lesson details
  const lessonRes = await getLesson(lessonId, token);
  const lesson = lessonRes.data;
  if (!lesson) {
    redirect(`/dashboard/student/courses/${courseId}`);
  }

  // Fetch course detail to verify lesson list order
  const courseRes = await getCourseWithLessons(courseId, token);
  const course = courseRes.data;
  if (!course) {
    redirect("/dashboard/student/my-courses");
  }

  // Fetch student progress for this course
  const progressRes = await getLessonProgresses(courseId, token, me.documentId);
  const progressList = progressRes.data;

  const completedLessonDocIds = new Set(
    progressList.filter((p) => p.completed).map((p) => p.lesson?.documentId),
  );

  const lessons = course.lessons ?? [];
  const currentIdx = lessons.findIndex((l) => l.documentId === lessonId);

  // If lesson is not in course list, redirect
  if (currentIdx === -1) {
    redirect(`/dashboard/student/courses/${courseId}`);
  }

  // Keep lessons locked until the previous lesson is marked complete.
  // Validate on the server so students can't bypass lock by entering URLs directly
  if (currentIdx > 0) {
    const prevLesson = lessons[currentIdx - 1];
    const isPrevCompleted = completedLessonDocIds.has(prevLesson.documentId);
    if (!isPrevCompleted) {
      // Locked! Redirect back to course page
      redirect(`/dashboard/student/courses/${courseId}`);
    }
  }

  const prevLessonDocId = currentIdx > 0 ? lessons[currentIdx - 1].documentId : null;
  const nextLessonDocId =
    currentIdx < lessons.length - 1 ? lessons[currentIdx + 1].documentId : null;

  const initialCompleted = completedLessonDocIds.has(lessonId);

  // For navigating next, is it locked right now?
  // Next lesson is locked if the current lesson is not completed.
  const isNextLocked = nextLessonDocId ? !initialCompleted : false;

  return (
    <LessonClientView
      courseId={courseId}
      lesson={lesson}
      studentDocId={me.documentId}
      initialCompleted={initialCompleted}
      prevLessonDocId={prevLessonDocId}
      nextLessonDocId={nextLessonDocId}
      isNextLocked={isNextLocked}
    />
  );
}
